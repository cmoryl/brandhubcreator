/**
 * BoothFloorpad - Renders the booth footprint ground area with industry-standard flooring options.
 * Shows the exact booth dimensions on the floor with selectable materials and colors.
 */
import { useMemo } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';

const FT = 0.3048;

export type FlooringType = 
  | 'carpet-plush'
  | 'carpet-berber' 
  | 'carpet-ribbed'
  | 'vinyl-wood'
  | 'vinyl-tile'
  | 'raised-platform'
  | 'concrete-polished'
  | 'rubber-coin'
  | 'none';

export interface FlooringConfig {
  type: FlooringType;
  color: string; // hex color
  showBorder: boolean;
  showDimensions: boolean;
}

export const FLOORING_OPTIONS: { value: FlooringType; label: string; desc: string }[] = [
  { value: 'none', label: 'None', desc: 'No floor marking' },
  { value: 'carpet-plush', label: 'Plush Carpet', desc: 'Standard trade show carpet' },
  { value: 'carpet-berber', label: 'Berber Carpet', desc: 'Low-pile commercial' },
  { value: 'carpet-ribbed', label: 'Ribbed Carpet', desc: 'Directional ribbed' },
  { value: 'vinyl-wood', label: 'Vinyl Plank', desc: 'Wood-look LVT' },
  { value: 'vinyl-tile', label: 'Vinyl Tile', desc: 'Interlocking tile' },
  { value: 'raised-platform', label: 'Raised Platform', desc: '4" raised floor' },
  { value: 'rubber-coin', label: 'Rubber Coin', desc: 'Anti-fatigue rubber' },
  { value: 'concrete-polished', label: 'Polished Concrete', desc: 'Sealed expo floor' },
];

export const FLOOR_COLOR_PRESETS: { value: string; label: string }[] = [
  { value: '#1a1a2e', label: 'Charcoal' },
  { value: '#2d2d44', label: 'Navy' },
  { value: '#1e293b', label: 'Slate' },
  { value: '#292524', label: 'Espresso' },
  { value: '#3b0764', label: 'Deep Purple' },
  { value: '#7f1d1d', label: 'Burgundy' },
  { value: '#14532d', label: 'Forest' },
  { value: '#78716c', label: 'Warm Gray' },
  { value: '#e5e5e5', label: 'Light Gray' },
  { value: '#ffffff', label: 'White' },
];

