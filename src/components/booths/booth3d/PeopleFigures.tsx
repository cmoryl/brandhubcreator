/**
 * PeopleFigures - Realistic human figures for trade-show booth scenes
 * 
 * Features:
 * - Distinct skin tones, hair colors, and clothing colors
 * - Anatomically improved proportions with shoulders, hips, and joints
 * - Hair styles, shoes, and accessory props
 * - Pose variations: standing, talking, phone, pointing, leaning, photographing
 * - Conversation clusters and density scaling
 */
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { EnvironmentConfig } from './environmentPresets';
import { getPeopleMultiplier } from './environmentPresets';
import { getLayoutFamily } from './boothConfigs';

const HUMAN_HEIGHT = 1.75;
const HEAD_RADIUS = 0.095;
const TORSO_HEIGHT = 0.5;
const LEG_HEIGHT = 0.82;
const NECK_HEIGHT = 0.06;

// Diverse appearance palettes
const SKIN_TONES = ['#f5d0a9', '#e8b88a', '#c68642', '#8d5524', '#6b3a2a', '#f0c8a0'];
const HAIR_COLORS = ['#1a1a1a', '#3b2f2f', '#8b4513', '#d4a574', '#c0392b', '#f5f5dc', '#555555'];
const SHIRT_COLORS = ['#1e3a5f', '#2d5a27', '#6b2142', '#4a4a8a', '#8b6914', '#2c3e50', '#c0392b', '#1abc9c', '#e6e6e6', '#2c2c2c'];
const PANT_COLORS = ['#1a1a2e', '#2d2d2d', '#3b3b3b', '#1e293b', '#292524', '#4a4a4a'];
const SHOE_COLORS = ['#111111', '#2c1810', '#1a1a1a', '#3d2b1f', '#4a4a4a'];

interface FigureAppearance {
  skin: string;
  hair: string;
  shirt: string;
  pants: string;
  shoes: string;
  hairStyle: 'short' | 'medium' | 'long' | 'bald';
  gender: 'masc' | 'fem';
}

function seededAppearance(seed: number): FigureAppearance {
  const pick = <T,>(arr: T[], s: number): T => arr[Math.abs(Math.floor(s)) % arr.length];
  const s1 = Math.sin(seed * 127.1) * 43758.5453;
  const s2 = Math.sin(seed * 269.5) * 76892.1234;
  const s3 = Math.sin(seed * 419.3) * 23456.7891;
  const s4 = Math.sin(seed * 631.7) * 98765.4321;
  const s5 = Math.sin(seed * 173.9) * 54321.9876;
  const gender = Math.abs(s1) % 2 > 1 ? 'fem' as const : 'masc' as const;
  const hairStyles: FigureAppearance['hairStyle'][] = gender === 'fem'
    ? ['medium', 'long', 'short', 'medium']
    : ['short', 'short', 'bald', 'medium'];

  return {
    skin: pick(SKIN_TONES, s1),
    hair: pick(HAIR_COLORS, s2),
    shirt: pick(SHIRT_COLORS, s3),
    pants: pick(PANT_COLORS, s4),
    shoes: pick(SHOE_COLORS, s5),
    hairStyle: pick(hairStyles, s4),
    gender,
  };
}

interface FigureProps {
  position: [number, number, number];
  rotation?: number;
  color?: string;
  opacity?: number;
  animated?: boolean;
  pose?: 'standing' | 'talking' | 'phone' | 'pointing' | 'leaning' | 'photographing';
  seed?: number;
}

