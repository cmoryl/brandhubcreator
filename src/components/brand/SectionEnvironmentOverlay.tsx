/**
 * Section-level Environment Overlay
 * Renders environment effects (shimmer, particles, aurora, glitch) for entire sections
 */

import { useMemo, useState, useEffect } from 'react';
import { TaglineEnvironment } from '@/components/ui/animated-tagline';

interface SectionEnvironmentOverlayProps {
  effect: TaglineEnvironment;
  color?: string;
  className?: string;
}

// Particle dust effect for sections
const SectionParticleDust = ({ color }: { color: string }) => {
  const particles = useMemo(() => 
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 4 + 3,
      delay: Math.random() * 3,
    })), []
  );

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full opacity-40"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: color,
            animation: `particle-float ${p.duration}s ease-in-out infinite`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
};

// Glitch effect for sections
const SectionGlitchOverlay = () => {
  const [glitching, setGlitching] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.92) {
        setGlitching(true);
        setTimeout(() => setGlitching(false), 150);
      }
    }, 600);
    return () => clearInterval(interval);
  }, []);

  if (!glitching) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className="absolute inset-0 bg-red-500/5 translate-x-[3px]" />
      <div className="absolute inset-0 bg-cyan-500/5 -translate-x-[3px]" />
      <div className="absolute inset-0 bg-purple-500/5 translate-y-[2px]" />
    </div>
  );
};

export const SectionEnvironmentOverlay = ({ 
  effect, 
  color,
  className = '' 
}: SectionEnvironmentOverlayProps) => {
  if (effect === 'none') return null;

  const effectColor = color || 'hsl(var(--primary))';

  switch (effect) {
    case 'shimmer':
      return (
        <div 
          className={`absolute inset-0 pointer-events-none overflow-hidden rounded-inherit ${className}`}
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${effectColor}15 50%, transparent 100%)`,
            animation: 'shimmer 4s ease-in-out infinite',
            backgroundSize: '200% 100%',
          }}
        />
      );
    case 'particle-dust':
      return <SectionParticleDust color={effectColor} />;
    case 'aurora':
      return (
        <div 
          className={`absolute inset-0 pointer-events-none mix-blend-overlay opacity-20 overflow-hidden rounded-inherit ${className}`}
          style={{
            background: `linear-gradient(45deg, ${effectColor}, hsl(var(--accent)), ${effectColor})`,
            backgroundSize: '300% 300%',
            animation: 'aurora 10s ease-in-out infinite',
          }}
        />
      );
    case 'glitch':
      return <SectionGlitchOverlay />;
    default:
      return null;
  }
};

export default SectionEnvironmentOverlay;
