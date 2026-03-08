/**
 * BoothScene3D - The Three.js scene containing booth panels, floor, lighting,
 * furniture assets, and drag-and-drop support
 */
import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls, Grid, Environment, ContactShadows, SoftShadows } from '@react-three/drei';
import { DraggablePanel3D } from './DraggablePanel3D';
import { CrowdHeatMap3D } from './CrowdHeatMap3D';
import type { CrowdSimulationData } from './crowdSimulationTypes';
import { BoothFloorpad, type FlooringConfig } from './BoothFloorpad';
import { BoothFurniture3D } from './BoothFurniture3D';
import { ExpoEnvironment } from './ExpoEnvironment';
import { PeopleFigures, type OccupiedZone } from './PeopleFigures';
import { TrafficFlow } from './TrafficFlow';
import type { PanelConfig, LightingPreset, BoothLayout } from './boothConfigs';
import type { PlacedAsset } from './boothFurnitureConfigs';
import { getFurnitureById } from './boothFurnitureConfigs';
import type { EnvironmentRealism, EnvironmentConfig, CameraPreset } from './environmentPresets';
import { getEnvironmentConfig } from './environmentPresets';
import { CameraAnimator, type WalkthroughMode } from './CameraAnimator';
import { FirstPersonController } from './FirstPersonController';
import type { MonitorSpec } from './specParser';
import { type BoothLightingConfig, type PrintStyle, temperatureToColor, parCanToColor } from './boothLightingConfig';
import { LogisticsOverlay3D } from './LogisticsMarker3D';
import type { LogisticsMarker } from './logisticsTypes';



interface BoothScene3DProps {
  panels: PanelConfig[];
  selectedPanelId: string | null;
  onSelectPanel: (panelId: string) => void;
  lightingPreset: LightingPreset;
  showLabels: boolean;
  showDimensions: boolean;
  showSafeZones?: boolean;
  showEnvironment?: boolean;
  showPeople?: boolean;
  showTrafficFlow?: boolean;
  layout?: BoothLayout;
  isDragMode?: boolean;
  onPanelPositionChange?: (panelId: string, position: [number, number, number]) => void;
  placedAssets?: PlacedAsset[];
  selectedAssetId?: string | null;
  onSelectAsset?: (instanceId: string) => void;
  onAssetPositionChange?: (instanceId: string, position: [number, number, number]) => void;
  /** Environment realism level */
  environmentRealism?: EnvironmentRealism;
  /** Active camera preset to animate to */
  activeCameraPreset?: CameraPreset | null;
  /** Bumped each click to re-trigger same preset */
  cameraVersion?: number;
  /** Walkthrough mode */
  walkthroughMode?: WalkthroughMode;
  /** All camera presets for tour */
  allCameraPresets?: CameraPreset[];
  /** Called when walkthrough/tour ends */
  onWalkthroughEnd?: () => void;
  /** Called when tour advances to a step */
  onTourStep?: (presetId: string) => void;
  /** Billboard sprite URLs for photorealistic characters */
  spriteUrls?: Record<string, string>;
  /** Use billboard rendering for characters */
  useBillboards?: boolean;
  /** Monitor specs from production data */
  monitorSpecs?: MonitorSpec[];
  /** Active spec config type (RDT-108, RDT-110) */
  activeSpecConfig?: string;
  /** Booth flooring configuration */
  flooringConfig?: FlooringConfig;
  /** Booth footprint string e.g. "10' × 10' floor" */
  footprint?: string;
  /** Configurable booth lighting rig */
  boothLighting?: BoothLightingConfig;
  /** Panel print material style */
  printStyle?: PrintStyle;
  /** Crowd simulation data for heat map overlay */
  crowdSimulation?: CrowdSimulationData | null;
  showHeatMap?: boolean;
  /** Logistics markers overlay */
  logisticsMarkers?: LogisticsMarker[];
  showLogistics?: boolean;
  selectedLogisticsId?: string | null;
  onSelectLogistics?: (id: string) => void;
}

