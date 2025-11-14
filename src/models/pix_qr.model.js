const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Accounts = require("./account.model");

const PixQrs = sequelize.define("PixQrs", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  accountId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  pixKey: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  txid: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  payload: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: "pending",
  },
});

Accounts.hasOne(PixQrs, { foreignKey: "accountId" });
PixQrs.belongsTo(Accounts, { foreignKey: "accountId" });

module.exports = PixQrs;
