import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, FileText, Layers, Database, Globe, ArrowRight } from 'lucide-react';

const AUDITS = [
  {
    slug: '/transperfect-canva-audit',
    title: 'Canva Master Registry + Audit',
    division: 'TransPerfect · All Divisions',
    description:
      'Top-level registry covering every brand template in the TransPerfect Canva Team account. Cross-division catalog with master sorting, search, and high-level audit findings.',
    stats: [
      { label: 'Scope', value: 'All divisions' },
      { label: 'Account', value: 'TP Team' },
    ],
    icon: Layers,
    accent: 'from-cyan-500/20 to-emerald-500/20 border-cyan-500/30',
  },
  {
    slug: '/transperfect-lifesciences-canva-audit',
    title: 'Life Sciences Canva Audit',
    division: 'TransPerfect · Life Sciences',
    description:
      'Full Life Sciences division audit — 70 templates by category (Case Studies, Webinars, Social, Stories). Includes autofill field mapping, per-asset comments, flagged issues, and Canva Connect sync.',
    stats: [
      { label: 'Templates', value: '70' },
      { label: 'Categories', value: '8' },
    ],
    icon: FileText,
    accent: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30',
  },
  {
    slug: '/transperfect-dataforce-template-inventory',
    title: 'Dataforce Template Inventory',
    division: 'TransPerfect · Dataforce',
    description:
      'Complete Dataforce template inventory with computed audit findings (naming hygiene, typo detection, casing variants, stale assets, duplicate concepts), per-row notes, CSV export, and live Canva refresh.',
    stats: [
      { label: 'Templates', value: '49' },
      { label: 'Auto-Flags', value: '8+' },
    ],
    icon: Database,
    accent: 'from-violet-500/20 to-fuchsia-500/20 border-violet-500/30',
  },
];

export default function TransPerfectCanvaAuditsHub() {
  useEffect(() => {
    document.title = 'Brand Canva Audits — TransPerfect';
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-gradient-to-br from-[#0a2240] via-[#0d3060] to-[#0a5c40] px-6 py-12 md:px-16 md:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
            TransPerfect · Brand Operations
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
            Brand Canva Audits
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/70 md:text-base">
            Centralized hub for every Canva template audit conducted across TransPerfect divisions.
            Each audit is a standalone, shareable report with live sync, sortable inventories, audit
            findings, and per-asset notes.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white/80">
              📅 Updated June 16, 2026
            </span>
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white/80">
              🔌 Canva Connect API integrated
            </span>
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white/80">
              {AUDITS.length} active audits
            </span>
          </div>
        </div>
      </header>

      {/* Audit cards */}
      <main className="mx-auto max-w-6xl px-6 py-12 md:px-16">
        <div className="mb-6 flex items-baseline justify-between">
          <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
            Active Audits ({AUDITS.length})
          </h2>
          <span className="text-xs text-muted-foreground">Click a card to open the full audit</span>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {AUDITS.map((audit) => {
            const Icon = audit.icon;
            return (
              <Link
                key={audit.slug}
                to={audit.slug}
                className={`group relative flex flex-col overflow-hidden rounded-xl border bg-card p-6 transition-all hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10 bg-gradient-to-br ${audit.accent}`}
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="rounded-lg bg-background/60 p-2.5 backdrop-blur">
                    <Icon className="h-5 w-5 text-emerald-400" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-emerald-400" />
                </div>

                <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-400/90">
                  {audit.division}
                </div>
                <h3 className="mb-2 text-base font-bold leading-tight text-foreground">
                  {audit.title}
                </h3>
                <p className="mb-5 flex-1 text-xs leading-relaxed text-muted-foreground">
                  {audit.description}
                </p>

                <div className="flex gap-3 border-t border-border/60 pt-4">
                  {audit.stats.map((s) => (
                    <div key={s.label} className="flex-1">
                      <div className="text-sm font-bold text-foreground">{s.value}</div>
                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>
              </Link>
            );
          })}

          {/* Add-new placeholder card */}
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/40 p-8 text-center">
            <div className="mb-3 rounded-full bg-background/60 p-3">
              <ExternalLink className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="mb-1 text-sm font-semibold text-foreground">Need another division?</h3>
            <p className="text-xs text-muted-foreground">
              Request a new audit page for any TransPerfect brand or sub-division.
            </p>
          </div>
        </div>

        {/* Methodology */}
        <section className="mt-14 rounded-xl border border-border bg-card p-8">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
            How these audits work
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <div className="mb-1 text-sm font-semibold text-foreground">1. Live Canva sync</div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Each audit page can re-scrape its division's templates on demand via the Canva
                Connect API — sizes, page counts, and timestamps stay fresh.
              </p>
            </div>
            <div>
              <div className="mb-1 text-sm font-semibold text-foreground">
                2. Automated findings
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Naming hygiene, typo detection, brand-mark casing, stale templates, duplicate
                concepts across formats, and bulk-update patterns are all computed automatically.
              </p>
            </div>
            <div>
              <div className="mb-1 text-sm font-semibold text-foreground">3. Shareable + notes</div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Each report is a single shareable URL with per-asset notes, CSV export, dark/light
                modes, sortable tables, and filter chips — ready for Teams or SharePoint.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-6 py-6 text-center text-xs text-muted-foreground">
        TransPerfect Brand Operations · Canva Template Governance · Powered by BrandHub
      </footer>
    </div>
  );
}
