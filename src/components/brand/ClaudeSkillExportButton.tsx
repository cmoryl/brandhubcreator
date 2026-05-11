import { useState } from 'react';
import { Sparkles, Loader2, Link2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { downloadGuideAsClaudeSkill } from '@/lib/exportClaudeSkill';
import { ClaudeSkillValidationError } from '@/lib/exportClaudeSkill';
import { useDownloadTracking } from '@/hooks/useDownloadTracking';
import type { BrandGuide, ProductGuide } from '@/types/brand';
import type { EventGuide } from '@/types/event';

type AnyGuide = BrandGuide | ProductGuide | EventGuide;

interface Props {
  guide: AnyGuide;
  variant?: 'button' | 'dropdown-item';
}

export const ClaudeSkillExportButton = ({ guide, variant = 'button' }: Props) => {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const { trackDownload } = useDownloadTracking();

  const run = async (embedAssets: boolean) => {
    if (busy) return;
    setBusy(true);
    setProgress(null);
    const toastId = toast.loading(
      embedAssets ? 'Bundling assets into Claude skill…' : 'Exporting Claude skill…'
    );
    try {
      const { bundled, failed } = await downloadGuideAsClaudeSkill(guide, {
        embedAssets,
        onProgress: (done, total) => setProgress({ done, total }),
      });
      trackDownload({
        entityId: guide.id,
        entityType: (guide as any).type || 'brand',
        entityName: guide.hero?.name || 'Guide',
        details: {
          download_type: 'zip',
          format: embedAssets ? 'claude-skill-bundled' : 'claude-skill',
          source_section: 'claude_skill_export',
          item_count: bundled,
        },
        organizationId: (guide as any).organizationId || undefined,
      });
      const detail = embedAssets
        ? ` (${bundled} asset${bundled === 1 ? '' : 's'} bundled${failed ? `, ${failed} failed` : ''})`
        : '';
      toast.success(`Exported Claude skill for ${guide.hero?.name || 'guide'}${detail}`, { id: toastId });
    } catch (e) {
      console.error(e);
      toast.error('Failed to export Claude skill', { id: toastId });
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  const label = busy
    ? progress
      ? `Bundling… ${progress.done}/${progress.total}`
      : 'Exporting…'
    : 'Claude Skill';

  if (variant === 'dropdown-item') {
    return (
      <DropdownMenuSub>
        <DropdownMenuSubTrigger disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
          Export Claude Skill
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuItem onClick={(e) => { e.preventDefault(); run(false); }}>
            <Link2 className="h-4 w-4 mr-2" />
            Links only (fast)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => { e.preventDefault(); run(true); }}>
            <Package className="h-4 w-4 mr-2" />
            Bundle assets (slower)
          </DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2" disabled={busy} aria-label="Export Claude skill">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Export Claude Skill</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => run(false)} disabled={busy}>
          <Link2 className="h-4 w-4 mr-2" />
          <div className="flex flex-col">
            <span>Links only</span>
            <span className="text-xs text-muted-foreground">Fast. Asset URLs in markdown.</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => run(true)} disabled={busy}>
          <Package className="h-4 w-4 mr-2" />
          <div className="flex flex-col">
            <span>Bundle assets</span>
            <span className="text-xs text-muted-foreground">Embed images, fonts &amp; docs.</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
