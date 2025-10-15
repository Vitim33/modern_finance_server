const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
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

    const validKeyTypes = ['cpf', 'email', 'telefone', 'aleatoria'];
    if (!validKeyTypes.includes(keyType)) {
      throw new Error("Tipo de chave PIX inválido. Tipos permitidos: cpf, email, telefone, aleatoria.");
    }

    if (keyType === 'aleatoria') {
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

  async getPixKeyByValue(pixKeyValue) {
    const pixKey = await PixKeys.findOne({ where: { keyValue: String(pixKeyValue) }, include: [Account] });
    if (!pixKey) {
      throw new Error("Chave PIX não encontrada.");
    }
    return pixKey;
  }

  async getPixKeysByAccountId(accountId) {
  const pixKeys = await PixKeys.findAll({
    where: { accountId: String(accountId) },
    include: [Account],
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
}

module.exports = new PixService();
