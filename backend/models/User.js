const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    mobile: {
      type: String,
      trim: true,
      unique: true,
      sparse: true, // Allows null/undefined to not conflict uniqueness
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ['farmer', 'admin'],
      default: 'farmer',
    },
    location: {
      type: String,
      default: 'Nashik',
    },
    crops: [
      {
        type: String,
        trim: true,
      },
    ],
    profilePicture: {
      type: String,
      default: null,
    },
    farmSize: {
      type: Number,
      default: 0,
    },
    address: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'suspended'],
      default: 'active',
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);

