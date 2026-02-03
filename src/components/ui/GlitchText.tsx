import { useEffect, useState } from 'react';

interface GlitchTextProps {
  text: string;
  className?: string;
  glowColor?: string;
}

export const GlitchText = ({ text, className = '', glowColor = 'hsl(199 89% 48%)' }: GlitchTextProps) => {
  const [glitchOffset, setGlitchOffset] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    const interval = setInterval(() => {
      // Random glitch every 2-4 seconds
      if (Math.random() > 0.7) {
        setGlitchOffset({
          x: (Math.random() - 0.5) * 4,
          y: (Math.random() - 0.5) * 2,
        });
        // Reset after short duration
        setTimeout(() => setGlitchOffset({ x: 0, y: 0 }), 100);
      }
    }, 150);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <span className={`glitch-text-wrapper relative inline-block ${className}`}>
      {/* Blue glow layer */}
      <span 
        className="absolute inset-0 blur-lg opacity-60 pointer-events-none"
        style={{ 
          color: glowColor,
          textShadow: `0 0 20px ${glowColor}, 0 0 40px ${glowColor}, 0 0 60px ${glowColor}`,
        }}
        aria-hidden="true"
      >
        {text}
      </span>
      
      {/* Chromatic aberration layers */}
      <span 
        className="absolute inset-0 pointer-events-none opacity-70"
        style={{ 
          color: '#ff0040',
          transform: `translate(${glitchOffset.x - 1}px, ${glitchOffset.y}px)`,
          mixBlendMode: 'screen',
          clipPath: 'polygon(0 0, 100% 0, 100% 45%, 0 45%)',
        }}
        aria-hidden="true"
      >
        {text}
      </span>
      <span 
        className="absolute inset-0 pointer-events-none opacity-70"
        style={{ 
          color: '#00ffff',
          transform: `translate(${glitchOffset.x + 1}px, ${glitchOffset.y}px)`,
          mixBlendMode: 'screen',
          clipPath: 'polygon(0 55%, 100% 55%, 100% 100%, 0 100%)',
        }}
        aria-hidden="true"
      >
        {text}
      </span>
      
      {/* Scanlines overlay */}
      <span 
        className="absolute inset-0 pointer-events-none overflow-hidden"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 0, 0, 0.15) 2px, rgba(0, 0, 0, 0.15) 4px)',
          animation: 'scanlines 8s linear infinite',
        }}
        aria-hidden="true"
      />
      
      {/* Random horizontal glitch bars */}
      <span 
        className="absolute inset-0 pointer-events-none overflow-hidden opacity-30"
        style={{
          background: `linear-gradient(
            to bottom,
            transparent 0%,
            transparent ${20 + Math.random() * 10}%,
            ${glowColor} ${20 + Math.random() * 10}%,
            ${glowColor} ${22 + Math.random() * 10}%,
            transparent ${22 + Math.random() * 10}%,
            transparent ${60 + Math.random() * 10}%,
            ${glowColor} ${60 + Math.random() * 10}%,
            ${glowColor} ${61 + Math.random() * 10}%,
            transparent ${61 + Math.random() * 10}%,
            transparent 100%
          )`,
          animation: 'glitch-bars 3s steps(1) infinite',
        }}
        aria-hidden="true"
      />
      
      {/* Main text with glow */}
      <span 
        className="relative z-10"
        style={{
          background: `linear-gradient(90deg, ${glowColor}, hsl(198 84% 60%), ${glowColor})`,
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          color: 'transparent',
          textShadow: `0 0 10px ${glowColor}40, 0 0 20px ${glowColor}30, 0 0 30px ${glowColor}20`,
          transform: `translate(${glitchOffset.x * 0.5}px, ${glitchOffset.y * 0.5}px)`,
        }}
      >
        {text}
      </span>
      
      {/* CSS Keyframes injected via style tag */}
      <style>{`
        @keyframes scanlines {
          0% { transform: translateY(0); }
          100% { transform: translateY(4px); }
        }
        
        @keyframes glitch-bars {
          0%, 90% { opacity: 0; }
          91% { opacity: 0.3; transform: translateX(-2px); }
          92% { opacity: 0; }
          93% { opacity: 0.2; transform: translateX(2px); }
          94%, 100% { opacity: 0; transform: translateX(0); }
        }
        
        .glitch-text-wrapper::before {
          content: '';
          position: absolute;
          inset: -4px;
          background: linear-gradient(
            90deg,
            transparent 0%,
            ${glowColor}10 10%,
            ${glowColor}05 50%,
            ${glowColor}10 90%,
            transparent 100%
          );
          filter: blur(8px);
          opacity: 0.5;
          animation: glow-pulse 2s ease-in-out infinite;
          pointer-events: none;
        }
        
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </span>
  );
};
