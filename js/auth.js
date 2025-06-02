/**
 * Gerenciador de autenticação
 */
class AuthManager {
    constructor() {
        this.loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
        this.currentUser = null;
        
        this.setupEventListeners();
        this.checkAuthStatus();
    }

    /**
     * Configura os listeners de eventos
     */
    setupEventListeners() {
        // Formulário de login
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Formulário de registro
        document.getElementById('registerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });

        // Botão de logout (será criado dinamicamente)
        document.addEventListener('click', (e) => {
            if (e.target.id === 'logoutBtn') {
                this.handleLogout();
            }
        });
    }

    /**
     * Verifica o status de autenticação
     */
    async checkAuthStatus() {
        const token = localStorage.getItem('notifyMeToken');
        
        if (!token) {
            this.showLogin();
            return;
        }

        try {
            const response = await api.getCurrentUser();
            
            if (response.success) {
                this.currentUser = response.data.user;
                this.hideLogin();
                this.updateUserDisplay();
                
                // Inicializar a aplicação
                if (window.app) {
                    await window.app.initialize();
                }
            } else {
                this.showLogin();
            }
        } catch (error) {
            console.error('Erro ao verificar autenticação:', error);
            this.showLogin();
        }
    }

    /**
     * Manipula o login
     */
    async handleLogin() {
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (!email || !password) {
            this.showError('Por favor, preencha todos os campos');
            return;
        }

        try {
            this.setLoading(true);
            
            const response = await api.login(email, password);
            
            if (response.success) {
                this.currentUser = response.data.user;
                this.hideLogin();
                this.updateUserDisplay();
                this.showSuccess('Login realizado com sucesso!');
                
                // Inicializar a aplicação
                if (window.app) {
                    await window.app.initialize();
                }
            }
        } catch (error) {
            this.showError(error.message || 'Erro ao fazer login');
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Manipula o registro
     */
    async handleRegister() {
        const name = document.getElementById('registerName').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value;
        const role = document.getElementById('registerRole').value.trim();

        if (!name || !email || !password) {
            this.showError('Por favor, preencha todos os campos obrigatórios');
            return;
        }

        if (password.length < 6) {
            this.showError('A senha deve ter pelo menos 6 caracteres');
            return;
        }

        try {
            this.setLoading(true);
            
            const userData = { name, email, password };
            if (role) userData.role = role;
            
            const response = await api.register(userData);
            
            if (response.success) {
                this.currentUser = response.data.user;
                this.hideLogin();
                this.updateUserDisplay();
                this.showSuccess('Conta criada com sucesso!');
                
                // Inicializar a aplicação
                if (window.app) {
                    await window.app.initialize();
                }
            }
        } catch (error) {
            this.showError(error.message || 'Erro ao criar conta');
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Manipula o logout
     */
    async handleLogout() {
        if (confirm('Tem certeza que deseja sair?')) {
            try {
                await api.logout();
            } catch (error) {
                console.error('Erro no logout:', error);
            } finally {
                this.currentUser = null;
                this.showLogin();
                this.clearUserDisplay();
                
                // Limpar dados da aplicação
                if (window.app) {
                    window.app.clear();
                }
            }
        }
    }

    /**
     * Mostra o modal de login
     */
    showLogin() {
        this.loginModal.show();
        this.resetForms();
    }

    /**
     * Esconde o modal de login
     */
    hideLogin() {
        this.loginModal.hide();
        this.resetForms();
    }

    /**
     * Atualiza a exibição do usuário na interface
     */
    updateUserDisplay() {
        const userProfileBtn = document.getElementById('userProfileBtn');
        
        if (this.currentUser) {
            // Atualizar botão do perfil
            if (this.currentUser.photoUrl) {
                userProfileBtn.innerHTML = `<img src="${this.currentUser.photoUrl}" class="user-avatar" alt="${this.currentUser.name}">`;
            } else {
                const initials = this.getInitials(this.currentUser.name);
                userProfileBtn.innerHTML = `<div class="user-avatar-text">${initials}</div>`;
            }
            
            // Adicionar dropdown de logout se não existir
            if (!document.getElementById('userDropdown')) {
                const dropdown = document.createElement('ul');
                dropdown.className = 'dropdown-menu';
                dropdown.id = 'userDropdown';
                dropdown.innerHTML = `
                    <li><h6 class="dropdown-header">${this.currentUser.name}</h6></li>
                    <li><span class="dropdown-item-text text-muted">${this.currentUser.email}</span></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item" href="#" id="editProfileBtn">Editar Perfil</a></li>
                    <li><a class="dropdown-item text-danger" href="#" id="logoutBtn">Sair</a></li>
                `;
                
                userProfileBtn.parentElement.appendChild(dropdown);
                userProfileBtn.setAttribute('data-bs-toggle', 'dropdown');
            }
            
            // Atualizar textos dos botões da navbar
            document.getElementById('teamManagementBtn').innerHTML = '<i class="fas fa-users me-1"></i>Equipes';
            document.getElementById('manageUsersBtn').innerHTML = '<i class="fas fa-user-cog me-1"></i>Usuários';
            document.getElementById('addColumnBtn').innerHTML = '<i class="fas fa-plus me-1"></i>Nova Coluna';
            document.getElementById('saveOrderBtn').innerHTML = '<i class="fas fa-save me-1"></i>Salvar Ordem';
        }
    }

    /**
     * Limpa a exibição do usuário
     */
    clearUserDisplay() {
        const userProfileBtn = document.getElementById('userProfileBtn');
        userProfileBtn.innerHTML = '<i class="fas fa-user"></i>';
        
        const dropdown = document.getElementById('userDropdown');
        if (dropdown) {
            dropdown.remove();
        }
        
        userProfileBtn.removeAttribute('data-bs-toggle');
    }

    /**
     * Obtém as iniciais de um nome
     */
    getInitials(name) {
        if (!name) return '?';
        
        const parts = name.split(' ').filter(part => part.length > 0);
        
        if (parts.length === 1) {
            return parts[0].charAt(0).toUpperCase();
        } else {
            return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
        }
    }

    /**
     * Define o estado de carregamento
     */
    setLoading(loading) {
        const loginBtn = document.querySelector('#loginForm button[type="submit"]');
        const registerBtn = document.querySelector('#registerForm button[type="submit"]');
        
        if (loading) {
            loginBtn.disabled = true;
            registerBtn.disabled = true;
            loginBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Entrando...';
            registerBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Criando...';
        } else {
            loginBtn.disabled = false;
            registerBtn.disabled = false;
            loginBtn.innerHTML = 'Entrar';
            registerBtn.innerHTML = 'Cadastrar';
        }
    }

    /**
     * Reseta os formulários
     */
    resetForms() {
        document.getElementById('loginForm').reset();
        document.getElementById('registerForm').reset();
        this.clearMessages();
    }

    /**
     * Exibe mensagem de erro
     */
    showError(message) {
        this.showMessage(message, 'danger');
    }

    /**
     * Exibe mensagem de sucesso
     */
    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    /**
     * Exibe uma mensagem
     */
    showMessage(message, type = 'info') {
        // Remove mensagens existentes
        this.clearMessages();
        
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        const modalBody = document.querySelector('#loginModal .modal-body');
        modalBody.insertBefore(alertDiv, modalBody.firstChild);
        
        // Remove automaticamente após 5 segundos
        setTimeout(() => {
            if (alertDiv.parentElement) {
                alertDiv.remove();
            }
        }, 5000);
    }

    /**
     * Limpa as mensagens
     */
    clearMessages() {
        const alerts = document.querySelectorAll('#loginModal .alert');
        alerts.forEach(alert => alert.remove());
    }
}

// Instância global do gerenciador de autenticação
window.authManager = new AuthManager();