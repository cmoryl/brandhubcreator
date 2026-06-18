// Client-side visual audit for logo files. Loads each image, renders to a canvas,
// and runs heuristic pixel checks that catch issues the URL/format audit can't:
//  - image actually loads
//  - non-empty, sane aspect ratio
//  - has transparency where expected (icon/wordmark on white or black slot)
//  - variant color: 'black' → mostly dark ink, 'white' → mostly light ink, 'color' → has chroma
//  - sufficient contrast against the intended display background

export type VisualStatus = 'pass' | 'warn' | 'fail';

export interface VisualCheck {
  id: string;
  label: string;
  status: VisualStatus;
  detail?: string;
}

export interface VisualAuditResult {
  status: VisualStatus;
  width: number;
  height: number;
  aspect: number;
  hasAlpha: boolean;
  alphaCoverage: number;        // share of inked (non-transparent) pixels
  meanLuminance: number;        // 0..1 of inked pixels
  meanChroma: number;           // 0..1 of inked pixels (max-min rgb)
  bgContrast: number;           // luminance gap vs intended background
  checks: VisualCheck[];
  passCount: number;
  warnCount: number;
  failCount: number;
  error?: string;
}

type Variant = 'color' | 'black' | 'white';

const MAX_DIM = 256; // sample size for canvas analysis

function loadImage(url: string, timeoutMs = 8000): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.referrerPolicy = 'no-referrer';
    const t = setTimeout(() => reject(new Error('timeout')), timeoutMs);
    img.onload = () => { clearTimeout(t); resolve(img); };
    img.onerror = () => { clearTimeout(t); reject(new Error('load failed')); };
    img.src = url;
  });
}

function analyzePixels(img: HTMLImageElement) {
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  if (!w || !h) throw new Error('zero-dimension image');

  const scale = Math.min(1, MAX_DIM / Math.max(w, h));
  const cw = Math.max(1, Math.round(w * scale));
  const ch = Math.max(1, Math.round(h * scale));

  const canvas = document.createElement('canvas');
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('no canvas context');
  ctx.clearRect(0, 0, cw, ch);
  ctx.drawImage(img, 0, 0, cw, ch);

  let data: Uint8ClampedArray;
  try {
    data = ctx.getImageData(0, 0, cw, ch).data;
  } catch {
    throw new Error('cors-tainted');
  }

  let inked = 0;
  let lumSum = 0;
  let chromaSum = 0;
  let alphaSum = 0;
  const total = cw * ch;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
    alphaSum += a;
    if (a < 24) continue; // treat near-transparent as background
    inked++;
    const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    lumSum += lum;
    chromaSum += (max - min) / 255;
  }

  const meanAlpha = alphaSum / (total * 255);
  return {
    width: w,
    height: h,
    aspect: w / h,
    alphaCoverage: inked / total,
    hasAlpha: meanAlpha < 0.995,
    meanLuminance: inked ? lumSum / inked : 0,
    meanChroma: inked ? chromaSum / inked : 0,
  };
}

function rollup(checks: VisualCheck[]): { status: VisualStatus; passCount: number; warnCount: number; failCount: number } {
  let p = 0, w = 0, f = 0;
  for (const c of checks) {
    if (c.status === 'pass') p++;
    else if (c.status === 'warn') w++;
    else f++;
  }
  return { status: f ? 'fail' : w ? 'warn' : 'pass', passCount: p, warnCount: w, failCount: f };
}

