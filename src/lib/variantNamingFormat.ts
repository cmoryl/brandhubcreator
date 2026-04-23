/**
 * Variant naming format
 *
 * User-configurable naming pattern for saved layout-template variants.
 * Tokens supported in the pattern string:
 *   {template} — the template's display name (e.g. "Hero Split")
 *   {version}  — auto-incremented `v{n}` based on existing variants matching this format
 *   {date}     — short locale date (e.g. "Apr 23")
 *   {iso}      — YYYY-MM-DD
 *   {channel}  — placeholder for the active channel (Hero/Social/Email/...). Defaults to "Hero".
 *
 * Persisted in localStorage so the user's choice carries across sessions.
 */
import type { LayoutTemplateCustomization } from './brandLayoutTemplates';

export interface NamingFormatPreset {
  id: string;
  label: string;
  /** Pattern with {token} placeholders. */
  pattern: string;
  /** Human description for the picker. */
  description: string;
}

export const NAMING_FORMAT_PRESETS: NamingFormatPreset[] = [
  {
    id: 'template-version',
    label: 'Template + Version',
    pattern: '{template} - {version}',
    description: 'e.g. Hero Split - v2',
  },
  {
    id: 'template-version-date',
    label: 'Template + Version + Date',
    pattern: '{template} - {version} - {date}',
    description: 'e.g. Hero Split - v2 - Apr 23',
  },
  {
    id: 'template-channel',
    label: 'Template + Channel',
    pattern: '{template} - {channel}',
    description: 'e.g. Hero Split - Hero',
  },
  {
    id: 'template-channel-version',
    label: 'Template + Channel + Version',
    pattern: '{template} - {channel} - {version}',
    description: 'e.g. Hero Split - Hero - v2',
  },
  {
    id: 'template-iso',
    label: 'Template + ISO Date',
    pattern: '{template} - {iso}',
    description: 'e.g. Hero Split - 2026-04-23',
  },
  {
    id: 'custom',
    label: 'Custom…',
    pattern: '{template} - {version}',
    description: 'Write your own pattern with {template} {version} {date} {iso} {channel}',
  },
];

const STORAGE_KEY = 'brand:variantNamingFormat';

export interface StoredFormat {
  presetId: string;
  /** Used only when presetId === 'custom'. */
  customPattern?: string;
}

export const loadNamingFormat = (): StoredFormat => {
  if (typeof window === 'undefined') return { presetId: 'template-version' };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { presetId: 'template-version' };
    const parsed = JSON.parse(raw) as StoredFormat;
    if (!NAMING_FORMAT_PRESETS.some((p) => p.id === parsed.presetId)) {
      return { presetId: 'template-version' };
    }
    return parsed;
  } catch {
    return { presetId: 'template-version' };
  }
};

export const saveNamingFormat = (value: StoredFormat): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    /* localStorage unavailable — ignore */
  }
};

export const resolvePattern = (stored: StoredFormat): string => {
  if (stored.presetId === 'custom' && stored.customPattern?.trim()) {
    return stored.customPattern.trim();
  }
  const preset = NAMING_FORMAT_PRESETS.find((p) => p.id === stored.presetId);
  return preset?.pattern ?? '{template} - {version}';
};

/** Compute the next version number among existing variants whose names follow this pattern. */
const computeNextVersion = (
  pattern: string,
  templateName: string,
  channel: string,
  existing: LayoutTemplateCustomization[],
): number => {
  if (!pattern.includes('{version}')) return 1;
  // Build a regex from the pattern by replacing tokens with capture / wildcard groups.
  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regexSrc = escaped
    .replace(/\\\{template\\\}/g, templateName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .replace(/\\\{channel\\\}/g, channel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .replace(/\\\{version\\\}/g, 'v(\\d+)')
    .replace(/\\\{date\\\}/g, '.+?')
    .replace(/\\\{iso\\\}/g, '\\d{4}-\\d{2}-\\d{2}');
  let max = 0;
  try {
    const re = new RegExp(`^${regexSrc}$`, 'i');
    for (const c of existing) {
      const m = c.name.match(re);
      if (m && m[1]) max = Math.max(max, Number(m[1]));
    }
  } catch {
    /* invalid regex — fall through */
  }
  return max + 1;
};

export interface FormatContext {
  templateName: string;
  channel?: string;
  existingCustomizations?: LayoutTemplateCustomization[];
  /** Override the date — useful for tests. */
  now?: Date;
}

/** Apply a stored format with the given context, returning the resolved variant name. */
export const formatVariantName = (stored: StoredFormat, ctx: FormatContext): string => {
  const pattern = resolvePattern(stored);
  const channel = ctx.channel || 'Hero';
  const now = ctx.now ?? new Date();
  const date = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const iso = now.toISOString().slice(0, 10);
  const version = `v${computeNextVersion(pattern, ctx.templateName, channel, ctx.existingCustomizations ?? [])}`;

  return pattern
    .replace(/\{template\}/g, ctx.templateName)
    .replace(/\{version\}/g, version)
    .replace(/\{date\}/g, date)
    .replace(/\{iso\}/g, iso)
    .replace(/\{channel\}/g, channel)
    .trim();
};

/** Quick channel chips users can swap in. */
export const COMMON_CHANNELS = ['Hero', 'Social', 'Email', 'Pitch', 'Web', 'Ad'] as const;
