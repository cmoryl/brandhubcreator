/**
 * Static data for the Icon Studio enterprise shell — industries, usage
 * contexts, audiences, icon purposes, base styles, color modes, core sections,
 * and TransPerfect-specific sub-set packs.
 *
 * This file complements (not replaces) `src/lib/iconStudio/industryPresets.ts`.
 * The legacy wizard still consumes the smaller preset set; the new shell views
 * use this richer catalogue for the upgraded Step 1–3 experience.
 */

import {
  Cpu,
  Stethoscope,
  Landmark,
  ShoppingBag,
  Scale,
  FlaskConical,
  Plane,
  Gamepad2,
  GraduationCap,
  Building2,
  Newspaper,
  Factory,
  Zap,
  Heart,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

/* -------------------------------------------------------------------------- */
/* Industries — 15 cards                                                       */
/* -------------------------------------------------------------------------- */

export interface IndustryCard {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  /** HSL token (matches a --tp-* variable) used for the accent strip */
  accentToken: string;
  /** A handful of emoji previews for the card icon strip */
  previewEmoji: string[];
  coreSectionsCount: number;
  subSetCount: number;
}

export const INDUSTRY_CARDS: IndustryCard[] = [
  { id: 'tech-saas', name: 'Tech / SaaS', description: 'Dashboards, APIs, dev tools, integrations.', icon: Cpu, accentToken: 'var(--tp-digital-blue)', previewEmoji: ['⚙️','📊','🔐','🔌','⚡','🧩'], coreSectionsCount: 12, subSetCount: 15 },
  { id: 'healthcare', name: 'Healthcare', description: 'Clinical, patient, EHR, telehealth.', icon: Stethoscope, accentToken: 'var(--tp-teal)', previewEmoji: ['🩺','💊','🧬','📋','🏥','🧪'], coreSectionsCount: 12, subSetCount: 10 },
  { id: 'finance', name: 'Finance / Fintech', description: 'Banking, payments, invest, compliance.', icon: Landmark, accentToken: 'var(--tp-purple)', previewEmoji: ['💳','🏦','📈','💰','🔐','🧾'], coreSectionsCount: 12, subSetCount: 11 },
  { id: 'ecommerce', name: 'E-commerce / Retail', description: 'Cart, checkout, fulfillment, loyalty.', icon: ShoppingBag, accentToken: 'var(--tp-orange)', previewEmoji: ['🛒','📦','🚚','⭐','🎁','🏷️'], coreSectionsCount: 12, subSetCount: 11 },
  { id: 'legal', name: 'Legal', description: 'Cases, contracts, e-discovery, matters.', icon: Scale, accentToken: 'var(--tp-dark-blue)', previewEmoji: ['⚖️','📑','🔒','🗂️','✍️','🏛️'], coreSectionsCount: 12, subSetCount: 9 },
  { id: 'life-sciences', name: 'Life Sciences', description: 'Trials, labs, regulatory, R&D.', icon: FlaskConical, accentToken: 'var(--tp-green)', previewEmoji: ['🧪','🧬','🔬','💉','📊','📑'], coreSectionsCount: 12, subSetCount: 10 },
  { id: 'travel', name: 'Travel / Hospitality', description: 'Booking, itineraries, loyalty, transit.', icon: Plane, accentToken: 'var(--tp-light-blue)', previewEmoji: ['✈️','🏨','🗺️','🧳','🛎️','🎫'], coreSectionsCount: 12, subSetCount: 9 },
  { id: 'gaming', name: 'Gaming', description: 'Players, inventory, achievements, social.', icon: Gamepad2, accentToken: 'var(--tp-pink)', previewEmoji: ['🎮','🏆','⚔️','🎲','💎','🔫'], coreSectionsCount: 12, subSetCount: 10 },
  { id: 'education', name: 'Education', description: 'Courses, lessons, grading, classrooms.', icon: GraduationCap, accentToken: 'var(--tp-light-blue)', previewEmoji: ['📚','🎓','✏️','🧑‍🏫','📝','🏫'], coreSectionsCount: 12, subSetCount: 9 },
  { id: 'government', name: 'Government', description: 'Citizens, services, records, compliance.', icon: Building2, accentToken: 'var(--tp-dark-blue)', previewEmoji: ['🏛️','📋','🗳️','🆔','📜','🛡️'], coreSectionsCount: 12, subSetCount: 9 },
  { id: 'media', name: 'Media', description: 'Publishing, video, audio, distribution.', icon: Newspaper, accentToken: 'var(--tp-pink)', previewEmoji: ['📰','🎬','🎙️','📺','📷','🎞️'], coreSectionsCount: 12, subSetCount: 9 },
  { id: 'manufacturing', name: 'Manufacturing', description: 'Plants, MES, inventory, quality.', icon: Factory, accentToken: 'var(--tp-orange)', previewEmoji: ['🏭','⚙️','📦','📐','🧰','🛠️'], coreSectionsCount: 12, subSetCount: 9 },
  { id: 'energy', name: 'Energy', description: 'Grid, generation, monitoring, sustainability.', icon: Zap, accentToken: 'var(--tp-green)', previewEmoji: ['⚡','🔋','🌞','🌬️','💧','🛢️'], coreSectionsCount: 12, subSetCount: 8 },
  { id: 'nonprofit', name: 'Nonprofit', description: 'Donors, programs, impact, volunteers.', icon: Heart, accentToken: 'var(--tp-pink)', previewEmoji: ['❤️','🤝','🌍','📣','💝','🙌'], coreSectionsCount: 12, subSetCount: 8 },
  { id: 'custom', name: 'Custom', description: 'Roll your own from scratch — pick sections.', icon: Sparkles, accentToken: 'var(--tp-purple)', previewEmoji: ['✨','🧩','🎛️','🧪','🔧','🪄'], coreSectionsCount: 12, subSetCount: 0 },
];

/* -------------------------------------------------------------------------- */
/* Usage contexts / Audience / Purpose                                         */
/* -------------------------------------------------------------------------- */

export const USAGE_CONTEXTS = [
  { id: 'product-ui', label: 'Product UI', helper: 'In-app interfaces' },
  { id: 'website', label: 'Website marketing', helper: 'Hero, features, landing' },
  { id: 'sales-deck', label: 'Sales deck', helper: 'Pitch & slide systems' },
  { id: 'app-nav', label: 'App navigation', helper: 'Tab bars, menus' },
  { id: 'internal', label: 'Internal tool', helper: 'Admin, ops dashboards' },
  { id: 'kb', label: 'Knowledge base', helper: 'Docs, help center' },
  { id: 'social', label: 'Social graphics', helper: 'OG, posts, stories' },
  { id: 'case-study', label: 'Client case study', helper: 'Story-driven PDFs' },
  { id: 'presentation', label: 'Presentation system', helper: 'Reusable deck kit' },
  { id: 'compliance', label: 'Compliance docs', helper: 'Audit, policy, legal' },
] as const;

export const AUDIENCES = [
  { id: 'b2b', label: 'B2B enterprise' },
  { id: 'b2c', label: 'B2C consumer' },
  { id: 'developer', label: 'Developers' },
  { id: 'executive', label: 'Executives' },
  { id: 'designer', label: 'Designers' },
  { id: 'ops', label: 'Operations' },
  { id: 'regulator', label: 'Regulators' },
  { id: 'partner', label: 'Partners & channel' },
] as const;

export const ICON_PURPOSES = [
  { id: 'system', label: 'System UI', helper: '24px workhorse glyphs' },
  { id: 'marketing', label: 'Marketing', helper: '48–96px scene icons' },
  { id: 'feature', label: 'Feature illustration', helper: 'Hero + sub-feature' },
  { id: 'navigation', label: 'Navigation', helper: 'Tabs, menus, sidebars' },
  { id: 'data', label: 'Data viz', helper: 'Chart & metric markers' },
  { id: 'status', label: 'Status & state', helper: 'Empty, success, error' },
  { id: 'brand-system', label: 'Brand system', helper: 'Reusable hero kit' },
  { id: 'compliance', label: 'Compliance', helper: 'Trust, audit, secure' },
] as const;

/* -------------------------------------------------------------------------- */
/* Base styles — 18 presets                                                    */
/* -------------------------------------------------------------------------- */

export type StylePreviewVariant =
  | 'tile' | 'glass' | 'outline' | 'neon' | 'duotone' | 'soft' | 'sharp'
  | 'badge' | 'gradient' | 'sticker' | 'neumorphic' | 'flat' | 'chip'
  | 'ring' | 'dotted' | 'shadow' | 'mono' | 'hatched' | 'sketch'
  | 'pixel' | 'embossed' | 'inverse' | 'paper' | 'risograph';

export interface BaseStyle {
  id: string;
  name: string;
  description: string;
  /** stroke / fill defaults used as a recipe hint */
  recipe: { stroke?: boolean; fill?: boolean; duotone?: boolean; mono?: boolean };
  /** Visual preview hint for IconSetPreview */
  preview: {
    variant: StylePreviewVariant;
    radius?: number;
    strokeWidth?: number;
    /** Secondary accent token (without `--`); defaults to the row accent. */
    accent2?: string;
  };
}

export const BASE_STYLES: BaseStyle[] = [
  // Original 18
  { id: 'outline', name: 'Outline', description: 'Single-stroke line system', recipe: { stroke: true }, preview: { variant: 'outline', strokeWidth: 1.75, radius: 10 } },
  { id: 'filled', name: 'Filled', description: 'Solid, weighty glyphs', recipe: { fill: true }, preview: { variant: 'flat', radius: 10 } },
  { id: 'duotone', name: 'Duotone', description: 'Two-tone depth', recipe: { duotone: true, fill: true }, preview: { variant: 'duotone', radius: 10 } },
  { id: 'mono-glyph', name: 'Mono glyph', description: 'Monochrome silhouettes', recipe: { mono: true, fill: true }, preview: { variant: 'mono', radius: 10 } },
  { id: 'soft-filled', name: 'Soft filled', description: 'Rounded soft-fill', recipe: { fill: true }, preview: { variant: 'soft', radius: 16 } },
  { id: 'glass', name: 'Glass icon', description: 'Translucent surface', recipe: { fill: true }, preview: { variant: 'glass', radius: 12 } },
  { id: 'neon-line', name: 'Neon line', description: 'Glow-stroke for dark UI', recipe: { stroke: true }, preview: { variant: 'neon', strokeWidth: 1.5, radius: 10 } },
  { id: 'enterprise-line', name: 'Enterprise line', description: 'Pixel-tight 2px stroke', recipe: { stroke: true }, preview: { variant: 'outline', strokeWidth: 2, radius: 6 } },
  { id: 'rounded-ui', name: 'Rounded UI', description: 'Friendly rounded caps', recipe: { stroke: true }, preview: { variant: 'tile', strokeWidth: 2, radius: 18 } },
  { id: 'sharp-ui', name: 'Sharp UI', description: 'Crisp 90° corners', recipe: { stroke: true }, preview: { variant: 'sharp', strokeWidth: 1.75, radius: 0 } },
  { id: 'marketing', name: 'Marketing icon', description: 'Bold hero-scale', recipe: { fill: true, duotone: true }, preview: { variant: 'gradient', radius: 12 } },
  { id: 'presentation', name: 'Presentation', description: 'Slide-ready, oversized', recipe: { fill: true }, preview: { variant: 'tile', radius: 14 } },
  { id: 'system-utility', name: 'System utility', description: '16/24px tray icons', recipe: { stroke: true }, preview: { variant: 'outline', strokeWidth: 1.5, radius: 6 } },
  { id: 'badge', name: 'Badge', description: 'Achievement & trust marks', recipe: { fill: true }, preview: { variant: 'badge', radius: 999 } },
  { id: 'micro', name: 'Micro', description: 'Sub-16px UI accents', recipe: { stroke: true }, preview: { variant: 'outline', strokeWidth: 1.25, radius: 4 } },
  { id: 'data', name: 'Data icon', description: 'Chart-anchored marks', recipe: { stroke: true }, preview: { variant: 'dotted', strokeWidth: 1.75, radius: 8 } },
  { id: 'ai-tech', name: 'AI / tech', description: 'Spark + circuit motifs', recipe: { stroke: true, duotone: true }, preview: { variant: 'gradient', radius: 10 } },
  { id: 'compliance', name: 'Compliance', description: 'Shield, lock, seal vocabulary', recipe: { fill: true }, preview: { variant: 'shadow', radius: 10 } },

  // New look & feel variations
  { id: 'sticker', name: 'Sticker', description: 'White surface, bold colored border', recipe: { stroke: true, fill: true }, preview: { variant: 'sticker', strokeWidth: 2, radius: 14 } },
  { id: 'neumorphic', name: 'Neumorphic', description: 'Soft inset & outset shadows', recipe: { fill: true }, preview: { variant: 'neumorphic', radius: 14 } },
  { id: 'chip', name: 'Pill chip', description: 'Pill-shaped contained marks', recipe: { stroke: true }, preview: { variant: 'chip', radius: 999 } },
  { id: 'ring', name: 'Double ring', description: 'Halo-bordered emblem', recipe: { stroke: true }, preview: { variant: 'ring', strokeWidth: 1.75, radius: 999 } },
  { id: 'paper', name: 'Paper cut', description: 'Layered paper card with offset', recipe: { fill: true }, preview: { variant: 'paper', radius: 8 } },
  { id: 'embossed', name: 'Embossed', description: 'Subtle relief, premium feel', recipe: { stroke: true }, preview: { variant: 'embossed', strokeWidth: 1.75, radius: 12 } },
  { id: 'risograph', name: 'Risograph', description: 'Offset two-color print', recipe: { fill: true, duotone: true }, preview: { variant: 'risograph', radius: 8 } },
  { id: 'pixel', name: 'Pixel grid', description: '8-bit pixel-art frame', recipe: { stroke: true }, preview: { variant: 'pixel', strokeWidth: 2, radius: 2 } },
  { id: 'sketch', name: 'Sketch', description: 'Hand-drawn dashed contour', recipe: { stroke: true }, preview: { variant: 'sketch', strokeWidth: 1.5, radius: 10 } },
  { id: 'inverse', name: 'Inverse chip', description: 'Solid accent, white glyph', recipe: { fill: true }, preview: { variant: 'inverse', radius: 10 } },
  { id: 'hatched', name: 'Hatched', description: 'Diagonal hatch background', recipe: { stroke: true }, preview: { variant: 'hatched', strokeWidth: 1.75, radius: 8 } },
  { id: 'aurora', name: 'Aurora gradient', description: 'Multi-stop gradient sheen', recipe: { fill: true, duotone: true }, preview: { variant: 'gradient', radius: 12, accent2: 'tp-pink' } },
  { id: 'cyber', name: 'Cyberframe', description: 'Neon ring on dark surface', recipe: { stroke: true }, preview: { variant: 'neon', strokeWidth: 1.75, radius: 4 } },
  { id: 'soft-shadow', name: 'Soft shadow', description: 'Floating glyph with halo', recipe: { fill: true }, preview: { variant: 'shadow', radius: 14 } },
  { id: 'ghost', name: 'Ghost', description: 'Faded translucent line', recipe: { stroke: true }, preview: { variant: 'outline', strokeWidth: 1, radius: 10 } },
  { id: 'editorial', name: 'Editorial', description: 'Newspaper-weight thick stroke', recipe: { stroke: true }, preview: { variant: 'outline', strokeWidth: 2.5, radius: 0 } },
  { id: 'minimal-dot', name: 'Minimal dot', description: 'Tiny dot-anchored glyph', recipe: { stroke: true }, preview: { variant: 'dotted', strokeWidth: 1.5, radius: 999 } },
];

export const COLOR_MODES = [
  { id: 'mono', label: 'Monochrome' },
  { id: 'duotone', label: 'Duotone' },
  { id: 'brand', label: 'Brand colors' },
  { id: 'semantic', label: 'Semantic (status)' },
] as const;

export const GRID_SIZES = [
  { id: '16', label: '16 px' },
  { id: '20', label: '20 px' },
  { id: '24', label: '24 px (recommended)' },
  { id: '32', label: '32 px' },
  { id: '48', label: '48 px (marketing)' },
] as const;

export const END_CAPS = [
  { id: 'round', label: 'Round' },
  { id: 'butt', label: 'Butt' },
  { id: 'square', label: 'Square' },
] as const;

export const JOINS = [
  { id: 'round', label: 'Round' },
  { id: 'miter', label: 'Miter' },
  { id: 'bevel', label: 'Bevel' },
] as const;

export const FILL_BEHAVIORS = [
  { id: 'currentColor', label: 'currentColor (inherits)' },
  { id: 'token', label: 'Brand token' },
  { id: 'fixed', label: 'Fixed brand hex' },
] as const;

export const SIZE_TARGETS = [
  { id: 's', label: '16 / 20 / 24' },
  { id: 'm', label: '24 / 32 / 48' },
  { id: 'l', label: '48 / 64 / 96' },
  { id: 'xl', label: '128 / 256 / 512' },
] as const;

/* -------------------------------------------------------------------------- */
/* Core sections — 12 cards                                                    */
/* -------------------------------------------------------------------------- */

export type SectionStatus =
  | 'queued'
  | 'generating'
  | 'review'
  | 'approved'
  | 'failed'
  | 'locked'
  | 'idle';

export interface CoreSection {
  id: string;
  name: string;
  description: string;
  defaultCount: number;
  /** Lucide icon for the card header */
  icon?: LucideIcon;
}

export const CORE_SECTIONS: CoreSection[] = [
  { id: 'navigation', name: 'Navigation', description: 'Home, back, forward, menu, tabs', defaultCount: 8 },
  { id: 'ui-states', name: 'UI States', description: 'Empty, success, error, loading', defaultCount: 6 },
  { id: 'basic-logic', name: 'Basic Logic', description: 'Add, edit, delete, search, filter', defaultCount: 8 },
  { id: 'messaging', name: 'Messaging', description: 'Chat, mail, reply, forward', defaultCount: 6 },
  { id: 'notifications', name: 'Notifications', description: 'Bell, alert, mute, snooze', defaultCount: 5 },
  { id: 'actions', name: 'Actions', description: 'Save, share, copy, download, upload', defaultCount: 8 },
  { id: 'files', name: 'Files', description: 'Document, folder, attach, archive', defaultCount: 7 },
  { id: 'users', name: 'Users', description: 'Profile, group, invite, role', defaultCount: 6 },
  { id: 'data', name: 'Data', description: 'Database, chart, sync, export', defaultCount: 7 },
  { id: 'security', name: 'Security', description: 'Lock, shield, key, audit', defaultCount: 6 },
  { id: 'settings', name: 'Settings', description: 'Gear, sliders, toggle, preferences', defaultCount: 5 },
  { id: 'help', name: 'Help & Support', description: 'Question, info, contact, docs', defaultCount: 5 },
];

/* -------------------------------------------------------------------------- */
/* Sub-set packs — 6 groupings, including TransPerfect-specific packs          */
/* -------------------------------------------------------------------------- */

export type PackGrouping =
  | 'department'
  | 'feature'
  | 'context'
  | 'workflow'
  | 'compliance'
  | 'channel';

export const PACK_GROUPINGS: Array<{ id: PackGrouping; label: string }> = [
  { id: 'department', label: 'Department' },
  { id: 'feature', label: 'Product / feature' },
  { id: 'context', label: 'Use context' },
  { id: 'workflow', label: 'Workflow' },
  { id: 'compliance', label: 'Compliance' },
  { id: 'channel', label: 'Channel' },
];

export interface PackTemplate {
  id: string;
  name: string;
  description: string;
  grouping: PackGrouping;
  count: number;
  tags: string[];
  recommended?: boolean;
  /** Rough seconds estimate per icon × count */
  etaSeconds: number;
  previewEmoji: string[];
  /** Industry id this pack is curated for; undefined = universal */
  industryId?: string;
  /** True for TransPerfect-specific brand packs */
  transperfect?: boolean;
}

const eta = (n: number) => n * 4; // 4s per icon (simulated)

/** Tech / SaaS packs (15) */
const TECH_PACKS: PackTemplate[] = [
  { id: 'tsaas-ai', name: 'AI & Automation', description: 'Spark, model, prompt, agent, eval', grouping: 'feature', count: 12, tags: ['ai','automation'], recommended: true, etaSeconds: eta(12), previewEmoji: ['✨','🤖','🧠','⚡','🪄','🧪'], industryId: 'tech-saas' },
  { id: 'tsaas-api', name: 'API & Integrations', description: 'Webhook, plugin, SDK, key, callback', grouping: 'feature', count: 10, tags: ['api','dev'], recommended: true, etaSeconds: eta(10), previewEmoji: ['🔌','🧩','📡','🔑','🔁','📦'], industryId: 'tech-saas' },
  { id: 'tsaas-analytics', name: 'Analytics', description: 'Funnel, retention, cohort, KPI, dashboard', grouping: 'feature', count: 12, tags: ['analytics'], recommended: true, etaSeconds: eta(12), previewEmoji: ['📊','📈','🎯','🔍','📉','🧮'], industryId: 'tech-saas' },
  { id: 'tsaas-security', name: 'Security & Trust', description: 'MFA, SSO, audit, encryption, threat', grouping: 'compliance', count: 10, tags: ['security','trust'], recommended: true, etaSeconds: eta(10), previewEmoji: ['🛡️','🔐','🪪','🔑','🚨','✅'], industryId: 'tech-saas' },
  { id: 'tsaas-devops', name: 'DevOps', description: 'Build, deploy, branch, pipeline, rollback', grouping: 'workflow', count: 10, tags: ['devops','ci'], etaSeconds: eta(10), previewEmoji: ['🚀','🔧','🌿','⚙️','🔄','📦'], industryId: 'tech-saas' },
  { id: 'tsaas-admin', name: 'Admin Console', description: 'Org, workspace, plan, seats, usage', grouping: 'department', count: 10, tags: ['admin'], etaSeconds: eta(10), previewEmoji: ['🏢','👥','📋','📊','🎛️','🔧'], industryId: 'tech-saas' },
  { id: 'tsaas-billing', name: 'Billing', description: 'Invoice, plan, seat, refund, coupon', grouping: 'department', count: 9, tags: ['billing'], etaSeconds: eta(9), previewEmoji: ['🧾','💳','💰','🎟️','📑','📊'], industryId: 'tech-saas' },
  { id: 'tsaas-support', name: 'Support & Docs', description: 'Ticket, knowledge, FAQ, chat, escalate', grouping: 'context', count: 9, tags: ['support'], etaSeconds: eta(9), previewEmoji: ['🎫','📚','💬','❓','🆘','📖'], industryId: 'tech-saas' },
  { id: 'tsaas-localization', name: 'Localization', description: 'Translate, locale, glossary, TM, QA', grouping: 'feature', count: 10, tags: ['l10n','i18n'], etaSeconds: eta(10), previewEmoji: ['🌐','🗣️','📚','✅','🔁','🌍'], industryId: 'tech-saas' },
  { id: 'tsaas-data-gov', name: 'Data Governance', description: 'Lineage, catalog, mask, retention, audit', grouping: 'compliance', count: 10, tags: ['data','gov'], etaSeconds: eta(10), previewEmoji: ['📂','🔍','🛡️','📜','🗂️','✅'], industryId: 'tech-saas' },
  { id: 'tsaas-users', name: 'User Management', description: 'Invite, role, scim, deactivate, sso', grouping: 'department', count: 9, tags: ['users'], etaSeconds: eta(9), previewEmoji: ['👤','👥','📧','🔑','🚪','🪪'], industryId: 'tech-saas' },
  { id: 'tsaas-workflow', name: 'Workflow Builder', description: 'Trigger, condition, branch, action, run', grouping: 'workflow', count: 10, tags: ['workflow'], etaSeconds: eta(10), previewEmoji: ['🧭','⚡','🌿','▶️','🔁','🎯'], industryId: 'tech-saas' },
  { id: 'tsaas-notif', name: 'Notifications', description: 'Push, email, in-app, digest, mute', grouping: 'channel', count: 8, tags: ['notifications'], etaSeconds: eta(8), previewEmoji: ['🔔','📧','💬','📨','🔕','📰'], industryId: 'tech-saas' },
  { id: 'tsaas-perm', name: 'Permissions', description: 'Role, scope, policy, grant, deny', grouping: 'compliance', count: 8, tags: ['perms'], etaSeconds: eta(8), previewEmoji: ['🪪','🛂','📜','✅','⛔','🔒'], industryId: 'tech-saas' },
  { id: 'tsaas-onboarding', name: 'Product Onboarding', description: 'Tour, tooltip, checklist, demo, invite', grouping: 'context', count: 8, tags: ['onboarding'], etaSeconds: eta(8), previewEmoji: ['🎉','💡','✅','📋','🎬','🤝'], industryId: 'tech-saas' },
];

/** TransPerfect-specific packs (16) */
const TRANSPERFECT_PACKS: PackTemplate[] = [
  { id: 'tp-lang', name: 'Language Services', description: 'Translation, interpretation, glossary, QA', grouping: 'feature', count: 10, tags: ['language','tp'], recommended: true, etaSeconds: eta(10), previewEmoji: ['🌐','🗣️','📚','✅','🔄','📝'], transperfect: true },
  { id: 'tp-globallink', name: 'GlobalLink', description: 'Connectors, TMS, CMS, workflow nodes', grouping: 'workflow', count: 12, tags: ['globallink','tp'], recommended: true, etaSeconds: eta(12), previewEmoji: ['🔗','⚙️','🌍','📡','🧩','🔁'], transperfect: true },
  { id: 'tp-ai', name: 'AI Solutions', description: 'Adaptive MT, AI review, content intel', grouping: 'feature', count: 10, tags: ['ai','tp'], recommended: true, etaSeconds: eta(10), previewEmoji: ['🤖','🧠','✨','🔮','🧪','📊'], transperfect: true },
  { id: 'tp-legal', name: 'Legal', description: 'eDiscovery, matter, redaction, contracts', grouping: 'compliance', count: 10, tags: ['legal','tp'], etaSeconds: eta(10), previewEmoji: ['⚖️','📑','🔒','✍️','🗂️','🛡️'], transperfect: true },
  { id: 'tp-life-sci', name: 'Life Sciences', description: 'Trials, regulatory, IFU, labels', grouping: 'compliance', count: 10, tags: ['life-sciences','tp'], etaSeconds: eta(10), previewEmoji: ['🧪','💉','📋','🧬','🔬','📊'], transperfect: true },
  { id: 'tp-medical', name: 'Medical Device', description: 'Device, instructions, packaging, MDR', grouping: 'compliance', count: 9, tags: ['medical','tp'], etaSeconds: eta(9), previewEmoji: ['🩻','🩺','📦','📋','🔧','🛡️'], transperfect: true },
  { id: 'tp-media', name: 'Media Localization', description: 'Subtitles, dubbing, voice-over, QC', grouping: 'feature', count: 10, tags: ['media','tp'], etaSeconds: eta(10), previewEmoji: ['🎬','🎙️','💬','🔊','🎞️','✅'], transperfect: true },
  { id: 'tp-gaming', name: 'Gaming', description: 'Player loc, QA, audio, build pipeline', grouping: 'feature', count: 9, tags: ['gaming','tp'], etaSeconds: eta(9), previewEmoji: ['🎮','🏆','💬','🎙️','🔧','🌐'], transperfect: true },
  { id: 'tp-retail', name: 'Retail', description: 'PIM, OMS, store, fulfillment loc', grouping: 'department', count: 9, tags: ['retail','tp'], etaSeconds: eta(9), previewEmoji: ['🛍️','📦','🏬','🚚','🏷️','🌐'], transperfect: true },
  { id: 'tp-financial', name: 'Financial', description: 'Filings, statements, disclosures, KYC', grouping: 'compliance', count: 9, tags: ['finance','tp'], etaSeconds: eta(9), previewEmoji: ['🏦','📑','📊','🪪','🔍','🛡️'], transperfect: true },
  { id: 'tp-travel', name: 'Travel', description: 'Booking, itinerary, loyalty, support', grouping: 'feature', count: 9, tags: ['travel','tp'], etaSeconds: eta(9), previewEmoji: ['✈️','🏨','🗺️','🎫','🛎️','🌐'], transperfect: true },
  { id: 'tp-technology', name: 'Technology', description: 'SDKs, docs, sandboxes, releases', grouping: 'feature', count: 9, tags: ['tech','tp'], etaSeconds: eta(9), previewEmoji: ['💻','📦','🧩','🚀','📚','🔧'], transperfect: true },
  { id: 'tp-healthcare', name: 'Healthcare', description: 'Patient, EHR, telehealth, compliance', grouping: 'department', count: 9, tags: ['healthcare','tp'], etaSeconds: eta(9), previewEmoji: ['🏥','📋','📹','🛡️','💊','🩺'], transperfect: true },
  { id: 'tp-support', name: 'Customer Support', description: 'Tickets, knowledge, multilingual chat', grouping: 'context', count: 8, tags: ['support','tp'], etaSeconds: eta(8), previewEmoji: ['💬','🎫','📚','🌐','🙋','✅'], transperfect: true },
  { id: 'tp-ops', name: 'Global Operations', description: 'Vendor, capacity, schedule, billing', grouping: 'department', count: 9, tags: ['ops','tp'], etaSeconds: eta(9), previewEmoji: ['🌍','🗓️','🤝','📊','💼','📈'], transperfect: true },
  { id: 'tp-trust', name: 'Compliance & Trust', description: 'ISO, SOC, GDPR, audit, signoff', grouping: 'compliance', count: 10, tags: ['compliance','tp'], recommended: true, etaSeconds: eta(10), previewEmoji: ['🛡️','✅','📜','🔒','🪪','🏅'], transperfect: true },
];

export const ALL_PACKS: PackTemplate[] = [...TECH_PACKS, ...TRANSPERFECT_PACKS];

export const getPacksForIndustry = (industryId: string): PackTemplate[] => {
  // TransPerfect packs are universal (brand-level), tech packs only for tech-saas.
  // For other industries, return only TP packs (you'll wire industry-specific
  // banks in later phases — Phase 1 ships TP + tech as the foundation).
  if (industryId === 'tech-saas') {
    return [...TECH_PACKS, ...TRANSPERFECT_PACKS];
  }
  return [...TRANSPERFECT_PACKS];
};

/* -------------------------------------------------------------------------- */
/* Status chip metadata                                                        */
/* -------------------------------------------------------------------------- */

export const STATUS_META: Record<
  SectionStatus,
  { label: string; tokenVar: string; ring: string }
> = {
  idle:       { label: 'Idle',          tokenVar: 'var(--tp-dark-gray)',        ring: 'var(--tp-dark-gray)' },
  queued:     { label: 'Queued',        tokenVar: 'var(--tp-blue-white)',       ring: 'var(--tp-blue-white)' },
  generating: { label: 'Generating',    tokenVar: 'var(--tp-light-blue)',       ring: 'var(--tp-light-blue)' },
  review:     { label: 'Needs review',  tokenVar: 'var(--tp-orange)',           ring: 'var(--tp-orange)' },
  approved:   { label: 'Approved',      tokenVar: 'var(--tp-green)',            ring: 'var(--tp-green)' },
  failed:     { label: 'Failed',        tokenVar: 'var(--tp-status-failed)',    ring: 'var(--tp-status-failed)' },
  locked:     { label: 'Locked',        tokenVar: 'var(--tp-purple)',           ring: 'var(--tp-purple)' },
};
