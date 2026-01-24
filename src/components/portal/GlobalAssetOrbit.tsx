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
  linkedGuides?: string[]; // IDs of linked products/events
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

// Distinct colors for each entity type - teal for brands, purple for products, amber for events
const TYPE_COLORS = {
  brand: '#14b8a6',    // Teal (as user requested)
  product: '#8b5cf6',  // Purple (as user requested)
  event: '#f59e0b',    // Amber for events
};

// Circular icon wrappers for each type
const BrandIcon = ({ className, style, isActive }: { className?: string; style?: React.CSSProperties; isActive?: boolean }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={isActive ? 2.5 : 2} fill={isActive ? 'currentColor' : 'none'} fillOpacity={isActive ? 0.2 : 0} />
    <path d="M12 7V12L15 15" stroke="currentColor" strokeWidth={isActive ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="12" r="2" fill="currentColor" />
  </svg>
);

const ProductIcon = ({ className, style, isActive }: { className?: string; style?: React.CSSProperties; isActive?: boolean }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={isActive ? 2.5 : 2} fill={isActive ? 'currentColor' : 'none'} fillOpacity={isActive ? 0.2 : 0} />
    <path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth={isActive ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const EventIcon = ({ className, style, isActive }: { className?: string; style?: React.CSSProperties; isActive?: boolean }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={isActive ? 2.5 : 2} fill={isActive ? 'currentColor' : 'none'} fillOpacity={isActive ? 0.25 : 0} />
    <path d="M12 8V12L14 14" stroke="currentColor" strokeWidth={isActive ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth={1} fill="none" />
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
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  const centerLetter = organizationName.charAt(0).toUpperCase();

  // Organize entities by orbit level - brands inner, products middle, events outer
  const orbitData = useMemo(() => {
    const inner = [...brands]
      .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())
      .slice(0, 6)
      .map(b => ({ ...b, type: 'brand' as const }));
    
    const middle = [...products]
      .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())
      .slice(0, 8)
      .map(p => ({ ...p, type: 'product' as const }));
    
    const outer = [...events]
      .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())
      .slice(0, 6)
      .map(e => ({ ...e, type: 'event' as const }));
    
    return { inner, middle, outer };
  }, [brands, products, events]);

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

  const handleEntityClick = (entity: LinkedEntity, e?: React.MouseEvent) => {
    // If shift/ctrl click, filter instead of navigate
    if (e?.shiftKey || e?.ctrlKey || e?.metaKey) {
      const filterType = entity.type === 'brand' ? 'brands' : entity.type === 'product' ? 'products' : 'events';
      handleFilterClick(filterType);
      return;
    }
    const config = TYPE_CONFIG[entity.type];
    navigate(`${config.path}/${entity.slug || entity.id}`);
  };

  const handleEntityFilterClick = (entity: LinkedEntity) => {
    const filterType = entity.type === 'brand' ? 'brands' : entity.type === 'product' ? 'products' : 'events';
    handleFilterClick(filterType);
  };

  const handleFilterClick = (filter: 'brands' | 'products' | 'events') => {
    const newFilter = activeFilter === filter ? 'all' : filter;
    setActiveFilter(newFilter);
    onFilterChange?.(newFilter);
  };

  // Simple connection indicator - just show a pulse on center when entity is hovered
  // (Rotating hierarchy lines don't work because orbits are in constant rotation)
  const showCenterConnection = activeEntity !== null;

  // Calculate which entities are related to the hovered entity
  const relatedEntityIds = useMemo(() => {
    if (!activeEntity) return new Set<string>();
    
    const related = new Set<string>();
    
    // If hovering a product, highlight its parent brand and any linked guides
    if (activeEntity.type === 'product') {
      if (activeEntity.parentBrandId) {
        related.add(activeEntity.parentBrandId);
      }
      activeEntity.linkedGuides?.forEach(id => related.add(id));
    }
    
    // If hovering a brand, highlight products/events that belong to it or are linked
    if (activeEntity.type === 'brand') {
      // Find products with this brand as parent
      orbitData.middle.forEach(p => {
        if (p.parentBrandId === activeEntity.id) {
          related.add(p.id);
        }
      });
      // Find events with this brand as parent
      orbitData.outer.forEach(e => {
        if (e.parentBrandId === activeEntity.id) {
          related.add(e.id);
        }
      });
      // Add any linked guides
      activeEntity.linkedGuides?.forEach(id => related.add(id));
    }
    
    // If hovering an event, highlight its parent brand and any linked guides
    if (activeEntity.type === 'event') {
      if (activeEntity.parentBrandId) {
        related.add(activeEntity.parentBrandId);
      }
      activeEntity.linkedGuides?.forEach(id => related.add(id));
    }
    
    return related;
  }, [activeEntity, orbitData]);

  const animationStyle = isPaused ? 'paused' : 'running';
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  }, []);

  return (
    <div 
      ref={containerRef}
      className={cn('relative', className)}
      onMouseEnter={() => setIsHovering(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        setIsHovering(false);
        setActiveEntity(null);
        setHoveredIndex(null);
        setHoveredOrbit(null);
        setMousePos(null);
      }}
    >
      {/* Top Left Legend - Single line horizontal layout */}
      <div 
        className="absolute top-2 left-2 z-20 flex flex-row items-center gap-1 px-2 py-1.5 rounded-full backdrop-blur-md transition-all duration-300"
        style={{ 
          background: 'rgba(0,0,0,0.5)',
          border: '1px solid rgba(255,255,255,0.15)',
        }}
      >
        <button
          onClick={() => handleFilterClick('brands')}
          className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-full transition-all duration-200",
            activeFilter === 'brands' ? 'bg-white/15' : 'hover:bg-white/10'
          )}
        >
          <div 
            className="w-3 h-3 rounded-full flex items-center justify-center"
            style={{ background: `${TYPE_COLORS.brand}40`, border: `1.5px solid ${TYPE_COLORS.brand}` }}
          >
            <BrandIcon className="w-2 h-2" style={{ color: TYPE_COLORS.brand }} />
          </div>
          <span className="text-[9px] font-medium" style={{ color: TYPE_COLORS.brand }}>
            {entityCounts.brands}
          </span>
        </button>
        
        <div className="w-px h-3 bg-white/20" />
        
        <button
          onClick={() => handleFilterClick('products')}
          className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-full transition-all duration-200",
            activeFilter === 'products' ? 'bg-white/15' : 'hover:bg-white/10'
          )}
        >
          <div 
            className="w-3 h-3 rounded-full flex items-center justify-center"
            style={{ background: `${TYPE_COLORS.product}40`, border: `1.5px solid ${TYPE_COLORS.product}` }}
          >
            <ProductIcon className="w-2 h-2" style={{ color: TYPE_COLORS.product }} />
          </div>
          <span className="text-[9px] font-medium" style={{ color: TYPE_COLORS.product }}>
            {entityCounts.products}
          </span>
        </button>
        
        <div className="w-px h-3 bg-white/20" />
        
        <button
          onClick={() => handleFilterClick('events')}
          className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-full transition-all duration-200",
            activeFilter === 'events' ? 'bg-white/15' : 'hover:bg-white/10'
          )}
        >
          <div 
            className="w-3 h-3 rounded-full flex items-center justify-center"
            style={{ background: `${TYPE_COLORS.event}40`, border: `1.5px solid ${TYPE_COLORS.event}` }}
          >
            <EventIcon className="w-2 h-2" style={{ color: TYPE_COLORS.event }} />
          </div>
          <span className="text-[9px] font-medium" style={{ color: TYPE_COLORS.event }}>
            {entityCounts.events}
          </span>
        </button>
      </div>

      {/* Inline styles for SVG animations */}
      <style>{`
        @keyframes pulse-ring {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
        }
      `}</style>

      {/* Main SVG - pointer-events none so icons can be clicked */}
      <svg viewBox="0 0 400 400" className="w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
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
        
        {/* Central circle - with pulse when entity hovered */}
        <circle 
          cx="200" 
          cy="200" 
          r="38" 
          fill="url(#center-grad)" 
          stroke={activeEntity ? TYPE_COLORS[activeEntity.type] : primaryColor} 
          strokeWidth={activeEntity ? 3 : 2} 
          strokeOpacity={activeEntity ? 0.9 : 0.6}
          style={{ transition: 'all 0.3s ease' }}
        />
        <circle cx="200" cy="200" r="50" fill={primaryColor} fillOpacity="0.08" />
        
        {/* Pulse ring when hovering an entity */}
        {activeEntity && (
          <circle 
            cx="200" 
            cy="200" 
            r="55" 
            fill="none" 
            stroke={TYPE_COLORS[activeEntity.type]} 
            strokeWidth="2"
            strokeOpacity="0.4"
            style={{ animation: 'pulse 1.5s ease-in-out infinite' }}
          />
        )}
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
      
      {/* Brand icons (inner orbit) - teal colored */}
      {orbitData.inner.length > 0 && (
        <div 
          className="absolute inset-0 pointer-events-none"
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
                isRelated={!isActive && relatedEntityIds.has(entity.id)}
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
                onClick={(e) => handleEntityClick(entity, e)}
                onFilterClick={() => handleEntityFilterClick(entity)}
                spinDuration="55s"
                spinReverse={false}
                size="md"
              />
            );
          })}
        </div>
      )}
      
      {/* Product icons (middle orbit) - purple colored */}
      {orbitData.middle.length > 0 && (
        <div 
          className="absolute inset-0 pointer-events-none"
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
                isRelated={!isActive && relatedEntityIds.has(entity.id)}
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
                onClick={(e) => handleEntityClick(entity, e)}
                onFilterClick={() => handleEntityFilterClick(entity)}
                spinDuration="70s"
                spinReverse
                size="sm"
              />
            );
          })}
        </div>
      )}
      
      {/* Event icons (outer orbit) - amber colored */}
      {orbitData.outer.length > 0 && (
        <div 
          className="absolute inset-0 pointer-events-none"
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
                isRelated={!isActive && relatedEntityIds.has(entity.id)}
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
                onClick={(e) => handleEntityClick(entity, e)}
                onFilterClick={() => handleEntityFilterClick(entity)}
                spinDuration="85s"
                spinReverse={false}
                size="sm"
              />
            );
          })}
        </div>
      )}
      
      {/* Tooltip follows mouse position */}
      <TooltipOverlay 
        entity={activeEntity} 
        containerRef={containerRef}
        mousePos={mousePos}
        onFilterClick={() => {
          if (activeEntity) {
            handleEntityFilterClick(activeEntity);
          }
        }}
        relatedCount={relatedEntityIds.size}
      />
    </div>
  );
};

