const pixService = require("../services/pix.service");

class PixController {
  async createPixKey(req, res, next) {
    try {
      const { accountId, keyType, keyValue } = req.body;
      const pixKey = await pixService.createPixKey(accountId, keyType, keyValue, req.user.id);
      res.status(200).json(pixKey);
    } catch (error) {
      next(error);
    }
  }

  async getPixKeyByValue(req, res, next) {
    try {
      const { pixKeyValue } = req.params;
      const pixKey = await pixService.getPixKeyByValue(pixKeyValue);
      res.status(200).json(pixKey);
    } catch (error) {
      next(error);
    }
  }

  async transferPix(req, res, next) {
    try {
      const { fromAccountId, toPixKeyValue, amount, transferPassword } = req.body;
      const result = await pixService.transferPix(fromAccountId, toPixKeyValue, amount, transferPassword, req.user.id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PixController();
