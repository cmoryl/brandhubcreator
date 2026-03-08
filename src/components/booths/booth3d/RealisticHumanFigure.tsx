/**
 * RealisticHumanFigure - Stylized arch-viz illustration style characters.
 *
 * Design language:
 * - Smooth, rounded geometry (high segment counts)
 * - Soft pastel-tinted skin with subtle warm subsurface glow
 * - Clean silhouettes — no harsh edges or visible faceting
 * - Slightly abstracted faces (smooth eye dots, minimal nose, no mouth geometry)
 * - Fabric with gentle matte finish and environment tinting
 * - Conference accessories (lanyard, badge, glasses) as clean minimal shapes
 */
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

// ── Palettes ──────────────────────────────────────────────
const SKIN_TONES = ['#f5d0a9', '#ecc5a0', '#d4a882', '#c68642', '#a06b3f', '#8d5524', '#6b3a2a', '#f0ceb0'];
const HAIR_COLORS = ['#1a1a1a', '#3b2f2f', '#8b4513', '#c49a6c', '#c0392b', '#e8dcc8', '#555555', '#2c1810'];
const SHIRT_COLORS = ['#3b5998', '#2d6a4f', '#7c3aed', '#0891b2', '#b45309', '#334155', '#be123c', '#059669', '#6366f1', '#1e293b', '#dc2626', '#0d9488'];
const PANT_COLORS = ['#1e293b', '#292524', '#1f2937', '#334155', '#27272a', '#3f3f46'];
const SHOE_COLORS = ['#18181b', '#292524', '#1c1917', '#3f3f46'];
const LANYARD_COLORS = ['#dc2626', '#2563eb', '#16a34a', '#9333ea', '#ea580c', '#0891b2', '#475569'];
const EYE_COLORS = ['#3e3428', '#2d5016', '#1e3a5f', '#1a1a1a', '#6b4226', '#3b5998'];

export interface FigureAppearance {
  skin: string;
  hair: string;
  shirt: string;
  pants: string;
  shoes: string;
  eyes: string;
  lanyard: string;
  hairStyle: 'short' | 'medium' | 'long' | 'bald' | 'buzz' | 'ponytail';
  gender: 'masc' | 'fem';
  hasGlasses: boolean;
  hasLanyard: boolean;
}

export function seededAppearance(seed: number): FigureAppearance {
  const pick = <T,>(arr: T[], s: number): T => arr[Math.abs(Math.floor(s)) % arr.length];
  const hash = (n: number) => Math.sin(seed * n) * 43758.5453 % 1;
  const s1 = Math.abs(hash(127.1) * 99999);
  const s2 = Math.abs(hash(269.5) * 99999);
  const s3 = Math.abs(hash(419.3) * 99999);
  const s4 = Math.abs(hash(631.7) * 99999);
  const s5 = Math.abs(hash(173.9) * 99999);
  const s6 = Math.abs(hash(311.3) * 99999);
  const s7 = Math.abs(hash(523.7) * 99999);
  const gender = s1 % 2 > 1 ? 'fem' as const : 'masc' as const;
  const hairStyles: FigureAppearance['hairStyle'][] = gender === 'fem'
    ? ['medium', 'long', 'ponytail', 'short', 'medium']
    : ['short', 'buzz', 'bald', 'medium', 'short'];

  return {
    skin: pick(SKIN_TONES, s1),
    hair: pick(HAIR_COLORS, s2),
    shirt: pick(SHIRT_COLORS, s3),
    pants: pick(PANT_COLORS, s4),
    shoes: pick(SHOE_COLORS, s5),
    eyes: pick(EYE_COLORS, s6),
    lanyard: pick(LANYARD_COLORS, s7),
    hairStyle: pick(hairStyles, s4),
    gender,
    hasGlasses: s6 % 5 < 1,
    hasLanyard: true,
  };
}

export type FigurePose = 'standing' | 'talking' | 'phone' | 'pointing' | 'leaning' | 'photographing' | 'arms-crossed' | 'hands-in-pockets';

