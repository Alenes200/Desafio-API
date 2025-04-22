if (typeof API_URL === 'undefined') {
    const API_URL = 'http://localhost:3000';
}
const userEmail = localStorage.getItem('userEmail');
const token = localStorage.getItem('token');

// Verify login
if (!token || !userEmail) {
    window.location.href = '/index.html';
}

// Função para mostrar mensagens
function showMessage(message, isError = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isError ? 'error' : 'success'}`;
    messageDiv.textContent = message;
    document.querySelector('.container').insertBefore(messageDiv, document.querySelector('#activities-list'));
    setTimeout(() => messageDiv.remove(), 5000);
}

// Função para carregar atividades
async function loadActivities() {
    try {
        const response = await fetch('/activities');
        if (!response.ok) {
            throw new Error('Erro ao carregar atividades');
        }

        const activities = await response.json();
        const activitiesList = document.getElementById('activities-list');
        activitiesList.innerHTML = '<h2>Atividades Disponíveis</h2>';

        activities.forEach(activity => {
            const activityDiv = document.createElement('div');
            activityDiv.className = 'activity-card';
            activityDiv.setAttribute('data-activity-id', activity.id);

            const isCreator = activity.createdBy === userEmail;
            const isParticipating = activity.participants.includes(userEmail);
            const hasAvailableSlots = activity.availableSlots > 0;

            activityDiv.innerHTML = `
                <div class="activity-data">
                    <h3>${activity.title || 'Sem título'}</h3>
                    <p><strong>Organizador:</strong> ${activity.name || 'Não informado'}</p>
                    <p><strong>Data:</strong> ${activity.date ? new Date(activity.date).toLocaleString() : 'Não definida'}</p>
                    <p><strong>Descrição:</strong> ${activity.description || 'Sem descrição'}</p>
                    <p><strong>Vagas:</strong> ${activity.availableSlots || 0}/${activity.slots || 0}</p>
                    <div class="activity-actions">
                        ${isCreator ? `
                            <button onclick="editActivity('${activity.id}')" class="btn btn-edit">Editar</button>
                            <button onclick="deleteActivity('${activity.id}')" class="btn btn-delete">Excluir</button>
                        ` : ''}
                        ${isParticipating ? `
                            <button onclick="cancelParticipation('${activity.id}')" class="btn btn-cancel">Cancelar Participação</button>
                        ` : hasAvailableSlots ? `
                            <button onclick="participateInActivity('${activity.id}')" class="btn btn-participate">Participar</button>
                        ` : `
                            <button disabled class="btn btn-disabled">Sem vagas</button>
                        `}
                    </div>
                </div>
                ${isCreator ? `
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

// Função para criar atividade
async function createActivity(event) {
    event.preventDefault();
    
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/';
            return;
        }

        const activityData = {
            title: document.getElementById('title').value,
            name: document.getElementById('name').value,
            date: document.getElementById('date').value,
            description: document.getElementById('description').value,
            slots: parseInt(document.getElementById('slots').value)
        };

        const response = await fetch('/activities', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(activityData)
        });

        if (response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/';
            return;
        }

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Erro ao criar atividade');
        }

        showMessage('Atividade criada com sucesso!');
        document.getElementById('createActivityForm').reset();
        await loadActivities();
    } catch (error) {
        console.error('Erro ao criar atividade:', error);
        showMessage(error.message || 'Erro ao criar atividade. Por favor, tente novamente.', true);
    }
}

// Função para deletar atividade
async function deleteActivity(id) {
    if (!confirm('Tem certeza que deseja excluir esta atividade?')) return;

    try {
        // Remover o prefixo 'activity:' se já estiver presente
        const activityId = id.replace('activity:', '');
        console.log(`Tentando excluir atividade com ID: ${activityId}`);
        
        const response = await fetch(`/activities/${activityId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Erro ao deletar atividade');
        }

        showMessage('Atividade excluída com sucesso!');
        await loadActivities();
    } catch (error) {
        console.error('Erro ao deletar:', error);
        showMessage(error.message || 'Erro ao excluir atividade', true);
    }
}

// Função para participar de uma atividade
async function participateInActivity(activityId) {
    try {
        // Remover o prefixo 'activity:' se já estiver presente
        const id = activityId.replace('activity:', '');
        
        const response = await fetch(`/activities/${id}/participate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: userEmail || prompt('Digite seu email para participar:')
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Erro ao participar da atividade');
        }

        showMessage('Participação confirmada com sucesso!');
        await loadActivities();
    } catch (error) {
        console.error('Erro:', error);
        showMessage(error.message || 'Erro ao participar da atividade', true);
    }
}

// Função para cancelar participação
async function cancelParticipation(activityId) {
    if (!confirm('Tem certeza que deseja cancelar sua participação?')) return;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/activities/${activityId}/participate`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Erro ao cancelar participação');
        }

        showMessage('Participação cancelada com sucesso!');
        await loadActivities(); // Recarrega a lista
    } catch (error) {
        console.error('Erro:', error);
        showMessage(error.message || 'Erro ao cancelar participação', true);
    }
}

// Função para editar atividade
async function editActivity(activityId) {
    const activityCard = document.querySelector(`[data-activity-id="${activityId}"]`);
    if (!activityCard) {
        console.error('Cartão da atividade não encontrado');
        return;
    }

    const activityData = activityCard.querySelector('.activity-data');
    const editForm = activityCard.querySelector('.edit-form');

    if (!activityData || !editForm) {
        console.error('Elementos da atividade não encontrados');
        return;
    }

    if (editForm.style.display === 'block') {
        editForm.style.display = 'none';
        activityData.style.display = 'block';
    } else {
        activityData.style.display = 'none';
        editForm.style.display = 'block';
    }
}

// Função para salvar edição
async function saveEdit(activityId, event) {
    event.preventDefault();
    const form = event.target;

    try {
        const token = localStorage.getItem('token');
        const updatedData = {
            title: form.querySelector('#edit-title').value,
            name: form.querySelector('#edit-name').value,
            date: form.querySelector('#edit-date').value,
            description: form.querySelector('#edit-description').value,
            slots: parseInt(form.querySelector('#edit-slots').value)
        };

        const response = await fetch(`/activities/${activityId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Erro ao atualizar atividade');
        }

        showMessage('Atividade atualizada com sucesso!');
        await loadActivities(); // Recarrega a lista
    } catch (error) {
        console.error('Erro:', error);
        showMessage(error.message || 'Erro ao atualizar atividade', true);
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    loadActivities();
    document.getElementById('createActivityForm').addEventListener('submit', createActivity);
});
