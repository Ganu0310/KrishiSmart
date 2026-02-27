const axios = require('axios');
const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcrypt');
require('dotenv').config();

const API_URL = 'http://localhost:5000/api';
const TEMP_ADMIN = {
    name: 'Temp API Tester',
    email: 'apitestadmin@example.com',
    password: 'password123',
    role: 'admin',
    mobile: '1231231234',
    location: 'Test Lab',
    crops: []
};

let token = '';
let userId = '';
let adminId = '';

async function runTest() {
  try {
    // 0. Setup: Connect to DB and Create Temp Admin
    console.log('0. Setting up Temp Admin...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/hackathon');
    
    // Cleanup first just in case
    await User.deleteOne({ email: TEMP_ADMIN.email });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(TEMP_ADMIN.password, salt);
    
    const adminUser = await User.create({
        ...TEMP_ADMIN,
        password: hashedPassword,
        status: 'active'
    });
    adminId = adminUser._id;
    console.log('   Temp Admin Created');

    // 1. Login as Admin
    console.log('\n1. Logging in as Admin...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: TEMP_ADMIN.email,
      password: TEMP_ADMIN.password
    });
    token = loginRes.data.token;
    console.log('   Login successful, token received.');

    // 2. Create User
    console.log('\n2. Creating new user (NO MOBILE)...');
    const createRes = await axios.post(`${API_URL}/admin/users`, {
      name: 'Test Farmer NoMobile',
      email: `testfarmer_nomobile_${Date.now()}@example.com`,
      password: 'password123',
      role: 'farmer',
      // mobile: '9876543210', // Test missing mobile for sparse index
      location: 'Test Village',
      crops: ['Wheat']
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    userId = createRes.data._id;
    console.log('   User created:', createRes.data.name, 'ID:', userId);

    // 3. Update User
    console.log('\n3. Updating user...');
    const updateRes = await axios.put(`${API_URL}/admin/users/${userId}`, {
      location: 'Updated Village',
      crops: ['Wheat', 'Rice']
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('   User updated:', updateRes.data.location);

    // 4. Delete User
    console.log('\n4. Deleting user...');
    await axios.delete(`${API_URL}/admin/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('   User deleted.');

    console.log('\n✅ CRUD TEST PASSED!');
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.response ? error.response.data : error.message);
  } finally {
      // Cleanup
      if (adminId) {
          await User.deleteOne({ _id: adminId });
          console.log('\n   Temp Admin cleaned up.');
      }
      await mongoose.disconnect();
  }
}

runTest();
