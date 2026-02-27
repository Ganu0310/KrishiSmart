import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import {
  CloudRain,
  Thermometer,
  Droplets,
  Wind,
  AlertTriangle,
  TrendingUp,
  Leaf,
  IndianRupee,
  Calendar,
  ArrowRight,
  Sprout,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ScrollToTop from "@/components/ui/scroll-to-top";
import {
  advisoryApi,
  marketApi,
  weatherApi,
  type BackendWeatherData,
  type MarketPriceItem,
  type AdvisoryResponse,
} from "@/services/api";
import {
  WeatherAlertCard,
  SoilStatusCard,
  MarketBestSellCard,
  SmartAdvisoryCard,
} from "@/components/dashboard";


const crops = ["grapes", "onion", "tomato"] as const;
const cropEmojis: Record<string, string> = { grapes: "🍇", onion: "🧅", tomato: "🍅" };

export default function FarmerDashboard() {
  const { user } = useAuth();
  const [selectedCrop, setSelectedCrop] = useState<string>("grapes");
  const [weather, setWeather] = useState<BackendWeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  const [advisory, setAdvisory] = useState<AdvisoryResponse | null>(null);
  const [advisoryLoading, setAdvisoryLoading] = useState(false);
  const [advisoryError, setAdvisoryError] = useState<string | null>(null);

  const [prices, setPrices] = useState<MarketPriceItem[]>([]);
  const [pricesLoading, setPricesLoading] = useState(false);
  const [pricesError, setPricesError] = useState<string | null>(null);

  const toApiCrop = (crop: string) => (crop === "grapes" ? "grape" : crop);

  useEffect(() => {
    const loadWeather = async () => {
      setWeatherLoading(true);
      setWeatherError(null);
      try {
        const data = await weatherApi.get("Nashik");
        setWeather(data);
      } catch (error: any) {
        setWeatherError(error.message || "Unable to load weather");
      } finally {
        setWeatherLoading(false);
      }
    };

    loadWeather();
  }, []);

  useEffect(() => {
    const loadAdvisoryAndPrices = async () => {
      const apiCrop = toApiCrop(selectedCrop);

      setAdvisoryLoading(true);
      setAdvisoryError(null);
      setPricesLoading(true);
      setPricesError(null);

      try {
        const [advisoryRes, marketRes] = await Promise.all([
          advisoryApi.get(apiCrop),
          marketApi.get(apiCrop),
        ]);
        setAdvisory(advisoryRes);
        setPrices(marketRes.prices);
      } catch (error: any) {
        const msg = error.message || "Unable to load data";
        if (!advisory) setAdvisoryError(msg);
        if (!prices.length) setPricesError(msg);
      } finally {
        setAdvisoryLoading(false);
        setPricesLoading(false);
      }
    };

    loadAdvisoryAndPrices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCrop]);

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-bold text-gray-900">
                Namaste, {user?.name || "Farmer"} 🙏
              </h1>
              <p className="text-muted-foreground mt-1 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Nashik • {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to="/advisory">
              <Card className="hover:shadow-lg transition-all cursor-pointer border-green-200 hover:border-green-400">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-2">
                    <Leaf className="h-6 w-6 text-green-600" />
                  </div>
                  <p className="font-medium text-sm">Crop Advisory</p>
                </CardContent>
              </Card>
            </Link>

            <Link to="/prices">
              <Card className="hover:shadow-lg transition-all cursor-pointer border-orange-200 hover:border-orange-400">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center mb-2">
                    <IndianRupee className="h-6 w-6 text-orange-600" />
                  </div>
                  <p className="font-medium text-sm">Market Prices</p>
                </CardContent>
              </Card>
            </Link>

            <Link to="/fertilizers">
              <Card className="hover:shadow-lg transition-all cursor-pointer border-emerald-200 hover:border-emerald-400">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mb-2">
                    <Sprout className="h-6 w-6 text-emerald-600" />
                  </div>
                  <p className="font-medium text-sm">Fertilizers</p>
                </CardContent>
              </Card>
            </Link>

            <Link to="/irrigation">
              <Card className="hover:shadow-lg transition-all cursor-pointer border-blue-200 hover:border-blue-400">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                    <Droplets className="h-6 w-6 text-blue-600" />
                  </div>
                  <p className="font-medium text-sm">Irrigation</p>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Weather Card */}
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="text-xl">Today's Weather</span>
                <CloudRain className="h-6 w-6" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              {weatherLoading && <p>Loading weather data...</p>}
              {weatherError && (
                <div className="flex items-center gap-2 text-yellow-200">
                  <AlertTriangle className="h-5 w-5" />
                  <p>{weatherError}</p>
                </div>
              )}
              {weather && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-3">
                    <Thermometer className="h-8 w-8 opacity-80" />
                    <div>
                      <p className="text-3xl font-bold">{weather.temperature}°C</p>
                      <p className="text-sm opacity-80">Temperature</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Droplets className="h-8 w-8 opacity-80" />
                    <div>
                      <p className="text-3xl font-bold">{weather.humidity}%</p>
                      <p className="text-sm opacity-80">Humidity</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Wind className="h-8 w-8 opacity-80" />
                    <div>
                      <p className="text-3xl font-bold">{weather.windSpeed}</p>
                      <p className="text-sm opacity-80">Wind Speed</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <CloudRain className="h-8 w-8 opacity-80" />
                    <div>
                      <p className="text-2xl font-bold capitalize">{weather.weatherDescription}</p>
                      <p className="text-sm opacity-80">Condition</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Crop Selection */}
          <div>
            <h2 className="text-xl font-display font-bold mb-3">Select Your Crop</h2>
            <div className="flex gap-3">
              {crops.map((crop) => (
                <Button
                  key={crop}
                  variant={selectedCrop === crop ? "default" : "outline"}
                  onClick={() => setSelectedCrop(crop)}
                  className="gap-2 capitalize"
                >
                  <span className="text-xl">{cropEmojis[crop]}</span>
                  {crop}
                </Button>
              ))}
            </div>
          </div>

          {/* Government Data Integration - New Cards */}
          <div>
            <h2 className="text-xl font-display font-bold mb-3">Government Data Intelligence</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <WeatherAlertCard location="Nashik" />
              <SoilStatusCard location="Nashik" />
              <MarketBestSellCard crop={toApiCrop(selectedCrop)} />
              <SmartAdvisoryCard crop={toApiCrop(selectedCrop)} location="Nashik" />
            </div>
          </div>

          {/* Advisory and Market Prices Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Crop Advisory */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Leaf className="h-5 w-5 text-green-600" />
                    Crop Advisory
                  </span>
                  <Link to="/advisory">
                    <Button variant="ghost" size="sm" className="gap-1">
                      View All
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {advisoryLoading && <p className="text-muted-foreground">Loading advisory...</p>}
                {advisoryError && (
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    <p>{advisoryError}</p>
                  </div>
                )}
                {advisory && (
                  <div className="space-y-4">
                    <div>
                      <Badge className="mb-2 capitalize">{advisory.stage}</Badge>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {advisory.advice}
                      </p>
                    </div>
                    {advisory.alerts && advisory.alerts.length > 0 && (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                          <div>
                            <p className="font-medium text-orange-900 text-sm">Alerts</p>
                            <ul className="text-sm text-orange-800 mt-1 space-y-1">
                              {advisory.alerts.map((alert, idx) => (
                                <li key={idx}>• {alert}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Market Prices */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-orange-600" />
                    Market Prices
                  </span>
                  <Link to="/prices">
                    <Button variant="ghost" size="sm" className="gap-1">
                      View All
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pricesLoading && <p className="text-muted-foreground">Loading prices...</p>}
                {pricesError && (
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    <p>{pricesError}</p>
                  </div>
                )}
                {prices.length > 0 && (
                  <div className="space-y-3">
                    {prices.slice(0, 4).map((item) => (
                      <div
                        key={item._id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div>
                          <p className="font-medium">{item.market || item.mandi}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(item.date).toLocaleDateString("en-IN")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">
                            ₹{item.price}
                          </p>
                          <p className="text-xs text-muted-foreground">per quintal</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <ScrollToTop />
    </AppLayout>
  );
}
