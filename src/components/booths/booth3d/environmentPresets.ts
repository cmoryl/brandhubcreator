/**
 * Environment Realism Presets
 * Controls the fidelity level of the expo hall rendering from basic wireframe
 * to hyper-realistic photorealistic simulation.
 */

export type EnvironmentRealism = 'standard' | 'realistic' | 'cinematic' | 'ultra' | 'hyper';

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
  /** Hyper-realistic extras */
  showVolumetricLights?: boolean;
  showDetailedWalls?: boolean;
  showFloorGloss?: boolean;
  enhancedMaterials?: boolean;
  showSpotCones?: boolean;
  particleDensity?: number;
  /** Advanced rendering (hyper mode) */
  useContactShadows?: boolean;
  contactShadowOpacity?: number;
  contactShadowBlur?: number;
  useSoftShadows?: boolean;
  toneMapping?: 'aces' | 'cineon' | 'reinhard' | 'linear';
  toneMappingExposure?: number;
  useBloom?: boolean;
  bloomIntensity?: number;
  showPolishedFloor?: boolean;
  showLightShafts?: boolean;
  showHeatHaze?: boolean;
  showNeonAccents?: boolean;
  showDetailedFixtures?: boolean;
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
    { id: 'first-person', name: 'First Person', description: 'Walk up to the booth at eye level', position: [0, 1.65, 3], target: [0, 1.4, 0], fov: 65 },
    { id: 'aerial', name: 'Aerial Top-Down', description: 'Bird\'s-eye overhead view', position: [0, 10, 0.3], target: [0, 0, 0], fov: 50 },
  ],
  realistic: [
    { id: 'overview', name: 'Overview', description: 'Elevated 3/4 angle', position: [7, 5, 7], target: [0, 1, 0], fov: 42 },
    { id: 'front', name: 'Front', description: 'Visitor approach view', position: [0, 1.7, 5.5], target: [0, 1.2, 0], fov: 50 },
    { id: 'first-person', name: 'First Person', description: 'Standing in front of booth (5\'9")', position: [0, 1.75, 2.5], target: [0, 1.5, 0], fov: 65 },
    { id: 'aerial', name: 'Aerial Top-Down', description: 'Bird\'s-eye overhead view', position: [0, 10, 0.3], target: [0, 0, 0], fov: 48 },
    { id: 'hero-wide', name: 'Hero Wide', description: 'Wide establishing shot', position: [8, 3, 10], target: [0, 1.2, 0], fov: 60 },
    { id: 'detail', name: 'Detail Close-up', description: 'Close panel detail', position: [1.5, 1.6, 1.5], target: [0, 1.4, 0], fov: 35 },
  ],
  cinematic: [
    { id: 'overview', name: 'Overview', description: 'Dramatic overhead establishing', position: [10, 6, 8], target: [0, 0.8, 0], fov: 38 },
    { id: 'front', name: 'Front', description: 'Visitor approach view', position: [0, 1.7, 5], target: [0, 1.2, 0], fov: 50 },
    { id: 'first-person', name: 'First Person', description: 'Immersive eye-level at the booth', position: [0.2, 1.7, 2], target: [0, 1.5, -0.5], fov: 68 },
    { id: 'aerial', name: 'Aerial Top-Down', description: 'Bird\'s-eye layout documentation', position: [0, 11, 0.3], target: [0, 0, 0], fov: 45 },
    { id: 'hero-low', name: 'Hero Low Angle', description: 'Dramatic low-angle upshot', position: [2, 0.6, 4], target: [0, 2, 0], fov: 35 },
    { id: 'aisle-walk', name: 'Aisle Perspective', description: 'Walking down the aisle view', position: [-6, 1.7, 3], target: [0, 1.4, 0], fov: 45 },
    { id: 'detail-macro', name: 'Detail Macro', description: 'Tight product/panel shot', position: [0.8, 1.5, 0.8], target: [0, 1.4, 0], fov: 28 },
    { id: 'crowd-immersive', name: 'In The Crowd', description: 'Among visitors looking at booth', position: [1.5, 1.65, 3.5], target: [-0.5, 1.6, 0], fov: 55 },
  ],
  ultra: [
    { id: 'overview', name: 'Overview', description: 'Grand hall reveal — film-grade wide', position: [12, 5.5, 12], target: [0, 1, 0], fov: 32 },
    { id: 'front', name: 'Front', description: 'Visitor approach view', position: [0, 1.7, 5], target: [0, 1.2, 0], fov: 48 },
    { id: 'first-person', name: 'First Person', description: 'Standing right at the booth counter', position: [0, 1.72, 1.8], target: [0, 1.5, -0.3], fov: 70 },
    { id: 'hero-dramatic', name: 'Dramatic Hero', description: 'Low-angle power shot with depth', position: [2.5, 0.4, 3.5], target: [0, 2.2, 0], fov: 30 },
    { id: 'photographer', name: 'Event Photographer', description: 'Pro camera position — 70mm equiv', position: [4, 1.6, 5], target: [0, 1.3, 0], fov: 32 },
    { id: 'aisle-editorial', name: 'Editorial Aisle', description: 'Magazine-style corridor shot', position: [-8, 1.7, 2], target: [0, 1.4, 0.5], fov: 40 },
    { id: 'overhead-plan', name: 'Overhead Plan', description: 'Bird\'s-eye layout documentation', position: [0, 10, 0.5], target: [0, 0, 0], fov: 50 },
    { id: 'immersive-crowd', name: 'In The Crowd', description: 'Shoulder-level among attendees', position: [1.2, 1.55, 3.8], target: [-0.3, 1.7, 0], fov: 58 },
    { id: 'detail-product', name: 'Product Detail', description: 'Tight macro with bokeh', position: [0.5, 1.3, 0.6], target: [0, 1.4, 0], fov: 24 },
  ],
  hyper: [
    { id: 'overview', name: 'Overview', description: 'Cinematic hall-wide establishing shot', position: [14, 6, 14], target: [0, 1, 0], fov: 28 },
    { id: 'front', name: 'Front', description: 'Visitor approach view', position: [0, 1.7, 5], target: [0, 1.2, 0], fov: 46 },
    { id: 'first-person', name: 'First Person', description: 'Standing at the booth — full immersion', position: [0, 1.7, 1.5], target: [0, 1.5, -0.5], fov: 72 },
    { id: 'hero-dramatic', name: 'Power Shot', description: 'Low dramatic with volumetric light', position: [2, 0.3, 3.2], target: [0, 2.4, 0], fov: 26 },
    { id: 'golden-hour', name: 'Golden Hour', description: 'Warm atmospheric side angle', position: [-5, 2.2, 6], target: [0.5, 1.2, 0], fov: 38 },
    { id: 'photographer-pro', name: 'Pro Photographer', description: '85mm portrait lens equivalent', position: [3.5, 1.65, 4.5], target: [0, 1.4, 0], fov: 28 },
    { id: 'editorial-wide', name: 'Editorial Wide', description: 'Magazine double-page spread angle', position: [-9, 2.5, 3], target: [0, 1.2, 0.5], fov: 42 },
    { id: 'overhead-plan', name: 'Overhead Plan', description: 'Bird\'s-eye layout documentation', position: [0, 12, 0.5], target: [0, 0, 0], fov: 45 },
    { id: 'immersive', name: 'Immersive Walk', description: 'Handheld walk-through feel', position: [1, 1.6, 3.5], target: [-0.4, 1.7, -0.5], fov: 60 },
    { id: 'detail-macro', name: 'Macro Detail', description: 'Extreme close-up with shallow DOF', position: [0.4, 1.35, 0.5], target: [0, 1.4, 0], fov: 20 },
    { id: 'hallway', name: 'Hall Corridor', description: 'Deep perspective down the aisle', position: [-12, 1.75, 0], target: [0, 1.5, 0], fov: 35 },
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
    description: 'Ultra-cinematic full event simulation',
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
    useContactShadows: true,
    contactShadowOpacity: 0.3,
    contactShadowBlur: 2,
  },
  hyper: {
    label: 'Hyper-Real',
    description: 'Maximum photorealism — volumetric lights, polished floors, PBR materials, contact shadows',
    icon: '💎',
    ambientMultiplier: 0.45,
    spotMultiplier: 1.5,
    shadowQuality: 4096,
    useHDRI: true,
    envIntensity: 1.2,
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
    fogDensity: 0.018,
    showAmbientParticles: true,
    showFloorReflections: true,
    cinematicDOF: true,
    cameraPresets: CAMERA_PRESETS.hyper,
    // Hyper-exclusive features
    showVolumetricLights: true,
    showDetailedWalls: true,
    showFloorGloss: true,
    enhancedMaterials: true,
    showSpotCones: true,
    particleDensity: 1200,
    // Advanced rendering pipeline
    useContactShadows: true,
    contactShadowOpacity: 0.55,
    contactShadowBlur: 2.5,
    useSoftShadows: true,
    toneMapping: 'aces',
    toneMappingExposure: 1.15,
    showPolishedFloor: true,
    showLightShafts: true,
    showHeatHaze: false,
    showNeonAccents: true,
    showDetailedFixtures: true,
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
