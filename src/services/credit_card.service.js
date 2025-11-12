const bcrypt = require("bcryptjs");
const CreditCards = require("../models/credit_card.model");
const Accounts = require("../models/account.model");
const { message } = require("statuses");

class CreditCardService {
  async getCreditCardByAccountId(accountId) {
    const creditCard = await CreditCards.findAll({
      where: { accountId: String(accountId) },
      raw: false,
    });

    if (!creditCard || creditCard.length === 0) {
      throw new Error("Nenhum cartão encontrada para esta conta.");
    }

    return creditCard;
  }

  async createCreditCard(accountId, name, password, userId) {
    const account = await Accounts.findByPk(accountId);
    if (!account) {
      throw new Error("Conta não encontrada");
    }

    if (account.userId !== userId) {
      throw new Error("Acesso negado a esta conta");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const cardNumber = Array.from({ length: 16 }, () =>
      Math.floor(Math.random() * 10)
    ).join("");

    const now = new Date();
    const randomYears = Math.floor(Math.random() * 4) + 2;
    const expiryMonth = String(Math.floor(Math.random() * 12) + 1).padStart(2, "0");
    const expiryYear = String((now.getFullYear() + randomYears) % 100).padStart(2, "0");
    const validate = `${expiryMonth}/${expiryYear}`;

    const randomLimit = Math.round((200 + Math.random() * (15000 - 200)) * 100) / 100;

    await CreditCards.create({
      accountId,
      creditCardName: name,
      creditCardNumber: cardNumber,
      validate,
      creditCardPassword: hashedPassword,
      creditCardLimit: randomLimit,
      creditCardAvailable: randomLimit,
      creditCardUsed: 0,
    });

    return {success: true, message:"Cartão criado com sucesso"};
  }

  async updateBlockType(cardId, blockType) {
    const creditCard = await CreditCards.findOne({ where: { id: cardId } });
    if (!creditCard)
      throw new Error("Cartão não encontrado");

    creditCard.blockType = blockType;
    await creditCard.save();
    return {success: true, message: "Tipo de bloqueio atualizado"};
  }

  async deleteCreditCard(cardId) {
    const creditCard = await CreditCards.findOne({
      where: { id: String(cardId) },
    });

    if (!creditCard || creditCard.length === 0) {
      throw new Error("Nenhum cartão encontrado.");
    }

    await creditCard.destroy({
      where: { id: String(cardId) },
    });

    return { success: true, message: "Cartão deletado com sucesso." };
  }

  async adjustLimit(cardId, accountId, newLimitAvailable, transferPassword) {

    const creditCard = await CreditCards.findOne({
      where: { id: String(cardId) },
    });

      if (!creditCard || creditCard.length === 0) {
      throw new Error("Nenhum cartão encontrado.");
    }

    const fromAccount = await Accounts.findOne({
        where: { id: accountId },
      });
      if (!fromAccount) {
        throw new Error("Conta origem ou destino não encontrada");
      }


      const isMatch = await bcrypt.compare(transferPassword, fromAccount.transferPassword);
          if (!isMatch) {
            const error = new Error("Senha de transferência incorreta");
            error.code = "P401";
            throw error;
          }

     if (creditCard.creditCardUsed > newLimitAvailable) {
      throw new Error("O novo limite deve ser maior que o usado.");
    }

      if (creditCard.creditCardLimit < newLimitAvailable) {
      throw new Error("O novo limite deve ser menor que o limite total.");
    }

    creditCard.creditCardAvailable = newLimitAvailable;
    await creditCard.save();
    return {success: true , message: "Limite atualizado om sucesso."}  ;
  }

}
module.exports = new CreditCardService();