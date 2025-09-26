const bcrypt = require("bcryptjs");
const Account = require("../models/account.model");
const sequelize = require("../config/database");

class AccountService {
  async getAccountByUserId(userId) {
    const account = await Account.findOne({ where: { userId } });
    if (!account) {
      throw new Error("Conta não encontrada");
    }
    return account;
  }

  async getAccountBalance(accountId, userId) {
    const account = await Account.findByPk(accountId);
    if (!account) {
      throw new Error("Conta não encontrada");
    }
    if (account.userId !== userId) {
      throw new Error("Acesso negado a esta conta");
    }
    return account.balance;
  }

  async setTransferPassword(accountNumber, transfer_password, userId) {
    const account = await Account.findOne({ where: { accountNumber } });
    if (!account) {
      throw new Error("Conta não encontrada");
    }
    if (account.userId !== userId) {
      throw new Error("Acesso negado a esta conta");
    }

    const hashedTransferPassword = await bcrypt.hash(transfer_password, 10);
    account.transfer_password = hashedTransferPassword;
    await account.save();
    return { message: "Senha de transferência definida/atualizada com sucesso" };
  }

  async changeTransferPassword(accountNumber, old_transfer_password, new_transfer_password, userId) {
    const account = await Account.findOne({ where: { accountNumber } });
    if (!account) {
      throw new Error("Conta não encontrada");
    }
    if (account.userId !== userId) {
      throw new Error("Acesso negado a esta conta");
    }

    if (!account.transfer_password) {
      throw new Error("Ainda não existe senha de transferência definida.");
    }

    const isMatch = await bcrypt.compare(old_transfer_password, account.transfer_password);
    if (!isMatch) {
      throw new Error("Senha atual incorreta.");
    }

    const newPasswordIsSame = await bcrypt.compare(new_transfer_password, account.transfer_password);
    if (newPasswordIsSame) {
      throw new Error("A nova senha não pode ser igual a atual.");
    }

    const hashedNewTransferPassword = await bcrypt.hash(new_transfer_password, 10);
    account.transfer_password = hashedNewTransferPassword;
    await account.save();
    return { message: "Senha de transferência alterada com sucesso." };
  }

  async verifyTransferPassword(accountNumber, transfer_password, userId) {
    const account = await Account.findOne({ where: { accountNumber } });
    if (!account) {
      throw new Error("Conta não encontrada");
    }
    if (account.userId !== userId) {
      throw new Error("Acesso negado a esta conta");
    }
    if (!account.transfer_password) {
      const error = new Error("Senha de transferência não definida. Por favor, defina-a antes de transferir.");
      error.code = "P404";
      throw error;
    }

    const isMatch = await bcrypt.compare(transfer_password, account.transfer_password);
    if (!isMatch) {
      const error = new Error("Senha de transferência incorreta");
      error.code = "P401";
      throw error;
    }
    return { message: "Senha de transferência válida" };
  }

  async transfer(fromAccountNumber, toAccountNumber, transfer_password, amount, userId) {
    const transaction = await sequelize.transaction();
    try {
      const fromAccount = await Account.findOne({ where: { accountNumber: fromAccountNumber }, transaction });
      const toAccount = await Account.findOne({ where: { accountNumber: toAccountNumber }, transaction });

      if (!fromAccount || !toAccount) {
        throw new Error("Conta origem ou destino não encontrada");
      }

      if (fromAccount.userId !== userId) {
        throw new Error("Acesso negado à conta de origem");
      }

      if (fromAccount.id === toAccount.id) {
        throw new Error("Não é possível transferir para a mesma conta");
      }

      if (!fromAccount.transfer_password) {
        const error = new Error("Senha de transferência não definida. Por favor, defina-a antes de transferir.");
        error.code = "P404";
        throw error;
      }

      const isMatch = await bcrypt.compare(transfer_password, fromAccount.transfer_password);
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

module.exports = new AccountService();

