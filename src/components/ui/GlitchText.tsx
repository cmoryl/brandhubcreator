import { useEffect, useState, forwardRef } from 'react';
import { useTheme } from 'next-themes';

interface GlitchTextProps {
  text: string;
  className?: string;
  glowColor?: string;
}

export const GlitchText = forwardRef<HTMLSpanElement, GlitchTextProps>(
  ({ text, className = '', glowColor = 'hsl(199 89% 48%)' }, ref) => {
  const [glitchOffset, setGlitchOffset] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();
  
  // Wait for hydration to avoid SSR mismatch
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Default to dark during SSR/initial render, then use actual theme
  const isDark = !mounted || resolvedTheme === 'dark';
  
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

  // Theme-aware styling - more subtle scanlines in light mode
  const scanlineColor = isDark 
    ? 'rgba(0, 0, 0, 0.12)' 
    : 'rgba(0, 80, 120, 0.04)';
  
  // In light mode, use softer blend and lower opacity for chromatic effect
  const chromaticBlendMode = isDark ? 'screen' : 'multiply';
  const chromaticOpacity = isDark ? 0.6 : 0.08;
  
  // Use theme-appropriate colors for chromatic aberration
  const redColor = isDark ? '#ff0040' : 'hsl(199 60% 40%)';
  const cyanColor = isDark ? '#00ffff' : 'hsl(199 80% 50%)';

  return (
    <span ref={ref} className={`glitch-text-wrapper relative inline-block ${className}`}>
      {/* Blue glow layer - more subtle in light mode */}
      <span 
        className="absolute inset-0 pointer-events-none"
        style={{ 
          color: glowColor,
          filter: isDark ? 'blur(16px)' : 'blur(10px)',
          opacity: isDark ? 0.6 : 0.2,
          textShadow: isDark 
            ? `0 0 20px ${glowColor}, 0 0 40px ${glowColor}, 0 0 60px ${glowColor}`
            : `0 0 10px ${glowColor}`,
        }}
        aria-hidden="true"
      >
        {text}
      </span>
      
      {/* Chromatic aberration layers - very subtle in light mode */}
      <span 
        className="absolute inset-0 pointer-events-none"
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
        className="absolute inset-0 pointer-events-none"
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
      
      {/* Scanlines overlay - very subtle in light mode */}
      <span 
        className="absolute inset-0 pointer-events-none overflow-hidden"
        style={{
          background: `repeating-linear-gradient(0deg, transparent, transparent 2px, ${scanlineColor} 2px, ${scanlineColor} 4px)`,
          animation: 'scanlines 8s linear infinite',
          opacity: isDark ? 1 : 0.5,
        }}
        aria-hidden="true"
      />
      
      {/* Random horizontal glitch bars - very subtle in light mode */}
      <span 
        className="absolute inset-0 pointer-events-none overflow-hidden"
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
          opacity: isDark ? 0.3 : 0.08,
        }}
        aria-hidden="true"
      />
      
      {/* Main text with gradient */}
      <span 
        className="relative z-10"
        style={{
          background: isDark 
            ? `linear-gradient(90deg, ${glowColor}, hsl(198 84% 60%), ${glowColor})`
            : `linear-gradient(90deg, hsl(199 85% 40%), hsl(199 90% 48%), hsl(199 85% 40%))`,
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: isDark 
            ? `0 0 10px ${glowColor}40, 0 0 20px ${glowColor}30`
            : 'none',
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
          91% { opacity: ${isDark ? 0.3 : 0.08}; transform: translateX(-2px); }
          92% { opacity: 0; }
          93% { opacity: ${isDark ? 0.2 : 0.05}; transform: translateX(2px); }
          94%, 100% { opacity: 0; transform: translateX(0); }
        }
        
        .glitch-text-wrapper::before {
          content: '';
          position: absolute;
          inset: -4px;
          background: linear-gradient(
            90deg,
            transparent 0%,
            ${glowColor}${isDark ? '10' : '05'} 10%,
            ${glowColor}${isDark ? '05' : '02'} 50%,
            ${glowColor}${isDark ? '10' : '05'} 90%,
            transparent 100%
          );
          filter: blur(8px);
          opacity: ${isDark ? 0.5 : 0.2};
          animation: glow-pulse 2s ease-in-out infinite;
          pointer-events: none;
        }
        
        @keyframes glow-pulse {
          0%, 100% { opacity: ${isDark ? 0.3 : 0.15}; }
          50% { opacity: ${isDark ? 0.6 : 0.25}; }
        }
      `}</style>
    </span>
  );
});

GlitchText.displayName = 'GlitchText';
