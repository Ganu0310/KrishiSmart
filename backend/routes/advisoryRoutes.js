const express = require('express');
const { getAdvisory } = require('../controllers/advisoryController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// Protected advisory route (requires login)
router.get('/:crop', authMiddleware, getAdvisory);

module.exports = router;

