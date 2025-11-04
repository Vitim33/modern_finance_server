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
  toAccountName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

Accounts.hasOne(Transfers, { foreignKey: "accountId" });
Transfers.belongsTo(Accounts, { foreignKey: "accountId" });

module.exports = Transfers;
