/**
 * BoothFurniture3D - 3D furniture / asset models for booth scene
 * Supports drag-and-drop repositioning on the floor plane
 */
import { useRef, useState, useMemo, Suspense, useCallback } from 'react';
import * as THREE from 'three';
import { ThreeEvent, useThree } from '@react-three/fiber';
import { Html, useTexture } from '@react-three/drei';
import { cn } from '@/lib/utils';
import { getFurnitureById, type PlacedAsset } from './boothFurnitureConfigs';

interface BoothFurniture3DProps {
  asset: PlacedAsset;
  isSelected: boolean;
  isDragMode: boolean;
  onSelect: (instanceId: string) => void;
  onPositionChange: (instanceId: string, position: [number, number, number]) => void;
}

/** Screen texture loader */
function ScreenTexture({ url }: { url: string }) {
  const tex = useTexture(url);
  tex.colorSpace = THREE.SRGBColorSpace;
  return <meshStandardMaterial map={tex} emissive="#111" emissiveIntensity={0.05} />;
}

export function BoothFurniture3D({
  asset,
  isSelected,
  isDragMode,
  onSelect,
  onPositionChange,
}: BoothFurniture3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const { raycaster, camera } = useThree();
  const floorPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);

  const config = getFurnitureById(asset.assetId);
  if (!config) return null;

  const size = asset.customSize || config.size;
  const color = asset.customColor || config.color;
  const [w, h, d] = size;

  // Drag handlers
  const handlePointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    onSelect(asset.instanceId);
    if (!isDragMode) return;
    setIsDragging(true);
    (e.target as HTMLElement)?.setPointerCapture?.(e.pointerId);
  }, [isDragMode, asset.instanceId, onSelect]);

  const handlePointerMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (!isDragging || !isDragMode) return;
    e.stopPropagation();
    const intersect = new THREE.Vector3();
    raycaster.ray.intersectPlane(floorPlane, intersect);
    if (intersect) {
      // Snap to 0.1m grid
      const x = Math.round(intersect.x * 10) / 10;
      const z = Math.round(intersect.z * 10) / 10;
      onPositionChange(asset.instanceId, [x, asset.position[1], z]);
    }
  }, [isDragging, isDragMode, raycaster, floorPlane, asset.instanceId, asset.position, onPositionChange]);

  const handlePointerUp = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (isDragging) {
      setIsDragging(false);
      (e.target as HTMLElement)?.releasePointerCapture?.(e.pointerId);
    }
  }, [isDragging]);

  const isTV = config.category === 'displays';
  const isBanner = config.id.startsWith('banner');
  const isTable = config.category === 'tables';
  const isStool = config.id === 'bar-stool';
  const isKiosk = config.id === 'kiosk-ipad';

  return (
    <group
      ref={groupRef}
      position={asset.position}
      rotation={asset.rotation}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => { setHovered(false); if (!isDragging) setIsDragging(false); }}
    >
      {/* Selection/hover indicator ring on floor */}
      {(isSelected || hovered) && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
          <ringGeometry args={[Math.max(w, d) * 0.6, Math.max(w, d) * 0.7, 32]} />
          <meshBasicMaterial
            color={isSelected ? '#3b82f6' : '#6366f1'}
            transparent
            opacity={0.5}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Main body */}
      {isTable ? (
        // Table: flat top + 4 legs
        <group>
          {/* Tabletop */}
          <mesh position={[0, h, 0]} castShadow>
            <boxGeometry args={[w, 0.03, d]} />
            <meshStandardMaterial color={color} roughness={0.4} metalness={0.1} />
          </mesh>
          {/* Legs */}
          {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([lx, lz], i) => (
            <mesh key={i} position={[lx * (w / 2 - 0.03), h / 2, lz * (d / 2 - 0.03)]}>
              <boxGeometry args={[0.03, h, 0.03]} />
              <meshStandardMaterial color={color} roughness={0.6} />
            </mesh>
          ))}
        </group>
      ) : isTV && config.id.includes('wall') ? (
        // Wall-mounted TV: flat panel
        <group>
          <mesh position={[0, h / 2, 0]} castShadow>
            <boxGeometry args={[w, h, d]} />
            <meshStandardMaterial color="#111" roughness={0.2} metalness={0.8} />
          </mesh>
          {/* Screen area */}
          {config.screenSize && (
            <mesh position={[0, h / 2, d / 2 + 0.001]}>
              <planeGeometry args={config.screenSize} />
              {asset.screenImageUrl ? (
                <Suspense fallback={<meshStandardMaterial color="#1a1a2e" />}>
                  <ScreenTexture url={asset.screenImageUrl} />
                </Suspense>
              ) : (
                <meshStandardMaterial color="#1a1a2e" emissive="#0a0a1a" emissiveIntensity={0.3} />
              )}
            </mesh>
          )}
        </group>
      ) : isTV ? (
        // Floor-standing TV: stand pole + screen
        <group>
          {/* Base plate */}
          <mesh position={[0, 0.02, 0]} castShadow>
            <boxGeometry args={[w * 0.6, 0.04, d]} />
            <meshStandardMaterial color="#222" roughness={0.3} metalness={0.6} />
          </mesh>
          {/* Pole */}
          <mesh position={[0, (config.screenYOffset || h * 0.6) / 2, 0]}>
            <cylinderGeometry args={[0.02, 0.025, config.screenYOffset || h * 0.6, 8]} />
            <meshStandardMaterial color="#333" roughness={0.3} metalness={0.7} />
          </mesh>
          {/* Screen */}
          {config.screenSize && (
            <group position={[0, (config.screenYOffset || 0) + config.screenSize[1] / 2, 0]}>
              <mesh castShadow>
                <boxGeometry args={[config.screenSize[0], config.screenSize[1], 0.05]} />
                <meshStandardMaterial color="#111" roughness={0.2} metalness={0.8} />
              </mesh>
              <mesh position={[0, 0, 0.026]}>
                <planeGeometry args={[config.screenSize[0] * 0.95, config.screenSize[1] * 0.92]} />
                {asset.screenImageUrl ? (
                  <Suspense fallback={<meshStandardMaterial color="#1a1a2e" />}>
                    <ScreenTexture url={asset.screenImageUrl} />
                  </Suspense>
                ) : (
                  <meshStandardMaterial color="#1a1a2e" emissive="#0a0a1a" emissiveIntensity={0.3} />
                )}
              </mesh>
            </group>
          )}
        </group>
      ) : isBanner ? (
        // Retractable banner
        <group>
          {/* Base */}
          <mesh position={[0, 0.02, 0]} castShadow>
            <boxGeometry args={[w, 0.04, d * 0.3]} />
            <meshStandardMaterial color="#333" roughness={0.4} metalness={0.5} />
          </mesh>
          {/* Banner surface */}
          {config.screenSize && (
            <mesh position={[0, config.screenSize[1] / 2 + 0.04, 0]}>
              <planeGeometry args={config.screenSize} />
              {asset.screenImageUrl ? (
                <Suspense fallback={<meshStandardMaterial color="#e2e8f0" />}>
                  <ScreenTexture url={asset.screenImageUrl} />
                </Suspense>
              ) : (
                <meshStandardMaterial color="#e2e8f0" side={THREE.DoubleSide} />
              )}
            </mesh>
          )}
        </group>
      ) : isStool ? (
        // Bar stool: seat + single pole + base
        <group>
          <mesh position={[0, 0.02, 0]}>
            <cylinderGeometry args={[w * 0.4, w * 0.5, 0.04, 16]} />
            <meshStandardMaterial color={color} roughness={0.5} metalness={0.4} />
          </mesh>
          <mesh position={[0, h / 2, 0]}>
            <cylinderGeometry args={[0.02, 0.02, h, 8]} />
            <meshStandardMaterial color="#666" roughness={0.3} metalness={0.6} />
          </mesh>
          <mesh position={[0, h, 0]} castShadow>
            <cylinderGeometry args={[w / 2, w / 2, 0.04, 16]} />
            <meshStandardMaterial color={color} roughness={0.6} />
          </mesh>
        </group>
      ) : (
        // Generic box
        <mesh position={[0, h / 2, 0]} castShadow>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial
            color={color}
            roughness={0.5}
            metalness={0.1}
            emissive={isSelected ? '#1e40af' : undefined}
            emissiveIntensity={isSelected ? 0.15 : 0}
          />
        </mesh>
      )}

      {/* Label */}
      <Html position={[0, h + 0.15, 0]} center distanceFactor={8} occlude={false}>
        <div className={cn(
          "px-1.5 py-0.5 rounded text-[9px] font-medium whitespace-nowrap select-none pointer-events-none",
          isSelected
            ? "bg-primary text-primary-foreground"
            : "bg-background/80 text-foreground border border-border/50"
        )}>
          {asset.label || config.name}
        </div>
      </Html>

      {/* Drag mode indicator */}
      {isDragMode && isSelected && (
        <Html position={[0, h + 0.35, 0]} center distanceFactor={8} occlude={false}>
          <div className="px-1.5 py-0.5 rounded bg-accent/90 text-accent-foreground text-[8px] font-mono whitespace-nowrap select-none pointer-events-none animate-pulse">
            ⊞ Drag to move
          </div>
        </Html>
      )}
    </group>
  );
}
