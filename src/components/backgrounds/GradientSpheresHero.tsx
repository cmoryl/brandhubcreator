import { useRef, useState, useCallback, useEffect, memo } from 'react';
import { cn } from '@/lib/utils';

export type GradientSpheresColorScheme = 'purple-blue' | 'cyan-purple' | 'blue-teal' | 'pink-purple' | 'custom';
export type GradientSpheresMode = 'dark' | 'light';

interface GradientSpheresHeroProps {
  className?: string;
  colorScheme?: GradientSpheresColorScheme;
  mode?: GradientSpheresMode;
  brightness?: number;
}

const COLOR_SCHEMES: Record<Exclude<GradientSpheresColorScheme, 'custom'>, { primary: number; secondary: number; accent: number }> = {
  'purple-blue': { primary: 280, secondary: 240, accent: 200 },
  'cyan-purple': { primary: 190, secondary: 260, accent: 220 },
  'blue-teal': { primary: 220, secondary: 180, accent: 200 },
  'pink-purple': { primary: 330, secondary: 280, accent: 300 },
};

export const GradientSpheresHero = memo(function GradientSpheresHero({
  className = '',
  colorScheme = 'purple-blue',
  mode = 'dark',
  brightness = 50,
}: GradientSpheresHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [smoothedMouse, setSmoothedMouse] = useState({ x: 0.5, y: 0.5 });
  const [time, setTime] = useState(0);
  const animationRef = useRef<number>(0);

  const colors = COLOR_SCHEMES[colorScheme === 'custom' ? 'purple-blue' : colorScheme];
  const brightnessMultiplier = 0.4 + (brightness / 100) * 1.2;

  const bgColors = mode === 'dark'
    ? { base: 'hsl(240, 30%, 8%)', mid: 'hsl(250, 35%, 12%)' }
    : { base: 'hsl(230, 20%, 96%)', mid: 'hsl(230, 25%, 94%)' };

  // Smooth animation
  useEffect(() => {
    let lastTimestamp = 0;

    const animate = (timestamp: number) => {
      if (timestamp - lastTimestamp > 16) {
        setTime(timestamp * 0.00015);
        setSmoothedMouse(prev => ({
          x: prev.x + (mousePos.x - prev.x) * 0.025,
          y: prev.y + (mousePos.y - prev.y) * 0.025,
        }));
        lastTimestamp = timestamp;
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [mousePos.x, mousePos.y]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    });
  }, []);

  // Sphere configurations for overlapping effect (like the Figma illustrative style)
  const spheres = [
    { id: 1, x: 25, y: 45, size: 400, hue: colors.primary, depth: 0.8 },
    { id: 2, x: 65, y: 50, size: 350, hue: colors.secondary, depth: 1 },
    { id: 3, x: 45, y: 35, size: 180, hue: colors.accent, depth: 0.5 },
  ];

  return (
    <div
      ref={containerRef}
      className={cn('absolute inset-0 overflow-hidden z-0', className)}
      onMouseMove={handleMouseMove}
      aria-hidden="true"
    >
      {/* Base gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${bgColors.base} 0%, ${bgColors.mid} 50%, ${bgColors.base} 100%)`,
        }}
      />

      {/* Overlapping gradient spheres */}
      {spheres.map((sphere) => {
        // Smooth floating animation
        const floatX = Math.sin(time + sphere.id) * 12 * sphere.depth;
        const floatY = Math.cos(time * 0.8 + sphere.id * 0.5) * 10 * sphere.depth;
        
        // Mouse parallax
        const parallaxX = (smoothedMouse.x - 0.5) * 50 * sphere.depth;
        const parallaxY = (smoothedMouse.y - 0.5) * 35 * sphere.depth;

        // Subtle pulse
        const pulse = 1 + Math.sin(time * 1.2 + sphere.id * 0.7) * 0.05;

        return (
          <div
            key={sphere.id}
            className="absolute rounded-full pointer-events-none mix-blend-screen"
            style={{
              left: `${sphere.x}%`,
              top: `${sphere.y}%`,
              width: sphere.size,
              height: sphere.size,
              transform: `translate(-50%, -50%) translate(${floatX + parallaxX}px, ${floatY + parallaxY}px) scale(${pulse})`,
              transition: 'transform 1s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
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

            {/* Outer glow */}
            <div
              className="absolute -inset-1/4 rounded-full"
              style={{
                background: `radial-gradient(
                  circle,
                  hsla(${sphere.hue}, 70%, ${55 * brightnessMultiplier}%, 0.25) 0%,
                  transparent 70%
                )`,
                filter: 'blur(40px)',
              }}
            />
          </div>
        );
      })}

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
