import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Globe, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

interface WebsiteReportDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  report: any;
}

const scoreColor = (score: number) =>
  score >= 80 ? 'text-emerald-500' : score >= 60 ? 'text-amber-500' : 'text-red-500';

const gradeColor = (grade: string) => {
  if (grade === 'A' || grade === 'A+') return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30';
  if (grade === 'B' || grade === 'B+') return 'bg-blue-500/10 text-blue-600 border-blue-500/30';
  if (grade === 'C') return 'bg-amber-500/10 text-amber-600 border-amber-500/30';
  return 'bg-red-500/10 text-red-600 border-red-500/30';
};

const SectionCard = ({ label, data }: { label: string; data: any }) => {
  if (!data) return null;
  const score = data.score ?? data.overallScore ?? null;
  const findings = Array.isArray(data.findings) ? data.findings : [];
  const recommendations = Array.isArray(data.recommendations) ? data.recommendations : [];

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">{label}</CardTitle>
          {score !== null && (
            <span className={cn('text-lg font-bold', scoreColor(score))}>{score}/100</span>
          )}
        </div>
        {score !== null && <Progress value={score} className="h-1.5 mt-1" />}
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {findings.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Findings</p>
            <ul className="space-y-1">
              {findings.slice(0, 5).map((f: string, i: number) => (
                <li key={i} className="text-xs text-foreground flex items-start gap-1.5">
                  <CheckCircle className="h-3 w-3 mt-0.5 text-emerald-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )}
        {recommendations.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Recommendations</p>
            <ul className="space-y-1">
              {recommendations.slice(0, 5).map((r: string, i: number) => (
                <li key={i} className="text-xs text-foreground flex items-start gap-1.5">
                  <AlertTriangle className="h-3 w-3 mt-0.5 text-amber-500 shrink-0" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const SECTION_LABELS: Record<string, string> = {
  seoHealth: 'SEO Health',
  performance: 'Performance',
  accessibility: 'Accessibility',
  brandConsistency: 'Brand Consistency',
  contentQuality: 'Content Quality',
  technicalFoundation: 'Technical Foundation',
  userExperience: 'User Experience',
  competitivePosition: 'Competitive Position',
};

export const WebsiteReportDetailDialog = ({ open, onOpenChange, url, report }: WebsiteReportDetailDialogProps) => {
  if (!report) return null;

  const sections = report.sections || {};
  const sectionEntries = Object.entries(sections).filter(
    ([, val]) => val && typeof val === 'object'
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Website Analysis
          </DialogTitle>
          {url && (
            <p className="text-sm text-muted-foreground truncate">{url}</p>
          )}
        </DialogHeader>

        {/* Overall Score */}
        <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 border border-border/50">
          <div className={cn('text-4xl font-bold', scoreColor(report.overallScore || 0))}>
            {report.overallScore ?? '—'}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">Overall Score</span>
              {report.grade && (
                <Badge variant="outline" className={gradeColor(report.grade)}>
                  Grade {report.grade}
                </Badge>
              )}
            </div>
            {report.summary && (
              <p className="text-sm text-muted-foreground mt-1">{report.summary}</p>
            )}
          </div>
        </div>

        {/* Section Breakdown */}
        {sectionEntries.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {sectionEntries.map(([key, data]) => (
              <SectionCard
                key={key}
                label={SECTION_LABELS[key] || key}
                data={data}
              />
            ))}
          </div>
        )}

        {/* Top-level recommendations */}
        {Array.isArray(report.topRecommendations) && report.topRecommendations.length > 0 && (
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Top Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {report.topRecommendations.map((r: string, i: number) => (
                  <li key={i} className="text-sm text-foreground flex items-start gap-2">
                    <XCircle className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    {r}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default WebsiteReportDetailDialog;
