/**
 * GlobalAssetOrbit Component
 * Interactive orbit visualization with hierarchical entity relationships
 * - Brands orbit closest to center (direct connection to org)
 * - Products orbit in middle (connect through their parent brand)
 * - Events orbit on outer ring
 * Features click-to-filter, pause on hover, and hierarchy visualization
 */

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LinkedEntity {
  id: string;
  name: string;
  slug?: string;
  type: 'brand' | 'product' | 'event';
  updatedAt?: string;
  coverImage?: string;
  color?: string;
  parentBrandId?: string;
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
  onFilterChange?: (filter: 'all' | 'brands' | 'products' | 'events') => void;
}

// Distinct colors for each entity type
const TYPE_COLORS = {
  brand: '#0ea5e9',    // Sky blue
  product: '#8b5cf6',  // Purple
  event: '#f59e0b',    // Amber
};

// Stylized SVG icons for each type
const BrandIcon = ({ className, style, isActive }: { className?: string; style?: React.CSSProperties; isActive?: boolean }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <path 
      d="M12 2L4 8L6 18H18L20 8L12 2Z" 
      stroke="currentColor" 
      strokeWidth={isActive ? 2.5 : 2}
      strokeLinejoin="round"
      fill={isActive ? 'currentColor' : 'none'}
      fillOpacity={isActive ? 0.2 : 0}
    />
    <path 
      d="M12 2V10M4 8L12 10M20 8L12 10" 
      stroke="currentColor" 
      strokeWidth={isActive ? 2 : 1.5}
      strokeLinecap="round"
    />
    <circle cx="12" cy="14" r="2" fill="currentColor" />
  </svg>
);

const ProductIcon = ({ className, style, isActive }: { className?: string; style?: React.CSSProperties; isActive?: boolean }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <path 
      d="M12 2L21 7V17L12 22L3 17V7L12 2Z" 
      stroke="currentColor" 
      strokeWidth={isActive ? 2.5 : 2}
      strokeLinejoin="round"
      fill={isActive ? 'currentColor' : 'none'}
      fillOpacity={isActive ? 0.2 : 0}
    />
    <path 
      d="M12 22V12M3 7L12 12M21 7L12 12" 
      stroke="currentColor" 
      strokeWidth={isActive ? 2 : 1.5}
      strokeLinecap="round"
    />
  </svg>
);

const EventIcon = ({ className, style, isActive }: { className?: string; style?: React.CSSProperties; isActive?: boolean }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <path 
      d="M12 2L14 9H21L15.5 13L17.5 21L12 16L6.5 21L8.5 13L3 9H10L12 2Z" 
      stroke="currentColor" 
      strokeWidth={isActive ? 2.5 : 2}
      strokeLinejoin="round"
      fill={isActive ? 'currentColor' : 'none'}
      fillOpacity={isActive ? 0.25 : 0}
    />
  </svg>
);

const TYPE_CONFIG = {
  brand: { Icon: BrandIcon, label: 'Brand Guide', path: '/brand', color: TYPE_COLORS.brand },
  product: { Icon: ProductIcon, label: 'Product Guide', path: '/product', color: TYPE_COLORS.product },
  event: { Icon: EventIcon, label: 'Event Kit', path: '/event', color: TYPE_COLORS.event },
};

// Seeded random for consistent patterns
const seededRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

