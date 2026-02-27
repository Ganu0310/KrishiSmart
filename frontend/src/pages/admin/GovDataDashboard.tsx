import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { govDataAdminApi, type JobStats, type CacheStats, type DataQuality } from '@/services/api';
import {
  RefreshCw,
  Database,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Activity,
  BarChart3,
} from 'lucide-react';
import { toast } from 'sonner';

export default function GovDataDashboard() {
  const [jobs, setJobs] = useState<JobStats[]>([]);
  const [cacheStats, setCacheStats] = useState<Record<string, CacheStats> | null>(null);
  const [dataQuality, setDataQuality] = useState<DataQuality | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [jobsRes, cacheRes, qualityRes] = await Promise.all([
        govDataAdminApi.getJobStatus(),
        govDataAdminApi.getCacheStats(),
        govDataAdminApi.getDataQuality(),
      ]);

      if (jobsRes.success) setJobs(jobsRes.jobs);
      if (cacheRes.success) setCacheStats(cacheRes.stats);
      if (qualityRes.success) setDataQuality(qualityRes.quality);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleManualRefresh = async (source: string) => {
    try {
      setRefreshing(source);
      const res = await govDataAdminApi.manualRefresh(source);
      if (res.success) {
        toast.success(res.message);
        await loadData();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to refresh data');
    } finally {
      setRefreshing(null);
    }
  };

  const handleClearCache = async (source: string) => {
    if (!confirm(`Are you sure you want to clear the ${source} cache?`)) return;

    try {
      const res = await govDataAdminApi.clearCache(source);
      if (res.success) {
        toast.success(`${res.message} (${res.deletedCount} records deleted)`);
        await loadData();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to clear cache');
    }
  };

  const getStatusBadge = (job: JobStats) => {
    if (job.isRunning) {
      return <Badge className="bg-blue-500">Running</Badge>;
    }
    if (job.lastError) {
      return <Badge variant="destructive">Error</Badge>;
    }
    return <Badge className="bg-green-500">Idle</Badge>;
  };

  const getFreshnessBadge = (stalePercentage: string) => {
    const percentage = parseFloat(stalePercentage);
    if (percentage === 0) {
      return <Badge className="bg-green-500">Fresh</Badge>;
    }
    if (percentage < 30) {
      return <Badge className="bg-yellow-500">Mostly Fresh</Badge>;
    }
    return <Badge variant="destructive">Stale</Badge>;
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Government Data Management</h1>
        <p className="text-muted-foreground mt-2">
          Monitor background jobs, cache statistics, and data quality
        </p>
      </div>

      {/* Data Quality Overview */}
      {dataQuality && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Data Quality Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-3xl font-bold text-primary">{dataQuality.coverage.overall}%</div>
                <div className="text-sm text-muted-foreground mt-1">Overall Coverage</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">{dataQuality.coverage.weather}%</div>
                <div className="text-sm text-muted-foreground mt-1">Weather Coverage</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600">{dataQuality.coverage.market}%</div>
                <div className="text-sm text-muted-foreground mt-1">Market Coverage</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-3xl font-bold text-amber-600">{dataQuality.coverage.soil}%</div>
                <div className="text-sm text-muted-foreground mt-1">Soil Coverage</div>
              </div>
            </div>

            {/* Missing Data Alerts */}
            {(dataQuality.missing.weatherLocations.length > 0 ||
              dataQuality.missing.soilLocations.length > 0 ||
              dataQuality.missing.marketCrops.length > 0) && (
              <Alert className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Missing Data:</strong>
                  {dataQuality.missing.weatherLocations.length > 0 && (
                    <div>Weather: {dataQuality.missing.weatherLocations.join(', ')}</div>
                  )}
                  {dataQuality.missing.soilLocations.length > 0 && (
                    <div>Soil: {dataQuality.missing.soilLocations.join(', ')}</div>
                  )}
                  {dataQuality.missing.marketCrops.length > 0 && (
                    <div>Market: {dataQuality.missing.marketCrops.join(', ')}</div>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Background Jobs Status */}
      <div>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Activity className="h-6 w-6" />
          Background Jobs
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <Card key={job.name}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="capitalize">{job.name} Job</CardTitle>
                  {getStatusBadge(job)}
                </div>
                <CardDescription>
                  {job.name === 'weather' && 'Runs every hour'}
                  {job.name === 'market' && 'Runs every 6 hours'}
                  {job.name === 'soil' && 'Runs every 12 hours'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Last Run:</span>
                    <span className="font-medium">
                      {job.lastRun ? new Date(job.lastRun).toLocaleString() : 'Never'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Next Run:</span>
                    <span className="font-medium">
                      {job.nextRun ? new Date(job.nextRun).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Success:
                    </span>
                    <span className="font-medium">{job.successCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <XCircle className="h-4 w-4 text-red-500" />
                      Failures:
                    </span>
                    <span className="font-medium">{job.failureCount}</span>
                  </div>
                </div>

                {job.lastError && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-xs">{job.lastError}</AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={() => handleManualRefresh(job.name)}
                  disabled={refreshing === job.name || job.isRunning}
                  className="w-full"
                  size="sm"
                >
                  {refreshing === job.name ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Refreshing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Manual Refresh
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Cache Statistics */}
      {cacheStats && (
        <div>
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Database className="h-6 w-6" />
            Cache Statistics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(cacheStats).map(([source, stats]) => (
              <Card key={source}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="capitalize">{source}</CardTitle>
                    {getFreshnessBadge(stats.stalePercentage)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Total Records:</span>
                      <span className="font-bold text-lg">{stats.totalRecords}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Fresh:</span>
                      <span className="text-green-600 font-medium">{stats.freshRecords}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Stale:</span>
                      <span className="text-red-600 font-medium">{stats.staleRecords}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Stale %:</span>
                      <span className="font-medium">{stats.stalePercentage}%</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground pt-2">
                      <Clock className="h-3 w-3" />
                      {stats.lastUpdated
                        ? new Date(stats.lastUpdated).toLocaleString()
                        : 'No data'}
                    </div>
                  </div>

                  {stats.locations && stats.locations.length > 0 && (
                    <div className="text-xs">
                      <span className="text-muted-foreground">Locations: </span>
                      <span className="font-medium">{stats.locations.length}</span>
                    </div>
                  )}

                  {stats.crops && stats.crops.length > 0 && (
                    <div className="text-xs">
                      <span className="text-muted-foreground">Crops: </span>
                      <span className="font-medium">{stats.crops.join(', ')}</span>
                    </div>
                  )}

                  <Button
                    onClick={() => handleClearCache(source)}
                    variant="outline"
                    size="sm"
                    className="w-full text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear Cache
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Refresh All Button */}
      <Card>
        <CardHeader>
          <CardTitle>Manual Actions</CardTitle>
          <CardDescription>Trigger manual data refresh for all sources</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button onClick={loadData} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reload Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
