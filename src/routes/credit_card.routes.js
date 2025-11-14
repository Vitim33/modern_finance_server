const express = require("express");
const creditCardController = require("../controllers/credit_card.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/create_credit_card", authMiddleware, creditCardController.createCreditCard);
router.post("/update_block_type/:cardId", authMiddleware, creditCardController.updateBlockType);
router.get("/get_credit_card_by_accountId/:accountId", authMiddleware, creditCardController.getCreditCardByAccountId);
router.delete("/delete_credit_card/:cardId", authMiddleware, creditCardController.deleteCreditCard);
router.post("/adjust_limit/:cardId", authMiddleware, creditCardController.adjustLimit);

module.exports = router;
