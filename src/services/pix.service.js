const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const PixQrs = require("../models/pix_qr.model");
const { generatePixPayload } = require("../utils/pix_qr.utils");
const Accounts = require("../models/account.model");
const Users = require("../models/user.model");
const PixKeys = require("../models/pix_keys.model");
const sequelize = require("../config/database");
const Transfers = require("../models/transfer.model");
const { message } = require("statuses");

class PixService {
  async createPixKey(accountId, keyType, keyValue, userId) {
    const account = await Accounts.findByPk(accountId);
    if (!account) {
      throw new Error("Conta não encontrada");
    }
    if (account.userId !== userId) {
      throw new Error("Acesso negado a esta conta");
    }

    const validKeyTypes = ['CPF', 'Email', 'Telefone', 'Aleatoria'];
    if (!validKeyTypes.includes(keyType)) {
      throw new Error("Tipo de chave PIX inválido. Tipos permitidos: CPF, Email, Telefone, Aleatoria.");
    }

    if (keyType === 'Aleatoria') {
      keyValue = uuidv4();
    }

    const existingKey = await PixKeys.findOne({
      where: { accountId, keyType }
    });
    if (existingKey) {
      throw new Error(`A conta já possui uma chave do tipo ${keyType}.`);
    }

    const existingValue = await PixKeys.findOne({
      where: { keyValue }
    });
    if (existingValue) {
      throw new Error("Esta chave PIX já está cadastrada em outra conta.");
    }
   await PixKeys.create({
      accountId,
      keyType,
      keyValue,
    });
    return {success: true, message: "Chave PIX criada com sucesso"};
  }

  async deletePixKey(keyType, keyValue) {
    const pixKeys = await PixKeys.findAll({
      where: { keyType: String(keyType), keyValue: String(keyValue) },
    });

    if (!pixKeys) {
      throw new Error("Chave PIX não encontrada.");
    }

    const qrCode = await PixQrs.findOne({
      where: { pixKey: keyValue },
    });

    if (!pixKeys || pixKeys.length === 0) {
      throw new Error("Nenhuma chave PIX encontrada para este tipo.");
    }

    if (qrCode) {
      throw new Error("Esta chave está vinculada a um QR Code ativo e não pode ser excluída.");
    }

    await PixKeys.destroy({
      where: { keyType: String(keyType), keyValue: String(keyValue) },
    });

    return {succes: true, message: "Chave(s) PIX deletada(s) com sucesso." };
  }

  async getPixKeysByAccountId(accountId) {
    const pixKeys = await PixKeys.findAll({
      where: { accountId: String(accountId) },
      raw: false,
    });

    if (!pixKeys || pixKeys.length === 0) {
      throw new Error("Nenhuma chave PIX encontrada para esta conta.");
    }

    return pixKeys;
  }


