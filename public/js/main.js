/**
 * Script de inicialização principal
 */

// Aguardar carregamento completo do DOM
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 NotifyMe - Aplicação iniciando...');

    // Verificar suporte a localStorage
    if (!window.localStorage) {
        alert('Seu navegador não suporta armazenamento local. Esta aplicação pode não funcionar corretamente.');
        return;
    }

    // Inicializar aplicação
    initializeApp();
});

/**
 * Inicializa a aplicação
 */
async function initializeApp() {
    try {
        console.log('🔧 Inicializando aplicação...');
          // Verificar se o usuário está autenticado
        const token = localStorage.getItem('notifyMeToken');
        
        if (token) {
            // Verificar se o token é válido
            try {
                const response = await window.api.getCurrentUser();
                if (response.success) {
                    // Usuário autenticado, esconder modal de login
                    const loginModal = document.getElementById('loginModal');
                    const modal = bootstrap.Modal.getInstance(loginModal);
                    if (modal) {
                        modal.hide();
                    }
                    
                    // Inicializar aplicação principal
                    await initMainApp(response.data.user);
                } else {
                    // Token inválido, mostrar login
                    showLoginModal();
                }            } catch (error) {
                console.error('Token inválido:', error);
                window.api.removeToken();
                showLoginModal();
            }
        } else {
            // Não autenticado, mostrar modal de login
            showLoginModal();
        }
    } catch (error) {
        console.error('Erro ao inicializar aplicação:', error);
        showError('Erro ao inicializar aplicação');
    }
}

/**
 * Inicializa a aplicação principal após autenticação
 */
async function initMainApp(user) {
    try {
        console.log('👤 Usuário autenticado:', user.name);
        
        // Atualizar interface com dados do usuário
        updateUserInterface(user);
        
        // Carregar quadros do usuário
        await loadUserBoards();
        
        // Inicializar eventos
        setupEventListeners();
        
        console.log('✅ Aplicação inicializada com sucesso!');
    } catch (error) {
        console.error('Erro ao inicializar aplicação principal:', error);
        showError('Erro ao carregar dados do usuário');
    }
}

/**
 * Atualiza a interface com dados do usuário
 */
function updateUserInterface(user) {
    // Atualizar botão de perfil
    const userProfileBtn = document.getElementById('userProfileBtn');
    if (userProfileBtn) {
        if (user.photoUrl) {
            userProfileBtn.innerHTML = `<img src="${user.photoUrl}" alt="${user.name}" class="user-avatar avatar-sm">`;
        } else {
            const initials = getInitials(user.name);
            userProfileBtn.innerHTML = `<div class="user-avatar-text avatar-sm">${initials}</div>`;
        }
        
        userProfileBtn.title = `${user.name} (${user.role})`;
    }
    
    // Adicionar dropdown de usuário
    createUserDropdown(user);
}

/**
 * Cria dropdown do usuário
 */
function createUserDropdown(user) {
    const userProfileBtn = document.getElementById('userProfileBtn');
    const navItem = userProfileBtn.closest('.nav-item');
    
    navItem.classList.add('dropdown');
    userProfileBtn.setAttribute('data-bs-toggle', 'dropdown');
    userProfileBtn.setAttribute('aria-expanded', 'false');
    
    const dropdown = document.createElement('ul');
    dropdown.className = 'dropdown-menu dropdown-menu-end';
    dropdown.innerHTML = `
        <li class="dropdown-header">
            <div class="d-flex align-items-center">
                ${user.photoUrl ? 
                    `<img src="${user.photoUrl}" alt="${user.name}" class="user-avatar me-2">` :
                    `<div class="user-avatar-text me-2">${getInitials(user.name)}</div>`
                }
                <div>
                    <div class="fw-bold">${user.name}</div>
                    <small class="text-muted">${user.email}</small>
                </div>
            </div>
        </li>
        <li><hr class="dropdown-divider"></li>
        <li><a class="dropdown-item" href="#" onclick="showProfileModal()">
            <i class="fas fa-user me-2"></i>Perfil
        </a></li>
        <li><a class="dropdown-item" href="#" onclick="showSettingsModal()">
            <i class="fas fa-cog me-2"></i>Configurações
        </a></li>
        <li><hr class="dropdown-divider"></li>
        <li><a class="dropdown-item text-danger" href="#" onclick="logout()">
            <i class="fas fa-sign-out-alt me-2"></i>Sair
        </a></li>
    `;
    
    navItem.appendChild(dropdown);
}

