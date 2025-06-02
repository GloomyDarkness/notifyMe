const mongoose = require('mongoose');

const boardSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nome do quadro é obrigatório'],
    trim: true,
    maxlength: [100, 'Nome não pode exceder 100 caracteres']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Descrição não pode exceder 500 caracteres']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Proprietário do quadro é obrigatório']
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['admin', 'member', 'viewer'],
      default: 'member'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  columns: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Column'
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  settings: {
    allowComments: {
      type: Boolean,
      default: true
    },
    allowAttachments: {
      type: Boolean,
      default: true
    },
    cardLimit: {
      type: Number,
      default: 100
    }
  }
}, {
  timestamps: true
});

// Índices para melhorar performance
boardSchema.index({ owner: 1 });
boardSchema.index({ 'members.user': 1 });
boardSchema.index({ team: 1 });

module.exports = mongoose.model('Board', boardSchema);