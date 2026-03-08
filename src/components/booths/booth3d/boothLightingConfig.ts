/**
 * Booth Lighting & Print Material Configuration
 * 
 * Defines configurable overhead lighting rig (spots, par cans, ambient)
 * and panel print material types that affect PBR rendering.
 */

// ═══════════════════════════════════════
// BOOTH LIGHTING
// ═══════════════════════════════════════

export type ColorTemperature = 'warm' | 'neutral' | 'cool' | 'daylight';
export type ParCanColor = 'none' | 'brand' | 'red' | 'blue' | 'green' | 'amber' | 'magenta' | 'cyan' | 'white';

export interface BoothSpotlight {
  /** Position offset from booth center [x, y, z] in meters */
  position: [number, number, number];
  /** Cone angle (radians, 0.2–1.0) */
  angle: number;
  /** Intensity (0–3) */
  intensity: number;
  /** Color temperature */
  temperature: ColorTemperature;
  /** Whether it casts shadows */
  castShadow: boolean;
}

export interface BoothLightingConfig {
  /** Overall hall ambient brightness (0–1) */
  hallAmbient: number;
  /** Hall ambient color temperature */
  hallTemperature: ColorTemperature;
  /** Overhead booth spotlights */
  boothSpots: BoothSpotlight[];
  /** Par can color wash */
  parCanColor: ParCanColor;
  /** Par can wash intensity (0–1) */
  parCanIntensity: number;
  /** Edge-lit / backlit panel glow intensity (0–1) */
  edgeLightIntensity: number;
  /** Edge light color (hex) */
  edgeLightColor: string;
  /** Enable edge lighting on panels */
  edgeLightEnabled: boolean;
}

/** Color temperature to RGB hex */
export function temperatureToColor(temp: ColorTemperature): string {
  switch (temp) {
    case 'warm': return '#fef3c7';      // ~3000K yellowish
    case 'neutral': return '#f5f5f4';   // ~4000K slightly warm white
    case 'cool': return '#dbeafe';      // ~5000K blue-white
    case 'daylight': return '#e0f2fe';  // ~6500K daylight blue
  }
}

/** Par can color to hex */
export function parCanToColor(color: ParCanColor, brandColor?: string): string {
  switch (color) {
    case 'none': return '#000000';
    case 'brand': return brandColor || '#3b82f6';
    case 'red': return '#ef4444';
    case 'blue': return '#3b82f6';
    case 'green': return '#22c55e';
    case 'amber': return '#f59e0b';
    case 'magenta': return '#ec4899';
    case 'cyan': return '#06b6d4';
    case 'white': return '#f8fafc';
  }
}

export const PAR_CAN_OPTIONS: { value: ParCanColor; label: string }[] = [
  { value: 'none', label: 'Off' },
  { value: 'brand', label: 'Brand Color' },
  { value: 'white', label: 'White Wash' },
  { value: 'warm', label: 'Warm Amber' } as any, // We'll handle this
  { value: 'amber', label: 'Amber' },
  { value: 'red', label: 'Red' },
  { value: 'blue', label: 'Blue' },
  { value: 'green', label: 'Green' },
  { value: 'magenta', label: 'Magenta' },
  { value: 'cyan', label: 'Cyan' },
];

export const TEMPERATURE_OPTIONS: { value: ColorTemperature; label: string; kelvin: string }[] = [
  { value: 'warm', label: 'Warm', kelvin: '3000K' },
  { value: 'neutral', label: 'Neutral', kelvin: '4000K' },
  { value: 'cool', label: 'Cool', kelvin: '5000K' },
  { value: 'daylight', label: 'Daylight', kelvin: '6500K' },
];

/** Default booth lighting config */
export function getDefaultBoothLighting(): BoothLightingConfig {
  return {
    hallAmbient: 0.5,
    hallTemperature: 'neutral',
    boothSpots: [
      { position: [0, 6.5, 0], angle: 0.5, intensity: 1.2, temperature: 'warm', castShadow: true },
      { position: [-1.5, 6.5, -0.5], angle: 0.4, intensity: 0.8, temperature: 'neutral', castShadow: false },
      { position: [1.5, 6.5, 0.5], angle: 0.4, intensity: 0.8, temperature: 'neutral', castShadow: false },
    ],
    parCanColor: 'none',
    parCanIntensity: 0.4,
    edgeLightIntensity: 0,
    edgeLightColor: '#ffffff',
    edgeLightEnabled: false,
  };
}

// ═══════════════════════════════════════
// PANEL PRINT MATERIALS
// ═══════════════════════════════════════

export type PrintStyle =
  | 'fabric-matte'        // Standard dye-sub fabric — high roughness, diffuse
  | 'fabric-satin'        // Satin fabric — medium roughness
  | 'vinyl-matte'         // Matte vinyl — smooth but non-reflective
  | 'vinyl-gloss'         // Gloss vinyl — reflective, low roughness
  | 'vinyl-satin'         // Satin laminate vinyl — between matte & gloss
  | 'seg-fabric'          // Silicone Edge Graphics — backlit-capable stretch fabric
  | 'seg-backlit'         // SEG with backlight illumination active
  | 'backlit-film'        // Backlit duratrans/film — translucent with glow
  | 'substrate-foam'      // Direct print on foamboard — completely matte, rigid
  | 'substrate-sintra'    // Direct print on Sintra PVC — slightly glossy
  | 'substrate-acrylic'   // Direct print on acrylic — glossy, premium
  | 'substrate-aluminum';  // Dye-sub on aluminum — metallic sheen

