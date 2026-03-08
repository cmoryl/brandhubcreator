/**
 * CrowdHeatMap3D - Traffic heat map overlay for booth 3D scene
 * Renders a color-coded plane showing predicted foot traffic patterns
 * Red = high traffic, Blue = low traffic
 */
import { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import type { CrowdSimulationData } from './crowdSimulationTypes';

interface CrowdHeatMap3DProps {
  simulationData: CrowdSimulationData;
  /** Booth footprint in meters [width, depth] */
  boothSize: [number, number];
  opacity?: number;
  showLabels?: boolean;
  showSightlines?: boolean;
}

/** Interpolate heat map color: blue (cold) → cyan → green → yellow → red (hot) */
function heatColor(value: number): [number, number, number] {
  const v = Math.max(0, Math.min(1, value));
  if (v < 0.25) {
    const t = v / 0.25;
    return [0, t * 0.5, 1 - t * 0.3]; // blue → cyan
  } else if (v < 0.5) {
    const t = (v - 0.25) / 0.25;
    return [t * 0.2, 0.5 + t * 0.5, 0.7 - t * 0.7]; // cyan → green
  } else if (v < 0.75) {
    const t = (v - 0.5) / 0.25;
    return [0.2 + t * 0.8, 1, 0]; // green → yellow
  } else {
    const t = (v - 0.75) / 0.25;
    return [1, 1 - t, 0]; // yellow → red
  }
}

/** Generate a canvas-based heat map texture from a 10x10 grid */
function generateHeatMapTexture(grid: number[][]): THREE.CanvasTexture {
  const resolution = 256;
  const canvas = document.createElement('canvas');
  canvas.width = resolution;
  canvas.height = resolution;
  const ctx = canvas.getContext('2d')!;

  const rows = grid.length;
  const cols = grid[0]?.length || 10;

  // Create smooth gradient by drawing each cell and blurring
  const cellW = resolution / cols;
  const cellH = resolution / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const val = grid[r]?.[c] ?? 0;
      const [red, green, blue] = heatColor(val);
      const cr = Math.round(red * 255);
      const cg = Math.round(green * 255);
      const cb = Math.round(blue * 255);

      // Draw a radial gradient for each cell for smooth blending
      const cx = c * cellW + cellW / 2;
      const cy = r * cellH + cellH / 2;
      const radius = Math.max(cellW, cellH) * 1.2;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      grad.addColorStop(0, `rgba(${cr},${cg},${cb},0.85)`);
      grad.addColorStop(0.6, `rgba(${cr},${cg},${cb},0.4)`);
      grad.addColorStop(1, `rgba(${cr},${cg},${cb},0.0)`);

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, resolution, resolution);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

export function CrowdHeatMap3D({
  simulationData,
  boothSize,
  opacity = 0.55,
  showLabels = true,
  showSightlines = false,
}: CrowdHeatMap3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [bw, bd] = boothSize;

  const heatTexture = useMemo(() => {
    if (!simulationData.heatMapGrid?.length) return null;
    return generateHeatMapTexture(simulationData.heatMapGrid);
  }, [simulationData.heatMapGrid]);

  // Cleanup texture on unmount
  useEffect(() => {
    return () => { heatTexture?.dispose(); };
  }, [heatTexture]);

  if (!heatTexture) return null;

  return (
    <group>
      {/* Heat map plane on ground */}
      <mesh
        ref={meshRef}
        position={[0, 0.015, bd / 2 - bd / 2]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[bw, bd]} />
        <meshBasicMaterial
          map={heatTexture}
          transparent
          opacity={opacity}
          depthWrite={false}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* High visibility zone markers */}
      {showLabels && simulationData.highVisibilityZones?.map((zone, i) => {
        const x = ((zone.gridX / 9) - 0.5) * bw;
        const z = ((1 - zone.gridZ / 9) - 0.5) * bd;
        return (
          <group key={`hv-${i}`}>
            {/* Pulsing ring marker */}
            <mesh position={[x, 0.02, z]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.15, 0.2, 24]} />
              <meshBasicMaterial color="#22c55e" transparent opacity={0.8} />
            </mesh>
            <Html position={[x, 0.4, z]} center distanceFactor={10}>
              <div className="px-1.5 py-0.5 rounded-sm bg-green-500/90 text-white text-[8px] font-semibold whitespace-nowrap select-none pointer-events-none shadow-sm">
                🔥 {zone.name}
              </div>
            </Html>
          </group>
        );
      })}

      {/* Dead zone markers */}
      {showLabels && simulationData.deadZones?.map((zone, i) => {
        const x = ((zone.gridX / 9) - 0.5) * bw;
        const z = ((1 - zone.gridZ / 9) - 0.5) * bd;
        return (
          <group key={`dz-${i}`}>
            <mesh position={[x, 0.02, z]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.15, 0.2, 24]} />
              <meshBasicMaterial color="#ef4444" transparent opacity={0.7} />
            </mesh>
            <Html position={[x, 0.4, z]} center distanceFactor={10}>
              <div className="px-1.5 py-0.5 rounded-sm bg-red-500/90 text-white text-[8px] font-semibold whitespace-nowrap select-none pointer-events-none shadow-sm">
                ⚠️ {zone.name}
              </div>
            </Html>
          </group>
        );
      })}

      {/* Engagement zone rings */}
      {simulationData.engagementZones?.map((zone, i) => {
        const x = ((zone.gridX / 9) - 0.5) * bw;
        const z = ((1 - zone.gridZ / 9) - 0.5) * bd;
        const radius = 0.25 + (zone.avgCrowdSize || 2) * 0.08;
        return (
          <group key={`ez-${i}`}>
            <mesh position={[x, 0.012, z]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[radius - 0.03, radius, 32]} />
              <meshBasicMaterial color="#a855f7" transparent opacity={0.6} depthWrite={false} />
            </mesh>
            {showLabels && (
              <Html position={[x, 0.3, z]} center distanceFactor={10}>
                <div className="px-1.5 py-0.5 rounded-sm bg-purple-600/90 text-white text-[7px] font-medium whitespace-nowrap select-none pointer-events-none shadow-sm">
                  {zone.name} · {zone.estimatedDwellTime}
                </div>
              </Html>
            )}
          </group>
        );
      })}

      {/* Sightline arrows */}
      {showSightlines && simulationData.sightlines?.map((sl, i) => {
        // Draw simple directional indicators
        const dirMap: Record<string, [number, number, number]> = {
          'front': [0, 0.05, bd / 2 + 0.5],
          'left': [-bw / 2 - 0.5, 0.05, 0],
          'right': [bw / 2 + 0.5, 0.05, 0],
          'back': [0, 0.05, -bd / 2 - 0.5],
        };
        const fromKey = Object.keys(dirMap).find(k => sl.from.toLowerCase().includes(k)) || 'front';
        const pos = dirMap[fromKey];
        const scoreColor = sl.score >= 70 ? '#22c55e' : sl.score >= 40 ? '#eab308' : '#ef4444';
        return (
          <group key={`sl-${i}`}>
            <Html position={pos} center distanceFactor={12}>
              <div className="px-2 py-1 rounded bg-background/95 border border-border text-[8px] font-medium whitespace-nowrap select-none pointer-events-none shadow">
                <span className="mr-1">👁</span>
                <span style={{ color: scoreColor }}>{sl.score}/100</span>
                <span className="text-muted-foreground ml-1">{sl.from}</span>
              </div>
            </Html>
          </group>
        );
      })}

      {/* Legend */}
      {showLabels && (
        <Html position={[bw / 2 + 0.6, 0.5, 0]} distanceFactor={10}>
          <div className="bg-background/95 border border-border rounded-md px-2 py-1.5 text-[8px] shadow select-none pointer-events-none">
            <div className="font-semibold text-foreground mb-1">Traffic Density</div>
            <div className="flex items-center gap-1">
              <div className="w-16 h-2 rounded-sm" style={{
                background: 'linear-gradient(to right, #3b82f6, #06b6d4, #22c55e, #eab308, #ef4444)'
              }} />
            </div>
            <div className="flex justify-between text-muted-foreground mt-0.5">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}
