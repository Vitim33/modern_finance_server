const transferService = require("../services/transfer.service");

class TransferController {
  async setTransferPassword(req, res, next) {
    try {
      const { accountNumber, transferPassword } = req.body;
      const user = req.user; 

      if (!user) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }

      const result = await transferService.setTransferPassword(accountNumber, transferPassword, user.id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async changeTransferPassword(req, res, next) {
    try {
      const { accountNumber, old_transferPassword, new_transferPassword } = req.body;
      const user = req.user;

      if (!user) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }

      const result = await transferService.changeTransferPassword(
        accountNumber,
        old_transferPassword,
        new_transferPassword,
        user.id
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async verifyTransferPassword(req, res, next) {
    try {
      const { accountNumber } = req.body;
      const user = req.user;

      if (!user) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }

      const result = await transferService.verifyTransferPassword(accountNumber, user.id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async transfer(req, res, next) {
    try {
      const { fromAccountNumber, toAccountNumber, transferPassword, amount } = req.body;
      const user = req.user;

      if (!user) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }

      const result = await transferService.transfer(
        fromAccountNumber,
        toAccountNumber,
        transferPassword,
        amount,
        user.id
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TransferController();
