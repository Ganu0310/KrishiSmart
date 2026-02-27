const mongoose = require('mongoose');

const fertilizerSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Fertilizer name is required'],
            unique: true,
            trim: true,
        },
        brand: {
            type: String,
            trim: true,
        },
        image: {
            type: String, // Store filename or path
            default: 'default-fertilizer.jpg',
        },
        description: {
            type: String,
            required: [true, 'Description is required'],
        },
        nutrients: {
            nitrogen: {
                type: Number,
                required: true,
                min: 0,
                max: 100,
            },
            phosphorus: {
                type: Number,
                required: true,
                min: 0,
                max: 100,
            },
            potassium: {
                type: Number,
                required: true,
                min: 0,
                max: 100,
            },
            micronutrients: [
                {
                    type: String,
                    trim: true,
                },
            ],
        },
        pricePerKg: {
            type: Number,
            required: [true, 'Price is required'],
            min: 0,
        },
        suitableCrops: [
            {
                type: String,
                enum: ['grape', 'onion', 'tomato', 'wheat', 'rice', 'cotton', 'sugarcane', 'all'],
                required: true,
            },
        ],
        growthStageRecommendation: {
            vegetative: { type: Boolean, default: false },
            flowering: { type: Boolean, default: false },
            fruiting: { type: Boolean, default: false },
            harvest: { type: Boolean, default: false },
        },
        applicationMethod: {
            type: String,
            // enum: ['soil', 'foliar', 'drip', 'broadcast', 'mixed'], // Disabled to support legacy data
            default: 'soil',
        },
        dosageGuide: {
            type: mongoose.Schema.Types.Mixed,
            // type: Map,
            // of: String, // e.g., { "grape": "50-75 kg/acre", "onion": "40-60 kg/acre" }
        },
        precautions: {
            type: String,
            default: 'Follow recommended dosage. Avoid direct contact with skin.',
        },
        organic: {
            type: Boolean,
            default: false,
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
// Index for faster queries
// fertilizerSchema.index({ name: 1 }); // Duplicate of unique: true
fertilizerSchema.index({ suitableCrops: 1 });
fertilizerSchema.index({ isActive: 1 });

module.exports = mongoose.model('Fertilizer', fertilizerSchema);
