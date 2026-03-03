import { useState, useEffect, useMemo } from 'react';
import { FileText, Loader2, Download, BarChart3, Palette, BookOpen, Save, Clock, Trash2, ChevronDown, FileDown, Globe, Eye, Type, Shield, Printer, Sparkles, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { hexToHsl, hexToCmyk, nearestPantone, analyzeMediumSuitability } from '@/lib/colorConversions';
import { contrastRatio, colorblindSafetyScore } from '@/lib/oklchAccessibility';
import { apcaContrast, analyzeHarmony, colorPsychology } from '@/lib/apcaContrast';
import { exportColorLabReportHtml, exportColorLabReportPdf } from '@/lib/exportHtml';
import { format } from 'date-fns';

interface LabColor {
  id: string;
  hex: string;
  name: string;
}

export interface ResearchReport {
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

interface SavedReport {
  id: string;
  title: string;
  colors: any;
  report_data: ResearchReport;
  created_at: string;
}

interface ColorResearchReportProps {
  colors: LabColor[];
}

// ── Score Ring SVG ──
function ScoreRing({ score, label, size = 72 }: { score: number; label: string; size?: number }) {
  const r = (size - 8) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? 'hsl(var(--primary))' : score >= 60 ? 'hsl(45 93% 47%)' : 'hsl(var(--destructive))';

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth="4" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <span className="text-lg font-bold" style={{ color }}>{score}%</span>
      </div>
      <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">{label}</span>
    </div>
  );
}

// ── Contrast Pair Preview ──
function ContrastPairPreview({ fg, bg }: { fg: LabColor; bg: LabColor }) {
  const ratio = contrastRatio(fg.hex, bg.hex);
  const grade = ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : ratio >= 3 ? 'AA Large' : 'Fail';
  const gradeColor = ratio >= 4.5 ? 'text-primary' : ratio >= 3 ? 'text-amber-500' : 'text-destructive';

  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="p-3 flex items-center gap-3" style={{ backgroundColor: bg.hex, color: fg.hex }}>
        <span className="text-sm font-semibold">Aa</span>
        <span className="text-xs opacity-80">{fg.name} on {bg.name}</span>
      </div>
      <div className="flex items-center justify-between px-3 py-1.5 bg-muted/30">
        <span className="text-[10px] text-muted-foreground">{ratio.toFixed(2)}:1</span>
        <Badge variant="outline" className={cn("text-[10px]", gradeColor)}>{grade}</Badge>
      </div>
    </div>
  );
}

