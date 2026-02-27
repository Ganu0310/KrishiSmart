/**
 * Soil Adapter - Fetches soil condition data
 * Currently uses mock data - can be replaced with actual soil/geo API
 * Returns null on failure (never throws)
 */

const MOCK_SOIL_DATA = {
  nashik: { soilMoisture: 'medium', droughtRisk: 'low' },
  pune: { soilMoisture: 'low', droughtRisk: 'medium' },
  mumbai: { soilMoisture: 'high', droughtRisk: 'low' },
  ahmednagar: { soilMoisture: 'low', droughtRisk: 'high' },
  solapur: { soilMoisture: 'low', droughtRisk: 'high' },
  sangli: { soilMoisture: 'medium', droughtRisk: 'medium' },
  satara: { soilMoisture: 'medium', droughtRisk: 'low' },
  kolhapur: { soilMoisture: 'high', droughtRisk: 'low' },
};

const fetchSoilData = async (location) => {
  try {
    const normalizedLocation = location.toLowerCase().trim();
    
    // TODO: Replace with actual soil/geo API call
    // Example: const response = await axios.get(`https://soil-api.gov.in/data/${location}`);
    
    // For now, return mock data
    let soilData = MOCK_SOIL_DATA[normalizedLocation];
    
    // If location not in mock data, generate random but realistic data
    if (!soilData) {
      const moistureLevels = ['low', 'medium', 'high'];
      const riskLevels = ['low', 'medium', 'high'];
      
      // Simulate seasonal variation
      const month = new Date().getMonth();
      const isMonsoon = month >= 5 && month <= 9; // June to October
      
      soilData = {
        soilMoisture: isMonsoon 
          ? moistureLevels[Math.floor(Math.random() * 2) + 1] // medium or high
          : moistureLevels[Math.floor(Math.random() * 2)], // low or medium
        droughtRisk: isMonsoon
          ? 'low'
          : riskLevels[Math.floor(Math.random() * 3)],
      };
    }

    return {
      location,
      soilMoisture: soilData.soilMoisture,
      droughtRisk: soilData.droughtRisk,
      lastUpdated: new Date(),
    };
  } catch (error) {
    console.error('Soil adapter error for', location, ':', error.message);
    return null;
  }
};

module.exports = { fetchSoilData };
