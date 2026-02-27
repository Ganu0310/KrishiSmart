/**
 * Seed Weather Data Script
 * Populates the weather cache with sample data when OpenWeather API is rate-limited
 */

const mongoose = require('mongoose');
const WeatherCache = require('./models/WeatherCache');

const SEED_WEATHER_DATA = [
  {
    location: 'nashik',
    rainfall: 15.5,
    temperature: 28.3,
    humidity: 65,
    windSpeed: 12.5,
    weatherDescription: 'Partly cloudy with light rain expected',
    warning: 'Moderate rainfall expected in next 24 hours',
    lastUpdated: new Date(),
  },
  {
    location: 'pune',
    rainfall: 8.2,
    temperature: 26.5,
    humidity: 58,
    windSpeed: 10.2,
    weatherDescription: 'Clear skies',
    warning: '',
    lastUpdated: new Date(),
  },
  {
    location: 'mumbai',
    rainfall: 22.0,
    temperature: 30.1,
    humidity: 78,
    windSpeed: 15.8,
    weatherDescription: 'Heavy rainfall',
    warning: 'Heavy rainfall warning - avoid outdoor activities',
    lastUpdated: new Date(),
  },
  {
    location: 'ahmednagar',
    rainfall: 5.5,
    temperature: 29.2,
    humidity: 52,
    windSpeed: 8.5,
    weatherDescription: 'Sunny',
    warning: '',
    lastUpdated: new Date(),
  },
  {
    location: 'solapur',
    rainfall: 3.2,
    temperature: 31.5,
    humidity: 45,
    windSpeed: 7.2,
    weatherDescription: 'Hot and dry',
    warning: 'High temperature - ensure adequate irrigation',
    lastUpdated: new Date(),
  },
  {
    location: 'sangli',
    rainfall: 12.8,
    temperature: 27.8,
    humidity: 62,
    windSpeed: 11.0,
    weatherDescription: 'Cloudy with occasional showers',
    warning: '',
    lastUpdated: new Date(),
  },
  {
    location: 'satara',
    rainfall: 18.5,
    temperature: 25.2,
    humidity: 70,
    windSpeed: 13.5,
    weatherDescription: 'Rainy',
    warning: 'Continuous rainfall expected',
    lastUpdated: new Date(),
  },
  {
    location: 'kolhapur',
    rainfall: 20.2,
    temperature: 26.8,
    humidity: 72,
    windSpeed: 14.2,
    weatherDescription: 'Monsoon conditions',
    warning: 'Heavy monsoon - check drainage',
    lastUpdated: new Date(),
  },
];

const seedWeatherData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/KrishiSmart');
    console.log('Connected to MongoDB');

    // Clear existing weather cache
    await WeatherCache.deleteMany({});
    console.log('Cleared existing weather cache');

    // Insert seed data
    await WeatherCache.insertMany(SEED_WEATHER_DATA);
    console.log(`✓ Seeded ${SEED_WEATHER_DATA.length} weather records`);

    console.log('\nSeeded locations:');
    SEED_WEATHER_DATA.forEach((data) => {
      console.log(`  - ${data.location}: ${data.temperature}°C, ${data.weatherDescription}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding weather data:', error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  require('dotenv').config();
  seedWeatherData();
}

module.exports = { seedWeatherData };