function getLighting(preset: LightingPreset, envConfig?: EnvironmentConfig) {
  const base = (() => {
    switch (preset) {
      case 'expo-bright':
        return { ambientIntensity: 0.8, spotIntensity: 1.2, envPreset: 'warehouse' as const, bgColor: '#f8fafc', hallBrightness: 'bright' as const };
      case 'showcase-dim':
        return { ambientIntensity: 0.4, spotIntensity: 0.9, envPreset: 'city' as const, bgColor: '#1e293b', hallBrightness: 'standard' as const };
      case 'dark-hall':
        return { ambientIntensity: 0.1, spotIntensity: 1.5, envPreset: 'night' as const, bgColor: '#09090b', hallBrightness: 'dark' as const };
      case 'stage-lighting':
        return { ambientIntensity: 0.15, spotIntensity: 1.8, envPreset: 'night' as const, bgColor: '#0c0a1a', hallBrightness: 'dark' as const };
      case 'warm-gallery':
        return { ambientIntensity: 0.5, spotIntensity: 1.0, envPreset: 'sunset' as const, bgColor: '#1c1917', hallBrightness: 'standard' as const };
      case 'cool-neutral':
        return { ambientIntensity: 0.6, spotIntensity: 0.9, envPreset: 'city' as const, bgColor: '#f1f5f9', hallBrightness: 'bright' as const };
    }
  })();
  if (envConfig) {
    return {
      ...base,
      bgColor: '#111827',
      ambientIntensity: base.ambientIntensity * envConfig.ambientMultiplier,
      spotIntensity: base.spotIntensity * envConfig.spotMultiplier,
    };
  }
  return base;
}

