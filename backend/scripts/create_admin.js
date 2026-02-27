const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const createAdmin = async () => {
  try {
    if (!process.env.MONGO_URI) {
        console.error('MONGO_URI is undefined. Check .env path.');
        process.exit(1);
    }
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const email = 'admin@krishe.com';
    const password = 'admin';

    let user = await User.findOne({ email });
    if (user) {
      console.log('Admin user already exists');
      if (user.role !== 'admin') {
          user.role = 'admin';
          await user.save();
          console.log('Updated existing user to admin role');
      }
      // Optional: Reset password if needed, but for now assume it's known or we just made sure they are admin
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      user = await User.create({
        name: 'Super Admin',
        email,
        password: hashedPassword,
        role: 'admin',
        location: 'Nashik',
        crops: [],
        status: 'active'
      });
      console.log('Admin user created');
    }
    
    console.log(`Credentials: ${email} / ${password}`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

createAdmin();
