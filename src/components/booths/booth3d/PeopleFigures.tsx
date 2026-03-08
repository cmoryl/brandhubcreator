/**
 * PeopleFigures - Stylized human silhouettes with natural trade-show interactions
 * 
 * Supports multiple density levels and interaction patterns:
 * - Conversation clusters (2-3 people facing each other)
 * - Staff demos (standing at counter/screen)
 * - Walking passersby
 * - Phone-checkers, note-takers, photographers
 */
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { EnvironmentConfig } from './environmentPresets';
import { getPeopleMultiplier } from './environmentPresets';

const HUMAN_HEIGHT = 1.75;
const HEAD_RADIUS = 0.1;
const TORSO_HEIGHT = 0.55;
const LEG_HEIGHT = 0.85;

interface FigureProps {
  position: [number, number, number];
  rotation?: number;
  color?: string;
  opacity?: number;
  animated?: boolean;
  /** Pose variations */
  pose?: 'standing' | 'talking' | 'phone' | 'pointing' | 'leaning' | 'photographing';
}

function HumanFigure({
  position,
  rotation = 0,
  color = '#64748b',
  opacity = 0.7,
  animated = true,
  pose = 'standing',
}: FigureProps) {
  const groupRef = useRef<THREE.Group>(null);
  const swayOffset = useMemo(() => Math.random() * Math.PI * 2, []);
  const swaySpeed = useMemo(() => 0.3 + Math.random() * 0.4, []);

  useFrame((state) => {
    if (animated && groupRef.current) {
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * swaySpeed + swayOffset) * 0.015;
    }
  });

  const headY = LEG_HEIGHT + TORSO_HEIGHT + HEAD_RADIUS + 0.02;
  const torsoY = LEG_HEIGHT + TORSO_HEIGHT / 2;
  const legY = LEG_HEIGHT / 2;

  // Arm pose adjustments
  const leftArmRot = pose === 'talking' ? [0.15, 0, 0.3] :
                     pose === 'phone' ? [-1.2, 0, 0.3] :
                     pose === 'pointing' ? [0, 0, -1.2] :
                     pose === 'photographing' ? [-0.8, 0.2, 0.4] :
                     pose === 'leaning' ? [0, 0, 0.5] : [0, 0, 0.1];
  const rightArmRot = pose === 'talking' ? [-0.2, 0, -0.35] :
                      pose === 'phone' ? [-0.5, 0, -0.2] :
                      pose === 'pointing' ? [-1.3, -0.1, -0.3] :
                      pose === 'photographing' ? [-0.8, -0.2, -0.4] :
                      pose === 'leaning' ? [0, 0, -0.3] : [0, 0, -0.1];

  // Head tilt for phone users
  const headTilt = pose === 'phone' ? [-0.3, -0.15, 0] : [0, 0, 0];

  return (
    <group ref={groupRef} position={position} rotation={[0, rotation, 0]}>
      {/* Head */}
      <mesh position={[0, headY, 0]} rotation={headTilt as any} castShadow>
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
      <mesh position={[-0.2, LEG_HEIGHT + TORSO_HEIGHT * 0.5, 0]} rotation={leftArmRot as any}>
        <cylinderGeometry args={[0.03, 0.035, 0.5, 8]} />
        <meshStandardMaterial color={color} transparent opacity={opacity} roughness={0.8} />
      </mesh>
      {/* Right arm */}
      <mesh position={[0.2, LEG_HEIGHT + TORSO_HEIGHT * 0.5, 0]} rotation={rightArmRot as any}>
        <cylinderGeometry args={[0.03, 0.035, 0.5, 8]} />
        <meshStandardMaterial color={color} transparent opacity={opacity} roughness={0.8} />
      </mesh>

      {/* Phone prop for phone pose */}
      {pose === 'phone' && (
        <mesh position={[-0.08, headY - 0.08, 0.1]}>
          <boxGeometry args={[0.04, 0.07, 0.005]} />
          <meshStandardMaterial color="#111" emissive="#334155" emissiveIntensity={0.5} />
        </mesh>
      )}
      {/* Camera prop */}
      {pose === 'photographing' && (
        <mesh position={[0, LEG_HEIGHT + TORSO_HEIGHT * 0.7, 0.15]}>
          <boxGeometry args={[0.1, 0.06, 0.06]} />
          <meshStandardMaterial color="#111" metalness={0.6} roughness={0.3} />
        </mesh>
      )}
    </group>
  );
}

/** Conversation cluster - 2-3 people facing each other */
function ConversationGroup({ position, count = 2 }: { position: [number, number, number]; count?: number }) {
  const angles = count === 2 ? [0, Math.PI] : [0, Math.PI * 0.7, Math.PI * 1.3];
  const radius = 0.5;

  return (
    <group position={position}>
      {angles.map((angle, i) => (
        <HumanFigure
          key={i}
          position={[Math.sin(angle) * radius, 0, Math.cos(angle) * radius]}
          rotation={angle + Math.PI} // Face center
          color={i === 0 ? '#475569' : i === 1 ? '#64748b' : '#94a3b8'}
          opacity={0.75}
          pose="talking"
        />
      ))}
    </group>
  );
}

/** Height reference marker */
function HeightMarker({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, HUMAN_HEIGHT / 2, 0]}>
        <boxGeometry args={[0.005, HUMAN_HEIGHT, 0.005]} />
        <meshBasicMaterial color="#94a3b8" />
      </mesh>
      <mesh position={[0, HUMAN_HEIGHT, 0]}>
        <boxGeometry args={[0.15, 0.005, 0.005]} />
        <meshBasicMaterial color="#94a3b8" />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.15, 0.005, 0.005]} />
        <meshBasicMaterial color="#94a3b8" />
      </mesh>
    </group>
  );
}

