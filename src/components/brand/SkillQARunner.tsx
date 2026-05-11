import { useEffect, useRef, useState } from 'react';
import { Beaker, Loader2, Download, AlertTriangle, CheckCircle2, History, Image as ImageIcon, Wand2, MessageSquare, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  runSkillQA, reportToMarkdown, fetchSkillQAHistory,
  type SkillQAReport, type SkillQAJobRow, type SkillQAHistoryRow,
} from '@/lib/skillQAClient';
import {
  requestSkillAutofix, downloadPatchedSkill, streamSkillChat, buildSkillContextFromGuide,
  type AutofixResult,
} from '@/lib/skillEnhanceClient';
import type { BrandGuide, ProductGuide } from '@/types/brand';
import type { EventGuide } from '@/types/event';

type AnyGuide = BrandGuide | ProductGuide | EventGuide;
interface Props { guide: AnyGuide; trigger?: React.ReactNode }

const TIER_LABEL: Record<string, string> = {
  haiku: 'Haiku-class (fast/cheap)',
  sonnet: 'Sonnet-class (balanced)',
  opus: 'Opus-class (premium)',
};
const scoreColor = (s: number) =>
  s >= 80 ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
  : s >= 60 ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
  : 'bg-destructive/15 text-destructive';

export const SkillQARunner = ({ guide, trigger }: Props) => {
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<SkillQAJobRow['progress'] | null>(null);
  const [report, setReport] = useState<SkillQAReport | null>(null);
  const [history, setHistory] = useState<SkillQAHistoryRow[]>([]);
  const [tab, setTab] = useState('current');

  const kind = ((guide as any).type || 'brand') as 'brand' | 'product' | 'event';

  const loadHistory = async () => {
    const h = await fetchSkillQAHistory(kind, guide.id, 10);
    setHistory(h);
  };
  useEffect(() => { if (open) loadHistory(); }, [open]);

  const run = async () => {
    setRunning(true); setReport(null); setProgress({ current: 0, total: 0, label: 'starting' });
    const toastId = toast.loading('Running skill QA…');
    try {
      const r = await runSkillQA(guide, {
        onProgress: (j) => setProgress(j.progress),
      });
      setReport(r);
      toast.success('Skill QA complete', { id: toastId });
      loadHistory();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Skill QA failed', { id: toastId });
    } finally {
      setRunning(false); setProgress(null);
    }
  };

  const download = (r: SkillQAReport) => {
    const md = reportToMarkdown(r);
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `skill-qa-${r.brandName.toLowerCase().replace(/\s+/g, '-')}.md`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o && !report && !running) run(); }}>
      {trigger ? (
        <span onClick={(e) => { e.preventDefault(); setOpen(true); }}>{trigger}</span>
      ) : (
        <Button variant="outline" size="sm" className="gap-2" onClick={() => setOpen(true)}>
          <Beaker className="h-4 w-4" /> Test skill
        </Button>
      )}
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Beaker className="h-5 w-5" /> Skill QA — {guide.hero?.name}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="current">Current run</TabsTrigger>
            <TabsTrigger value="history" className="gap-1"><History className="h-3.5 w-3.5" /> History ({history.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="space-y-4">
            {running && (
              <div className="rounded-md border p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {progress?.label ? <>Step: <span className="font-medium">{progress.label}</span></> : 'Starting…'}
                </div>
                <Progress value={progress?.total ? (progress.current / progress.total) * 100 : 5} />
                <div className="text-xs text-muted-foreground">
                  {progress ? `${progress.current} / ${progress.total}` : ''}
                </div>
              </div>
            )}

            {!running && !report && (
              <div className="p-6 text-center"><Button onClick={run}>Run QA now</Button></div>
            )}

            {report && <ReportView report={report} onDownload={() => download(report)} onRerun={run} />}
          </TabsContent>

          <TabsContent value="history" className="space-y-3">
            {history.length === 0 && <p className="text-sm text-muted-foreground p-4">No previous runs.</p>}
            {history.map((h) => (
              <div key={h.id} className="rounded-md border p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm">
                    <div className="font-medium">{new Date(h.created_at).toLocaleString()}</div>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {Object.entries(h.avg_score_by_tier || {}).map(([t, s]) => (
                        <Badge key={t} className={scoreColor(Number(s))}>{t}: {Number(s)}</Badge>
                      ))}
                      {h.visual_regression?.identity_match != null && (
                        <Badge variant="outline" className="gap-1"><ImageIcon className="h-3 w-3" />{h.visual_regression.identity_match}</Badge>
                      )}
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => { setReport(h.full_report); setTab('current'); }}>View</Button>
                </div>
                {h.consistently_missing?.length > 0 && (
                  <div className="text-xs text-amber-700 dark:text-amber-300">Missed: {h.consistently_missing.join(', ')}</div>
                )}
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

const ReportView = ({ report, onDownload, onRerun }: { report: SkillQAReport; onDownload: () => void; onRerun: () => void }) => (
  <div className="space-y-4">
    <div className="flex flex-wrap items-center gap-2 justify-between">
      <div className="flex flex-wrap gap-2">
        {Object.entries(report.summary.avgScoreByTier).map(([tier, score]) => (
          <Badge key={tier} variant="secondary" className={scoreColor(score)}>
            {TIER_LABEL[tier] || tier}: {score}/100
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={onRerun}>Re-run</Button>
        <Button size="sm" variant="outline" onClick={onDownload} className="gap-2"><Download className="h-3.5 w-3.5" /> Markdown</Button>
      </div>
    </div>

    {report.visualRegression?.ok && (
      <div className="rounded-md border p-3 space-y-3">
        <div className="flex items-center gap-2 font-medium text-sm"><ImageIcon className="h-4 w-4" /> Visual regression</div>
        <div className="grid grid-cols-2 gap-3">
          {report.visualRegression.referenceImageUrl && (
            <div>
              <div className="text-xs text-muted-foreground mb-1">Canonical</div>
              <img src={report.visualRegression.referenceImageUrl} alt="canonical reference" className="rounded border w-full aspect-square object-cover" />
            </div>
          )}
          {report.visualRegression.generatedImageUrl && (
            <div>
              <div className="text-xs text-muted-foreground mb-1">From skill</div>
              <img src={report.visualRegression.generatedImageUrl} alt="generated from skill" className="rounded border w-full aspect-square object-cover" />
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          {typeof report.visualRegression.identity_match === 'number' && <Badge className={scoreColor(report.visualRegression.identity_match)}>Identity: {report.visualRegression.identity_match}</Badge>}
          {typeof report.visualRegression.color_fidelity === 'number' && <Badge className={scoreColor(report.visualRegression.color_fidelity)}>Color: {report.visualRegression.color_fidelity}</Badge>}
          {typeof report.visualRegression.composition_match === 'number' && <Badge className={scoreColor(report.visualRegression.composition_match)}>Composition: {report.visualRegression.composition_match}</Badge>}
        </div>
        {report.visualRegression.verdict && <p className="text-sm text-muted-foreground">{report.visualRegression.verdict}</p>}
        {(report.visualRegression.drift_notes || []).length > 0 && (
          <ul className="text-xs ml-4 list-disc text-amber-700 dark:text-amber-300">
            {report.visualRegression.drift_notes!.map((d, i) => <li key={i}>{d}</li>)}
          </ul>
        )}
      </div>
    )}

    {(report.summary.consistentlyMissing.length > 0 || report.summary.recurringMisuses.length > 0) && (
      <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-sm space-y-2">
        <div className="flex items-center gap-2 font-medium text-amber-700 dark:text-amber-300">
          <AlertTriangle className="h-4 w-4" /> Cross-model findings
        </div>
        {report.summary.consistentlyMissing.length > 0 && (
          <div><span className="font-medium">Sections missed by ≥2 models:</span> {report.summary.consistentlyMissing.join(', ')}</div>
        )}
        {report.summary.recurringMisuses.length > 0 && (
          <div>
            <div className="font-medium">Top recurring misuses:</div>
            <ul className="ml-4 list-disc">
              {report.summary.recurringMisuses.slice(0, 5).map((m, i) => <li key={i}>({m.count}×) {m.misuse}</li>)}
            </ul>
          </div>
        )}
      </div>
    )}

    <Accordion type="multiple" className="w-full">
      {report.reports.map((rep) => (
        <AccordionItem key={rep.tier} value={rep.tier}>
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3 text-left">
              <span className="font-medium">{TIER_LABEL[rep.tier] || rep.tier}</span>
              <Badge variant="outline" className="text-xs">{rep.proxy}</Badge>
              <Badge className={scoreColor(rep.avgScore)}>{rep.avgScore}/100</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-3">
            {rep.results.map((res) => (
              <div key={res.section} className="rounded-md border p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {res.judge.section_used ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <AlertTriangle className="h-4 w-4 text-amber-500" />}
                    <span className="font-medium">{res.label}</span>
                  </div>
                  <Badge className={scoreColor(res.judge.score)}>{res.judge.score}/100</Badge>
                </div>
                {res.judge.summary && <p className="text-sm text-muted-foreground">{res.judge.summary}</p>}
                {res.judge.misuses.length > 0 && (
                  <div className="text-xs">
                    <div className="font-medium text-destructive">Misuses</div>
                    <ul className="ml-4 list-disc text-destructive/80">{res.judge.misuses.map((m, i) => <li key={i}>{m}</li>)}</ul>
                  </div>
                )}
                {res.judge.missing_info.length > 0 && (
                  <div className="text-xs">
                    <div className="font-medium">Missing info</div>
                    <ul className="ml-4 list-disc text-muted-foreground">{res.judge.missing_info.map((m, i) => <li key={i}>{m}</li>)}</ul>
                  </div>
                )}
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground">Model output</summary>
                  <pre className="mt-2 whitespace-pre-wrap rounded bg-muted p-2">{res.modelOutput}</pre>
                </details>
              </div>
            ))}
            {rep.errors.length > 0 && <div className="text-xs text-destructive">Errors: {rep.errors.join(', ')}</div>}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  </div>
);