function HumanFigure({
  position,
  rotation = 0,
  color,
  opacity = 0.85,
  animated = true,
  pose = 'standing',
  seed = 0,
}: FigureProps) {
  const groupRef = useRef<THREE.Group>(null);
  const swayOffset = useMemo(() => Math.random() * Math.PI * 2, []);
  const swaySpeed = useMemo(() => 0.3 + Math.random() * 0.3, []);
  const appearance = useMemo(() => seededAppearance(seed), [seed]);

  // Override shirt color if legacy `color` prop is provided, but keep realistic skin/hair
  const shirtColor = color || appearance.shirt;

  useFrame((state) => {
    if (animated && groupRef.current) {
      const t = state.clock.elapsedTime * swaySpeed + swayOffset;
      groupRef.current.rotation.z = Math.sin(t) * 0.01;
      // Subtle weight shift
      groupRef.current.position.y = Math.sin(t * 0.7) * 0.003;
    }
  });

  const isFem = appearance.gender === 'fem';
  const shoulderW = isFem ? 0.32 : 0.38;
  const hipW = isFem ? 0.28 : 0.26;
  const torsoTopR = isFem ? 0.11 : 0.13;
  const torsoBotR = isFem ? 0.12 : 0.12;

  const shoeH = 0.04;
  const legTop = shoeH;
  const torsoBot = legTop + LEG_HEIGHT;
  const torsoTop = torsoBot + TORSO_HEIGHT;
  const neckTop = torsoTop + NECK_HEIGHT;
  const headCenter = neckTop + HEAD_RADIUS;

  // Arm poses
  const leftArmRot = pose === 'talking' ? [0.2, 0, 0.35] :
    pose === 'phone' ? [-1.3, 0, 0.3] :
    pose === 'pointing' ? [0, 0, -1.2] :
    pose === 'photographing' ? [-0.8, 0.2, 0.4] :
    pose === 'leaning' ? [0, 0, 0.5] : [0.05, 0, 0.12];
  const rightArmRot = pose === 'talking' ? [-0.25, 0, -0.4] :
    pose === 'phone' ? [-0.5, 0, -0.2] :
    pose === 'pointing' ? [-1.3, -0.1, -0.3] :
    pose === 'photographing' ? [-0.8, -0.2, -0.4] :
    pose === 'leaning' ? [0, 0, -0.3] : [0.05, 0, -0.12];
  const headTilt: [number, number, number] = pose === 'phone' ? [-0.25, -0.15, 0] :
    pose === 'pointing' ? [0, -0.1, 0] : [0, 0, 0];

  // Slight leg splay for natural stance
  const legSplay = 0.065;

  return (
    <group ref={groupRef} position={position} rotation={[0, rotation, 0]}>
      {/* ── Shoes ── */}
      <mesh position={[-legSplay, shoeH / 2, 0.02]} castShadow>
        <boxGeometry args={[0.07, shoeH, 0.12]} />
        <meshStandardMaterial color={appearance.shoes} roughness={0.6} metalness={0.1} transparent opacity={opacity} />
      </mesh>
      <mesh position={[legSplay, shoeH / 2, 0.02]} castShadow>
        <boxGeometry args={[0.07, shoeH, 0.12]} />
        <meshStandardMaterial color={appearance.shoes} roughness={0.6} metalness={0.1} transparent opacity={opacity} />
      </mesh>

      {/* ── Legs ── */}
      <mesh position={[-legSplay, legTop + LEG_HEIGHT / 2, 0]} castShadow>
        <cylinderGeometry args={[0.045, 0.05, LEG_HEIGHT, 10]} />
        <meshStandardMaterial color={appearance.pants} roughness={0.75} transparent opacity={opacity} />
      </mesh>
      <mesh position={[legSplay, legTop + LEG_HEIGHT / 2, 0]} castShadow>
        <cylinderGeometry args={[0.045, 0.05, LEG_HEIGHT, 10]} />
        <meshStandardMaterial color={appearance.pants} roughness={0.75} transparent opacity={opacity} />
      </mesh>

      {/* ── Belt / waist ── */}
      <mesh position={[0, torsoBot + 0.01, 0]}>
        <cylinderGeometry args={[torsoBotR + 0.005, torsoBotR + 0.005, 0.03, 12]} />
        <meshStandardMaterial color="#222" roughness={0.5} metalness={0.2} transparent opacity={opacity} />
      </mesh>

      {/* ── Torso ── */}
      <mesh position={[0, torsoBot + TORSO_HEIGHT / 2, 0]} castShadow>
        <cylinderGeometry args={[torsoTopR, torsoBotR, TORSO_HEIGHT, 12]} />
        <meshStandardMaterial color={shirtColor} roughness={0.7} transparent opacity={opacity} />
      </mesh>

      {/* ── Shoulders ── */}
      <mesh position={[0, torsoTop - 0.04, 0]}>
        <boxGeometry args={[shoulderW, 0.05, 0.1]} />
        <meshStandardMaterial color={shirtColor} roughness={0.7} transparent opacity={opacity} />
      </mesh>

      {/* ── Neck ── */}
      <mesh position={[0, torsoTop + NECK_HEIGHT / 2, 0]}>
        <cylinderGeometry args={[0.04, 0.045, NECK_HEIGHT, 10]} />
        <meshStandardMaterial color={appearance.skin} roughness={0.85} transparent opacity={opacity} />
      </mesh>

      {/* ── Head ── */}
      <group position={[0, headCenter, 0]} rotation={headTilt}>
        {/* Skull */}
        <mesh castShadow>
          <sphereGeometry args={[HEAD_RADIUS, 16, 12]} />
          <meshStandardMaterial color={appearance.skin} roughness={0.85} transparent opacity={opacity} />
        </mesh>

        {/* ── Hair ── */}
        {appearance.hairStyle !== 'bald' && (
          <>
            {/* Hair cap */}
            <mesh position={[0, HEAD_RADIUS * 0.15, -0.005]}>
              <sphereGeometry args={[HEAD_RADIUS + 0.012, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
              <meshStandardMaterial color={appearance.hair} roughness={0.9} transparent opacity={opacity} />
            </mesh>
            {/* Back hair for medium/long */}
            {(appearance.hairStyle === 'medium' || appearance.hairStyle === 'long') && (
              <mesh position={[0, appearance.hairStyle === 'long' ? -0.06 : -0.02, -0.04]}>
                <boxGeometry args={[
                  HEAD_RADIUS * 1.6,
                  appearance.hairStyle === 'long' ? HEAD_RADIUS * 2.2 : HEAD_RADIUS * 1.2,
                  0.04,
                ]} />
                <meshStandardMaterial color={appearance.hair} roughness={0.9} transparent opacity={opacity} />
              </mesh>
            )}
          </>
        )}

        {/* ── Ears ── */}
        <mesh position={[-HEAD_RADIUS * 0.92, -0.01, 0]}>
          <sphereGeometry args={[0.02, 8, 6]} />
          <meshStandardMaterial color={appearance.skin} roughness={0.85} transparent opacity={opacity} />
        </mesh>
        <mesh position={[HEAD_RADIUS * 0.92, -0.01, 0]}>
          <sphereGeometry args={[0.02, 8, 6]} />
          <meshStandardMaterial color={appearance.skin} roughness={0.85} transparent opacity={opacity} />
        </mesh>
      </group>

      {/* ── Arms ── */}
      {/* Upper left arm */}
      <group position={[-shoulderW / 2, torsoTop - 0.06, 0]} rotation={leftArmRot as any}>
        <mesh position={[0, -0.12, 0]}>
          <cylinderGeometry args={[0.032, 0.035, 0.25, 8]} />
          <meshStandardMaterial color={shirtColor} roughness={0.7} transparent opacity={opacity} />
        </mesh>
        {/* Forearm (skin) */}
        <mesh position={[0, -0.3, 0]}>
          <cylinderGeometry args={[0.025, 0.03, 0.22, 8]} />
          <meshStandardMaterial color={appearance.skin} roughness={0.85} transparent opacity={opacity} />
        </mesh>
        {/* Hand */}
        <mesh position={[0, -0.42, 0]}>
          <sphereGeometry args={[0.025, 8, 6]} />
          <meshStandardMaterial color={appearance.skin} roughness={0.85} transparent opacity={opacity} />
        </mesh>
      </group>

      {/* Upper right arm */}
      <group position={[shoulderW / 2, torsoTop - 0.06, 0]} rotation={rightArmRot as any}>
        <mesh position={[0, -0.12, 0]}>
          <cylinderGeometry args={[0.032, 0.035, 0.25, 8]} />
          <meshStandardMaterial color={shirtColor} roughness={0.7} transparent opacity={opacity} />
        </mesh>
        <mesh position={[0, -0.3, 0]}>
          <cylinderGeometry args={[0.025, 0.03, 0.22, 8]} />
          <meshStandardMaterial color={appearance.skin} roughness={0.85} transparent opacity={opacity} />
        </mesh>
        <mesh position={[0, -0.42, 0]}>
          <sphereGeometry args={[0.025, 8, 6]} />
          <meshStandardMaterial color={appearance.skin} roughness={0.85} transparent opacity={opacity} />
        </mesh>
      </group>

      {/* ── Props ── */}
      {pose === 'phone' && (
        <mesh position={[-0.08, headCenter - 0.08, 0.1]}>
          <boxGeometry args={[0.038, 0.07, 0.006]} />
          <meshStandardMaterial color="#111" emissive="#334155" emissiveIntensity={0.5} />
        </mesh>
      )}
      {pose === 'photographing' && (
        <mesh position={[0, torsoTop - 0.08, 0.15]}>
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
          rotation={angle + Math.PI}
          opacity={0.8}
          pose="talking"
          seed={i * 17 + 5}
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

/** Occupied zone — a rectangle on the XZ plane that people should avoid */
export interface OccupiedZone {
  cx: number; // center X
  cz: number; // center Z
  hw: number; // half-width (X)
  hd: number; // half-depth (Z)
}

interface PeopleFiguresProps {
  layout: string;
  envConfig?: EnvironmentConfig;
  /** Bounding zones of panels + placed assets — people are filtered if they overlap */
  occupiedZones?: OccupiedZone[];
}

const PERSON_RADIUS = 0.35; // clearance radius around each figure

function collidesWithZone(px: number, pz: number, zone: OccupiedZone): boolean {
  // Expand zone by person radius for clearance
  return (
    Math.abs(px - zone.cx) < zone.hw + PERSON_RADIUS &&
    Math.abs(pz - zone.cz) < zone.hd + PERSON_RADIUS
  );
}

export function PeopleFigures({ layout: rawLayout, envConfig, occupiedZones = [] }: PeopleFiguresProps) {
  const layout = getLayoutFamily(rawLayout as any);
  const multiplier = envConfig ? getPeopleMultiplier(envConfig.peopleCount) : 1;
  const showConversationGroups = envConfig?.showConversationGroups ?? false;

  const figures = useMemo(() => {
    const base: FigureProps[] = [];
    let seedCounter = 1;

    const add = (pos: [number, number, number], rot: number, opts: Partial<FigureProps> = {}) => {
      base.push({ position: pos, rotation: rot, seed: seedCounter++, ...opts });
    };

    // Core visitors
    if (layout === 'inline') {
      add([0.8, 0, 2.5], Math.PI * 0.9);
      add([-0.5, 0, 2.8], Math.PI * 1.1);
      add([0.1, 0, 3.2], Math.PI);
    } else if (layout === 'l-shape') {
      add([0.5, 0, 2.5], Math.PI * 0.85);
      add([-1.5, 0, 1.8], Math.PI * 0.6);
      add([1.2, 0, 3], Math.PI);
      add([-2, 0, 2.8], Math.PI * 0.7);
    } else if (layout === 'u-shape') {
      add([0, 0, 2.5], Math.PI);
      add([1.2, 0, 2.2], Math.PI * 0.8);
      add([-1.2, 0, 2.2], Math.PI * 1.2);
      add([0.6, 0, 3.5], Math.PI * 0.95);
      add([-0.8, 0, 3.8], Math.PI * 1.05);
    } else {
      add([0, 0, 5], Math.PI);
      add([2, 0, 4.5], Math.PI * 0.85);
      add([-2, 0, 4.8], Math.PI * 1.1);
      add([4.5, 0, 0], -Math.PI / 2);
      add([5, 0, 1.5], -Math.PI * 0.4);
      add([-4.5, 0, -1], Math.PI / 2);
      add([-5, 0, 1.2], Math.PI * 0.6);
      add([1, 0, -5], 0);
      add([-1.5, 0, -4.5], Math.PI * 0.1);
    }

    // Staff inside booth
    add([0, 0, 0.8], Math.PI, { opacity: 0.9, pose: 'standing' });
    if (layout !== 'inline') {
      add([-0.8, 0, 0.5], Math.PI * 0.7, { opacity: 0.9, pose: 'pointing' });
    }

    // Passersby
    add([5, 0, 2], Math.PI * 0.5, { opacity: 0.4 });
    add([-5.5, 0, -1], Math.PI * 1.3, { opacity: 0.4 });
    add([3, 0, -5], Math.PI * 0.2, { opacity: 0.35 });
    add([-4, 0, 5], Math.PI * 0.8, { opacity: 0.35 });

    if (multiplier >= 1.5) {
      add([2, 0, 4], Math.PI * 0.9, { opacity: 0.65, pose: 'phone' });
      add([-3, 0, 3], Math.PI * 1.15, { opacity: 0.55 });
      add([6, 0, -2], Math.PI * 0.3, { opacity: 0.35 });
      add([-6, 0, 3], Math.PI * 0.7, { opacity: 0.35 });
    }
    if (multiplier >= 2.5) {
      add([1.5, 0, 5], Math.PI, { opacity: 0.65, pose: 'photographing' });
      add([-2.5, 0, 4.5], Math.PI * 0.95, { opacity: 0.6 });
      add([4, 0, 6], Math.PI * 0.5, { opacity: 0.35 });
      add([-4, 0, -4], Math.PI * 1.4, { opacity: 0.3 });
      add([7, 0, 1], -Math.PI * 0.3, { opacity: 0.3 });
      add([-7, 0, -2], Math.PI * 0.6, { opacity: 0.3 });
      add([0.3, 0, 1.2], Math.PI * 0.85, { opacity: 0.85, pose: 'talking' });
    }
    if (multiplier >= 3.5) {
      add([3.5, 0, 3], Math.PI * 0.7, { opacity: 0.55, pose: 'phone' });
      add([-1, 0, 5.5], Math.PI, { opacity: 0.5 });
      add([5.5, 0, -3], Math.PI * 0.4, { opacity: 0.35 });
      add([-6.5, 0, 5], Math.PI * 0.8, { opacity: 0.3 });
      add([8, 0, -4], Math.PI * 0.2, { opacity: 0.25 });
      add([-8, 0, 4], Math.PI * 0.9, { opacity: 0.25 });
      add([0, 0, 7], Math.PI, { opacity: 0.4, pose: 'phone' });
      add([4, 0, -7], 0, { opacity: 0.25 });
      add([-3, 0, -6], Math.PI * 0.15, { opacity: 0.25 });
      add([6, 0, 5], Math.PI * 0.6, { opacity: 0.25, pose: 'phone' });
    }

    return base;
  }, [layout, multiplier]);

  // Filter figures that collide with any occupied zone
  const safeFigures = useMemo(() => {
    if (occupiedZones.length === 0) return figures;
    return figures.filter(fig => {
      const [px, , pz] = fig.position;
      return !occupiedZones.some(zone => collidesWithZone(px, pz, zone));
    });
  }, [figures, occupiedZones]);

  const conversationPositions = useMemo(() => {
    if (!showConversationGroups) return [];
    const allGroups: { position: [number, number, number]; count: number }[] = [];
    allGroups.push({ position: [2, 0, 3.5], count: 2 });
    allGroups.push({ position: [-2.5, 0, 4], count: 3 });
    if (multiplier >= 2.5) {
      allGroups.push({ position: [5, 0, 4], count: 2 });
      allGroups.push({ position: [-5, 0, 2], count: 2 });
    }
    if (multiplier >= 3.5) {
      allGroups.push({ position: [7, 0, -3], count: 3 });
      allGroups.push({ position: [-7, 0, 6], count: 2 });
    }
    // Filter conversation groups that overlap with assets
    if (occupiedZones.length === 0) return allGroups;
    return allGroups.filter(g => {
      const [gx, , gz] = g.position;
      return !occupiedZones.some(zone => collidesWithZone(gx, gz, zone));
    });
  }, [showConversationGroups, multiplier, occupiedZones]);

  return (
    <group>
      {safeFigures.map((fig, i) => (
        <HumanFigure key={i} {...fig} />
      ))}
      {conversationPositions.map((group, i) => (
        <ConversationGroup key={`conv-${i}`} position={group.position} count={group.count} />
      ))}
      <HeightMarker position={[layout === 'island' ? 3.5 : 2, 0, -0.5]} />
    </group>
  );
}
