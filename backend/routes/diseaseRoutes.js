const express = require('express');
const router = express.Router();
const multer = require('multer');
const { identifyDisease } = require('../controllers/diseaseController');
const { authMiddleware } = require('../middleware/authMiddleware');

// In-memory storage — image stays in buffer, not saved to disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPG, PNG, and WEBP images are allowed.'));
  },
});

// POST /api/disease/identify — multipart image upload
router.post('/identify', authMiddleware, upload.single('image'), identifyDisease);

module.exports = router;
