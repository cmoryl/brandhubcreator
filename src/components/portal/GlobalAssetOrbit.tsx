/**
 * GlobalAssetOrbit Component
 * Interactive globe with orbiting icons linked to actual brands, products, and events
 */

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Package,
  Calendar,
  Globe,
  Sparkles,
  ArrowUpRight,
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
  brands?: LinkedEntity[];
  products?: LinkedEntity[];
  events?: LinkedEntity[];
}

const TYPE_CONFIG = {
  brand: { Icon: Building2, label: 'Brand', path: '/brand' },
  product: { Icon: Package, label: 'Product', path: '/product' },
  event: { Icon: Calendar, label: 'Event', path: '/event' },
};

export const GlobalAssetOrbit = ({ 
  className, 
  primaryColor = '#6366f1',
  secondaryColor = '#8b5cf6',
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
    
    // Sort by updated date and take top 8
    return allEntities
      .sort((a, b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 8);
  }, [brands, products, events]);

  // Group counts for center display
  const entityCounts = useMemo(() => ({
    brands: brands.length,
    products: products.length,
    events: events.length,
    total: brands.length + products.length + events.length,
  }), [brands, products, events]);

  // Handle mouse movement with rAF
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

  // 3D transform based on mouse
  const getTransform3D = () => {
    if (!isHovering) return 'perspective(1200px) rotateX(0deg) rotateY(0deg)';
    
    const rotateX = (mousePosition.y - 0.5) * -15;
    const rotateY = (mousePosition.x - 0.5) * 15;
    
    return `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  };

  // Navigate to entity
  const handleEntityClick = (entity: LinkedEntity) => {
    const config = TYPE_CONFIG[entity.type];
    navigate(`${config.path}/${entity.slug || entity.id}`);
  };

  // Get relationship lines between same-type entities
  const getRelationshipLines = () => {
    if (hoveredIndex === null || !activeEntity) return [];
    
    const lines: { from: number; to: number; opacity: number }[] = [];
    const activeType = activeEntity.type;
    
    orbitEntities.forEach((entity, i) => {
      if (i !== hoveredIndex && entity.type === activeType) {
        lines.push({ from: hoveredIndex, to: i, opacity: 0.6 });
      }
    });
    
    return lines;
  };

  const relationshipLines = getRelationshipLines();

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
          <radialGradient id="globe-grad" cx="30%" cy="30%">
            <stop offset="0%" stopColor={primaryColor} stopOpacity={isHovering ? "0.6" : "0.4"} />
            <stop offset="50%" stopColor={secondaryColor} stopOpacity={isHovering ? "0.3" : "0.2"} />
            <stop offset="100%" stopColor={primaryColor} stopOpacity="0.05" />
          </radialGradient>
          
          <linearGradient id="orbit-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={primaryColor} stopOpacity="0.7" />
            <stop offset="50%" stopColor={secondaryColor} stopOpacity="0.4" />
            <stop offset="100%" stopColor={primaryColor} stopOpacity="0.7" />
          </linearGradient>
          
          <filter id="glow-strong" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
          <filter id="line-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        {/* Outer pulse ring */}
        <circle 
          cx="200" 
          cy="200" 
          r="185" 
          fill="none" 
          stroke={primaryColor}
          strokeWidth={isHovering ? "3" : "1"}
          strokeOpacity={isHovering ? "0.4" : "0.15"}
          strokeDasharray="12 6"
          className={orbitPaused ? '' : 'animate-[spin_90s_linear_infinite]'}
          style={{ transformOrigin: '200px 200px', transition: 'all 0.3s' }}
        />
        
        {/* Main orbit ring */}
        <circle 
          cx="200" 
          cy="200" 
          r="150" 
          fill="none" 
          stroke="url(#orbit-grad)" 
          strokeWidth={isHovering ? "3" : "2"}
          strokeDasharray={isHovering ? "10 5" : "6 4"}
          className={orbitPaused ? '' : 'animate-[spin_60s_linear_infinite]'}
          style={{ transformOrigin: '200px 200px', transition: 'all 0.3s' }}
        />
        
        {/* Middle orbit */}
        <circle 
          cx="200" 
          cy="200" 
          r="100" 
          fill="none" 
          stroke={primaryColor}
          strokeWidth="1.5"
          strokeOpacity={isHovering ? "0.5" : "0.3"}
          strokeDasharray="4 8"
          className={orbitPaused ? '' : 'animate-[spin_45s_linear_infinite_reverse]'}
          style={{ transformOrigin: '200px 200px' }}
        />
        
        {/* Inner orbit */}
        <circle 
          cx="200" 
          cy="200" 
          r="55" 
          fill="none" 
          stroke={secondaryColor}
          strokeWidth="1"
          strokeOpacity={isHovering ? "0.45" : "0.25"}
          strokeDasharray="2 6"
          className={orbitPaused ? '' : 'animate-[spin_35s_linear_infinite]'}
          style={{ transformOrigin: '200px 200px' }}
        />
        
        {/* Relationship connection lines */}
        {relationshipLines.map(({ from, to, opacity }, i) => {
          const angleFrom = (from * 360 / orbitEntities.length - 90) * (Math.PI / 180);
          const angleTo = (to * 360 / orbitEntities.length - 90) * (Math.PI / 180);
          const r = 150;
          
          const x1 = 200 + r * Math.cos(angleFrom);
          const y1 = 200 + r * Math.sin(angleFrom);
          const x2 = 200 + r * Math.cos(angleTo);
          const y2 = 200 + r * Math.sin(angleTo);
          
          // Curved path through center
          const midAngle = ((from + to) / 2 * 360 / orbitEntities.length - 90) * (Math.PI / 180);
          const cx = 200 + 60 * Math.cos(midAngle);
          const cy = 200 + 60 * Math.sin(midAngle);
          
          return (
            <g key={`rel-${i}`}>
              <path
                d={`M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`}
                fill="none"
                stroke={activeEntity?.type === 'brand' ? '#3b82f6' : activeEntity?.type === 'product' ? '#8b5cf6' : '#f59e0b'}
                strokeWidth="2.5"
                strokeOpacity={opacity}
                filter="url(#line-glow)"
                className="animate-[pulse_1.5s_ease-in-out_infinite]"
              />
              {/* Animated dot along path */}
              <circle r="4" fill={activeEntity?.type === 'brand' ? '#3b82f6' : activeEntity?.type === 'product' ? '#8b5cf6' : '#f59e0b'}>
                <animateMotion
                  dur="2s"
                  repeatCount="indefinite"
                  path={`M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`}
                />
              </circle>
            </g>
          );
        })}
        
        {/* Mouse connection lines */}
        {isHovering && orbitEntities.map((_, i) => {
          const angle = (i * 360 / orbitEntities.length - 90) * (Math.PI / 180);
          const iconX = 200 + 150 * Math.cos(angle);
          const iconY = 200 + 150 * Math.sin(angle);
          const mouseX = mousePosition.x * 400;
          const mouseY = mousePosition.y * 400;
          
          const distance = Math.sqrt(Math.pow(mouseX - iconX, 2) + Math.pow(mouseY - iconY, 2));
          const opacity = Math.max(0, 0.5 - distance / 250);
          
          if (opacity <= 0.05) return null;
          
          return (
            <line
              key={`mouse-${i}`}
              x1={mouseX}
              y1={mouseY}
              x2={iconX}
              y2={iconY}
              stroke={primaryColor}
              strokeWidth="1.5"
              strokeOpacity={opacity}
              strokeDasharray="4 4"
            />
          );
        })}
        
        {/* Central globe */}
        <circle 
          cx="200" 
          cy="200" 
          r={isHovering ? "52" : "48"} 
          fill="url(#globe-grad)"
          stroke={primaryColor}
          strokeWidth={isHovering ? "2.5" : "2"}
          strokeOpacity={isHovering ? "0.8" : "0.6"}
          style={{ transition: 'all 0.3s ease-out' }}
        />
        
        {/* Globe lines */}
        <ellipse 
          cx="200" cy="200" 
          rx={isHovering ? "52" : "48"} ry="18" 
          fill="none" stroke={primaryColor}
          strokeWidth="1" strokeOpacity={isHovering ? "0.5" : "0.3"}
          style={{ transition: 'all 0.3s' }}
        />
        <ellipse 
          cx="200" cy="200" 
          rx={isHovering ? "52" : "48"} ry="38" 
          fill="none" stroke={primaryColor}
          strokeWidth="0.75" strokeOpacity={isHovering ? "0.4" : "0.2"}
          style={{ transition: 'all 0.3s' }}
        />
        <ellipse 
          cx="200" cy="200" 
          rx="14" ry={isHovering ? "52" : "48"}
          fill="none" stroke={primaryColor}
          strokeWidth="1" strokeOpacity={isHovering ? "0.5" : "0.3"}
          style={{ transition: 'all 0.3s' }}
        />
        
        {/* Center glow */}
        <circle 
          cx="200" cy="200" r="70" 
          fill={primaryColor}
          fillOpacity={isHovering ? "0.2" : "0.1"}
          filter="url(#glow-strong)"
          style={{ transition: 'fill-opacity 0.3s' }}
        />
      </svg>
      
      {/* Central Globe with Stats */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center cursor-pointer transition-all duration-300"
        style={{ 
          width: isHovering ? '110px' : '100px',
          height: isHovering ? '110px' : '100px',
        }}
      >
        <div 
          className="w-full h-full rounded-full flex flex-col items-center justify-center"
          style={{ 
            background: `linear-gradient(135deg, ${primaryColor}50, ${secondaryColor}30)`,
            boxShadow: `0 0 ${isHovering ? '60px' : '40px'} ${primaryColor}50`,
            border: `2px solid ${primaryColor}60`,
          }}
        >
          <Globe 
            className={cn(
              "w-8 h-8 mb-1 transition-all duration-300",
              isHovering && "animate-pulse"
            )}
            style={{ color: primaryColor }}
          />
          <span className="text-lg font-bold" style={{ color: primaryColor }}>
            {entityCounts.total}
          </span>
          <span className="text-[10px] text-muted-foreground">Assets</span>
        </div>
      </div>
      
      {/* Inner sparkle icons */}
      <div 
        className={cn("absolute inset-0", !orbitPaused && "animate-[spin_30s_linear_infinite_reverse]")}
        style={{ transformOrigin: 'center' }}
      >
        {[0, 1, 2].map((i) => {
          const angle = (i * 120 - 90) * (Math.PI / 180);
          const r = 55 / 400 * 100;
          const x = 50 + r * Math.cos(angle);
          const y = 50 + r * Math.sin(angle);
          
          return (
            <div
              key={`inner-${i}`}
              className={cn(
                "absolute w-8 h-8 -ml-4 -mt-4 flex items-center justify-center",
                !orbitPaused && "animate-[spin_30s_linear_infinite]"
              )}
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <div 
                className="p-1.5 rounded-full transition-all duration-300"
                style={{ 
                  background: `${secondaryColor}40`,
                  boxShadow: `0 0 15px ${secondaryColor}30`,
                  transform: `scale(${isHovering ? 1.2 : 1})`,
                }}
              >
                <Sparkles className="w-4 h-4" style={{ color: secondaryColor }} />
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Outer entity icons */}
      <div 
        className={cn("absolute inset-0", !orbitPaused && "animate-[spin_50s_linear_infinite]")}
        style={{ transformOrigin: 'center' }}
      >
        {orbitEntities.map((entity, i) => {
          const angle = (i * 360 / orbitEntities.length - 90) * (Math.PI / 180);
          const r = 150 / 400 * 100;
          const x = 50 + r * Math.cos(angle);
          const y = 50 + r * Math.sin(angle);
          
          const config = TYPE_CONFIG[entity.type];
          const Icon = config.Icon;
          const isActive = hoveredIndex === i;
          const isRelated = activeEntity && activeEntity.type === entity.type && hoveredIndex !== i;
          
          const typeColors = {
            brand: '#3b82f6',
            product: '#8b5cf6',
            event: '#f59e0b',
          };
          const iconColor = entity.color || typeColors[entity.type];
          
          return (
            <div
              key={entity.id}
              className="absolute -ml-8 -mt-8 group"
              style={{ 
                left: `${x}%`, 
                top: `${y}%`,
                width: '64px',
                height: '64px',
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
              {/* Counter-rotate */}
              <div 
                className={cn(
                  "w-full h-full flex items-center justify-center",
                  !orbitPaused && "animate-[spin_50s_linear_infinite_reverse]"
                )}
                style={{ transformOrigin: 'center' }}
              >
                <div 
                  className={cn(
                    "relative p-3 rounded-2xl cursor-pointer transition-all duration-200",
                    isActive && "z-20"
                  )}
                  style={{ 
                    background: isActive 
                      ? `linear-gradient(135deg, ${iconColor}90, ${iconColor}60)`
                      : isRelated
                        ? `linear-gradient(135deg, ${iconColor}50, ${iconColor}30)`
                        : `linear-gradient(135deg, ${iconColor}30, ${iconColor}15)`,
                    boxShadow: isActive 
                      ? `0 0 40px ${iconColor}60, 0 8px 32px ${iconColor}40`
                      : isRelated
                        ? `0 0 25px ${iconColor}40`
                        : `0 0 20px ${iconColor}20`,
                    border: `2px solid ${iconColor}${isActive ? 'cc' : isRelated ? '80' : '40'}`,
                    transform: `scale(${isActive ? 1.4 : isRelated ? 1.2 : 1})`,
                  }}
                >
                  {/* Entity cover image or icon */}
                  {entity.coverImage ? (
                    <div 
                      className="w-6 h-6 rounded-lg bg-cover bg-center"
                      style={{ backgroundImage: `url(${entity.coverImage})` }}
                    />
                  ) : (
                    <Icon 
                      className="w-6 h-6 transition-all duration-200"
                      style={{ 
                        color: isActive ? '#fff' : iconColor,
                        filter: isActive ? 'drop-shadow(0 0 8px rgba(255,255,255,0.5))' : 'none',
                      }}
                    />
                  )}
                  
                  {/* Arrow indicator on hover */}
                  {isActive && (
                    <div className="absolute -top-1 -right-1 p-0.5 rounded-full bg-white/90">
                      <ArrowUpRight className="w-3 h-3 text-gray-800" />
                    </div>
                  )}
                </div>
                
                {/* Tooltip with entity info */}
                <div 
                  className={cn(
                    "absolute left-1/2 -translate-x-1/2 whitespace-nowrap transition-all duration-200 pointer-events-none",
                    isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                  )}
                  style={{ 
                    top: 'calc(100% + 8px)',
                    zIndex: 30,
                  }}
                >
                  <div 
                    className="px-3 py-2 rounded-xl shadow-xl"
                    style={{ 
                      background: `linear-gradient(135deg, ${iconColor}, ${iconColor}dd)`,
                      boxShadow: `0 8px 24px ${iconColor}50`,
                    }}
                  >
                    <p className="text-xs font-bold text-white truncate max-w-[140px]">
                      {entity.name}
                    </p>
                    <p className="text-[10px] text-white/80 flex items-center gap-1">
                      <Icon className="w-3 h-3" />
                      {config.label}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => {
          const baseX = 15 + (i % 5) * 18;
          const baseY = 15 + Math.floor(i / 5) * 18;
          const offsetX = isHovering ? (mousePosition.x - 0.5) * 25 : 0;
          const offsetY = isHovering ? (mousePosition.y - 0.5) * 25 : 0;
          
          return (
            <div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full transition-all duration-700"
              style={{
                left: `${baseX + offsetX * (i % 3 === 0 ? 1.2 : -0.6)}%`,
                top: `${baseY + offsetY * (i % 2 === 0 ? 1.2 : -0.6)}%`,
                background: i % 3 === 0 ? primaryColor : i % 3 === 1 ? secondaryColor : '#f59e0b',
                opacity: isHovering ? 0.7 : 0.35,
                transform: `scale(${isHovering ? 1.4 : 1})`,
                animation: `float ${3 + Math.random() * 3}s ease-in-out ${Math.random() * 2}s infinite alternate`,
              }}
            />
          );
        })}
      </div>
      
      {/* Mouse glow */}
      {isHovering && (
        <div 
          className="absolute w-40 h-40 rounded-full pointer-events-none"
          style={{
            left: `${mousePosition.x * 100}%`,
            top: `${mousePosition.y * 100}%`,
            transform: 'translate(-50%, -50%)',
            background: `radial-gradient(circle, ${primaryColor}40 0%, transparent 70%)`,
            filter: 'blur(25px)',
          }}
        />
      )}
      
      {/* Active entity detail panel */}
      {activeEntity && (
        <div 
          className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl shadow-xl backdrop-blur-sm animate-fade-in-up"
          style={{ 
            background: `linear-gradient(135deg, ${primaryColor}20, ${secondaryColor}10)`,
            border: `1px solid ${primaryColor}30`,
          }}
        >
          <p className="text-xs text-muted-foreground text-center">
            Click to view <span className="font-semibold text-foreground">{activeEntity.name}</span>
          </p>
        </div>
      )}
      
      <style>{`
        @keyframes float {
          0% { transform: translateY(0px) translateX(0px) scale(1); }
          100% { transform: translateY(-25px) translateX(18px) scale(1.1); }
        }
      `}</style>
    </div>
  );
};
