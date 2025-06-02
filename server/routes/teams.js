const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Placeholder para controller de teams
const teamController = {
    getTeams: (req, res) => res.json({ success: true, data: { teams: [] } }),
    createTeam: (req, res) => res.json({ success: true, message: 'Time criado' }),
    updateTeam: (req, res) => res.json({ success: true, message: 'Time atualizado' }),
    deleteTeam: (req, res) => res.json({ success: true, message: 'Time removido' })
};

// Todas as rotas de teams requerem autenticação
router.use(auth);

// GET /api/teams - Listar times do usuário
router.get('/', teamController.getTeams);

// POST /api/teams - Criar novo time
router.post('/', teamController.createTeam);

// PUT /api/teams/:id - Atualizar time
router.put('/:id', teamController.updateTeam);

// DELETE /api/teams/:id - Remover time
router.delete('/:id', teamController.deleteTeam);

module.exports = router;