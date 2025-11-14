const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const PixQrs = require("../models/pix_qr.model");
const { generatePixPayload } = require("../utils/pix_qr.utils");
const Accounts = require("../models/account.model");
const Users = require("../models/user.model");
const PixKeys = require("../models/pix_keys.model");
const sequelize = require("../config/database");
const Transfers = require("../models/transfer.model");

class PixService {
  async createPixKey(accountId, keyType, keyValue, userId) {
    const account = await Accounts.findByPk(accountId);
    if (!account) return { success: false, message: "Conta não encontrada." };
    if (account.userId !== userId) return { success: false, message: "Acesso negado a esta conta." };

    const validKeyTypes = ["CPF", "Email", "Telefone", "Aleatoria"];
    if (!validKeyTypes.includes(keyType)) {
      return { success: false, message: "Tipo de chave PIX inválido. Tipos permitidos: CPF, Email, Telefone, Aleatoria." };
    }

    if (keyType === "Aleatoria") {
      keyValue = uuidv4();
    }

    const existingKey = await PixKeys.findOne({ where: { accountId, keyType } });
    if (existingKey) {
      return { success: false, message: `A conta já possui uma chave do tipo ${keyType}.` };
    }

    const existingValue = await PixKeys.findOne({ where: { keyValue } });
    if (existingValue) {
      return { success: false, message: "Esta chave PIX já está cadastrada em outra conta." };
    }

    await PixKeys.create({ accountId, keyType, keyValue });
    return { success: true, message: "Chave PIX criada com sucesso." };
  }

  async deletePixKey(keyType, keyValue) {
    const pixKeys = await PixKeys.findOne({ where: { keyType: String(keyType), keyValue: String(keyValue) } });
    if (!pixKeys) {
      return { success: false, message: "Chave PIX não encontrada." };
    }

    const qrCode = await PixQrs.findOne({ where: { pixKey: keyValue } });
    if (qrCode) {
      return { success: false, message: "Esta chave está vinculada a um QR Code ativo e não pode ser excluída." };
    }

    await PixKeys.destroy({ where: { keyType: String(keyType), keyValue: String(keyValue) } });
    return { success: true, message: "Chave PIX deletada com sucesso." };
  }

  async getPixKeysByAccountId(accountId) {
    const pixKeys = await PixKeys.findAll({ where: { accountId: String(accountId) }, raw: false });
    if (!pixKeys || pixKeys.length === 0) {
      return { success: false, message: "Nenhuma chave PIX encontrada para esta conta." };
    }
    return { success: true, message: "Chave PIX recuperada com sucesso.", pixKeys };
  }

  async transferPix(fromAccountId, toPixKeyValue, amount, userId) {
    const transaction = await sequelize.transaction();
    try {
      const fromAccount = await Accounts.findByPk(fromAccountId, { transaction });
      if (!fromAccount) {
        await transaction.rollback();
        return { success: false, message: "Conta de origem não encontrada." };
      }
      if (fromAccount.userId !== userId) {
        await transaction.rollback();
        return { success: false, message: "Acesso negado à conta de origem." };
      }

      if (amount <= 0) {
        await transaction.rollback();
        return { success: false, message: "O valor deve ser maior que zero." };
      }
      if (fromAccount.balance < amount) {
        await transaction.rollback();
        return { success: false, message: "Saldo insuficiente." };
      }

      const toPixKey = await PixKeys.findOne({ where: { keyValue: toPixKeyValue }, include: [Accounts], transaction });
      if (!toPixKey) {
        await transaction.rollback();
        return { success: false, message: "Chave PIX de destino não encontrada." };
      }

      const toAccount = toPixKey.Account;
      if (!toAccount) {
        await transaction.rollback();
        return { success: false, message: "Conta de destino associada à chave PIX não encontrada." };
      }
      if (fromAccount.id === toAccount.id) {
        await transaction.rollback();
        return { success: false, message: "Não é possível transferir para a própria conta via PIX." };
      }

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
      return { success: true, message: "Transferência PIX realizada com sucesso.", fromAccount, toAccount };
    } catch (error) {
      await transaction.rollback();
      return { success: false, message: error.message };
    }
  }

