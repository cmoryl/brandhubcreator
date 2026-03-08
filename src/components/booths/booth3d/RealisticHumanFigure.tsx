/**
 * RealisticHumanFigure - Enhanced procedural human figure with:
 * - Facial features (eyes, eyebrows, nose bridge, mouth)
 * - Articulated joints (elbows, knees, wrists)
 * - Clothing detail (collar, pockets, belt buckle)
 * - Conference lanyard & name badge
 * - Improved PBR materials (skin subsurface approx, fabric roughness)
 * - Finger articulation on hands
 */
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

// Diverse appearance palettes
const SKIN_TONES = ['#f5d0a9', '#e8b88a', '#c68642', '#8d5524', '#6b3a2a', '#f0c8a0', '#dba97a', '#a0714f'];
const HAIR_COLORS = ['#1a1a1a', '#3b2f2f', '#8b4513', '#d4a574', '#c0392b', '#f5f5dc', '#555555', '#2c1810'];
const SHIRT_COLORS = ['#1e3a5f', '#2d5a27', '#6b2142', '#4a4a8a', '#8b6914', '#2c3e50', '#c0392b', '#1abc9c', '#e6e6e6', '#2c2c2c', '#1e40af', '#065f46'];
const PANT_COLORS = ['#1a1a2e', '#2d2d2d', '#3b3b3b', '#1e293b', '#292524', '#4a4a4a', '#1f2937'];
const SHOE_COLORS = ['#111111', '#2c1810', '#1a1a1a', '#3d2b1f', '#4a4a4a'];
const LANYARD_COLORS = ['#dc2626', '#2563eb', '#16a34a', '#9333ea', '#ea580c', '#0891b2', '#1e293b'];
const EYE_COLORS = ['#4a3728', '#2d5016', '#1e3a5f', '#1a1a1a', '#6b4226', '#3b5998'];

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
    hasGlasses: s6 % 5 < 1, // ~20% wear glasses
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
  /** Mark as booth staff (shows polo collar, branded badge) */
  isStaff?: boolean;
  /** Staff shirt brand color override */
  staffColor?: string;
}

// Constants
const HEAD_R = 0.095;
const TORSO_H = 0.50;
const LEG_H = 0.82;
const NECK_H = 0.07;
const SHOE_H = 0.045;

