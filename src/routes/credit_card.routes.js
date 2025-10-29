const express = require("express");
const creditCardController = require("../controllers/credit_card.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/createCreditCard", authMiddleware, creditCardController.createCreditCard);
router.get("/getCreditCardByAccountId/:accountId", authMiddleware, creditCardController.getCreditCardByAccountId);

module.exports = router;
