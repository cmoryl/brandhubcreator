import { useState } from 'react';
import { FileText, Loader2, Download, BarChart3, Palette, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { hexToHsl, hexToCmyk, nearestPantone } from '@/lib/colorConversions';
import { contrastRatio, colorblindSafetyScore } from '@/lib/oklchAccessibility';
import { apcaContrast, analyzeHarmony, colorPsychology } from '@/lib/apcaContrast';

interface LabColor {
  id: string;
  hex: string;
  name: string;
}

interface ResearchReport {
  title: string;
  executiveSummary: string;
  colorTheory: {
    harmonyType: string;
    analysis: string;
    emotionalImpact: string;
  };
  accessibilityAudit: {
    wcagScore: number;
    apcaScore: number;
    colorblindSafety: number;
    findings: string[];
  };
  culturalAnalysis: string;
  industryBenchmark: string;
  productionNotes: string;
  recommendations: string[];
  conclusion: string;
}

interface ColorResearchReportProps {
  colors: LabColor[];
}

export function ColorResearchReport({ colors }: ColorResearchReportProps) {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ResearchReport | null>(null);

  const generateReport = async () => {
    if (colors.length < 2) {
      toast.error('Add at least 2 colors for a report');
      return;
    }
    setLoading(true);
    try {
      // Gather local analysis data to send with the request
      const hues = colors.map(c => hexToHsl(c.hex).h);
      const harmony = analyzeHarmony(hues);
      const cbSafety = colorblindSafetyScore(colors.map(c => c.hex));
      
      // Calculate contrast stats
      let passingWcag = 0, totalPairs = 0;
      for (let i = 0; i < colors.length; i++) {
        for (let j = i + 1; j < colors.length; j++) {
          totalPairs++;
          if (contrastRatio(colors[i].hex, colors[j].hex) >= 4.5) passingWcag++;
        }
      }

      const { data, error } = await supabase.functions.invoke('color-lab-analysis', {
        body: {
          type: 'research-report',
          colors: colors.map(c => ({
            hex: c.hex,
            name: c.name,
            hsl: hexToHsl(c.hex),
            cmyk: hexToCmyk(c.hex),
            pantone: nearestPantone(c.hex).name,
            psychology: colorPsychology(hexToHsl(c.hex).h, hexToHsl(c.hex).s, hexToHsl(c.hex).l),
          })),
          analysis: {
            harmony: harmony.label,
            harmonyScore: harmony.score,
            colorblindSafety: cbSafety,
            wcagPassRate: totalPairs > 0 ? Math.round((passingWcag / totalPairs) * 100) : 0,
          },
        },
      });

      if (error) throw error;
      setReport(data as ResearchReport);
      toast.success('Research report generated');
    } catch (err: any) {
      if (err?.status === 429) toast.error('Rate limit reached. Try again shortly.');
      else if (err?.status === 402) toast.error('AI credits exhausted. Please add credits.');
      else toast.error('Report generation failed');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const exportAsText = () => {
    if (!report) return;
    const text = [
      `# ${report.title}`,
      '',
      '## Executive Summary',
      report.executiveSummary,
      '',
      '## Color Theory Analysis',
      `Harmony: ${report.colorTheory.harmonyType}`,
      report.colorTheory.analysis,
      report.colorTheory.emotionalImpact,
      '',
      '## Accessibility Audit',
      `WCAG Score: ${report.accessibilityAudit.wcagScore}%`,
      `APCA Score: ${report.accessibilityAudit.apcaScore}%`,
      `Colorblind Safety: ${report.accessibilityAudit.colorblindSafety}%`,
      ...report.accessibilityAudit.findings.map(f => `- ${f}`),
      '',
      '## Cultural Analysis',
      report.culturalAnalysis,
      '',
      '## Industry Benchmark',
      report.industryBenchmark,
      '',
      '## Production Notes',
      report.productionNotes,
      '',
      '## Recommendations',
      ...report.recommendations.map((r, i) => `${i + 1}. ${r}`),
      '',
      '## Conclusion',
      report.conclusion,
    ].join('\n');

    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'color-research-report.md';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report downloaded');
  };

  if (!report) {
    return (
      <div className="text-center py-12 space-y-4">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground opacity-30" />
        <div>
          <p className="text-sm font-medium">Color Research Report</p>
          <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1">
            Generate a comprehensive AI-powered research report covering color theory, 
            accessibility audit, cultural analysis, industry benchmarks, and production recommendations.
          </p>
        </div>
        <Button onClick={generateReport} disabled={loading || colors.length < 2} className="gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
          {loading ? 'Generating...' : 'Generate Report'}
        </Button>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[600px]">
      <div className="space-y-6 pr-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">{report.title}</h2>
          <Button size="sm" variant="outline" onClick={exportAsText} className="gap-1">
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>
        </div>

        {/* Score Cards */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-[10px] text-muted-foreground">WCAG</p>
              <p className={cn("text-2xl font-bold", report.accessibilityAudit.wcagScore >= 70 ? 'text-primary' : 'text-destructive')}>
                {report.accessibilityAudit.wcagScore}%
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-[10px] text-muted-foreground">APCA</p>
              <p className={cn("text-2xl font-bold", report.accessibilityAudit.apcaScore >= 70 ? 'text-primary' : 'text-destructive')}>
                {report.accessibilityAudit.apcaScore}%
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-[10px] text-muted-foreground">CB Safe</p>
              <p className={cn("text-2xl font-bold", report.accessibilityAudit.colorblindSafety >= 70 ? 'text-primary' : 'text-destructive')}>
                {report.accessibilityAudit.colorblindSafety}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Executive Summary */}
        <div className="space-y-1">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Executive Summary
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">{report.executiveSummary}</p>
        </div>

        <Separator />

        {/* Report Sections */}
        <Tabs defaultValue="theory">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="theory" className="text-xs">Color Theory</TabsTrigger>
            <TabsTrigger value="cultural" className="text-xs">Cultural</TabsTrigger>
            <TabsTrigger value="industry" className="text-xs">Industry</TabsTrigger>
            <TabsTrigger value="production" className="text-xs">Production</TabsTrigger>
          </TabsList>

          <TabsContent value="theory" className="space-y-3 pt-3">
            <Badge variant="outline">{report.colorTheory.harmonyType}</Badge>
            <p className="text-xs text-muted-foreground leading-relaxed">{report.colorTheory.analysis}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{report.colorTheory.emotionalImpact}</p>
          </TabsContent>

          <TabsContent value="cultural" className="pt-3">
            <p className="text-xs text-muted-foreground leading-relaxed">{report.culturalAnalysis}</p>
          </TabsContent>

          <TabsContent value="industry" className="pt-3">
            <p className="text-xs text-muted-foreground leading-relaxed">{report.industryBenchmark}</p>
          </TabsContent>

          <TabsContent value="production" className="pt-3">
            <p className="text-xs text-muted-foreground leading-relaxed">{report.productionNotes}</p>
          </TabsContent>
        </Tabs>

        <Separator />

        {/* Accessibility Findings */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Accessibility Findings</h3>
          <ul className="space-y-1">
            {report.accessibilityAudit.findings.map((f, i) => (
              <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                <BarChart3 className="h-3 w-3 mt-0.5 shrink-0 text-primary" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        <Separator />

        {/* Recommendations */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Strategic Recommendations</h3>
          <ol className="space-y-2">
            {report.recommendations.map((rec, i) => (
              <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                <span className="text-primary font-bold">{i + 1}.</span>
                {rec}
              </li>
            ))}
          </ol>
        </div>

        <Separator />

        {/* Conclusion */}
        <div className="space-y-1">
          <h3 className="text-sm font-semibold">Conclusion</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">{report.conclusion}</p>
        </div>
      </div>
    </ScrollArea>
  );
}
