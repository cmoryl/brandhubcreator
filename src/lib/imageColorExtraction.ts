/**
 * Image Color Extraction using k-means clustering
 * Extracts dominant colors from uploaded images via canvas pixel sampling
 */

interface RGBColor {
  r: number;
  g: number;
  b: number;
}

interface ExtractedColor {
  hex: string;
  rgb: RGBColor;
  percentage: number;
  name: string;
}

const rgbToHex = (r: number, g: number, b: number): string =>
  `#${[r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')}`.toUpperCase();

const colorDistanceSq = (a: RGBColor, b: RGBColor): number =>
  (a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2;

/**
 * k-means clustering for color quantization
 */
function kMeans(pixels: RGBColor[], k: number, maxIter = 20): RGBColor[] {
  if (pixels.length === 0) return [];
  
  // Initialize centroids by picking evenly spaced pixels
  const step = Math.max(1, Math.floor(pixels.length / k));
  let centroids: RGBColor[] = Array.from({ length: k }, (_, i) => ({ ...pixels[Math.min(i * step, pixels.length - 1)] }));

  for (let iter = 0; iter < maxIter; iter++) {
    const clusters: RGBColor[][] = Array.from({ length: k }, () => []);

    // Assign pixels to nearest centroid
    for (const px of pixels) {
      let minDist = Infinity;
      let best = 0;
      for (let c = 0; c < k; c++) {
        const d = colorDistanceSq(px, centroids[c]);
        if (d < minDist) { minDist = d; best = c; }
      }
      clusters[best].push(px);
    }

    // Recalculate centroids
    let converged = true;
    for (let c = 0; c < k; c++) {
      if (clusters[c].length === 0) continue;
      const avg: RGBColor = {
        r: Math.round(clusters[c].reduce((s, p) => s + p.r, 0) / clusters[c].length),
        g: Math.round(clusters[c].reduce((s, p) => s + p.g, 0) / clusters[c].length),
        b: Math.round(clusters[c].reduce((s, p) => s + p.b, 0) / clusters[c].length),
      };
      if (colorDistanceSq(avg, centroids[c]) > 4) converged = false;
      centroids[c] = avg;
    }
    if (converged) break;
  }

  return centroids;
}

/**
 * Generate a descriptive color name from RGB values
 */
function generateColorName(r: number, g: number, b: number): string {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2 / 255;
  const s = max === min ? 0 : (max - min) / (l > 0.5 ? (510 - max - min) : (max + min));

  if (l < 0.08) return 'Black';
  if (l > 0.95) return 'White';
  if (s < 0.1) {
    if (l < 0.3) return 'Dark Gray';
    if (l < 0.6) return 'Gray';
    return 'Light Gray';
  }

  // Calculate hue
  let h = 0;
  const d = max - min;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
  else if (max === g) h = ((b - r) / d + 2) * 60;
  else h = ((r - g) / d + 4) * 60;

  const prefix = l < 0.3 ? 'Dark ' : l > 0.7 ? 'Light ' : '';
  
  if (h < 15 || h >= 345) return `${prefix}Red`;
  if (h < 45) return `${prefix}Orange`;
  if (h < 70) return `${prefix}Yellow`;
  if (h < 150) return `${prefix}Green`;
  if (h < 195) return `${prefix}Teal`;
  if (h < 255) return `${prefix}Blue`;
  if (h < 285) return `${prefix}Purple`;
  if (h < 345) return `${prefix}Pink`;
  return `${prefix}Red`;
}

/**
 * Extract dominant colors from an image file
 */
export async function extractColorsFromImage(
  file: File,
  numColors: number = 6
): Promise<ExtractedColor[]> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      // Sample at reduced resolution for performance
      const maxDim = 200;
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);

      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas not supported')); return; }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Collect pixel samples (skip every other pixel for speed)
      const pixels: RGBColor[] = [];
      for (let i = 0; i < data.length; i += 8) {
        const a = data[i + 3];
        if (a < 128) continue; // skip transparent
        pixels.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
      }

      if (pixels.length === 0) {
        resolve([]);
        return;
      }

      const centroids = kMeans(pixels, numColors);

      // Calculate percentage for each cluster
      const counts = new Array(centroids.length).fill(0);
      for (const px of pixels) {
        let minDist = Infinity;
        let best = 0;
        for (let c = 0; c < centroids.length; c++) {
          const d = colorDistanceSq(px, centroids[c]);
          if (d < minDist) { minDist = d; best = c; }
        }
        counts[best]++;
      }

      const total = pixels.length;
      const results: ExtractedColor[] = centroids
        .map((c, i) => ({
          hex: rgbToHex(c.r, c.g, c.b),
          rgb: c,
          percentage: Math.round((counts[i] / total) * 100),
          name: generateColorName(c.r, c.g, c.b),
        }))
        .filter(c => c.percentage > 0)
        .sort((a, b) => b.percentage - a.percentage);

      URL.revokeObjectURL(url);
      resolve(results);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Get image dimensions and basic metadata
 */
export async function getImageInfo(file: File): Promise<{
  width: number;
  height: number;
  aspectRatio: string;
  fileSize: string;
}> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
      const d = gcd(img.width, img.height);
      resolve({
        width: img.width,
        height: img.height,
        aspectRatio: `${img.width / d}:${img.height / d}`,
        fileSize: file.size < 1024 * 1024
          ? `${(file.size / 1024).toFixed(1)} KB`
          : `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load')); };
    img.src = url;
  });
}
