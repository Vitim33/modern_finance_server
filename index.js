require("dotenv").config();
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;
const sequelize = require("./src/config/database");

// Models
const User = require("./src/models/user.model");
const Account = require("./src/models/account.model");

// Middlewares
app.use(express.json());

// Rotas
const userRoutes = require("./src/routes/user.routes");
const accountRoutes = require("./src/routes/account.routes");

// Define prefixos para as rotas
app.use("/users", userRoutes);
app.use("/accounts", accountRoutes);

// Middleware de tratamento de erros
const errorHandler = require("./src/utils/errorHandler");
app.use(errorHandler);

// Conectar e sincronizar banco
const syncDb = async () => {
  try {
    await sequelize.authenticate();
    console.log("Conexão com o banco de dados estabelecida com sucesso.");
    await sequelize.sync({ alter: true });
    console.log("Modelos sincronizados com o banco de dados.");
  } catch (error) {
    console.error("Erro ao conectar ou sincronizar o banco:", error);
  }
};

syncDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
});
