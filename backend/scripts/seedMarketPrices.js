/**
 * Market Price Seeder - Realistic historical data for Maharashtra crops
 * Provides 30 days of price history for grape, onion, and tomato
 * across major mandis so the trend analysis feature works from day 1.
 *
 * Run: node scripts/seedMarketPrices.js
 * Data is loosely based on actual Agmarknet price ranges (INR/quintal).
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const MarketPrice = require('../models/MarketPrice');
const connectDB = require('../config/db');

// Real price ranges (INR per quintal) from Maharashtra mandis, Feb 2025
const PRICE_DATA = {
  grape: {
    mandis: [
      { market: 'Nashik', baseMin: 5000, baseMax: 7500, baseModal: 6200 },
      { market: 'Sangli', baseMin: 4800, baseMax: 7200, baseModal: 5900 },
      { market: 'Pune', baseMin: 5200, baseMax: 8000, baseModal: 6600 },
      { market: 'Solapur', baseMin: 4600, baseMax: 7000, baseModal: 5700 },
    ],
  },
  onion: {
    mandis: [
      { market: 'Lasalgaon', baseMin: 800, baseMax: 2200, baseModal: 1500 },
      { market: 'Nashik', baseMin: 750, baseMax: 2100, baseModal: 1400 },
      { market: 'Pune', baseMin: 900, baseMax: 2400, baseModal: 1600 },
      { market: 'Pimpalgaon', baseMin: 720, baseMax: 2000, baseModal: 1350 },
    ],
  },
  tomato: {
    mandis: [
      { market: 'Nashik', baseMin: 600, baseMax: 2500, baseModal: 1400 },
      { market: 'Pune', baseMin: 650, baseMax: 2800, baseModal: 1550 },
      { market: 'Mumbai', baseMin: 700, baseMax: 3200, baseModal: 1800 },
      { market: 'Kolhapur', baseMin: 580, baseMax: 2300, baseModal: 1300 },
    ],
  },
};

// Add gaussian noise to prices (simulate real market fluctuation)
const jitter = (value, pct = 0.12) => {
  const noise = (Math.random() - 0.5) * 2 * pct * value;
  return Math.round(value + noise);
};

// Simulate a trend over 30 days (random walk)
const generateDailyPrices = (baseMin, baseMax, baseModal, days = 30) => {
  const results = [];
  let modal = baseModal;
  const driftFactor = (Math.random() > 0.5 ? 1 : -1) * 0.008; // slow drift

  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    modal = Math.max(baseMin * 0.7, Math.min(baseMax * 1.1, modal * (1 + driftFactor + (Math.random() - 0.5) * 0.04)));

    results.push({
      date,
      minPrice: jitter(baseMin),
      maxPrice: jitter(baseMax),
      modalPrice: Math.round(modal),
      price: Math.round(modal), // backward compat
    });
  }
  return results;
};

const seedMarketPrices = async () => {
  await connectDB();

  const existing = await MarketPrice.countDocuments({ source: 'mock' });
  if (existing > 100) {
    console.log(`✓ ${existing} mock price records already exist. Skipping.`);
    process.exit(0);
  }

  const docs = [];

  for (const [crop, { mandis }] of Object.entries(PRICE_DATA)) {
    for (const mandi of mandis) {
      const dailyPrices = generateDailyPrices(mandi.baseMin, mandi.baseMax, mandi.baseModal);
      for (const day of dailyPrices) {
        docs.push({
          crop: crop.toLowerCase(),
          market: mandi.market,
          mandi: mandi.market, // backward compat
          minPrice: day.minPrice,
          maxPrice: day.maxPrice,
          modalPrice: day.modalPrice,
          price: day.price,
          date: day.date,
          source: 'mock',
          lastUpdated: new Date(),
        });
      }
    }
  }

  await MarketPrice.insertMany(docs, { ordered: false });
  console.log(`✓ Seeded ${docs.length} market price records for grape, onion, and tomato.`);
  process.exit(0);
};

seedMarketPrices().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
