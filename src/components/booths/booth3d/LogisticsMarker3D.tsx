/**
 * LogisticsMarker3D — 3D markers rendered in the booth scene
 * showing operational logistics points (power, internet, rigging, etc.)
 */
import { useRef } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import type { LogisticsMarker } from './logisticsTypes';
import { getCategoryConfig } from './logisticsTypes';

interface LogisticsMarker3DProps {
  marker: LogisticsMarker;
  selected?: boolean;
  onClick?: () => void;
}

export function LogisticsMarkerMesh({ marker, selected, onClick }: LogisticsMarker3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const config = getCategoryConfig(marker.category);

  // Parse hsl color to Three.js
  const color = new THREE.Color(config.color);

  // Rigging points float high, others at floor level
  const [x, y, z] = marker.position;
  const displayY = marker.category === 'rigging' ? Math.max(y, 2.8) : y;

  return (
    <group position={[x, displayY, z]}>
      {/* Pin / marker body */}
      <mesh
        ref={meshRef}
        onClick={(e) => { e.stopPropagation(); onClick?.(); }}
        castShadow
      >
        <cylinderGeometry args={[0.08, 0.12, 0.04, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={selected ? 0.6 : 0.2}
          metalness={0.3}
          roughness={0.5}
        />
      </mesh>

      {/* Glow ring when selected */}
      {selected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
          <ringGeometry args={[0.15, 0.25, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.5} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Vertical line from floor to marker (for elevated markers) */}
      {displayY > 0.1 && (
        <line>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={2}
              array={new Float32Array([0, 0, 0, 0, -displayY, 0])}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color={color} transparent opacity={0.4} />
        </line>
      )}

      {/* HTML label overlay */}
      <Html
        position={[0, 0.15, 0]}
        center
        distanceFactor={8}
        occlude={false}
        style={{ pointerEvents: 'none' }}
      >
        <div
          className="flex items-center gap-1 px-1.5 py-0.5 rounded-full shadow-md border whitespace-nowrap"
          style={{
            backgroundColor: 'hsl(var(--background) / 0.92)',
            borderColor: config.color,
            fontSize: '9px',
            fontWeight: 600,
            color: config.color,
            backdropFilter: 'blur(4px)',
          }}
        >
          <span>{config.emoji}</span>
          <span>{marker.label}</span>
          {marker.spec && (
            <span style={{ opacity: 0.7, fontSize: '8px' }}>· {marker.spec}</span>
          )}
        </div>
      </Html>

      {/* Floor marker disc */}
      {displayY <= 0.1 && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
          <circleGeometry args={[0.2, 24]} />
          <meshStandardMaterial
            color={color}
            transparent
            opacity={selected ? 0.5 : 0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
}

/* Container that renders all logistics markers */
interface LogisticsOverlay3DProps {
  markers: LogisticsMarker[];
  visible: boolean;
  selectedMarkerId?: string | null;
  onSelectMarker?: (id: string) => void;
}

export function LogisticsOverlay3D({ markers, visible, selectedMarkerId, onSelectMarker }: LogisticsOverlay3DProps) {
  if (!visible || markers.length === 0) return null;

  return (
    <group>
      {markers.map(marker => (
        <LogisticsMarkerMesh
          key={marker.id}
          marker={marker}
          selected={selectedMarkerId === marker.id}
          onClick={() => onSelectMarker?.(marker.id)}
        />
      ))}
    </group>
  );
}