export interface PrintMaterialConfig {
  /** PBR roughness (0 = mirror, 1 = fully diffuse) */
  roughness: number;
  /** PBR metalness */
  metalness: number;
  /** Environment map influence */
  envMapIntensity: number;
  /** Whether the material emits light (backlit) */
  emissive: boolean;
  /** Emissive intensity when backlit */
  emissiveIntensity: number;
  /** Bump scale for surface texture */
  bumpScale: number;
  /** Clearcoat (for glossy finishes) */
  clearcoat: number;
  /** Clearcoat roughness */
  clearcoatRoughness: number;
  /** Transmission (for backlit/translucent) */
  transmission: number;
}

export const PRINT_STYLE_OPTIONS: { value: PrintStyle; label: string; desc: string; category: string }[] = [
  { value: 'fabric-matte', label: 'Matte Fabric', desc: 'Standard dye-sub fabric — soft, diffuse', category: 'Fabric' },
  { value: 'fabric-satin', label: 'Satin Fabric', desc: 'Satin finish — slight sheen', category: 'Fabric' },
  { value: 'seg-fabric', label: 'SEG Fabric', desc: 'Stretch fabric for SEG frames', category: 'SEG' },
  { value: 'seg-backlit', label: 'SEG Backlit', desc: 'Backlit SEG — glows from behind', category: 'SEG' },
  { value: 'vinyl-matte', label: 'Matte Vinyl', desc: 'Smooth matte vinyl print', category: 'Vinyl' },
  { value: 'vinyl-satin', label: 'Satin Vinyl', desc: 'Satin laminate — subtle sheen', category: 'Vinyl' },
  { value: 'vinyl-gloss', label: 'Gloss Vinyl', desc: 'High-gloss reflective vinyl', category: 'Vinyl' },
  { value: 'backlit-film', label: 'Backlit Film', desc: 'Translucent duratrans with glow', category: 'Backlit' },
  { value: 'substrate-foam', label: 'Foam Board', desc: 'Direct print on foam — flat matte', category: 'Substrate' },
  { value: 'substrate-sintra', label: 'Sintra PVC', desc: 'Rigid PVC panel — slight gloss', category: 'Substrate' },
  { value: 'substrate-acrylic', label: 'Acrylic', desc: 'Print on acrylic — premium glossy', category: 'Substrate' },
  { value: 'substrate-aluminum', label: 'Aluminum', desc: 'Dye-sub on metal — metallic finish', category: 'Substrate' },
];

/** Get PBR properties for a print style */
export function getPrintMaterial(style: PrintStyle): PrintMaterialConfig {
  switch (style) {
    case 'fabric-matte':
      return { roughness: 0.92, metalness: 0, envMapIntensity: 0.08, emissive: false, emissiveIntensity: 0, bumpScale: 0.003, clearcoat: 0, clearcoatRoughness: 0, transmission: 0 };
    case 'fabric-satin':
      return { roughness: 0.72, metalness: 0.02, envMapIntensity: 0.2, emissive: false, emissiveIntensity: 0, bumpScale: 0.002, clearcoat: 0.05, clearcoatRoughness: 0.6, transmission: 0 };
    case 'seg-fabric':
      return { roughness: 0.8, metalness: 0, envMapIntensity: 0.12, emissive: false, emissiveIntensity: 0, bumpScale: 0.002, clearcoat: 0, clearcoatRoughness: 0, transmission: 0.05 };
    case 'seg-backlit':
      return { roughness: 0.75, metalness: 0, envMapIntensity: 0.1, emissive: true, emissiveIntensity: 0.35, bumpScale: 0.001, clearcoat: 0, clearcoatRoughness: 0, transmission: 0.15 };
    case 'vinyl-matte':
      return { roughness: 0.65, metalness: 0.03, envMapIntensity: 0.25, emissive: false, emissiveIntensity: 0, bumpScale: 0, clearcoat: 0, clearcoatRoughness: 0, transmission: 0 };
    case 'vinyl-satin':
      return { roughness: 0.42, metalness: 0.05, envMapIntensity: 0.4, emissive: false, emissiveIntensity: 0, bumpScale: 0, clearcoat: 0.15, clearcoatRoughness: 0.35, transmission: 0 };
    case 'vinyl-gloss':
      return { roughness: 0.15, metalness: 0.08, envMapIntensity: 0.7, emissive: false, emissiveIntensity: 0, bumpScale: 0, clearcoat: 0.6, clearcoatRoughness: 0.1, transmission: 0 };
    case 'backlit-film':
      return { roughness: 0.35, metalness: 0.02, envMapIntensity: 0.15, emissive: true, emissiveIntensity: 0.55, bumpScale: 0, clearcoat: 0.1, clearcoatRoughness: 0.2, transmission: 0.3 };
    case 'substrate-foam':
      return { roughness: 0.95, metalness: 0, envMapIntensity: 0.05, emissive: false, emissiveIntensity: 0, bumpScale: 0.001, clearcoat: 0, clearcoatRoughness: 0, transmission: 0 };
    case 'substrate-sintra':
      return { roughness: 0.55, metalness: 0.04, envMapIntensity: 0.3, emissive: false, emissiveIntensity: 0, bumpScale: 0, clearcoat: 0.1, clearcoatRoughness: 0.4, transmission: 0 };
    case 'substrate-acrylic':
      return { roughness: 0.12, metalness: 0.06, envMapIntensity: 0.8, emissive: false, emissiveIntensity: 0, bumpScale: 0, clearcoat: 0.8, clearcoatRoughness: 0.05, transmission: 0.02 };
    case 'substrate-aluminum':
      return { roughness: 0.25, metalness: 0.65, envMapIntensity: 0.9, emissive: false, emissiveIntensity: 0, bumpScale: 0, clearcoat: 0.3, clearcoatRoughness: 0.15, transmission: 0 };
  }
}
