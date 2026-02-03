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

interface PhysicsOrb {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseX: number;
  baseY: number;
  size: number;
  mass: number;
  hue: number;
  orbSpeed: number;
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

// Physics constants for playful feel
const PHYSICS = {
  springStrength: 0.012,
  damping: 0.95,
  mouseRepulsion: 900,
  mouseRadius: 0.4,
  collisionBounce: 0.75,
  minSeparation: 0.55,
  floatStrength: 0.4,
  maxVelocity: 18,
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
  const mouseRef = useRef({ x: 0.5, y: 0.5, isActive: false, isPressed: false });
  const animationRef = useRef<number>(0);
  const timeRef = useRef(0);
  const orbsRef = useRef<PhysicsOrb[]>([]);
  const [, forceRender] = useState(0);

  // Defensive fallback for color scheme
  const schemeKey =
    colorScheme !== 'custom' && Object.prototype.hasOwnProperty.call(COLOR_SCHEMES, colorScheme)
      ? colorScheme
      : 'blue-purple';

  const colors = COLOR_SCHEMES[schemeKey];
  const brightnessMultiplier = 0.4 + (brightness / 100) * 1.2;
  const speedMultiplier = SPEED_MULTIPLIERS[speed];
  const actualOrbCount = orbCount ?? DENSITY_COUNTS[density];

  const bgColors = mode === 'dark'
    ? { base: 'hsl(230, 25%, 5%)', mid: 'hsl(230, 30%, 8%)' }
    : { base: 'hsl(220, 20%, 96%)', mid: 'hsl(220, 25%, 94%)' };

  // Initialize physics orbs
  useEffect(() => {
    orbsRef.current = Array.from({ length: actualOrbCount }, (_, i) => {
      const angle = (i / actualOrbCount) * Math.PI * 2;
      const radius = 20 + (i % 3) * 12;
      const baseX = 50 + Math.cos(angle) * radius;
      const baseY = 50 + Math.sin(angle) * radius;
      const size = 140 + (i * 35) + (i % 2 === 0 ? 40 : 0);
      
      return {
        id: i,
        x: baseX,
        y: baseY,
        vx: 0,
        vy: 0,
        baseX,
        baseY,
        size,
        mass: size / 180,
        hue: i % 2 === 0 ? colors.primary : colors.secondary,
        orbSpeed: (0.3 + (i * 0.08)) * speedMultiplier,
        phase: (i * Math.PI * 2) / actualOrbCount,
      };
    });
  }, [actualOrbCount, colors.primary, colors.secondary, speedMultiplier]);

  // Physics simulation loop
  useEffect(() => {
    let lastTime = performance.now();

    const simulate = (currentTime: number) => {
      const deltaTime = Math.min((currentTime - lastTime) / 16.67, 2);
      lastTime = currentTime;
      timeRef.current += 0.016 * speedMultiplier;

      const orbs = orbsRef.current;
      const mouse = mouseRef.current;

      for (let i = 0; i < orbs.length; i++) {
        const orb = orbs[i];

        // 1. Ambient floating motion
        const floatX = Math.sin(timeRef.current * orb.orbSpeed + orb.phase) * PHYSICS.floatStrength;
        const floatY = Math.cos(timeRef.current * orb.orbSpeed * 0.8 + orb.phase) * PHYSICS.floatStrength;

        // 2. Spring force back to base position
        const springDx = (orb.baseX + floatX - orb.x);
        const springDy = (orb.baseY + floatY - orb.y);
        orb.vx += springDx * PHYSICS.springStrength * deltaTime;
        orb.vy += springDy * PHYSICS.springStrength * deltaTime;

        // 3. Mouse interaction
        if (mouse.isActive) {
          const dx = (orb.x / 100) - mouse.x;
          const dy = (orb.y / 100) - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < PHYSICS.mouseRadius && dist > 0.01) {
            const force = (1 - dist / PHYSICS.mouseRadius);
            const normalizedDx = dx / dist;
            const normalizedDy = dy / dist;

            if (mouse.isPressed) {
              // Attraction when pressed
              orb.vx -= normalizedDx * force * 0.6 * deltaTime;
              orb.vy -= normalizedDy * force * 0.6 * deltaTime;
            } else {
              // Repulsion on hover
              const repulsionForce = PHYSICS.mouseRepulsion * force * force / orb.mass;
              orb.vx += normalizedDx * repulsionForce * 0.001 * deltaTime;
              orb.vy += normalizedDy * repulsionForce * 0.001 * deltaTime;
            }
          }
        }

        // 4. Orb-to-orb collision
        for (let j = i + 1; j < orbs.length; j++) {
          const other = orbs[j];
          const cdx = orb.x - other.x;
          const cdy = orb.y - other.y;
          const cdist = Math.sqrt(cdx * cdx + cdy * cdy);
          
          const minDist = ((orb.size + other.size) / 2) * PHYSICS.minSeparation / 10;

          if (cdist < minDist && cdist > 0.1) {
            const overlap = minDist - cdist;
            const nx = cdx / cdist;
            const ny = cdy / cdist;

            const dvx = orb.vx - other.vx;
            const dvy = orb.vy - other.vy;
            const relVel = dvx * nx + dvy * ny;

            if (relVel < 0) {
              const totalMass = orb.mass + other.mass;
              const impulse = (-(1 + PHYSICS.collisionBounce) * relVel) / totalMass;

              orb.vx += impulse * other.mass * nx;
              orb.vy += impulse * other.mass * ny;
              other.vx -= impulse * orb.mass * nx;
              other.vy -= impulse * orb.mass * ny;
            }

            const separation = overlap / 2;
            orb.x += nx * separation;
            orb.y += ny * separation;
            other.x -= nx * separation;
            other.y -= ny * separation;
          }
        }

        // 5. Apply damping
        orb.vx *= PHYSICS.damping;
        orb.vy *= PHYSICS.damping;

        // 6. Velocity cap
        const vel = Math.sqrt(orb.vx * orb.vx + orb.vy * orb.vy);
        if (vel > PHYSICS.maxVelocity) {
          orb.vx = (orb.vx / vel) * PHYSICS.maxVelocity;
          orb.vy = (orb.vy / vel) * PHYSICS.maxVelocity;
        }

        // 7. Update position
        orb.x += orb.vx * deltaTime;
        orb.y += orb.vy * deltaTime;

        // 8. Boundary constraints
        if (orb.x < 5) { orb.x = 5; orb.vx *= -0.5; }
        if (orb.x > 95) { orb.x = 95; orb.vx *= -0.5; }
        if (orb.y < 5) { orb.y = 5; orb.vy *= -0.5; }
        if (orb.y > 95) { orb.y = 95; orb.vy *= -0.5; }
      }

      forceRender(n => n + 1);
      animationRef.current = requestAnimationFrame(simulate);
    };

    animationRef.current = requestAnimationFrame(simulate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [speedMultiplier]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mouseRef.current.x = (e.clientX - rect.left) / rect.width;
    mouseRef.current.y = (e.clientY - rect.top) / rect.height;
    mouseRef.current.isActive = true;
  }, []);

  const handleMouseDown = useCallback(() => {
    mouseRef.current.isPressed = true;
  }, []);

  const handleMouseUp = useCallback(() => {
    mouseRef.current.isPressed = false;
  }, []);

  const handleMouseLeave = useCallback(() => {
    mouseRef.current.isActive = false;
    mouseRef.current.isPressed = false;
  }, []);

  const orbs = orbsRef.current;

  // Dynamic background gradient following mouse
  const bgGradientX = 30 + mouseRef.current.x * 40;
  const bgGradientY = 30 + mouseRef.current.y * 40;

  return (
    <div
      ref={containerRef}
      className={cn('absolute inset-0 overflow-hidden z-0 pointer-events-auto', className)}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
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

      {/* Secondary glow layer following mouse */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle at ${mouseRef.current.x * 100}% ${mouseRef.current.y * 100}%, 
            hsla(${colors.primary}, 60%, 50%, ${mouseRef.current.isActive ? 0.15 : 0.05}) 0%,
            transparent 50%
          )`,
          opacity: mouseRef.current.isActive ? 1 : 0.5,
        }}
      />

      {/* Physics-driven orbs */}
      {orbs.map((orb) => {
        const velocity = Math.sqrt(orb.vx * orb.vx + orb.vy * orb.vy);
        const glowIntensity = Math.min(0.35 + velocity * 0.025, 0.6);
        const scale = 1 + velocity * 0.008;
        const rotation = (timeRef.current * 10 * orb.orbSpeed) % 360;

        return (
          <div
            key={orb.id}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: `${orb.x}%`,
              top: `${orb.y}%`,
              width: orb.size,
              height: orb.size,
              transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotation}deg)`,
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

            {/* Outer glow halo - intensifies with velocity */}
            <div
              className="absolute -inset-1/3 rounded-full"
              style={{
                background: `radial-gradient(
                  circle at 40% 40%,
                  hsla(${orb.hue}, 75%, ${65 * brightnessMultiplier}%, ${glowIntensity}) 0%,
                  hsla(${orb.hue + 30}, 55%, ${50 * brightnessMultiplier}%, ${glowIntensity * 0.4}) 45%,
                  transparent 75%
                )`,
                filter: 'blur(50px)',
              }}
            />
          </div>
        );
      })}

      {/* Dynamic connection lines between nearby orbs */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.2 }}>
        {orbs.map((orb, i) => 
          orbs.slice(i + 1).map((other, j) => {
            const dist = Math.sqrt(Math.pow(other.x - orb.x, 2) + Math.pow(other.y - orb.y, 2));
            if (dist > 40) return null;
            
            return (
              <line
                key={`${i}-${j}`}
                x1={`${orb.x}%`}
                y1={`${orb.y}%`}
                x2={`${other.x}%`}
                y2={`${other.y}%`}
                stroke={`hsl(${colors.primary}, 70%, 60%)`}
                strokeWidth="1.5"
                style={{ opacity: 1 - dist / 40 }}
              />
            );
          })
        )}
      </svg>

      {/* Mouse interaction indicator */}
      {mouseRef.current.isActive && (
        <div
          className="absolute pointer-events-none rounded-full"
          style={{
            left: `${mouseRef.current.x * 100}%`,
            top: `${mouseRef.current.y * 100}%`,
            width: mouseRef.current.isPressed ? 120 : 180,
            height: mouseRef.current.isPressed ? 120 : 180,
            transform: 'translate(-50%, -50%)',
            background: mouseRef.current.isPressed 
              ? `radial-gradient(circle, hsla(${colors.secondary}, 70%, 60%, 0.3) 0%, transparent 70%)`
              : `radial-gradient(circle, hsla(${colors.primary}, 80%, 60%, 0.15) 0%, transparent 70%)`,
            filter: 'blur(20px)',
            transition: 'width 0.2s, height 0.2s, background 0.2s',
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
