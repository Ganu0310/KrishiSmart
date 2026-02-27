const Advisory = require('../models/Advisory');
const { getCurrentWeather } = require('./weatherService');
const { getSoilCondition } = require('./soilService');
const { getMarketPrices } = require('./marketService');

/**
 * Advisory Engine - Combines weather, soil, and market data to generate intelligent advisories
 */
const generateAdvisory = async (crop, location) => {
  try {
    const normalizedCrop = crop.toLowerCase().trim();
    const normalizedLocation = location.toLowerCase().trim();

    // Fetch all data sources
    const [weatherResult, soilResult, marketResult] = await Promise.all([
      getCurrentWeather(location),
      getSoilCondition(location),
      getMarketPrices(crop),
    ]);

    // Extract data (use defaults if not available)
    const weather = weatherResult.success ? weatherResult.data : null;
    const soil = soilResult.success ? soilResult.data : null;
    const market = marketResult.success ? marketResult.data : null;

    // Generate irrigation advice
    let irrigationAdvice = 'Monitor soil moisture and irrigate as needed.';
    if (weather && soil) {
      if (weather.rainfall > 20) {
        irrigationAdvice = '🌧️ Heavy rainfall expected. Skip irrigation for 2-3 days.';
      } else if (soil.soilMoisture === 'high') {
        irrigationAdvice = '💧 Soil moisture is high. No irrigation needed currently.';
      } else if (soil.soilMoisture === 'low' && weather.rainfall < 5) {
        irrigationAdvice = '⚠️ Low soil moisture and no rain expected. Irrigate immediately.';
      } else if (soil.soilMoisture === 'medium' && weather.rainfall < 10) {
        irrigationAdvice = '✓ Moderate irrigation recommended within 24-48 hours.';
      }
    }

    // Generate disease risk assessment
    let diseaseRisk = 'No significant risk detected';
    if (weather) {
      if (weather.humidity > 70 && weather.temperature > 25) {
        diseaseRisk = '⚠️ High humidity and warm temperature - High risk of fungal diseases. Apply preventive fungicide.';
      } else if (weather.humidity > 60) {
        diseaseRisk = '⚡ Moderate humidity - Monitor crops for early signs of fungal infection.';
      } else if (weather.temperature > 35) {
        diseaseRisk = '🌡️ High temperature - Risk of heat stress. Ensure adequate water supply.';
      }
    }

    // Generate harvest advice
    let harvestAdvice = 'Continue regular crop monitoring.';
    if (market) {
      if (market.bestMandi.trend === 'rising') {
        harvestAdvice = '📈 Market prices are rising. Consider delaying harvest by 3-5 days for better returns.';
      } else if (market.bestMandi.trend === 'falling') {
        harvestAdvice = '📉 Market prices are falling. Harvest immediately to avoid losses.';
      } else {
        harvestAdvice = '📊 Market prices are stable. Harvest when crop reaches optimal maturity.';
      }
    }

    // Add weather-based harvest considerations
    if (weather && weather.rainfall > 15) {
      harvestAdvice += ' Note: Heavy rainfall expected - avoid harvesting during rain.';
    }

    // Generate market suggestion
    let marketSuggestion = 'Market data not available.';
    if (market && market.bestMandi) {
      marketSuggestion = `🏪 Best market: ${market.bestMandi.market} at ₹${market.bestMandi.modalPrice}/quintal. `;
      
      if (market.prices.length > 1) {
        const secondBest = market.prices[1];
        marketSuggestion += `Alternative: ${secondBest.market} at ₹${secondBest.modalPrice}/quintal.`;
      }
    }

    // Create advisory object
    const advisory = {
      crop: normalizedCrop,
      location: normalizedLocation,
      irrigationAdvice,
      diseaseRisk,
      harvestAdvice,
      marketSuggestion,
      generatedAt: new Date(),
    };

    // Save to database
    const savedAdvisory = await Advisory.create(advisory);

    // Return comprehensive advisory
    return {
      success: true,
      data: {
        ...advisory,
        id: savedAdvisory._id,
        dataQuality: {
          weatherAvailable: !!weather,
          soilAvailable: !!soil,
          marketAvailable: !!market,
          staleWeather: weatherResult.staleData,
          staleSoil: soilResult.staleData,
          staleMarket: marketResult.staleData,
        },
      },
    };
  } catch (error) {
    console.error('Error generating advisory:', error.message);
    return {
      success: false,
      message: 'Failed to generate advisory',
    };
  }
};

/**
 * Get latest advisory for a crop and location
 */
const getLatestAdvisory = async (crop, location) => {
  try {
    const normalizedCrop = crop.toLowerCase().trim();
    const normalizedLocation = location.toLowerCase().trim();

    const advisory = await Advisory.findOne({
      crop: normalizedCrop,
      location: normalizedLocation,
    })
      .sort({ generatedAt: -1 })
      .lean();

    if (!advisory) {
      return {
        success: false,
        message: 'No advisory available. Generating new one...',
      };
    }

    // Check if advisory is stale (older than 6 hours)
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
    const isStale = advisory.generatedAt < sixHoursAgo;

    return {
      success: true,
      data: advisory,
      staleData: isStale,
    };
  } catch (error) {
    console.error('Error getting advisory:', error.message);
    return {
      success: false,
      message: 'Failed to retrieve advisory',
    };
  }
};

module.exports = {
  generateAdvisory,
  getLatestAdvisory,
};
