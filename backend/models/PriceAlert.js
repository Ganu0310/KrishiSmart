const mongoose = require('mongoose');

const priceAlertSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  crop: {
    type: String,
    required: true,
    trim: true,
  },
  targetPrice: {
    type: Number,
    required: true,
  },
  direction: {
    type: String,
    enum: ['above', 'below'],
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  triggered: {
    type: Boolean,
    default: false,
  },
  triggeredAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('PriceAlert', priceAlertSchema);
