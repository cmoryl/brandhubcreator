/**
 * ExpoEnvironment - Hyper-realistic expo hall environment
 * Supports multiple fidelity levels from standard to hyper-realistic
 */
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { EnvironmentConfig } from './environmentPresets';

const FT = 0.3048;

interface ExpoEnvironmentProps {
  config: EnvironmentConfig;
}

/** Realistic expo hall carpet floor with procedural bump */
function ExpoCarpet({ showReflections, glossy }: { showReflections: boolean; glossy?: boolean }) {
  const { carpetTexture, bumpTexture } = useMemo(() => {
    // Color texture
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#2d3748';
    ctx.fillRect(0, 0, 1024, 1024);

    const fiberCount = glossy ? 50000 : 30000;
    for (let i = 0; i < fiberCount; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 1024;
      const brightness = 35 + Math.random() * 25;
      const size = 0.8 + Math.random() * 1.2;
      ctx.fillStyle = `rgb(${brightness}, ${brightness + 5}, ${brightness + 12})`;
      ctx.fillRect(x, y, size, size);
    }

    ctx.globalAlpha = glossy ? 0.05 : 0.08;
    for (let i = 0; i < 1024; i += 4) {
      ctx.strokeStyle = '#1a2332';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 1024);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(1024, i);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    ctx.strokeStyle = '#b8860b';
    ctx.lineWidth = 6;
    ctx.setLineDash([40, 20]);
    ctx.beginPath();
    ctx.moveTo(512, 0);
    ctx.lineTo(512, 1024);
    ctx.stroke();

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(10, 10);
    tex.anisotropy = 16;

    // Bump/roughness texture for surface detail
    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = 512;
    bumpCanvas.height = 512;
    const bCtx = bumpCanvas.getContext('2d')!;
    bCtx.fillStyle = '#808080';
    bCtx.fillRect(0, 0, 512, 512);
    // Carpet fiber bumps
    for (let i = 0; i < 20000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const v = 100 + Math.random() * 56;
      bCtx.fillStyle = `rgb(${v},${v},${v})`;
      bCtx.fillRect(x, y, 1, 1);
    }
    const bTex = new THREE.CanvasTexture(bumpCanvas);
    bTex.wrapS = bTex.wrapT = THREE.RepeatWrapping;
    bTex.repeat.set(10, 10);

    return { carpetTexture: tex, bumpTexture: bTex };
  }, [glossy]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 0]} receiveShadow>
      <planeGeometry args={[50, 50]} />
      <meshStandardMaterial
        map={carpetTexture}
        bumpMap={bumpTexture}
        bumpScale={glossy ? 0.003 : 0.005}
        roughness={glossy ? 0.6 : showReflections ? 0.85 : 0.95}
        metalness={glossy ? 0.08 : showReflections ? 0.02 : 0}
        envMapIntensity={glossy ? 0.4 : 0.1}
      />
    </mesh>
  );
}

