/**
 * BoothPanel3D - A single clickable panel in 3D space with image texture
 */
import { useRef, useState, Suspense } from 'react';
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

export function BoothPanel3D({ panel, isSelected, onSelect, showLabels, showDimensions }: BoothPanel3DProps) {
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
            {widthFt}' × {heightFt}'
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
