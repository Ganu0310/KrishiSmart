const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { calculateIrrigation } = require('../controllers/irrigationController');

const router = express.Router();

// Protected: farmers must be logged in to use irrigation planner
router.post('/calculate', authMiddleware, calculateIrrigation);

module.exports = router;

