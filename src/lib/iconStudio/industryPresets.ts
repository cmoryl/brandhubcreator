/**
 * Industry presets for the Icon Studio wizard.
 *
 * Each industry ships with:
 *  - A curated "core" company set (universal icons every company needs).
 *  - A bank of sub-sets grouped three ways: by department, by feature/product,
 *    and by use-context — surfaced as tabs in the wizard.
 *
 * Sub-sets map onto the generate-icon-set edge function via { category,
 * sectionIndex } so each sub-set can be AI-generated independently.
 */

import {
  Cpu,
  Stethoscope,
  Landmark,
  ShoppingBag,
  type LucideIcon,
} from 'lucide-react';

export type SubSetGrouping = 'department' | 'feature' | 'context';

export interface SubSetTemplate {
  id: string;
  name: string;
  description: string;
  grouping: SubSetGrouping;
  /** Edge-function category name (key of ICON_TAXONOMY) */
  category: string;
  /** Index of the section inside that category to generate */
  sectionIndex: number;
  /** Approx count, surfaced as a chip */
  count: number;
  emoji: string;
}

export interface CoreSetEntry {
  category: string;
  sectionIndex: number;
  label: string;
  count: number;
}

export interface IndustryPreset {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: LucideIcon;
  /** HSL tokens for the showroom card background */
  accent: string;
  /** Sample icons rendered as preview chips */
  sampleEmojis: string[];
  /** The "company core" set — generated first */
  coreSet: CoreSetEntry[];
  subSets: SubSetTemplate[];
}

/* -------------------------------------------------------------------------- */
/* Shared core (every industry uses these foundations)                        */
/* -------------------------------------------------------------------------- */

const SHARED_CORE: CoreSetEntry[] = [
  { category: 'Foundation', sectionIndex: 0, label: 'Navigation', count: 30 },
  { category: 'Foundation', sectionIndex: 1, label: 'UI States', count: 30 },
  { category: 'Foundation', sectionIndex: 2, label: 'Basic Logic', count: 30 },
  { category: 'Communication', sectionIndex: 0, label: 'Messaging', count: 30 },
  { category: 'Communication', sectionIndex: 1, label: 'Notifications', count: 30 },
];

/* -------------------------------------------------------------------------- */
/* Industries                                                                  */
/* -------------------------------------------------------------------------- */

