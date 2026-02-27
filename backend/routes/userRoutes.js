const express = require('express');
const { getProfile, updateProfile } = require('../controllers/userController');
const { authMiddleware } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

// All routes are protected
router.use(authMiddleware);

router.get('/profile', getProfile);
router.put('/profile', upload.single('profilePicture'), updateProfile);

module.exports = router;