export interface RealisticFigureProps {
  position: [number, number, number];
  rotation?: number;
  colorOverride?: string;
  opacity?: number;
  animated?: boolean;
  pose?: FigurePose;
  seed?: number;
  isStaff?: boolean;
  staffColor?: string;
}

// ── Body proportions (must sum to ~1.75m total height) ────
// Total = SHOE_H + LEG_H + TORSO_H + NECK_H + HEAD_R*2
// 0.04 + 0.88 + 0.50 + 0.07 + 0.22 = 1.71m (+ hair ~1.75m)
const HEAD_R = 0.11;
const TORSO_H = 0.50;
const LEG_H = 0.88;
const NECK_H = 0.07;
const SHOE_H = 0.04;
const SEG = 24; // segment count for smooth geometry

export function RealisticHumanFigure({
  position,
  rotation = 0,
  colorOverride,
  opacity = 1,
  animated = true,
  pose = 'standing',
  seed = 0,
  isStaff = false,
  staffColor,
}: RealisticFigureProps) {
  const groupRef = useRef<THREE.Group>(null);
  const swayOffset = useMemo(() => Math.random() * Math.PI * 2, []);
  const swaySpeed = useMemo(() => 0.2 + Math.random() * 0.2, []);
  const appearance = useMemo(() => seededAppearance(seed), [seed]);

  const shirtColor = staffColor || colorOverride || appearance.shirt;

  // Subtle breathing / weight-shift animation
  useFrame((state) => {
    if (animated && groupRef.current) {
      const t = state.clock.elapsedTime * swaySpeed + swayOffset;
      groupRef.current.rotation.z = Math.sin(t) * 0.006;
      groupRef.current.position.y = Math.sin(t * 0.5) * 0.0015;
    }
  });

  const isFem = appearance.gender === 'fem';
  const shoulderW = isFem ? 0.32 : 0.38;
  const hipW = isFem ? 0.28 : 0.26;

  const legTop = SHOE_H;
  const torsoBot = legTop + LEG_H;
  const torsoTop = torsoBot + TORSO_H;
  const neckTop = torsoTop + NECK_H;
  const headCenter = neckTop + HEAD_R;

  // Pose arm rotations
  const armPoses: Record<FigurePose, { left: number[]; right: number[] }> = {
    standing: { left: [0.05, 0, 0.12], right: [0.05, 0, -0.12] },
    talking: { left: [0.3, 0, 0.4], right: [-0.2, 0, -0.35] },
    phone: { left: [-1.4, 0, 0.3], right: [-0.4, 0, -0.15] },
    pointing: { left: [0, 0, -1.2], right: [-1.3, -0.1, -0.3] },
    leaning: { left: [0, 0, 0.5], right: [0, 0, -0.3] },
    photographing: { left: [-0.8, 0.2, 0.4], right: [-0.8, -0.2, -0.4] },
    'arms-crossed': { left: [-0.9, 0.4, 0.6], right: [-0.9, -0.4, -0.6] },
    'hands-in-pockets': { left: [0.3, 0, 0.35], right: [0.3, 0, -0.35] },
  };
  const { left: leftArmRot, right: rightArmRot } = armPoses[pose];
  const headTilt: [number, number, number] = pose === 'phone' ? [-0.15, -0.12, 0] :
    pose === 'pointing' ? [0, -0.1, 0] :
    pose === 'talking' ? [0.04, 0.06, 0] : [0, 0, 0];
  const kneeAngle = pose === 'leaning' ? 0.08 : 0;

  // ── Material factories (arch-viz style) ─────────────────
  // Skin: smooth matte with warm subsurface glow
  const skinMat = useMemo(() => ({
    color: appearance.skin,
    roughness: 0.6,
    metalness: 0,
    emissive: appearance.skin,
    emissiveIntensity: 0.04,
    envMapIntensity: 0.25,
    transparent: true,
    opacity: opacity * 0.85,
    depthWrite: opacity > 0.9,
  }), [appearance.skin, opacity]);

  // Fabric: clean matte with subtle env response
  const fabricMat = (color: string) => ({
    color,
    roughness: 0.72,
    metalness: 0,
    envMapIntensity: 0.2,
    transparent: true,
    opacity: opacity * 0.85,
    depthWrite: opacity > 0.9,
  });

  // Dark accent (shoes, belt)
  const darkMat = (color: string, metal = 0) => ({
    color,
    roughness: 0.45,
    metalness: metal,
    envMapIntensity: 0.3,
    transparent: true,
    opacity: opacity * 0.85,
    depthWrite: opacity > 0.9,
  });

  return (
    <group ref={groupRef} position={position} rotation={[0, rotation, 0]}>
      {/* ═══ SHOES — smooth rounded blocks ═══ */}
      {[-0.065, 0.065].map((xOff, i) => (
        <mesh key={`shoe-${i}`} position={[xOff, SHOE_H / 2, 0.01]} castShadow>
          <boxGeometry args={[0.075, SHOE_H, 0.12]} />
          <meshStandardMaterial {...darkMat(appearance.shoes, 0.05)} />
        </mesh>
      ))}

      {/* ═══ LEGS — smooth capsule-like cylinders ═══ */}
      {[-0.065, 0.065].map((xOff, i) => {
        const upperLen = LEG_H * 0.52;
        const lowerLen = LEG_H * 0.48;
        const kneeY = legTop + lowerLen;
        return (
          <group key={`leg-${i}`}>
            {/* Lower leg */}
            <mesh position={[xOff, legTop + lowerLen / 2, 0]} rotation={[kneeAngle, 0, 0]} castShadow>
              <capsuleGeometry args={[0.038, lowerLen - 0.08, 8, SEG]} />
              <meshStandardMaterial {...fabricMat(appearance.pants)} />
            </mesh>
            {/* Upper leg */}
            <mesh position={[xOff, kneeY + upperLen / 2, 0]} castShadow>
              <capsuleGeometry args={[0.043, upperLen - 0.08, 8, SEG]} />
              <meshStandardMaterial {...fabricMat(appearance.pants)} />
            </mesh>
          </group>
        );
      })}

      {/* ═══ BELT — thin clean ring ═══ */}
      <mesh position={[0, torsoBot + 0.01, 0]}>
        <cylinderGeometry args={[hipW / 2 + 0.008, hipW / 2 + 0.008, 0.025, SEG]} />
        <meshStandardMaterial {...darkMat('#27272a', 0.15)} />
      </mesh>

      {/* ═══ TORSO — smooth tapered capsule ═══ */}
      <mesh position={[0, torsoBot + TORSO_H / 2, 0]} castShadow>
        <capsuleGeometry args={[shoulderW / 2 - 0.03, TORSO_H - 0.12, 8, SEG]} />
        <meshStandardMaterial {...fabricMat(shirtColor)} />
      </mesh>

      {/* ═══ COLLAR ═══ */}
      {isStaff ? (
        <mesh position={[0, torsoTop - 0.02, 0]}>
          <torusGeometry args={[0.06, 0.014, 12, SEG]} />
          <meshStandardMaterial {...fabricMat(shirtColor)} />
        </mesh>
      ) : (
        <mesh position={[0, torsoTop - 0.025, 0]}>
          <torusGeometry args={[0.05, 0.01, 10, SEG]} />
          <meshStandardMaterial {...fabricMat(shirtColor)} />
        </mesh>
      )}

      {/* ═══ SHOULDERS — smooth spheres ═══ */}
      {[-shoulderW / 2, shoulderW / 2].map((x, i) => (
        <mesh key={`shoulder-${i}`} position={[x, torsoTop - 0.04, 0]} castShadow>
          <sphereGeometry args={[0.048, SEG, SEG / 2]} />
          <meshStandardMaterial {...fabricMat(shirtColor)} />
        </mesh>
      ))}

      {/* ═══ NECK ═══ */}
      <mesh position={[0, torsoTop + NECK_H / 2, 0]}>
        <capsuleGeometry args={[0.038, NECK_H - 0.04, 8, SEG]} />
        <meshStandardMaterial {...skinMat} />
      </mesh>

      {/* ═══ HEAD ═══ */}
      <group position={[0, headCenter, 0]} rotation={headTilt}>
        {/* Skull — smooth sphere */}
        <mesh castShadow>
          <sphereGeometry args={[HEAD_R, SEG, SEG]} />
          <meshStandardMaterial {...skinMat} />
        </mesh>

        {/* ── Eyes — minimal elegant dots ── */}
        {[-0.03, 0.03].map((x, i) => (
          <group key={`eye-${i}`} position={[x, 0.012, HEAD_R * 0.92]}>
            {/* Eye white */}
            <mesh>
              <sphereGeometry args={[0.012, SEG, SEG / 2]} />
              <meshStandardMaterial color="#f0f0f0" roughness={0.15} metalness={0} envMapIntensity={0.4} transparent opacity={opacity * 0.85} />
            </mesh>
            {/* Iris — clean dot */}
            <mesh position={[0, 0, 0.007]}>
              <circleGeometry args={[0.007, SEG]} />
              <meshStandardMaterial color={appearance.eyes} roughness={0.25} metalness={0.05} transparent opacity={opacity * 0.85} />
            </mesh>
            {/* Pupil */}
            <mesh position={[0, 0, 0.008]}>
              <circleGeometry args={[0.003, 12]} />
              <meshStandardMaterial color="#0a0a0a" roughness={0.1} transparent opacity={opacity * 0.85} />
            </mesh>
            {/* Specular highlight dot */}
            <mesh position={[0.002, 0.002, 0.009]}>
              <circleGeometry args={[0.0015, 8]} />
              <meshStandardMaterial color="#e0e0e0" emissive="#e0e0e0" emissiveIntensity={0.5} roughness={0} transparent opacity={opacity * 0.85} />
            </mesh>
          </group>
        ))}

        {/* ── Eyebrows — soft arcs ── */}
        {[-0.03, 0.03].map((x, i) => (
          <mesh key={`brow-${i}`} position={[x, 0.035, HEAD_R * 0.88]} rotation={[0.1, i === 0 ? 0.06 : -0.06, 0]}>
            <capsuleGeometry args={[0.003, 0.02, 4, 12]} />
            <meshStandardMaterial color={appearance.hair} roughness={0.85} />
          </mesh>
        ))}

        {/* ── Nose — subtle bump ── */}
        <mesh position={[0, -0.008, HEAD_R * 0.95]}>
          <sphereGeometry args={[0.012, SEG, SEG / 2]} />
          <meshStandardMaterial {...skinMat} />
        </mesh>

        {/* ── Chin — smooth blend ── */}
        <mesh position={[0, -HEAD_R * 0.6, HEAD_R * 0.3]}>
          <sphereGeometry args={[0.04, SEG, SEG / 2]} />
          <meshStandardMaterial {...skinMat} />
        </mesh>

        {/* ── Ears — smooth ellipsoids ── */}
        {[-1, 1].map((side, i) => (
          <mesh key={`ear-${i}`} position={[HEAD_R * 0.92 * side, -0.005, 0]} scale={[0.6, 1, 0.5]}>
            <sphereGeometry args={[0.025, SEG, SEG / 2]} />
            <meshStandardMaterial {...skinMat} />
          </mesh>
        ))}

        {/* ── Glasses — clean wireframe style ── */}
        {appearance.hasGlasses && (
          <group position={[0, 0.012, HEAD_R * 0.93]}>
            {[-0.03, 0.03].map((x, i) => (
              <mesh key={i} position={[x, 0, 0]}>
                <torusGeometry args={[0.016, 0.0018, 8, SEG]} />
                <meshStandardMaterial color="#2a2a2a" roughness={0.2} metalness={0.7} envMapIntensity={0.5} />
              </mesh>
            ))}
            <mesh>
              <capsuleGeometry args={[0.0015, 0.016, 4, 8]} />
              <meshStandardMaterial color="#2a2a2a" roughness={0.2} metalness={0.7} />
            </mesh>
            {[-0.044, 0.044].map((x, i) => (
              <mesh key={`arm-${i}`} position={[x, 0, -0.028]} rotation={[0, i === 0 ? 0.12 : -0.12, 0]}>
                <capsuleGeometry args={[0.0015, 0.05, 4, 8]} />
                <meshStandardMaterial color="#2a2a2a" roughness={0.2} metalness={0.7} />
              </mesh>
            ))}
            {[-0.03, 0.03].map((x, i) => (
              <mesh key={`lens-${i}`} position={[x, 0, 0.002]}>
                <circleGeometry args={[0.014, SEG]} />
                <meshStandardMaterial color="#dbeafe" roughness={0.02} metalness={0.08} transparent opacity={0.12} />
              </mesh>
            ))}
          </group>
        )}

        {/* ── Hair ── */}
        {appearance.hairStyle !== 'bald' && (
          <StylizedHair hairStyle={appearance.hairStyle} hairColor={appearance.hair} />
        )}
      </group>

      {/* ═══ LANYARD & BADGE ═══ */}
      {appearance.hasLanyard && (
        <group>
          {/* Lanyard — clean flat ribbon */}
          <mesh position={[-0.018, torsoTop - 0.06, 0.055]} rotation={[-0.1, 0, 0.14]}>
            <boxGeometry args={[0.01, 0.15, 0.002]} />
            <meshStandardMaterial color={appearance.lanyard} roughness={0.65} envMapIntensity={0.15} transparent opacity={opacity * 0.85} />
          </mesh>
          <mesh position={[0.018, torsoTop - 0.06, 0.055]} rotation={[-0.1, 0, -0.14]}>
            <boxGeometry args={[0.01, 0.15, 0.002]} />
            <meshStandardMaterial color={appearance.lanyard} roughness={0.65} envMapIntensity={0.15} transparent opacity={opacity * 0.85} />
          </mesh>
          {/* Badge — clean card */}
          <group position={[0, torsoBot + TORSO_H * 0.38, hipW / 2 + 0.018]}>
            <mesh castShadow>
              <boxGeometry args={[0.05, 0.068, 0.003]} />
              <meshStandardMaterial color="#e8e8e8" roughness={0.35} metalness={0.02} envMapIntensity={0.3} transparent opacity={opacity * 0.85} />
            </mesh>
            {/* Color strip */}
            <mesh position={[0, 0.029, 0.002]}>
              <boxGeometry args={[0.05, 0.01, 0.001]} />
              <meshStandardMaterial color={isStaff ? (staffColor || shirtColor) : appearance.lanyard} roughness={0.45} transparent opacity={opacity * 0.85} />
            </mesh>
            {/* Text lines */}
            <mesh position={[0, 0.008, 0.002]}>
              <boxGeometry args={[0.032, 0.004, 0.001]} />
              <meshStandardMaterial color="#334155" roughness={0.5} transparent opacity={opacity * 0.85} />
            </mesh>
            <mesh position={[0, -0.004, 0.002]}>
              <boxGeometry args={[0.024, 0.003, 0.001]} />
              <meshStandardMaterial color="#94a3b8" roughness={0.5} transparent opacity={opacity * 0.85} />
            </mesh>
            {/* Clip */}
            <mesh position={[0, 0.038, 0]}>
              <boxGeometry args={[0.012, 0.006, 0.006]} />
              <meshStandardMaterial color="#a1a1aa" roughness={0.15} metalness={0.7} envMapIntensity={0.5} transparent opacity={opacity * 0.85} />
            </mesh>
          </group>
        </group>
      )}

      {/* ═══ ARMS — smooth capsules with minimal hands ═══ */}
      {[
        { side: -1, rot: leftArmRot, x: -shoulderW / 2 },
        { side: 1, rot: rightArmRot, x: shoulderW / 2 },
      ].map(({ side, rot, x }) => {
        const upperLen = 0.23;
        const forearmLen = 0.21;
        return (
          <group key={side} position={[x, torsoTop - 0.05, 0]} rotation={rot as any}>
            {/* Upper arm (sleeve) */}
            <mesh position={[0, -upperLen / 2, 0]} castShadow>
              <capsuleGeometry args={[0.03, upperLen - 0.06, 8, SEG]} />
              <meshStandardMaterial {...fabricMat(shirtColor)} />
            </mesh>
            {/* Forearm (skin) */}
            <mesh position={[0, -upperLen - forearmLen / 2, 0]}>
              <capsuleGeometry args={[0.024, forearmLen - 0.05, 8, SEG]} />
              <meshStandardMaterial {...skinMat} />
            </mesh>
            {/* Hand — smooth stylized sphere-palm */}
            <StylizedHand
              position={[0, -upperLen - forearmLen - 0.03, 0]}
              skin={appearance.skin}
              opacity={opacity}
              isFist={pose === 'arms-crossed' || pose === 'hands-in-pockets'}
            />
          </group>
        );
      })}

      {/* ═══ PROPS ═══ */}
      {pose === 'phone' && (
        <mesh position={[-0.08, headCenter - 0.06, 0.1]}>
          <boxGeometry args={[0.035, 0.07, 0.006]} />
          <meshStandardMaterial color="#18181b" roughness={0.08} metalness={0.35} envMapIntensity={0.6} transparent opacity={opacity * 0.85} />
        </mesh>
      )}
      {pose === 'photographing' && (
        <group position={[0, torsoTop - 0.1, 0.14]}>
          <mesh>
            <boxGeometry args={[0.09, 0.055, 0.055]} />
            <meshStandardMaterial color="#18181b" metalness={0.5} roughness={0.2} envMapIntensity={0.5} transparent opacity={opacity * 0.85} />
          </mesh>
          <mesh position={[0, 0, 0.038]}>
            <cylinderGeometry args={[0.018, 0.022, 0.028, SEG]} />
            <meshStandardMaterial color="#27272a" metalness={0.6} roughness={0.15} envMapIntensity={0.6} transparent opacity={opacity * 0.85} />
          </mesh>
        </group>
      )}

      {/* Staff pocket accent */}
      {isStaff && (
        <mesh position={[shoulderW / 4, torsoBot + TORSO_H * 0.65, hipW / 2 + 0.008]}>
          <boxGeometry args={[0.035, 0.04, 0.002]} />
          <meshStandardMaterial color={shirtColor} roughness={0.8} transparent opacity={opacity * 0.5} />
        </mesh>
      )}
    </group>
  );
}

