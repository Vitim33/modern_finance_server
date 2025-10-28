const Accounts = require("../models/account.model");

class AccountService {
  async getAccountByUserId(userId) {
    const account = await Accounts.findOne({ where: { userId } });
    if (!account) {
      throw new Error("Conta não encontrada");
    }
    return account;
  }

  async getAccountBalance(accountId, userId) {
    const account = await Accounts.findByPk(accountId);
    if (!account) {
      throw new Error("Conta não encontrada");
    }
    if (account.userId !== userId) {
      throw new Error("Acesso negado a esta conta");
    }
    return account.balance;
  }
}

module.exports = new AccountService();

