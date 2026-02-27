const mongoose = require('mongoose');

const cropAdvisorySchema = new mongoose.Schema(
  {
    crop: {
      type: String,
      enum: ['grape', 'onion', 'tomato'],
      required: true,
    },
    weatherCondition: {
      type: String,
      required: true,
    },
    irrigationTip: {
      type: String,
      required: true,
    },
    harvestTip: {
      type: String,
      required: true,
    },
    riskAlert: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('CropAdvisory', cropAdvisorySchema);

