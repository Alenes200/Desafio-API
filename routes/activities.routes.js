const express = require('express');
const router = express.Router();
const dbService = require('../services/db.service');
const { verificarToken } = require('../middlewares/auth.middleware');

// Listar atividades (acessível a todos)
router.get('/', async (req, res) => {
    try {
        const activities = await dbService.getAll('activity:');
        const formattedActivities = activities
            .filter(item => item.value && typeof item.value === 'object')
            .map(item => item.value);
            
        res.json(formattedActivities);
    } catch (error) {
        console.error('Erro ao listar atividades:', error);
        res.status(500).json({ message: 'Erro ao listar atividades' });
    }
});

// Corrigir a rota GET para atividade específica
router.get('/:id', async (req, res) => {
    try {
        const activityId = req.params.id.startsWith('activity:') ? req.params.id : `activity:${req.params.id}`;
        console.log('Buscando atividade com ID:', activityId);
        const activity = await dbService.get(activityId);
        
        if (!activity) {
            console.log('Atividade não encontrada:', activityId);
            return res.status(404).json({ message: 'Atividade não encontrada' });
        }
        res.json(activity);
    } catch (error) {
        console.error('Erro ao buscar atividade:', error);
        res.status(500).json({ message: 'Erro ao buscar atividade' });
    }
});

// Criar atividade (apenas usuários autenticados)
router.post('/', verificarToken, async (req, res) => {
    try {
        const { title, name, date, description, slots } = req.body;
        const id = `activity:${Date.now()}`;
        
        const newActivity = {
            id,
            title,
            name,
            date,
            description,
            slots,
            availableSlots: slots,
            participants: [],
            createdBy: req.user.email,
            createdAt: new Date().toISOString()
        };

        await dbService.put(id, newActivity);
        res.status(201).json({ 
            message: 'Atividade criada com sucesso',
            activity: newActivity 
        });
    } catch (error) {
        console.error('Erro ao criar atividade:', error);
        res.status(500).json({ message: 'Erro ao criar atividade' });
    }
});

// Participar de uma atividade (acessível a todos)
router.post('/:id/participate', async (req, res) => {
    try {
        const activityId = req.params.id.startsWith('activity:') ? req.params.id : `activity:${req.params.id}`;
        const activity = await dbService.get(activityId);
        
        if (!activity) {
            return res.status(404).json({ message: 'Atividade não encontrada' });
        }

        // Usar o email fornecido no corpo da requisição
        const userEmail = req.body.email;
        if (!userEmail) {
            return res.status(400).json({ message: 'Email é obrigatório para participar' });
        }

        if (activity.participants.includes(userEmail)) {
            return res.status(400).json({ message: 'Você já está participando desta atividade' });
        }

        if (activity.availableSlots <= 0) {
            return res.status(400).json({ message: 'Não há vagas disponíveis' });
        }

        activity.participants.push(userEmail);
        activity.availableSlots--;

        await dbService.put(activityId, activity);
        res.json({ message: 'Participação confirmada com sucesso!' });
    } catch (error) {
        console.error('Erro ao participar da atividade:', error);
        res.status(500).json({ message: 'Erro ao participar da atividade' });
    }
});

