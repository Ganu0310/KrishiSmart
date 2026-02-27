const mongoose = require('mongoose');

const emergencyAdvisorySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    crop: {
      type: String,
      enum: ['all', 'grape', 'onion', 'tomato'],
      default: 'all',
    },
    isCritical: {
      type: Boolean,
      default: true,
    },
    sentToAllFarmers: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
    // For future integrations (SMS, WhatsApp, IVR, etc.)
    channels: [
      {
        type: String,
        enum: ['sms', 'whatsapp', 'ivr', 'app'],
        default: 'app',
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('EmergencyAdvisory', emergencyAdvisorySchema);

