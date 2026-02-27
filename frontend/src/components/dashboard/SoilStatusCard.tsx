import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sprout, Droplet, AlertCircle, Clock } from 'lucide-react';
import { getSoilCondition, type SoilData } from '@/services/governmentDataService';
import { Skeleton } from '@/components/ui/skeleton';

interface SoilStatusCardProps {
  location?: string;
}

export function SoilStatusCard({ location = 'Nashik' }: SoilStatusCardProps) {
  const [soil, setSoil] = useState<SoilData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSoil = async () => {
      try {
        setLoading(true);
        const data = await getSoilCondition(location);
        setSoil(data);
        setError(null);
      } catch (err) {
        setError('Failed to load soil data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSoil();
    // Refresh every 30 minutes
    const interval = setInterval(fetchSoil, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [location]);

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

  if (error || !soil || !soil.success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sprout className="h-5 w-5" />
            Soil Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error || 'No soil data available'}</p>
        </CardContent>
      </Card>
    );
  }

  const getMoistureColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'bg-blue-500';
      case 'medium':
        return 'bg-green-500';
      case 'low':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getDroughtColor = (risk: string) => {
    switch (risk) {
      case 'high':
        return 'text-red-600 dark:text-red-400';
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'low':
        return 'text-green-600 dark:text-green-400';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <Card className="relative">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sprout className="h-5 w-5" />
            Soil Status
          </CardTitle>
          {soil.staleData && (
            <Badge variant="outline" className="text-xs">
              Stale Data
            </Badge>
          )}
        </div>
        <CardDescription>{soil.location}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Soil Moisture Indicator */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium flex items-center gap-1">
              <Droplet className="h-4 w-4" />
              Soil Moisture
            </span>
            <Badge variant="secondary" className="capitalize">
              {soil.soilMoisture}
            </Badge>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className={`h-3 rounded-full ${getMoistureColor(soil.soilMoisture)} transition-all`}
              style={{
                width:
                  soil.soilMoisture === 'high'
                    ? '100%'
                    : soil.soilMoisture === 'medium'
                    ? '60%'
                    : '30%',
              }}
            />
          </div>
        </div>

        {/* Drought Risk */}
        <div className="flex items-start gap-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-md">
          <AlertCircle className={`h-5 w-5 ${getDroughtColor(soil.droughtRisk)} mt-0.5`} />
          <div>
            <p className="text-sm font-medium">Drought Risk</p>
            <p className={`text-sm capitalize ${getDroughtColor(soil.droughtRisk)}`}>
              {soil.droughtRisk}
            </p>
          </div>
        </div>

        {/* Note if present */}
        {soil.note && (
          <p className="text-xs text-muted-foreground italic">{soil.note}</p>
        )}

        {/* Last Updated */}
        {soil.lastUpdated && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground pt-2 border-t">
            <Clock className="h-3 w-3" />
            <span>
              Updated: {new Date(soil.lastUpdated).toLocaleString()}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
