const express = require('express');
const router = express.Router();
const {
  getAllFertilizers,
  getFertilizerById,
  addFertilizer,
  updateFertilizer,
  toggleFertilizerStatus,
  getAllFertilizersAdmin,
} = require('../controllers/fertilizerController');
const { authMiddleware, adminOnly } = require('../middleware/authMiddleware');
const upload = require('../config/multerConfig');

// ── Public routes ─────────────────────────────────────
router.get('/', getAllFertilizers);

// ── Admin routes (protected) ──────────────────────────
// These must come BEFORE /:id to prevent /:id from catching "admin" as a param
router.get('/admin/all', authMiddleware, adminOnly, getAllFertilizersAdmin);
router.post('/admin/add', authMiddleware, adminOnly, upload.single('image'), addFertilizer);
router.put('/admin/:id', authMiddleware, adminOnly, upload.single('image'), updateFertilizer);
router.patch('/admin/:id/status', authMiddleware, adminOnly, toggleFertilizerStatus);

// ── Public: single fertilizer (MUST be last — /:id is a catch-all param) ──
router.get('/:id', getFertilizerById);

module.exports = router;
