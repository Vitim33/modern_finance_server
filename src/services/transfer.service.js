const bcrypt = require("bcryptjs");
const Accounts = require("../models/account.model");
const Transfers = require("../models/tranfer.model");
const sequelize = require("../config/database");

class TransferService {
  async setTransferPassword(accountNumber, transferPassword, userId) {
    const account = await Accounts.findOne({ where: { accountNumber } });
    if (!account) {
      throw new Error("Conta não encontrada");
    }
    if (account.userId !== userId) {
      throw new Error("Acesso negado a esta conta");
    }

    const hashedTransferPassword = await bcrypt.hash(transferPassword, 10);
    account.transferPassword = hashedTransferPassword;
    await account.save();
    return { message: "Senha de transferência definida/atualizada com sucesso" };
  }

  async changeTransferPassword(accountNumber, old_transferPassword, new_transferPassword, userId) {
    const account = await Accounts.findOne({ where: { accountNumber } });
    if (!account) {
      throw new Error("Conta não encontrada");
    }
    if (account.userId !== userId) {
      throw new Error("Acesso negado a esta conta");
    }

    if (!account.transferPassword) {
      throw new Error("Ainda não existe senha de transferência definida.");
    }

    const isMatch = await bcrypt.compare(old_transferPassword, account.transferPassword);
    if (!isMatch) {
      throw new Error("Senha atual incorreta.");
    }

    const newPasswordIsSame = await bcrypt.compare(new_transferPassword, account.transferPassword);
    if (newPasswordIsSame) {
      throw new Error("A nova senha não pode ser igual a atual.");
    }

    const hashedNewTransferPassword = await bcrypt.hash(new_transferPassword, 10);
    account.transferPassword = hashedNewTransferPassword;
    await account.save();
    return { message: "Senha de transferência alterada com sucesso." };
  }

  async verifyTransferPassword(accountNumber, userId) {
    const account = await Accounts.findOne({
      where: {
        accountNumber,
        userId,
      },
    });

    if (!account) {
      return { success: false, message: "Conta não encontrada" };
    }

    if (account.transferPassword === null) {
      return { success: false, message: "Senha de transferência não definida" };
    }

    return { success: true, message: "Senha de transferência definida" };
  }

  async transfer(fromAccountNumber, toAccountNumber, transferPassword, amount, userId) {
    const transaction = await sequelize.transaction();
    try {
      const fromAccount = await Accounts.findOne({ where: { accountNumber: fromAccountNumber }, transaction });
      const toAccount = await Accounts.findOne({ where: { accountNumber: toAccountNumber }, transaction });

      if (!fromAccount || !toAccount) {
        throw new Error("Conta origem ou destino não encontrada");
      }

      if (fromAccount.userId !== userId) {
        throw new Error("Acesso negado à conta de origem");
      }

      if (fromAccount.id === toAccount.id) {
        throw new Error("Não é possível transferir para a mesma conta");
      }

      if (!fromAccount.transferPassword) {
        const error = new Error("Senha de transferência não definida. Por favor, defina-a antes de transferir.");
        error.code = "P404";
        throw error;
      }

      const isMatch = await bcrypt.compare(transferPassword, fromAccount.transferPassword);
      if (!isMatch) {
        const error = new Error("Senha de transferência incorreta");
        error.code = "P401";
        throw error;
      }

      if (amount <= 0) {
        throw new Error("O valor deve ser maior que zero");
      }

      if (fromAccount.balance < amount) {
        throw new Error("Saldo insuficiente");
      }

      fromAccount.balance = parseFloat((fromAccount.balance - amount).toFixed(2));
      toAccount.balance = parseFloat((toAccount.balance + amount).toFixed(2));

      await fromAccount.save({ transaction });
      await toAccount.save({ transaction });

      await transaction.commit();
      return { message: "Transferência realizada com sucesso", fromAccount, toAccount };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

module.exports = new TransferService();
