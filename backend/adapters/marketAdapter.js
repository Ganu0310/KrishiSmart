/**
 * Market Adapter - Fetches market price data
 * Integrates with Agmarknet API (Data.gov.in) with fallback to mock data
 * Returns null on failure (never throws)
 */

const axios = require('axios');

const MOCK_MARKET_DATA = {
  grape: [
    { market: 'Nashik APMC', minPrice: 2000, maxPrice: 3500, modalPrice: 2800 },
    { market: 'Pune Market Yard', minPrice: 1800, maxPrice: 3200, modalPrice: 2600 },
    { market: 'Sangli Mandi', minPrice: 2200, maxPrice: 3800, modalPrice: 3000 },
    { market: 'Solapur APMC', minPrice: 1900, maxPrice: 3300, modalPrice: 2700 },
  ],
  onion: [
    { market: 'Nashik APMC', minPrice: 800, maxPrice: 1500, modalPrice: 1200 },
    { market: 'Lasalgaon Mandi', minPrice: 900, maxPrice: 1600, modalPrice: 1300 },
    { market: 'Pune Market Yard', minPrice: 750, maxPrice: 1400, modalPrice: 1100 },
    { market: 'Pimpalgaon Mandi', minPrice: 850, maxPrice: 1550, modalPrice: 1250 },
  ],
  tomato: [
    { market: 'Nashik APMC', minPrice: 600, maxPrice: 1200, modalPrice: 900 },
    { market: 'Pune Market Yard', minPrice: 550, maxPrice: 1100, modalPrice: 850 },
    { market: 'Mumbai APMC', minPrice: 700, maxPrice: 1400, modalPrice: 1050 },
    { market: 'Nagpur Mandi', minPrice: 500, maxPrice: 1000, modalPrice: 750 },
  ],
  wheat: [
    { market: 'Nashik APMC', minPrice: 1800, maxPrice: 2200, modalPrice: 2000 },
    { market: 'Ahmednagar Mandi', minPrice: 1850, maxPrice: 2250, modalPrice: 2050 },
    { market: 'Pune Market Yard', minPrice: 1750, maxPrice: 2150, modalPrice: 1950 },
  ],
  rice: [
    { market: 'Nashik APMC', minPrice: 2500, maxPrice: 3000, modalPrice: 2750 },
    { market: 'Pune Market Yard', minPrice: 2400, maxPrice: 2900, modalPrice: 2650 },
    { market: 'Nanded Mandi', minPrice: 2600, maxPrice: 3100, modalPrice: 2850 },
  ],
};

// Commodity name mapping (our names -> Agmarknet names)
const COMMODITY_MAPPING = {
  grape: 'Grapes',
  onion: 'Onion',
  tomato: 'Tomato',
  wheat: 'Wheat',
  rice: 'Rice',
};

/**
 * Parse date from Agmarknet API (DD/MM/YYYY)
 */
const parseDate = (dateStr) => {
  if (!dateStr) return new Date();
  
  // Handle DD/MM/YYYY format
  if (typeof dateStr === 'string' && dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      // DD/MM/YYYY -> MM/DD/YYYY for Date constructor
      return new Date(`${parts[1]}/${parts[0]}/${parts[2]}`);
    }
  }
  
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
};

/**
 * Fetch market prices from Agmarknet API
 */