// Entity Icon sub-component
interface EntityIconProps {
  entity: LinkedEntity;
  x: number;
  y: number;
  isActive: boolean;
  isRelated: boolean; // NEW: highlight if related to hovered entity
  isPaused: boolean;
  animationStyle: string;
  onHover: () => void;
  onLeave: () => void;
  onClick: (e: React.MouseEvent) => void;
  onFilterClick: () => void;
  spinDuration: string;
  spinReverse?: boolean;
  size?: 'sm' | 'md';
}

const EntityIcon = ({
  entity,
  x,
  y,
  isActive,
  isRelated,
  isPaused,
  animationStyle,
  onHover,
  onLeave,
  onClick,
  onFilterClick,
  spinDuration,
  spinReverse,
  size = 'md',
}: EntityIconProps) => {
  const config = TYPE_CONFIG[entity.type];
  const Icon = config.Icon;
  const typeColor = config.color;
  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  const circleSize = size === 'sm' ? 32 : 40;
  const boxSize = size === 'sm' ? 40 : 48;
  
  // Determine visual state: active > related > default
  const isHighlighted = isActive || isRelated;
  
  return (
    <div
      className="absolute group pointer-events-auto"
      style={{ 
        left: `${x}%`, 
        top: `${y}%`,
        width: `${boxSize}px`,
        height: `${boxSize}px`,
        marginLeft: `${-boxSize / 2}px`,
        marginTop: `${-boxSize / 2}px`,
        cursor: 'pointer',
      }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={onClick}
    >
      {/* Counter-rotation wrapper - only for the icon */}
      <div 
        className="w-full h-full flex items-center justify-center"
        style={{ 
          transformOrigin: 'center',
          animation: `spin ${spinDuration} linear infinite ${spinReverse ? '' : 'reverse'}`,
          animationPlayState: animationStyle,
        }}
      >
        {/* Circular icon container */}
        <div 
          className={cn(
            "relative rounded-full cursor-pointer transition-all duration-300 ease-out flex items-center justify-center",
            isActive && "z-20",
            isRelated && !isActive && "z-10"
          )}
          style={{ 
            width: `${circleSize}px`,
            height: `${circleSize}px`,
            background: isActive 
              ? `linear-gradient(135deg, ${typeColor}, ${typeColor}cc)`
              : isRelated
                ? `linear-gradient(135deg, ${typeColor}80, ${typeColor}60)`
                : `linear-gradient(135deg, ${typeColor}50, ${typeColor}30)`,
            boxShadow: isActive 
              ? `0 0 35px ${typeColor}80, 0 8px 32px ${typeColor}50, inset 0 1px 2px rgba(255,255,255,0.3)`
              : isRelated
                ? `0 0 30px ${typeColor}60, 0 0 50px ${typeColor}40, inset 0 1px 2px rgba(255,255,255,0.2)`
                : `0 0 15px ${typeColor}40, inset 0 1px 2px rgba(255,255,255,0.1)`,
            border: `2px solid ${typeColor}${isActive ? '' : isRelated ? '' : '90'}`,
            transform: `scale(${isActive ? 1.35 : isRelated ? 1.2 : 1})`,
          }}
        >
          <Icon 
            className={cn(iconSize, "transition-all duration-300")}
            style={{ 
              color: isActive ? '#ffffff' : isRelated ? '#ffffff' : typeColor,
              filter: isHighlighted ? 'drop-shadow(0 0 6px rgba(255,255,255,0.6))' : 'drop-shadow(0 0 2px rgba(0,0,0,0.3))',
              opacity: 1,
            }}
            isActive={isActive}
          />
          
          {isActive && (
            <div className="absolute -top-0.5 -right-0.5 p-0.5 rounded-full animate-scale-in" style={{ background: typeColor }}>
              <ExternalLink className="w-2 h-2 text-white" />
            </div>
          )}
          
          {/* Pulse ring for related items */}
          {isRelated && !isActive && (
            <div 
              className="absolute inset-[-4px] rounded-full"
              style={{ 
                border: `2px solid ${typeColor}`,
                opacity: 0.7,
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// Tooltip component rendered at container level (not inside rotating orbit)
interface TooltipOverlayProps {
  entity: LinkedEntity | null;
  containerRef: React.RefObject<HTMLDivElement>;
  mousePos: { x: number; y: number } | null;
  onFilterClick: () => void;
  relatedCount: number;
}

const TooltipOverlay = ({ entity, mousePos, onFilterClick, relatedCount }: TooltipOverlayProps) => {
  if (!entity || !mousePos) return null;
  
  const config = TYPE_CONFIG[entity.type];
  const Icon = config.Icon;
  const typeColor = config.color;
  
  return (
    <div 
      className="absolute z-[100] pointer-events-none animate-scale-in"
      style={{ 
        left: `${mousePos.x}px`,
        top: `${mousePos.y - 10}px`,
        transform: 'translate(-50%, -100%)',
      }}
    >
      <div 
        className="px-3 py-2 rounded-lg shadow-lg backdrop-blur-md pointer-events-auto"
        style={{ 
          background: `linear-gradient(145deg, ${typeColor}f0, ${typeColor}dd)`,
          boxShadow: `0 4px 20px ${typeColor}60`,
          border: '1px solid rgba(255,255,255,0.25)',
        }}
      >
        <p className="text-xs font-semibold text-white truncate max-w-[160px]">{entity.name}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <Icon className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.85)' }} />
          <span className="text-[10px] text-white/75">{config.label}</span>
          {relatedCount > 0 && (
            <span className="text-[9px] text-white/55">• {relatedCount} linked</span>
          )}
        </div>
      </div>
      {/* Arrow pointing down toward cursor */}
      <div 
        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45" 
        style={{ background: `${typeColor}dd` }} 
      />
    </div>
  );
};
