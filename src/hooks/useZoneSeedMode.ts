/**
 * useZoneSeedMode
 *
 * Global user preference controlling how empty text / CTA zones are seeded
 * when a templated asset is first created or when defaults are hydrated.
 *
 *   ai     → Brand-aware AI-generated copy via the seed-zone-copy edge fn.
 *            Until the AI response arrives, zones briefly show lorem copy
 *            (so the asset never renders blank).
 *   lorem  → Generic curated lorem-ish copy keyed off the zone label.
 *   blank  → Leave zones empty; render the label as a placeholder hint.
 */

import { useCallback } from 'react';
import { useUserPreferences } from './useUserPreferences';

export type ZoneSeedMode = 'ai' | 'lorem' | 'blank';

const PREF_KEY = 'templating.zoneSeedMode';
const DEFAULT_MODE: ZoneSeedMode = 'lorem';

const isValidMode = (v: unknown): v is ZoneSeedMode =>
  v === 'ai' || v === 'lorem' || v === 'blank';

export function useZoneSeedMode() {
  const { getPreference, setPreference, isLoaded } = useUserPreferences();
  const raw = getPreference<ZoneSeedMode>(PREF_KEY, DEFAULT_MODE);
  const mode: ZoneSeedMode = isValidMode(raw) ? raw : DEFAULT_MODE;

  const setMode = useCallback(
    (next: ZoneSeedMode) => setPreference(PREF_KEY, next),
    [setPreference],
  );

  return { mode, setMode, isLoaded };
}
