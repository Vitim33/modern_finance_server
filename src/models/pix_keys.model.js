const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Accounts = require("./account.model");

const PixKeys = sequelize.define("PixKeys", {
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
  keyType: {
    type: DataTypes.ENUM('CPF', 'Email', 'Telefone', 'Aleatoria'),
    allowNull: false,
  },
  keyValue: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  indexes: [
    { unique: true, fields: ['accountId', 'keyType'] },
    { unique: true, fields: ['keyValue'] },
  ]
});



Accounts.hasOne(PixKeys, { foreignKey: "accountId" });
PixKeys.belongsTo(Accounts, { foreignKey: "accountId" });

module.exports = PixKeys;
