import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { marketApi } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  MapPin,
  Calendar,
  BarChart3,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import EmptyState from "@/components/ui/empty-state";
import ScrollToTop from "@/components/ui/scroll-to-top";

const crops = ["onion", "tomato", "grape", "wheat", "rice"];
const cropEmojis: Record<string, string> = {
  grape: "🍇",
  onion: "🧅",
  tomato: "🍅",
  wheat: "🌾",
  rice: "🍚",
};

type Tab = "prices" | "trends";
type TrendPeriod = "7" | "14" | "30";

// Backend market price shape from marketService.js
interface MarketPriceItem {
  market: string;
  minPrice?: number;
  maxPrice?: number;
  modalPrice: number;
  date: string;
  source?: string;
}

// Backend trend shape from marketTrendController.js
interface TrendResponse {
  trend: "rising" | "falling" | "stable";
  changePercent: number;          // ← backend uses this name
  currentPrice: number;
  priceRange: { min: number; max: number };
  bestMandi: { market: string; avgModalPrice: number } | null;
  allMarkets: Array<{ market: string; avgModalPrice: number; dataPoints: number }>;
  sellingAdvice: string;          // ← backend uses this name
  chartData: Array<{ date: string; modalPrice: number; market: string }>;
  dataPoints: number;
}

