const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

/**
 * Login do usuário
 */
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Validações básicas
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email e senha são obrigatórios'
            });
        }
        
        // Buscar usuário por email
        const user = await User.findOne({ email: email.toLowerCase() });
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Credenciais inválidas'
            });
        }
        
        // Verificar senha
        const isPasswordValid = await user.comparePassword(password);
        
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Credenciais inválidas'
            });
        }
        
        // Verificar se usuário está ativo
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Conta desativada. Entre em contato com o administrador.'
            });
        }
        
        // Atualizar último login
        user.lastLogin = new Date();
        await user.save();
        
        // Gerar token JWT
        const token = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET || 'seu_jwt_secret_aqui',
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );
        
        res.json({
            success: true,
            message: 'Login realizado com sucesso',
            data: {
                token,
                user: user.toJSON()
            }
        });
        
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

/**
 * Registro de novo usuário
 */
const register = async (req, res) => {
    try {
        const { name, email, password, role = 'Membro' } = req.body;
        
        // Validações básicas
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Nome, email e senha são obrigatórios'
            });
        }
        
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Senha deve ter pelo menos 6 caracteres'
            });
        }
        
        // Verificar se usuário já existe
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Usuário já existe com este email'
            });
        }
        
        // Criar novo usuário
        const newUser = new User({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: password,
            role: role.trim()
        });
        
        await newUser.save();
        
        // Gerar token JWT
        const token = jwt.sign(
            { id: newUser._id, email: newUser.email },
            process.env.JWT_SECRET || 'seu_jwt_secret_aqui',
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );
        
        res.status(201).json({
            success: true,
            message: 'Usuário criado com sucesso',
            data: {
                token,
                user: newUser.toJSON()
            }
        });
        
    } catch (error) {
        console.error('Erro no registro:', error);
        
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'Email já está em uso'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

/**
 * Obter dados do usuário atual
 */
const getCurrentUser = async (req, res) => {
    try {
        res.json({
            success: true,
            data: {
                user: req.user.toJSON()
            }
        });
    } catch (error) {
        console.error('Erro ao obter usuário atual:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

/**
 * Logout (invalidar token - implementação básica)
 */
const logout = async (req, res) => {
    try {
        // Em uma implementação real, você poderia adicionar o token a uma blacklist
        res.json({
            success: true,
            message: 'Logout realizado com sucesso'
        });
    } catch (error) {
        console.error('Erro no logout:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

// Rotas
// POST /api/auth/login - Login
router.post('/login', login);

// POST /api/auth/register - Registro
router.post('/register', register);

// GET /api/auth/me - Usuário atual (requer autenticação)
router.get('/me', auth, getCurrentUser);

// POST /api/auth/logout - Logout (requer autenticação)
router.post('/logout', auth, logout);

module.exports = router;