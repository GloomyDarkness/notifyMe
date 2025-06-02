const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
    getBoards,
    getBoard,
    createBoard,
    updateBoard,
    deleteBoard
} = require('../controllers/boardController');

// Todas as rotas de boards requerem autenticação
router.use(auth);

// GET /api/boards - Listar quadros do usuário
router.get('/', getBoards);

// GET /api/boards/:id - Buscar quadro específico
router.get('/:id', getBoard);

// POST /api/boards - Criar novo quadro
router.post('/', createBoard);

// PUT /api/boards/:id - Atualizar quadro
router.put('/:id', updateBoard);

// DELETE /api/boards/:id - Remover quadro
router.delete('/:id', deleteBoard);

module.exports = router;