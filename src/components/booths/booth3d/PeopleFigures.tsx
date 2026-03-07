/**
 * PeopleFigures - Stylized human silhouettes for scale reference and spatial flow
 * 
 * Uses procedural geometry to create abstract human figures at correct 
 * anthropometric proportions (average 5'9" / 1.75m standing height).
 */
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

const HUMAN_HEIGHT = 1.75; // meters - average adult height
const HEAD_RADIUS = 0.1;
const TORSO_HEIGHT = 0.55;
const LEG_HEIGHT = 0.85;

interface FigureProps {
  position: [number, number, number];
  rotation?: number; // Y-axis rotation in radians
  color?: string;
  opacity?: number;
  /** Animation: idle sway */
  animated?: boolean;
}

/** Single stylized human figure */
function HumanFigure({ position, rotation = 0, color = '#64748b', opacity = 0.7, animated = true }: FigureProps) {
  const groupRef = useRef<THREE.Group>(null);
  const swayOffset = useMemo(() => Math.random() * Math.PI * 2, []);
  const swaySpeed = useMemo(() => 0.3 + Math.random() * 0.4, []);

  useFrame((state) => {
    if (animated && groupRef.current) {
      // Subtle idle sway
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * swaySpeed + swayOffset) * 0.015;
    }
  });

  const headY = LEG_HEIGHT + TORSO_HEIGHT + HEAD_RADIUS + 0.02;
  const torsoY = LEG_HEIGHT + TORSO_HEIGHT / 2;
  const legY = LEG_HEIGHT / 2;

  return (
    <group ref={groupRef} position={position} rotation={[0, rotation, 0]}>
      {/* Head */}
      <mesh position={[0, headY, 0]} castShadow>
        <sphereGeometry args={[HEAD_RADIUS, 12, 8]} />
        <meshStandardMaterial color={color} transparent opacity={opacity} roughness={0.8} />
      </mesh>
      {/* Neck */}
      <mesh position={[0, LEG_HEIGHT + TORSO_HEIGHT + 0.01, 0]}>
        <cylinderGeometry args={[0.035, 0.04, 0.05, 8]} />
        <meshStandardMaterial color={color} transparent opacity={opacity} roughness={0.8} />
      </mesh>
      {/* Torso */}
      <mesh position={[0, torsoY, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.14, TORSO_HEIGHT, 8]} />
        <meshStandardMaterial color={color} transparent opacity={opacity} roughness={0.8} />
      </mesh>
      {/* Shoulders */}
      <mesh position={[0, LEG_HEIGHT + TORSO_HEIGHT * 0.85, 0]}>
        <boxGeometry args={[0.35, 0.06, 0.12]} />
        <meshStandardMaterial color={color} transparent opacity={opacity} roughness={0.8} />
      </mesh>
      {/* Left leg */}
      <mesh position={[-0.06, legY, 0]} castShadow>
        <cylinderGeometry args={[0.045, 0.05, LEG_HEIGHT, 8]} />
        <meshStandardMaterial color={color} transparent opacity={opacity} roughness={0.8} />
      </mesh>
      {/* Right leg */}
      <mesh position={[0.06, legY, 0]} castShadow>
        <cylinderGeometry args={[0.045, 0.05, LEG_HEIGHT, 8]} />
        <meshStandardMaterial color={color} transparent opacity={opacity} roughness={0.8} />
      </mesh>
      {/* Left arm */}
      <mesh position={[-0.2, LEG_HEIGHT + TORSO_HEIGHT * 0.5, 0]} rotation={[0, 0, 0.1]}>
        <cylinderGeometry args={[0.03, 0.035, 0.5, 8]} />
        <meshStandardMaterial color={color} transparent opacity={opacity} roughness={0.8} />
      </mesh>
      {/* Right arm */}
      <mesh position={[0.2, LEG_HEIGHT + TORSO_HEIGHT * 0.5, 0]} rotation={[0, 0, -0.1]}>
        <cylinderGeometry args={[0.03, 0.035, 0.5, 8]} />
        <meshStandardMaterial color={color} transparent opacity={opacity} roughness={0.8} />
      </mesh>
    </group>
  );
}

