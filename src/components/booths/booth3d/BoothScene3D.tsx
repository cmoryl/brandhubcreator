/**
 * BoothScene3D - The Three.js scene containing booth panels, floor, lighting,
 * furniture assets, and drag-and-drop support
 */
import { useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls, Grid, Environment } from '@react-three/drei';
import { DraggablePanel3D } from './DraggablePanel3D';
import { BoothFurniture3D } from './BoothFurniture3D';
import { ExpoEnvironment } from './ExpoEnvironment';
import { PeopleFigures } from './PeopleFigures';
import { TrafficFlow } from './TrafficFlow';
import type { PanelConfig, LightingPreset, BoothLayout } from './boothConfigs';
import type { PlacedAsset } from './boothFurnitureConfigs';
import type { EnvironmentRealism, EnvironmentConfig } from './environmentPresets';
import { getEnvironmentConfig } from './environmentPresets';

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
}

function getLighting(preset: LightingPreset, envConfig?: EnvironmentConfig) {
  const base = (() => {
    switch (preset) {
      case 'expo-bright':
        return { ambientIntensity: 0.8, spotIntensity: 1.2, envPreset: 'warehouse' as const, bgColor: '#f8fafc' };
      case 'showcase-dim':
        return { ambientIntensity: 0.3, spotIntensity: 0.8, envPreset: 'night' as const, bgColor: '#0f172a' };
      case 'warm-gallery':
        return { ambientIntensity: 0.5, spotIntensity: 1.0, envPreset: 'sunset' as const, bgColor: '#1c1917' };
      case 'cool-neutral':
        return { ambientIntensity: 0.6, spotIntensity: 0.9, envPreset: 'city' as const, bgColor: '#f1f5f9' };
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
}: BoothScene3DProps) {
  const controlsRef = useRef<any>(null);
  const envConfig = showEnvironment ? getEnvironmentConfig(environmentRealism) : undefined;
  const lighting = getLighting(lightingPreset, envConfig);
  const isHyper = environmentRealism === 'hyper';

  return (
    <>
      <color attach="background" args={[lighting.bgColor]} />

      {/* Lighting */}
      <ambientLight intensity={lighting.ambientIntensity} />
      <spotLight
        position={[5, 8, 5]}
        angle={isHyper ? 0.4 : 0.5}
        penumbra={isHyper ? 0.7 : 0.5}
        intensity={lighting.spotIntensity}
        castShadow
        shadow-mapSize={envConfig ? [envConfig.shadowQuality, envConfig.shadowQuality] : [1024, 1024]}
        shadow-bias={isHyper ? -0.0002 : undefined}
      />
      <spotLight
        position={[-5, 6, -3]}
        angle={0.4}
        penumbra={isHyper ? 0.9 : 0.8}
        intensity={lighting.spotIntensity * (isHyper ? 0.6 : 0.5)}
      />
      {/* Hyper mode: extra key light for dramatic depth */}
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
          />
          <spotLight
            position={[-3, 7, 5]}
            angle={0.35}
            penumbra={0.9}
            intensity={0.3}
            color="#bfdbfe"
          />
        </>
      )}
      <Environment
        preset={lighting.envPreset}
        environmentIntensity={envConfig?.envIntensity ?? 0.5}
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
        enabled={!isDragMode}
      />

      {/* Environment or grid */}
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

      {showPeople && <PeopleFigures layout={layout} envConfig={envConfig} />}
      {showTrafficFlow && <TrafficFlow layout={layout} />}

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
        />
      ))}

      {/* Furniture assets */}
      {placedAssets.map((asset) => (
        <BoothFurniture3D
          key={asset.instanceId}
          asset={asset}
          isSelected={selectedAssetId === asset.instanceId}
          isDragMode={isDragMode}
          onSelect={onSelectAsset || (() => {})}
          onPositionChange={onAssetPositionChange || (() => {})}
        />
      ))}
    </>
  );
}
