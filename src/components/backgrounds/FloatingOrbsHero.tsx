import { useRef, useState, useCallback, useEffect, memo } from 'react';
import { cn } from '@/lib/utils';

export type FloatingOrbsColorScheme = 'blue-purple' | 'cyan-teal' | 'purple-pink' | 'teal-green' | 'custom';
export type FloatingOrbsMode = 'dark' | 'light';

interface FloatingOrbsHeroProps {
  className?: string;
  colorScheme?: FloatingOrbsColorScheme;
  mode?: FloatingOrbsMode;
  brightness?: number;
  orbCount?: number;
}

interface Orb {
  id: number;
  x: number;
  y: number;
  size: number;
  hue: number;
  speed: number;
  phase: number;
}

const COLOR_SCHEMES: Record<Exclude<FloatingOrbsColorScheme, 'custom'>, { primary: number; secondary: number }> = {
  'blue-purple': { primary: 220, secondary: 270 },
  'cyan-teal': { primary: 185, secondary: 170 },
  'purple-pink': { primary: 280, secondary: 330 },
  'teal-green': { primary: 170, secondary: 140 },
};

export const FloatingOrbsHero = memo(function FloatingOrbsHero({
  className = '',
  colorScheme = 'blue-purple',
  mode = 'dark',
  brightness = 50,
  orbCount = 3,
}: FloatingOrbsHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [smoothedMouse, setSmoothedMouse] = useState({ x: 0.5, y: 0.5 });
  const [time, setTime] = useState(0);
  const animationRef = useRef<number>(0);

  const colors = COLOR_SCHEMES[colorScheme === 'custom' ? 'blue-purple' : colorScheme];
  const brightnessMultiplier = 0.4 + (brightness / 100) * 1.2;

  const bgColors = mode === 'dark'
    ? { base: 'hsl(230, 25%, 5%)', mid: 'hsl(230, 30%, 8%)' }
    : { base: 'hsl(220, 20%, 96%)', mid: 'hsl(220, 25%, 94%)' };

  // Generate stable orb configurations
  const orbs: Orb[] = Array.from({ length: orbCount }, (_, i) => ({
    id: i,
    x: 20 + (i * 30) + (i % 2 === 0 ? 10 : -10),
    y: 30 + (i * 15),
    size: 250 + (i * 80) - (i % 2 === 0 ? 50 : 0),
    hue: i % 2 === 0 ? colors.primary : colors.secondary,
    speed: 0.3 + (i * 0.15),
    phase: (i * Math.PI) / orbCount,
  }));

  // Smooth animation loop
  useEffect(() => {
    let lastTimestamp = 0;

    const animate = (timestamp: number) => {
      if (timestamp - lastTimestamp > 16) {
        setTime(timestamp * 0.0002);
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
  }, [mousePos.x, mousePos.y]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    });
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn('absolute inset-0 overflow-hidden z-0', className)}
      onMouseMove={handleMouseMove}
      aria-hidden="true"
    >
      {/* Base background */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at center, ${bgColors.mid} 0%, ${bgColors.base} 100%)`,
        }}
      />

      {/* Floating orbs */}
      {orbs.map((orb) => {
        // Calculate animated position
        const floatX = Math.sin(time * orb.speed + orb.phase) * 20;
        const floatY = Math.cos(time * orb.speed * 0.7 + orb.phase) * 15;
        
        // Mouse parallax effect
        const parallaxX = (smoothedMouse.x - 0.5) * 40 * ((orb.id + 1) / orbCount);
        const parallaxY = (smoothedMouse.y - 0.5) * 25 * ((orb.id + 1) / orbCount);

        const pulseScale = 1 + Math.sin(time * 0.8 + orb.phase) * 0.08;

        return (
          <div
            key={orb.id}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: `${orb.x}%`,
              top: `${orb.y}%`,
              width: orb.size,
              height: orb.size,
              transform: `translate(${floatX + parallaxX}px, ${floatY + parallaxY}px) scale(${pulseScale})`,
              transition: 'transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            }}
          >
            {/* Inner bright core */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: `radial-gradient(
                  circle at 35% 35%,
                  hsla(${orb.hue}, 80%, ${90 * brightnessMultiplier}%, 0.9) 0%,
                  hsla(${orb.hue}, 85%, ${70 * brightnessMultiplier}%, 0.7) 25%,
                  hsla(${orb.hue + 20}, 75%, ${55 * brightnessMultiplier}%, 0.4) 50%,
                  hsla(${orb.hue + 40}, 60%, ${40 * brightnessMultiplier}%, 0.15) 75%,
                  transparent 100%
                )`,
                filter: 'blur(40px)',
              }}
            />

            {/* Outer glow halo */}
            <div
              className="absolute -inset-1/4 rounded-full"
              style={{
                background: `radial-gradient(
                  circle at 40% 40%,
                  hsla(${orb.hue}, 70%, ${60 * brightnessMultiplier}%, 0.3) 0%,
                  hsla(${orb.hue + 30}, 50%, ${45 * brightnessMultiplier}%, 0.1) 50%,
                  transparent 80%
                )`,
                filter: 'blur(60px)',
              }}
            />
          </div>
        );
      })}

      {/* Subtle vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: mode === 'dark'
            ? 'radial-gradient(ellipse at center, transparent 40%, hsla(230, 25%, 3%, 0.6) 100%)'
            : 'radial-gradient(ellipse at center, transparent 50%, hsla(220, 20%, 92%, 0.4) 100%)',
        }}
      />
    </div>
  );
});

export default FloatingOrbsHero;
