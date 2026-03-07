/**
 * BoothPanel3D - A single clickable panel in 3D space with image texture
 * Includes optional safe zone overlay for print production guidelines
 */
import { useRef, useState, useMemo, Suspense } from 'react';
import * as THREE from 'three';
import { useTexture } from '@react-three/drei';
import { Html } from '@react-three/drei';
import type { PanelConfig } from './boothConfigs';

interface BoothPanel3DProps {
  panel: PanelConfig;
  isSelected: boolean;
  onSelect: (panelId: string) => void;
  showLabels: boolean;
  showDimensions: boolean;
  showSafeZones?: boolean;
}

/** Inner component that loads and displays the texture */
function TexturedPanel({ imageUrl, size, isSelected }: { imageUrl: string; size: [number, number]; isSelected: boolean }) {
  const texture = useTexture(imageUrl);
  texture.colorSpace = THREE.SRGBColorSpace;

  return (
    <meshStandardMaterial
      map={texture}
      side={THREE.DoubleSide}
      emissive={isSelected ? new THREE.Color('#1e40af') : undefined}
      emissiveIntensity={isSelected ? 0.1 : 0}
    />
  );
}

function EmptyPanel({ hovered, isSelected }: { hovered: boolean; isSelected: boolean }) {
  return (
    <meshStandardMaterial
      color={hovered ? '#1e293b' : '#0f172a'}
      side={THREE.DoubleSide}
      emissive={isSelected ? new THREE.Color('#1e40af') : undefined}
      emissiveIntensity={isSelected ? 0.2 : 0}
    />
  );
}

/**
 * Safe zone overlay — dashed rectangle inset from panel edges
 * Standard production safe zone: ~2 inches (≈0.05m) from each edge at 150 DPI
 */
