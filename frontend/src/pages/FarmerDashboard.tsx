import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import {
  CloudRain, Thermometer, Droplets, Wind, AlertTriangle,
  TrendingUp, Leaf, IndianRupee, Calendar, ArrowRight,
  Sprout, ShieldAlert, FileText, BarChart3, MapPin,
  Scissors, Wheat, RefreshCw, Activity,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ScrollToTop from "@/components/ui/scroll-to-top";
import { advisoryApi, marketApi, weatherApi } from "@/services/api";

const crops = ["grape", "onion", "tomato"] as const;
const cropEmojis: Record<string, string> = { grape: "🍇", onion: "🧅", tomato: "🍅" };

// Shapes matching actual backend responses
interface MarketPriceItemReal {
  market: string;
  modalPrice: number;
  minPrice?: number;
  maxPrice?: number;
  date: string;
}
interface AdvisoryReal {
  stage: string;
  irrigationAdvice: string;
  fertilizerAdvice: string;
  harvestAdvice: string;
  riskAlerts: string[];
  weatherSnapshot?: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    rainfallProbability: number;
    weatherDescription: string;
    heavyRainfallPredicted: boolean;
  };
}
interface WeatherReal {
  temperature: number;
  humidity: number;
  windSpeed: number;
  weatherDescription: string;
  rainfallProbability?: number;
}

const QUICK_ACTIONS = [
  { label: "Crop Advisory",   to: "/advisory",   color: "green",  icon: Leaf,        badge: null },
  { label: "Market",          to: "/prices",     color: "orange", icon: IndianRupee, badge: null },
  { label: "Fertilizers",     to: "/fertilizers",color: "emerald",icon: Sprout,      badge: null },
  { label: "Irrigation",      to: "/irrigation", color: "blue",   icon: Droplets,    badge: null },
  { label: "7-Day Forecast",  to: "/forecast",   color: "sky",    icon: CloudRain,   badge: "NEW" },
  { label: "Pest & Disease",  to: "/pest-risk",  color: "red",    icon: ShieldAlert, badge: "NEW" },
  { label: "Market Trends",   to: "/prices",     color: "amber",  icon: BarChart3,   badge: "NEW" },
  { label: "Govt Schemes",    to: "/schemes",    color: "violet", icon: FileText,    badge: "NEW" },
];

const COLOR_MAP: Record<string, { ring: string; bg: string; icon: string }> = {
  green:   { ring: "border-green-200 hover:border-green-400",   bg: "bg-green-100",   icon: "text-green-600" },
  orange:  { ring: "border-orange-200 hover:border-orange-400", bg: "bg-orange-100",  icon: "text-orange-600" },
  emerald: { ring: "border-emerald-200 hover:border-emerald-400",bg: "bg-emerald-100",icon: "text-emerald-600" },
  blue:    { ring: "border-blue-200 hover:border-blue-400",     bg: "bg-blue-100",    icon: "text-blue-600" },
  sky:     { ring: "border-sky-200 hover:border-sky-400",       bg: "bg-sky-100",     icon: "text-sky-600" },
  red:     { ring: "border-red-200 hover:border-red-400",       bg: "bg-red-100",     icon: "text-red-600" },
  amber:   { ring: "border-amber-200 hover:border-amber-400",   bg: "bg-amber-100",   icon: "text-amber-600" },
  violet:  { ring: "border-violet-200 hover:border-violet-400", bg: "bg-violet-100",  icon: "text-violet-600" },
};

