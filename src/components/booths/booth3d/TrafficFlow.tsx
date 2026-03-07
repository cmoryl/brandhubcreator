/**
 * TrafficFlow - Visualizes visitor traffic patterns and spatial flow around the booth
 * 
 * Uses animated lines and hotspot indicators to show:
 * - Primary traffic flow paths (high-traffic aisles)
 * - Secondary approach vectors (how visitors approach the booth)
 * - Engagement hotspots (where visitors tend to cluster)
 * - Dwell zones with time indicators
 */
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';

interface FlowPathProps {
  points: [number, number, number][];
  color: string;
  width: number;
  speed: number;
  label?: string;
}

/** Animated flow line with pulsing particles */
function FlowPath({ points, color, width, speed, label }: FlowPathProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const particleRef = useRef<THREE.Mesh>(null);
  const progress = useRef(0);

  const curve = useMemo(() => {
    const vectors = points.map(p => new THREE.Vector3(...p));
    return new THREE.CatmullRomCurve3(vectors);
  }, [points]);

  const tubeGeom = useMemo(() => {
    return new THREE.TubeGeometry(curve, 40, width, 6, false);
  }, [curve, width]);

  useFrame((_, delta) => {
    progress.current = (progress.current + delta * speed * 0.15) % 1;
    if (particleRef.current) {
      const pos = curve.getPoint(progress.current);
      particleRef.current.position.copy(pos);
    }
  });

  return (
    <group>
      {/* Flow tube */}
      <mesh geometry={tubeGeom}>
        <meshBasicMaterial color={color} transparent opacity={0.18} />
      </mesh>
      {/* Dashed center line */}
      <mesh geometry={tubeGeom}>
        <meshBasicMaterial color={color} transparent opacity={0.35} wireframe />
      </mesh>
      {/* Moving particle */}
      <mesh ref={particleRef}>
        <sphereGeometry args={[width * 3, 8, 6]} />
        <meshBasicMaterial color={color} transparent opacity={0.6} />
      </mesh>
      {/* Flow label */}
      {label && (
        <Html position={points[Math.floor(points.length / 2)]} center distanceFactor={12} style={{ pointerEvents: 'none' }}>
          <div className="text-[9px] font-mono text-muted-foreground/60 whitespace-nowrap bg-background/70 px-1 rounded">
            {label}
          </div>
        </Html>
      )}
    </group>
  );
}

/** Engagement hotspot - pulsing circle on floor */
function Hotspot({ position, radius, intensity, label }: {
  position: [number, number, number];
  radius: number;
  intensity: 'high' | 'medium' | 'low';
  label: string;
}) {
  const ringRef = useRef<THREE.Mesh>(null);
  const colors = { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' };
  const color = colors[intensity];

  useFrame((state) => {
    if (ringRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 1.5) * 0.1;
      ringRef.current.scale.set(scale, scale, 1);
    }
  });

  return (
    <group position={position}>
      {/* Hotspot ring */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <ringGeometry args={[radius * 0.7, radius, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>
      {/* Inner circle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0]}>
        <circleGeometry args={[radius * 0.15, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.5} />
      </mesh>
      {/* Label */}
      <Html position={[0, 0.02, 0]} center distanceFactor={10} style={{ pointerEvents: 'none' }}>
        <div className="flex flex-col items-center">
          <div className="text-[9px] font-medium whitespace-nowrap px-1 py-0.5 rounded"
            style={{ color, backgroundColor: `${color}15` }}>
            {label}
          </div>
        </div>
      </Html>
    </group>
  );
}

/** Directional arrow on floor */
function FloorArrow({ position, rotation, color = '#64748b' }: {
  position: [number, number, number];
  rotation: number;
  color?: string;
}) {
  const arrowShape = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0.3);
    shape.lineTo(0.15, 0);
    shape.lineTo(0.05, 0);
    shape.lineTo(0.05, -0.3);
    shape.lineTo(-0.05, -0.3);
    shape.lineTo(-0.05, 0);
    shape.lineTo(-0.15, 0);
    shape.closePath();
    return shape;
  }, []);

  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, rotation]}>
      <shapeGeometry args={[arrowShape]} />
      <meshBasicMaterial color={color} transparent opacity={0.25} side={THREE.DoubleSide} />
    </mesh>
  );
}

interface TrafficFlowProps {
  layout: 'inline' | 'l-shape' | 'u-shape' | 'island';
}

