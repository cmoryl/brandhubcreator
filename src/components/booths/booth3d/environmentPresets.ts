/**
 * Environment Realism Presets
 * Controls the fidelity level of the expo hall rendering from basic wireframe
 * to ultra-cinematic photorealistic simulation.
 */

export type EnvironmentRealism = 'standard' | 'realistic' | 'cinematic' | 'ultra';

export interface EnvironmentConfig {
  label: string;
  description: string;
  icon: string; // emoji
  /** Lighting */
  ambientMultiplier: number;
  spotMultiplier: number;
  shadowQuality: number; // shadow map size
  /** Environment map */
  useHDRI: boolean;
  envIntensity: number;
  /** Scene */
  showCarpetDetail: boolean;
  showCeilingTrusses: boolean;
  showNeighborBooths: boolean;
  showPillars: boolean;
  showExitSigns: boolean;
  showBannerRigs: boolean;
  showVentilation: boolean;
  showLightRigs: boolean;
  showCableTroughs: boolean;
  /** People */
  peopleCount: 'few' | 'moderate' | 'busy' | 'packed';
  peopleAnimated: boolean;
  showInteractions: boolean;
  showConversationGroups: boolean;
  /** Atmosphere */
  showFog: boolean;
  fogDensity: number;
  showAmbientParticles: boolean;
  showFloorReflections: boolean;
  /** Camera */
  cinematicDOF: boolean;
  cameraPresets: CameraPreset[];
}

export interface CameraPreset {
  id: string;
  name: string;
  description: string;
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
}

/** Cinematic camera angles for trade show photography */
const CAMERA_PRESETS: Record<string, CameraPreset[]> = {
  standard: [
    { id: 'overview', name: 'Overview', description: 'Standard 3/4 view', position: [6, 4, 6], target: [0, 1.2, 0], fov: 45 },
    { id: 'front', name: 'Front', description: 'Visitor approach view', position: [0, 1.7, 6], target: [0, 1.2, 0], fov: 50 },
  ],
  realistic: [
    { id: 'overview', name: 'Overview', description: 'Elevated 3/4 angle', position: [7, 5, 7], target: [0, 1, 0], fov: 42 },
    { id: 'visitor-eye', name: 'Visitor POV', description: 'Eye-level approach (5\'9")', position: [0, 1.75, 5.5], target: [0, 1.4, 0], fov: 55 },
    { id: 'hero-wide', name: 'Hero Wide', description: 'Wide establishing shot', position: [8, 3, 10], target: [0, 1.2, 0], fov: 60 },
    { id: 'detail', name: 'Detail Close-up', description: 'Close panel detail', position: [1.5, 1.6, 1.5], target: [0, 1.4, 0], fov: 35 },
  ],
  cinematic: [
    { id: 'overview', name: 'Aerial Sweep', description: 'Dramatic overhead establishing', position: [10, 6, 8], target: [0, 0.8, 0], fov: 38 },
    { id: 'visitor-eye', name: 'Visitor POV', description: 'Natural eye-level (5\'9")', position: [0.3, 1.75, 5], target: [0, 1.5, -0.5], fov: 50 },
    { id: 'hero-low', name: 'Hero Low Angle', description: 'Dramatic low-angle upshot', position: [2, 0.6, 4], target: [0, 2, 0], fov: 35 },
    { id: 'aisle-walk', name: 'Aisle Perspective', description: 'Walking down the aisle view', position: [-6, 1.7, 3], target: [0, 1.4, 0], fov: 45 },
    { id: 'detail-macro', name: 'Detail Macro', description: 'Tight product/panel shot', position: [0.8, 1.5, 0.8], target: [0, 1.4, 0], fov: 28 },
    { id: 'crowd-immersive', name: 'In The Crowd', description: 'Among visitors looking at booth', position: [1.5, 1.65, 3.5], target: [-0.5, 1.6, 0], fov: 55 },
  ],
  ultra: [
    { id: 'establishing', name: 'Establishing Shot', description: 'Grand hall reveal — film-grade wide', position: [12, 5.5, 12], target: [0, 1, 0], fov: 32 },
    { id: 'visitor-eye', name: 'Visitor POV', description: 'Photorealistic eye-level (5\'9")', position: [0.2, 1.75, 4.5], target: [-0.1, 1.5, -0.3], fov: 48 },
    { id: 'hero-dramatic', name: 'Dramatic Hero', description: 'Low-angle power shot with depth', position: [2.5, 0.4, 3.5], target: [0, 2.2, 0], fov: 30 },
    { id: 'photographer', name: 'Event Photographer', description: 'Pro camera position — 70mm equiv', position: [4, 1.6, 5], target: [0, 1.3, 0], fov: 32 },
    { id: 'aisle-editorial', name: 'Editorial Aisle', description: 'Magazine-style corridor shot', position: [-8, 1.7, 2], target: [0, 1.4, 0.5], fov: 40 },
    { id: 'overhead-plan', name: 'Overhead Plan', description: 'Bird\'s-eye layout documentation', position: [0, 10, 0.5], target: [0, 0, 0], fov: 50 },
    { id: 'immersive-crowd', name: 'In The Crowd', description: 'Shoulder-level among attendees', position: [1.2, 1.55, 3.8], target: [-0.3, 1.7, 0], fov: 58 },
    { id: 'detail-product', name: 'Product Detail', description: 'Tight macro with bokeh', position: [0.5, 1.3, 0.6], target: [0, 1.4, 0], fov: 24 },
  ],
};

