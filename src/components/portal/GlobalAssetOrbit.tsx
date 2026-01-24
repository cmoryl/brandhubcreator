/**
 * GlobalAssetOrbit Component
 * Animated globe with orbiting brand asset icons - responds to mouse interactions
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Building2,
  Package,
  Calendar,
  Palette,
  Type,
  Image,
  FileText,
  Globe,
  Sparkles,
  Layers,
  Share2,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface GlobalAssetOrbitProps {
  className?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

const ORBIT_ICONS = [
  { Icon: Building2, label: 'Brands', delay: 0 },
  { Icon: Package, label: 'Products', delay: 1 },
  { Icon: Calendar, label: 'Events', delay: 2 },
  { Icon: Palette, label: 'Colors', delay: 3 },
  { Icon: Type, label: 'Typography', delay: 4 },
  { Icon: Image, label: 'Imagery', delay: 5 },
  { Icon: FileText, label: 'Templates', delay: 6 },
  { Icon: Share2, label: 'Social', delay: 7 },
];

const INNER_ICONS = [
  { Icon: Layers, delay: 0 },
  { Icon: Sparkles, delay: 1.5 },
  { Icon: Zap, delay: 3 },
];

export const GlobalAssetOrbit = ({ 
  className, 
  primaryColor = '#6366f1',
  secondaryColor = '#8b5cf6' 
}: GlobalAssetOrbitProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });
  const [isHovering, setIsHovering] = useState(false);
  const [activeIcon, setActiveIcon] = useState<number | null>(null);
  const [orbitPaused, setOrbitPaused] = useState(false);
  const animationFrameRef = useRef<number>();

  // Handle mouse movement with rAF for smooth performance
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    animationFrameRef.current = requestAnimationFrame(() => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      
      setMousePosition({ x, y });
    });
  }, []);

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Calculate 3D transform based on mouse position
  const getTransform3D = () => {
    if (!isHovering) return 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
    
    const rotateX = (mousePosition.y - 0.5) * -20;
    const rotateY = (mousePosition.x - 0.5) * 20;
    
    return `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  };

  // Calculate icon scale based on proximity to mouse
  const getIconScale = (iconIndex: number) => {
    if (!isHovering) return 1;
    
    const angle = (iconIndex * 360 / ORBIT_ICONS.length - 90) * (Math.PI / 180);
    const iconX = 0.5 + 0.35 * Math.cos(angle);
    const iconY = 0.5 + 0.35 * Math.sin(angle);
    
    const distance = Math.sqrt(
      Math.pow(mousePosition.x - iconX, 2) + 
      Math.pow(mousePosition.y - iconY, 2)
    );
    
    // Scale up icons closer to mouse
    const maxScale = 1.5;
    const minScale = 0.85;
    const scaleFactor = Math.max(minScale, maxScale - distance * 2);
    
    return activeIcon === iconIndex ? 1.6 : scaleFactor;
  };

  // Get glow intensity based on mouse proximity
  const getGlowIntensity = (iconIndex: number) => {
    if (!isHovering) return 0.2;
    
    const angle = (iconIndex * 360 / ORBIT_ICONS.length - 90) * (Math.PI / 180);
    const iconX = 0.5 + 0.35 * Math.cos(angle);
    const iconY = 0.5 + 0.35 * Math.sin(angle);
    
    const distance = Math.sqrt(
      Math.pow(mousePosition.x - iconX, 2) + 
      Math.pow(mousePosition.y - iconY, 2)
    );
    
    return Math.max(0.2, 1 - distance * 2);
  };

  return (
    <div 
      ref={containerRef}
      className={cn('relative', className)}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => {
        setIsHovering(false);
        setActiveIcon(null);
        setOrbitPaused(false);
      }}
      style={{
        transform: getTransform3D(),
        transition: isHovering ? 'transform 0.1s ease-out' : 'transform 0.5s ease-out',
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Main SVG container */}
      <svg 
        viewBox="0 0 300 300" 
        className="w-full h-full"
        style={{ overflow: 'visible' }}
      >
        <defs>
          {/* Gradient for the globe */}
          <radialGradient id="globe-gradient-interactive" cx="30%" cy="30%">
            <stop offset="0%" stopColor={primaryColor} stopOpacity={isHovering ? "0.5" : "0.3"} />
            <stop offset="50%" stopColor={secondaryColor} stopOpacity={isHovering ? "0.25" : "0.15"} />
            <stop offset="100%" stopColor={primaryColor} stopOpacity="0.05" />
          </radialGradient>
          
          {/* Gradient for orbit paths */}
          <linearGradient id="orbit-gradient-interactive" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={primaryColor} stopOpacity={isHovering ? "0.8" : "0.6"} />
            <stop offset="50%" stopColor={secondaryColor} stopOpacity={isHovering ? "0.5" : "0.3"} />
            <stop offset="100%" stopColor={primaryColor} stopOpacity={isHovering ? "0.8" : "0.6"} />
          </linearGradient>
          
          {/* Enhanced glow filter */}
          <filter id="icon-glow-interactive" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation={isHovering ? "6" : "3"} result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
          {/* Connection line glow */}
          <filter id="line-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        {/* Outer pulsing ring on hover */}
        <circle 
          cx="150" 
          cy="150" 
          r="140" 
          fill="none" 
          stroke={primaryColor}
          strokeWidth={isHovering ? "2" : "0"}
          strokeOpacity="0.3"
          style={{
            transition: 'all 0.3s ease-out',
            transform: `scale(${isHovering ? 1.05 : 1})`,
            transformOrigin: '150px 150px',
          }}
        />
        
        {/* Outer orbit ring */}
        <circle 
          cx="150" 
          cy="150" 
          r="110" 
          fill="none" 
          stroke="url(#orbit-gradient-interactive)" 
          strokeWidth={isHovering ? "2" : "1.5"}
          strokeDasharray={isHovering ? "8 4" : "4 4"}
          className={orbitPaused ? '' : 'animate-[spin_60s_linear_infinite]'}
          style={{ 
            transformOrigin: '150px 150px',
            transition: 'stroke-width 0.3s, stroke-dasharray 0.3s',
          }}
        />
        
        {/* Middle orbit ring */}
        <circle 
          cx="150" 
          cy="150" 
          r="70" 
          fill="none" 
          stroke={primaryColor}
          strokeWidth="1"
          strokeOpacity={isHovering ? "0.5" : "0.3"}
          strokeDasharray="2 6"
          className={orbitPaused ? '' : 'animate-[spin_40s_linear_infinite_reverse]'}
          style={{ transformOrigin: '150px 150px' }}
        />
        
        {/* Inner orbit ring */}
        <circle 
          cx="150" 
          cy="150" 
          r="40" 
          fill="none" 
          stroke={secondaryColor}
          strokeWidth="1"
          strokeOpacity={isHovering ? "0.4" : "0.25"}
          strokeDasharray="1 4"
          className={orbitPaused ? '' : 'animate-[spin_30s_linear_infinite]'}
          style={{ transformOrigin: '150px 150px' }}
        />
        
        {/* Dynamic connection lines from mouse to nearby icons */}
        {isHovering && ORBIT_ICONS.map((_, i) => {
          const angle = (i * 360 / ORBIT_ICONS.length - 90) * (Math.PI / 180);
          const iconX = 150 + 110 * Math.cos(angle);
          const iconY = 150 + 110 * Math.sin(angle);
          const mouseX = mousePosition.x * 300;
          const mouseY = mousePosition.y * 300;
          
          const distance = Math.sqrt(Math.pow(mouseX - iconX, 2) + Math.pow(mouseY - iconY, 2));
          const opacity = Math.max(0, 0.6 - distance / 200);
          
          if (opacity <= 0.1) return null;
          
          return (
            <line
              key={`connection-${i}`}
              x1={mouseX}
              y1={mouseY}
              x2={iconX}
              y2={iconY}
              stroke={primaryColor}
              strokeWidth="1"
              strokeOpacity={opacity}
              filter="url(#line-glow)"
              style={{
                transition: 'all 0.15s ease-out',
              }}
            />
          );
        })}
        
        {/* Central globe */}
        <circle 
          cx="150" 
          cy="150" 
          r={isHovering ? "38" : "35"} 
          fill="url(#globe-gradient-interactive)"
          stroke={primaryColor}
          strokeWidth={isHovering ? "2" : "1.5"}
          strokeOpacity={isHovering ? "0.7" : "0.5"}
          style={{ transition: 'all 0.3s ease-out' }}
        />
        
        {/* Globe latitude lines */}
        <ellipse 
          cx="150" 
          cy="150" 
          rx={isHovering ? "38" : "35"} 
          ry="12" 
          fill="none" 
          stroke={primaryColor}
          strokeWidth="0.75"
          strokeOpacity={isHovering ? "0.5" : "0.3"}
          style={{ transition: 'all 0.3s ease-out' }}
        />
        <ellipse 
          cx="150" 
          cy="150" 
          rx={isHovering ? "38" : "35"} 
          ry="26" 
          fill="none" 
          stroke={primaryColor}
          strokeWidth="0.5"
          strokeOpacity={isHovering ? "0.35" : "0.2"}
          style={{ transition: 'all 0.3s ease-out' }}
        />
        
        {/* Globe longitude line */}
        <ellipse 
          cx="150" 
          cy="150" 
          rx="10" 
          ry={isHovering ? "38" : "35"}
          fill="none" 
          stroke={primaryColor}
          strokeWidth="0.75"
          strokeOpacity={isHovering ? "0.5" : "0.3"}
          style={{ transition: 'all 0.3s ease-out' }}
        />
        
        {/* Central glow on hover */}
        <circle 
          cx="150" 
          cy="150" 
          r="50" 
          fill={primaryColor}
          fillOpacity={isHovering ? "0.15" : "0"}
          filter="url(#icon-glow-interactive)"
          style={{ transition: 'fill-opacity 0.3s ease-out' }}
        />
      </svg>
      
      {/* Central Globe Icon */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-4 rounded-full cursor-pointer transition-all duration-300"
        style={{ 
          background: `linear-gradient(135deg, ${primaryColor}${isHovering ? '60' : '40'}, ${secondaryColor}${isHovering ? '30' : '20'})`,
          boxShadow: `0 0 ${isHovering ? '50px' : '30px'} ${primaryColor}${isHovering ? '60' : '40'}`,
          transform: `scale(${isHovering ? 1.15 : 1})`,
        }}
      >
        <Globe 
          className={cn(
            "w-10 h-10 transition-all duration-300",
            isHovering && "animate-pulse"
          )}
          style={{ color: primaryColor }}
        />
      </div>
      
      {/* Inner orbiting icons */}
      <div 
        className={cn(
          "absolute inset-0",
          !orbitPaused && "animate-[spin_25s_linear_infinite_reverse]"
        )}
        style={{ transformOrigin: 'center' }}
      >
        {INNER_ICONS.map(({ Icon, delay }, i) => {
          const angle = (i * 360 / INNER_ICONS.length - 90) * (Math.PI / 180);
          const radius = 40 / 300 * 100; // Convert to percentage
          const x = 50 + radius * Math.cos(angle);
          const y = 50 + radius * Math.sin(angle);
          
          return (
            <div
              key={i}
              className={cn(
                "absolute w-8 h-8 -ml-4 -mt-4 flex items-center justify-center",
                !orbitPaused && "animate-[spin_25s_linear_infinite]"
              )}
              style={{ 
                left: `${x}%`, 
                top: `${y}%`,
                animationDelay: `${delay}s`,
              }}
            >
              <div 
                className="p-1.5 rounded-full transition-all duration-300"
                style={{ 
                  background: `${secondaryColor}${isHovering ? '50' : '30'}`,
                  boxShadow: `0 0 ${isHovering ? '15px' : '10px'} ${secondaryColor}${isHovering ? '40' : '20'}`,
                  transform: `scale(${isHovering ? 1.2 : 1})`,
                }}
              >
                <Icon 
                  className="w-4 h-4"
                  style={{ color: secondaryColor }}
                />
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Outer orbiting asset icons */}
      <div 
        className={cn(
          "absolute inset-0",
          !orbitPaused && "animate-[spin_45s_linear_infinite]"
        )}
        style={{ transformOrigin: 'center' }}
      >
        {ORBIT_ICONS.map(({ Icon, label, delay }, i) => {
          const angle = (i * 360 / ORBIT_ICONS.length - 90) * (Math.PI / 180);
          const radius = 110 / 300 * 100; // Convert to percentage
          const x = 50 + radius * Math.cos(angle);
          const y = 50 + radius * Math.sin(angle);
          const scale = getIconScale(i);
          const glowIntensity = getGlowIntensity(i);
          
          return (
            <div
              key={i}
              className="absolute w-14 h-14 -ml-7 -mt-7 group"
              style={{ 
                left: `${x}%`, 
                top: `${y}%`,
              }}
              onMouseEnter={() => {
                setActiveIcon(i);
                setOrbitPaused(true);
              }}
              onMouseLeave={() => {
                setActiveIcon(null);
                setOrbitPaused(false);
              }}
            >
              {/* Counter-rotate to keep icons upright */}
              <div 
                className={cn(
                  "w-full h-full flex items-center justify-center",
                  !orbitPaused && "animate-[spin_45s_linear_infinite_reverse]"
                )}
                style={{ transformOrigin: 'center' }}
              >
                <div 
                  className="p-3 rounded-xl cursor-pointer relative transition-all duration-200"
                  style={{ 
                    background: `linear-gradient(135deg, ${primaryColor}${Math.round(glowIntensity * 60)}%, ${secondaryColor}${Math.round(glowIntensity * 30)}%)`,
                    boxShadow: `0 0 ${20 + glowIntensity * 30}px ${primaryColor}${Math.round(glowIntensity * 60)}`,
                    border: `1.5px solid ${primaryColor}${Math.round(glowIntensity * 80)}`,
                    transform: `scale(${scale})`,
                    zIndex: activeIcon === i ? 10 : 1,
                  }}
                >
                  <Icon 
                    className="w-5 h-5 transition-all duration-200"
                    style={{ 
                      color: primaryColor,
                      filter: activeIcon === i ? `drop-shadow(0 0 8px ${primaryColor})` : 'none',
                    }}
                  />
                  
                  {/* Tooltip */}
                  <span 
                    className={cn(
                      "absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs font-semibold whitespace-nowrap px-2 py-1 rounded-lg transition-all duration-200",
                      activeIcon === i ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                    )}
                    style={{ 
                      background: primaryColor,
                      color: 'white',
                      boxShadow: `0 4px 12px ${primaryColor}50`,
                    }}
                  >
                    {label}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Floating particles that react to mouse */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(16)].map((_, i) => {
          const baseX = 20 + (i % 4) * 20;
          const baseY = 20 + Math.floor(i / 4) * 20;
          // Move particles slightly toward mouse on hover
          const offsetX = isHovering ? (mousePosition.x - 0.5) * 20 : 0;
          const offsetY = isHovering ? (mousePosition.y - 0.5) * 20 : 0;
          
          return (
            <div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full transition-all duration-500"
              style={{
                left: `${baseX + offsetX * (i % 3 === 0 ? 1 : -0.5)}%`,
                top: `${baseY + offsetY * (i % 2 === 0 ? 1 : -0.5)}%`,
                background: i % 2 === 0 ? primaryColor : secondaryColor,
                opacity: isHovering ? 0.6 : 0.3,
                transform: `scale(${isHovering ? 1.3 : 1})`,
                animation: `float ${3 + Math.random() * 4}s ease-in-out ${Math.random() * 2}s infinite alternate`,
              }}
            />
          );
        })}
      </div>
      
      {/* Mouse follower glow */}
      {isHovering && (
        <div 
          className="absolute w-32 h-32 rounded-full pointer-events-none transition-opacity duration-300"
          style={{
            left: `${mousePosition.x * 100}%`,
            top: `${mousePosition.y * 100}%`,
            transform: 'translate(-50%, -50%)',
            background: `radial-gradient(circle, ${primaryColor}30 0%, transparent 70%)`,
            filter: 'blur(20px)',
          }}
        />
      )}
      
      {/* Inject keyframes */}
      <style>{`
        @keyframes float {
          0% { transform: translateY(0px) translateX(0px); }
          50% { opacity: 0.8; }
          100% { transform: translateY(-20px) translateX(15px); }
        }
      `}</style>
    </div>
  );
};
