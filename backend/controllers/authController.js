const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const OTP = require('../models/OTP');
const generateToken = require('../utils/generateToken');
const { sendEmail } = require('../utils/emailService');

const isValidMobile = (mobile) => /^[0-9]{8,15}$/.test(mobile);

// Helper function to generate a 6-digit OTP
const generate6DigitOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// POST /api/auth/register (passwordless — mobile required, email optional)
const register = async (req, res) => {
  try {
    const { name, email, mobile, location, crops } = req.body;

    if (!name || !mobile) {
      return res.status(400).json({ message: 'Name and mobile number are required' });
    }

    const trimmedName = String(name).trim();
    const trimmedMobile = String(mobile).trim();

    if (!isValidMobile(trimmedMobile)) {
      return res.status(400).json({ message: 'Invalid mobile number format' });
    }

    const existingMobile = await User.findOne({ mobile: trimmedMobile });
    if (existingMobile) {
      return res.status(400).json({ message: 'Mobile number already registered' });
    }

    let trimmedEmail;
    if (email) {
      trimmedEmail = String(email).trim().toLowerCase();
      const existingEmail = await User.findOne({ email: trimmedEmail });
      if (existingEmail) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    // Create user (not yet verified)
    await User.create({
      name: trimmedName,
      email: trimmedEmail || undefined,
      mobile: trimmedMobile,
      role: 'farmer',
      location: location || process.env.DEFAULT_LOCATION || 'Nashik',
      crops: Array.isArray(crops) ? crops : [],
    });

    // Send OTP to mobile for verification
    const otp = generate6DigitOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await OTP.deleteMany({ mobile: trimmedMobile });
    await OTP.create({ mobile: trimmedMobile, otp, expiresAt });

    // TODO: Replace with real SMS provider
    console.log(`[SMS OTP] Registration OTP ${otp} for mobile ${trimmedMobile}`);

    return res.status(201).json({
      message: 'Registration successful. Please verify your mobile with the OTP sent.',
      requiresOtp: true,
      mobile: trimmedMobile,
    });
  } catch (error) {
    console.error('Register error:', error.message);
    return res.status(500).json({ message: 'Server error during registration' });
  }
};

// POST /api/auth/login (kept for admin / legacy password login)
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const trimmedEmail = String(email).trim().toLowerCase();

    const user = await User.findOne({ email: trimmedEmail });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ message: 'Account suspended. Contact admin.' });
    }

    if (!user.password) {
      return res.status(400).json({ message: 'This account uses mobile OTP login. Please use the mobile login option.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user);

    return res.json({
      message: 'Login successful',
      token,
      role: user.role,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        location: user.location,
        crops: user.crops,
      },
    });
  } catch (error) {
    console.error('Login error:', error.message);
    return res.status(500).json({ message: 'Server error during login' });
  }
};

// POST /api/auth/login-otp  (Step 1: Send OTP to mobile)
const loginOTP = async (req, res) => {
  try {
    const { mobile } = req.body;

    if (!mobile) {
      return res.status(400).json({ message: 'Mobile number is required' });
    }

    const trimmedMobile = String(mobile).trim();
    const user = await User.findOne({ mobile: trimmedMobile });
    if (!user) {
      return res.status(400).json({ message: 'No account found with this mobile number' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ message: 'Account suspended. Contact admin.' });
    }

    const otp = generate6DigitOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await OTP.deleteMany({ mobile: trimmedMobile });
    await OTP.create({ mobile: trimmedMobile, otp, expiresAt });

    // TODO: Replace with real SMS provider (Twilio / MSG91)
    console.log(`[SMS OTP] Sending OTP ${otp} to mobile ${trimmedMobile}`);

    return res.json({ message: 'OTP sent to your mobile number' });
  } catch (error) {
    console.error('Login OTP error:', error.message);
    return res.status(500).json({ message: 'Server error while sending OTP' });
  }
};

// POST /api/auth/verify-login-otp  (Step 2: Verify OTP and login)
const verifyLoginOTP = async (req, res) => {
  try {
    const { mobile, otp } = req.body;

    if (!mobile || !otp) {
      return res.status(400).json({ message: 'Mobile and OTP are required' });
    }

    const trimmedMobile = String(mobile).trim();

    const otpRecord = await OTP.findOne({ mobile: trimmedMobile, otp });
    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const user = await User.findOne({ mobile: trimmedMobile });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await OTP.deleteOne({ _id: otpRecord._id });

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user);

    return res.json({
      message: 'Login successful',
      token,
      role: user.role,
      user: {
        id: user._id,
        name: user.name,
        email: user.email || '',
        mobile: user.mobile,
        role: user.role,
        location: user.location,
        crops: user.crops,
      },
    });
  } catch (error) {
    console.error('Verify Login OTP error:', error.message);
    return res.status(500).json({ message: 'Server error during OTP verification' });
  }
};

