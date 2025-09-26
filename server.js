require("dotenv").config();
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;
const sequelize = require("./src/config/database");
const User = require("./src/models/user.model");
const Account = require("./src/models/account.model");

app.use(express.json());

// Importar rotas
const userRoutes = require("./src/api/routes/user.routes");
const accountRoutes = require("./src/api/routes/account.routes");

// Usar rotas
app.use("/api/users", userRoutes);
app.use("/api/accounts", accountRoutes);

// Middleware de tratamento de erros (deve ser o último middleware)
const errorHandler = require("./src/utils/errorHandler");
app.use(errorHandler);

const syncDb = async () => {
  try {
    await sequelize.authenticate();
    console.log("Conexão com o banco de dados estabelecida com sucesso.");
    await User.sync({ alter: true }); // Sincroniza o modelo User
    await Account.sync({ alter: true }); // Sincroniza o modelo Account
    console.log("Modelos sincronizados com o banco de dados.");
  } catch (error) {
    console.error("Não foi possível conectar ou sincronizar o banco de dados:", error);
  }
};

syncDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
});

