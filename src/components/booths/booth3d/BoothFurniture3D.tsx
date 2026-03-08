/**
 * BoothFurniture3D - 3D furniture / asset models for booth scene
 * Supports drag-and-drop repositioning on the floor plane
 * Table covers with custom fabric colors and image mapping
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

/** Table cover front-panel image texture */
function CoverImageTexture({ url, color }: { url: string; color: string }) {
  const tex = useTexture(url);
  tex.colorSpace = THREE.SRGBColorSpace;
  return (
    <meshStandardMaterial
      map={tex}
      color={color}
      roughness={0.75}
      metalness={0.02}
      side={THREE.DoubleSide}
    />
  );
}

/** Table cover 3D rendering — fitted, draped, or throw style */
function TableCover3D({
  w, h, d,
  coverColor,
  coverImageUrl,
  coverStyle = 'fitted',
}: {
  w: number; h: number; d: number;
  coverColor: string;
  coverImageUrl?: string;
  coverStyle?: 'fitted' | 'draped' | 'throw';
}) {
  const fabricMat = useMemo(() => ({
    color: coverColor,
    roughness: 0.8,
    metalness: 0.02,
    side: THREE.DoubleSide as THREE.Side,
  }), [coverColor]);

  const overhang = coverStyle === 'throw' ? 0.06 : coverStyle === 'draped' ? 0.03 : 0.01;
  const dropLength = coverStyle === 'throw' ? h + 0.02 : coverStyle === 'draped' ? h * 0.85 : h;
  const coverW = w + overhang * 2;
  const coverD = d + overhang * 2;

  return (
    <group>
      {/* Top surface */}
      <mesh position={[0, h + 0.005, 0]} receiveShadow>
        <boxGeometry args={[coverW, 0.008, coverD]} />
        <meshStandardMaterial {...fabricMat} />
      </mesh>

      {/* Front drape (primary — receives image) */}
      <mesh position={[0, h - dropLength / 2, d / 2 + overhang]} receiveShadow castShadow>
        <planeGeometry args={[coverW, dropLength]} />
        {coverImageUrl ? (
          <Suspense fallback={<meshStandardMaterial {...fabricMat} />}>
            <CoverImageTexture url={coverImageUrl} color={coverColor} />
          </Suspense>
        ) : (
          <meshStandardMaterial {...fabricMat} />
        )}
      </mesh>

      {/* Back drape */}
      <mesh position={[0, h - dropLength / 2, -(d / 2 + overhang)]} rotation={[0, Math.PI, 0]} receiveShadow>
        <planeGeometry args={[coverW, dropLength]} />
        <meshStandardMaterial {...fabricMat} />
      </mesh>

      {/* Left side drape */}
      <mesh position={[-(w / 2 + overhang), h - dropLength / 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[coverD, dropLength]} />
        <meshStandardMaterial {...fabricMat} />
      </mesh>

      {/* Right side drape */}
      <mesh position={[w / 2 + overhang, h - dropLength / 2, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[coverD, dropLength]} />
        <meshStandardMaterial {...fabricMat} />
      </mesh>

      {/* Subtle bottom edge fold for throw/draped styles */}
      {coverStyle !== 'fitted' && (
        <>
          {/* Front bottom fold */}
          <mesh position={[0, h - dropLength - 0.005, d / 2 + overhang - 0.005]} receiveShadow>
            <boxGeometry args={[coverW, 0.01, 0.015]} />
            <meshStandardMaterial {...fabricMat} />
          </mesh>
          {/* Back bottom fold */}
          <mesh position={[0, h - dropLength - 0.005, -(d / 2 + overhang - 0.005)]} receiveShadow>
            <boxGeometry args={[coverW, 0.01, 0.015]} />
            <meshStandardMaterial {...fabricMat} />
          </mesh>
        </>
      )}
    </group>
  );
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
  const wallPlaneRef = useRef(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0));

  const config = getFurnitureById(asset.assetId);

  const size = config ? (asset.customSize || config.size) : [1, 1, 1] as [number, number, number];
  const color = config ? (asset.customColor || config.color) : '#666';
  const [w, h, d] = size;

  const isWallMount = config?.wallMountable === true;

  // Drag handlers
  const handlePointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    onSelect(asset.instanceId);
    if (!isDragMode) return;
    setIsDragging(true);
    (e.target as HTMLElement)?.setPointerCapture?.(e.pointerId);

    // For wall-mounted items, set the drag plane to face the camera through the asset
    if (isWallMount) {
      const cameraDir = new THREE.Vector3();
      camera.getWorldDirection(cameraDir);
      // Use camera's forward direction projected onto XZ to get a stable vertical plane
      cameraDir.y = 0;
      cameraDir.normalize();
      wallPlaneRef.current.setFromNormalAndCoplanarPoint(
        cameraDir,
        new THREE.Vector3(...asset.position)
      );
    }
  }, [isDragMode, asset.instanceId, asset.position, onSelect, isWallMount, camera]);

  const handlePointerMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (!isDragging || !isDragMode) return;
    e.stopPropagation();
    const intersect = new THREE.Vector3();

    if (isWallMount) {
      // Drag on vertical plane — moves X and Y
      raycaster.ray.intersectPlane(wallPlaneRef.current, intersect);
      if (intersect) {
        const x = Math.round(intersect.x * 10) / 10;
        const y = Math.max(0.1, Math.round(intersect.y * 10) / 10); // clamp above floor
        onPositionChange(asset.instanceId, [x, y, asset.position[2]]);
      }
    } else {
      // Drag on floor plane — moves X and Z
      raycaster.ray.intersectPlane(floorPlane, intersect);
      if (intersect) {
        const x = Math.round(intersect.x * 10) / 10;
        const z = Math.round(intersect.z * 10) / 10;
        onPositionChange(asset.instanceId, [x, asset.position[1], z]);
      }
    }
  }, [isDragging, isDragMode, raycaster, floorPlane, isWallMount, asset.instanceId, asset.position, onPositionChange]);

  const handlePointerUp = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (isDragging) {
      setIsDragging(false);
      (e.target as HTMLElement)?.releasePointerCapture?.(e.pointerId);
    }
  }, [isDragging]);

  if (!config) return null;

  const isTV = config.category === 'displays';
  const isBanner = config.id.startsWith('banner');
  const isTable = config.category === 'tables';
  const isStool = config.id === 'bar-stool';
  const isKiosk = config.id === 'kiosk-ipad';
  const isRug = config.category === 'flooring';
  const isRoundRug = config.id === 'rug-round';
  const hasCover = config.hasTableCover && asset.tableCoverColor;

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

          {/* Table Cover */}
          {hasCover && (
            <TableCover3D
              w={w}
              h={h}
              d={d}
              coverColor={asset.tableCoverColor!}
              coverImageUrl={asset.tableCoverImageUrl}
              coverStyle={asset.tableCoverStyle || 'fitted'}
            />
          )}
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
      ) : isRug ? (
        // Rug / carpet — flat on floor with fabric material
        <group>
          {isRoundRug ? (
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} receiveShadow>
              <circleGeometry args={[w / 2, 48]} />
              <meshStandardMaterial
                color={color}
                roughness={0.9}
                metalness={0}
                side={THREE.DoubleSide}
              />
            </mesh>
          ) : (
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} receiveShadow>
              <planeGeometry args={[w, d]} />
              <meshStandardMaterial
                color={color}
                roughness={0.9}
                metalness={0}
                side={THREE.DoubleSide}
              />
            </mesh>
          )}
          {/* Subtle border/fringe edge */}
          {isRoundRug ? (
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}>
              <ringGeometry args={[w / 2 - 0.02, w / 2, 48]} />
              <meshStandardMaterial color={color} roughness={0.85} metalness={0} opacity={0.6} transparent side={THREE.DoubleSide} />
            </mesh>
          ) : (
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}>
              <planeGeometry args={[w + 0.04, d + 0.04]} />
              <meshStandardMaterial color={color} roughness={0.85} metalness={0} opacity={0.4} transparent side={THREE.DoubleSide} />
            </mesh>
          )}
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
          {hasCover && (
            <span className="ml-1 text-[8px] opacity-70">🎨</span>
          )}
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
