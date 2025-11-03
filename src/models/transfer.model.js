const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Accounts = require("./account.model");

const Transfers = sequelize.define("Transfers", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  accountId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Accounts,
      key: "id",
    },
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

Accounts.hasOne(Transfers, { foreignKey: "accountId" });
Transfers.belongsTo(Accounts, { foreignKey: "accountId" });

module.exports = Transfers;
