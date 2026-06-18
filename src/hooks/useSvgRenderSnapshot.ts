import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type SnapshotVariant = 'transparent' | 'white' | 'black';

export interface RenderedVariant {
  pngBase64: string;
  sha256: string;
  signature: string; // base64 of SIG_SIZE^2 grayscale bytes
  width: number;
  height: number;
}

export interface RenderResult {
  url: string;
  fileUrlHash: string;
  renderSize: number;
  signatureSize: number;
  variants: Record<SnapshotVariant, RenderedVariant>;
}

export interface Baseline {
  id: string;
  file_url: string;
  file_url_hash: string;
  width: number;
  height: number;
  png_transparent: string;
  png_white: string;
  png_black: string;
  sig_transparent: string;
  sig_white: string;
  sig_black: string;
  sha_transparent: string;
  sha_white: string;
  sha_black: string;
  created_at: string;
  updated_at: string;
}

export interface VariantDiff {
  shaEqual: boolean;
  diffPercent: number; // 0–100, lower = closer to baseline
  maxDelta: number; // 0–255
}

function decodeSignature(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function diffSignatures(
  current: string,
  baseline: string,
  currentSha: string,
  baselineSha: string,
): VariantDiff {
  const a = decodeSignature(current);
  const b = decodeSignature(baseline);
  const n = Math.min(a.length, b.length);
  if (n === 0) return { shaEqual: currentSha === baselineSha, diffPercent: 0, maxDelta: 0 };
  let total = 0;
  let max = 0;
  for (let i = 0; i < n; i++) {
    const d = Math.abs(a[i] - b[i]);
    total += d;
    if (d > max) max = d;
  }
  return {
    shaEqual: currentSha === baselineSha,
    diffPercent: (total / (n * 255)) * 100,
    maxDelta: max,
  };
}

async function sha256Hex(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function useSvgRenderSnapshot(url: string | null) {
  const [baseline, setBaseline] = useState<Baseline | null>(null);
  const [current, setCurrent] = useState<RenderResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setBaseline(null);
    setCurrent(null);
    setError(null);
    if (!url) return;
    (async () => {
      const hash = await sha256Hex(url);
      if (cancelled) return;
      const { data, error: dbErr } = await supabase
        .from('svg_render_snapshots')
        .select('*')
        .eq('file_url_hash', hash)
        .maybeSingle();
      if (cancelled) return;
      if (dbErr) {
        setError(dbErr.message);
        return;
      }
      setBaseline(data as Baseline | null);
    })();
    return () => {
      cancelled = true;
    };
  }, [url]);

  const render = useCallback(async () => {
    if (!url) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke(
        'svg-render-snapshot',
        { body: { url } },
      );
      if (fnErr) throw fnErr;
      if (data?.error) throw new Error(data.error);
      setCurrent(data as RenderResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [url]);

  const saveBaseline = useCallback(async () => {
    if (!url || !current) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        file_url: url,
        file_url_hash: current.fileUrlHash,
        width: current.variants.transparent.width,
        height: current.variants.transparent.height,
        png_transparent: current.variants.transparent.pngBase64,
        png_white: current.variants.white.pngBase64,
        png_black: current.variants.black.pngBase64,
        sig_transparent: current.variants.transparent.signature,
        sig_white: current.variants.white.signature,
        sig_black: current.variants.black.signature,
        sha_transparent: current.variants.transparent.sha256,
        sha_white: current.variants.white.sha256,
        sha_black: current.variants.black.sha256,
      };
      const { data, error: upErr } = await supabase
        .from('svg_render_snapshots')
        .upsert(payload, { onConflict: 'file_url_hash' })
        .select()
        .single();
      if (upErr) throw upErr;
      setBaseline(data as Baseline);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }, [url, current]);

  const clearBaseline = useCallback(async () => {
    if (!baseline) return;
    setSaving(true);
    setError(null);
    try {
      const { error: delErr } = await supabase
        .from('svg_render_snapshots')
        .delete()
        .eq('id', baseline.id);
      if (delErr) throw delErr;
      setBaseline(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }, [baseline]);

  return {
    baseline,
    current,
    loading,
    saving,
    error,
    render,
    saveBaseline,
    clearBaseline,
  };
}