interface PeopleFiguresProps {
  layout: 'inline' | 'l-shape' | 'u-shape' | 'island';
  envConfig?: EnvironmentConfig;
}

export function PeopleFigures({ layout, envConfig }: PeopleFiguresProps) {
  const multiplier = envConfig ? getPeopleMultiplier(envConfig.peopleCount) : 1;
  const showInteractions = envConfig?.showInteractions ?? false;
  const showConversationGroups = envConfig?.showConversationGroups ?? false;

  const figures = useMemo(() => {
    const base: FigureProps[] = [];

    // Core visitors in front of booth
    if (layout === 'inline') {
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

    // Staff inside booth
    base.push(
      { position: [0, 0, 0.8], rotation: Math.PI, color: '#334155', opacity: 0.8, pose: 'standing' },
    );
    if (layout !== 'inline') {
      base.push(
        { position: [-0.8, 0, 0.5], rotation: Math.PI * 0.7, color: '#334155', opacity: 0.8, pose: 'pointing' },
      );
    }

    // Passersby in aisles
    base.push(
      { position: [5, 0, 2], rotation: Math.PI * 0.5, color: '#94a3b8', opacity: 0.35 },
      { position: [-5.5, 0, -1], rotation: Math.PI * 1.3, color: '#94a3b8', opacity: 0.35 },
      { position: [3, 0, -5], rotation: Math.PI * 0.2, color: '#94a3b8', opacity: 0.3 },
      { position: [-4, 0, 5], rotation: Math.PI * 0.8, color: '#94a3b8', opacity: 0.3 },
    );

    // Extra people based on density multiplier
    if (multiplier >= 1.5) {
      // Moderate — add phone users and additional visitors
      base.push(
        { position: [2, 0, 4], rotation: Math.PI * 0.9, color: '#64748b', opacity: 0.6, pose: 'phone' },
        { position: [-3, 0, 3], rotation: Math.PI * 1.15, color: '#475569', opacity: 0.5 },
        { position: [6, 0, -2], rotation: Math.PI * 0.3, color: '#94a3b8', opacity: 0.3 },
        { position: [-6, 0, 3], rotation: Math.PI * 0.7, color: '#94a3b8', opacity: 0.3 },
      );
    }
    if (multiplier >= 2.5) {
      // Busy — photographers, more aisle traffic
      base.push(
        { position: [1.5, 0, 5], rotation: Math.PI, color: '#475569', opacity: 0.6, pose: 'photographing' },
        { position: [-2.5, 0, 4.5], rotation: Math.PI * 0.95, color: '#64748b', opacity: 0.55 },
        { position: [4, 0, 6], rotation: Math.PI * 0.5, color: '#94a3b8', opacity: 0.3 },
        { position: [-4, 0, -4], rotation: Math.PI * 1.4, color: '#94a3b8', opacity: 0.25 },
        { position: [7, 0, 1], rotation: -Math.PI * 0.3, color: '#94a3b8', opacity: 0.25 },
        { position: [-7, 0, -2], rotation: Math.PI * 0.6, color: '#94a3b8', opacity: 0.25 },
        { position: [0.3, 0, 1.2], rotation: Math.PI * 0.85, color: '#334155', opacity: 0.8, pose: 'talking' },
      );
    }
    if (multiplier >= 3.5) {
      // Packed — full trade show floor
      base.push(
        { position: [3.5, 0, 3], rotation: Math.PI * 0.7, color: '#475569', opacity: 0.5, pose: 'phone' },
        { position: [-1, 0, 5.5], rotation: Math.PI, color: '#64748b', opacity: 0.45 },
        { position: [5.5, 0, -3], rotation: Math.PI * 0.4, color: '#94a3b8', opacity: 0.3 },
        { position: [-6.5, 0, 5], rotation: Math.PI * 0.8, color: '#94a3b8', opacity: 0.25 },
        { position: [8, 0, -4], rotation: Math.PI * 0.2, color: '#94a3b8', opacity: 0.2 },
        { position: [-8, 0, 4], rotation: Math.PI * 0.9, color: '#94a3b8', opacity: 0.2 },
        { position: [0, 0, 7], rotation: Math.PI, color: '#475569', opacity: 0.35, pose: 'phone' },
        { position: [4, 0, -7], rotation: 0, color: '#94a3b8', opacity: 0.2 },
        { position: [-3, 0, -6], rotation: Math.PI * 0.15, color: '#94a3b8', opacity: 0.2 },
        { position: [6, 0, 5], rotation: Math.PI * 0.6, color: '#94a3b8', opacity: 0.2, pose: 'phone' },
      );
    }

    return base;
  }, [layout, multiplier]);

  const conversationPositions = useMemo(() => {
    if (!showConversationGroups) return [];
    const groups: { position: [number, number, number]; count: number }[] = [];

    // Conversations near booth
    groups.push({ position: [2, 0, 3.5], count: 2 });
    groups.push({ position: [-2.5, 0, 4], count: 3 });

    if (multiplier >= 2.5) {
      groups.push({ position: [5, 0, 4], count: 2 });
      groups.push({ position: [-5, 0, 2], count: 2 });
    }
    if (multiplier >= 3.5) {
      groups.push({ position: [7, 0, -3], count: 3 });
      groups.push({ position: [-7, 0, 6], count: 2 });
    }
    return groups;
  }, [showConversationGroups, multiplier]);

  return (
    <group>
      {figures.map((fig, i) => (
        <HumanFigure key={i} {...fig} />
      ))}
      {conversationPositions.map((group, i) => (
        <ConversationGroup key={`conv-${i}`} position={group.position} count={group.count} />
      ))}
      <HeightMarker position={[layout === 'island' ? 3.5 : 2, 0, -0.5]} />
    </group>
  );
}
