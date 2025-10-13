const express = require("express");
const router = express.Router();
const transferController = require("../controllers/transfer.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const {
  validateSetTransferPassword,
  validateChangeTransferPassword,
  validateTransfer
} = require("../validators/transfer.validator");

// ✅ Todas as rotas que dependem do usuário autenticado precisam do authMiddleware
router.post("/set_transfer_password", validateSetTransferPassword, authMiddleware, transferController.setTransferPassword);
router.post("/change_transfer_password", validateChangeTransferPassword, authMiddleware, transferController.changeTransferPassword);
router.post("/verify_transfer_password", authMiddleware, transferController.verifyTransferPassword);
router.post("/transfer", validateTransfer, authMiddleware, transferController.transfer);

module.exports = router;