function SafeZoneOverlay({ size }: { size: [number, number] }) {
  const INSET = 0.06; // ~2.4 inches inset (production safe zone)
  const innerW = size[0] - INSET * 2;
  const innerH = size[1] - INSET * 2;

  // Build dashed rectangle geometry
  const lineGeometry = useMemo(() => {
    const hw = innerW / 2;
    const hh = innerH / 2;
    const segments = 80;
    const points: THREE.Vector3[] = [];

    // Create the rectangle perimeter as a series of points
    const corners = [
      new THREE.Vector3(-hw, hh, 0),
      new THREE.Vector3(hw, hh, 0),
      new THREE.Vector3(hw, -hh, 0),
      new THREE.Vector3(-hw, -hh, 0),
      new THREE.Vector3(-hw, hh, 0), // close
    ];

    // Interpolate points along edges for dashing
    for (let side = 0; side < 4; side++) {
      const from = corners[side];
      const to = corners[side + 1];
      const perSide = Math.ceil(segments / 4);
      for (let i = 0; i < perSide; i++) {
        const t = i / perSide;
        points.push(new THREE.Vector3(
          from.x + (to.x - from.x) * t,
          from.y + (to.y - from.y) * t,
          0
        ));
      }
    }

    const geo = new THREE.BufferGeometry().setFromPoints(points);
    return geo;
  }, [innerW, innerH]);

  // Corner bracket marks for visual emphasis
  const bracketGeometry = useMemo(() => {
    const hw = innerW / 2;
    const hh = innerH / 2;
    const bLen = Math.min(innerW, innerH) * 0.08; // bracket arm length
    const points: THREE.Vector3[] = [];

    // Top-left
    points.push(new THREE.Vector3(-hw, hh - bLen, 0), new THREE.Vector3(-hw, hh, 0));
    points.push(new THREE.Vector3(-hw, hh, 0), new THREE.Vector3(-hw + bLen, hh, 0));
    // Top-right
    points.push(new THREE.Vector3(hw - bLen, hh, 0), new THREE.Vector3(hw, hh, 0));
    points.push(new THREE.Vector3(hw, hh, 0), new THREE.Vector3(hw, hh - bLen, 0));
    // Bottom-right
    points.push(new THREE.Vector3(hw, -hh + bLen, 0), new THREE.Vector3(hw, -hh, 0));
    points.push(new THREE.Vector3(hw, -hh, 0), new THREE.Vector3(hw - bLen, -hh, 0));
    // Bottom-left
    points.push(new THREE.Vector3(-hw + bLen, -hh, 0), new THREE.Vector3(-hw, -hh, 0));
    points.push(new THREE.Vector3(-hw, -hh, 0), new THREE.Vector3(-hw, -hh + bLen, 0));

    const geo = new THREE.BufferGeometry().setFromPoints(points);
    return geo;
  }, [innerW, innerH]);

  // Bleed zone (outer dashed line, very close to edge)
  const bleedGeometry = useMemo(() => {
    const bleedInset = 0.02; // ~0.8 inch from edge
    const bw = size[0] - bleedInset * 2;
    const bh = size[1] - bleedInset * 2;
    const hw = bw / 2;
    const hh = bh / 2;
    const points = [
      new THREE.Vector3(-hw, hh, 0),
      new THREE.Vector3(hw, hh, 0),
      new THREE.Vector3(hw, -hh, 0),
      new THREE.Vector3(-hw, -hh, 0),
      new THREE.Vector3(-hw, hh, 0),
    ];
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [size]);

  // Inset in feet for label
  const insetInches = (INSET / 0.0254).toFixed(1);

  return (
    <group position={[0, 0, 0.005]}>
      {/* Bleed line (red, outer) */}
      <line>
        <primitive object={bleedGeometry} attach="geometry" />
        <lineDashedMaterial
          color="#ef4444"
          dashSize={0.04}
          gapSize={0.06}
          linewidth={1}
          opacity={0.5}
          transparent
        />
      </line>

      {/* Safe zone dashed line (green) */}
      <line>
        <primitive object={lineGeometry} attach="geometry" />
        <lineDashedMaterial
          color="#22c55e"
          dashSize={0.06}
          gapSize={0.04}
          linewidth={1}
          opacity={0.7}
          transparent
        />
      </line>

      {/* Corner brackets (bright green, solid) */}
      <lineSegments>
        <primitive object={bracketGeometry} attach="geometry" />
        <lineBasicMaterial color="#22c55e" linewidth={2} opacity={0.9} transparent />
      </lineSegments>

      {/* Safe zone label */}
      <Html
        position={[0, innerH / 2 + 0.08, 0]}
        center
        distanceFactor={8}
        style={{ pointerEvents: 'none' }}
      >
        <div className="flex items-center gap-1.5 text-[9px] font-mono whitespace-nowrap">
          <span className="px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/30">
            Safe Zone ({insetInches}" inset)
          </span>
          <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
            Bleed
          </span>
        </div>
      </Html>

      {/* Center crosshair */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={4}
            array={new Float32Array([
              -0.05, 0, 0,
              0.05, 0, 0,
              0, -0.05, 0,
              0, 0.05, 0,
            ])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#22c55e" opacity={0.4} transparent />
      </lineSegments>
    </group>
  );
}

export function BoothPanel3D({ panel, isSelected, onSelect, showLabels, showDimensions, showSafeZones = false }: BoothPanel3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const borderColor = isSelected
    ? '#3b82f6'
    : hovered
    ? '#60a5fa'
    : '#374151';

  // Convert meters to feet for display
  const widthFt = (panel.size[0] * 3.28).toFixed(0);
  const heightFt = (panel.size[1] * 3.28).toFixed(0);

  return (
    <group position={panel.position} rotation={panel.rotation}>
      {/* Panel mesh */}
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(panel.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'default';
        }}
      >
        <planeGeometry args={[panel.size[0], panel.size[1]]} />
        {panel.imageUrl ? (
          <Suspense fallback={<EmptyPanel hovered={hovered} isSelected={isSelected} />}>
            <TexturedPanel imageUrl={panel.imageUrl} size={panel.size} isSelected={isSelected} />
          </Suspense>
        ) : (
          <EmptyPanel hovered={hovered} isSelected={isSelected} />
        )}
      </mesh>

      {/* Safe zone overlay */}
      {showSafeZones && <SafeZoneOverlay size={panel.size} />}

      {/* Selection border */}
      <lineSegments>
        <edgesGeometry args={[new THREE.PlaneGeometry(panel.size[0], panel.size[1])]} />
        <lineBasicMaterial color={borderColor} linewidth={2} />
      </lineSegments>

      {/* Label */}
      {showLabels && (
        <Html
          position={[0, panel.size[1] / 2 + 0.2, 0.01]}
          center
          distanceFactor={8}
          style={{ pointerEvents: 'none' }}
        >
          <div className="bg-background/90 backdrop-blur-sm border border-border rounded px-2 py-0.5 text-xs font-medium text-foreground whitespace-nowrap shadow-sm">
            {panel.label}
            {!panel.imageUrl && (
              <span className="text-muted-foreground ml-1">· empty</span>
            )}
          </div>
        </Html>
      )}

      {/* Dimensions overlay */}
      {showDimensions && (
        <Html
          position={[0, -panel.size[1] / 2 - 0.2, 0.01]}
          center
          distanceFactor={8}
          style={{ pointerEvents: 'none' }}
        >
          <div className="text-[10px] text-muted-foreground font-mono whitespace-nowrap">
            {panel.specLabel || `${widthFt}' × ${heightFt}'`}
          </div>
        </Html>
      )}

      {/* Empty state indicator */}
      {!panel.imageUrl && (
        <Html position={[0, 0, 0.01]} center distanceFactor={8} style={{ pointerEvents: 'none' }}>
          <div className="flex flex-col items-center text-muted-foreground/60">
            <svg className="w-8 h-8 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
            </svg>
            <span className="text-xs">Click to assign</span>
          </div>
        </Html>
      )}
    </group>
  );
}
