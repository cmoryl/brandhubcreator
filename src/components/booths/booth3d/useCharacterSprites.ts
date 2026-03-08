/**
 * useCharacterSprites — manages generation and caching of billboard character sprites.
 * Auto-generates missing sprites on mount so booths always show photorealistic people.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CHARACTER_CATALOG, type CharacterSprite } from './BillboardFigure';

interface SpriteState {
  /** Map of characterId → public URL */
  sprites: Record<string, string>;
  /** Characters currently being generated */
  generating: Set<string>;
  /** Whether initial check is done */
  ready: boolean;
  /** Number of sprites available */
  count: number;
}

interface GenerateSpriteOptions {
  forceRegenerate?: boolean;
}

export function useCharacterSprites() {
  const [state, setState] = useState<SpriteState>({
    sprites: {},
    generating: new Set(),
    ready: false,
    count: 0,
  });
  const mountedRef = useRef(true);
  const spritesRef = useRef<Record<string, string>>({});

  const getSpriteDirectory = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    return `booth-sprites/${user.id}`;
  }, []);

  const getPublicSpriteUrl = useCallback((path: string, version: string) => {
    const { data } = supabase.storage.from('organization-assets').getPublicUrl(path);
    return `${data.publicUrl}?v=${encodeURIComponent(version)}`;
  }, []);

  const requestSprite = useCallback(
    async (character: CharacterSprite, options: GenerateSpriteOptions = {}) => {
      setState((prev) => ({
        ...prev,
        generating: new Set([...prev.generating, character.id]),
      }));

      try {
        const [{ data: sessionData }, spriteDir] = await Promise.all([
          supabase.auth.getSession(),
          getSpriteDirectory(),
        ]);

        const token = sessionData?.session?.access_token;
        if (!token || !spriteDir) return;

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const response = await fetch(`${supabaseUrl}/functions/v1/generate-character-sprite`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            characterId: character.id,
            promptHint: character.promptHint,
            forceRegenerate: options.forceRegenerate ?? false,
          }),
        });

        if (!response.ok) {
          console.warn(`[useCharacterSprites] Failed to generate ${character.id}: ${response.status}`);
          return;
        }

        const data = await response.json();
        if (!mountedRef.current || !data.url) return;

        spritesRef.current[character.id] = data.url;
        setState((prev) => {
          const newSprites = { ...prev.sprites, [character.id]: data.url };
          return {
            ...prev,
            sprites: newSprites,
            count: Object.keys(newSprites).length,
          };
        });
      } catch (err) {
        console.warn(`[useCharacterSprites] Error generating ${character.id}:`, err);
      } finally {
        if (mountedRef.current) {
          setState((prev) => {
            const newGen = new Set(prev.generating);
            newGen.delete(character.id);
            return { ...prev, generating: newGen };
          });
        }
      }
    },
    [getSpriteDirectory]
  );

  const checkExistingSprites = useCallback(async () => {
    try {
      const spriteDir = await getSpriteDirectory();
      if (!spriteDir) {
        if (mountedRef.current) {
          setState((prev) => ({ ...prev, ready: true }));
        }
        return;
      }

      const { data: files } = await supabase.storage.from('organization-assets').list(spriteDir);

      if (!mountedRef.current) return;

      const existing: Record<string, string> = {};
      if (files) {
        for (const file of files) {
          if (!file.name.endsWith('.png')) continue;
          const id = file.name.replace('.png', '');
          const version = file.updated_at ?? file.created_at ?? file.name;
          existing[id] = getPublicSpriteUrl(`${spriteDir}/${file.name}`, version);
        }
      }

      spritesRef.current = { ...spritesRef.current, ...existing };
      setState((prev) => ({
        ...prev,
        sprites: { ...prev.sprites, ...existing },
        ready: true,
        count: Object.keys({ ...prev.sprites, ...existing }).length,
      }));
    } catch (err) {
      console.warn('[useCharacterSprites] Failed to check existing sprites:', err);
      if (mountedRef.current) {
        setState((prev) => ({ ...prev, ready: true }));
      }
    }
  }, [getPublicSpriteUrl, getSpriteDirectory]);

  // Auto-generate missing sprites sequentially in the background
  const autoGenerateMissing = useCallback(async () => {
    for (const char of CHARACTER_CATALOG) {
      if (!mountedRef.current) break;
      if (spritesRef.current[char.id]) continue;
      await requestSprite(char);
    }
  }, [requestSprite]);

  // On mount: check cache then auto-generate missing sprites
  useEffect(() => {
    mountedRef.current = true;
    checkExistingSprites().then(() => {
      if (mountedRef.current) autoGenerateMissing();
    });
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const generateSprite = useCallback(
    async (character: CharacterSprite) => {
      if (state.sprites[character.id] || state.generating.has(character.id)) return;
      await requestSprite(character);
    },
    [requestSprite, state.generating, state.sprites]
  );

  const generateAll = useCallback(async () => {
    for (const char of CHARACTER_CATALOG) {
      if (!state.sprites[char.id]) {
        await requestSprite(char);
      }
    }
  }, [requestSprite, state.sprites]);

  const regenerateAll = useCallback(async () => {
    try {
      const spriteDir = await getSpriteDirectory();
      if (!spriteDir) return;

      const { data: files } = await supabase.storage.from('organization-assets').list(spriteDir);
      if (files && files.length > 0) {
        const paths = files.map((f) => `${spriteDir}/${f.name}`);
        await supabase.storage.from('organization-assets').remove(paths);
      }

      spritesRef.current = {};
      setState({ sprites: {}, generating: new Set(), ready: true, count: 0 });

      for (const char of CHARACTER_CATALOG) {
        await requestSprite(char, { forceRegenerate: true });
      }
    } catch (err) {
      console.warn('[useCharacterSprites] Regeneration error:', err);
    }
  }, [getSpriteDirectory, requestSprite]);

  const getSpriteUrl = useCallback(
    (characterId: string): string | undefined => {
      return state.sprites[characterId];
    },
    [state.sprites]
  );

  const hasSpriteFor = useCallback(
    (characterId: string): boolean => {
      return !!state.sprites[characterId];
    },
    [state.sprites]
  );

  return {
    sprites: state.sprites,
    ready: state.ready,
    count: state.count,
    totalAvailable: CHARACTER_CATALOG.length,
    isGenerating: state.generating.size > 0,
    generateSprite,
    generateAll,
    regenerateAll,
    getSpriteUrl,
    hasSpriteFor,
  };
}
