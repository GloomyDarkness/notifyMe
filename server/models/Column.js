const mongoose = require('mongoose');

const columnSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Título da coluna é obrigatório'],
    trim: true,
    maxlength: [100, 'Título não pode exceder 100 caracteres']
  },
  type: {
    type: String,
    enum: ['normal', 'pending', 'urgent', 'completed'],
    default: 'normal'
  },
  position: {
    type: Number,
    required: true,
    default: 0
  },
  board: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Board',
    required: [true, 'ID do quadro é obrigatório']
  },
  cards: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Card'
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Índices para melhorar performance (sem uniqueness)
columnSchema.index({ board: 1, position: 1 });

// Middleware para atualizar cards quando coluna é removida
columnSchema.pre('deleteOne', { document: true, query: false }, async function() {
  await this.model('Card').deleteMany({ column: this._id });
});

module.exports = mongoose.model('Column', columnSchema);