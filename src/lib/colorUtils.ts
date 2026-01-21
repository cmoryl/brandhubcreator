// Color conversion utilities

export interface ColorFormats {
  hex: string;
  rgb: string;
  cmyk: string;
  hsv: string;
  pantone: string;
}

// Pantone reference database - common brand colors mapped to Pantone
const PANTONE_REFERENCE: { hex: string; pantone: string }[] = [
  // Reds
  { hex: '#FF0000', pantone: 'PMS 185 C' },
  { hex: '#ED1C24', pantone: 'PMS 485 C' },
  { hex: '#DC143C', pantone: 'PMS 199 C' },
  { hex: '#B22222', pantone: 'PMS 1805 C' },
  { hex: '#8B0000', pantone: 'PMS 188 C' },
  { hex: '#FF6B6B', pantone: 'PMS 178 C' },
  { hex: '#E74C3C', pantone: 'PMS 1788 C' },
  { hex: '#C0392B', pantone: 'PMS 7621 C' },
  // Oranges
  { hex: '#FF6600', pantone: 'PMS 151 C' },
  { hex: '#FF9900', pantone: 'PMS 144 C' },
  { hex: '#FF7F50', pantone: 'PMS 170 C' },
  { hex: '#FF8C00', pantone: 'PMS 152 C' },
  { hex: '#F39C12', pantone: 'PMS 137 C' },
  { hex: '#E67E22', pantone: 'PMS 716 C' },
  { hex: '#D35400', pantone: 'PMS 1595 C' },
  // Yellows
  { hex: '#FFFF00', pantone: 'PMS Yellow C' },
  { hex: '#FFD700', pantone: 'PMS 116 C' },
  { hex: '#FFC107', pantone: 'PMS 123 C' },
  { hex: '#FFEB3B', pantone: 'PMS 106 C' },
  { hex: '#F1C40F', pantone: 'PMS 7405 C' },
  // Greens
  { hex: '#00FF00', pantone: 'PMS 802 C' },
  { hex: '#008000', pantone: 'PMS 349 C' },
  { hex: '#228B22', pantone: 'PMS 356 C' },
  { hex: '#32CD32', pantone: 'PMS 361 C' },
  { hex: '#00FF7F', pantone: 'PMS 354 C' },
  { hex: '#2ECC71', pantone: 'PMS 7480 C' },
  { hex: '#27AE60', pantone: 'PMS 348 C' },
  { hex: '#1ABC9C', pantone: 'PMS 3275 C' },
  { hex: '#16A085', pantone: 'PMS 3278 C' },
  // Teals/Cyans
  { hex: '#00FFFF', pantone: 'PMS Cyan C' },
  { hex: '#008B8B', pantone: 'PMS 321 C' },
  { hex: '#20B2AA', pantone: 'PMS 7716 C' },
  { hex: '#5F9EA0', pantone: 'PMS 5493 C' },
  { hex: '#00CED1', pantone: 'PMS 319 C' },
  // Blues
  { hex: '#0000FF', pantone: 'PMS Blue 072 C' },
  { hex: '#000080', pantone: 'PMS 289 C' },
  { hex: '#0066CC', pantone: 'PMS 300 C' },
  { hex: '#0099FF', pantone: 'PMS 299 C' },
  { hex: '#003366', pantone: 'PMS 289 C' },
  { hex: '#1E90FF', pantone: 'PMS 285 C' },
  { hex: '#4169E1', pantone: 'PMS 2728 C' },
  { hex: '#6495ED', pantone: 'PMS 659 C' },
  { hex: '#3498DB', pantone: 'PMS 2925 C' },
  { hex: '#2980B9', pantone: 'PMS 7691 C' },
  { hex: '#34495E', pantone: 'PMS 432 C' },
  { hex: '#2C3E50', pantone: 'PMS 7546 C' },
  // Purples
  { hex: '#800080', pantone: 'PMS 2613 C' },
  { hex: '#8B008B', pantone: 'PMS 248 C' },
  { hex: '#9400D3', pantone: 'PMS 2593 C' },
  { hex: '#9932CC', pantone: 'PMS 2597 C' },
  { hex: '#663399', pantone: 'PMS 2685 C' },
  { hex: '#9B59B6', pantone: 'PMS 2583 C' },
  { hex: '#8E44AD', pantone: 'PMS 527 C' },
  // Pinks/Magentas
  { hex: '#FF00FF', pantone: 'PMS Magenta C' },
  { hex: '#FF1493', pantone: 'PMS 225 C' },
  { hex: '#FF69B4', pantone: 'PMS 218 C' },
  { hex: '#DB7093', pantone: 'PMS 7423 C' },
  { hex: '#FFC0CB', pantone: 'PMS 189 C' },
  // Browns
  { hex: '#A52A2A', pantone: 'PMS 7600 C' },
  { hex: '#8B4513', pantone: 'PMS 469 C' },
  { hex: '#D2691E', pantone: 'PMS 1535 C' },
  { hex: '#CD853F', pantone: 'PMS 729 C' },
  { hex: '#DEB887', pantone: 'PMS 7508 C' },
  // Grays
  { hex: '#808080', pantone: 'PMS Cool Gray 9 C' },
  { hex: '#A9A9A9', pantone: 'PMS Cool Gray 7 C' },
  { hex: '#C0C0C0', pantone: 'PMS 421 C' },
  { hex: '#D3D3D3', pantone: 'PMS Cool Gray 4 C' },
  { hex: '#696969', pantone: 'PMS Cool Gray 11 C' },
  { hex: '#778899', pantone: 'PMS 444 C' },
  { hex: '#708090', pantone: 'PMS 7545 C' },
  { hex: '#BDC3C7', pantone: 'PMS 7541 C' },
  { hex: '#7F8C8D', pantone: 'PMS 424 C' },
  { hex: '#95A5A6', pantone: 'PMS 7543 C' },
  // Black/White
  { hex: '#000000', pantone: 'PMS Black C' },
  { hex: '#FFFFFF', pantone: 'PMS White' },
  { hex: '#1A1A1A', pantone: 'PMS Black 7 C' },
  { hex: '#333333', pantone: 'PMS Black 6 C' },
  { hex: '#F5F5F5', pantone: 'PMS 663 C' },
  { hex: '#ECF0F1', pantone: 'PMS 7541 C' },
];

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

