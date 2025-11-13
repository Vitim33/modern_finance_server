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

  async deletePixKey(req, res, next) {
    try {
      const { keyType, keyValue } = req.params;
      const pixKeys = await pixService.deletePixKey(keyType, keyValue);
      res.status(200).json(pixKeys);
    } catch (error) {
      next(error);
    }
  }

  async getPixKeysByAccountId(req, res, next) {
    try {
      const { accountId } = req.params;
      const pixKeys = await pixService.getPixKeysByAccountId(accountId);
      res.status(200).json(pixKeys);
    } catch (error) {
      next(error);
    }
  }

  async transferPix(req, res, next) {
    try {
      const { fromAccountId, toPixKeyValue, amount } = req.body;
      const result = await pixService.transferPix(fromAccountId, toPixKeyValue, amount, req.user.id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async createPixQr(req, res, next) {
    try {
      const { accountId, amount, userId, expiresInMinutes } = req.body;
      const qr = await pixService.createPixQr(
        accountId,
        amount,
        userId,
        expiresInMinutes);
      res.status(200).json(qr);
    } catch (error) {
      next(error);
    }
  }

  async deleteQrCode(req, res, next) {
    try {
      const { txid } = req.params;
      const qrCodeDelete = await pixService.deleteQrCode(txid);
      res.status(200).json(qrCodeDelete);
    } catch (error) {
      next(error);
    }
  }

  async getQrCode(req, res, next) {
    try {
      const { payload } = req.params;
      const grCode = await pixService.getQrCode(payload);
      res.status(200).json(grCode);
    } catch (error) {
      next(error);
    }
  }

  async transferQrCode(req, res, next) {
    try {
      const { fromAccountId, toPayloadValue, amount, transferPassword } = req.body;
      const result = await pixService.transferQrCode(fromAccountId, toPayloadValue, amount, transferPassword, req.user.id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

}

module.exports = new PixController();
