import { useState } from 'react';
import { Sparkles, Loader2, Link2, Package, Beaker, ScanText, Globe, ShieldCheck, Fingerprint, Send, History, Settings2, Rocket } from 'lucide-react';
import { SkillQARunner } from './SkillQARunner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
  DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { downloadGuideAsClaudeSkill, ClaudeSkillValidationError } from '@/lib/exportClaudeSkill';
import { pushSkillToAnthropic } from '@/lib/skillAdvancedClient';
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
  // Advanced toggles persist across export modes
  const [includeLocales, setIncludeLocales] = useState(false);
  const [includeComplianceGuardrails, setIncludeCompliance] = useState(false);
  const [includeBrandDna, setIncludeBrandDna] = useState(false);
  const { trackDownload } = useDownloadTracking();

  const run = async (embedAssets: boolean, enrichWithPdfVision = false) => {
    if (busy) return;
    setBusy(true);
    setProgress(null);
    const toastId = toast.loading(
      enrichWithPdfVision
        ? 'Extracting identity from PDFs + exporting skill…'
        : embedAssets ? 'Bundling assets into Claude skill…' : 'Exporting Claude skill…'
    );
    try {
      const { bundled, failed } = await downloadGuideAsClaudeSkill(guide, {
        embedAssets,
        enrichWithPdfVision,
        includeLocales,
        includeComplianceGuardrails,
        includeBrandDna,
        recordHistory: true,
        exportedTo: ['download'],
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
          locales: includeLocales,
          compliance: includeComplianceGuardrails,
          brand_dna: includeBrandDna,
        },
        organizationId: (guide as any).organizationId || undefined,
      });
      const detail = embedAssets
        ? ` (${bundled} asset${bundled === 1 ? '' : 's'} bundled${failed ? `, ${failed} failed` : ''})`
        : '';
      toast.success(`Exported Claude skill for ${guide.hero?.name || 'guide'}${detail}`, { id: toastId });
    } catch (e) {
      console.error(e);
      if (e instanceof ClaudeSkillValidationError) {
        const errs = e.issues.filter(i => i.severity === 'error');
        toast.error(`Export blocked: ${errs.length} validation error${errs.length === 1 ? '' : 's'}`, {
          id: toastId,
          description: errs.slice(0, 3).map(i => `• ${i.path ? `${i.path}: ` : ''}${i.message}`).join('\n'),
          duration: 12000,
        });
      } else {
        toast.error('Failed to export Claude skill', { id: toastId });
      }
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  const pushToClaude = async () => {
    if (busy) return;
    setBusy(true);
    const toastId = toast.loading('Uploading skill to Claude…');
    try {
      const res = await pushSkillToAnthropic(guide);
      if (!res.ok) {
        toast.error(res.error || 'Push failed', {
          id: toastId,
          description: res.hint || (res.status ? `Status ${res.status}` : undefined),
          duration: 12000,
        });
      } else {
        toast.success('Skill pushed to Claude', { id: toastId });
      }
    } catch (e: any) {
      toast.error(e?.message || 'Push failed', { id: toastId });
    } finally {
      setBusy(false);
    }
  };

  const buildAndPush = async () => {
    if (busy) return;
    setBusy(true);
    setProgress(null);
    const toastId = toast.loading('Building skill & pushing to Claude…');
    try {
      const res = await pushSkillToAnthropic(guide, { recordHistory: true });
      if (!res.ok) {
        toast.error(res.error || 'Push failed', {
          id: toastId,
          description: res.hint || (res.status ? `Status ${res.status}` : undefined),
          duration: 12000,
        });
      } else {
        toast.success('Built & pushed to Claude', {
          id: toastId,
          description: 'See the Pushes tab for full history.',
        });
      }
    } catch (e: any) {
      if (e instanceof ClaudeSkillValidationError) {
        const errs = e.issues.filter(i => i.severity === 'error');
        toast.error(`Build blocked: ${errs.length} validation error${errs.length === 1 ? '' : 's'}`, {
          id: toastId,
          description: errs.slice(0, 3).map(i => `• ${i.path ? `${i.path}: ` : ''}${i.message}`).join('\n'),
          duration: 12000,
        });
      } else {
        toast.error(e?.message || 'Build & push failed', { id: toastId });
      }
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
            <Link2 className="h-4 w-4 mr-2" /> Links only (fast)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => { e.preventDefault(); run(true); }}>
            <Package className="h-4 w-4 mr-2" /> Bundle assets (slower)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => { e.preventDefault(); pushToClaude(); }}>
            <Send className="h-4 w-4 mr-2" /> Push to Claude
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
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>Export Claude Skill</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={buildAndPush} disabled={busy} className="bg-primary/5 focus:bg-primary/10">
          <Rocket className="h-4 w-4 mr-2 text-primary" />
          <div className="flex flex-col">
            <span className="font-medium">Build &amp; push to Claude</span>
            <span className="text-xs text-muted-foreground">One-click: validate → build → upload → record.</span>
          </div>
        </DropdownMenuItem>
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
        <DropdownMenuItem onClick={() => run(true, true)} disabled={busy}>
          <ScanText className="h-4 w-4 mr-2" />
          <div className="flex flex-col">
            <span>Bundle + extract from PDFs</span>
            <span className="text-xs text-muted-foreground">Vision-extracts identity from brand PDFs.</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="flex items-center gap-2 text-xs">
          <Settings2 className="h-3.5 w-3.5" /> Advanced options
        </DropdownMenuLabel>
        <DropdownMenuCheckboxItem checked={includeLocales} onCheckedChange={(v) => setIncludeLocales(!!v)} onSelect={(e) => e.preventDefault()}>
          <Globe className="h-4 w-4 mr-2" /> Include locales (GlobalLink)
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked={includeComplianceGuardrails} onCheckedChange={(v) => setIncludeCompliance(!!v)} onSelect={(e) => e.preventDefault()}>
          <ShieldCheck className="h-4 w-4 mr-2" /> Compliance &amp; cultural guardrails
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked={includeBrandDna} onCheckedChange={(v) => setIncludeBrandDna(!!v)} onSelect={(e) => e.preventDefault()}>
          <Fingerprint className="h-4 w-4 mr-2" /> Brand DNA anti-patterns
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={pushToClaude} disabled={busy}>
          <Send className="h-4 w-4 mr-2" />
          <div className="flex flex-col">
            <span>Push to Claude</span>
            <span className="text-xs text-muted-foreground">Upload via Anthropic Skills API.</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <SkillQARunner
          guide={guide}
          trigger={
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <Beaker className="h-4 w-4 mr-2" />
              <div className="flex flex-col">
                <span>Test, optimize &amp; schedule</span>
                <span className="text-xs text-muted-foreground">QA, coverage, history, schedules.</span>
              </div>
            </DropdownMenuItem>
          }
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
