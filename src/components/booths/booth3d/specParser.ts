/**
 * Production spec parser for booth panels
 * 
 * Extracts exact panel dimensions from booth_production_specs content strings.
 * Content format examples:
 *   "Visual size: 69.5" × 87.375"\nCut size: 77.5" × 91.375"\nBleed size: 81.5" × 95.375""
 *   "SOLID COLOR ONLY\nCut size: 123" × 20"\nBleed size: 129" × 28""
 */

/** Parsed production panel dimensions in inches */
export interface ParsedPanelSpec {
  specTitle: string;
  specId: string;         // e.g. "DS-MDA7X8"
  configType: string;     // "RDT-108" or "RDT-110"
  panelType: 'back-wall' | 'center' | 'main' | 'side' | 'canopy-interior' | 'canopy-exterior' | 'unknown';
  visualWidth: number | null;   // inches
  visualHeight: number | null;
  cutWidth: number | null;
  cutHeight: number | null;
  bleedWidth: number | null;
  bleedHeight: number | null;
  solidColorOnly: boolean;
}

/** Convert inches to meters */
const IN_TO_M = 0.0254;

/** Parse a dimension string like '69.5" × 87.375"' → [69.5, 87.375] */
function parseDimPair(text: string): [number, number] | null {
  // Match patterns like: 69.5" × 87.375" or 69.5"×87.375" or 69.5 x 87.375
  const match = text.match(/([\d.]+)\s*[""]\s*[×x]\s*([\d.]+)\s*[""]/i);
  if (match) {
    return [parseFloat(match[1]), parseFloat(match[2])];
  }
  // Fallback: just numbers with x
  const fallback = text.match(/([\d.]+)\s*[×x]\s*([\d.]+)/i);
  if (fallback) {
    return [parseFloat(fallback[1]), parseFloat(fallback[2])];
  }
  return null;
}

/** Classify a panel spec title into a panel type */
function classifyPanel(title: string): ParsedPanelSpec['panelType'] {
  const lower = title.toLowerCase();
  if (lower.includes('interior canopy')) return 'canopy-interior';
  if (lower.includes('exterior canopy')) return 'canopy-exterior';
  if (lower.includes('back wall')) return 'back-wall';
  if (lower.includes('center panel')) return 'center';
  if (lower.includes('main panel')) return 'main';
  if (lower.includes('side panel')) return 'side';
  return 'unknown';
}

/** Extract RDT config type from title */
function extractConfigType(title: string): string {
  const match = title.match(/RDT-\d+/i);
  return match ? match[0].toUpperCase() : '';
}

/** Extract spec ID from title parentheses, e.g. "(DS-MDA7X8)" */
function extractSpecId(title: string): string {
  const match = title.match(/\(([^)]+)\)/);
  return match ? match[1] : '';
}

/** Parse a single production spec entry */
export function parseProductionSpec(title: string, content: string): ParsedPanelSpec {
  const spec: ParsedPanelSpec = {
    specTitle: title,
    specId: extractSpecId(title),
    configType: extractConfigType(title),
    panelType: classifyPanel(title),
    visualWidth: null,
    visualHeight: null,
    cutWidth: null,
    cutHeight: null,
    bleedWidth: null,
    bleedHeight: null,
    solidColorOnly: content.toUpperCase().includes('SOLID COLOR ONLY'),
  };

  const lines = content.split('\n');
  for (const line of lines) {
    const lower = line.toLowerCase().trim();
    if (lower.startsWith('visual size')) {
      const dims = parseDimPair(line);
      if (dims) { spec.visualWidth = dims[0]; spec.visualHeight = dims[1]; }
    } else if (lower.startsWith('cut size')) {
      const dims = parseDimPair(line);
      if (dims) { spec.cutWidth = dims[0]; spec.cutHeight = dims[1]; }
    } else if (lower.startsWith('bleed size')) {
      const dims = parseDimPair(line);
      if (dims) { spec.bleedWidth = dims[0]; spec.bleedHeight = dims[1]; }
    }
  }

  return spec;
}

