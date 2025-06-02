/**
 * Gerenciador de quadros
 */
class BoardManager {
    constructor() {
        this.boards = [];
        this.currentBoardId = null;
    }

    /**
     * Carrega a lista de quadros
     */
    async loadBoards() {
        try {
            const response = await api.getBoards();
            
            if (response.success) {
                this.boards = response.data.boards;
                return this.boards;
            }
        } catch (error) {
            console.error('Erro ao carregar quadros:', error);
            return [];
        }
    }

    /**
     * Cria um novo quadro
     */
    async createBoard(boardData) {
        try {
            const response = await api.createBoard(boardData);
            
            if (response.success) {
                this.boards.push(response.data.board);
                return response.data.board;
            }
        } catch (error) {
            console.error('Erro ao criar quadro:', error);
            throw error;
        }
    }

    /**
     * Obtém um quadro por ID
     */
    async getBoard(boardId) {
        try {
            const response = await api.getBoard(boardId);
            
            if (response.success) {
                this.currentBoardId = boardId;
                return response.data;
            }
        } catch (error) {
            console.error('Erro ao obter quadro:', error);
            throw error;
        }
    }

    /**
     * Atualiza um quadro
     */
    async updateBoard(boardId, boardData) {
        try {
            const response = await api.updateBoard(boardId, boardData);
            
            if (response.success) {
                const index = this.boards.findIndex(b => b._id === boardId);
                if (index !== -1) {
                    this.boards[index] = response.data.board;
                }
                return response.data.board;
            }
        } catch (error) {
            console.error('Erro ao atualizar quadro:', error);
            throw error;
        }
    }

    /**
     * Remove um quadro
     */
    async deleteBoard(boardId) {
        try {
            const response = await api.deleteBoard(boardId);
            
            if (response.success) {
                this.boards = this.boards.filter(b => b._id !== boardId);
                return true;
            }
        } catch (error) {
            console.error('Erro ao remover quadro:', error);
            throw error;
        }
    }
}