import { ReactNode } from 'react';
import { ExternalLink, FolderArchive } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { ClientLogoFile, ClientLogoVariant } from '@/types/brand';
import { downloadLogoZip } from '@/lib/downloadLogoZip';

interface LogoCardSharedProps {
  name: string;
  description?: string | null;
  category?: string | null;
  websiteUrl?: string | null;
  files: ClientLogoFile[];
  /** Slot for action buttons (edit, delete, etc.) rendered top-right */
  actions?: ReactNode;
  /** Slot for the validation badge row below the title */
  validation?: ReactNode;
  /** Slot for additional footer content (download grid, etc.) */
  footer?: ReactNode;
  /** Whether to show the bulk Download ZIP button. Default true. */
  showDownloadZip?: boolean;
  onPreview?: () => void;
}

const getPreviewUrl = (
  files: ClientLogoFile[],
  variant: ClientLogoVariant,
  lockup: 'icon' | 'wordmark' = 'icon',
): string | null => {
  const matches = files.filter((f) => f.variant === variant && (f.lockup ?? 'icon') === lockup);
  return (
    matches.find((f) => f.format === 'svg')?.url ||
    matches.find((f) => f.format === 'png')?.url ||
    null
  );
};

/** Visually identical to GlobalLogoHub card — icon row + wordmark row + variant labels + title block. */
export function LogoCardShared({
  name,
  description,
  category,
  websiteUrl,
  files,
  actions,
  validation,
  footer,
  showDownloadZip = true,
  onPreview,
}: LogoCardSharedProps) {
  const colorPreview = getPreviewUrl(files, 'color', 'icon');
  const whitePreview = getPreviewUrl(files, 'white', 'icon');
  const blackPreview = getPreviewUrl(files, 'black', 'icon');
  const wmColorPreview = getPreviewUrl(files, 'color', 'wordmark');
  const wmWhitePreview = getPreviewUrl(files, 'white', 'wordmark');
  const wmBlackPreview = getPreviewUrl(files, 'black', 'wordmark');
  const hasWordmark = !!(wmColorPreview || wmWhitePreview || wmBlackPreview);

  return (
    <Card className="group overflow-hidden hover:border-primary/50 transition-colors">
      {/* Icon row */}
      <div className="px-2 pt-1 text-[9px] uppercase tracking-wider text-muted-foreground font-medium">Icon</div>
      <div className="grid grid-cols-3 divide-x divide-border border-b">
        <PreviewTile url={colorPreview} alt={`${name} color icon`} bg="bg-white" onClick={onPreview} />
        <PreviewTile url={whitePreview} alt={`${name} white icon`} bg="bg-slate-900" mutedWhite onClick={onPreview} />
        <PreviewTile url={blackPreview} alt={`${name} black icon`} bg="bg-white" onClick={onPreview} />
      </div>

      {/* Wordmark row */}
      <div className="px-2 pt-1 text-[9px] uppercase tracking-wider text-muted-foreground font-medium">
        Logo{!hasWordmark && <span className="ml-1 normal-case text-muted-foreground/60">— add via Edit</span>}
      </div>
      <div className="grid grid-cols-3 divide-x divide-border border-b">
        <PreviewTile url={wmColorPreview} alt={`${name} color wordmark`} bg="bg-white" onClick={onPreview} />
        <PreviewTile url={wmWhitePreview} alt={`${name} white wordmark`} bg="bg-slate-900" mutedWhite onClick={onPreview} />
        <PreviewTile url={wmBlackPreview} alt={`${name} black wordmark`} bg="bg-white" onClick={onPreview} />
      </div>

      <div className="grid grid-cols-3 text-center text-[10px] font-medium text-muted-foreground border-b divide-x divide-border">
        <span className="py-1">Color</span>
        <span className="py-1">White</span>
        <span className="py-1">Black</span>
      </div>

      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h4 className="font-semibold text-sm truncate">{name}</h4>
            {description && <p className="text-xs text-muted-foreground truncate">{description}</p>}
            {category && (
              <Badge variant="outline" className="text-[10px] mt-1">
                {category}
              </Badge>
            )}
          </div>
          {actions && <div className="flex gap-1 shrink-0">{actions}</div>}
        </div>

        {validation}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {files.length} file{files.length !== 1 ? 's' : ''}
            {websiteUrl && (
              <a
                href={websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 text-primary hover:underline inline-flex items-center gap-0.5"
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </span>
          {showDownloadZip && files.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs gap-1"
              onClick={() => downloadLogoZip(name, files)}
            >
              <FolderArchive className="h-3 w-3" />
              ZIP
            </Button>
          )}
        </div>

        {footer}
      </CardContent>
    </Card>
  );
}

function PreviewTile({
  url,
  alt,
  bg,
  mutedWhite,
  onClick,
}: {
  url: string | null;
  alt: string;
  bg: string;
  mutedWhite?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      className={`aspect-[4/3] ${bg} flex items-center justify-center p-3 ${
        onClick && url ? 'cursor-pointer' : ''
      }`}
      onClick={onClick && url ? onClick : undefined}
    >
      {url ? (
        <img src={url} alt={alt} className="max-h-full max-w-full object-contain" />
      ) : (
        <span className={`text-[10px] ${mutedWhite ? 'text-slate-500' : 'text-muted-foreground'}`}>—</span>
      )}
    </div>
  );
}
