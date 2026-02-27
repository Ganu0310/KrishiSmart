const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const User = require('./models/User');
const connectDB = require('./config/db');

dotenv.config();

const seedAdmin = async () => {
    try {
        await connectDB();

        const adminEmail = 'admin@example.com';
        const adminPassword = 'adminpassword123';
        const adminMobile = '9999999999';

        // Check if admin exists by email OR mobile
        const existingAdmin = await User.findOne({
            $or: [{ email: adminEmail }, { mobile: adminMobile }]
        });

        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        if (existingAdmin) {
            console.log(`Admin user found (ID: ${existingAdmin._id}). Updating credentials...`);

            // Update fields to ensure they are correct
            existingAdmin.role = 'admin';
            existingAdmin.email = adminEmail;
            existingAdmin.password = hashedPassword;
            existingAdmin.status = 'active';
            existingAdmin.mobile = adminMobile; // Ensure mobile matches if found by email

            await existingAdmin.save();
            console.log('Admin user updated successfully');
            process.exit();
        }

        // Create new admin if not found
        const adminUser = await User.create({
            name: 'Super Admin',
            email: adminEmail,
            mobile: adminMobile,
            password: hashedPassword,
            role: 'admin',
            location: 'HQ',
            status: 'active',
            isOnline: false
        });

        console.log(`Admin user created: ${adminUser.email}`);
        process.exit();
    } catch (error) {
        console.error('Error seeding admin:', error);
        process.exit(1);
    }
};

seedAdmin();
