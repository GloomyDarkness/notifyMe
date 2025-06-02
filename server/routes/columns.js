const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
    getColumns,
    createColumn,
    updateColumn,
    deleteColumn,
    reorderColumns
} = require('../controllers/columnController');

// Todas as rotas de colunas requerem autenticação
router.use(auth);

// PUT /api/columns/reorder - Reordenar colunas (deve vir antes da rota /:id)
router.put('/reorder', reorderColumns);

// GET /api/columns/board/:boardId - Listar colunas de um quadro
router.get('/board/:boardId', getColumns);

// POST /api/columns - Criar nova coluna
router.post('/', createColumn);

// PUT /api/columns/:id - Atualizar coluna
router.put('/:id', updateColumn);

// DELETE /api/columns/:id - Remover coluna
router.delete('/:id', deleteColumn);

module.exports = router;