/**
 * Carrega quadros do usuário
 */
async function loadUserBoards() {
    try {
        const response = await window.api.getBoards();
        
        if (response.success && response.data.boards && response.data.boards.length > 0) {
            const boards = response.data.boards;
            
            // Criar seletor de quadros
            createBoardSelector(boards);
            
            // Carregar primeiro quadro por padrão
            await loadBoard(boards[0]._id);
        } else {
            // Não há quadros, mostrar opção para criar
            showCreateFirstBoard();
        }
    } catch (error) {
        console.error('Erro ao carregar quadros:', error);
        showError('Erro ao carregar quadros');
    }
}

/**
 * Cria seletor de quadros
 */
function createBoardSelector(boards) {
    const navbarNav = document.querySelector('.navbar-nav.me-auto');
    
    const boardSelector = document.createElement('li');
    boardSelector.className = 'nav-item dropdown';
    boardSelector.innerHTML = `
        <a class="nav-link dropdown-toggle" href="#" id="boardDropdown" role="button" data-bs-toggle="dropdown">
            <i class="fas fa-clipboard-list me-1"></i>Quadros
        </a>
        <ul class="dropdown-menu">
            ${boards.map(board => `
                <li><a class="dropdown-item" href="#" onclick="loadBoard('${board._id}')">
                    ${board.name}
                </a></li>
            `).join('')}
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item" href="#" onclick="showCreateBoardModal()">
                <i class="fas fa-plus me-1"></i>Novo Quadro
            </a></li>
        </ul>
    `;
    
    navbarNav.appendChild(boardSelector);
}

/**
 * Carrega um quadro específico
 */
async function loadBoard(boardId) {
    try {
        const response = await window.api.getBoard(boardId);
        
        if (response.success) {
            const { board } = response.data;
            
            // Definir quadro atual
            currentBoardId = boardId;
            
            // Carregar colunas do quadro
            const columnsResponse = await window.api.getColumns(boardId);
            const columns = columnsResponse.success ? columnsResponse.data.columns : [];
            
            // Mostrar botão de adicionar coluna
            const addColumnBtn = document.getElementById('addColumnBtn');
            if (addColumnBtn) {
                addColumnBtn.style.display = 'block';
            }
            
            // Atualizar título
            document.title = `${board.name} - NotifyMe`;
            
            // Renderizar quadro
            renderBoard(board, columns);
        }
    } catch (error) {
        console.error('Erro ao carregar quadro:', error);
        showError('Erro ao carregar quadro');
    }
}

/**
 * Renderiza o quadro na interface
 */
