const bcrypt = require("bcryptjs");
const Accounts = require("../models/account.model");
const Users = require("../models/user.model");
const Transfers = require("../models/transfer.model");
const sequelize = require("../config/database");

class TransferService {
  async setTransferPassword(accountNumber, transferPassword, userId) {
    const account = await Accounts.findOne({ where: { accountNumber } });
    if (!account) {
      return { success: false, message: "Conta não encontrada" };
    }
    if (account.userId !== userId) {
      return { success: false, message: "Acesso negado a esta conta" };
    }

    const hashedTransferPassword = await bcrypt.hash(transferPassword, 10);
    account.transferPassword = hashedTransferPassword;
    await account.save();
    return { success: true, message: "Senha de transferência definida/atualizada com sucesso" };
  }

  async validateTransferPassword(accountId, transferPassword, userId) {
    try {
      const account = await Accounts.findByPk(accountId);
      if (!account)
        return { success: false, message: "Conta de origem não encontrada." };
      if (account.userId !== userId)
        return { success: false, message: "Acesso negado à conta de origem." };

      if (account.transferPassword === null) {
        return { success: false, message: "Senha de transferência não definida. Por favor, defina-a antes de transferir." };
      }

      const isMatch = await bcrypt.compare(transferPassword, account.transferPassword);
      if (!isMatch) {
        return { success: false, message: "Senha de transferência incorreta." };
      }

      return { success: true, message: "Senha de transação validada com sucesso" };
    } catch (error) {
      return { success: false, message: "Erro ao validar senha de transferência." };
    }
  }

  async changeTransferPassword(accountNumber, oldTransferPassword, newTransferPassword, userId) {
    const account = await Accounts.findOne({ where: { accountNumber } });
    if (!account) {
      return { success: false, message: "Conta não encontrada" };
    }
    if (account.userId !== userId) {
      return { success: false, message: "Acesso negado a esta conta" };
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
      return { success: false, message: "Conta não encontrada" };
    }

    if (account.transferPassword === null) {
      return { success: false, message: "Senha de transferência não definida. Por favor, defina-a antes de transferir." };
    }

    return { success: true, message: "Senha de transferência definida" };
  }

  async transfer(fromAccountNumber, toAccountNumber, amount, userId) {
    const transaction = await sequelize.transaction();

    try {
      const fromAccount = await Accounts.findOne({
        where: { accountNumber: fromAccountNumber },
        transaction,
      });

      const toAccount = await Accounts.findOne({
        where: { accountNumber: toAccountNumber },
        transaction,
      });

      if (!fromAccount || !toAccount) {
        await transaction.rollback();
        return { success: false, message: "Conta origem ou destino não encontrada" };
      }

      if (fromAccount.userId !== userId) {
        await transaction.rollback();
        return { success: false, message: "Acesso negado à conta de origem" };
      }

      if (fromAccount.id === toAccount.id) {
        await transaction.rollback();
        return { success: false, message: "Não é possível transferir para a própria conta via PIX." };
      }

      if (!fromAccount.transferPassword) {
        await transaction.rollback();
        return { success: false, message: "Senha de transferência não definida. Por favor, defina-a antes de transferir." };
      }

      if (amount <= 0) {
        await transaction.rollback();
        return { success: false, message: "O valor deve ser maior que zero" };
      }

      if (fromAccount.balance < amount) {
        await transaction.rollback();
        return { success: false, message: "Saldo insuficiente" };
      }

      fromAccount.balance = parseFloat((fromAccount.balance - amount).toFixed(2));
      toAccount.balance = parseFloat((toAccount.balance + amount).toFixed(2));

      await fromAccount.save({ transaction });
      await toAccount.save({ transaction });

      const toUser = await Users.findOne({ where: { id: toAccount.userId } });
      const fromUser = await Users.findOne({ where: { id: fromAccount.userId } });

      await Transfers.create(
        {
          accountId: fromAccount.id,
          toAccountName: toUser.name,
          date: new Date(),
          amount,
          category: "Transferência",
          type: "debit",
        },
        { transaction }
      );

      await Transfers.create(
        {
          accountId: toAccount.id,
          toAccountName: fromUser.name,
          date: new Date(),
          amount,
          category: "Transferência",
          type: "credit",
        },
        { transaction }
      );

      await transaction.commit();

      return {
        success: true,
        message: "Transferência realizada com sucesso",
        fromAccount,
        toAccount,
      };
    } catch (error) {
      await transaction.rollback();
      return { success: false, message: "Erro ao realizar transferência" };
    }
  }

  async getTransactions(accountId) {
    const transaction = await Transfers.findAll({
      where: { accountId: accountId },
    });

    if (!transaction || transaction.length === 0) {
      console.warn("⚠️ Nenhuma transação encontrada.");
    }

    return transaction;
  }

  async rechargePhone(accountId, value) {
    const transaction = await sequelize.transaction();

    try {
      const fromAccount = await Accounts.findOne({
        where: { id: accountId },
        transaction,
      });
      if (!fromAccount) {
        await transaction.rollback();
        return { success: false, message: "Conta origem ou destino não encontrada" };
      }

      if (value <= 0) {
        await transaction.rollback();
        return { success: false, message: "O valor deve ser maior que zero" };
      }

      if (fromAccount.balance < value) {
        await transaction.rollback();
        return { success: false, message: "Saldo insuficiente" };
      }

      fromAccount.balance = parseFloat((fromAccount.balance - value).toFixed(2));
      await fromAccount.save({ transaction });
      await transaction.commit();
      return {
        success: true,
        message: "Transferência realizada com sucesso",
      };
    } catch (error) {
      await transaction.rollback();
      return { success: false, message: "Erro ao realizar recarga." };
    }
  }
}

module.exports = new TransferService();
