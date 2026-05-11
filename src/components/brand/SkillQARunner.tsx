import { useState } from 'react';
import { Beaker, Loader2, Download, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { toast } from 'sonner';
import { runSkillQA, reportToMarkdown, type SkillQAReport } from '@/lib/skillQAClient';
import type { BrandGuide, ProductGuide } from '@/types/brand';
import type { EventGuide } from '@/types/event';

type AnyGuide = BrandGuide | ProductGuide | EventGuide;

interface Props {
  guide: AnyGuide;
  trigger?: React.ReactNode;
}

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
  const [report, setReport] = useState<SkillQAReport | null>(null);

  const run = async () => {
    setRunning(true);
    setReport(null);
    const toastId = toast.loading('Running skill against 3 model tiers… (~30–60s)');
    try {
      const r = await runSkillQA(guide);
      setReport(r);
      toast.success('Skill QA complete', { id: toastId });
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Skill QA failed', { id: toastId });
    } finally {
      setRunning(false);
    }
  };

  const download = () => {
    if (!report) return;
    const md = reportToMarkdown(report);
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `skill-qa-${report.brandName.toLowerCase().replace(/\s+/g, '-')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o && !report) run(); }}>
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
            <Beaker className="h-5 w-5" />
            Skill QA — {guide.hero?.name}
          </DialogTitle>
        </DialogHeader>

        {running && (
          <div className="flex items-center gap-3 p-6 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Running 3 models × 6 sections + judging…
          </div>
        )}

        {!running && !report && (
          <div className="p-6 text-center text-sm text-muted-foreground">
            <Button onClick={run}>Run QA now</Button>
          </div>
        )}

        {report && (
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
                <Button size="sm" variant="outline" onClick={run} disabled={running}>Re-run</Button>
                <Button size="sm" variant="outline" onClick={download} className="gap-2">
                  <Download className="h-3.5 w-3.5" /> Markdown
                </Button>
              </div>
            </div>

            {(report.summary.consistentlyMissing.length > 0 || report.summary.recurringMisuses.length > 0) && (
              <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-sm space-y-2">
                <div className="flex items-center gap-2 font-medium text-amber-700 dark:text-amber-300">
                  <AlertTriangle className="h-4 w-4" /> Cross-model findings
                </div>
                {report.summary.consistentlyMissing.length > 0 && (
                  <div>
                    <span className="font-medium">Sections missed by ≥2 models:</span>{' '}
                    {report.summary.consistentlyMissing.join(', ')}
                  </div>
                )}
                {report.summary.recurringMisuses.length > 0 && (
                  <div>
                    <div className="font-medium">Top recurring misuses:</div>
                    <ul className="ml-4 list-disc">
                      {report.summary.recurringMisuses.slice(0, 5).map((m, i) => (
                        <li key={i}>({m.count}×) {m.misuse}</li>
                      ))}
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
                            {res.judge.section_used ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-amber-500" />
                            )}
                            <span className="font-medium">{res.label}</span>
                          </div>
                          <Badge className={scoreColor(res.judge.score)}>{res.judge.score}/100</Badge>
                        </div>
                        {res.judge.summary && (
                          <p className="text-sm text-muted-foreground">{res.judge.summary}</p>
                        )}
                        {res.judge.misuses.length > 0 && (
                          <div className="text-xs">
                            <div className="font-medium text-destructive">Misuses</div>
                            <ul className="ml-4 list-disc text-destructive/80">
                              {res.judge.misuses.map((m, i) => <li key={i}>{m}</li>)}
                            </ul>
                          </div>
                        )}
                        {res.judge.missing_info.length > 0 && (
                          <div className="text-xs">
                            <div className="font-medium">Missing info</div>
                            <ul className="ml-4 list-disc text-muted-foreground">
                              {res.judge.missing_info.map((m, i) => <li key={i}>{m}</li>)}
                            </ul>
                          </div>
                        )}
                        <details className="text-xs">
                          <summary className="cursor-pointer text-muted-foreground">Model output</summary>
                          <pre className="mt-2 whitespace-pre-wrap rounded bg-muted p-2">{res.modelOutput}</pre>
                        </details>
                      </div>
                    ))}
                    {rep.errors.length > 0 && (
                      <div className="text-xs text-destructive">Errors: {rep.errors.join(', ')}</div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
