/**
 * Gradient Studio — shared types, serialization, and exporters.
 *
 * Backwards compatible with BrandGradient.css: a Studio gradient round-trips
 * through CSS by prepending a `/* GS:<json> *​/` comment, which we strip on
 * render so existing consumers still see valid CSS.
 */

export type GradientType = "linear" | "radial" | "conic" | "mesh";

export interface GradientStop {
  id: string;
  color: string;    // hex / hsl / rgb
  position: number; // 0..100
}

export interface MeshPoint {
  id: string;
  color: string;
  x: number; // 0..100
  y: number; // 0..100
}

export interface GradientAnimation {
  enabled: boolean;
  durationMs: number;        // total cycle length
  mode: "shift" | "rotate" | "pulse";
}

export interface GradientNoise {
  enabled: boolean;
  opacity: number;     // 0..1
  scale: number;       // svg turbulence baseFrequency multiplier (0.4..2.5)
}

export interface StudioGradient {
  id: string;
  name: string;
  type: GradientType;
  // Linear
  angle: number;       // degrees (linear/conic)
  // Radial
  shape: "ellipse" | "circle";
  size: "farthest-corner" | "closest-side" | "closest-corner" | "farthest-side";
  position: { x: number; y: number }; // 0..100 (radial/conic)
  // Stops
  stops: GradientStop[];
  // Mesh
  meshPoints: MeshPoint[];
  meshBlur: number;    // px feGaussianBlur
  // Effects
  noise: GradientNoise;
  animation: GradientAnimation;
}

export const DEFAULT_STOPS = (): GradientStop[] => [
  { id: crypto.randomUUID(), color: "#667eea", position: 0 },
  { id: crypto.randomUUID(), color: "#764ba2", position: 100 },
];

export const DEFAULT_MESH = (): MeshPoint[] => [
  { id: crypto.randomUUID(), color: "#ff6b6b", x: 15, y: 20 },
  { id: crypto.randomUUID(), color: "#4ecdc4", x: 85, y: 18 },
  { id: crypto.randomUUID(), color: "#ffe66d", x: 18, y: 85 },
  { id: crypto.randomUUID(), color: "#7c5cff", x: 82, y: 82 },
];

export const createStudioGradient = (over: Partial<StudioGradient> = {}): StudioGradient => ({
  id: crypto.randomUUID(),
  name: "Untitled Gradient",
  type: "linear",
  angle: 135,
  shape: "ellipse",
  size: "farthest-corner",
  position: { x: 50, y: 50 },
  stops: DEFAULT_STOPS(),
  meshPoints: DEFAULT_MESH(),
  meshBlur: 60,
  noise: { enabled: false, opacity: 0.18, scale: 0.9 },
  animation: { enabled: false, durationMs: 8000, mode: "shift" },
  ...over,
});

/* -------------------------------------------------------------------------- */
/* Serialization                                                              */
/* -------------------------------------------------------------------------- */

const GS_MARKER = /^\s*\/\*\s*GS:(.+?)\s*\*\/\s*/s;

export const stripStudioMeta = (css: string): string => css.replace(GS_MARKER, "").trim();

export const extractStudioGradient = (css: string): StudioGradient | null => {
  const m = css.match(GS_MARKER);
  if (!m) return null;
  try {
    const parsed = JSON.parse(m[1]);
    return { ...createStudioGradient(), ...parsed } as StudioGradient;
  } catch {
    return null;
  }
};

export const serializeWithMeta = (g: StudioGradient): string => {
  const meta = {
    id: g.id, name: g.name, type: g.type, angle: g.angle,
    shape: g.shape, size: g.size, position: g.position,
    stops: g.stops, meshPoints: g.meshPoints, meshBlur: g.meshBlur,
    noise: g.noise, animation: g.animation,
  };
  return `/* GS:${JSON.stringify(meta)} */${toCssGradient(g)}`;
};

/* -------------------------------------------------------------------------- */
/* CSS generation                                                             */
/* -------------------------------------------------------------------------- */

const stopList = (stops: GradientStop[]) =>
  [...stops]
    .sort((a, b) => a.position - b.position)
    .map((s) => `${s.color} ${Math.round(s.position)}%`)
    .join(", ");

/** Plain CSS gradient string (no noise/mesh — mesh falls back to a linear blend). */
export const toCssGradient = (g: StudioGradient): string => {
  if (g.type === "linear") return `linear-gradient(${g.angle}deg, ${stopList(g.stops)})`;
  if (g.type === "radial")
    return `radial-gradient(${g.shape} ${g.size} at ${g.position.x}% ${g.position.y}%, ${stopList(g.stops)})`;
  if (g.type === "conic")
    return `conic-gradient(from ${g.angle}deg at ${g.position.x}% ${g.position.y}%, ${stopList(g.stops)})`;
  // mesh fallback for `background:` consumers
  return meshLinearFallback(g);
};

const meshLinearFallback = (g: StudioGradient): string => {
  const colors = g.meshPoints.map((p) => p.color);
  if (colors.length < 2) return `linear-gradient(135deg, ${colors[0] ?? "#000"} 0%, ${colors[0] ?? "#000"} 100%)`;
  const step = 100 / (colors.length - 1);
  return `linear-gradient(135deg, ${colors.map((c, i) => `${c} ${Math.round(i * step)}%`).join(", ")})`;
};

/* -------------------------------------------------------------------------- */
/* SVG generation (mesh, noise, raster export)                                */
/* -------------------------------------------------------------------------- */

