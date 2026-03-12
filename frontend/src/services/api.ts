import axios, { AxiosError } from "axios";

export const BASE_URL = "http://localhost:5000";

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      } as any;
    }
  }
  return config;
});

const handleApiError = (error: unknown): never => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string }>;
    const message =
      axiosError.response?.data?.message ||
      axiosError.message ||
      "Something went wrong. Please try again.";
    throw new Error(message);
  }
  throw new Error("Something went wrong. Please try again.");
};

// Types aligned with backend
export interface User {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: "farmer" | "admin";
  location: string;
  crops: string[];
  profilePicture?: string;
  farmSize?: number;
  address?: string;
  isEmailVerified?: boolean;
}

export interface BackendWeatherData {
  location: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  rainfallProbability: number;
  weatherDescription: string;
  heavyRainfallPredicted: boolean;
  timestamp: string;
}

export interface AdvisoryResponse {
  crop: string;
  stage: string;
  advice: string;
  alerts?: string[];
  weatherSnapshot: {
    temperature: number;
    rainfallProbability: number;
    humidity?: number;
    windSpeed?: string;
  };
}

export interface MarketPriceItem {
  _id: string;
  crop: string;
  mandi?: string; // Legacy field
  market?: string; // New field from gov-data API
  price: number;
  date: string;
}

export interface MarketPriceResponse {
  crop: string;
  count: number;
  prices: MarketPriceItem[];
  note: string;
}

// Admin Interfaces
export interface AdminStats {
  totalFarmers: number;
  activeFarmers: number;
  suspendedUsers: number;
  onlineUsers: number;
  cropDistribution: { _id: string; count: number }[];
  weatherRequests: number;
  totalFertilizers?: number;
}

export interface AdminUser {
  _id: string;
  name: string;
  email?: string;
  mobile: string;
  role: string;
  location: string;
  crops: string[];
  status: 'active' | 'suspended';
  isOnline: boolean;
  lastLogin?: string;
  createdAt: string;
}

export interface UserResponse {
  users: AdminUser[];
  page: number;
  pages: number;
  total: number;
}

// Auth Response Interface
export interface AuthResponse {
  message: string;
  token: string;
  role: "farmer" | "admin";
  user: User;
}