/** Parsed specs grouped by config type (RDT-108 / RDT-110) */
export interface SpecLayout {
  configType: string;
  panels: ParsedPanelSpec[];
}

/** Parse all content-sizing specs and group by config type */
export function parseAllSpecs(specs: { title: string; content: string; category: string }[]): SpecLayout[] {
  const contentSpecs = specs.filter(s => s.category === 'content-sizing');
  const parsed = contentSpecs.map(s => parseProductionSpec(s.title, s.content));
  
  // Group by configType
  const groups: Record<string, ParsedPanelSpec[]> = {};
  for (const p of parsed) {
    const key = p.configType || 'unknown';
    if (!groups[key]) groups[key] = [];
    groups[key].push(p);
  }

  return Object.entries(groups).map(([configType, panels]) => ({ configType, panels }));
}

/** Production zone dimensions for a single panel (in meters) */
export interface PanelZones {
  /** Visual safe area (where all critical content must stay) */
  visualSize: [number, number] | null;
  /** Cut line (where fabric is trimmed) */
  cutSize: [number, number] | null;
  /** Bleed area (backgrounds must extend to this) */
  bleedSize: [number, number] | null;
  /** Whether this panel is solid color only */
  solidColorOnly: boolean;
  /** Original spec title */
  specTitle: string;
  /** Original spec ID */
  specId: string;
}

/** Convert a ParsedPanelSpec to meter-based PanelZones */
export function specToZones(spec: ParsedPanelSpec): PanelZones {
  return {
    visualSize: spec.visualWidth && spec.visualHeight 
      ? [spec.visualWidth * IN_TO_M, spec.visualHeight * IN_TO_M] 
      : null,
    cutSize: spec.cutWidth && spec.cutHeight 
      ? [spec.cutWidth * IN_TO_M, spec.cutHeight * IN_TO_M] 
      : null,
    bleedSize: spec.bleedWidth && spec.bleedHeight 
      ? [spec.bleedWidth * IN_TO_M, spec.bleedHeight * IN_TO_M] 
      : null,
    solidColorOnly: spec.solidColorOnly,
    specTitle: spec.specTitle,
    specId: spec.specId,
  };
}

// ─── Monitor Spec Parsing ──────────────────────────

/** Parsed monitor configuration from production specs */
export interface MonitorSpec {
  configType: string;
  monitorSize: number; // inches (e.g. 32)
  count: number;
  adjustable: boolean;
  notes: string;
}

/** Parse monitor specs from the 'general' category with title 'Monitor Specifications' */
export function parseMonitorSpecs(
  specs: { title: string; content: string; category: string }[]
): MonitorSpec[] {
  const monitorSpecs = specs.filter(
    s => s.category === 'general' && s.title.toLowerCase().includes('monitor')
  );
  if (monitorSpecs.length === 0) return [];

  const results: MonitorSpec[] = [];
  for (const spec of monitorSpecs) {
    const lines = spec.content.split('\n');
    for (const line of lines) {
      // Match: "RDT-108: 32" Monitor with adjustable placement"
      // or "RDT-110: Dual 32" Monitors with adjustable placement"
      const match = line.match(/(RDT-\d+):\s*(Dual\s+)?(\d+)[""]\s*Monitor/i);
      if (match) {
        const configType = match[1].toUpperCase();
        const isDual = !!match[2];
        const size = parseInt(match[3], 10);
        results.push({
          configType,
          monitorSize: size,
          count: isDual ? 2 : 1,
          adjustable: line.toLowerCase().includes('adjustable'),
          notes: line.trim(),
        });
      }
    }
  }
  return results;
}

/**
 * Generate 3D panel configs from parsed production specs for a specific RDT config.
 * Returns panel positions, rotations, and sizes based on the actual bleed dimensions
 * (the outer physical size), with zone data for safe zone overlays.
 */
