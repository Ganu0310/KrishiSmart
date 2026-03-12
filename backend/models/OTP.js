const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  mobile: {
    type: String,
    trim: true,
    index: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    index: true,
  },
  otp: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: '5m' },
  },
}, {
  timestamps: true,
});

// Ensure at least one identifier is present
otpSchema.pre('validate', function () {
  if (!this.mobile && !this.email) {
    throw new Error('Either mobile or email is required');
  }
});

module.exports = mongoose.model('OTP', otpSchema);
