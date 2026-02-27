const mongoose = require('mongoose');
require('dotenv').config();

async function fixIndexes() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/hackathon');
    console.log('Connected to DB.');
    
    const db = mongoose.connection.db;
    const collection = db.collection('users');
    
    console.log('Dropping mobile_1 index...');
    try {
        await collection.dropIndex('mobile_1');
        console.log('✅ mobile_1 index dropped.');
    } catch (e) {
        console.log('Index drop failed (maybe it doesnt exist):', e.message);
    }

    // Force verify current indexes
    const indexes = await collection.indexes();
    console.log('\nCurrent Indexes:', indexes);

    await mongoose.disconnect();
    console.log('Done. Restart server to recreate index with sparse: true.');
  } catch (err) {
    console.error(err);
  }
}

fixIndexes();
