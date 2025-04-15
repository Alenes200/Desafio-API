const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middlewares/auth.middleware');

// Array para armazenar atividades (em produção, use um banco de dados)
let activities = [];

// Criar atividade (qualquer usuário logado)
router.post('/', verificarToken, (req, res) => {
    try {
        const { title, name, date, description, slots } = req.body;

        // Validações
        if (!title || title.length < 3) {
            return res.status(400).json({ message: 'Título deve ter pelo menos 3 caracteres' });
        }

        if (!name || name.length < 3) {
            return res.status(400).json({ message: 'Nome deve ter pelo menos 3 caracteres' });
        }

        if (!date || new Date(date) < new Date()) {
            return res.status(400).json({ message: 'Data deve ser futura' });
        }

        if (!description || description.length < 10) {
            return res.status(400).json({ message: 'Descrição deve ter pelo menos 10 caracteres' });
        }

        if (!slots || slots < 1) {
            return res.status(400).json({ message: 'Número de vagas deve ser maior que zero' });
        }

        const activity = {
            id: Date.now().toString(),
            title,
            name,
            date,
            description,
            slots,
            createdBy: req.user.email,
            participants: [],
            availableSlots: slots,
            createdAt: new Date()
        };

        activities.push(activity);
        res.status(201).json(activity);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao criar atividade' });
    }
});

// Listar todas as atividades (público)
router.get('/', (req, res) => {
    res.json(activities);
});

// Participar de uma atividade
router.post('/:id/participate', verificarToken, (req, res) => {
    try {
        const activity = activities.find(a => a.id === req.params.id);
        
        if (!activity) {
            return res.status(404).json({ message: 'Atividade não encontrada' });
        }

        // Verificar se já está participando
        if (activity.participants.includes(req.user.email)) {
            return res.status(400).json({ message: 'Você já está participando desta atividade' });
        }

        // Verificar se há vagas disponíveis
        if (activity.availableSlots <= 0) {
            return res.status(400).json({ message: 'Não há vagas disponíveis' });
        }

        // Adicionar participante
        activity.participants.push(req.user.email);
        activity.availableSlots--;

        res.json({ message: 'Participação confirmada com sucesso!' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao participar da atividade' });
    }
});

// Cancelar participação
router.delete('/:id/participate', verificarToken, (req, res) => {
    try {
        const activity = activities.find(a => a.id === req.params.id);
        
        if (!activity) {
            return res.status(404).json({ message: 'Atividade não encontrada' });
        }

        const participantIndex = activity.participants.indexOf(req.user.email);
        if (participantIndex === -1) {
            return res.status(400).json({ message: 'Você não está participando desta atividade' });
        }

        // Remover participante
        activity.participants.splice(participantIndex, 1);
        activity.availableSlots++;

        res.json({ message: 'Participação cancelada com sucesso!' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao cancelar participação' });
    };
});

// Editar atividade (apenas criador)
router.put('/:id', verificarToken, (req, res) => {
    try {
        const activityIndex = activities.findIndex(a => a.id === req.params.id);
        
        if (activityIndex === -1) {
            return res.status(404).json({ message: 'Atividade não encontrada' });
        }

        // Verificar se é o criador da atividade
        if (activities[activityIndex].createdBy !== req.user.email) {
            return res.status(403).json({ message: 'Apenas o criador pode editar a atividade' });
        }

        const { title, name, date, description, slots } = req.body;

        // Validações
        if (title && title.length < 3) {
            return res.status(400).json({ message: 'Título inválido' });
        }

        if (name && name.length < 3) {
            return res.status(400).json({ message: 'Nome inválido' });
        }

        if (date && new Date(date) < new Date()) {
            return res.status(400).json({ message: 'Data inválida' });
        }

        if (description && description.length < 10) {
            return res.status(400).json({ message: 'Descrição inválida' });
        }

        if (slots && slots < activities[activityIndex].participants.length) {
            return res.status(400).json({ message: 'Número de vagas não pode ser menor que o número de participantes' });
        }

        // Atualizar atividade
        activities[activityIndex] = {
            ...activities[activityIndex],
            title: title || activities[activityIndex].title,
            name: name || activities[activityIndex].name,
            date: date || activities[activityIndex].date,
            description: description || activities[activityIndex].description,
            slots: slots || activities[activityIndex].slots,
            availableSlots: (slots || activities[activityIndex].slots) - activities[activityIndex].participants.length
        };

        res.json(activities[activityIndex]);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao editar atividade' });
    }
});

// Nova rota para buscar atividades do usuário
router.get('/minhas-atividades', verificarToken, (req, res) => {
    try {
        const userActivities = activities.filter(activity => 
            activity.createdBy === req.user.email || 
            activity.participants.includes(req.user.email)
        );
        res.json(userActivities);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar atividades' });
    }
});

// Nova rota para deletar atividade
router.delete('/:id', verificarToken, (req, res) => {
    try {
        const index = activities.findIndex(a => a.id === req.params.id);
        
        if (index === -1) {
            return res.status(404).json({ message: 'Atividade não encontrada' });
        }

        if (activities[index].createdBy !== req.user.email) {
            return res.status(403).json({ message: 'Apenas o criador pode deletar a atividade' });
        }

        activities.splice(index, 1);
        res.json({ message: 'Atividade deletada com sucesso' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao deletar atividade' });
    }
});

module.exports = router;
