/**
 * Client-side image → gradient extraction.
 *
 * Two-stage approach:
 *  1. k-means on a down-sampled pixel grid (no deps, runs in browser).
 *  2. Sample the 4 corners + center to lay those colors out spatially as a
 *     mesh gradient that visually approximates the source image.
 */

import { StudioGradient, createStudioGradient } from "./gradientStudio";

const TARGET_SIZE = 96;   // downsample width for clustering
const MAX_ITERS = 12;

interface RGB { r: number; g: number; b: number }

const toHex = ({ r, g, b }: RGB) =>
  "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");

const dist = (a: RGB, b: RGB) =>
  (a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2;

async function loadImage(src: string | File): Promise<HTMLImageElement> {
  const url = typeof src === "string" ? src : URL.createObjectURL(src);
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = url;
  });
  if (typeof src !== "string") setTimeout(() => URL.revokeObjectURL(url), 1000);
  return img;
}

function getPixels(img: HTMLImageElement, size: number) {
  const ratio = img.naturalHeight / img.naturalWidth;
  const w = size;
  const h = Math.max(8, Math.round(size * ratio));
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, w, h);
  return { data: ctx.getImageData(0, 0, w, h).data, w, h };
}

function kmeansColors(pixels: Uint8ClampedArray, k: number): { color: RGB; weight: number }[] {
  const samples: RGB[] = [];
  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i + 3] < 200) continue; // skip transparent
    samples.push({ r: pixels[i], g: pixels[i + 1], b: pixels[i + 2] });
  }
  if (!samples.length) return [];

  // init: pick k random distinct samples
  const centroids: RGB[] = [];
  const step = Math.max(1, Math.floor(samples.length / k));
  for (let i = 0; i < k; i++) centroids.push({ ...samples[Math.min(samples.length - 1, i * step)] });

  const assignments = new Int32Array(samples.length);

  for (let iter = 0; iter < MAX_ITERS; iter++) {
    let moved = 0;
    // assign
    for (let i = 0; i < samples.length; i++) {
      let best = 0, bestD = Infinity;
      for (let c = 0; c < k; c++) {
        const d = dist(samples[i], centroids[c]);
        if (d < bestD) { bestD = d; best = c; }
      }
      if (assignments[i] !== best) { assignments[i] = best; moved++; }
    }
    // update
    const sums = Array.from({ length: k }, () => ({ r: 0, g: 0, b: 0, n: 0 }));
    for (let i = 0; i < samples.length; i++) {
      const s = sums[assignments[i]], p = samples[i];
      s.r += p.r; s.g += p.g; s.b += p.b; s.n++;
    }
    for (let c = 0; c < k; c++) {
      if (sums[c].n > 0) centroids[c] = { r: sums[c].r / sums[c].n, g: sums[c].g / sums[c].n, b: sums[c].b / sums[c].n };
    }
    if (moved === 0) break;
  }

  const counts = new Array(k).fill(0);
  for (let i = 0; i < samples.length; i++) counts[assignments[i]]++;
  return centroids
    .map((c, i) => ({ color: c, weight: counts[i] / samples.length }))
    .sort((a, b) => b.weight - a.weight);
}

function sampleAt(data: Uint8ClampedArray, w: number, h: number, fx: number, fy: number): RGB {
  // average a 5x5 patch around the point for robustness
  const cx = Math.max(2, Math.min(w - 3, Math.round(fx * w)));
  const cy = Math.max(2, Math.min(h - 3, Math.round(fy * h)));
  let r = 0, g = 0, b = 0, n = 0;
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      const i = ((cy + dy) * w + (cx + dx)) * 4;
      r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
    }
  }
  return { r: r / n, g: g / n, b: b / n };
}

export interface ImageGradientResult {
  palette: string[];                    // top dominant colors (hex)
  meshGradient: StudioGradient;         // mesh-style gradient
  linearGradient: StudioGradient;       // simple linear fallback (top 2 colors)
  thumbnailDataUrl: string;             // preview of source
}

export async function gradientFromImage(
  src: string | File,
  opts: { paletteSize?: number; name?: string } = {},
): Promise<ImageGradientResult> {
  const img = await loadImage(src);
  const { data, w, h } = getPixels(img, TARGET_SIZE);

  const k = opts.paletteSize ?? 6;
  const palette = kmeansColors(data, k).map((c) => toHex(c.color));

  // Spatial sampling for mesh layout (4 corners + center)
  const spots: { x: number; y: number; key: string }[] = [
    { x: 12, y: 15, key: "tl" }, { x: 88, y: 15, key: "tr" },
    { x: 12, y: 85, key: "bl" }, { x: 88, y: 85, key: "br" },
    { x: 50, y: 50, key: "cc" },
  ];

  const meshPoints = spots.map((s) => {
    const rgb = sampleAt(data, w, h, s.x / 100, s.y / 100);
    return { id: crypto.randomUUID(), color: toHex(rgb), x: s.x, y: s.y };
  });

  const name = opts.name ?? "AI Gradient";
  const meshGradient = createStudioGradient({
    name: `${name} (mesh)`,
    type: "mesh",
    meshBlur: 90,
    meshPoints,
  });

  // Linear fallback: top 2 dominant colors on a 135° axis
  const top2 = palette.slice(0, 2);
  const linearGradient = createStudioGradient({
    name: `${name} (linear)`,
    type: "linear",
    angle: 135,
    stops: [
      { id: crypto.randomUUID(), color: top2[0] ?? "#000", position: 0 },
      { id: crypto.randomUUID(), color: top2[1] ?? top2[0] ?? "#fff", position: 100 },
    ],
  });

  // Thumbnail
  const thumbCanvas = document.createElement("canvas");
  thumbCanvas.width = 160;
  thumbCanvas.height = Math.round(160 * (img.naturalHeight / img.naturalWidth));
  thumbCanvas.getContext("2d")!.drawImage(img, 0, 0, thumbCanvas.width, thumbCanvas.height);
  const thumbnailDataUrl = thumbCanvas.toDataURL("image/jpeg", 0.8);

  return { palette, meshGradient, linearGradient, thumbnailDataUrl };
}
