const mongoose = require('mongoose');

const marketPriceSchema = new mongoose.Schema(
  {
    crop: {
      type: String,
      required: true,
      trim: true,
    },
    market: {
      type: String,
      required: true,
      trim: true,
    },
    // Keep backward compatibility
    price: {
      type: Number,
      required: false,
    },
    minPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    maxPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    modalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    source: {
      type: String,
      default: 'manual',
      enum: ['manual', 'agmarknet', 'api', 'mock'],
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
marketPriceSchema.index({ crop: 1, date: -1 });
marketPriceSchema.index({ market: 1 });


module.exports = mongoose.model('MarketPrice', marketPriceSchema);