function renderBoard(board, columns) {
    const boardElement = document.getElementById('board');
    boardElement.innerHTML = '';
    
    if (columns.length === 0) {
        boardElement.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-clipboard"></i>
                <h3>Quadro vazio</h3>
                <p>Adicione uma coluna para começar a organizar suas tarefas.</p>
                <button class="btn btn-primary mt-3" onclick="showAddColumnModal()">
                    <i class="fas fa-plus me-1"></i>Adicionar Coluna
                </button>
            </div>
        `;
        return;
    }
    
    // Renderizar colunas
    columns.forEach(column => {
        const columnElement = createColumnElement(column);
        boardElement.appendChild(columnElement);
    });
    
    // Configurar drag and drop
    setupDragAndDrop();
}

/**
 * Cria elemento de coluna
 */
function createColumnElement(column) {
    const columnDiv = document.createElement('div');
    columnDiv.className = `column ${column.type}`;
    columnDiv.dataset.id = column._id;
    
    columnDiv.innerHTML = `
        <div class="column-header">
            <h3 class="column-title">
                ${column.title}
                ${column.cards.length > 0 ? `<span class="badge-count">${column.cards.length}</span>` : ''}
            </h3>
            <div class="column-actions">
                <button class="btn btn-sm btn-outline-secondary" onclick="editColumn('${column._id}')" title="Editar coluna">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-secondary" onclick="showAddCardModal('${column._id}')" title="Adicionar card">
                    <i class="fas fa-plus"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteColumn('${column._id}')" title="Remover coluna">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
        <div class="column-content" data-column-id="${column._id}">
            ${column.cards.map(card => createCardElement(card)).join('')}
        </div>
        <button class="add-card-btn" onclick="showAddCardModal('${column._id}')">
            <i class="fas fa-plus"></i> Adicionar Card
        </button>
    `;
    
    return columnDiv;
}

/**
 * Cria elemento de card
 */
function createCardElement(card) {
    const priorityClass = `priority-${card.priority}`;
    const dueDate = card.dueDate ? new Date(card.dueDate).toLocaleDateString('pt-BR') : '';
    
    return `
        <div class="card" data-id="${card._id}" data-priority="${card.priority}">
            <div class="card-title">
                ${card.title}
                <div class="card-actions">
                    <button onclick="editCard('${card._id}')" title="Editar card">
                        <i class="fas fa-edit edit-card"></i>
                    </button>
                    <button onclick="deleteCard('${card._id}')" title="Excluir card">
                        <i class="fas fa-trash delete-card"></i>
                    </button>
                </div>
            </div>
            ${card.description ? `<div class="card-description">${card.description}</div>` : ''}
            ${dueDate ? `
                <div class="card-due-date">
                    <i class="fas fa-calendar"></i> ${dueDate}
                </div>
            ` : ''}
            <div class="card-footer">
                <span class="card-priority ${priorityClass}">${getPriorityLabel(card.priority)}</span>
                ${card.assignedTo ? `
                    <div class="card-assigned-to">
                        ${card.assignedTo.photoUrl ? 
                            `<img src="${card.assignedTo.photoUrl}" alt="${card.assignedTo.name}" class="user-avatar avatar-sm">` :
                            `<div class="user-avatar-text avatar-sm">${getInitials(card.assignedTo.name)}</div>`
                        }
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

/**
 * Configura eventos da aplicação
 */
function setupEventListeners() {
    // Botão de adicionar coluna
    const addColumnBtn = document.getElementById('addColumnBtn');
    if (addColumnBtn) {
        addColumnBtn.addEventListener('click', () => showAddColumnModal());
    }
    
    // Botão de salvar coluna
    const saveColumnBtn = document.getElementById('saveColumnBtn');
    if (saveColumnBtn) {
        saveColumnBtn.addEventListener('click', () => saveColumn());
    }
    
    // Botão de salvar card
    const saveCardBtn = document.getElementById('saveCardBtn');
    if (saveCardBtn) {
        saveCardBtn.addEventListener('click', () => saveCard());
    }
    
    // Botão de atualizar coluna
    const updateColumnBtn = document.getElementById('updateColumnBtn');
    if (updateColumnBtn) {
        updateColumnBtn.addEventListener('click', () => updateColumn());
    }
    
    // Configurar tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

/**
 * Configura drag and drop
 */
function setupDragAndDrop() {
    // Verificar se a biblioteca SortableJS está disponível
    if (typeof Sortable === 'undefined') {
        console.warn('SortableJS não está carregado. Drag and drop não funcionará.');
        return;
    }

    const boardElement = document.getElementById('board');
    if (!boardElement) {
        console.warn('Elemento board não encontrado.');
        return;
    }
    
    // Configurar drag and drop para colunas
    if (columnSortable) {
        columnSortable.destroy();
    }
    
    columnSortable = new Sortable(boardElement, {
        draggable: '.column',
        handle: '.column-header',
        animation: 150,
        ghostClass: 'column-ghost',
        chosenClass: 'column-drag',
        onEnd: async function (evt) {
            const columnIds = Array.from(boardElement.children).map(col => col.dataset.id);
            await saveColumnOrder(columnIds);
        }
    });
    
    // Configurar drag and drop para cards dentro das colunas
    document.querySelectorAll('.column-content').forEach(columnContent => {
        new Sortable(columnContent, {
            group: 'cards',
            draggable: '.card',
            animation: 150,
            ghostClass: 'sortable-ghost',
            chosenClass: 'sortable-drag',
            onEnd: async function (evt) {
                const cardId = evt.item.dataset.id;
                const newColumnId = evt.to.dataset.columnId;
                const newPosition = evt.newIndex;
                
                // Mover card para nova posição
                await moveCard(cardId, newColumnId, newPosition);
            }
        });
    });
    
    console.log('✅ Drag and drop configurado com sucesso');
}

/**
 * Utilitários
 */
function getInitials(name) {
    if (!name) return 'U';
    
    const parts = name.split(' ').filter(part => part.length > 0);
    
    if (parts.length === 1) {
        return parts[0].charAt(0).toUpperCase();
    } else {
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
}

function getPriorityLabel(priority) {
    const labels = {
        'baixa': 'Baixa',
        'media': 'Média',
        'alta': 'Alta',
        'urgente': 'Urgente'
    };
    
    return labels[priority] || 'Média';
}

function showLoginModal() {
    try {
        const loginModal = document.getElementById('loginModal');
        if (loginModal) {
            const modal = new bootstrap.Modal(loginModal, {
                backdrop: 'static',
                keyboard: false
            });
            modal.show();
        } else {
            console.error('Modal de login não encontrado');
        }
    } catch (error) {
        console.error('Erro ao mostrar modal de login:', error);
    }
}

function showError(message) {
    console.error('❌ Erro:', message);
    
    // Criar toast de erro
    const toastContainer = getOrCreateToastContainer();
    const toastId = 'toast-' + Date.now();
    
    const toastHtml = `
        <div id="${toastId}" class="toast align-items-center text-white bg-danger border-0" role="alert">
            <div class="d-flex">
                <div class="toast-body">
                    <i class="fas fa-exclamation-triangle me-2"></i>${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `;
    
    toastContainer.insertAdjacentHTML('beforeend', toastHtml);
    
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, { delay: 5000 });
    toast.show();
    
    // Remove o elemento após ser escondido
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}

function showSuccess(message) {
    console.log('✅ Sucesso:', message);
    
    // Criar toast de sucesso
    const toastContainer = getOrCreateToastContainer();
    const toastId = 'toast-' + Date.now();
    
    const toastHtml = `
        <div id="${toastId}" class="toast align-items-center text-white bg-success border-0" role="alert">
            <div class="d-flex">
                <div class="toast-body">
                    <i class="fas fa-check-circle me-2"></i>${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `;
    
    toastContainer.insertAdjacentHTML('beforeend', toastHtml);
    
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, { delay: 3000 });
    toast.show();
    
    // Remove o elemento após ser escondido
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}

function getOrCreateToastContainer() {
    let container = document.getElementById('toast-container');
    
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        container.style.zIndex = '1055';
        document.body.appendChild(container);
    }
    
    return container;
}

/**
 * Exibe interface para criar primeiro quadro
 */
function showCreateFirstBoard() {
    const boardContainer = document.getElementById('board');
    if (boardContainer) {
        boardContainer.innerHTML = `
            <div class="welcome-screen">
                <div class="icon">
                    <i class="fas fa-clipboard-list"></i>
                </div>
                <h3>Bem-vindo ao NotifyMe!</h3>
                <p>Você ainda não tem nenhum quadro. Que tal criar o seu primeiro?</p>
                <button class="btn btn-primary btn-lg" onclick="createFirstBoard()">
                    <i class="fas fa-plus me-2"></i>Criar Meu Primeiro Quadro
                </button>
            </div>
        `;
    }
}

/**
 * Cria o primeiro quadro do usuário
 */
async function createFirstBoard() {
    try {
        const response = await window.api.createBoard({
            name: 'Meu Primeiro Quadro',
            description: 'Quadro inicial para começar a organizar suas tarefas'
        });
        
        if (response.success) {
            showSuccess('Quadro criado com sucesso!');
            await loadUserBoards();
        } else {
            showError(response.message || 'Erro ao criar quadro');
        }
        
    } catch (error) {
        console.error('Erro ao criar primeiro quadro:', error);
        showError('Erro ao criar quadro');
    }
}

// Adicionar função global
window.createFirstBoard = createFirstBoard;

// Funções globais para eventos onclick
window.loadBoard = loadBoard;
window.showCreateBoardModal = () => console.log('Criar quadro');
window.showAddColumnModal = showAddColumnModal;
window.showAddCardModal = showAddCardModal;
window.editColumn = showEditColumnModal;
window.editCard = editCard;
window.deleteColumn = deleteColumn;
window.deleteCard = deleteCard;
window.showEditColumnModal = showEditColumnModal;
window.showProfileModal = () => console.log('Perfil');
window.showSettingsModal = () => console.log('Configurações');
window.logout = async () => {
    try {
        await window.api.logout();
        window.location.reload();
    } catch (error) {
        console.error('Erro no logout:', error);
    }
};

// Variável global para armazenar o ID do quadro atual
let currentBoardId = null;
let columnSortable = null;

/**
 * Mostra modal para adicionar coluna
 */
function showAddColumnModal() {
    if (!currentBoardId) {
        showError('Nenhum quadro selecionado');
        return;
    }
    
    // Limpar formulário
    document.getElementById('columnTitle').value = '';
    document.getElementById('columnType').value = 'normal';
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('addColumnModal'));
    modal.show();
}

/**
 * Salva nova coluna
 */
async function saveColumn() {
    const title = document.getElementById('columnTitle').value.trim();
    const type = document.getElementById('columnType').value;
    
    if (!title) {
        showError('Título da coluna é obrigatório');
        return;
    }
    
    if (!currentBoardId) {
        showError('Nenhum quadro selecionado');
        return;
    }
    
    try {
        const response = await window.api.createColumn({
            title,
            type,
            boardId: currentBoardId
        });
        
        if (response.success) {
            showSuccess('Coluna criada com sucesso!');
            
            // Fechar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('addColumnModal'));
            modal.hide();
            
            // Recarregar quadro
            await loadBoard(currentBoardId);
        } else {
            showError(response.message || 'Erro ao criar coluna');
        }
    } catch (error) {
        console.error('Erro ao salvar coluna:', error);
        showError('Erro ao salvar coluna');
    }
}

/**
 * Mostra modal para adicionar card
 */
function showAddCardModal(columnId) {
    if (!columnId) {
        showError('ID da coluna não fornecido');
        return;
    }
    
    // Limpar formulário
    document.getElementById('cardTitle').value = '';
    document.getElementById('cardDescription').value = '';
    document.getElementById('cardPriority').value = 'media';
    document.getElementById('cardDueDate').value = '';
    document.getElementById('cardColumnId').value = columnId;
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('addCardModal'));
    modal.show();
}

/**
 * Salva novo card
 */
async function saveCard() {
    const title = document.getElementById('cardTitle').value.trim();
    const description = document.getElementById('cardDescription').value.trim();
    const priority = document.getElementById('cardPriority').value;
    const dueDate = document.getElementById('cardDueDate').value;
    const columnId = document.getElementById('cardColumnId').value;
    
    if (!title) {
        showError('Título do card é obrigatório');
        return;
    }
    
    if (!columnId) {
        showError('ID da coluna não fornecido');
        return;
    }
    
    try {
        const cardData = {
            title,
            description,
            priority,
            columnId
        };
        
        if (dueDate) {
            cardData.dueDate = dueDate;
        }
        
        const response = await window.api.createCard(cardData);
        
        if (response.success) {
            showSuccess('Card criado com sucesso!');
            
            // Fechar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('addCardModal'));
            modal.hide();
            
            // Recarregar quadro
            if (currentBoardId) {
                await loadBoard(currentBoardId);
            }
        } else {
            showError(response.message || 'Erro ao criar card');
        }
    } catch (error) {
        console.error('Erro ao salvar card:', error);
        showError('Erro ao salvar card');
    }
}

/**
 * Mostra modal para editar coluna
 */
function showEditColumnModal(columnId) {
    if (!columnId) {
        showError('ID da coluna não fornecido');
        return;
    }
    
    // Buscar dados da coluna atual
    const columnElement = document.querySelector(`[data-id="${columnId}"]`);
    if (!columnElement) {
        showError('Coluna não encontrada');
        return;
    }
    
    const columnTitle = columnElement.querySelector('.column-title').textContent.trim();
    const columnType = columnElement.classList.contains('pending') ? 'pending' :
                      columnElement.classList.contains('urgent') ? 'urgent' :
                      columnElement.classList.contains('completed') ? 'completed' : 'normal';
    
    // Preencher formulário
    document.getElementById('editColumnTitle').value = columnTitle;
    document.getElementById('editColumnType').value = columnType;
    document.getElementById('editColumnId').value = columnId;
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('editColumnModal'));
    modal.show();
}

/**
 * Atualiza coluna
 */
async function updateColumn() {
    const title = document.getElementById('editColumnTitle').value.trim();
    const type = document.getElementById('editColumnType').value;
    const columnId = document.getElementById('editColumnId').value;
    
    if (!title) {
        showError('Título da coluna é obrigatório');
        return;
    }
    
    if (!columnId) {
        showError('ID da coluna não fornecido');
        return;
    }
    
    try {
        const response = await window.api.updateColumn(columnId, {
            title,
            type
        });
        
        if (response.success) {
            showSuccess('Coluna atualizada com sucesso!');
            
            // Fechar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('editColumnModal'));
            modal.hide();
            
            // Recarregar quadro
            if (currentBoardId) {
                await loadBoard(currentBoardId);
            }
        } else {
            showError(response.message || 'Erro ao atualizar coluna');
        }
    } catch (error) {
        console.error('Erro ao atualizar coluna:', error);
        showError('Erro ao atualizar coluna');
    }
}

/**
 * Remove coluna
 */
async function deleteColumn(columnId) {
    if (!columnId) {
        showError('ID da coluna não fornecido');
        return;
    }
    
    // Confirmar remoção
    if (!confirm('Tem certeza que deseja remover esta coluna? Todos os cards serão removidos também.')) {
        return;
    }
    
    try {
        const response = await window.api.deleteColumn(columnId);
        
        if (response.success) {
            showSuccess('Coluna removida com sucesso!');
            
            // Recarregar quadro
            if (currentBoardId) {
                await loadBoard(currentBoardId);
            }
        } else {
            showError(response.message || 'Erro ao remover coluna');
        }
    } catch (error) {
        console.error('Erro ao remover coluna:', error);
        showError('Erro ao remover coluna');
    }
}

/**
 * Edita card
 */
function editCard(cardId) {
    if (!cardId) {
        showError('ID do card não fornecido');
        return;
    }
    
    // Por enquanto, apenas log (implementar modal de edição depois)
    console.log('Editando card:', cardId);
    showSuccess('Funcionalidade de editar card será implementada em breve!');
}

/**
 * Remove card
 */
async function deleteCard(cardId) {
    if (!cardId) {
        showError('ID do card não fornecido');
        return;
    }
    
    // Confirmar remoção
    if (!confirm('Tem certeza que deseja remover este card?')) {
        return;
    }
    
    try {
        const response = await window.api.deleteCard(cardId);
        
        if (response.success) {
            showSuccess('Card removido com sucesso!');
            
            // Recarregar quadro
            if (currentBoardId) {
                await loadBoard(currentBoardId);
            }
        } else {
            showError(response.message || 'Erro ao remover card');
        }
    } catch (error) {
        console.error('Erro ao remover card:', error);
        showError('Erro ao remover card');
    }
}

/**
 * Salva nova ordem das colunas
 */
async function saveColumnOrder(columnIds) {
    try {
        const response = await window.api.reorderColumns(columnIds);
        
        if (response.success) {
            console.log('✅ Ordem das colunas salva');
        } else {
            showError('Erro ao salvar ordem das colunas');
            // Recarregar para reverter a mudança visual
            if (currentBoardId) {
                await loadBoard(currentBoardId);
            }
        }
    } catch (error) {
        console.error('Erro ao salvar ordem das colunas:', error);
        showError('Erro ao salvar ordem das colunas');
        // Recarregar para reverter a mudança visual
        if (currentBoardId) {
            await loadBoard(currentBoardId);
        }
    }
}

/**
 * Move card para nova coluna/posição
 */
async function moveCard(cardId, newColumnId, newPosition) {
    try {
        const response = await window.api.moveCard(cardId, newColumnId, newPosition);
        
        if (response.success) {
            console.log('✅ Card movido com sucesso');
            // Atualizar contadores das colunas
            updateColumnCounters();
        } else {
            showError('Erro ao mover card');
            // Recarregar para reverter a mudança visual
            if (currentBoardId) {
                await loadBoard(currentBoardId);
            }
        }
    } catch (error) {
        console.error('Erro ao mover card:', error);
        showError('Erro ao mover card');
        // Recarregar para reverter a mudança visual
        if (currentBoardId) {
            await loadBoard(currentBoardId);
        }
    }
}

/**
 * Atualiza contadores de cards nas colunas
 */
function updateColumnCounters() {
    document.querySelectorAll('.column').forEach(column => {
        const columnContent = column.querySelector('.column-content');
        const cards = columnContent.querySelectorAll('.card');
        const counter = column.querySelector('.badge-count');
        
        if (cards.length > 0) {
            if (counter) {
                counter.textContent = cards.length;
            } else {
                const title = column.querySelector('.column-title');
                title.insertAdjacentHTML('beforeend', `<span class="badge-count">${cards.length}</span>`);
            }
        } else {
            if (counter) {
                counter.remove();
            }
        }
    });
}

//# sourceMappingURL=main.js.map