export const authApi = {
  loginOtp: async (mobile: string): Promise<{ message: string }> => {
    try {
      const res = await apiClient.post("/api/auth/login-otp", { mobile });
      return res.data;
    } catch (error) {
       return handleApiError(error);
    }
  },
  verifyLoginOtp: async (mobile: string, otp: string): Promise<AuthResponse> => {
    try {
      const res = await apiClient.post<AuthResponse>("/api/auth/verify-login-otp", { mobile, otp });
      return res.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  loginEmailOtp: async (email: string): Promise<{ message: string }> => {
    try {
      const res = await apiClient.post("/api/auth/login-email-otp", { email });
      return res.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  verifyLoginEmailOtp: async (email: string, otp: string): Promise<AuthResponse> => {
    try {
      const res = await apiClient.post<AuthResponse>("/api/auth/verify-login-email-otp", { email, otp });
      return res.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
    adminLogin: async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const res = await apiClient.post<AuthResponse>("/api/auth/admin-login", {
        email,
        password,
      });
      return res.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  register: async (data: {
    name: string;
    email?: string;
    mobile: string;
    role: "farmer" | "admin";
    location?: string;
    crops?: string[];
  }): Promise<AuthResponse> => {
    try {
      const res = await apiClient.post<AuthResponse>("/api/auth/register", data);
      return res.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  forgotPassword: async (email: string) => {
    try {
      const res = await apiClient.post("/api/auth/forgot-password", { email });
      return res.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  verifyOTP: async (email: string, otp: string) => {
    try {
      const res = await apiClient.post("/api/auth/verify-otp", { email, otp });
      return res.data; // contains resetToken
    } catch (error) {
      return handleApiError(error);
    }
  },
  resetPassword: async (token: string, password: string) => {
    try {
      const res = await apiClient.post("/api/auth/reset-password", { token, password });
      return res.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
};

// Admin API
export const adminApi = {
  getStats: async (): Promise<AdminStats> => {
    try {
      const res = await apiClient.get<AdminStats>("/api/admin/stats");
      return res.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  getUsers: async (page = 1, search = "", status = ""): Promise<UserResponse> => {
    try {
      const res = await apiClient.get<UserResponse>("/api/admin/users", {
        params: { page, search, status },
      });
      return res.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  createUser: async (userData: any) => {
    try {
      const res = await apiClient.post("/api/admin/users", userData);
      return res.data;
    } catch (error) {
        return handleApiError(error);
    }
  },
  updateUser: async (id: string, userData: any) => {
    try {
      const res = await apiClient.put(`/api/admin/users/${id}`, userData);
      return res.data;
    } catch (error) {
        return handleApiError(error);
    }
  },
  deleteUser: async (id: string) => {
    try {
      const res = await apiClient.delete(`/api/admin/users/${id}`);
      return res.data;
    } catch (error) {
        return handleApiError(error);
    }
  },
  updateUserStatus: async (id: string, status: "active" | "suspended"): Promise<void> => {
    try {
      await apiClient.patch(`/api/admin/users/${id}/status`, { status });
    } catch (error) {
      return handleApiError(error);
    }
  },
  broadcast: async (message: string, type = "info"): Promise<void> => {
    try {
      await apiClient.post("/api/admin/broadcast", { message, type });
    } catch (error) {
      return handleApiError(error);
    }
  },
  // CMS - Market Prices
  addMarketPrice: async (data: { crop: string; mandi: string; price: number }): Promise<void> => {
    try {
      await apiClient.post("/api/admin/market-prices", data);
    } catch (error) {
      return handleApiError(error);
    }
  },
  deleteMarketPrice: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/api/admin/market-prices/${id}`);
    } catch (error) {
      return handleApiError(error);
    }
  },
  // CMS - Advisory
  addAdvisory: async (data: any): Promise<void> => {
    try {
      await apiClient.post("/api/admin/advisory", data);
    } catch (error) {
      return handleApiError(error);
    }
  },
  deleteAdvisory: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/api/admin/advisory/${id}`);
    } catch (error) {
      return handleApiError(error);
    }
  },

  updateFertilizer: async (id: string, formData: FormData): Promise<Fertilizer> => {
    try {
      const res = await apiClient.put(`/api/fertilizers/admin/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return res.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  toggleFertilizerStatus: async (id: string): Promise<any> => {
    try {
      const res = await apiClient.patch(`/api/fertilizers/admin/${id}/status`);
      return res.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
};

// Weather
export const weatherApi = {
  get: async (location = "Nashik"): Promise<BackendWeatherData> => {
    try {
      const res = await apiClient.get<BackendWeatherData>("/api/gov-data/weather/current", {
        params: { location },
      });
      return res.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
};

// Advisory
export const advisoryApi = {
  get: async (crop: string, stage: string = "vegetative"): Promise<AdvisoryResponse> => {
    try {
      const res = await apiClient.get<AdvisoryResponse>(`/api/advisory/${crop}`, {
        params: { stage },
      });
      return res.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
};

// Market Prices
export const marketApi = {
  get: async (crop: string): Promise<MarketPriceResponse> => {
    try {
      const res = await apiClient.get<MarketPriceResponse>(`/api/market-prices/${crop}`);
      return res.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  getTrend: async (crop: string, days: number = 30): Promise<any> => {
    try {
      const res = await apiClient.get(`/api/market-prices/${crop}/trend`, { params: { days } });
      return res.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
};


// Fertilizer Types
export interface Fertilizer {
  _id: string;
  name: string;
  brand?: string;
  image: string;
  description: string;
  nutrients: {
    nitrogen: number;
    phosphorus: number;
    potassium: number;
    micronutrients?: string[];
  };
  pricePerKg: number;
  suitableCrops: string[];
  growthStageRecommendation?: {
    vegetative?: boolean;
    flowering?: boolean;
    fruiting?: boolean;
    harvest?: boolean;
  };
  applicationMethod?: string;
  dosageGuide?: any;
  precautions?: string;
  organic?: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Fertilizer API
export const fertilizerApi = {
  getAll: async (crop?: string): Promise<{ fertilizers: Fertilizer[]; count: number }> => {
    try {
      const params = crop ? { crop } : {};
      const res = await apiClient.get('/api/fertilizers', { params });
      return res.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  getById: async (id: string): Promise<Fertilizer> => {
    try {
      const res = await apiClient.get(`/api/fertilizers/${id}`);
      return res.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Admin methods
  getAllAdmin: async (): Promise<{ fertilizers: Fertilizer[]; count: number }> => {
    try {
      const res = await apiClient.get('/api/fertilizers/admin/all');
      return res.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  add: async (formData: FormData): Promise<Fertilizer> => {
    try {
      const res = await apiClient.post('/api/fertilizers/admin/add', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return res.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  update: async (id: string, formData: FormData): Promise<Fertilizer> => {
    try {
      const res = await apiClient.put(`/api/fertilizers/admin/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return res.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  deactivate: async (id: string): Promise<void> => {
    try {
      await apiClient.patch(`/api/fertilizers/admin/${id}/deactivate`);
    } catch (error) {
      return handleApiError(error);
    }
  },
};

export const userApi = {
  getProfile: async (): Promise<User> => {
    try {
      const res = await apiClient.get<User>("/api/user/profile");
      return res.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  updateProfile: async (formData: FormData): Promise<{ message: string; user: User }> => {
    try {
      const res = await apiClient.put("/api/user/profile", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return res.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
};

// Government Data Admin Types
export interface JobStats {
  name: string;
  lastRun: string | null;
  nextRun: string | null;
  successCount: number;
  failureCount: number;
  lastError: string | null;
  isRunning: boolean;
  recentLogs: Array<{
    timestamp: string;
    status: 'success' | 'failure';
    details?: any;
    error?: string;
  }>;
}

export interface CacheStats {
  totalRecords: number;
  staleRecords: number;
  freshRecords: number;
  stalePercentage: string;
  lastUpdated: string | null;
  locations?: string[];
  crops?: string[];
  markets?: string[];
}

export interface DataQuality {
  coverage: {
    weather: string;
    soil: string;
    market: string;
    overall: string;
  };
  missing: {
    weatherLocations: string[];
    soilLocations: string[];
    marketCrops: string[];
  };
  completeness: {
    weather: boolean;
    soil: boolean;
    market: boolean;
  };
}

// Admin Market Price Interface
export interface AdminMarketPrice {
  _id: string;
  crop: string;
  market: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  date: string;
  source: string;
  lastUpdated: string;
}

export interface MarketPriceListResponse {
  success: boolean;
  data: AdminMarketPrice[];
  pagination: {
    total: number;
    page: number;
    pages: number;
  };
}

export const marketPriceAdminApi = {
  getAll: async (params: { page?: number; limit?: number; crop?: string; market?: string; source?: string; search?: string }): Promise<MarketPriceListResponse> => {
    try {
      const res = await apiClient.get<MarketPriceListResponse>("/api/admin/market-prices", { params });
      return res.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  create: async (data: Omit<AdminMarketPrice, "_id" | "lastUpdated">): Promise<{ success: boolean; data: AdminMarketPrice }> => {
    try {
      const res = await apiClient.post("/api/admin/market-prices", data);
      return res.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  update: async (id: string, data: Partial<AdminMarketPrice>): Promise<{ success: boolean; data: AdminMarketPrice }> => {
    try {
      const res = await apiClient.put(`/api/admin/market-prices/${id}`, data);
      return res.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await apiClient.delete(`/api/admin/market-prices/${id}`);
      return res.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
};

// Government Data Admin API
export const govDataAdminApi = {
  getJobStatus: async (): Promise<{ success: boolean; jobs: JobStats[] }> => {
    try {
      const res = await apiClient.get('/api/admin/gov-data/jobs');
      return res.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  getCacheStats: async (): Promise<{ success: boolean; stats: Record<string, CacheStats> }> => {
    try {
      const res = await apiClient.get('/api/admin/gov-data/cache-stats');
      return res.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  manualRefresh: async (source: string): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await apiClient.post(`/api/admin/gov-data/refresh/${source}`);
      return res.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  clearCache: async (source: string): Promise<{ success: boolean; message: string; deletedCount: number }> => {
    try {
      const res = await apiClient.delete(`/api/admin/gov-data/cache/${source}`);
      return res.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  getDataQuality: async (): Promise<{ success: boolean; quality: DataQuality }> => {
    try {
      const res = await apiClient.get('/api/admin/gov-data/data-quality');
      return res.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
};

// ─── New Types ────────────────────────────────────────────────────────────────

export interface WeatherForecastDay {
  date: string;
  tempMax: number;
  tempMin: number;
  avgTemp: number;
  rainfall: number;
  rainProbability: number;
  windSpeed: number;
  uvIndex: number;
  weatherCode: number;
  description: string;
  sowingScore?: number;
}

export interface WeatherForecastResponse {
  success: boolean;
  location: string;
  fetchedAt: string;
  days: WeatherForecastDay[];
}

export interface PestRisk {
  pest: string;
  type: string;
  level: 'low' | 'medium' | 'high' | 'critical';
  advice: string;
}

export interface PestRiskResponse {
  success: boolean;
  crop: string;
  overallRiskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskSummary: string;
  risks: PestRisk[];
  weatherSnapshot: {
    temperature: number;
    humidity: number;
    rainfall: number;
    windSpeed: number;
  };
  assessedAt: string;
  staleWeatherData?: boolean;
}

export interface MarketTrendResponse {
  success: boolean;
  crop: string;
  analysisPeriodDays: number;
  trend: 'rising' | 'falling' | 'stable';
  changePercent: number;
  currentPrice: number;
  priceRange: { min: number; max: number };
  bestMandi: { market: string; avgModalPrice: number; dataPoints: number } | null;
  allMarkets: { market: string; avgModalPrice: number; dataPoints: number }[];
  sellingAdvice: string;
  chartData: { date: string; modalPrice: number; market: string }[];
  dataPoints: number;
}

export interface GovernmentScheme {
  _id: string;
  schemeName: string;
  ministry: string;
  schemeType: 'subsidy' | 'insurance' | 'loan' | 'training' | 'equipment' | 'other';
  benefitSummary: string;
  eligibility: string;
  howToApply: string;
  applicationUrl: string;
  applicableStates: string[];
  applicableCrops: string[];
  deadline: string;
  isActive: boolean;
}

export interface SchemesResponse {
  success: boolean;
  data: GovernmentScheme[];
  pagination: { total: number; page: number; pages: number };
}

export interface SowingCalendarResponse {
  success: boolean;
  crop: string;
  location: string;
  recommendation: string;
  bestWindow: { startDate: string; endDate: string; durationDays: number; avgScore: number } | null;
  bestSingleDay: WeatherForecastDay & { sowingScore: number };
  forecastDays: (WeatherForecastDay & { sowingScore: number })[];
  cropInfo: {
    seasonalHint: string;
    growthDuration: string;
    optimalTempRange: string;
    maxTolerableRainfall: string;
  };
}

// ─── New API Namespaces ───────────────────────────────────────────────────────

export const forecastApi = {
  get: async (location = 'Nashik'): Promise<WeatherForecastResponse> => {
    try {
      const res = await apiClient.get<WeatherForecastResponse>('/api/weather/forecast', {
        params: { location },
      });
      return res.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
};

export const pestRiskApi = {
  get: async (crop: string, location = 'Nashik'): Promise<PestRiskResponse> => {
    try {
      const res = await apiClient.get<PestRiskResponse>('/api/advisory/pest-risk', {
        params: { crop, location },
      });
      return res.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
};

export const marketTrendApi = {
  get: async (crop: string, days = 30): Promise<MarketTrendResponse> => {
    try {
      const res = await apiClient.get<MarketTrendResponse>(`/api/market-prices/${crop}/trend`, {
        params: { days },
      });
      return res.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
};

export const schemesApi = {
  getAll: async (params: { crop?: string; state?: string; type?: string; search?: string; page?: number } = {}): Promise<SchemesResponse> => {
    try {
      const res = await apiClient.get<SchemesResponse>('/api/schemes', { params });
      return res.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  getById: async (id: string): Promise<{ success: boolean; data: GovernmentScheme }> => {
    try {
      const res = await apiClient.get(`/api/schemes/${id}`);
      return res.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
};

export const sowingApi = {
  get: async (crop: string, location = 'Nashik'): Promise<SowingCalendarResponse> => {
    try {
      const res = await apiClient.get<SowingCalendarResponse>('/api/advisory/sowing-calendar', {
        params: { crop, location },
      });
      return res.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
};

export const changePasswordApi = async (oldPassword: string, newPassword: string): Promise<{ message: string }> => {
  try {
    const res = await apiClient.put('/api/user/change-password', { oldPassword, newPassword });
    return res.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// ─── Chatbot API Removed ────────────────────────────────────────────────────────
// ─── Disease Identifier API ───────────────────────────────────────────────────

export interface DiseaseResult {
  disease: string;
  confidence: string;
  severity: string;
  isHealthy: boolean;
  description: string;
  affectedCrop: string;
  treatments: string[];
  prevention: string[];
  organicRemedy: string | null;
}

export interface DiseaseResponse {
  success: boolean;
  data: DiseaseResult;
  model?: string;
  top_3?: { class: string; confidence: string }[];
}

export const diseaseApi = {
  identify: async (formData: FormData): Promise<DiseaseResponse> => {
    try {
      const res = await apiClient.post('/api/disease/identify', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
};
