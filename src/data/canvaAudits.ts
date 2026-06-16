/**
 * Canva audit registry — brand-scoped catalog of in-app Canva template
 * audits. Each entry powers the brand-page "Canva Audits" section and
 * deep-links to the standalone audit report page.
 *
 * To register a new audit:
 *  1. Build/ship the audit page route in App.tsx
 *  2. Add an entry below keyed by the brand slug it belongs to
 */
import { Layers, FileText, Database, type LucideIcon } from 'lucide-react';

export interface CanvaAuditEntry {
  /** Route the card links to (absolute path). */
  slug: string;
  title: string;
  division: string;
  description: string;
  status: 'live' | 'in_progress' | 'draft';
  /** ISO date — used for "last updated" badge. */
  updatedAt: string;
  templateCount: number;
  /** Number of automated findings / flagged items. */
  flagCount?: number;
  /** Category count, language count, etc. */
  categoryCount?: number;
  /** Canva Connect sync supported. */
  liveSync: boolean;
  icon: LucideIcon;
  /** Tailwind gradient classes for the card accent. */
  accent: string;
  /** Short ribbon descriptor for the most recent finding/action. */
  highlight?: string;
}

/**
 * Map of brand slug → audits. Use `getCanvaAuditsForBrand(slug)` to read.
 */
const CANVA_AUDITS_BY_BRAND: Record<string, CanvaAuditEntry[]> = {
  transperfect: [
    {
      slug: '/transperfect-canva-audit',
      title: 'Canva Master Registry + Audit',
      division: 'All Divisions',
      description:
        'Top-level registry covering every brand template in the TransPerfect Canva Team account. Cross-division catalog with master sorting, search, and high-level findings.',
      status: 'live',
      updatedAt: '2026-06-16',
      templateCount: 246,
      categoryCount: 12,
      flagCount: 18,
      liveSync: true,
      icon: Layers,
      accent: 'from-cyan-500/15 via-cyan-500/5 to-emerald-500/10 border-cyan-500/30',
      highlight: 'Cross-division catalog · master sort + search',
    },
    {
      slug: '/transperfect-lifesciences-canva-audit',
      title: 'Life Sciences Canva Audit',
      division: 'Life Sciences',
      description:
        '70 templates by category (Case Studies, Webinars, Social, Stories). Includes autofill field mapping, per-asset comments, flagged issues, and live Canva Connect sync.',
      status: 'live',
      updatedAt: '2026-06-16',
      templateCount: 70,
      categoryCount: 8,
      flagCount: 11,
      liveSync: true,
      icon: FileText,
      accent: 'from-emerald-500/15 via-emerald-500/5 to-teal-500/10 border-emerald-500/30',
      highlight: 'Autofill field mapping · per-asset notes',
    },
    {
      slug: '/transperfect-dataforce-template-inventory',
      title: 'Dataforce Template Inventory',
      division: 'Dataforce',
      description:
        'Complete Dataforce template inventory with computed findings (naming hygiene, typo detection, casing variants, stale assets, duplicate concepts), per-row notes, CSV export, and live refresh.',
      status: 'live',
      updatedAt: '2026-06-16',
      templateCount: 49,
      categoryCount: 6,
      flagCount: 8,
      liveSync: true,
      icon: Database,
      accent: 'from-violet-500/15 via-violet-500/5 to-fuchsia-500/10 border-violet-500/30',
      highlight: 'Naming hygiene · stale + duplicate detection',
    },
  ],
};

export function getCanvaAuditsForBrand(slug?: string | null): CanvaAuditEntry[] {
  if (!slug) return [];
  return CANVA_AUDITS_BY_BRAND[slug.toLowerCase()] ?? [];
}

export function hasCanvaAudits(slug?: string | null): boolean {
  return getCanvaAuditsForBrand(slug).length > 0;
}

/** Aggregate stats used by the section header. */
export function summarizeCanvaAudits(slug?: string | null) {
  const audits = getCanvaAuditsForBrand(slug);
  return {
    auditCount: audits.length,
    templateCount: audits.reduce((n, a) => n + (a.templateCount || 0), 0),
    flagCount: audits.reduce((n, a) => n + (a.flagCount || 0), 0),
    liveSyncCount: audits.filter((a) => a.liveSync).length,
  };
}