export async function visualAuditFile(url: string, variant: Variant): Promise<VisualAuditResult> {
  const checks: VisualCheck[] = [];
  let img: HTMLImageElement;
  try {
    img = await loadImage(url);
  } catch (e) {
    const msg = (e as Error).message;
    checks.push({ id: 'load', label: 'Image loads', status: 'fail', detail: msg });
    const r = rollup(checks);
    return {
      ...r,
      width: 0, height: 0, aspect: 0,
      hasAlpha: false, alphaCoverage: 0, meanLuminance: 0, meanChroma: 0, bgContrast: 0,
      checks,
      error: msg,
    };
  }
  checks.push({ id: 'load', label: 'Image loads', status: 'pass' });

  let metrics;
  try {
    metrics = analyzePixels(img);
  } catch (e) {
    const msg = (e as Error).message;
    checks.push({
      id: 'pixels',
      label: 'Pixels readable',
      status: msg === 'cors-tainted' ? 'warn' : 'fail',
      detail: msg === 'cors-tainted'
        ? 'CORS blocked pixel analysis (file still loads in the browser).'
        : msg,
    });
    const r = rollup(checks);
    return {
      ...r,
      width: img.naturalWidth || 0,
      height: img.naturalHeight || 0,
      aspect: (img.naturalWidth || 0) / (img.naturalHeight || 1),
      hasAlpha: false, alphaCoverage: 0, meanLuminance: 0, meanChroma: 0, bgContrast: 0,
      checks,
      error: msg,
    };
  }

  // Dimensions
  if (metrics.width < 32 || metrics.height < 32) {
    checks.push({
      id: 'dim',
      label: 'Minimum dimensions (≥32px)',
      status: 'warn',
      detail: `${metrics.width}×${metrics.height}`,
    });
  } else {
    checks.push({ id: 'dim', label: 'Minimum dimensions (≥32px)', status: 'pass', detail: `${metrics.width}×${metrics.height}` });
  }

  // Aspect ratio
  if (metrics.aspect < 0.2 || metrics.aspect > 8) {
    checks.push({ id: 'aspect', label: 'Sane aspect ratio', status: 'warn', detail: metrics.aspect.toFixed(2) });
  } else {
    checks.push({ id: 'aspect', label: 'Sane aspect ratio', status: 'pass', detail: metrics.aspect.toFixed(2) });
  }

  // Coverage — must contain visible ink
  if (metrics.alphaCoverage < 0.005) {
    checks.push({ id: 'coverage', label: 'Contains visible ink', status: 'fail', detail: 'Image appears blank' });
  } else if (metrics.alphaCoverage > 0.92 && variant !== 'color') {
    checks.push({
      id: 'coverage',
      label: 'Has transparent background',
      status: 'warn',
      detail: 'Image looks like a solid fill — likely missing transparency',
    });
  } else {
    checks.push({ id: 'coverage', label: 'Contains visible ink', status: 'pass' });
  }

  // Variant pixel correctness
  if (variant === 'black') {
    if (metrics.meanLuminance < 0.22 && metrics.meanChroma < 0.15) {
      checks.push({ id: 'variant-px', label: 'Black variant pixels', status: 'pass' });
    } else if (metrics.meanLuminance < 0.45) {
      checks.push({
        id: 'variant-px',
        label: 'Black variant pixels',
        status: 'warn',
        detail: `Mean ink luminance ${(metrics.meanLuminance * 100).toFixed(0)}%`,
      });
    } else {
      checks.push({
        id: 'variant-px',
        label: 'Black variant pixels',
        status: 'fail',
        detail: 'Ink is not dark enough to be a black variant',
      });
    }
  } else if (variant === 'white') {
    if (metrics.meanLuminance > 0.82 && metrics.meanChroma < 0.15) {
      checks.push({ id: 'variant-px', label: 'White variant pixels', status: 'pass' });
    } else if (metrics.meanLuminance > 0.6) {
      checks.push({
        id: 'variant-px',
        label: 'White variant pixels',
        status: 'warn',
        detail: `Mean ink luminance ${(metrics.meanLuminance * 100).toFixed(0)}%`,
      });
    } else {
      checks.push({
        id: 'variant-px',
        label: 'White variant pixels',
        status: 'fail',
        detail: 'Ink is not light enough to be a white variant',
      });
    }
  } else {
    if (metrics.meanChroma > 0.05) {
      checks.push({ id: 'variant-px', label: 'Color variant has chroma', status: 'pass' });
    } else {
      checks.push({
        id: 'variant-px',
        label: 'Color variant has chroma',
        status: 'warn',
        detail: 'Pixels look monochrome — may actually be a black/white asset mislabeled as color',
      });
    }
  }

  // Contrast against the intended display background
  const bgLum = variant === 'white' ? 0.05 : 1.0; // we show white variants on near-black
  const bgContrast = Math.abs(metrics.meanLuminance - bgLum);
  if (bgContrast > 0.35) {
    checks.push({ id: 'contrast', label: 'Contrast vs display background', status: 'pass', detail: bgContrast.toFixed(2) });
  } else if (bgContrast > 0.18) {
    checks.push({ id: 'contrast', label: 'Contrast vs display background', status: 'warn', detail: bgContrast.toFixed(2) });
  } else {
    checks.push({
      id: 'contrast',
      label: 'Contrast vs display background',
      status: 'fail',
      detail: `Δ luminance ${bgContrast.toFixed(2)} — logo will disappear on its slot background`,
    });
  }

  const r = rollup(checks);
  return {
    ...r,
    width: metrics.width,
    height: metrics.height,
    aspect: metrics.aspect,
    hasAlpha: metrics.hasAlpha,
    alphaCoverage: metrics.alphaCoverage,
    meanLuminance: metrics.meanLuminance,
    meanChroma: metrics.meanChroma,
    bgContrast,
    checks,
  };
}
