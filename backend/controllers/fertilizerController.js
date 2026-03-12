const Fertilizer = require('../models/Fertilizer');
const AdminActivityLog = require('../models/AdminActivityLog');
const path = require('path');
const fs = require('fs');

// @desc    Get all active fertilizers (Public)
// @route   GET /api/fertilizers
// @access  Public
const getAllFertilizers = async (req, res) => {
  try {
    const { crop } = req.query;
    
    const query = { isActive: true };
    
    // Filter by crop if provided
    if (crop) {
      query.suitableCrops = { $in: [crop, 'all'] };
    }
    
    const fertilizers = await Fertilizer.find(query)
      .select('-__v')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, fertilizers, count: fertilizers.length });
  } catch (error) {
    console.error('Get Fertilizers error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get single fertilizer by ID (Public)
// @route   GET /api/fertilizers/:id
// @access  Public
const getFertilizerById = async (req, res) => {
  try {
    const fertilizer = await Fertilizer.findOne({
      _id: req.params.id,
      isActive: true,
    });
    
    if (!fertilizer) {
      return res.status(404).json({ success: false, message: 'Fertilizer not found' });
    }
    
    res.json({ success: true, data: fertilizer });
  } catch (error) {
    console.error('Get Fertilizer error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Safe parsing helper
const safeParse = (val) => {
  if (!val) return undefined;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch (e) {
    console.error('JSON Parse error for value:', val, e);
    return undefined; 
  }
};

// @desc    Add new fertilizer (Admin)
// @route   POST /api/admin/fertilizers
// @access  Admin
const addFertilizer = async (req, res) => {
  try {
    const {
      name,
      brand,
      description,
      nutrients,
      pricePerKg,
      suitableCrops,
      growthStageRecommendation,
      applicationMethod,
      dosageGuide,
      precautions,
      organic,
    } = req.body;

    if (!req.user || !req.user._id) {
        return res.status(401).json({ success: false, message: 'User context missing' });
    }
    
    // Check if fertilizer already exists
    const existingFertilizer = await Fertilizer.findOne({ name });
    if (existingFertilizer) {
      return res.status(400).json({ success: false, message: 'Fertilizer with this name already exists' });
    }
    
    // Get image filename if uploaded
    const image = req.file ? req.file.filename : 'default-fertilizer.jpg';
    
    // Parse JSON fields
    const parsedNutrients = safeParse(nutrients);
    const parsedSuitableCrops = safeParse(suitableCrops);
    const parsedGrowthStage = safeParse(growthStageRecommendation);
    const parsedDosageGuide = safeParse(dosageGuide);
    
    const fertilizer = await Fertilizer.create({
      name,
      brand,
      image,
      description,
      nutrients: parsedNutrients,
      pricePerKg,
      suitableCrops: parsedSuitableCrops,
      growthStageRecommendation: parsedGrowthStage,
      applicationMethod,
      dosageGuide: parsedDosageGuide,
      precautions,
      organic: organic === 'true' || organic === true,
    });
    
    // Log activity
    await AdminActivityLog.create({
      adminId: req.user._id,
      action: 'FERTILIZER_ADDED',
      details: `Added fertilizer: ${name}`,
    });
    
    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('fertilizer_added', fertilizer);
    }
    
    res.status(201).json({ success: true, data: fertilizer });
  } catch (error) {
    console.error('Add Fertilizer error:', error);
    
    // Handle Mongoose Validation Errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ success: false, message: 'Validation Error', errors: messages });
    }
    
    // Handle Duplicate Key Errors
    if (error.code === 11000) {
       return res.status(400).json({ success: false, message: 'Duplicate field value entered' });
    }

    res.status(500).json({ 
        success: false,
        message: 'Server error', 
        error: error.message,
        errorName: error.name
    });
  }
};

// @desc    Update fertilizer (Admin)
// @route   PUT /api/admin/fertilizers/:id
// @access  Admin
const updateFertilizer = async (req, res) => {
  try {
    const fertilizer = await Fertilizer.findById(req.params.id);
    
    if (!fertilizer) {
      return res.status(404).json({ success: false, message: 'Fertilizer not found' });
    }

    if (!req.user || !req.user._id) {
        console.error('User not found in request (Auth issue?)');
        return res.status(401).json({ success: false, message: 'User context missing' });
    }
    
    const {
      name,
      brand,
      description,
      nutrients,
      pricePerKg,
      suitableCrops,
      growthStageRecommendation,
      applicationMethod,
      dosageGuide,
      precautions,
      organic,
    } = req.body;
    
    // If new image uploaded, delete old one
    if (req.file) {
      if (fertilizer.image && !fertilizer.image.startsWith('http') && fertilizer.image !== 'default-fertilizer.jpg') {
        const oldImagePath = path.join(__dirname, '../uploads/fertilizers', fertilizer.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      fertilizer.image = req.file.filename;
    }
    
    // Safe parsing helper removed (defined globally)

    // Update fields
    if (name) fertilizer.name = name;
    if (brand) fertilizer.brand = brand;
    if (description) fertilizer.description = description;
    
    if (nutrients) {
        const parsed = safeParse(nutrients);
        if (parsed) fertilizer.nutrients = parsed;
    }
    
    if (pricePerKg) fertilizer.pricePerKg = pricePerKg;
    
    if (suitableCrops) {
        const parsed = safeParse(suitableCrops);
        if (parsed) fertilizer.suitableCrops = parsed;
    }
    
    if (growthStageRecommendation) {
        const parsed = safeParse(growthStageRecommendation);
        if (parsed) fertilizer.growthStageRecommendation = parsed;
    }
    
    if (applicationMethod) fertilizer.applicationMethod = applicationMethod;
    
    if (dosageGuide) {
        const parsed = safeParse(dosageGuide);
        if (parsed) fertilizer.dosageGuide = parsed;
    }
    
    if (precautions) fertilizer.precautions = precautions;
    if (organic !== undefined) fertilizer.organic = organic === 'true' || organic === true;
    
    await fertilizer.save();

    
    // Log activity
    await AdminActivityLog.create({
      adminId: req.user._id,
      action: 'FERTILIZER_UPDATED',
      details: `Updated fertilizer: ${fertilizer.name}`,
    });
    
    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('fertilizer_updated', fertilizer);
    }
    
    res.json({ success: true, data: fertilizer });
  } catch (error) {
    console.error('Update Fertilizer error DETAILS:', error);
    console.error('Stack:', error.stack);
    
    // Handle Mongoose Validation Errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ success: false, message: 'Validation Error', errors: messages });
    }
    
    // Handle Duplicate Key Errors
    if (error.code === 11000) {
       return res.status(400).json({ success: false, message: 'Duplicate field value entered' });
    }

    res.status(500).json({ 
        message: 'Server error', 
        error: error.message, 
        errorName: error.name,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// @desc    Toggle fertilizer status (Activate/Deactivate) (Admin)
// @route   PATCH /api/admin/fertilizers/:id/status
// @access  Admin
const toggleFertilizerStatus = async (req, res) => {
  try {
    const fertilizer = await Fertilizer.findById(req.params.id);
    
    if (!fertilizer) {
      return res.status(404).json({ success: false, message: 'Fertilizer not found' });
    }
    
    fertilizer.isActive = !fertilizer.isActive;
    await fertilizer.save({ validateBeforeSave: false });
    
    // Log activity
    await AdminActivityLog.create({
      adminId: req.user._id,
      action: fertilizer.isActive ? 'FERTILIZER_ACTIVATED' : 'FERTILIZER_DEACTIVATED',
      details: `${fertilizer.isActive ? 'Activated' : 'Deactivated'} fertilizer: ${fertilizer.name}`,
    });
    
    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      if (fertilizer.isActive) {
          io.emit('fertilizer_added', fertilizer); // Or updated
      } else {
          io.emit('fertilizer_removed', { id: fertilizer._id });
      }
    }
    
    res.json({ message: `Fertilizer ${fertilizer.isActive ? 'activated' : 'deactivated'} successfully`, isActive: fertilizer.isActive });
  } catch (error) {
    console.error('Toggle Fertilizer Status error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get all fertilizers including inactive (Admin)
// @route   GET /api/admin/fertilizers
// @access  Admin
const getAllFertilizersAdmin = async (req, res) => {
  try {
    const fertilizers = await Fertilizer.find({})
      .select('-__v')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, fertilizers, count: fertilizers.length });
  } catch (error) {
    console.error('Get All Fertilizers Admin error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getAllFertilizers,
  getFertilizerById,
  addFertilizer,
  updateFertilizer,
  toggleFertilizerStatus,
  getAllFertilizersAdmin,
};
