const accountService = require("../services/account.service");

class AccountController {
  async getAccountByUserId(req, res, next) {
    try {
      const { userId } = req.params;
      const account = await accountService.getAccountByUserId(userId);
      if (!account) return res.status(404).json({ message: "Conta não encontrada" });
      res.status(200).json(account);
    } catch (error) {
      next(error);
    }
  }

  async getAccountBalance(req, res, next) {
    try {
      const { accountId } = req.params;
      const balance = await accountService.getAccountBalance(accountId, req.user.id);
      res.status(200).json({ balance });
    } catch (error) {
      next(error);
    }
  }

}

module.exports = new AccountController(); 
