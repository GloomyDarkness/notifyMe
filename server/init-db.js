const mongoose = require('mongoose');
const User = require('./models/User');
const Board = require('./models/Board');
const Column = require('./models/Column');
const Card = require('./models/Card');
require('dotenv').config();

async function initializeDatabase() {
  try {
    console.log('🔧 Inicializando banco de dados...');

    // Conectar ao MongoDB
    await mongoose.connect(process.env.MONGO_URL);
    console.log('✅ Conectado ao MongoDB');

    // Verificar se já existe um usuário admin
    const adminUser = await User.findOne({ email: 'admin@notifyme.com' });

    if (!adminUser) {
      console.log('👤 Criando usuário administrador...');
      
      const admin = new User({
        name: 'Administrador',
        email: 'admin@notifyme.com',
        password: 'admin123',
        role: 'Administrador'
      });

      await admin.save();
      console.log('✅ Usuário administrador criado');

      // Criar quadro padrão
      console.log('📋 Criando quadro padrão...');
      
      const defaultBoard = new Board({
        name: 'Meu Primeiro Quadro',
        description: 'Quadro de exemplo para começar a usar o NotifyMe',
        owner: admin._id,
        members: [admin._id]
      });

      await defaultBoard.save();
      console.log('✅ Quadro padrão criado');

      // Criar colunas padrão
      console.log('📝 Criando colunas padrão...');
      
      const defaultColumns = [
        { title: 'A Fazer', type: 'pending', position: 0 },
        { title: 'Em Progresso', type: 'normal', position: 1 },
        { title: 'Revisão', type: 'urgent', position: 2 },
        { title: 'Concluído', type: 'completed', position: 3 }
      ];

      const createdColumns = [];
      for (const colData of defaultColumns) {
        const column = new Column({
          ...colData,
          board: defaultBoard._id
        });
        await column.save();
        createdColumns.push(column);
      }

      console.log('✅ Colunas padrão criadas');

      // Criar cards de exemplo
      console.log('🎴 Criando cards de exemplo...');
      
      const exampleCards = [
        {
          title: 'Bem-vindo ao NotifyMe!',
          description: 'Este é um card de exemplo. Você pode editá-lo, movê-lo ou excluí-lo.',
          column: createdColumns[0]._id,
          priority: 'alta',
          position: 0
        },
        {
          title: 'Explore as funcionalidades',
          description: 'Tente criar novas colunas, adicionar cards e organizar suas tarefas.',
          column: createdColumns[0]._id,
          priority: 'media',
          position: 1
        },
        {
          title: 'Tarefa em andamento',
          description: 'Este card está na coluna "Em Progresso".',
          column: createdColumns[1]._id,
          priority: 'media',
          position: 0,
          assignedTo: admin._id
        },
        {
          title: 'Primeira tarefa concluída',
          description: 'Parabéns! Você completou sua primeira tarefa.',
          column: createdColumns[3]._id,
          priority: 'baixa',
          position: 0,
          isCompleted: true
        }
      ];

      for (const cardData of exampleCards) {
        const card = new Card({
          ...cardData,
          board: defaultBoard._id
        });
        await card.save();
      }

      console.log('✅ Cards de exemplo criados');
    } else {
      console.log('👤 Usuário administrador já existe');
    }

    console.log('🎉 Inicialização do banco de dados concluída!');
    console.log('');
    console.log('📋 Dados de acesso:');
    console.log('   Email: admin@notifyme.com');
    console.log('   Senha: admin123');
    console.log('');

  } catch (error) {
    console.error('❌ Erro na inicialização:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado do MongoDB');
  }
}

// Executar se este arquivo for chamado diretamente
if (require.main === module) {
  initializeDatabase();
}

module.exports = initializeDatabase;