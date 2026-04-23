/**
 * slotPresets
 *
 * Reusable slot configurations (slots + aspect ratio + overlay hints) that the
 * user can save once and reuse across new templates — e.g. "Hero + 3 Metric
 * Cards", "Two-Column Editorial", "Quote Portrait".
 *
 * Persisted in localStorage so they carry across sessions for a single user.
 * Pure data + lookup helpers — no React, no side effects beyond storage.
 */
import type {
  BrandLayoutTemplate,
  LayoutSectionTarget,
  LayoutSlot,
} from './brandLayoutTemplates';

export interface SlotPreset {
  /** Stable id (uuid). */
  id: string;
  /** Display name (e.g. "Hero + 3 Metrics"). */
  name: string;
  /** Optional long description / when to use it. */
  description?: string;
  /** Optional default target so we can pre-route to a section type when applied. */
  target?: LayoutSectionTarget;
  /** Canvas aspect ratio captured at save time. */
  aspectRatio: number;
  /** Slot definitions — positions are preserved as percentages. */
  slots: LayoutSlot[];
  /** Optional overlay typography hints. */
  overlay?: BrandLayoutTemplate['overlay'];
  /** ISO string. */
  createdAt: string;
  /** True for built-in starter presets (cannot be deleted). */
  isBuiltIn?: boolean;
}

export const SLOT_PRESETS_STORAGE_KEY = 'brandhub:slot-presets';

