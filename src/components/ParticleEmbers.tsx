import { useMemo, useState, useCallback, useEffect, useRef } from 'react';

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
  offsetX: number;
  offsetY: number;
}

export function ParticleEmbers({ 
  count = 30, 
  color = 'hsl(199 89% 48%)',
  className = '',
  interactive = true
}: ParticleEmbersProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

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
        offsetX: 0,
        offsetY: 0,
      };
    });
  }, [count]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current || !interactive) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    
    setMousePos({ x, y });
  }, [interactive]);

  const handleMouseEnter = useCallback(() => {
    if (interactive) setIsHovering(true);
  }, [interactive]);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
    setMousePos({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !interactive) return;

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseenter', handleMouseEnter);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseenter', handleMouseEnter);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [handleMouseMove, handleMouseEnter, handleMouseLeave, interactive]);

  const calculateOffset = useCallback((particleLeft: number, particleId: number) => {
    if (!isHovering) return { x: 0, y: 0 };
    
    const particleX = (particleLeft / 100) * 2 - 1;
    const distX = mousePos.x - particleX;
    const distY = mousePos.y;
    const distance = Math.sqrt(distX * distX + distY * distY);
    
    const maxInfluence = 0.8;
    const influence = Math.max(0, 1 - distance / maxInfluence);
    
    const repelStrength = 60 + (particleId % 20);
    const offsetX = -distX * influence * repelStrength;
    const offsetY = -distY * influence * repelStrength * 0.5;
    
    return { x: offsetX, y: offsetY };
  }, [mousePos, isHovering]);

  return (
    <div 
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden ${interactive ? 'pointer-events-auto' : 'pointer-events-none'} ${className}`}
    >
      {particles.map((particle) => {
        const offset = calculateOffset(particle.left, particle.id);
        
        return (
          <div
            key={particle.id}
            className="particle-ember"
            style={{
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              left: `${particle.left}%`,
              bottom: '-20px',
              backgroundColor: color,
              opacity: isHovering ? Math.min(particle.opacity * 1.3, 1) : particle.opacity,
              animationDuration: `${particle.duration}s, ${particle.driftDuration}s, ${particle.glowDuration}s`,
              animationDelay: `${particle.delay}s, ${particle.delay}s, ${particle.delay}s`,
              transform: `translate(${offset.x}px, ${offset.y}px)`,
              transition: isHovering ? 'transform 0.15s ease-out, opacity 0.3s ease' : 'transform 0.5s ease-out, opacity 0.3s ease',
              boxShadow: isHovering 
                ? `0 0 ${particle.size * 3}px ${color}, 0 0 ${particle.size * 5}px ${color}`
                : `0 0 ${particle.size * 2}px ${color}`,
            }}
          />
        );
      })}
    </div>
  );
}
