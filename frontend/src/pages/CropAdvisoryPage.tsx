import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { advisoryApi, type AdvisoryResponse } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Leaf, AlertTriangle, Sprout, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import EmptyState from "@/components/ui/empty-state";
import ScrollToTop from "@/components/ui/scroll-to-top";
import { toast } from "sonner";

const crops = ["grape", "onion", "tomato", "wheat", "rice", "cotton", "sugarcane"];
const cropEmojis: Record<string, string> = {
  grape: "🍇",
  onion: "🧅",
  tomato: "🍅",
  wheat: "🌾",
  rice: "🌾",
  cotton: "🌸",
  sugarcane: "🎋",
};

const growthStages = ["vegetative", "flowering", "fruiting", "harvest"];

export default function CropAdvisoryPage() {
  const [selectedCrop, setSelectedCrop] = useState<string>("grape");
  const [advisory, setAdvisory] = useState<AdvisoryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchAdvisory();
  }, [selectedCrop]);

  const fetchAdvisory = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await advisoryApi.get(selectedCrop);
      setAdvisory(data);
    } catch (err: any) {
      setError(err.message || "Failed to load advisory");
    } finally {
      setLoading(false);
    }
  };

  const filteredCrops = crops.filter((crop) =>
    crop.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
          {/* Header */}
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-gray-900 flex items-center gap-3">
              <Leaf className="h-8 w-8 text-green-600" />
              Crop Advisory
            </h1>
            <p className="text-muted-foreground mt-2">
              Get expert recommendations for your crops at every growth stage
            </p>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search crops..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-base"
            />
          </div>

          {/* Crop Selection Grid */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Select Your Crop</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {filteredCrops.map((crop) => (
                <Button
                  key={crop}
                  variant={selectedCrop === crop ? "default" : "outline"}
                  onClick={() => setSelectedCrop(crop)}
                  className="h-auto py-4 flex flex-col gap-2 capitalize"
                >
                  <span className="text-3xl">{cropEmojis[crop] || "🌱"}</span>
                  <span className="text-sm">{crop}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Advisory Content */}
          {loading && (
            <Card>
              <CardContent className="p-12">
                <div className="flex flex-col items-center gap-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
                  <p className="text-muted-foreground">Loading advisory...</p>
                </div>
              </CardContent>
            </Card>
          )}

          {error && (
            <Card className="border-destructive">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 text-destructive">
                  <AlertTriangle className="h-6 w-6" />
                  <p className="font-medium">{error}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {!loading && !error && advisory && (
            <div className="space-y-6">
              {/* Current Stage Card */}
              <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sprout className="h-6 w-6 text-green-600" />
                    Current Growth Stage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge className="text-lg py-2 px-4 capitalize bg-green-600">
                    {advisory.stage}
                  </Badge>
                </CardContent>
              </Card>

              {/* Advisory Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Expert Recommendations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="prose prose-sm max-w-none">
                    <p className="text-base leading-relaxed text-gray-700">
                      {advisory.advice}
                    </p>
                  </div>

                  {/* Alerts Section */}
                  {advisory.alerts && advisory.alerts.length > 0 && (
                    <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4 mt-6">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-6 w-6 text-orange-600 mt-1 flex-shrink-0" />
                        <div className="flex-1">
                          <h3 className="font-semibold text-orange-900 mb-2">
                            Important Alerts
                          </h3>
                          <ul className="space-y-2">
                            {advisory.alerts.map((alert, idx) => (
                              <li
                                key={idx}
                                className="text-orange-800 flex items-start gap-2"
                              >
                                <span className="text-orange-600 font-bold">•</span>
                                <span>{alert}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Growth Stages Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle>Growth Stages Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {growthStages.map((stage, idx) => (
                      <button
                        key={stage}
                        onClick={() => {
                          setSelectedCrop(selectedCrop);
                          toast.info(`Viewing ${stage} stage recommendations`);
                        }}
                        className={`p-4 rounded-lg border-2 transition-all hover:shadow-lg ${
                          advisory.stage === stage
                            ? "border-green-500 bg-green-50 shadow-md cursor-default"
                            : "border-gray-200 bg-gray-50 hover:border-green-300 cursor-pointer"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className={`h-8 w-8 rounded-full flex items-center justify-center font-bold transition-all ${
                              advisory.stage === stage
                                ? "bg-green-600 text-white"
                                : "bg-gray-300 text-gray-600 group-hover:bg-green-400"
                            }`}
                          >
                            {idx + 1}
                          </div>
                          <span
                            className={`font-medium capitalize ${
                              advisory.stage === stage
                                ? "text-green-900"
                                : "text-gray-600"
                            }`}
                          >
                            {stage}
                          </span>
                        </div>
                        {advisory.stage === stage && (
                          <Badge className="mt-2 bg-green-600">Current</Badge>
                        )}
                      </button>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-4 text-center">
                    Click on a stage to view specific recommendations (coming soon)
                  </p>
                </CardContent>
              </Card>

              {/* Additional Tips */}
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-blue-900">💡 Pro Tips</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-blue-800">
                    <li className="flex items-start gap-2">
                      <span>•</span>
                      <span>Monitor weather conditions regularly for timely interventions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span>•</span>
                      <span>Keep detailed records of fertilizer and pesticide applications</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span>•</span>
                      <span>Consult local agricultural experts for region-specific advice</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span>•</span>
                      <span>Practice crop rotation to maintain soil health</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}

          {!loading && !error && !advisory && (
            <EmptyState
              icon={Leaf}
              title="No Advisory Available"
              description="Select a crop to view expert recommendations and growth stage advice."
            />
          )}
        </div>
      </div>
      <ScrollToTop />
    </AppLayout>
  );
}