export function TrafficFlow({ layout }: TrafficFlowProps) {
  const flowPaths = useMemo(() => {
    const paths: FlowPathProps[] = [];

    // Main aisle traffic (always present)
    paths.push({
      points: [[-8, 0.03, 5], [-3, 0.03, 5], [0, 0.03, 4.5], [3, 0.03, 5], [8, 0.03, 5]],
      color: '#3b82f6',
      width: 0.03,
      speed: 1.2,
      label: 'Main Aisle →',
    });

    // Cross aisle
    paths.push({
      points: [[6, 0.03, -8], [6, 0.03, -3], [5.5, 0.03, 0], [6, 0.03, 3], [6, 0.03, 8]],
      color: '#3b82f6',
      width: 0.025,
      speed: 0.9,
      label: 'Cross Aisle ↓',
    });

    // Approach vectors based on layout
    if (layout === 'inline' || layout === 'l-shape') {
      paths.push({
        points: [[0, 0.03, 5], [0, 0.03, 3.5], [0, 0.03, 2]],
        color: '#22c55e',
        width: 0.02,
        speed: 0.6,
        label: 'Approach',
      });
    } else if (layout === 'u-shape') {
      paths.push({
        points: [[-2, 0.03, 5], [-0.5, 0.03, 3], [0, 0.03, 2]],
        color: '#22c55e',
        width: 0.02,
        speed: 0.6,
      });
      paths.push({
        points: [[2, 0.03, 5], [0.5, 0.03, 3], [0, 0.03, 2]],
        color: '#22c55e',
        width: 0.02,
        speed: 0.7,
      });
    } else {
      // Island: multi-directional approach
      paths.push({
        points: [[0, 0.03, 8], [0, 0.03, 5], [0, 0.03, 3.5]],
        color: '#22c55e', width: 0.02, speed: 0.6,
      });
      paths.push({
        points: [[8, 0.03, 0], [5, 0.03, 0], [3.5, 0.03, 0]],
        color: '#22c55e', width: 0.02, speed: 0.5,
      });
      paths.push({
        points: [[-8, 0.03, 0], [-5, 0.03, 0], [-3.5, 0.03, 0]],
        color: '#22c55e', width: 0.02, speed: 0.7,
      });
      paths.push({
        points: [[0, 0.03, -8], [0, 0.03, -5], [0, 0.03, -3.5]],
        color: '#22c55e', width: 0.02, speed: 0.55,
      });
    }

    return paths;
  }, [layout]);

  const hotspots = useMemo(() => {
    const spots: { position: [number, number, number]; radius: number; intensity: 'high' | 'medium' | 'low'; label: string }[] = [];

    // Engagement zones
    if (layout === 'inline') {
      spots.push({ position: [0, 0, 2], radius: 0.8, intensity: 'high', label: 'Primary Engagement' });
      spots.push({ position: [1.2, 0, 2.8], radius: 0.5, intensity: 'medium', label: 'Secondary' });
    } else if (layout === 'l-shape') {
      spots.push({ position: [0, 0, 2], radius: 0.8, intensity: 'high', label: 'Primary Engagement' });
      spots.push({ position: [-1.5, 0, 1.5], radius: 0.6, intensity: 'high', label: 'Corner Interest' });
      spots.push({ position: [1.5, 0, 3], radius: 0.5, intensity: 'medium', label: 'Overflow' });
    } else if (layout === 'u-shape') {
      spots.push({ position: [0, 0, 1.8], radius: 1.0, intensity: 'high', label: 'Central Hub' });
      spots.push({ position: [-1.5, 0, 1], radius: 0.6, intensity: 'medium', label: 'Left Wing' });
      spots.push({ position: [1.5, 0, 1], radius: 0.6, intensity: 'medium', label: 'Right Wing' });
      spots.push({ position: [0, 0, 3.5], radius: 0.5, intensity: 'low', label: 'Casual Browse' });
    } else {
      spots.push({ position: [0, 0, 3.5], radius: 1.0, intensity: 'high', label: 'Front Hub' });
      spots.push({ position: [3.5, 0, 0], radius: 0.8, intensity: 'high', label: 'Right Entry' });
      spots.push({ position: [-3.5, 0, 0], radius: 0.7, intensity: 'medium', label: 'Left Entry' });
      spots.push({ position: [0, 0, -3.5], radius: 0.6, intensity: 'low', label: 'Back Side' });
    }

    return spots;
  }, [layout]);

  const arrows = useMemo(() => {
    const arrs: { position: [number, number, number]; rotation: number }[] = [];
    // Main aisle direction arrows
    for (let x = -6; x <= 6; x += 3) {
      arrs.push({ position: [x, 0.003, 5], rotation: -Math.PI / 2 });
    }
    // Approach arrows
    arrs.push({ position: [0, 0.003, 3.5], rotation: Math.PI });
    if (layout === 'island') {
      arrs.push({ position: [4, 0.003, 0], rotation: Math.PI / 2 });
      arrs.push({ position: [-4, 0.003, 0], rotation: -Math.PI / 2 });
    }
    return arrs;
  }, [layout]);

  return (
    <group>
      {flowPaths.map((path, i) => (
        <FlowPath key={i} {...path} />
      ))}
      {hotspots.map((spot, i) => (
        <Hotspot key={i} {...spot} />
      ))}
      {arrows.map((arr, i) => (
        <FloorArrow key={i} {...arr} />
      ))}
    </group>
  );
}
