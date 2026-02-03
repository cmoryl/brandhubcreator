import { useRef, useState, useCallback, useEffect, memo } from 'react';
import { cn } from '@/lib/utils';

export type FloatingOrbsColorScheme = 'blue-purple' | 'cyan-teal' | 'purple-pink' | 'teal-green' | 'custom';
export type FloatingOrbsMode = 'dark' | 'light';
export type FloatingOrbsDensity = 'few' | 'normal' | 'many' | 'dense';
export type FloatingOrbsSpeed = 'slow' | 'normal' | 'fast' | 'very-fast';

interface FloatingOrbsHeroProps {
  className?: string;
  colorScheme?: FloatingOrbsColorScheme;
  mode?: FloatingOrbsMode;
  brightness?: number;
  orbCount?: number;
  density?: FloatingOrbsDensity;
  speed?: FloatingOrbsSpeed;
}

interface Orb {
  id: number;
  baseX: number;
  baseY: number;
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

const DENSITY_COUNTS: Record<FloatingOrbsDensity, number> = {
  'few': 3,
  'normal': 5,
  'many': 8,
  'dense': 12,
};

const SPEED_MULTIPLIERS: Record<FloatingOrbsSpeed, number> = {
  'slow': 0.4,
  'normal': 1,
  'fast': 2,
  'very-fast': 3.5,
};

export const FloatingOrbsHero = memo(function FloatingOrbsHero({
  className = '',
  colorScheme = 'blue-purple',
  mode = 'dark',
  brightness = 50,
  orbCount,
  density = 'normal',
  speed = 'normal',
}: FloatingOrbsHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5, isActive: false });
  const [smoothedMouse, setSmoothedMouse] = useState({ x: 0.5, y: 0.5 });
  const [time, setTime] = useState(0);
  const animationRef = useRef<number>(0);

  const colors = COLOR_SCHEMES[colorScheme === 'custom' ? 'blue-purple' : colorScheme];
  const brightnessMultiplier = 0.4 + (brightness / 100) * 1.2;
  const speedMultiplier = SPEED_MULTIPLIERS[speed];
  const actualOrbCount = orbCount ?? DENSITY_COUNTS[density];

  const bgColors = mode === 'dark'
    ? { base: 'hsl(230, 25%, 5%)', mid: 'hsl(230, 30%, 8%)' }
    : { base: 'hsl(220, 20%, 96%)', mid: 'hsl(220, 25%, 94%)' };

  // Generate stable orb configurations - spread around the container
  const orbs: Orb[] = Array.from({ length: actualOrbCount }, (_, i) => {
    const angle = (i / actualOrbCount) * Math.PI * 2;
    const radius = 20 + (i % 3) * 12;
    return {
      id: i,
      baseX: 50 + Math.cos(angle) * radius,
      baseY: 50 + Math.sin(angle) * radius,
      size: 140 + (i * 35) + (i % 2 === 0 ? 40 : 0),
      hue: i % 2 === 0 ? colors.primary : colors.secondary,
      speed: (0.3 + (i * 0.08)) * speedMultiplier,
      phase: (i * Math.PI * 2) / actualOrbCount,
    };
  });

