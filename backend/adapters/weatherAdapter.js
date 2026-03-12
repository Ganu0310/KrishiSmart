const { request } = require('undici');

const WEATHER_UNION_API_KEY = process.env.WEATHER_UNION_API_KEY;

// Mapping known cities to their approx coords since WeatherUnion's external API operates on lat/lon
const CITY_COORDS = {
  'nashik': { lat: 19.9975, lng: 73.7898 },
  'pune': { lat: 18.5204, lng: 73.8567 },
  'mumbai': { lat: 19.0760, lng: 72.8777 },
  'nagpur': { lat: 21.1458, lng: 79.0882 },
  'aurangabad': { lat: 19.8762, lng: 75.3433 },
};

const fetchWeatherData = async (location) => {
  try {
    const defaultCoords = CITY_COORDS['nashik'];
    const coords = CITY_COORDS[location?.toLowerCase().trim()] || defaultCoords;

    const weatherUrl = `https://www.weatherunion.com/gw/weather/external/v0/get_weather_data?latitude=${coords.lat}&longitude=${coords.lng}`;
    
    const { statusCode, body } = await request(weatherUrl, {
      headers: {
        'x-zomato-api-key': WEATHER_UNION_API_KEY,
      },
      headersTimeout: 10000,
    });

    if (statusCode !== 200) {
      console.error(`WeatherUnion API failed with status ${statusCode}`);
      return null;
    }

    const res = await body.json();
    const data = res.locality_weather_data;

    if (!data) {
      console.error('Unable to parse WeatherUnion data for', location);
      return null;
    }

    // WeatherUnion data parsing. They return null for missing sensor data sometimes.
    const rainfall = data.rain_intensity || 0;
    const temperature = data.temperature || 30; // Fallback to 30 if null
    const humidity = data.humidity || 50; // Fallback to 50 if null
    const windSpeed = data.wind_speed || 0;
    
    // WeatherUnion v0 API doesn't provide string descriptions/codes currently
    const weatherDescription = rainfall > 0 ? 'rain' : (humidity > 70 ? 'cloudy' : 'clear sky');

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
