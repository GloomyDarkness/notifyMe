/**
 * Classe responsável pelo gerenciamento das colunas
 */
class ColumnManager {
    constructor() {
        this.boardElement = document.getElementById('board');
        this.saveOrderBtn = document.getElementById('saveOrderBtn');
        this.setupSortable();
        this.setupEventListeners();
    }

    /**
     * Configura os listeners de eventos
     */
    setupEventListeners() {
        // Botão para salvar a ordem atual das colunas
        this.saveOrderBtn.addEventListener('click', () => {
            this.saveColumnOrder();
            this.showToast('Ordem das colunas salva com sucesso!');
        });
    }

    /**
     * Configura o Sortable para permitir reordenação de colunas
     */
    setupSortable() {
        const self = this;
        
        this.boardSortable = new Sortable(this.boardElement, {
            animation: 150,
            handle: '.column-header',  // Apenas arrastar pelo cabeçalho
            draggable: '.column',
            ghostClass: 'column-ghost',
            dragClass: 'column-drag',
            onEnd: function(evt) {
                // Atualiza a ordem das colunas no storage temporariamente
                // (Será salvo permanentemente apenas quando o botão "Salvar Ordem" for clicado)
                self.updateColumnOrder();
            }
        });
    }

    /**
     * Atualiza a ordem das colunas no objeto de armazenamento
     */
    updateColumnOrder() {
        const columnElements = Array.from(this.boardElement.querySelectorAll('.column'));
        const columnIds = columnElements.map(column => column.dataset.id);
        
        const columns = storage.getColumns();
        const reorderedColumns = columnIds.map(id => columns.find(col => col.id === id));
        
        // Armazena temporariamente a nova ordem
        this.temporaryOrder = reorderedColumns;
    }

    /**
     * Salva permanentemente a ordem das colunas
     */
    saveColumnOrder() {
        if (!this.temporaryOrder) return false;
        
        const data = storage.loadData();
        data.columns = this.temporaryOrder;
        storage.saveData(data);
        
        return true;
    }

    /**
     * Exibe uma mensagem toast
     * @param {string} message - Mensagem a ser exibida
     */
    showToast(message) {
        // Cria um elemento toast
        const toastContainer = document.createElement('div');
        toastContainer.className = 'position-fixed bottom-0 end-0 p-3';
        toastContainer.style.zIndex = '11';
        
        toastContainer.innerHTML = `
            <div class="toast show" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header">
                    <strong class="me-auto">NotifyMe</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Fechar"></button>
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
            setTimeout(() => {
                toastContainer.remove();
            }, 500);
        }, 3000);
    }
}