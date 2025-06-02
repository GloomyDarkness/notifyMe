/**
 * Classe responsável pelo gerenciamento do quadro principal
 */
class Board {
    constructor() {
        this.boardElement = document.getElementById('board');
        this.columnModal = new bootstrap.Modal(document.getElementById('columnModal'));
        this.addColumnBtn = document.getElementById('addColumnBtn');
        this.saveColumnBtn = document.getElementById('saveColumnBtn');
        this.columnTitleInput = document.getElementById('columnTitle');
        this.columnTypeSelect = document.getElementById('columnType');
        
        this.setupEventListeners();
        this.render();
    }

    /**
     * Configura os listeners de eventos
     */
    setupEventListeners() {
        // Listener para abrir o modal de adicionar coluna
        this.addColumnBtn.addEventListener('click', () => {
            this.columnTitleInput.value = '';
            this.columnTypeSelect.value = 'normal';
            this.columnModal.show();
        });

        // Listener para salvar coluna
        this.saveColumnBtn.addEventListener('click', () => {
            const title = this.columnTitleInput.value.trim();
            const type = this.columnTypeSelect.value;
            
            if (!title) {
                alert('Por favor, insira um título para a coluna.');
                return;
            }
            
            const newColumn = storage.addColumn({ title, type });
            this.renderColumn(newColumn);
            this.columnModal.hide();
        });

        // Listener para tecla Enter no título da coluna
        this.columnTitleInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                this.saveColumnBtn.click();
            }
        });

        // Listener para filtrar cards por texto
        document.addEventListener('keydown', (e) => {
            // Ctrl+F ou Cmd+F (Mac)
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                const searchTerm = prompt('Digite um termo para filtrar os cards:');
                if (searchTerm) {
                    this.filterCards(searchTerm);
                }
            }
        });
    }

    /**
     * Filtra os cards com base em um termo de busca
     * @param {string} searchTerm - Termo de busca
     */
    filterCards(searchTerm) {
        if (!searchTerm) {
            // Limpa o filtro
            document.querySelectorAll('.card').forEach(card => {
                card.style.display = '';
                card.classList.remove('search-highlight');
            });
            return;
        }

        const term = searchTerm.toLowerCase();
        const cards = document.querySelectorAll('.card');
        let foundCount = 0;

        cards.forEach(card => {
            const title = card.querySelector('.card-title').textContent.toLowerCase();
            const description = card.querySelector('.card-description') ? 
                card.querySelector('.card-description').textContent.toLowerCase() : '';
            
            if (title.includes(term) || description.includes(term)) {
                card.style.display = '';
                card.classList.add('search-highlight');
                foundCount++;
            } else {
                card.style.display = 'none';
                card.classList.remove('search-highlight');
            }
        });

        const message = foundCount > 0 ? 
            `Encontrados ${foundCount} cards contendo "${searchTerm}"` : 
            `Nenhum card encontrado com o termo "${searchTerm}"`;
        
        app.columnManager.showToast(message);
    }

    /**
     * Renderiza o quadro completo
     */
    render() {
        this.boardElement.innerHTML = '';
        const columns = storage.getColumns();
        
        if (columns.length === 0) {
            this.renderEmptyState();
            return;
        }
        
        columns.forEach(column => {
            this.renderColumn(column);
        });
    }

    /**
     * Renderiza um estado vazio quando não há colunas
     */
    renderEmptyState() {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
            <i class="fas fa-clipboard"></i>
            <h3>Sem colunas ainda</h3>
            <p>Clique no botão "Nova Coluna" para começar.</p>
        `;
        this.boardElement.appendChild(emptyState);
    }

    /**
     * Renderiza uma coluna específica
     * @param {Object} column - Dados da coluna
     */
    renderColumn(column) {
        const columnElement = document.createElement('div');
        columnElement.className = `column ${column.type}`;
        columnElement.dataset.id = column.id;
        
        const cardCount = column.cards.length;
        const countBadge = cardCount > 0 ? 
            `<span class="badge-count">${cardCount}</span>` : '';
        
        columnElement.innerHTML = `
            <div class="column-header">
                <h3 class="column-title">${column.title} ${countBadge}</h3>
                <div class="column-actions">
                    <button class="btn btn-sm btn-outline-secondary edit-column" title="Editar coluna">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-secondary add-card" title="Adicionar card">
                        <i class="fas fa-plus"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger delete-column" title="Remover coluna">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="column-content" data-column-id="${column.id}"></div>
            <button class="add-card-btn">
                <i class="fas fa-plus"></i> Adicionar Card
            </button>
        `;
        
        this.boardElement.appendChild(columnElement);
        
        // Obtém o elemento de conteúdo da coluna para adicionar os cards
        const columnContent = columnElement.querySelector('.column-content');
        
        // Renderiza os cards
        column.cards.forEach(card => {
            const cardElement = this.createCardElement(card);
            columnContent.appendChild(cardElement);
        });
        
        // Configura listeners de eventos para a coluna
        this.setupColumnEventListeners(columnElement, column);
        
        // Configura o Sortable para permitir arrastar cards dentro da coluna
        this.setupColumnSortable(columnContent, column);
    }

    /**
     * Cria o elemento HTML para um card
     * @param {Object} card - Dados do card
     * @returns {HTMLElement} Elemento do card
     */
    createCardElement(card) {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        cardElement.dataset.id = card.id;
        cardElement.dataset.priority = card.priority || 'baixa';
        
        let dueDateDisplay = '';
        if (card.dueDate) {
            const dueDate = new Date(card.dueDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const isOverdue = dueDate < today;
            const isDueSoon = !isOverdue && dueDate <= new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
            
            const dueDateFormatted = this.formatDate(card.dueDate);
            
            dueDateDisplay = `
                <div class="card-due-date ${isOverdue ? 'text-danger' : (isDueSoon ? 'text-warning' : '')}">
                    <i class="fas ${isOverdue ? 'fa-exclamation-circle' : 'fa-calendar-alt'}"></i> ${dueDateFormatted}
                </div>
            `;
        }
        
        // Obtém informações do usuário atribuído
        let assignedToDisplay = '';
        if (card.assignedTo && app.userManager) {
            const assignedUser = app.userManager.getUserById(card.assignedTo);
            if (assignedUser) {
                assignedToDisplay = `
                    <div class="card-assigned-to">
                        ${app.userManager.renderUserAvatar(assignedUser, 'sm')}
                        <span>${assignedUser.name}</span>
                    </div>
                `;
            }
        }
        
        cardElement.innerHTML = `
            <div class="card-title">
                ${card.title}
                <div class="card-actions">
                    <button class="btn btn-sm btn-link edit-card" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-link delete-card" title="Remover">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            ${dueDateDisplay}
            ${card.description ? `<div class="card-description">${card.description.replace(/\n/g, '<br>')}</div>` : ''}
            <div class="card-footer">
                ${card.priority ? `<span class="card-priority priority-${card.priority}">${this.getPriorityLabel(card.priority)}</span>` : ''}
                ${assignedToDisplay}
            </div>
        `;
        
        // Adiciona double-click para editar
        cardElement.addEventListener('dblclick', () => {
            const columnId = cardElement.closest('.column-content').dataset.columnId;
            app.cardManager.openCardModal(card.id, columnId);
        });
        
        return cardElement;
    }

    /**
     * Configura os eventos para uma coluna
     * @param {HTMLElement} columnElement - Elemento da coluna
     * @param {Object} column - Dados da coluna
     */
    setupColumnEventListeners(columnElement, column) {
        // Botão de adicionar card (cabeçalho)
        const addCardBtn = columnElement.querySelector('.add-card');
        addCardBtn.addEventListener('click', () => {
            app.cardManager.openCardModal(null, column.id);
        });
        
        // Botão de adicionar card (rodapé)
        const addCardBtnBottom = columnElement.querySelector('.add-card-btn');
        addCardBtnBottom.addEventListener('click', () => {
            app.cardManager.openCardModal(null, column.id);
        });
        
        // Botão de editar coluna
        const editColumnBtn = columnElement.querySelector('.edit-column');
        editColumnBtn.addEventListener('click', () => {
            this.editColumn(column);
        });
        
        // Botão de remover coluna
        const deleteColumnBtn = columnElement.querySelector('.delete-column');
        deleteColumnBtn.addEventListener('click', () => {
            if (confirm(`Tem certeza que deseja remover a coluna "${column.title}" e todos seus cards?`)) {
                storage.removeColumn(column.id);
                columnElement.remove();
                
                // Verifica se não há mais colunas e mostra o estado vazio
                if (storage.getColumns().length === 0) {
                    this.renderEmptyState();
                }
            }
        });
    }

    /**
     * Abre o modal para editar uma coluna
     * @param {Object} column - Dados da coluna
     */
    editColumn(column) {
        this.columnTitleInput.value = column.title;
        this.columnTypeSelect.value = column.type;
        
        // Substitui o evento de click do botão salvar
        const oldClickHandler = this.saveColumnBtn.onclick;
        this.saveColumnBtn.onclick = () => {
            const title = this.columnTitleInput.value.trim();
            const type = this.columnTypeSelect.value;
            
            if (!title) {
                alert('Por favor, insira um título para a coluna.');
                return;
            }
            
            // Atualiza a coluna
            const updatedColumn = storage.updateColumn(column.id, { title, type });
            
            // Atualiza na interface
            const columnElement = document.querySelector(`.column[data-id="${column.id}"]`);
            if (columnElement) {
                columnElement.className = `column ${type}`;
                columnElement.querySelector('.column-title').innerHTML = 
                    `${title} <span class="badge-count">${column.cards.length}</span>`;
            }
            
            this.columnModal.hide();
            
            // Restaura o evento original
            this.saveColumnBtn.onclick = oldClickHandler;
        };
        
        this.columnModal.show();
    }

    /**
     * Configura o Sortable para permitir arrastar cards
     * @param {HTMLElement} columnContent - Elemento de conteúdo da coluna
     * @param {Object} column - Dados da coluna
     */
    setupColumnSortable(columnContent, column) {
        new Sortable(columnContent, {
            group: 'cards',
            animation: 150,
            ghostClass: 'sortable-ghost',
            dragClass: 'sortable-drag',
            onEnd: function(evt) {
                const cardId = evt.item.dataset.id;
                const sourceColumnId = evt.from.dataset.columnId;
                const targetColumnId = evt.to.dataset.columnId;
                
                if (sourceColumnId !== targetColumnId) {
                    // Move entre colunas diferentes
                    storage.moveCard(sourceColumnId, targetColumnId, cardId);
                    
                    // Atualiza o contador de cards
                    app.board.updateColumnCardCount(sourceColumnId);
                    app.board.updateColumnCardCount(targetColumnId);
                } else {
                    // Apenas reordenação na mesma coluna
                    const cardIds = Array.from(columnContent.children).map(card => card.dataset.id);
                    storage.updateCardOrder(column.id, cardIds);
                }
            }
        });
    }

    /**
     * Atualiza o contador de cards em uma coluna
     * @param {string} columnId - ID da coluna
     */
    updateColumnCardCount(columnId) {
        const column = storage.getColumns().find(col => col.id === columnId);
        if (!column) return;
        
        const columnElement = document.querySelector(`.column[data-id="${columnId}"]`);
        if (!columnElement) return;
        
        const titleElement = columnElement.querySelector('.column-title');
        const cardCount = column.cards.length;
        
        // Remove o badge atual, se existir
        const existingBadge = titleElement.querySelector('.badge-count');
        if (existingBadge) {
            existingBadge.remove();
        }
        
        // Adiciona o novo badge
        if (cardCount > 0) {
            const badge = document.createElement('span');
            badge.className = 'badge-count';
            badge.textContent = cardCount;
            titleElement.appendChild(badge);
        }
    }

    /**
     * Formata uma data para exibição
     * @param {string} dateString - Data no formato YYYY-MM-DD
     * @returns {string} Data formatada
     */
    formatDate(dateString) {
        if (!dateString) return '';
        
        const dateParts = dateString.split('-');
        if (dateParts.length !== 3) return dateString;
        
        const months = [
            'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
            'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
        ];
        
        return `${dateParts[2]} ${months[parseInt(dateParts[1]) - 1]} ${dateParts[0]}`;
    }

    /**
     * Obtém o rótulo da prioridade
     * @param {string} priority - Prioridade do card
     * @returns {string} Rótulo da prioridade
     */
    getPriorityLabel(priority) {
        const labels = {
            'baixa': 'Baixa',
            'media': 'Média',
            'alta': 'Alta',
            'urgente': 'Urgente'
        };
        return labels[priority] || priority;
    }
}