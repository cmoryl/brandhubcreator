import { useEffect, useState, forwardRef } from 'react';
import { useTheme } from 'next-themes';

interface GlitchTextProps {
  text: string;
  className?: string;
  glowColor?: string;
  forceDark?: boolean;
}

export const GlitchText = forwardRef<HTMLSpanElement, GlitchTextProps>(
  ({ text, className = '', glowColor = 'hsl(199 89% 48%)', forceDark = false }, ref) => {
  const [glitchOffset, setGlitchOffset] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();
  
  // Wait for hydration to avoid SSR mismatch
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Glitch animation - always runs but only affects dark mode rendering
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        setGlitchOffset({
          x: (Math.random() - 0.5) * 4,
          y: (Math.random() - 0.5) * 2,
        });
        setTimeout(() => setGlitchOffset({ x: 0, y: 0 }), 100);
      }
    }, 150);
    
    return () => clearInterval(interval);
  }, []);
  
  // Default to dark during SSR/initial render, then use actual theme
  const isDark = !mounted || resolvedTheme === 'dark' || forceDark;

  // Light mode: render clean accent text only (no glitch effects)
  if (mounted && !isDark) {
    return (
      <span ref={ref} className={`text-accent ${className}`}>
        {text}
      </span>
    );
  }

  // Dark mode: full "scratch/scanlines" effect
  const scanlineColor = 'rgba(0, 0, 0, 0.15)';
  const chromaticBlendMode: React.CSSProperties['mixBlendMode'] = 'screen';
  const chromaticOpacity = 0.7;
  const redColor = '#ff0040';
  const cyanColor = '#00ffff';

  return (
    <span ref={ref} className={`glitch-text-wrapper relative inline-block ${className}`}>
      {/* Blue glow layer - uses text-shadow only to avoid costly blur filter */}
      <span 
        className="absolute inset-0 opacity-60 pointer-events-none"
        style={{ 
          color: 'transparent',
          textShadow: `0 0 10px ${glowColor}, 0 0 20px ${glowColor}, 0 0 40px ${glowColor}, 0 0 60px ${glowColor}`,
        }}
        aria-hidden="true"
      >
        {text}
      </span>
      
      {/* Chromatic aberration layers */}
      <span 
        className="absolute inset-0 pointer-events-none opacity-70"
        style={{ 
          color: redColor,
          transform: `translate(${glitchOffset.x - 1}px, ${glitchOffset.y}px)`,
          mixBlendMode: chromaticBlendMode,
          opacity: chromaticOpacity,
          clipPath: 'polygon(0 0, 100% 0, 100% 45%, 0 45%)',
        }}
        aria-hidden="true"
      >
        {text}
      </span>
      <span 
        className="absolute inset-0 pointer-events-none opacity-70"
        style={{ 
          color: cyanColor,
          transform: `translate(${glitchOffset.x + 1}px, ${glitchOffset.y}px)`,
          mixBlendMode: chromaticBlendMode,
          opacity: chromaticOpacity,
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
          background: `repeating-linear-gradient(0deg, transparent, transparent 2px, ${scanlineColor} 2px, ${scanlineColor} 4px)`,
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
      
      {/* Main text with gradient */}
      <span 
        className="relative z-10"
        style={{
          background: `linear-gradient(90deg, ${glowColor}, hsl(198 84% 60%), ${glowColor})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: `0 0 10px ${glowColor}40, 0 0 20px ${glowColor}30, 0 0 30px ${glowColor}20`,
          transform: `translate(${glitchOffset.x * 0.5}px, ${glitchOffset.y * 0.5}px)`,
        }}
      >
        {text}
      </span>
      
      {/* CSS Keyframes */}
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
});

GlitchText.displayName = 'GlitchText';
