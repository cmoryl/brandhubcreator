/**
 * ExpoEnvironment - Hyper-realistic expo hall environment
 * Supports multiple fidelity levels from standard to ultra-cinematic
 */
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { EnvironmentConfig } from './environmentPresets';

const FT = 0.3048;

interface ExpoEnvironmentProps {
  config: EnvironmentConfig;
}

/** Realistic expo hall carpet floor */
function ExpoCarpet({ showReflections }: { showReflections: boolean }) {
  const carpetTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // Base carpet color (deep expo blue-grey)
    ctx.fillStyle = '#2d3748';
    ctx.fillRect(0, 0, 1024, 1024);

    // Carpet fiber texture - dense noise
    for (let i = 0; i < 30000; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 1024;
      const brightness = 35 + Math.random() * 25;
      const size = 0.8 + Math.random() * 1.2;
      ctx.fillStyle = `rgb(${brightness}, ${brightness + 5}, ${brightness + 12})`;
      ctx.fillRect(x, y, size, size);
    }

    // Carpet weave pattern
    ctx.globalAlpha = 0.08;
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

    // Aisle tape markings (yellow safety tape)
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
    tex.anisotropy = 8;
    return tex;
  }, []);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 0]} receiveShadow>
      <planeGeometry args={[50, 50]} />
      <meshStandardMaterial
        map={carpetTexture}
        roughness={showReflections ? 0.85 : 0.95}
        metalness={showReflections ? 0.02 : 0}
      />
    </mesh>
  );
}

