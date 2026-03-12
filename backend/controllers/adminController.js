const User = require('../models/User');
const AdminActivityLog = require('../models/AdminActivityLog');
const Fertilizer = require('../models/Fertilizer');
const WeatherCache = require('../models/WeatherCache');
const bcrypt = require('bcrypt');

// @desc    Get dashboard statistics
// @route   GET /api/admin/stats
// @access  Admin
const getStats = async (req, res) => {
    try {
        const totalFarmers = await User.countDocuments({ role: 'farmer' });
        const activeFarmers = await User.countDocuments({ role: 'farmer', status: 'active' });
        const suspendedUsers = await User.countDocuments({ status: 'suspended' });

        // For online users, we might need to check socket connections or DB if we sync them. 
        // The requirement says "Real-time functionality using Socket.io... When user logs in -> mark isOnline = true".
        // So we can trust the DB `isOnline` field if we implement the socket logic correctly in server.js.
        const onlineUsers = await User.countDocuments({ isOnline: true });

        // Crop distribution (basic aggregation)
        const cropDist = await User.aggregate([
            { $match: { role: 'farmer' } },
            { $unwind: '$crops' },
            { $group: { _id: '$crops', count: { $sum: 1 } } },
        ]);

        // Real weather cache count (locations being tracked)
        const weatherCachedLocations = await WeatherCache.countDocuments();

        // Fertilizer stats
        const totalFertilizers = await Fertilizer.countDocuments({ isActive: true });

        res.json({
            totalFarmers,
            activeFarmers,
            suspendedUsers,
            onlineUsers,
            cropDistribution: cropDist,
            weatherCachedLocations,
            totalFertilizers,
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get all users with pagination and search
// @route   GET /api/admin/users
// @access  Admin
const getUsers = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const search = req.query.search || '';
        const status = req.query.status || '';

        const query = { role: 'farmer' };

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { mobile: { $regex: search, $options: 'i' } },
            ];
        }

        if (status) {
            query.status = status;
        }

        const count = await User.countDocuments(query);
        const users = await User.find(query)
            .limit(limit)
            .skip(limit * (page - 1))
            .sort({ createdAt: -1 });

        res.json({
            users,
            page,
            pages: Math.ceil(count / limit),
            total: count,
        });
    } catch (error) {
        console.error('Get Users error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Suspend/Activate user
// @route   PATCH /api/admin/users/:id/status
// @access  Admin
const updateUserStatus = async (req, res) => {
    try {
        const { status } = req.body; // 'active' or 'suspended'
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.status = status;
        if (status === 'suspended') {
            user.isOnline = false; // Force offline logic could be handled by socket too
        }
        await user.save();

        // Log activity
        await AdminActivityLog.create({
            adminId: req.user._id,
            action: `USER_${status.toUpperCase()}`,
            targetUser: user._id,
            details: `Changed status to ${status}`,
        });

        // Create a socket event if possible (accessed via req.app.get('io')?)
        // Create a socket event
        const io = req.app.get('io');
        if (io) {
            io.emit('user_updated', user);
        }

        res.json({ message: `User ${status}`, user });
    } catch (error) {
        console.error('Update Status error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Broadcast advisory
// @route   POST /api/admin/broadcast
// @access  Admin
const broadcastAdvisory = async (req, res) => {
    try {
        const { message, type } = req.body;

        if (!message) {
            return res.status(400).json({ message: 'Message is required' });
        }

        // Log activity
        await AdminActivityLog.create({
            adminId: req.user._id,
            action: 'BROADCAST_SENT',
            details: message,
        });

        const io = req.app.get('io');
        if (io) {
            io.emit('new_broadcast', { message, type: type || 'info', timestamp: new Date() });
        }

        res.json({ message: 'Broadcast sent successfully' });
    } catch (error) {
        console.error('Broadcast error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const MarketPrice = require('../models/MarketPrice');
const CropAdvisory = require('../models/CropAdvisory');

// ... existing code ...

// @desc    Add market price
// @route   POST /api/admin/market-prices
// @access  Admin
const addMarketPrice = async (req, res) => {
    try {
        const { crop, mandi, price } = req.body;

        if (!crop || !mandi || !price) {
            return res.status(400).json({ message: 'Please provide all fields' });
        }

        const marketPrice = await MarketPrice.create({
            crop,
            mandi,
            price,
            lastUpdated: Date.now()
        });

        await AdminActivityLog.create({
            adminId: req.user._id,
            action: 'MARKET_PRICE_ADDED',
            details: `Added price for ${crop} at ${mandi}: ₹${price}`
        });

        res.status(201).json(marketPrice);
    } catch (error) {
        console.error('Add Market Price error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Delete market price
// @route   DELETE /api/admin/market-prices/:id
// @access  Admin
const deleteMarketPrice = async (req, res) => {
    try {
        const price = await MarketPrice.findById(req.params.id);

        if (!price) {
            return res.status(404).json({ message: 'Market price not found' });
        }

        await price.deleteOne();

        await AdminActivityLog.create({
            adminId: req.user._id,
            action: 'MARKET_PRICE_DELETED',
            details: `Deleted price for ${price.crop} at ${price.mandi}`
        });

        res.json({ message: 'Market price removed' });
    } catch (error) {
        console.error('Delete Market Price error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Add crop advisory
// @route   POST /api/admin/advisory
// @access  Admin
const addAdvisory = async (req, res) => {
    try {
        const { crop, stage, irrigationAdvice, fertilizerAdvice, harvestAdvice, riskAlerts, weatherSnapshot } = req.body;

        const advisory = await CropAdvisory.create({
            crop,
            stage,
            irrigationAdvice,
            fertilizerAdvice,
            harvestAdvice,
            riskAlerts,
            weatherSnapshot: weatherSnapshot || {} // Optional or fetched from weather API
        });

        await AdminActivityLog.create({
            adminId: req.user._id,
            action: 'ADVISORY_ADDED',
            details: `Added advisory for ${crop} (${stage})`
        });

        res.status(201).json(advisory);
    } catch (error) {
        console.error('Add Advisory error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Delete crop advisory
// @route   DELETE /api/admin/advisory/:id
// @access  Admin
const deleteAdvisory = async (req, res) => {
    try {
        const advisory = await CropAdvisory.findById(req.params.id);

        if (!advisory) {
            return res.status(404).json({ message: 'Advisory not found' });
        }

        await advisory.deleteOne();

        await AdminActivityLog.create({
            adminId: req.user._id,
            action: 'ADVISORY_DELETED',
            details: `Deleted advisory for ${advisory.crop}`
        });

        res.json({ message: 'Advisory removed' });
    } catch (error) {
        console.error('Delete Advisory error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Create a new user (Admin)
// @route   POST /api/admin/users
// @access  Admin
const createUser = async (req, res) => {
    try {
        const { name, email, password, role, mobile, location, crops } = req.body;

        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: role || 'farmer',
            mobile: mobile || undefined,
            location,
            crops: crops || [],
            status: 'active'
        });

        // Log activity
        await AdminActivityLog.create({
            adminId: req.user._id,
            action: 'USER_CREATED',
            details: `Created user: ${name} (${email})`,
        });

        const io = req.app.get('io');
        if (io) {
            io.emit('user_added', user);
        }

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        });
    } catch (error) {
        console.error('Create User error:', error.message);
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Duplicate field value entered (e.g. Email or Mobile)' });
        }
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update user details (Admin)
// @route   PUT /api/admin/users/:id
// @access  Admin
const updateUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;
        user.role = req.body.role || user.role;
        user.mobile = req.body.mobile || user.mobile;
        user.location = req.body.location || user.location;
        user.crops = req.body.crops || user.crops;
        
        if (req.body.password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(req.body.password, salt);
        }

        const updatedUser = await user.save();

        // Log activity
        await AdminActivityLog.create({
            adminId: req.user._id,
            action: 'USER_UPDATED',
            details: `Updated user: ${updatedUser.name}`,
        });

        const io = req.app.get('io');
        if (io) {
            io.emit('user_updated', updatedUser);
        }

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            mobile: updatedUser.mobile,
            location: updatedUser.location,
            crops: updatedUser.crops,
        });
    } catch (error) {
        console.error('Update User error:', error.message);
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Duplicate field value entered' });
        }
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Delete user (Admin)
// @route   DELETE /api/admin/users/:id
// @access  Admin
const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        await user.deleteOne();

        // Log activity
        await AdminActivityLog.create({
            adminId: req.user._id,
            action: 'USER_DELETED',
            details: `Deleted user: ${user.name}`,
        });

        const io = req.app.get('io');
        if (io) {
            io.emit('user_removed', { id: user._id });
        }

        res.json({ message: 'User removed' });
    } catch (error) {
        console.error('Delete User error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getStats,
    getUsers,
    updateUserStatus,
    broadcast: broadcastAdvisory,
    addMarketPrice,
    deleteMarketPrice,
    addAdvisory,
    deleteAdvisory,
    createUser,
    updateUser,
    deleteUser
};
