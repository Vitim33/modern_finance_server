const creditCardService = require("../services/credit_card.service");

class CreditCardController {
  async getCreditCardByAccountId(req, res, next) {
    try {
      const { accountId } = req.params;
      const creditCard = await creditCardService.getCreditCardByAccountId(accountId);
      res.status(200).json(creditCard);
    } catch (error) {
      next(error);
    }
  }

  async createCreditCard(req, res, next) {
    try {
      const { accountId, name, password } = req.body;
      const creditCard = await creditCardService.createCreditCard(accountId, name, password, req.user.id);
      res.status(200).json(creditCard);
    } catch (error) {
      next(error);
    }
  }

  async updateBlockType(req, res, next) {
    try {
      const { cardId } = req.params;
      const { blockType } = req.body;
      const creditCard = await creditCardService.updateBlockType(cardId, blockType);
      res.status(200).json(creditCard);
    } catch (error) {
      next(error);
    }
  }
}
module.exports = new CreditCardController();