/**
 * Model Audit Panel
 * Lists each edge function's active AI model(s) and flags deprecated names.
 * Data is generated at build time via scripts/scan, see src/data/edgeFunctionModels.json.
 */
import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { AlertTriangle, CheckCircle2, Search } from 'lucide-react';
import modelData from '@/data/edgeFunctionModels.json';

const DEPRECATED = new Set<string>([
  'google/gemini-2.5-flash-lite',
  'google/gemini-2.5-flash',
  'google/gemini-2.5-pro',
  'openai/gpt-4',
  'openai/gpt-4o',
  'openai/gpt-4o-mini',
  'openai/gpt-3.5-turbo',
]);

interface Entry {
  function: string;
  models: string[];
  deprecated: string[];
}

export const ModelAuditPanel = () => {
  const [query, setQuery] = useState('');

  const entries = modelData as Entry[];

  const { rows, deprecatedCount, totalModels } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? entries.filter(
          (e) =>
            e.function.toLowerCase().includes(q) ||
            e.models.some((m) => m.toLowerCase().includes(q)),
        )
      : entries;
    // Re-evaluate deprecated against current set in case JSON is stale
    const rows = filtered
      .map((e) => ({
        ...e,
        deprecated: e.models.filter((m) => DEPRECATED.has(m)),
      }))
      .sort((a, b) => b.deprecated.length - a.deprecated.length || a.function.localeCompare(b.function));
    const deprecatedCount = rows.filter((r) => r.deprecated.length > 0).length;
    const totalModels = new Set(entries.flatMap((e) => e.models)).size;
    return { rows, deprecatedCount, totalModels };
  }, [entries, query]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              AI Model Audit
              {deprecatedCount === 0 ? (
                <Badge variant="secondary" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" /> All current
                </Badge>
              ) : (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="h-3 w-3" /> {deprecatedCount} deprecated
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {entries.length} edge functions · {totalModels} unique models in use
            </CardDescription>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search function or model…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <div className="grid grid-cols-[1fr_2fr_auto] gap-4 px-4 py-2 border-b bg-muted/40 text-xs font-medium text-muted-foreground uppercase">
            <span>Edge Function</span>
            <span>Models</span>
            <span>Status</span>
          </div>
          <div className="divide-y max-h-[600px] overflow-y-auto">
            {rows.length === 0 && (
              <div className="px-4 py-8 text-sm text-center text-muted-foreground">
                No matches
              </div>
            )}
            {rows.map((row) => (
              <div
                key={row.function}
                className="grid grid-cols-[1fr_2fr_auto] gap-4 px-4 py-2.5 items-center text-sm"
              >
                <code className="font-mono text-xs truncate" title={row.function}>
                  {row.function}
                </code>
                <div className="flex flex-wrap gap-1.5">
                  {row.models.map((m) => {
                    const isDep = DEPRECATED.has(m);
                    return (
                      <Badge
                        key={m}
                        variant={isDep ? 'destructive' : 'outline'}
                        className="font-mono text-[10px]"
                      >
                        {m}
                      </Badge>
                    );
                  })}
                </div>
                <div className="text-right">
                  {row.deprecated.length > 0 ? (
                    <Badge variant="destructive" className="gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Update
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      OK
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Data generated from <code>supabase/functions/*</code> source. Re-run the scan after upgrading models.
        </p>
      </CardContent>
    </Card>
  );
};

export default ModelAuditPanel;