/** Stylized smooth hand — clean palm + simplified fingers */
function StylizedHand({ position, skin, opacity, isFist }: {
  position: [number, number, number];
  skin: string;
  opacity: number;
  isFist: boolean;
}) {
  const skinProps = { color: skin, roughness: 0.6, metalness: 0, emissive: skin, emissiveIntensity: 0.04, envMapIntensity: 0.25, transparent: true, opacity: opacity * 0.85 };

  if (isFist) {
    return (
      <mesh position={position}>
        <sphereGeometry args={[0.022, SEG, SEG / 2]} />
        <meshStandardMaterial {...skinProps} />
      </mesh>
    );
  }

  return (
    <group position={position}>
      {/* Palm */}
      <mesh>
        <capsuleGeometry args={[0.018, 0.015, 6, SEG]} />
        <meshStandardMaterial {...skinProps} />
      </mesh>
      {/* Fingers — 4 clean capsules */}
      {[-0.01, -0.0035, 0.0035, 0.01].map((x, i) => (
        <mesh key={i} position={[x, -0.022, 0.003]} rotation={[0.1, 0, 0.003 * (i - 1.5)]}>
          <capsuleGeometry args={[0.003, 0.018, 4, 8]} />
          <meshStandardMaterial {...skinProps} />
        </mesh>
      ))}
      {/* Thumb */}
      <mesh position={[-0.02, -0.008, 0.005]} rotation={[0, 0, 0.5]}>
        <capsuleGeometry args={[0.004, 0.015, 4, 8]} />
        <meshStandardMaterial {...skinProps} />
      </mesh>
    </group>
  );
}

