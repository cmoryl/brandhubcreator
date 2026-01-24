import * as React from 'react';
import { useAppSettings, HeroBackgroundType } from '@/contexts/AppSettingsContext';

interface HeroBackgroundProps {
  type?: HeroBackgroundType;
  image?: string;
  animationSpeed?: 'slow' | 'medium' | 'fast';
  overlay?: boolean;
  overlayOpacity?: number;
  tintColor?: string; // Custom color tint for animations
}

// Helper to convert hex to HSL values
const hexToHSLValues = (hex: string): { h: number; s: number; l: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;
  
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
};

export const HeroBackground = React.forwardRef<
  HTMLDivElement,
  HeroBackgroundProps
>(({ 
  type: propType, 
  image: propImage, 
  animationSpeed: propSpeed,
  overlay: propOverlay,
  overlayOpacity: propOpacity,
  tintColor
}, ref) => {
  const { settings } = useAppSettings();
  const { heroBackground } = settings;

  // Use props if provided, otherwise fall back to app settings
  const type = propType || heroBackground.type;
  const image = propImage || heroBackground.image;
  const animationSpeed = propSpeed || heroBackground.animationSpeed;
  const overlay = propOverlay ?? heroBackground.overlay;
  const overlayOpacity = propOpacity ?? heroBackground.overlayOpacity;

  const getAnimationDuration = () => {
    switch (animationSpeed) {
      case 'slow': return '20s';
      case 'fast': return '5s';
      default: return '10s';
    }
  };

  // Get tint color CSS variable or default to accent
  const getTintColorVar = () => {
    if (tintColor) {
      const hsl = hexToHSLValues(tintColor);
      if (hsl) {
        return `${hsl.h} ${hsl.s}% ${hsl.l}%`;
      }
    }
    return 'var(--accent)';
  };

  const tintVar = getTintColorVar();
  const useTintDirectly = tintColor && hexToHSLValues(tintColor);

  // Image background
  if (type === 'image' && image) {
    return (
      <div className="absolute inset-0">
        <img
          src={image}
          alt="Hero background"
          className="w-full h-full object-cover"
        />
        {overlay && (
          <div 
            className="absolute inset-0 bg-background"
            style={{ opacity: overlayOpacity }}
          />
        )}
      </div>
    );
  }

  // Animated gradient background
  if (type === 'animated-gradient') {
    return (
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute inset-0"
          style={{
            background: useTintDirectly 
              ? `linear-gradient(135deg, hsl(${tintVar} / 0.2), hsl(var(--primary) / 0.1), hsl(${tintVar} / 0.2))`
              : undefined,
            backgroundSize: '400% 400%',
            animation: `gradientShift ${getAnimationDuration()} ease infinite`,
          }}
        >
          {!useTintDirectly && <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-primary/10 to-accent/20" style={{ backgroundSize: '400% 400%', animation: `gradientShift ${getAnimationDuration()} ease infinite` }} />}
        </div>
        <div 
          className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl animate-pulse"
          style={{ backgroundColor: useTintDirectly ? `hsl(${tintVar} / 0.2)` : 'hsl(var(--accent) / 0.2)' }}
        />
        <div 
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl"
          style={{ animation: `pulse ${getAnimationDuration()} ease-in-out infinite` }}
        />
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl"
          style={{ 
            backgroundColor: useTintDirectly ? `hsl(${tintVar} / 0.1)` : 'hsl(var(--accent) / 0.1)',
            animation: `pulse ${getAnimationDuration()} ease-in-out infinite reverse` 
          }}
        />
        <style>{`
          @keyframes gradientShift {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
        `}</style>
      </div>
    );
  }

  // Animated particles background
  if (type === 'animated-particles') {
    return (
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-background" />
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${Math.random() * 100 + 20}px`,
              height: `${Math.random() * 100 + 20}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              backgroundColor: useTintDirectly ? `hsl(${tintVar} / 0.2)` : 'hsl(var(--accent) / 0.2)',
              filter: 'blur(40px)',
              animation: `float${i % 3} ${parseFloat(getAnimationDuration()) + Math.random() * 5}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
        <style>{`
          @keyframes float0 {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(30px, -30px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
          }
          @keyframes float1 {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(-40px, 20px) scale(0.9); }
            66% { transform: translate(20px, -40px) scale(1.1); }
          }
          @keyframes float2 {
            0%, 100% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(25px, 25px) scale(1.05); }
          }
        `}</style>
      </div>
    );
  }

  // Animated waves background
  if (type === 'animated-waves') {
    return (
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-[200%] h-40 left-[-50%]"
            style={{
              bottom: `${i * 15}%`,
              background: useTintDirectly 
                ? `linear-gradient(to right, transparent, hsl(${tintVar} / ${0.05 + i * 0.02}), transparent)`
                : `linear-gradient(to right, transparent, hsl(var(--accent) / ${0.05 + i * 0.02}), transparent)`,
              borderRadius: '100%',
              animation: `wave ${parseFloat(getAnimationDuration()) + i * 2}s ease-in-out infinite`,
              animationDelay: `${i * 0.5}s`,
            }}
          />
        ))}
        <style>{`
          @keyframes wave {
            0%, 100% { transform: translateX(-5%) translateY(0) rotate(-2deg); }
            50% { transform: translateX(5%) translateY(-20px) rotate(2deg); }
          }
        `}</style>
      </div>
    );
  }

  // Animated mesh gradient background
  if (type === 'animated-mesh') {
    const tintStyle = useTintDirectly ? `hsl(${tintVar}` : 'hsl(var(--accent)';
    return (
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-background" />
        <div 
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(at 0% 0%, ${tintStyle} / 0.15) 0px, transparent 50%),
              radial-gradient(at 100% 0%, hsl(var(--primary) / 0.1) 0px, transparent 50%),
              radial-gradient(at 100% 100%, ${tintStyle} / 0.12) 0px, transparent 50%),
              radial-gradient(at 0% 100%, hsl(var(--primary) / 0.08) 0px, transparent 50%)
            `,
            animation: `meshMove ${getAnimationDuration()} ease-in-out infinite`,
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(at 50% 50%, ${tintStyle} / 0.1) 0px, transparent 40%)`,
            animation: `meshPulse ${getAnimationDuration()} ease-in-out infinite`,
          }}
        />
        <style>{`
          @keyframes meshMove {
            0%, 100% { transform: scale(1) rotate(0deg); }
            33% { transform: scale(1.05) rotate(1deg); }
            66% { transform: scale(0.95) rotate(-1deg); }
          }
          @keyframes meshPulse {
            0%, 100% { opacity: 0.5; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.2); }
          }
        `}</style>
      </div>
    );
  }

  // Animated aurora background
  if (type === 'animated-aurora') {
    const tintStyle = useTintDirectly ? `hsl(${tintVar}` : 'hsl(var(--accent)';
    return (
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background to-primary/5" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-full h-[60%] left-0 top-[20%]"
            style={{
              background: `linear-gradient(${90 + i * 30}deg, 
                transparent 20%, 
                ${tintStyle} / ${0.08 + i * 0.03}) 40%, 
                hsl(var(--primary) / ${0.06 + i * 0.02}) 60%, 
                transparent 80%
              )`,
              filter: 'blur(60px)',
              animation: `aurora ${parseFloat(getAnimationDuration()) + i * 3}s ease-in-out infinite`,
              animationDelay: `${i * 1.5}s`,
              transformOrigin: 'center center',
            }}
          />
        ))}
        <style>{`
          @keyframes aurora {
            0%, 100% { 
              transform: translateX(-10%) scaleY(1) skewX(0deg); 
              opacity: 0.5;
            }
            25% { 
              transform: translateX(5%) scaleY(1.2) skewX(5deg); 
              opacity: 0.8;
            }
            50% { 
              transform: translateX(10%) scaleY(0.9) skewX(-3deg); 
              opacity: 0.6;
            }
            75% { 
              transform: translateX(-5%) scaleY(1.1) skewX(2deg); 
              opacity: 0.7;
            }
          }
        `}</style>
      </div>
    );
  }

  // Animated geometric background
  if (type === 'animated-geometric') {
    const tintStyle = useTintDirectly ? `hsl(${tintVar}` : 'hsl(var(--accent)';
    return (
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-primary/3 to-background" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              width: `${150 + i * 80}px`,
              height: `${150 + i * 80}px`,
              left: `${20 + (i % 3) * 25}%`,
              top: `${10 + Math.floor(i / 3) * 40}%`,
              border: `1px solid ${tintStyle} / 0.1)`,
              borderRadius: i % 2 === 0 ? '20%' : '50%',
              animation: `geometricFloat${i % 2} ${parseFloat(getAnimationDuration()) + i * 2}s ease-in-out infinite`,
              animationDelay: `${i * 0.8}s`,
            }}
          />
        ))}
        <div
          className="absolute w-64 h-64 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            border: `2px solid ${tintStyle} / 0.05)`,
            animation: `geometricRotate ${parseFloat(getAnimationDuration()) * 2}s linear infinite`,
          }}
        />
        <style>{`
          @keyframes geometricFloat0 {
            0%, 100% { transform: translateY(0) rotate(0deg) scale(1); opacity: 0.3; }
            50% { transform: translateY(-30px) rotate(45deg) scale(1.1); opacity: 0.5; }
          }
          @keyframes geometricFloat1 {
            0%, 100% { transform: translateY(0) rotate(0deg) scale(1); opacity: 0.2; }
            50% { transform: translateY(20px) rotate(-30deg) scale(0.9); opacity: 0.4; }
          }
          @keyframes geometricRotate {
            0% { transform: translate(-50%, -50%) rotate(0deg); }
            100% { transform: translate(-50%, -50%) rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Animated spotlight background
  if (type === 'animated-spotlight') {
    const tintStyle = useTintDirectly ? `hsl(${tintVar}` : 'hsl(var(--accent)';
    return (
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-background" />
        <div
          className="absolute w-[150%] h-[150%] -left-[25%] -top-[25%]"
          style={{
            background: `
              radial-gradient(ellipse 40% 60% at 30% 40%, ${tintStyle} / 0.15) 0%, transparent 60%),
              radial-gradient(ellipse 50% 40% at 70% 60%, hsl(var(--primary) / 0.1) 0%, transparent 60%)
            `,
            animation: `spotlightMove ${getAnimationDuration()} ease-in-out infinite`,
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 30% 50% at 50% 50%, ${tintStyle} / 0.08) 0%, transparent 70%)`,
            animation: `spotlightPulse ${parseFloat(getAnimationDuration()) / 2}s ease-in-out infinite`,
          }}
        />
        <style>{`
          @keyframes spotlightMove {
            0%, 100% { transform: translate(0%, 0%) rotate(0deg); }
            25% { transform: translate(10%, -5%) rotate(5deg); }
            50% { transform: translate(5%, 10%) rotate(-3deg); }
            75% { transform: translate(-5%, 5%) rotate(2deg); }
          }
          @keyframes spotlightPulse {
            0%, 100% { opacity: 0.5; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.1); }
          }
        `}</style>
      </div>
    );
  }

  // Animated mesh waves with lines
  if (type === 'animated-mesh-waves') {
    const tintStyle = useTintDirectly ? `hsl(${tintVar}` : 'hsl(var(--accent)';
    return (
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-background" />
        {/* Horizontal wave lines */}
        {Array.from({ length: 8 }).map((_, i) => (
          <svg
            key={`h-${i}`}
            className="absolute w-full"
            style={{
              top: `${10 + i * 12}%`,
              height: '60px',
            }}
            viewBox="0 0 1200 60"
            preserveAspectRatio="none"
          >
            <path
              d="M0,30 Q150,10 300,30 T600,30 T900,30 T1200,30"
              fill="none"
              stroke={useTintDirectly ? `hsl(${tintVar} / ${0.08 + i * 0.02})` : `hsl(var(--accent) / ${0.08 + i * 0.02})`}
              strokeWidth="1.5"
              style={{
                animation: `meshWaveLine ${parseFloat(getAnimationDuration()) + i * 0.5}s ease-in-out infinite`,
                animationDelay: `${i * 0.2}s`,
              }}
            />
          </svg>
        ))}
        {/* Vertical wave lines */}
        {Array.from({ length: 6 }).map((_, i) => (
          <svg
            key={`v-${i}`}
            className="absolute h-full"
            style={{
              left: `${10 + i * 16}%`,
              width: '60px',
            }}
            viewBox="0 0 60 800"
            preserveAspectRatio="none"
          >
            <path
              d="M30,0 Q10,100 30,200 T30,400 T30,600 T30,800"
              fill="none"
              stroke={`hsl(var(--primary) / ${0.06 + i * 0.015})`}
              strokeWidth="1.5"
              style={{
                animation: `meshWaveLineV ${parseFloat(getAnimationDuration()) + i * 0.8}s ease-in-out infinite`,
                animationDelay: `${i * 0.3}s`,
              }}
            />
          </svg>
        ))}
        {/* Intersection glow points */}
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={`glow-${i}`}
            className="absolute rounded-full"
            style={{
              width: '8px',
              height: '8px',
              left: `${15 + (i % 4) * 25}%`,
              top: `${20 + Math.floor(i / 4) * 30}%`,
              background: useTintDirectly ? `hsl(${tintVar} / 0.3)` : `hsl(var(--accent) / 0.3)`,
              boxShadow: useTintDirectly ? `0 0 20px hsl(${tintVar} / 0.4)` : `0 0 20px hsl(var(--accent) / 0.4)`,
              animation: `meshGlowPulse ${parseFloat(getAnimationDuration()) / 2}s ease-in-out infinite`,
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(at 20% 30%, ${tintStyle} / 0.08) 0px, transparent 50%),
              radial-gradient(at 80% 70%, hsl(var(--primary) / 0.06) 0px, transparent 50%)
            `,
            animation: `meshOverlay ${getAnimationDuration()} ease-in-out infinite`,
          }}
        />
        <style>{`
          @keyframes meshWaveLine {
            0%, 100% { 
              d: path("M0,30 Q150,10 300,30 T600,30 T900,30 T1200,30");
              opacity: 0.6;
            }
            25% { 
              d: path("M0,30 Q150,50 300,30 T600,30 T900,30 T1200,30");
              opacity: 1;
            }
            50% { 
              d: path("M0,30 Q150,30 300,10 T600,50 T900,30 T1200,30");
              opacity: 0.8;
            }
            75% { 
              d: path("M0,30 Q150,20 300,40 T600,20 T900,40 T1200,30");
              opacity: 1;
            }
          }
          @keyframes meshWaveLineV {
            0%, 100% { 
              d: path("M30,0 Q10,100 30,200 T30,400 T30,600 T30,800");
              opacity: 0.5;
            }
            50% { 
              d: path("M30,0 Q50,100 30,200 T30,400 T30,600 T30,800");
              opacity: 0.8;
            }
          }
          @keyframes meshGlowPulse {
            0%, 100% { 
              transform: scale(1);
              opacity: 0.4;
            }
            50% { 
              transform: scale(1.5);
              opacity: 0.8;
            }
          }
          @keyframes meshOverlay {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 0.8; }
          }
        `}</style>
      </div>
    );
  }

  // NEW: Animated data flow background (inspired by the user's image)
  if (type === 'animated-dataflow') {
    const tintStyle = useTintDirectly ? `hsl(${tintVar}` : 'hsl(var(--accent)';
    const particleCount = 80;
    const waveCount = 5;
    
    return (
      <div className="absolute inset-0 overflow-hidden bg-slate-950">
        {/* Dark gradient base */}
        <div 
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 80% 50% at 50% 100%, ${tintStyle} / 0.15) 0%, transparent 70%),
              radial-gradient(ellipse 60% 40% at 30% 80%, ${tintStyle} / 0.1) 0%, transparent 60%),
              radial-gradient(ellipse 60% 40% at 70% 80%, ${tintStyle} / 0.08) 0%, transparent 60%),
              linear-gradient(to bottom, hsl(222 47% 5%) 0%, hsl(222 47% 8%) 100%)
            `,
          }}
        />
        
        {/* Animated wave layers */}
        {Array.from({ length: waveCount }).map((_, waveIndex) => (
          <div
            key={`wave-${waveIndex}`}
            className="absolute w-full"
            style={{
              bottom: `${5 + waveIndex * 8}%`,
              height: '200px',
              transform: `perspective(500px) rotateX(60deg)`,
              transformOrigin: 'center bottom',
            }}
          >
            <svg
              className="absolute w-full h-full"
              viewBox="0 0 1200 200"
              preserveAspectRatio="none"
            >
              {/* Multiple wave paths per layer */}
              {Array.from({ length: 8 }).map((_, lineIndex) => (
                <path
                  key={lineIndex}
                  d={`M0,${100 + lineIndex * 10} Q300,${80 + lineIndex * 10 + Math.sin(lineIndex) * 20} 600,${100 + lineIndex * 10} T1200,${100 + lineIndex * 10}`}
                  fill="none"
                  stroke={useTintDirectly ? `hsl(${tintVar} / ${0.15 + lineIndex * 0.05})` : `hsl(var(--accent) / ${0.15 + lineIndex * 0.05})`}
                  strokeWidth="1"
                  style={{
                    animation: `dataflowWave ${parseFloat(getAnimationDuration()) + waveIndex * 2 + lineIndex * 0.5}s ease-in-out infinite`,
                    animationDelay: `${waveIndex * 0.3 + lineIndex * 0.1}s`,
                  }}
                />
              ))}
            </svg>
          </div>
        ))}

        {/* Floating data particles */}
        {Array.from({ length: particleCount }).map((_, i) => {
          const size = Math.random() * 4 + 1;
          const left = Math.random() * 100;
          const bottom = Math.random() * 60 + 10;
          const delay = Math.random() * 10;
          const duration = parseFloat(getAnimationDuration()) + Math.random() * 5;
          const opacity = Math.random() * 0.6 + 0.2;
          
          return (
            <div
              key={`particle-${i}`}
              className="absolute rounded-full"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                left: `${left}%`,
                bottom: `${bottom}%`,
                background: useTintDirectly ? `hsl(${tintVar})` : `hsl(var(--accent))`,
                boxShadow: useTintDirectly 
                  ? `0 0 ${size * 3}px hsl(${tintVar} / 0.8), 0 0 ${size * 6}px hsl(${tintVar} / 0.4)`
                  : `0 0 ${size * 3}px hsl(var(--accent) / 0.8), 0 0 ${size * 6}px hsl(var(--accent) / 0.4)`,
                opacity,
                animation: `dataflowParticle ${duration}s ease-in-out infinite`,
                animationDelay: `${delay}s`,
              }}
            />
          );
        })}

        {/* Glowing connection lines */}
        <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.3 }}>
          {Array.from({ length: 15 }).map((_, i) => {
            const x1 = Math.random() * 100;
            const y1 = 60 + Math.random() * 30;
            const x2 = x1 + (Math.random() - 0.5) * 30;
            const y2 = y1 + (Math.random() - 0.5) * 20;
            
            return (
              <line
                key={`line-${i}`}
                x1={`${x1}%`}
                y1={`${y1}%`}
                x2={`${x2}%`}
                y2={`${y2}%`}
                stroke={useTintDirectly ? `hsl(${tintVar} / 0.3)` : `hsl(var(--accent) / 0.3)`}
                strokeWidth="1"
                style={{
                  animation: `dataflowLine ${parseFloat(getAnimationDuration()) + i * 0.5}s ease-in-out infinite`,
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            );
          })}
        </svg>

        {/* Top fade gradient */}
        <div 
          className="absolute inset-x-0 top-0 h-1/3"
          style={{
            background: 'linear-gradient(to bottom, hsl(222 47% 5%) 0%, transparent 100%)',
          }}
        />

        <style>{`
          @keyframes dataflowWave {
            0%, 100% { 
              transform: translateX(0) scaleY(1);
              opacity: 0.6;
            }
            25% {
              transform: translateX(-20px) scaleY(1.1);
              opacity: 0.8;
            }
            50% { 
              transform: translateX(-40px) scaleY(0.9);
              opacity: 1;
            }
            75% {
              transform: translateX(-20px) scaleY(1.05);
              opacity: 0.7;
            }
          }
          @keyframes dataflowParticle {
            0%, 100% { 
              transform: translate(0, 0) scale(1);
              opacity: var(--particle-opacity, 0.4);
            }
            25% { 
              transform: translate(10px, -15px) scale(1.2);
              opacity: 0.8;
            }
            50% { 
              transform: translate(-5px, -10px) scale(0.8);
              opacity: 0.6;
            }
            75% { 
              transform: translate(5px, -5px) scale(1.1);
              opacity: 0.9;
            }
          }
          @keyframes dataflowLine {
            0%, 100% { 
              opacity: 0.2;
              stroke-dasharray: 5, 10;
            }
            50% { 
              opacity: 0.6;
              stroke-dasharray: 10, 5;
            }
          }
        `}</style>
      </div>
    );
  }

  // Animated wave lines - flowing gradient lines
  if (type === 'animated-wave-lines') {
    const tintStyle = useTintDirectly ? `hsl(${tintVar}` : 'hsl(var(--accent)';
    const duration = parseFloat(getAnimationDuration());
    
    return (
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted/20" />
        
        {/* Gradient blobs */}
        <div
          className="absolute w-[600px] h-[600px] rounded-full blur-[100px]"
          style={{
            background: `radial-gradient(circle, ${tintStyle} / 0.15) 0%, transparent 70%)`,
            top: '10%',
            left: '5%',
            animation: `waveLineBlob ${duration * 2}s ease-in-out infinite`,
          }}
        />
        <div
          className="absolute w-[500px] h-[500px] rounded-full blur-[80px]"
          style={{
            background: `radial-gradient(circle, hsl(var(--primary) / 0.1) 0%, transparent 70%)`,
            bottom: '10%',
            right: '10%',
            animation: `waveLineBlob ${duration * 2.5}s ease-in-out infinite reverse`,
          }}
        />
        
        {/* Flowing wave lines */}
        <svg
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="none"
          viewBox="0 0 1440 900"
        >
          <defs>
            <linearGradient id="waveLine1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={useTintDirectly ? `hsl(${tintVar} / 0)` : "hsl(var(--accent) / 0)"} />
              <stop offset="20%" stopColor={useTintDirectly ? `hsl(${tintVar} / 0.4)` : "hsl(var(--accent) / 0.4)"} />
              <stop offset="50%" stopColor={useTintDirectly ? `hsl(${tintVar} / 0.6)` : "hsl(var(--accent) / 0.6)"} />
              <stop offset="80%" stopColor={useTintDirectly ? `hsl(${tintVar} / 0.4)` : "hsl(var(--accent) / 0.4)"} />
              <stop offset="100%" stopColor={useTintDirectly ? `hsl(${tintVar} / 0)` : "hsl(var(--accent) / 0)"} />
            </linearGradient>
            <linearGradient id="waveLine2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--primary) / 0)" />
              <stop offset="30%" stopColor="hsl(var(--primary) / 0.3)" />
              <stop offset="70%" stopColor="hsl(var(--primary) / 0.3)" />
              <stop offset="100%" stopColor="hsl(var(--primary) / 0)" />
            </linearGradient>
            <filter id="waveGlow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          
          {/* Main flowing lines */}
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <path
              key={`wave-${i}`}
              d={`M-100,${200 + i * 100} Q200,${150 + i * 100 + (i % 2 ? 50 : -30)} 400,${200 + i * 100} T800,${200 + i * 100} T1200,${200 + i * 100} T1600,${200 + i * 100}`}
              fill="none"
              stroke={`url(#waveLine${i % 2 + 1})`}
              strokeWidth={2 - i * 0.15}
              strokeLinecap="round"
              filter="url(#waveGlow)"
              style={{
                animation: `waveLineFlow ${duration + i * 0.5}s ease-in-out infinite`,
                animationDelay: `${i * 0.3}s`,
                opacity: 0.4 + (i % 3) * 0.1,
              }}
            />
          ))}
          
          {/* Secondary accent lines */}
          {[0, 1, 2].map((i) => (
            <path
              key={`accent-${i}`}
              d={`M-50,${350 + i * 150} C200,${300 + i * 150} 400,${400 + i * 150} 720,${350 + i * 150} S1100,${300 + i * 150} 1500,${350 + i * 150}`}
              fill="none"
              stroke={useTintDirectly ? `hsl(${tintVar} / 0.2)` : "hsl(var(--accent) / 0.2)"}
              strokeWidth="1"
              strokeDasharray="8 4"
              style={{
                animation: `waveLineDash ${duration * 1.5 + i}s linear infinite`,
                animationDelay: `${i * 0.5}s`,
              }}
            />
          ))}
        </svg>
        
        {/* Floating particles along lines */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={`particle-${i}`}
            className="absolute rounded-full"
            style={{
              width: `${4 + (i % 3) * 2}px`,
              height: `${4 + (i % 3) * 2}px`,
              left: `${10 + i * 12}%`,
              top: `${25 + (i % 4) * 15}%`,
              background: useTintDirectly ? `hsl(${tintVar})` : 'hsl(var(--accent))',
              boxShadow: useTintDirectly 
                ? `0 0 ${10 + i * 2}px hsl(${tintVar} / 0.6)` 
                : `0 0 ${10 + i * 2}px hsl(var(--accent) / 0.6)`,
              animation: `waveLineParticle ${duration + i * 0.5}s ease-in-out infinite`,
              animationDelay: `${i * 0.4}s`,
            }}
          />
        ))}
        
        <style>{`
          @keyframes waveLineFlow {
            0%, 100% { 
              transform: translateX(0) translateY(0);
              opacity: 0.3;
            }
            25% { 
              transform: translateX(20px) translateY(-15px);
              opacity: 0.6;
            }
            50% { 
              transform: translateX(0) translateY(10px);
              opacity: 0.4;
            }
            75% { 
              transform: translateX(-20px) translateY(-10px);
              opacity: 0.5;
            }
          }
          @keyframes waveLineDash {
            0% { stroke-dashoffset: 0; }
            100% { stroke-dashoffset: -100; }
          }
          @keyframes waveLineBlob {
            0%, 100% { 
              transform: translate(0, 0) scale(1);
              opacity: 0.8;
            }
            50% { 
              transform: translate(30px, -20px) scale(1.1);
              opacity: 1;
            }
          }
          @keyframes waveLineParticle {
            0%, 100% { 
              transform: translate(0, 0) scale(1);
              opacity: 0.6;
            }
            50% { 
              transform: translate(30px, -20px) scale(1.3);
              opacity: 1;
            }
          }
        `}</style>
      </div>
    );
  }

  // Animated flow field - organic flowing lines
  if (type === 'animated-flow-field') {
    const tintStyle = useTintDirectly ? `hsl(${tintVar}` : 'hsl(var(--accent)';
    const duration = parseFloat(getAnimationDuration());
    
    return (
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/5 to-background" />
        
        {/* Background glow */}
        <div
          className="absolute w-full h-full"
          style={{
            background: `
              radial-gradient(ellipse 60% 40% at 20% 30%, ${tintStyle} / 0.08) 0%, transparent 60%),
              radial-gradient(ellipse 50% 50% at 80% 70%, hsl(var(--primary) / 0.06) 0%, transparent 60%)
            `,
          }}
        />
        
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 1440 900">
          <defs>
            <linearGradient id="flowGrad1" x1="0%" y1="50%" x2="100%" y2="50%">
              <stop offset="0%" stopColor={useTintDirectly ? `hsl(${tintVar} / 0)` : "hsl(var(--accent) / 0)"} />
              <stop offset="50%" stopColor={useTintDirectly ? `hsl(${tintVar} / 0.5)` : "hsl(var(--accent) / 0.5)"} />
              <stop offset="100%" stopColor={useTintDirectly ? `hsl(${tintVar} / 0)` : "hsl(var(--accent) / 0)"} />
            </linearGradient>
            <linearGradient id="flowGrad2" x1="0%" y1="50%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="hsl(var(--primary) / 0)" />
              <stop offset="50%" stopColor="hsl(var(--primary) / 0.3)" />
              <stop offset="100%" stopColor="hsl(var(--primary) / 0)" />
            </linearGradient>
          </defs>
          
          {/* Organic flowing curves */}
          {Array.from({ length: 12 }).map((_, i) => {
            const yBase = 100 + (i * 70);
            const amplitude = 40 + (i % 3) * 20;
            return (
              <path
                key={i}
                d={`M-100,${yBase} C200,${yBase - amplitude} 400,${yBase + amplitude} 720,${yBase} S1100,${yBase - amplitude * 0.7} 1540,${yBase}`}
                fill="none"
                stroke={`url(#flowGrad${i % 2 + 1})`}
                strokeWidth={1.5 - (i % 4) * 0.2}
                strokeLinecap="round"
                style={{
                  animation: `flowFieldCurve ${duration + i * 0.3}s ease-in-out infinite`,
                  animationDelay: `${i * 0.15}s`,
                  opacity: 0.3 + (i % 3) * 0.15,
                }}
              />
            );
          })}
        </svg>
        
        <style>{`
          @keyframes flowFieldCurve {
            0%, 100% { 
              transform: translateY(0) scaleY(1);
              opacity: 0.3;
            }
            50% { 
              transform: translateY(-10px) scaleY(1.05);
              opacity: 0.5;
            }
          }
        `}</style>
      </div>
    );
  }

  // Animated neon grid
  if (type === 'animated-neon-grid') {
    const tintStyle = useTintDirectly ? `hsl(${tintVar}` : 'hsl(var(--accent)';
    const duration = parseFloat(getAnimationDuration());
    
    return (
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background to-muted/10" />
        
        {/* Grid lines */}
        <svg className="absolute inset-0 w-full h-full opacity-30" preserveAspectRatio="none" viewBox="0 0 100 100">
          <defs>
            <pattern id="neonGrid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path 
                d="M 10 0 L 0 0 0 10" 
                fill="none" 
                stroke={useTintDirectly ? `hsl(${tintVar} / 0.3)` : "hsl(var(--accent) / 0.3)"}
                strokeWidth="0.1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#neonGrid)" />
        </svg>
        
        {/* Animated glow lines */}
        <div 
          className="absolute w-full h-[2px]"
          style={{
            top: '30%',
            background: `linear-gradient(90deg, transparent, ${tintStyle} / 0.8), transparent)`,
            boxShadow: useTintDirectly 
              ? `0 0 20px hsl(${tintVar} / 0.5), 0 0 40px hsl(${tintVar} / 0.3)` 
              : `0 0 20px hsl(var(--accent) / 0.5), 0 0 40px hsl(var(--accent) / 0.3)`,
            animation: `neonScan ${duration}s linear infinite`,
          }}
        />
        <div 
          className="absolute h-full w-[2px]"
          style={{
            left: '20%',
            background: `linear-gradient(180deg, transparent, hsl(var(--primary) / 0.6), transparent)`,
            boxShadow: `0 0 15px hsl(var(--primary) / 0.4)`,
            animation: `neonScanV ${duration * 1.5}s linear infinite`,
          }}
        />
        
        {/* Intersection glows */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-3 h-3 rounded-full"
            style={{
              left: `${20 + (i % 3) * 30}%`,
              top: `${25 + Math.floor(i / 3) * 35}%`,
              background: useTintDirectly ? `hsl(${tintVar})` : 'hsl(var(--accent))',
              boxShadow: useTintDirectly 
                ? `0 0 10px hsl(${tintVar}), 0 0 20px hsl(${tintVar} / 0.5)` 
                : `0 0 10px hsl(var(--accent)), 0 0 20px hsl(var(--accent) / 0.5)`,
              animation: `neonPulse ${duration / 2}s ease-in-out infinite`,
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
        
        <style>{`
          @keyframes neonScan {
            0% { transform: translateX(-100%); opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { transform: translateX(200%); opacity: 0; }
          }
          @keyframes neonScanV {
            0% { transform: translateY(-100%); opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { transform: translateY(200%); opacity: 0; }
          }
          @keyframes neonPulse {
            0%, 100% { transform: scale(1); opacity: 0.6; }
            50% { transform: scale(1.5); opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  // NEW: Animated sine lines - flowing purple-to-cyan sine waves (like reference image 1)
  if (type === 'animated-sine-lines') {
    const duration = parseFloat(getAnimationDuration());
    const lineCount = 12;
    
    return (
      <div className="absolute inset-0 overflow-hidden bg-black">
        {/* Pure black background */}
        <div className="absolute inset-0 bg-black" />
        
        {/* Main wave SVG container */}
        <svg 
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 1920 1080"
          preserveAspectRatio="xMidYMid slice"
        >
          {/* Gradient definitions */}
          <defs>
            <linearGradient id="sineGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.9" />
              <stop offset="30%" stopColor="#c084fc" stopOpacity="1" />
              <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.9" />
              <stop offset="70%" stopColor="#6366f1" stopOpacity="1" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="sineGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#d946ef" stopOpacity="0.7" />
              <stop offset="40%" stopColor="#a855f7" stopOpacity="0.8" />
              <stop offset="60%" stopColor="#7c3aed" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.7" />
            </linearGradient>
            {/* Glow filter */}
            <filter id="sineGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          
          {/* Multiple sine wave lines */}
          {Array.from({ length: lineCount }).map((_, i) => {
            const baseY = 540; // Center vertically
            const amplitude = 80 + (i % 3) * 30;
            const frequency = 0.8 + (i % 4) * 0.1;
            const phaseOffset = i * 15;
            const yOffset = (i - lineCount / 2) * 12;
            
            // Generate smooth sine wave path
            const points: string[] = [];
            for (let x = -100; x <= 2020; x += 20) {
              const y = baseY + yOffset + 
                Math.sin((x * frequency * Math.PI) / 400 + phaseOffset * 0.1) * amplitude +
                Math.sin((x * frequency * 0.5 * Math.PI) / 400 + phaseOffset * 0.05) * (amplitude * 0.3);
              points.push(`${x},${y}`);
            }
            const pathD = `M${points.join(' L')}`;
            
            return (
              <path
                key={`sine-${i}`}
                d={pathD}
                fill="none"
                stroke={i % 2 === 0 ? "url(#sineGradient1)" : "url(#sineGradient2)"}
                strokeWidth={1 + (i % 3) * 0.3}
                filter="url(#sineGlow)"
                opacity={0.5 + (i % 4) * 0.1}
                style={{
                  animation: `sineFlow${i % 3} ${duration + i * 0.5}s ease-in-out infinite`,
                  animationDelay: `${i * 0.15}s`,
                }}
              />
            );
          })}
        </svg>
        
        {/* Subtle vignette */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.3) 100%)',
          }}
        />
        
        <style>{`
          @keyframes sineFlow0 {
            0%, 100% { transform: translateX(0) scaleY(1); }
            25% { transform: translateX(-30px) scaleY(1.05); }
            50% { transform: translateX(-60px) scaleY(0.95); }
            75% { transform: translateX(-30px) scaleY(1.02); }
          }
          @keyframes sineFlow1 {
            0%, 100% { transform: translateX(0) scaleY(1); }
            25% { transform: translateX(20px) scaleY(0.97); }
            50% { transform: translateX(40px) scaleY(1.03); }
            75% { transform: translateX(20px) scaleY(0.98); }
          }
          @keyframes sineFlow2 {
            0%, 100% { transform: translateX(0) scaleY(1); }
            33% { transform: translateX(-40px) scaleY(1.04); }
            66% { transform: translateX(-20px) scaleY(0.96); }
          }
        `}</style>
      </div>
    );
  }

  // NEW: Animated data particles - flowing waves with particles and deep blue atmosphere (like reference image 2)
  if (type === 'animated-data-particles') {
    const duration = parseFloat(getAnimationDuration());
    const particleCount = 120;
    const waveLineCount = 16;
    
    return (
      <div className="absolute inset-0 overflow-hidden" style={{ background: 'hsl(222 47% 4%)' }}>
        {/* Deep blue gradient base */}
        <div 
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 100% 60% at 50% 60%, hsl(210 80% 15% / 0.4) 0%, transparent 60%),
              radial-gradient(ellipse 80% 50% at 30% 55%, hsl(200 70% 12% / 0.5) 0%, transparent 50%),
              radial-gradient(ellipse 80% 50% at 70% 55%, hsl(220 70% 12% / 0.5) 0%, transparent 50%),
              linear-gradient(to bottom, hsl(222 47% 3%) 0%, hsl(215 50% 8%) 50%, hsl(222 47% 3%) 100%)
            `,
          }}
        />
        
        {/* Wave lines with perspective */}
        <div 
          className="absolute inset-0"
          style={{
            perspective: '800px',
            perspectiveOrigin: '50% 40%',
          }}
        >
          <svg 
            className="absolute w-full h-full"
            viewBox="0 0 1920 1080"
            preserveAspectRatio="xMidYMid slice"
            style={{
              transform: 'rotateX(45deg) translateZ(-100px)',
              transformOrigin: '50% 60%',
            }}
          >
            <defs>
              <linearGradient id="dataLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.1" />
                <stop offset="30%" stopColor="#06b6d4" stopOpacity="0.5" />
                <stop offset="50%" stopColor="#22d3ee" stopOpacity="0.8" />
                <stop offset="70%" stopColor="#06b6d4" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#0284c7" stopOpacity="0.1" />
              </linearGradient>
              <filter id="dataGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            
            {/* Flowing wave lines */}
            {Array.from({ length: waveLineCount }).map((_, i) => {
              const baseY = 400 + i * 40;
              const amplitude = 30 + (i % 4) * 15;
              
              const points: string[] = [];
              for (let x = -100; x <= 2020; x += 30) {
                const y = baseY + 
                  Math.sin((x * Math.PI) / 300 + i * 0.5) * amplitude +
                  Math.sin((x * Math.PI) / 600 + i * 0.3) * (amplitude * 0.5);
                points.push(`${x},${y}`);
              }
              const pathD = `M${points.join(' L')}`;
              
              return (
                <path
                  key={`data-line-${i}`}
                  d={pathD}
                  fill="none"
                  stroke="url(#dataLineGrad)"
                  strokeWidth={0.8 + (i % 3) * 0.3}
                  filter="url(#dataGlow)"
                  opacity={0.3 + (i % 4) * 0.1}
                  style={{
                    animation: `dataWaveFlow ${duration + i * 0.3}s ease-in-out infinite`,
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              );
            })}
          </svg>
        </div>
        
        {/* Floating particles */}
        {Array.from({ length: particleCount }).map((_, i) => {
          const size = Math.random() * 4 + 1;
          const x = Math.random() * 100;
          const y = 30 + Math.random() * 50;
          const opacity = 0.2 + Math.random() * 0.5;
          const delay = Math.random() * duration;
          const particleDuration = duration + Math.random() * 5;
          
          return (
            <div
              key={`dp-${i}`}
              className="absolute rounded-full"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                left: `${x}%`,
                top: `${y}%`,
                background: `hsl(${190 + Math.random() * 30} 80% ${60 + Math.random() * 20}%)`,
                boxShadow: `0 0 ${size * 2}px hsl(195 80% 60% / 0.6), 0 0 ${size * 4}px hsl(195 80% 50% / 0.3)`,
                opacity,
                animation: `dataParticleFloat ${particleDuration}s ease-in-out infinite`,
                animationDelay: `${delay}s`,
              }}
            />
          );
        })}
        
        {/* Bokeh blur circles */}
        {Array.from({ length: 15 }).map((_, i) => {
          const size = 40 + Math.random() * 80;
          const x = Math.random() * 100;
          const y = 20 + Math.random() * 60;
          
          return (
            <div
              key={`bokeh-${i}`}
              className="absolute rounded-full"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                left: `${x}%`,
                top: `${y}%`,
                background: `radial-gradient(circle, hsl(200 60% 40% / 0.15) 0%, transparent 70%)`,
                filter: 'blur(20px)',
                animation: `bokehPulse ${duration * 1.5 + i * 0.5}s ease-in-out infinite`,
                animationDelay: `${i * 0.3}s`,
              }}
            />
          );
        })}
        
        {/* Top and bottom fade */}
        <div 
          className="absolute inset-x-0 top-0 h-1/4 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, hsl(222 47% 3%) 0%, transparent 100%)' }}
        />
        <div 
          className="absolute inset-x-0 bottom-0 h-1/4 pointer-events-none"
          style={{ background: 'linear-gradient(to top, hsl(222 47% 3%) 0%, transparent 100%)' }}
        />
        
        <style>{`
          @keyframes dataWaveFlow {
            0%, 100% { 
              transform: translateX(0);
              opacity: 0.4;
            }
            25% {
              transform: translateX(-30px);
              opacity: 0.6;
            }
            50% { 
              transform: translateX(-60px);
              opacity: 0.5;
            }
            75% {
              transform: translateX(-30px);
              opacity: 0.7;
            }
          }
          @keyframes dataParticleFloat {
            0%, 100% { 
              transform: translate(0, 0) scale(1);
            }
            25% { 
              transform: translate(8px, -12px) scale(1.1);
            }
            50% { 
              transform: translate(-5px, -8px) scale(0.9);
            }
            75% { 
              transform: translate(6px, -4px) scale(1.05);
            }
          }
          @keyframes bokehPulse {
            0%, 100% { 
              opacity: 0.3;
              transform: scale(1);
            }
            50% { 
              opacity: 0.5;
              transform: scale(1.1);
            }
          }
        `}</style>
      </div>
    );
  }

  // Default gradient background
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-background" />
      <div 
        className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl"
        style={{ backgroundColor: useTintDirectly ? `hsl(${tintVar} / 0.1)` : 'hsl(var(--accent) / 0.1)' }}
      />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
    </div>
  );
});

HeroBackground.displayName = "HeroBackground";