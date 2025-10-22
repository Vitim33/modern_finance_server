const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const PixQr = require("../models/pix_qr.model");
const { generatePixPayload } = require("../utils/pix_qr.utils");
const Account = require("../models/account.model");
const PixKeys = require("../models/pix_keys.model");
const sequelize = require("../config/database");

class PixService {
  async createPixKey(accountId, keyType, keyValue, userId) {
    const account = await Account.findByPk(accountId);
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

    const existingKey = await PixKeys.findOne({ where: { keyValue } });
    if (existingKey) {
      throw new Error("Chave PIX já cadastrada.");
    }

    const pixKey = await PixKeys.create({
      accountId,
      keyType,
      keyValue,
    });
    return pixKey;
  }

  async deletePixKey(keyType) {
    const pixKeys = await PixKeys.findAll({
      where: { keyType: String(keyType) },
    });

    if (!pixKeys || pixKeys.length === 0) {
      throw new Error("Nenhuma chave PIX encontrada para este tipo.");
    }

    await PixKeys.destroy({
      where: { keyType: String(keyType) },
    });

    return { message: "Chave(s) PIX deletada(s) com sucesso." };
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
      const fromAccount = await Account.findByPk(fromAccountId, { transaction });
      if (!fromAccount) {
        throw new Error("Conta de origem não encontrada.");
      }
      if (fromAccount.userId !== userId) {
        throw new Error("Acesso negado à conta de origem.");
      }

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

      if (amount <= 0) {
        throw new Error("O valor deve ser maior que zero.");
      }

      if (fromAccount.balance < amount) {
        throw new Error("Saldo insuficiente.");
      }

      const toPixKey = await PixKeys.findOne({ where: { keyValue: toPixKeyValue }, include: [Account], transaction });
      if (!toPixKey) {
        throw new Error("Chave PIX de destino não encontrada.");
      }

      const toAccount = toPixKey.Account;
      if (!toAccount) {
        throw new Error("Conta de destino associada à chave PIX não encontrada.");
      }

      if (fromAccount.id === toAccount.id) {
        throw new Error("Não é possível transferir para a própria conta via PIX.");
      }

      fromAccount.balance = parseFloat((fromAccount.balance - amount).toFixed(2));
      toAccount.balance = parseFloat((toAccount.balance + amount).toFixed(2));

      await fromAccount.save({ transaction });
      await toAccount.save({ transaction });

      await transaction.commit();
      return { message: "Transferência PIX realizada com sucesso", fromAccount, toAccount };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async createPixQr(accountId, amount, userId, expiresInMinutes) {
    const account = await Account.findByPk(accountId);
    if (!account) throw new Error("Conta não encontrada.");
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
      merchantName: account.ownerName || "RECEBEDOR",
      merchantCity: account.city || "SAOPAULO",
      amount,
      txid,
    });

    const expiresAt = new Date(Date.now() + expiresInMinutes * 60000);

    const qr = await PixQr.create({
      accountId,
      pixKey: chosenKey.keyValue,
      amount,
      txid,
      payload,
      expiresAt,
      status: "pending",
    });

    return qr;
  }

  async deleteQrCode(txid) {
    const pixQr = await PixQr.findAll({
      where: { txid: String(txid) },
    });

    if (!pixQr || pixQr.length === 0) {
      throw new Error("Nenhum QR Code encontrado.");
    }

    await PixQr.destroy({
      where: { txid: String(txid) },
    });

    return { message: "QR Code deletado com sucesso." };
  }

}

module.exports = new PixService();
