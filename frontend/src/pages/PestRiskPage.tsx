import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import {
  ShieldAlert, Bug, Leaf, AlertTriangle, CheckCircle2,
  Thermometer, Droplets, CloudRain, Wind, RefreshCw, MapPin
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { pestRiskApi, type PestRiskResponse, type PestRisk } from "@/services/api";

const CROPS = ["grape", "onion", "tomato"] as const;
const cropEmojis: Record<string, string> = { grape: "🍇", onion: "🧅", tomato: "🍅" };

const RISK_CONFIG = {
  low:      { label: "Low Risk",      bg: "bg-green-50",   border: "border-green-200",  badge: "bg-green-100 text-green-700",    icon: CheckCircle2,   iconColor: "text-green-500" },
  medium:   { label: "Medium Risk",   bg: "bg-amber-50",   border: "border-amber-200",  badge: "bg-amber-100 text-amber-700",    icon: AlertTriangle,  iconColor: "text-amber-500" },
  high:     { label: "High Risk",     bg: "bg-orange-50",  border: "border-orange-200", badge: "bg-orange-100 text-orange-700",  icon: ShieldAlert,    iconColor: "text-orange-500" },
  critical: { label: "Critical Risk", bg: "bg-red-50",     border: "border-red-200",    badge: "bg-red-100 text-red-700",        icon: ShieldAlert,    iconColor: "text-red-600" },
};

const OVERALL_HERO = {
  low:      { gradient: "from-green-500 to-emerald-600",    emoji: "✅", heading: "All Clear" },
  medium:   { gradient: "from-amber-500 to-orange-500",     emoji: "⚠️", heading: "Caution Advised" },
  high:     { gradient: "from-orange-500 to-red-500",       emoji: "🚨", heading: "Action Required" },
  critical: { gradient: "from-red-600 to-rose-700",         emoji: "🆘", heading: "Critical Alert" },
};

function RiskCard({ risk }: { risk: PestRisk }) {
  const config = RISK_CONFIG[risk.level];
  const Icon = config.icon;
  return (
    <div className={`p-4 rounded-xl border ${config.bg} ${config.border} space-y-2`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {risk.type === "disease" ? (
            <Leaf className={`h-4 w-4 flex-shrink-0 ${config.iconColor}`} />
          ) : (
            <Bug className={`h-4 w-4 flex-shrink-0 ${config.iconColor}`} />
          )}
          <span className="font-semibold text-gray-900">{risk.pest}</span>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.badge}`}>
            {config.label}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize">
            {risk.type}
          </span>
        </div>
      </div>
      <p className="text-sm text-gray-700 leading-relaxed">{risk.advice}</p>
    </div>
  );
}

export default function PestRiskPage() {
  const [selectedCrop, setSelectedCrop] = useState<string>("grape");
  const [assessment, setAssessment] = useState<PestRiskResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const location = "Nashik";

  const loadAssessment = async (crop: string) => {
    setLoading(true);
    setError(null);
    setAssessment(null);
    try {
      const data = await pestRiskApi.get(crop, location);
      setAssessment(data);
    } catch (e: any) {
      setError(e.message || "Failed to assess pest risk");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAssessment(selectedCrop); }, [selectedCrop]);

  const hero = assessment ? OVERALL_HERO[assessment.overallRiskLevel] : null;

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">

          {/* Header */}
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 flex items-center gap-3">
              <ShieldAlert className="h-9 w-9 text-orange-500" />
              Pest & Disease Risk
            </h1>
            <p className="text-muted-foreground mt-1 flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4" /> {location} • Real-time weather analysis
            </p>
          </div>

          {/* Crop Selector */}
          <div className="flex flex-wrap gap-3">
            {CROPS.map((crop) => (
              <button
                key={crop}
                onClick={() => setSelectedCrop(crop)}
                className={`px-5 py-2.5 rounded-full font-medium border transition-all shadow-sm ${
                  selectedCrop === crop
                    ? "bg-orange-500 text-white border-orange-500 shadow-orange-200 shadow-md"
                    : "bg-white text-gray-700 border-gray-200 hover:border-orange-300"
                }`}
              >
                {cropEmojis[crop]} {crop.charAt(0).toUpperCase() + crop.slice(1)}
              </button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadAssessment(selectedCrop)}
              disabled={loading}
              className="gap-2 ml-auto"
            >
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

          {/* Loading */}
          {loading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-xl" />
              ))}
            </div>
          )}

          {/* Assessment Results */}
          {assessment && !loading && hero && (
            <>
              {/* Overall Risk Hero */}
              <Card className={`bg-gradient-to-br ${hero.gradient} text-white border-0 shadow-xl`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <p className="text-white/80 text-sm uppercase tracking-wide mb-1">
                        {cropEmojis[selectedCrop]} {selectedCrop.charAt(0).toUpperCase() + selectedCrop.slice(1)} Risk Assessment
                      </p>
                      <h2 className="text-3xl font-bold">
                        {hero.emoji} {hero.heading}
                      </h2>
                      <p className="text-white/90 mt-2 max-w-lg text-sm leading-relaxed">
                        {assessment.riskSummary}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-4xl font-bold">{assessment.risks.length}</p>
                      <p className="text-white/80 text-sm">Risk{assessment.risks.length !== 1 ? "s" : ""} Detected</p>
                    </div>
                  </div>

                  {/* Current Weather Snapshot */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5 pt-5 border-t border-white/20">
                    <div className="flex items-center gap-2">
                      <Thermometer className="h-4 w-4 text-white/70" />
                      <div>
                        <p className="text-white/70 text-xs">Temperature</p>
                        <p className="font-bold text-sm">{assessment.weatherSnapshot.temperature}°C</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Droplets className="h-4 w-4 text-white/70" />
                      <div>
                        <p className="text-white/70 text-xs">Humidity</p>
                        <p className="font-bold text-sm">{assessment.weatherSnapshot.humidity}%</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CloudRain className="h-4 w-4 text-white/70" />
                      <div>
                        <p className="text-white/70 text-xs">Rainfall</p>
                        <p className="font-bold text-sm">{assessment.weatherSnapshot.rainfall} mm</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Wind className="h-4 w-4 text-white/70" />
                      <div>
                        <p className="text-white/70 text-xs">Wind Speed</p>
                        <p className="font-bold text-sm">{assessment.weatherSnapshot.windSpeed} km/h</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* No Risks */}
              {assessment.risks.length === 0 && (
                <div className="flex items-center gap-4 p-6 bg-green-50 border border-green-200 rounded-xl">
                  <CheckCircle2 className="h-10 w-10 text-green-500 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-green-800 text-lg">No Risks Detected</p>
                    <p className="text-green-700 text-sm mt-1">
                      Current weather conditions are not conducive to significant pest or disease development. Continue regular monitoring.
                    </p>
                  </div>
                </div>
              )}

              {/* Risk Cards */}
              {assessment.risks.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-orange-500" />
                    Detected Threats ({assessment.risks.length})
                  </h3>
                  {assessment.risks.map((risk, i) => (
                    <RiskCard key={i} risk={risk} />
                  ))}
                </div>
              )}

              {assessment.staleWeatherData && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Weather data may be more than 2 hours old. Risk assessment accuracy may be lower.
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Assessed at {new Date(assessment.assessedAt).toLocaleString("en-IN")}
              </p>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
