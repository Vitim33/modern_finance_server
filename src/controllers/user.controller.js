const userService = require("../services/user.service");

class UserController {
  async register(req, res, next) {
    try {
      const { username, email, password } = req.body;
      const { user, account, token } = await userService.register(username, email, password);
      res.status(201).json({ message: "Usuário e conta criados com sucesso", token, user, account });
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { username, password } = req.body;
      const { user, token } = await userService.login(username, password);
      res.status(200).json({ message: "Login realizado com sucesso", token, user: { id: user.id, username: user.username, email: user.email } });
    } catch (error) {
      next(error);
    }
  }

  async getCurrentUser(req, res, next) {
    try {
      const user = await userService.getCurrentUser(req.user.id);
      res.status(200).json({ user });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();

