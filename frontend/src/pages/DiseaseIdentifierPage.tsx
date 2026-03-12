import { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Upload, Loader2, Microscope, RefreshCcw, CheckCircle2, AlertTriangle,
  Leaf, ShieldAlert, FlaskConical, Sprout, ChevronRight, Brain, Cpu,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { diseaseApi, type DiseaseResult, type DiseaseResponse } from '@/services/api';

const SEVERITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  none:     { label: 'Healthy', color: 'text-green-700',  bg: 'bg-green-100' },
  low:      { label: 'Low',      color: 'text-yellow-700', bg: 'bg-yellow-100' },
  medium:   { label: 'Medium',   color: 'text-orange-700', bg: 'bg-orange-100' },
  high:     { label: 'High',     color: 'text-red-700',    bg: 'bg-red-100' },
  critical: { label: 'Critical', color: 'text-red-900',    bg: 'bg-red-200' },
};

export default function DiseaseIdentifierPage() {
  const { t } = useTranslation();
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DiseaseResult | null>(null);
  const [modelInfo, setModelInfo] = useState<string | null>(null);
  const [top3, setTop3] = useState<{ class: string; confidence: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File) => {
    if (f.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB.');
      return;
    }
    setFile(f);
    setResult(null);
    setModelInfo(null);
    setTop3([]);
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  }, []);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const identify = async () => {
    if (!file) return;
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res: DiseaseResponse = await diseaseApi.identify(formData);
      setResult(res.data);
      setModelInfo(res.model || null);
      setTop3(res.top_3 || []);
    } catch (err: any) {
      setError(err.message || 'Analysis failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setModelInfo(null);
    setTop3([]);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const sev = result ? (SEVERITY_CONFIG[result.severity] ?? SEVERITY_CONFIG.low) : null;
  const isMLModel = modelInfo?.includes('MobileNet') || modelInfo?.includes('PlantVillage');

  return (
    <div className="container max-w-4xl py-8 px-4 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <Microscope className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t('disease.title')}</h1>
            <p className="text-muted-foreground text-sm">{t('disease.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Upload Panel */}
        <div className="space-y-4">
          {/* Drop Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={onDrop}
            onClick={() => !preview && inputRef.current?.click()}
            className={`relative rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer overflow-hidden
              ${isDragOver ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border hover:border-primary/50 hover:bg-muted/50'}
              ${preview ? 'h-64' : 'h-52'}`}
          >
            {preview ? (
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
                <div className="h-14 w-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <Upload className="h-7 w-7 text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{t('disease.upload.hint')}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t('disease.upload.formats')}</p>
                </div>
              </div>
            )}
            {isDragOver && (
              <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                <p className="font-bold text-primary">Drop image here</p>
              </div>
            )}
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={onFileChange}
            className="hidden"
          />

          <div className="flex gap-2">
            {!preview ? (
              <Button className="flex-1" onClick={() => inputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                {t('disease.upload.button')}
              </Button>
            ) : (
              <>
                <Button className="flex-1" onClick={identify} disabled={isLoading}>
                  {isLoading ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t('disease.analyzing')}</>
                  ) : (
                    <><Microscope className="h-4 w-4 mr-2" />{t('disease.identify')}</>
                  )}
                </Button>
                <Button variant="outline" onClick={reset}>
                  <RefreshCcw className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-sm">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {/* Tips (shown before analysis) */}
          {!result && !isLoading && (
            <Card className="bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/50">
              <CardContent className="p-4 space-y-2">
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">📸 Photo Tips</p>
                {[
                  'Take a close-up of the affected leaf',
                  'Ensure good lighting — avoid blur',
                  'Include both healthy and diseased parts',
                  'Supports 38 crop diseases across 14 crops',
                ].map((tip, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <ChevronRight className="h-3 w-3 text-emerald-600" />
                    {tip}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Results Panel */}
        <div className="space-y-4">
          {isLoading && (
            <div className="h-full flex flex-col items-center justify-center gap-4 py-16 text-center">
              <div className="relative">
                <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                <Microscope className="absolute inset-0 m-auto h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold">{t('disease.analyzing')}</p>
                <p className="text-sm text-muted-foreground">Running ML model analysis...</p>
              </div>
            </div>
          )}

          {result && !isLoading && (
            <div className="space-y-4 animate-in fade-in duration-500">
              {/* Model Badge */}
              {modelInfo && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="gap-1.5 text-[11px] px-2.5 py-1">
                    {isMLModel ? (
                      <><Cpu className="h-3 w-3 text-violet-600" /> KrishiSmart ML Model</>
                    ) : (
                      <><Brain className="h-3 w-3 text-blue-600" /> {modelInfo}</>
                    )}
                  </Badge>
                </div>
              )}

              {/* Disease Name Card */}
              <Card className={result.isHealthy ? 'border-green-300 bg-green-50/50 dark:bg-green-950/20' : 'border-red-300 bg-red-50/50 dark:bg-red-950/20'}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${result.isHealthy ? 'bg-green-200' : 'bg-red-200'}`}>
                        {result.isHealthy ? (
                          <CheckCircle2 className="h-5 w-5 text-green-700" />
                        ) : (
                          <ShieldAlert className="h-5 w-5 text-red-700" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{result.disease}</p>
                        {result.affectedCrop && result.affectedCrop !== 'Unknown' && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Leaf className="h-3 w-3" /> {result.affectedCrop}
                          </p>
                        )}
                      </div>
                    </div>
                    {sev && (
                      <Badge className={`${sev.bg} ${sev.color} border-0 text-xs`}>
                        {sev.label}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-3 leading-relaxed">{result.description}</p>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Confidence: <span className="font-semibold">{result.confidence}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Top-3 Predictions (ML model only) */}
              {top3.length > 1 && (
                <Card>
                  <CardContent className="p-4 space-y-2">
                    <p className="text-sm font-semibold flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-violet-600" />
                      Top Predictions
                    </p>
                    <div className="space-y-2">
                      {top3.map((pred, i) => {
                        const pct = parseFloat(pred.confidence);
                        return (
                          <div key={i} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className={`font-medium ${i === 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                                {pred.class}
                              </span>
                              <span className="font-mono text-muted-foreground">{pred.confidence}</span>
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-700 ${i === 0 ? 'bg-violet-500' : 'bg-violet-300'}`}
                                style={{ width: `${Math.min(pct, 100)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Treatments */}
              {!result.isHealthy && result.treatments?.length > 0 && (
                <Card>
                  <CardContent className="p-4 space-y-2">
                    <p className="text-sm font-semibold flex items-center gap-2">
                      <FlaskConical className="h-4 w-4 text-blue-600" />
                      {t('disease.results.treatments')}
                    </p>
                    <ol className="space-y-1.5">
                      {result.treatments.map((treatment, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex gap-2">
                          <span className="flex-shrink-0 h-4 w-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px]">{i + 1}</span>
                          {treatment}
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              )}

              {/* Prevention */}
              {result.prevention?.length > 0 && (
                <Card>
                  <CardContent className="p-4 space-y-2">
                    <p className="text-sm font-semibold flex items-center gap-2">
                      <Sprout className="h-4 w-4 text-emerald-600" />
                      {t('disease.results.prevention')}
                    </p>
                    <ul className="space-y-1.5">
                      {result.prevention.map((tip, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                          <ChevronRight className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Organic Remedy */}
              {result.organicRemedy && (
                <Card className="border-amber-200/50 bg-amber-50/50 dark:bg-amber-950/20">
                  <CardContent className="p-4">
                    <p className="text-sm font-semibold flex items-center gap-2 text-amber-700">
                      <Leaf className="h-4 w-4" />
                      🌿 Organic Remedy
                    </p>
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{result.organicRemedy}</p>
                  </CardContent>
                </Card>
              )}

              <Button variant="outline" className="w-full" onClick={reset}>
                <RefreshCcw className="h-4 w-4 mr-2" />
                {t('disease.tryAnother')}
              </Button>
            </div>
          )}

          {!result && !isLoading && !error && (
            <div className="h-full flex flex-col items-center justify-center gap-3 py-16 text-center text-muted-foreground">
              <div className="h-20 w-20 rounded-2xl bg-muted flex items-center justify-center">
                <Microscope className="h-10 w-10 opacity-30" />
              </div>
              <p className="text-sm">Upload a leaf image to get started</p>
              <p className="text-xs text-muted-foreground">Powered by KrishiSmart ML model</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
