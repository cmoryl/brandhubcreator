/**
 * BoothPanel3D - A single clickable panel in 3D space with image texture
 * Includes optional safe zone overlay using real production spec zones
 */
import { useRef, useState, useMemo, Suspense } from 'react';
import * as THREE from 'three';
import { useTexture } from '@react-three/drei';
import { Html } from '@react-three/drei';
import type { PanelConfig } from './boothConfigs';
import type { PanelZones } from './specParser';

interface BoothPanel3DProps {
  panel: PanelConfig;
  isSelected: boolean;
  onSelect: (panelId: string) => void;
  showLabels: boolean;
  showDimensions: boolean;
  showSafeZones?: boolean;
}

/** Inner component that loads and displays the texture */
function TexturedPanel({ imageUrl, isSelected }: { imageUrl: string; isSelected: boolean }) {
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

/** Build a dashed rectangle from points */
function useDashedRect(w: number, h: number) {
  return useMemo(() => {
    const hw = w / 2;
    const hh = h / 2;
    const points = [
      new THREE.Vector3(-hw, hh, 0),
      new THREE.Vector3(hw, hh, 0),
      new THREE.Vector3(hw, -hh, 0),
      new THREE.Vector3(-hw, -hh, 0),
      new THREE.Vector3(-hw, hh, 0),
    ];
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    geo.computeBoundingSphere();
    return geo;
  }, [w, h]);
}

/** Build corner bracket marks */
function useCornerBrackets(w: number, h: number) {
  return useMemo(() => {
    const hw = w / 2;
    const hh = h / 2;
    const bLen = Math.min(w, h) * 0.06;
    const points: THREE.Vector3[] = [];
    // TL
    points.push(new THREE.Vector3(-hw, hh - bLen, 0), new THREE.Vector3(-hw, hh, 0));
    points.push(new THREE.Vector3(-hw, hh, 0), new THREE.Vector3(-hw + bLen, hh, 0));
    // TR
    points.push(new THREE.Vector3(hw - bLen, hh, 0), new THREE.Vector3(hw, hh, 0));
    points.push(new THREE.Vector3(hw, hh, 0), new THREE.Vector3(hw, hh - bLen, 0));
    // BR
    points.push(new THREE.Vector3(hw, -hh + bLen, 0), new THREE.Vector3(hw, -hh, 0));
    points.push(new THREE.Vector3(hw, -hh, 0), new THREE.Vector3(hw - bLen, -hh, 0));
    // BL
    points.push(new THREE.Vector3(-hw + bLen, -hh, 0), new THREE.Vector3(-hw, -hh, 0));
    points.push(new THREE.Vector3(-hw, -hh, 0), new THREE.Vector3(-hw, -hh + bLen, 0));
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [w, h]);
}

/**
 * Safe zone overlay using real production spec zones when available.
 * Falls back to calculated insets when no spec data present.
 * 
 * Zones (from spec):
 * - Green (Visual): Keep all critical text/logos within this area
 * - Yellow (Cut): Graphic will be cut on this line during finishing
 * - Red (Bleed): Full design must extend to this outer boundary
 */
function SafeZoneOverlay({ size, zones }: { size: [number, number]; zones?: PanelZones }) {
  const hasSpecZones = zones?.visualSize || zones?.cutSize || zones?.bleedSize;

  // Compute zone dimensions in meters
  const visualW = zones?.visualSize?.[0] ?? (size[0] - 0.10);
  const visualH = zones?.visualSize?.[1] ?? (size[1] - 0.10);
  const cutW = zones?.cutSize?.[0] ?? (size[0] - 0.04);
  const cutH = zones?.cutSize?.[1] ?? (size[1] - 0.04);
  const bleedW = zones?.bleedSize?.[0] ?? size[0];
  const bleedH = zones?.bleedSize?.[1] ?? size[1];

  // Geometries
  const visualGeo = useDashedRect(visualW, visualH);
  const cutGeo = useDashedRect(cutW, cutH);
  const bleedGeo = useDashedRect(bleedW, bleedH);
  const bracketGeo = useCornerBrackets(visualW, visualH);

  // Calculate inset from bleed to visual in inches for label
  const insetW = ((bleedW - visualW) / 2 / 0.0254).toFixed(1);
  const insetH = ((bleedH - visualH) / 2 / 0.0254).toFixed(1);

  // Format dimensions for labels
  const fmtDim = (w: number, h: number) => 
    `${(w / 0.0254).toFixed(1)}" × ${(h / 0.0254).toFixed(1)}"`;

  return (
    <group position={[0, 0, 0.005]}>
      {/* Bleed line (red, outermost) */}
      <line>
        <primitive object={bleedGeo} attach="geometry" />
        <lineDashedMaterial
          color="#ef4444"
          dashSize={0.04}
          gapSize={0.06}
          linewidth={1}
          opacity={0.6}
          transparent
        />
      </line>

      {/* Cut line (amber/yellow, middle) */}
      <line>
        <primitive object={cutGeo} attach="geometry" />
        <lineDashedMaterial
          color="#f59e0b"
          dashSize={0.05}
          gapSize={0.04}
          linewidth={1}
          opacity={0.6}
          transparent
        />
      </line>

      {/* Visual / safe area (green, innermost) */}
      <line>
        <primitive object={visualGeo} attach="geometry" />
        <lineDashedMaterial
          color="#22c55e"
          dashSize={0.06}
          gapSize={0.03}
          linewidth={1}
          opacity={0.8}
          transparent
        />
      </line>

      {/* Corner brackets on visual zone */}
      <lineSegments>
        <primitive object={bracketGeo} attach="geometry" />
        <lineBasicMaterial color="#22c55e" linewidth={2} opacity={0.9} transparent />
      </lineSegments>

      {/* Zone labels */}
      <Html
        position={[0, bleedH / 2 + 0.12, 0]}
        center
        distanceFactor={8}
        style={{ pointerEvents: 'none' }}
      >
        <div className="flex flex-col items-center gap-1">
          {zones?.specTitle && (
            <span className="px-2 py-0.5 rounded text-[9px] font-semibold bg-background/90 text-foreground border border-border whitespace-nowrap">
              {zones.specTitle}
            </span>
          )}
          <div className="flex items-center gap-1 text-[8px] font-mono whitespace-nowrap">
            <span className="px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/30">
              Visual {hasSpecZones ? fmtDim(visualW, visualH) : `${insetW}" inset`}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
              Cut {hasSpecZones ? fmtDim(cutW, cutH) : ''}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
              Bleed {hasSpecZones ? fmtDim(bleedW, bleedH) : ''}
            </span>
          </div>
        </div>
      </Html>

      {/* Solid color only warning */}
      {zones?.solidColorOnly && (
        <Html position={[0, 0, 0.01]} center distanceFactor={8} style={{ pointerEvents: 'none' }}>
          <div className="px-3 py-1.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-semibold">
            SOLID COLOR ONLY
          </div>
        </Html>
      )}

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
            <TexturedPanel imageUrl={panel.imageUrl} isSelected={isSelected} />
          </Suspense>
        ) : (
          <EmptyPanel hovered={hovered} isSelected={isSelected} />
        )}
      </mesh>

      {/* Safe zone overlay with production spec zones */}
      {showSafeZones && <SafeZoneOverlay size={panel.size} zones={panel.zones} />}

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
      {!panel.imageUrl && !panel.zones?.solidColorOnly && (
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
