const { body } = require('express-validator');

// Auth validation schemas
const registerValidator = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('mobile').notEmpty().withMessage('Mobile number is required').matches(/^[0-9]{8,15}$/).withMessage('Invalid mobile number format'),
  body('email').optional({ checkFalsy: true }).trim().toLowerCase().isEmail().withMessage('Invalid email format'),
  body('role').optional().isIn(['farmer', 'admin']).withMessage('Invalid role'),
];

// Mobile OTP login
const loginOtpValidator = [
  body('mobile').trim().notEmpty().withMessage('Mobile number is required').matches(/^[0-9]{8,15}$/).withMessage('Invalid mobile number format'),
];

const verifyLoginOtpValidator = [
  body('mobile').trim().notEmpty().withMessage('Mobile number is required').matches(/^[0-9]{8,15}$/).withMessage('Invalid mobile number format'),
  body('otp').trim().notEmpty().withMessage('OTP is required').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
];

// Email OTP login
const loginEmailOtpValidator = [
  body('email').trim().toLowerCase().notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email format'),
];

const verifyLoginEmailOtpValidator = [
  body('email').trim().toLowerCase().notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email format'),
  body('otp').trim().notEmpty().withMessage('OTP is required').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
];

// Legacy password login (admin)
const loginValidator = [
  body('email').trim().toLowerCase().notEmpty().withMessage('Email/ID is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

const forgotPasswordValidator = [
  body('email').trim().toLowerCase().notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email format'),
];

const verifyOtpValidator = [
  body('email').trim().toLowerCase().notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email format'),
  body('otp').trim().notEmpty().withMessage('OTP is required').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
];

const resetPasswordValidator = [
  body('token').notEmpty().withMessage('Token is required'),
  body('password').notEmpty().withMessage('Password is required')
    .isLength({ min: 8, max: 64 }).withMessage('Password must be between 8 and 64 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/).withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
];

const changePasswordValidator = [
  body('oldPassword').notEmpty().withMessage('Old password is required'),
  body('newPassword').notEmpty().withMessage('New password is required')
    .isLength({ min: 8, max: 64 }).withMessage('Password must be between 8 and 64 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/).withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
];

module.exports = {
  registerValidator,
  loginValidator,
  loginOtpValidator,
  verifyLoginOtpValidator,
  loginEmailOtpValidator,
  verifyLoginEmailOtpValidator,
  forgotPasswordValidator,
  verifyOtpValidator,
  resetPasswordValidator,
  changePasswordValidator,
};