export function RealisticHumanFigure({
  position,
  rotation = 0,
  colorOverride,
  opacity = 0.85,
  animated = true,
  pose = 'standing',
  seed = 0,
  isStaff = false,
  staffColor,
}: RealisticFigureProps) {
  const groupRef = useRef<THREE.Group>(null);
  const swayOffset = useMemo(() => Math.random() * Math.PI * 2, []);
  const swaySpeed = useMemo(() => 0.25 + Math.random() * 0.25, []);
  const appearance = useMemo(() => seededAppearance(seed), [seed]);

  const shirtColor = staffColor || colorOverride || appearance.shirt;

  useFrame((state) => {
    if (animated && groupRef.current) {
      const t = state.clock.elapsedTime * swaySpeed + swayOffset;
      groupRef.current.rotation.z = Math.sin(t) * 0.008;
      groupRef.current.position.y = Math.sin(t * 0.6) * 0.002;
    }
  });

  const isFem = appearance.gender === 'fem';
  const shoulderW = isFem ? 0.33 : 0.39;
  const hipW = isFem ? 0.29 : 0.27;

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

  const headTilt: [number, number, number] = pose === 'phone' ? [-0.2, -0.15, 0] :
    pose === 'pointing' ? [0, -0.1, 0] :
    pose === 'talking' ? [0.05, 0.08, 0] : [0, 0, 0];

  const legSplay = 0.07;

  // Knee bend for certain poses
  const kneeAngle = pose === 'leaning' ? 0.08 : 0;

  // Skin material props (subsurface scattering approximation)
  const skinMat = { color: appearance.skin, roughness: 0.75, metalness: 0.02, transparent: true, opacity };
  // Fabric material
  const fabricMat = (color: string) => ({ color, roughness: 0.85, metalness: 0, transparent: true, opacity });

  return (
    <group ref={groupRef} position={position} rotation={[0, rotation, 0]}>
      {/* ═══ SHOES ═══ */}
      {[-legSplay, legSplay].map((xOff, i) => (
        <group key={`shoe-${i}`} position={[xOff, 0, 0]}>
          {/* Sole */}
          <mesh position={[0, 0.01, 0.015]}>
            <boxGeometry args={[0.08, 0.02, 0.13]} />
            <meshStandardMaterial color="#0a0a0a" roughness={0.95} transparent opacity={opacity} />
          </mesh>
          {/* Upper */}
          <mesh position={[0, SHOE_H / 2 + 0.01, 0.01]} castShadow>
            <boxGeometry args={[0.075, SHOE_H - 0.01, 0.12]} />
            <meshStandardMaterial color={appearance.shoes} roughness={0.55} metalness={0.08} transparent opacity={opacity} />
          </mesh>
        </group>
      ))}

      {/* ═══ LEGS with knee joints ═══ */}
      {[-legSplay, legSplay].map((xOff, i) => {
        const upperLeg = LEG_H * 0.52;
        const lowerLeg = LEG_H * 0.48;
        const kneeY = legTop + lowerLeg;
        return (
          <group key={`leg-${i}`}>
            {/* Lower leg (shin) */}
            <mesh position={[xOff, legTop + lowerLeg / 2, 0]} rotation={[kneeAngle, 0, 0]} castShadow>
              <cylinderGeometry args={[0.04, 0.048, lowerLeg, 10]} />
              <meshStandardMaterial {...fabricMat(appearance.pants)} />
            </mesh>
            {/* Knee joint */}
            <mesh position={[xOff, kneeY, 0]}>
              <sphereGeometry args={[0.044, 10, 8]} />
              <meshStandardMaterial {...fabricMat(appearance.pants)} />
            </mesh>
            {/* Upper leg (thigh) */}
            <mesh position={[xOff, kneeY + upperLeg / 2, 0]} castShadow>
              <cylinderGeometry args={[0.05, 0.042, upperLeg, 10]} />
              <meshStandardMaterial {...fabricMat(appearance.pants)} />
            </mesh>
          </group>
        );
      })}

      {/* ═══ BELT ═══ */}
      <mesh position={[0, torsoBot + 0.015, 0]}>
        <cylinderGeometry args={[hipW / 2 + 0.01, hipW / 2 + 0.01, 0.035, 14]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.45} metalness={0.25} transparent opacity={opacity} />
      </mesh>
      {/* Belt buckle */}
      <mesh position={[0, torsoBot + 0.015, hipW / 2 + 0.005]}>
        <boxGeometry args={[0.025, 0.025, 0.008]} />
        <meshStandardMaterial color="#b8860b" roughness={0.2} metalness={0.8} transparent opacity={opacity} />
      </mesh>

      {/* ═══ TORSO ═══ */}
      <mesh position={[0, torsoBot + TORSO_H / 2, 0]} castShadow>
        <cylinderGeometry args={[shoulderW / 2 - 0.02, hipW / 2, TORSO_H, 14]} />
        <meshStandardMaterial {...fabricMat(shirtColor)} />
      </mesh>

      {/* ═══ COLLAR (staff get polo collar) ═══ */}
      {isStaff ? (
        // Polo collar
        <group position={[0, torsoTop - 0.02, 0]}>
          <mesh>
            <torusGeometry args={[0.065, 0.018, 8, 16]} />
            <meshStandardMaterial {...fabricMat(shirtColor)} />
          </mesh>
          {/* Collar points */}
          {[-0.04, 0.04].map((x, i) => (
            <mesh key={i} position={[x, 0.01, 0.05]} rotation={[0.3, 0, 0]}>
              <boxGeometry args={[0.035, 0.003, 0.03]} />
              <meshStandardMaterial {...fabricMat(shirtColor)} />
            </mesh>
          ))}
        </group>
      ) : (
        // Round neckline
        <mesh position={[0, torsoTop - 0.03, 0]}>
          <torusGeometry args={[0.055, 0.012, 8, 16]} />
          <meshStandardMaterial {...fabricMat(shirtColor)} />
        </mesh>
      )}

      {/* ═══ SHOULDERS ═══ */}
      <group position={[0, torsoTop - 0.04, 0]}>
        <mesh>
          <boxGeometry args={[shoulderW, 0.055, 0.11]} />
          <meshStandardMaterial {...fabricMat(shirtColor)} />
        </mesh>
        {/* Shoulder caps (rounded) */}
        {[-shoulderW / 2, shoulderW / 2].map((x, i) => (
          <mesh key={i} position={[x, 0, 0]}>
            <sphereGeometry args={[0.05, 10, 8]} />
            <meshStandardMaterial {...fabricMat(shirtColor)} />
          </mesh>
        ))}
      </group>

      {/* ═══ NECK ═══ */}
      <mesh position={[0, torsoTop + NECK_H / 2, 0]}>
        <cylinderGeometry args={[0.042, 0.048, NECK_H, 12]} />
        <meshStandardMaterial {...skinMat} />
      </mesh>
      {/* Neck tendons / shadow */}
      <mesh position={[0, torsoTop + NECK_H / 2, -0.02]}>
        <cylinderGeometry args={[0.035, 0.04, NECK_H * 0.8, 8]} />
        <meshStandardMaterial color={appearance.skin} roughness={0.8} metalness={0} transparent opacity={opacity * 0.5} />
      </mesh>

      {/* ═══ HEAD ═══ */}
      <group position={[0, headCenter, 0]} rotation={headTilt}>
        {/* Skull - slightly elongated */}
        <mesh castShadow>
          <sphereGeometry args={[HEAD_R, 20, 16]} />
          <meshStandardMaterial {...skinMat} />
        </mesh>

        {/* ── Eyes ── */}
        {[-0.032, 0.032].map((x, i) => (
          <group key={`eye-${i}`} position={[x, 0.01, HEAD_R * 0.88]}>
            {/* Eye white (sclera) */}
            <mesh>
              <sphereGeometry args={[0.013, 10, 8]} />
              <meshStandardMaterial color="#f0f0f0" roughness={0.2} metalness={0.05} transparent opacity={opacity} />
            </mesh>
            {/* Iris */}
            <mesh position={[0, 0, 0.006]}>
              <sphereGeometry args={[0.008, 8, 6]} />
              <meshStandardMaterial color={appearance.eyes} roughness={0.3} metalness={0.1} transparent opacity={opacity} />
            </mesh>
            {/* Pupil */}
            <mesh position={[0, 0, 0.01]}>
              <sphereGeometry args={[0.004, 6, 4]} />
              <meshStandardMaterial color="#0a0a0a" roughness={0.1} transparent opacity={opacity} />
            </mesh>
          </group>
        ))}

        {/* ── Eyebrows ── */}
        {[-0.032, 0.032].map((x, i) => (
          <mesh key={`brow-${i}`} position={[x, 0.035, HEAD_R * 0.85]} rotation={[0.15, i === 0 ? 0.08 : -0.08, 0]}>
            <boxGeometry args={[0.028, 0.005, 0.008]} />
            <meshStandardMaterial color={appearance.hair} roughness={0.9} transparent opacity={opacity} />
          </mesh>
        ))}

        {/* ── Nose ── */}
        <group position={[0, -0.01, HEAD_R * 0.92]}>
          {/* Bridge */}
          <mesh>
            <boxGeometry args={[0.012, 0.025, 0.015]} />
            <meshStandardMaterial {...skinMat} />
          </mesh>
          {/* Tip */}
          <mesh position={[0, -0.015, 0.005]}>
            <sphereGeometry args={[0.01, 8, 6]} />
            <meshStandardMaterial {...skinMat} />
          </mesh>
        </group>

        {/* ── Mouth / lips ── */}
        <mesh position={[0, -0.038, HEAD_R * 0.88]}>
          <boxGeometry args={[0.025, 0.006, 0.008]} />
          <meshStandardMaterial color="#b5655a" roughness={0.6} metalness={0} transparent opacity={opacity} />
        </mesh>

        {/* ── Chin ── */}
        <mesh position={[0, -HEAD_R * 0.65, HEAD_R * 0.35]}>
          <sphereGeometry args={[0.035, 10, 8]} />
          <meshStandardMaterial {...skinMat} />
        </mesh>

        {/* ── Ears ── */}
        {[-1, 1].map((side, i) => (
          <group key={`ear-${i}`} position={[HEAD_R * 0.93 * side, -0.005, 0]}>
            <mesh>
              <sphereGeometry args={[0.022, 8, 6]} />
              <meshStandardMaterial {...skinMat} />
            </mesh>
            {/* Inner ear detail */}
            <mesh position={[-0.003 * side, 0, 0.002]}>
              <sphereGeometry args={[0.012, 6, 4]} />
              <meshStandardMaterial color={appearance.skin} roughness={0.85} metalness={0} transparent opacity={opacity * 0.7} />
            </mesh>
          </group>
        ))}

        {/* ── Glasses ── */}
        {appearance.hasGlasses && (
          <group position={[0, 0.01, HEAD_R * 0.9]}>
            {/* Frames */}
            {[-0.032, 0.032].map((x, i) => (
              <mesh key={i} position={[x, 0, 0]}>
                <torusGeometry args={[0.018, 0.002, 6, 16]} />
                <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.6} transparent opacity={opacity} />
              </mesh>
            ))}
            {/* Bridge */}
            <mesh position={[0, 0, 0.003]}>
              <boxGeometry args={[0.02, 0.003, 0.003]} />
              <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.6} transparent opacity={opacity} />
            </mesh>
            {/* Temple arms */}
            {[-0.048, 0.048].map((x, i) => (
              <mesh key={`arm-${i}`} position={[x, 0, -0.03]} rotation={[0, i === 0 ? 0.15 : -0.15, 0]}>
                <boxGeometry args={[0.003, 0.003, 0.06]} />
                <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.6} transparent opacity={opacity} />
              </mesh>
            ))}
            {/* Lens */}
            {[-0.032, 0.032].map((x, i) => (
              <mesh key={`lens-${i}`} position={[x, 0, 0.001]}>
                <circleGeometry args={[0.016, 12]} />
                <meshStandardMaterial color="#e0e7ff" roughness={0.05} metalness={0.1} transparent opacity={0.15} />
              </mesh>
            ))}
          </group>
        )}

        {/* ── Hair ── */}
        {appearance.hairStyle !== 'bald' && (
          <HairMesh hairStyle={appearance.hairStyle} hairColor={appearance.hair} opacity={opacity} />
        )}
      </group>

      {/* ═══ LANYARD & BADGE ═══ */}
      {appearance.hasLanyard && (
        <group>
          {/* Lanyard straps (V shape around neck) */}
          <mesh position={[-0.02, torsoTop - 0.06, 0.06]} rotation={[-0.1, 0, 0.15]}>
            <boxGeometry args={[0.012, 0.16, 0.003]} />
            <meshStandardMaterial color={appearance.lanyard} roughness={0.7} transparent opacity={opacity} />
          </mesh>
          <mesh position={[0.02, torsoTop - 0.06, 0.06]} rotation={[-0.1, 0, -0.15]}>
            <boxGeometry args={[0.012, 0.16, 0.003]} />
            <meshStandardMaterial color={appearance.lanyard} roughness={0.7} transparent opacity={opacity} />
          </mesh>
          {/* Badge card */}
          <group position={[0, torsoBot + TORSO_H * 0.4, hipW / 2 + 0.02]}>
            {/* Badge body */}
            <mesh>
              <boxGeometry args={[0.055, 0.075, 0.004]} />
              <meshStandardMaterial color="#ffffff" roughness={0.4} metalness={0.02} transparent opacity={opacity} />
            </mesh>
            {/* Badge text line (name) */}
            <mesh position={[0, 0.01, 0.003]}>
              <boxGeometry args={[0.035, 0.005, 0.001]} />
              <meshStandardMaterial color="#1e293b" roughness={0.5} transparent opacity={opacity} />
            </mesh>
            {/* Badge text line (company) */}
            <mesh position={[0, -0.005, 0.003]}>
              <boxGeometry args={[0.028, 0.004, 0.001]} />
              <meshStandardMaterial color="#64748b" roughness={0.5} transparent opacity={opacity} />
            </mesh>
            {/* Badge color stripe */}
            <mesh position={[0, 0.032, 0.003]}>
              <boxGeometry args={[0.055, 0.012, 0.001]} />
              <meshStandardMaterial color={appearance.lanyard} roughness={0.5} transparent opacity={opacity} />
            </mesh>
            {/* Badge clip */}
            <mesh position={[0, 0.042, 0]}>
              <boxGeometry args={[0.015, 0.008, 0.008]} />
              <meshStandardMaterial color="#94a3b8" roughness={0.2} metalness={0.7} transparent opacity={opacity} />
            </mesh>
          </group>
        </group>
      )}

      {/* ═══ ARMS with elbow joints and hands ═══ */}
      {[
        { side: -1, rot: leftArmRot, x: -shoulderW / 2 },
        { side: 1, rot: rightArmRot, x: shoulderW / 2 },
      ].map(({ side, rot, x }) => {
        const upperLen = 0.24;
        const forearmLen = 0.22;
        return (
          <group key={side} position={[x, torsoTop - 0.06, 0]} rotation={rot as any}>
            {/* Upper arm (sleeve) */}
            <mesh position={[0, -upperLen / 2, 0]} castShadow>
              <cylinderGeometry args={[0.032, 0.036, upperLen, 10]} />
              <meshStandardMaterial {...fabricMat(shirtColor)} />
            </mesh>
            {/* Elbow joint */}
            <mesh position={[0, -upperLen, 0]}>
              <sphereGeometry args={[0.032, 8, 6]} />
              <meshStandardMaterial {...skinMat} />
            </mesh>
            {/* Forearm (skin) */}
            <mesh position={[0, -upperLen - forearmLen / 2, 0]}>
              <cylinderGeometry args={[0.024, 0.03, forearmLen, 10]} />
              <meshStandardMaterial {...skinMat} />
            </mesh>
            {/* Wrist */}
            <mesh position={[0, -upperLen - forearmLen - 0.01, 0]}>
              <sphereGeometry args={[0.022, 8, 6]} />
              <meshStandardMaterial {...skinMat} />
            </mesh>
            {/* Hand with finger detail */}
            <Hand
              position={[0, -upperLen - forearmLen - 0.04, 0]}
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
          <boxGeometry args={[0.038, 0.075, 0.007]} />
          <meshStandardMaterial color="#111" roughness={0.1} metalness={0.3} />
        </mesh>
      )}
      {pose === 'photographing' && (
        <group position={[0, torsoTop - 0.1, 0.15]}>
          <mesh>
            <boxGeometry args={[0.1, 0.06, 0.06]} />
            <meshStandardMaterial color="#111" metalness={0.6} roughness={0.2} />
          </mesh>
          {/* Lens */}
          <mesh position={[0, 0, 0.04]}>
            <cylinderGeometry args={[0.02, 0.025, 0.03, 10]} />
            <meshStandardMaterial color="#1a1a1a" metalness={0.7} roughness={0.15} />
          </mesh>
        </group>
      )}

      {/* Staff pocket detail */}
      {isStaff && (
        <mesh position={[shoulderW / 4, torsoBot + TORSO_H * 0.65, hipW / 2 + 0.01]}>
          <boxGeometry args={[0.04, 0.045, 0.003]} />
          <meshStandardMaterial color={shirtColor} roughness={0.9} metalness={0} transparent opacity={opacity * 0.6} />
        </mesh>
      )}
    </group>
  );
}

