require("dotenv").config();
const express = require("express");
const path = require("path");
const sequelize = require("./src/config/database");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use("/docs", express.static(path.join(__dirname, "docs")));

const swaggerDocument = YAML.load(path.join(__dirname, "docs", "swagger.yaml"));

const userRoutes = require("./src/routes/user.routes");
const accountRoutes = require("./src/routes/account.routes");

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use("/users", userRoutes);
app.use("/accounts", accountRoutes);

const errorHandler = require("./src/utils/errorHandler");
app.use(errorHandler);

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
    console.log(`Swagger disponível em http://localhost:${PORT}/api-docs`);
  });
});
