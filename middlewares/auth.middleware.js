const jwt = require("jsonwebtoken");

// Middleware para verificar o token
function verificarToken(req, res, next) {
  const token = req.header("Authorization");

  if (!token) {
    return res.status(401).json({ message: "Acesso negado! Token não fornecido." });
  }

  try {
    const decoded = jwt.verify(token.replace("Bearer ", ""), process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token inválido ou expirado." });
  }
}

// Middleware para verificar se o usuário é admin
function verificarAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Acesso negado! Você não é admin." });
  }
  next();
}

module.exports = { verificarToken, verificarAdmin }; 
