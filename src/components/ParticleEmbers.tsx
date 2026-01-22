import { useMemo } from 'react';

interface ParticleEmbersProps {
  count?: number;
  color?: string;
  className?: string;
}

export function ParticleEmbers({ 
  count = 30, 
  color = 'hsl(199 89% 48%)', // Light blue
  className = ''
}: ParticleEmbersProps) {
  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const size = Math.random() * 4 + 2; // 2-6px
      const left = Math.random() * 100;
      const delay = Math.random() * 8;
      const duration = Math.random() * 4 + 6; // 6-10s rise
      const driftDuration = Math.random() * 3 + 2; // 2-5s drift
      const glowDuration = Math.random() * 2 + 1; // 1-3s glow
      const opacity = Math.random() * 0.5 + 0.3; // 0.3-0.8
      
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

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {particles.map((particle) => (
        <div
          key={particle.id}
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
          }}
        />
      ))}
    </div>
  );
}