export const GlobalAssetOrbit = ({ 
  className, 
  primaryColor = '#6366f1',
  organizationName = 'Brand Hub',
  organizationLogo,
  brands = [],
  products = [],
  events = [],
  onFilterChange,
}: GlobalAssetOrbitProps) => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [activeEntity, setActiveEntity] = useState<LinkedEntity | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoveredOrbit, setHoveredOrbit] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'brands' | 'products' | 'events'>('all');

  const centerLetter = organizationName.charAt(0).toUpperCase();

  // Organize entities by orbit level
  const orbitData = useMemo(() => ({
    inner: [...brands]
      .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())
      .slice(0, 6)
      .map(b => ({ ...b, type: 'brand' as const })),
    middle: [...products]
      .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())
      .slice(0, 8)
      .map(p => ({ ...p, type: 'product' as const })),
    outer: [...events]
      .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())
      .slice(0, 6)
      .map(e => ({ ...e, type: 'event' as const })),
  }), [brands, products, events]);

  const entityCounts = useMemo(() => ({
    brands: brands.length,
    products: products.length,
    events: events.length,
    total: brands.length + products.length + events.length,
  }), [brands, products, events]);

  // Generate orbit ring dots
  const generateRingDots = useMemo(() => {
    const generateRing = (r: number, count: number, seed: number) => {
      const dots = [];
      for (let i = 0; i < count; i++) {
        const angle = (i * 360 / count) * (Math.PI / 180);
        const radiusVar = seededRandom(seed + i * 13) * 4 - 2;
        const x = 200 + (r + radiusVar) * Math.cos(angle);
        const y = 200 + (r + radiusVar) * Math.sin(angle);
        const size = 0.8 + seededRandom(seed + i * 17) * 1.5;
        const opacity = 0.15 + seededRandom(seed + i * 23) * 0.25;
        dots.push({ x, y, size, opacity });
      }
      return dots;
    };
    return {
      outer: generateRing(155, 40, 1),
      middle: generateRing(115, 32, 2),
      inner: generateRing(75, 24, 3),
    };
  }, []);

  const handleEntityClick = (entity: LinkedEntity) => {
    const config = TYPE_CONFIG[entity.type];
    navigate(`${config.path}/${entity.slug || entity.id}`);
  };

  const handleFilterClick = (filter: 'brands' | 'products' | 'events') => {
    const newFilter = activeFilter === filter ? 'all' : filter;
    setActiveFilter(newFilter);
    onFilterChange?.(newFilter);
  };

  // Get hierarchy lines for hovered entity
  const hierarchyLines = useMemo(() => {
    if (!activeEntity || hoveredIndex === null) return [];
    
    const lines: { from: { x: number; y: number }; to: { x: number; y: number }; color: string }[] = [];
    
    const getPos = (orbit: string, index: number, total: number) => {
      const radii: Record<string, number> = { inner: 75, middle: 115, outer: 155 };
      const r = radii[orbit] || 100;
      const angle = (index * 360 / total - 90) * (Math.PI / 180);
      return { x: 200 + r * Math.cos(angle), y: 200 + r * Math.sin(angle) };
    };

    const entityColor = TYPE_COLORS[activeEntity.type];
    const hoveredPos = getPos(
      activeEntity.type === 'brand' ? 'inner' : activeEntity.type === 'product' ? 'middle' : 'outer',
      hoveredIndex,
      orbitData[activeEntity.type === 'brand' ? 'inner' : activeEntity.type === 'product' ? 'middle' : 'outer'].length
    );

    if (activeEntity.type === 'product' && activeEntity.parentBrandId) {
      // Product -> Parent Brand -> Center
      const parentBrandIndex = orbitData.inner.findIndex(b => b.id === activeEntity.parentBrandId);
      if (parentBrandIndex >= 0) {
        const brandPos = getPos('inner', parentBrandIndex, orbitData.inner.length);
        lines.push({ from: hoveredPos, to: brandPos, color: entityColor });
        lines.push({ from: brandPos, to: { x: 200, y: 200 }, color: TYPE_COLORS.brand });
      } else {
        lines.push({ from: hoveredPos, to: { x: 200, y: 200 }, color: entityColor });
      }
    } else if (activeEntity.type === 'brand') {
      // Brand -> Center
      lines.push({ from: hoveredPos, to: { x: 200, y: 200 }, color: entityColor });
      // Brand -> Child Products
      orbitData.middle.forEach((p, i) => {
        if (p.parentBrandId === activeEntity.id) {
          const productPos = getPos('middle', i, orbitData.middle.length);
          lines.push({ from: hoveredPos, to: productPos, color: TYPE_COLORS.product });
        }
      });
    } else if (activeEntity.type === 'event') {
      // Event -> Parent Brand or Center
      if (activeEntity.parentBrandId) {
        const parentBrandIndex = orbitData.inner.findIndex(b => b.id === activeEntity.parentBrandId);
        if (parentBrandIndex >= 0) {
          const brandPos = getPos('inner', parentBrandIndex, orbitData.inner.length);
          lines.push({ from: hoveredPos, to: brandPos, color: entityColor });
          lines.push({ from: brandPos, to: { x: 200, y: 200 }, color: TYPE_COLORS.brand });
        } else {
          lines.push({ from: hoveredPos, to: { x: 200, y: 200 }, color: entityColor });
        }
      } else {
        lines.push({ from: hoveredPos, to: { x: 200, y: 200 }, color: entityColor });
      }
    }

    return lines;
  }, [activeEntity, hoveredIndex, orbitData]);

  const animationStyle = isPaused ? 'paused' : 'running';

  return (
    <div 
      ref={containerRef}
      className={cn('relative', className)}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => {
        setIsHovering(false);
        setActiveEntity(null);
        setHoveredIndex(null);
        setHoveredOrbit(null);
      }}
    >
      {/* Top Left Legend with Click-to-Filter */}
      <div 
        className="absolute top-2 left-2 z-20 flex flex-col gap-1 p-2 rounded-lg backdrop-blur-md transition-all duration-300"
        style={{ 
          background: 'rgba(0,0,0,0.4)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <button
          onClick={() => handleFilterClick('brands')}
          className={cn(
            "flex items-center gap-2 px-2 py-1 rounded-md transition-all duration-200 text-left",
            activeFilter === 'brands' ? 'bg-white/10' : 'hover:bg-white/5'
          )}
        >
          <div 
            className="w-4 h-4 rounded flex items-center justify-center"
            style={{ background: `${TYPE_COLORS.brand}30`, border: `1px solid ${TYPE_COLORS.brand}` }}
          >
            <BrandIcon className="w-2.5 h-2.5" style={{ color: TYPE_COLORS.brand }} />
          </div>
          <span className="text-[10px] font-medium" style={{ color: TYPE_COLORS.brand }}>
            Brands ({entityCounts.brands})
          </span>
        </button>
        
        <button
          onClick={() => handleFilterClick('products')}
          className={cn(
            "flex items-center gap-2 px-2 py-1 rounded-md transition-all duration-200 text-left",
            activeFilter === 'products' ? 'bg-white/10' : 'hover:bg-white/5'
          )}
        >
          <div 
            className="w-4 h-4 rounded flex items-center justify-center"
            style={{ background: `${TYPE_COLORS.product}30`, border: `1px solid ${TYPE_COLORS.product}` }}
          >
            <ProductIcon className="w-2.5 h-2.5" style={{ color: TYPE_COLORS.product }} />
          </div>
          <span className="text-[10px] font-medium" style={{ color: TYPE_COLORS.product }}>
            Products ({entityCounts.products})
          </span>
        </button>
        
        <button
          onClick={() => handleFilterClick('events')}
          className={cn(
            "flex items-center gap-2 px-2 py-1 rounded-md transition-all duration-200 text-left",
            activeFilter === 'events' ? 'bg-white/10' : 'hover:bg-white/5'
          )}
        >
          <div 
            className="w-4 h-4 rounded flex items-center justify-center"
            style={{ background: `${TYPE_COLORS.event}30`, border: `1px solid ${TYPE_COLORS.event}` }}
          >
            <EventIcon className="w-2.5 h-2.5" style={{ color: TYPE_COLORS.event }} />
          </div>
          <span className="text-[10px] font-medium" style={{ color: TYPE_COLORS.event }}>
            Events ({entityCounts.events})
          </span>
        </button>
      </div>

      {/* Main SVG */}
      <svg viewBox="0 0 400 400" className="w-full h-full" style={{ overflow: 'visible' }}>
        <defs>
          <radialGradient id="center-grad" cx="30%" cy="30%">
            <stop offset="0%" stopColor={primaryColor} stopOpacity="0.6" />
            <stop offset="70%" stopColor={primaryColor} stopOpacity="0.3" />
            <stop offset="100%" stopColor={primaryColor} stopOpacity="0.1" />
          </radialGradient>
        </defs>
        
        {/* Outer ring dots */}
        <g style={{ transformOrigin: '200px 200px', animation: `spin 90s linear infinite`, animationPlayState: animationStyle }}>
          {generateRingDots.outer.map((dot, i) => (
            <circle key={`o-${i}`} cx={dot.x} cy={dot.y} r={dot.size} fill={primaryColor} fillOpacity={dot.opacity} />
          ))}
        </g>
        
        {/* Middle ring dots */}
        <g style={{ transformOrigin: '200px 200px', animation: `spin 70s linear infinite reverse`, animationPlayState: animationStyle }}>
          {generateRingDots.middle.map((dot, i) => (
            <circle key={`m-${i}`} cx={dot.x} cy={dot.y} r={dot.size} fill={primaryColor} fillOpacity={dot.opacity} />
          ))}
        </g>
        
        {/* Inner ring dots */}
        <g style={{ transformOrigin: '200px 200px', animation: `spin 50s linear infinite`, animationPlayState: animationStyle }}>
          {generateRingDots.inner.map((dot, i) => (
            <circle key={`i-${i}`} cx={dot.x} cy={dot.y} r={dot.size} fill={primaryColor} fillOpacity={dot.opacity} />
          ))}
        </g>
        
        {/* Hierarchy connection dots */}
        {hierarchyLines.map((line, i) => {
          const pathD = `M ${line.from.x} ${line.from.y} Q ${(line.from.x + line.to.x) / 2 + (200 - (line.from.x + line.to.x) / 2) * 0.3} ${(line.from.y + line.to.y) / 2 + (200 - (line.from.y + line.to.y) / 2) * 0.3} ${line.to.x} ${line.to.y}`;
          return (
            <g key={`line-${i}`}>
              {[0, 0.25, 0.5, 0.75].map((offset, dotIdx) => (
                <circle key={`dot-${dotIdx}`} r={1.5 - dotIdx * 0.2} fill={line.color} fillOpacity={0.8 - dotIdx * 0.15}>
                  <animateMotion dur="2s" repeatCount="indefinite" begin={`${offset * 2}s`} path={pathD} />
                </circle>
              ))}
            </g>
          );
        })}
        
        {/* Central circle */}
        <circle cx="200" cy="200" r="38" fill="url(#center-grad)" stroke={primaryColor} strokeWidth="2" strokeOpacity="0.6" />
        <circle cx="200" cy="200" r="50" fill={primaryColor} fillOpacity="0.08" />
      </svg>
      
      {/* Center Icon */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[76px] h-[76px]">
        <div 
          className="w-full h-full rounded-full flex flex-col items-center justify-center"
          style={{ 
            background: `linear-gradient(145deg, ${primaryColor}60, ${primaryColor}30)`,
            boxShadow: `0 0 30px ${primaryColor}40`,
            border: `2px solid ${primaryColor}80`,
          }}
        >
          {organizationLogo ? (
            <img src={organizationLogo} alt={organizationName} className="w-10 h-10 object-contain" style={{ filter: 'brightness(0) invert(1)', opacity: 0.9 }} />
          ) : (
            <span className="text-3xl font-bold" style={{ color: primaryColor, textShadow: `0 0 20px ${primaryColor}60`, filter: 'brightness(1.3)' }}>
              {centerLetter}
            </span>
          )}
          <span className="text-[9px] font-medium opacity-70" style={{ color: primaryColor }}>
            {entityCounts.total} Assets
          </span>
        </div>
      </div>
      
      {/* Brand icons (inner orbit) */}
      {orbitData.inner.length > 0 && (
        <div 
          className="absolute inset-0"
          style={{ transformOrigin: 'center', animation: `spin 55s linear infinite reverse`, animationPlayState: animationStyle }}
        >
          {orbitData.inner.map((entity, i) => {
            const angle = (i * 360 / orbitData.inner.length - 90) * (Math.PI / 180);
            const r = 75 / 400 * 100;
            const x = 50 + r * Math.cos(angle);
            const y = 50 + r * Math.sin(angle);
            const isActive = hoveredIndex === i && hoveredOrbit === 'inner';
            
            return (
              <EntityIcon
                key={entity.id}
                entity={entity}
                x={x}
                y={y}
                isActive={isActive}
                isPaused={isPaused}
                animationStyle={animationStyle}
                onHover={() => {
                  setHoveredIndex(i);
                  setHoveredOrbit('inner');
                  setActiveEntity(entity);
                  setIsPaused(true);
                }}
                onLeave={() => {
                  setHoveredIndex(null);
                  setHoveredOrbit(null);
                  setActiveEntity(null);
                  setIsPaused(false);
                }}
                onClick={() => handleEntityClick(entity)}
                spinDuration="55s"
                spinReverse={false}
                size="md"
              />
            );
          })}
        </div>
      )}
      
      {/* Product icons (middle orbit) */}
      {orbitData.middle.length > 0 && (
        <div 
          className="absolute inset-0"
          style={{ transformOrigin: 'center', animation: `spin 70s linear infinite`, animationPlayState: animationStyle }}
        >
          {orbitData.middle.map((entity, i) => {
            const angle = (i * 360 / orbitData.middle.length - 90) * (Math.PI / 180);
            const r = 115 / 400 * 100;
            const x = 50 + r * Math.cos(angle);
            const y = 50 + r * Math.sin(angle);
            const isActive = hoveredIndex === i && hoveredOrbit === 'middle';
            
            return (
              <EntityIcon
                key={entity.id}
                entity={entity}
                x={x}
                y={y}
                isActive={isActive}
                isPaused={isPaused}
                animationStyle={animationStyle}
                onHover={() => {
                  setHoveredIndex(i);
                  setHoveredOrbit('middle');
                  setActiveEntity(entity);
                  setIsPaused(true);
                }}
                onLeave={() => {
                  setHoveredIndex(null);
                  setHoveredOrbit(null);
                  setActiveEntity(null);
                  setIsPaused(false);
                }}
                onClick={() => handleEntityClick(entity)}
                spinDuration="70s"
                spinReverse
                size="sm"
              />
            );
          })}
        </div>
      )}
      
      {/* Event icons (outer orbit) */}
      {orbitData.outer.length > 0 && (
        <div 
          className="absolute inset-0"
          style={{ transformOrigin: 'center', animation: `spin 85s linear infinite reverse`, animationPlayState: animationStyle }}
        >
          {orbitData.outer.map((entity, i) => {
            const angle = (i * 360 / orbitData.outer.length - 90) * (Math.PI / 180);
            const r = 155 / 400 * 100;
            const x = 50 + r * Math.cos(angle);
            const y = 50 + r * Math.sin(angle);
            const isActive = hoveredIndex === i && hoveredOrbit === 'outer';
            
            return (
              <EntityIcon
                key={entity.id}
                entity={entity}
                x={x}
                y={y}
                isActive={isActive}
                isPaused={isPaused}
                animationStyle={animationStyle}
                onHover={() => {
                  setHoveredIndex(i);
                  setHoveredOrbit('outer');
                  setActiveEntity(entity);
                  setIsPaused(true);
                }}
                onLeave={() => {
                  setHoveredIndex(null);
                  setHoveredOrbit(null);
                  setActiveEntity(null);
                  setIsPaused(false);
                }}
                onClick={() => handleEntityClick(entity)}
                spinDuration="85s"
                spinReverse={false}
                size="sm"
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

// Entity Icon sub-component
interface EntityIconProps {
  entity: LinkedEntity;
  x: number;
  y: number;
  isActive: boolean;
  isPaused: boolean;
  animationStyle: string;
  onHover: () => void;
  onLeave: () => void;
  onClick: () => void;
  spinDuration: string;
  spinReverse?: boolean;
  size?: 'sm' | 'md';
}

const EntityIcon = ({
  entity,
  x,
  y,
  isActive,
  isPaused,
  animationStyle,
  onHover,
  onLeave,
  onClick,
  spinDuration,
  spinReverse,
  size = 'md',
}: EntityIconProps) => {
  const config = TYPE_CONFIG[entity.type];
  const Icon = config.Icon;
  const typeColor = config.color;
  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  const padding = size === 'sm' ? 'p-2' : 'p-2.5';
  const boxSize = size === 'sm' ? 40 : 48;
  
  return (
    <div
      className="absolute group"
      style={{ 
        left: `${x}%`, 
        top: `${y}%`,
        width: `${boxSize}px`,
        height: `${boxSize}px`,
        marginLeft: `${-boxSize / 2}px`,
        marginTop: `${-boxSize / 2}px`,
      }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={onClick}
    >
      {/* Counter-rotation wrapper */}
      <div 
        className="w-full h-full flex items-center justify-center"
        style={{ 
          transformOrigin: 'center',
          animation: `spin ${spinDuration} linear infinite ${spinReverse ? '' : 'reverse'}`,
          animationPlayState: animationStyle,
        }}
      >
        <div 
          className={cn("relative rounded-xl cursor-pointer transition-all duration-300 ease-out", padding, isActive && "z-20")}
          style={{ 
            background: isActive 
              ? `linear-gradient(135deg, ${typeColor}, ${typeColor}cc)`
              : `linear-gradient(135deg, ${typeColor}35, ${typeColor}15)`,
            boxShadow: isActive 
              ? `0 0 30px ${typeColor}60, 0 8px 32px ${typeColor}40`
              : `0 0 12px ${typeColor}20`,
            border: `1.5px solid ${typeColor}${isActive ? '' : '50'}`,
            transform: `scale(${isActive ? 1.4 : 1})`,
          }}
        >
          <Icon 
            className={cn(iconSize, "transition-all duration-300")}
            style={{ 
              color: isActive ? '#ffffff' : typeColor,
              filter: isActive ? 'drop-shadow(0 0 5px rgba(255,255,255,0.5))' : 'none',
            }}
            isActive={isActive}
          />
          
          {isActive && (
            <div className="absolute -top-1 -right-1 p-0.5 rounded-full animate-scale-in" style={{ background: typeColor }}>
              <ExternalLink className="w-2.5 h-2.5 text-white" />
            </div>
          )}
        </div>
        
        {/* Tooltip */}
        <div 
          className={cn(
            "absolute left-1/2 -translate-x-1/2 transition-all duration-300 pointer-events-none",
            isActive ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-3 scale-90"
          )}
          style={{ top: 'calc(100% + 10px)', zIndex: 50 }}
        >
          <div 
            className="px-3 py-2 rounded-lg shadow-xl min-w-[130px]"
            style={{ 
              background: `linear-gradient(145deg, ${typeColor}, ${typeColor}dd)`,
              boxShadow: `0 10px 30px ${typeColor}50`,
            }}
          >
            <p className="text-xs font-bold text-white truncate">{entity.name}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <Icon className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.8)' }} />
              <span className="text-[10px] text-white/80">{config.label}</span>
            </div>
            <div className="flex items-center gap-1 mt-1.5 pt-1.5 border-t border-white/20">
              <ArrowUpRight className="w-2.5 h-2.5 text-white/60" />
              <span className="text-[9px] text-white/60">Click to open</span>
            </div>
          </div>
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45" style={{ background: typeColor }} />
        </div>
      </div>
    </div>
  );
};
