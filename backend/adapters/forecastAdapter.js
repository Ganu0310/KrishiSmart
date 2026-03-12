const { request } = require('undici');

/**
 * Open-Meteo API - 100% free, no API key required.
 * Fetches a 7-day daily forecast: max/min temp, rain, wind, UV index.
 */

const CITY_COORDS = {
  nashik:      { lat: 19.9975, lng: 73.7898 },
  pune:        { lat: 18.5204, lng: 73.8567 },
  mumbai:      { lat: 19.0760, lng: 72.8777 },
  nagpur:      { lat: 21.1458, lng: 79.0882 },
  aurangabad:  { lat: 19.8762, lng: 75.3433 },
  solapur:     { lat: 17.6599, lng: 75.9064 },
  kolhapur:    { lat: 16.7050, lng: 74.2433 },
  satara:      { lat: 17.6860, lng: 74.0030 },
  jalgaon:     { lat: 21.0077, lng: 75.5626 },
  ahmed_nagar: { lat: 19.0948, lng: 74.7480 },
};

const WMO_DESCRIPTIONS = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Foggy', 48: 'Icy fog',
  51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Heavy drizzle',
  61: 'Light rain', 63: 'Moderate rain', 65: 'Heavy rain',
  71: 'Light snow', 73: 'Moderate snow', 75: 'Heavy snow',
  80: 'Light showers', 81: 'Moderate showers', 82: 'Violent showers',
  95: 'Thunderstorm', 96: 'Thunderstorm with hail', 99: 'Heavy thunderstorm with hail',
};

const fetchForecast = async (location) => {
  try {
    const key = location?.toLowerCase().trim().replace(/ /g, '_');
    const coords = CITY_COORDS[key] || CITY_COORDS['nashik'];

    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${coords.lat}&longitude=${coords.lng}` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,` +
      `precipitation_probability_max,windspeed_10m_max,weathercode,uv_index_max` +
      `&timezone=Asia%2FKolkata&forecast_days=7`;

    const { statusCode, body } = await request(url, {
      headersTimeout: 10000,
    });

    if (statusCode !== 200) {
      console.error(`Open-Meteo API failed with status ${statusCode}`);
      return null;
    }

    const json = await body.json();
    const d = json.daily;

    if (!d || !d.time) {
      console.error('Open-Meteo: unexpected response shape');
      return null;
    }

    // Build a daily array
    const days = d.time.map((date, i) => ({
      date,
      tempMax: d.temperature_2m_max[i],
      tempMin: d.temperature_2m_min[i],
      rainfall: d.precipitation_sum[i] ?? 0,           // mm
      rainProbability: d.precipitation_probability_max[i] ?? 0, // %
      windSpeed: d.windspeed_10m_max[i] ?? 0,          // km/h
      uvIndex: d.uv_index_max[i] ?? 0,
      weatherCode: d.weathercode[i],
      description: WMO_DESCRIPTIONS[d.weathercode[i]] || 'Unknown',
    }));

    return {
      location: location || 'Nashik',
      fetchedAt: new Date(),
      days,
    };
  } catch (error) {
    console.error('Forecast adapter error:', error.message);
    return null;
  }
};

module.exports = { fetchForecast };
