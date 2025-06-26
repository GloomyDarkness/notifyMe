# 📋 NotifyMe - Sistema Kanban

Um sistema Kanban completo desenvolvido com Node.js, Express, MongoDB e frontend vanilla JavaScript.

## ✨ Características

- 🔐 **Autenticação JWT** - Sistema de login e registro seguro
- 👥 **Gerenciamento de usuários** - Cadastro e perfis de usuários
- 📋 **Quadros Kanban** - Criação e gestão de quadros
- 📝 **Cards interativos** - Cards com prioridades, datas e atribuições
- 🎨 **Interface responsiva** - Design moderno com Bootstrap 5
- 🔄 **Drag & Drop** - Mover cards entre colunas facilmente
- ⚡ **Tempo real** - Atualizações dinâmicas

## 🚀 Como usar

### 1. Instalar dependências
```bash
npm install
```

### 2. Inicializar banco de dados (primeira vez)
```bash
npm run init-db
```
Este comando irá:
- Criar o usuário administrador padrão
- Criar um quadro de exemplo
- Adicionar colunas e cards de demonstração

### 3. Iniciar o servidor
```bash
# Desenvolvimento (com nodemon)
npm run dev

# Produção
npm start
```

### 4. Acessar a aplicação
Abra seu navegador em: http://localhost:3000

## 🔑 Login padrão

- **Email:** admin@notifyme.com
- **Senha:** admin123

## 📁 Estrutura do projeto

```
notifyMe/
├── server/                 # Backend Node.js
│   ├── models/            # Modelos MongoDB
│   ├── routes/            # Rotas da API
│   ├── middleware/        # Middlewares
│   ├── .env               # Variáveis de ambiente
│   └── index.js           # Servidor principal
├── public/                # Frontend
│   ├── css/               # Estilos
│   ├── js/                # Scripts
│   └── index.html         # Página principal
├── package.json
└── README.md
```

## 🛠️ Tecnologias

**Backend:**
- Node.js
- Express.js
- MongoDB (Atlas)
- Mongoose
- JWT (autenticação)
- bcryptjs (hash de senhas)

**Frontend:**
- HTML5
- CSS3 (Bootstrap 5)
- JavaScript vanilla
- Font Awesome (ícones)
- SortableJS (drag & drop)

## 📊 Recursos disponíveis

### Quadros
- ✅ Criar quadros
- ✅ Listar quadros do usuário
- ✅ Editar quadros
- ✅ Excluir quadros

### Colunas
- ✅ Adicionar colunas
- ✅ Editar colunas
- ✅ Reordenar colunas
- ✅ Excluir colunas

### Cards
- ✅ Criar cards
- ✅ Editar cards
- ✅ Mover entre colunas
- ✅ Definir prioridades
- ✅ Atribuir a usuários
- ✅ Definir datas de vencimento
- ✅ Adicionar tags
- ✅ Comentários

### Usuários
- ✅ Registro de usuários
- ✅ Login/Logout
- ✅ Perfis de usuário
- ✅ Atualização de dados

## 🔧 Configuração

O sistema está configurado para usar MongoDB Atlas, mas você pode alterar as configurações no arquivo `server/.env`:

```env
MONGO_URL=sua_connection_string_mongodb
PORT=3000
JWT_SECRET=sua_chave_secreta
NODE_ENV=development
```

## 📱 Interface

- **Responsiva** - Funciona em desktop, tablet e mobile
- **Moderna** - Design limpo e profissional
- **Intuitiva** - Fácil de usar e navegar
- **Rápida** - Carregamento otimizado

## 🤝 Como contribuir

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT.

---

**Desenvolvido com ❤️ para organizar suas tarefas!**
