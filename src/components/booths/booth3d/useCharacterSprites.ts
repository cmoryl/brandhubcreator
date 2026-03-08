/**
 * useCharacterSprites — manages generation and caching of billboard character sprites.
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

export function useCharacterSprites() {
  const [state, setState] = useState<SpriteState>({
    sprites: {},
    generating: new Set(),
    ready: false,
    count: 0,
  });
  const mountedRef = useRef(true);

  // Check which sprites already exist in storage
  useEffect(() => {
    mountedRef.current = true;
    checkExistingSprites();
    return () => { mountedRef.current = false; };
  }, []);

  const checkExistingSprites = useCallback(async () => {
    try {
      const { data: files } = await supabase.storage
        .from('organization-assets')
        .list('booth-sprites');

      if (!mountedRef.current) return;

      const existing: Record<string, string> = {};
      if (files) {
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          for (const file of files) {
            const id = file.name.replace('.png', '');
            const version = encodeURIComponent(file.updated_at ?? file.created_at ?? file.name);
            existing[id] = `${supabaseUrl}/storage/v1/object/public/organization-assets/booth-sprites/${file.name}?v=${version}`;
          }
      }

      setState(prev => ({
        ...prev,
        sprites: { ...prev.sprites, ...existing },
        ready: true,
        count: Object.keys(existing).length,
      }));
    } catch (err) {
      console.warn('[useCharacterSprites] Failed to check existing sprites:', err);
      if (mountedRef.current) {
        setState(prev => ({ ...prev, ready: true }));
      }
    }
  }, []);

  const generateSprite = useCallback(async (character: CharacterSprite) => {
    if (state.sprites[character.id] || state.generating.has(character.id)) return;

    setState(prev => ({
      ...prev,
      generating: new Set([...prev.generating, character.id]),
    }));

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) return;

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/generate-character-sprite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          characterId: character.id,
          promptHint: character.promptHint,
        }),
      });

      if (!response.ok) {
        console.warn(`[useCharacterSprites] Failed to generate ${character.id}: ${response.status}`);
        return;
      }

      const data = await response.json();
      if (!mountedRef.current) return;

      if (data.url) {
        setState(prev => {
          const newSprites = { ...prev.sprites, [character.id]: data.url };
          const newGen = new Set(prev.generating);
          newGen.delete(character.id);
          return {
            ...prev,
            sprites: newSprites,
            generating: newGen,
            count: Object.keys(newSprites).length,
          };
        });
      }
    } catch (err) {
      console.warn(`[useCharacterSprites] Error generating ${character.id}:`, err);
      if (mountedRef.current) {
        setState(prev => {
          const newGen = new Set(prev.generating);
          newGen.delete(character.id);
          return { ...prev, generating: newGen };
        });
      }
    }
  }, [state.sprites, state.generating]);

  const generateAll = useCallback(async () => {
    for (const char of CHARACTER_CATALOG) {
      if (!state.sprites[char.id]) {
        await generateSprite(char);
      }
    }
  }, [state.sprites, generateSprite]);

  /** Delete all cached sprites and regenerate with proper transparency */
  const regenerateAll = useCallback(async () => {
    try {
      // Delete all existing sprites from storage
      const { data: files } = await supabase.storage
        .from('organization-assets')
        .list('booth-sprites');

      if (files && files.length > 0) {
        const paths = files.map(f => `booth-sprites/${f.name}`);
        await supabase.storage.from('organization-assets').remove(paths);
      }

      // Reset state
      setState({ sprites: {}, generating: new Set(), ready: true, count: 0 });

      // Regenerate all
      for (const char of CHARACTER_CATALOG) {
        await generateSprite(char);
      }
    } catch (err) {
      console.warn('[useCharacterSprites] Regeneration error:', err);
    }
  }, [generateSprite]);

  const getSpriteUrl = useCallback((characterId: string): string | undefined => {
    return state.sprites[characterId];
  }, [state.sprites]);

  const hasSpriteFor = useCallback((characterId: string): boolean => {
    return !!state.sprites[characterId];
  }, [state.sprites]);

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
