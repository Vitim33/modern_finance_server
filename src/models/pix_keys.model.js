const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Account = require("./account.model");

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
      model: Account,
      key: "id",
    },
  },
  keyType: {
    type: DataTypes.ENUM('cpf', 'email', 'telefone', 'aleatoria'),
    allowNull: false,
    unique: true,
  },
  keyValue: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

Account.hasOne(PixKeys, { foreignKey: "accountId" });
PixKeys.belongsTo(Account, { foreignKey: "accountId" });

module.exports = PixKeys;