  async transferPix(fromAccountId, toPixKeyValue, amount, transferPassword, userId) {
    const transaction = await sequelize.transaction();
    try {
      const fromAccount = await Accounts.findByPk(fromAccountId, { transaction });
      if (!fromAccount) throw new Error("Conta de origem não encontrada.");
      if (fromAccount.userId !== userId) throw new Error("Acesso negado à conta de origem.");

      if (!fromAccount.transferPassword) {
        const error = new Error("Senha de transferência não definida. Por favor, defina-a antes de transferir.");
        error.code = "P404";
        throw error;
      }

      const isMatch = await bcrypt.compare(transferPassword, fromAccount.transferPassword);
      if (!isMatch) {
        const error = new Error("Senha de transferência incorreta.");
        error.code = "P401";
        throw error;
      }

      if (amount <= 0) throw new Error("O valor deve ser maior que zero.");
      if (fromAccount.balance < amount) throw new Error("Saldo insuficiente.");

      const toPixKey = await PixKeys.findOne({ where: { keyValue: toPixKeyValue }, include: [Accounts], transaction });
      if (!toPixKey) throw new Error("Chave PIX de destino não encontrada.");

      const toAccount = toPixKey.Account;
      if (!toAccount) throw new Error("Conta de destino associada à chave PIX não encontrada.");
      if (fromAccount.id === toAccount.id) throw new Error("Não é possível transferir para a própria conta via PIX.");

      fromAccount.balance = parseFloat((fromAccount.balance - amount).toFixed(2));
      toAccount.balance = parseFloat((toAccount.balance + amount).toFixed(2));

      await fromAccount.save({ transaction });
      await toAccount.save({ transaction });

      const toUser = await Users.findByPk(toAccount.userId);

      await Transfers.create({
        accountId: fromAccount.id,
        toAccountName: toUser?.name || "Destinatário PIX",
        date: new Date(),
        amount,
        category: "PIX",
        type: "DEBIT",
      }, { transaction });

      await Transfers.create({
        accountId: toAccount.id,
        toAccountName: fromAccount.name || "Remetente PIX",
        date: new Date(),
        amount,
        category: "PIX",
        type: "CREDIT",
      }, { transaction });

      await transaction.commit();

      return { success: true, message: "Transferência PIX realizada com sucesso", fromAccount, toAccount };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }


  async createPixQr(accountId, amount, userId, expiresInMinutes) {
    const account = await Accounts.findByPk(accountId);
    const user = await Users.findByPk(userId);
    if (!account) throw new Error("Conta não encontrada.");
    if (!user) throw new Error("Usuario não encontrado.");
    if (account.userId !== userId) throw new Error("Acesso negado a esta conta.");

    const pixKeys = await PixKeys.findAll({ where: { accountId } });
    if (!pixKeys || pixKeys.length === 0) {
      throw new Error("Nenhuma chave Pix cadastrada para esta conta.");
    }

    const validKeys = pixKeys.filter(k => k.keyType !== "Aleatoria");
    if (validKeys.length === 0) {
      throw new Error("Nenhuma chave válida encontrada (CPF, Email ou Telefone).");
    }

    const chosenKey = validKeys[0];

    const txid = uuidv4();
    const payload = generatePixPayload({
      pixKey: chosenKey.keyValue,
      merchantName: user.name || "RECEBEDOR",
      merchantCity: account.city || "SAOPAULO",
      amount,
      txid,
    });

    const expiresAt = new Date(Date.now() + expiresInMinutes * 60000);

    await PixQrs.create({
      accountId,
      pixKey: chosenKey.keyValue,
      amount,
      txid,
      payload,
      expiresAt,
      status: "pending",
      name: user.name
    });

    return {succes: true, message:"Qr Code PIX criado com sucesso"};
  }

  async deleteQrCode(txid) {
    const pixQr = await PixQrs.findAll({
      where: { txid: String(txid) },
    });

    if (!pixQr || pixQr.length === 0) {
      throw new Error("Nenhum QR Code encontrado.");
    }

    await PixQrs.destroy({
      where: { txid: String(txid) },
    });

    return { success: true, message: "QR Code deletado com sucesso." };
  }

  async getQrCode(payload) {
    const pixQr = await PixQrs.findAll({
      where: { payload: String(payload) },
    });

    if (!pixQr || pixQr.length === 0) {
      throw new Error("Nenhum QR Code encontrado.");
    }

    return pixQr;
  }


  async transferQrCode(fromAccountId, toPayloadValue, amount, transferPassword, userId) {
    const transaction = await sequelize.transaction();
    try {
      const fromAccount = await Accounts.findByPk(fromAccountId, { transaction });
      if (!fromAccount) throw new Error("Conta de origem não encontrada.");
      if (fromAccount.userId !== userId) throw new Error("Acesso negado à conta de origem.");

      if (!fromAccount.transferPassword) {
        const error = new Error("Senha de transferência não definida. Por favor, defina-a antes de transferir.");
        error.code = "P404";
        throw error;
      }

      const isMatch = await bcrypt.compare(transferPassword, fromAccount.transferPassword);
      if (!isMatch) {
        const error = new Error("Senha de transferência incorreta.");
        error.code = "P401";
        throw error;
      }

      if (amount <= 0) throw new Error("O valor deve ser maior que zero.");
      if (fromAccount.balance < amount) throw new Error("Saldo insuficiente.");

      const toPayload = await PixQrs.findOne({ where: { payload: toPayloadValue }, include: [Accounts], transaction });
      if (!toPayload) throw new Error("QR Code PIX de destino não encontrado.");

      const toAccount = toPayload.Account;
      if (!toAccount) throw new Error("Conta de destino associada ao QR Code não encontrada.");
      if (fromAccount.id === toAccount.id) throw new Error("Não é possível transferir para a própria conta via PIX.");

      fromAccount.balance = parseFloat((fromAccount.balance - amount).toFixed(2));
      toAccount.balance = parseFloat((toAccount.balance + amount).toFixed(2));

      await fromAccount.save({ transaction });
      await toAccount.save({ transaction });

      const toUser = await Users.findByPk(toAccount.userId);

      await Transfers.create({
        accountId: fromAccount.id,
        toAccountName: toUser?.name || "Destinatário QR",
        date: new Date(),
        amount,
        category: "QR Code PIX",
        type: "DEBIT",
      }, { transaction });

      await Transfers.create({
        accountId: toAccount.id,
        toAccountName: fromAccount.name || "Remetente QR",
        date: new Date(),
        amount,
        category: "Transferência QR Code",
        type: "CREDIT",
      }, { transaction });

      await transaction.commit();

      return { success: true, message: "Transferência via QR Code realizada com sucesso", fromAccount, toAccount };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }


}

module.exports = new PixService();