const fetchFromAgmarknet = async (crop) => {
  try {
    const commodityName = COMMODITY_MAPPING[crop] || crop;
    
    const response = await axios.get(process.env.AGMARKNET_API_URL, {
      params: {
        'api-key': process.env.AGMARKNET_API_KEY,
        format: 'json',
        limit: 100, // Get more records
      },
      timeout: 10000, // 10 second timeout
    });

    if (!response.data || !response.data.records) {
      console.log(`No records returned from Agmarknet API for ${crop}`);
      return [];
    }

    console.log(`Agmarknet API returned ${response.data.records.length} total records`);

    // Filter records for the specific commodity
    // Try flexible matching since API field names may vary
    const filteredRecords = response.data.records.filter((record) => {
      const recordCommodity = (record.commodity || record.Commodity || '').toLowerCase();
      const cropLower = crop.toLowerCase();
      
      // Match if commodity contains the crop name or vice versa
      return recordCommodity.includes(cropLower) || cropLower.includes(recordCommodity);
    });

    console.log(`Found ${filteredRecords.length} records matching ${crop}`);

    if (filteredRecords.length === 0) {
      // Log first record to see structure
      if (response.data.records.length > 0) {
        console.log('Sample API record structure:', JSON.stringify(response.data.records[0], null, 2));
      }
      return [];
    }

    // Transform API response to our format
    // Handle various possible field name variations
    const prices = filteredRecords.slice(0, 20).map((record) => {
      const minPrice = parseFloat(record.min_price || record.Min_Price || record.minPrice || 0);
      const maxPrice = parseFloat(record.max_price || record.Max_Price || record.maxPrice || 0);
      const modalPrice = parseFloat(record.modal_price || record.Modal_Price || record.modalPrice || 0);
      
      return {
        crop: crop.toLowerCase(),
        market: record.market || record.Market || record.mandi_name || record.Mandi_Name || 'Unknown Market',
        minPrice: minPrice || 0,
        maxPrice: maxPrice || 0,
        modalPrice: modalPrice || maxPrice || minPrice || 0, // Fallback chain
        modalPrice: modalPrice || maxPrice || minPrice || 0, // Fallback chain
        date: parseDate(record.arrival_date || record.Arrival_Date),
        source: 'agmarknet',
        state: record.state || record.State || 'Unknown',
      };
    }).filter(price => price.modalPrice > 0); // Only include records with valid prices

    console.log(`✓ Fetched ${prices.length} real market prices for ${crop} from Agmarknet`);
    return prices;
  } catch (error) {
    console.error('Agmarknet API error for', crop, ':', error.message);
    throw error; // Re-throw to trigger fallback
  }
};

/**
 * Get mock market data as fallback
 */
const getMockMarketData = (crop) => {
  const marketData = MOCK_MARKET_DATA[crop];
  
  if (!marketData) {
    console.log(`No mock data available for crop: ${crop}`);
    return [];
  }

  // Add some random variation to simulate real data
  const pricesWithVariation = marketData.map((market) => {
    const variation = Math.random() * 0.1 - 0.05; // ±5% variation
    return {
      crop: crop.toLowerCase(),
      market: market.market,
      minPrice: Math.round(market.minPrice * (1 + variation)),
      maxPrice: Math.round(market.maxPrice * (1 + variation)),
      modalPrice: Math.round(market.modalPrice * (1 + variation)),
      date: new Date(),
      source: 'mock',
    };
  });

  return pricesWithVariation;
};

/**
 * Main function to fetch market prices
 * Tries real API first, falls back to mock data on failure
 */
const fetchMarketPrices = async (crop) => {
  try {
    const normalizedCrop = crop.toLowerCase().trim();
    
    // Try real API first if API key is configured
    if (process.env.AGMARKNET_API_KEY) {
      try {
        const realData = await fetchFromAgmarknet(normalizedCrop);
        
        if (realData && realData.length > 0) {
          return realData;
        }
        
        console.log(`No real data available for ${crop}, using mock data`);
      } catch (apiError) {
        console.warn(`Agmarknet API failed for ${crop}, falling back to mock:`, apiError.message);
      }
    } else {
      console.log('Agmarknet API key not configured, using mock data');
    }
    
    // Fallback to mock data
    console.log(`Using mock market data for ${crop}`);
    return getMockMarketData(normalizedCrop);
    
  } catch (error) {
    console.error('Market adapter error for', crop, ':', error.message);
    return null;
  }
};

module.exports = { fetchMarketPrices };
