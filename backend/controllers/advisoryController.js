const axios = require('axios');
const { setCache, getCache } = require('../utils/weatherCache');
const { generateAdvisory } = require('../utils/advisoryRules');

// GET /api/advisory/:crop
const getAdvisory = async (req, res) => {
  try {
    const crop = (req.params.crop || '').toLowerCase();
    const allowedCrops = ['grape', 'onion', 'tomato'];

    if (!allowedCrops.includes(crop)) {
      return res.status(400).json({ message: 'Unsupported crop. Use grape, onion, or tomato.' });
    }

    const location = process.env.DEFAULT_LOCATION || 'Nashik';
    const cacheKey = `weather:${location.toLowerCase()}`;

    let weather = getCache(cacheKey);

    if (!weather) {
      const apiKey = process.env.OPENWEATHER_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ message: 'OpenWeather API key not configured' });
      }

      const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(
        location
      )}&appid=${apiKey}&units=metric`;

      // Use the first forecast entry as "near real-time"
      try {
        const { data } = await axios.get(url);
        const first = data.list && data.list[0];

        if (!first) throw new Error('No weather data found');

        const rainfall =
          (first.rain && (first.rain['3h'] || first.rain['1h'])) ||
          0;

        const rainfallProbability = Math.min(100, Math.round((rainfall / 10) * 100));
        const temperature = first.main.temp;
        const humidity = first.main.humidity || 50;
        const windSpeed = first.wind && first.wind.speed || 0;
        const weatherDescription = first.weather && first.weather[0] && first.weather[0].description;

        const heavyRainfallPredicted =
          rainfallProbability >= 70 || weatherDescription?.toLowerCase().includes('heavy');

        weather = {
          location,
          temperature,
          humidity,
          windSpeed,
          rainfallProbability,
          weatherDescription,
          heavyRainfallPredicted,
          timestamp: new Date().toISOString(),
          isMock: false
        };

        setCache(cacheKey, weather, 10 * 60 * 1000);
      } catch (apiError) {
        console.warn('Weather API failed, using mock data:', apiError.message);
        // Fallback mock weather for advisory
        weather = {
          location,
          temperature: 30, // Default warm temp
          humidity: 45,
          windSpeed: 10,
          rainfallProbability: 0,
          weatherDescription: 'sunny (mock)',
          heavyRainfallPredicted: false,
          timestamp: new Date().toISOString(),
          isMock: true
        };
      }
    }

    const stage = req.query.stage || 'vegetative';
    const advisory = generateAdvisory(crop, weather, stage);

    return res.json({
      location: weather.location,
      crop: advisory.crop,
      stage: advisory.stage,
      irrigationAdvice: advisory.irrigationAdvice,
      harvestAdvice: advisory.harvestAdvice,
      fertilizerAdvice: advisory.fertilizerAdvice,
      riskAlerts: advisory.riskAlerts,
      weatherSnapshot: {
        temperature: weather.temperature,
        humidity: weather.humidity,
        windSpeed: weather.windSpeed,
        rainfallProbability: weather.rainfallProbability,
        weatherDescription: weather.weatherDescription,
        heavyRainfallPredicted: weather.heavyRainfallPredicted,
        isMock: weather.isMock
      },
    });
  } catch (error) {
    console.error('Advisory error:', error.message);
    // Even if something else fails, try to return a generic advisory? 
    // For now, keep 500 if critical logic fails, but we covered the API failure above.
    return res.status(500).json({ message: 'Failed to generate advisory' });
  }
};

module.exports = { getAdvisory };

