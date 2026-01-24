/**
 * GlobalAssetOrbit Component
 * Animated globe with orbiting brand asset icons representing global cohesion
 */

import { useMemo } from 'react';
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
  // Generate connection lines between icons
  const connectionPaths = useMemo(() => {
    const paths: { id: string; d: string }[] = [];
    const centerX = 150;
    const centerY = 150;
    const radius = 110;
    
    // Create curved paths between adjacent icons
    for (let i = 0; i < ORBIT_ICONS.length; i++) {
      const nextI = (i + 1) % ORBIT_ICONS.length;
      const angle1 = (i * 360 / ORBIT_ICONS.length - 90) * (Math.PI / 180);
      const angle2 = (nextI * 360 / ORBIT_ICONS.length - 90) * (Math.PI / 180);
      
      const x1 = centerX + radius * Math.cos(angle1);
      const y1 = centerY + radius * Math.sin(angle1);
      const x2 = centerX + radius * Math.cos(angle2);
      const y2 = centerY + radius * Math.sin(angle2);
      
      // Curved path through center-ish area
      const midAngle = ((i + 0.5) * 360 / ORBIT_ICONS.length - 90) * (Math.PI / 180);
      const controlX = centerX + (radius * 0.7) * Math.cos(midAngle);
      const controlY = centerY + (radius * 0.7) * Math.sin(midAngle);
      
      paths.push({
        id: `connection-${i}`,
        d: `M ${x1} ${y1} Q ${controlX} ${controlY} ${x2} ${y2}`
      });
    }
    
    return paths;
  }, []);

  return (
    <div className={cn('relative w-[300px] h-[300px]', className)}>
      {/* Main SVG container */}
      <svg 
        viewBox="0 0 300 300" 
        className="w-full h-full"
        style={{ overflow: 'visible' }}
      >
        <defs>
          {/* Gradient for the globe */}
          <radialGradient id="globe-gradient" cx="30%" cy="30%">
            <stop offset="0%" stopColor={primaryColor} stopOpacity="0.3" />
            <stop offset="50%" stopColor={secondaryColor} stopOpacity="0.15" />
            <stop offset="100%" stopColor={primaryColor} stopOpacity="0.05" />
          </radialGradient>
          
          {/* Gradient for orbit paths */}
          <linearGradient id="orbit-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={primaryColor} stopOpacity="0.6" />
            <stop offset="50%" stopColor={secondaryColor} stopOpacity="0.3" />
            <stop offset="100%" stopColor={primaryColor} stopOpacity="0.6" />
          </linearGradient>
          
          {/* Glow filter */}
          <filter id="icon-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
          {/* Animated dash pattern */}
          <pattern id="dash-pattern" patternUnits="userSpaceOnUse" width="8" height="1">
            <rect width="4" height="1" fill={primaryColor} opacity="0.5">
              <animate 
                attributeName="x" 
                from="0" 
                to="8" 
                dur="1s" 
                repeatCount="indefinite" 
              />
            </rect>
          </pattern>
        </defs>
        
        {/* Outer orbit ring */}
        <circle 
          cx="150" 
          cy="150" 
          r="120" 
          fill="none" 
          stroke="url(#orbit-gradient)" 
          strokeWidth="1"
          strokeDasharray="4 4"
          className="animate-[spin_60s_linear_infinite]"
          style={{ transformOrigin: '150px 150px' }}
        />
        
        {/* Middle orbit ring */}
        <circle 
          cx="150" 
          cy="150" 
          r="80" 
          fill="none" 
          stroke={primaryColor}
          strokeWidth="1"
          strokeOpacity="0.3"
          strokeDasharray="2 6"
          className="animate-[spin_40s_linear_infinite_reverse]"
          style={{ transformOrigin: '150px 150px' }}
        />
        
        {/* Inner orbit ring */}
        <circle 
          cx="150" 
          cy="150" 
          r="45" 
          fill="none" 
          stroke={secondaryColor}
          strokeWidth="1"
          strokeOpacity="0.25"
          strokeDasharray="1 4"
          className="animate-[spin_30s_linear_infinite]"
          style={{ transformOrigin: '150px 150px' }}
        />
        
        {/* Connection lines between icons */}
        <g className="opacity-20">
          {connectionPaths.map((path, i) => (
            <path 
              key={path.id}
              d={path.d}
              fill="none"
              stroke={primaryColor}
              strokeWidth="0.5"
              strokeDasharray="2 4"
              style={{
                animation: `pulse 3s ease-in-out ${i * 0.3}s infinite`
              }}
            />
          ))}
        </g>
        
        {/* Central globe */}
        <circle 
          cx="150" 
          cy="150" 
          r="35" 
          fill="url(#globe-gradient)"
          stroke={primaryColor}
          strokeWidth="1.5"
          strokeOpacity="0.5"
        />
        
        {/* Globe latitude lines */}
        <ellipse 
          cx="150" 
          cy="150" 
          rx="35" 
          ry="15" 
          fill="none" 
          stroke={primaryColor}
          strokeWidth="0.5"
          strokeOpacity="0.3"
        />
        <ellipse 
          cx="150" 
          cy="150" 
          rx="35" 
          ry="28" 
          fill="none" 
          stroke={primaryColor}
          strokeWidth="0.5"
          strokeOpacity="0.2"
        />
        
        {/* Globe longitude line */}
        <ellipse 
          cx="150" 
          cy="150" 
          rx="10" 
          ry="35" 
          fill="none" 
          stroke={primaryColor}
          strokeWidth="0.5"
          strokeOpacity="0.3"
        />
        
        {/* Central icon */}
        <g filter="url(#icon-glow)">
          <circle 
            cx="150" 
            cy="150" 
            r="20" 
            fill={primaryColor}
            fillOpacity="0.2"
          />
        </g>
      </svg>
      
      {/* Central Globe Icon */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-3 rounded-full"
        style={{ 
          background: `linear-gradient(135deg, ${primaryColor}40, ${secondaryColor}20)`,
          boxShadow: `0 0 30px ${primaryColor}40`
        }}
      >
        <Globe 
          className="w-8 h-8 animate-pulse" 
          style={{ color: primaryColor }}
        />
      </div>
      
      {/* Inner orbiting icons */}
      <div 
        className="absolute inset-0 animate-[spin_25s_linear_infinite_reverse]"
        style={{ transformOrigin: 'center' }}
      >
        {INNER_ICONS.map(({ Icon, delay }, i) => {
          const angle = (i * 360 / INNER_ICONS.length - 90) * (Math.PI / 180);
          const radius = 45;
          const x = 150 + radius * Math.cos(angle);
          const y = 150 + radius * Math.sin(angle);
          
          return (
            <div
              key={i}
              className="absolute w-6 h-6 -ml-3 -mt-3 flex items-center justify-center animate-[spin_25s_linear_infinite]"
              style={{ 
                left: x, 
                top: y,
                animationDelay: `${delay}s`,
              }}
            >
              <div 
                className="p-1 rounded-full"
                style={{ 
                  background: `${secondaryColor}30`,
                  boxShadow: `0 0 10px ${secondaryColor}20`
                }}
              >
                <Icon 
                  className="w-3 h-3"
                  style={{ color: secondaryColor }}
                />
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Outer orbiting asset icons */}
      <div 
        className="absolute inset-0 animate-[spin_45s_linear_infinite]"
        style={{ transformOrigin: 'center' }}
      >
        {ORBIT_ICONS.map(({ Icon, label, delay }, i) => {
          const angle = (i * 360 / ORBIT_ICONS.length - 90) * (Math.PI / 180);
          const radius = 110;
          const x = 150 + radius * Math.cos(angle);
          const y = 150 + radius * Math.sin(angle);
          
          return (
            <div
              key={i}
              className="absolute w-10 h-10 -ml-5 -mt-5 group"
              style={{ 
                left: x, 
                top: y,
              }}
            >
              {/* Counter-rotate to keep icons upright */}
              <div 
                className="w-full h-full flex items-center justify-center animate-[spin_45s_linear_infinite_reverse]"
                style={{ transformOrigin: 'center' }}
              >
                <div 
                  className="p-2 rounded-xl transition-all duration-300 hover:scale-125 cursor-pointer relative"
                  style={{ 
                    background: `linear-gradient(135deg, ${primaryColor}30, ${secondaryColor}15)`,
                    boxShadow: `0 0 15px ${primaryColor}20`,
                    border: `1px solid ${primaryColor}30`,
                    animation: `pulse 4s ease-in-out ${delay * 0.5}s infinite`
                  }}
                >
                  <Icon 
                    className="w-4 h-4"
                    style={{ color: primaryColor }}
                  />
                  
                  {/* Tooltip */}
                  <span 
                    className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap px-1.5 py-0.5 rounded"
                    style={{ 
                      background: `${primaryColor}90`,
                      color: 'white'
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
      
      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{
              left: `${20 + Math.random() * 60}%`,
              top: `${20 + Math.random() * 60}%`,
              background: i % 2 === 0 ? primaryColor : secondaryColor,
              opacity: 0.4,
              animation: `float ${3 + Math.random() * 4}s ease-in-out ${Math.random() * 2}s infinite alternate`
            }}
          />
        ))}
      </div>
      
      {/* Inject keyframes for custom animations */}
      <style>{`
        @keyframes float {
          0% { transform: translateY(0px) translateX(0px); opacity: 0.2; }
          50% { opacity: 0.6; }
          100% { transform: translateY(-15px) translateX(10px); opacity: 0.2; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(0.95); }
        }
      `}</style>
    </div>
  );
};