export const INDUSTRY_PRESETS: IndustryPreset[] = [
  {
    id: 'tech-saas',
    name: 'Tech / SaaS',
    tagline: 'Dashboards, APIs, integrations.',
    description:
      'Built for product teams shipping dashboards, developer tools, and platform features.',
    icon: Cpu,
    accent: '220 90% 56%',
    sampleEmojis: ['⚙️', '📊', '🔐', '🔌', '⚡', '🧩'],
    coreSet: SHARED_CORE,
    subSets: [
      // Department
      { id: 'tech-dept-eng', name: 'Engineering', description: 'Repos, deploys, branches, builds', grouping: 'department', category: 'SaaS/Data', sectionIndex: 3, count: 30, emoji: '👩‍💻' },
      { id: 'tech-dept-prod', name: 'Product', description: 'Roadmap, sprints, backlog, releases', grouping: 'department', category: 'SaaS/Data', sectionIndex: 2, count: 30, emoji: '🧭' },
      { id: 'tech-dept-mkt', name: 'Marketing', description: 'Campaigns, growth, attribution', grouping: 'department', category: 'Marketing Hero', sectionIndex: 0, count: 30, emoji: '📈' },
      // Feature
      { id: 'tech-feat-analytics', name: 'Analytics', description: 'Charts, KPIs, dashboards', grouping: 'feature', category: 'SaaS/Data', sectionIndex: 0, count: 30, emoji: '📊' },
      { id: 'tech-feat-security', name: 'Security & Auth', description: 'Locks, keys, MFA, audit', grouping: 'feature', category: 'SaaS/Data', sectionIndex: 1, count: 30, emoji: '🛡️' },
      { id: 'tech-feat-api', name: 'API & Integrations', description: 'Webhooks, plugins, SDK', grouping: 'feature', category: 'SaaS/Data', sectionIndex: 3, count: 30, emoji: '🧩' },
      // Context
      { id: 'tech-ctx-support', name: 'Support & Docs', description: 'Help, FAQ, contact', grouping: 'context', category: 'Communication', sectionIndex: 3, count: 30, emoji: '💬' },
      { id: 'tech-ctx-trust', name: 'Trust Signals', description: 'Verified, secured, guaranteed', grouping: 'context', category: 'Marketing Hero', sectionIndex: 2, count: 30, emoji: '✅' },
    ],
  },
  {
    id: 'healthcare',
    name: 'Healthcare',
    tagline: 'Patients, care, records, telehealth.',
    description:
      'For clinics, hospitals, and digital health platforms — clinical and patient-facing icons.',
    icon: Stethoscope,
    accent: '160 70% 42%',
    sampleEmojis: ['🩺', '💊', '🧬', '📋', '🏥', '🧪'],
    coreSet: SHARED_CORE,
    subSets: [
      { id: 'hc-dept-clinical', name: 'Clinical', description: 'Vitals, diagnosis, treatment', grouping: 'department', category: 'Industry Specific', sectionIndex: 1, count: 5, emoji: '🩻' },
      { id: 'hc-dept-admin', name: 'Administration', description: 'Billing, scheduling, records', grouping: 'department', category: 'SaaS/Data', sectionIndex: 2, count: 5, emoji: '🗂️' },
      { id: 'hc-dept-pharm', name: 'Pharmacy', description: 'Prescriptions, refills, dosage', grouping: 'department', category: 'Industry Specific', sectionIndex: 0, count: 5, emoji: '💊' },

      { id: 'hc-feat-telehealth', name: 'Telehealth', description: 'Video visit, chat, schedule', grouping: 'feature', category: 'Communication', sectionIndex: 0, count: 6, emoji: '📹' },
      { id: 'hc-feat-records', name: 'Records (EHR)', description: 'Files, history, labs', grouping: 'feature', category: 'Industry Specific', sectionIndex: 2, count: 4, emoji: '📋' },
      { id: 'hc-feat-monitor', name: 'Monitoring', description: 'Heart rate, alerts, devices', grouping: 'feature', category: 'Communication', sectionIndex: 1, count: 5, emoji: '❤️' },

      { id: 'hc-ctx-patient', name: 'Patient Experience', description: 'Onboarding, consent, FAQ', grouping: 'context', category: 'Communication', sectionIndex: 3, count: 4, emoji: '🧑‍⚕️' },
      { id: 'hc-ctx-compliance', name: 'Compliance', description: 'HIPAA, audit, verified', grouping: 'context', category: 'SaaS/Data', sectionIndex: 1, count: 5, emoji: '🛡️' },
    ],
  },
  {
    id: 'finance',
    name: 'Finance / Fintech',
    tagline: 'Accounts, cards, invest, compliance.',
    description:
      'Banking, payments, investments, and compliance — for fintechs and financial institutions.',
    icon: Landmark,
    accent: '270 75% 58%',
    sampleEmojis: ['💳', '🏦', '📈', '💰', '🔐', '🧾'],
    coreSet: SHARED_CORE,
    subSets: [
      { id: 'fi-dept-retail', name: 'Retail Banking', description: 'Accounts, cards, transfers', grouping: 'department', category: 'E-Commerce', sectionIndex: 1, count: 5, emoji: '💳' },
      { id: 'fi-dept-invest', name: 'Investments', description: 'Portfolio, stocks, gains', grouping: 'department', category: 'Marketing Hero', sectionIndex: 0, count: 5, emoji: '📈' },
      { id: 'fi-dept-compliance', name: 'Compliance', description: 'KYC, audit, regulation', grouping: 'department', category: 'SaaS/Data', sectionIndex: 1, count: 5, emoji: '🛡️' },

      { id: 'fi-feat-payments', name: 'Payments', description: 'Cards, wallet, P2P, invoices', grouping: 'feature', category: 'E-Commerce', sectionIndex: 1, count: 5, emoji: '💸' },
      { id: 'fi-feat-lending', name: 'Lending', description: 'Loans, mortgage, credit', grouping: 'feature', category: 'Industry Specific', sectionIndex: 0, count: 5, emoji: '🏦' },
      { id: 'fi-feat-fraud', name: 'Fraud & Risk', description: 'Alert, block, verify', grouping: 'feature', category: 'SaaS/Data', sectionIndex: 1, count: 5, emoji: '🚨' },

      { id: 'fi-ctx-trust', name: 'Trust & Security', description: 'Secured, insured, verified', grouping: 'context', category: 'Marketing Hero', sectionIndex: 2, count: 4, emoji: '🔒' },
      { id: 'fi-ctx-rewards', name: 'Rewards', description: 'Points, cashback, perks', grouping: 'context', category: 'E-Commerce', sectionIndex: 3, count: 3, emoji: '🎁' },
    ],
  },
  {
    id: 'ecommerce',
    name: 'E-commerce / Retail',
    tagline: 'Cart, checkout, shipping, loyalty.',
    description:
      'Storefronts, marketplaces, and DTC brands — shopping, fulfillment, and post-purchase.',
    icon: ShoppingBag,
    accent: '20 90% 56%',
    sampleEmojis: ['🛒', '📦', '🚚', '⭐', '🎁', '🏷️'],
    coreSet: SHARED_CORE,
    subSets: [
      { id: 'ec-dept-merch', name: 'Merchandising', description: 'Catalog, inventory, tags', grouping: 'department', category: 'E-Commerce', sectionIndex: 0, count: 5, emoji: '🏷️' },
      { id: 'ec-dept-ops', name: 'Operations', description: 'Warehouse, fulfillment, returns', grouping: 'department', category: 'E-Commerce', sectionIndex: 2, count: 5, emoji: '📦' },
      { id: 'ec-dept-mkt', name: 'Marketing', description: 'Promo, email, campaigns', grouping: 'department', category: 'Marketing Hero', sectionIndex: 0, count: 5, emoji: '📣' },

      { id: 'ec-feat-cart', name: 'Cart & Checkout', description: 'Cart, wishlist, pay', grouping: 'feature', category: 'E-Commerce', sectionIndex: 0, count: 5, emoji: '🛒' },
      { id: 'ec-feat-shipping', name: 'Shipping & Returns', description: 'Track, deliver, return', grouping: 'feature', category: 'E-Commerce', sectionIndex: 2, count: 5, emoji: '🚚' },
      { id: 'ec-feat-loyalty', name: 'Loyalty', description: 'Rewards, membership, gifts', grouping: 'feature', category: 'E-Commerce', sectionIndex: 3, count: 3, emoji: '⭐' },

      { id: 'ec-ctx-reviews', name: 'Reviews & Social', description: 'Stars, share, like', grouping: 'context', category: 'Communication', sectionIndex: 2, count: 5, emoji: '⭐' },
      { id: 'ec-ctx-support', name: 'Support', description: 'Help, returns, FAQ', grouping: 'context', category: 'Communication', sectionIndex: 3, count: 4, emoji: '💬' },
    ],
  },
];

export const getIndustryById = (id: string) =>
  INDUSTRY_PRESETS.find((i) => i.id === id) ?? null;

export const SUBSET_GROUPINGS: Array<{ id: SubSetGrouping; label: string; description: string }> = [
  { id: 'department', label: 'By department', description: 'Sales, eng, ops…' },
  { id: 'feature', label: 'By product / feature', description: 'Module-driven' },
  { id: 'context', label: 'By use context', description: 'Trust, support, social' },
];
