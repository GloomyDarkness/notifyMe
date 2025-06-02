const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Importar modelos
require('./models/User');
require('./models/Team');
require('./models/Board');
require('./models/Column');
require('./models/Card');

// Importar rotas
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const teamRoutes = require('./routes/teams');
const boardRoutes = require('./routes/boards');
const columnRoutes = require('./routes/columns');
const cardRoutes = require('./routes/cards');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de log das requisições
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, '../public')));

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/columns', columnRoutes);
app.use('/api/cards', cardRoutes);

// Rota para servir o index.html para qualquer rota não API
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, '../public/index.html'));
    } else {
        res.status(404).json({
            success: false,
            message: 'Endpoint não encontrado'
        });
    }
});

// Middleware de tratamento de erros
app.use((error, req, res, next) => {
    console.error('Erro não tratado:', error);
    
    res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Erro interno do servidor',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
});

// Conectar ao MongoDB
const { cleanupOnStartup } = require('./utils/columnUtils');

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGO_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/notifyme';
        
        const options = {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        };

        await mongoose.connect(mongoURI, options);
        console.log('✅ MongoDB conectado com sucesso');
        
        // Executar limpeza de dados na inicialização
        await cleanupOnStartup();
        
        // Criar usuário admin padrão se não existir
        await createDefaultAdmin();
        
    } catch (error) {
        console.error('❌ Erro ao conectar com MongoDB:', error);
        process.exit(1);
    }
};

// Criar usuário admin padrão
const createDefaultAdmin = async () => {
    try {
        const User = mongoose.model('User');
        
        const adminExists = await User.findOne({ email: 'admin@notifyme.com' });
        
        if (!adminExists) {
            const admin = new User({
                name: 'Administrador',
                email: 'admin@notifyme.com',
                password: 'admin123',
                role: 'Admin'
            });
            
            await admin.save();
            console.log('✅ Usuário admin padrão criado');
            console.log('📧 Email: admin@notifyme.com');
            console.log('🔑 Senha: admin123');
        }
    } catch (error) {
        console.error('❌ Erro ao criar usuário admin:', error);
    }
};

// Eventos do MongoDB
mongoose.connection.on('connected', () => {
    console.log('📡 Mongoose conectado ao MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.error('❌ Erro na conexão do Mongoose:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('📡 Mongoose desconectado do MongoDB');
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Encerrando servidor...');
    
    try {
        await mongoose.connection.close();
        console.log('📡 Conexão MongoDB fechada');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro ao fechar conexão:', error);
        process.exit(1);
    }
});

// Inicializar servidor
const startServer = async () => {
    await connectDB();
    
    app.listen(PORT, () => {
        console.log('🚀 Servidor NotifyMe iniciado!');
        console.log(`🌐 Acesse: http://localhost:${PORT}`);
        console.log(`📂 Ambiente: ${process.env.NODE_ENV || 'development'}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    });
};

// Iniciar o servidor
startServer().catch(error => {
    console.error('❌ Falha ao iniciar servidor:', error);
    process.exit(1);
});

module.exports = app;