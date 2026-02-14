/**
 * Bias Awareness Insight Detail Dialog
 * Shows full scan results when clicking bias insight cards in Insights & Updates
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Scale, Languages, Eye, Accessibility, ShieldCheck, AlertCircle, CheckCircle2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface BiasInsightDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityId: string;
  entityType: 'brand' | 'product' | 'event';
}

export const BiasInsightDetailDialog = ({ open, onOpenChange, entityId, entityType }: BiasInsightDetailDialogProps) => {
  const [scan, setScan] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !entityId) return;
    setLoading(true);
    supabase
      .from('bias_awareness_scans')
      .select('*')
      .eq('entity_id', entityId)
      .eq('entity_type', entityType)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        setScan(data);
        setLoading(false);
      });
  }, [open, entityId, entityType]);

  const scoreColor = (v: number) => v >= 80 ? 'text-emerald-500' : v >= 60 ? 'text-amber-500' : 'text-destructive';
  const scoreBg = (v: number) => v >= 80 ? 'bg-emerald-500' : v >= 60 ? 'bg-amber-500' : 'bg-destructive';

  const dimensions = scan ? [
    { label: 'Inclusion', score: Number(scan.inclusion_score) || 0, icon: Scale },
    { label: 'Language', score: Number(scan.language_score) || 0, icon: Languages },
    { label: 'Visual', score: Number(scan.visual_score) || 0, icon: Eye },
    { label: 'Accessibility', score: Number(scan.accessibility_score) || 0, icon: Accessibility },
    { label: 'AI Governance', score: Number(scan.ai_governance_score) || 0, icon: ShieldCheck },
  ] : [];

  const findings = scan ? (Array.isArray(scan.findings) ? scan.findings : []) : [];
  const recommendations = scan ? (Array.isArray(scan.recommendations) ? scan.recommendations : []) : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-violet-500" />
            Bias & Inclusivity Report
          </DialogTitle>
          <div className="flex items-center gap-2">
            <DialogDescription className="flex-1">
              Latest scan results {scan?.completed_at ? `from ${format(new Date(scan.completed_at), 'MMM d, yyyy')}` : ''}
            </DialogDescription>
            {scan && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 shrink-0"
                onClick={() => {
                  import('@/lib/exportHtml').then(({ exportBiasAwarenessHtml }) => {
                    exportBiasAwarenessHtml(scan, { entityName: scan.entity_name || 'Entity', entityType: entityType });
                  });
                }}
              >
                <Download className="h-3.5 w-3.5" />
                Export
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[calc(90vh-100px)] p-6 pt-4 space-y-5">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : !scan ? (
            <p className="text-center py-8 text-muted-foreground">No completed scan found.</p>
          ) : (
            <>
              {/* Dimension Scores */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Dimension Scores</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {dimensions.map((dim) => (
                    <div key={dim.label}>
                      <div className="flex items-center gap-2 mb-1">
                        <dim.icon className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm font-medium flex-1">{dim.label}</span>
                        <Badge className={cn(scoreBg(dim.score), 'text-white text-xs')}>{dim.score}/100</Badge>
                      </div>
                      <Progress value={dim.score} className="h-1.5" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Findings */}
              {findings.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      Findings ({findings.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {findings.slice(0, 15).map((f: any, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className={cn(
                            "mt-1 h-2 w-2 rounded-full shrink-0",
                            f?.severity === 'critical' || f?.severity === 'high' ? 'bg-destructive' :
                            f?.severity === 'medium' ? 'bg-amber-500' : 'bg-muted-foreground'
                          )} />
                          <span className="text-muted-foreground">{f?.message || f?.description || String(f)}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Recommendations */}
              {recommendations.length > 0 && (
                <Card className="border-accent/30 bg-accent/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-accent" />
                      Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1.5">
                      {recommendations.slice(0, 10).map((r: any, i: number) => (
                        <li key={i} className="text-sm text-muted-foreground">→ {r?.action || r?.message || r?.recommendation || String(r)}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
