/**
 * DashboardView — enterprise studio dashboard.
 *
 * Cards: recent systems, active drafts, approved sets, needs review,
 * export history, brand profiles, production volume sparkline, QA health gauge.
 *
 * Phase 1 ships static/derived data so the surface is wired and visible. Live
 * data hooks come in Phase 4 with the Supabase persistence layer.
 */

import {
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  Folder,
  Package,
  Plus,
  Sparkles,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusChip } from './StatusChip';
import { IconSetPreview } from './IconSetPreview';
import { GoldenPathCard } from '@/components/icon-studio/GoldenPathCard';
import { useHiddenItems } from './useHiddenItems';
import type { SectionStatus } from './studioData';

interface BrandProfile {
  id: string;
  name: string;
  slug?: string;
  tone?: string;
  members?: number;
  entityType?: 'brand' | 'product' | 'event';
}

interface Props {
  organizationName: string;
  /** Total icons across saved libraries */
  totalIcons: number;
  /** Total saved libraries */
  totalLibraries: number;
  onStartGenerate: () => void;
  /** Navigate to another shell section (library, sets, export, brands, qa, styles). */
  onNavigate?: (section: 'library' | 'sets' | 'export' | 'brands' | 'qa' | 'styles' | 'generate') => void;
  /** Real brand profiles loaded from the org. */
  brandProfiles?: BrandProfile[];
}

const MetricCard = ({
  label,
  value,
  delta,
  icon: Icon,
  accentToken,
  onClick,
}: {
  label: string;
  value: string | number;
  delta?: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  accentToken: string;
  onClick?: () => void;
}) => {
  const Comp: any = onClick ? 'button' : 'div';
  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`tp-card tp-card-interactive p-5 text-left w-full ${onClick ? 'cursor-pointer hover:border-primary/40' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg"
          style={{
            background: `hsl(${accentToken} / 0.12)`,
            color: `hsl(${accentToken})`,
          }}
        >
          <Icon className="h-5 w-5" />
        </div>
        {delta && (
          <span
            className="flex items-center gap-1 text-[11px] font-medium"
            style={{ color: 'hsl(var(--tp-green))' }}
          >
            <TrendingUp className="h-3 w-3" />
            {delta}
          </span>
        )}
      </div>
      <div className="mt-4 text-2xl font-semibold tabular-nums tracking-tight">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </Comp>
  );
};

const ActivityRow = ({
  title,
  meta,
  status,
  emojis,
  accent,
  onClick,
}: {
  title: string;
  meta: string;
  status: SectionStatus;
  emojis: string[];
  accent: string;
  onClick?: () => void;
}) => (
  <li>
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary/40"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <IconSetPreview emojis={emojis} accent={accent} size="sm" count={4} variant="glass" className="!grid-cols-4 flex-shrink-0" />
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">{title}</div>
          <div className="text-[11px] text-muted-foreground truncate">{meta}</div>
        </div>
      </div>
      <StatusChip status={status} />
    </button>
  </li>
);

/** Render a tiny inline SVG sparkline for the production volume tile. */
const Sparkline = ({
  data,
  accentToken,
}: {
  data: number[];
  accentToken: string;
}) => {
  const w = 220;
  const h = 60;
  const max = Math.max(...data, 1);
  const stepX = w / (data.length - 1 || 1);
  const points = data
    .map((v, i) => `${(i * stepX).toFixed(1)},${(h - (v / max) * h).toFixed(1)}`)
    .join(' ');
  const area = `0,${h} ${points} ${w},${h}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-16 w-full" aria-hidden>
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={`hsl(${accentToken})`} stopOpacity="0.35" />
          <stop offset="100%" stopColor={`hsl(${accentToken})`} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#sparkFill)" />
      <polyline
        points={points}
        fill="none"
        stroke={`hsl(${accentToken})`}
        strokeWidth="1.75"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
};