/** Stylized hair — smooth rounded volumes instead of boxy shapes */
function StylizedHair({ hairStyle, hairColor }: {
  hairStyle: FigureAppearance['hairStyle'];
  hairColor: string;
}) {
  const mat = { color: hairColor, roughness: 0.75, metalness: 0, envMapIntensity: 0.15, transparent: true, opacity: 0.85 };

  return (
    <group>
      {/* Base hair cap — all styles */}
      <mesh position={[0, HEAD_R * 0.15, -0.005]}>
        <sphereGeometry args={[HEAD_R + 0.012, SEG, SEG / 2, 0, Math.PI * 2, 0, Math.PI * 0.52]} />
        <meshStandardMaterial {...mat} />
      </mesh>

      {hairStyle === 'buzz' && (
        <mesh position={[0, HEAD_R * 0.1, 0]}>
          <sphereGeometry args={[HEAD_R + 0.005, SEG, SEG / 2, 0, Math.PI * 2, 0, Math.PI * 0.58]} />
          <meshStandardMaterial {...mat} />
        </mesh>
      )}

      {hairStyle === 'short' && (
        <>
          {[-1, 1].map(side => (
            <mesh key={side} position={[HEAD_R * 0.65 * side, 0.02, -0.01]} scale={[0.6, 1, 0.9]}>
              <sphereGeometry args={[0.04, SEG, SEG / 2]} />
              <meshStandardMaterial {...mat} />
            </mesh>
          ))}
        </>
      )}

      {hairStyle === 'medium' && (
        <>
          <mesh position={[0, -0.015, -0.04]} scale={[1.1, 1, 0.5]}>
            <sphereGeometry args={[HEAD_R * 0.95, SEG, SEG / 2]} />
            <meshStandardMaterial {...mat} />
          </mesh>
          {[-1, 1].map(side => (
            <mesh key={side} position={[HEAD_R * 0.7 * side, -0.01, -0.01]} scale={[0.55, 1, 0.8]}>
              <sphereGeometry args={[0.045, SEG, SEG / 2]} />
              <meshStandardMaterial {...mat} />
            </mesh>
          ))}
        </>
      )}

      {hairStyle === 'long' && (
        <>
          <mesh position={[0, -0.05, -0.035]} scale={[1.15, 1.3, 0.55]}>
            <sphereGeometry args={[HEAD_R, SEG, SEG / 2]} />
            <meshStandardMaterial {...mat} />
          </mesh>
          {[-1, 1].map(side => (
            <mesh key={side} position={[HEAD_R * 0.7 * side, -0.04, -0.005]} scale={[0.6, 1.4, 0.75]}>
              <sphereGeometry args={[0.045, SEG, SEG / 2]} />
              <meshStandardMaterial {...mat} />
            </mesh>
          ))}
        </>
      )}

      {hairStyle === 'ponytail' && (
        <>
          <mesh position={[0, -0.01, -0.04]} scale={[1.05, 0.95, 0.5]}>
            <sphereGeometry args={[HEAD_R * 0.9, SEG, SEG / 2]} />
            <meshStandardMaterial {...mat} />
          </mesh>
          {/* Ponytail — smooth capsule */}
          <mesh position={[0, -0.06, -HEAD_R * 0.85]} rotation={[0.2, 0, 0]}>
            <capsuleGeometry args={[0.016, 0.1, 8, SEG]} />
            <meshStandardMaterial {...mat} />
          </mesh>
          {/* Hair tie */}
          <mesh position={[0, -0.015, -HEAD_R * 0.88]}>
            <torusGeometry args={[0.018, 0.004, 8, SEG]} />
            <meshStandardMaterial color="#27272a" roughness={0.4} />
          </mesh>
        </>
      )}
    </group>
  );
}