export function BoothScene3D({
  panels,
  selectedPanelId,
  onSelectPanel,
  lightingPreset,
  showLabels,
  showDimensions,
  showSafeZones = false,
  showEnvironment = false,
  showPeople = false,
  showTrafficFlow = false,
  layout = 'u-shape',
  isDragMode = false,
  onPanelPositionChange,
  placedAssets = [],
  selectedAssetId,
  onSelectAsset,
  onAssetPositionChange,
  environmentRealism = 'standard',
  activeCameraPreset = null,
  cameraVersion = 0,
  walkthroughMode = 'none',
  allCameraPresets = [],
  onWalkthroughEnd,
  onTourStep,
  spriteUrls = {},
  useBillboards = false,
  monitorSpecs = [],
  activeSpecConfig = '',
  flooringConfig,
  footprint = "10' × 10' floor",
  boothLighting,
  printStyle = 'fabric-matte',
  crowdSimulation = null,
  showHeatMap = false,
  logisticsMarkers = [],
  showLogistics = false,
  selectedLogisticsId = null,
  onSelectLogistics,
}: BoothScene3DProps) {
  const controlsRef = useRef<any>(null);
  const envConfig = showEnvironment ? getEnvironmentConfig(environmentRealism) : undefined;
  const lighting = getLighting(lightingPreset, envConfig);
  const isHyper = environmentRealism === 'hyper';

  // Build occupied zones from panels + placed assets + monitors + lighting rigs for collision avoidance
  const occupiedZones = useMemo<OccupiedZone[]>(() => {
    const zones: OccupiedZone[] = [];

    // Panels occupy space on the XZ plane
    const PANEL_DEPTH = 0.15;
    for (const p of panels) {
      // Account for panel rotation — panels rotated 90° swap width/depth footprint
      const rotY = p.rotation[1] || 0;
      const isRotated = Math.abs(Math.sin(rotY)) > 0.5;
      zones.push({
        cx: p.position[0],
        cz: p.position[2],
        hw: isRotated ? PANEL_DEPTH / 2 : p.size[0] / 2 + 0.2, // +0.2m clearance buffer
        hd: isRotated ? p.size[0] / 2 + 0.2 : PANEL_DEPTH / 2 + 0.2,
      });
    }

    // Placed furniture assets — with clearance buffer for walk-around space
    for (const asset of placedAssets) {
      const catalog = getFurnitureById(asset.assetId);
      if (!catalog) continue;
      const sz = asset.customSize || catalog.size;
      const clearance = catalog.category === 'displays' ? 0.6 : // screens need viewer clearance
                        catalog.category === 'tables' ? 0.4 :   // tables need chair/approach space
                        catalog.category === 'seating' ? 0.2 :
                        0.15;
      zones.push({
        cx: asset.position[0],
        cz: asset.position[2],
        hw: sz[0] / 2 + clearance,
        hd: sz[2] / 2 + clearance,
      });
    }

    // Production-spec mounted monitors
    for (const ms of monitorSpecs.filter(m => m.configType === activeSpecConfig)) {
      const diagM = ms.monitorSize * 0.0254;
      const aspect = 16 / 9;
      const monW = diagM * Math.cos(Math.atan(1 / aspect));
      const positions: [number, number, number][] = ms.count === 1
        ? [[0, 0, -0.02]]
        : [[-monW * 0.6, 0, -0.02], [monW * 0.6, 0, -0.02]];
      for (const pos of positions) {
        zones.push({ cx: pos[0], cz: pos[2], hw: monW / 2 + 0.3, hd: 0.4 });
      }
    }

    // LED wash strips and par can fixtures (stage lighting mode)
    if (lightingPreset === 'stage-lighting') {
      for (const wash of [[-3, 0, -1.5], [3, 0, -1.5], [0, 0, 2]]) {
        zones.push({ cx: wash[0], cz: wash[2], hw: 1.2, hd: 0.3 });
      }
    }

    // Volumetric beam landing zones (dark/stage modes)
    if (lightingPreset === 'dark-hall' || lightingPreset === 'stage-lighting') {
      for (const bx of [0, -2.5, 2.5]) {
        zones.push({ cx: bx, cz: bx === 0 ? 0 : bx > 0 ? 0.5 : -0.5, hw: 1.0, hd: 1.0 });
      }
    }

    // Booth flooring edges — people shouldn't stand ON the booth edge
    if (flooringConfig && flooringConfig.type !== 'none') {
      // The booth floor itself is an implicit zone; people should be near it but not on the edge strips
    }

    return zones;
  }, [panels, placedAssets, monitorSpecs, activeSpecConfig, lightingPreset, flooringConfig]);

  // Determine enhanced lighting tier
  const isAdvanced = environmentRealism === 'cinematic' || environmentRealism === 'ultra' || isHyper;

  return (
    <>
      <color attach="background" args={[lighting.bgColor]} />

      {/* Advanced rendering: Soft shadows (PCSS) for hyper/ultra modes */}
      {envConfig?.useSoftShadows && <SoftShadows size={25} samples={16} focus={0.5} />}
      {/* ═══ PRIMARY LIGHTING ═══ */}
      <ambientLight intensity={lighting.ambientIntensity} color={isHyper ? '#e8e4df' : '#ffffff'} />

      {/* Key light — main directional spot */}
      <spotLight
        position={[5, 8, 5]}
        angle={isHyper ? 0.4 : 0.5}
        penumbra={isHyper ? 0.7 : 0.5}
        intensity={lighting.spotIntensity}
        castShadow
        shadow-mapSize={envConfig ? [envConfig.shadowQuality, envConfig.shadowQuality] : [1024, 1024]}
        shadow-bias={isAdvanced ? -0.0002 : -0.0005}
        shadow-normalBias={isAdvanced ? 0.02 : 0.05}
        shadow-radius={isHyper ? 4 : 2}
        color={isHyper ? '#fff5e6' : '#ffffff'}
      />

      {/* Fill light — opposite side */}
      <spotLight
        position={[-5, 6, -3]}
        angle={0.4}
        penumbra={isHyper ? 0.9 : 0.8}
        intensity={lighting.spotIntensity * (isHyper ? 0.6 : 0.5)}
        castShadow={isAdvanced}
        shadow-mapSize={isAdvanced ? [2048, 2048] : [512, 512]}
        shadow-bias={-0.0003}
        color={isAdvanced ? '#e8eaf0' : '#ffffff'}
      />

      {/* Rim/back light for depth separation */}
      {isAdvanced && (
        <spotLight
          position={[0, 7, -5]}
          angle={0.5}
          penumbra={0.85}
          intensity={lighting.spotIntensity * 0.35}
          color="#c8d8f0"
          castShadow={isHyper}
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0002}
        />
      )}

      {/* Booth-focused overhead — warm accent for fabric/surface pop */}
      <spotLight
        position={[0, 6, 1]}
        angle={0.6}
        penumbra={0.75}
        intensity={isAdvanced ? lighting.spotIntensity * 0.4 : lighting.spotIntensity * 0.2}
        color="#fef3c7"
        castShadow={isAdvanced}
        shadow-mapSize={isAdvanced ? [2048, 2048] : [1024, 1024]}
        shadow-bias={-0.0003}
      />

      {/* Hyper mode: extra key lights for dramatic depth + reflections */}
      {isHyper && (
        <>
          <spotLight
            position={[0, 9, 0]}
            angle={0.3}
            penumbra={0.95}
            intensity={0.4}
            color="#e8d5b7"
            castShadow
            shadow-mapSize={[4096, 4096]}
            shadow-bias={-0.0001}
            shadow-normalBias={0.01}
          />
          <spotLight
            position={[-3, 7, 5]}
            angle={0.35}
            penumbra={0.9}
            intensity={0.3}
            color="#bfdbfe"
          />
          {/* Ground bounce light (simulates reflected light from floor) */}
          <pointLight
            position={[0, 0.3, 2]}
            intensity={0.15}
            color="#94a3b8"
            distance={6}
          />
          {/* Side accent for fabric sheen */}
          <spotLight
            position={[4, 3, 0]}
            angle={0.5}
            penumbra={0.9}
            intensity={0.2}
            color="#f0e6d4"
          />
        </>
      )}

      {/* Ultra mode: additional fill */}
      {environmentRealism === 'ultra' && (
        <>
          <pointLight position={[0, 0.5, 3]} intensity={0.1} color="#b0b8c8" distance={5} />
          <spotLight position={[3, 5, -2]} angle={0.4} penumbra={0.85} intensity={0.25} color="#e0d8cc" castShadow shadow-mapSize={[2048, 2048]} />
        </>
      )}

      {/* ═══ CONFIGURABLE BOOTH LIGHTING RIG ═══ */}
      {boothLighting && (
        <>
          {/* Override hall ambient with user config */}
          <ambientLight
            intensity={boothLighting.hallAmbient}
            color={temperatureToColor(boothLighting.hallTemperature)}
          />

          {/* User-defined overhead booth spotlights */}
          {boothLighting.boothSpots.map((spot, i) => (
            <spotLight
              key={`booth-spot-${i}`}
              position={spot.position}
              angle={spot.angle}
              penumbra={0.8}
              intensity={spot.intensity}
              color={temperatureToColor(spot.temperature)}
              castShadow={spot.castShadow}
              shadow-mapSize={spot.castShadow ? [2048, 2048] : [512, 512]}
              shadow-bias={-0.0003}
              target-position={[spot.position[0], 0, spot.position[2]]}
            />
          ))}

          {/* Par can color wash */}
          {boothLighting.parCanColor !== 'none' && (
            <>
              <spotLight
                position={[-2, 6.5, 1]}
                angle={0.7}
                penumbra={0.95}
                intensity={boothLighting.parCanIntensity}
                color={parCanToColor(boothLighting.parCanColor)}
                distance={10}
              />
              <spotLight
                position={[2, 6.5, -1]}
                angle={0.7}
                penumbra={0.95}
                intensity={boothLighting.parCanIntensity * 0.7}
                color={parCanToColor(boothLighting.parCanColor)}
                distance={10}
              />
              <spotLight
                position={[0, 6.5, 2]}
                angle={0.6}
                penumbra={0.9}
                intensity={boothLighting.parCanIntensity * 0.5}
                color={parCanToColor(boothLighting.parCanColor)}
                distance={8}
              />
              {/* Par can housing visuals */}
              {[[-2, 6.5, 1], [2, 6.5, -1], [0, 6.5, 2]].map(([x, y, z], i) => (
                <group key={`par-${i}`} position={[x, y, z]}>
                  <mesh>
                    <cylinderGeometry args={[0.1, 0.13, 0.25, 12]} />
                    <meshStandardMaterial color="#111" metalness={0.9} roughness={0.1} />
                  </mesh>
                  <mesh position={[0, -0.14, 0]}>
                    <cylinderGeometry args={[0.08, 0.08, 0.02, 12]} />
                    <meshStandardMaterial
                      color={parCanToColor(boothLighting.parCanColor)}
                      emissive={parCanToColor(boothLighting.parCanColor)}
                      emissiveIntensity={0.6}
                      transparent
                      opacity={0.7}
                    />
                  </mesh>
                </group>
              ))}
            </>
          )}
        </>
      )}

      {/* ═══ SPOTLIGHT BEAMS (visible volumetric cones) ═══ */}
      {(lightingPreset === 'dark-hall' || lightingPreset === 'stage-lighting') && (
        <>
          {/* Visible beam cone meshes — simulates volumetric light */}
          {[
            { pos: [0, 7, 0] as [number, number, number], color: lightingPreset === 'stage-lighting' ? '#6366f1' : '#fef3c7', intensity: 0.8 },
            { pos: [-2.5, 7, -0.5] as [number, number, number], color: lightingPreset === 'stage-lighting' ? '#ec4899' : '#fef3c7', intensity: 0.6 },
            { pos: [2.5, 7, 0.5] as [number, number, number], color: lightingPreset === 'stage-lighting' ? '#06b6d4' : '#fef3c7', intensity: 0.6 },
          ].map((beam, i) => (
            <group key={`beam-${i}`} position={beam.pos}>
              {/* Spot fixture housing */}
              <mesh position={[0, 0.15, 0]}>
                <cylinderGeometry args={[0.08, 0.12, 0.3, 12]} />
                <meshStandardMaterial color="#1a1a2e" metalness={0.9} roughness={0.1} />
              </mesh>
              {/* Visible beam cone */}
              <mesh position={[0, -3.2, 0]} rotation={[0, 0, 0]}>
                <coneGeometry args={[1.8, 6.4, 16, 1, true]} />
                <meshBasicMaterial
                  color={beam.color}
                  transparent
                  opacity={0.04}
                  side={2}
                  depthWrite={false}
                />
              </mesh>
              {/* Inner bright core */}
              <mesh position={[0, -3.2, 0]}>
                <coneGeometry args={[0.6, 6.4, 12, 1, true]} />
                <meshBasicMaterial
                  color={beam.color}
                  transparent
                  opacity={0.06}
                  side={2}
                  depthWrite={false}
                />
              </mesh>
              {/* Actual spot light */}
              <spotLight
                position={[0, 0, 0]}
                angle={0.35}
                penumbra={0.8}
                intensity={beam.intensity * lighting.spotIntensity}
                color={beam.color}
                castShadow
                shadow-mapSize={[2048, 2048]}
                shadow-bias={-0.0002}
                distance={12}
              />
            </group>
          ))}
        </>
      )}

      {/* ═══ LED WASH (colored floor/wall wash) ═══ */}
      {lightingPreset === 'stage-lighting' && (
        <>
          {/* Ground LED wash strips */}
          {[
            { pos: [-3, 0.05, -1.5] as [number, number, number], color: '#6366f1', rot: [0, 0, 0] as [number, number, number] },
            { pos: [3, 0.05, -1.5] as [number, number, number], color: '#ec4899', rot: [0, 0, 0] as [number, number, number] },
            { pos: [0, 0.05, 2] as [number, number, number], color: '#06b6d4', rot: [0, Math.PI / 2, 0] as [number, number, number] },
          ].map((wash, i) => (
            <group key={`wash-${i}`} position={wash.pos} rotation={wash.rot}>
              {/* LED strip housing */}
              <mesh>
                <boxGeometry args={[2, 0.04, 0.08]} />
                <meshStandardMaterial color="#111" metalness={0.8} roughness={0.2} />
              </mesh>
              {/* LED glow */}
              <mesh position={[0, 0.01, 0]}>
                <boxGeometry args={[1.9, 0.02, 0.06]} />
                <meshBasicMaterial color={wash.color} transparent opacity={0.9} />
              </mesh>
              {/* Upward wash */}
              <spotLight
                position={[0, 0.1, 0]}
                angle={1.2}
                penumbra={1}
                intensity={0.4}
                color={wash.color}
                distance={5}
                target-position={[wash.pos[0], 4, wash.pos[2]]}
              />
              {/* Floor pool of light */}
              <pointLight
                position={[0, 0.15, 0]}
                intensity={0.25}
                color={wash.color}
                distance={3}
              />
            </group>
          ))}
        </>
      )}

      {/* ═══ HALO BACKLIGHTING (panels glow ring) ═══ */}
      {(lightingPreset === 'dark-hall' || lightingPreset === 'stage-lighting') && panels.length > 0 && (
        <>
          {panels.map((panel, i) => {
            const haloColor = lightingPreset === 'stage-lighting' ? '#818cf8' : '#e2e8f0';
            return (
              <group key={`halo-${i}`} position={panel.position}>
                {/* Back-glow point light behind panel */}
                <pointLight
                  position={[0, panel.size[1] * 0.5, -0.15]}
                  intensity={lightingPreset === 'stage-lighting' ? 0.5 : 0.3}
                  color={haloColor}
                  distance={3}
                />
                {/* Halo ring mesh */}
                <mesh position={[0, panel.size[1] * 0.5, -0.06]} rotation={[0, 0, 0]}>
                  <ringGeometry args={[
                    Math.max(panel.size[0], panel.size[1]) * 0.52,
                    Math.max(panel.size[0], panel.size[1]) * 0.56,
                    32
                  ]} />
                  <meshBasicMaterial
                    color={haloColor}
                    transparent
                    opacity={0.15}
                    side={2}
                    depthWrite={false}
                  />
                </mesh>
                {/* Soft glow plane behind panel */}
                <mesh position={[0, panel.size[1] * 0.5, -0.08]}>
                  <planeGeometry args={[panel.size[0] + 0.3, panel.size[1] + 0.3]} />
                  <meshBasicMaterial
                    color={haloColor}
                    transparent
                    opacity={0.08}
                    depthWrite={false}
                  />
                </mesh>
              </group>
            );
          })}
        </>
      )}

      <Environment
        preset={lighting.envPreset}
        environmentIntensity={envConfig?.envIntensity ?? 0.5}
        background={false}
      />

      {/* Controls */}
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.1}
        minDistance={1}
        maxDistance={showEnvironment ? 35 : 20}
        maxPolarAngle={Math.PI / 2 - 0.05}
        target={[0, 1.2, 0]}
        enabled={!isDragMode && walkthroughMode !== 'fps'}
      />
      <CameraAnimator
        activePreset={activeCameraPreset}
        version={cameraVersion}
        controlsRef={controlsRef}
        walkthroughMode={walkthroughMode}
        allPresets={allCameraPresets}
        onModeChange={(mode) => { if (mode === 'none') onWalkthroughEnd?.(); }}
        onTourStep={onTourStep}
      />
      <FirstPersonController
        enabled={walkthroughMode === 'fps'}
        controlsRef={controlsRef}
        onExit={() => onWalkthroughEnd?.()}
      />


      {showEnvironment && envConfig ? (
        <ExpoEnvironment config={envConfig} />
      ) : (
        <>
          <Grid
            position={[0, 0, 0]}
            args={[20, 20]}
            cellSize={0.5}
            cellThickness={0.5}
            cellColor="#4b5563"
            sectionSize={2}
            sectionThickness={1}
            sectionColor="#6b7280"
            fadeDistance={15}
            fadeStrength={1}
            followCamera={false}
          />
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
            <planeGeometry args={[20, 20]} />
            <shadowMaterial opacity={0.15} />
          </mesh>
        </>
      )}

      {/* Contact shadows — soft ground-level AO for hyper/ultra modes */}
      {envConfig?.useContactShadows && (
        <ContactShadows
          position={[0, 0.001, 0]}
          opacity={envConfig.contactShadowOpacity ?? 0.4}
          scale={20}
          blur={envConfig.contactShadowBlur ?? 2}
          far={4}
          resolution={isHyper ? 512 : 256}
          color="#0a0a14"
        />
      )}

      {showPeople && <PeopleFigures layout={layout} envConfig={envConfig} occupiedZones={occupiedZones} spriteUrls={spriteUrls} useBillboards={useBillboards} />}
      {showTrafficFlow && <TrafficFlow layout={layout} />}

      {/* Booth floor pad — shows footprint with flooring material */}
      {flooringConfig && flooringConfig.type !== 'none' && (
        <BoothFloorpad footprint={footprint} config={flooringConfig} showLabels={showLabels} />
      )}

      {/* Booth panels */}
      {panels.map((panel) => (
        <DraggablePanel3D
          key={panel.id}
          panel={panel}
          isSelected={selectedPanelId === panel.id}
          onSelect={onSelectPanel}
          showLabels={showLabels}
          showDimensions={showDimensions}
          showSafeZones={showSafeZones}
          isDragMode={isDragMode}
          onPositionChange={onPanelPositionChange || (() => {})}
          printStyle={printStyle}
          edgeLightIntensity={boothLighting?.edgeLightEnabled ? boothLighting.edgeLightIntensity : 0}
          edgeLightColor={boothLighting?.edgeLightColor}
        />
      ))}

      {/* Furniture assets */}
      {placedAssets.map((asset) => (
        <BoothFurniture3D
          key={asset.instanceId}
          asset={asset}
          isSelected={selectedAssetId === asset.instanceId}
          isDragMode={isDragMode}
          showLabels={showLabels}
          onSelect={onSelectAsset || (() => {})}
          onPositionChange={onAssetPositionChange || (() => {})}
        />
      ))}

      {/* Production-spec monitors */}
      {monitorSpecs
        .filter(ms => ms.configType === activeSpecConfig)
        .map((ms) => {
          // Convert monitor diagonal inches to approximate width/height (16:9)
          const diagM = ms.monitorSize * 0.0254;
          const aspect = 16 / 9;
          const monW = diagM * Math.cos(Math.atan(1 / aspect));
          const monH = diagM * Math.sin(Math.atan(1 / aspect));
          const bezelDepth = 0.04;
          const standH = 1.2; // typical monitor stand/arm height

          // Position monitors centered on the back wall, at standing eye height
          const positions: [number, number, number][] = ms.count === 1
            ? [[0, standH + monH / 2, -0.02]]
            : [[-monW * 0.6, standH + monH / 2, -0.02], [monW * 0.6, standH + monH / 2, -0.02]];

          return positions.map((pos, idx) => (
            <group key={`monitor-${ms.configType}-${idx}`} position={pos}>
              {/* Screen */}
              <mesh castShadow>
                <boxGeometry args={[monW, monH, bezelDepth]} />
                <meshStandardMaterial color="#111111" metalness={0.8} roughness={0.15} />
              </mesh>
              {/* Screen face (slightly in front) */}
              <mesh position={[0, 0, bezelDepth / 2 + 0.001]}>
                <planeGeometry args={[monW - 0.02, monH - 0.02]} />
                <meshStandardMaterial color="#1a1a2e" emissive="#1a2a4a" emissiveIntensity={0.3} metalness={0.1} roughness={0.2} />
              </mesh>
              {/* Bezel highlight */}
              <mesh position={[0, 0, bezelDepth / 2 + 0.0005]}>
                <planeGeometry args={[monW - 0.005, monH - 0.005]} />
                <meshStandardMaterial color="#000000" opacity={0.5} transparent />
              </mesh>
              {/* Stand arm */}
              <mesh position={[0, -monH / 2 - 0.15, -0.03]} castShadow>
                <boxGeometry args={[0.04, 0.3, 0.04]} />
                <meshStandardMaterial color="#333333" metalness={0.9} roughness={0.1} />
              </mesh>
              {/* Wall mount bracket */}
              <mesh position={[0, 0, -bezelDepth / 2 - 0.015]}>
                <boxGeometry args={[0.15, 0.15, 0.03]} />
                <meshStandardMaterial color="#444444" metalness={0.85} roughness={0.15} />
              </mesh>
              {/* Label */}
              {showLabels && (
                <group position={[0, monH / 2 + 0.08, 0.03]}>
                  <mesh>
                    <planeGeometry args={[monW * 0.7, 0.08]} />
                    <meshBasicMaterial color="#000000" opacity={0.7} transparent />
                  </mesh>
                </group>
              )}
            </group>
          ));
        })}

      {/* Crowd simulation heat map overlay */}
      {showHeatMap && crowdSimulation && (
        <CrowdHeatMap3D
          simulationData={crowdSimulation}
          boothSize={[
            layout?.startsWith('island-40') ? 40 * 0.3048 :
            layout?.startsWith('island-30') ? 30 * 0.3048 :
            layout?.startsWith('island') || layout?.startsWith('peninsula') ? 20 * 0.3048 :
            10 * 0.3048,
            layout?.startsWith('island-40') ? 40 * 0.3048 :
            layout?.startsWith('island-30') ? 30 * 0.3048 :
            layout?.startsWith('island') || layout?.startsWith('peninsula') ? 20 * 0.3048 :
            10 * 0.3048,
          ]}
          showLabels={showLabels}
          showSightlines={true}
        />
      )}

      {/* Logistics overlay markers */}
      <LogisticsOverlay3D
        markers={logisticsMarkers}
        visible={showLogistics}
        selectedMarkerId={selectedLogisticsId}
        onSelectMarker={onSelectLogistics}
      />
    </>
  );
}
