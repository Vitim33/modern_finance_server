const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Users = require("./user.model");

const Accounts = sequelize.define("Accounts", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Users,
      key: "id",
    },
  },
  accountNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  balance: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.0,
  },
  transferPassword: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

Users.hasOne(Accounts, { foreignKey: "userId" });
Accounts.belongsTo(Users, { foreignKey: "userId" });

module.exports = Accounts;

