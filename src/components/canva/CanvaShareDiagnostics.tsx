import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Copy, ExternalLink, ShieldQuestion, Eye, Pencil, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { parseCanvaUrl } from '@/lib/canvaUtils';
import { toast } from 'sonner';

export interface ShareCheck {
  key: string;
  label: string;
  level: 'ok' | 'warn' | 'info';
  message: string;
  fix?: string;
}

/**
 * Client-side heuristic diagnostics for a Canva share URL.
 * Canva has no public "read share ACL" API, so we inspect the URL
 * shape (view vs edit, brand-template paths, share tokens, folder
 * hints) and surface the common blockers we've seen in the field.
 */
export function analyzeCanvaShareUrl(rawUrl: string | undefined): {
  isCanva: boolean;
  designId: string | null;
  mode: 'view' | 'edit' | 'watch' | 'unknown';
  editUrl: string | null;
  viewUrl: string | null;
  checks: ShareCheck[];
} {
  const info = parseCanvaUrl(rawUrl);
  if (!info.isCanva || !rawUrl) {
    return { isCanva: false, designId: null, mode: 'unknown', editUrl: null, viewUrl: null, checks: [] };
  }

  const lower = rawUrl.toLowerCase();
  const mode: 'view' | 'edit' | 'watch' | 'unknown' =
    /\/view(\b|\/|\?|#)/.test(lower) ? 'view'
    : /\/watch(\b|\/|\?|#)/.test(lower) ? 'watch'
    : /\/edit(\b|\/|\?|#)/.test(lower) ? 'edit'
    : 'unknown';

  const editUrl = info.designId ? rawUrl.replace(/\/(view|watch)(\b|\/|\?|#)/, '/edit$2') : null;
  const viewUrl = info.designId ? rawUrl.replace(/\/(edit|watch)(\b|\/|\?|#)/, '/view$2') : null;

  const hasShareToken = /[?&]utm_content=/.test(lower) || /[?&]share=/.test(lower) || /[?&]token=/.test(lower);
  const looksBrandTemplate = /\/brand\/(templates|template)\//.test(lower) || /\/templates\//.test(lower);
  const looksFolderScoped = /\/folder\//.test(lower) || /brand\/folders/.test(lower);
  const isShortlink = /canva\.link|canva\.me/.test(lower);

  const checks: ShareCheck[] = [];

  checks.push({
    key: 'design-id',
    label: 'Design ID detected',
    level: info.designId ? 'ok' : 'warn',
    message: info.designId ? `ID: ${info.designId}` : 'Could not parse a Canva design ID from this URL.',
    fix: info.designId ? undefined : 'Make sure the link is a real Canva design URL (contains /design/DAF…).',
  });

  checks.push({
    key: 'mode',
    label: 'Link opens in edit mode',
    level: mode === 'edit' ? 'ok' : mode === 'view' ? 'warn' : 'info',
    message:
      mode === 'edit'
        ? 'URL ends in /edit — signed-in teammates with edit access will open the editor.'
        : mode === 'view'
          ? 'URL ends in /view — this is a view-only link. Users cannot edit even if the design allows it.'
          : mode === 'watch'
            ? 'URL is a /watch (video preview) link — recipients cannot edit from this URL.'
            : 'Could not determine the link mode. Canva may treat it as view-only.',
    fix: mode !== 'edit' ? 'Swap /view or /watch → /edit in the URL, or re-copy the "Edit" link from Canva\'s Share menu.' : undefined,
  });

  checks.push({
    key: 'template',
    label: 'Not a Brand Template link',
    level: looksBrandTemplate ? 'warn' : 'ok',
    message: looksBrandTemplate
      ? 'This looks like a Brand Template URL. Canva forces sign-in and blocks anonymous edits on brand templates.'
      : 'URL does not point at a brand template.',
    fix: looksBrandTemplate
      ? 'Publish the template as a regular design (File → Make a copy) and share that copy, or ensure every recipient is signed into the team.'
      : undefined,
  });

  checks.push({
    key: 'folder',
    label: 'Not inside a restricted folder path',
    level: looksFolderScoped ? 'warn' : 'ok',
    message: looksFolderScoped
      ? 'URL references a brand/team folder. Folder-level permissions can override per-design share settings.'
      : 'No folder-scoped path detected.',
    fix: looksFolderScoped
      ? 'Open the design → move to a personal folder or "Uploads" and reshare, then confirm the folder\'s access is not stricter than the design.'
      : undefined,
  });

  checks.push({
    key: 'token',
    label: 'Share token present',
    level: hasShareToken ? 'ok' : 'info',
    message: hasShareToken
      ? 'Link carries a share/utm token — this is what unlocks "Anyone with the link" access.'
      : 'No share token in URL. If the design is set to "Anyone with the link", copy the share link fresh from the Share dialog to get the tokened URL.',
  });

  checks.push({
    key: 'shortlink',
    label: 'Direct design URL',
    level: isShortlink ? 'info' : 'ok',
    message: isShortlink
      ? 'This is a canva.link/canva.me shortlink. It should work, but shortlinks occasionally 404 for signed-out users — prefer the full canva.com/design/… URL.'
      : 'Using a full canva.com design URL.',
  });

  return { isCanva: info.isCanva, designId: info.designId, mode, editUrl, viewUrl, checks };
}

interface CanvaShareDiagnosticsProps {
  url?: string;
  className?: string;
  compact?: boolean;
}

const LEVEL_STYLES: Record<ShareCheck['level'], string> = {
  ok: 'text-emerald-500',
  warn: 'text-amber-500',
  info: 'text-muted-foreground',
};

export function CanvaShareDiagnostics({ url, className, compact = false }: CanvaShareDiagnosticsProps) {
  const [open, setOpen] = useState(false);
  const analysis = useMemo(() => analyzeCanvaShareUrl(url), [url]);

  if (!analysis.isCanva) return null;

  const warnCount = analysis.checks.filter((c) => c.level === 'warn').length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(compact ? 'h-5 w-5' : 'h-6 w-6', 'relative', className)}
          title="Canva share diagnostics"
          aria-label="Canva share diagnostics"
        >
          <ShieldQuestion className={cn(compact ? 'h-3 w-3' : 'h-3.5 w-3.5', warnCount > 0 ? 'text-amber-500' : 'text-muted-foreground')} />
          {warnCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-amber-500" aria-hidden />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end" onClick={(e) => e.stopPropagation()}>
        <div className="border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <ShieldQuestion className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold">Canva share diagnostics</p>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Heuristic checks on the URL. Canva doesn't expose share-ACL data publicly, so treat warnings as leads — not proof.
          </p>
        </div>

        <ul className="max-h-72 overflow-y-auto divide-y divide-border">
          {analysis.checks.map((c) => {
            const Icon = c.level === 'ok' ? CheckCircle2 : c.level === 'warn' ? AlertTriangle : Info;
            return (
              <li key={c.key} className="px-4 py-2.5">
                <div className="flex items-start gap-2">
                  <Icon className={cn('h-3.5 w-3.5 mt-0.5 shrink-0', LEVEL_STYLES[c.level])} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium leading-tight">{c.label}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground leading-snug">{c.message}</p>
                    {c.fix && (
                      <p className="mt-1 text-[11px] leading-snug text-amber-600 dark:text-amber-400">
                        <span className="font-medium">Fix:</span> {c.fix}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="border-t border-border p-3 space-y-1.5">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Quick actions</p>
          <div className="grid grid-cols-2 gap-1.5">
            {analysis.editUrl && (
              <Button variant="outline" size="sm" className="h-7 text-xs justify-start gap-1.5" asChild>
                <a href={analysis.editUrl} target="_blank" rel="noopener noreferrer">
                  <Pencil className="h-3 w-3" />Open /edit
                </a>
              </Button>
            )}
            {analysis.viewUrl && (
              <Button variant="outline" size="sm" className="h-7 text-xs justify-start gap-1.5" asChild>
                <a href={analysis.viewUrl} target="_blank" rel="noopener noreferrer">
                  <Eye className="h-3 w-3" />Open /view
                </a>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs justify-start gap-1.5"
              onClick={() => {
                if (!url) return;
                navigator.clipboard.writeText(url).then(() => toast.success('Link copied'));
              }}
            >
              <Copy className="h-3 w-3" />Copy link
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs justify-start gap-1.5" asChild>
              <a href={url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3 w-3" />Open as-is
              </a>
            </Button>
          </div>
          <p className="pt-1 text-[10px] leading-snug text-muted-foreground">
            Definitive test: open the link in an <span className="font-medium">incognito window</span>. If you can't open it signed-out, the design's share level is the blocker — not the recipient.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
