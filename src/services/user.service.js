const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const Account = require("../models/account.model");
const sequelize = require("../config/database");

const SECRET_KEY = process.env.JWT_SECRET || "minha_chave_secreta";

class UserService {
  async register(name, cpf, phone, email, password) {
    const transaction = await sequelize.transaction();
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await User.create(
        { name, cpf, phone, email, password: hashedPassword },
        { transaction }
      );

      const newAccount = await Account.create(
        {
          userId: newUser.id,
          accountNumber: `${Math.floor(Math.random() * 90000) + 10000}-${Math.floor(Math.random() * 9)}`,
          balance: 300,
        },
        { transaction }
      );

      const token = jwt.sign(
        { id: newUser.id, name: newUser.name, email: newUser.email },
        SECRET_KEY,
        { expiresIn: "1h" }
      );

      await transaction.commit();
      return { user: newUser, account: newAccount, token };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async login(cpf, password) {
    const user = await User.findOne({ where: { cpf } });
    if (!user) {
      throw new Error("Credenciais inválidas");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error("Credenciais inválidas");
    }

    const token = jwt.sign(
      { id: user.id, cpf: user.cpf, email: user.email },
      SECRET_KEY,
      { expiresIn: "1h" }
    );

    return { user, token };
  }

  async getCurrentUser(userId) {
    const user = await User.findByPk(userId, { attributes: { exclude: ['password'] } });
    if (!user) {
      throw new Error("Usuário não encontrado");
    }
    return user;
  }
}

module.exports = new UserService();

