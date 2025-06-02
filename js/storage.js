/**
 * Módulo responsável pelo armazenamento e persistência dos dados
 */
class Storage {
    constructor() {
        this.storageKey = 'taskBoardData';
        this.defaultData = {
            columns: [
                {
                    id: this.generateId(),
                    title: 'Sistemas a ser desenvolvido',
                    type: 'pending',
                    cards: [
                        {
                            id: this.generateId(),
                            title: 'Alterar o texto na hora de comprar gamepass "jogo"',
                            description: '',
                            dueDate: this.formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)), // +30 dias
                            priority: 'alta'
                        },
                        {
                            id: this.generateId(),
                            title: 'Criar sistema de verificação automática de gamepass',
                            description: 'Sistema que verifica automaticamente de tempos em tempos se a pessoa criou a gamepass por um período de tempo após a compra.',
                            dueDate: this.formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)), // +30 dias
                            priority: 'alta'
                        },
                        {
                            id: this.generateId(),
                            title: 'Desenvolver sistema de assinatura por Robux',
                            description: '',
                            dueDate: this.formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)), // +30 dias
                            priority: 'alta'
                        }
                    ]
                },
                {
                    id: this.generateId(),
                    title: 'Pontos urgentes',
                    type: 'urgent',
                    cards: [
                        {
                            id: this.generateId(),
                            title: 'Ir atrás de Dev',
                            description: 'Data limite para achar no mínimo 1 - 28/03',
                            dueDate: '2024-03-28',
                            priority: 'urgente'
                        }
                    ]
                },
                {
                    id: this.generateId(),
                    title: 'Implementar oficialmente',
                    type: 'normal',
                    cards: [
                        {
                            id: this.generateId(),
                            title: 'Sistema de criar gamepass sozinho',
                            description: '',
                            dueDate: '',
                            priority: 'media'
                        }
                    ]
                },
                {
                    id: this.generateId(),
                    title: 'Concluídos',
                    type: 'completed',
                    cards: [
                        {
                            id: this.generateId(),
                            title: 'Trocar a interação de suporte',
                            description: 'Quando chamar suporte, ao invés de marcar um adm, enviar o link de como criar uma gamepass',
                            dueDate: '',
                            priority: 'baixa'
                        },
                        {
                            id: this.generateId(),
                            title: 'Sistema de verificação do discord',
                            description: 'Sistema para caso a loja caia, realocar todo mundo para o segundo discord',
                            dueDate: '',
                            priority: 'media'
                        },
                        {
                            id: this.generateId(),
                            title: 'Sistema de detector automático das gamepass',
                            description: '',
                            dueDate: '',
                            priority: 'alta'
                        }
                    ]
                },
                {
                    id: this.generateId(),
                    title: 'Pontos a serem arrumados',
                    type: 'pending',
                    cards: [
                        {
                            id: this.generateId(),
                            title: 'Erro de sobrecarga da aplicação',
                            description: '> [PaymentAPI] Verificando status do pagamento: 012036af45454305a53a0d5dd6d27e30\n[PaymentAPI] Erro ao verificar status do pagamento: TypeError: Cannot read properties of undefined (reading \'data\')\n    at /application/node_modules/sdk-node-apis-efi/dist/cjs/index.cjs:810:34\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async PaymentAPI.checkPaymentStatus (/application/src/utils/PaymentAPI.js:223:30)\n    at async PixHandler.checkPaymentStatus (/application/src/services/ticket/pixHandler.js:258:20)\n    at async Timeout.checkPayment [as _onTimeout] (/application/src/services/ticket/pixHandler.js:282:43)\n[PixHandler] Erro ao verificar status do pagamento: Error: Falha ao verificar status do pagamento: Cannot read properties of undefined (reading \'data\')\n    at PaymentAPI.checkPaymentStatus (/application/src/utils/PaymentAPI.js:254:19)\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async PixHandler.checkPaymentStatus (/application/src/services/ticket/pixHandler.js:258:20)\n    at async Timeout.checkPayment [as _onTimeout] (/application/src/services/ticket/pixHandler.js:282:43)\n[Verificação] Status do pagamento 012036af45454305a53a0d5dd6d27e30: pending\n[PaymentAPI] Verificando status do pagamento: c6d8e113b9154002b21dd8f0fa73c44d',
                            dueDate: '',
                            priority: 'alta'
                        }
                    ]
                }
            ]
        };
    }

    /**
     * Gera um ID único
     * @returns {string} ID único
     */
    generateId() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    /**
     * Formata uma data para o formato YYYY-MM-DD
     * @param {Date} date - Data a ser formatada
     * @returns {string} Data formatada
     */
    formatDate(date) {
        if (!date || !(date instanceof Date) || isNaN(date)) return '';
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    /**
     * Carrega os dados do localStorage
     * @returns {Object} Dados carregados
     */
    loadData() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : this.defaultData;
        } catch (error) {
            console.error('Erro ao carregar dados do localStorage:', error);
            return this.defaultData;
        }
    }

    /**
     * Salva os dados no localStorage
     * @param {Object} data - Dados a serem salvos
     */
    saveData(data) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
        } catch (error) {
            console.error('Erro ao salvar dados no localStorage:', error);
        }
    }

    /**
     * Obtém todas as colunas
     * @returns {Array} Lista de colunas
     */
    getColumns() {
        return this.loadData().columns || [];
    }

    /**
     * Adiciona uma nova coluna
     * @param {Object} column - Dados da coluna
     * @returns {Object} Coluna adicionada
     */
    addColumn(column) {
        const data = this.loadData();
        const newColumn = {
            id: this.generateId(),
            ...column,
            cards: []
        };
        data.columns.push(newColumn);
        this.saveData(data);
        return newColumn;
    }

    /**
     * Atualiza uma coluna existente
     * @param {string} columnId - ID da coluna
     * @param {Object} updates - Dados a serem atualizados
     * @returns {Object|null} Coluna atualizada ou null se não encontrada
     */
    updateColumn(columnId, updates) {
        const data = this.loadData();
        const columnIndex = data.columns.findIndex(col => col.id === columnId);
        
        if (columnIndex === -1) return null;
        
        data.columns[columnIndex] = {
            ...data.columns[columnIndex],
            ...updates
        };
        
        this.saveData(data);
        return data.columns[columnIndex];
    }

    /**
     * Remove uma coluna
     * @param {string} columnId - ID da coluna
     * @returns {boolean} True se removida com sucesso
     */
    removeColumn(columnId) {
        const data = this.loadData();
        const columnIndex = data.columns.findIndex(col => col.id === columnId);
        
        if (columnIndex === -1) return false;
        
        data.columns.splice(columnIndex, 1);
        this.saveData(data);
        return true;
    }

    /**
     * Obtém todos os cards de uma coluna
     * @param {string} columnId - ID da coluna
     * @returns {Array} Lista de cards
     */
    getCards(columnId) {
        const data = this.loadData();
        const column = data.columns.find(col => col.id === columnId);
        return column ? column.cards : [];
    }

    /**
     * Adiciona um novo card a uma coluna
     * @param {string} columnId - ID da coluna
     * @param {Object} card - Dados do card
     * @returns {Object|null} Card adicionado ou null se coluna não encontrada
     */
    addCard(columnId, card) {
        const data = this.loadData();
        const columnIndex = data.columns.findIndex(col => col.id === columnId);
        
        if (columnIndex === -1) return null;
        
        const newCard = {
            id: this.generateId(),
            ...card
        };
        
        data.columns[columnIndex].cards.push(newCard);
        this.saveData(data);
        return newCard;
    }

    /**
     * Atualiza um card existente
     * @param {string} columnId - ID da coluna
     * @param {string} cardId - ID do card
     * @param {Object} updates - Dados a serem atualizados
     * @returns {Object|null} Card atualizado ou null se não encontrado
     */
    updateCard(columnId, cardId, updates) {
        const data = this.loadData();
        const columnIndex = data.columns.findIndex(col => col.id === columnId);
        
        if (columnIndex === -1) return null;
        
        const cardIndex = data.columns[columnIndex].cards.findIndex(c => c.id === cardId);
        
        if (cardIndex === -1) return null;
        
        data.columns[columnIndex].cards[cardIndex] = {
            ...data.columns[columnIndex].cards[cardIndex],
            ...updates
        };
        
        this.saveData(data);
        return data.columns[columnIndex].cards[cardIndex];
    }

    /**
     * Remove um card
     * @param {string} columnId - ID da coluna
     * @param {string} cardId - ID do card
     * @returns {boolean} True se removido com sucesso
     */
    removeCard(columnId, cardId) {
        const data = this.loadData();
        const columnIndex = data.columns.findIndex(col => col.id === columnId);
        
        if (columnIndex === -1) return false;
        
        const cardIndex = data.columns[columnIndex].cards.findIndex(c => c.id === cardId);
        
        if (cardIndex === -1) return false;
        
        data.columns[columnIndex].cards.splice(cardIndex, 1);
        this.saveData(data);
        return true;
    }

    /**
     * Move um card de uma coluna para outra
     * @param {string} sourceColumnId - ID da coluna de origem
     * @param {string} targetColumnId - ID da coluna de destino
     * @param {string} cardId - ID do card
     * @returns {boolean} True se movido com sucesso
     */
    moveCard(sourceColumnId, targetColumnId, cardId) {
        const data = this.loadData();
        const sourceColumnIndex = data.columns.findIndex(col => col.id === sourceColumnId);
        
        if (sourceColumnIndex === -1) return false;
        
        const targetColumnIndex = data.columns.findIndex(col => col.id === targetColumnId);
        
        if (targetColumnIndex === -1) return false;
        
        const cardIndex = data.columns[sourceColumnIndex].cards.findIndex(c => c.id === cardId);
        
        if (cardIndex === -1) return false;
        
        const card = data.columns[sourceColumnIndex].cards[cardIndex];
        data.columns[sourceColumnIndex].cards.splice(cardIndex, 1);
        data.columns[targetColumnIndex].cards.push(card);
        
        this.saveData(data);
        return true;
    }

    /**
     * Atualiza a ordem dos cards em uma coluna
     * @param {string} columnId - ID da coluna
     * @param {Array} cardIds - Lista de IDs dos cards na nova ordem
     * @returns {boolean} True se atualizado com sucesso
     */
    updateCardOrder(columnId, cardIds) {
        const data = this.loadData();
        const columnIndex = data.columns.findIndex(col => col.id === columnId);
        
        if (columnIndex === -1) return false;
        
        const cards = [...data.columns[columnIndex].cards];
        const newCards = cardIds.map(id => cards.find(card => card.id === id)).filter(Boolean);
        
        data.columns[columnIndex].cards = newCards;
        this.saveData(data);
        return true;
    }
}

// Exporta uma instância única do Storage
const storage = new Storage();