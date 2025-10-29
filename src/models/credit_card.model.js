const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Account = require("./account.model");

const CreditCards = sequelize.define("CreditCards", {
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
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  },
  creditCardName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  creditCardNumber: {
    type: DataTypes.STRING(19),
    allowNull: false,
    unique: true,
    validate: {
      isCreditCard: true,
    },
  },
  validate: {
    type: DataTypes.STRING(5),
    allowNull: false,
  },
  creditCardPassword: {
    type: DataTypes.STRING(4),
    allowNull: true,
  },
  creditCardLimit: {
    type: DataTypes.DOUBLE,
    allowNull: false,
    defaultValue: 0,
  },
  creditCardAvailable: {
    type: DataTypes.DOUBLE,
    allowNull: false,
    defaultValue: 0,
  },
  creditCardUsed: {
    type: DataTypes.DOUBLE,
    allowNull: false,
    defaultValue: 0,
  },
}, {
  tableName: "CreditCards",
  timestamps: true,
});

Account.hasOne(CreditCards, {
  foreignKey: "accountId",
  as: "creditCard",
  onDelete: "CASCADE",
});

CreditCards.belongsTo(Account, {
  foreignKey: "accountId",
  as: "account",
});

module.exports = CreditCards;
