// Client-side mono cutout detector.
//
// Mirrors the heuristics in supabase/functions/derive-mono-svgs/index.ts so we
// can audit which derived monochrome SVGs failed to preserve the inner
// transparent cutouts (Amex letters, LEGO inner blocks, etc.).

export function isWhiteish(v: string): boolean {
  if (!v) return false;
  const t = v.trim().toLowerCase();
  const c = t.replace(/\s+/g, '');
  if (c === 'white' || c === '#fff' || c === '#ffffff') return true;
  let m = c.match(/^#([0-9a-f]{6})$/);
  if (m) {
    const n = parseInt(m[1], 16);
    return ((n >> 16) & 0xff) > 235 && ((n >> 8) & 0xff) > 235 && (n & 0xff) > 235;
  }
  m = c.match(/^#([0-9a-f]{3})$/);
  if (m) {
    const ex = m[1].split('').map((ch) => ch + ch).join('');
    const n = parseInt(ex, 16);
    return ((n >> 16) & 0xff) > 235 && ((n >> 8) & 0xff) > 235 && (n & 0xff) > 235;
  }
  m = t.match(/^rgba?\(\s*(\d+(?:\.\d+)?)\s*[, ]\s*(\d+(?:\.\d+)?)\s*[, ]\s*(\d+(?:\.\d+)?)/);
  if (m) return +m[1] > 235 && +m[2] > 235 && +m[3] > 235;
  if (t.startsWith('hsl')) {
    const hm = t.match(/^hsla?\(\s*[\d.]+\s*[, ]\s*[\d.]+%\s*[, ]\s*([\d.]+)%/);
    if (hm) return parseFloat(hm[1]) > 92;
  }
  return false;
}

/** Number of elements in the color SVG that look like cutout candidates. */
export function countWhiteFillCandidates(svg: string): number {
  let count = 0;
  const tagRe = /<([a-zA-Z][\w:-]*)\b([^>]*)>/g;
  let m: RegExpExecArray | null;
  while ((m = tagRe.exec(svg)) !== null) {
    const attrs = m[2];
    const fAttr = attrs.match(/\sfill\s*=\s*"([^"]*)"/i);
    if (fAttr && isWhiteish(fAttr[1])) { count++; continue; }
    const sAttr = attrs.match(/\sstyle\s*=\s*"([^"]*)"/i);
    if (sAttr) {
      const fm = sAttr[1].match(/(?:^|;)\s*fill\s*:\s*([^;]+)/i);
      if (fm && isWhiteish(fm[1])) { count++; continue; }
    }
  }
  return count;
}

/** Did the derived mono SVG tag any cutouts? */
export function countTaggedCutouts(svg: string): number {
  const m = svg.match(/data-mono-cutout="1"/g);
  return m ? m.length : 0;
}

export type CutoutStatus = 'pass' | 'fail' | 'not-applicable' | 'error';

export interface CutoutCheck {
  status: CutoutStatus;
  whiteCandidates: number;
  taggedCutouts: number;
  hasMonoStyleBlock: boolean;
  note: string;
}

export function analyzeMonoPair(colorSvg: string, monoSvg: string): CutoutCheck {
  const whiteCandidates = countWhiteFillCandidates(colorSvg);
  const taggedCutouts = countTaggedCutouts(monoSvg);
  const hasMonoStyleBlock = /data-mono-cutout/.test(monoSvg) || /data-mono-stroke/.test(monoSvg);
  if (whiteCandidates === 0) {
    return {
      status: 'not-applicable',
      whiteCandidates,
      taggedCutouts,
      hasMonoStyleBlock,
      note: 'No white-fill shapes in color SVG — no cutouts expected.',
    };
  }
  if (taggedCutouts === 0) {
    return {
      status: 'fail',
      whiteCandidates,
      taggedCutouts,
      hasMonoStyleBlock,
      note: hasMonoStyleBlock
        ? 'Color SVG has white-fill shapes but the mono variant tagged none — cutouts will fill in.'
        : 'Mono SVG was not produced by the current pipeline (no data-mono-* markers). Regenerate.',
    };
  }
  // Heuristic: if mono tagged at least as many cutouts as we detected, call it pass.
  if (taggedCutouts >= Math.max(1, Math.floor(whiteCandidates * 0.5))) {
    return {
      status: 'pass',
      whiteCandidates,
      taggedCutouts,
      hasMonoStyleBlock,
      note: 'Cutouts preserved.',
    };
  }
  return {
    status: 'fail',
    whiteCandidates,
    taggedCutouts,
    hasMonoStyleBlock,
    note: `Mono tagged ${taggedCutouts} of ~${whiteCandidates} candidate cutouts — likely incomplete.`,
  };
}

export async function fetchText(url: string, signal?: AbortSignal): Promise<string> {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.text();
}
