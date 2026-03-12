import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fertilizerApi, type Fertilizer } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Leaf, Search, Sparkles, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { BASE_URL } from "@/services/api";
import AppLayout from "@/components/AppLayout";

export default function FertilizersPage() {
  const [fertilizers, setFertilizers] = useState<Fertilizer[]>([]);
  const [filteredFertilizers, setFilteredFertilizers] = useState<Fertilizer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCrop, setSelectedCrop] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchFertilizers();
  }, []);

  useEffect(() => {
    filterFertilizers();
  }, [searchTerm, selectedCrop, fertilizers]);

  const fetchFertilizers = async () => {
    try {
      setLoading(true);
      const data = await fertilizerApi.getAll();
      setFertilizers(data.fertilizers);
    } catch (error: any) {
      toast.error(error.message || "Failed to load fertilizers");
    } finally {
      setLoading(false);
    }
  };

  const filterFertilizers = () => {
    let filtered = fertilizers;

    if (searchTerm) {
      filtered = filtered.filter((f) =>
        f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.brand?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCrop) {
      filtered = filtered.filter((f) =>
        f.suitableCrops.includes(selectedCrop) || f.suitableCrops.includes("all")
      );
    }

    setFilteredFertilizers(filtered);
  };

  const crops = ["grape", "onion", "tomato", "wheat", "rice", "cotton", "sugarcane"];

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 p-4 md:p-8">
        {/* Header */}
        <div className="max-w-7xl mx-auto mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
              <Leaf className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-display font-bold text-gray-900">
                Fertilizer Catalog
              </h1>
              <p className="text-muted-foreground mt-1">
                Find the perfect fertilizer for your crops
              </p>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 mt-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                placeholder="Search fertilizers by name or brand..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={selectedCrop === "" ? "default" : "outline"}
                onClick={() => setSelectedCrop("")}
                size="sm"
              >
                All Crops
              </Button>
              {crops.map((crop) => (
                <Button
                  key={crop}
                  variant={selectedCrop === crop ? "default" : "outline"}
                  onClick={() => setSelectedCrop(crop)}
                  size="sm"
                  className="capitalize"
                >
                  {crop}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Fertilizer Grid */}
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-48 bg-gray-200 rounded-t-lg" />
                  <CardContent className="p-4">
                    <div className="h-6 bg-gray-200 rounded mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredFertilizers.length === 0 ? (
            <Card className="p-12 text-center">
              <Sparkles className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No fertilizers found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filter criteria
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
              {filteredFertilizers.map((fertilizer) => (
                <Card
                  key={fertilizer._id}
                  className="group hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border-2 hover:border-green-500"
                  onClick={() => navigate(`/fertilizers/${fertilizer._id}`)}
                >
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden bg-gradient-to-br from-green-100 to-emerald-100">
                    <img
                      src={`${BASE_URL}/uploads/fertilizers/${fertilizer.image}`}
                      alt={fertilizer.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                    {fertilizer.organic && (
                      <Badge className="absolute top-3 right-3 bg-green-600">
                        <Leaf className="w-3 h-3 mr-1" />
                        Organic
                      </Badge>
                    )}
                  </div>

                  <CardHeader>
                    <CardTitle className="text-xl group-hover:text-green-600 transition-colors">
                      {fertilizer.name}
                    </CardTitle>
                    {fertilizer.brand && (
                      <p className="text-sm text-muted-foreground">{fertilizer.brand}</p>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* NPK Summary */}
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-semibold">
                        NPK: {fertilizer.nutrients.nitrogen}-
                        {fertilizer.nutrients.phosphorus}-
                        {fertilizer.nutrients.potassium}
                      </span>
                    </div>

                    {/* Price */}
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-green-600">
                        ₹{fertilizer.pricePerKg}
                        <span className="text-sm text-muted-foreground">/kg</span>
                      </span>
                      <Button size="sm" className="group-hover:bg-green-600">
                        View Details
                      </Button>
                    </div>

                    {/* Suitable Crops */}
                    <div className="flex flex-wrap gap-1">
                      {fertilizer.suitableCrops.slice(0, 3).map((crop) => (
                        <Badge key={crop} variant="outline" className="text-xs capitalize">
                          {crop}
                        </Badge>
                      ))}
                      {fertilizer.suitableCrops.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{fertilizer.suitableCrops.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