/** Height reference marker showing human scale */
function HeightMarker({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Vertical measurement line */}
      <mesh position={[0, HUMAN_HEIGHT / 2, 0]}>
        <boxGeometry args={[0.005, HUMAN_HEIGHT, 0.005]} />
        <meshBasicMaterial color="#94a3b8" />
      </mesh>
      {/* Top tick */}
      <mesh position={[0, HUMAN_HEIGHT, 0]}>
        <boxGeometry args={[0.15, 0.005, 0.005]} />
        <meshBasicMaterial color="#94a3b8" />
      </mesh>
      {/* Bottom tick */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.15, 0.005, 0.005]} />
        <meshBasicMaterial color="#94a3b8" />
      </mesh>
    </group>
  );
}

interface PeopleFiguresProps {
  layout: 'inline' | 'l-shape' | 'u-shape' | 'island';
}

export function PeopleFigures({ layout }: PeopleFiguresProps) {
  const figures = useMemo(() => {
    const base: FigureProps[] = [];

    // Visitors in front of booth - varies by layout size
    if (layout === 'inline') {
      // Small booth: 2-3 visitors
      base.push(
        { position: [0.8, 0, 2.5], rotation: Math.PI * 0.9, color: '#475569' },
        { position: [-0.5, 0, 2.8], rotation: Math.PI * 1.1, color: '#64748b' },
        { position: [0.1, 0, 3.2], rotation: Math.PI, color: '#94a3b8' },
      );
    } else if (layout === 'l-shape') {
      base.push(
        { position: [0.5, 0, 2.5], rotation: Math.PI * 0.85, color: '#475569' },
        { position: [-1.5, 0, 1.8], rotation: Math.PI * 0.6, color: '#64748b' },
        { position: [1.2, 0, 3], rotation: Math.PI, color: '#94a3b8' },
        { position: [-2, 0, 2.8], rotation: Math.PI * 0.7, color: '#64748b' },
      );
    } else if (layout === 'u-shape') {
      base.push(
        { position: [0, 0, 2.5], rotation: Math.PI, color: '#475569' },
        { position: [1.2, 0, 2.2], rotation: Math.PI * 0.8, color: '#64748b' },
        { position: [-1.2, 0, 2.2], rotation: Math.PI * 1.2, color: '#94a3b8' },
        { position: [0.6, 0, 3.5], rotation: Math.PI * 0.95, color: '#475569' },
        { position: [-0.8, 0, 3.8], rotation: Math.PI * 1.05, color: '#64748b' },
      );
    } else {
      // Island: visitors on all sides
      base.push(
        { position: [0, 0, 5], rotation: Math.PI, color: '#475569' },
        { position: [2, 0, 4.5], rotation: Math.PI * 0.85, color: '#64748b' },
        { position: [-2, 0, 4.8], rotation: Math.PI * 1.1, color: '#94a3b8' },
        { position: [4.5, 0, 0], rotation: -Math.PI / 2, color: '#475569' },
        { position: [5, 0, 1.5], rotation: -Math.PI * 0.4, color: '#64748b' },
        { position: [-4.5, 0, -1], rotation: Math.PI / 2, color: '#475569' },
        { position: [-5, 0, 1.2], rotation: Math.PI * 0.6, color: '#94a3b8' },
        { position: [1, 0, -5], rotation: 0, color: '#64748b' },
        { position: [-1.5, 0, -4.5], rotation: Math.PI * 0.1, color: '#475569' },
      );
    }

    // Staff inside booth (slightly different color)
    base.push(
      { position: [0, 0, 0.8], rotation: Math.PI, color: '#334155', opacity: 0.8 },
    );
    if (layout !== 'inline') {
      base.push(
        { position: [-0.8, 0, 0.5], rotation: Math.PI * 0.7, color: '#334155', opacity: 0.8 },
      );
    }

    // Passersby in aisles (lighter, more transparent)
    base.push(
      { position: [5, 0, 2], rotation: Math.PI * 0.5, color: '#94a3b8', opacity: 0.35 },
      { position: [-5.5, 0, -1], rotation: Math.PI * 1.3, color: '#94a3b8', opacity: 0.35 },
      { position: [3, 0, -5], rotation: Math.PI * 0.2, color: '#94a3b8', opacity: 0.3 },
      { position: [-4, 0, 5], rotation: Math.PI * 0.8, color: '#94a3b8', opacity: 0.3 },
    );

    return base;
  }, [layout]);

  return (
    <group>
      {figures.map((fig, i) => (
        <HumanFigure key={i} {...fig} />
      ))}
      {/* Height reference marker near booth corner */}
      <HeightMarker position={[layout === 'island' ? 3.5 : 2, 0, -0.5]} />
    </group>
  );
}
