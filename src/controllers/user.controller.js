const userService = require("../services/user.service");

const invalidTokens = [];

class UserController {
  async register(req, res, next) {
    try {
      const { name, cpf, phone, email, password } = req.body;
      const { user, account, token } = await userService.register(name, cpf, phone, email, password);

      res.status(200).json({
        success: true,
        message: "Usuário e conta criados com sucesso",
        token,
        user,
        account
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { cpf, password } = req.body;
      const { user, token } = await userService.login(cpf, password);

      res.status(200).json({
        success: true,
        message: "Login realizado com sucesso",
        token,
        user: { id: user.id, name: user.name, cpf: user.cpf, phone: user.phone, email: user.email }
      });
    } catch (error) {
      next(error);
    }
  }

  async getCurrentUser(req, res, next) {
    try {
      const user = await userService.getCurrentUser(req.user.id);
      res.status(200).json({
        success: true,
        message: "Usuario obtido com sucesso",
        user
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res) {
    try {
      if (!req.token) {
        return res.status(400).json({ status: false, message: "Token não encontrado" });
      }

      invalidTokens.push(req.token);

      res.json({ success: true, message: "Logout realizado com sucesso" });
    } catch (error) {
      res.status(500).json({ status: false, message: "Erro ao realizar logout", error: error.message });
    }
  }

  async setNewPhoneNumber(req, res, next) {
    try {
      const { newPhone, userId, oldPhone } = req.body;
      const result = await userService.setNewPhoneNumber(newPhone, userId, oldPhone);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

}

const userController = new UserController();
module.exports = {
  userController,
  invalidTokens,
};