export interface SvgOpts { width: number; height: number; includeNoise?: boolean }

export const toSvg = (g: StudioGradient, opts: SvgOpts): string => {
  const { width, height } = opts;
  const includeNoise = opts.includeNoise ?? g.noise.enabled;

  const noiseFilter = includeNoise
    ? `<filter id="gs-noise"><feTurbulence type="fractalNoise" baseFrequency="${g.noise.scale}" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 ${g.noise.opacity} 0"/></filter>`
    : "";
  const noiseRect = includeNoise
    ? `<rect width="100%" height="100%" filter="url(#gs-noise)" style="mix-blend-mode:overlay"/>`
    : "";

  if (g.type === "mesh") {
    const blur = g.meshBlur;
    const points = g.meshPoints
      .map((p, i) => {
        const r = Math.max(width, height) * 0.55;
        return `<radialGradient id="mp${i}" cx="${p.x}%" cy="${p.y}%" r="${r}" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="${p.color}" stop-opacity="1"/><stop offset="100%" stop-color="${p.color}" stop-opacity="0"/></radialGradient>`;
      })
      .join("");
    const rects = g.meshPoints
      .map((_, i) => `<rect width="100%" height="100%" fill="url(#mp${i})"/>`)
      .join("");
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs>${points}<filter id="gs-blur"><feGaussianBlur stdDeviation="${blur}"/></filter>${noiseFilter}</defs><rect width="100%" height="100%" fill="${g.meshPoints[0]?.color ?? "#000"}"/><g filter="url(#gs-blur)">${rects}</g>${noiseRect}</svg>`;
  }

  // linear / radial / conic via SVG gradients
  const stops = [...g.stops].sort((a, b) => a.position - b.position);
  const stopEls = stops.map((s) => `<stop offset="${s.position}%" stop-color="${s.color}"/>`).join("");

  let gradEl = "";
  if (g.type === "linear") {
    // angle 0 = up; map to x1/y1/x2/y2
    const rad = ((g.angle - 90) * Math.PI) / 180;
    const x1 = 50 - Math.cos(rad) * 50;
    const y1 = 50 - Math.sin(rad) * 50;
    const x2 = 50 + Math.cos(rad) * 50;
    const y2 = 50 + Math.sin(rad) * 50;
    gradEl = `<linearGradient id="gs-g" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">${stopEls}</linearGradient>`;
  } else if (g.type === "radial") {
    gradEl = `<radialGradient id="gs-g" cx="${g.position.x}%" cy="${g.position.y}%" r="70%">${stopEls}</radialGradient>`;
  } else {
    // SVG has no conic. Approximate with a foreignObject HTML wrapper.
    const html = `<div xmlns="http://www.w3.org/1999/xhtml" style="width:100%;height:100%;background:${toCssGradient(g)}"></div>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs>${noiseFilter}</defs><foreignObject width="100%" height="100%">${html}</foreignObject>${noiseRect}</svg>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs>${gradEl}${noiseFilter}</defs><rect width="100%" height="100%" fill="url(#gs-g)"/>${noiseRect}</svg>`;
};

/* -------------------------------------------------------------------------- */
/* Raster export                                                              */
/* -------------------------------------------------------------------------- */

export async function rasterizeSvg(
  svg: string,
  format: "png" | "jpg",
  width: number,
  height: number,
): Promise<Blob> {
  const blob = new Blob([svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.crossOrigin = "anonymous";
      i.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;
    if (format === "jpg") { ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, width, height); }
    ctx.drawImage(img, 0, 0, width, height);
    return await new Promise<Blob>((res) =>
      canvas.toBlob((b) => res(b!), format === "png" ? "image/png" : "image/jpeg", 0.92),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

/* -------------------------------------------------------------------------- */
/* Export formats                                                             */
/* -------------------------------------------------------------------------- */

const sanitizeName = (n: string) =>
  n.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "gradient";

export const exportCssBlock = (g: StudioGradient): string => {
  const name = sanitizeName(g.name);
  const lines = [`/* ${g.name} */`, `.${name} {`, `  background: ${toCssGradient(g)};`];
  if (g.animation.enabled) {
    lines.push(`  background-size: 200% 200%;`);
    lines.push(`  animation: ${name}-anim ${Math.round(g.animation.durationMs)}ms ease-in-out infinite alternate;`);
  }
  lines.push("}");
  if (g.animation.enabled) {
    if (g.animation.mode === "shift") {
      lines.push(`@keyframes ${name}-anim { 0% { background-position: 0% 50%; } 100% { background-position: 100% 50%; } }`);
    } else if (g.animation.mode === "rotate") {
      lines.push(`@keyframes ${name}-anim { 0% { filter: hue-rotate(0deg); } 100% { filter: hue-rotate(360deg); } }`);
    } else {
      lines.push(`@keyframes ${name}-anim { 0% { opacity: 0.85; } 100% { opacity: 1; } }`);
    }
  }
  return lines.join("\n");
};

export const exportTailwindConfig = (g: StudioGradient): string => {
  const name = sanitizeName(g.name);
  return [
    `// tailwind.config.{js,ts} — extend.backgroundImage`,
    `module.exports = {`,
    `  theme: {`,
    `    extend: {`,
    `      backgroundImage: {`,
    `        "${name}": "${toCssGradient(g)}",`,
    `      },`,
    `    },`,
    `  },`,
    `};`,
    ``,
    `// Usage: <div class="bg-${name}" />`,
  ].join("\n");
};

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