export const ENVIRONMENT_PRESETS: Record<EnvironmentRealism, EnvironmentConfig> = {
  standard: {
    label: 'Standard',
    description: 'Clean grid view with basic environment',
    icon: '◻️',
    ambientMultiplier: 0.7,
    spotMultiplier: 1.0,
    shadowQuality: 1024,
    useHDRI: true,
    envIntensity: 0.5,
    showCarpetDetail: true,
    showCeilingTrusses: true,
    showNeighborBooths: true,
    showPillars: false,
    showExitSigns: false,
    showBannerRigs: false,
    showVentilation: false,
    showLightRigs: false,
    showCableTroughs: false,
    peopleCount: 'few',
    peopleAnimated: true,
    showInteractions: false,
    showConversationGroups: false,
    showFog: false,
    fogDensity: 0,
    showAmbientParticles: false,
    showFloorReflections: false,
    cinematicDOF: false,
    cameraPresets: CAMERA_PRESETS.standard,
  },
  realistic: {
    label: 'Realistic',
    description: 'Detailed expo hall with natural lighting',
    icon: '🏢',
    ambientMultiplier: 0.6,
    spotMultiplier: 1.1,
    shadowQuality: 2048,
    useHDRI: true,
    envIntensity: 0.7,
    showCarpetDetail: true,
    showCeilingTrusses: true,
    showNeighborBooths: true,
    showPillars: true,
    showExitSigns: true,
    showBannerRigs: false,
    showVentilation: false,
    showLightRigs: true,
    showCableTroughs: false,
    peopleCount: 'moderate',
    peopleAnimated: true,
    showInteractions: true,
    showConversationGroups: false,
    showFog: true,
    fogDensity: 0.015,
    showAmbientParticles: false,
    showFloorReflections: true,
    cinematicDOF: false,
    cameraPresets: CAMERA_PRESETS.realistic,
  },
  cinematic: {
    label: 'Cinematic',
    description: 'Film-grade lighting with atmospheric depth',
    icon: '🎬',
    ambientMultiplier: 0.45,
    spotMultiplier: 1.3,
    shadowQuality: 2048,
    useHDRI: true,
    envIntensity: 0.9,
    showCarpetDetail: true,
    showCeilingTrusses: true,
    showNeighborBooths: true,
    showPillars: true,
    showExitSigns: true,
    showBannerRigs: true,
    showVentilation: true,
    showLightRigs: true,
    showCableTroughs: true,
    peopleCount: 'busy',
    peopleAnimated: true,
    showInteractions: true,
    showConversationGroups: true,
    showFog: true,
    fogDensity: 0.025,
    showAmbientParticles: true,
    showFloorReflections: true,
    cinematicDOF: true,
    cameraPresets: CAMERA_PRESETS.cinematic,
  },
  ultra: {
    label: 'Ultra',
    description: 'Hyper-realistic cinematic — full event simulation',
    icon: '✨',
    ambientMultiplier: 0.35,
    spotMultiplier: 1.5,
    shadowQuality: 4096,
    useHDRI: true,
    envIntensity: 1.1,
    showCarpetDetail: true,
    showCeilingTrusses: true,
    showNeighborBooths: true,
    showPillars: true,
    showExitSigns: true,
    showBannerRigs: true,
    showVentilation: true,
    showLightRigs: true,
    showCableTroughs: true,
    peopleCount: 'packed',
    peopleAnimated: true,
    showInteractions: true,
    showConversationGroups: true,
    showFog: true,
    fogDensity: 0.035,
    showAmbientParticles: true,
    showFloorReflections: true,
    cinematicDOF: true,
    cameraPresets: CAMERA_PRESETS.ultra,
  },
};

export function getEnvironmentConfig(realism: EnvironmentRealism): EnvironmentConfig {
  return ENVIRONMENT_PRESETS[realism];
}

export function getPeopleMultiplier(count: EnvironmentConfig['peopleCount']): number {
  switch (count) {
    case 'few': return 1;
    case 'moderate': return 1.5;
    case 'busy': return 2.5;
    case 'packed': return 3.5;
  }
}
