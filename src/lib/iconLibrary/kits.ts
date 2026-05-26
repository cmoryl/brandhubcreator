/**
 * Phase 5 — Smart Icon Kits.
 * Curated, ready-to-populate icon sets per section. Each kit item lists
 * preferred (pack, name) candidates; the resolver picks the first one that
 * actually exists in the bundled library, materializes it, and optionally
 * applies brand DNA restyling.
 *
 * No DB required — kits are client-side templates. Selected icons append to
 * the brand's iconography list (which persists through guide_data already).
 */
import { loadPackIndex, materializeAsBrandIconography } from './loader';
import { restyleBundledIcon, applyBrandDnaToSvg, type BrandRestyleDNA } from './restyle';
import type { BrandIconography } from '@/types/brand';

export interface IconKitItem {
  /** Human concept (used as fallback display name). */
  concept: string;
  /** Ordered candidate pack/name pairs — first hit wins. */
  candidates: Array<{ pack: string; name: string }>;
  category: string;
}

export interface IconKit {
  id: string;
  name: string;
  description: string;
  /** Sections this kit is most useful in. Empty = universal. */
  sections: string[];
  items: IconKitItem[];
}

// Helpers to keep candidate lists short. Most concepts exist across all top packs.
const L = (n: string) => ({ pack: 'lucide', name: n });
const PH = (n: string) => ({ pack: 'ph', name: n });
const TB = (n: string) => ({ pack: 'tabler', name: n });
const HI = (n: string) => ({ pack: 'heroicons', name: n });