  async createPixQr(accountId, amount, userId, expiresInMinutes) {
    const account = await Accounts.findByPk(accountId);
    const user = await Users.findByPk(userId);

    if (!account) return { success: false, message: "Conta não encontrada." };
    if (!user) return { success: false, message: "Usuário não encontrado." };
    if (account.userId !== userId) return { success: false, message: "Acesso negado a esta conta." };

    const pixKeys = await PixKeys.findAll({ where: { accountId } });
    if (!pixKeys || pixKeys.length === 0) {
      return { success: false, message: "Nenhuma chave PIX cadastrada para esta conta." };
    }

    const validKeys = pixKeys.filter(k => k.keyType !== "Aleatoria");
    if (validKeys.length === 0) {
      return { success: false, message: "Nenhuma chave válida encontrada (CPF, Email ou Telefone)." };
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

    const qrCode = await PixQrs.create({
      accountId,
      pixKey: chosenKey.keyValue,
      amount,
      txid,
      payload,
      expiresAt,
      status: "pending",
      name: user.name,
    });

    return { success: true, message: "QR Code PIX criado com sucesso.", qrCode };
  }

  async deleteQrCode(txid) {
    const pixQr = await PixQrs.findAll({ where: { txid: String(txid) } });
    if (!pixQr || pixQr.length === 0) {
      return { success: false, message: "Nenhum QR Code encontrado." };
    }

    await PixQrs.destroy({ where: { txid: String(txid) } });
    return { success: true, message: "QR Code deletado com sucesso." };
  }

  async getQrCode(payload) {
    const pixQr = await PixQrs.findAll({ where: { payload: String(payload) } });
    if (!pixQr || pixQr.length === 0) {
      return { success: false, message: "Nenhum QR Code encontrado." };
    }

    return { success: true, message: "QR Code encontrado com sucesso.", pixQr };
  }

  async transferQrCode(fromAccountId, toPayloadValue, amount, transferPassword, userId) {
    const transaction = await sequelize.transaction();
    try {
      const fromAccount = await Accounts.findByPk(fromAccountId, { transaction });
      if (!fromAccount) {
        await transaction.rollback();
        return { success: false, message: "Conta de origem não encontrada." };
      }
      if (fromAccount.userId !== userId) {
        await transaction.rollback();
        return { success: false, message: "Acesso negado à conta de origem." };
      }

      if (!fromAccount.transferPassword) {
        await transaction.rollback();
        return { success: false, message: "Senha de transferência não definida. Por favor, defina-a antes de transferir." };
      }

      const isMatch = await bcrypt.compare(transferPassword, fromAccount.transferPassword);
      if (!isMatch) {
        await transaction.rollback();
        return { success: false, message: "Senha de transferência incorreta." };
      }

      if (amount <= 0) {
        await transaction.rollback();
        return { success: false, message: "O valor deve ser maior que zero." };
      }

      if (fromAccount.balance < amount) {
        await transaction.rollback();
        return { success: false, message: "Saldo insuficiente." };
      }

      const toPayload = await PixQrs.findOne({ where: { payload: toPayloadValue }, include: [Accounts], transaction });
      if (!toPayload) {
        await transaction.rollback();
        return { success: false, message: "QR Code PIX de destino não encontrado." };
      }

      const toAccount = toPayload.Account;
      if (!toAccount) {
        await transaction.rollback();
        return { success: false, message: "Conta de destino associada ao QR Code não encontrada." };
      }

      if (fromAccount.id === toAccount.id) {
        await transaction.rollback();
        return { success: false, message: "Não é possível transferir para a própria conta via PIX." };
      }

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
      return { success: true, message: "Transferência via QR Code realizada com sucesso.", fromAccount, toAccount };
    } catch (error) {
      await transaction.rollback();
      return { success: false, message: error.message };
    }
  }
}

module.exports = new PixService();
