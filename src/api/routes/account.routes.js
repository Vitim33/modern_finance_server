const express = require("express");
const accountController = require("../../controllers/account.controller");
const authenticateToken = require("../middlewares/auth.middleware");
const { validateSetTransferPassword, validateChangeTransferPassword, validateTransfer } = require("../validators/account.validator");

const router = express.Router();

router.get("/:userId", authenticateToken, accountController.getAccountByUserId);
router.get("/:accountId/balance", authenticateToken, accountController.getAccountBalance);
router.post("/set_transfer_password", authenticateToken, validateSetTransferPassword, accountController.setTransferPassword);
router.post("/change_transfer_password", authenticateToken, validateChangeTransferPassword, accountController.changeTransferPassword);
router.post("/verify_transfer_password", authenticateToken, accountController.verifyTransferPassword);
router.post("/transfer", authenticateToken, validateTransfer, accountController.transfer);

module.exports = router;

