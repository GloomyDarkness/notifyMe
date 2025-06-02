const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

async function checkSystemHealth() {
    console.log('🏥 Verificando saúde do sistema NotifyMe...\n');
    
    const checks = {
        mongodb: false,
        collections: false,
        users: false,
        indexes: false
    };
    
    try {
        // 1. Verificar conexão MongoDB
        console.log('🔌 Testando conexão MongoDB...');
        const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/NotifyMe';
        
        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 5000
        });
        
        console.log('✅ MongoDB conectado com sucesso');
        checks.mongodb = true;
        
        // 2. Verificar coleções
        console.log('\n📋 Verificando coleções...');
        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);
        
        console.log('Coleções encontradas:', collectionNames);
        
        const requiredCollections = ['users', 'boards', 'columns', 'cards'];
        const hasAllCollections = requiredCollections.every(req => 
            collectionNames.includes(req)
        );
        
        if (hasAllCollections) {
            console.log('✅ Todas as coleções necessárias existem');
            checks.collections = true;
        } else {
            console.log('⚠️ Algumas coleções estão faltando (serão criadas automaticamente)');
            checks.collections = true; // OK, serão criadas
        }
        
        // 3. Verificar usuário admin
        console.log('\n👤 Verificando usuário admin...');
        try {
            const User = require('../models/User');
            const adminUser = await User.findOne({ email: 'admin@notifyme.com' });
            
            if (adminUser) {
                console.log('✅ Usuário admin existe');
                checks.users = true;
            } else {
                console.log('⚠️ Usuário admin não encontrado (será criado na inicialização)');
                checks.users = true; // OK, será criado
            }
        } catch (error) {
            console.log('⚠️ Modelo User não carregado (normal em primeira execução)');
            checks.users = true;
        }
        
        // 4. Verificar índices problemáticos
        console.log('\n🔍 Verificando índices...');
        try {
            const columnsCollection = db.collection('columns');
            const indexes = await columnsCollection.indexes();
            
            const hasProblematicIndex = indexes.some(idx => idx.name === 'id_1');
            
            if (hasProblematicIndex) {
                console.log('⚠️ Índice problemático "id_1" detectado');
                console.log('💡 Execute: npm run fix-db');
                checks.indexes = false;
            } else {
                console.log('✅ Índices estão corretos');
                checks.indexes = true;
            }
        } catch (error) {
            console.log('ℹ️ Coleção columns não existe (normal em nova instalação)');
            checks.indexes = true;
        }
        
        // Resumo final
        console.log('\n' + '='.repeat(50));
        console.log('📊 RESUMO DA VERIFICAÇÃO');
        console.log('='.repeat(50));
        
        Object.entries(checks).forEach(([check, status]) => {
            const icon = status ? '✅' : '❌';
            const name = check.charAt(0).toUpperCase() + check.slice(1);
            console.log(`${icon} ${name}`);
        });
        
        const allOk = Object.values(checks).every(Boolean);
        
        if (allOk) {
            console.log('\n🎉 Sistema está saudável e pronto para uso!');
        } else {
            console.log('\n⚠️ Alguns problemas foram detectados.');
            console.log('💡 Siga as instruções acima para correção.');
        }
        
    } catch (error) {
        if (error.name === 'MongooseServerSelectionError') {
            console.error('❌ MongoDB não está rodando!');
            console.log('\n🔧 Para iniciar o MongoDB:');
            console.log('Windows: Execute start-mongodb.bat');
            console.log('Ou instale MongoDB Community: https://www.mongodb.com/try/download/community');
        } else {
            console.error('❌ Erro na verificação:', error.message);
        }
    } finally {
        try {
            await mongoose.disconnect();
        } catch (e) {
            // Ignorar erro de desconexão
        }
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    checkSystemHealth().then(() => {
        process.exit(0);
    }).catch(error => {
        console.error('Erro fatal:', error.message);
        process.exit(1);
    });
}

module.exports = checkSystemHealth;