// Cancelar participação
router.delete('/:id/participate', async (req, res) => {
    try {
        const activity = await dbService.get(`activity:${req.params.id}`);
        
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

        await dbService.put(`activity:${activity.id}`, activity);
        res.json({ message: 'Participação cancelada com sucesso!' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao cancelar participação' });
    };
});

// Editar atividade (apenas criador)
router.put('/:id', verificarToken, async (req, res) => {
    try {
        const activity = await dbService.get(`activity:${req.params.id}`);
        
        if (!activity) {
            return res.status(404).json({ message: 'Atividade não encontrada' });
        }

        if (activity.createdBy !== req.user.email) {
            return res.status(403).json({ message: 'Apenas o criador pode editar a atividade' });
        }

        const { title, name, date, description, slots } = req.body;

        if (slots && slots < activity.participants.length) {
            return res.status(400).json({ message: 'Número de vagas não pode ser menor que o número de participantes' });
        }

        const updatedActivity = {
            ...activity,
            title: title || activity.title,
            name: name || activity.name,
            date: date || activity.date,
            description: description || activity.description,
            slots: slots || activity.slots,
            availableSlots: (slots || activity.slots) - activity.participants.length
        };

        await dbService.put(`activity:${updatedActivity.id}`, updatedActivity);
        res.json(updatedActivity);
    } catch (error) {
        console.error('Erro ao editar atividade:', error);
        res.status(500).json({ message: 'Erro ao editar atividade' });
    }
});

// Nova rota para buscar atividades do usuário
router.get('/minhas-atividades', async (req, res) => {
    try {
        const activities = await dbService.getAll('activity:');
        const userActivities = activities.filter(activity => 
            activity.value.createdBy === req.user.email || 
            activity.value.participants.includes(req.user.email)
        ).map(a => a.value);
        res.json(userActivities);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar atividades' });
    }
});

// Corrigir a rota DELETE
router.delete('/:id', verificarToken, async (req, res) => {
    try {
        const activityId = req.params.id.startsWith('activity:') ? req.params.id : `activity:${req.params.id}`;
        console.log(`Tentando excluir atividade com ID: ${activityId} por usuário: ${req.user.email}`);
        
        const activity = await dbService.get(activityId);
        
        if (!activity) {
            console.error(`Atividade com ID ${activityId} não encontrada no banco de dados.`);
            return res.status(404).json({ message: 'Atividade não encontrada' });
        }

        if (activity.createdBy !== req.user.email) {
            console.error(`Usuário ${req.user.email} não tem permissão para excluir a atividade ${activityId}.`);
            return res.status(403).json({ message: 'Apenas o criador pode excluir a atividade' });
        }

        await dbService.del(activityId);
        console.log(`Atividade com ID ${activityId} excluída com sucesso.`);
        res.json({ message: 'Atividade deletada com sucesso' });
    } catch (error) {
        console.error('Erro ao deletar atividade:', error);
        res.status(500).json({ message: 'Erro ao deletar atividade' });
    }
});

// Função para carregar atividades
async function loadActivities() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/index.html';
            return;
        }

        const response = await fetch('/activities', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao carregar atividades');
        }

        const activities = await response.json();
        const activitiesList = document.getElementById('activities-list');
        activitiesList.innerHTML = '<h2>Atividades Disponíveis</h2>';

        if (activities.length === 0) {
            activitiesList.innerHTML += '<p class="no-activities">Nenhuma atividade disponível.</p>';
            return;
        }

        activities.forEach(activity => {
            const activityDiv = document.createElement('div');
            activityDiv.className = 'activity-card';
            activityDiv.setAttribute('data-activity-id', activity.id);
            
            const userEmail = localStorage.getItem('userEmail');
            const isParticipating = activity.participants && activity.participants.includes(userEmail);
            const hasAvailableSlots = activity.availableSlots > 0;
            
            activityDiv.innerHTML = `
                <div class="activity-data">
                    <h3>${activity.title || 'Sem título'}</h3>
                    <p><strong>Organizador:</strong> ${activity.name || 'Não informado'}</p>
                    <p><strong>Data:</strong> ${activity.date ? new Date(activity.date).toLocaleString() : 'Não definida'}</p>
                    <p><strong>Descrição:</strong> ${activity.description || 'Sem descrição'}</p>
                    <p><strong>Vagas:</strong> ${activity.availableSlots || 0}/${activity.slots || 0}</p>
                    <div class="activity-actions">
                        ${activity.createdBy === userEmail ? `
                            <button onclick="editActivity('${activity.id}')" class="btn btn-edit">Editar</button>
                            <button onclick="deleteActivity('${activity.id}')" class="btn btn-delete">Excluir</button>
                        ` : isParticipating ? `
                            <button onclick="cancelParticipation('${activity.id}')" class="btn btn-cancel">Cancelar Participação</button>
                        ` : hasAvailableSlots ? `
                            <button onclick="participateInActivity('${activity.id}')" class="btn btn-participate">Participar</button>
                        ` : `
                            <button disabled class="btn btn-disabled">Sem vagas</button>
                        `}
                    </div>
                </div>
                ${activity.createdBy === userEmail ? `
                    <form class="edit-form" style="display: none;" onsubmit="saveEdit('${activity.id}', event)">
                        <div class="form-group">
                            <label for="edit-title-${activity.id}">Título:</label>
                            <input type="text" id="edit-title-${activity.id}" value="${activity.title || ''}" required minlength="3">
                        </div>
                        <div class="form-group">
                            <label for="edit-name-${activity.id}">Organizador:</label>
                            <input type="text" id="edit-name-${activity.id}" value="${activity.name || ''}" required minlength="3">
                        </div>
                        <div class="form-group">
                            <label for="edit-date-${activity.id}">Data:</label>
                            <input type="datetime-local" id="edit-date-${activity.id}" value="${activity.date ? activity.date.slice(0, 16) : ''}" required>
                        </div>
                        <div class="form-group">
                            <label for="edit-description-${activity.id}">Descrição:</label>
                            <textarea id="edit-description-${activity.id}" required minlength="10">${activity.description || ''}</textarea>
                        </div>
                        <div class="form-group">
                            <label for="edit-slots-${activity.id}">Vagas:</label>
                            <input type="number" id="edit-slots-${activity.id}" value="${activity.slots || 1}" required min="1">
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">Salvar</button>
                            <button type="button" class="btn btn-secondary" onclick="editActivity('${activity.id}')">Cancelar</button>
                        </div>
                    </form>
                ` : ''}
            `;
            activitiesList.appendChild(activityDiv);
        });
    } catch (error) {
        console.error('Erro:', error);
        showMessage('Erro ao carregar atividades', true);
    }
}

module.exports = router;


