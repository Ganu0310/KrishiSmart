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

// Public routes
router.get('/', getAllFertilizers);
router.get('/:id', getFertilizerById);

// Admin routes (protected)
router.use(authMiddleware, adminOnly);

router.get('/admin/all', getAllFertilizersAdmin);
router.post('/admin/add', upload.single('image'), addFertilizer);
router.put('/admin/:id', upload.single('image'), updateFertilizer);
router.patch('/admin/:id/status', toggleFertilizerStatus);

module.exports = router;
