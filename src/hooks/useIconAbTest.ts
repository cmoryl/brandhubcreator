/**
 * useIconAbTest — picks a weighted variant for a given A/B test, logs an
 * impression on mount, and exposes a `logClick` callback. Variant choice is
 * stable per session (stored in sessionStorage by test id).
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface IconAbVariant {
  id: string;
  test_id: string;
  icon_id: string;
  label: string | null;
  svg_path: string | null;
  view_box: string | null;
  weight: number;
}

const getSessionId = (): string => {
  if (typeof window === 'undefined') return 'ssr';
  let sid = sessionStorage.getItem('abSessionId');
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem('abSessionId', sid);
  }
  return sid;
};

const pickVariant = (variants: IconAbVariant[], testId: string): IconAbVariant | null => {
  if (variants.length === 0) return null;
  if (typeof window !== 'undefined') {
    const cached = sessionStorage.getItem(`abVariant:${testId}`);
    if (cached) {
      const hit = variants.find((v) => v.id === cached);
      if (hit) return hit;
    }
  }
  const total = variants.reduce((s, v) => s + Math.max(v.weight, 1), 0);
  let r = Math.random() * total;
  for (const v of variants) {
    r -= Math.max(v.weight, 1);
    if (r <= 0) {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(`abVariant:${testId}`, v.id);
      }
      return v;
    }
  }
  return variants[0];
};

const logEvent = async (
  testId: string,
  variantId: string,
  type: 'impression' | 'click',
) => {
  try {
    await supabase.from('icon_ab_events').insert({
      test_id: testId,
      variant_id: variantId,
      event_type: type,
      session_id: getSessionId(),
    });
  } catch {
    /* silent */
  }
};

export const useIconAbTest = (testId: string | null | undefined) => {
  const { data: variants = [], isLoading } = useQuery({
    queryKey: ['icon-ab-variants', testId],
    enabled: !!testId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('icon_ab_variants')
        .select('*')
        .eq('test_id', testId!);
      if (error) throw error;
      return (data ?? []) as IconAbVariant[];
    },
  });

  const variant = useMemo(
    () => (testId ? pickVariant(variants, testId) : null),
    [variants, testId],
  );

  const [impressionLogged, setImpressionLogged] = useState(false);
  useEffect(() => {
    if (!testId || !variant || impressionLogged) return;
    void logEvent(testId, variant.id, 'impression');
    setImpressionLogged(true);
  }, [testId, variant, impressionLogged]);

  const logClick = useCallback(() => {
    if (!testId || !variant) return;
    void logEvent(testId, variant.id, 'click');
  }, [testId, variant]);

  return { variant, variants, isLoading, logClick };
};

export interface IconAbResult {
  variant_id: string;
  label: string | null;
  impressions: number;
  clicks: number;
  ctr: number;
}

export const useIconAbResults = (testId: string | null | undefined) =>
  useQuery({
    queryKey: ['icon-ab-results', testId],
    enabled: !!testId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_icon_ab_results', {
        p_test_id: testId!,
      });
      if (error) throw error;
      return (data ?? []) as IconAbResult[];
    },
  });
