const express = require("express");
const userController = require("../../controllers/user.controller");
const authenticateToken = require("../middlewares/auth.middleware");
const { validateRegister, validateLogin } = require("../validators/user.validator");

const router = express.Router();

router.post("/register", validateRegister, userController.register);
router.post("/login", validateLogin, userController.login);
router.get("/me", authenticateToken, userController.getCurrentUser);

module.exports = router;

