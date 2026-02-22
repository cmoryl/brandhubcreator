/**
 * useUserPreferences Hook
 * Persists user UI preferences (layout choices, theme, sort order) in the database
 * with optimistic local state and background sync.
 * 
 * Preference keys follow a dot-notation convention:
 *   layout.<entityType>.<sectionId> = LayoutPreset (e.g. "grid-3")
 *   theme.mode = "light" | "dark" | "system"
 *   portal.sort = "recent" | "alpha" | "updated"
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UserPreferences {
  [key: string]: any;
}

interface UseUserPreferencesReturn {
  preferences: UserPreferences;
  isLoaded: boolean;
  getPreference: <T = any>(key: string, fallback?: T) => T;
  setPreference: (key: string, value: any) => void;
  setPreferences: (updates: Record<string, any>) => void;
}

// Module-level cache to avoid refetching on every hook mount
let cachedPrefs: UserPreferences | null = null;
let cachedUserId: string | null = null;

export function useUserPreferences(): UseUserPreferencesReturn {
  const { user } = useAuth();
  const [preferences, setPreferencesState] = useState<UserPreferences>(
    cachedUserId === user?.id && cachedPrefs ? cachedPrefs : {}
  );
  const [isLoaded, setIsLoaded] = useState(cachedUserId === user?.id && cachedPrefs !== null);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingUpdates = useRef<UserPreferences>({});

  // Load preferences from DB
  useEffect(() => {
    if (!user?.id) {
      setPreferencesState({});
      setIsLoaded(true);
      return;
    }

    // Use cache if same user
    if (cachedUserId === user.id && cachedPrefs) {
      setPreferencesState(cachedPrefs);
      setIsLoaded(true);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('preferences')
          .eq('user_id', user.id)
          .maybeSingle();

        if (cancelled) return;

        const prefs = (data?.preferences as UserPreferences) || {};
        cachedPrefs = prefs;
        cachedUserId = user.id;
        setPreferencesState(prefs);
      } catch (err) {
        console.error('[useUserPreferences] Load error:', err);
      } finally {
        if (!cancelled) setIsLoaded(true);
      }
    })();

    return () => { cancelled = true; };
  }, [user?.id]);

  // Debounced sync to DB
  const syncToDb = useCallback(() => {
    if (!user?.id) return;
    if (syncTimer.current) clearTimeout(syncTimer.current);

    syncTimer.current = setTimeout(async () => {
      const updates = { ...pendingUpdates.current };
      pendingUpdates.current = {};

      if (Object.keys(updates).length === 0) return;

      try {
        // Merge with current cached prefs
        const merged = { ...cachedPrefs, ...updates };
        cachedPrefs = merged;

        const { error } = await supabase
          .from('user_preferences')
          .upsert({
            user_id: user.id,
            preferences: merged,
          }, { onConflict: 'user_id' });

        if (error) console.error('[useUserPreferences] Sync error:', error);
      } catch (err) {
        console.error('[useUserPreferences] Sync error:', err);
      }
    }, 1000); // 1s debounce
  }, [user?.id]);

  const setPreference = useCallback((key: string, value: any) => {
    setPreferencesState(prev => {
      const next = { ...prev, [key]: value };
      cachedPrefs = next;
      pendingUpdates.current[key] = value;
      return next;
    });
    syncToDb();
  }, [syncToDb]);

  const setPreferencesBatch = useCallback((updates: Record<string, any>) => {
    setPreferencesState(prev => {
      const next = { ...prev, ...updates };
      cachedPrefs = next;
      Object.assign(pendingUpdates.current, updates);
      return next;
    });
    syncToDb();
  }, [syncToDb]);

  const getPreference = useCallback(<T = any>(key: string, fallback?: T): T => {
    return (preferences[key] ?? fallback) as T;
  }, [preferences]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (syncTimer.current) clearTimeout(syncTimer.current);
    };
  }, []);

  return {
    preferences,
    isLoaded,
    getPreference,
    setPreference,
    setPreferences: setPreferencesBatch,
  };
}
