require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const path = require("path");
const fs = require('fs');
const dbService = require('./services/db.service');

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)){
    fs.mkdirSync(dataDir);
}

const { router: authRoutes, initAdminUser } = require("./routes/auth.routes.js");
const protectedRoutes = require("./routes/protected.routes.js");
const activityRoutes = require("./routes/activities.routes.js");

const app = express();

app.use(express.json()); // Já existente, mas necessário para processar req.body
app.use(morgan("dev"));
app.use(cors());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use("/auth", authRoutes); // Use apenas o router
app.use("/protected", protectedRoutes);
app.use("/activities", activityRoutes);

// Main page route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Inicializa o banco antes de iniciar o servidor
async function startServer() {
    try {
        await dbService.open();
        console.log('Database connected successfully');
        
        // Inicializa o usuário admin após a conexão
        await initAdminUser();
        
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to connect to database:', error);
        process.exit(1);
    }
}

startServer();

// Gerenciamento de encerramento gracioso
process.on('SIGINT', async () => {
    try {
        await dbService.close();
        console.log('Database connection closed');
        process.exit(0);
    } catch (error) {
        console.error('Error closing database:', error);
        process.exit(1);
    }
});
