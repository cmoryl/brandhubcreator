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

interface PhysicsSphere {
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

// Physics constants for playful feel
const PHYSICS = {
  // Spring force pulling spheres back to base position
  springStrength: 0.015,
  // Damping/friction for fluid feel
  damping: 0.96,
  // Mouse repulsion strength
  mouseRepulsion: 800,
  // Mouse attraction (hold)
  mouseAttraction: 0,
  // Mouse influence radius (in normalized units)
  mouseRadius: 0.35,
  // Collision bounce factor
  collisionBounce: 0.8,
  // Minimum separation distance between spheres (relative to size)
  minSeparation: 0.6,
  // Ambient floating strength
  floatStrength: 0.3,
  // Max velocity cap
  maxVelocity: 15,
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
  const mouseRef = useRef({ x: 0.5, y: 0.5, isActive: false, isPressed: false });
  const animationRef = useRef<number>(0);
  const timeRef = useRef(0);
  const spheresRef = useRef<PhysicsSphere[]>([]);
  const [, forceRender] = useState(0);

  // Defensive fallback for color scheme
  const schemeKey =
    colorScheme !== 'custom' && Object.prototype.hasOwnProperty.call(COLOR_SCHEMES, colorScheme)
      ? colorScheme
      : 'purple-blue';

  const colors = COLOR_SCHEMES[schemeKey];
  const brightnessMultiplier = 0.4 + (brightness / 100) * 1.2;
  const speedMultiplier = SPEED_MULTIPLIERS[speed];
  const actualSphereCount = sphereCount ?? DENSITY_COUNTS[density];

  const bgColors = mode === 'dark'
    ? { base: 'hsl(240, 30%, 8%)', mid: 'hsl(250, 35%, 12%)' }
    : { base: 'hsl(230, 20%, 96%)', mid: 'hsl(230, 25%, 94%)' };

  // Initialize physics spheres
  useEffect(() => {
    const hueOptions = [colors.primary, colors.secondary, colors.accent];
    spheresRef.current = Array.from({ length: actualSphereCount }, (_, i) => {
      const angle = (i / actualSphereCount) * Math.PI * 2;
      const radius = 15 + (i % 3) * 10;
      const baseX = 50 + Math.cos(angle) * radius;
      const baseY = 50 + Math.sin(angle) * radius;
      const size = 180 + (i * 50) + (i % 2 === 0 ? 80 : 0);
      
      return {
        id: i,
        x: baseX,
        y: baseY,
        vx: 0,
        vy: 0,
        baseX,
        baseY,
        size,
        mass: size / 200,
        hue: hueOptions[i % 3],
        depth: 0.5 + (i % 3) * 0.25,
        phase: (i * Math.PI * 2) / actualSphereCount,
      };
    });
  }, [actualSphereCount, colors.primary, colors.secondary, colors.accent]);

  // Physics simulation loop
  useEffect(() => {
    let lastTime = performance.now();

    const simulate = (currentTime: number) => {
      const deltaTime = Math.min((currentTime - lastTime) / 16.67, 2); // Normalize to ~60fps, cap at 2x
      lastTime = currentTime;
      timeRef.current += 0.016 * speedMultiplier;

      const spheres = spheresRef.current;
      const mouse = mouseRef.current;

      // Apply forces to each sphere
      for (let i = 0; i < spheres.length; i++) {
        const sphere = spheres[i];

        // 1. Ambient floating motion
        const floatX = Math.sin(timeRef.current + sphere.phase) * PHYSICS.floatStrength;
        const floatY = Math.cos(timeRef.current * 0.7 + sphere.phase * 0.5) * PHYSICS.floatStrength;

        // 2. Spring force back to base position
        const springDx = (sphere.baseX + floatX - sphere.x);
        const springDy = (sphere.baseY + floatY - sphere.y);
        sphere.vx += springDx * PHYSICS.springStrength * deltaTime;
        sphere.vy += springDy * PHYSICS.springStrength * deltaTime;

        // 3. Mouse interaction
        if (mouse.isActive) {
          const dx = (sphere.x / 100) - mouse.x;
          const dy = (sphere.y / 100) - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < PHYSICS.mouseRadius && dist > 0.01) {
            const force = (1 - dist / PHYSICS.mouseRadius);
            const normalizedDx = dx / dist;
            const normalizedDy = dy / dist;

            if (mouse.isPressed) {
              // Attraction when pressed
              sphere.vx -= normalizedDx * force * 0.5 * deltaTime;
              sphere.vy -= normalizedDy * force * 0.5 * deltaTime;
            } else {
              // Repulsion on hover
              const repulsionForce = PHYSICS.mouseRepulsion * force * force / sphere.mass;
              sphere.vx += normalizedDx * repulsionForce * 0.001 * deltaTime;
              sphere.vy += normalizedDy * repulsionForce * 0.001 * deltaTime;
            }
          }
        }

        // 4. Sphere-to-sphere collision
        for (let j = i + 1; j < spheres.length; j++) {
          const other = spheres[j];
          const cdx = sphere.x - other.x;
          const cdy = sphere.y - other.y;
          const cdist = Math.sqrt(cdx * cdx + cdy * cdy);
          
          // Combined radius in percentage units
          const minDist = ((sphere.size + other.size) / 2) * PHYSICS.minSeparation / 10;

          if (cdist < minDist && cdist > 0.1) {
            // Collision detected - apply impulse
            const overlap = minDist - cdist;
            const nx = cdx / cdist;
            const ny = cdy / cdist;

            // Relative velocity
            const dvx = sphere.vx - other.vx;
            const dvy = sphere.vy - other.vy;
            const relVel = dvx * nx + dvy * ny;

            // Only resolve if spheres are approaching
            if (relVel < 0) {
              const totalMass = sphere.mass + other.mass;
              const impulse = (-(1 + PHYSICS.collisionBounce) * relVel) / totalMass;

              sphere.vx += impulse * other.mass * nx;
              sphere.vy += impulse * other.mass * ny;
              other.vx -= impulse * sphere.mass * nx;
              other.vy -= impulse * sphere.mass * ny;
            }

            // Separate overlapping spheres
            const separation = overlap / 2;
            sphere.x += nx * separation;
            sphere.y += ny * separation;
            other.x -= nx * separation;
            other.y -= ny * separation;
          }
        }

        // 5. Apply damping (fluid resistance)
        sphere.vx *= PHYSICS.damping;
        sphere.vy *= PHYSICS.damping;

        // 6. Velocity cap
        const vel = Math.sqrt(sphere.vx * sphere.vx + sphere.vy * sphere.vy);
        if (vel > PHYSICS.maxVelocity) {
          sphere.vx = (sphere.vx / vel) * PHYSICS.maxVelocity;
          sphere.vy = (sphere.vy / vel) * PHYSICS.maxVelocity;
        }

        // 7. Update position
        sphere.x += sphere.vx * deltaTime;
        sphere.y += sphere.vy * deltaTime;

        // 8. Boundary constraints (soft bounce)
        if (sphere.x < 5) { sphere.x = 5; sphere.vx *= -0.5; }
        if (sphere.x > 95) { sphere.x = 95; sphere.vx *= -0.5; }
        if (sphere.y < 5) { sphere.y = 5; sphere.vy *= -0.5; }
        if (sphere.y > 95) { sphere.y = 95; sphere.vy *= -0.5; }
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

  const spheres = spheresRef.current;

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
      {/* Base gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${bgColors.base} 0%, ${bgColors.mid} 50%, ${bgColors.base} 100%)`,
        }}
      />

      {/* Physics-driven spheres */}
      {spheres.map((sphere) => {
        const velocity = Math.sqrt(sphere.vx * sphere.vx + sphere.vy * sphere.vy);
        const glowIntensity = Math.min(0.25 + velocity * 0.02, 0.5);
        const scale = 1 + velocity * 0.01;

        return (
          <div
            key={sphere.id}
            className="absolute rounded-full pointer-events-none mix-blend-screen"
            style={{
              left: `${sphere.x}%`,
              top: `${sphere.y}%`,
              width: sphere.size,
              height: sphere.size,
              transform: `translate(-50%, -50%) scale(${scale})`,
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

            {/* Outer glow - intensifies with velocity */}
            <div
              className="absolute -inset-1/4 rounded-full"
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

      {/* Mouse interaction indicator */}
      {mouseRef.current.isActive && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: `${mouseRef.current.x * 100}%`,
            top: `${mouseRef.current.y * 100}%`,
            width: mouseRef.current.isPressed ? 100 : 150,
            height: mouseRef.current.isPressed ? 100 : 150,
            transform: 'translate(-50%, -50%)',
            background: mouseRef.current.isPressed 
              ? `radial-gradient(circle, hsla(${colors.secondary}, 60%, 60%, 0.25) 0%, transparent 70%)`
              : `radial-gradient(circle, hsla(${colors.primary}, 60%, 60%, 0.12) 0%, transparent 70%)`,
            filter: 'blur(20px)',
            transition: 'width 0.2s, height 0.2s, background 0.2s',
          }}
        />
      )}

      {/* Subtle noise overlay */}
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
