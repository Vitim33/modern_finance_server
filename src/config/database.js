const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: true, // Desabilita o log de queries SQL
});

module.exports = sequelize;
