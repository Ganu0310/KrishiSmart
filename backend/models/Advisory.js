const mongoose = require('mongoose');

const advisorySchema = new mongoose.Schema(
  {
    crop: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    irrigationAdvice: {
      type: String,
      required: true,
    },
    diseaseRisk: {
      type: String,
      default: 'No significant risk detected',
    },
    harvestAdvice: {
      type: String,
      required: true,
    },
    marketSuggestion: {
      type: String,
      required: true,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient crop + location queries
advisorySchema.index({ crop: 1, location: 1 });
advisorySchema.index({ generatedAt: -1 });

module.exports = mongoose.model('Advisory', advisorySchema);
