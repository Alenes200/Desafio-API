const express = require('express');
const router = express.Router();
const dbService = require('../services/db.service');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Move a inicialização do admin para uma função exportada
async function initAdminUser() {
    try {
        const adminExists = await dbService.get('admin');
        if (!adminExists) {
            const hashedPassword = await bcrypt.hash('admin', 10);
            await dbService.put('admin', {
                username: 'admin',
                password: hashedPassword,
                role: 'admin'
            });
            console.log('Usuário admin criado com sucesso');
        }
    } catch (error) {
        console.error('Erro ao criar usuário admin:', error);
    }
}

// Rota de registro
router.post("/register", async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ message: "Email e senha são obrigatórios" });
        }

        // Simplifica a verificação de existência do usuário
        const userKey = `user:${email}`;
        let userExists = false;
        
        try {
            const user = await dbService.get(userKey);
            userExists = user !== null;
        } catch (err) {
            // Ignora erros NotFound
            if (!err.message.includes('NotFound')) {
                console.error('Erro ao verificar usuário:', err);
                return res.status(500).json({ message: "Erro ao verificar usuário" });
            }
        }
        
        if (userExists) {
            return res.status(400).json({ message: "Usuário já existe!" });
        }

        // Cria novo usuário
        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const userData = {
                email,
                password: hashedPassword,
                role: "user",
                criadoEm: new Date().toISOString()
            };

            await dbService.put(userKey, userData);
            console.log('Usuário registrado:', email);
            
            res.status(201).json({ 
                message: "Usuário criado com sucesso!",
                email: email
            });
        } catch (error) {
            console.error("Erro ao salvar usuário:", error);
            res.status(500).json({ message: "Erro ao criar usuário" });
        }
    } catch (error) {
        console.error("Erro no registro:", error);
        res.status(500).json({ message: "Erro interno do servidor" });
    }
});

// Login route
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await dbService.get(`user:${email}`);

        if (!user) {
            return res.status(401).json({ message: "Email ou senha incorretos" });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ message: "Email ou senha incorretos" });
        }

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
        console.error("Erro no login:", error);
        res.status(500).json({ message: "Erro ao fazer login" });
    }
});

module.exports = { router, initAdminUser };
