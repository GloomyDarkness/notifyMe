const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Título do card é obrigatório'],
    trim: true,
    maxlength: [200, 'Título não pode exceder 200 caracteres']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Descrição não pode exceder 1000 caracteres']
  },
  priority: {
    type: String,
    enum: ['baixa', 'media', 'alta', 'urgente'],
    default: 'media'
  },
  dueDate: {
    type: Date
  },
  position: {
    type: Number,
    required: true,
    default: 0
  },
  column: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Column',
    required: [true, 'ID da coluna é obrigatório']
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag não pode exceder 50 caracteres']
  }],
  attachments: [{
    filename: String,
    url: String,
    size: Number,
    mimetype: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: [500, 'Comentário não pode exceder 500 caracteres']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Índices para melhorar performance
cardSchema.index({ column: 1, position: 1 });
cardSchema.index({ assignedTo: 1 });
cardSchema.index({ dueDate: 1 });

module.exports = mongoose.model('Card', cardSchema);