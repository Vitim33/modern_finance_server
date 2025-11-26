const bcrypt = require("bcryptjs");
const Accounts = require("../models/account.model");
const sequelize = require("../config/database");

class AccountService {
  async getAccountByUserId(userId) {
    const account = await Accounts.findOne({ where: { userId } });
    if (!account) {
      return { success: false, message: "Conta não encontrada." };
    }
    return account;
  }

  async getAccountBalance(accountId, userId) {
    const account = await Accounts.findByPk(accountId);
    if (!account) {
      return { success: false, message: "Conta não encontrada." };
    }
    if (account.userId !== userId) {
      return { success: false, message: "Acesso negado a esta conta." };
    }
    return account.balance;
  }

  async setTransferPassword(accountNumber, transferPassword, userId) {
    const account = await Accounts.findOne({ where: { accountNumber } });
    if (!account) {
      return { success: false, message: "Conta não encontrada." };
    }
    if (account.userId !== userId) {
      return { success: false, message: "Acesso negado a esta conta." };
    }

    const hashedTransferPassword = await bcrypt.hash(transferPassword, 10);
    account.transferPassword = hashedTransferPassword;
    await account.save();
    return { success: true, message: "Senha de transferência definida/atualizada com sucesso." };
  }

  async changeTransferPassword(accountNumber, oldTransferPassword, newTransferPassword, userId) {
    const account = await Accounts.findOne({ where: { accountNumber } });
    if (!account) {
      return { success: false, message: "Conta não encontrada." };
    }
    if (account.userId !== userId) {
      return { success: false, message: "Acesso negado a esta conta." };
    }

    if (!account.transferPassword) {
      return { success: false, message: "Ainda não existe senha de transferência definida." };
    }

    const isMatch = await bcrypt.compare(oldTransferPassword, account.transferPassword);
    if (!isMatch) {
      return { success: false, message: "Senha atual incorreta." };
    }

    const newPasswordIsSame = await bcrypt.compare(newTransferPassword, account.transferPassword);
    if (newPasswordIsSame) {
      return { success: false, message: "A nova senha não pode ser igual à atual." };
    }

    const hashedNewTransferPassword = await bcrypt.hash(newTransferPassword, 10);
    account.transferPassword = hashedNewTransferPassword;
    await account.save();
    return { success: true, message: "Senha de transferência alterada com sucesso." };
  }

  async verifyTransferPassword(accountNumber, userId) {
    const account = await Accounts.findOne({
      where: {
        accountNumber,
        userId,
      },
    });

    if (!account) {
      return { success: false, message: "Conta não encontrada." };
    }

    if (account.transferPassword === null) {
      return { success: false, message: "Senha de transferência não definida." };
    }

    return { success: true, message: "Senha de transferência definida." };
  }

  async transfer(fromAccountNumber, toAccountNumber, transferPassword, amount, userId) {
    const transaction = await sequelize.transaction();
    try {
      const fromAccount = await Accounts.findOne({ where: { accountNumber: fromAccountNumber }, transaction });
      const toAccount = await Accounts.findOne({ where: { accountNumber: toAccountNumber }, transaction });

      if (!fromAccount || !toAccount) {
        await transaction.rollback();
        return { success: false, message: "Conta origem ou destino não encontrada." };
      }

      if (fromAccount.userId !== userId) {
        await transaction.rollback();
        return { success: false, message: "Acesso negado à conta de origem." };
      }

      if (fromAccount.id === toAccount.id) {
        await transaction.rollback();
        return { success: false, message: "Não é possível transferir para a mesma conta." };
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

      fromAccount.balance = parseFloat((fromAccount.balance - amount).toFixed(2));
      toAccount.balance = parseFloat((toAccount.balance + amount).toFixed(2));

      await fromAccount.save({ transaction });
      await toAccount.save({ transaction });

      await transaction.commit();
      return { success: true, message: "Transferência realizada com sucesso.", fromAccount, toAccount };
    } catch (error) {
      await transaction.rollback();
      return { success: false, message: error.message };
    }
  }
}

module.exports = new AccountService();
