/**
 * ExpoEnvironment - Realistic expo hall environment with floor, ceiling trusses,
 * neighboring booth shells, carpet, and aisle markings
 */
import { useMemo } from 'react';
import * as THREE from 'three';

const FT = 0.3048;

/** Realistic expo hall carpet floor */
function ExpoCarpet() {
  const carpetTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    
    // Base carpet color (deep expo blue-grey)
    ctx.fillStyle = '#2d3748';
    ctx.fillRect(0, 0, 512, 512);
    
    // Carpet texture noise
    for (let i = 0; i < 8000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const brightness = 35 + Math.random() * 25;
      ctx.fillStyle = `rgb(${brightness}, ${brightness + 5}, ${brightness + 12})`;
      ctx.fillRect(x, y, 1.5, 1.5);
    }
    
    // Aisle tape markings
    ctx.strokeStyle = '#4a5568';
    ctx.lineWidth = 3;
    ctx.setLineDash([20, 10]);
    ctx.beginPath();
    ctx.moveTo(256, 0);
    ctx.lineTo(256, 512);
    ctx.stroke();
    
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(8, 8);
    return tex;
  }, []);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 0]} receiveShadow>
      <planeGeometry args={[40, 40]} />
      <meshStandardMaterial map={carpetTexture} roughness={0.95} metalness={0} />
    </mesh>
  );
}

/** Ceiling truss structure */
function CeilingTrusses() {
  const trussColor = '#1a1a2e';
  const trusses = useMemo(() => {
    const items: { pos: [number, number, number]; rot: [number, number, number]; length: number }[] = [];
    // Main longitudinal trusses
    for (let x = -12; x <= 12; x += 6) {
      items.push({ pos: [x, 7, 0], rot: [0, 0, 0], length: 30 });
    }
    // Cross trusses
    for (let z = -12; z <= 12; z += 6) {
      items.push({ pos: [0, 7, z], rot: [0, Math.PI / 2, 0], length: 30 });
    }
    return items;
  }, []);

  return (
    <group>
      {trusses.map((t, i) => (
        <group key={i} position={t.pos} rotation={t.rot}>
          {/* Main beam */}
          <mesh>
            <boxGeometry args={[t.length, 0.15, 0.15]} />
            <meshStandardMaterial color={trussColor} metalness={0.8} roughness={0.3} />
          </mesh>
          {/* Cross braces */}
          {Array.from({ length: Math.floor(t.length / 2) }, (_, j) => (
            <mesh key={j} position={[j * 2 - t.length / 2 + 1, -0.15, 0]}>
              <boxGeometry args={[0.05, 0.3, 0.05]} />
              <meshStandardMaterial color={trussColor} metalness={0.8} roughness={0.3} />
            </mesh>
          ))}
        </group>
      ))}
      {/* Ceiling plane (dark) */}
      <mesh position={[0, 7.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#0a0a1a" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/** Neighboring booth shells to provide context */
function NeighborBooths() {
  const boothPositions = useMemo(() => [
    // Adjacent booths - left aisle
    { pos: [-10, 0, -8] as [number, number, number], w: 3, h: 2.4, d: 3, color: '#374151' },
    { pos: [-10, 0, 0] as [number, number, number], w: 3, h: 2.8, d: 4, color: '#3f3f46' },
    { pos: [-10, 0, 8] as [number, number, number], w: 3, h: 2.4, d: 3, color: '#374151' },
    // Adjacent booths - right aisle
    { pos: [10, 0, -8] as [number, number, number], w: 4, h: 2.6, d: 3, color: '#3f3f46' },
    { pos: [10, 0, 0] as [number, number, number], w: 3, h: 2.4, d: 3, color: '#374151' },
    { pos: [10, 0, 8] as [number, number, number], w: 3, h: 3.0, d: 4, color: '#3f3f46' },
    // Back row
    { pos: [0, 0, -12] as [number, number, number], w: 4, h: 2.4, d: 3, color: '#374151' },
    { pos: [6, 0, -12] as [number, number, number], w: 3, h: 2.6, d: 3, color: '#3f3f46' },
    { pos: [-6, 0, -12] as [number, number, number], w: 3, h: 2.4, d: 3, color: '#374151' },
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
          {/* Counter/table */}
          <mesh position={[0, 0.9 * FT * 3, b.d / 2 - 0.3]}>
            <boxGeometry args={[b.w * 0.6, 0.05, 0.6]} />
            <meshStandardMaterial color="#4a5568" roughness={0.5} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Expo hall overhead lighting rigs */
function ExpoLighting() {
  return (
    <group>
      {/* Overhead expo hall floods */}
      <pointLight position={[-8, 6.5, -8]} intensity={0.15} color="#e2e8f0" />
      <pointLight position={[8, 6.5, -8]} intensity={0.15} color="#e2e8f0" />
      <pointLight position={[-8, 6.5, 8]} intensity={0.15} color="#e2e8f0" />
      <pointLight position={[8, 6.5, 8]} intensity={0.15} color="#e2e8f0" />
      {/* Warm booth spots from trusses */}
      <spotLight position={[0, 6.8, 2]} angle={0.6} penumbra={0.8} intensity={0.4} color="#fef3c7" target-position={[0, 0, 0]} />
      <spotLight position={[3, 6.8, -1]} angle={0.5} penumbra={0.7} intensity={0.3} color="#fef3c7" />
    </group>
  );
}

/** Aisle markers and directional arrows on floor */
function AisleMarkings() {
  return (
    <group>
      {/* Aisle tape lines */}
      {[-7, 7].map((x) => (
        <mesh key={x} position={[x, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.08, 30]} />
          <meshBasicMaterial color="#4a5568" transparent opacity={0.5} />
        </mesh>
      ))}
      {/* Cross aisle */}
      {[-7, 7].map((z) => (
        <mesh key={z} position={[0, 0.001, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[30, 0.08]} />
          <meshBasicMaterial color="#4a5568" transparent opacity={0.5} />
        </mesh>
      ))}
    </group>
  );
}

export function ExpoEnvironment() {
  return (
    <group>
      <ExpoCarpet />
      <CeilingTrusses />
      <NeighborBooths />
      <ExpoLighting />
      <AisleMarkings />
    </group>
  );
}
