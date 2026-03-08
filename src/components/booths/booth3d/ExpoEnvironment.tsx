/**
 * ExpoEnvironment - Hyper-realistic expo hall environment
 * Supports multiple fidelity levels from standard to hyper-realistic
 * with advanced PBR materials, procedural textures, contact shadows,
 * volumetric light shafts, and real-time atmospheric effects.
 */
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { EnvironmentConfig } from './environmentPresets';

const FT = 0.3048;

interface ExpoEnvironmentProps {
  config: EnvironmentConfig;
  /** When true, hides ceiling trusses, light rigs, ventilation, and overhead elements for aerial/top-down view */
  isAerialView?: boolean;
}

// ─── Procedural Texture Utilities ──────────────────────────

/** Generate a high-quality procedural carpet texture with fiber detail */
function createCarpetTextures(glossy: boolean, resolution = 1024) {
  // Color texture
  const canvas = document.createElement('canvas');
  canvas.width = resolution;
  canvas.height = resolution;
  const ctx = canvas.getContext('2d')!;

  // Base carpet color — dark charcoal with subtle blue undertone
  const baseR = 38, baseG = 42, baseB = 56;
  ctx.fillStyle = `rgb(${baseR},${baseG},${baseB})`;
  ctx.fillRect(0, 0, resolution, resolution);

  // Carpet fiber layer 1: fine grain
  const fiberCount = glossy ? 80000 : 50000;
  for (let i = 0; i < fiberCount; i++) {
    const x = Math.random() * resolution;
    const y = Math.random() * resolution;
    const variance = (Math.random() - 0.5) * 18;
    const r = Math.max(0, Math.min(255, baseR + variance));
    const g = Math.max(0, Math.min(255, baseG + variance + 2));
    const b = Math.max(0, Math.min(255, baseB + variance + 5));
    ctx.fillStyle = `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
    ctx.fillRect(x, y, 0.8 + Math.random() * 0.8, 0.8 + Math.random() * 1.2);
  }

  // Carpet fiber layer 2: directional weave pattern
  ctx.globalAlpha = 0.04;
  for (let i = 0; i < resolution; i += 3) {
    ctx.strokeStyle = i % 6 === 0 ? '#1a2332' : '#2a3444';
    ctx.lineWidth = 0.3;
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, resolution);
    ctx.stroke();
  }
  ctx.globalAlpha = 0.03;
  for (let i = 0; i < resolution; i += 4) {
    ctx.strokeStyle = '#1a2332';
    ctx.lineWidth = 0.3;
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(resolution, i);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Aisle marking — gold dashed center line
  ctx.strokeStyle = '#b8860b';
  ctx.lineWidth = 5;
  ctx.setLineDash([40, 20]);
  ctx.beginPath();
  ctx.moveTo(resolution / 2, 0);
  ctx.lineTo(resolution / 2, resolution);
  ctx.stroke();
  ctx.setLineDash([]);

  // Subtle wear pattern (lighter patches)
  ctx.globalAlpha = 0.015;
  for (let i = 0; i < 12; i++) {
    const cx = Math.random() * resolution;
    const cy = Math.random() * resolution;
    const radius = 30 + Math.random() * 80;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    grad.addColorStop(0, '#5a6070');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
  }
  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(12, 12);
  tex.anisotropy = 16;
  tex.colorSpace = THREE.SRGBColorSpace;

  // Bump/roughness texture for surface detail
  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = 512;
  bumpCanvas.height = 512;
  const bCtx = bumpCanvas.getContext('2d')!;
  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 30000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const v = 100 + Math.random() * 56;
    bCtx.fillStyle = `rgb(${v},${v},${v})`;
    bCtx.fillRect(x, y, 0.8, 0.8);
  }
  // Add directional fiber pattern to bump
  bCtx.globalAlpha = 0.08;
  for (let i = 0; i < 512; i += 2) {
    bCtx.strokeStyle = i % 4 === 0 ? '#606060' : '#a0a0a0';
    bCtx.lineWidth = 0.5;
    bCtx.beginPath();
    bCtx.moveTo(i, 0);
    bCtx.lineTo(i, 512);
    bCtx.stroke();
  }
  bCtx.globalAlpha = 1;

  const bTex = new THREE.CanvasTexture(bumpCanvas);
  bTex.wrapS = bTex.wrapT = THREE.RepeatWrapping;
  bTex.repeat.set(12, 12);

  // Roughness map for hyper mode
  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = 256;
  roughCanvas.height = 256;
  const rCtx = roughCanvas.getContext('2d')!;
  rCtx.fillStyle = glossy ? '#a0a0a0' : '#d0d0d0'; // lower = smoother
  rCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 8000; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const v = glossy ? 140 + Math.random() * 40 : 180 + Math.random() * 40;
    rCtx.fillStyle = `rgb(${v},${v},${v})`;
    rCtx.fillRect(x, y, 1.5, 1.5);
  }
  const rTex = new THREE.CanvasTexture(roughCanvas);
  rTex.wrapS = rTex.wrapT = THREE.RepeatWrapping;
  rTex.repeat.set(12, 12);

  return { carpetTexture: tex, bumpTexture: bTex, roughnessTexture: rTex };
}

/** Create a polished concrete/epoxy floor texture for hyper mode */
function createPolishedFloorTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Base — dark polished concrete
  ctx.fillStyle = '#1e2433';
  ctx.fillRect(0, 0, 1024, 1024);

  // Aggregate speckles
  for (let i = 0; i < 15000; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const v = 25 + Math.random() * 30;
    const size = 0.5 + Math.random() * 2;
    ctx.fillStyle = `rgba(${v + 10},${v + 15},${v + 25}, 0.6)`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  // Subtle veining
  ctx.globalAlpha = 0.03;
  for (let i = 0; i < 8; i++) {
    ctx.strokeStyle = '#3a4555';
    ctx.lineWidth = 1 + Math.random() * 2;
    ctx.beginPath();
    let x = Math.random() * 1024;
    let y = Math.random() * 1024;
    ctx.moveTo(x, y);
    for (let j = 0; j < 20; j++) {
      x += (Math.random() - 0.5) * 100;
      y += (Math.random() - 0.5) * 100;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 8);
  tex.anisotropy = 16;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ─── Environment Sub-Components ──────────────────────────

/** Realistic expo hall carpet floor with procedural PBR */
function ExpoCarpet({ showReflections, glossy }: { showReflections: boolean; glossy?: boolean }) {
  const { carpetTexture, bumpTexture, roughnessTexture } = useMemo(
    () => createCarpetTextures(!!glossy),
    [glossy]
  );

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 0]} receiveShadow>
      <planeGeometry args={[50, 50]} />
      <meshStandardMaterial
        map={carpetTexture}
        bumpMap={bumpTexture}
        bumpScale={glossy ? 0.002 : 0.004}
        roughnessMap={roughnessTexture}
        roughness={glossy ? 0.55 : showReflections ? 0.82 : 0.95}
        metalness={glossy ? 0.1 : showReflections ? 0.02 : 0}
        envMapIntensity={glossy ? 0.5 : 0.1}
      />
    </mesh>
  );
}

/** Polished epoxy floor overlay for hyper mode — adds specular reflections */
function PolishedFloor() {
  const floorTexture = useMemo(() => createPolishedFloorTexture(), []);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.003, 0]} receiveShadow>
      <planeGeometry args={[50, 50]} />
      <meshPhysicalMaterial
        map={floorTexture}
        roughness={0.18}
        metalness={0.05}
        clearcoat={0.6}
        clearcoatRoughness={0.15}
        reflectivity={0.8}
        envMapIntensity={1.2}
        color="#242a38"
      />
    </mesh>
  );
}

/** Floor reflection plane — subtle mirror under carpet for hyper mode */
function FloorReflectionPlane() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.008, 0]}>
      <planeGeometry args={[50, 50]} />
      <meshPhysicalMaterial
        color="#141a28"
        metalness={0.2}
        roughness={0.55}
        envMapIntensity={0.5}
        clearcoat={0.3}
        clearcoatRoughness={0.25}
      />
    </mesh>
  );
}

/** Ceiling truss structure - industrial aluminum with PBR */
function CeilingTrusses({ enhanced }: { enhanced?: boolean }) {
  const trussColor = enhanced ? '#1a1a30' : '#1a1a2e';
  const trusses = useMemo(() => {
    const items: { pos: [number, number, number]; rot: [number, number, number]; length: number }[] = [];
    for (let x = -15; x <= 15; x += 5) {
      items.push({ pos: [x, 7, 0], rot: [0, 0, 0], length: 40 });
    }
    for (let z = -15; z <= 15; z += 5) {
      items.push({ pos: [0, 7, z], rot: [0, Math.PI / 2, 0], length: 40 });
    }
    return items;
  }, []);

  const trussMat = useMemo(() => ({
    color: trussColor,
    metalness: enhanced ? 0.95 : 0.85,
    roughness: enhanced ? 0.08 : 0.2,
    envMapIntensity: enhanced ? 0.8 : 0.3,
  }), [trussColor, enhanced]);

  return (
    <group>
      {trusses.map((t, i) => (
        <group key={i} position={t.pos} rotation={t.rot}>
          {/* Main beam — 4 chord members */}
          {[[-0.06, 0.12], [0.06, 0.12], [-0.06, -0.12], [0.06, -0.12]].map(([zOff, yOff], j) => (
            <mesh key={j} position={[0, yOff, zOff]}>
              <boxGeometry args={[t.length, 0.04, 0.04]} />
              <meshStandardMaterial {...trussMat} />
            </mesh>
          ))}
          {/* Diagonal cross braces */}
          {Array.from({ length: Math.floor(t.length / 1.5) }, (_, j) => {
            const xPos = j * 1.5 - t.length / 2 + 0.75;
            return (
              <group key={j}>
                <mesh position={[xPos, 0, 0]} rotation={[0, 0, Math.PI / 4]}>
                  <boxGeometry args={[0.015, 0.32, 0.015]} />
                  <meshStandardMaterial {...trussMat} />
                </mesh>
                <mesh position={[xPos + 0.4, 0, 0]} rotation={[0, 0, -Math.PI / 4]}>
                  <boxGeometry args={[0.015, 0.32, 0.015]} />
                  <meshStandardMaterial {...trussMat} />
                </mesh>
              </group>
            );
          })}
        </group>
      ))}
      {/* Ceiling plane — dark void */}
      <mesh position={[0, 7.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color={enhanced ? '#060610' : '#080812'} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/** Structural pillars with PBR materials */
function Pillars({ enhanced }: { enhanced?: boolean }) {
  const pillarPositions = useMemo(() => {
    const positions: [number, number, number][] = [];
    for (let x = -15; x <= 15; x += 10) {
      for (let z = -15; z <= 15; z += 10) {
        if (Math.abs(x) < 5 && Math.abs(z) < 5) continue;
        positions.push([x, 0, z]);
      }
    }
    return positions;
  }, []);

  return (
    <group>
      {pillarPositions.map((pos, i) => (
        <group key={i} position={pos}>
          <mesh position={[0, 3.75, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.2, 0.25, 7.5, enhanced ? 24 : 12]} />
            <meshStandardMaterial
              color={enhanced ? '#3a4556' : '#374151'}
              metalness={enhanced ? 0.6 : 0.3}
              roughness={enhanced ? 0.25 : 0.6}
              envMapIntensity={enhanced ? 0.7 : 0.2}
            />
          </mesh>
          {/* Base plate */}
          <mesh position={[0, 0.02, 0]} receiveShadow>
            <cylinderGeometry args={[0.35, 0.35, 0.04, enhanced ? 24 : 12]} />
            <meshStandardMaterial color="#4b5563" metalness={0.65} roughness={0.2} envMapIntensity={0.6} />
          </mesh>
          {enhanced && (
            <mesh position={[0, 7.48, 0]}>
              <cylinderGeometry args={[0.3, 0.22, 0.06, 24]} />
              <meshStandardMaterial color="#4b5563" metalness={0.65} roughness={0.2} envMapIntensity={0.6} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}

/** Neighboring booth shells with enhanced PBR materials */
function NeighborBooths({ detailed, enhanced }: { detailed: boolean; enhanced?: boolean }) {
  const boothPositions = useMemo(() => [
    { pos: [-10, 0, -8] as [number, number, number], w: 3, h: 2.4, d: 3, color: '#374151', accent: '#3b82f6' },
    { pos: [-10, 0, 0] as [number, number, number], w: 3, h: 2.8, d: 4, color: '#3f3f46', accent: '#ef4444' },
    { pos: [-10, 0, 8] as [number, number, number], w: 3, h: 2.4, d: 3, color: '#374151', accent: '#22c55e' },
    { pos: [10, 0, -8] as [number, number, number], w: 4, h: 2.6, d: 3, color: '#3f3f46', accent: '#f59e0b' },
    { pos: [10, 0, 0] as [number, number, number], w: 3, h: 2.4, d: 3, color: '#374151', accent: '#8b5cf6' },
    { pos: [10, 0, 8] as [number, number, number], w: 3, h: 3.0, d: 4, color: '#3f3f46', accent: '#06b6d4' },
    { pos: [0, 0, -12] as [number, number, number], w: 4, h: 2.4, d: 3, color: '#374151', accent: '#ec4899' },
    { pos: [6, 0, -12] as [number, number, number], w: 3, h: 2.6, d: 3, color: '#3f3f46', accent: '#14b8a6' },
    { pos: [-6, 0, -12] as [number, number, number], w: 3, h: 2.4, d: 3, color: '#374151', accent: '#f97316' },
    { pos: [0, 0, 14] as [number, number, number], w: 5, h: 3.0, d: 4, color: '#3f3f46', accent: '#a855f7' },
    { pos: [-8, 0, 14] as [number, number, number], w: 3, h: 2.4, d: 3, color: '#374151', accent: '#f43f5e' },
    { pos: [8, 0, 14] as [number, number, number], w: 4, h: 2.6, d: 3, color: '#3f3f46', accent: '#0ea5e9' },
  ], []);

  const farBooths = useMemo(() => enhanced ? [
    { pos: [-16, 0, -8] as [number, number, number], w: 3, h: 2.2, d: 2.5, color: '#2d3748', accent: '#94a3b8' },
    { pos: [-16, 0, 4] as [number, number, number], w: 3, h: 2.4, d: 3, color: '#2d3748', accent: '#64748b' },
    { pos: [16, 0, -4] as [number, number, number], w: 3, h: 2.4, d: 2.5, color: '#2d3748', accent: '#94a3b8' },
    { pos: [16, 0, 8] as [number, number, number], w: 3, h: 2.6, d: 3, color: '#2d3748', accent: '#64748b' },
    { pos: [0, 0, -18] as [number, number, number], w: 5, h: 2.8, d: 3, color: '#2d3748', accent: '#475569' },
    { pos: [10, 0, -18] as [number, number, number], w: 3, h: 2.4, d: 2.5, color: '#2d3748', accent: '#94a3b8' },
    { pos: [-10, 0, -18] as [number, number, number], w: 4, h: 2.6, d: 3, color: '#2d3748', accent: '#64748b' },
    { pos: [0, 0, 20] as [number, number, number], w: 6, h: 3.0, d: 4, color: '#2d3748', accent: '#475569' },
  ] : [], [enhanced]);

  const allBooths = [...boothPositions, ...farBooths];

  return (
    <group>
      {allBooths.map((b, i) => (
        <group key={i} position={b.pos}>
          {/* Back wall — matte fabric panel */}
          <mesh position={[0, b.h / 2, -b.d / 2]} castShadow receiveShadow>
            <boxGeometry args={[b.w, b.h, enhanced ? 0.1 : 0.08]} />
            <meshStandardMaterial
              color={b.color}
              roughness={enhanced ? 0.45 : 0.7}
              metalness={enhanced ? 0.1 : 0.02}
              envMapIntensity={enhanced ? 0.4 : 0.1}
            />
          </mesh>
          {/* Side wall */}
          <mesh position={[-b.w / 2, b.h / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[enhanced ? 0.1 : 0.08, b.h, b.d]} />
            <meshStandardMaterial
              color={b.color}
              roughness={enhanced ? 0.45 : 0.7}
              metalness={enhanced ? 0.1 : 0.02}
              envMapIntensity={enhanced ? 0.4 : 0.1}
            />
          </mesh>
          {/* Accent header strip — emissive glow */}
          <mesh position={[0, b.h - 0.15, -b.d / 2 + 0.06]}>
            <boxGeometry args={[b.w - 0.1, 0.3, 0.02]} />
            <meshStandardMaterial
              color={b.accent}
              emissive={b.accent}
              emissiveIntensity={enhanced ? 0.35 : 0.15}
              roughness={0.2}
              metalness={enhanced ? 0.15 : 0.05}
            />
          </mesh>
          {/* Counter */}
          <mesh position={[0, 0.9 * FT * 3, b.d / 2 - 0.3]}>
            <boxGeometry args={[b.w * 0.6, 0.05, 0.6]} />
            <meshStandardMaterial color="#4a5568" roughness={0.4} metalness={0.1} />
          </mesh>
          {(detailed || enhanced) && (
            <>
              <pointLight position={[0, b.h + 0.3, 0]} intensity={enhanced ? 0.15 : 0.08} color={b.accent} distance={enhanced ? 6 : 4} />
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0]}>
                <planeGeometry args={[b.w + 0.3, b.d + 0.3]} />
                <meshStandardMaterial color="#1e293b" roughness={enhanced ? 0.7 : 0.9} />
              </mesh>
            </>
          )}
          {enhanced && (
            <mesh position={[b.w / 2, b.h / 2, 0]} castShadow>
              <boxGeometry args={[0.1, b.h, b.d]} />
              <meshStandardMaterial color={b.color} roughness={0.5} metalness={0.08} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}

/** Exit signs and wayfinding */
function ExitSigns() {
  const signPositions = useMemo(() => [
    { pos: [-18, 5.5, 0] as [number, number, number], rot: Math.PI / 2 },
    { pos: [18, 5.5, 0] as [number, number, number], rot: -Math.PI / 2 },
    { pos: [0, 5.5, -18] as [number, number, number], rot: 0 },
    { pos: [0, 5.5, 18] as [number, number, number], rot: Math.PI },
  ], []);

  return (
    <group>
      {signPositions.map((s, i) => (
        <group key={i} position={s.pos} rotation={[0, s.rot, 0]}>
          <mesh>
            <boxGeometry args={[0.8, 0.3, 0.05]} />
            <meshStandardMaterial color="#16a34a" emissive="#16a34a" emissiveIntensity={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Overhead lighting rigs with realistic spot fixtures + detailed housings */
function LightRigs({ cinematic, hyper }: { cinematic: boolean; hyper?: boolean }) {
  const spotPositions = hyper
    ? [[-1.5, 0, -1], [1.5, 0, -1], [-1.5, 0, 1], [1.5, 0, 1], [0, 0, 0], [-0.5, 0, 2], [0.5, 0, -2], [-2.5, 0, 0], [2.5, 0, 0]]
    : [[-1.5, 0, -1], [1.5, 0, -1], [-1.5, 0, 1], [1.5, 0, 1], [0, 0, 0]];

  return (
    <group>
      {/* Central booth overhead cluster */}
      <group position={[0, 6.5, 0]}>
        {spotPositions.map(([x, y, z], i) => (
          <group key={i} position={[x, y, z]}>
            {/* Light housing — PAR can body */}
            <mesh>
              <cylinderGeometry args={[0.08, 0.12, 0.22, hyper ? 16 : 8]} />
              <meshStandardMaterial color="#111122" metalness={hyper ? 0.97 : 0.9} roughness={hyper ? 0.06 : 0.2} />
            </mesh>
            {/* Yoke mount */}
            {hyper && (
              <mesh position={[0, 0.14, 0]}>
                <boxGeometry args={[0.03, 0.06, 0.16]} />
                <meshStandardMaterial color="#1a1a2e" metalness={0.9} roughness={0.1} />
              </mesh>
            )}
            {/* Light lens/glass — glowing */}
            {hyper && (
              <mesh position={[0, -0.12, 0]}>
                <cylinderGeometry args={[0.065, 0.065, 0.015, 16]} />
                <meshStandardMaterial color="#fef3c7" emissive="#fef3c7" emissiveIntensity={0.8} transparent opacity={0.5} />
              </mesh>
            )}
            {(cinematic || hyper) && (
              <spotLight
                position={[0, -0.12, 0]}
                angle={hyper ? 0.42 : 0.5}
                penumbra={hyper ? 0.92 : 0.8}
                intensity={hyper ? 0.4 : 0.25}
                color="#fef3c7"
                distance={hyper ? 12 : 8}
                castShadow={hyper}
                shadow-mapSize={hyper ? [2048, 2048] : [1024, 1024]}
                shadow-bias={-0.0002}
              />
            )}
          </group>
        ))}
        {/* Truss crossbars */}
        <mesh>
          <boxGeometry args={[6, 0.06, 0.06]} />
          <meshStandardMaterial color="#111122" metalness={0.9} roughness={0.12} />
        </mesh>
        <mesh rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[5, 0.06, 0.06]} />
          <meshStandardMaterial color="#111122" metalness={0.9} roughness={0.12} />
        </mesh>
      </group>

      {/* Hall perimeter floods */}
      {[[-12, 6.5, -12], [12, 6.5, -12], [-12, 6.5, 12], [12, 6.5, 12]].map(([x, y, z], i) => (
        <group key={`flood-${i}`}>
          <pointLight
            position={[x, y, z]}
            intensity={hyper ? 0.3 : cinematic ? 0.2 : 0.12}
            color="#e2e8f0"
            distance={hyper ? 28 : 20}
          />
          <mesh position={[x, y, z]}>
            <boxGeometry args={[0.6, 0.15, 0.3]} />
            <meshStandardMaterial color="#181825" metalness={0.85} roughness={0.25} />
          </mesh>
        </group>
      ))}

      {/* Warm booth accent spots */}
      <spotLight position={[0, 6.8, 2]} angle={0.6} penumbra={0.85} intensity={hyper ? 0.7 : cinematic ? 0.5 : 0.3} color="#fef3c7" castShadow={hyper} shadow-mapSize={[2048, 2048]} shadow-bias={-0.0002} />
      <spotLight position={[3, 6.8, -1]} angle={0.5} penumbra={0.75} intensity={hyper ? 0.55 : cinematic ? 0.4 : 0.2} color="#fef3c7" />
      <spotLight position={[-2, 6.8, 1]} angle={0.5} penumbra={0.75} intensity={hyper ? 0.5 : cinematic ? 0.35 : 0.15} color="#fef3c7" />

      {/* Hyper-mode: additional rim and fill lights for cinematic depth */}
      {hyper && (
        <>
          <spotLight position={[-4, 6.8, 3]} angle={0.38} penumbra={0.95} intensity={0.35} color="#bfdbfe" />
          <spotLight position={[4, 6.8, -3]} angle={0.38} penumbra={0.95} intensity={0.35} color="#bfdbfe" />
          <spotLight position={[0, 6.8, -4]} angle={0.28} penumbra={0.98} intensity={0.25} color="#93c5fd" />
          {/* Warm kicker from below-right */}
          <pointLight position={[5, 1.5, 3]} intensity={0.08} color="#f8e4c8" distance={8} />
          {/* Cool ambient bounced light */}
          <pointLight position={[-3, 0.5, -2]} intensity={0.06} color="#94a3b8" distance={6} />
        </>
      )}
    </group>
  );
}

/** Volumetric light cone visuals with animated shimmer */
function VolumetricLightCones() {
  const coneRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (coneRef.current) {
      coneRef.current.children.forEach((child, i) => {
        if (child instanceof THREE.Mesh) {
          const mat = child.material as THREE.MeshBasicMaterial;
          mat.opacity = 0.035 + Math.sin(state.clock.elapsedTime * 0.4 + i * 1.8) * 0.012;
        }
      });
    }
  });

  const conePositions: [number, number, number][] = [
    [0, 3.5, 1],
    [-1.5, 3.5, -0.5],
    [1.5, 3.5, 0],
    [3, 3.5, -1],
    [-2, 3.5, 2],
    [-0.5, 3.5, -2],
    [2.5, 3.5, 1.5],
  ];

  return (
    <group ref={coneRef}>
      {conePositions.map((pos, i) => (
        <mesh key={i} position={pos}>
          <coneGeometry args={[1.0 + i * 0.12, 6, 20, 1, true]} />
          <meshBasicMaterial
            color="#fef3c7"
            transparent
            opacity={0.035}
            side={THREE.DoubleSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}

/** Animated light shafts — rays of light cutting through atmosphere */
function LightShafts() {
  const shaftRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (shaftRef.current) {
      shaftRef.current.children.forEach((child, i) => {
        if (child instanceof THREE.Mesh) {
          const mat = child.material as THREE.MeshBasicMaterial;
          mat.opacity = 0.018 + Math.sin(state.clock.elapsedTime * 0.2 + i * 2.5) * 0.008;
          child.rotation.y = Math.sin(state.clock.elapsedTime * 0.05 + i) * 0.03;
        }
      });
    }
  });

  return (
    <group ref={shaftRef}>
      {[[-3, 6.5, 2], [2, 6.5, -1], [0, 6.5, 3], [4, 6.5, 0], [-1, 6.5, -3]].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y / 2, z]} rotation={[0, 0, (i - 2) * 0.08]}>
          <boxGeometry args={[0.3 + i * 0.05, y, 0.3 + i * 0.05]} />
          <meshBasicMaterial
            color="#fef9c3"
            transparent
            opacity={0.02}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

/** Neon accent strips on neighbor booths for visual pop */
function NeonAccents() {
  const neonRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (neonRef.current) {
      neonRef.current.children.forEach((child, i) => {
        if (child instanceof THREE.Mesh) {
          const mat = child.material as THREE.MeshStandardMaterial;
          mat.emissiveIntensity = 0.4 + Math.sin(state.clock.elapsedTime * 0.8 + i * 1.2) * 0.15;
        }
      });
    }
  });

  const strips: { pos: [number, number, number]; rot: number; length: number; color: string }[] = [
    { pos: [-10, 0.02, -8], rot: 0, length: 3, color: '#3b82f6' },
    { pos: [10, 0.02, 0], rot: 0, length: 3, color: '#8b5cf6' },
    { pos: [0, 0.02, 14], rot: 0, length: 5, color: '#a855f7' },
    { pos: [-10, 0.02, 0], rot: 0, length: 3, color: '#ef4444' },
    { pos: [10, 0.02, 8], rot: 0, length: 3, color: '#06b6d4' },
  ];

  return (
    <group ref={neonRef}>
      {strips.map((s, i) => (
        <mesh key={i} position={s.pos} rotation={[-Math.PI / 2, 0, s.rot]}>
          <planeGeometry args={[s.length, 0.04]} />
          <meshStandardMaterial
            color={s.color}
            emissive={s.color}
            emissiveIntensity={0.5}
            transparent
            opacity={0.8}
          />
        </mesh>
      ))}
    </group>
  );
}

/** HVAC / ventilation ducts */
function VentilationDucts() {
  return (
    <group>
      {[-10, 10].map(x => (
        <mesh key={x} position={[x, 6.8, 0]}>
          <boxGeometry args={[0.6, 0.4, 35]} />
          <meshStandardMaterial color="#1e293b" metalness={0.55} roughness={0.45} />
        </mesh>
      ))}
      <mesh position={[0, 6.8, -15]}>
        <boxGeometry args={[25, 0.35, 0.5]} />
        <meshStandardMaterial color="#1e293b" metalness={0.55} roughness={0.45} />
      </mesh>
    </group>
  );
}

/** Cable troughs along floor edges */
function CableTroughs() {
  return (
    <group>
      {[-7, 7].map(x => (
        <mesh key={x} position={[x, 0.02, 0]}>
          <boxGeometry args={[0.15, 0.04, 30]} />
          <meshStandardMaterial color="#374151" roughness={0.7} metalness={0.15} />
        </mesh>
      ))}
    </group>
  );
}

/** Atmospheric fog overlay */
function AtmosphericFog({ density }: { density: number }) {
  return <fog attach="fog" args={['#0c1018', 10, 28 / density]} />;
}

/** Floating dust/ambient particles with improved animation */
function AmbientParticles({ density = 300 }: { density?: number }) {
  const particleRef = useRef<THREE.Points>(null);

  const { geometry, velocities } = useMemo(() => {
    const count = density;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const vels = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 35;
      positions[i * 3 + 1] = Math.random() * 7;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 35;
      sizes[i] = 0.008 + Math.random() * 0.015;
      vels[i * 3] = (Math.random() - 0.5) * 0.003;
      vels[i * 3 + 1] = (Math.random() - 0.5) * 0.001;
      vels[i * 3 + 2] = (Math.random() - 0.5) * 0.003;
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    return { geometry: geom, velocities: vels };
  }, [density]);

  useFrame((state) => {
    if (particleRef.current) {
      const positions = particleRef.current.geometry.attributes.position;
      const dt = 0.6;
      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i) + velocities[i * 3] * dt;
        const y = positions.getY(i) + velocities[i * 3 + 1] * dt + Math.sin(state.clock.elapsedTime * 0.15 + i * 0.5) * 0.0003;
        const z = positions.getZ(i) + velocities[i * 3 + 2] * dt;
        positions.setXYZ(i, x, y, z);
      }
      positions.needsUpdate = true;
      particleRef.current.rotation.y = state.clock.elapsedTime * 0.005;
    }
  });

  return (
    <points ref={particleRef} geometry={geometry}>
      <pointsMaterial
        size={density > 500 ? 0.02 : 0.015}
        color="#b0bcc8"
        transparent
        opacity={density > 500 ? 0.12 : 0.18}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/** Aisle markers and directional arrows on floor */
function AisleMarkings() {
  return (
    <group>
      {[-7, 7].map((x) => (
        <mesh key={x} position={[x, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.08, 30]} />
          <meshBasicMaterial color="#4a5568" transparent opacity={0.5} />
        </mesh>
      ))}
      {[-7, 7].map((z) => (
        <mesh key={z} position={[0, 0.001, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[30, 0.08]} />
          <meshBasicMaterial color="#4a5568" transparent opacity={0.5} />
        </mesh>
      ))}
    </group>
  );
}

/** Registration / entrance area backdrop */
function EntranceBackdrop({ enhanced }: { enhanced?: boolean }) {
  return (
    <group position={[0, 0, 20]}>
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[6, 1, 1]} />
        <meshStandardMaterial color="#1e293b" roughness={0.35} metalness={0.25} envMapIntensity={enhanced ? 0.5 : 0.2} />
      </mesh>
      <mesh position={[0, 4, 0]}>
        <boxGeometry args={[10, 1.5, 0.05]} />
        <meshStandardMaterial color="#1e40af" emissive="#1e40af" emissiveIntensity={enhanced ? 0.25 : 0.1} />
      </mesh>
      {enhanced && (
        <>
          {[-2.5, -1, 1, 2.5].map(x => (
            <group key={x}>
              <mesh position={[x, 0.5, 1]}>
                <cylinderGeometry args={[0.03, 0.03, 1, 10]} />
                <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.15} />
              </mesh>
              <mesh position={[x, 1.02, 1]}>
                <sphereGeometry args={[0.04, 10, 8]} />
                <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.15} />
              </mesh>
            </group>
          ))}
        </>
      )}
    </group>
  );
}

/** Expo hall perimeter walls with PBR */
function HallWalls() {
  const wallColor = '#161a28';
  return (
    <group>
      <mesh position={[0, 3.75, -22]}>
        <boxGeometry args={[50, 7.5, 0.15]} />
        <meshStandardMaterial color={wallColor} roughness={0.75} metalness={0.05} envMapIntensity={0.2} />
      </mesh>
      <mesh position={[0, 3.75, 22]}>
        <boxGeometry args={[50, 7.5, 0.15]} />
        <meshStandardMaterial color={wallColor} roughness={0.75} metalness={0.05} envMapIntensity={0.2} />
      </mesh>
      <mesh position={[-22, 3.75, 0]}>
        <boxGeometry args={[0.15, 7.5, 44]} />
        <meshStandardMaterial color={wallColor} roughness={0.75} metalness={0.05} envMapIntensity={0.2} />
      </mesh>
      <mesh position={[22, 3.75, 0]}>
        <boxGeometry args={[0.15, 7.5, 44]} />
        <meshStandardMaterial color={wallColor} roughness={0.75} metalness={0.05} envMapIntensity={0.2} />
      </mesh>
    </group>
  );
}

// ─── Main Exported Component ──────────────────────────

export function ExpoEnvironment({ config, isAerialView = false }: ExpoEnvironmentProps) {
  const cinematic = config.showLightRigs;
  const isHyper = config.showVolumetricLights === true;
  const particleDensity = config.particleDensity ?? 300;

  return (
    <group>
      {/* Floor layers — stacked for depth */}
      {config.showPolishedFloor ? (
        <>
          <FloorReflectionPlane />
          <PolishedFloor />
        </>
      ) : (
        <>
          <ExpoCarpet showReflections={config.showFloorReflections} glossy={config.showFloorGloss} />
          {isHyper && <FloorReflectionPlane />}
        </>
      )}

      {/* Ceiling & overhead elements hidden during aerial view */}
      {!isAerialView && <CeilingTrusses enhanced={config.enhancedMaterials} />}
      <NeighborBooths detailed={cinematic} enhanced={config.enhancedMaterials} />
      <AisleMarkings />

      {config.showPillars && <Pillars enhanced={config.enhancedMaterials} />}
      {config.showExitSigns && <ExitSigns />}
      {!isAerialView && config.showLightRigs && <LightRigs cinematic={cinematic} hyper={isHyper} />}
      {!isAerialView && config.showVentilation && <VentilationDucts />}
      {!isAerialView && config.showCableTroughs && <CableTroughs />}
      {config.showFog && !isAerialView && <AtmosphericFog density={config.fogDensity} />}
      {config.showAmbientParticles && !isAerialView && <AmbientParticles density={particleDensity} />}
      {!isAerialView && config.showBannerRigs && <EntranceBackdrop enhanced={config.enhancedMaterials} />}

      {/* Hyper-mode exclusives — volumetric cones & light shafts hidden in aerial */}
      {!isAerialView && isHyper && <VolumetricLightCones />}
      {!isAerialView && config.showLightShafts && <LightShafts />}
      {config.showNeonAccents && <NeonAccents />}
      {config.showDetailedWalls && <HallWalls />}

      {/* Base expo lighting (when no light rigs) */}
      {!config.showLightRigs && (
        <>
          <pointLight position={[-8, 6.5, -8]} intensity={0.15} color="#e2e8f0" />
          <pointLight position={[8, 6.5, -8]} intensity={0.15} color="#e2e8f0" />
          <pointLight position={[-8, 6.5, 8]} intensity={0.15} color="#e2e8f0" />
          <pointLight position={[8, 6.5, 8]} intensity={0.15} color="#e2e8f0" />
          <spotLight position={[0, 6.8, 2]} angle={0.6} penumbra={0.8} intensity={0.4} color="#fef3c7" />
        </>
      )}

      {/* Extra top-down lighting for aerial view clarity */}
      {isAerialView && (
        <>
          <ambientLight intensity={0.9} />
          <directionalLight position={[0, 15, 0]} intensity={1.2} castShadow={false} />
        </>
      )}
    </group>
  );
}
