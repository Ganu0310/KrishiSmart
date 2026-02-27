import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Store, TrendingUp, TrendingDown, Minus, Clock } from 'lucide-react';
import { getMarketPrices, type MarketData } from '@/services/governmentDataService';
import { Skeleton } from '@/components/ui/skeleton';

interface MarketBestSellCardProps {
  crop?: string;
}

export function MarketBestSellCard({ crop = 'grape' }: MarketBestSellCardProps) {
  const [market, setMarket] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMarket = async () => {
      try {
        setLoading(true);
        const data = await getMarketPrices(crop);
        setMarket(data);
        setError(null);
      } catch (err) {
        setError('Failed to load market data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMarket();
    // Refresh every 30 minutes
    const interval = setInterval(fetchMarket, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [crop]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !market || !market.success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Best Market
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error || 'No market data available'}</p>
        </CardContent>
      </Card>
    );
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'rising':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'falling':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'rising':
        return 'text-green-600 dark:text-green-400';
      case 'falling':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <Card className="relative">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Best Market
          </CardTitle>
          {market.staleData && (
            <Badge variant="outline" className="text-xs">
              Stale Data
            </Badge>
          )}
        </div>
        <CardDescription className="capitalize">{market.crop}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Best Mandi */}
        <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-green-900 dark:text-green-100">
              Recommended Market
            </span>
            <div className="flex items-center gap-1">
              {getTrendIcon(market.bestMandi.trend)}
              <span className={`text-xs font-medium capitalize ${getTrendColor(market.bestMandi.trend)}`}>
                {market.bestMandi.trend}
              </span>
            </div>
          </div>
          <p className="text-lg font-bold text-green-900 dark:text-green-100">
            {market.bestMandi.market}
          </p>
          <p className="text-2xl font-bold text-green-700 dark:text-green-300 mt-1">
            ₹{market.bestMandi.modalPrice.toLocaleString()}
            <span className="text-sm font-normal text-green-600 dark:text-green-400">/quintal</span>
          </p>
        </div>

        {/* Top 3 Markets */}
        <div>
          <p className="text-sm font-medium mb-2">Other Markets</p>
          <div className="space-y-2">
            {market.prices.slice(1, 4).map((price, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded"
              >
                <span className="text-sm">{price.market}</span>
                <span className="text-sm font-semibold">
                  ₹{price.modalPrice.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Last Updated */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground pt-2 border-t">
          <Clock className="h-3 w-3" />
          <span>
            Updated: {new Date(market.lastUpdated).toLocaleString()}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