/** Articulated hand with fingers */
function Hand({ position, skin, opacity, isFist }: {
  position: [number, number, number];
  skin: string;
  opacity: number;
  isFist: boolean;
}) {
  const fingerSpread = isFist ? 0 : 0.006;
  const fingerCurl = isFist ? 0.5 : 0;

  return (
    <group position={position}>
      {/* Palm */}
      <mesh>
        <boxGeometry args={[0.04, 0.02, 0.035]} />
        <meshStandardMaterial color={skin} roughness={0.75} metalness={0.02} transparent opacity={opacity} />
      </mesh>
      {/* Fingers */}
      {[-0.013, -0.004, 0.004, 0.013].map((x, i) => (
        <group key={i} position={[x, -0.01, 0.02]} rotation={[fingerCurl, 0, fingerSpread * (i - 1.5)]}>
          <mesh position={[0, -0.012, 0]}>
            <cylinderGeometry args={[0.004, 0.004, 0.025, 6]} />
            <meshStandardMaterial color={skin} roughness={0.75} metalness={0.02} transparent opacity={opacity} />
          </mesh>
        </group>
      ))}
      {/* Thumb */}
      <group position={[isFist ? -0.02 : -0.025, -0.005, 0.005]} rotation={[0, 0, isFist ? 0.3 : 0.6]}>
        <mesh position={[0, -0.008, 0]}>
          <cylinderGeometry args={[0.005, 0.005, 0.02, 6]} />
          <meshStandardMaterial color={skin} roughness={0.75} metalness={0.02} transparent opacity={opacity} />
        </mesh>
      </group>
    </group>
  );
}

