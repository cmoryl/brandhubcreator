/**
 * AI Activity Panel
 *
 * Live telemetry of every Lovable AI Gateway call routed through the shared
 * `_shared/aiGateway.ts` helper. Reads from `ai_call_log` (admin-only RLS).
 *
 * Surfaces: call volume by function, error rate (429/402/gateway), p50/p95
 * latency, and a recent-calls table for triage.
 */
import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle, Activity, Clock, Coins } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

interface CallRow {
  id: string;
  created_at: string;
  function_name: string;
  purpose: string | null;
  model: string;
  status_code: number;
  error_code: string | null;
  duration_ms: number | null;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  total_tokens: number | null;
  organization_id: string | null;
}

const RANGES = [
  { label: '1h', hours: 1 },
  { label: '24h', hours: 24 },
  { label: '7d', hours: 24 * 7 },
] as const;

export function AIActivityPanel() {
  const [rangeHours, setRangeHours] = useState<number>(24);
  const [rows, setRows] = useState<CallRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    const since = new Date(Date.now() - rangeHours * 3600 * 1000).toISOString();
    const { data, error } = await supabase
      .from('ai_call_log' as any)
      .select('*')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(500);
    if (error) {
      setError(error.message);
      setRows([]);
    } else {
      setRows((data ?? []) as unknown as CallRow[]);
    }
    setLoading(false);
  };

  useEffect(() => { void load(); /* eslint-disable-next-line */ }, [rangeHours]);

  const stats = useMemo(() => {
    if (!rows?.length) return null;
    const total = rows.length;
    const errors = rows.filter((r) => r.error_code).length;
    const rateLimited = rows.filter((r) => r.error_code === 'rate_limited').length;
    const paymentRequired = rows.filter((r) => r.error_code === 'payment_required').length;
    const tokens = rows.reduce((s, r) => s + (r.total_tokens ?? 0), 0);
    const durations = rows.map((r) => r.duration_ms ?? 0).filter((n) => n > 0).sort((a, b) => a - b);
    const p = (q: number) => durations.length ? durations[Math.min(durations.length - 1, Math.floor(durations.length * q))] : 0;
    const byFn = new Map<string, number>();
    rows.forEach((r) => byFn.set(r.function_name, (byFn.get(r.function_name) ?? 0) + 1));
    const byModel = new Map<string, number>();
    rows.forEach((r) => byModel.set(r.model, (byModel.get(r.model) ?? 0) + 1));
    return {
      total, errors, rateLimited, paymentRequired, tokens,
      p50: p(0.5), p95: p(0.95),
      byFn: Array.from(byFn.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8),
      byModel: Array.from(byModel.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8),
    };
  }, [rows]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {RANGES.map((r) => (
            <Button
              key={r.label}
              size="sm"
              variant={rangeHours === r.hours ? 'default' : 'outline'}
              onClick={() => setRangeHours(r.hours)}
            >
              {r.label}
            </Button>
          ))}
        </div>
        <Button size="sm" variant="ghost" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      {error && (
        <Card className="border-destructive/40">
          <CardContent className="py-4 text-sm text-destructive flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> {error}
          </CardContent>
        </Card>
      )}

      {loading && !rows ? (
        <div className="grid gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : !rows?.length ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No AI gateway calls recorded in this window. Telemetry begins after migrating a function to the shared helper.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-4">
            <StatCard icon={<Activity className="h-4 w-4" />} label="Total calls" value={stats!.total.toLocaleString()} />
            <StatCard
              icon={<AlertTriangle className="h-4 w-4" />}
              label="Errors"
              value={`${stats!.errors} (${((stats!.errors / stats!.total) * 100).toFixed(1)}%)`}
              tone={stats!.errors ? 'warn' : 'ok'}
              sub={stats!.rateLimited || stats!.paymentRequired ? `${stats!.rateLimited} rate-limited · ${stats!.paymentRequired} payment` : undefined}
            />
            <StatCard icon={<Clock className="h-4 w-4" />} label="Latency p50 / p95" value={`${stats!.p50} / ${stats!.p95} ms`} />
            <StatCard icon={<Coins className="h-4 w-4" />} label="Tokens used" value={stats!.tokens.toLocaleString()} />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Top functions</CardTitle></CardHeader>
              <CardContent className="space-y-1.5">
                {stats!.byFn.map(([name, n]) => (
                  <div key={name} className="flex items-center justify-between text-xs">
                    <span className="font-mono truncate">{name}</span>
                    <Badge variant="secondary">{n}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Models</CardTitle></CardHeader>
              <CardContent className="space-y-1.5">
                {stats!.byModel.map(([name, n]) => (
                  <div key={name} className="flex items-center justify-between text-xs">
                    <span className="font-mono truncate">{name}</span>
                    <Badge variant="secondary">{n}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Recent calls</CardTitle></CardHeader>
            <CardContent className="p-0 overflow-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/40">
                  <tr className="text-left">
                    <th className="px-3 py-2 font-medium">When</th>
                    <th className="px-3 py-2 font-medium">Function</th>
                    <th className="px-3 py-2 font-medium">Model</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium">Duration</th>
                    <th className="px-3 py-2 font-medium">Tokens</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 50).map((r) => (
                    <tr key={r.id} className="border-t border-border/40">
                      <td className="px-3 py-1.5 text-muted-foreground">{formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}</td>
                      <td className="px-3 py-1.5 font-mono">{r.function_name}{r.purpose ? <span className="text-muted-foreground"> · {r.purpose}</span> : null}</td>
                      <td className="px-3 py-1.5 font-mono text-muted-foreground">{r.model}</td>
                      <td className="px-3 py-1.5">
                        {r.error_code ? (
                          <Badge variant="destructive" className="text-[10px]">{r.error_code}</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">{r.status_code}</Badge>
                        )}
                      </td>
                      <td className="px-3 py-1.5">{r.duration_ms ?? '—'} ms</td>
                      <td className="px-3 py-1.5 text-muted-foreground">{r.total_tokens ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function StatCard({
  icon, label, value, sub, tone = 'neutral',
}: { icon: React.ReactNode; label: string; value: string; sub?: string; tone?: 'neutral' | 'ok' | 'warn' }) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
          {icon} {label}
        </div>
        <div className={`text-2xl font-semibold ${tone === 'warn' ? 'text-destructive' : ''}`}>{value}</div>
        {sub && <div className="text-[11px] text-muted-foreground mt-1">{sub}</div>}
      </CardContent>
    </Card>
  );
}
