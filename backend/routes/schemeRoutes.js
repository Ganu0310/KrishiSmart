const express = require('express');
const { getSchemes, getSchemeById } = require('../controllers/schemeController');

const router = express.Router();

// GET /api/schemes         - list with filters
// GET /api/schemes/:id     - single scheme
router.get('/', getSchemes);
router.get('/:id', getSchemeById);

module.exports = router;
