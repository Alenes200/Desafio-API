const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const router = express.Router();

// Banco de dados simulado com admin e user fixos
const users = [
  {
    email: "admin@email.com",
    password: bcrypt.hashSync("admin123", 10), // Senha já criptografada
    role: "admin",
  },
  {
    email: "user@email.com",
    password: bcrypt.hashSync("user123", 10), // Senha já criptografada
    role: "user",
  },
];

// Login de usuário
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = users.find((u) => u.email === email);

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: "Credenciais inválidas!" });
  }

  // Criar o token JWT com o 'role'
  const token = jwt.sign({ email, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });

  res.json({ token, role: user.role });
});

module.exports = router;
