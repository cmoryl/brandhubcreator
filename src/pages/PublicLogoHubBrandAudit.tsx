import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Loader2, XCircle, FileImage, FileType2, Copy, Check, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { ClientLogoFile, ClientLogoVariant, ClientLogoLockup } from '@/types/brand';
import { auditBrand, type CheckResult, type FileAudit, type SlotAudit } from '@/lib/logoAuditChecks';

interface Row {
  id: string;
  name: string;
  description: string | null;
  category: string;
  website_url: string | null;
  files: ClientLogoFile[];
}

type SourceKind =
  | 'gilbarbara'
  | 'svgl'
  | 'simpleicons'
  | 'wikimedia'
  | 'firecrawl'
  | 'brand-site'
  | 'supabase'
  | 'unknown';

interface SourceInfo {
  kind: SourceKind;
  label: string;
  tone: 'success' | 'info' | 'warning' | 'muted';
}

function detectSource(url: string, brandWebsite?: string | null): SourceInfo {
  let host = '';
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return { kind: 'unknown', label: 'Unknown', tone: 'muted' };
  }
  if (host.includes('jsdelivr.net') && url.includes('/gilbarbara/')) {
    return { kind: 'gilbarbara', label: 'gilbarbara/logos', tone: 'success' };
  }
  if (host.includes('svgl.app') || host.includes('svgl-app')) {
    return { kind: 'svgl', label: 'svgl.app', tone: 'success' };
  }
  if (host.includes('simpleicons.org') || url.includes('/simple-icons')) {
    return { kind: 'simpleicons', label: 'Simple Icons', tone: 'success' };
  }
  if (host.includes('wikimedia.org') || host.includes('wikipedia.org')) {
    return { kind: 'wikimedia', label: 'Wikimedia', tone: 'info' };
  }
  if (host.endsWith('supabase.co') || host.endsWith('supabase.in')) {
    return { kind: 'supabase', label: 'Manual upload / rehosted', tone: 'info' };
  }
  if (brandWebsite) {
    try {
      const brandHost = new URL(brandWebsite).hostname.toLowerCase().replace(/^www\./, '');
      const normalized = host.replace(/^www\./, '');
      const root = brandHost.split('.').slice(-2).join('.');
      if (normalized === brandHost || normalized.endsWith(`.${root}`) || normalized.includes(root.split('.')[0])) {
        return { kind: 'brand-site', label: 'Brand site (Firecrawl)', tone: 'info' };
      }
    } catch { /* noop */ }
  }
  return { kind: 'firecrawl', label: 'External / Firecrawl', tone: 'warning' };
}

const extOf = (url: string, fallback?: string) => {
  try {
    const p = new URL(url).pathname;
    const m = p.match(/\.([a-z0-9]+)(?:\?|$)/i);
    if (m) return m[1].toLowerCase();
  } catch { /* noop */ }
  return (fallback || '').toLowerCase();
};

