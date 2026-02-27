const dotenv = require('dotenv');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

async function run() {
  if (!MONGO_URI) {
    console.error('MONGO_URI is not set in .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO_URI);

    const users = [
      {
        name: 'Super Admin',
        mobile: '9999999999',
        password: 'Admin@123', // plain here, will be hashed
        role: 'admin',
        location: 'Nashik',
        crops: ['grape', 'onion', 'tomato'],
      },
      {
        name: 'Farmer Demo',
        mobile: '8888888888',
        password: 'Farmer@123', // plain here, will be hashed
        role: 'farmer',
        location: 'Nashik',
        crops: ['grape', 'onion'],
      },
    ];

    for (const u of users) {
      const existing = await User.findOne({ mobile: u.mobile });
      if (existing) {
        console.log(`User with mobile ${u.mobile} already exists, skipping.`);
        continue;
      }

      const hashedPassword = await bcrypt.hash(u.password, 10);
      await User.create({
        name: u.name,
        mobile: u.mobile,
        password: hashedPassword,
        role: u.role,
        location: u.location,
        crops: u.crops,
      });

      console.log(`Created user ${u.name} (${u.role}) with mobile ${u.mobile}`);
    }

    await mongoose.disconnect();
    console.log('Seeding complete.');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding users:', err.message);
    process.exit(1);
  }
}

run();

