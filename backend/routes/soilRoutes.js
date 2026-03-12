const express = require('express');
const router = express.Router();
const { getSoil } = require('../controllers/soilController');
const { authMiddleware } = require('../middleware/authMiddleware');

// GET /api/soil/:location — get cached soil condition data
router.get('/:location', authMiddleware, getSoil);

module.exports = router;
