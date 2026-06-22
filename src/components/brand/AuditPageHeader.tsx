import { ExternalLink, Sun, Moon, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface AuditPageHeaderProps {
  title: string;
  subtitle: string;
  auditUrl: string;
  downloadName: string;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  backHref?: string;
  backLabel?: string;
}

/**
 * Shared header bar for TransPerfect audit detail pages.
 * Mobile: stacks title + actions onto two rows, icon-only buttons with
 * 44×44 tap targets. Desktop: inline single-row layout with labelled
 * buttons (sm size).
 */
export function AuditPageHeader({
  title,
  subtitle,
  auditUrl,
  downloadName,
  theme,
  onToggleTheme,
  backHref = '/transperfect-canva-audits',
  backLabel = 'Brand Canva Audits',
}: AuditPageHeaderProps) {
  const isLight = theme === 'light';
  const themeLabel = isLight ? 'Switch to dark mode' : 'Switch to light mode';

  return (
    <div className="flex flex-col gap-2 border-b bg-card/50 px-3 py-2 shrink-0 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-4 sm:py-3">
      <div className="flex items-center gap-2 min-w-0">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="shrink-0 h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
          title={`Back to ${backLabel}`}
        >
          <Link to={backHref} aria-label={`Back to ${backLabel}`}>
            <ArrowLeft className="h-3.5 w-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">{backLabel}</span>
          </Link>
        </Button>
        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold">{title}</h1>
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        {/* Mobile: icon-only 44×44 tap targets */}
        <Button
          variant="outline"
          onClick={onToggleTheme}
          aria-label={themeLabel}
          title={themeLabel}
          className="h-11 w-11 p-0 sm:hidden"
        >
          {isLight ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </Button>
        <Button asChild variant="outline" aria-label="Open in new tab" className="h-11 w-11 p-0 sm:hidden">
          <a href={auditUrl} target="_blank" rel="noopener noreferrer" title="Open in new tab">
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
        <Button asChild variant="outline" aria-label="Download report" className="h-11 px-3 text-xs sm:hidden">
          <a href={auditUrl} download={downloadName}>Download</a>
        </Button>

        {/* Desktop: labelled compact buttons */}
        <Button size="sm" variant="outline" onClick={onToggleTheme} title={themeLabel} className="hidden sm:inline-flex">
          {isLight ? (
            <><Moon className="h-3.5 w-3.5 mr-1.5" />Dark</>
          ) : (
            <><Sun className="h-3.5 w-3.5 mr-1.5" />Light</>
          )}
        </Button>
        <Button asChild size="sm" variant="outline" className="hidden sm:inline-flex">
          <a href={auditUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
            Open in new tab
          </a>
        </Button>
        <Button asChild size="sm" variant="outline" className="hidden sm:inline-flex">
          <a href={auditUrl} download={downloadName}>Download</a>
        </Button>
      </div>
    </div>
  );
}
