import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fertilizerApi, type Fertilizer } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Leaf,
  Droplets,
  AlertTriangle,
  TrendingUp,
  Package,
} from "lucide-react";
import { toast } from "sonner";
import { BASE_URL } from "@/services/api";
import AppLayout from "@/components/AppLayout";

export default function FertilizerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [fertilizer, setFertilizer] = useState<Fertilizer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchFertilizer();
    }
  }, [id]);

  const fetchFertilizer = async () => {
    try {
      setLoading(true);
      const data = await fertilizerApi.getById(id!);
      setFertilizer(data);
    } catch (error: any) {
      toast.error(error.message || "Failed to load fertilizer details");
      navigate("/fertilizers");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 p-4 md:p-8">
          <div className="max-w-5xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-96 bg-gray-200 rounded-lg" />
              <div className="h-12 bg-gray-200 rounded w-2/3" />
              <div className="h-32 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!fertilizer) {
    return null;
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate("/fertilizers")}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Catalog
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
            {/* Image Section */}
            <Card className="overflow-hidden">
              <div className="relative h-96 bg-gradient-to-br from-green-100 to-emerald-100">
                <img
                  src={`${BASE_URL}/uploads/fertilizers/${fertilizer.image}`}
                  alt={fertilizer.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://via.placeholder.com/600x400?text=Fertilizer";
                  }}
                />
                {fertilizer.organic && (
                  <Badge className="absolute top-4 right-4 bg-green-600 text-lg py-2 px-4">
                    <Leaf className="w-5 h-5 mr-2" />
                    Organic
                  </Badge>
                )}
              </div>
            </Card>

            {/* Info Section */}
            <div className="space-y-6">
              <div>
                <h1 className="text-4xl font-display font-bold text-gray-900 mb-2">
                  {fertilizer.name}
                </h1>
                {fertilizer.brand && (
                  <p className="text-xl text-muted-foreground">{fertilizer.brand}</p>
                )}
                <div className="flex items-baseline gap-2 mt-4">
                  <span className="text-4xl font-bold text-green-600">
                    ₹{fertilizer.pricePerKg}
                  </span>
                  <span className="text-lg text-muted-foreground">/kg</span>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    Nutrient Composition
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Nitrogen (N)</span>
                      <span className="text-green-600 font-bold">
                        {fertilizer.nutrients.nitrogen}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all"
                        style={{ width: `${fertilizer.nutrients.nitrogen}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Phosphorus (P)</span>
                      <span className="text-blue-600 font-bold">
                        {fertilizer.nutrients.phosphorus}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${fertilizer.nutrients.phosphorus}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Potassium (K)</span>
                      <span className="text-purple-600 font-bold">
                        {fertilizer.nutrients.potassium}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full transition-all"
                        style={{ width: `${fertilizer.nutrients.potassium}%` }}
                      />
                    </div>
                  </div>

                  {fertilizer.nutrients.micronutrients &&
                    fertilizer.nutrients.micronutrients.length > 0 && (
                      <div className="pt-2 border-t">
                        <span className="font-medium text-sm">Micronutrients:</span>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {fertilizer.nutrients.micronutrients.map((micro, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {micro}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Description */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {fertilizer.description}
              </p>
            </CardContent>
          </Card>

          {/* Suitable Crops */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Leaf className="w-5 h-5 text-green-600" />
                Suitable Crops
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {fertilizer.suitableCrops.map((crop) => (
                  <Badge
                    key={crop}
                    variant="outline"
                    className="text-sm capitalize py-2 px-4"
                  >
                    {crop}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Application Method */}
          {fertilizer.applicationMethod && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Droplets className="w-5 h-5 text-blue-600" />
                  Application Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary" className="text-base py-2 px-4 capitalize">
                  {fertilizer.applicationMethod}
                </Badge>
              </CardContent>
            </Card>
          )}

          {/* Dosage Guide */}
          {fertilizer.dosageGuide && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-orange-600" />
                  Dosage Guide
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array.isArray(fertilizer.dosageGuide) 
                    ? fertilizer.dosageGuide.map((item: any, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                        >
                          <span className="font-medium capitalize">{item.crop}</span>
                          <span className="text-muted-foreground">{item.dosage}</span>
                        </div>
                      ))
                    : Object.entries(fertilizer.dosageGuide).map(([crop, dosage]) => (
                        <div
                          key={crop}
                          className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                        >
                          <span className="font-medium capitalize">{crop}</span>
                          <span className="text-muted-foreground">{String(dosage)}</span>
                        </div>
                      ))
                  }
                </div>
              </CardContent>
            </Card>
          )}

          {/* Precautions */}
          {fertilizer.precautions && (
            <Card className="mt-8 border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-900">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  Precautions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-orange-900 leading-relaxed">
                  {fertilizer.precautions}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
