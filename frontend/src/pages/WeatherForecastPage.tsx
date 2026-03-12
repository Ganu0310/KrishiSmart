import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import {
  Cloud, Sun, CloudRain, CloudSnow, Zap, Wind, Droplets,
  Thermometer, Eye, AlertTriangle, CheckCircle, MapPin, RefreshCw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { forecastApi, sowingApi, type WeatherForecastDay, type SowingCalendarResponse } from "@/services/api";

const CROPS = ["grape", "onion", "tomato", "wheat", "rice"] as const;
const cropEmojis: Record<string, string> = { grape: "🍇", onion: "🧅", tomato: "🍅", wheat: "🌾", rice: "🌾" };

function getWeatherIcon(code: number, size = "h-8 w-8") {
  if (code === 0 || code === 1) return <Sun className={`${size} text-yellow-400`} />;
  if (code <= 3) return <Cloud className={`${size} text-gray-400`} />;
  if (code <= 67) return <CloudRain className={`${size} text-blue-400`} />;
  if (code <= 77) return <CloudSnow className={`${size} text-blue-200`} />;
  return <Zap className={`${size} text-purple-400`} />;
}

function getRiskColor(prob: number) {
  if (prob >= 70) return "bg-red-100 text-red-700 border-red-200";
  if (prob >= 40) return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-green-100 text-green-700 border-green-200";
}

function getSowingBadge(score: number) {
  if (score >= 80) return { label: "Excellent", cls: "bg-emerald-500 text-white" };
  if (score >= 60) return { label: "Good", cls: "bg-green-400 text-white" };
  if (score >= 40) return { label: "Fair", cls: "bg-amber-400 text-white" };
  return { label: "Poor", cls: "bg-red-400 text-white" };
}

export default function WeatherForecastPage() {
  const [forecast, setForecast] = useState<WeatherForecastDay[]>([]);
  const [location] = useState("Nashik");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCrop, setSelectedCrop] = useState<string>("onion");
  const [sowing, setSowing] = useState<SowingCalendarResponse | null>(null);
  const [sowingLoading, setSowingLoading] = useState(false);
  const [fetchedAt, setFetchedAt] = useState<string>("");

  const loadForecast = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await forecastApi.get(location);
      setForecast(data.days);
      setFetchedAt(new Date(data.fetchedAt).toLocaleTimeString("en-IN"));
    } catch (e: any) {
      setError(e.message || "Failed to load forecast");
    } finally {
      setLoading(false);
    }
  };

  const loadSowing = async () => {
    setSowingLoading(true);
    try {
      const data = await sowingApi.get(selectedCrop, location);
      setSowing(data);
    } catch {
      setSowing(null);
    } finally {
      setSowingLoading(false);
    }
  };

  useEffect(() => { loadForecast(); }, []);
  useEffect(() => { if (forecast.length) loadSowing(); }, [selectedCrop, forecast.length]);

  const today = forecast[0];

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">

          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 flex items-center gap-3">
                <CloudRain className="h-9 w-9 text-blue-500" />
                7-Day Weather Forecast
              </h1>
              <p className="text-muted-foreground mt-1 flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4" /> {location} • Live from Open-Meteo
                {fetchedAt && <span className="text-xs text-gray-400">• Updated {fetchedAt}</span>}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={loadForecast} disabled={loading} className="gap-2">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* Today's Hero Card */}
          {today && (
            <Card className="bg-gradient-to-br from-blue-600 via-blue-500 to-sky-400 text-white border-0 shadow-2xl overflow-hidden">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-center justify-between flex-wrap gap-6">
                  <div>
                    <p className="text-blue-100 text-sm font-medium uppercase tracking-wider mb-1">Today</p>
                    <p className="text-6xl font-bold">{today.tempMax}°C</p>
                    <p className="text-blue-100 mt-1 capitalize text-lg">{today.description}</p>
                    <p className="text-blue-200 text-sm">Low: {today.tempMin}°C • Avg: {today.avgTemp}°C</p>
                  </div>
                  <div className="opacity-90">{getWeatherIcon(today.weatherCode, "h-24 w-24")}</div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/20">
                  <div className="flex items-center gap-2">
                    <Droplets className="h-5 w-5 text-blue-200" />
                    <div>
                      <p className="text-blue-100 text-xs">Rain Probability</p>
                      <p className="font-bold">{today.rainProbability}%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CloudRain className="h-5 w-5 text-blue-200" />
                    <div>
                      <p className="text-blue-100 text-xs">Rainfall</p>
                      <p className="font-bold">{today.rainfall} mm</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Wind className="h-5 w-5 text-blue-200" />
                    <div>
                      <p className="text-blue-100 text-xs">Wind Speed</p>
                      <p className="font-bold">{today.windSpeed} km/h</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-blue-200" />
                    <div>
                      <p className="text-blue-100 text-xs">UV Index</p>
                      <p className="font-bold">{today.uvIndex}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 7-Day Forecast Cards */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="h-40 bg-gray-100 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {forecast.map((day, i) => {
                const date = new Date(day.date);
                const dayLabel = i === 0 ? "Today" : date.toLocaleDateString("en-IN", { weekday: "short" });
                const dateLabel = date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
                return (
                  <Card key={day.date} className={`text-center hover:shadow-md transition-shadow ${i === 0 ? "border-blue-400 bg-blue-50" : ""}`}>
                    <CardContent className="p-3 space-y-2">
                      <p className="font-semibold text-sm text-gray-700">{dayLabel}</p>
                      <p className="text-xs text-muted-foreground">{dateLabel}</p>
                      <div className="flex justify-center py-1">{getWeatherIcon(day.weatherCode, "h-7 w-7")}</div>
                      <p className="font-bold text-gray-900">{day.tempMax}°</p>
                      <p className="text-xs text-gray-400">{day.tempMin}°</p>
                      <div className={`text-xs px-2 py-0.5 rounded-full border ${getRiskColor(day.rainProbability)}`}>
                        {day.rainProbability}% rain
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Sowing Calendar Section */}
          <Card className="border-emerald-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-700">
                🌱 Smart Sowing Calendar
              </CardTitle>
              <p className="text-muted-foreground text-sm">
                Select your crop to see which of the next 7 days are best for sowing.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Crop Selector */}
              <div className="flex flex-wrap gap-2">
                {CROPS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedCrop(c)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                      selectedCrop === c
                        ? "bg-emerald-500 text-white border-emerald-500 shadow-md"
                        : "bg-white text-gray-700 border-gray-200 hover:border-emerald-300"
                    }`}
                  >
                    {cropEmojis[c]} {c.charAt(0).toUpperCase() + c.slice(1)}
                  </button>
                ))}
              </div>

              {sowingLoading && <p className="text-muted-foreground text-sm">Calculating sowing window...</p>}

              {sowing && !sowingLoading && (
                <>
                  {/* Recommendation Banner */}
                  <div className={`p-4 rounded-xl border text-sm font-medium ${
                    sowing.recommendation.startsWith("✅") ? "bg-emerald-50 border-emerald-200 text-emerald-800" :
                    sowing.recommendation.startsWith("⚠️") ? "bg-amber-50 border-amber-200 text-amber-800" :
                    "bg-red-50 border-red-200 text-red-800"
                  }`}>
                    {sowing.recommendation}
                  </div>

                  {/* Day-by-day Sowing Scores */}
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                    {sowing.forecastDays.map((day) => {
                      const badge = getSowingBadge(day.sowingScore);
                      return (
                        <div key={day.date} className="text-center p-2 rounded-lg border bg-white">
                          <p className="text-xs text-gray-500">
                            {new Date(day.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric" })}
                          </p>
                          <p className="text-lg font-bold text-gray-800 my-1">{day.sowingScore}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.cls}`}>
                            {badge.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Crop Info */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                    <div className="p-3 bg-gray-50 rounded-lg text-center">
                      <p className="text-xs text-muted-foreground">Optimal Temp</p>
                      <p className="font-semibold text-sm">{sowing.cropInfo.optimalTempRange}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg text-center">
                      <p className="text-xs text-muted-foreground">Max Rainfall/day</p>
                      <p className="font-semibold text-sm">{sowing.cropInfo.maxTolerableRainfall}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg text-center col-span-2">
                      <p className="text-xs text-muted-foreground">Growth Duration</p>
                      <p className="font-semibold text-sm">{sowing.cropInfo.growthDuration}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground italic">{sowing.cropInfo.seasonalHint}</p>
                </>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </AppLayout>
  );
}
