/**
 * BillboardFigure — Photorealistic character billboard sprites for arch-viz.
 *
 * Uses a custom shader to remove white/near-white backgrounds while keeping
 * character pixels fully opaque (no transparency on the person themselves).
 */
import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame, useThree, extend } from '@react-three/fiber';
import { useTexture, shaderMaterial } from '@react-three/drei';

// ── Pre-baked sprite descriptors ──────────────────────────
export interface CharacterSprite {
  id: string;
  label: string;
  promptHint: string;
  aspect: number;
  url?: string;
}

export const CHARACTER_CATALOG: CharacterSprite[] = [
  { id: 'visitor-m1', label: 'Male Visitor 1', promptHint: 'professional man in business casual, navy blazer, standing relaxed at trade show, full body, front view', aspect: 0.45 },
  { id: 'visitor-f1', label: 'Female Visitor 1', promptHint: 'professional woman in business attire, holding coffee, standing at convention, full body, front view', aspect: 0.42 },
  { id: 'visitor-m2', label: 'Male Visitor 2', promptHint: 'young man in polo shirt with conference lanyard, looking at booth, full body, slight angle', aspect: 0.44 },
  { id: 'visitor-f2', label: 'Female Visitor 2', promptHint: 'woman in smart casual blazer, holding tablet, at trade show, full body, front view', aspect: 0.43 },
  { id: 'visitor-m3', label: 'Male Visitor 3', promptHint: 'middle-aged man in suit, hands in pockets, at expo hall, full body, front view', aspect: 0.46 },
  { id: 'visitor-f3', label: 'Female Visitor 3', promptHint: 'young professional woman with backpack, at convention center, full body, walking pose', aspect: 0.42 },
  { id: 'staff-m1', label: 'Male Staff 1', promptHint: 'friendly male booth staff in branded polo shirt, arms crossed, professional pose, full body, front view', aspect: 0.45 },
  { id: 'staff-f1', label: 'Female Staff 1', promptHint: 'friendly female booth representative in branded polo, welcoming gesture, full body, front view', aspect: 0.42 },
  { id: 'phone-m1', label: 'Man on Phone', promptHint: 'business man looking at smartphone, conference lanyard, standing, full body, front view', aspect: 0.43 },
  { id: 'photo-f1', label: 'Woman Taking Photo', promptHint: 'woman taking photo with phone at trade show booth, full body, slight angle', aspect: 0.44 },
  { id: 'group-pair', label: 'Conversation Pair', promptHint: 'two professionals talking to each other at trade show, conference badges, full body, side view', aspect: 0.8 },
  { id: 'visitor-m4', label: 'Male Visitor 4', promptHint: 'casual tech professional in t-shirt and jeans, conference badge, standing relaxed, full body, front view', aspect: 0.44 },
];

export function getCharacterBySeed(seed: number, isStaff = false): CharacterSprite {
  const pool = isStaff
    ? CHARACTER_CATALOG.filter(c => c.id.startsWith('staff-'))
    : CHARACTER_CATALOG.filter(c => !c.id.startsWith('staff-') && c.id !== 'group-pair');
  return pool[Math.abs(seed) % pool.length];
}

// ── White-removal shader — keeps people fully opaque ──────
const CutoutMaterial = shaderMaterial(
  {
    map: null as THREE.Texture | null,
    threshold: 0.92,
  },
  // Vertex
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment — discards white bg, keeps person at full opacity
  `
    uniform sampler2D map;
    uniform float threshold;
    varying vec2 vUv;
    
    void main() {
      vec4 texColor = texture2D(map, vUv);
      
      float brightness = dot(texColor.rgb, vec3(0.299, 0.587, 0.114));
      float minChannel = min(min(texColor.r, texColor.g), texColor.b);
      float maxChannel = max(max(texColor.r, texColor.g), texColor.b);
      float saturation = maxChannel > 0.0 ? (maxChannel - minChannel) / maxChannel : 0.0;
      
      // Pure white/near-white background: high brightness + low saturation + all channels high
      bool isBackground = brightness > threshold && saturation < 0.08 && minChannel > (threshold * 0.88);
      
      if (isBackground) {
        discard;
      }
      
      // Soft anti-aliased edge for the transition zone
      float edgeBright = smoothstep(threshold * 0.92, threshold, brightness);
      float edgeSat = 1.0 - smoothstep(0.04, 0.08, saturation);
      float edgeMin = smoothstep(threshold * 0.82, threshold * 0.88, minChannel);
      float bgLikeness = edgeBright * edgeSat * edgeMin;
      
      // People stay fully opaque (alpha = 1), only edge transitions fade
      float alpha = texColor.a * (1.0 - bgLikeness * 0.95);
      if (alpha < 0.02) discard;
      
      gl_FragColor = vec4(texColor.rgb, alpha);
    }
  `
);

extend({ CutoutMaterial });

declare global {
  namespace JSX {
    interface IntrinsicElements {
      cutoutMaterial: any;
    }
  }
}

// ── Billboard Figure Component ────────────────────────────

interface BillboardFigureProps {
  position: [number, number, number];
  rotation?: number;
  opacity?: number;
  spriteUrl: string;
  height?: number;
  aspect?: number;
}

export function BillboardFigure({
  position,
  rotation = 0,
  opacity = 1,
  spriteUrl,
  height = 1.75,
  aspect = 0.45,
}: BillboardFigureProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();

  const texture = useTexture(spriteUrl);

  useMemo(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.anisotropy = 16;
  }, [texture]);

  const width = height * aspect;

  useFrame(() => {
    if (meshRef.current) {
      const cameraWorldPos = new THREE.Vector3();
      camera.getWorldPosition(cameraWorldPos);
      const meshWorldPos = new THREE.Vector3();
      meshRef.current.getWorldPosition(meshWorldPos);
      const dx = cameraWorldPos.x - meshWorldPos.x;
      const dz = cameraWorldPos.z - meshWorldPos.z;
      meshRef.current.rotation.y = Math.atan2(dx, dz);
    }
  });

  return (
    <group>
      <mesh
        ref={meshRef}
        position={[position[0], position[1] + height / 2, position[2]]}
      >
        <planeGeometry args={[width, height]} />
        <cutoutMaterial
          map={texture}
          threshold={0.92}
          transparent={true}
          side={THREE.DoubleSide}
          depthWrite={true}
        />
      </mesh>
      {/* Realistic elliptical contact shadow on the ground */}
      <mesh
        position={[position[0], position[1] + 0.005, position[2]]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <circleGeometry args={[width * 0.55, 32]} />
        <meshBasicMaterial
          color="#000000"
          transparent
          opacity={0.18}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

/** Conversation group using billboard sprites */
export function BillboardConversationGroup({
  position,
  spriteUrls,
  count = 2,
}: {
  position: [number, number, number];
  spriteUrls: string[];
  count?: number;
}) {
  const angles = count === 2 ? [0, Math.PI] : [0, Math.PI * 0.7, Math.PI * 1.3];
  const radius = 0.55;

  return (
    <group position={position}>
      {angles.map((angle, i) => {
        const url = spriteUrls[i % spriteUrls.length];
        if (!url) return null;
        return (
          <BillboardFigure
            key={i}
            position={[Math.sin(angle) * radius, 0, Math.cos(angle) * radius]}
            rotation={angle + Math.PI}
            opacity={1}
            spriteUrl={url}
            height={1.7 + Math.random() * 0.1}
          />
        );
      })}
    </group>
  );
}
