const express = require("express");
const router = express.Router();
const { verificarToken, verificarAdmin } = require("../middlewares/auth.middleware");

let atividades = []; // Simulação de banco de dados

// Listar todas as atividades (público)
router.get("/", (req, res) => {
    res.json(atividades);
});

// Criar uma nova atividade (somente admin)
router.post("/", verificarToken, verificarAdmin, (req, res) => {
    const { titulo, descricao, vagas, data } = req.body;
    const novaAtividade = { id: atividades.length + 1, titulo, descricao, vagas, data, inscritos: [] };
    atividades.push(novaAtividade);
    res.json({ message: "Atividade criada com sucesso!", atividade: novaAtividade });
});

// Editar atividade (somente admin)
router.put("/:id", verificarToken, verificarAdmin, (req, res) => {
    const { id } = req.params;
    const { titulo, descricao, vagas, data } = req.body;
    const atividade = atividades.find(a => a.id == id);
    if (!atividade) return res.status(404).json({ message: "Atividade não encontrada!" });

    atividade.titulo = titulo;
    atividade.descricao = descricao;
    atividade.vagas = vagas;
    atividade.data = data;
    
    res.json({ message: "Atividade atualizada com sucesso!", atividade });
});

// Excluir atividade (somente admin)
router.delete("/:id", verificarToken, verificarAdmin, (req, res) => {
    const { id } = req.params;
    atividades = atividades.filter(a => a.id != id);
    res.json({ message: "Atividade excluída com sucesso!" });
});

// Inscrever usuário em uma atividade
router.post("/:id/inscrever", verificarToken, (req, res) => {
    const { id } = req.params;
    const { usuario } = req.body;
    const atividade = atividades.find(a => a.id == id);

    if (!atividade) return res.status(404).json({ message: "Atividade não encontrada!" });
    if (atividade.inscritos.includes(usuario)) return res.status(400).json({ message: "Você já está inscrito!" });
    if (atividade.inscritos.length >= atividade.vagas) return res.status(400).json({ message: "Vagas esgotadas!" });

    atividade.inscritos.push(usuario);
    res.json({ message: "Inscrição realizada com sucesso!" });
});

// Cancelar inscrição
router.post("/:id/cancelar", verificarToken, (req, res) => {
    const { id } = req.params;
    const { usuario } = req.body;
    const atividade = atividades.find(a => a.id == id);

    if (!atividade) return res.status(404).json({ message: "Atividade não encontrada!" });
    atividade.inscritos = atividade.inscritos.filter(u => u !== usuario);

    res.json({ message: "Inscrição cancelada com sucesso!" });
});

// Listar atividades do usuário
router.get("/minhas", verificarToken, (req, res) => {
    const { usuario } = req.query;
    const minhasAtividades = atividades.filter(a => a.inscritos.includes(usuario));
    res.json(minhasAtividades);
});

// Listar inscritos em uma atividade (somente admin)
router.get("/:id/inscritos", verificarToken, verificarAdmin, (req, res) => {
    const { id } = req.params;
    const atividade = atividades.find(a => a.id == id);
    if (!atividade) return res.status(404).json({ message: "Atividade não encontrada!" });

    res.json({ inscritos: atividade.inscritos });
});

module.exports = router;
