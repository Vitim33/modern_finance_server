const express = require("express");
const { userController } = require("../controllers/user.controller");
const authenticateToken = require("../middlewares/auth.middleware");
const { validateRegister, validateLogin } = require("../validators/user.validator");

const router = express.Router();

router.post("/register", validateRegister, userController.register.bind(userController));
router.post("/login", validateLogin, userController.login.bind(userController));
router.get("/me", authenticateToken, userController.getCurrentUser.bind(userController));
router.post("/logout", authenticateToken, userController.logout.bind(userController));

module.exports = router;