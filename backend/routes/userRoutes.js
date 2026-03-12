const express = require('express');
const { getProfile, updateProfile } = require('../controllers/userController');
const { changePassword } = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

// All routes are protected
router.use(authMiddleware);

router.get('/profile', getProfile);
router.put('/profile', upload.single('profilePicture'), updateProfile);
router.put('/change-password', changePassword);

module.exports = router;