export default function FarmerDashboard() {
  const { user } = useAuth();
  const [selectedCrop, setSelectedCrop] = useState<string>("onion");

  const [weather, setWeather]               = useState<WeatherReal | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError]     = useState<string | null>(null);

  const [advisory, setAdvisory]               = useState<AdvisoryReal | null>(null);
  const [advisoryLoading, setAdvisoryLoading] = useState(false);
  const [advisoryError, setAdvisoryError]     = useState<string | null>(null);

  const [prices, setPrices]               = useState<MarketPriceItemReal[]>([]);
  const [pricesLoading, setPricesLoading] = useState(false);
  const [pricesError, setPricesError]     = useState<string | null>(null);

  // --- Fetch weather once ---
  useEffect(() => {
    const load = async () => {
      setWeatherLoading(true);
      try {
        const raw = await weatherApi.get("Nashik") as any;
        // weatherApi hits /api/gov-data/weather/current → returns BackendWeatherData shape
        setWeather({
          temperature: raw.temperature ?? raw.temp,
          humidity: raw.humidity,
          windSpeed: raw.windSpeed,
          weatherDescription: raw.weatherDescription ?? raw.description ?? "—",
          rainfallProbability: raw.rainfallProbability ?? raw.rainfall ?? 0,
        });
      } catch (e: any) {
        setWeatherError(e.message || "Unable to load weather");
      } finally {
        setWeatherLoading(false);
      }
    };
    load();
  }, []);

  // --- Fetch advisory + prices when crop changes ---
  useEffect(() => {
    const load = async () => {
      setAdvisoryLoading(true);
      setPricesLoading(true);
      setAdvisoryError(null);
      setPricesError(null);
      try {
        const [adv, mkt] = await Promise.allSettled([
          advisoryApi.get(selectedCrop),
          marketApi.get(selectedCrop),
        ]);
        if (adv.status === "fulfilled") setAdvisory(adv.value as unknown as AdvisoryReal);
        else setAdvisoryError("Failed to load advisory");
        if (mkt.status === "fulfilled") {
          const d = mkt.value as any;
          setPrices(d.prices ?? []);
        } else {
          setPricesError("Failed to load prices");
        }
      } finally {
        setAdvisoryLoading(false);
        setPricesLoading(false);
      }
    };
    load();
  }, [selectedCrop]);

  const avgPrice = prices.length
    ? Math.round(prices.reduce((s, p) => s + p.modalPrice, 0) / prices.length)
    : null;

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-7 animate-fade-in">

          {/* ── Header ── */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-bold text-gray-900">
                Namaste, {user?.name || "Farmer"} 🙏
              </h1>
              <p className="text-muted-foreground mt-1 flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4" /> Nashik •{" "}
                <Calendar className="w-4 h-4" />
                {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-white rounded-full px-3 py-1.5 border shadow-sm">
              <Activity className="h-3.5 w-3.5 text-green-500 animate-pulse" />
              Live Data
            </div>
          </div>

          {/* ── Quick Actions ── */}
          <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
            {QUICK_ACTIONS.map(({ label, to, color, icon: Icon, badge }) => {
              const c = COLOR_MAP[color];
              return (
                <Link key={to + label} to={to}>
                  <Card className={`hover:shadow-lg transition-all cursor-pointer ${c.ring} hover:-translate-y-0.5`}>
                    <CardContent className="p-3 flex flex-col items-center text-center gap-1.5">
                      <div className={`h-9 w-9 rounded-full ${c.bg} flex items-center justify-center`}>
                        <Icon className={`h-4 w-4 ${c.icon}`} />
                      </div>
                      <p className="font-medium text-xs leading-tight">{label}</p>
                      {badge && <span className={`text-[9px] font-bold ${c.icon}`}>{badge}</span>}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          {/* ── Weather Hero ── */}
          <Card className={`border-0 shadow-xl text-white bg-gradient-to-r ${
            weather?.rainfallProbability && weather.rainfallProbability > 60
              ? "from-blue-600 to-indigo-700"
              : "from-green-600 to-emerald-700"
          }`}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-white">
                <span className="flex items-center gap-2 text-lg">
                  <CloudRain className="h-5 w-5" /> Today's Weather — Nashik
                </span>
                {weatherLoading && <RefreshCw className="h-4 w-4 animate-spin opacity-70" />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {weatherError && (
                <div className="flex items-center gap-2 text-yellow-200 text-sm">
                  <AlertTriangle className="h-4 w-4" /> {weatherError}
                </div>
              )}
              {weather && (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-3">
                      <Thermometer className="h-8 w-8 opacity-70" />
                      <div>
                        <p className="text-3xl font-bold">{weather.temperature}°C</p>
                        <p className="text-sm text-white/70">Temperature</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Droplets className="h-8 w-8 opacity-70" />
                      <div>
                        <p className="text-3xl font-bold">{weather.humidity}%</p>
                        <p className="text-sm text-white/70">Humidity</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Wind className="h-8 w-8 opacity-70" />
                      <div>
                        <p className="text-3xl font-bold">{weather.windSpeed}</p>
                        <p className="text-sm text-white/70">Wind km/h</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <CloudRain className="h-8 w-8 opacity-70" />
                      <div>
                        <p className="text-2xl font-bold capitalize">{weather.weatherDescription}</p>
                        {weather.rainfallProbability != null && (
                          <p className="text-sm text-white/70">{weather.rainfallProbability}% rain</p>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* ── Crop Selector ── */}
          <div>
            <h2 className="text-base font-semibold mb-3 text-muted-foreground uppercase tracking-wide text-sm">
              Select Your Crop
            </h2>
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

          {/* ── Advisory + Market Grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Crop Advisory */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-2">
                    <Leaf className="h-5 w-5 text-green-600" /> Crop Advisory
                  </span>
                  <Link to="/advisory">
                    <Button variant="ghost" size="sm" className="gap-1 text-xs">
                      Full Advisory <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {advisoryLoading && <p className="text-muted-foreground text-sm">Loading...</p>}
                {advisoryError && (
                  <div className="flex items-center gap-2 text-destructive text-sm">
                    <AlertTriangle className="h-4 w-4" /> {advisoryError}
                  </div>
                )}
                {advisory && (
                  <div className="space-y-3">
                    <Badge className="bg-green-600 capitalize">{advisory.stage ?? "vegetative"}</Badge>

                    {/* Risk Alerts */}
                    {advisory.riskAlerts?.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-xs font-semibold text-red-800 mb-1 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> Risk Alerts
                        </p>
                        <ul className="text-xs text-red-700 space-y-0.5">
                          {advisory.riskAlerts.map((a, i) => <li key={i}>• {a}</li>)}
                        </ul>
                      </div>
                    )}

                    {/* 3 advice pills */}
                    <div className="space-y-2">
                      {advisory.irrigationAdvice && (
                        <div className="flex items-start gap-2 text-sm text-gray-700 bg-blue-50 rounded-lg p-2.5">
                          <Droplets className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                          {advisory.irrigationAdvice}
                        </div>
                      )}
                      {advisory.fertilizerAdvice && (
                        <div className="flex items-start gap-2 text-sm text-gray-700 bg-amber-50 rounded-lg p-2.5">
                          <Wheat className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                          {advisory.fertilizerAdvice}
                        </div>
                      )}
                      {advisory.harvestAdvice && (
                        <div className="flex items-start gap-2 text-sm text-gray-700 bg-green-50 rounded-lg p-2.5">
                          <Scissors className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                          {advisory.harvestAdvice}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Market Prices */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-orange-600" /> Market Prices
                  </span>
                  <Link to="/prices">
                    <Button variant="ghost" size="sm" className="gap-1 text-xs">
                      View All <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pricesLoading && <p className="text-muted-foreground text-sm">Loading prices...</p>}
                {pricesError && (
                  <div className="flex items-center gap-2 text-destructive text-sm">
                    <AlertTriangle className="h-4 w-4" /> {pricesError}
                  </div>
                )}
                {prices.length > 0 && (
                  <div className="space-y-2">
                    {/* Avg price pill */}
                    {avgPrice && (
                      <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg p-3 flex items-center justify-between mb-3">
                        <div>
                          <p className="text-xs text-orange-100">Avg Modal Price — {selectedCrop}</p>
                          <p className="text-2xl font-bold">₹{avgPrice}</p>
                        </div>
                        <IndianRupee className="h-10 w-10 opacity-30" />
                      </div>
                    )}
                    {prices.slice(0, 4).map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                          <div>
                            <p className="font-medium text-sm">{item.market}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(item.date).toLocaleDateString("en-IN")}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-base font-bold text-green-600">₹{item.modalPrice}</p>
                          {item.minPrice != null && item.maxPrice != null && (
                            <p className="text-[10px] text-muted-foreground">
                              {item.minPrice}–{item.maxPrice}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {!pricesLoading && !pricesError && prices.length === 0 && (
                  <p className="text-muted-foreground text-sm">No price data available for {selectedCrop}.</p>
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
