import { useEffect, useState } from 'react';
import { Loader2, Map as MapIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { computeCoverage, coverageScore, type CoverageRow } from '@/lib/skillCoverageMap';
import type { BrandGuide, ProductGuide } from '@/types/brand';
import type { EventGuide } from '@/types/event';

type AnyGuide = BrandGuide | ProductGuide | EventGuide;

const STATUS_CLASS: Record<string, string> = {
  full: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  partial: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
  missing: 'bg-destructive/15 text-destructive border-destructive/30',
  na: 'bg-muted text-muted-foreground border-border',
};

export const SkillCoverageMap = ({ guide }: { guide: AnyGuide }) => {
  const [rows, setRows] = useState<CoverageRow[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const mod = await import('@/lib/exportClaudeSkill');
        const { blob } = await mod.exportGuideAsClaudeSkill(guide, { embedAssets: false, includeIntelligence: false, skipValidation: true });
        const JSZip = (await import('jszip')).default;
        const zip = await JSZip.loadAsync(blob);
        const folder = Object.keys(zip.files).find((p) => p.endsWith('/SKILL.md'))?.split('/')[0];
        const rootZ = folder ? zip.folder(folder)! : zip;
        const skillMd = (await rootZ.file('SKILL.md')?.async('string')) || '';
        const refs: Record<string, string> = {};
        const filenames = ['references/overview.md', 'references/colors.md', 'references/typography.md', 'references/logos.md', 'references/voice-and-messaging.md', 'references/imagery.md', 'references/assets.md', 'references/anti-patterns.md'];
        for (const p of filenames) refs[p] = (await rootZ.file(p)?.async('string')) || '';
        if (!alive) return;
        setRows(computeCoverage(guide, { skillMd, references: refs }));
      } finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, [guide.id]);

  if (loading || !rows) return <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Computing coverage…</div>;
  const score = coverageScore(rows);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium"><MapIcon className="h-4 w-4" /> Section coverage</div>
        <Badge className={score >= 80 ? STATUS_CLASS.full : score >= 60 ? STATUS_CLASS.partial : STATUS_CLASS.missing}>Coverage: {score}/100</Badge>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {rows.map((r) => (
          <div key={r.section} className={`rounded-md border px-3 py-2 text-xs ${STATUS_CLASS[r.status]}`} title={r.hint}>
            <div className="font-medium">{r.label}</div>
            <div className="opacity-80 mt-0.5">
              {r.status === 'na' ? 'no data in guide' : r.status === 'full' ? `inline + ${r.refTokens}t ref` : r.status === 'partial' ? `${r.refTokens}t ref only` : `${r.guideCount} item(s) in guide`}
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">Green = inline in SKILL.md AND in a reference file. Amber = reference only. Red = guide has data but it never made it into the skill.</p>
    </div>
  );
};
