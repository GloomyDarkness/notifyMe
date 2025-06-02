const Column = require('../models/Column');
const Board = require('../models/Board');
const mongoose = require('mongoose');

/**
 * Função para criar coluna com tratamento robusto de erros
 */
async function createColumnSafe(columnData) {
    try {
        // Primeira tentativa com posição baseada em timestamp
        const timestamp = Date.now();
        const newColumn = new Column({
            ...columnData,
            position: timestamp
        });
        
        return await newColumn.save();
        
    } catch (error) {
        if (error.code === 11000) {
            // Se houver conflito, tentar com timestamp + random
            console.log('⚠️ Conflito de posição detectado, tentando novamente...');
            
            try {
                const uniquePosition = Date.now() + Math.floor(Math.random() * 10000);
                const retryColumn = new Column({
                    ...columnData,
                    position: uniquePosition
                });
                
                return await retryColumn.save();
                
            } catch (retryError) {
                console.error('❌ Erro na segunda tentativa:', retryError);
                throw retryError;
            }
        }
        throw error;
    }
}

/**
 * Função para limpar dados problemáticos na inicialização
 */
async function cleanupOnStartup() {
    try {
        console.log('🧹 Verificando integridade dos dados...');
        
        // Buscar todas as colunas e verificar duplicatas de posição
        const allColumns = await Column.find({}).sort({ board: 1, position: 1 });
        const boardGroups = {};
        
        // Agrupar por board
        allColumns.forEach(col => {
            if (!boardGroups[col.board]) {
                boardGroups[col.board] = [];
            }
            boardGroups[col.board].push(col);
        });
        
        let hasIssues = false;
        
        // Verificar cada board
        for (const boardId in boardGroups) {
            const columns = boardGroups[boardId];
            const positions = columns.map(c => c.position);
            const uniquePositions = [...new Set(positions)];
            
            if (positions.length !== uniquePositions.length) {
                console.log(`⚠️ Posições duplicadas encontradas no board ${boardId}`);
                hasIssues = true;
                
                // Corrigir posições duplicadas
                for (let i = 0; i < columns.length; i++) {
                    const newPosition = Date.now() + i;
                    await Column.updateOne(
                        { _id: columns[i]._id },
                        { $set: { position: newPosition } }
                    );
                }
                console.log(`✅ Corrigidas ${columns.length} colunas do board ${boardId}`);
            }
        }
        
        if (!hasIssues) {
            console.log('✅ Dados estão íntegros');
        } else {
            console.log('✅ Problemas de dados corrigidos');
        }
        
    } catch (error) {
        console.error('❌ Erro na limpeza de dados:', error);
    }
}

module.exports = {
    createColumnSafe,
    cleanupOnStartup
};