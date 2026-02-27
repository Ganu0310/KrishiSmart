import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { marketApi, type MarketPriceItem } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Search,
  MapPin,
  Calendar,
} from "lucide-react";
import EmptyState from "@/components/ui/empty-state";
import ScrollToTop from "@/components/ui/scroll-to-top";

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

export default function MarketPricesPage() {
  const [selectedCrop, setSelectedCrop] = useState<string>("grape");
  const [prices, setPrices] = useState<MarketPriceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchPrices();
  }, [selectedCrop]);

  const fetchPrices = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await marketApi.get(selectedCrop);
      setPrices(data.prices);
    } catch (err: any) {
      setError(err.message || "Failed to load market prices");
    } finally {
      setLoading(false);
    }
  };

  const filteredPrices = prices.filter((item) =>
    (item.market || item.mandi || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate statistics
  const avgPrice = prices.length
    ? Math.round(prices.reduce((sum, p) => sum + p.price, 0) / prices.length)
    : 0;
  const maxPrice = prices.length ? Math.max(...prices.map((p) => p.price)) : 0;
  const minPrice = prices.length ? Math.min(...prices.map((p) => p.price)) : 0;

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
          {/* Header */}
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-gray-900 flex items-center gap-3">
              <IndianRupee className="h-8 w-8 text-orange-600" />
              Market Prices
            </h1>
            <p className="text-muted-foreground mt-2">
              Real-time market prices from various mandis across Maharashtra
            </p>
          </div>

          {/* Crop Selection */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Select Crop</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {crops.map((crop) => (
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

          {/* Statistics Cards */}
          {!loading && !error && prices.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Average Price</p>
                      <p className="text-3xl font-bold text-green-600">₹{avgPrice}</p>
                      <p className="text-xs text-muted-foreground mt-1">per quintal</p>
                    </div>
                    <TrendingUp className="h-12 w-12 text-green-600 opacity-20" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Highest Price</p>
                      <p className="text-3xl font-bold text-blue-600">₹{maxPrice}</p>
                      <p className="text-xs text-muted-foreground mt-1">per quintal</p>
                    </div>
                    <TrendingUp className="h-12 w-12 text-blue-600 opacity-20" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Lowest Price</p>
                      <p className="text-3xl font-bold text-orange-600">₹{minPrice}</p>
                      <p className="text-xs text-muted-foreground mt-1">per quintal</p>
                    </div>
                    <TrendingDown className="h-12 w-12 text-orange-600 opacity-20" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search by mandi name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-base"
            />
          </div>

          {/* Prices List */}
          {loading && (
            <Card>
              <CardContent className="p-12">
                <div className="flex flex-col items-center gap-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
                  <p className="text-muted-foreground">Loading market prices...</p>
                </div>
              </CardContent>
            </Card>
          )}

          {error && (
            <Card className="border-destructive">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 text-destructive">
                  <IndianRupee className="h-6 w-6" />
                  <p className="font-medium">{error}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {!loading && !error && filteredPrices.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Market Prices ({filteredPrices.length} Mandis)</span>
                  <Badge variant="outline" className="capitalize">
                    {selectedCrop}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredPrices.map((item) => (
                    <div
                      key={item._id}
                      className="p-4 border-2 rounded-lg hover:shadow-md transition-all hover:border-primary"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-2">
                          <MapPin className="h-5 w-5 text-primary mt-0.5" />
                          <div>
                            <h3 className="font-semibold text-lg">{item.market || item.mandi}</h3>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(item.date).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-600">
                            ₹{item.price}
                          </p>
                          <p className="text-xs text-muted-foreground">per quintal</p>
                        </div>
                      </div>

                      {/* Price Comparison */}
                      <div className="flex items-center gap-2 pt-3 border-t">
                        {item.price > avgPrice ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Above Average
                          </Badge>
                        ) : item.price < avgPrice ? (
                          <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">
                            <TrendingDown className="h-3 w-3 mr-1" />
                            Below Average
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Average</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {!loading && !error && filteredPrices.length === 0 && prices.length > 0 && (
            <EmptyState
              icon={Search}
              title="No Results Found"
              description={`No mandis found matching "${searchQuery}". Try a different search term.`}
            />
          )}

          {!loading && !error && prices.length === 0 && (
            <EmptyState
              icon={IndianRupee}
              title="No Prices Available"
              description="Market prices for this crop are currently unavailable. Please check back later."
            />
          )}
        </div>
      </div>
      <ScrollToTop />
    </AppLayout>
  );
}
