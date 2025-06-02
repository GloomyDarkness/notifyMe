const Board = require('../models/Board');
const Column = require('../models/Column');
const Card = require('../models/Card');

/**
 * Lista todos os quadros do usuário
 */
const getBoards = async (req, res) => {
    try {
        // Buscar quadros onde o usuário é owner ou membro
        const boards = await Board.find({
            $or: [
                { owner: req.user.id },
                { 'members.user': req.user.id }
            ],
            isActive: true
        })
        .populate('owner', 'name email photoUrl')
        .populate('members.user', 'name email photoUrl')
        .sort({ updatedAt: -1 });
        
        res.json({
            success: true,
            data: {
                boards
            }
        });
        
    } catch (error) {
        console.error('Erro ao buscar quadros:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

/**
 * Busca um quadro específico com suas colunas e cards
 */
const getBoard = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Buscar quadro
        const board = await Board.findById(id)
            .populate('owner', 'name email photoUrl')
            .populate('members.user', 'name email photoUrl');
        
        if (!board) {
            return res.status(404).json({
                success: false,
                message: 'Quadro não encontrado'
            });
        }
        
        // Verificar se o usuário tem acesso
        const hasAccess = board.owner._id.toString() === req.user.id || 
                         board.members.some(member => member.user._id.toString() === req.user.id);
        
        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: 'Você não tem permissão para acessar este quadro'
            });
        }
        
        // Buscar colunas do quadro com cards
        const columns = await Column.find({ board: id })
            .populate({
                path: 'cards',
                populate: {
                    path: 'assignedTo',
                    select: 'name email photoUrl'
                }
            })
            .sort({ position: 1 });
        
        res.json({
            success: true,
            data: {
                board,
                columns
            }
        });
        
    } catch (error) {
        console.error('Erro ao buscar quadro:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

/**
 * Cria um novo quadro
 */
const createBoard = async (req, res) => {
    try {
        const { name, description, isPublic = false } = req.body;
        
        // Validações
        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Nome do quadro é obrigatório'
            });
        }
        
        // Criar novo quadro
        const newBoard = new Board({
            name: name.trim(),
            description: description ? description.trim() : '',
            owner: req.user.id,
            isPublic,
            members: []
        });
        
        await newBoard.save();
        
        // Popular dados do owner
        await newBoard.populate('owner', 'name email photoUrl');
        
        res.status(201).json({
            success: true,
            message: 'Quadro criado com sucesso',
            data: {
                board: newBoard
            }
        });
        
    } catch (error) {
        console.error('Erro ao criar quadro:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

/**
 * Atualiza um quadro
 */
const updateBoard = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, isPublic } = req.body;
        
        // Buscar quadro
        const board = await Board.findById(id);
        if (!board) {
            return res.status(404).json({
                success: false,
                message: 'Quadro não encontrado'
            });
        }
        
        // Verificar se o usuário é o owner
        if (board.owner.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Apenas o proprietário pode editar o quadro'
            });
        }
        
        // Atualizar campos
        if (name) board.name = name.trim();
        if (description !== undefined) board.description = description.trim();
        if (isPublic !== undefined) board.isPublic = isPublic;
        
        await board.save();
        
        res.json({
            success: true,
            message: 'Quadro atualizado com sucesso',
            data: {
                board
            }
        });
        
    } catch (error) {
        console.error('Erro ao atualizar quadro:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

/**
 * Remove um quadro
 */
const deleteBoard = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Buscar quadro
        const board = await Board.findById(id);
        if (!board) {
            return res.status(404).json({
                success: false,
                message: 'Quadro não encontrado'
            });
        }
        
        // Verificar se o usuário é o owner
        if (board.owner.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Apenas o proprietário pode remover o quadro'
            });
        }
        
        // Remover todas as colunas e cards do quadro
        const columns = await Column.find({ board: id });
        for (const column of columns) {
            await Card.deleteMany({ column: column._id });
        }
        await Column.deleteMany({ board: id });
        
        // Remover quadro
        await Board.findByIdAndDelete(id);
        
        res.json({
            success: true,
            message: 'Quadro removido com sucesso'
        });
        
    } catch (error) {
        console.error('Erro ao remover quadro:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

module.exports = {
    getBoards,
    getBoard,
    createBoard,
    updateBoard,
    deleteBoard
};