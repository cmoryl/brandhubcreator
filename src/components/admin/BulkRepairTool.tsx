import { useState } from 'react';
import { 
  Wrench, Play, RotateCcw, CheckCircle, XCircle, 
  AlertTriangle, Loader2, Package, Palette, Eye, EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RepairResult {
  id: string;
  name: string;
  type: 'brand' | 'product';
  status: 'repaired' | 'skipped' | 'error';
  changes: string[];
  error?: string;
}

interface RollbackEntry {
  id: string;
  type: 'brand' | 'product';
  originalSectionOrder: string[] | null;
  originalHiddenSections: string[] | null;
}

interface RepairResponse {
  success: boolean;
  action: string;
  results: RepairResult[];
  rollbackData?: RollbackEntry[];
  totalProcessed: number;
  totalRepaired: number;
  totalSkipped?: number;
  totalErrors: number;
}

export const BulkRepairTool = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [results, setResults] = useState<RepairResult[]>([]);
  const [rollbackData, setRollbackData] = useState<RollbackEntry[]>([]);
  const [summary, setSummary] = useState<{ processed: number; repaired: number; skipped: number; errors: number } | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const callRepairFunction = async (action: 'preview' | 'repair' | 'rollback', data?: RollbackEntry[]) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error('Authentication required');
      return null;
    }

    const response = await supabase.functions.invoke('bulk-repair-guides', {
      body: { action, rollbackData: data },
    });

    if (response.error) {
      throw new Error(response.error.message);
    }

    return response.data as RepairResponse;
  };

  const handlePreview = async () => {
    setIsPreviewing(true);
    setResults([]);
    setSummary(null);
    setRollbackData([]);

    try {
      const data = await callRepairFunction('preview');
      if (data) {
        setResults(data.results);
        setSummary({
          processed: data.totalProcessed,
          repaired: data.totalRepaired,
          skipped: data.totalSkipped || 0,
          errors: data.totalErrors,
        });
        toast.success(`Preview complete: ${data.totalRepaired} guides would be repaired`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Preview failed');
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleRepair = async () => {
    setIsLoading(true);

    try {
      const data = await callRepairFunction('repair');
      if (data) {
        setResults(data.results);
        setRollbackData(data.rollbackData || []);
        setSummary({
          processed: data.totalProcessed,
          repaired: data.totalRepaired,
          skipped: data.totalSkipped || 0,
          errors: data.totalErrors,
        });
        toast.success(`Repair complete: ${data.totalRepaired} guides updated`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Repair failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRollback = async () => {
    if (rollbackData.length === 0) {
      toast.error('No rollback data available');
      return;
    }

    setIsLoading(true);

    try {
      const data = await callRepairFunction('rollback', rollbackData);
      if (data) {
        setResults(data.results);
        setRollbackData([]);
        setSummary({
          processed: data.totalProcessed,
          repaired: data.totalRepaired,
          skipped: 0,
          errors: data.totalErrors,
        });
        toast.success(`Rollback complete: ${data.totalRepaired} guides restored`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Rollback failed');
    } finally {
      setIsLoading(false);
    }
  };

  const repairedCount = results.filter(r => r.status === 'repaired').length;
  const skippedCount = results.filter(r => r.status === 'skipped').length;
  const errorCount = results.filter(r => r.status === 'error').length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          Bulk Section Order Repair
        </CardTitle>
        <CardDescription>
          Normalize section_order and hidden_sections for all brands and products. 
          This adds missing sections (like socialassets) and cleans invalid hidden entries.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={handlePreview}
            disabled={isLoading || isPreviewing}
            className="gap-2"
          >
            {isPreviewing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
            Preview Changes
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="default"
                disabled={isLoading || isPreviewing}
                className="gap-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                Run Repair
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Bulk Repair</AlertDialogTitle>
                <AlertDialogDescription>
                  This will update all brands and products to include any missing sections 
                  (like socialassets) in their section_order. A rollback option will be available after completion.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleRepair}>
                  Proceed with Repair
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {rollbackData.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  disabled={isLoading}
                  className="gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Rollback ({rollbackData.length})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Rollback</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will restore {rollbackData.length} guides to their original section_order 
                    and hidden_sections values from before the last repair.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleRollback}>
                    Proceed with Rollback
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {/* Summary */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="text-center">
              <p className="text-2xl font-bold">{summary.processed}</p>
              <p className="text-xs text-muted-foreground">Total Processed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{summary.repaired}</p>
              <p className="text-xs text-muted-foreground">Repaired</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-muted-foreground">{summary.skipped}</p>
              <p className="text-xs text-muted-foreground">Skipped</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{summary.errors}</p>
              <p className="text-xs text-muted-foreground">Errors</p>
            </div>
          </div>
        )}

        {/* Progress indicator during loading */}
        {(isLoading || isPreviewing) && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>{isPreviewing ? 'Previewing...' : 'Processing...'}</span>
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
            <Progress value={undefined} className="animate-pulse" />
          </div>
        )}

        {/* Results List */}
        {results.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Results</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                className="gap-1 text-xs"
              >
                {showDetails ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                {showDetails ? 'Hide Details' : 'Show Details'}
              </Button>
            </div>

            <ScrollArea className="h-[300px] rounded-md border">
              <div className="p-4 space-y-2">
                {results.map((result) => (
                  <div
                    key={`${result.type}-${result.id}`}
                    className="flex items-start gap-3 p-3 rounded-lg bg-card border"
                  >
                    {/* Status Icon */}
                    {result.status === 'repaired' && (
                      <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    )}
                    {result.status === 'skipped' && (
                      <AlertTriangle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                    )}
                    {result.status === 'error' && (
                      <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="gap-1">
                          {result.type === 'brand' ? (
                            <Palette className="h-3 w-3" />
                          ) : (
                            <Package className="h-3 w-3" />
                          )}
                          {result.type}
                        </Badge>
                        <span className="font-medium truncate">{result.name}</span>
                      </div>

                      {showDetails && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          {result.changes.map((change, i) => (
                            <p key={i}>{change}</p>
                          ))}
                          {result.error && (
                            <p className="text-red-500">{result.error}</p>
                          )}
                        </div>
                      )}
                    </div>

                    <Badge
                      variant={
                        result.status === 'repaired'
                          ? 'default'
                          : result.status === 'error'
                          ? 'destructive'
                          : 'secondary'
                      }
                    >
                      {result.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Empty state */}
        {results.length === 0 && !isLoading && !isPreviewing && (
          <div className="text-center py-8 text-muted-foreground">
            <Wrench className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>Click "Preview Changes" to see which guides need repair.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
