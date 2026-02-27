const EmergencyAdvisory = require('../models/EmergencyAdvisory');
const User = require('../models/User');

// POST /api/admin/emergency-advisories
// Creates an emergency advisory, marks it as critical/non-critical,
// and (for now) simulates sending alerts to all farmers by recording
// sentToAllFarmers + metadata. Ready to plug in real SMS/WhatsApp later.
const createEmergencyAdvisory = async (req, res) => {
  try {
    const { title, message, crop = 'all', isCritical = true, channels = ['app'] } = req.body;

    if (!title || !message) {
      return res.status(400).json({ message: 'title and message are required' });
    }

    const normalizedCrop = String(crop).toLowerCase();
    const allowedCrops = ['all', 'grape', 'onion', 'tomato'];
    if (!allowedCrops.includes(normalizedCrop)) {
      return res
        .status(400)
        .json({ message: 'crop must be one of: all, grape, onion, tomato' });
    }

    const advisory = await EmergencyAdvisory.create({
      title,
      message,
      crop: normalizedCrop,
      isCritical: !!isCritical,
      sentToAllFarmers: true,
      createdBy: req.user._id,
      channels: Array.isArray(channels) && channels.length ? channels : ['app'],
      sentAt: new Date(),
    });

    // For hackathon/demo: count farmers to show impact.
    const farmerCount = await User.countDocuments({ role: 'farmer' });

    return res.status(201).json({
      message: 'Emergency advisory created and queued for all farmers',
      advisory: {
        id: advisory._id,
        title: advisory.title,
        message: advisory.message,
        crop: advisory.crop,
        isCritical: advisory.isCritical,
        sentToAllFarmers: advisory.sentToAllFarmers,
        sentAt: advisory.sentAt,
        channels: advisory.channels,
      },
      stats: {
        targetFarmers: farmerCount,
      },
    });
  } catch (error) {
    console.error('Create emergency advisory error:', error.message);
    return res.status(500).json({ message: 'Failed to create emergency advisory' });
  }
};

// (Optional extension-ready) GET /api/admin/emergency-advisories
// Lists recent advisories to show in admin panel.
const listEmergencyAdvisories = async (_req, res) => {
  try {
    const advisories = await EmergencyAdvisory.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return res.json({
      count: advisories.length,
      advisories: advisories.map((a) => ({
        id: a._id,
        title: a.title,
        message: a.message,
        crop: a.crop,
        isCritical: a.isCritical,
        sentToAllFarmers: a.sentToAllFarmers,
        sentAt: a.sentAt,
        channels: a.channels,
      })),
    });
  } catch (error) {
    console.error('List emergency advisories error:', error.message);
    return res.status(500).json({ message: 'Failed to fetch emergency advisories' });
  }
};

module.exports = { createEmergencyAdvisory, listEmergencyAdvisories };

