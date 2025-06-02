const Column = require('../models/Column');
const Board = require('../models/Board');
const Card = require('../models/Card');
const { createColumnSafe } = require('../utils/columnUtils');

/**
 * Lista todas as colunas de um quadro
 */
const getColumns = async (req, res) => {
    try {
        const { boardId } = req.params;
        
        // Verificar se o quadro existe e se o usuário tem acesso
        const board = await Board.findById(boardId);
        if (!board) {
            return res.status(404).json({
                success: false,
                message: 'Quadro não encontrado'
            });
        }
        
        // Verificar se o usuário é owner ou membro do quadro
        const hasAccess = board.owner.toString() === req.user.id || 
                         board.members.some(member => member.user.toString() === req.user.id);
        
        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: 'Você não tem permissão para acessar este quadro'
            });
        }
        
        // Buscar colunas do quadro com cards populados
        const columns = await Column.find({ board: boardId })
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
                columns
            }
        });
        
    } catch (error) {
        console.error('Erro ao buscar colunas:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

/**
 * Cria uma nova coluna
 */
const createColumn = async (req, res) => {
    try {
        const { title, type = 'normal', boardId } = req.body;
        
        // Validações
        if (!title || !boardId) {
            return res.status(400).json({
                success: false,
                message: 'Título e ID do quadro são obrigatórios'
            });
        }
        
        // Verificar se o quadro existe e se o usuário tem acesso
        const board = await Board.findById(boardId);
        if (!board) {
            return res.status(404).json({
                success: false,
                message: 'Quadro não encontrado'
            });
        }
        
        // Verificar se o usuário é owner ou membro do quadro
        const hasAccess = board.owner.toString() === req.user.id || 
                         board.members.some(member => member.user.toString() === req.user.id);
        
        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: 'Você não tem permissão para adicionar colunas a este quadro'
            });
        }        // Criar nova coluna usando função segura
        const newColumn = await createColumnSafe({
            title: title.trim(),
            type,
            board: boardId,
            cards: []
        });
        
        res.status(201).json({
            success: true,
            message: 'Coluna criada com sucesso',
            data: {
                column: newColumn
            }
        });
        
    } catch (error) {
        console.error('Erro ao criar coluna:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

/**
 * Atualiza uma coluna
 */
const updateColumn = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, type } = req.body;
        
        // Buscar coluna
        const column = await Column.findById(id).populate('board');
        if (!column) {
            return res.status(404).json({
                success: false,
                message: 'Coluna não encontrada'
            });
        }
        
        // Verificar se o usuário tem permissão
        const board = column.board;
        const hasAccess = board.owner.toString() === req.user.id || 
                         board.members.some(member => member.user.toString() === req.user.id);
        
        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: 'Você não tem permissão para editar esta coluna'
            });
        }
        
        // Atualizar coluna
        if (title) column.title = title.trim();
        if (type) column.type = type;
        
        await column.save();
        
        res.json({
            success: true,
            message: 'Coluna atualizada com sucesso',
            data: {
                column
            }
        });
        
    } catch (error) {
        console.error('Erro ao atualizar coluna:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

/**
 * Remove uma coluna
 */
const deleteColumn = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Buscar coluna
        const column = await Column.findById(id).populate('board');
        if (!column) {
            return res.status(404).json({
                success: false,
                message: 'Coluna não encontrada'
            });
        }
        
        // Verificar se o usuário tem permissão
        const board = column.board;
        const hasAccess = board.owner.toString() === req.user.id || 
                         board.members.some(member => member.user.toString() === req.user.id);
        
        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: 'Você não tem permissão para remover esta coluna'
            });
        }
        
        // Remover todos os cards da coluna
        await Card.deleteMany({ column: id });
        
        // Remover coluna
        await Column.findByIdAndDelete(id);
        
        res.json({
            success: true,
            message: 'Coluna removida com sucesso'
        });
        
    } catch (error) {
        console.error('Erro ao remover coluna:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

/**
 * Reordena colunas
 */
const reorderColumns = async (req, res) => {
    try {
        const { columnIds } = req.body;
        
        if (!Array.isArray(columnIds)) {
            return res.status(400).json({
                success: false,
                message: 'Lista de IDs das colunas é obrigatória'
            });
        }
        
        // Verificar se todas as colunas pertencem ao mesmo quadro e o usuário tem permissão
        if (columnIds.length > 0) {
            const firstColumn = await Column.findById(columnIds[0]).populate('board');
            if (!firstColumn) {
                return res.status(404).json({
                    success: false,
                    message: 'Coluna não encontrada'
                });
            }
            
            const board = firstColumn.board;
            const hasAccess = board.owner.toString() === req.user.id || 
                             board.members.some(member => member.user.toString() === req.user.id);
            
            if (!hasAccess) {
                return res.status(403).json({
                    success: false,
                    message: 'Você não tem permissão para reordenar estas colunas'
                });
            }
        }
        
        // Atualizar posição de cada coluna usando timestamp para evitar conflitos
        const baseTime = Date.now();
        const updatePromises = columnIds.map((columnId, index) => 
            Column.findByIdAndUpdate(columnId, { position: baseTime + index })
        );
        
        await Promise.all(updatePromises);
        
        res.json({
            success: true,
            message: 'Colunas reordenadas com sucesso'
        });
        
    } catch (error) {
        console.error('Erro ao reordenar colunas:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

module.exports = {
    getColumns,
    createColumn,
    updateColumn,
    deleteColumn,
    reorderColumns
};