/** Catalogue of preset kits. Names are picked to maximise pack hit rate. */
export const ICON_KITS: IconKit[] = [
  {
    id: 'essentials',
    name: 'Essentials',
    description: 'Core UI — every brand needs these.',
    sections: ['iconography', 'symbolStandards'],
    items: [
      { concept: 'Search', category: 'Navigation', candidates: [L('search'), PH('magnifying-glass'), TB('search')] },
      { concept: 'Menu', category: 'Navigation', candidates: [L('menu'), PH('list'), TB('menu-2')] },
      { concept: 'Close', category: 'Actions', candidates: [L('x'), PH('x'), TB('x')] },
      { concept: 'Check', category: 'Status', candidates: [L('check'), PH('check'), TB('check')] },
      { concept: 'User', category: 'Actions', candidates: [L('user'), PH('user'), TB('user')] },
      { concept: 'Settings', category: 'Actions', candidates: [L('settings'), PH('gear'), TB('settings')] },
      { concept: 'Bell', category: 'Communication', candidates: [L('bell'), PH('bell'), TB('bell')] },
      { concept: 'Heart', category: 'Social', candidates: [L('heart'), PH('heart'), TB('heart')] },
      { concept: 'Star', category: 'Status', candidates: [L('star'), PH('star'), TB('star')] },
      { concept: 'Plus', category: 'Actions', candidates: [L('plus'), PH('plus'), TB('plus')] },
      { concept: 'Trash', category: 'Actions', candidates: [L('trash'), PH('trash'), TB('trash')] },
      { concept: 'Eye', category: 'Actions', candidates: [L('eye'), PH('eye'), TB('eye')] },
    ],
  },
  {
    id: 'navigation',
    name: 'Navigation',
    description: 'Arrows, chevrons and directional cues.',
    sections: ['iconography', 'appIcons'],
    items: [
      { concept: 'Arrow Left', category: 'Navigation', candidates: [L('arrow-left'), PH('arrow-left'), TB('arrow-left')] },
      { concept: 'Arrow Right', category: 'Navigation', candidates: [L('arrow-right'), PH('arrow-right'), TB('arrow-right')] },
      { concept: 'Arrow Up', category: 'Navigation', candidates: [L('arrow-up'), PH('arrow-up'), TB('arrow-up')] },
      { concept: 'Arrow Down', category: 'Navigation', candidates: [L('arrow-down'), PH('arrow-down'), TB('arrow-down')] },
      { concept: 'Chevron Left', category: 'Navigation', candidates: [L('chevron-left'), PH('caret-left'), TB('chevron-left')] },
      { concept: 'Chevron Right', category: 'Navigation', candidates: [L('chevron-right'), PH('caret-right'), TB('chevron-right')] },
      { concept: 'Chevron Up', category: 'Navigation', candidates: [L('chevron-up'), PH('caret-up'), TB('chevron-up')] },
      { concept: 'Chevron Down', category: 'Navigation', candidates: [L('chevron-down'), PH('caret-down'), TB('chevron-down')] },
      { concept: 'External Link', category: 'Navigation', candidates: [L('external-link'), PH('arrow-square-out'), TB('external-link')] },
      { concept: 'Home', category: 'Navigation', candidates: [PH('house'), TB('home'), HI('home')] },
    ],
  },
  {
    id: 'actions',
    name: 'Common Actions',
    description: 'Save, share, edit, download.',
    sections: ['iconography', 'digitalCollateral'],
    items: [
      { concept: 'Download', category: 'Actions', candidates: [L('download'), PH('download'), TB('download')] },
      { concept: 'Upload', category: 'Actions', candidates: [L('upload'), PH('upload'), TB('upload')] },
      { concept: 'Share', category: 'Actions', candidates: [L('share'), PH('share'), TB('share')] },
      { concept: 'Edit', category: 'Actions', candidates: [L('pencil'), PH('pencil'), TB('edit')] },
      { concept: 'Copy', category: 'Actions', candidates: [L('copy'), PH('copy'), TB('copy')] },
      { concept: 'Save', category: 'Actions', candidates: [L('save'), PH('floppy-disk'), TB('device-floppy')] },
      { concept: 'Filter', category: 'Actions', candidates: [L('filter'), PH('funnel'), TB('filter')] },
      { concept: 'Refresh', category: 'Actions', candidates: [L('refresh-cw'), PH('arrows-clockwise'), TB('refresh')] },
    ],
  },
  {
    id: 'status',
    name: 'Status & Feedback',
    description: 'Success, warning, error, info.',
    sections: ['iconography'],
    items: [
      { concept: 'Success', category: 'Status', candidates: [PH('check-circle'), TB('circle-check'), HI('check-circle')] },
      { concept: 'Warning', category: 'Status', candidates: [L('triangle-alert'), PH('warning'), TB('alert-triangle')] },
      { concept: 'Error', category: 'Status', candidates: [PH('x-circle'), TB('circle-x'), HI('x-circle')] },
      { concept: 'Info', category: 'Status', candidates: [L('info'), PH('info'), TB('info-circle')] },
      { concept: 'Help', category: 'Status', candidates: [PH('question'), TB('help-circle'), HI('question-mark-circle')] },
      { concept: 'Lock', category: 'Status', candidates: [L('lock'), PH('lock'), TB('lock')] },
      { concept: 'Unlock', category: 'Status', candidates: [L('unlock'), PH('lock-open'), TB('lock-open')] },
    ],
  },
  {
    id: 'social',
    name: 'Social Channels',
    description: 'Brand marks for major social networks.',
    sections: ['socialAssets', 'signatures'],
    items: [
      { concept: 'LinkedIn', category: 'Social', candidates: [{ pack: 'simple-icons', name: 'linkedin' }, { pack: 'fa6-brands', name: 'linkedin' }] },
      { concept: 'Instagram', category: 'Social', candidates: [{ pack: 'simple-icons', name: 'instagram' }, { pack: 'fa6-brands', name: 'instagram' }] },
      { concept: 'X / Twitter', category: 'Social', candidates: [{ pack: 'simple-icons', name: 'x' }, { pack: 'fa6-brands', name: 'x-twitter' }] },
      { concept: 'YouTube', category: 'Social', candidates: [{ pack: 'simple-icons', name: 'youtube' }, { pack: 'fa6-brands', name: 'youtube' }] },
      { concept: 'Facebook', category: 'Social', candidates: [{ pack: 'simple-icons', name: 'facebook' }, { pack: 'fa6-brands', name: 'facebook' }] },
      { concept: 'TikTok', category: 'Social', candidates: [{ pack: 'simple-icons', name: 'tiktok' }, { pack: 'fa6-brands', name: 'tiktok' }] },
      { concept: 'GitHub', category: 'Social', candidates: [{ pack: 'simple-icons', name: 'github' }, { pack: 'fa6-brands', name: 'github' }] },
      { concept: 'Threads', category: 'Social', candidates: [{ pack: 'simple-icons', name: 'threads' }] },
    ],
  },
  {
    id: 'ecommerce',
    name: 'Commerce',
    description: 'Cart, checkout, payments, shipping.',
    sections: ['iconography'],
    items: [
      { concept: 'Cart', category: 'Commerce', candidates: [L('shopping-cart'), PH('shopping-cart'), TB('shopping-cart')] },
      { concept: 'Bag', category: 'Commerce', candidates: [L('shopping-bag'), PH('shopping-bag'), TB('shopping-bag')] },
      { concept: 'Tag', category: 'Commerce', candidates: [L('tag'), PH('tag'), TB('tag')] },
      { concept: 'Credit Card', category: 'Commerce', candidates: [L('credit-card'), PH('credit-card'), TB('credit-card')] },
      { concept: 'Package', category: 'Commerce', candidates: [L('package'), PH('package'), TB('package')] },
      { concept: 'Truck', category: 'Commerce', candidates: [L('truck'), PH('truck'), TB('truck')] },
      { concept: 'Receipt', category: 'Commerce', candidates: [L('receipt'), PH('receipt'), TB('receipt')] },
      { concept: 'Wallet', category: 'Commerce', candidates: [L('wallet'), PH('wallet'), TB('wallet')] },
    ],
  },
  {
    id: 'communication',
    name: 'Communication',
    description: 'Mail, chat, calls, notifications.',
    sections: ['iconography', 'signatures'],
    items: [
      { concept: 'Mail', category: 'Communication', candidates: [L('mail'), PH('envelope'), TB('mail')] },
      { concept: 'Phone', category: 'Communication', candidates: [L('phone'), PH('phone'), TB('phone')] },
      { concept: 'Message', category: 'Communication', candidates: [L('message-circle'), PH('chat-circle'), TB('message-circle')] },
      { concept: 'Send', category: 'Communication', candidates: [L('send'), PH('paper-plane-tilt'), TB('send')] },
      { concept: 'Bell', category: 'Communication', candidates: [L('bell'), PH('bell'), TB('bell')] },
      { concept: 'Video', category: 'Communication', candidates: [L('video'), PH('video-camera'), TB('video')] },
      { concept: 'Mic', category: 'Communication', candidates: [L('mic'), PH('microphone'), TB('microphone')] },
      { concept: 'Calendar', category: 'Communication', candidates: [L('calendar'), PH('calendar'), TB('calendar')] },
    ],
  },
];