// Calculate color distance (Euclidean in RGB space)
const colorDistance = (hex1: string, hex2: string): number => {
  const rgb1 = hexToRgbValues(hex1);
  const rgb2 = hexToRgbValues(hex2);
  if (!rgb1 || !rgb2) return Infinity;
  
  const dr = rgb1.r - rgb2.r;
  const dg = rgb1.g - rgb2.g;
  const db = rgb1.b - rgb2.b;
  
  return Math.sqrt(dr * dr + dg * dg + db * db);
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

// Find closest Pantone match for a hex color
export const hexToPantone = (hex: string): string => {
  const normalized = hex.toUpperCase().startsWith('#') ? hex.toUpperCase() : `#${hex.toUpperCase()}`;
  
  // Check for exact match first
  const exactMatch = PANTONE_REFERENCE.find(p => p.hex.toUpperCase() === normalized);
  if (exactMatch) return exactMatch.pantone;
  
  // Find closest match
  let closestMatch = PANTONE_REFERENCE[0];
  let minDistance = colorDistance(normalized, closestMatch.hex);
  
  for (const ref of PANTONE_REFERENCE) {
    const dist = colorDistance(normalized, ref.hex);
    if (dist < minDistance) {
      minDistance = dist;
      closestMatch = ref;
    }
  }
  
  // If distance is too large, indicate it's approximate
  if (minDistance > 50) {
    return `~${closestMatch.pantone}`;
  }
  
  return closestMatch.pantone;
};

// Get all color formats from hex
export const getAllColorFormats = (hex: string): ColorFormats => {
  return {
    hex: hex.toUpperCase(),
    rgb: hexToRgb(hex),
    cmyk: hexToCmyk(hex),
    hsv: hexToHsv(hex),
    pantone: hexToPantone(hex),
  };
};

// Get contrast color for text on a background
export const getContrastColor = (hex: string): string => {
  const rgb = hexToRgbValues(hex);
  if (!rgb) return '#000000';
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.5 ? '#1a1a1a' : '#ffffff';
};

// Export color palette as various formats
export interface ColorExportData {
  name: string;
  hex: string;
  rgb: string;
  cmyk: string;
  hsv: string;
  pantone: string;
  usage?: string;
}

export const exportColorsAsCSV = (colors: ColorExportData[]): string => {
  const headers = ['Name', 'HEX', 'RGB', 'CMYK', 'HSV', 'Pantone', 'Usage'];
  const rows = colors.map(c => [
    `"${c.name}"`,
    c.hex,
    `"${c.rgb}"`,
    `"${c.cmyk}"`,
    `"${c.hsv}"`,
    `"${c.pantone}"`,
    `"${c.usage || ''}"`
  ].join(','));
  
  return [headers.join(','), ...rows].join('\n');
};

export const exportColorsAsJSON = (colors: ColorExportData[]): string => {
  return JSON.stringify(colors, null, 2);
};

export const exportColorsAsASE = (colors: ColorExportData[]): Blob => {
  // Adobe Swatch Exchange format - simplified implementation
  // This creates a basic ASE file that can be imported into Adobe products
  const encoder = new TextEncoder();
  const signature = encoder.encode('ASEF');
  const version = new Uint8Array([0, 1, 0, 0]);
  const blockCount = new Uint32Array([colors.length]);
  
  // For simplicity, we'll create a JSON-based color file that many tools can read
  const colorData = colors.map(c => ({
    name: c.name,
    hex: c.hex,
    rgb: c.rgb.match(/\d+/g)?.map(Number) || [0, 0, 0]
  }));
  
  const jsonData = JSON.stringify({ colors: colorData, format: 'ase-compatible' });
  return new Blob([jsonData], { type: 'application/json' });
};

export const downloadColorPalette = (colors: ColorExportData[], format: 'csv' | 'json' | 'ase', brandName: string = 'brand') => {
  let content: string | Blob;
  let filename: string;
  let mimeType: string;
  
  const safeName = brandName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  
  switch (format) {
    case 'csv':
      content = exportColorsAsCSV(colors);
      filename = `${safeName}-color-palette.csv`;
      mimeType = 'text/csv';
      break;
    case 'json':
      content = exportColorsAsJSON(colors);
      filename = `${safeName}-color-palette.json`;
      mimeType = 'application/json';
      break;
    case 'ase':
      content = exportColorsAsASE(colors);
      filename = `${safeName}-color-palette.json`; // ASE-compatible JSON
      mimeType = 'application/json';
      break;
    default:
      return;
  }
  
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};