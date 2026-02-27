const axios = require('axios');

/**
 * Weather Adapter - Fetches weather data from OpenWeather API
 * Returns null on failure (never throws)
 */
const fetchWeatherData = async (location) => {
  try {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
      console.error('OpenWeather API key not configured');
      return null;
    }

    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(
      location
    )}&appid=${apiKey}&units=metric`;

    const { data } = await axios.get(url, { timeout: 10000 });

    // Use the first forecast entry
    const first = data.list && data.list[0];
    if (!first) {
      console.error('Unable to parse weather data for', location);
      return null;
    }

    const rainfall = (first.rain && (first.rain['3h'] || first.rain['1h'])) || 0;
    const temperature = first.main.temp;
    const humidity = first.main.humidity || 50;
    const windSpeed = (first.wind && first.wind.speed) || 0;
    const weatherDescription =
      (first.weather && first.weather[0] && first.weather[0].description) || '';

    // Generate warning based on conditions
    let warning = '';
    if (rainfall > 20) {
      warning = 'Heavy rainfall expected. Avoid irrigation.';
    } else if (humidity > 70) {
      warning = 'High humidity. Monitor crops for fungal diseases.';
    } else if (temperature > 35) {
      warning = 'High temperature. Ensure adequate irrigation.';
    }

    return {
      location,
      rainfall,
      temperature,
      humidity,
      windSpeed,
      weatherDescription,
      warning,
      updatedAt: new Date(),
    };
  } catch (error) {
    console.error('Weather adapter error for', location, ':', error.message);
    return null;
  }
};

module.exports = { fetchWeatherData };
