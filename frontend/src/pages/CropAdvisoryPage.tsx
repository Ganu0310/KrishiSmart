import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { advisoryApi } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Leaf, AlertTriangle, Droplets, Sprout,
  Wheat, Scissors, ThumbsUp, Thermometer,
  Wind, CloudRain, RefreshCw, Search
} from "lucide-react";
import { Input } from "@/components/ui/input";
import EmptyState from "@/components/ui/empty-state";
import ScrollToTop from "@/components/ui/scroll-to-top";

const crops = ["grape", "onion", "tomato"];
const cropEmojis: Record<string, string> = {
  grape: "🍇", onion: "🧅", tomato: "🍅",
};
const growthStages = ["vegetative", "flowering", "fruiting", "harvest"];

// Matches what advisoryController actually returns
interface AdvisoryData {
  location: string;
  crop: string;
  stage: string;
  irrigationAdvice: string;
  harvestAdvice: string;
  fertilizerAdvice: string;
  riskAlerts: string[];
  weatherSnapshot: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    rainfallProbability: number;
    weatherDescription: string;
    heavyRainfallPredicted: boolean;
    isMock?: boolean;
  };
}

export default function CropAdvisoryPage() {
  const [selectedCrop, setSelectedCrop] = useState("grape");
  const [selectedStage, setSelectedStage] = useState("vegetative");
  const [advisory, setAdvisory] = useState<AdvisoryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchAdvisory();
  }, [selectedCrop, selectedStage]);

  const fetchAdvisory = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await advisoryApi.get(selectedCrop, selectedStage) as unknown as AdvisoryData;
      setAdvisory(data);
    } catch (err: any) {
      setError(err.message || "Failed to load advisory");
    } finally {
      setLoading(false);
    }
  };

  const filteredCrops = crops.filter((c) =>
    c.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const w = advisory?.weatherSnapshot;

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">

          {/* Header */}
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-bold text-gray-900 flex items-center gap-3">
                <Leaf className="h-8 w-8 text-green-600" />
                Crop Advisory
              </h1>
              <p className="text-muted-foreground mt-1">
                Expert recommendations based on live weather conditions
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchAdvisory} disabled={loading} className="gap-2">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter crops..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11"
            />
          </div>

          {/* Crop Selection */}
          <div>
            <h2 className="text-base font-semibold mb-3 text-muted-foreground uppercase tracking-wide text-sm">Select Crop</h2>
            <div className="grid grid-cols-3 gap-3">
              {filteredCrops.map((crop) => (
                <button
                  key={crop}
                  onClick={() => setSelectedCrop(crop)}
                  className={`py-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all font-medium capitalize
                    ${selectedCrop === crop
                      ? "border-green-500 bg-green-50 text-green-700 shadow-sm"
                      : "border-border hover:border-green-300 hover:bg-muted"
                    }`}
                >
                  <span className="text-3xl">{cropEmojis[crop] || "🌱"}</span>
                  <span className="text-sm">{crop}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Growth Stage */}
          <div>
            <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Growth Stage</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {growthStages.map((stage, idx) => (
                <button
                  key={stage}
                  onClick={() => setSelectedStage(stage)}
                  className={`p-3 rounded-xl border-2 transition-all text-sm font-medium capitalize flex items-center gap-2
                    ${selectedStage === stage
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-border hover:border-green-300 hover:bg-muted text-muted-foreground"
                    }`}
                >
                  <span className="text-lg font-bold opacity-60">{idx + 1}.</span>
                  {stage}
                  {selectedStage === stage && <Badge className="ml-auto bg-green-600 text-xs">Active</Badge>}
                </button>
              ))}
            </div>
          </div>

          {loading && (
            <Card>
              <CardContent className="p-12 flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
                <p className="text-muted-foreground">Loading advisory...</p>
              </CardContent>
            </Card>
          )}

          {error && (
            <Card className="border-destructive">
              <CardContent className="p-6 flex items-center gap-3 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                <p>{error}</p>
                <Button variant="outline" size="sm" onClick={fetchAdvisory} className="ml-auto">Retry</Button>
              </CardContent>
            </Card>
          )}

          {!loading && !error && advisory && (
            <div className="space-y-5">

              {/* Weather Snapshot */}
              {w && (
                <Card className={`border-0 shadow-md bg-gradient-to-r ${
                  w.heavyRainfallPredicted ? "from-blue-600 to-indigo-700"
                  : w.rainfallProbability > 50 ? "from-sky-500 to-blue-600"
                  : "from-green-500 to-emerald-600"
                } text-white`}>
                  <CardContent className="p-5">
                    <p className="text-white/70 text-xs font-medium uppercase tracking-wide mb-2">
                      Current Weather — {advisory.location}
                      {w.isMock && <span className="ml-2 opacity-60">(estimated)</span>}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex items-center gap-2">
                        <Thermometer className="h-5 w-5 text-white/70" />
                        <div>
                          <p className="text-white/70 text-xs">Temperature</p>
                          <p className="font-bold">{w.temperature}°C</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Droplets className="h-5 w-5 text-white/70" />
                        <div>
                          <p className="text-white/70 text-xs">Humidity</p>
                          <p className="font-bold">{w.humidity}%</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <CloudRain className="h-5 w-5 text-white/70" />
                        <div>
                          <p className="text-white/70 text-xs">Rain Probability</p>
                          <p className="font-bold">{w.rainfallProbability}%</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Wind className="h-5 w-5 text-white/70" />
                        <div>
                          <p className="text-white/70 text-xs">Wind Speed</p>
                          <p className="font-bold">{w.windSpeed} km/h</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-white/80 text-sm mt-3 capitalize">
                      {w.weatherDescription}
                      {w.heavyRainfallPredicted && " • ⚠️ Heavy rainfall predicted"}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Risk Alerts */}
              {advisory.riskAlerts?.length > 0 && (
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-semibold text-red-800 mb-2">⚠️ Risk Alerts</p>
                        <ul className="space-y-1">
                          {advisory.riskAlerts.map((alert, idx) => (
                            <li key={idx} className="text-sm text-red-700 flex items-start gap-2">
                              <span className="font-bold">•</span> {alert}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 3 Advice Cards */}
              <div className="grid md:grid-cols-3 gap-4">
                {/* Irrigation */}
                <Card className="border-blue-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2 text-blue-700">
                      <Droplets className="h-5 w-5" /> Irrigation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700 leading-relaxed">{advisory.irrigationAdvice}</p>
                  </CardContent>
                </Card>

                {/* Fertilizer */}
                <Card className="border-amber-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2 text-amber-700">
                      <Wheat className="h-5 w-5" /> Fertilizer
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700 leading-relaxed">{advisory.fertilizerAdvice}</p>
                  </CardContent>
                </Card>

                {/* Harvest */}
                <Card className="border-green-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2 text-green-700">
                      <Scissors className="h-5 w-5" /> Harvest Timing
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700 leading-relaxed">{advisory.harvestAdvice}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Pro Tips */}
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-blue-900 text-base flex items-center gap-2">
                    <ThumbsUp className="h-5 w-5" /> General Best Practices
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-blue-800">
                    {[
                      "Monitor weather conditions regularly for timely interventions",
                      "Keep detailed records of fertilizer and pesticide applications",
                      "Consult local agricultural extension officer for region-specific advice",
                      "Practice crop rotation to maintain soil health and reduce pests",
                    ].map((tip, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-blue-500 font-bold">•</span> {tip}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}

          {!loading && !error && !advisory && (
            <EmptyState
              icon={Leaf}
              title="No Advisory Available"
              description="Select a crop and growth stage to view expert recommendations."
            />
          )}
        </div>
      </div>
      <ScrollToTop />
    </AppLayout>
  );
}
