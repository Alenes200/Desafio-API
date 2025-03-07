const express = require("express");
const { verificarToken } = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/dashboard", verificarToken, (req, res) => {
  res.json({ message: "Bem-vindo ao dashboard protegido!" });
});

module.exports = router;