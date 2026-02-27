import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, Droplets, AlertTriangle, TrendingUp, Store, Clock, RefreshCw } from 'lucide-react';
import { getAdvisory, type AdvisoryData } from '@/services/governmentDataService';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect as useSocketEffect } from 'react';
import { io, Socket } from 'socket.io-client';

interface SmartAdvisoryCardProps {
  crop?: string;
  location?: string;
}

export function SmartAdvisoryCard({ crop = 'grape', location = 'Nashik' }: SmartAdvisoryCardProps) {
  const [advisory, setAdvisory] = useState<AdvisoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  const fetchAdvisory = async () => {
    try {
      setLoading(true);
      const data = await getAdvisory(crop, location);
      setAdvisory(data);
      setError(null);
    } catch (err) {
      setError('Failed to load advisory');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdvisory();
  }, [crop, location]);

  // Socket.io for real-time updates
  useSocketEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const newSocket = io(API_URL);

    newSocket.on('connect', () => {
      console.log('Connected to advisory updates');
    });

    newSocket.on('new_advisory', (data: { crop: string; location: string }) => {
      if (data.crop === crop.toLowerCase() && data.location === location.toLowerCase()) {
        console.log('New advisory available, refreshing...');
        fetchAdvisory();
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [crop, location]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-48 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !advisory || !advisory.success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Smart Advisory
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error || 'No advisory available'}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Smart Advisory
          </CardTitle>
          <div className="flex items-center gap-2">
            {advisory.cached && (
              <Badge variant="secondary" className="text-xs">
                Cached
              </Badge>
            )}
            <button
              onClick={fetchAdvisory}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
              title="Refresh advisory"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
        <CardDescription className="capitalize">
          {advisory.crop} • {advisory.location}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Irrigation Advice */}
        <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-md border border-blue-200 dark:border-blue-800">
          <Droplets className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-1">
              Irrigation
            </p>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              {advisory.irrigationAdvice}
            </p>
          </div>
        </div>

        {/* Disease Risk */}
        <div className="flex items-start gap-2 p-3 bg-orange-50 dark:bg-orange-950 rounded-md border border-orange-200 dark:border-orange-800">
          <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-orange-900 dark:text-orange-100 mb-1">
              Disease Risk
            </p>
            <p className="text-sm text-orange-800 dark:text-orange-200">
              {advisory.diseaseRisk}
            </p>
          </div>
        </div>

        {/* Harvest Advice */}
        <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-md border border-green-200 dark:border-green-800">
          <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-green-900 dark:text-green-100 mb-1">
              Harvest Timing
            </p>
            <p className="text-sm text-green-800 dark:text-green-200">
              {advisory.harvestAdvice}
            </p>
          </div>
        </div>

        {/* Market Suggestion */}
        <div className="flex items-start gap-2 p-3 bg-purple-50 dark:bg-purple-950 rounded-md border border-purple-200 dark:border-purple-800">
          <Store className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-purple-900 dark:text-purple-100 mb-1">
              Market Recommendation
            </p>
            <p className="text-sm text-purple-800 dark:text-purple-200">
              {advisory.marketSuggestion}
            </p>
          </div>
        </div>

        {/* Generated At */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground pt-2 border-t">
          <Clock className="h-3 w-3" />
          <span>
            Generated: {new Date(advisory.generatedAt).toLocaleString()}
          </span>
        </div>

        {/* Data Quality Indicator */}
        {advisory.dataQuality && (
          <div className="text-xs text-muted-foreground">
            <p>
              Data sources:{' '}
              {advisory.dataQuality.weatherAvailable && '🌤️ Weather '}
              {advisory.dataQuality.soilAvailable && '🌱 Soil '}
              {advisory.dataQuality.marketAvailable && '💰 Market'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
