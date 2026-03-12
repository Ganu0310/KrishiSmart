const mongoose = require('mongoose');

const schemeSchema = new mongoose.Schema(
  {
    schemeName: {
      type: String,
      required: true,
      trim: true,
    },
    ministry: {
      type: String,
      trim: true,
    },
    schemeType: {
      type: String,
      enum: ['subsidy', 'insurance', 'loan', 'training', 'equipment', 'other'],
      default: 'other',
    },
    benefitSummary: {
      type: String,
      required: true,
    },
    eligibility: {
      type: String,
    },
    howToApply: {
      type: String,
    },
    applicationUrl: {
      type: String,
    },
    applicableStates: {
      type: [String],
      default: ['all'],
    },
    applicableCrops: {
      type: [String],
      default: ['all'],
    },
    deadline: {
      type: String, // e.g. "31 March 2025" or "Rolling"
      default: 'Rolling / Ongoing',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

schemeSchema.index({ applicableCrops: 1 });
schemeSchema.index({ applicableStates: 1 });
schemeSchema.index({ schemeType: 1 });

module.exports = mongoose.model('Scheme', schemeSchema);
