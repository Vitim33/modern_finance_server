const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Users = require("../models/user.model");
const Accounts = require("../models/account.model");
const PixKeys = require("../models/pix_keys.model");
const sequelize = require("../config/database");

const SECRET_KEY = process.env.JWT_SECRET || "minha_chave_secreta";

class UserService {
  async register(name, cpf, phone, email, password) {
    const transaction = await sequelize.transaction();
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await Users.create(
        { name, cpf, phone, email, password: hashedPassword },
        { transaction }
      );

      const newAccount = await Accounts.create(
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
      return { success: true, message: "Usuário registrado com sucesso", user: newUser, account: newAccount, token };
    } catch (error) {
      await transaction.rollback();
      return { success: false, message: "Erro ao registrar usuário" };
    }
  }

  async login(cpf, password) {
    try {
      const user = await Users.findOne({ where: { cpf } });
      if (!user) {
        return { success: false, message: "Credenciais inválidas" };
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return { success: false, message: "Credenciais inválidas" };
      }

      const token = jwt.sign(
        { id: user.id, cpf: user.cpf, email: user.email },
        SECRET_KEY,
        { expiresIn: "1h" }
      );

      return { success: true, message: "Login realizado com sucesso", user, token };
    } catch (error) {
      return { success: false, message: "Erro ao realizar login" };
    }
  }

  async getCurrentUser(userId) {
    try {
      const user = await Users.findByPk(userId, { attributes: { exclude: ["password"] } });
      if (!user) {
        return { success: false, message: "Usuário não encontrado" };
      }
      return { success: true, message: "Usuario recuperado com sucesso", user };
    } catch (error) {
      return { success: false, message: "Erro ao buscar informações do usuário" };
    }
  }

  async setNewPhoneNumber(newPhone, userId, oldPhone) {
    try {
      const user = await Users.findOne({ where: { id: userId } });
      if (!user) {
        return { success: false, message: "Conta não encontrada" };
      }
      if (user.id !== userId) {
        return { success: false, message: "Acesso negado a esta conta" };
      }

      if (newPhone.length != 11 && newPhone[2] != '9') {
        return { success: false, message: "Número de telefone inválido" };
      }

      const ddd = newPhone.substring(0, 2);
      if (ddd.startsWith('0')) {
        return { success: false, message: "DDD inválido" };
      }

      const phone = await Users.findOne({ where: { phone: newPhone } });
      if (phone) {
        return { success: false, message: "Esse numero já está em uso por outro usuário, coloque um número valido." };
      }

      const pixKey = await PixKeys.findOne({ where: { keyValue: oldPhone } });
      if (pixKey) {
        return { success: false, message: "Seu atual número de telefone está vinculado a uma chave PIX ativa e não pode ser alterado." };
      }

      user.phone = newPhone;
      await user.save();
      return { success: true, message: "Número de telefone atualizado com sucesso" };
    } catch (error) {
      return { success: false, message: "Erro ao atualizar número de telefone" };
    }
  }
}

module.exports = new UserService();
