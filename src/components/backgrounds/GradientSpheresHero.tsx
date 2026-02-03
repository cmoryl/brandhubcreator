import { useRef, useState, useCallback, useEffect, memo } from 'react';
import { cn } from '@/lib/utils';

export type GradientSpheresColorScheme = 'purple-blue' | 'cyan-purple' | 'blue-teal' | 'pink-purple' | 'custom';
export type GradientSpheresMode = 'dark' | 'light';
export type GradientSpheresDensity = 'few' | 'normal' | 'many' | 'dense';
export type GradientSpheresSpeed = 'slow' | 'normal' | 'fast' | 'very-fast';

interface GradientSpheresHeroProps {
  className?: string;
  colorScheme?: GradientSpheresColorScheme;
  mode?: GradientSpheresMode;
  brightness?: number;
  sphereCount?: number;
  density?: GradientSpheresDensity;
  speed?: GradientSpheresSpeed;
}

interface Sphere {
  id: number;
  baseX: number;
  baseY: number;
  size: number;
  hue: number;
  depth: number;
  phase: number;
}

const COLOR_SCHEMES: Record<Exclude<GradientSpheresColorScheme, 'custom'>, { primary: number; secondary: number; accent: number }> = {
  'purple-blue': { primary: 280, secondary: 240, accent: 200 },
  'cyan-purple': { primary: 190, secondary: 260, accent: 220 },
  'blue-teal': { primary: 220, secondary: 180, accent: 200 },
  'pink-purple': { primary: 330, secondary: 280, accent: 300 },
};

const DENSITY_COUNTS: Record<GradientSpheresDensity, number> = {
  'few': 3,
  'normal': 5,
  'many': 8,
  'dense': 12,
};

const SPEED_MULTIPLIERS: Record<GradientSpheresSpeed, number> = {
  'slow': 0.4,
  'normal': 1,
  'fast': 2,
  'very-fast': 3.5,
};