export function ColorResearchReport({ colors }: ColorResearchReportProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [report, setReport] = useState<ResearchReport | null>(null);
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  useEffect(() => {
    if (user) loadSavedReports();
  }, [user]);

  const loadSavedReports = async () => {
    if (!user) return;
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('color_lab_reports')
        .select('id, title, colors, report_data, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      setSavedReports((data || []) as unknown as SavedReport[]);
    } catch {
      console.error('Failed to load saved reports');
    } finally {
      setLoadingHistory(false);
    }
  };

  const saveReport = async () => {
    if (!report || !user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('color_lab_reports').insert({
        user_id: user.id,
        title: report.title,
        colors: colors.map(c => ({ hex: c.hex, name: c.name })) as any,
        report_data: report as any,
        report_type: 'research',
      });
      if (error) throw error;
      toast.success('Report saved');
      loadSavedReports();
    } catch {
      toast.error('Failed to save report');
    } finally {
      setSaving(false);
    }
  };

  const loadReport = (saved: SavedReport) => {
    setReport(saved.report_data);
    toast.success(`Loaded "${saved.title}"`);
  };

  const deleteReport = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { error } = await supabase.from('color_lab_reports').delete().eq('id', id);
      if (error) throw error;
      setSavedReports(prev => prev.filter(r => r.id !== id));
      toast.success('Report deleted');
    } catch {
      toast.error('Failed to delete report');
    }
  };

  const generateReport = async () => {
    if (colors.length < 2) {
      toast.error('Add at least 2 colors for a report');
      return;
    }
    setLoading(true);
    try {
      const hues = colors.map(c => hexToHsl(c.hex).h);
      const harmony = analyzeHarmony(hues);
      const cbSafety = colorblindSafetyScore(colors.map(c => c.hex));
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
            hex: c.hex, name: c.name, hsl: hexToHsl(c.hex),
            cmyk: hexToCmyk(c.hex), pantone: nearestPantone(c.hex).name,
            psychology: colorPsychology(hexToHsl(c.hex).h, hexToHsl(c.hex).s, hexToHsl(c.hex).l),
          })),
          analysis: {
            harmony: harmony.label, harmonyScore: harmony.score,
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

  const enrichedColors = useMemo(() => colors.map(c => {
    const cmyk = hexToCmyk(c.hex);
    const pantoneMatch = nearestPantone(c.hex);
    const { print } = analyzeMediumSuitability(c.hex);
    const totalInk = cmyk.c + cmyk.m + cmyk.y + cmyk.k;
    return {
      hex: c.hex, name: c.name, hsl: hexToHsl(c.hex),
      cmyk, pantone: pantoneMatch.name, pantoneDistance: pantoneMatch.distance,
      printScore: print.score, printNotes: print.notes, inkCoverage: totalInk,
    };
  }), [colors]);

  // Top contrast pairs
  const contrastPairs = useMemo(() => {
    const pairs: Array<{ fg: LabColor; bg: LabColor; ratio: number }> = [];
    for (let i = 0; i < colors.length; i++) {
      for (let j = 0; j < colors.length; j++) {
        if (i === j) continue;
        pairs.push({ fg: colors[i], bg: colors[j], ratio: contrastRatio(colors[i].hex, colors[j].hex) });
      }
    }
    return pairs.sort((a, b) => b.ratio - a.ratio).slice(0, 6);
  }, [colors]);

  // Psychology
  const psychologyMap = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const c of colors) {
      const hsl = hexToHsl(c.hex);
      map.set(c.hex, colorPsychology(hsl.h, hsl.s, hsl.l));
    }
    return map;
  }, [colors]);

  // Harmony
  const harmony = useMemo(() => {
    const hues = colors.map(c => hexToHsl(c.hex).h);
    return analyzeHarmony(hues);
  }, [colors]);

  const exportAsText = () => {
    if (!report) return;
    const colorSpecs = enrichedColors.map(c => {
      const r = parseInt(c.hex.slice(1, 3), 16);
      const g = parseInt(c.hex.slice(3, 5), 16);
      const b = parseInt(c.hex.slice(5, 7), 16);
      const printStatus = c.printScore >= 80 ? '✅ Print-Ready' : c.printScore >= 50 ? '⚠️ Caution' : '❌ Not Recommended';
      return [
        `### ${c.name}`,
        `- **HEX:** ${c.hex.toUpperCase()}`,
        `- **RGB:** rgb(${r}, ${g}, ${b})`,
        `- **HSL:** hsl(${Math.round(c.hsl.h)}, ${Math.round(c.hsl.s)}%, ${Math.round(c.hsl.l)}%)`,
        `- **CMYK:** C${c.cmyk.c} M${c.cmyk.m} Y${c.cmyk.y} K${c.cmyk.k}`,
        `- **Ink Coverage:** ${c.inkCoverage}%${c.inkCoverage > 300 ? ' ⚠️ EXCEEDS 300% LIMIT' : ''}`,
        `- **Pantone:** ${c.pantone || '—'} (ΔE ≈ ${c.pantoneDistance})`,
        `- **Print Readiness:** ${printStatus} (${c.printScore}/100)`,
        ...(c.printNotes || []).map(n => `  - ${n}`),
      ].join('\n');
    }).join('\n\n');
    const text = [
      `# ${report.title}`, '', '## Palette Colors', '', colorSpecs, '',
      '## Executive Summary', report.executiveSummary, '',
      '## Color Theory Analysis', `Harmony: ${report.colorTheory.harmonyType}`,
      report.colorTheory.analysis, report.colorTheory.emotionalImpact, '',
      '## Accessibility Audit', `WCAG: ${report.accessibilityAudit.wcagScore}% | APCA: ${report.accessibilityAudit.apcaScore}% | CB Safe: ${report.accessibilityAudit.colorblindSafety}%`,
      ...report.accessibilityAudit.findings.map(f => `- ${f}`), '',
      '## Cultural Analysis', report.culturalAnalysis, '',
      '## Industry Benchmark', report.industryBenchmark, '',
      '## Production Notes', report.productionNotes, '',
      '## Recommendations', ...report.recommendations.map((r, i) => `${i + 1}. ${r}`), '',
      '## Conclusion', report.conclusion,
    ].join('\n');
    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'color-research-report.md'; a.click();
    URL.revokeObjectURL(url);
    toast.success('Report downloaded');
  };

  const handleExportPdf = async () => {
    if (!report) return;
    setExportingPdf(true);
    try {
      await exportColorLabReportPdf(report, enrichedColors);
      toast.success('PDF downloaded');
    } catch {
      toast.error('PDF export failed');
    } finally {
      setExportingPdf(false);
    }
  };

  const handleExportHtml = () => {
    if (!report) return;
    exportColorLabReportHtml(report, enrichedColors, contrastPairs.map(p => ({
      fg: p.fg, bg: p.bg, ratio: p.ratio,
    })), psychologyMap, harmony);
    toast.success('HTML report downloaded');
  };

  // ── Empty state ──
  if (!report) {
    return (
      <div className="space-y-6">
        <div className="text-center py-10 space-y-4">
          <div className="relative mx-auto w-16 h-16">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 animate-pulse" />
            <FileText className="h-8 w-8 absolute inset-0 m-auto text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold">Color Research Report</p>
            <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1">
              Generate a comprehensive AI-powered research report covering color theory,
              accessibility, cultural analysis, industry benchmarks, and production specs.
            </p>
          </div>
          <Button onClick={generateReport} disabled={loading || colors.length < 2} className="gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {loading ? 'Analyzing...' : 'Generate Report'}
          </Button>
        </div>
        {savedReports.length > 0 && (
          <Collapsible open={historyOpen} onOpenChange={setHistoryOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="w-full gap-2 justify-between">
                <span className="flex items-center gap-2"><Clock className="h-3.5 w-3.5" />Past Reports ({savedReports.length})</span>
                <ChevronDown className={cn("h-4 w-4 transition-transform", historyOpen && "rotate-180")} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3">
              <div className="space-y-2">
                {savedReports.map(r => (
                  <button key={r.id} onClick={() => loadReport(r)}
                    className="w-full text-left rounded-lg border p-3 hover:bg-muted/50 transition-colors group flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{r.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-muted-foreground">{format(new Date(r.created_at), 'MMM d, yyyy · h:mm a')}</span>
                        <div className="flex gap-0.5">
                          {(Array.isArray(r.colors) ? r.colors : []).slice(0, 5).map((c: any, i: number) => (
                            <div key={i} className="w-3 h-3 rounded-sm border" style={{ backgroundColor: c.hex }} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 shrink-0 hover:bg-destructive/10 hover:text-destructive"
                      onClick={(e) => deleteReport(r.id, e)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </button>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    );
  }

  // ── Report view ──
  return (
    <ScrollArea className="h-[650px]">
      <div className="space-y-6 pr-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h2 className="text-lg font-bold">{report.title}</h2>
            <p className="text-[10px] text-muted-foreground">{colors.length} colors · {harmony.label} harmony</p>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Button size="sm" variant="outline" onClick={saveReport} disabled={saving} className="gap-1 h-8">
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={handleExportPdf} disabled={exportingPdf} className="gap-1 h-8">
              {exportingPdf ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileDown className="h-3 w-3" />}
              PDF
            </Button>
            <Button size="sm" variant="outline" onClick={handleExportHtml} className="gap-1 h-8">
              <Globe className="h-3 w-3" />HTML
            </Button>
            <Button size="sm" variant="outline" onClick={exportAsText} className="gap-1 h-8">
              <Download className="h-3 w-3" />MD
            </Button>
          </div>
        </div>

        {/* ── Palette Strip ── */}
        <div className="flex rounded-xl overflow-hidden h-16 border shadow-sm">
          {colors.map(c => {
            const isLight = hexToHsl(c.hex).l > 60;
            return (
              <div key={c.id} className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-all hover:flex-[1.5]"
                style={{ backgroundColor: c.hex, color: isLight ? '#111827' : '#ffffff' }}>
                <span className="text-[10px] font-semibold truncate px-1">{c.name}</span>
                <span className="text-[9px] opacity-70 font-mono">{c.hex.toUpperCase()}</span>
              </div>
            );
          })}
        </div>

        {/* ── Score Rings ── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { score: report.accessibilityAudit.wcagScore, label: 'WCAG 2.2', icon: Shield },
            { score: report.accessibilityAudit.apcaScore, label: 'APCA', icon: Eye },
            { score: report.accessibilityAudit.colorblindSafety, label: 'CB Safety', icon: Palette },
          ].map(({ score, label, icon: Icon }) => (
            <Card key={label} className="overflow-hidden">
              <CardContent className="p-3 flex flex-col items-center gap-1 relative">
                <Icon className="h-3 w-3 text-muted-foreground absolute top-2 right-2" />
                <div className="relative">
                  <ScoreRing score={score} label={label} size={64} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Executive Summary ── */}
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4 space-y-1">
            <h3 className="text-xs font-semibold flex items-center gap-2 uppercase tracking-wide text-muted-foreground">
              <BookOpen className="h-3.5 w-3.5" />Executive Summary
            </h3>
            <p className="text-xs leading-relaxed">{report.executiveSummary}</p>
          </CardContent>
        </Card>

        {/* ── Color Psychology ── */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold flex items-center gap-2 uppercase tracking-wide text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" />Color Psychology
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {colors.map(c => {
              const traits = psychologyMap.get(c.hex) || [];
              const isLight = hexToHsl(c.hex).l > 60;
              return (
                <div key={c.id} className="rounded-lg overflow-hidden border">
                  <div className="h-8 flex items-center px-3 gap-2" style={{ backgroundColor: c.hex, color: isLight ? '#111827' : '#fff' }}>
                    <span className="text-[10px] font-semibold">{c.name}</span>
                  </div>
                  <div className="p-2 bg-muted/30">
                    <div className="flex flex-wrap gap-1">
                      {traits.map((t, i) => (
                        <Badge key={i} variant="outline" className="text-[9px] px-1.5 py-0">{t}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* ── Top Contrast Pairs ── */}
        {contrastPairs.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold flex items-center gap-2 uppercase tracking-wide text-muted-foreground">
              <Type className="h-3.5 w-3.5" />Best Contrast Pairs
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {contrastPairs.slice(0, 4).map((p, i) => (
                <ContrastPairPreview key={i} fg={p.fg} bg={p.bg} />
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* ── Report Sections ── */}
        <Tabs defaultValue="theory">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="theory" className="text-xs gap-1"><Palette className="h-3 w-3" />Theory</TabsTrigger>
            <TabsTrigger value="cultural" className="text-xs gap-1"><Globe className="h-3 w-3" />Cultural</TabsTrigger>
            <TabsTrigger value="industry" className="text-xs gap-1"><BarChart3 className="h-3 w-3" />Industry</TabsTrigger>
            <TabsTrigger value="production" className="text-xs gap-1"><Printer className="h-3 w-3" />Production</TabsTrigger>
          </TabsList>

          <TabsContent value="theory" className="space-y-3 pt-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{report.colorTheory.harmonyType}</Badge>
              <Badge variant="outline" className="text-[10px]">{harmony.description}</Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{report.colorTheory.analysis}</p>
            <Card className="bg-muted/30">
              <CardContent className="p-3">
                <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Emotional Impact</h4>
                <p className="text-xs leading-relaxed">{report.colorTheory.emotionalImpact}</p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="cultural" className="pt-3">
            <p className="text-xs text-muted-foreground leading-relaxed">{report.culturalAnalysis}</p>
          </TabsContent>
          <TabsContent value="industry" className="pt-3">
            <p className="text-xs text-muted-foreground leading-relaxed">{report.industryBenchmark}</p>
          </TabsContent>
          <TabsContent value="production" className="pt-3 space-y-3">
            <p className="text-xs text-muted-foreground leading-relaxed">{report.productionNotes}</p>
            {/* Print Production Cards */}
            <div className="space-y-2">
              {enrichedColors.map(c => {
                const status = c.printScore >= 80 ? 'Ready' : c.printScore >= 50 ? 'Caution' : 'Review';
                const statusClass = c.printScore >= 80 ? 'text-primary' : c.printScore >= 50 ? 'text-amber-500' : 'text-destructive';
                return (
                  <div key={c.hex} className="flex items-start gap-3 rounded-lg border p-3">
                    <div className="w-10 h-10 rounded-lg border shrink-0" style={{ backgroundColor: c.hex }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold">{c.name}</span>
                        <Badge variant="outline" className={cn("text-[9px]", statusClass)}>{status}</Badge>
                      </div>
                      <div className="flex gap-3 mt-1 text-[10px] text-muted-foreground">
                        <span>Ink: {c.inkCoverage}%{c.inkCoverage > 300 ? ' ⚠️' : ''}</span>
                        <span>Pantone: {c.pantone} (ΔE≈{c.pantoneDistance})</span>
                        <span>Score: {c.printScore}/100</span>
                      </div>
                      {c.printNotes && c.printNotes.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {c.printNotes.map((n, i) => (
                            <span key={i} className="text-[9px] text-muted-foreground">• {n}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>

        <Separator />

        {/* ── Accessibility Findings ── */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold flex items-center gap-2 uppercase tracking-wide text-muted-foreground">
            <Shield className="h-3.5 w-3.5" />Accessibility Findings
          </h3>
          <div className="space-y-1.5">
            {report.accessibilityAudit.findings.map((f, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0 text-amber-500" />
                {f}
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* ── Recommendations ── */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold flex items-center gap-2 uppercase tracking-wide text-muted-foreground">
            <CheckCircle2 className="h-3.5 w-3.5" />Strategic Recommendations
          </h3>
          <div className="space-y-2">
            {report.recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg border p-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-primary">{i + 1}</span>
                </div>
                <p className="text-xs leading-relaxed">{rec}</p>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* ── Conclusion ── */}
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="p-4 space-y-1">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Conclusion</h3>
            <p className="text-xs leading-relaxed">{report.conclusion}</p>
          </CardContent>
        </Card>

        {/* New report button */}
        <div className="pt-2">
          <Button variant="outline" size="sm" onClick={() => setReport(null)} className="gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />Generate New Report
          </Button>
        </div>
      </div>
    </ScrollArea>
  );
}
