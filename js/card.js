/**
 * Classe responsável pelo gerenciamento dos cards
 */
class CardManager {
    constructor() {
        this.cardModal = new bootstrap.Modal(document.getElementById('cardModal'));
        this.cardModalTitle = document.getElementById('cardModalTitle');
        this.cardIdInput = document.getElementById('cardId');
        this.columnIdInput = document.getElementById('columnId');
        this.cardTitleInput = document.getElementById('cardTitle');
        this.cardDescriptionInput = document.getElementById('cardDescription');
        this.cardDueDateInput = document.getElementById('cardDueDate');
        this.cardPrioritySelect = document.getElementById('cardPriority');
        this.cardAssignedToSelect = document.getElementById('cardAssignedTo');
        this.teamAssignDropdown = document.getElementById('teamAssignDropdown');
        this.saveCardBtn = document.getElementById('saveCardBtn');

        this.setupEventListeners();
        this.loadUserOptions();
    }

    /**
     * Configura os listeners de eventos
     */
    setupEventListeners() {
        // Evento para salvar card
        this.saveCardBtn.addEventListener('click', () => this.saveCard());

        // Delegação de eventos para botões de editar e excluir card
        document.getElementById('board').addEventListener('click', (event) => {
            const target = event.target.closest('.edit-card, .delete-card');
            if (!target) return;

            const cardElement = target.closest('.card');
            if (!cardElement) return;

            const cardId = cardElement.dataset.id;
            const columnElement = cardElement.closest('.column-content');
            const columnId = columnElement.dataset.columnId;

            if (target.classList.contains('edit-card')) {
                this.openCardModal(cardId, columnId);
            } else if (target.classList.contains('delete-card')) {
                this.deleteCard(cardId, columnId, cardElement);
            }
        });

        // Listener para criar evento de atribuir equipe
        document.getElementById('assignTeamBtn').addEventListener('click', () => {
            this.loadTeamOptions();
        });

        // Delegação para seleção de equipe no dropdown
        this.teamAssignDropdown.addEventListener('click', (e) => {
            const teamItem = e.target.closest('.dropdown-item');
            if (!teamItem) return;

            const teamId = teamItem.dataset.teamId;
            if (teamId) {
                this.handleTeamAssignment(teamId);
            }
            e.preventDefault();
        });
    }