export function generatePanelsFromSpecs(
  specs: ParsedPanelSpec[],
  configType: string
): {
  panels: Array<{
    id: string;
    label: string;
    specLabel: string;
    position: [number, number, number];
    rotation: [number, number, number];
    size: [number, number]; // bleed size in meters (outer panel)
    zones: PanelZones;
  }>;
  dimensions: string;
  footprint: string;
} {
  const configSpecs = specs.filter(s => s.configType === configType && !s.solidColorOnly);
  const canopySpecs = specs.filter(s => s.configType === configType && s.solidColorOnly);

  if (configSpecs.length === 0) {
    return { panels: [], dimensions: configType, footprint: '' };
  }

  const result: Array<{
    id: string;
    label: string;
    specLabel: string;
    position: [number, number, number];
    rotation: [number, number, number];
    size: [number, number];
    zones: PanelZones;
  }> = [];

  if (configType === 'RDT-108') {
    // RDT-108: Back wall + center panel (inline configuration)
    const backSpec = configSpecs.find(s => s.panelType === 'back-wall');
    const centerSpec = configSpecs.find(s => s.panelType === 'center');

    if (backSpec) {
      const w = (backSpec.bleedWidth || backSpec.cutWidth || 81.5) * IN_TO_M;
      const h = (backSpec.bleedHeight || backSpec.cutHeight || 95.375) * IN_TO_M;
      result.push({
        id: 'back',
        label: 'Back Wall',
        specLabel: backSpec.specTitle.replace(/RDT-108\s*/i, ''),
        position: [0, h / 2, 0],
        rotation: [0, 0, 0],
        size: [w, h],
        zones: specToZones(backSpec),
      });
    }

    if (centerSpec) {
      const w = (centerSpec.bleedWidth || centerSpec.cutWidth || 39.75) * IN_TO_M;
      const h = (centerSpec.bleedHeight || centerSpec.cutHeight || 90.25) * IN_TO_M;
      result.push({
        id: 'center',
        label: 'Center Panel',
        specLabel: centerSpec.specTitle.replace(/RDT-108\s*/i, ''),
        position: [0, h / 2, w / 2 + 0.1],
        rotation: [0, 0, 0],
        size: [w, h],
        zones: specToZones(centerSpec),
      });
    }

    // Add canopy panels (horizontal strips above)
    for (const canopy of canopySpecs) {
      const w = (canopy.bleedWidth || canopy.cutWidth || 129) * IN_TO_M;
      const h = (canopy.bleedHeight || canopy.cutHeight || 28) * IN_TO_M;
      const isInterior = canopy.panelType === 'canopy-interior';
      const backH = backSpec 
        ? (backSpec.bleedHeight || backSpec.cutHeight || 95.375) * IN_TO_M 
        : 2.4;
      result.push({
        id: isInterior ? 'canopy-int' : 'canopy-ext',
        label: isInterior ? 'Interior Canopy' : 'Exterior Canopy',
        specLabel: canopy.specTitle.replace(/RDT-108\s*/i, ''),
        position: [0, backH + h / 2 + 0.02, isInterior ? -0.02 : 0.02],
        rotation: [0, 0, 0],
        size: [w, h],
        zones: specToZones(canopy),
      });
    }

    const totalW = backSpec ? (backSpec.bleedWidth || 81.5) : 81.5;
    return {
      panels: result,
      dimensions: `RDT-108 (${(totalW / 12).toFixed(0)}' wide)`,
      footprint: `${(totalW / 12).toFixed(0)}' × 10' floor`,
    };
  }

  if (configType === 'RDT-110') {
    // RDT-110: Main panel + two side panels (U-shape / peninsula)
    const mainSpec = configSpecs.find(s => s.panelType === 'main');
    const sideSpec = configSpecs.find(s => s.panelType === 'side');

    if (mainSpec) {
      const w = (mainSpec.bleedWidth || mainSpec.cutWidth || 84.75) * IN_TO_M;
      const h = (mainSpec.bleedHeight || mainSpec.cutHeight || 90.25) * IN_TO_M;
      result.push({
        id: 'back',
        label: 'Main Panel',
        specLabel: mainSpec.specTitle.replace(/RDT-110\s*/i, ''),
        position: [0, h / 2, 0],
        rotation: [0, 0, 0],
        size: [w, h],
        zones: specToZones(mainSpec),
      });
    }

    if (sideSpec) {
      const sw = (sideSpec.bleedWidth || sideSpec.cutWidth || 40.25) * IN_TO_M;
      const sh = (sideSpec.bleedHeight || sideSpec.cutHeight || 95.3125) * IN_TO_M;
      const mainW = mainSpec 
        ? (mainSpec.bleedWidth || mainSpec.cutWidth || 84.75) * IN_TO_M 
        : 2.15;

      // Left side
      result.push({
        id: 'left',
        label: 'Left Side Panel',
        specLabel: sideSpec.specTitle.replace(/RDT-110\s*/i, ''),
        position: [-mainW / 2, sh / 2, sw / 2],
        rotation: [0, Math.PI / 2, 0],
        size: [sw, sh],
        zones: specToZones(sideSpec),
      });

      // Right side
      result.push({
        id: 'right',
        label: 'Right Side Panel',
        specLabel: sideSpec.specTitle.replace(/RDT-110\s*/i, ''),
        position: [mainW / 2, sh / 2, sw / 2],
        rotation: [0, -Math.PI / 2, 0],
        size: [sw, sh],
        zones: specToZones(sideSpec),
      });
    }

    // Add canopy panels
    for (const canopy of canopySpecs) {
      const w = (canopy.bleedWidth || canopy.cutWidth || 172) * IN_TO_M;
      const h = (canopy.bleedHeight || canopy.cutHeight || 30) * IN_TO_M;
      const isInterior = canopy.panelType === 'canopy-interior';
      const mainH = mainSpec 
        ? (mainSpec.bleedHeight || mainSpec.cutHeight || 90.25) * IN_TO_M 
        : 2.3;
      result.push({
        id: isInterior ? 'canopy-int' : 'canopy-ext',
        label: isInterior ? 'Interior Canopy' : 'Exterior Canopy',
        specLabel: canopy.specTitle.replace(/RDT-110\s*/i, ''),
        position: [0, mainH + h / 2 + 0.02, isInterior ? -0.02 : 0.02],
        rotation: [0, 0, 0],
        size: [w, h],
        zones: specToZones(canopy),
      });
    }

    const totalW = mainSpec ? (mainSpec.bleedWidth || 84.75) : 84.75;
    return {
      panels: result,
      dimensions: `RDT-110 (${(totalW / 12).toFixed(0)}' wide)`,
      footprint: `${Math.ceil(totalW / 12)}' × 14' floor`,
    };
  }

  // Generic fallback: create panels in a line
  let xOffset = 0;
  for (const spec of configSpecs) {
    const w = (spec.bleedWidth || spec.cutWidth || 80) * IN_TO_M;
    const h = (spec.bleedHeight || spec.cutHeight || 90) * IN_TO_M;
    result.push({
      id: `panel-${result.length}`,
      label: spec.specTitle,
      specLabel: spec.specId || spec.specTitle,
      position: [xOffset, h / 2, 0],
      rotation: [0, 0, 0],
      size: [w, h],
      zones: specToZones(spec),
    });
    xOffset += w + 0.1;
  }

  // Center all panels
  const totalWidth = xOffset - 0.1;
  for (const p of result) {
    p.position[0] -= totalWidth / 2;
  }

  return {
    panels: result,
    dimensions: configType || 'Custom',
    footprint: `${(totalWidth / IN_TO_M / 12).toFixed(0)}' wide`,
  };
}
