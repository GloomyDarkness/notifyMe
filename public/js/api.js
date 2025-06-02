/**
 * Módulo de comunicação com a API
 */
class API {
    constructor() {
        this.baseURL = window.location.origin + '/api';
        this.token = localStorage.getItem('notifyMeToken');
    }

    /**
     * Faz uma requisição HTTP
     * @param {string} endpoint - Endpoint da API
     * @param {Object} options - Opções da requisição
     * @returns {Promise} Resposta da API
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        // Adicionar token de autenticação se disponível
        if (this.token) {
            config.headers.Authorization = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `Erro HTTP: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('Erro na API:', error);
            throw error;
        }
    }

    /**
     * Define o token de autenticação
     * @param {string} token - Token JWT
     */
    setToken(token) {
        this.token = token;
        localStorage.setItem('notifyMeToken', token);
    }

    /**
     * Remove o token de autenticação
     */
    removeToken() {
        this.token = null;
        localStorage.removeItem('notifyMeToken');
    }

    // Métodos de autenticação
    async login(email, password) {
        const response = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        
        if (response.success) {
            this.setToken(response.data.token);
        }
        
        return response;
    }

    async register(userData) {
        const response = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        
        if (response.success) {
            this.setToken(response.data.token);
        }
        
        return response;
    }

    async logout() {
        try {
            await this.request('/auth/logout', { method: 'POST' });
        } finally {
            this.removeToken();
        }
    }

    async getCurrentUser() {
        return await this.request('/auth/me');
    }

    // Métodos de usuários
    async getUsers() {
        return await this.request('/users');
    }

    async updateProfile(userData) {
        return await this.request('/users/profile', {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
    }

    async changePassword(currentPassword, newPassword) {
        return await this.request('/users/password', {
            method: 'PUT',
            body: JSON.stringify({ currentPassword, newPassword })
        });
    }

    // Métodos de quadros
    async getBoards() {
        return await this.request('/boards');
    }

    async getBoard(boardId) {
        return await this.request(`/boards/${boardId}`);
    }

    async createBoard(boardData) {
        return await this.request('/boards', {
            method: 'POST',
            body: JSON.stringify(boardData)
        });
    }

    async updateBoard(boardId, boardData) {
        return await this.request(`/boards/${boardId}`, {
            method: 'PUT',
            body: JSON.stringify(boardData)
        });
    }

    async deleteBoard(boardId) {
        return await this.request(`/boards/${boardId}`, {
            method: 'DELETE'
        });
    }    // Métodos de colunas
    async getColumns(boardId) {
        return await this.request(`/columns/board/${boardId}`);
    }

    async createColumn(columnData) {
        return await this.request('/columns', {
            method: 'POST',
            body: JSON.stringify(columnData)
        });
    }

    async updateColumn(columnId, columnData) {
        return await this.request(`/columns/${columnId}`, {
            method: 'PUT',
            body: JSON.stringify(columnData)
        });
    }    async deleteColumn(columnId) {
        return await this.request(`/columns/${columnId}`, {
            method: 'DELETE'
        });
    }

    async reorderColumns(columnIds) {
        return await this.request('/columns/reorder', {
            method: 'PUT',
            body: JSON.stringify({ columnIds })
        });
    }

    async reorderColumns(columnIds) {
        return await this.request('/columns/reorder', {
            method: 'PUT',
            body: JSON.stringify({ columnIds })
        });
    }

    // Métodos de cards
    async getCards(columnId) {
        return await this.request(`/cards/column/${columnId}`);
    }

    async getBoardCards(boardId) {
        return await this.request(`/cards/board/${boardId}`);
    }

    async createCard(cardData) {
        return await this.request('/cards', {
            method: 'POST',
            body: JSON.stringify(cardData)
        });
    }

    async updateCard(cardId, cardData) {
        return await this.request(`/cards/${cardId}`, {
            method: 'PUT',
            body: JSON.stringify(cardData)
        });
    }

    async moveCard(cardId, newColumnId, newPosition) {
        return await this.request(`/cards/${cardId}/move`, {
            method: 'PUT',
            body: JSON.stringify({ newColumnId, newPosition })
        });
    }

    async deleteCard(cardId) {
        return await this.request(`/cards/${cardId}`, {
            method: 'DELETE'
        });
    }

    async addComment(cardId, text) {
        return await this.request(`/cards/${cardId}/comments`, {
            method: 'POST',
            body: JSON.stringify({ text })
        });
    }

    // Métodos de equipes
    async getTeams() {
        return await this.request('/teams');
    }

    async createTeam(teamData) {
        return await this.request('/teams', {
            method: 'POST',
            body: JSON.stringify(teamData)
        });
    }

    async updateTeam(teamId, teamData) {
        return await this.request(`/teams/${teamId}`, {
            method: 'PUT',
            body: JSON.stringify(teamData)
        });
    }

    async deleteTeam(teamId) {
        return await this.request(`/teams/${teamId}`, {
            method: 'DELETE'
        });
    }

    async addTeamMember(teamId, userId) {
        return await this.request(`/teams/${teamId}/members`, {
            method: 'POST',
            body: JSON.stringify({ userId })
        });
    }

    async removeTeamMember(teamId, userId) {
        return await this.request(`/teams/${teamId}/members/${userId}`, {
            method: 'DELETE'
        });
    }
}

// Instância global da API
window.api = new API();