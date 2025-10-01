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

  async setTransferPassword(req, res, next) {
    try {
      const { accountNumber, transferPassword } = req.body;
      const result = await accountService.setTransferPassword(accountNumber, transferPassword, req.user.id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async changeTransferPassword(req, res, next) {
    try {
      const { accountNumber, old_transferPassword, new_transferPassword } = req.body;
      const result = await accountService.changeTransferPassword(
        accountNumber,
        old_transferPassword,
        new_transferPassword,
        req.user.id
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async verifyTransferPassword(req, res, next) {
    try {
      const { accountNumber } = req.body;
      const result = await accountService.verifyTransferPassword(accountNumber, req.user.id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async transfer(req, res, next) {
    try {
      const { fromAccountNumber, toAccountNumber, transferPassword, amount } = req.body;
      const result = await accountService.transfer(
        fromAccountNumber,
        toAccountNumber,
        transferPassword,
        amount,
        req.user.id
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async register(req, res, next) {
    try {
      const { name, cpf, phone, email, password } = req.body;
      const user = await accountService.register(name, cpf, phone, email, password);
      res.status(201).json(user);
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { cpf, password } = req.body;
      const token = await accountService.login(cpf, password);
      res.status(200).json({ token });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AccountController(); 