export const DashboardView = ({
  organizationName,
  totalIcons,
  totalLibraries,
  onStartGenerate,
  onNavigate,
  brandProfiles = [],
}: Props) => {
  const volumeData = [4, 8, 12, 9, 14, 22, 18, 26, 24, 31, 28, 38, 42, 36];
  const qaScore = 86;
  const { hidden: hiddenBrands, hide: hideBrand, clear: clearHiddenBrands, isHidden: isBrandHidden } =
    useHiddenItems('brand-profiles');
  const visibleBrandProfiles = brandProfiles.filter((b) => !isBrandHidden(b.id));

  return (
    <div className="space-y-8">
      {/* Hero strip */}
      <header className="tp-card relative overflow-hidden p-7">
        <div
          className="absolute inset-0 opacity-50"
          style={{
            background:
              'radial-gradient(60% 60% at 15% 0%, hsl(var(--tp-digital-blue) / 0.25), transparent 70%), radial-gradient(50% 80% at 100% 100%, hsl(var(--tp-pink) / 0.15), transparent 70%)',
          }}
          aria-hidden
        />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Icon production platform</span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Welcome back{organizationName ? `, ${organizationName}` : ''}
            </h1>
            <p className="text-sm text-muted-foreground max-w-xl">
              Generate, QA, organize and export brand-consistent icon systems at scale —
              with industry packs, preflight discipline, and production-ready bundles.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => onNavigate?.('library')}>
              <Folder className="h-4 w-4" />
              Open library
            </Button>
            <Button size="sm" className="gap-1.5" onClick={onStartGenerate}>
              <Plus className="h-4 w-4" />
              New icon system
            </Button>
          </div>
        </div>
      </header>

      {/* Golden Path quickstart */}
      <GoldenPathCard />

      {/* Metric tiles */}
      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard label="Total icons" value={totalIcons} delta="+12%" icon={Sparkles} accentToken="var(--tp-light-blue)" onClick={() => onNavigate?.('library')} />
        <MetricCard label="Active drafts" value={Math.max(0, totalLibraries - 1)} icon={Clock} accentToken="var(--tp-orange)" onClick={() => onNavigate?.('sets')} />
        <MetricCard label="Approved sets" value={totalLibraries} delta="+3" icon={CheckCircle2} accentToken="var(--tp-green)" onClick={() => onNavigate?.('sets')} />
        <MetricCard label="Needs review" value={2} icon={Eye} accentToken="var(--tp-purple)" onClick={() => onNavigate?.('qa')} />
      </section>

      {/* Two-up: volume + QA gauge */}
      <section className="grid gap-4 lg:grid-cols-3">
        <div className="tp-card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Production volume
              </div>
              <div className="mt-1 text-lg font-semibold">Last 14 generations</div>
            </div>
            <Badge variant="outline" className="gap-1">
              <TrendingUp className="h-3 w-3" /> Trending up
            </Badge>
          </div>
          <Sparkline data={volumeData} accentToken="var(--tp-digital-blue)" />
          <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>14 jobs</span>
            <span>{volumeData.reduce((a, b) => a + b, 0)} icons produced</span>
          </div>
        </div>

        <div className="tp-card p-5">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
            QA health
          </div>
          <div className="mt-3 flex items-center justify-center">
            <QaGauge value={qaScore} />
          </div>
          <div className="mt-2 text-center text-xs text-muted-foreground">
            Average across last 30 days
          </div>
        </div>
      </section>

      {/* Two-up: recent + export history */}
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="tp-card p-5">
          <header className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Recent icon systems</h3>
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => onNavigate?.('sets')}>
              View all <ArrowUpRight className="h-3 w-3" />
            </Button>
          </header>
          <ul className="space-y-1">
            <ActivityRow title="GlobalLink platform icons" meta="Tech / SaaS · 84 icons" status="approved" emojis={['🔗','⚙️','🌍','📡','🧩']} accent="hsl(var(--tp-digital-blue))" onClick={() => onNavigate?.('sets')} />
            <ActivityRow title="Life Sciences regulatory pack" meta="Life Sciences · 32 icons" status="review" emojis={['🧪','🧬','🔬','💉','📋']} accent="hsl(var(--tp-green))" onClick={() => onNavigate?.('qa')} />
            <ActivityRow title="Travel loyalty refresh" meta="Travel · 48 icons" status="generating" emojis={['✈️','🏨','🎫','⭐','🗺️']} accent="hsl(var(--tp-light-blue))" onClick={() => onNavigate?.('generate')} />
            <ActivityRow title="TransPerfect AI Solutions" meta="Brand · 22 icons" status="approved" emojis={['✨','🧠','🤖','⚡','🪄']} accent="hsl(var(--tp-pink))" onClick={() => onNavigate?.('sets')} />
            <ActivityRow title="Healthcare patient flow" meta="Healthcare · 18 icons" status="queued" emojis={['🩺','💊','📋','🏥','❤️']} accent="hsl(var(--tp-teal))" onClick={() => onNavigate?.('generate')} />
          </ul>
        </div>

        <div className="tp-card p-5">
          <header className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Export history</h3>
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => onNavigate?.('export')}>
              Open center <ArrowUpRight className="h-3 w-3" />
            </Button>
          </header>
          <ul className="divide-y divide-border/60">
            {[
              { name: 'globallink-icon-system.zip', when: '2h ago', size: '3.4 MB' },
              { name: 'life-sciences-pack.zip', when: 'yesterday', size: '1.8 MB' },
              { name: 'travel-loyalty.zip', when: '3d ago', size: '2.1 MB' },
              { name: 'tp-ai-solutions.zip', when: '1w ago', size: '1.2 MB' },
            ].map((row) => (
              <li key={row.name}>
                <button
                  type="button"
                  onClick={() => onNavigate?.('export')}
                  className="flex w-full items-center justify-between py-2.5 text-sm text-left rounded-md px-2 -mx-2 hover:bg-secondary/60 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Download className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{row.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span>{row.size}</span>
                    <span>{row.when}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Brand profiles teaser */}
      <section className="tp-card p-5">
        <header className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Brand profiles</h3>
            <p className="text-xs text-muted-foreground">
              Profiles influence generation, QA, and export defaults.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hiddenBrands.size > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[11px]"
                onClick={clearHiddenBrands}
              >
                Restore {hiddenBrands.size} hidden
              </Button>
            )}
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => onNavigate?.('brands')}>
              <Plus className="h-3.5 w-3.5" />
              New brand
            </Button>
          </div>
        </header>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {(visibleBrandProfiles.length > 0
            ? visibleBrandProfiles
            : [{ id: 'placeholder', name: organizationName || 'Your brand', tone: 'Add brands to see them here', members: 0 } as typeof visibleBrandProfiles[number]]
          ).map((b) => {
            const isPlaceholder = b.id === 'placeholder';
            const content = (
              <>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium truncate">{b.name}</span>
                  <div className="flex items-center gap-1">
                    {typeof b.members === 'number' && b.members > 0 && (
                      <Badge variant="secondary" className="gap-1 text-[10px]">
                        <Users className="h-3 w-3" />
                        {b.members}
                      </Badge>
                    )}
                    {!isPlaceholder && (
                      <button
                        type="button"
                        aria-label={`Hide ${b.name} from dashboard`}
                        title="Hide from dashboard"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          hideBrand(b.id);
                        }}
                        className="inline-flex h-5 w-5 items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-60 hover:opacity-100"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
                {b.tone && <div className="text-[11px] text-muted-foreground">{b.tone}</div>}
              </>
            );
            const className =
              'block rounded-lg border bg-secondary/30 px-3 py-2.5 transition-colors hover:bg-secondary/60 hover:border-primary/40';
            return (
              <li key={b.id}>
                {b.slug ? (
                  <Link to={`/icon-studio/${b.entityType || 'brand'}/${b.slug}`} className={className}>
                    {content}
                  </Link>
                ) : (
                  <div className={className}>{content}</div>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
};

/** Donut-style QA score gauge. */
const QaGauge = ({ value }: { value: number }) => {
  const size = 144;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`QA score ${value}%`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="hsl(var(--tp-green))"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 600ms ease' }}
      />
      <text x="50%" y="48%" textAnchor="middle" dominantBaseline="central" className="fill-foreground" style={{ fontSize: 28, fontWeight: 600 }}>
        {value}
      </text>
      <text x="50%" y="68%" textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 10, letterSpacing: 1 }}>
        QA SCORE
      </text>
    </svg>
  );
};
