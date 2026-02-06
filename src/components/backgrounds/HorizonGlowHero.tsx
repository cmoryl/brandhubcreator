import { useRef, useState, useCallback, useEffect, memo, useMemo } from 'react';
import { cn } from '@/lib/utils';

export type HorizonGlowColorScheme = 'cyan' | 'purple' | 'blue' | 'teal' | 'rose' | 'custom';
export type HorizonGlowMode = 'dark' | 'light';

interface HorizonGlowHeroProps {
  className?: string;
  colorScheme?: HorizonGlowColorScheme;
  mode?: HorizonGlowMode;
  brightness?: number;
  pulseAnimation?: boolean;
}

interface Ember {
  id: number;
  x: number;
  size: number;
  speed: number;
  delay: number;
  drift: number;
  opacity: number;
}

const COLOR_SCHEMES: Record<Exclude<HorizonGlowColorScheme, 'custom'>, { primary: number; secondary: number }> = {
  'cyan': { primary: 185, secondary: 200 },
  'purple': { primary: 270, secondary: 290 },
  'blue': { primary: 210, secondary: 230 },
  'teal': { primary: 170, secondary: 190 },
  'rose': { primary: 340, secondary: 320 },
};

const EMBER_COUNT = 25;

export const HorizonGlowHero = memo(function HorizonGlowHero({
  className = '',
  colorScheme = 'cyan',
  mode = 'dark',
  brightness = 50,
  pulseAnimation = true,
}: HorizonGlowHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [time, setTime] = useState(0);
  const animationRef = useRef<number>(0);

  const colors = COLOR_SCHEMES[colorScheme === 'custom' ? 'cyan' : colorScheme];
  const brightnessMultiplier = 0.4 + (brightness / 100) * 1.2;

  const bgColors = mode === 'dark'
    ? { base: 'hsl(220, 30%, 6%)', gradient: 'hsl(220, 35%, 10%)' }
    : { base: 'hsl(210, 20%, 95%)', gradient: 'hsl(210, 25%, 90%)' };

  // Generate ember configurations
  const embers: Ember[] = useMemo(() => 
    Array.from({ length: EMBER_COUNT }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      size: 2 + Math.random() * 4,
      speed: 8 + Math.random() * 12, // Duration in seconds
      delay: Math.random() * 8,
      drift: (Math.random() - 0.5) * 40, // Horizontal drift
      opacity: 0.3 + Math.random() * 0.5,
    })),
  []);

  // Smooth pulse animation
  useEffect(() => {
    if (!pulseAnimation) return;
    
    const animate = (timestamp: number) => {
      setTime(timestamp * 0.0003);
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [pulseAnimation]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    });
  }, []);

  // Pulse effect for the glow
  const pulseScale = pulseAnimation ? 1 + Math.sin(time) * 0.03 : 1;
  const pulseOpacity = pulseAnimation ? 0.85 + Math.sin(time * 1.5) * 0.15 : 1;

  // Mouse-reactive position offset
  const glowOffsetX = (mousePos.x - 0.5) * 30;
  const glowOffsetY = (mousePos.y - 0.5) * 15;

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
          background: `linear-gradient(180deg, ${bgColors.base} 0%, ${bgColors.gradient} 100%)`,
        }}
      />

      {/* Floating blue embers */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {embers.map((ember) => (
          <div
            key={ember.id}
            className="absolute rounded-full"
            style={{
              left: `${ember.x}%`,
              bottom: '-10px',
              width: ember.size,
              height: ember.size,
              background: `radial-gradient(circle, hsla(${colors.primary}, 100%, 70%, ${ember.opacity * brightnessMultiplier}) 0%, hsla(${colors.primary}, 90%, 50%, 0) 70%)`,
              boxShadow: `0 0 ${ember.size * 2}px hsla(${colors.primary}, 100%, 60%, ${ember.opacity * 0.5 * brightnessMultiplier})`,
              animation: `emberFloat ${ember.speed}s ease-in-out infinite`,
              animationDelay: `${ember.delay}s`,
              '--drift': `${ember.drift}px`,
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* Main horizon glow arc */}
      <div
        className="absolute left-1/2 bottom-0 -translate-x-1/2 pointer-events-none"
        style={{
          width: '180%',
          height: '70%',
          transform: `translate(calc(-50% + ${glowOffsetX}px), calc(40% + ${glowOffsetY}px)) scale(${pulseScale})`,
          transition: 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }}
      >
        {/* Core bright glow */}
        <div
          className="absolute inset-0 rounded-[100%]"
          style={{
            background: `radial-gradient(
              ellipse 50% 80% at 50% 100%,
              hsla(${colors.primary}, 100%, ${85 * brightnessMultiplier}%, ${0.95 * pulseOpacity}) 0%,
              hsla(${colors.primary}, 95%, ${75 * brightnessMultiplier}%, ${0.8 * pulseOpacity}) 15%,
              hsla(${colors.primary + 10}, 85%, ${60 * brightnessMultiplier}%, ${0.5 * pulseOpacity}) 35%,
              hsla(${colors.secondary}, 70%, ${40 * brightnessMultiplier}%, ${0.2 * pulseOpacity}) 55%,
              transparent 75%
            )`,
            filter: `blur(${mode === 'dark' ? 30 : 20}px)`,
          }}
        />

        {/* Secondary outer glow */}
        <div
          className="absolute inset-0 rounded-[100%]"
          style={{
            background: `radial-gradient(
              ellipse 60% 90% at 50% 100%,
              hsla(${colors.primary}, 80%, ${65 * brightnessMultiplier}%, ${0.4 * pulseOpacity}) 0%,
              hsla(${colors.secondary}, 60%, ${45 * brightnessMultiplier}%, ${0.15 * pulseOpacity}) 40%,
              transparent 70%
            )`,
            filter: 'blur(60px)',
          }}
        />
      </div>

      {/* Ambient top fade */}
      <div
        className="absolute top-0 left-0 right-0 h-1/3 pointer-events-none"
        style={{
          background: `linear-gradient(180deg, hsla(${colors.primary}, 40%, 50%, 0.05) 0%, transparent 100%)`,
        }}
      />

      {/* Subtle vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: mode === 'dark'
            ? 'radial-gradient(ellipse at center, transparent 30%, hsla(220, 30%, 3%, 0.5) 100%)'
            : 'radial-gradient(ellipse at center, transparent 40%, hsla(210, 20%, 90%, 0.3) 100%)',
        }}
      />

      {/* Ember animation keyframes */}
      <style>{`
        @keyframes emberFloat {
          0% {
            transform: translateY(0) translateX(0) scale(1);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100vh) translateX(var(--drift)) scale(0.5);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
});

export default HorizonGlowHero;