export const GradientSpheresHero = memo(function GradientSpheresHero({
  className = '',
  colorScheme = 'purple-blue',
  mode = 'dark',
  brightness = 50,
  sphereCount,
  density = 'normal',
  speed = 'normal',
}: GradientSpheresHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5, isActive: false });
  const [smoothedMouse, setSmoothedMouse] = useState({ x: 0.5, y: 0.5 });
  const [time, setTime] = useState(0);
  const animationRef = useRef<number>(0);

  // Defensive fallback: hero editor can temporarily pass a colorScheme from another effect.
  const schemeKey =
    colorScheme !== 'custom' && Object.prototype.hasOwnProperty.call(COLOR_SCHEMES, colorScheme)
      ? colorScheme
      : 'purple-blue';

  if (colorScheme !== 'custom' && schemeKey !== colorScheme) {
    console.warn('[GradientSpheresHero] Invalid colorScheme, falling back:', { colorScheme, schemeKey });
  }

  const colors = COLOR_SCHEMES[schemeKey];
  const brightnessMultiplier = 0.4 + (brightness / 100) * 1.2;
  const speedMultiplier = SPEED_MULTIPLIERS[speed];
  const actualSphereCount = sphereCount ?? DENSITY_COUNTS[density];

  const bgColors = mode === 'dark'
    ? { base: 'hsl(240, 30%, 8%)', mid: 'hsl(250, 35%, 12%)' }
    : { base: 'hsl(230, 20%, 96%)', mid: 'hsl(230, 25%, 94%)' };

  // Generate stable sphere configurations - spread around the container
  const spheres: Sphere[] = Array.from({ length: actualSphereCount }, (_, i) => {
    const angle = (i / actualSphereCount) * Math.PI * 2;
    const radius = 15 + (i % 3) * 10;
    const hueOptions = [colors.primary, colors.secondary, colors.accent];
    return {
      id: i,
      baseX: 50 + Math.cos(angle) * radius,
      baseY: 50 + Math.sin(angle) * radius,
      size: 180 + (i * 50) + (i % 2 === 0 ? 80 : 0),
      hue: hueOptions[i % 3],
      depth: 0.5 + (i % 3) * 0.25,
      phase: (i * Math.PI * 2) / actualSphereCount,
    };
  });

  // Smooth animation loop
  useEffect(() => {
    let lastTimestamp = 0;

    const animate = (timestamp: number) => {
      if (timestamp - lastTimestamp > 16) {
        setTime(timestamp * 0.00015 * speedMultiplier);
        setSmoothedMouse(prev => ({
          x: prev.x + (mousePos.x - prev.x) * 0.03,
          y: prev.y + (mousePos.y - prev.y) * 0.03,
        }));
        lastTimestamp = timestamp;
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [mousePos.x, mousePos.y, speedMultiplier]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
      isActive: true,
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setMousePos(prev => ({ ...prev, isActive: false }));
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn('absolute inset-0 overflow-hidden z-0', className)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      aria-hidden="true"
    >
      {/* Base gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${bgColors.base} 0%, ${bgColors.mid} 50%, ${bgColors.base} 100%)`,
        }}
      />

      {/* Overlapping gradient spheres with interactive spread/gather */}
      {spheres.map((sphere) => {
        // Smooth floating animation
        const floatX = Math.sin(time + sphere.phase) * 12 * sphere.depth;
        const floatY = Math.cos(time * 0.8 + sphere.phase * 0.5) * 10 * sphere.depth;
        
        // Calculate vector from mouse to sphere center for spread/gather effect
        const sphereCenterX = sphere.baseX / 100;
        const sphereCenterY = sphere.baseY / 100;
        const dx = sphereCenterX - smoothedMouse.x;
        const dy = sphereCenterY - smoothedMouse.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Spread effect: spheres move away from cursor
        const spreadStrength = mousePos.isActive ? 60 * sphere.depth : 0;
        const normalizedDx = distance > 0.01 ? dx / distance : 0;
        const normalizedDy = distance > 0.01 ? dy / distance : 0;
        const spreadFalloff = Math.max(0, 1 - distance * 2);
        const spreadX = normalizedDx * spreadStrength * spreadFalloff;
        const spreadY = normalizedDy * spreadStrength * spreadFalloff;

        // Mouse parallax (subtle, in addition to spread)
        const parallaxX = (smoothedMouse.x - 0.5) * 30 * sphere.depth;
        const parallaxY = (smoothedMouse.y - 0.5) * 20 * sphere.depth;

        // Subtle pulse
        const pulse = 1 + Math.sin(time * 1.2 + sphere.id * 0.7) * 0.05;

        // Glow intensifies when cursor is near
        const glowIntensity = mousePos.isActive ? 0.25 + spreadFalloff * 0.15 : 0.25;

        return (
          <div
            key={sphere.id}
            className="absolute rounded-full pointer-events-none mix-blend-screen"
            style={{
              left: `${sphere.baseX}%`,
              top: `${sphere.baseY}%`,
              width: sphere.size,
              height: sphere.size,
              transform: `translate(-50%, -50%) translate(${floatX + parallaxX + spreadX}px, ${floatY + parallaxY + spreadY}px) scale(${pulse})`,
              transition: 'transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            }}
          >
            {/* Main sphere gradient - soft edge */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: `radial-gradient(
                  circle at 30% 30%,
                  hsla(${sphere.hue}, 85%, ${85 * brightnessMultiplier}%, 0.95) 0%,
                  hsla(${sphere.hue + 15}, 80%, ${70 * brightnessMultiplier}%, 0.8) 20%,
                  hsla(${sphere.hue + 30}, 70%, ${55 * brightnessMultiplier}%, 0.5) 45%,
                  hsla(${sphere.hue + 50}, 55%, ${40 * brightnessMultiplier}%, 0.2) 70%,
                  transparent 100%
                )`,
                filter: 'blur(25px)',
              }}
            />

            {/* Bright highlight spot */}
            <div
              className="absolute rounded-full"
              style={{
                left: '20%',
                top: '20%',
                width: '30%',
                height: '30%',
                background: `radial-gradient(
                  circle,
                  hsla(${sphere.hue}, 100%, ${95 * brightnessMultiplier}%, 0.9) 0%,
                  hsla(${sphere.hue}, 90%, ${80 * brightnessMultiplier}%, 0.4) 50%,
                  transparent 100%
                )`,
                filter: 'blur(15px)',
              }}
            />

            {/* Outer glow - intensifies on hover */}
            <div
              className="absolute -inset-1/4 rounded-full transition-opacity duration-500"
              style={{
                background: `radial-gradient(
                  circle,
                  hsla(${sphere.hue}, 70%, ${55 * brightnessMultiplier}%, ${glowIntensity}) 0%,
                  transparent 70%
                )`,
                filter: 'blur(40px)',
              }}
            />
          </div>
        );
      })}

      {/* Mouse-following glow trail */}
      {mousePos.isActive && (
        <div
          className="absolute pointer-events-none transition-opacity duration-300"
          style={{
            left: `${smoothedMouse.x * 100}%`,
            top: `${smoothedMouse.y * 100}%`,
            width: 200,
            height: 200,
            transform: 'translate(-50%, -50%)',
            background: `radial-gradient(circle, hsla(${colors.primary}, 60%, 60%, 0.15) 0%, transparent 70%)`,
            filter: 'blur(30px)',
          }}
        />
      )}

      {/* Subtle noise/grain overlay for texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: mode === 'dark'
            ? 'radial-gradient(ellipse at center, transparent 35%, hsla(240, 30%, 5%, 0.5) 100%)'
            : 'radial-gradient(ellipse at center, transparent 45%, hsla(230, 20%, 92%, 0.4) 100%)',
        }}
      />
    </div>
  );
});

export default GradientSpheresHero;