  // Smooth animation loop
  useEffect(() => {
    let lastTimestamp = 0;

    const animate = (timestamp: number) => {
      if (timestamp - lastTimestamp > 16) {
        setTime(timestamp * 0.0003 * speedMultiplier);
        setSmoothedMouse(prev => ({
          x: prev.x + (mousePos.x - prev.x) * 0.08,
          y: prev.y + (mousePos.y - prev.y) * 0.08,
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

  // Dynamic mouse-following background gradient position
  const bgGradientX = 30 + smoothedMouse.x * 40;
  const bgGradientY = 30 + smoothedMouse.y * 40;

  return (
    <div
      ref={containerRef}
      className={cn('absolute inset-0 overflow-hidden z-0 pointer-events-auto', className)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      aria-hidden="true"
    >
      {/* Animated mouse-following base background */}
      <div
        className="absolute inset-0 transition-all duration-700 ease-out"
        style={{
          background: `radial-gradient(ellipse at ${bgGradientX}% ${bgGradientY}%, ${bgColors.mid} 0%, ${bgColors.base} 100%)`,
        }}
      />

      {/* Secondary animated glow layer following mouse */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle at ${smoothedMouse.x * 100}% ${smoothedMouse.y * 100}%, 
            hsla(${colors.primary}, 60%, 50%, ${mousePos.isActive ? 0.15 : 0.05}) 0%,
            transparent 50%
          )`,
          opacity: mousePos.isActive ? 1 : 0.5,
        }}
      />

      {/* Floating orbs */}
      {orbs.map((orb) => {
        // Base floating animation
        const floatX = Math.sin(time * orb.speed + orb.phase) * 30;
        const floatY = Math.cos(time * orb.speed * 0.8 + orb.phase) * 25;
        
        // Calculate distance from mouse to orb center
        const orbCenterX = orb.baseX / 100;
        const orbCenterY = orb.baseY / 100;
        const distToMouse = Math.sqrt(
          Math.pow(smoothedMouse.x - orbCenterX, 2) + 
          Math.pow(smoothedMouse.y - orbCenterY, 2)
        );
        
        // SPREAD/GATHER EFFECT: Orbs move away from mouse when it's near, gather when far
        const spreadStrength = mousePos.isActive ? 120 : 0;
        const spreadThreshold = 0.4;
        
        let spreadX = 0;
        let spreadY = 0;
        
        if (distToMouse < spreadThreshold && mousePos.isActive) {
          const pushFactor = (1 - distToMouse / spreadThreshold) * spreadStrength;
          const angle = Math.atan2(orbCenterY - smoothedMouse.y, orbCenterX - smoothedMouse.x);
          spreadX = Math.cos(angle) * pushFactor;
          spreadY = Math.sin(angle) * pushFactor;
        }

        // Pulse scale - more dramatic when mouse is active
        const basePulse = 1 + Math.sin(time * 1.2 + orb.phase) * 0.1;
        const mouseProximityScale = mousePos.isActive && distToMouse < 0.3 
          ? 1.15 + (1 - distToMouse / 0.3) * 0.2 
          : 1;
        const pulseScale = basePulse * mouseProximityScale;

        // Rotation based on time for more dynamic feel
        const rotation = (time * 10 * orb.speed) % 360;

        return (
          <div
            key={orb.id}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: `${orb.baseX}%`,
              top: `${orb.baseY}%`,
              width: orb.size,
              height: orb.size,
              transform: `translate(-50%, -50%) translate(${floatX + spreadX}px, ${floatY + spreadY}px) scale(${pulseScale}) rotate(${rotation}deg)`,
              transition: mousePos.isActive 
                ? 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)' 
                : 'transform 1s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            }}
          >
            {/* Inner bright core */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: `radial-gradient(
                  circle at 35% 35%,
                  hsla(${orb.hue}, 85%, ${95 * brightnessMultiplier}%, 0.95) 0%,
                  hsla(${orb.hue}, 90%, ${75 * brightnessMultiplier}%, 0.75) 20%,
                  hsla(${orb.hue + 20}, 80%, ${60 * brightnessMultiplier}%, 0.45) 45%,
                  hsla(${orb.hue + 40}, 65%, ${45 * brightnessMultiplier}%, 0.2) 70%,
                  transparent 100%
                )`,
                filter: 'blur(35px)',
              }}
            />

            {/* Outer glow halo */}
            <div
              className="absolute -inset-1/3 rounded-full"
              style={{
                background: `radial-gradient(
                  circle at 40% 40%,
                  hsla(${orb.hue}, 75%, ${65 * brightnessMultiplier}%, 0.35) 0%,
                  hsla(${orb.hue + 30}, 55%, ${50 * brightnessMultiplier}%, 0.15) 45%,
                  transparent 75%
                )`,
                filter: 'blur(50px)',
              }}
            />
          </div>
        );
      })}

      {/* Connection lines between nearby orbs */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.15 }}>
        {orbs.map((orb, i) => 
          orbs.slice(i + 1).map((other, j) => {
            const x1 = orb.baseX;
            const y1 = orb.baseY;
            const x2 = other.baseX;
            const y2 = other.baseY;
            const dist = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
            if (dist > 50) return null;
            
            return (
              <line
                key={`${i}-${j}`}
                x1={`${x1}%`}
                y1={`${y1}%`}
                x2={`${x2}%`}
                y2={`${y2}%`}
                stroke={`hsl(${colors.primary}, 70%, 60%)`}
                strokeWidth="1"
                style={{ opacity: 1 - dist / 50 }}
              />
            );
          })
        )}
      </svg>

      {/* Mouse trail effect */}
      {mousePos.isActive && (
        <div
          className="absolute pointer-events-none rounded-full transition-all duration-300"
          style={{
            left: `${smoothedMouse.x * 100}%`,
            top: `${smoothedMouse.y * 100}%`,
            width: 200,
            height: 200,
            transform: 'translate(-50%, -50%)',
            background: `radial-gradient(circle, 
              hsla(${colors.primary}, 80%, 60%, 0.2) 0%,
              hsla(${colors.secondary}, 60%, 50%, 0.1) 40%,
              transparent 70%
            )`,
            filter: 'blur(20px)',
          }}
        />
      )}

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
