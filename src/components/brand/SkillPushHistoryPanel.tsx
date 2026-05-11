import { useEffect, useState } from 'react';
import { Send, CheckCircle2, XCircle, Loader2, RefreshCw, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { fetchExportHistory, pushSkillToAnthropic, type ExportHistoryRow } from '@/lib/skillAdvancedClient';
import type { BrandGuide, ProductGuide } from '@/types/brand';
import type { EventGuide } from '@/types/event';

type AnyGuide = BrandGuide | ProductGuide | EventGuide;

export const SkillPushHistoryPanel = ({ guide }: { guide: AnyGuide }) => {
  const [rows, setRows] = useState<ExportHistoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [pushing, setPushing] = useState(false);
  const kind = ((guide as any).type || 'brand') as 'brand' | 'product' | 'event';

  const load = async () => {
    setLoading(true);
    try { setRows(await fetchExportHistory(kind, guide.id, 25)); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [guide.id]);

  const push = async () => {
    if (pushing) return;
    setPushing(true);
    const t = toast.loading('Pushing latest skill to Claude…');
    try {
      const r = await pushSkillToAnthropic(guide);
      if (r.ok) toast.success('Pushed to Claude', { id: t });
      else toast.error(r.error || 'Push failed', { id: t, description: r.hint });
      await load();
    } catch (e: any) {
      toast.error(e?.message || 'Push failed', { id: t });
    } finally { setPushing(false); }
  };

  const lastSuccess = rows.find((r) => r.pushed_to_claude);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 rounded-md border p-3">
        <div className="text-sm">
          <div className="font-medium flex items-center gap-2">
            <Send className="h-4 w-4" /> Last successful push
          </div>
          {lastSuccess ? (
            <div className="text-xs text-muted-foreground mt-1">
              v{lastSuccess.version} • {new Date(lastSuccess.pushed_at || lastSuccess.created_at).toLocaleString()}
              {lastSuccess.anthropic_skill_id && <> • <code className="text-[10px]">{lastSuccess.anthropic_skill_id}</code></>}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground mt-1">No successful push yet.</div>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button size="sm" onClick={push} disabled={pushing} className="gap-1">
            {pushing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Push current build
          </Button>
        </div>
      </div>

      {rows.length === 0 && !loading && (
        <p className="text-sm text-muted-foreground p-4 text-center">No exports recorded yet.</p>
      )}

      {rows.map((r) => {
        const status = r.push_status || (r.pushed_to_claude ? 'success' : null);
        return (
          <div key={r.id} className="rounded-md border p-3 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">v{r.version}</span>
                {r.prev_version && <span className="text-xs text-muted-foreground">← v{r.prev_version}</span>}
                <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span>
              </div>
              {status === 'success' && (
                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Pushed
                </Badge>
              )}
              {status === 'failed' && (
                <Badge variant="destructive" className="gap-1">
                  <XCircle className="h-3 w-3" /> Failed{r.push_http_status ? ` (${r.push_http_status})` : ''}
                </Badge>
              )}
              {!status && (
                <Badge variant="outline" className="text-xs">Not pushed</Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-1 text-[11px] text-muted-foreground">
              {r.approx_tokens != null && <span>~{r.approx_tokens.toLocaleString()} tokens</span>}
              {r.file_count != null && <span>• {r.file_count} files</span>}
              {(r.exported_to || []).map((e) => <span key={e}>• {e}</span>)}
              {r.pushed_at && <span>• pushed {new Date(r.pushed_at).toLocaleString()}</span>}
            </div>
            {r.push_error && (
              <div className="text-xs text-destructive bg-destructive/5 rounded px-2 py-1 mt-1">{r.push_error}</div>
            )}
            {r.changelog && (
              <pre className="text-[11px] text-muted-foreground whitespace-pre-wrap mt-1 line-clamp-3">{r.changelog}</pre>
            )}
          </div>
        );
      })}
    </div>
  );
};
