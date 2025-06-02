/**
 * Gerenciador de autenticação
 */
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.setupEventListeners();
    }    /**
     * Configura os listeners de eventos
     */
    setupEventListeners() {
        // Aguardar o DOM estar completamente carregado
        document.addEventListener('DOMContentLoaded', () => {
            this.initializeEventListeners();
        });
        
        // Se o DOM já estiver carregado
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.initializeEventListeners();
            });
        } else {
            this.initializeEventListeners();
        }
    }
    
    /**
     * Inicializa os event listeners
     */
    initializeEventListeners() {
        // Formulário de login
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // Formulário de registro
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister();
            });
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

        this.setLoading(true);

        try {
            const response = await api.login(email, password);
            
            if (response.success) {
                this.currentUser = response.data.user;
                this.showSuccess('Login realizado com sucesso!');
                
                // Fechar modal e recarregar página
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                this.showError(response.message || 'Erro no login');
            }
        } catch (error) {
            console.error('Erro no login:', error);
            this.showError(error.message || 'Erro no servidor');
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

        this.setLoading(true);

        try {
            const userData = { name, email, password };
            if (role) userData.role = role;

            const response = await api.register(userData);
            
            if (response.success) {
                this.currentUser = response.data.user;
                this.showSuccess('Cadastro realizado com sucesso!');
                
                // Fechar modal e recarregar página
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                this.showError(response.message || 'Erro no cadastro');
            }
        } catch (error) {
            console.error('Erro no registro:', error);
            this.showError(error.message || 'Erro no servidor');
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Define o estado de carregamento
     */
    setLoading(loading) {
        const loginBtn = document.querySelector('#loginForm button[type="submit"]');
        const registerBtn = document.querySelector('#registerForm button[type="submit"]');
        
        if (loading) {
            if (loginBtn) {
                loginBtn.disabled = true;
                loginBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Entrando...';
            }
            if (registerBtn) {
                registerBtn.disabled = true;
                registerBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Cadastrando...';
            }
        } else {
            if (loginBtn) {
                loginBtn.disabled = false;
                loginBtn.innerHTML = 'Entrar';
            }
            if (registerBtn) {
                registerBtn.disabled = false;
                registerBtn.innerHTML = 'Cadastrar';
            }
        }
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
        if (modalBody) {
            modalBody.insertBefore(alertDiv, modalBody.firstChild);
        }
        
        // Remove automaticamente após 5 segundos
        setTimeout(() => {
            if (alertDiv.parentNode) {
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

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
});

console.log('🔐 auth.js carregado');