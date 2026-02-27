const mongoose = require('mongoose');

const weatherCacheSchema = new mongoose.Schema(
  {
    location: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    rainfall: {
      type: Number,
      default: 0,
      min: 0,
    },
    temperature: {
      type: Number,
      required: true,
    },
    humidity: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    windSpeed: {
      type: Number,
      default: 0,
      min: 0,
    },
    warning: {
      type: String,
      default: '',
    },
    weatherDescription: {
      type: String,
      default: '',
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
weatherCacheSchema.index({ location: 1, updatedAt: -1 });

module.exports = mongoose.model('WeatherCache', weatherCacheSchema);
