const mongoose = require('mongoose');

const soilConditionSchema = new mongoose.Schema(
  {
    location: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    soilMoisture: {
      type: String,
      enum: ['low', 'medium', 'high'],
      required: true,
      default: 'medium',
    },
    droughtRisk: {
      type: String,
      enum: ['low', 'medium', 'high'],
      required: true,
      default: 'low',
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

// Index for fast location lookups
soilConditionSchema.index({ location: 1 });

module.exports = mongoose.model('SoilCondition', soilConditionSchema);
