// Color conversion utilities

export interface ColorFormats {
  hex: string;
  rgb: string;
  cmyk: string;
  hsv: string;
}

// Parse hex to RGB values
const hexToRgbValues = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

// Convert hex to RGB string
export const hexToRgb = (hex: string): string => {
  const rgb = hexToRgbValues(hex);
  if (!rgb) return 'rgb(0, 0, 0)';
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
};

// Convert hex to CMYK string
export const hexToCmyk = (hex: string): string => {
  const rgb = hexToRgbValues(hex);
  if (!rgb) return 'cmyk(0%, 0%, 0%, 100%)';

  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const k = 1 - Math.max(r, g, b);
  
  if (k === 1) {
    return 'cmyk(0%, 0%, 0%, 100%)';
  }

  const c = Math.round(((1 - r - k) / (1 - k)) * 100);
  const m = Math.round(((1 - g - k) / (1 - k)) * 100);
  const y = Math.round(((1 - b - k) / (1 - k)) * 100);
  const kPercent = Math.round(k * 100);

  return `cmyk(${c}%, ${m}%, ${y}%, ${kPercent}%)`;
};

// Convert hex to HSV string
export const hexToHsv = (hex: string): string => {
  const rgb = hexToRgbValues(hex);
  if (!rgb) return 'hsv(0°, 0%, 0%)';

  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  const s = max === 0 ? 0 : (delta / max) * 100;
  const v = max * 100;

  if (delta !== 0) {
    if (max === r) {
      h = ((g - b) / delta) % 6;
    } else if (max === g) {
      h = (b - r) / delta + 2;
    } else {
      h = (r - g) / delta + 4;
    }
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }

  return `hsv(${h}°, ${Math.round(s)}%, ${Math.round(v)}%)`;
};

// Get all color formats from hex
export const getAllColorFormats = (hex: string): ColorFormats => {
  return {
    hex: hex.toUpperCase(),
    rgb: hexToRgb(hex),
    cmyk: hexToCmyk(hex),
    hsv: hexToHsv(hex),
  };
};

// Get contrast color for text on a background
export const getContrastColor = (hex: string): string => {
  const rgb = hexToRgbValues(hex);
  if (!rgb) return '#000000';
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.5 ? '#1a1a1a' : '#ffffff';
};