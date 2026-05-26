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
  Scale,
  GraduationCap,
  Home,
  UtensilsCrossed,
  Factory,
  Truck,
  Clapperboard,
  Zap,
  Car,
  Plane,
  HeartHandshake,
  Building2,
  Sprout,
  HardHat,
  Languages,
  Dumbbell,
  Hotel,
  Briefcase,
  Rocket,
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
      { id: 'hc-dept-clinical', name: 'Clinical', description: 'Vitals, diagnosis, treatment', grouping: 'department', category: 'Industry Specific', sectionIndex: 1, count: 30, emoji: '🩻' },
      { id: 'hc-dept-admin', name: 'Administration', description: 'Billing, scheduling, records', grouping: 'department', category: 'SaaS/Data', sectionIndex: 2, count: 30, emoji: '🗂️' },
      { id: 'hc-dept-pharm', name: 'Pharmacy', description: 'Prescriptions, refills, dosage', grouping: 'department', category: 'Industry Specific', sectionIndex: 0, count: 30, emoji: '💊' },

      { id: 'hc-feat-telehealth', name: 'Telehealth', description: 'Video visit, chat, schedule', grouping: 'feature', category: 'Communication', sectionIndex: 0, count: 30, emoji: '📹' },
      { id: 'hc-feat-records', name: 'Records (EHR)', description: 'Files, history, labs', grouping: 'feature', category: 'Industry Specific', sectionIndex: 2, count: 30, emoji: '📋' },
      { id: 'hc-feat-monitor', name: 'Monitoring', description: 'Heart rate, alerts, devices', grouping: 'feature', category: 'Communication', sectionIndex: 1, count: 30, emoji: '❤️' },

      { id: 'hc-ctx-patient', name: 'Patient Experience', description: 'Onboarding, consent, FAQ', grouping: 'context', category: 'Communication', sectionIndex: 3, count: 30, emoji: '🧑‍⚕️' },
      { id: 'hc-ctx-compliance', name: 'Compliance', description: 'HIPAA, audit, verified', grouping: 'context', category: 'SaaS/Data', sectionIndex: 1, count: 30, emoji: '🛡️' },
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
      { id: 'fi-dept-retail', name: 'Retail Banking', description: 'Accounts, cards, transfers', grouping: 'department', category: 'E-Commerce', sectionIndex: 1, count: 30, emoji: '💳' },
      { id: 'fi-dept-invest', name: 'Investments', description: 'Portfolio, stocks, gains', grouping: 'department', category: 'Marketing Hero', sectionIndex: 0, count: 30, emoji: '📈' },
      { id: 'fi-dept-compliance', name: 'Compliance', description: 'KYC, audit, regulation', grouping: 'department', category: 'SaaS/Data', sectionIndex: 1, count: 30, emoji: '🛡️' },

      { id: 'fi-feat-payments', name: 'Payments', description: 'Cards, wallet, P2P, invoices', grouping: 'feature', category: 'E-Commerce', sectionIndex: 1, count: 30, emoji: '💸' },
      { id: 'fi-feat-lending', name: 'Lending', description: 'Loans, mortgage, credit', grouping: 'feature', category: 'Industry Specific', sectionIndex: 0, count: 30, emoji: '🏦' },
      { id: 'fi-feat-fraud', name: 'Fraud & Risk', description: 'Alert, block, verify', grouping: 'feature', category: 'SaaS/Data', sectionIndex: 1, count: 30, emoji: '🚨' },

      { id: 'fi-ctx-trust', name: 'Trust & Security', description: 'Secured, insured, verified', grouping: 'context', category: 'Marketing Hero', sectionIndex: 2, count: 30, emoji: '🔒' },
      { id: 'fi-ctx-rewards', name: 'Rewards', description: 'Points, cashback, perks', grouping: 'context', category: 'E-Commerce', sectionIndex: 3, count: 30, emoji: '🎁' },
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
      { id: 'ec-dept-merch', name: 'Merchandising', description: 'Catalog, inventory, tags', grouping: 'department', category: 'E-Commerce', sectionIndex: 0, count: 30, emoji: '🏷️' },
      { id: 'ec-dept-ops', name: 'Operations', description: 'Warehouse, fulfillment, returns', grouping: 'department', category: 'E-Commerce', sectionIndex: 2, count: 30, emoji: '📦' },
      { id: 'ec-dept-mkt', name: 'Marketing', description: 'Promo, email, campaigns', grouping: 'department', category: 'Marketing Hero', sectionIndex: 0, count: 30, emoji: '📣' },

      { id: 'ec-feat-cart', name: 'Cart & Checkout', description: 'Cart, wishlist, pay', grouping: 'feature', category: 'E-Commerce', sectionIndex: 0, count: 30, emoji: '🛒' },
      { id: 'ec-feat-shipping', name: 'Shipping & Returns', description: 'Track, deliver, return', grouping: 'feature', category: 'E-Commerce', sectionIndex: 2, count: 30, emoji: '🚚' },
      { id: 'ec-feat-loyalty', name: 'Loyalty', description: 'Rewards, membership, gifts', grouping: 'feature', category: 'E-Commerce', sectionIndex: 3, count: 30, emoji: '⭐' },

      { id: 'ec-ctx-reviews', name: 'Reviews & Social', description: 'Stars, share, like', grouping: 'context', category: 'Communication', sectionIndex: 2, count: 30, emoji: '⭐' },
      { id: 'ec-ctx-support', name: 'Support', description: 'Help, returns, FAQ', grouping: 'context', category: 'Communication', sectionIndex: 3, count: 30, emoji: '💬' },
    ],
  },
  {
    id: 'legal',
    name: 'Legal / Professional Services',
    tagline: 'Cases, contracts, compliance.',
    description: 'Law firms, consultancies, and advisory practices — matters, documents, billing, and client trust.',
    icon: Scale,
    accent: '230 40% 40%',
    sampleEmojis: ['⚖️', '📑', '🗂️', '🔒', '🖋️', '🏛️'],
    coreSet: SHARED_CORE,
    subSets: [
      { id: 'lg-dept-litigation', name: 'Litigation', description: 'Cases, filings, hearings', grouping: 'department', category: 'Industry Specific', sectionIndex: 2, count: 30, emoji: '⚖️' },
      { id: 'lg-dept-corporate', name: 'Corporate', description: 'M&A, contracts, governance', grouping: 'department', category: 'Industry Specific', sectionIndex: 0, count: 30, emoji: '🏛️' },
      { id: 'lg-dept-billing', name: 'Billing & Ops', description: 'Time, invoices, trust accounts', grouping: 'department', category: 'SaaS/Data', sectionIndex: 2, count: 30, emoji: '🧾' },

      { id: 'lg-feat-docs', name: 'Document Management', description: 'Sign, redline, version', grouping: 'feature', category: 'SaaS/Data', sectionIndex: 0, count: 30, emoji: '📑' },
      { id: 'lg-feat-research', name: 'Legal Research', description: 'Citations, statutes, briefs', grouping: 'feature', category: 'SaaS/Data', sectionIndex: 3, count: 30, emoji: '🔍' },
      { id: 'lg-feat-compliance', name: 'Compliance & eDiscovery', description: 'Audit, holds, review', grouping: 'feature', category: 'SaaS/Data', sectionIndex: 1, count: 30, emoji: '🛡️' },

      { id: 'lg-ctx-client', name: 'Client Portal', description: 'Intake, status, messages', grouping: 'context', category: 'Communication', sectionIndex: 3, count: 30, emoji: '💼' },
      { id: 'lg-ctx-trust', name: 'Trust & Confidentiality', description: 'Privileged, secured, sealed', grouping: 'context', category: 'Marketing Hero', sectionIndex: 2, count: 30, emoji: '🔒' },
    ],
  },
  {
    id: 'education',
    name: 'Education / EdTech',
    tagline: 'Courses, learners, outcomes.',
    description: 'Schools, universities, and learning platforms — courseware, assessments, and learner success.',
    icon: GraduationCap,
    accent: '270 70% 55%',
    sampleEmojis: ['🎓', '📚', '✏️', '🧪', '🏆', '🧑‍🏫'],
    coreSet: SHARED_CORE,
    subSets: [
      { id: 'ed-dept-academic', name: 'Academic', description: 'Courses, faculty, schedule', grouping: 'department', category: 'Industry Specific', sectionIndex: 0, count: 30, emoji: '📚' },
      { id: 'ed-dept-admissions', name: 'Admissions', description: 'Apply, enroll, financial aid', grouping: 'department', category: 'SaaS/Data', sectionIndex: 2, count: 30, emoji: '🎟️' },
      { id: 'ed-dept-student', name: 'Student Services', description: 'Advising, housing, wellness', grouping: 'department', category: 'Communication', sectionIndex: 3, count: 30, emoji: '🧑‍🎓' },

      { id: 'ed-feat-lms', name: 'LMS & Courseware', description: 'Lessons, modules, video', grouping: 'feature', category: 'SaaS/Data', sectionIndex: 0, count: 30, emoji: '🖥️' },
      { id: 'ed-feat-assess', name: 'Assessments', description: 'Quiz, exam, grading', grouping: 'feature', category: 'SaaS/Data', sectionIndex: 3, count: 30, emoji: '📝' },
      { id: 'ed-feat-collab', name: 'Collaboration', description: 'Discussions, groups, peer', grouping: 'feature', category: 'Communication', sectionIndex: 0, count: 30, emoji: '👥' },

      { id: 'ed-ctx-achieve', name: 'Achievement', description: 'Badges, certificates, awards', grouping: 'context', category: 'Marketing Hero', sectionIndex: 2, count: 30, emoji: '🏆' },
      { id: 'ed-ctx-accessibility', name: 'Accessibility', description: 'Captions, contrast, reader', grouping: 'context', category: 'Foundation', sectionIndex: 1, count: 30, emoji: '♿' },
    ],
  },
  {
    id: 'realestate',
    name: 'Real Estate / PropTech',
    tagline: 'Listings, tours, transactions.',
    description: 'Brokerages, property managers, and proptech — listings, tours, leasing, and closings.',
    icon: Home,
    accent: '160 50% 40%',
    sampleEmojis: ['🏠', '🔑', '📍', '📷', '📝', '🏷️'],
    coreSet: SHARED_CORE,
    subSets: [
      { id: 're-dept-sales', name: 'Sales / Brokerage', description: 'Listings, offers, agents', grouping: 'department', category: 'Industry Specific', sectionIndex: 0, count: 30, emoji: '🏷️' },
      { id: 're-dept-pm', name: 'Property Management', description: 'Tenants, leases, maintenance', grouping: 'department', category: 'Industry Specific', sectionIndex: 2, count: 30, emoji: '🛠️' },
      { id: 're-dept-finance', name: 'Finance & Closing', description: 'Mortgage, escrow, taxes', grouping: 'department', category: 'SaaS/Data', sectionIndex: 2, count: 30, emoji: '💰' },

      { id: 're-feat-search', name: 'Search & Discovery', description: 'Filters, map, saved', grouping: 'feature', category: 'Foundation', sectionIndex: 0, count: 30, emoji: '🔍' },
      { id: 're-feat-tours', name: 'Tours & Media', description: '3D, photo, video, VR', grouping: 'feature', category: 'Communication', sectionIndex: 2, count: 30, emoji: '📷' },
      { id: 're-feat-docs', name: 'Documents & e-Sign', description: 'Contracts, disclosure, sign', grouping: 'feature', category: 'SaaS/Data', sectionIndex: 0, count: 30, emoji: '🖋️' },

      { id: 're-ctx-neighborhood', name: 'Neighborhood', description: 'Schools, transit, amenities', grouping: 'context', category: 'Industry Specific', sectionIndex: 1, count: 30, emoji: '🏙️' },
      { id: 're-ctx-trust', name: 'Trust Signals', description: 'Verified, certified, secure', grouping: 'context', category: 'Marketing Hero', sectionIndex: 2, count: 30, emoji: '✅' },
    ],
  },
  {
    id: 'hospitality',
    name: 'Hospitality / Food & Beverage',
    tagline: 'Reservations, menus, service.',
    description: 'Restaurants, cafés, and venues — bookings, kitchen ops, and guest experience.',
    icon: UtensilsCrossed,
    accent: '15 80% 55%',
    sampleEmojis: ['🍽️', '🥂', '📅', '👨‍🍳', '🧾', '⭐'],
    coreSet: SHARED_CORE,
    subSets: [
      { id: 'hp-dept-foh', name: 'Front of House', description: 'Reservations, host, server', grouping: 'department', category: 'Industry Specific', sectionIndex: 0, count: 30, emoji: '🧑‍🍳' },
      { id: 'hp-dept-boh', name: 'Back of House', description: 'Kitchen, prep, inventory', grouping: 'department', category: 'Industry Specific', sectionIndex: 2, count: 30, emoji: '🍳' },
      { id: 'hp-dept-mgmt', name: 'Management', description: 'Staffing, payroll, reports', grouping: 'department', category: 'SaaS/Data', sectionIndex: 2, count: 30, emoji: '📊' },

      { id: 'hp-feat-menu', name: 'Menu & Ordering', description: 'Dishes, drinks, sides', grouping: 'feature', category: 'E-Commerce', sectionIndex: 0, count: 30, emoji: '📖' },
      { id: 'hp-feat-pay', name: 'Payments & Tips', description: 'Bill, split, tip, receipt', grouping: 'feature', category: 'E-Commerce', sectionIndex: 1, count: 30, emoji: '💳' },
      { id: 'hp-feat-reserv', name: 'Reservations', description: 'Book, waitlist, party', grouping: 'feature', category: 'Communication', sectionIndex: 1, count: 30, emoji: '📅' },

      { id: 'hp-ctx-reviews', name: 'Reviews & Loyalty', description: 'Stars, perks, return', grouping: 'context', category: 'E-Commerce', sectionIndex: 3, count: 30, emoji: '⭐' },
      { id: 'hp-ctx-dietary', name: 'Dietary & Allergens', description: 'Vegan, gluten, nut-free', grouping: 'context', category: 'Industry Specific', sectionIndex: 1, count: 30, emoji: '🌱' },
    ],
  },
  {
    id: 'hotel',
    name: 'Travel / Hotel',
    tagline: 'Stays, rooms, concierge.',
    description: 'Hotels, resorts, and OTAs — booking, check-in, amenities, and loyalty.',
    icon: Hotel,
    accent: '200 70% 45%',
    sampleEmojis: ['🏨', '🛏️', '🔑', '🧳', '🏊', '🛎️'],
    coreSet: SHARED_CORE,
    subSets: [
      { id: 'ht-dept-fd', name: 'Front Desk', description: 'Check-in, key, concierge', grouping: 'department', category: 'Industry Specific', sectionIndex: 0, count: 30, emoji: '🛎️' },
      { id: 'ht-dept-house', name: 'Housekeeping', description: 'Rooms, linen, turnover', grouping: 'department', category: 'Industry Specific', sectionIndex: 2, count: 30, emoji: '🧹' },
      { id: 'ht-dept-rev', name: 'Revenue & Sales', description: 'Rates, groups, OTA', grouping: 'department', category: 'SaaS/Data', sectionIndex: 0, count: 30, emoji: '📈' },

      { id: 'ht-feat-booking', name: 'Booking Engine', description: 'Search, room type, dates', grouping: 'feature', category: 'E-Commerce', sectionIndex: 0, count: 30, emoji: '📅' },
      { id: 'ht-feat-amenity', name: 'Amenities', description: 'Pool, spa, gym, wifi', grouping: 'feature', category: 'Industry Specific', sectionIndex: 1, count: 30, emoji: '🏊' },
      { id: 'ht-feat-loyalty', name: 'Loyalty', description: 'Tier, points, perks', grouping: 'feature', category: 'E-Commerce', sectionIndex: 3, count: 30, emoji: '⭐' },

      { id: 'ht-ctx-trip', name: 'Trip Experience', description: 'Itinerary, local, transit', grouping: 'context', category: 'Communication', sectionIndex: 0, count: 30, emoji: '🧳' },
      { id: 'ht-ctx-safety', name: 'Safety & Hygiene', description: 'Clean, contactless, sanitized', grouping: 'context', category: 'Marketing Hero', sectionIndex: 2, count: 30, emoji: '🧼' },
    ],
  },
  {
    id: 'manufacturing',
    name: 'Manufacturing / Industrial',
    tagline: 'Plant, parts, production.',
    description: 'Factories, OEMs, and supply chain — production lines, quality, and maintenance.',
    icon: Factory,
    accent: '210 15% 40%',
    sampleEmojis: ['🏭', '⚙️', '🛠️', '📦', '🦺', '🔧'],
    coreSet: SHARED_CORE,
    subSets: [
      { id: 'mf-dept-prod', name: 'Production', description: 'Lines, shifts, output', grouping: 'department', category: 'Industry Specific', sectionIndex: 0, count: 30, emoji: '🏭' },
      { id: 'mf-dept-quality', name: 'Quality', description: 'Inspection, defect, audit', grouping: 'department', category: 'Industry Specific', sectionIndex: 1, count: 30, emoji: '🔬' },
      { id: 'mf-dept-maint', name: 'Maintenance', description: 'PM, repair, downtime', grouping: 'department', category: 'Industry Specific', sectionIndex: 2, count: 30, emoji: '🛠️' },

      { id: 'mf-feat-inv', name: 'Inventory / BOM', description: 'Parts, stock, kit', grouping: 'feature', category: 'SaaS/Data', sectionIndex: 0, count: 30, emoji: '📦' },
      { id: 'mf-feat-iot', name: 'IoT & Sensors', description: 'Telemetry, alerts, gauges', grouping: 'feature', category: 'SaaS/Data', sectionIndex: 3, count: 30, emoji: '📡' },
      { id: 'mf-feat-supply', name: 'Supply Chain', description: 'PO, vendor, lead time', grouping: 'feature', category: 'E-Commerce', sectionIndex: 2, count: 30, emoji: '🚚' },

      { id: 'mf-ctx-safety', name: 'Safety & PPE', description: 'Hard hat, lockout, warning', grouping: 'context', category: 'Industry Specific', sectionIndex: 1, count: 30, emoji: '🦺' },
      { id: 'mf-ctx-sustain', name: 'Sustainability', description: 'Recycle, energy, emissions', grouping: 'context', category: 'Industry Specific', sectionIndex: 2, count: 30, emoji: '♻️' },
    ],
  },
  {
    id: 'logistics',
    name: 'Logistics / Supply Chain',
    tagline: 'Ship, track, deliver.',
    description: 'Carriers, 3PLs, and freight — routing, warehousing, and last-mile delivery.',
    icon: Truck,
    accent: '35 90% 50%',
    sampleEmojis: ['🚚', '📍', '📦', '🛳️', '✈️', '🗺️'],
    coreSet: SHARED_CORE,
    subSets: [
      { id: 'lg2-dept-ware', name: 'Warehouse', description: 'Pick, pack, slot, count', grouping: 'department', category: 'E-Commerce', sectionIndex: 2, count: 30, emoji: '🏬' },
      { id: 'lg2-dept-transport', name: 'Transportation', description: 'Routes, fleet, driver', grouping: 'department', category: 'Industry Specific', sectionIndex: 0, count: 30, emoji: '🚛' },
      { id: 'lg2-dept-customs', name: 'Customs & Trade', description: 'Tariff, broker, manifest', grouping: 'department', category: 'Industry Specific', sectionIndex: 1, count: 30, emoji: '🛃' },

      { id: 'lg2-feat-track', name: 'Tracking', description: 'Status, ETA, location', grouping: 'feature', category: 'SaaS/Data', sectionIndex: 0, count: 30, emoji: '📍' },
      { id: 'lg2-feat-last', name: 'Last Mile', description: 'Delivery, proof, signature', grouping: 'feature', category: 'E-Commerce', sectionIndex: 2, count: 30, emoji: '📬' },
      { id: 'lg2-feat-cold', name: 'Cold Chain', description: 'Temp, hazard, sensitive', grouping: 'feature', category: 'Industry Specific', sectionIndex: 2, count: 30, emoji: '❄️' },

      { id: 'lg2-ctx-eco', name: 'Carbon & Eco', description: 'Green, offset, EV', grouping: 'context', category: 'Industry Specific', sectionIndex: 2, count: 30, emoji: '🌱' },
      { id: 'lg2-ctx-support', name: 'Customer Support', description: 'Claims, returns, chat', grouping: 'context', category: 'Communication', sectionIndex: 3, count: 30, emoji: '💬' },
    ],
  },
  {
    id: 'media',
    name: 'Media / Entertainment',
    tagline: 'Stream, publish, engage.',
    description: 'Studios, publishers, and streaming platforms — content, distribution, and audience.',
    icon: Clapperboard,
    accent: '320 70% 55%',
    sampleEmojis: ['🎬', '📺', '🎙️', '🎵', '📰', '🎟️'],
    coreSet: SHARED_CORE,
    subSets: [
      { id: 'md-dept-prod', name: 'Production', description: 'Script, shoot, edit', grouping: 'department', category: 'Industry Specific', sectionIndex: 0, count: 30, emoji: '🎬' },
      { id: 'md-dept-dist', name: 'Distribution', description: 'Channels, rights, schedule', grouping: 'department', category: 'Industry Specific', sectionIndex: 2, count: 30, emoji: '📡' },
      { id: 'md-dept-audience', name: 'Audience', description: 'Subscribers, segments, CRM', grouping: 'department', category: 'SaaS/Data', sectionIndex: 0, count: 30, emoji: '👥' },

      { id: 'md-feat-stream', name: 'Streaming', description: 'Play, pause, quality, cc', grouping: 'feature', category: 'Communication', sectionIndex: 2, count: 30, emoji: '▶️' },
      { id: 'md-feat-podcast', name: 'Podcast / Audio', description: 'Mic, episodes, RSS', grouping: 'feature', category: 'Communication', sectionIndex: 0, count: 30, emoji: '🎙️' },
      { id: 'md-feat-news', name: 'News & Publishing', description: 'Article, byline, edition', grouping: 'feature', category: 'Industry Specific', sectionIndex: 1, count: 30, emoji: '📰' },

      { id: 'md-ctx-social', name: 'Social & Share', description: 'Like, share, comment', grouping: 'context', category: 'Communication', sectionIndex: 2, count: 30, emoji: '❤️' },
      { id: 'md-ctx-rights', name: 'Rights & DRM', description: 'License, region, watermark', grouping: 'context', category: 'SaaS/Data', sectionIndex: 1, count: 30, emoji: '🔐' },
    ],
  },
  {
    id: 'energy',
    name: 'Energy / Utilities',
    tagline: 'Grid, meter, sustainability.',
    description: 'Utilities, oil & gas, and renewables — generation, distribution, and consumption.',
    icon: Zap,
    accent: '50 95% 50%',
    sampleEmojis: ['⚡', '🔋', '🌬️', '☀️', '🛢️', '📊'],
    coreSet: SHARED_CORE,
    subSets: [
      { id: 'en-dept-gen', name: 'Generation', description: 'Solar, wind, hydro, gas', grouping: 'department', category: 'Industry Specific', sectionIndex: 0, count: 30, emoji: '⚡' },
      { id: 'en-dept-grid', name: 'Grid / Distribution', description: 'Substation, lines, outage', grouping: 'department', category: 'Industry Specific', sectionIndex: 2, count: 30, emoji: '🏗️' },
      { id: 'en-dept-trade', name: 'Trading & Markets', description: 'Pricing, contracts, hedge', grouping: 'department', category: 'SaaS/Data', sectionIndex: 0, count: 30, emoji: '📈' },

      { id: 'en-feat-meter', name: 'Smart Meter', description: 'Usage, bill, anomaly', grouping: 'feature', category: 'SaaS/Data', sectionIndex: 3, count: 30, emoji: '🔢' },
      { id: 'en-feat-ev', name: 'EV / Charging', description: 'Charger, station, plug', grouping: 'feature', category: 'Industry Specific', sectionIndex: 1, count: 30, emoji: '🔌' },
      { id: 'en-feat-monitor', name: 'Monitoring', description: 'SCADA, alerts, gauges', grouping: 'feature', category: 'SaaS/Data', sectionIndex: 1, count: 30, emoji: '📡' },

      { id: 'en-ctx-sustain', name: 'Sustainability', description: 'Carbon, renewable, offset', grouping: 'context', category: 'Industry Specific', sectionIndex: 2, count: 30, emoji: '🌱' },
      { id: 'en-ctx-safety', name: 'Safety', description: 'High voltage, lockout, PPE', grouping: 'context', category: 'Industry Specific', sectionIndex: 1, count: 30, emoji: '⚠️' },
    ],
  },
  {
    id: 'automotive',
    name: 'Automotive / Mobility',
    tagline: 'Vehicles, service, mobility.',
    description: 'OEMs, dealers, and mobility services — sales, service, and connected vehicle.',
    icon: Car,
    accent: '0 70% 50%',
    sampleEmojis: ['🚗', '🔧', '⛽', '🔑', '📲', '🛞'],
    coreSet: SHARED_CORE,
    subSets: [
      { id: 'au-dept-sales', name: 'Sales / Dealer', description: 'Inventory, trade-in, finance', grouping: 'department', category: 'E-Commerce', sectionIndex: 0, count: 30, emoji: '🚗' },
      { id: 'au-dept-service', name: 'Service', description: 'Bay, parts, work order', grouping: 'department', category: 'Industry Specific', sectionIndex: 2, count: 30, emoji: '🔧' },
      { id: 'au-dept-fleet', name: 'Fleet', description: 'Vehicles, driver, telematics', grouping: 'department', category: 'Industry Specific', sectionIndex: 0, count: 30, emoji: '🚐' },

      { id: 'au-feat-connect', name: 'Connected Car', description: 'App, remote, OTA', grouping: 'feature', category: 'SaaS/Data', sectionIndex: 3, count: 30, emoji: '📲' },
      { id: 'au-feat-ev', name: 'EV & Charging', description: 'Battery, range, plug', grouping: 'feature', category: 'Industry Specific', sectionIndex: 1, count: 30, emoji: '🔋' },
      { id: 'au-feat-adas', name: 'ADAS / Safety', description: 'Lane, brake, sensor', grouping: 'feature', category: 'Industry Specific', sectionIndex: 1, count: 30, emoji: '🛡️' },

      { id: 'au-ctx-rideshare', name: 'Rideshare / Rental', description: 'Book, pickup, return', grouping: 'context', category: 'Communication', sectionIndex: 1, count: 30, emoji: '🚕' },
      { id: 'au-ctx-loyalty', name: 'Owner Experience', description: 'Warranty, perks, recall', grouping: 'context', category: 'E-Commerce', sectionIndex: 3, count: 30, emoji: '⭐' },
    ],
  },
  {
    id: 'travel',
    name: 'Travel / Aviation',
    tagline: 'Flights, bookings, journeys.',
    description: 'Airlines, OTAs, and travel brands — search, booking, and traveler experience.',
    icon: Plane,
    accent: '195 80% 50%',
    sampleEmojis: ['✈️', '🧳', '🛂', '🗺️', '🏝️', '🎫'],
    coreSet: SHARED_CORE,
    subSets: [
      { id: 'tr-dept-ops', name: 'Operations', description: 'Crew, gate, dispatch', grouping: 'department', category: 'Industry Specific', sectionIndex: 0, count: 30, emoji: '🛫' },
      { id: 'tr-dept-comm', name: 'Commercial', description: 'Fares, ancillaries, alliance', grouping: 'department', category: 'SaaS/Data', sectionIndex: 0, count: 30, emoji: '📈' },
      { id: 'tr-dept-care', name: 'Customer Care', description: 'Rebook, refund, claim', grouping: 'department', category: 'Communication', sectionIndex: 3, count: 30, emoji: '💬' },

      { id: 'tr-feat-search', name: 'Search & Booking', description: 'OD, cabin, dates, pax', grouping: 'feature', category: 'E-Commerce', sectionIndex: 0, count: 30, emoji: '🔍' },
      { id: 'tr-feat-checkin', name: 'Check-in & Bag', description: 'Boarding, baggage, seat', grouping: 'feature', category: 'Industry Specific', sectionIndex: 1, count: 30, emoji: '🛂' },
      { id: 'tr-feat-loyalty', name: 'Loyalty / Miles', description: 'Status, miles, upgrade', grouping: 'feature', category: 'E-Commerce', sectionIndex: 3, count: 30, emoji: '⭐' },

      { id: 'tr-ctx-trip', name: 'Trip Tools', description: 'Itinerary, map, weather', grouping: 'context', category: 'Communication', sectionIndex: 0, count: 30, emoji: '🗺️' },
      { id: 'tr-ctx-sustain', name: 'Sustainable Travel', description: 'CO₂, offset, eco', grouping: 'context', category: 'Industry Specific', sectionIndex: 2, count: 30, emoji: '🌍' },
    ],
  },
  {
    id: 'nonprofit',
    name: 'Nonprofit / NGO',
    tagline: 'Cause, donor, impact.',
    description: 'Charities, foundations, and NGOs — donations, volunteers, programs, and impact.',
    icon: HeartHandshake,
    accent: '340 70% 55%',
    sampleEmojis: ['❤️', '🤝', '🌍', '🎗️', '🙌', '📊'],
    coreSet: SHARED_CORE,
    subSets: [
      { id: 'np-dept-fund', name: 'Fundraising', description: 'Donor, campaign, gift', grouping: 'department', category: 'Industry Specific', sectionIndex: 0, count: 30, emoji: '💝' },
      { id: 'np-dept-prog', name: 'Programs', description: 'Beneficiary, services, field', grouping: 'department', category: 'Industry Specific', sectionIndex: 2, count: 30, emoji: '🌱' },
      { id: 'np-dept-vol', name: 'Volunteers', description: 'Sign-up, shift, hours', grouping: 'department', category: 'Communication', sectionIndex: 0, count: 30, emoji: '🙌' },

      { id: 'np-feat-donate', name: 'Donations', description: 'One-time, recurring, match', grouping: 'feature', category: 'E-Commerce', sectionIndex: 1, count: 30, emoji: '💳' },
      { id: 'np-feat-events', name: 'Events & Galas', description: 'Tickets, auction, table', grouping: 'feature', category: 'Communication', sectionIndex: 1, count: 30, emoji: '🎟️' },
      { id: 'np-feat-impact', name: 'Impact Reporting', description: 'Metrics, stories, charts', grouping: 'feature', category: 'SaaS/Data', sectionIndex: 0, count: 30, emoji: '📊' },

      { id: 'np-ctx-advocacy', name: 'Advocacy', description: 'Petition, share, contact rep', grouping: 'context', category: 'Communication', sectionIndex: 2, count: 30, emoji: '📣' },
      { id: 'np-ctx-trust', name: 'Trust & Transparency', description: 'Audited, certified, GuideStar', grouping: 'context', category: 'Marketing Hero', sectionIndex: 2, count: 30, emoji: '🛡️' },
    ],
  },
  {
    id: 'government',
    name: 'Government / Public Sector',
    tagline: 'Services, citizens, records.',
    description: 'Federal, state, and city agencies — citizen services, permits, and civic data.',
    icon: Building2,
    accent: '215 60% 35%',
    sampleEmojis: ['🏛️', '🪪', '📋', '🗳️', '🚓', '📜'],
    coreSet: SHARED_CORE,
    subSets: [
      { id: 'gv-dept-citizen', name: 'Citizen Services', description: 'Apply, renew, request', grouping: 'department', category: 'Industry Specific', sectionIndex: 0, count: 30, emoji: '🪪' },
      { id: 'gv-dept-public', name: 'Public Safety', description: 'Police, fire, 911', grouping: 'department', category: 'Industry Specific', sectionIndex: 1, count: 30, emoji: '🚨' },
      { id: 'gv-dept-admin', name: 'Administration', description: 'Records, FOIA, finance', grouping: 'department', category: 'SaaS/Data', sectionIndex: 2, count: 30, emoji: '🗂️' },

      { id: 'gv-feat-forms', name: 'Forms & Permits', description: 'License, permit, certificate', grouping: 'feature', category: 'SaaS/Data', sectionIndex: 0, count: 30, emoji: '📋' },
      { id: 'gv-feat-voting', name: 'Voting & Elections', description: 'Register, ballot, results', grouping: 'feature', category: 'Industry Specific', sectionIndex: 2, count: 30, emoji: '🗳️' },
      { id: 'gv-feat-pay', name: 'Payments & Taxes', description: 'Bill, tax, fee, refund', grouping: 'feature', category: 'E-Commerce', sectionIndex: 1, count: 30, emoji: '💵' },

      { id: 'gv-ctx-access', name: 'Accessibility & Language', description: 'A11y, translate, plain', grouping: 'context', category: 'Foundation', sectionIndex: 1, count: 30, emoji: '🌐' },
      { id: 'gv-ctx-trust', name: 'Trust & Security', description: 'Verified, official, secure', grouping: 'context', category: 'Marketing Hero', sectionIndex: 2, count: 30, emoji: '🛡️' },
    ],
  },
  {
    id: 'agriculture',
    name: 'Agriculture / AgTech',
    tagline: 'Farm, crop, yield.',
    description: 'Growers, ranchers, and AgTech — field ops, livestock, equipment, and supply.',
    icon: Sprout,
    accent: '90 50% 40%',
    sampleEmojis: ['🌾', '🚜', '🐄', '💧', '🌱', '☀️'],
    coreSet: SHARED_CORE,
    subSets: [
      { id: 'ag-dept-field', name: 'Field Ops', description: 'Plant, irrigate, harvest', grouping: 'department', category: 'Industry Specific', sectionIndex: 0, count: 30, emoji: '🌾' },
      { id: 'ag-dept-livestock', name: 'Livestock', description: 'Herd, vet, feed', grouping: 'department', category: 'Industry Specific', sectionIndex: 1, count: 30, emoji: '🐄' },
      { id: 'ag-dept-equip', name: 'Equipment', description: 'Tractor, drone, sprayer', grouping: 'department', category: 'Industry Specific', sectionIndex: 2, count: 30, emoji: '🚜' },

      { id: 'ag-feat-iot', name: 'Sensors & IoT', description: 'Soil, weather, moisture', grouping: 'feature', category: 'SaaS/Data', sectionIndex: 3, count: 30, emoji: '📡' },
      { id: 'ag-feat-yield', name: 'Yield Analytics', description: 'Forecast, map, score', grouping: 'feature', category: 'SaaS/Data', sectionIndex: 0, count: 30, emoji: '📊' },
      { id: 'ag-feat-supply', name: 'Supply & Trade', description: 'Buyer, contract, ship', grouping: 'feature', category: 'E-Commerce', sectionIndex: 2, count: 30, emoji: '📦' },

      { id: 'ag-ctx-sustain', name: 'Sustainability', description: 'Organic, regenerative, water', grouping: 'context', category: 'Industry Specific', sectionIndex: 2, count: 30, emoji: '🌱' },
      { id: 'ag-ctx-weather', name: 'Weather & Climate', description: 'Sun, rain, frost, storm', grouping: 'context', category: 'Industry Specific', sectionIndex: 1, count: 30, emoji: '⛅' },
    ],
  },
  {
    id: 'construction',
    name: 'Construction / AEC',
    tagline: 'Build, plan, inspect.',
    description: 'Architecture, engineering, and construction — projects, crews, safety, and BIM.',
    icon: HardHat,
    accent: '40 80% 50%',
    sampleEmojis: ['🦺', '🏗️', '📐', '🧱', '🔨', '📋'],
    coreSet: SHARED_CORE,
    subSets: [
      { id: 'cn-dept-pm', name: 'Project Management', description: 'Schedule, RFI, change order', grouping: 'department', category: 'Industry Specific', sectionIndex: 0, count: 30, emoji: '📋' },
      { id: 'cn-dept-field', name: 'Field / Crew', description: 'Crew, task, daily report', grouping: 'department', category: 'Industry Specific', sectionIndex: 2, count: 30, emoji: '👷' },
      { id: 'cn-dept-design', name: 'Design / BIM', description: 'Drawings, model, layer', grouping: 'department', category: 'Industry Specific', sectionIndex: 1, count: 30, emoji: '📐' },

      { id: 'cn-feat-safety', name: 'Safety', description: 'PPE, hazard, incident', grouping: 'feature', category: 'Industry Specific', sectionIndex: 1, count: 30, emoji: '⚠️' },
      { id: 'cn-feat-inv', name: 'Materials & Equipment', description: 'Inventory, rental, deliver', grouping: 'feature', category: 'E-Commerce', sectionIndex: 2, count: 30, emoji: '🧱' },
      { id: 'cn-feat-quality', name: 'Quality / Punch', description: 'Inspect, defect, sign-off', grouping: 'feature', category: 'SaaS/Data', sectionIndex: 1, count: 30, emoji: '✅' },

      { id: 'cn-ctx-bid', name: 'Bidding & Estimating', description: 'Bid, estimate, takeoff', grouping: 'context', category: 'E-Commerce', sectionIndex: 0, count: 30, emoji: '💰' },
      { id: 'cn-ctx-sustain', name: 'Green Building', description: 'LEED, energy, materials', grouping: 'context', category: 'Industry Specific', sectionIndex: 2, count: 30, emoji: '🌱' },
    ],
  },
  {
    id: 'localization',
    name: 'Translation / Localization',
    tagline: 'Translate, adapt, deliver.',
    description: 'LSPs and global brands — translation, localization, cultural adaptation, and multilingual delivery.',
    icon: Languages,
    accent: '220 100% 39%',
    sampleEmojis: ['🌐', '🔤', '📝', '🗣️', '🎙️', '🤖'],
    coreSet: SHARED_CORE,
    subSets: [
      { id: 'lc-dept-tm', name: 'Translation Mgmt', description: 'TM, glossary, project', grouping: 'department', category: 'Industry Specific', sectionIndex: 0, count: 30, emoji: '🗂️' },
      { id: 'lc-dept-vendor', name: 'Vendor / Linguist', description: 'Linguist, reviewer, rate', grouping: 'department', category: 'Communication', sectionIndex: 0, count: 30, emoji: '👤' },
      { id: 'lc-dept-qa', name: 'LQA / QA', description: 'Score, error, review', grouping: 'department', category: 'SaaS/Data', sectionIndex: 1, count: 30, emoji: '✅' },

      { id: 'lc-feat-mt', name: 'MT & AI', description: 'NMT, post-edit, engine', grouping: 'feature', category: 'SaaS/Data', sectionIndex: 3, count: 30, emoji: '🤖' },
      { id: 'lc-feat-multimedia', name: 'Multimedia', description: 'Subtitle, dub, voice', grouping: 'feature', category: 'Communication', sectionIndex: 2, count: 30, emoji: '🎙️' },
      { id: 'lc-feat-culture', name: 'Cultural Adaptation', description: 'Locale, taboo, idiom', grouping: 'feature', category: 'Industry Specific', sectionIndex: 1, count: 30, emoji: '🌍' },

      { id: 'lc-ctx-connector', name: 'Connectors / CMS', description: 'API, push, sync, webhook', grouping: 'context', category: 'SaaS/Data', sectionIndex: 3, count: 30, emoji: '🔌' },
      { id: 'lc-ctx-language', name: 'Language Coverage', description: 'Script, RTL, CJK, locale', grouping: 'context', category: 'Foundation', sectionIndex: 0, count: 30, emoji: '🔤' },
    ],
  },
  {
    id: 'fitness',
    name: 'Fitness / Wellness',
    tagline: 'Workout, recovery, results.',
    description: 'Gyms, studios, and wellness apps — workouts, classes, nutrition, and recovery.',
    icon: Dumbbell,
    accent: '140 70% 40%',
    sampleEmojis: ['💪', '🏋️', '🧘', '🥗', '⌚', '🏃'],
    coreSet: SHARED_CORE,
    subSets: [
      { id: 'fn-dept-trainer', name: 'Training', description: 'Coach, plan, program', grouping: 'department', category: 'Industry Specific', sectionIndex: 0, count: 30, emoji: '🏋️' },
      { id: 'fn-dept-class', name: 'Classes / Studio', description: 'Schedule, book, instructor', grouping: 'department', category: 'Communication', sectionIndex: 1, count: 30, emoji: '🧘' },
      { id: 'fn-dept-member', name: 'Membership', description: 'Plan, billing, check-in', grouping: 'department', category: 'E-Commerce', sectionIndex: 1, count: 30, emoji: '🎫' },

      { id: 'fn-feat-workout', name: 'Workout / Track', description: 'Reps, sets, timer, PR', grouping: 'feature', category: 'Industry Specific', sectionIndex: 2, count: 30, emoji: '⏱️' },
      { id: 'fn-feat-nutrition', name: 'Nutrition', description: 'Meal, macro, water', grouping: 'feature', category: 'Industry Specific', sectionIndex: 1, count: 30, emoji: '🥗' },
      { id: 'fn-feat-wearable', name: 'Wearables', description: 'HR, steps, sleep, sync', grouping: 'feature', category: 'SaaS/Data', sectionIndex: 3, count: 30, emoji: '⌚' },

      { id: 'fn-ctx-community', name: 'Community', description: 'Friends, leaderboard, share', grouping: 'context', category: 'Communication', sectionIndex: 2, count: 30, emoji: '👥' },
      { id: 'fn-ctx-recovery', name: 'Recovery & Mindful', description: 'Stretch, sleep, meditate', grouping: 'context', category: 'Industry Specific', sectionIndex: 2, count: 30, emoji: '🧘' },
    ],
  },
  {
    id: 'consulting',
    name: 'Consulting / B2B Services',
    tagline: 'Engagements, deliverables, ROI.',
    description: 'Strategy firms, agencies, and B2B service providers — engagements, deliverables, and growth.',
    icon: Briefcase,
    accent: '240 25% 35%',
    sampleEmojis: ['💼', '📊', '🤝', '🎯', '📈', '🗓️'],
    coreSet: SHARED_CORE,
    subSets: [
      { id: 'co-dept-engage', name: 'Engagement Mgmt', description: 'Scope, SOW, milestone', grouping: 'department', category: 'SaaS/Data', sectionIndex: 2, count: 30, emoji: '📋' },
      { id: 'co-dept-client', name: 'Client Success', description: 'QBR, NPS, renewal', grouping: 'department', category: 'Communication', sectionIndex: 3, count: 30, emoji: '🤝' },
      { id: 'co-dept-talent', name: 'Talent / Staffing', description: 'Bench, skill, allocate', grouping: 'department', category: 'Communication', sectionIndex: 0, count: 30, emoji: '👥' },

      { id: 'co-feat-deliver', name: 'Deliverables', description: 'Deck, report, model', grouping: 'feature', category: 'SaaS/Data', sectionIndex: 0, count: 30, emoji: '📊' },
      { id: 'co-feat-research', name: 'Research / Insights', description: 'Survey, interview, data', grouping: 'feature', category: 'SaaS/Data', sectionIndex: 3, count: 30, emoji: '🔍' },
      { id: 'co-feat-billing', name: 'Time & Billing', description: 'Time, expense, invoice', grouping: 'feature', category: 'E-Commerce', sectionIndex: 1, count: 30, emoji: '🧾' },

      { id: 'co-ctx-trust', name: 'Credentials', description: 'Award, case study, badge', grouping: 'context', category: 'Marketing Hero', sectionIndex: 2, count: 30, emoji: '🏆' },
      { id: 'co-ctx-roi', name: 'Outcomes / ROI', description: 'KPI, savings, growth', grouping: 'context', category: 'Industry Specific', sectionIndex: 2, count: 30, emoji: '📈' },
    ],
  },
  {
    id: 'startup',
    name: 'Startup / Innovation',
    tagline: 'Build, iterate, fundraise.',
    description: 'Early-stage teams and innovation labs — product, growth, and capital.',
    icon: Rocket,
    accent: '280 80% 60%',
    sampleEmojis: ['🚀', '💡', '🧪', '📈', '🤝', '💰'],
    coreSet: SHARED_CORE,
    subSets: [
      { id: 'st-dept-product', name: 'Product', description: 'Discovery, PRD, ship', grouping: 'department', category: 'SaaS/Data', sectionIndex: 0, count: 30, emoji: '🧭' },
      { id: 'st-dept-growth', name: 'Growth', description: 'Acquisition, activation, viral', grouping: 'department', category: 'Marketing Hero', sectionIndex: 0, count: 30, emoji: '📈' },
      { id: 'st-dept-ops', name: 'Operations', description: 'Hiring, finance, legal', grouping: 'department', category: 'SaaS/Data', sectionIndex: 2, count: 30, emoji: '⚙️' },

      { id: 'st-feat-exp', name: 'Experiments / A/B', description: 'Test, variant, lift', grouping: 'feature', category: 'SaaS/Data', sectionIndex: 3, count: 30, emoji: '🧪' },
      { id: 'st-feat-fund', name: 'Fundraising', description: 'Pitch, term sheet, runway', grouping: 'feature', category: 'Industry Specific', sectionIndex: 0, count: 30, emoji: '💰' },
      { id: 'st-feat-comm', name: 'Community', description: 'Beta, Discord, ambassador', grouping: 'feature', category: 'Communication', sectionIndex: 0, count: 30, emoji: '👥' },

      { id: 'st-ctx-launch', name: 'Launch', description: 'Beta, GA, hunt, press', grouping: 'context', category: 'Marketing Hero', sectionIndex: 2, count: 30, emoji: '🚀' },
      { id: 'st-ctx-pivot', name: 'Strategy', description: 'Pivot, focus, north star', grouping: 'context', category: 'Industry Specific', sectionIndex: 2, count: 30, emoji: '🎯' },
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
