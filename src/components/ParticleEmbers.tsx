import { useMemo, useCallback, useEffect, useRef } from 'react';

interface ParticleEmbersProps {
  count?: number;
  color?: string;
  className?: string;
  interactive?: boolean;
}

interface Particle {
  id: number;
  size: number;
  left: number;
  delay: number;
  duration: number;
  driftDuration: number;
  glowDuration: number;
  opacity: number;
}

export function ParticleEmbers({ 
  count = 30, 
  color = 'hsl(199 89% 48%)',
  className = '',
  interactive = false // Disabled by default to prevent scroll blocking
}: ParticleEmbersProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const particleRefs = useRef<(HTMLDivElement | null)[]>([]);
  const mousePosRef = useRef({ x: 0, y: 0 });
  const isHoveringRef = useRef(false);
  const lastUpdateRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i): Particle => {
      const size = Math.random() * 4 + 2;
      const left = Math.random() * 100;
      const delay = Math.random() * 8;
      const duration = Math.random() * 4 + 6;
      const driftDuration = Math.random() * 3 + 2;
      const glowDuration = Math.random() * 2 + 1;
      const opacity = Math.random() * 0.5 + 0.3;
      
      return {
        id: i,
        size,
        left,
        delay,
        duration,
        driftDuration,
        glowDuration,
        opacity,
      };
    });
  }, [count]);

  // Direct DOM updates instead of React state - throttled to 20fps
  const updateParticles = useCallback(() => {
    if (!containerRef.current || !interactive) return;
    
    const now = performance.now();
    if (now - lastUpdateRef.current < 50) return; // 20fps throttle
    lastUpdateRef.current = now;

    particles.forEach((particle, index) => {
      const el = particleRefs.current[index];
      if (!el) return;

      if (!isHoveringRef.current) {
        el.style.transform = 'translate(0px, 0px)';
        el.style.transition = 'transform 0.5s ease-out';
        return;
      }

      const particleX = (particle.left / 100) * 2 - 1;
      const distX = mousePosRef.current.x - particleX;
      const distY = mousePosRef.current.y;
      const distance = Math.sqrt(distX * distX + distY * distY);
      
      const maxInfluence = 0.8;
      const influence = Math.max(0, 1 - distance / maxInfluence);
      
      const repelStrength = 60 + (particle.id % 20);
      const offsetX = -distX * influence * repelStrength;
      const offsetY = -distY * influence * repelStrength * 0.5;
      
      el.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
      el.style.transition = 'transform 0.15s ease-out';
    });
  }, [particles, interactive]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !interactive) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mousePosRef.current = {
        x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
        y: ((e.clientY - rect.top) / rect.height) * 2 - 1,
      };
      
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(updateParticles);
    };

    const handleMouseEnter = () => {
      isHoveringRef.current = true;
    };

    const handleMouseLeave = () => {
      isHoveringRef.current = false;
      mousePosRef.current = { x: 0, y: 0 };
      updateParticles();
    };

    container.addEventListener('mousemove', handleMouseMove, { passive: true });
    container.addEventListener('mouseenter', handleMouseEnter, { passive: true });
    container.addEventListener('mouseleave', handleMouseLeave, { passive: true });

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseenter', handleMouseEnter);
      container.removeEventListener('mouseleave', handleMouseLeave);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [updateParticles, interactive]);

  return (
    <div 
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
    >
      {particles.map((particle, index) => (
        <div
          key={particle.id}
          ref={(el) => { particleRefs.current[index] = el; }}
          className="particle-ember"
          style={{
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            left: `${particle.left}%`,
            bottom: '-20px',
            backgroundColor: color,
            opacity: particle.opacity,
            animationDuration: `${particle.duration}s, ${particle.driftDuration}s, ${particle.glowDuration}s`,
            animationDelay: `${particle.delay}s, ${particle.delay}s, ${particle.delay}s`,
            boxShadow: `0 0 ${particle.size * 2}px ${color}`,
          }}
        />
      ))}
    </div>
  );
}