const express = require("express");
const accountController = require("../controllers/account.controller");
const authenticateToken = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/register", accountController.register);
router.post("/login", accountController.login);
router.use(authenticateToken);
router.get("/:userId", accountController.getAccountByUserId);
router.get("/:accountId/balance", accountController.getAccountBalance);

module.exports = router;
