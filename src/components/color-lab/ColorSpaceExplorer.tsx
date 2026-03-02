/**
 * 3D Color Space Explorer — visualize palette colors in OKLCH space
 * using Three.js with orbit controls.
 */

import { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Line } from '@react-three/drei';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Box } from 'lucide-react';
import { hexToOklch, type OklchColor } from '@/lib/oklchAccessibility';
import * as THREE from 'three';

interface LabColor {
  id: string;
  hex: string;
  name: string;
}

/** Convert OKLCH to 3D position: H=angle, C=radius, L=height */
function oklchToPosition(oklch: OklchColor): [number, number, number] {
  const angle = (oklch.H * Math.PI) / 180;
  const radius = oklch.C * 8; // scale chroma
  const y = (oklch.L - 0.5) * 4; // center lightness
  return [Math.cos(angle) * radius, y, Math.sin(angle) * radius];
}

function ColorSphere({ hex, oklch, name }: { hex: string; oklch: OklchColor; name: string }) {
  const ref = useRef<THREE.Mesh>(null);
  const pos = useMemo(() => oklchToPosition(oklch), [oklch]);

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.3;
    }
  });

  return (
    <group position={pos}>
      <mesh ref={ref}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color={hex} emissive={hex} emissiveIntensity={0.3} />
      </mesh>
      {/* Vertical line to the L=0 plane */}
      <Line
        points={[
          [0, 0, 0],
          [0, -pos[1], 0],
        ]}
        color={hex}
        lineWidth={1}
        opacity={0.3}
        transparent
      />
      <Text
        position={[0, 0.25, 0]}
        fontSize={0.1}
        color="#888888"
        anchorX="center"
        anchorY="bottom"
      >
        {name}
      </Text>
    </group>
  );
}

function AxisGuides() {
  const hueRing = useMemo(() => {
    const points: [number, number, number][] = [];
    for (let i = 0; i <= 64; i++) {
      const angle = (i / 64) * Math.PI * 2;
      points.push([Math.cos(angle) * 2, -2, Math.sin(angle) * 2]);
    }
    return points;
  }, []);

  return (
    <>
      {/* Lightness axis */}
      <Line points={[[0, -2, 0], [0, 2, 0]]} color="#555555" lineWidth={1} opacity={0.4} transparent />
      <Text position={[0, 2.2, 0]} fontSize={0.12} color="#777">L=1</Text>
      <Text position={[0, -2.2, 0]} fontSize={0.12} color="#777">L=0</Text>

      {/* Hue ring at bottom */}
      <Line points={hueRing} color="#444444" lineWidth={1} opacity={0.2} transparent />

      {/* Chroma radial guides */}
      {[0, 90, 180, 270].map(deg => {
        const angle = (deg * Math.PI) / 180;
        return (
          <group key={deg}>
            <Line
              points={[[0, -2, 0], [Math.cos(angle) * 2, -2, Math.sin(angle) * 2]]}
              color="#444444"
              lineWidth={1}
              opacity={0.15}
              transparent
            />
            <Text
              position={[Math.cos(angle) * 2.3, -2, Math.sin(angle) * 2.3]}
              fontSize={0.1}
              color="#666"
            >
              {deg}°
            </Text>
          </group>
        );
      })}
    </>
  );
}

function Scene({ colors }: { colors: LabColor[] }) {
  const colorData = useMemo(
    () => colors.map(c => ({ ...c, oklch: hexToOklch(c.hex) })),
    [colors]
  );

  return (
    <>
      <ambientLight intensity={0.6} />
      <pointLight position={[5, 5, 5]} intensity={0.8} />
      <pointLight position={[-5, -3, -5]} intensity={0.4} />

      <AxisGuides />

      {colorData.map(c => (
        <ColorSphere key={c.id} hex={c.hex} oklch={c.oklch} name={c.name} />
      ))}

      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        autoRotate
        autoRotateSpeed={0.5}
        minDistance={2}
        maxDistance={12}
      />
    </>
  );
}

export function ColorSpaceExplorer({ colors }: { colors: LabColor[] }) {
  if (colors.length < 2) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Box className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">Add at least 2 colors to explore in 3D</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Box className="h-4 w-4 text-primary" />
          3D Color Space Explorer
        </CardTitle>
        <p className="text-[10px] text-muted-foreground">
          Colors plotted in OKLCH space — Height = Lightness, Angle = Hue, Distance = Chroma. Drag to rotate.
        </p>
      </CardHeader>
      <CardContent>
        <div className="rounded-xl border overflow-hidden bg-[#0a0a0f]" style={{ height: 400 }}>
          <Suspense fallback={
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Loading 3D scene…
            </div>
          }>
            <Canvas camera={{ position: [4, 2, 4], fov: 50 }}>
              <Scene colors={colors} />
            </Canvas>
          </Suspense>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {colors.map(c => {
            const oklch = hexToOklch(c.hex);
            return (
              <div key={c.id} className="flex items-center gap-1.5 bg-muted/50 rounded-full px-2.5 py-1">
                <div className="w-3 h-3 rounded-full border" style={{ backgroundColor: c.hex }} />
                <span className="text-[10px] font-medium">{c.name}</span>
                <code className="text-[9px] font-mono text-muted-foreground">
                  L:{oklch.L.toFixed(2)} C:{oklch.C.toFixed(2)} H:{oklch.H.toFixed(0)}°
                </code>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
