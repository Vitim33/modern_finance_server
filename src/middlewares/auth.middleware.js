const jwt = require("jsonwebtoken");
const { invalidTokens } = require("../controllers/user.controller"); 

const SECRET_KEY = process.env.JWT_SECRET || "minha_chave_secreta";

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; 

  if (!token || invalidTokens.includes(token)) {
    return res.status(401).json({ status: false, message: "Token inválido ou não fornecido" });
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ status: false, message: "Token inválido ou expirado" });
    }

    req.user = user;
    req.token = token;
    next();
  });
};

module.exports = authenticateToken;
