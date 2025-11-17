const express = require("express");
const router = express.Router();
const transferController = require("../controllers/transfer.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const {
  validateSetTransferPassword,
  validateChangeTransferPassword,
} = require("../validators/transfer.validator");

router.post("/set_transfer_password", validateSetTransferPassword, authMiddleware, transferController.setTransferPassword);
router.post("/change_transfer_password", validateChangeTransferPassword, authMiddleware, transferController.changeTransferPassword);
router.post("/verify_transfer_password", authMiddleware, transferController.verifyTransferPassword);
router.post("/validate_transfer_password", authMiddleware, transferController.validateTransferPassword);
router.post("/transfer", authMiddleware, transferController.transfer);
router.get("/get_transactions/:accountId", authMiddleware, transferController.getTransactions);
router.post("/recharge_phone", authMiddleware, transferController.rechargePhone);

module.exports = router;
