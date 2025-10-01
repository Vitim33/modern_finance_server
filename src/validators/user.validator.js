const Joi = require("joi");

const registerSchema = Joi.object({
  name: Joi.string()
    .pattern(/^[A-Za-zÀ-ÿ\s]+$/)
    .min(3)
    .max(50)
    .required(),
  cpf: Joi.string()
    .pattern(/^\d{11}$/)
    .required(),
  phone: Joi.string()
    .pattern(/^\d{10,11}$/)
    .required(),
  email: Joi.string().email().required(),
  password: Joi.string().pattern(new RegExp("^[a-zA-Z0-9]{3,30}$")).required(),
});

const loginSchema = Joi.object({
  cpf: Joi.string()
    .pattern(/^\d{11}$/)
    .required(),
  password: Joi.string().pattern(new RegExp("^[a-zA-Z0-9]{3,30}$")).required(),
});

const validateRegister = (req, res, next) => {
  const { error } = registerSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  next();
};

const validateLogin = (req, res, next) => {
  const { error } = loginSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  next();
};

module.exports = { validateRegister, validateLogin };

