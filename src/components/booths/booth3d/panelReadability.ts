/**
 * panelReadability — calculates whether text on a trade show panel
 * is readable at typical viewing distances.
 *
 * Industry standard: 1 inch of letter height ≈ 10 feet of readability.
 * Minimum comfortable reading: ~25pt at 8ft for body text.
 */

const FT = 0.3048; // 1 foot in meters
const IN = 0.0254; // 1 inch in meters

/** Viewing distances in feet for trade show analysis */
export const VIEWING_DISTANCES = [
  { label: '6 ft (close)', feet: 6 },
  { label: '12 ft (aisle)', feet: 12 },
  { label: '20 ft (across aisle)', feet: 20 },
  { label: '40 ft (far)', feet: 40 },
] as const;

export interface ReadabilityResult {
  distance: string;
  feet: number;
  readable: boolean;
  minFontPt: number;
  severity: 'ok' | 'warning' | 'error';
  message: string;
}

/**
 * Check if a given font size (in points, at panel scale) is readable
 * at standard trade show distances.
 *
 * @param fontSizePt — Font size in points on the physical panel
 * @param panelHeightFt — Physical panel height in feet
 * @param panelHeightPx — Canvas height in pixels (for scaling)
 */
export function checkReadability(
  fontSizePt: number,
  panelHeightFt: number,
  panelHeightPx: number,
): ReadabilityResult[] {
  // Convert font pt to physical inches on the panel
  // Panel canvas maps panelHeightPx → panelHeightFt
  // fontSizePt is in canvas-points (1pt = 1.333px at 96dpi)
  const fontPxOnCanvas = fontSizePt * 1.333;
  const physicalInches = (fontPxOnCanvas / panelHeightPx) * (panelHeightFt * 12);

  return VIEWING_DISTANCES.map(({ label, feet }) => {
    // Rule of thumb: 1 inch of cap height readable at ~10ft
    const minInchesNeeded = feet / 10;
    const minFontPt = Math.ceil((minInchesNeeded / (panelHeightFt * 12)) * panelHeightPx / 1.333);
    const readable = physicalInches >= minInchesNeeded;

    let severity: 'ok' | 'warning' | 'error' = 'ok';
    let message = `Readable at ${label}`;

    if (!readable) {
      const ratio = physicalInches / minInchesNeeded;
      if (ratio < 0.5) {
        severity = 'error';
        message = `Too small for ${label} — need ${minFontPt}pt minimum`;
      } else {
        severity = 'warning';
        message = `Marginal at ${label} — recommend ${minFontPt}pt+`;
      }
    }

    return { distance: label, feet, readable, minFontPt, severity, message };
  });
}

/**
 * Get recommended minimum font sizes for a panel
 */
export function getRecommendedSizes(panelHeightFt: number, panelHeightPx: number) {
  return {
    headline: Math.ceil(((panelHeightFt * 12 * 0.2) / (panelHeightFt * 12)) * panelHeightPx / 1.333), // ~20% readable at 20ft
    subhead: Math.ceil(((panelHeightFt * 12 * 0.1) / (panelHeightFt * 12)) * panelHeightPx / 1.333),  // ~10% readable at 10ft
    body: Math.ceil(((panelHeightFt * 12 * 0.05) / (panelHeightFt * 12)) * panelHeightPx / 1.333),    // ~5% readable at 6ft
  };
}
