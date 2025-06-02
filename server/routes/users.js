const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

/**
 * Listar usuários (para busca de membros)
 */
const getUsers = async (req, res) => {
    try {
        const { search, limit = 10 } = req.query;
        
        let query = { isActive: true };
        
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }
        
        const users = await User.find(query)
            .select('name email photoUrl role')
            .limit(parseInt(limit))
            .sort({ name: 1 });
        
        res.json({
            success: true,
            data: {
                users
            }
        });
        
    } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

/**
 * Atualizar perfil do usuário
 */
const updateProfile = async (req, res) => {
    try {
        const { name, photoUrl } = req.body;
        
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuário não encontrado'
            });
        }
        
        if (name) user.name = name.trim();
        if (photoUrl !== undefined) user.photoUrl = photoUrl.trim();
        
        await user.save();
        
        res.json({
            success: true,
            message: 'Perfil atualizado com sucesso',
            data: {
                user: user.toJSON()
            }
        });
        
    } catch (error) {
        console.error('Erro ao atualizar perfil:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

// Todas as rotas requerem autenticação
router.use(auth);

// GET /api/users - Listar usuários
router.get('/', getUsers);

// PUT /api/users/profile - Atualizar perfil
router.put('/profile', updateProfile);

module.exports = router;