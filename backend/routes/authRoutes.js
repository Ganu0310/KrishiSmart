const express = require('express');
const { register, login, loginOTP, verifyLoginOTP, loginEmailOTP, verifyLoginEmailOTP, adminLogin, changePassword, forgotPassword, verifyOTP, resetPassword } = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validationMiddleware');
const { 
  registerValidator, 
  loginValidator, 
  loginOtpValidator,
  verifyLoginOtpValidator,
  loginEmailOtpValidator,
  verifyLoginEmailOtpValidator,
  forgotPasswordValidator, 
  verifyOtpValidator, 
  resetPasswordValidator, 
  changePasswordValidator 
} = require('../validators/authValidators');


const router = express.Router();

router.post('/register', registerValidator, validateRequest, register);
router.post('/login', loginValidator, validateRequest, login);
router.post('/admin-login', loginValidator, validateRequest, adminLogin);

// Mobile OTP Login
router.post('/login-otp', loginOtpValidator, validateRequest, loginOTP);
router.post('/verify-login-otp', verifyLoginOtpValidator, validateRequest, verifyLoginOTP);

// Email OTP Login
router.post('/login-email-otp', loginEmailOtpValidator, validateRequest, loginEmailOTP);
router.post('/verify-login-email-otp', verifyLoginEmailOtpValidator, validateRequest, verifyLoginEmailOTP);

// Forgot password flow
router.post('/forgot-password', forgotPasswordValidator, validateRequest, forgotPassword);
router.post('/verify-otp', verifyOtpValidator, validateRequest, verifyOTP);
router.post('/reset-password', resetPasswordValidator, validateRequest, resetPassword);

// Protected
router.put('/change-password', authMiddleware, changePasswordValidator, validateRequest, changePassword);

module.exports = router;
