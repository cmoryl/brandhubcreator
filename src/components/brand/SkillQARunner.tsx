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
import { SkillCoverageMap } from './SkillCoverageMap';
import { SkillTokenOptimizer } from './SkillTokenOptimizer';
import { SkillQASchedulePanel } from './SkillQASchedulePanel';
import { SkillDiffViewer } from './SkillDiffViewer';
import { SkillPushHistoryPanel } from './SkillPushHistoryPanel';

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
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="current">Current run</TabsTrigger>
            <TabsTrigger value="coverage">Coverage</TabsTrigger>
            <TabsTrigger value="optimize">Optimize</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="chat" className="gap-1"><MessageSquare className="h-3.5 w-3.5" /> Ask</TabsTrigger>
            <TabsTrigger value="pushes" className="gap-1"><Send className="h-3.5 w-3.5" /> Pushes</TabsTrigger>
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

            {report && (
              <>
                <ReportView report={report} onDownload={() => download(report)} onRerun={run} />
                <AutofixPanel guide={guide} report={report} />
              </>
            )}
          </TabsContent>

          <TabsContent value="coverage"><SkillCoverageMap guide={guide} /></TabsContent>
          <TabsContent value="optimize"><SkillTokenOptimizer guide={guide} /></TabsContent>
          <TabsContent value="schedule"><SkillQASchedulePanel guide={guide} /></TabsContent>

          <TabsContent value="chat">
            <SkillChatPanel guide={guide} />
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

// ---------------- Auto-fix panel ----------------
const AutofixPanel = ({ guide, report }: { guide: AnyGuide; report: SkillQAReport }) => {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AutofixResult | null>(null);
  const [originals, setOriginals] = useState<Record<string, string>>({});
  const [downloading, setDownloading] = useState(false);
  const hasIssues = report.summary.recurringMisuses.length > 0 || report.summary.consistentlyMissing.length > 0;

  if (!hasIssues) return null;

  const propose = async () => {
    setBusy(true);
    try {
      const skill = await buildSkillContextFromGuide(guide);
      const r = await requestSkillAutofix(skill, report);
      setResult(r);
      // Build the unbundled skill once to source the "before" content for each patched file
      try {
        const { exportGuideAsClaudeSkill } = await import('@/lib/exportClaudeSkill');
        const { blob } = await exportGuideAsClaudeSkill(guide, { embedAssets: false, includeIntelligence: false, skipValidation: true });
        const JSZip = (await import('jszip')).default;
        const zip = await JSZip.loadAsync(blob);
        const root = Object.keys(zip.files)[0]?.split('/')[0] || '';
        const orig: Record<string, string> = {};
        for (const path of Object.keys(r.patches)) {
          const key = `${root}/${path}`;
          const f = zip.file(key);
          orig[path] = f ? await f.async('string') : '';
        }
        setOriginals(orig);
      } catch { /* diff will fall back to empty originals */ }
      toast.success(`AI proposed ${Object.keys(r.patches).length} patch${Object.keys(r.patches).length === 1 ? '' : 'es'}`);
    } catch (e: any) {
      toast.error(e?.message || 'Auto-fix failed');
    } finally {
      setBusy(false);
    }
  };

  const apply = async () => {
    if (!result) return;
    setDownloading(true);
    try {
      await downloadPatchedSkill(guide, result.patches);
      toast.success('Patched skill downloaded');
    } catch (e: any) {
      toast.error(e?.message || 'Download failed');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="rounded-md border p-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-medium text-sm">
          <Wand2 className="h-4 w-4 text-primary" /> Auto-fix suggestions
        </div>
        {!result && (
          <Button size="sm" onClick={propose} disabled={busy} className="gap-2">
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
            Propose patches
          </Button>
        )}
      </div>
      {result && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{result.rationale}</p>
          <div>
            <div className="text-xs font-medium mb-1">Files to update ({Object.keys(result.patches).length})</div>
            <ul className="text-xs ml-4 list-disc">
              {Object.keys(result.patches).map((p) => <li key={p}><code>{p}</code></li>)}
            </ul>
          </div>
          <Accordion type="multiple" className="w-full">
            {Object.entries(result.patches).map(([path, content]) => (
              <AccordionItem key={path} value={path}>
                <AccordionTrigger className="text-xs">{path}</AccordionTrigger>
                <AccordionContent>
                  <SkillDiffViewer original={originals[path] || ''} patched={content} path={path} />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={propose} disabled={busy}>Re-propose</Button>
            <Button size="sm" onClick={apply} disabled={downloading} className="gap-2">
              {downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              Download patched skill
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

// ---------------- Ask-the-skill chat ----------------
interface ChatMsg { role: 'user' | 'assistant'; content: string }

const SkillChatPanel = ({ guide }: { guide: AnyGuide }) => {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [skill, setSkill] = useState<{ skillMd: string; sections: Record<string, string> } | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    buildSkillContextFromGuide(guide).then((s) => { if (alive) setSkill(s); }).catch(() => {});
    return () => { alive = false; abortRef.current?.abort(); };
  }, [guide.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, streaming]);

  const send = async () => {
    const text = input.trim();
    if (!text || !skill || streaming) return;
    const next: ChatMsg[] = [...messages, { role: 'user', content: text }, { role: 'assistant', content: '' }];
    setMessages(next);
    setInput('');
    setStreaming(true);
    abortRef.current = new AbortController();
    try {
      let acc = '';
      for await (const chunk of streamSkillChat(skill, next.slice(0, -1), { signal: abortRef.current.signal })) {
        acc += chunk;
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: 'assistant', content: acc };
          return copy;
        });
      }
    } catch (e: any) {
      if (e?.name !== 'AbortError') toast.error(e?.message || 'Chat failed');
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const suggestions = [
    'Write a 240-char product announcement tweet.',
    'What HEX should I use for a CTA on a dark background?',
    'List 3 imagery directions that match this brand.',
    "Critique this copy: 'BUY NOW!!! 🚀 amazing deal'.",
  ];

  return (
    <div className="flex flex-col h-[60vh]">
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 p-1">
        {messages.length === 0 && (
          <div className="text-sm text-muted-foreground space-y-2 p-2">
            <p>Stress-test the skill before exporting. The assistant is constrained to ONLY use values from the exported SKILL.md.</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <Button key={s} variant="outline" size="sm" className="text-xs h-auto py-1" onClick={() => setInput(s)}>{s}</Button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
            <div className={`max-w-[85%] rounded-md px-3 py-2 text-sm whitespace-pre-wrap ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              {m.content || (streaming && i === messages.length - 1 ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : '')}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t pt-3 flex gap-2 items-end">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={skill ? 'Ask the skill anything…' : 'Loading skill context…'}
          disabled={!skill || streaming}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          className="min-h-[44px] max-h-32"
        />
        <Button onClick={send} disabled={!input.trim() || !skill || streaming} className="gap-2">
          {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
};
