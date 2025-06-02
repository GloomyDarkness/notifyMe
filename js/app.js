/**
 * Classe principal da aplicação
 */
class App {
    constructor() {
        this.currentBoard = null;
        this.isInitialized = false;
        
        // Aguarda a autenticação antes de inicializar
        if (document.readyState !== 'complete') {
            window.addEventListener('load', () => {
                // A inicialização será feita pelo AuthManager após login
            });
        }
    }

    /**
     * Inicializa a aplicação após autenticação
     */
    async initialize() {
        if (this.isInitialized) return;
        
        this.showLoading();

        try {
            // Inicializa os componentes
            this.userManager = new UserManager();
            this.boardManager = new BoardManager();
            this.board = new Board();
            this.cardManager = new CardManager();
            this.columnManager = new ColumnManager();
            
            // Configura eventos
            this.setupResponsiveEvents();
            this.setupUserRelatedEvents();
            this.setupBoardSelection();
            
            // Carrega o quadro padrão ou lista de quadros
            await this.loadInitialBoard();
            
            this.isInitialized = true;
        } catch (error) {
            console.error('Erro ao inicializar aplicação:', error);
            this.showError('Erro ao carregar a aplicação');
        } finally {
            this.hideLoading();
        }
    }    /**
     * Configura eventos para seleção de quadros
     */
    setupBoardSelection() {
        // Adicionar dropdown de seleção de quadros
        this.createBoardSelector();
    }

    /**
     * Cria o seletor de quadros
     */
    async createBoardSelector() {
        try {
            const response = await api.getBoards();
            
            if (response.success && response.data.boards.length > 0) {
                const boards = response.data.boards;
                
                // Encontrar um local para adicionar o seletor
                const navbar = document.querySelector('.navbar-nav');
                const boardSelector = document.createElement('li');
                boardSelector.className = 'nav-item dropdown me-3';
                boardSelector.innerHTML = `
                    <a class="nav-link dropdown-toggle" href="#" id="boardSelector" role="button" data-bs-toggle="dropdown">
                        <i class="fas fa-clipboard-list me-1"></i>Quadros
                    </a>
                    <ul class="dropdown-menu" id="boardDropdown">
                        ${boards.map(board => `
                            <li><a class="dropdown-item" href="#" data-board-id="${board._id}">${board.name}</a></li>
                        `).join('')}
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item" href="#" id="createBoardBtn"><i class="fas fa-plus me-1"></i>Novo Quadro</a></li>
                    </ul>
                `;
                
                navbar.insertBefore(boardSelector, navbar.firstChild);
                
                // Configura eventos
                document.getElementById('boardDropdown').addEventListener('click', (e) => {
                    const boardId = e.target.dataset.boardId;
                    if (boardId) {
                        this.loadBoard(boardId);
                    } else if (e.target.id === 'createBoardBtn') {
                        this.showCreateBoardModal();
                    }
                });
            }
        } catch (error) {
            console.error('Erro ao carregar quadros:', error);
        }
    }