/** Detailed hair mesh system */
function HairMesh({ hairStyle, hairColor, opacity }: {
  hairStyle: FigureAppearance['hairStyle'];
  hairColor: string;
  opacity: number;
}) {
  const mat = { color: hairColor, roughness: 0.88, metalness: 0, transparent: true, opacity };

  return (
    <group>
      {/* Hair cap (all styles) */}
      <mesh position={[0, HEAD_R * 0.15, -0.005]}>
        <sphereGeometry args={[HEAD_R + 0.014, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
        <meshStandardMaterial {...mat} />
      </mesh>

      {hairStyle === 'buzz' && (
        <mesh position={[0, HEAD_R * 0.1, 0]}>
          <sphereGeometry args={[HEAD_R + 0.006, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
          <meshStandardMaterial {...mat} />
        </mesh>
      )}

      {(hairStyle === 'short') && (
        <>
          {/* Side hair */}
          {[-1, 1].map(side => (
            <mesh key={side} position={[HEAD_R * 0.7 * side, 0.02, -0.01]}>
              <boxGeometry args={[0.025, HEAD_R * 1.2, HEAD_R * 1.4]} />
              <meshStandardMaterial {...mat} />
            </mesh>
          ))}
        </>
      )}

      {hairStyle === 'medium' && (
        <>
          <mesh position={[0, -0.02, -0.04]}>
            <boxGeometry args={[HEAD_R * 1.7, HEAD_R * 1.4, 0.04]} />
            <meshStandardMaterial {...mat} />
          </mesh>
          {/* Side volume */}
          {[-1, 1].map(side => (
            <mesh key={side} position={[HEAD_R * 0.75 * side, 0, -0.01]}>
              <boxGeometry args={[0.03, HEAD_R * 1.5, HEAD_R * 1.2]} />
              <meshStandardMaterial {...mat} />
            </mesh>
          ))}
        </>
      )}

      {hairStyle === 'long' && (
        <>
          <mesh position={[0, -0.07, -0.04]}>
            <boxGeometry args={[HEAD_R * 1.8, HEAD_R * 2.5, 0.045]} />
            <meshStandardMaterial {...mat} />
          </mesh>
          {[-1, 1].map(side => (
            <mesh key={side} position={[HEAD_R * 0.75 * side, -0.04, 0]}>
              <boxGeometry args={[0.035, HEAD_R * 2.2, HEAD_R * 1.4]} />
              <meshStandardMaterial {...mat} />
            </mesh>
          ))}
        </>
      )}

      {hairStyle === 'ponytail' && (
        <>
          {/* Base similar to medium */}
          <mesh position={[0, -0.01, -0.04]}>
            <boxGeometry args={[HEAD_R * 1.7, HEAD_R * 1.3, 0.04]} />
            <meshStandardMaterial {...mat} />
          </mesh>
          {/* Ponytail */}
          <mesh position={[0, -0.06, -HEAD_R * 0.9]}>
            <cylinderGeometry args={[0.02, 0.015, 0.14, 8]} />
            <meshStandardMaterial {...mat} />
          </mesh>
          {/* Hair tie */}
          <mesh position={[0, -0.01, -HEAD_R * 0.9]}>
            <torusGeometry args={[0.02, 0.005, 6, 10]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.5} transparent opacity={opacity} />
          </mesh>
        </>
      )}
    </group>
  );
}