const safeId = () =>
  (typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `sp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);

/* -------------------------------------------------------------------------- */
/*  Built-in starter presets                                                   */
/* -------------------------------------------------------------------------- */

export const builtInSlotPresets: SlotPreset[] = [
  {
    id: 'builtin-hero-metrics',
    name: 'Hero + 3 Metrics',
    description:
      'Foundation hero band on top with three Collaborate / Transform metric cards anchored at the bottom.',
    target: 'casestudy',
    aspectRatio: 16 / 9,
    slots: [
      { key: 'hero', expressionState: 'Foundation', kind: 'background', preferredShape: 'wide', label: 'Foundation hero', position: { x: 0, y: 0, width: 100, height: 65 } },
      { key: 'm1', expressionState: 'Collaborate', kind: 'card', preferredShape: 'square', label: 'Metric 1', position: { x: 4, y: 68, width: 30, height: 28 } },
      { key: 'm2', expressionState: 'Collaborate', kind: 'card', preferredShape: 'square', label: 'Metric 2', position: { x: 35, y: 68, width: 30, height: 28 } },
      { key: 'm3', expressionState: 'Transform', kind: 'card', preferredShape: 'square', label: 'Metric 3', position: { x: 66, y: 68, width: 30, height: 28 } },
    ],
    overlay: { eyebrow: { y: 8, align: 'left' }, headline: { y: 16, align: 'left' } },
    createdAt: new Date(0).toISOString(),
    isBuiltIn: true,
  },
  {
    id: 'builtin-two-column-editorial',
    name: 'Two-Column Editorial',
    description: 'Foundation imagery left, Transform copy block right — great for editorial spreads.',
    target: 'editorial',
    aspectRatio: 16 / 10,
    slots: [
      { key: 'left', expressionState: 'Foundation', kind: 'background', preferredShape: 'vertical', label: 'Foundation imagery', position: { x: 0, y: 0, width: 50, height: 100 } },
      { key: 'right', expressionState: 'Transform', kind: 'feature', preferredShape: 'vertical', label: 'Transform copy', position: { x: 50, y: 0, width: 50, height: 100 } },
    ],
    overlay: { eyebrow: { y: 12, align: 'right' }, headline: { y: 22, align: 'right' } },
    createdAt: new Date(0).toISOString(),
    isBuiltIn: true,
  },
  {
    id: 'builtin-quote-portrait',
    name: 'Quote Portrait',
    description: 'Vertical Collaborate portrait card sized for testimonial pull-quotes.',
    target: 'casestudy',
    aspectRatio: 4 / 5,
    slots: [
      { key: 'portrait', expressionState: 'Collaborate', kind: 'background', preferredShape: 'vertical', label: 'Collaborate portrait', position: { x: 0, y: 0, width: 100, height: 100 } },
    ],
    overlay: { eyebrow: { y: 60, align: 'left' }, headline: { y: 70, align: 'left' } },
    createdAt: new Date(0).toISOString(),
    isBuiltIn: true,
  },
];

/* -------------------------------------------------------------------------- */
/*  Storage I/O                                                                */
/* -------------------------------------------------------------------------- */

const isValidPreset = (p: unknown): p is SlotPreset => {
  if (!p || typeof p !== 'object') return false;
  const obj = p as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.aspectRatio === 'number' &&
    Array.isArray(obj.slots)
  );
};

export const loadSlotPresets = (): SlotPreset[] => {
  if (typeof window === 'undefined') return [...builtInSlotPresets];
  try {
    const raw = window.localStorage.getItem(SLOT_PRESETS_STORAGE_KEY);
    const userPresets: SlotPreset[] = raw
      ? (JSON.parse(raw) as unknown[]).filter(isValidPreset)
      : [];
    return [...builtInSlotPresets, ...userPresets];
  } catch {
    return [...builtInSlotPresets];
  }
};

const persist = (userPresets: SlotPreset[]) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SLOT_PRESETS_STORAGE_KEY, JSON.stringify(userPresets));
  } catch {
    /* ignore quota errors */
  }
};

export const saveSlotPreset = (
  current: SlotPreset[],
  preset: Omit<SlotPreset, 'id' | 'createdAt' | 'isBuiltIn'> & { id?: string },
): SlotPreset[] => {
  const next: SlotPreset = {
    ...preset,
    id: preset.id ?? safeId(),
    createdAt: new Date().toISOString(),
    isBuiltIn: false,
  };
  const userOnly = current.filter((p) => !p.isBuiltIn && p.id !== next.id);
  const updatedUser = [...userOnly, next];
  persist(updatedUser);
  return [...builtInSlotPresets, ...updatedUser];
};

export const deleteSlotPreset = (current: SlotPreset[], id: string): SlotPreset[] => {
  const target = current.find((p) => p.id === id);
  if (!target || target.isBuiltIn) return current;
  const userOnly = current.filter((p) => !p.isBuiltIn && p.id !== id);
  persist(userOnly);
  return [...builtInSlotPresets, ...userOnly];
};

/* -------------------------------------------------------------------------- */
/*  Conversions                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Build a `BrandLayoutTemplate` from a preset. Useful for opening the layout
 * editor with the preset as a brand-new starting point.
 */
export const presetToTemplate = (preset: SlotPreset): BrandLayoutTemplate => ({
  id: `preset-${preset.id}`,
  name: preset.name,
  description: preset.description ?? `Reusable preset — ${preset.name}`,
  target: preset.target ?? 'editorial',
  aspectRatio: preset.aspectRatio,
  slots: preset.slots.map((s) => ({ ...s })),
  overlay: preset.overlay,
});

/**
 * Capture a template's current shape as a saveable preset payload (id + dates
 * are filled in by `saveSlotPreset`). `positionOverrides` from a customization
 * are merged into the slot positions so the user's tweaks are preserved.
 */
export const templateToPresetPayload = (
  template: BrandLayoutTemplate,
  options: {
    name: string;
    description?: string;
    positionOverrides?: Record<string, { x: number; y: number; width: number; height: number }>;
  },
): Omit<SlotPreset, 'id' | 'createdAt' | 'isBuiltIn'> => ({
  name: options.name,
  description: options.description,
  target: template.target,
  aspectRatio: template.aspectRatio,
  slots: template.slots.map((s) => ({
    ...s,
    position: options.positionOverrides?.[s.key] ?? s.position,
  })),
  overlay: template.overlay,
});
