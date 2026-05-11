import { useState } from 'react';
import { GitMerge } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface DiffLine { type: 'add' | 'del' | 'ctx'; text: string }

function diff(a: string, b: string): DiffLine[] {
  const A = a.split('\n'); const B = b.split('\n');
  // Simple LCS-based diff for short markdown — fine for skill files
  const m = A.length, n = B.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) for (let j = n - 1; j >= 0; j--) {
    dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  }
  const out: DiffLine[] = []; let i = 0, j = 0;
  while (i < m && j < n) {
    if (A[i] === B[j]) { out.push({ type: 'ctx', text: A[i] }); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { out.push({ type: 'del', text: A[i++] }); }
    else { out.push({ type: 'add', text: B[j++] }); }
  }
  while (i < m) out.push({ type: 'del', text: A[i++] });
  while (j < n) out.push({ type: 'add', text: B[j++] });
  return out;
}

export const SkillDiffViewer = ({ original, patched, path }: { original: string; patched: string; path: string }) => {
  const [view, setView] = useState<'unified' | 'split'>('unified');
  const lines = diff(original || '', patched || '');
  const adds = lines.filter((l) => l.type === 'add').length;
  const dels = lines.filter((l) => l.type === 'del').length;
  return (
    <div className="rounded-md border">
      <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/40 text-xs">
        <div className="flex items-center gap-2"><GitMerge className="h-3.5 w-3.5" /> <code>{path}</code></div>
        <div className="flex items-center gap-2">
          <span className="text-emerald-600">+{adds}</span>
          <span className="text-destructive">−{dels}</span>
          <Tabs value={view} onValueChange={(v) => setView(v as any)}>
            <TabsList className="h-7">
              <TabsTrigger value="unified" className="h-6 text-xs">Unified</TabsTrigger>
              <TabsTrigger value="split" className="h-6 text-xs">Split</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      {view === 'unified' ? (
        <pre className="text-xs font-mono max-h-72 overflow-auto p-2 leading-relaxed">
          {lines.map((l, i) => (
            <div key={i} className={l.type === 'add' ? 'bg-emerald-500/10' : l.type === 'del' ? 'bg-destructive/10' : ''}>
              <span className="select-none opacity-50 mr-2">{l.type === 'add' ? '+' : l.type === 'del' ? '−' : ' '}</span>
              {l.text || '\u00A0'}
            </div>
          ))}
        </pre>
      ) : (
        <div className="grid grid-cols-2 text-xs font-mono max-h-72 overflow-auto">
          <div className="border-r p-2">{lines.filter((l) => l.type !== 'add').map((l, i) => (<div key={i} className={l.type === 'del' ? 'bg-destructive/10' : ''}>{l.text || '\u00A0'}</div>))}</div>
          <div className="p-2">{lines.filter((l) => l.type !== 'del').map((l, i) => (<div key={i} className={l.type === 'add' ? 'bg-emerald-500/10' : ''}>{l.text || '\u00A0'}</div>))}</div>
        </div>
      )}
    </div>
  );
};
