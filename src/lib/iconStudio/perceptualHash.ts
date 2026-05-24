/**
 * Perceptual hashing for icons.
 * Rasterizes a 24×24-viewBox SVG path into a 16×16 grayscale grid and computes
 * a 256-bit hash (1 bit per cell vs. mean luminance). Distance is Hamming.
 *
 * Designed to be cheap enough to fan-out across a 2k-icon library in the main
 * thread (no Workers/OffscreenCanvas required).
 */

const HASH_SIZE = 16; // 16×16 = 256 bits
const RENDER_SIZE = 64; // upscale for better antialiased coverage

export type IconHash = Uint8Array; // length = HASH_SIZE * HASH_SIZE / 8 = 32

const wrapSvg = (svgPath: string, viewBox = '0 0 24 24', fillMode: 'stroke' | 'fill' = 'fill') => {
  // svgPath may already be a full <svg>… or a bare <path …/> or a "d" string.
  const trimmed = (svgPath || '').trim();
  if (trimmed.startsWith('<svg')) return trimmed;
  const inner = trimmed.startsWith('<')
    ? trimmed
    : `<path d="${trimmed.replace(/"/g, '&quot;')}" ${
        fillMode === 'stroke'
          ? 'fill="none" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"'
          : 'fill="black"'
      }/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${inner}</svg>`;
};

const rasterCache = new Map<string, IconHash>();

export const hashIcon = async (
  cacheKey: string,
  svgPath: string,
  viewBox?: string,
  fillMode?: 'stroke' | 'fill',
): Promise<IconHash | null> => {
  const hit = rasterCache.get(cacheKey);
  if (hit) return hit;
  if (typeof document === 'undefined') return null;

  try {
    const svg = wrapSvg(svgPath, viewBox, fillMode);
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.decoding = 'async';
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('svg load failed'));
      img.src = url;
    });

    const canvas = document.createElement('canvas');
    canvas.width = RENDER_SIZE;
    canvas.height = RENDER_SIZE;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      URL.revokeObjectURL(url);
      return null;
    }
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, RENDER_SIZE, RENDER_SIZE);
    ctx.drawImage(img, 0, 0, RENDER_SIZE, RENDER_SIZE);
    URL.revokeObjectURL(url);

    // Downsample to HASH_SIZE × HASH_SIZE using box average of luminance.
    const { data } = ctx.getImageData(0, 0, RENDER_SIZE, RENDER_SIZE);
    const step = RENDER_SIZE / HASH_SIZE;
    const grid = new Float32Array(HASH_SIZE * HASH_SIZE);
    let total = 0;
    for (let gy = 0; gy < HASH_SIZE; gy++) {
      for (let gx = 0; gx < HASH_SIZE; gx++) {
        let sum = 0;
        let n = 0;
        const x0 = Math.floor(gx * step);
        const y0 = Math.floor(gy * step);
        const x1 = Math.floor((gx + 1) * step);
        const y1 = Math.floor((gy + 1) * step);
        for (let y = y0; y < y1; y++) {
          for (let x = x0; x < x1; x++) {
            const i = (y * RENDER_SIZE + x) * 4;
            // Luminance (rec. 601). We treat "darkness" as ink coverage.
            const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            sum += 255 - lum; // invert: ink = high
            n++;
          }
        }
        const v = sum / Math.max(n, 1);
        grid[gy * HASH_SIZE + gx] = v;
        total += v;
      }
    }
    const mean = total / grid.length;
    const bits = new Uint8Array(grid.length / 8);
    for (let i = 0; i < grid.length; i++) {
      if (grid[i] > mean) bits[i >> 3] |= 1 << (i & 7);
    }
    rasterCache.set(cacheKey, bits);
    return bits;
  } catch {
    return null;
  }
};

export const hammingDistance = (a: IconHash, b: IconHash): number => {
  if (a.length !== b.length) return Number.MAX_SAFE_INTEGER;
  let d = 0;
  for (let i = 0; i < a.length; i++) {
    let x = a[i] ^ b[i];
    // popcount
    x = x - ((x >> 1) & 0x55);
    x = (x & 0x33) + ((x >> 2) & 0x33);
    d += (((x + (x >> 4)) & 0x0f) * 0x01) & 0xff;
  }
  return d;
};

/** Similarity in 0..1 (1 = identical). */
export const similarityFromHash = (a: IconHash, b: IconHash): number => {
  const bits = a.length * 8;
  return 1 - hammingDistance(a, b) / bits;
};
