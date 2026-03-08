/**
 * ProceduralFigure — Stylized geometric human figures as fallback
 * when billboard sprites are not available.
 */
import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';

interface ProceduralFigureProps {
  position: [number, number, number];
  rotation?: number;
  opacity?: number;
  height?: number;
  isStaff?: boolean;
}

const SKIN_TONES = ['#e8beac', '#c68642', '#8d5524', '#f1c27d', '#ffdbac'];
const SHIRT_COLORS = ['#334155', '#1e3a5f', '#4a5568', '#2d3748', '#1a365d'];
const STAFF_SHIRT = '#1e40af';

export function ProceduralFigure({
  position,
  rotation = 0,
  opacity = 1,
  height = 1.75,
  isStaff = false,
}: ProceduralFigureProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  // Deterministic color from position
  const seed = Math.abs(Math.round(position[0] * 100 + position[2] * 37));
  const skinColor = SKIN_TONES[seed % SKIN_TONES.length];
  const shirtColor = isStaff ? STAFF_SHIRT : SHIRT_COLORS[seed % SHIRT_COLORS.length];
  const pantsColor = '#1e293b';

  const scale = height / 1.75;

  // Billboard: face camera
  useFrame(() => {
    if (groupRef.current) {
      const cam = new THREE.Vector3();
      camera.getWorldPosition(cam);
      const me = new THREE.Vector3();
      groupRef.current.getWorldPosition(me);
      groupRef.current.rotation.y = Math.atan2(cam.x - me.x, cam.z - me.z);
    }
  });

  return (
    <group ref={groupRef} position={position} scale={[scale, scale, scale]}>
      {/* Head */}
      <mesh position={[0, 1.58, 0]}>
        <sphereGeometry args={[0.12, 16, 12]} />
        <meshStandardMaterial color={skinColor} transparent opacity={opacity} />
      </mesh>
      {/* Torso */}
      <mesh position={[0, 1.2, 0]}>
        <capsuleGeometry args={[0.14, 0.36, 8, 12]} />
        <meshStandardMaterial color={shirtColor} transparent opacity={opacity} />
      </mesh>
      {/* Legs */}
      <mesh position={[-0.06, 0.65, 0]}>
        <capsuleGeometry args={[0.065, 0.45, 6, 8]} />
        <meshStandardMaterial color={pantsColor} transparent opacity={opacity} />
      </mesh>
      <mesh position={[0.06, 0.65, 0]}>
        <capsuleGeometry args={[0.065, 0.45, 6, 8]} />
        <meshStandardMaterial color={pantsColor} transparent opacity={opacity} />
      </mesh>
      {/* Contact shadow */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.2, 16]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.15 * opacity} depthWrite={false} />
      </mesh>
    </group>
  );
}
