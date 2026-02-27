const axios = require('axios');
const mongoose = require('mongoose');
const path = require('path');
const FormData = require('form-data');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const BASE_URL = 'http://localhost:5000/api';

const runTest = async () => {
  try {
    console.log('1. Logging in as Admin...');
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@krishe.com',
      password: 'admin'
    });
    
    const token = loginRes.data.token;
    console.log('   Login successful. Token received.');

    console.log('2. Fetching Fertilizers...');
    const fetchRes = await axios.get(`${BASE_URL}/fertilizers`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    
    let fertilizerId;
    if (fetchRes.data.fertilizers && fetchRes.data.fertilizers.length > 0) {
        fertilizerId = fetchRes.data.fertilizers[0]._id;
        console.log(`   Found existing fertilizer: ${fertilizerId}`);
    } else {
        console.log('   No fertilizers found. Creating one...');
        // Create a dummy one if needed, but let's assume seed data or manual creation exists.
        // If not, we can fail or create. Let's create for robustness.
        const createForm = new FormData();
        createForm.append('name', 'Test Fertilizer ' + Date.now());
        createForm.append('description', 'Test Description');
        createForm.append('pricePerKg', '100');
        // valid nutrients JSON
        createForm.append('nutrients', JSON.stringify({ nitrogen: 10, phosphorus: 10, potassium: 10, micronutrients: [] }));
        // valid suitableCrops (stringified array)
        createForm.append('suitableCrops', JSON.stringify(['all']));
        
        const createRes = await axios.post(`${BASE_URL}/fertilizers/admin/add`, createForm, {
            headers: { 
                Authorization: `Bearer ${token}`,
                ...createForm.getHeaders()
            }
        });
        fertilizerId = createRes.data._id;
        console.log(`   Created new fertilizer: ${fertilizerId}`);
    }

    console.log(`3. Testing UPDATE on Fertilizer ID: ${fertilizerId}`);
    
    const form = new FormData();
    form.append('name', 'Updated Fertilizer Name ' + Date.now());
    form.append('description', 'Updated Description');
    form.append('pricePerKg', '150');
    // Simulate the exact payload structure from frontend that was failing
    form.append('nutrients', JSON.stringify({
        nitrogen: 20,
        phosphorus: 20,
        potassium: 20,
        micronutrients: ['Zinc']
    }));
    form.append('suitableCrops', JSON.stringify(['wheat', 'rice']));
    form.append('growthStageRecommendation', JSON.stringify({
        vegetative: true,
        flowering: true, 
        fruiting: false,
        harvest: false
    }));
    
    // Attempt the PUT request
    try {
        const updateRes = await axios.put(`${BASE_URL}/fertilizers/admin/${fertilizerId}`, form, {
            headers: { 
                Authorization: `Bearer ${token}`,
                ...form.getHeaders()
            }
        });
        console.log('   ✅ UPDATE SUCCESSFUL!');
        console.log('   Response Data:', updateRes.data);
    } catch (err) {
        console.error('   ❌ UPDATE FAILED');
        if (err.response) {
            console.error('   Status:', err.response.status);
            console.error('   Data:', err.response.data);
        } else {
            console.error('   Error:', err.message);
        }
        process.exit(1);
    }

  } catch (error) {
    console.error('Test Failed:', error.message);
    if (error.response) console.error('Response:', error.response.data);
    process.exit(1);
  }
};

runTest();
