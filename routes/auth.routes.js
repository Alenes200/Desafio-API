const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = express.Router();

// Array para armazenar usuários (simulando um banco de dados)
let users = [];

// Criar usuário admin padrão se não existir
const adminUser = {
    email: "admin@email.com",
    password: bcrypt.hashSync("admin123", 10),
    role: "admin"
};

users.push(adminUser);

// Rota de registro
router.post("/register", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Verificar se usuário já existe
        const userExists = users.find(user => user.email === email);
        if (userExists) {
            return res.status(400).json({ message: "Usuário já existe!" });
        }

        // Criar novo usuário
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = {
            email,
            password: hashedPassword,
            role: "user"
        };

        users.push(newUser);
        console.log("Usuários registrados:", users); // Log para debug

        res.status(201).json({ message: "Usuário criado com sucesso!" });
    } catch (error) {
        console.error("Erro no registro:", error); // Log para debug
        res.status(500).json({ message: "Erro ao criar usuário" });
    }
});

// Rota de login
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log("Tentativa de login para:", email); // Log para debug
        console.log("Usuários disponíveis:", users); // Log para debug

        // Encontrar usuário
        const user = users.find(u => u.email === email);
        if (!user) {
            return res.status(401).json({ message: "Email ou senha incorretos" });
        }

        // Verificar senha
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ message: "Email ou senha incorretos" });
        }

        // Gerar token
        const token = jwt.sign(
            { email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.json({
            message: "Login realizado com sucesso!",
            token,
            user: {
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error("Erro no login:", error); // Log para debug
        res.status(500).json({ message: "Erro ao fazer login" });
    }
});

module.exports = router;
