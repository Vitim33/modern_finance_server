const Joi = require("joi");

const transferPasswordSchema = Joi.string().pattern(new RegExp("^\\d{4,}$")).required().messages({
  "string.pattern.base": "A senha de transferência deve ter no mínimo 4 dígitos numéricos.",
  "any.required": "A senha de transferência é obrigatória."
});

const setTransferPasswordSchema = Joi.object({
  accountNumber: Joi.string().required(),
  transferPassword: transferPasswordSchema,
});

const changeTransferPasswordSchema = Joi.object({
  accountNumber: Joi.string().required(),
  oldTransferPassword: transferPasswordSchema,
  newTransferPassword: transferPasswordSchema,
});

const transferSchema = Joi.object({
  fromAccountNumber: Joi.string().required(),
  toAccountNumber: Joi.string().required(),
  transferPassword: transferPasswordSchema,
  amount: Joi.number().positive().precision(2).required().messages({
    "number.base": "O valor da transferência deve ser um número.",
    "number.positive": "O valor da transferência deve ser maior que zero.",
    "number.precision": "O valor da transferência deve ter no máximo 2 casas decimais.",
    "any.required": "O valor da transferência é obrigatório."
  }),
});

const validateSetTransferPassword = (req, res, next) => {
  const { error } = setTransferPasswordSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  next();
};

const validateChangeTransferPassword = (req, res, next) => {
  const { error } = changeTransferPasswordSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  next();
};

const validateTransfer = (req, res, next) => {
  const { error } = transferSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  next();
};

module.exports = {
  validateSetTransferPassword,
  validateChangeTransferPassword,
  validateTransfer,
};
