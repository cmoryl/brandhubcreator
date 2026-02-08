/**
 * Gradient Parser Utility
 * Converts CSS gradient strings to/from editable components
 */

export interface ColorStop {
  color: string;
  position: number; // 0-100
}

export interface ParsedGradient {
  type: 'linear' | 'radial';
  angle: number; // degrees (for linear)
  colorStops: ColorStop[];
}

/**
 * Parse a CSS linear-gradient string into its components
 * Supports: linear-gradient(135deg, #667eea 0%, #764ba2 100%)
 */
export const parseGradient = (css: string): ParsedGradient | null => {
  if (!css || typeof css !== 'string') return null;
  
  const trimmed = css.trim();
  
  // Check for linear-gradient
  const linearMatch = trimmed.match(/^linear-gradient\s*\(\s*(.+)\s*\)$/i);
  if (!linearMatch) return null;
  
  const content = linearMatch[1];
  
  // Split by comma, but be careful of colors with commas (like rgba)
  const parts = splitGradientParts(content);
  if (parts.length < 2) return null;
  
  let angle = 180; // default: to bottom
  let colorStartIndex = 0;
  
  // Check if first part is an angle
  const firstPart = parts[0].trim();
  const angleMatch = firstPart.match(/^(-?\d+(?:\.\d+)?)\s*deg$/i);
  if (angleMatch) {
    angle = parseFloat(angleMatch[1]);
    colorStartIndex = 1;
  } else if (firstPart.startsWith('to ')) {
    // Handle direction keywords
    angle = directionToAngle(firstPart);
    colorStartIndex = 1;
  }
  
  // Parse color stops
  const colorStops: ColorStop[] = [];
  for (let i = colorStartIndex; i < parts.length; i++) {
    const stop = parseColorStop(parts[i].trim());
    if (stop) {
      colorStops.push(stop);
    }
  }
  
  // If no positions were specified, distribute evenly
  if (colorStops.length > 0 && colorStops.every(s => s.position === -1)) {
    colorStops.forEach((stop, index) => {
      stop.position = Math.round((index / (colorStops.length - 1)) * 100);
    });
  }
  
  // Fill in missing positions
  let lastPosition = 0;
  for (let i = 0; i < colorStops.length; i++) {
    if (colorStops[i].position === -1) {
      // Find next defined position
      let nextDefined = 100;
      for (let j = i + 1; j < colorStops.length; j++) {
        if (colorStops[j].position !== -1) {
          nextDefined = colorStops[j].position;
          break;
        }
      }
      colorStops[i].position = Math.round(lastPosition + (nextDefined - lastPosition) / 2);
    }
    lastPosition = colorStops[i].position;
  }
  
  return {
    type: 'linear',
    angle,
    colorStops
  };
};

/**
 * Convert direction keyword to angle
 */
const directionToAngle = (direction: string): number => {
  const map: Record<string, number> = {
    'to top': 0,
    'to top right': 45,
    'to right': 90,
    'to bottom right': 135,
    'to bottom': 180,
    'to bottom left': 225,
    'to left': 270,
    'to top left': 315,
  };
  return map[direction.toLowerCase()] ?? 180;
};

/**
 * Split gradient content by commas, respecting parentheses
 */
const splitGradientParts = (content: string): string[] => {
  const parts: string[] = [];
  let current = '';
  let depth = 0;
  
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (char === '(') depth++;
    else if (char === ')') depth--;
    else if (char === ',' && depth === 0) {
      parts.push(current.trim());
      current = '';
      continue;
    }
    current += char;
  }
  if (current.trim()) parts.push(current.trim());
  
  return parts;
};

/**
 * Parse a single color stop like "#667eea 0%" or "rgba(0,0,0,0.5) 50%"
 */
const parseColorStop = (part: string): ColorStop | null => {
  // Match color and optional position
  // Color can be: hex, rgb(), rgba(), hsl(), hsla(), or named color
  const colorPatterns = [
    /#[0-9a-fA-F]{3,8}/, // hex
    /rgba?\s*\([^)]+\)/, // rgb/rgba
    /hsla?\s*\([^)]+\)/, // hsl/hsla
    /[a-zA-Z]+/, // named colors
  ];
  
  let color = '';
  let remaining = part;
  
  for (const pattern of colorPatterns) {
    const match = part.match(pattern);
    if (match && match.index === 0) {
      color = match[0];
      remaining = part.slice(color.length).trim();
      break;
    }
  }
  
  if (!color) return null;
  
  // Parse position
  let position = -1; // -1 means unspecified
  const posMatch = remaining.match(/(\d+(?:\.\d+)?)\s*%/);
  if (posMatch) {
    position = parseFloat(posMatch[1]);
  }
  
  return { color, position };
};

/**
 * Convert parsed gradient back to CSS string
 */
export const gradientToCSS = (parsed: ParsedGradient): string => {
  if (parsed.type !== 'linear') {
    // Only linear supported for now
    return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  }
  
  const stops = parsed.colorStops
    .map(stop => `${stop.color} ${stop.position}%`)
    .join(', ');
  
  return `linear-gradient(${parsed.angle}deg, ${stops})`;
};

/**
 * Validate if a string is a valid hex color
 */
export const isValidHex = (color: string): boolean => {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(color);
};

/**
 * Ensure a color string is a valid hex, or convert common formats
 */
export const normalizeColor = (color: string): string => {
  const trimmed = color.trim();
  
  // Already valid hex
  if (isValidHex(trimmed)) return trimmed;
  
  // Add # if missing
  if (/^[0-9a-fA-F]{3,8}$/.test(trimmed)) {
    return `#${trimmed}`;
  }
  
  return trimmed;
};