/** Kits suitable for a given section, in display order. */
export function kitsForSection(sectionId: string): IconKit[] {
  const matching = ICON_KITS.filter((k) => k.sections.length === 0 || k.sections.includes(sectionId));
  // Always include Essentials first if applicable.
  return matching.sort((a, b) => (a.id === 'essentials' ? -1 : b.id === 'essentials' ? 1 : 0));
}

export function getKit(id: string): IconKit | undefined {
  return ICON_KITS.find((k) => k.id === id);
}

/**
 * Resolve a kit into materialized BrandIconography entries.
 * Tries each candidate against the pack's index; first hit wins.
 * If brandDna is provided, restyles each icon to match.
 */
export async function resolveKit(
  kit: IconKit,
  brandDna?: BrandRestyleDNA,
): Promise<BrandIconography[]> {
  // Group candidates by pack so we load each pack index once.
  const neededPacks = new Set<string>();
  kit.items.forEach((it) => it.candidates.forEach((c) => neededPacks.add(c.pack)));

  const packIndexes = new Map<string, Set<string>>();
  await Promise.all(
    Array.from(neededPacks).map(async (packId) => {
      try {
        const idx = await loadPackIndex(packId);
        packIndexes.set(packId, new Set(idx.map((e) => e.n)));
      } catch {
        packIndexes.set(packId, new Set());
      }
    }),
  );

  const resolved = await Promise.all(
    kit.items.map(async (item) => {
      const hit = item.candidates.find((c) => packIndexes.get(c.pack)?.has(c.name));
      if (!hit) return null;
      try {
        const brandIcon = (await materializeAsBrandIconography(hit.pack, hit.name, item.category)) as BrandIconography;
        brandIcon.name = item.concept; // Use friendly concept name
        if (brandDna) {
          try {
            const restyled = await restyleBundledIcon(hit.pack, hit.name, brandDna);
            if (!restyled.skipped) {
              brandIcon.svgPath = applyBrandDnaToSvg(restyled.svg, brandDna);
            }
          } catch { /* keep original */ }
        }
        return brandIcon;
      } catch {
        return null;
      }
    }),
  );

  return resolved.filter((x): x is BrandIconography => x !== null);
}
