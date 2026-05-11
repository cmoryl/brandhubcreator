import { useState } from 'react';
import { Loader2, Gauge, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { optimizeSkillTokens, type OptimizerResult } from '@/lib/skillAdvancedClient';
import type { BrandGuide, ProductGuide } from '@/types/brand';
import type { EventGuide } from '@/types/event';

type AnyGuide = BrandGuide | ProductGuide | EventGuide;

export const SkillTokenOptimizer = ({ guide }: { guide: AnyGuide }) => {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<OptimizerResult | null>(null);

  const run = async () => {
    setBusy(true);
    try { setResult(await optimizeSkillTokens(guide, 60_000)); toast.success('Token analysis complete'); }
    catch (e: any) { toast.error(e?.message || 'Optimizer failed'); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium"><Gauge className="h-4 w-4" /> Token-budget optimizer</div>
        <Button size="sm" onClick={run} disabled={busy} className="gap-2">{busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />} Analyze</Button>
      </div>
      {result && (
        <>
          <div className="rounded-md border p-3 space-y-2 text-sm">
            <div className="flex justify-between"><span>Total tokens</span><span className="font-mono">{result.totals.total.toLocaleString()}</span></div>
            <div className="flex justify-between"><span>Target</span><span className="font-mono">{result.totals.target.toLocaleString()}</span></div>
            <div className="flex justify-between"><span>Projected after suggestions</span><span className="font-mono">{result.totals.projectedTotal.toLocaleString()}</span></div>
            <Progress value={Math.min(100, (result.totals.total / result.totals.target) * 100)} />
          </div>
          <div className="space-y-2">
            <div className="text-xs font-medium">Largest files</div>
            {result.perFile.slice(0, 6).map((f) => (
              <div key={f.path} className="flex justify-between text-xs"><code className="truncate max-w-[60%]">{f.path}</code><span>{f.tokens.toLocaleString()}t</span></div>
            ))}
          </div>
          {result.suggestions.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-medium">Suggestions</div>
              {result.suggestions.map((s) => (
                <div key={s.path} className="rounded-md border p-2 text-xs space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <code className="truncate">{s.path}</code>
                    <Badge variant="outline" className="text-[10px]">{s.action}</Badge>
                    <span className="text-emerald-600">−{s.estSavings.toLocaleString()}t</span>
                  </div>
                  <p className="text-muted-foreground">{s.rationale}</p>
                  {s.condensedSummary && <pre className="bg-muted rounded p-2 whitespace-pre-wrap">{s.condensedSummary}</pre>}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