export default function PublicLogoHubBrandAudit() {
  const { id } = useParams<{ id: string }>();
  const [row, setRow] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    document.title = row?.name ? `${row.name} — Logo Audit` : 'Brand Logo Audit';
  }, [row?.name]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('global_client_logos')
        .select('id, name, description, category, website_url, files')
        .eq('id', id)
        .maybeSingle();
      if (data) {
        setRow({
          ...data,
          files: (Array.isArray(data.files) ? data.files : []) as unknown as ClientLogoFile[],
        });
      }
      setLoading(false);
    })();
  }, [id]);

  const audit = useMemo(() => (row ? auditBrand(row.files) : null), [row]);

  const copy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      toast.success('URL copied');
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 1500);
    } catch {
      toast.error('Copy failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!row || !audit) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <p className="text-muted-foreground">Brand not found.</p>
        <Link to="/logohub/audit" className="text-sm text-primary hover:underline">
          ← Back to audit
        </Link>
      </div>
    );
  }

  const overallMap = {
    pass: { label: 'PASS', cls: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' },
    warn: { label: 'WARN', cls: 'bg-amber-500/15 text-amber-700 dark:text-amber-300' },
    fail: { label: 'FAIL', cls: 'bg-red-500/15 text-red-700 dark:text-red-300' },
  } as const;
  const overall = overallMap[audit.overall];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/40">
        <div className="container mx-auto max-w-7xl px-6 py-10">
          <Link
            to="/logohub/audit"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-3 w-3" /> Back to audit
          </Link>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="secondary" className="uppercase tracking-wider text-[10px]">
                  Brand Audit
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  {row.category}
                </Badge>
                <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold tracking-wider', overall.cls)}>
                  {overall.label} · {audit.passRate}%
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">{row.name}</h1>
              {row.description && (
                <p className="text-muted-foreground max-w-2xl">{row.description}</p>
              )}
              {row.website_url && (
                <a
                  href={row.website_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2"
                >
                  {row.website_url} <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <Stat label="Files" value={row.files.length} />
              <Stat label="SVG" value={row.files.filter((f) => f.format === 'svg').length} />
              <Stat label="Raster" value={row.files.filter((f) => f.format !== 'svg').length} />
              <Stat label="Pass" value={audit.totals.brandPass + audit.totals.slotPass + audit.totals.filePass} tone="success" />
              <Stat label="Warn" value={audit.totals.brandWarn + audit.totals.slotWarn + audit.totals.fileWarn} tone="warning" />
              <Stat label="Fail" value={audit.totals.brandFail + audit.totals.slotFail + audit.totals.fileFail} tone="danger" />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-7xl px-6 py-8 space-y-8">
        {/* Brand-level checks */}
        <section>
          <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-3">
            Brand-level checks
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {audit.checks.map((c) => (
              <CheckRow key={c.id} check={c} />
            ))}
          </div>
        </section>

        {/* Per-slot pass/fail table */}
        <section>
          <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-3">
            Per-file pass / fail
          </h2>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Lockup</th>
                  <th className="text-left px-3 py-3 font-medium">Variant</th>
                  <th className="text-center px-3 py-3 font-medium">Preview</th>
                  <th className="text-left px-3 py-3 font-medium">Format</th>
                  <th className="text-left px-3 py-3 font-medium">Source</th>
                  <th className="text-center px-3 py-3 font-medium">Checks</th>
                  <th className="text-left px-3 py-3 font-medium">URL</th>
                  <th className="text-right px-3 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {audit.slots.map((slot) => (
                  <SlotRows
                    key={`${slot.lockup}-${slot.variant}`}
                    slot={slot}
                    websiteUrl={row.website_url}
                    copied={copied}
                    onCopy={copy}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="text-xs text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">What each check does</p>
          <ul className="list-disc pl-5 space-y-0.5">
            <li><strong>URL is valid</strong> — URL must parse as a valid http(s) URL.</li>
            <li><strong>Served over HTTPS</strong> — http:// URLs fail.</li>
            <li><strong>Extension matches format</strong> — file extension must match declared format.</li>
            <li><strong>Variant label looks correct</strong> — filename hints (black/white/dark/light) match declared variant.</li>
            <li><strong>Lockup label looks correct</strong> — filename hints (icon/wordmark/symbol) match declared lockup.</li>
            <li><strong>Vector format (SVG)</strong> — raster formats warn; SVG is preferred.</li>
            <li><strong>Slot has at least one file</strong> — fails if missing.</li>
            <li><strong>Slot has an SVG</strong> — warns if only raster is present.</li>
          </ul>
        </section>
      </main>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: 'success' | 'warning' | 'danger';
}) {
  const cls =
    tone === 'success'
      ? 'text-emerald-600 dark:text-emerald-400'
      : tone === 'warning'
        ? 'text-amber-600 dark:text-amber-400'
        : tone === 'danger'
          ? 'text-red-600 dark:text-red-400'
          : 'text-foreground';
  return (
    <div className="rounded border border-border px-3 py-1.5 bg-card text-right min-w-[68px]">
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn('text-sm font-semibold', cls)}>{value}</div>
    </div>
  );
}

function CheckRow({ check }: { check: CheckResult }) {
  const Icon = check.status === 'pass' ? CheckCircle2 : check.status === 'warn' ? AlertTriangle : XCircle;
  const color =
    check.status === 'pass'
      ? 'text-emerald-600 dark:text-emerald-400'
      : check.status === 'warn'
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-red-600 dark:text-red-400';
  return (
    <div className="flex items-start gap-2 rounded-lg border border-border bg-card/50 px-3 py-2">
      <Icon className={cn('h-4 w-4 mt-0.5 flex-shrink-0', color)} />
      <div className="min-w-0">
        <div className="text-sm font-medium">{check.label}</div>
        {check.detail && (
          <div className="text-[11px] text-muted-foreground mt-0.5">{check.detail}</div>
        )}
      </div>
    </div>
  );
}

function SlotRows({
  slot,
  websiteUrl,
  copied,
  onCopy,
}: {
  slot: SlotAudit;
  websiteUrl: string | null;
  copied: string | null;
  onCopy: (url: string, key: string) => void;
}) {
  if (slot.files.length === 0) {
    return (
      <tr className="border-t border-border bg-red-500/5">
        <td className="px-4 py-3 capitalize font-medium">{slot.lockup}</td>
        <td className="px-3 py-3 capitalize">{slot.variant}</td>
        <td className="px-3 py-3 text-center">
          <XCircle className="h-5 w-5 text-red-500 inline" />
        </td>
        <td className="px-3 py-3 text-xs text-red-600 dark:text-red-400">Missing</td>
        <td className="px-3 py-3 text-xs text-muted-foreground">—</td>
        <td className="px-3 py-3 text-center">
          <StatusPill status="fail" />
        </td>
        <td className="px-3 py-3 text-xs text-muted-foreground italic">
          No file in this slot
        </td>
        <td />
      </tr>
    );
  }
  return (
    <>
      {slot.files.map((fa, idx) => (
        <FileRow
          key={`${slot.lockup}-${slot.variant}-${idx}`}
          fileAudit={fa}
          slot={slot}
          isPrimary={idx === 0}
          totalInSlot={slot.files.length}
          websiteUrl={websiteUrl}
          rowKey={`${slot.lockup}-${slot.variant}-${idx}`}
          copied={copied}
          onCopy={onCopy}
        />
      ))}
    </>
  );
}

function FileRow({
  fileAudit,
  slot,
  isPrimary,
  totalInSlot,
  websiteUrl,
  rowKey,
  copied,
  onCopy,
}: {
  fileAudit: FileAudit;
  slot: SlotAudit;
  isPrimary: boolean;
  totalInSlot: number;
  websiteUrl: string | null;
  rowKey: string;
  copied: string | null;
  onCopy: (url: string, key: string) => void;
}) {
  const file = fileAudit.file;
  const source = detectSource(file.url, websiteUrl);
  const ext = extOf(file.url, file.format) || file.format;
  const isSvg = file.format === 'svg';
  const Icon = isSvg ? FileType2 : FileImage;
  const isWhite = slot.variant === 'white';

  return (
    <tr
      className={cn(
        'border-t border-border hover:bg-muted/20',
        !isPrimary && 'bg-muted/5',
      )}
    >
      <td className="px-4 py-3 align-top">
        {isPrimary ? (
          <span className="capitalize font-medium">{slot.lockup}</span>
        ) : (
          <span className="text-[10px] text-muted-foreground pl-3">↳ alt</span>
        )}
      </td>
      <td className="px-3 py-3 align-top capitalize">
        {isPrimary ? slot.variant : ''}
      </td>
      <td className="px-3 py-3 align-top">
        <div
          className={cn(
            'mx-auto h-12 w-16 rounded border border-border flex items-center justify-center overflow-hidden',
            isWhite ? 'bg-neutral-800' : 'bg-white',
          )}
        >
          <img
            src={file.url}
            alt=""
            className="max-h-10 max-w-14 object-contain"
            loading="lazy"
          />
        </div>
      </td>
      <td className="px-3 py-3 align-top">
        <div className="flex items-center gap-1.5">
          <Icon
            className={cn(
              'h-4 w-4',
              isSvg
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-amber-600 dark:text-amber-400',
            )}
          />
          <span className="text-xs font-medium uppercase tracking-wider">{ext}</span>
          {isPrimary && totalInSlot > 1 && (
            <Badge variant="outline" className="text-[9px] h-4 px-1">
              primary
            </Badge>
          )}
        </div>
      </td>
      <td className="px-3 py-3 align-top">
        <SourceBadge source={source} />
      </td>
      <td className="px-3 py-3 align-top text-center">
        <div className="flex flex-col items-center gap-1">
          <StatusPill status={fileAudit.status} />
          <div className="text-[10px] text-muted-foreground">
            {fileAudit.passCount}✓ · {fileAudit.warnCount}⚠ · {fileAudit.failCount}✗
          </div>
          <details className="text-[10px] text-left">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
              details
            </summary>
            <ul className="mt-1 space-y-0.5 min-w-[200px]">
              {fileAudit.checks.map((c) => (
                <li key={c.id} className="flex items-start gap-1">
                  <span
                    className={cn(
                      'mt-0.5',
                      c.status === 'pass'
                        ? 'text-emerald-500'
                        : c.status === 'warn'
                          ? 'text-amber-500'
                          : 'text-red-500',
                    )}
                  >
                    {c.status === 'pass' ? '✓' : c.status === 'warn' ? '⚠' : '✗'}
                  </span>
                  <span>
                    <span className="font-medium">{c.label}</span>
                    {c.detail && (
                      <span className="block text-muted-foreground text-[9px]">
                        {c.detail}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </details>
        </div>
      </td>
      <td className="px-3 py-3 align-top max-w-md">
        <code className="text-[10px] font-mono break-all text-muted-foreground block leading-relaxed">
          {file.url}
        </code>
      </td>
      <td className="px-3 py-3 align-top text-right whitespace-nowrap">
        <div className="inline-flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0"
            onClick={() => onCopy(file.url, rowKey)}
            title="Copy URL"
          >
            {copied === rowKey ? (
              <Check className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" asChild>
            <a href={file.url} target="_blank" rel="noreferrer" title="Open">
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
        </div>
      </td>
    </tr>
  );
}

function StatusPill({ status }: { status: 'pass' | 'warn' | 'fail' }) {
  const map = {
    pass: { label: 'PASS', cls: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' },
    warn: { label: 'WARN', cls: 'bg-amber-500/15 text-amber-700 dark:text-amber-300' },
    fail: { label: 'FAIL', cls: 'bg-red-500/15 text-red-700 dark:text-red-300' },
  } as const;
  const { label, cls } = map[status];
  return (
    <span className={cn('inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-wider', cls)}>
      {label}
    </span>
  );
}

function SourceBadge({ source }: { source: SourceInfo }) {
  const cls =
    source.tone === 'success'
      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
      : source.tone === 'warning'
        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
        : source.tone === 'info'
          ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300'
          : 'bg-muted text-muted-foreground';
  return (
    <span className={cn('inline-block px-2 py-0.5 rounded text-[10px] font-medium', cls)}>
      {source.label}
    </span>
  );
}