export default function MarketPage() {
  const [activeTab, setActiveTab] = useState<Tab>("prices");
  const [selectedCrop, setSelectedCrop] = useState("onion");
  const [searchQuery, setSearchQuery] = useState("");

  // Prices state
  const [prices, setPrices] = useState<MarketPriceItem[]>([]);
  const [pricesLoading, setPricesLoading] = useState(false);
  const [pricesError, setPricesError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Trend state
  const [trend, setTrend] = useState<TrendResponse | null>(null);
  const [trendLoading, setTrendLoading] = useState(false);
  const [trendError, setTrendError] = useState<string | null>(null);
  const [trendPeriod, setTrendPeriod] = useState<TrendPeriod>("30");

  useEffect(() => {
    fetchPrices();
  }, [selectedCrop]);

  useEffect(() => {
    if (activeTab === "trends") fetchTrend();
  }, [selectedCrop, trendPeriod, activeTab]);

  const fetchPrices = async () => {
    setPricesLoading(true);
    setPricesError(null);
    try {
      const data = await marketApi.get(selectedCrop);
      // backend spreads result.data → { prices, bestMandi, lastUpdated }
      const rawPrices = (data as any).prices ?? [];
      setPrices(rawPrices);
      setLastUpdated((data as any).lastUpdated ?? null);
    } catch (err: any) {
      setPricesError(err?.message || "Failed to load market prices");
    } finally {
      setPricesLoading(false);
    }
  };

  const fetchTrend = async () => {
    setTrendLoading(true);
    setTrendError(null);
    try {
      const data = await marketApi.getTrend(selectedCrop, parseInt(trendPeriod));
      setTrend(data as TrendResponse);
    } catch (err: any) {
      setTrendError(err?.message || "Failed to load trend data");
    } finally {
      setTrendLoading(false);
    }
  };

  const switchTab = (tab: Tab) => {
    setActiveTab(tab);
    if (tab === "trends" && !trend) fetchTrend();
  };

  const filteredPrices = prices.filter((item) =>
    (item.market || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const avgPrice = prices.length
    ? Math.round(prices.reduce((s, p) => s + p.modalPrice, 0) / prices.length)
    : 0;
  const maxModal = prices.length ? Math.max(...prices.map((p) => p.modalPrice)) : 0;
  const minModal = prices.length ? Math.min(...prices.map((p) => p.modalPrice)) : 0;

  const pct = trend?.changePercent ?? 0;
  const trendDir = trend?.trend ?? "stable";
  const trendColor =
    trendDir === "rising"
      ? "from-green-600 to-emerald-700"
      : trendDir === "falling"
      ? "from-red-500 to-rose-600"
      : "from-yellow-500 to-amber-600";

  const TrendIcon =
    trendDir === "rising"
      ? TrendingUp
      : trendDir === "falling"
      ? TrendingDown
      : Minus;

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">

          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-bold text-gray-900 flex items-center gap-3">
                <IndianRupee className="h-8 w-8 text-orange-600" />
                Market Intelligence
              </h1>
              <p className="text-muted-foreground mt-1">
                Live mandi prices &amp; historical price trend analysis
              </p>
            </div>
            {lastUpdated && (
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <RefreshCw className="h-3 w-3" />
                Updated {new Date(lastUpdated).toLocaleTimeString("en-IN")}
              </p>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-2 bg-muted p-1 rounded-lg w-fit">
            <button
              onClick={() => switchTab("prices")}
              className={`px-5 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === "prices"
                  ? "bg-white shadow text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="flex items-center gap-2">
                <IndianRupee className="h-4 w-4" /> Live Prices
              </span>
            </button>
            <button
              onClick={() => switchTab("trends")}
              className={`px-5 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === "trends"
                  ? "bg-white shadow text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" /> Price Trends
              </span>
            </button>
          </div>

          {/* Crop Selector */}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {crops.map((crop) => (
              <button
                key={crop}
                onClick={() => setSelectedCrop(crop)}
                className={`py-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all font-medium capitalize text-sm
                  ${selectedCrop === crop
                    ? "border-primary bg-primary/5 text-primary shadow-sm"
                    : "border-border hover:border-primary/40 hover:bg-muted"
                  }`}
              >
                <span className="text-2xl">{cropEmojis[crop] || "🌱"}</span>
                {crop}
              </button>
            ))}
          </div>

          {/* ─── LIVE PRICES TAB ─── */}
          {activeTab === "prices" && (
            <>
              {/* Stats */}
              {!pricesLoading && !pricesError && prices.length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                  <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
                    <CardContent className="p-5 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Avg Modal</p>
                        <p className="text-2xl font-bold text-green-600">₹{avgPrice}</p>
                        <p className="text-xs text-muted-foreground">per quintal</p>
                      </div>
                      <TrendingUp className="h-10 w-10 text-green-400 opacity-30" />
                    </CardContent>
                  </Card>
                  <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
                    <CardContent className="p-5 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Highest</p>
                        <p className="text-2xl font-bold text-blue-600">₹{maxModal}</p>
                        <p className="text-xs text-muted-foreground">per quintal</p>
                      </div>
                      <TrendingUp className="h-10 w-10 text-blue-400 opacity-30" />
                    </CardContent>
                  </Card>
                  <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
                    <CardContent className="p-5 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Lowest</p>
                        <p className="text-2xl font-bold text-orange-600">₹{minModal}</p>
                        <p className="text-xs text-muted-foreground">per quintal</p>
                      </div>
                      <TrendingDown className="h-10 w-10 text-orange-400 opacity-30" />
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by mandi name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>

              {pricesLoading && (
                <Card>
                  <CardContent className="p-12 flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
                    <p className="text-muted-foreground">Loading market prices...</p>
                  </CardContent>
                </Card>
              )}

              {pricesError && (
                <Card className="border-destructive">
                  <CardContent className="p-6 flex items-center gap-3 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    <p>{pricesError}</p>
                    <Button variant="outline" size="sm" onClick={fetchPrices} className="ml-auto">
                      Retry
                    </Button>
                  </CardContent>
                </Card>
              )}

              {!pricesLoading && !pricesError && filteredPrices.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Mandi Prices ({filteredPrices.length} results)</span>
                      <Badge variant="outline" className="capitalize">{selectedCrop}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredPrices.map((item, i) => (
                        <div
                          key={i}
                          className="p-4 border-2 rounded-xl hover:shadow-md transition-all hover:border-primary/50"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-start gap-2">
                              <MapPin className="h-4 w-4 text-primary mt-1 shrink-0" />
                              <div>
                                <h3 className="font-semibold">{item.market}</h3>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
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
                              <p className="text-xl font-bold text-green-600">₹{item.modalPrice}</p>
                              <p className="text-xs text-muted-foreground">modal price</p>
                            </div>
                          </div>

                          {/* Min / Max */}
                          {(item.minPrice != null || item.maxPrice != null) && (
                            <div className="flex gap-3 text-xs pt-2 border-t">
                              {item.minPrice != null && (
                                <span className="text-orange-600">
                                  Min: <strong>₹{item.minPrice}</strong>
                                </span>
                              )}
                              {item.maxPrice != null && (
                                <span className="text-blue-600">
                                  Max: <strong>₹{item.maxPrice}</strong>
                                </span>
                              )}
                              {item.modalPrice > avgPrice ? (
                                <Badge className="ml-auto bg-green-100 text-green-800 hover:bg-green-100">
                                  <TrendingUp className="h-3 w-3 mr-1" /> Above Avg
                                </Badge>
                              ) : item.modalPrice < avgPrice ? (
                                <Badge className="ml-auto bg-orange-100 text-orange-800 hover:bg-orange-100">
                                  <TrendingDown className="h-3 w-3 mr-1" /> Below Avg
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="ml-auto">At Avg</Badge>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {!pricesLoading && !pricesError && prices.length === 0 && (
                <EmptyState
                  icon={IndianRupee}
                  title="No Prices Available"
                  description="Market prices for this crop are not available right now. Try onion, tomato, or grape."
                />
              )}
            </>
          )}

          {/* ─── PRICE TRENDS TAB ─── */}
          {activeTab === "trends" && (
            <>
              {/* Period */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground font-medium">Period:</span>
                {(["7", "14", "30"] as TrendPeriod[]).map((d) => (
                  <Button
                    key={d}
                    variant={trendPeriod === d ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTrendPeriod(d)}
                  >
                    {d} Days
                  </Button>
                ))}
              </div>

              {trendLoading && (
                <Card>
                  <CardContent className="p-12 flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
                    <p className="text-muted-foreground">Loading price trends...</p>
                  </CardContent>
                </Card>
              )}

              {trendError && (
                <Card className="border-destructive">
                  <CardContent className="p-6 flex items-center gap-3 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    <p>{trendError}</p>
                    <Button variant="outline" size="sm" onClick={fetchTrend} className="ml-auto">
                      Retry
                    </Button>
                  </CardContent>
                </Card>
              )}

              {!trendLoading && !trendError && trend && (
                <div className="space-y-5">

                  {/* Hero */}
                  <div className={`rounded-2xl p-6 text-white bg-gradient-to-r ${trendColor} shadow-lg`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white/70 text-sm mb-1 capitalize">
                          {selectedCrop} — Last {trendPeriod} Days
                        </p>
                        <p className="text-4xl font-bold">₹{trend.currentPrice ?? "—"}</p>
                        <p className="text-white/80 text-sm mt-1">Latest modal price / quintal</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 justify-end mb-1">
                          <TrendIcon className="h-5 w-5" />
                          <span className="text-2xl font-bold">
                            {pct > 0 ? "+" : ""}{pct.toFixed(1)}%
                          </span>
                        </div>
                        <p className="text-white/70 text-sm capitalize">{trendDir} trend</p>
                      </div>
                    </div>
                  </div>

                  {/* Advice */}
                  {trend.sellingAdvice && (
                    <Card className="border-amber-200 bg-amber-50">
                      <CardContent className="p-4 flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                        <p className="text-sm text-amber-800">{trend.sellingAdvice}</p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Price Range */}
                  <div className="grid grid-cols-3 gap-4">
                    <Card className="border-green-200">
                      <CardContent className="p-4 text-center">
                        <p className="text-xs text-muted-foreground">Current</p>
                        <p className="text-xl font-bold text-green-600">₹{trend.currentPrice ?? "—"}</p>
                      </CardContent>
                    </Card>
                    <Card className="border-blue-200">
                      <CardContent className="p-4 text-center">
                        <p className="text-xs text-muted-foreground">{trendPeriod}-Day High</p>
                        <p className="text-xl font-bold text-blue-600">₹{trend.priceRange?.max ?? "—"}</p>
                      </CardContent>
                    </Card>
                    <Card className="border-orange-200">
                      <CardContent className="p-4 text-center">
                        <p className="text-xs text-muted-foreground">{trendPeriod}-Day Low</p>
                        <p className="text-xl font-bold text-orange-600">₹{trend.priceRange?.min ?? "—"}</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Mandi Comparison */}
                  {trend.allMarkets?.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Avg Price by Mandi</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {trend.allMarkets.map((m, i) => {
                            const max = Math.max(...trend.allMarkets.map((x) => x.avgModalPrice));
                            const pct = max > 0 ? Math.round((m.avgModalPrice / max) * 100) : 0;
                            return (
                              <div key={i}>
                                <div className="flex justify-between text-sm mb-1">
                                  <span className="font-medium">{m.market}</span>
                                  <span className="font-bold text-primary">₹{m.avgModalPrice}</span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Historical Sparkline */}
                  {trend.chartData?.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center justify-between">
                          <span>Price History (last {trendPeriod} days)</span>
                          <span className="text-xs text-muted-foreground font-normal">
                            {trend.dataPoints} data points
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {/* Bar sparkline */}
                        <div className="flex items-end gap-1 h-24 mb-2">
                          {trend.chartData.map((h, i) => {
                            const allPrices = trend.chartData.map((x) => x.modalPrice);
                            const hMax = Math.max(...allPrices);
                            const hMin = Math.min(...allPrices);
                            const range = hMax - hMin || 1;
                            const heightPct = ((h.modalPrice - hMin) / range) * 100;
                            return (
                              <div
                                key={i}
                                className="flex-1 flex flex-col items-center justify-end group"
                                title={`${h.market}: ₹${h.modalPrice}`}
                              >
                                <div
                                  className="w-full bg-primary/60 group-hover:bg-primary rounded-t transition-all"
                                  style={{ height: `${Math.max(4, heightPct)}%` }}
                                />
                              </div>
                            );
                          })}
                        </div>

                        {/* Table of chart data */}
                        <div className="divide-y text-sm mt-3">
                          {trend.chartData.map((h, i) => (
                            <div key={i} className="flex items-center justify-between py-2">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Calendar className="h-3.5 w-3.5" />
                                {new Date(h.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                              </div>
                              <span className="text-xs text-muted-foreground">{h.market}</span>
                              <span className="font-semibold text-primary">₹{h.modalPrice}</span>
                            </div>
                          ))}
                        </div>

                        <div className="flex justify-between text-xs text-muted-foreground mt-3 pt-2 border-t">
                          <span>{new Date(trend.chartData[0]?.date).toLocaleDateString("en-IN")}</span>
                          <span>
                            {new Date(trend.chartData[trend.chartData.length - 1]?.date).toLocaleDateString("en-IN")}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Best Mandi highlight */}
                  {trend.bestMandi && (
                    <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
                      <CardContent className="p-5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                            <MapPin className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Best Mandi to Sell</p>
                            <p className="font-bold text-green-700">{trend.bestMandi.market}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-green-600">₹{trend.bestMandi.avgModalPrice}</p>
                          <p className="text-xs text-muted-foreground">avg modal price</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </>
          )}

        </div>
      </div>
      <ScrollToTop />
    </AppLayout>
  );
}
