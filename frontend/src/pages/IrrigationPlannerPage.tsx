import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { mockIrrigationResult } from "@/services/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Droplets,
  Clock,
  Gauge,
  CalendarCheck,
  Sprout,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import ScrollToTop from "@/components/ui/scroll-to-top";

export default function IrrigationPlannerPage() {
  const [crop, setCrop] = useState("grapes");
  const [area, setArea] = useState("2");
  const [soilType, setSoilType] = useState("loamy");
  const [moisture, setMoisture] = useState("40");
  const [result, setResult] = useState(mockIrrigationResult);
  const [calculated, setCalculated] = useState(false);

  const handleCalculate = () => {
    if (!area || Number(area) <= 0) {
      toast.error("Please enter a valid farm area");
      return;
    }
    if (!moisture || Number(moisture) < 0 || Number(moisture) > 100) {
      toast.error("Soil moisture must be between 0-100%");
      return;
    }

    // Mock calculation
    setResult({
      waterNeeded: Math.round(Number(area) * 1200 * (1 - Number(moisture) / 100)),
      schedule: `Every ${soilType === "sandy" ? 2 : soilType === "clay" ? 5 : 3} days, morning 6-8 AM`,
      nextIrrigation: "Tomorrow, 6:00 AM",
      efficiency: soilType === "loamy" ? 88 : soilType === "sandy" ? 72 : 80,
    });
    setCalculated(true);
    toast.success("Irrigation plan calculated successfully!");
  };

  const cropEmojis: Record<string, string> = {
    grapes: "🍇",
    onion: "🧅",
    tomato: "🍅",
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-4 md:p-8">
        <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
          {/* Header */}
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-gray-900 flex items-center gap-3">
              <Droplets className="h-8 w-8 text-blue-600" />
              Irrigation Planner
            </h1>
            <p className="text-muted-foreground mt-2">
              Calculate optimal water requirements for your crops based on soil conditions
            </p>
          </div>

          {/* Input Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sprout className="h-5 w-5 text-green-600" />
                Farm Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Crop Selection */}
              <div>
                <Label className="text-base font-semibold mb-3 block">Select Crop</Label>
                <div className="grid grid-cols-3 gap-3">
                  {(["grapes", "onion", "tomato"] as const).map((c) => (
                    <Button
                      key={c}
                      variant={crop === c ? "default" : "outline"}
                      onClick={() => setCrop(c)}
                      className="h-auto py-4 flex flex-col gap-2 capitalize"
                    >
                      <span className="text-3xl">{cropEmojis[c]}</span>
                      <span className="text-sm">{c}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Farm Area */}
              <div>
                <Label htmlFor="area" className="text-base font-semibold">
                  Farm Area (acres)
                </Label>
                <Input
                  id="area"
                  type="number"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="e.g., 2"
                  className="mt-2 h-12 text-base"
                  min="0"
                  step="0.1"
                />
              </div>

              {/* Soil Type */}
              <div>
                <Label className="text-base font-semibold mb-3 block">Soil Type</Label>
                <div className="grid grid-cols-3 gap-3">
                  {["sandy", "loamy", "clay"].map((s) => (
                    <Button
                      key={s}
                      variant={soilType === s ? "default" : "outline"}
                      onClick={() => setSoilType(s)}
                      className="capitalize"
                    >
                      {s}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Soil Moisture */}
              <div>
                <Label htmlFor="moisture" className="text-base font-semibold">
                  Current Soil Moisture (%)
                </Label>
                <Input
                  id="moisture"
                  type="number"
                  value={moisture}
                  onChange={(e) => setMoisture(e.target.value)}
                  placeholder="e.g., 40"
                  className="mt-2 h-12 text-base"
                  min={0}
                  max={100}
                />
                <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4" />
                  <span>0% = Completely dry, 100% = Fully saturated</span>
                </div>
              </div>

              {/* Calculate Button */}
              <Button onClick={handleCalculate} className="w-full h-12 text-base gap-2">
                <Droplets className="h-5 w-5" />
                Calculate Irrigation Plan
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          {calculated && (
            <div className="space-y-6 animate-slide-up">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-display font-bold">Your Irrigation Plan</h2>
                <Badge className="text-sm py-1 px-3 capitalize">{crop}</Badge>
              </div>

              {/* Water Needed Card */}
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <Droplets className="h-8 w-8" />
                    <span className="text-xl font-semibold">Water Required</span>
                  </div>
                  <p className="text-5xl font-bold mb-2">{result.waterNeeded.toLocaleString()} L</p>
                  <p className="text-blue-100">
                    For {area} acres of {crop} ({soilType} soil)
                  </p>
                </CardContent>
              </Card>

              {/* Schedule & Next Irrigation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Clock className="h-5 w-5 text-blue-600" />
                      Irrigation Schedule
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold text-gray-900">{result.schedule}</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Based on {soilType} soil water retention
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <CalendarCheck className="h-5 w-5 text-green-600" />
                      Next Irrigation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold text-gray-900">
                      {result.nextIrrigation}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Set a reminder to irrigate on time
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Efficiency Score */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gauge className="h-5 w-5 text-orange-600" />
                    Water Efficiency Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-bold text-gray-900">
                        {result.efficiency}%
                      </span>
                      <Badge
                        className={
                          result.efficiency >= 85
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : result.efficiency >= 70
                            ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                            : "bg-orange-100 text-orange-800 hover:bg-orange-100"
                        }
                      >
                        {result.efficiency >= 85
                          ? "Excellent"
                          : result.efficiency >= 70
                          ? "Good"
                          : "Fair"}
                      </Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div
                        className="h-4 rounded-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-700"
                        style={{ width: `${result.efficiency}%` }}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {soilType === "loamy"
                        ? "Loamy soil provides optimal water retention and drainage"
                        : soilType === "sandy"
                        ? "Sandy soil drains quickly, consider more frequent irrigation"
                        : "Clay soil retains water well but drains slowly"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Tips Card */}
              <Card className="bg-green-50 border-green-200">
                <CardHeader>
                  <CardTitle className="text-green-900">💡 Water Conservation Tips</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-green-800">
                    <li className="flex items-start gap-2">
                      <span>•</span>
                      <span>Use drip irrigation for maximum water efficiency</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span>•</span>
                      <span>Irrigate early morning or late evening to reduce evaporation</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span>•</span>
                      <span>Apply mulch to retain soil moisture</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span>•</span>
                      <span>Monitor weather forecasts to adjust irrigation schedule</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
      <ScrollToTop />
    </AppLayout>
  );
}
