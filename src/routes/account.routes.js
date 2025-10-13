const express = require("express");
const accountController = require("../controllers/account.controller");
const authenticateToken = require("../middlewares/auth.middleware");

const router = express.Router();

/** ROTAS PÚBLICAS (não precisam de token) */
router.post("/register", accountController.register);
router.post("/login", accountController.login);


/** ROTAS PROTEGIDAS (precisam de token) */
router.use(authenticateToken);
router.get("/:userId", accountController.getAccountByUserId);
router.get("/:accountId/balance", accountController.getAccountBalance);

module.exports = router;
