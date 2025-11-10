const express = require("express");
const creditCardController = require("../controllers/credit_card.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/createCreditCard", authMiddleware, creditCardController.createCreditCard);
router.post("/updateBlockType/:cardId", authMiddleware, creditCardController.updateBlockType);
router.get("/getCreditCardByAccountId/:accountId", authMiddleware, creditCardController.getCreditCardByAccountId);
router.delete("/deleteCreditCard/:cardId", authMiddleware, creditCardController.deleteCreditCard);

module.exports = router;
