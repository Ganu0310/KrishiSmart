const AdvisoryCache = require('../models/AdvisoryCache');
const { setCache, getCache } = require('../utils/weatherCache');
const { generateAdvisory } = require('../utils/advisoryRules');

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

// ── Weather Fetcher ────────────────────────────────────────
async function fetchWeather(location) {
  const cacheKey = `weather:${location.toLowerCase()}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    const { request } = require('undici');
    const API_KEY = process.env.WEATHER_UNION_API_KEY;
    const COORDS = {
      nashik:     { lat: 19.9975, lng: 73.7898 },
      pune:       { lat: 18.5204, lng: 73.8567 },
      mumbai:     { lat: 19.0760, lng: 72.8777 },
      nagpur:     { lat: 21.1458, lng: 79.0882 },
      aurangabad: { lat: 19.8762, lng: 75.3433 },
    };
    const coords = COORDS[location?.toLowerCase().trim()] || COORDS['nashik'];
    const url = `https://www.weatherunion.com/gw/weather/external/v0/get_weather_data?latitude=${coords.lat}&longitude=${coords.lng}`;

    const { statusCode, body } = await request(url, {
      headers: { 'x-zomato-api-key': API_KEY },
      headersTimeout: 10000,
    });

    if (statusCode !== 200) throw new Error(`WeatherUnion: HTTP ${statusCode}`);

    const json = await body.json();
    const d = json.locality_weather_data;
    if (!d) throw new Error('No weather data from WeatherUnion');

    const rainfall = d.rain_intensity || 0;
    const weather = {
      location,
      temperature: d.temperature || 30,
      humidity: d.humidity || 50,
      windSpeed: d.wind_speed || 0,
      rainfallProbability: rainfall > 0 ? 100 : (d.humidity > 80 ? 50 : 0),
      weatherDescription: rainfall > 0 ? 'rain' : (d.humidity > 70 ? 'cloudy' : 'clear sky'),
      heavyRainfallPredicted: rainfall > 20,
      timestamp: new Date().toISOString(),
      isMock: false,
    };

    setCache(cacheKey, weather, 10 * 60 * 1000);
    return weather;
  } catch (err) {
    console.warn('[Advisory] Weather fetch failed, using mock:', err.message);
    return {
      location,
      temperature: 30, humidity: 45, windSpeed: 10,
      rainfallProbability: 0,
      weatherDescription: 'sunny (mock)',
      heavyRainfallPredicted: false,
      timestamp: new Date().toISOString(),
      isMock: true,
    };
  }
}

// ── Cache key builder (bucket-keyed to avoid hyper-specific keys) ──
function buildCacheKey(crop, stage, location, weather) {
  const tempBucket = Math.round(weather.temperature / 5) * 5;
  const humBucket  = Math.round(weather.humidity / 10) * 10;
  const rainBucket = weather.rainfallProbability > 60 ? 'high'
                   : weather.rainfallProbability > 30 ? 'mid' : 'low';
  return `advisory:rulebase:${crop}:${stage}:${location.toLowerCase()}:t${tempBucket}:h${humBucket}:r${rainBucket}`;
}

// ── Rule-based Advisory Generator ──────────────────────────
function buildRuleBasedAdvisory(crop, stage, weather) {
  try {
    const rules = generateAdvisory(crop, weather, stage);
    return {
      summary: `${crop} crop at ${stage} stage — standard advisory based on current weather.`,
      irrigation: {
        advice: rules.irrigationAdvice,
        action: weather.rainfallProbability > 60 ? 'Skip irrigation' : 'Irrigate as scheduled',
        urgency: weather.heavyRainfallPredicted ? 'Low' : 'Medium',
      },
      fertilizer: {
        recommendation: rules.fertilizerAdvice,
        method: 'Basal / Foliar as appropriate',
      },
      pest_disease_risk: {
        risk_level: weather.rainfallProbability > 60 ? 'High' : 'Medium',
        potential_threats: rules.riskAlerts.length ? rules.riskAlerts : ['Monitor for common pests'],
        preventive_measures: ['Follow IPM practices', 'Maintain field hygiene'],
      },
      intercultural_operations: [rules.harvestAdvice, 'Regular scouting recommended'],
      weather_alert: weather.heavyRainfallPredicted
        ? 'Heavy rainfall predicted — ensure field drainage and avoid spray operations.'
        : null,
      fromFallback: true,
    };
  } catch (_err) {
    // Ultra-safe fallback if even the rules fail (e.g., unsupported crop)
    return {
      summary: `Advisory for ${crop} at ${stage} stage.`,
      irrigation: { advice: 'Maintain normal irrigation schedule.', action: 'Monitor soil moisture', urgency: 'Low' },
      fertilizer: { recommendation: 'Consult local agricultural extension officer.', method: 'Basal' },
      pest_disease_risk: { risk_level: 'Low', potential_threats: [], preventive_measures: ['Scout regularly'] },
      intercultural_operations: ['Weed management', 'Field inspection'],
      weather_alert: null,
      fromFallback: true,
    };
  }
}

// ── Main Controller ────────────────────────────────────────
const getAdvisory = async (req, res) => {
  try {
    const crop     = (req.params.crop || '').toLowerCase();
    const stage    = (req.query.stage || 'vegetative').toLowerCase();
    const location = process.env.DEFAULT_LOCATION || 'Nashik';

    // 1. Fetch weather (in-memory cache, 10 min)
    const weather = await fetchWeather(location);

    // 2. Check MongoDB cache
    const cacheKey = buildCacheKey(crop, stage, location, weather);
    const cached   = await AdvisoryCache.findOne({ cacheKey });

    if (cached) {
      console.log(`[Advisory] Cache HIT (Rule-based): ${cacheKey}`);
      return res.json({
        success: true,
        ...cached.advisory,
        weatherSnapshot: cached.weatherSnapshot,
        cachedAt: cached.createdAt,
        fromCache: true,
      });
    }

    // 3. Generate Rule-based Advisory
    console.log(`[Advisory] Cache MISS — generating rule-based: ${cacheKey}`);
    const advisory = buildRuleBasedAdvisory(crop, stage, weather);

    // 4. Store in MongoDB (upsert, 6h TTL)
    await AdvisoryCache.findOneAndUpdate(
      { cacheKey },
      {
        cacheKey,
        advisory: { ...advisory, crop, stage },
        weatherSnapshot: weather,
        expiresAt: new Date(Date.now() + CACHE_TTL_MS),
        createdAt: new Date(),
      },
      { upsert: true, returnDocument: 'after' }
    );

    return res.json({ success: true, ...advisory, crop, stage, weatherSnapshot: weather, fromCache: false });

  } catch (error) {
    console.error('[Advisory] Fatal error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to generate advisory. Please try again.' });
  }
};

// ── Admin: Clear cache ─────────────────────────────────────
const clearAdvisoryCache = async (req, res) => {
  try {
    const result = await AdvisoryCache.deleteMany({});
    res.json({ success: true, message: `Cleared ${result.deletedCount} cached advisories.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAdvisory, clearAdvisoryCache };