// POST /api/auth/admin-login
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Email format check removed to support custom admin IDs like admin@123

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(400).json({ message: 'Invalid admin credentials' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized as admin' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid admin credentials' });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user);

    return res.json({
      message: 'Admin Login successful',
      token,
      role: 'admin',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
    console.error('Admin Login error:', error.message);
    return res.status(500).json({ message: 'Server error during admin login' });
  }
};

// PUT /api/user/change-password
const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Old password and new password are required' });
    }

    if (newPassword.length < 6 || newPassword.length > 64) {
      return res.status(400).json({ message: 'New password must be between 6 and 64 characters' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error.message);
    return res.status(500).json({ message: 'Server error while changing password' });
  }
};

// POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const trimmedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: trimmedEmail });
    
    if (!user) {
      return res.json({ message: 'If an account exists, an OTP has been sent.' });
    }

    const otp = generate6DigitOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    
    await OTP.deleteMany({ email: trimmedEmail });
    await OTP.create({ email: trimmedEmail, otp, expiresAt });

    // Log OTP to console (email service may not be configured)
    console.log(`[Email OTP] Password reset OTP ${otp} for ${trimmedEmail}`);

    return res.json({ message: 'If an account exists, an OTP has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error.message);
    return res.status(500).json({ message: 'Server error during forgot password' });
  }
};

// POST /api/auth/verify-otp
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const trimmedEmail = String(email).trim().toLowerCase();
    
    const otpRecord = await OTP.findOne({ email: trimmedEmail, otp });
    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }
    
    const user = await User.findOne({ email: trimmedEmail });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const tempResetToken = jwt.sign(
      { id: user._id, resetPassword: true }, 
      process.env.JWT_SECRET || 'fallback_secret', 
      { expiresIn: '15m' }
    );

    await OTP.deleteOne({ _id: otpRecord._id });

    return res.json({ 
      message: 'OTP verified', 
      resetToken: tempResetToken 
    });
  } catch (error) {
    console.error('Verify OTP error:', error.message);
    return res.status(500).json({ message: 'Server error during OTP verification' });
  }
};

// POST /api/auth/reset-password
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    
    if (!token || !password) {
      return res.status(400).json({ message: 'Reset token and new password are required' });
    }

    if (password.length < 6 || password.length > 64) {
      return res.status(400).json({ message: 'Password must be between 6 and 64 characters' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      
      if (!decoded.resetPassword) {
        return res.status(400).json({ message: 'Invalid token type' });
      }

      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      user.password = await bcrypt.hash(password, 10);
      await user.save();

      return res.json({ message: 'Password reset successfully. You can now login.' });
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired reset token' });
    }
  } catch (error) {
    console.error('Reset password error:', error.message);
    return res.status(500).json({ message: 'Server error during password reset' });
  }
};

// POST /api/auth/login-email-otp  (Step 1: Send OTP to email)
const loginEmailOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const trimmedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: trimmedEmail });
    if (!user) {
      return res.status(400).json({ message: 'No account found with this email' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ message: 'Account suspended. Contact admin.' });
    }

    const otp = generate6DigitOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await OTP.deleteMany({ email: trimmedEmail });
    await OTP.create({ email: trimmedEmail, otp, expiresAt });

    // Send OTP via email
    await sendEmail(
      trimmedEmail,
      'KrishiSmart - Login OTP',
      `<p>Hi ${user.name},</p><p>Your login OTP is <strong>${otp}</strong>.</p><p>This OTP will expire in 5 minutes.</p>`
    );
    console.log(`[Email OTP] OTP sent to ${trimmedEmail}`);

    return res.json({ message: 'OTP sent to your email address' });
  } catch (error) {
    console.error('Login Email OTP error:', error.message);
    return res.status(500).json({ message: 'Server error while sending OTP' });
  }
};

// POST /api/auth/verify-login-email-otp  (Step 2: Verify email OTP and login)
const verifyLoginEmailOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const trimmedEmail = String(email).trim().toLowerCase();

    const otpRecord = await OTP.findOne({ email: trimmedEmail, otp });
    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const user = await User.findOne({ email: trimmedEmail });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await OTP.deleteOne({ _id: otpRecord._id });

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user);

    return res.json({
      message: 'Login successful',
      token,
      role: user.role,
      user: {
        id: user._id,
        name: user.name,
        email: user.email || '',
        mobile: user.mobile || '',
        role: user.role,
        location: user.location,
        crops: user.crops,
      },
    });
  } catch (error) {
    console.error('Verify Login Email OTP error:', error.message);
    return res.status(500).json({ message: 'Server error during OTP verification' });
  }
};

module.exports = { 
  register, 
  login,
  loginOTP,
  verifyLoginOTP,
  loginEmailOTP,
  verifyLoginEmailOTP,
  adminLogin, 
  changePassword,
  forgotPassword,
  verifyOTP,
  resetPassword
};
