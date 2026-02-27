import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface WeatherData {
  success: boolean;
  location: string;
  rainfall: number;
  temperature: number;
  humidity: number;
  windSpeed: number;
  weatherDescription: string;
  warning: string;
  lastUpdated: string;
  staleData: boolean;
}

export interface SoilData {
  success: boolean;
  location: string;
  soilMoisture: 'low' | 'medium' | 'high';
  droughtRisk: 'low' | 'medium' | 'high';
  lastUpdated: string;
  staleData: boolean;
  note?: string;
}

export interface MarketData {
  success: boolean;
  crop: string;
  prices: Array<{
    market: string;
    minPrice: number;
    maxPrice: number;
    modalPrice: number;
    date: string;
    source: string;
  }>;
  bestMandi: {
    market: string;
    modalPrice: number;
    trend: 'rising' | 'falling' | 'stable';
  };
  lastUpdated: string;
  staleData: boolean;
}

export interface AdvisoryData {
  success: boolean;
  crop: string;
  location: string;
  irrigationAdvice: string;
  diseaseRisk: string;
  harvestAdvice: string;
  marketSuggestion: string;
  generatedAt: string;
  cached?: boolean;
  dataQuality?: {
    weatherAvailable: boolean;
    soilAvailable: boolean;
    marketAvailable: boolean;
    staleWeather: boolean;
    staleSoil: boolean;
    staleMarket: boolean;
  };
}

/**
 * Get current weather data from cache
 */
export const getCurrentWeather = async (location: string): Promise<WeatherData> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/gov-data/weather/current`, {
      params: { location },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching weather:', error);
    throw error;
  }
};

/**
 * Get market prices for a crop
 */
export const getMarketPrices = async (crop: string): Promise<MarketData> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/gov-data/market/${crop}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching market prices:', error);
    throw error;
  }
};

/**
 * Get soil condition data
 */
export const getSoilCondition = async (location: string): Promise<SoilData> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/gov-data/soil/${location}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching soil data:', error);
    throw error;
  }
};

/**
 * Get or generate agricultural advisory
 */
export const getAdvisory = async (crop: string, location: string): Promise<AdvisoryData> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/gov-data/advisory/${crop}/${location}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching advisory:', error);
    throw error;
  }
};