/** Parse footprint string like "10' × 10' floor" into [widthFt, depthFt] */
export function parseFootprint(footprint: string): [number, number] {
  const match = footprint.match(/(\d+)['\s]*[×x]\s*(\d+)/);
  if (match) return [parseInt(match[1]), parseInt(match[2])];
  return [10, 10];
}

// Procedural texture generators
function createCarpetPlushTexture(color: string, resolution = 512): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = resolution;
  canvas.height = resolution;
  const ctx = canvas.getContext('2d')!;
  
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, resolution, resolution);
  
  // Fiber noise
  const c = new THREE.Color(color);
  for (let i = 0; i < 20000; i++) {
    const x = Math.random() * resolution;
    const y = Math.random() * resolution;
    const v = (Math.random() - 0.5) * 0.15;
    ctx.fillStyle = `rgb(${Math.max(0, Math.min(255, (c.r + v) * 255))},${Math.max(0, Math.min(255, (c.g + v) * 255))},${Math.max(0, Math.min(255, (c.b + v) * 255))})`;
    ctx.fillRect(x, y, 1.5, 1.5);
  }
  
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createBerberTexture(color: string, resolution = 512): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = resolution;
  canvas.height = resolution;
  const ctx = canvas.getContext('2d')!;
  
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, resolution, resolution);
  
  // Loop pile pattern
  const c = new THREE.Color(color);
  ctx.globalAlpha = 0.08;
  for (let y = 0; y < resolution; y += 6) {
    for (let x = 0; x < resolution; x += 6) {
      const offset = (y / 6) % 2 === 0 ? 3 : 0;
      ctx.strokeStyle = `rgb(${Math.min(255, c.r * 255 + 30)},${Math.min(255, c.g * 255 + 30)},${Math.min(255, c.b * 255 + 30)})`;
      ctx.beginPath();
      ctx.arc(x + offset, y, 2.5, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
  
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 6);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createRibbedTexture(color: string, resolution = 512): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = resolution;
  canvas.height = resolution;
  const ctx = canvas.getContext('2d')!;
  
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, resolution, resolution);
  
  // Directional ribs
  const c = new THREE.Color(color);
  for (let x = 0; x < resolution; x += 4) {
    ctx.fillStyle = x % 8 < 4
      ? `rgba(${Math.min(255, c.r * 255 + 15)},${Math.min(255, c.g * 255 + 15)},${Math.min(255, c.b * 255 + 15)},0.3)`
      : `rgba(${Math.max(0, c.r * 255 - 10)},${Math.max(0, c.g * 255 - 10)},${Math.max(0, c.b * 255 - 10)},0.3)`;
    ctx.fillRect(x, 0, 2, resolution);
  }
  
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 8);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createVinylWoodTexture(color: string, resolution = 512): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = resolution;
  canvas.height = resolution;
  const ctx = canvas.getContext('2d')!;
  
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, resolution, resolution);
  
  // Wood grain lines
  const c = new THREE.Color(color);
  ctx.globalAlpha = 0.12;
  for (let i = 0; i < 40; i++) {
    const y = Math.random() * resolution;
    ctx.strokeStyle = `rgb(${Math.max(0, c.r * 255 - 20)},${Math.max(0, c.g * 255 - 15)},${Math.max(0, c.b * 255 - 10)})`;
    ctx.lineWidth = 0.5 + Math.random() * 1.5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    let cx = 0;
    while (cx < resolution) {
      cx += 20 + Math.random() * 40;
      ctx.lineTo(cx, y + (Math.random() - 0.5) * 8);
    }
    ctx.stroke();
  }
  // Plank seams
  ctx.globalAlpha = 0.15;
  ctx.strokeStyle = `rgb(${Math.max(0, c.r * 255 - 40)},${Math.max(0, c.g * 255 - 35)},${Math.max(0, c.b * 255 - 30)})`;
  ctx.lineWidth = 1;
  for (let y = 0; y < resolution; y += resolution / 6) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(resolution, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createVinylTileTexture(color: string, resolution = 512): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = resolution;
  canvas.height = resolution;
  const ctx = canvas.getContext('2d')!;
  
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, resolution, resolution);
  
  // Tile grid
  const c = new THREE.Color(color);
  const tileSize = resolution / 8;
  ctx.strokeStyle = `rgba(${Math.max(0, c.r * 255 - 30)},${Math.max(0, c.g * 255 - 30)},${Math.max(0, c.b * 255 - 30)},0.25)`;
  ctx.lineWidth = 1;
  for (let x = 0; x <= resolution; x += tileSize) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, resolution); ctx.stroke();
  }
  for (let y = 0; y <= resolution; y += tileSize) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(resolution, y); ctx.stroke();
  }
  
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createRubberCoinTexture(color: string, resolution = 512): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = resolution;
  canvas.height = resolution;
  const ctx = canvas.getContext('2d')!;
  
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, resolution, resolution);
  
  // Coin dots
  const c = new THREE.Color(color);
  const spacing = 16;
  ctx.fillStyle = `rgba(${Math.min(255, c.r * 255 + 25)},${Math.min(255, c.g * 255 + 25)},${Math.min(255, c.b * 255 + 25)},0.2)`;
  for (let y = spacing / 2; y < resolution; y += spacing) {
    for (let x = spacing / 2; x < resolution; x += spacing) {
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createPolishedConcreteTexture(color: string, resolution = 512): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = resolution;
  canvas.height = resolution;
  const ctx = canvas.getContext('2d')!;
  
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, resolution, resolution);
  
  // Aggregate speckle
  for (let i = 0; i < 8000; i++) {
    const x = Math.random() * resolution;
    const y = Math.random() * resolution;
    const v = 30 + Math.random() * 30;
    ctx.fillStyle = `rgba(${v + 10},${v + 15},${v + 25},0.4)`;
    ctx.beginPath();
    ctx.arc(x, y, 0.5 + Math.random() * 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
  
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function getFloorTexture(type: FlooringType, color: string): THREE.CanvasTexture | null {
  switch (type) {
    case 'carpet-plush': return createCarpetPlushTexture(color);
    case 'carpet-berber': return createBerberTexture(color);
    case 'carpet-ribbed': return createRibbedTexture(color);
    case 'vinyl-wood': return createVinylWoodTexture(color);
    case 'vinyl-tile': return createVinylTileTexture(color);
    case 'rubber-coin': return createRubberCoinTexture(color);
    case 'concrete-polished': return createPolishedConcreteTexture(color);
    case 'raised-platform': return createCarpetPlushTexture(color);
    default: return null;
  }
}

function getMaterialProps(type: FlooringType): { roughness: number; metalness: number; bumpScale?: number } {
  switch (type) {
    case 'carpet-plush': return { roughness: 0.95, metalness: 0, bumpScale: 0.003 };
    case 'carpet-berber': return { roughness: 0.9, metalness: 0, bumpScale: 0.002 };
    case 'carpet-ribbed': return { roughness: 0.88, metalness: 0, bumpScale: 0.004 };
    case 'vinyl-wood': return { roughness: 0.4, metalness: 0.05 };
    case 'vinyl-tile': return { roughness: 0.35, metalness: 0.08 };
    case 'raised-platform': return { roughness: 0.85, metalness: 0 };
    case 'rubber-coin': return { roughness: 0.75, metalness: 0.02 };
    case 'concrete-polished': return { roughness: 0.2, metalness: 0.1 };
    default: return { roughness: 0.9, metalness: 0 };
  }
}

interface BoothFloorpadProps {
  footprint: string;
  config: FlooringConfig;
  showLabels?: boolean;
}

export function BoothFloorpad({ footprint, config, showLabels = true }: BoothFloorpadProps) {
  const [widthFt, depthFt] = parseFootprint(footprint);
  const widthM = widthFt * FT;
  const depthM = depthFt * FT;
  
  const isRaised = config.type === 'raised-platform';
  const platformH = isRaised ? 4 * 0.0254 : 0; // 4 inches
  const floorY = platformH + 0.002;
  
  const texture = useMemo(() => {
    if (config.type === 'none') return null;
    return getFloorTexture(config.type, config.color);
  }, [config.type, config.color]);

  const matProps = getMaterialProps(config.type);

  if (config.type === 'none' && !config.showBorder) return null;

  return (
    <group>
      {/* Raised platform base */}
      {isRaised && (
        <mesh position={[0, platformH / 2, depthM / 2]} castShadow receiveShadow>
          <boxGeometry args={[widthM + 0.02, platformH, depthM + 0.02]} />
          <meshStandardMaterial color="#2a2a3a" roughness={0.7} metalness={0.1} />
        </mesh>
      )}

      {/* Floor surface */}
      {config.type !== 'none' && texture && (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, floorY, depthM / 2]}
          receiveShadow
        >
          <planeGeometry args={[widthM, depthM]} />
          <meshStandardMaterial
            map={texture}
            color={config.color}
            roughness={matProps.roughness}
            metalness={matProps.metalness}
          />
        </mesh>
      )}

      {/* Border / tape outline */}
      {config.showBorder && (
        <group position={[0, floorY + 0.001, depthM / 2]}>
          {/* Front edge */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, depthM / 2, 0]}>
            <planeGeometry args={[widthM, 0.025]} />
            <meshBasicMaterial color="#f59e0b" opacity={0.8} transparent />
          </mesh>
          {/* Back edge */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -depthM / 2, 0]}>
            <planeGeometry args={[widthM, 0.025]} />
            <meshBasicMaterial color="#f59e0b" opacity={0.8} transparent />
          </mesh>
          {/* Left edge */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-widthM / 2, 0, 0]}>
            <planeGeometry args={[0.025, depthM]} />
            <meshBasicMaterial color="#f59e0b" opacity={0.8} transparent />
          </mesh>
          {/* Right edge */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[widthM / 2, 0, 0]}>
            <planeGeometry args={[0.025, depthM]} />
            <meshBasicMaterial color="#f59e0b" opacity={0.8} transparent />
          </mesh>
          
          {/* Corner markers (L-brackets) */}
          {[[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([sx, sz], i) => (
            <group key={i} position={[sx * widthM / 2, 0, sz * depthM / 2]}>
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.04, 16]} />
                <meshBasicMaterial color="#f59e0b" opacity={0.9} transparent />
              </mesh>
            </group>
          ))}
        </group>
      )}

      {/* Dimension labels */}
      {config.showDimensions && showLabels && (
        <>
          {/* Width label (front) */}
          <Html
            position={[0, floorY + 0.05, depthM + 0.15]}
            center
            distanceFactor={10}
            style={{ pointerEvents: 'none' }}
          >
            <div className="text-[10px] font-mono font-semibold bg-background/80 border border-border px-1.5 py-0.5 rounded text-foreground whitespace-nowrap">
              {widthFt}' wide
            </div>
          </Html>
          {/* Depth label (side) */}
          <Html
            position={[widthM / 2 + 0.15, floorY + 0.05, depthM / 2]}
            center
            distanceFactor={10}
            style={{ pointerEvents: 'none' }}
          >
            <div className="text-[10px] font-mono font-semibold bg-background/80 border border-border px-1.5 py-0.5 rounded text-foreground whitespace-nowrap">
              {depthFt}' deep
            </div>
          </Html>
        </>
      )}
    </group>
  );
}
