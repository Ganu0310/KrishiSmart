const User = require('../models/User');
const fs = require('fs');
const path = require('path');

// GET /api/user/profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error.message);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
};

// PUT /api/user/profile
const updateProfile = async (req, res) => {
  try {
    const { name, mobile, location, farmSize, address, crops } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
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
            // Check if crops is a string (JSON stringified) or already an array
            const parsedCrops = typeof crops === 'string' ? JSON.parse(crops) : crops;
            if (Array.isArray(parsedCrops)) {
                user.crops = parsedCrops;
            }
        } catch (e) {
            console.error("Error parsing crops:", e);
             // Verify if it's a single crop string or comma separated
            if (typeof crops === 'string' && !crops.startsWith('[')) {
                user.crops = crops.split(',').map(c => c.trim());
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
      // Save relative path
      // Normalize path separators to forward slashes for URL usage
      user.profilePicture = req.file.path.replace(/\\/g, '/');
    }

    await user.save();

    // Return updated user without password
    const updatedUser = await User.findById(userId).select('-password');
    
    res.json({
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Update profile error:', error.message);
    res.status(500).json({ message: 'Server error updating profile' });
  }
};

module.exports = { getProfile, updateProfile };
