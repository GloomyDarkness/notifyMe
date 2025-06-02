const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware de autenticação JWT
 */
const auth = async (req, res, next) => {
    try {
        // Obter token do header Authorization
        const authHeader = req.header('Authorization');
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Token de acesso não fornecido'
            });
        }
        
        // Extrair token (remover "Bearer " do início)
        const token = authHeader.substring(7);
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token de acesso inválido'
            });
        }
        
        try {
            // Verificar e decodificar token
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'seu_jwt_secret_aqui');
            
            // Buscar usuário no banco de dados
            const user = await User.findById(decoded.id);
            
            if (!user || !user.isActive) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuário não encontrado ou inativo'
                });
            }
            
            // Adicionar usuário ao objeto request
            req.user = user;
            
            next();
            
        } catch (jwtError) {
            console.error('Erro JWT:', jwtError.message);
            
            return res.status(401).json({
                success: false,
                message: 'Token inválido ou expirado'
            });
        }
        
    } catch (error) {
        console.error('Erro no middleware de autenticação:', error);
        
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

module.exports = auth;