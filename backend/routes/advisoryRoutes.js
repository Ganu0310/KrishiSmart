const express = require('express');
const { getAdvisory } = require('../controllers/advisoryController');
const { getPestRisk } = require('../controllers/forecastController');
const { getSowingCalendar } = require('../controllers/sowingController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validationMiddleware');
const { advisoryQueryValidator, sowingCalendarValidator, pestRiskValidator } = require('../validators/advisoryValidators');


const router = express.Router();

// GET /api/advisory/pest-risk?crop=grape&location=Nashik  (authenticated)
router.get('/pest-risk', authMiddleware, pestRiskValidator, validateRequest, getPestRisk);

// GET /api/advisory/sowing-calendar?crop=onion&location=Nashik  (authenticated)
router.get('/sowing-calendar', authMiddleware, sowingCalendarValidator, validateRequest, getSowingCalendar);

// GET /api/advisory/:crop  (existing - must come LAST to avoid catching above routes)
router.get('/:crop', authMiddleware, advisoryQueryValidator, validateRequest, getAdvisory);

module.exports = router;
