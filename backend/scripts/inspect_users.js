const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function inspectUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/hackathon');
    
    console.log('Connected. Fetching users...');
    const users = await User.find({}, 'name email mobile');
    
    console.log('\n--- All Users ---');
    users.forEach(u => {
        console.log(`ID: ${u._id}, Name: ${u.name}, Mobile: ${u.mobile} (Type: ${typeof u.mobile})`);
    });

    // Check specific nulls
    const nullMobile = await User.find({ mobile: null });
    console.log(`\nUsers with mobile: null -> ${nullMobile.length}`);

    // Check specific exists: false
    const missingMobile = await User.find({ mobile: { $exists: false } });
    console.log(`Users with mobile: missing -> ${missingMobile.length}`);

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

inspectUsers();