    /**
     * Carrega um quadro específico
     */
    async loadBoard(boardId) {
        try {
            this.showLoading();
            
            const response = await api.getBoard(boardId);
            
            if (response.success) {
                this.currentBoard = response.data.board;
                
                // Atualizar título
                document.querySelector('.navbar-brand').textContent = `NotifyMe - ${this.currentBoard.name}`;
                
                // Renderizar colunas e cards
                await this.board.loadBoardData(response.data.columns);
            }
        } catch (error) {
            console.error('Erro ao carregar quadro:', error);
            this.showError('Erro ao carregar quadro');
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Carrega o quadro inicial
     */
    async loadInitialBoard() {
        try {
            const response = await api.getBoards();
            
            if (response.success && response.data.boards.length > 0) {
                // Carrega o primeiro quadro disponível
                await this.loadBoard(response.data.boards[0]._id);
            } else {
                // Se não há quadros, criar um padrão
                await this.createDefaultBoard();
            }
        } catch (error) {
            console.error('Erro ao carregar quadro inicial:', error);
            await this.createDefaultBoard();
        }
    }

    /**
     * Cria um quadro padrão
     */
    async createDefaultBoard() {
        try {
            const response = await api.createBoard({
                name: 'Meu Primeiro Quadro',
                description: 'Quadro padrão para começar'
            });
            
            if (response.success) {
                await this.loadBoard(response.data.board._id);
                await this.createBoardSelector(); // Atualizar seletor
            }
        } catch (error) {
            console.error('Erro ao criar quadro padrão:', error);
        }
    }

    /**
     * Mostra modal para criar novo quadro
     */
    showCreateBoardModal() {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Novo Quadro</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <label class="form-label">Nome do Quadro</label>
                            <input type="text" class="form-control" id="newBoardName" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Descrição</label>
                            <textarea class="form-control" id="newBoardDescription" rows="3"></textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-primary" id="createBoardConfirm">Criar</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        const modalInstance = new bootstrap.Modal(modal);
        modalInstance.show();
        
        document.getElementById('createBoardConfirm').addEventListener('click', async () => {
            const name = document.getElementById('newBoardName').value.trim();
            const description = document.getElementById('newBoardDescription').value.trim();
            
            if (name) {
                try {
                    const response = await api.createBoard({ name, description });
                    
                    if (response.success) {
                        modalInstance.hide();
                        await this.loadBoard(response.data.board._id);
                        await this.createBoardSelector(); // Atualizar seletor
                        this.showSuccess('Quadro criado com sucesso!');
                    }
                } catch (error) {
                    this.showError('Erro ao criar quadro: ' + error.message);
                }
            }
        });
        
        modal.addEventListener('hidden.bs.modal', () => {
            modal.remove();
        });
    }

    /**
     * Limpa dados da aplicação
     */
    clear() {
        this.currentBoard = null;
        this.isInitialized = false;
        
        // Limpar o quadro
        const boardElement = document.getElementById('board');
        if (boardElement) {
            boardElement.innerHTML = '';
        }
        
        // Resetar título
        document.querySelector('.navbar-brand').textContent = 'NotifyMe';
        
        // Remover seletor de quadros
        const boardSelector = document.querySelector('#boardSelector')?.closest('.nav-item');
        if (boardSelector) {
            boardSelector.remove();
        }
    }

    /**
     * Exibe mensagem de erro
     */
    showError(message) {
        this.showToast(message, 'error');
    }

    /**
     * Exibe mensagem de sucesso
     */
    showSuccess(message) {
        this.showToast(message, 'success');
    }

    /**
     * Exibe toast de notificação
     */
    showToast(message, type = 'info') {
        const toastContainer = document.createElement('div');
        toastContainer.className = 'position-fixed bottom-0 end-0 p-3';
        toastContainer.style.zIndex = '11';
        
        const bgClass = type === 'error' ? 'bg-danger text-white' : 
                       type === 'success' ? 'bg-success text-white' : 'bg-info text-white';
        
        toastContainer.innerHTML = `
            <div class="toast show ${bgClass}" role="alert">
                <div class="toast-header">
                    <strong class="me-auto">NotifyMe</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
                </div>
                <div class="toast-body">
                    ${message}
                </div>
            </div>
        `;
        
        document.body.appendChild(toastContainer);
        
        // Remove o toast após 3 segundos
        setTimeout(() => {
            const toast = new bootstrap.Toast(toastContainer.querySelector('.toast'));
            toast.hide();
            setTimeout(() => toastContainer.remove(), 500);
        }, 3000);
    }

    /**
     * Configura eventos relacionados a usuários
     */
    setupUserRelatedEvents() {
        // Delegação de eventos para botões criados dinamicamente
        document.addEventListener('click', (e) => {
            if (e.target.id === 'editProfileBtn') {
                e.preventDefault();
                this.userManager.openUserProfile();
            }
        });
    }

    /**
     * Mostra uma animação de carregamento
     */
    showLoading() {
        const loadingEl = document.createElement('div');
        loadingEl.id = 'app-loading';
        loadingEl.innerHTML = `
            <div class="loading-container">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Carregando...</span>
                </div>
                <div class="mt-2">Carregando NotifyMe...</div>
            </div>
        `;
        
        loadingEl.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(255, 255, 255, 0.9);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            transition: opacity 0.3s;
        `;
        
        loadingEl.querySelector('.loading-container').style.cssText = `
            text-align: center;
            font-weight: 500;
            color: var(--secondary-color);
        `;
        
        document.body.appendChild(loadingEl);
    }

    /**
     * Esconde a animação de carregamento
     */
    hideLoading() {
        const loadingEl = document.getElementById('app-loading');
        if (loadingEl) {
            loadingEl.style.opacity = '0';
            setTimeout(() => loadingEl.remove(), 300);
        }
    }

    /**
     * Configura eventos para responsividade
     */
    setupResponsiveEvents() {
        // Ajusta a altura do quadro
        const adjustBoardHeight = () => {
            const navbar = document.querySelector('.navbar');
            const board = document.getElementById('board');
            
            if (navbar && board) {
                const navbarHeight = navbar.offsetHeight;
                board.style.minHeight = `calc(100vh - ${navbarHeight + 40}px)`;
            }
        };

        // Executa no carregamento e em cada redimensionamento
        window.addEventListener('resize', adjustBoardHeight);
        adjustBoardHeight();
    }
}

// Exporta uma instância única da aplicação
window.app = new App();