/** Ceiling truss structure - industrial aluminum */
function CeilingTrusses() {
  const trussColor = '#1a1a2e';
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
            <meshStandardMaterial color={trussColor} metalness={0.85} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0.12, 0.06]}>
            <boxGeometry args={[t.length, 0.04, 0.04]} />
            <meshStandardMaterial color={trussColor} metalness={0.85} roughness={0.2} />
          </mesh>
          {/* Main beam bottom */}
          <mesh position={[0, -0.12, -0.06]}>
            <boxGeometry args={[t.length, 0.04, 0.04]} />
            <meshStandardMaterial color={trussColor} metalness={0.85} roughness={0.2} />
          </mesh>
          <mesh position={[0, -0.12, 0.06]}>
            <boxGeometry args={[t.length, 0.04, 0.04]} />
            <meshStandardMaterial color={trussColor} metalness={0.85} roughness={0.2} />
          </mesh>
          {/* Diagonal cross braces */}
          {Array.from({ length: Math.floor(t.length / 1.5) }, (_, j) => {
            const xPos = j * 1.5 - t.length / 2 + 0.75;
            return (
              <group key={j}>
                <mesh position={[xPos, 0, 0]} rotation={[0, 0, Math.PI / 4]}>
                  <boxGeometry args={[0.02, 0.32, 0.02]} />
                  <meshStandardMaterial color={trussColor} metalness={0.85} roughness={0.2} />
                </mesh>
                <mesh position={[xPos + 0.4, 0, 0]} rotation={[0, 0, -Math.PI / 4]}>
                  <boxGeometry args={[0.02, 0.32, 0.02]} />
                  <meshStandardMaterial color={trussColor} metalness={0.85} roughness={0.2} />
                </mesh>
              </group>
            );
          })}
        </group>
      ))}
      {/* Ceiling plane */}
      <mesh position={[0, 7.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#080812" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/** Structural pillars */
function Pillars() {
  const pillarPositions = useMemo(() => {
    const positions: [number, number, number][] = [];
    for (let x = -15; x <= 15; x += 10) {
      for (let z = -15; z <= 15; z += 10) {
        if (Math.abs(x) < 5 && Math.abs(z) < 5) continue; // Keep booth area clear
        positions.push([x, 0, z]);
      }
    }
    return positions;
  }, []);

  return (
    <group>
      {pillarPositions.map((pos, i) => (
        <group key={i} position={pos}>
          <mesh position={[0, 3.75, 0]} castShadow>
            <cylinderGeometry args={[0.2, 0.25, 7.5, 12]} />
            <meshStandardMaterial color="#374151" metalness={0.3} roughness={0.6} />
          </mesh>
          {/* Base plate */}
          <mesh position={[0, 0.02, 0]}>
            <cylinderGeometry args={[0.35, 0.35, 0.04, 12]} />
            <meshStandardMaterial color="#4b5563" metalness={0.5} roughness={0.4} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Neighboring booth shells with varying levels of detail */
function NeighborBooths({ detailed }: { detailed: boolean }) {
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
    // Extra booths for cinematic fullness
    { pos: [0, 0, 14] as [number, number, number], w: 5, h: 3.0, d: 4, color: '#3f3f46', accent: '#a855f7' },
    { pos: [-8, 0, 14] as [number, number, number], w: 3, h: 2.4, d: 3, color: '#374151', accent: '#f43f5e' },
    { pos: [8, 0, 14] as [number, number, number], w: 4, h: 2.6, d: 3, color: '#3f3f46', accent: '#0ea5e9' },
  ], []);

  return (
    <group>
      {boothPositions.map((b, i) => (
        <group key={i} position={b.pos}>
          {/* Back wall */}
          <mesh position={[0, b.h / 2, -b.d / 2]} castShadow>
            <boxGeometry args={[b.w, b.h, 0.08]} />
            <meshStandardMaterial color={b.color} roughness={0.7} />
          </mesh>
          {/* Side wall */}
          <mesh position={[-b.w / 2, b.h / 2, 0]} castShadow>
            <boxGeometry args={[0.08, b.h, b.d]} />
            <meshStandardMaterial color={b.color} roughness={0.7} />
          </mesh>
          {/* Accent header strip */}
          <mesh position={[0, b.h - 0.15, -b.d / 2 + 0.05]}>
            <boxGeometry args={[b.w - 0.1, 0.3, 0.02]} />
            <meshStandardMaterial color={b.accent} emissive={b.accent} emissiveIntensity={0.15} roughness={0.3} />
          </mesh>
          {/* Counter */}
          <mesh position={[0, 0.9 * FT * 3, b.d / 2 - 0.3]}>
            <boxGeometry args={[b.w * 0.6, 0.05, 0.6]} />
            <meshStandardMaterial color="#4a5568" roughness={0.5} />
          </mesh>
          {detailed && (
            <>
              {/* Booth lighting - overhead spot */}
              <pointLight position={[0, b.h + 0.3, 0]} intensity={0.08} color={b.accent} distance={4} />
              {/* Floor mat */}
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0]}>
                <planeGeometry args={[b.w + 0.3, b.d + 0.3]} />
                <meshStandardMaterial color="#1e293b" roughness={0.9} />
              </mesh>
            </>
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
function LightRigs({ cinematic }: { cinematic: boolean }) {
  return (
    <group>
      {/* Central booth overhead cluster */}
      <group position={[0, 6.5, 0]}>
        {/* Spot cans */}
        {[[-1.5, 0, -1], [1.5, 0, -1], [-1.5, 0, 1], [1.5, 0, 1], [0, 0, 0]].map(([x, y, z], i) => (
          <group key={i} position={[x, y, z]}>
            <mesh>
              <cylinderGeometry args={[0.08, 0.12, 0.2, 8]} />
              <meshStandardMaterial color="#1a1a2e" metalness={0.9} roughness={0.2} />
            </mesh>
            {cinematic && (
              <spotLight
                position={[0, -0.1, 0]}
                angle={0.5}
                penumbra={0.8}
                intensity={0.25}
                color="#fef3c7"
                distance={8}
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
            intensity={cinematic ? 0.2 : 0.12}
            color="#e2e8f0"
            distance={20}
          />
          {/* Light fixture housing */}
          <mesh position={[x, y, z]}>
            <boxGeometry args={[0.6, 0.15, 0.3]} />
            <meshStandardMaterial color="#222" metalness={0.8} roughness={0.3} />
          </mesh>
        </group>
      ))}

      {/* Warm booth accent spots */}
      <spotLight position={[0, 6.8, 2]} angle={0.6} penumbra={0.8} intensity={cinematic ? 0.5 : 0.3} color="#fef3c7" />
      <spotLight position={[3, 6.8, -1]} angle={0.5} penumbra={0.7} intensity={cinematic ? 0.4 : 0.2} color="#fef3c7" />
      <spotLight position={[-2, 6.8, 1]} angle={0.5} penumbra={0.7} intensity={cinematic ? 0.35 : 0.15} color="#fef3c7" />
    </group>
  );
}

/** HVAC / ventilation ducts */
function VentilationDucts() {
  return (
    <group>
      {/* Main duct runs along ceiling */}
      {[-10, 10].map(x => (
        <mesh key={x} position={[x, 6.8, 0]}>
          <boxGeometry args={[0.6, 0.4, 35]} />
          <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.5} />
        </mesh>
      ))}
      {/* Cross duct */}
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
function AmbientParticles() {
  const particleRef = useRef<THREE.Points>(null);

  const particles = useMemo(() => {
    const count = 300;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 1] = Math.random() * 7;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 30;
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geom;
  }, []);

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
        size={0.015}
        color="#94a3b8"
        transparent
        opacity={0.2}
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
function EntranceBackdrop() {
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
        <meshStandardMaterial color="#1e40af" emissive="#1e40af" emissiveIntensity={0.1} />
      </mesh>
    </group>
  );
}

export function ExpoEnvironment({ config }: ExpoEnvironmentProps) {
  const cinematic = config.showLightRigs;

  return (
    <group>
      <ExpoCarpet showReflections={config.showFloorReflections} />
      <CeilingTrusses />
      <NeighborBooths detailed={cinematic} />
      <AisleMarkings />

      {config.showPillars && <Pillars />}
      {config.showExitSigns && <ExitSigns />}
      {config.showLightRigs && <LightRigs cinematic={cinematic} />}
      {config.showVentilation && <VentilationDucts />}
      {config.showCableTroughs && <CableTroughs />}
      {config.showFog && <AtmosphericFog density={config.fogDensity} />}
      {config.showAmbientParticles && <AmbientParticles />}
      {config.showBannerRigs && <EntranceBackdrop />}

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