/** Ceiling truss structure - industrial aluminum */
function CeilingTrusses({ enhanced }: { enhanced?: boolean }) {
  const trussColor = enhanced ? '#20203a' : '#1a1a2e';
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

  return (
    <group>
      {trusses.map((t, i) => (
        <group key={i} position={t.pos} rotation={t.rot}>
          {/* Main beam top */}
          <mesh position={[0, 0.12, -0.06]}>
            <boxGeometry args={[t.length, 0.04, 0.04]} />
            <meshStandardMaterial color={trussColor} metalness={enhanced ? 0.92 : 0.85} roughness={enhanced ? 0.12 : 0.2} />
          </mesh>
          <mesh position={[0, 0.12, 0.06]}>
            <boxGeometry args={[t.length, 0.04, 0.04]} />
            <meshStandardMaterial color={trussColor} metalness={enhanced ? 0.92 : 0.85} roughness={enhanced ? 0.12 : 0.2} />
          </mesh>
          {/* Main beam bottom */}
          <mesh position={[0, -0.12, -0.06]}>
            <boxGeometry args={[t.length, 0.04, 0.04]} />
            <meshStandardMaterial color={trussColor} metalness={enhanced ? 0.92 : 0.85} roughness={enhanced ? 0.12 : 0.2} />
          </mesh>
          <mesh position={[0, -0.12, 0.06]}>
            <boxGeometry args={[t.length, 0.04, 0.04]} />
            <meshStandardMaterial color={trussColor} metalness={enhanced ? 0.92 : 0.85} roughness={enhanced ? 0.12 : 0.2} />
          </mesh>
          {/* Diagonal cross braces */}
          {Array.from({ length: Math.floor(t.length / 1.5) }, (_, j) => {
            const xPos = j * 1.5 - t.length / 2 + 0.75;
            return (
              <group key={j}>
                <mesh position={[xPos, 0, 0]} rotation={[0, 0, Math.PI / 4]}>
                  <boxGeometry args={[0.02, 0.32, 0.02]} />
                  <meshStandardMaterial color={trussColor} metalness={enhanced ? 0.92 : 0.85} roughness={enhanced ? 0.12 : 0.2} />
                </mesh>
                <mesh position={[xPos + 0.4, 0, 0]} rotation={[0, 0, -Math.PI / 4]}>
                  <boxGeometry args={[0.02, 0.32, 0.02]} />
                  <meshStandardMaterial color={trussColor} metalness={enhanced ? 0.92 : 0.85} roughness={enhanced ? 0.12 : 0.2} />
                </mesh>
              </group>
            );
          })}
        </group>
      ))}
      {/* Ceiling plane */}
      <mesh position={[0, 7.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color={enhanced ? '#0a0a18' : '#080812'} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/** Structural pillars */
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
            <cylinderGeometry args={[0.2, 0.25, 7.5, enhanced ? 20 : 12]} />
            <meshStandardMaterial
              color={enhanced ? '#3a4556' : '#374151'}
              metalness={enhanced ? 0.55 : 0.3}
              roughness={enhanced ? 0.3 : 0.6}
              envMapIntensity={enhanced ? 0.6 : 0.2}
            />
          </mesh>
          {/* Base plate — polished */}
          <mesh position={[0, 0.02, 0]} receiveShadow>
            <cylinderGeometry args={[0.35, 0.35, 0.04, enhanced ? 20 : 12]} />
            <meshStandardMaterial color="#4b5563" metalness={0.6} roughness={0.25} envMapIntensity={0.5} />
          </mesh>
          {/* Capital (top plate) */}
          {enhanced && (
            <mesh position={[0, 7.48, 0]}>
              <cylinderGeometry args={[0.3, 0.22, 0.06, 20]} />
              <meshStandardMaterial color="#4b5563" metalness={0.6} roughness={0.25} envMapIntensity={0.5} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}

/** Neighboring booth shells with varying levels of detail */
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

  // Extra far-field booths for hyper mode
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
            <meshStandardMaterial color={b.color} roughness={enhanced ? 0.5 : 0.7} metalness={enhanced ? 0.08 : 0.02} envMapIntensity={enhanced ? 0.3 : 0.1} />
          </mesh>
          {/* Side wall */}
          <mesh position={[-b.w / 2, b.h / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[enhanced ? 0.1 : 0.08, b.h, b.d]} />
            <meshStandardMaterial color={b.color} roughness={enhanced ? 0.5 : 0.7} metalness={enhanced ? 0.08 : 0.02} envMapIntensity={enhanced ? 0.3 : 0.1} />
          </mesh>
          {/* Accent header strip */}
          <mesh position={[0, b.h - 0.15, -b.d / 2 + 0.06]}>
            <boxGeometry args={[b.w - 0.1, 0.3, 0.02]} />
            <meshStandardMaterial color={b.accent} emissive={b.accent} emissiveIntensity={enhanced ? 0.25 : 0.15} roughness={0.3} />
          </mesh>
          {/* Counter */}
          <mesh position={[0, 0.9 * FT * 3, b.d / 2 - 0.3]}>
            <boxGeometry args={[b.w * 0.6, 0.05, 0.6]} />
            <meshStandardMaterial color="#4a5568" roughness={0.5} />
          </mesh>
          {(detailed || enhanced) && (
            <>
              {/* Booth lighting - overhead spot */}
              <pointLight position={[0, b.h + 0.3, 0]} intensity={enhanced ? 0.12 : 0.08} color={b.accent} distance={enhanced ? 5 : 4} />
              {/* Floor mat */}
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0]}>
                <planeGeometry args={[b.w + 0.3, b.d + 0.3]} />
                <meshStandardMaterial color="#1e293b" roughness={enhanced ? 0.75 : 0.9} />
              </mesh>
            </>
          )}
          {/* Enhanced: Side return wall */}
          {enhanced && (
            <mesh position={[b.w / 2, b.h / 2, 0]} castShadow>
              <boxGeometry args={[0.1, b.h, b.d]} />
              <meshStandardMaterial color={b.color} roughness={0.6} />
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

/** Overhead lighting rigs with realistic spot fixtures */
function LightRigs({ cinematic, hyper }: { cinematic: boolean; hyper?: boolean }) {
  const spotPositions = hyper
    ? [[-1.5, 0, -1], [1.5, 0, -1], [-1.5, 0, 1], [1.5, 0, 1], [0, 0, 0], [-0.5, 0, 2], [0.5, 0, -2]]
    : [[-1.5, 0, -1], [1.5, 0, -1], [-1.5, 0, 1], [1.5, 0, 1], [0, 0, 0]];

  return (
    <group>
      {/* Central booth overhead cluster */}
      <group position={[0, 6.5, 0]}>
        {/* Spot cans */}
        {spotPositions.map(([x, y, z], i) => (
          <group key={i} position={[x, y, z]}>
            <mesh>
              <cylinderGeometry args={[0.08, 0.12, 0.2, hyper ? 12 : 8]} />
              <meshStandardMaterial color="#1a1a2e" metalness={hyper ? 0.95 : 0.9} roughness={hyper ? 0.1 : 0.2} />
            </mesh>
            {/* Light lens/glass */}
            {hyper && (
              <mesh position={[0, -0.11, 0]}>
                <cylinderGeometry args={[0.07, 0.07, 0.02, 12]} />
                <meshStandardMaterial color="#fef3c7" emissive="#fef3c7" emissiveIntensity={0.6} transparent opacity={0.4} />
              </mesh>
            )}
            {(cinematic || hyper) && (
              <spotLight
                position={[0, -0.1, 0]}
                angle={hyper ? 0.45 : 0.5}
                penumbra={hyper ? 0.9 : 0.8}
                intensity={hyper ? 0.35 : 0.25}
                color="#fef3c7"
                distance={hyper ? 10 : 8}
                castShadow
              />
            )}
          </group>
        ))}
        {/* Truss crossbar holding lights */}
        <mesh>
          <boxGeometry args={[4, 0.06, 0.06]} />
          <meshStandardMaterial color="#1a1a2e" metalness={0.85} roughness={0.2} />
        </mesh>
        <mesh rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[3, 0.06, 0.06]} />
          <meshStandardMaterial color="#1a1a2e" metalness={0.85} roughness={0.2} />
        </mesh>
      </group>

      {/* Hall perimeter floods */}
      {[[-12, 6.5, -12], [12, 6.5, -12], [-12, 6.5, 12], [12, 6.5, 12]].map(([x, y, z], i) => (
        <group key={`flood-${i}`}>
          <pointLight
            position={[x, y, z]}
            intensity={hyper ? 0.25 : cinematic ? 0.2 : 0.12}
            color="#e2e8f0"
            distance={hyper ? 25 : 20}
          />
          {/* Light fixture housing */}
          <mesh position={[x, y, z]}>
            <boxGeometry args={[0.6, 0.15, 0.3]} />
            <meshStandardMaterial color="#222" metalness={0.8} roughness={0.3} />
          </mesh>
        </group>
      ))}

      {/* Warm booth accent spots */}
      <spotLight position={[0, 6.8, 2]} angle={0.6} penumbra={0.8} intensity={hyper ? 0.6 : cinematic ? 0.5 : 0.3} color="#fef3c7" castShadow={hyper} />
      <spotLight position={[3, 6.8, -1]} angle={0.5} penumbra={0.7} intensity={hyper ? 0.5 : cinematic ? 0.4 : 0.2} color="#fef3c7" />
      <spotLight position={[-2, 6.8, 1]} angle={0.5} penumbra={0.7} intensity={hyper ? 0.45 : cinematic ? 0.35 : 0.15} color="#fef3c7" />

      {/* Hyper-mode: Additional rim and fill lights for depth */}
      {hyper && (
        <>
          <spotLight position={[-4, 6.8, 3]} angle={0.4} penumbra={0.9} intensity={0.3} color="#bfdbfe" />
          <spotLight position={[4, 6.8, -3]} angle={0.4} penumbra={0.9} intensity={0.3} color="#bfdbfe" />
          {/* Cool back-fill for depth separation */}
          <spotLight position={[0, 6.8, -4]} angle={0.3} penumbra={0.95} intensity={0.2} color="#93c5fd" />
        </>
      )}
    </group>
  );
}

/** Volumetric light cone visuals (hyper mode) */
function VolumetricLightCones() {
  const coneRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (coneRef.current) {
      // Subtle light shimmer
      coneRef.current.children.forEach((child, i) => {
        if (child instanceof THREE.Mesh) {
          const mat = child.material as THREE.MeshBasicMaterial;
          mat.opacity = 0.04 + Math.sin(state.clock.elapsedTime * 0.5 + i * 1.5) * 0.015;
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
  ];

  return (
    <group ref={coneRef}>
      {conePositions.map((pos, i) => (
        <mesh key={i} position={pos} rotation={[0, 0, 0]}>
          <coneGeometry args={[1.2 + i * 0.15, 6, 16, 1, true]} />
          <meshBasicMaterial
            color="#fef3c7"
            transparent
            opacity={0.04}
            side={THREE.DoubleSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
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
          <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.5} />
        </mesh>
      ))}
      <mesh position={[0, 6.8, -15]}>
        <boxGeometry args={[25, 0.35, 0.5]} />
        <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.5} />
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
          <meshStandardMaterial color="#374151" roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

/** Atmospheric fog overlay */
function AtmosphericFog({ density }: { density: number }) {
  return <fog attach="fog" args={['#111827', 8, 25 / density]} />;
}

/** Floating dust/ambient particles */
function AmbientParticles({ density = 300 }: { density?: number }) {
  const particleRef = useRef<THREE.Points>(null);

  const particles = useMemo(() => {
    const count = density;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 1] = Math.random() * 7;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 30;
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geom;
  }, [density]);

  useFrame((state) => {
    if (particleRef.current) {
      particleRef.current.rotation.y = state.clock.elapsedTime * 0.01;
      const positions = particleRef.current.geometry.attributes.position;
      for (let i = 0; i < positions.count; i++) {
        const y = positions.getY(i);
        positions.setY(i, y + Math.sin(state.clock.elapsedTime * 0.3 + i) * 0.001);
      }
      positions.needsUpdate = true;
    }
  });

  return (
    <points ref={particleRef} geometry={particles}>
      <pointsMaterial
        size={density > 500 ? 0.018 : 0.015}
        color="#94a3b8"
        transparent
        opacity={density > 500 ? 0.15 : 0.2}
        sizeAttenuation
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
      {/* Registration desk */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[6, 1, 1]} />
        <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.2} />
      </mesh>
      {/* Overhead banner */}
      <mesh position={[0, 4, 0]}>
        <boxGeometry args={[10, 1.5, 0.05]} />
        <meshStandardMaterial color="#1e40af" emissive="#1e40af" emissiveIntensity={enhanced ? 0.2 : 0.1} />
      </mesh>
      {/* Enhanced: stanchion posts */}
      {enhanced && (
        <>
          {[-2.5, -1, 1, 2.5].map(x => (
            <group key={x}>
              <mesh position={[x, 0.5, 1]}>
                <cylinderGeometry args={[0.03, 0.03, 1, 8]} />
                <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
              </mesh>
              <mesh position={[x, 1.02, 1]}>
                <sphereGeometry args={[0.04, 8, 6]} />
                <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
              </mesh>
            </group>
          ))}
        </>
      )}
    </group>
  );
}

/** Expo hall perimeter walls (hyper mode) */
function HallWalls() {
  const wallColor = '#1a1e2e';
  return (
    <group>
      {/* Four hall walls */}
      <mesh position={[0, 3.75, -22]}>
        <boxGeometry args={[50, 7.5, 0.15]} />
        <meshStandardMaterial color={wallColor} roughness={0.8} />
      </mesh>
      <mesh position={[0, 3.75, 22]}>
        <boxGeometry args={[50, 7.5, 0.15]} />
        <meshStandardMaterial color={wallColor} roughness={0.8} />
      </mesh>
      <mesh position={[-22, 3.75, 0]}>
        <boxGeometry args={[0.15, 7.5, 44]} />
        <meshStandardMaterial color={wallColor} roughness={0.8} />
      </mesh>
      <mesh position={[22, 3.75, 0]}>
        <boxGeometry args={[0.15, 7.5, 44]} />
        <meshStandardMaterial color={wallColor} roughness={0.8} />
      </mesh>
    </group>
  );
}

/** Floor reflection plane - subtle mirror under carpet for hyper mode */
function FloorReflectionPlane() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.008, 0]}>
      <planeGeometry args={[50, 50]} />
      <meshStandardMaterial
        color="#1a2332"
        metalness={0.15}
        roughness={0.7}
        envMapIntensity={0.3}
      />
    </mesh>
  );
}

export function ExpoEnvironment({ config }: ExpoEnvironmentProps) {
  const cinematic = config.showLightRigs;
  const isHyper = config.showVolumetricLights === true;
  const particleDensity = config.particleDensity ?? 300;

  return (
    <group>
      <ExpoCarpet showReflections={config.showFloorReflections} glossy={config.showFloorGloss} />
      {isHyper && <FloorReflectionPlane />}
      <CeilingTrusses enhanced={config.enhancedMaterials} />
      <NeighborBooths detailed={cinematic} enhanced={config.enhancedMaterials} />
      <AisleMarkings />

      {config.showPillars && <Pillars enhanced={config.enhancedMaterials} />}
      {config.showExitSigns && <ExitSigns />}
      {config.showLightRigs && <LightRigs cinematic={cinematic} hyper={isHyper} />}
      {config.showVentilation && <VentilationDucts />}
      {config.showCableTroughs && <CableTroughs />}
      {config.showFog && <AtmosphericFog density={config.fogDensity} />}
      {config.showAmbientParticles && <AmbientParticles density={particleDensity} />}
      {config.showBannerRigs && <EntranceBackdrop enhanced={config.enhancedMaterials} />}

      {/* Hyper-mode exclusives */}
      {isHyper && <VolumetricLightCones />}
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
    </group>
  );
}
