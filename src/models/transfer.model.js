const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Transfers = sequelize.define("Transfers", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  date: {
    type: DataTypes.DATE, 
    allowNull: false,
    defaultValue: DataTypes.NOW, 
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  fromAccount: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  toAccountName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

module.exports = Transfers;
