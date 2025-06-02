const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

async function fixIndexes() {
    try {
        // Usar a mesma string de conexão do servidor principal
        const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/NotifyMe';
        console.log('🔌 Tentando conectar ao MongoDB:', mongoUri);
        
        // Conectar ao MongoDB com timeout
        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 5000, // 5 segundos timeout
            connectTimeoutMS: 5000,
            maxPoolSize: 1
        });
        console.log('✅ Conectado ao MongoDB');

        const db = mongoose.connection.db;
        
        // Listar coleções
        const collections = await db.listCollections().toArray();
        console.log('📋 Coleções encontradas:', collections.map(c => c.name));

        // Verificar se a coleção columns existe
        const hasColumnsCollection = collections.some(c => c.name === 'columns');
        
        if (!hasColumnsCollection) {
            console.log('ℹ️ Coleção "columns" não existe ainda. Isso é normal em uma instalação nova.');
            console.log('✅ Banco está pronto para uso!');
            return;
        }

        // Verificar e corrigir índices da coleção columns
        const columnsCollection = db.collection('columns');
        
        console.log('\n🔍 Verificando índices da coleção columns...');
        const indexes = await columnsCollection.indexes();
        console.log('Índices atuais:', indexes.map(i => ({ name: i.name, key: i.key })));

        // Remover índice problemático se existir
        try {
            await columnsCollection.dropIndex('id_1');
            console.log('✅ Índice problemático "id_1" removido');
        } catch (error) {
            if (error.code === 27) {
                console.log('ℹ️ Índice "id_1" não existe (ok)');
            } else {
                console.log('⚠️ Aviso ao remover índice:', error.message);
            }
        }

        // Verificar se existem colunas
        const columnCount = await columnsCollection.countDocuments();
        console.log(`📊 Total de colunas encontradas: ${columnCount}`);
        
        if (columnCount === 0) {
            console.log('ℹ️ Nenhuma coluna encontrada. Banco está limpo!');
            console.log('✅ Limpeza concluída com sucesso!');
            return;
        }

        // Limpar documentos com problemas de posição
        console.log('\n🧹 Limpando posições duplicadas...');
        
        // Buscar todas as colunas agrupadas por board
        const columns = await columnsCollection.find({}).toArray();
        const boardGroups = {};
        
        columns.forEach(col => {
            if (!boardGroups[col.board]) {
                boardGroups[col.board] = [];
            }
            boardGroups[col.board].push(col);
        });

        // Corrigir posições para cada board
        for (const boardId in boardGroups) {
            const boardColumns = boardGroups[boardId];
            console.log(`📝 Corrigindo ${boardColumns.length} colunas para board ${boardId}`);
            
            // Ordenar por createdAt e reindexar posições
            boardColumns.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            
            for (let i = 0; i < boardColumns.length; i++) {
                const newPosition = Date.now() + i; // Usar timestamp para evitar conflitos
                await columnsCollection.updateOne(
                    { _id: boardColumns[i]._id },
                    { $set: { position: newPosition } }
                );
                console.log(`  ↻ Coluna "${boardColumns[i].title}" → posição ${newPosition}`);
            }
        }

        console.log('✅ Posições corrigidas');
        console.log('\n🎉 Limpeza concluída com sucesso!');
        
    } catch (error) {
        if (error.name === 'MongooseServerSelectionError') {
            console.error('❌ Erro: MongoDB não está rodando!');
            console.log('\n🔧 Para corrigir:');
            console.log('1. Inicie o MongoDB:');
            console.log('   - Windows: Execute "mongod" no terminal ou inicie o serviço');
            console.log('   - macOS: brew services start mongodb-community');
            console.log('   - Linux: sudo systemctl start mongod');
            console.log('\n2. Ou use MongoDB Atlas (nuvem):');
            console.log('   - Crie uma conta em https://cloud.mongodb.com');
            console.log('   - Configure MONGODB_URI no arquivo .env');
        } else {
            console.error('❌ Erro durante a limpeza:', error.message);
        }
    } finally {
        try {
            await mongoose.disconnect();
            console.log('🔌 Desconectado do MongoDB');
        } catch (disconnectError) {
            // Ignorar erros de desconexão
        }
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    console.log('🚀 Iniciando limpeza do banco de dados...\n');
    
    fixIndexes().then(() => {
        process.exit(0);
    }).catch(error => {
        console.error('Erro fatal:', error.message);
        process.exit(1);
    });
}

module.exports = fixIndexes;

// Executar se chamado diretamente
if (require.main === module) {
    fixIndexes().then(() => {
        process.exit(0);
    }).catch(error => {
        console.error('Erro fatal:', error);
        process.exit(1);
    });
}

module.exports = fixIndexes;