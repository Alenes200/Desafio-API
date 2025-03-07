require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes.js");
const protectedRoutes = require("./routes/protected.routes.js");

const app = express();

app.use(express.json());
app.use(morgan("dev"));
app.use(cors());

// Servir arquivos estáticos da pasta public
app.use(express.static("public"));

// Rotas da API
app.use("/auth", authRoutes);
app.use("/protected", protectedRoutes);

// Rota para carregar a página inicial
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

const activityRoutes = require("./routes/activities.routes");
app.use("/activities", activityRoutes);


// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
