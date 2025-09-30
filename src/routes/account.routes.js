const express = require("express");
const accountController = require("../controllers/account.controller");
const authenticateToken = require("../middlewares/auth.middleware");
const { 
  validateSetTransferPassword, 
  validateChangeTransferPassword, 
  validateTransfer 
} = require("../validators/account.validator");

const router = express.Router();

/** ROTAS PÚBLICAS (não precisam de token) */
router.post("/register", accountController.register); 
router.post("/login", accountController.login);


/** ROTAS PROTEGIDAS (precisam de token) */
router.use(authenticateToken);
router.get("/:userId", accountController.getAccountByUserId);
router.get("/:accountId/balance", accountController.getAccountBalance);
router.post("/set_transfer_password", validateSetTransferPassword, accountController.setTransferPassword);
router.post("/change_transfer_password", validateChangeTransferPassword, accountController.changeTransferPassword);
router.post("/verify_transfer_password", accountController.verifyTransferPassword);
router.post("/transfer", validateTransfer, accountController.transfer);

module.exports = router;
