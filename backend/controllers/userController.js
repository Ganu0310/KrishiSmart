const User = require('../models/User');
const fs = require('fs');
const path = require('path');

// GET /api/user/profile
const getProfile = async (req, res) => {
  try {
    // req.user is populated by authMiddleware as the full User document
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    console.error('Get profile error:', error.message);
    res.status(500).json({ success: false, message: 'Server error fetching profile' });
  }
};

// PUT /api/user/profile
const updateProfile = async (req, res) => {
  try {
    const { name, mobile, location, farmSize, address, crops } = req.body;
    const userId = req.user._id; // Fixed: was req.user.userId (wrong field)

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Update text fields if provided
    if (name) user.name = name.trim();
    if (mobile) user.mobile = mobile.trim();
    if (location) user.location = location;
    if (farmSize) user.farmSize = Number(farmSize);
    if (address) user.address = address.trim();

    // Handle crops array properly (parse if it comes as stringified JSON from FormData)
    if (crops) {
      try {
        const parsedCrops = typeof crops === 'string' ? JSON.parse(crops) : crops;
        if (Array.isArray(parsedCrops)) {
          user.crops = parsedCrops;
        }
      } catch (e) {
        if (typeof crops === 'string' && !crops.startsWith('[')) {
          user.crops = crops.split(',').map((c) => c.trim());
        }
      }
    }

    // Handle file upload
    if (req.file) {
      // Delete old profile picture if exists
      if (user.profilePicture) {
        const oldPath = path.join(__dirname, '..', user.profilePicture);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      user.profilePicture = req.file.path.replace(/\\/g, '/');
    }

    await user.save();

    const updatedUser = await User.findById(userId).select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Update profile error:', error.message);
    res.status(500).json({ success: false, message: 'Server error updating profile' });
  }
};

module.exports = { getProfile, updateProfile };
