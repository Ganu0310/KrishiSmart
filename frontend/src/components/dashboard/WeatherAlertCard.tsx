import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CloudRain, Droplets, Wind, AlertTriangle, Clock } from 'lucide-react';
import { getCurrentWeather, type WeatherData } from '@/services/governmentDataService';
import { Skeleton } from '@/components/ui/skeleton';

interface WeatherAlertCardProps {
  location?: string;
}

export function WeatherAlertCard({ location = 'Nashik' }: WeatherAlertCardProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true);
        const data = await getCurrentWeather(location);
        setWeather(data);
        setError(null);
      } catch (err) {
        setError('Failed to load weather data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    // Refresh every 10 minutes
    const interval = setInterval(fetchWeather, 10 * 60 * 1000);
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

  if (error || !weather || !weather.success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CloudRain className="h-5 w-5" />
            Weather Alert
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error || 'No weather data available'}</p>
        </CardContent>
      </Card>
    );
  }

  const getHumidityColor = (humidity: number) => {
    if (humidity > 70) return 'text-red-500';
    if (humidity > 50) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getRainfallColor = (rainfall: number) => {
    if (rainfall > 20) return 'text-blue-600';
    if (rainfall > 10) return 'text-blue-400';
    return 'text-gray-500';
  };

  return (
    <Card className="relative">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CloudRain className="h-5 w-5" />
            Weather Alert
          </CardTitle>
          {weather.staleData && (
            <Badge variant="outline" className="text-xs">
              Stale Data
            </Badge>
          )}
        </div>
        <CardDescription>{weather.location}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Warning Banner */}
        {weather.warning && (
          <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-md">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <p className="text-sm text-yellow-800 dark:text-yellow-200">{weather.warning}</p>
          </div>
        )}

        {/* Weather Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <CloudRain className={`h-4 w-4 ${getRainfallColor(weather.rainfall)}`} />
            <div>
              <p className="text-xs text-muted-foreground">Rainfall</p>
              <p className="text-sm font-semibold">{weather.rainfall.toFixed(1)} mm</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Droplets className={`h-4 w-4 ${getHumidityColor(weather.humidity)}`} />
            <div>
              <p className="text-xs text-muted-foreground">Humidity</p>
              <p className="text-sm font-semibold">{weather.humidity}%</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Wind className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-xs text-muted-foreground">Wind Speed</p>
              <p className="text-sm font-semibold">{weather.windSpeed.toFixed(1)} km/h</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-2xl">🌡️</span>
            <div>
              <p className="text-xs text-muted-foreground">Temperature</p>
              <p className="text-sm font-semibold">{weather.temperature.toFixed(1)}°C</p>
            </div>
          </div>
        </div>

        {/* Last Updated */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground pt-2 border-t">
          <Clock className="h-3 w-3" />
          <span>
            Updated: {new Date(weather.lastUpdated).toLocaleString()}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
