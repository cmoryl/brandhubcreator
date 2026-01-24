/**
 * GlobalAssetOrbit Component
 * Interactive globe with orbiting icons linked to actual brands, products, and events
 * Features dotted orbit lines, monochromatic icons, and organization-branded center
 */

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Package,
  Calendar,
  ArrowUpRight,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LinkedEntity {
  id: string;
  name: string;
  slug?: string;
  type: 'brand' | 'product' | 'event';
  updatedAt?: string;
  coverImage?: string;
  color?: string;
}

interface GlobalAssetOrbitProps {
  className?: string;
  primaryColor?: string;
  secondaryColor?: string;
  organizationName?: string;
  organizationLogo?: string | null;
  brands?: LinkedEntity[];
  products?: LinkedEntity[];
  events?: LinkedEntity[];
}

const TYPE_CONFIG = {
  brand: { Icon: Building2, label: 'Brand Guide', path: '/brand' },
  product: { Icon: Package, label: 'Product Guide', path: '/product' },
  event: { Icon: Calendar, label: 'Event Kit', path: '/event' },
};

export const GlobalAssetOrbit = ({ 
  className, 
  primaryColor = '#6366f1',
  secondaryColor = '#8b5cf6',
  organizationName = 'Brand Hub',
  organizationLogo,
  brands = [],
  products = [],
  events = [],
}: GlobalAssetOrbitProps) => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });
  const [isHovering, setIsHovering] = useState(false);
  const [activeEntity, setActiveEntity] = useState<LinkedEntity | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [orbitPaused, setOrbitPaused] = useState(false);
  const animationFrameRef = useRef<number>();

  // Combine and sort entities by most recently updated, take top 8
  const orbitEntities = useMemo(() => {
    const allEntities: LinkedEntity[] = [
      ...brands.slice(0, 4).map(b => ({ ...b, type: 'brand' as const })),
      ...products.slice(0, 4).map(p => ({ ...p, type: 'product' as const })),
      ...events.slice(0, 4).map(e => ({ ...e, type: 'event' as const })),
    ];
    
    return allEntities
      .sort((a, b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 8);
  }, [brands, products, events]);

  // Entity counts
  const entityCounts = useMemo(() => ({
    brands: brands.length,
    products: products.length,
    events: events.length,
    total: brands.length + products.length + events.length,
  }), [brands, products, events]);

  // Get first letter for center icon
  const centerLetter = organizationName.charAt(0).toUpperCase();

  // Handle mouse movement
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

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // 3D perspective transform
  const getTransform3D = () => {
    if (!isHovering) return 'perspective(1200px) rotateX(0deg) rotateY(0deg)';
    
    const rotateX = (mousePosition.y - 0.5) * -12;
    const rotateY = (mousePosition.x - 0.5) * 12;
    
    return `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  };

  // Navigate to entity
  const handleEntityClick = (entity: LinkedEntity) => {
    const config = TYPE_CONFIG[entity.type];
    navigate(`${config.path}/${entity.slug || entity.id}`);
  };

  // Get relationship lines
  const getRelationshipLines = () => {
    if (hoveredIndex === null || !activeEntity) return [];
    
    const lines: { from: number; to: number }[] = [];
    const activeType = activeEntity.type;
    
    orbitEntities.forEach((entity, i) => {
      if (i !== hoveredIndex && entity.type === activeType) {
        lines.push({ from: hoveredIndex, to: i });
      }
    });
    
    return lines;
  };

  const relationshipLines = getRelationshipLines();

  // Generate dotted circle points
  const generateDots = (cx: number, cy: number, r: number, count: number, size: number) => {
    const dots = [];
    for (let i = 0; i < count; i++) {
      const angle = (i * 360 / count) * (Math.PI / 180);
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      dots.push({ x, y, size });
    }
    return dots;
  };

  const outerDots = generateDots(200, 200, 175, 48, 2);
  const mainOrbitDots = generateDots(200, 200, 145, 36, 2.5);
  const middleDots = generateDots(200, 200, 95, 24, 2);
  const innerDots = generateDots(200, 200, 55, 16, 1.5);

  return (
    <div 
      ref={containerRef}
      className={cn('relative', className)}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => {
        setIsHovering(false);
        setActiveEntity(null);
        setHoveredIndex(null);
        setOrbitPaused(false);
      }}
      style={{
        transform: getTransform3D(),
        transition: isHovering ? 'transform 0.1s ease-out' : 'transform 0.5s ease-out',
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Main SVG */}
      <svg 
        viewBox="0 0 400 400" 
        className="w-full h-full"
        style={{ overflow: 'visible' }}
      >
        <defs>
          <radialGradient id="center-grad" cx="30%" cy="30%">
            <stop offset="0%" stopColor={primaryColor} stopOpacity={isHovering ? "0.7" : "0.5"} />
            <stop offset="70%" stopColor={primaryColor} stopOpacity={isHovering ? "0.4" : "0.25"} />
            <stop offset="100%" stopColor={primaryColor} stopOpacity="0.1" />
          </radialGradient>
          
          <filter id="glow-main" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="10" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
          <filter id="glow-soft" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        {/* Outer dotted orbit */}
        <g 
          className={orbitPaused ? '' : 'animate-[spin_120s_linear_infinite]'}
          style={{ transformOrigin: '200px 200px' }}
        >
          {outerDots.map((dot, i) => (
            <circle
              key={`outer-${i}`}
              cx={dot.x}
              cy={dot.y}
              r={dot.size}
              fill={primaryColor}
              fillOpacity={isHovering ? 0.5 : 0.25}
              style={{ transition: 'fill-opacity 0.3s' }}
            />
          ))}
        </g>
        
        {/* Main orbit dots */}
        <g 
          className={orbitPaused ? '' : 'animate-[spin_80s_linear_infinite]'}
          style={{ transformOrigin: '200px 200px' }}
        >
          {mainOrbitDots.map((dot, i) => (
            <circle
              key={`main-${i}`}
              cx={dot.x}
              cy={dot.y}
              r={dot.size}
              fill={primaryColor}
              fillOpacity={isHovering ? 0.7 : 0.4}
              style={{ transition: 'fill-opacity 0.3s' }}
            />
          ))}
        </g>
        
        {/* Middle orbit dots */}
        <g 
          className={orbitPaused ? '' : 'animate-[spin_60s_linear_infinite_reverse]'}
          style={{ transformOrigin: '200px 200px' }}
        >
          {middleDots.map((dot, i) => (
            <circle
              key={`middle-${i}`}
              cx={dot.x}
              cy={dot.y}
              r={dot.size}
              fill={primaryColor}
              fillOpacity={isHovering ? 0.55 : 0.3}
              style={{ transition: 'fill-opacity 0.3s' }}
            />
          ))}
        </g>
        
        {/* Inner orbit dots */}
        <g 
          className={orbitPaused ? '' : 'animate-[spin_45s_linear_infinite]'}
          style={{ transformOrigin: '200px 200px' }}
        >
          {innerDots.map((dot, i) => (
            <circle
              key={`inner-${i}`}
              cx={dot.x}
              cy={dot.y}
              r={dot.size}
              fill={primaryColor}
              fillOpacity={isHovering ? 0.5 : 0.25}
              style={{ transition: 'fill-opacity 0.3s' }}
            />
          ))}
        </g>
        
        {/* Relationship connection lines - animated dots */}
        {relationshipLines.map(({ from, to }, i) => {
          const angleFrom = (from * 360 / orbitEntities.length - 90) * (Math.PI / 180);
          const angleTo = (to * 360 / orbitEntities.length - 90) * (Math.PI / 180);
          const r = 145;
          
          const x1 = 200 + r * Math.cos(angleFrom);
          const y1 = 200 + r * Math.sin(angleFrom);
          const x2 = 200 + r * Math.cos(angleTo);
          const y2 = 200 + r * Math.sin(angleTo);
          
          const midAngle = ((from + to) / 2 * 360 / orbitEntities.length - 90) * (Math.PI / 180);
          const cx = 200 + 50 * Math.cos(midAngle);
          const cy = 200 + 50 * Math.sin(midAngle);
          
          return (
            <g key={`rel-${i}`} filter="url(#glow-soft)">
              <path
                d={`M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`}
                fill="none"
                stroke={primaryColor}
                strokeWidth="2"
                strokeOpacity="0.6"
                strokeDasharray="6 6"
                className="animate-[dash_1s_linear_infinite]"
              />
              {/* Traveling dot */}
              <circle r="5" fill={primaryColor} fillOpacity="0.9">
                <animateMotion
                  dur="1.5s"
                  repeatCount="indefinite"
                  path={`M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`}
                />
              </circle>
            </g>
          );
        })}
        
        {/* Mouse proximity lines */}
        {isHovering && hoveredIndex === null && orbitEntities.map((_, i) => {
          const angle = (i * 360 / orbitEntities.length - 90) * (Math.PI / 180);
          const iconX = 200 + 145 * Math.cos(angle);
          const iconY = 200 + 145 * Math.sin(angle);
          const mouseX = mousePosition.x * 400;
          const mouseY = mousePosition.y * 400;
          
          const distance = Math.sqrt(Math.pow(mouseX - iconX, 2) + Math.pow(mouseY - iconY, 2));
          const opacity = Math.max(0, 0.4 - distance / 300);
          
          if (opacity <= 0.05) return null;
          
          return (
            <line
              key={`mouse-${i}`}
              x1={mouseX}
              y1={mouseY}
              x2={iconX}
              y2={iconY}
              stroke={primaryColor}
              strokeWidth="1"
              strokeOpacity={opacity}
              strokeDasharray="3 6"
            />
          );
        })}
        
        {/* Central circle */}
        <circle 
          cx="200" 
          cy="200" 
          r={isHovering ? "50" : "46"} 
          fill="url(#center-grad)"
          stroke={primaryColor}
          strokeWidth={isHovering ? "3" : "2"}
          strokeOpacity={isHovering ? "0.9" : "0.7"}
          filter="url(#glow-main)"
          style={{ transition: 'all 0.3s ease-out' }}
        />
        
        {/* Center glow pulse */}
        <circle 
          cx="200" 
          cy="200" 
          r="70" 
          fill={primaryColor}
          fillOpacity={isHovering ? "0.15" : "0.08"}
          style={{ transition: 'fill-opacity 0.3s' }}
        />
      </svg>
      
      {/* Center Icon - Organization Letter */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center transition-all duration-300"
        style={{ 
          width: isHovering ? '100px' : '92px',
          height: isHovering ? '100px' : '92px',
        }}
      >
        <div 
          className="w-full h-full rounded-full flex flex-col items-center justify-center overflow-hidden"
          style={{ 
            background: `linear-gradient(145deg, ${primaryColor}60, ${primaryColor}30)`,
            boxShadow: `
              0 0 ${isHovering ? '50px' : '30px'} ${primaryColor}40,
              inset 0 2px 10px ${primaryColor}30
            `,
            border: `2px solid ${primaryColor}80`,
          }}
        >
          {organizationLogo ? (
            <img 
              src={organizationLogo} 
              alt={organizationName}
              className="w-12 h-12 object-contain"
              style={{ filter: 'brightness(0) invert(1)', opacity: 0.9 }}
            />
          ) : (
            <span 
              className="text-4xl font-bold transition-all duration-300"
              style={{ 
                color: primaryColor,
                textShadow: `0 0 20px ${primaryColor}60`,
                filter: 'brightness(1.3)',
              }}
            >
              {centerLetter}
            </span>
          )}
          <span 
            className="text-[10px] font-medium mt-0.5 opacity-80"
            style={{ color: primaryColor }}
          >
            {entityCounts.total} Assets
          </span>
        </div>
      </div>
      
      {/* Outer entity icons */}
      <div 
        className={cn("absolute inset-0", !orbitPaused && "animate-[spin_60s_linear_infinite]")}
        style={{ transformOrigin: 'center' }}
      >
        {orbitEntities.map((entity, i) => {
          const angle = (i * 360 / orbitEntities.length - 90) * (Math.PI / 180);
          const r = 145 / 400 * 100;
          const x = 50 + r * Math.cos(angle);
          const y = 50 + r * Math.sin(angle);
          
          const config = TYPE_CONFIG[entity.type];
          const Icon = config.Icon;
          const isActive = hoveredIndex === i;
          const isRelated = activeEntity && activeEntity.type === entity.type && hoveredIndex !== i;
          
          return (
            <div
              key={entity.id}
              className="absolute group"
              style={{ 
                left: `${x}%`, 
                top: `${y}%`,
                width: '56px',
                height: '56px',
                marginLeft: '-28px',
                marginTop: '-28px',
              }}
              onMouseEnter={() => {
                setHoveredIndex(i);
                setActiveEntity(entity);
                setOrbitPaused(true);
              }}
              onMouseLeave={() => {
                setHoveredIndex(null);
                setActiveEntity(null);
                setOrbitPaused(false);
              }}
              onClick={() => handleEntityClick(entity)}
            >
              {/* Counter-rotate to keep upright */}
              <div 
                className={cn(
                  "w-full h-full flex items-center justify-center",
                  !orbitPaused && "animate-[spin_60s_linear_infinite_reverse]"
                )}
                style={{ transformOrigin: 'center' }}
              >
                {/* Icon container */}
                <div 
                  className={cn(
                    "relative p-3 rounded-2xl cursor-pointer transition-all duration-300 ease-out",
                    isActive && "z-20"
                  )}
                  style={{ 
                    background: isActive 
                      ? `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)`
                      : isRelated
                        ? `linear-gradient(135deg, ${primaryColor}70, ${primaryColor}40)`
                        : `linear-gradient(135deg, ${primaryColor}40, ${primaryColor}20)`,
                    boxShadow: isActive 
                      ? `0 0 35px ${primaryColor}70, 0 10px 40px ${primaryColor}50`
                      : isRelated
                        ? `0 0 20px ${primaryColor}50`
                        : `0 0 15px ${primaryColor}25`,
                    border: `2px solid ${primaryColor}${isActive ? '' : isRelated ? 'aa' : '50'}`,
                    transform: `scale(${isActive ? 1.35 : isRelated ? 1.15 : 1})`,
                  }}
                >
                  <Icon 
                    className="w-6 h-6 transition-all duration-300"
                    style={{ 
                      color: isActive ? '#ffffff' : primaryColor,
                      filter: isActive ? 'drop-shadow(0 0 6px rgba(255,255,255,0.6))' : 'none',
                    }}
                  />
                  
                  {/* Active indicator */}
                  {isActive && (
                    <div 
                      className="absolute -top-1 -right-1 p-1 rounded-full animate-scale-in"
                      style={{ background: primaryColor }}
                    >
                      <ExternalLink className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
                
                {/* Enhanced hover tooltip */}
                <div 
                  className={cn(
                    "absolute left-1/2 -translate-x-1/2 transition-all duration-300 pointer-events-none",
                    isActive 
                      ? "opacity-100 translate-y-0 scale-100" 
                      : "opacity-0 translate-y-4 scale-90"
                  )}
                  style={{ 
                    top: 'calc(100% + 12px)',
                    zIndex: 50,
                  }}
                >
                  <div 
                    className="px-4 py-3 rounded-xl shadow-2xl min-w-[160px]"
                    style={{ 
                      background: `linear-gradient(145deg, ${primaryColor}, ${primaryColor}dd)`,
                      boxShadow: `0 12px 40px ${primaryColor}60`,
                    }}
                  >
                    <p className="text-sm font-bold text-white truncate">
                      {entity.name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Icon className="w-3.5 h-3.5 text-white/80" />
                      <span className="text-xs text-white/80">{config.label}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-2 pt-2 border-t border-white/20">
                      <ArrowUpRight className="w-3 h-3 text-white/70" />
                      <span className="text-[10px] text-white/70">Click to open</span>
                    </div>
                  </div>
                  {/* Tooltip arrow */}
                  <div 
                    className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45"
                    style={{ background: primaryColor }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Floating ambient particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(24)].map((_, i) => {
          const baseX = 10 + (i % 6) * 15;
          const baseY = 10 + Math.floor(i / 6) * 22;
          const offsetX = isHovering ? (mousePosition.x - 0.5) * 30 : 0;
          const offsetY = isHovering ? (mousePosition.y - 0.5) * 30 : 0;
          
          return (
            <div
              key={i}
              className="absolute rounded-full transition-all duration-700"
              style={{
                left: `${baseX + offsetX * (i % 3 === 0 ? 1.3 : -0.7)}%`,
                top: `${baseY + offsetY * (i % 2 === 0 ? 1.3 : -0.7)}%`,
                width: `${1 + (i % 3)}px`,
                height: `${1 + (i % 3)}px`,
                background: primaryColor,
                opacity: isHovering ? 0.6 : 0.3,
                transform: `scale(${isHovering ? 1.5 : 1})`,
                animation: `float ${3 + (i % 4)}s ease-in-out ${(i % 5) * 0.5}s infinite alternate`,
              }}
            />
          );
        })}
      </div>
      
      {/* Mouse follower glow */}
      {isHovering && (
        <div 
          className="absolute w-48 h-48 rounded-full pointer-events-none transition-opacity duration-200"
          style={{
            left: `${mousePosition.x * 100}%`,
            top: `${mousePosition.y * 100}%`,
            transform: 'translate(-50%, -50%)',
            background: `radial-gradient(circle, ${primaryColor}30 0%, transparent 70%)`,
            filter: 'blur(30px)',
          }}
        />
      )}
      
      <style>{`
        @keyframes float {
          0% { transform: translateY(0px) translateX(0px); opacity: 0.3; }
          100% { transform: translateY(-20px) translateX(15px); opacity: 0.6; }
        }
        @keyframes dash {
          to { stroke-dashoffset: -12; }
        }
      `}</style>
    </div>
  );
};