    /**
     * Carrega as opções de usuários no select
     */
    loadUserOptions() {
        if (!app.userManager) return;

        const users = app.userManager.getUsers();
        const select = this.cardAssignedToSelect;
        
        // Limpa as opções existentes, exceto a primeira
        while (select.options.length > 1) {
            select.remove(1);
        }
        
        // Adiciona os usuários como opções
        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = user.name;
            select.appendChild(option);
        });
    }

    /**
     * Carrega as opções de equipes no dropdown
     */
    loadTeamOptions() {
        if (!app.userManager) return;

        const teams = app.userManager.getTeams();
        const dropdown = this.teamAssignDropdown;
        
        // Limpa as opções existentes
        dropdown.innerHTML = '';
        
        if (teams.length === 0) {
            dropdown.innerHTML = `
                <li><span class="dropdown-item text-muted">Nenhuma equipe disponível</span></li>
            `;
            return;
        }
        
        // Adiciona as equipes como opções
        teams.forEach(team => {
            const item = document.createElement('li');
            item.innerHTML = `<a class="dropdown-item" href="#" data-team-id="${team.id}">${team.name}</a>`;
            dropdown.appendChild(item);
        });
    }

    /**
     * Manipula a atribuição de uma equipe a um card
     * @param {string} teamId - ID da equipe
     */
    handleTeamAssignment(teamId) {
        if (!app.userManager) return;

        const team = app.userManager.getTeams().find(t => t.id === teamId);
        if (!team || !team.members || team.members.length === 0) {
            return;
        }

        // Seleciona o primeiro membro da equipe como responsável
        const firstMember = team.members[0];
        this.cardAssignedToSelect.value = firstMember;

        // Notifica o usuário
        app.columnManager.showToast(`Card atribuído à equipe "${team.name}"`);
    }

    /**
     * Abre o modal para criar/editar um card
     * @param {string|null} cardId - ID do card (null para criação)
     * @param {string} columnId - ID da coluna
     */
    openCardModal(cardId, columnId) {
        this.resetCardModal();
        this.columnIdInput.value = columnId;
        this.loadUserOptions();

        if (cardId) {
            // Edição de card existente
            const column = storage.getColumns().find(col => col.id === columnId);
            if (!column) return;
            
            const card = column.cards.find(c => c.id === cardId);
            if (!card) return;
            
            this.cardModalTitle.textContent = 'Editar Card';
            this.cardIdInput.value = cardId;
            this.cardTitleInput.value = card.title;
            this.cardDescriptionInput.value = card.description || '';
            this.cardDueDateInput.value = card.dueDate || '';
            this.cardPrioritySelect.value = card.priority || 'baixa';
            this.cardAssignedToSelect.value = card.assignedTo || '';
        } else {
            // Criação de novo card
            this.cardModalTitle.textContent = 'Novo Card';
            this.cardPrioritySelect.value = 'media';
        }
        
        this.cardModal.show();
    }

    /**
     * Limpa os campos do modal de cards
     */
    resetCardModal() {
        this.cardIdInput.value = '';
        this.columnIdInput.value = '';
        this.cardTitleInput.value = '';
        this.cardDescriptionInput.value = '';
        this.cardDueDateInput.value = '';
        this.cardPrioritySelect.value = 'baixa';
        this.cardAssignedToSelect.value = '';
    }

    /**
     * Salva o card atual (criação ou edição)
     */
    saveCard() {
        const cardId = this.cardIdInput.value;
        const columnId = this.columnIdInput.value;
        const title = this.cardTitleInput.value.trim();
        const description = this.cardDescriptionInput.value.trim();
        const dueDate = this.cardDueDateInput.value;
        const priority = this.cardPrioritySelect.value;
        const assignedTo = this.cardAssignedToSelect.value;
        
        if (!title) {
            alert('Por favor, insira um título para o card.');
            return;
        }
        
        const cardData = { 
            title, 
            description, 
            dueDate, 
            priority,
            assignedTo,
            updatedAt: new Date().toISOString()
        };
        
        if (cardId) {
            // Atualizar card existente
            const updatedCard = storage.updateCard(columnId, cardId, cardData);
            if (updatedCard) {
                this.updateCardElement(columnId, updatedCard);
            }
        } else {
            // Criar novo card
            cardData.createdAt = new Date().toISOString();
            cardData.createdBy = app.userManager?.currentUser?.id;
            
            const newCard = storage.addCard(columnId, cardData);
            if (newCard) {
                this.addCardElement(columnId, newCard);
            }
        }
        
        this.cardModal.hide();
    }

    /**
     * Deleta um card
     * @param {string} cardId - ID do card
     * @param {string} columnId - ID da coluna
     * @param {HTMLElement} cardElement - Elemento do card
     */
    deleteCard(cardId, columnId, cardElement) {
        if (confirm('Tem certeza que deseja remover este card?')) {
            const success = storage.removeCard(columnId, cardId);
            if (success && cardElement) {
                cardElement.remove();
                app.board.updateColumnCardCount(columnId);
            }
        }
    }

    /**
     * Adiciona um novo card ao DOM
     * @param {string} columnId - ID da coluna
     * @param {Object} card - Dados do card
     */
    addCardElement(columnId, card) {
        const columnContent = document.querySelector(`.column-content[data-column-id="${columnId}"]`);
        if (!columnContent) return;
        
        const cardElement = app.board.createCardElement(card);
        columnContent.appendChild(cardElement);
        app.board.updateColumnCardCount(columnId);
    }

    /**
     * Atualiza um card existente no DOM
     * @param {string} columnId - ID da coluna
     * @param {Object} card - Dados atualizados do card
     */
    updateCardElement(columnId, card) {
        const cardElement = document.querySelector(`.column-content[data-column-id="${columnId}"] .card[data-id="${card.id}"]`);
        if (!cardElement) return;
        
        const newCardElement = app.board.createCardElement(card);
        cardElement.replaceWith(newCardElement);
    }
}