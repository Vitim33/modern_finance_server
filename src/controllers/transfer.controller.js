const transferService = require("../services/transfer.service");

class TransferController {
  async setTransferPassword(req, res, next) {
    try {
      const { accountNumber, transferPassword } = req.body;
      const result = await transferService.setTransferPassword(accountNumber, transferPassword, req.user.id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async changeTransferPassword(req, res, next) {
    try {
      const { accountNumber, old_transferPassword, new_transferPassword } = req.body;
      const result = await transferService.changeTransferPassword(
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
      const result = await transferService.verifyTransferPassword(accountNumber, req.user.id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async transfer(req, res, next) {
    try {
      const { fromAccountNumber, toAccountNumber, transferPassword, amount } = req.body;
      const result = await transferService.transfer(
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
}

module.exports = new TransferController();
