import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { downloadGuideAsClaudeSkill } from '@/lib/exportClaudeSkill';
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
  const { trackDownload } = useDownloadTracking();

  const handle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await downloadGuideAsClaudeSkill(guide);
      trackDownload({
        entityId: guide.id,
        entityType: (guide as any).type || 'brand',
        entityName: guide.hero?.name || 'Guide',
        details: {
          download_type: 'zip',
          format: 'claude-skill',
          source_section: 'claude_skill_export',
        },
        organizationId: (guide as any).organizationId || undefined,
      });
      toast.success(`Exported Claude skill for ${guide.hero?.name || 'guide'}`);
    } catch (e) {
      console.error(e);
      toast.error('Failed to export Claude skill');
    } finally {
      setBusy(false);
    }
  };

  if (variant === 'dropdown-item') {
    return (
      <DropdownMenuItem onClick={(e) => { e.preventDefault(); handle(); }} disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
        Export Claude Skill
      </DropdownMenuItem>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2" onClick={handle} disabled={busy} aria-label="Export Claude skill">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Claude Skill
        </Button>
      </TooltipTrigger>
      <TooltipContent>Download a Claude-compatible skill folder (.zip)</TooltipContent>
    </Tooltip>
  );
};
