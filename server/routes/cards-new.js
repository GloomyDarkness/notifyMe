const express = require('express');
const Card = require('../models/Card');
const Column = require('../models/Column');
const Board = require('../models/Board');
const auth = require('../middleware/auth');

const router = express.Router();

/**
 * Cria um novo card
 */
const createCard = async (req, res) => {
    try {
        const { title, description, priority = 'media', dueDate, columnId } = req.body;
        
        // Validações
        if (!title || !columnId) {
            return res.status(400).json({
                success: false,
                message: 'Título e ID da coluna são obrigatórios'
            });
        }
        
        // Verificar se a coluna existe e se o usuário tem acesso
        const column = await Column.findById(columnId).populate('board');
        if (!column) {
            return res.status(404).json({
                success: false,
                message: 'Coluna não encontrada'
            });
        }
        
        // Verificar acesso ao quadro
        const board = column.board;
        const hasAccess = board.owner.toString() === req.user.id || 
                         board.members.some(member => member.user.toString() === req.user.id);
        
        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: 'Você não tem permissão para adicionar cards a esta coluna'
            });
        }
        
        // Obter posição do novo card
        const lastCard = await Card.findOne({ column: columnId }).sort({ position: -1 });
        const position = lastCard ? lastCard.position + 1 : 0;
        
        // Criar novo card
        const cardData = {
            title: title.trim(),
            description: description ? description.trim() : '',
            priority,
            column: columnId,
            position
        };
        
        if (dueDate) {
            cardData.dueDate = new Date(dueDate);
        }
        
        const newCard = new Card(cardData);
        await newCard.save();
        
        // Adicionar card à coluna
        column.cards.push(newCard._id);
        await column.save();
        
        res.status(201).json({
            success: true,
            message: 'Card criado com sucesso',
            data: {
                card: newCard
            }
        });
        
    } catch (error) {
        console.error('Erro ao criar card:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

/**
 * Atualiza um card
 */
const updateCard = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, priority, dueDate } = req.body;
        
        // Buscar card
        const card = await Card.findById(id).populate({
            path: 'column',
            populate: {
                path: 'board'
            }
        });
        
        if (!card) {
            return res.status(404).json({
                success: false,
                message: 'Card não encontrado'
            });
        }
        
        // Verificar permissão
        const board = card.column.board;
        const hasAccess = board.owner.toString() === req.user.id || 
                         board.members.some(member => member.user.toString() === req.user.id);
        
        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: 'Você não tem permissão para editar este card'
            });
        }
        
        // Atualizar campos
        if (title) card.title = title.trim();
        if (description !== undefined) card.description = description.trim();
        if (priority) card.priority = priority;
        if (dueDate !== undefined) {
            card.dueDate = dueDate ? new Date(dueDate) : null;
        }
        
        await card.save();
        
        res.json({
            success: true,
            message: 'Card atualizado com sucesso',
            data: {
                card
            }
        });
        
    } catch (error) {
        console.error('Erro ao atualizar card:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

/**
 * Remove um card
 */
const deleteCard = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Buscar card
        const card = await Card.findById(id).populate({
            path: 'column',
            populate: {
                path: 'board'
            }
        });
        
        if (!card) {
            return res.status(404).json({
                success: false,
                message: 'Card não encontrado'
            });
        }
        
        // Verificar permissão
        const board = card.column.board;
        const hasAccess = board.owner.toString() === req.user.id || 
                         board.members.some(member => member.user.toString() === req.user.id);
        
        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: 'Você não tem permissão para remover este card'
            });
        }
        
        // Remover card da coluna
        const column = await Column.findById(card.column._id);
        column.cards.pull(card._id);
        await column.save();
        
        // Remover card
        await Card.findByIdAndDelete(id);
        
        res.json({
            success: true,
            message: 'Card removido com sucesso'
        });
        
    } catch (error) {
        console.error('Erro ao remover card:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

// Aplicar middleware de autenticação a todas as rotas
router.use(auth);

// POST /api/cards - Criar novo card
router.post('/', createCard);

// PUT /api/cards/:id - Atualizar card
router.put('/:id', updateCard);

// DELETE /api/cards/:id - Remover card
router.delete('/:id', deleteCard);

module.exports = router;