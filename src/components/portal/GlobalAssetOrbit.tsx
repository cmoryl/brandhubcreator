/**
 * GlobalAssetOrbit Component
 * Interactive orbit visualization with hierarchical entity relationships
 * - Brands orbit closest to center (direct connection to org)
 * - Products orbit in middle (connect through their parent brand)
 * - Events orbit on outer ring
 * Features click-to-filter, pause on hover, and hierarchy visualization
 */

import React, { forwardRef, useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import transperfectLogoIcon from '@/assets/transperfect-logo-icon.png';

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
  /**
   * Controlled filter value. When provided, the orbit becomes controlled by the parent.
   * This is used to keep the orbit animation perfectly in sync with the portal tabs.
   */
  filter?: 'all' | 'brands' | 'products' | 'events';
  /**
   * Whether to render the internal legend.
   * Some pages render the legend externally to avoid pointer-event conflicts.
   */
  showLegend?: boolean;
  onFilterChange?: (filter: 'all' | 'brands' | 'products' | 'events') => void;
  /**
   * Demo mode - uses generic BrandHub icon in center instead of org-specific logos
   */
  demoMode?: boolean;
}

// Distinct colors for each entity type - teal for brands, light blue for products, amber for events
const TYPE_COLORS = {
  brand: '#14b8a6',    // Teal
  product: '#38bdf8',  // Light blue (sky-400)
  event: '#f59e0b',    // Amber
};

// Circular icon wrappers for each type
type OrbitIconProps = React.SVGProps<SVGSVGElement> & { isActive?: boolean };

const BrandIcon = forwardRef<SVGSVGElement, OrbitIconProps>(({ className, style, isActive, ...props }, ref) => (
  <svg ref={ref} viewBox="0 0 24 24" fill="none" className={className} style={style} {...props}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={isActive ? 2.5 : 2} fill={isActive ? 'currentColor' : 'none'} fillOpacity={isActive ? 0.2 : 0} />
    <path d="M12 7V12L15 15" stroke="currentColor" strokeWidth={isActive ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="12" r="2" fill="currentColor" />
  </svg>
));
BrandIcon.displayName = 'BrandIcon';

const ProductIcon = forwardRef<SVGSVGElement, OrbitIconProps>(({ className, style, isActive, ...props }, ref) => (
  <svg ref={ref} viewBox="0 0 24 24" fill="none" className={className} style={style} {...props}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={isActive ? 2.5 : 2} fill={isActive ? 'currentColor' : 'none'} fillOpacity={isActive ? 0.2 : 0} />
    <path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth={isActive ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
));
ProductIcon.displayName = 'ProductIcon';

const EventIcon = forwardRef<SVGSVGElement, OrbitIconProps>(({ className, style, isActive, ...props }, ref) => (
  <svg ref={ref} viewBox="0 0 24 24" fill="none" className={className} style={style} {...props}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={isActive ? 2.5 : 2} fill={isActive ? 'currentColor' : 'none'} fillOpacity={isActive ? 0.25 : 0} />
    <path d="M12 8V12L14 14" stroke="currentColor" strokeWidth={isActive ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth={1} fill="none" />
  </svg>
));
EventIcon.displayName = 'EventIcon';

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
  filter: controlledFilter,
  showLegend = true,
  onFilterChange,
  demoMode = false,
}: GlobalAssetOrbitProps) => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [activeEntity, setActiveEntity] = useState<LinkedEntity | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoveredOrbit, setHoveredOrbit] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [internalFilter, setInternalFilter] = useState<'all' | 'brands' | 'products' | 'events'>('all');
  const activeFilter = controlledFilter ?? internalFilter;

  const [iconPos, setIconPos] = useState<{ x: number; y: number } | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Rotation offset state for cycling through all entities
  const [rotationOffset, setRotationOffset] = useState({ brands: 0, products: 0, events: 0 });

  const centerLetter = organizationName.charAt(0).toUpperCase();

  // Max visible items per orbit when showing ALL categories
  const MAX_BRANDS_ALL = 6;
  const MAX_PRODUCTS_ALL = 8;
  const MAX_EVENTS_ALL = 6;
  
  // Max items per ring when showing a single category (use multiple rings)
  const ITEMS_PER_RING_BRANDS = 6;
  const ITEMS_PER_RING_PRODUCTS = 7;
  const ITEMS_PER_RING_EVENTS = 5; // Fewer events per ring for better spread
  
  // Rotation interval (in ms) - how often to cycle visible items
  const ROTATION_INTERVAL = 8000; // 8 seconds

  // Cycle through entities when there are more than max visible (only in 'all' mode)
  useEffect(() => {
    if (isPaused || activeFilter !== 'all') return; // Don't rotate while hovering or when filtered
    
    const interval = setInterval(() => {
      setRotationOffset(prev => ({
        brands: brands.length > MAX_BRANDS_ALL ? (prev.brands + 1) % brands.length : 0,
        products: products.length > MAX_PRODUCTS_ALL ? (prev.products + 1) % products.length : 0,
        events: events.length > MAX_EVENTS_ALL ? (prev.events + 1) % events.length : 0,
      }));
    }, ROTATION_INTERVAL);
    
    return () => clearInterval(interval);
  }, [brands.length, products.length, events.length, isPaused, activeFilter]);

  // Organize entities by orbit level with rotation offset
  const orbitData = useMemo(() => {
    // Sort all entities by updated date
    const sortedBrands = [...brands]
      .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())
      .map(b => ({ ...b, type: 'brand' as const }));
    
    const sortedProducts = [...products]
      .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())
      .map(p => ({ ...p, type: 'product' as const }));
    
    const sortedEvents = [...events]
      .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())
      .map(e => ({ ...e, type: 'event' as const }));
    
    // Apply rotation offset to get visible slice (for 'all' mode)
    const getRotatedSlice = <T,>(arr: T[], offset: number, maxVisible: number): T[] => {
      if (arr.length <= maxVisible) return arr;
      const result: T[] = [];
      for (let i = 0; i < maxVisible; i++) {
        result.push(arr[(offset + i) % arr.length]);
      }
      return result;
    };
    
    // Split items into multiple rings
    const splitIntoRings = <T,>(arr: T[], itemsPerRing: number): T[][] => {
      const rings: T[][] = [];
      for (let i = 0; i < arr.length; i += itemsPerRing) {
        rings.push(arr.slice(i, i + itemsPerRing));
      }
      return rings;
    };
    
    // When filtered to a specific category, show ALL items in multiple rings
    const isFiltered = activeFilter !== 'all';
    
    return {
      // Standard orbits for 'all' view
      inner: isFiltered && activeFilter !== 'brands' ? [] : 
             isFiltered ? sortedBrands : getRotatedSlice(sortedBrands, rotationOffset.brands, MAX_BRANDS_ALL),
      middle: isFiltered && activeFilter !== 'products' ? [] : 
              isFiltered ? sortedProducts : getRotatedSlice(sortedProducts, rotationOffset.products, MAX_PRODUCTS_ALL),
      outer: isFiltered && activeFilter !== 'events' ? [] : 
             isFiltered ? sortedEvents : getRotatedSlice(sortedEvents, rotationOffset.events, MAX_EVENTS_ALL),
      // Multi-ring data for filtered views
      brandRings: activeFilter === 'brands' ? splitIntoRings(sortedBrands, ITEMS_PER_RING_BRANDS) : [],
      productRings: activeFilter === 'products' ? splitIntoRings(sortedProducts, ITEMS_PER_RING_PRODUCTS) : [],
      eventRings: activeFilter === 'events' ? splitIntoRings(sortedEvents, ITEMS_PER_RING_EVENTS) : [],
      // Keep full lists for relationship lookups
      allBrands: sortedBrands,
      allProducts: sortedProducts,
      allEvents: sortedEvents,
    };
  }, [brands, products, events, rotationOffset, activeFilter]);

  // Debug logging (only in development, removed for production)
  // useEffect(() => {
  //   console.log('[GlobalAssetOrbit] Data counts:', { ... });
  // }, []);

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
    // Debug: confirm legend clicks are firing (removed later once verified)
    console.log('[GlobalAssetOrbit] filter click:', { filter, newFilter });
    // Uncontrolled mode: maintain internal state.
    if (controlledFilter === undefined) {
      setInternalFilter(newFilter);
    }
    onFilterChange?.(newFilter);

    // Ensure any hover tooltip state doesn't interfere with perceived updates
    setShowTooltip(false);
    setActiveEntity(null);
    setHoveredIndex(null);
    setHoveredOrbit(null);
    setIconPos(null);
    setIsPaused(false);
  };

  // Delayed tooltip show to prevent flickering
  const handleEntityHover = useCallback((
    entity: LinkedEntity,
    index: number,
    orbit: string,
    pos: { x: number; y: number }
  ) => {
    // Clear any pending timeout
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }
    
    // Immediately update state for visual feedback
    setHoveredIndex(index);
    setHoveredOrbit(orbit);
    setActiveEntity(entity);
    setIsPaused(true);
    setIconPos(pos);
    
    // Delay showing the tooltip
    tooltipTimeoutRef.current = setTimeout(() => {
      setShowTooltip(true);
    }, 150); // 150ms delay
  }, []);

  const handleEntityLeave = useCallback(() => {
    // Clear any pending timeout
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
      tooltipTimeoutRef.current = null;
    }
    
    setHoveredIndex(null);
    setHoveredOrbit(null);
    setActiveEntity(null);
    setIsPaused(false);
    setIconPos(null);
    setShowTooltip(false);
  }, []);

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
      // Find products with this brand as parent (check all, not just visible)
      orbitData.allProducts.forEach(p => {
        if (p.parentBrandId === activeEntity.id) {
          related.add(p.id);
        }
      });
      // Find events with this brand as parent (check all, not just visible)
      orbitData.allEvents.forEach(e => {
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

  return (
    <div 
      ref={containerRef}
      className={cn('relative pointer-events-none', className)}
      style={{ touchAction: 'pan-x pan-y' }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => {
        setIsHovering(false);
        setActiveEntity(null);
        setHoveredIndex(null);
        setHoveredOrbit(null);
        setIconPos(null);
      }}
    >
      {showLegend && (
        <div 
          className="absolute top-2 left-2 z-[200] flex flex-row items-center gap-2 px-3 py-2 rounded-full backdrop-blur-md transition-all duration-300 pointer-events-auto"
          style={{ 
            background: 'rgba(0,0,0,0.6)',
            border: '1px solid rgba(255,255,255,0.15)',
          }}
          onClick={(e) => e.stopPropagation()}
          onPointerDownCapture={(e) => {
            // Prevent any parent gesture/overlay from stealing the pointer event
            e.stopPropagation();
          }}
        >
          <button
            type="button"
            onPointerDown={(e) => {
              e.stopPropagation();
              handleFilterClick('brands');
            }}
            onClick={(e) => {
              e.stopPropagation();
            }}
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-full transition-all duration-200 cursor-pointer",
              activeFilter === 'brands' ? 'bg-white/30 ring-1 ring-white/40' : 'hover:bg-white/10'
            )}
          >
            <div 
              className="w-3.5 h-3.5 rounded-full flex items-center justify-center"
              style={{ background: `${TYPE_COLORS.brand}40`, border: `1.5px solid ${TYPE_COLORS.brand}` }}
            >
              <BrandIcon className="w-2 h-2" style={{ color: TYPE_COLORS.brand }} />
            </div>
            <span className="text-[10px] font-medium" style={{ color: TYPE_COLORS.brand }}>
              Brands
            </span>
            <span className="text-[9px] font-medium text-white/60">({entityCounts.brands})</span>
          </button>
          
          <div className="w-px h-4 bg-white/20" />
          
          <button
            type="button"
            onPointerDown={(e) => {
              e.stopPropagation();
              handleFilterClick('products');
            }}
            onClick={(e) => {
              e.stopPropagation();
            }}
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-full transition-all duration-200 cursor-pointer",
              activeFilter === 'products' ? 'bg-white/30 ring-1 ring-white/40' : 'hover:bg-white/10'
            )}
          >
            <div 
              className="w-3.5 h-3.5 rounded-full flex items-center justify-center"
              style={{ background: `${TYPE_COLORS.product}40`, border: `1.5px solid ${TYPE_COLORS.product}` }}
            >
              <ProductIcon className="w-2 h-2" style={{ color: TYPE_COLORS.product }} />
            </div>
            <span className="text-[10px] font-medium" style={{ color: TYPE_COLORS.product }}>
              Products
            </span>
            <span className="text-[9px] font-medium text-white/60">({entityCounts.products})</span>
          </button>
          
          <div className="w-px h-4 bg-white/20" />
          
          <button
            type="button"
            onPointerDown={(e) => {
              e.stopPropagation();
              handleFilterClick('events');
            }}
            onClick={(e) => {
              e.stopPropagation();
            }}
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-full transition-all duration-200 cursor-pointer",
              activeFilter === 'events' ? 'bg-white/30 ring-1 ring-white/40' : 'hover:bg-white/10'
            )}
          >
            <div 
              className="w-3.5 h-3.5 rounded-full flex items-center justify-center"
              style={{ background: `${TYPE_COLORS.event}40`, border: `1.5px solid ${TYPE_COLORS.event}` }}
            >
              <EventIcon className="w-2 h-2" style={{ color: TYPE_COLORS.event }} />
            </div>
            <span className="text-[10px] font-medium" style={{ color: TYPE_COLORS.event }}>
              Events
            </span>
            <span className="text-[9px] font-medium text-white/60">({entityCounts.events})</span>
          </button>
        </div>
      )}

      {/* Inline styles for SVG animations */}
      <style>{`
        @keyframes pulse-ring {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
        }
      `}</style>

      {/* Main SVG - pointer-events none so icons can be clicked */}
      <svg viewBox="0 0 400 400" className="relative z-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
        <defs>
          <radialGradient id="center-grad" cx="30%" cy="30%">
            <stop offset="0%" stopColor={primaryColor} stopOpacity="0.6" />
            <stop offset="70%" stopColor={primaryColor} stopOpacity="0.3" />
            <stop offset="100%" stopColor={primaryColor} stopOpacity="0.1" />
          </radialGradient>
        </defs>
        
        {/* Outer ring dots - events */}
        <g 
          style={{ 
            transformOrigin: '200px 200px', 
            animation: `spin 90s linear infinite`, 
            animationPlayState: animationStyle,
            opacity: activeFilter === 'all' || activeFilter === 'events' ? 1 : 0.15,
            transition: 'opacity 0.3s ease',
          }}
        >
          {generateRingDots.outer.map((dot, i) => (
            <circle key={`o-${i}`} cx={dot.x} cy={dot.y} r={dot.size} fill={activeFilter === 'events' ? TYPE_COLORS.event : primaryColor} fillOpacity={dot.opacity} />
          ))}
        </g>
        
        {/* Middle ring dots - products */}
        <g 
          style={{ 
            transformOrigin: '200px 200px', 
            animation: `spin 70s linear infinite reverse`, 
            animationPlayState: animationStyle,
            opacity: activeFilter === 'all' || activeFilter === 'products' ? 1 : 0.15,
            transition: 'opacity 0.3s ease',
          }}
        >
          {generateRingDots.middle.map((dot, i) => (
            <circle key={`m-${i}`} cx={dot.x} cy={dot.y} r={dot.size} fill={activeFilter === 'products' ? TYPE_COLORS.product : primaryColor} fillOpacity={dot.opacity} />
          ))}
        </g>
        
        {/* Inner ring dots - brands */}
        <g 
          style={{ 
            transformOrigin: '200px 200px', 
            animation: `spin 50s linear infinite`, 
            animationPlayState: animationStyle,
            opacity: activeFilter === 'all' || activeFilter === 'brands' ? 1 : 0.15,
            transition: 'opacity 0.3s ease',
          }}
        >
          {generateRingDots.inner.map((dot, i) => (
            <circle key={`i-${i}`} cx={dot.x} cy={dot.y} r={dot.size} fill={activeFilter === 'brands' ? TYPE_COLORS.brand : primaryColor} fillOpacity={dot.opacity} />
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
        
        {/* Connection beam from center when hovering - shows hierarchy */}
        {activeEntity && (
          <g style={{ opacity: 0.6 }}>
            <defs>
              <linearGradient id="connection-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={primaryColor} stopOpacity="0.8" />
                <stop offset="100%" stopColor={TYPE_COLORS[activeEntity.type]} stopOpacity="0.3" />
              </linearGradient>
            </defs>
            {/* Radial pulse from center */}
            <circle 
              cx="200" 
              cy="200" 
              r="40" 
              fill="none" 
              stroke={TYPE_COLORS[activeEntity.type]} 
              strokeWidth="1.5"
              strokeOpacity="0.5"
              style={{ 
                animation: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
                transformOrigin: '200px 200px',
              }}
            />
          </g>
        )}
      </svg>
      
      {/* Center Icon - Click to reset filter */}
      <div className="absolute z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[76px] h-[76px]">
        <button
          type="button"
          onClick={() => {
            if (activeFilter !== 'all') {
              if (controlledFilter === undefined) {
                setInternalFilter('all');
              }
              onFilterChange?.('all');
            }
          }}
          className={cn(
            "group w-full h-full rounded-full flex items-center justify-center transition-all duration-300 pointer-events-auto cursor-pointer relative",
            "hover:scale-110"
          )}
          style={{ 
            background: `linear-gradient(145deg, ${primaryColor}60, ${primaryColor}30)`,
            boxShadow: `0 0 30px ${primaryColor}40`,
            border: `2px solid ${primaryColor}80`,
          }}
          title={activeFilter !== 'all' ? 'Click to show all' : organizationName}
        >
          {/* Glowing ring animation on hover */}
          <div 
            className="absolute inset-[-4px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              background: `conic-gradient(from 0deg, transparent, ${primaryColor}, transparent)`,
              animation: 'spin 2s linear infinite',
            }}
          />
          <div 
            className="absolute inset-[-2px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              boxShadow: `0 0 20px ${primaryColor}, 0 0 40px ${primaryColor}80, 0 0 60px ${primaryColor}40`,
            }}
          />
          <div 
            className="absolute inset-0 rounded-full"
            style={{ 
              background: `linear-gradient(145deg, ${primaryColor}60, ${primaryColor}30)`,
            }}
          />
          {/* Center icon: Demo mode shows org logo directly, TransPerfect shows T icon, otherwise use org logo with invert filter */}
          {demoMode && organizationLogo ? (
            <img 
              src={organizationLogo} 
              alt={organizationName} 
              className="w-12 h-12 object-contain transition-transform duration-300 hover:scale-105 relative z-10" 
              style={{ 
                filter: `drop-shadow(0 0 12px ${primaryColor}80) drop-shadow(0 0 24px ${primaryColor}40)`
              }} 
            />
          ) : organizationName?.toLowerCase() === 'transperfect' ? (
            <img 
              src={transperfectLogoIcon} 
              alt={organizationName} 
              className="w-12 h-12 object-contain transition-transform duration-300 hover:scale-105 relative z-10" 
              style={{ 
                opacity: 0.6,
                filter: `drop-shadow(0 0 12px ${primaryColor}80) drop-shadow(0 0 24px ${primaryColor}40)`
              }} 
            />
          ) : organizationLogo ? (
            <img src={organizationLogo} alt={organizationName} className="w-11 h-11 object-contain transition-transform duration-300 relative z-10" style={{ filter: `brightness(0) invert(1) drop-shadow(0 0 16px ${primaryColor}80)`, opacity: 0.6 }} />
          ) : (
            <img 
              src={transperfectLogoIcon} 
              alt={organizationName} 
              className="w-12 h-12 object-contain transition-transform duration-300 hover:scale-105 relative z-10" 
              style={{ 
                opacity: 0.6,
                filter: `drop-shadow(0 0 12px ${primaryColor}80) drop-shadow(0 0 24px ${primaryColor}40)`
              }} 
            />
          )}
        </button>
      </div>
      
      {/* Brand icons - single ring in 'all' mode, multi-ring when filtered */}
      {activeFilter === 'all' && orbitData.inner.length > 0 && (
        <div 
          className="absolute z-10 inset-0 pointer-events-none animate-fade-in"
          style={{ transformOrigin: 'center', animation: `spin 55s linear infinite reverse`, animationPlayState: animationStyle }}
        >
          {orbitData.inner.map((entity, i) => {
            const angle = (i * 360 / orbitData.inner.length - 90) * (Math.PI / 180);
            const r = 65 / 400 * 100; // Brands at 65px radius
            const x = 50 + r * Math.cos(angle);
            const y = 50 + r * Math.sin(angle);
            const isActive = hoveredIndex === i && hoveredOrbit === 'inner-0';
            
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
                containerRef={containerRef}
                onHover={(pos) => handleEntityHover(entity, i, 'inner-0', pos)}
                onLeave={handleEntityLeave}
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
      
      {/* Glowing orbit rings when filtered */}
      {activeFilter !== 'all' && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 400">
          <defs>
            <filter id="glow-filter" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          {activeFilter === 'brands' && orbitData.brandRings.map((_, ringIndex) => {
            const radius = 55 + ringIndex * 55;
            return (
              <circle
                key={`brand-glow-${ringIndex}`}
                cx="200"
                cy="200"
                r={radius}
                fill="none"
                stroke={TYPE_COLORS.brand}
                strokeWidth="1.5"
                strokeOpacity={0.4 - ringIndex * 0.08}
                filter="url(#glow-filter)"
                style={{ animation: 'pulse 3s ease-in-out infinite', animationDelay: `${ringIndex * 0.3}s` }}
              />
            );
          })}
          {activeFilter === 'products' && orbitData.productRings.map((_, ringIndex) => {
            const radius = 55 + ringIndex * 55;
            return (
              <circle
                key={`product-glow-${ringIndex}`}
                cx="200"
                cy="200"
                r={radius}
                fill="none"
                stroke={TYPE_COLORS.product}
                strokeWidth="1.5"
                strokeOpacity={0.4 - ringIndex * 0.08}
                filter="url(#glow-filter)"
                style={{ animation: 'pulse 3s ease-in-out infinite', animationDelay: `${ringIndex * 0.3}s` }}
              />
            );
          })}
          {activeFilter === 'events' && orbitData.eventRings.map((_, ringIndex) => {
            const radius = 55 + ringIndex * 55;
            return (
              <circle
                key={`event-glow-${ringIndex}`}
                cx="200"
                cy="200"
                r={radius}
                fill="none"
                stroke={TYPE_COLORS.event}
                strokeWidth="1.5"
                strokeOpacity={0.4 - ringIndex * 0.08}
                filter="url(#glow-filter)"
                style={{ animation: 'pulse 3s ease-in-out infinite', animationDelay: `${ringIndex * 0.3}s` }}
              />
            );
          })}
        </svg>
      )}

      {/* Multi-ring brands when filtered */}
      {activeFilter === 'brands' && orbitData.brandRings.map((ring, ringIndex) => {
        const baseRadius = 55 + ringIndex * 55; // Start closer, expand with more spacing
        const spinDuration = `${50 + ringIndex * 15}s`;
        const reverse = ringIndex % 2 === 0;
        
        return (
          <div 
            key={`brand-ring-${ringIndex}`}
            className="absolute z-10 inset-0 pointer-events-none animate-fade-in"
            style={{ transformOrigin: 'center', animation: `spin ${spinDuration} linear infinite ${reverse ? 'reverse' : ''}`, animationPlayState: animationStyle }}
          >
            {ring.map((entity, i) => {
              const angle = (i * 360 / ring.length - 90) * (Math.PI / 180);
              const r = baseRadius / 400 * 100;
              const x = 50 + r * Math.cos(angle);
              const y = 50 + r * Math.sin(angle);
              const isActive = hoveredIndex === i && hoveredOrbit === `brand-${ringIndex}`;
              
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
                  containerRef={containerRef}
                  onHover={(pos) => handleEntityHover(entity, i, `brand-${ringIndex}`, pos)}
                  onLeave={handleEntityLeave}
                  onClick={(e) => handleEntityClick(entity, e)}
                  onFilterClick={() => handleEntityFilterClick(entity)}
                  spinDuration={spinDuration}
                  spinReverse={!reverse}
                  size={ringIndex === 0 ? 'md' : 'sm'}
                />
              );
            })}
          </div>
        );
      })}
      
      {/* Product icons - single ring in 'all' mode, multi-ring when filtered */}
      {activeFilter === 'all' && orbitData.middle.length > 0 && (
        <div 
          className="absolute z-10 inset-0 pointer-events-none animate-fade-in"
          style={{ transformOrigin: 'center', animation: `spin 70s linear infinite`, animationPlayState: animationStyle }}
        >
          {orbitData.middle.map((entity, i) => {
            const angle = (i * 360 / orbitData.middle.length - 90) * (Math.PI / 180);
            const r = 120 / 400 * 100; // Products at 120px radius
            const x = 50 + r * Math.cos(angle);
            const y = 50 + r * Math.sin(angle);
            const isActive = hoveredIndex === i && hoveredOrbit === 'middle-0';
            
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
                containerRef={containerRef}
                onHover={(pos) => handleEntityHover(entity, i, 'middle-0', pos)}
                onLeave={handleEntityLeave}
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
      
      {/* Multi-ring products when filtered */}
      {activeFilter === 'products' && orbitData.productRings.map((ring, ringIndex) => {
        const baseRadius = 55 + ringIndex * 55; // Start closer, expand with more spacing
        const spinDuration = `${55 + ringIndex * 12}s`;
        const reverse = ringIndex % 2 === 1;
        
        return (
          <div 
            key={`product-ring-${ringIndex}`}
            className="absolute z-10 inset-0 pointer-events-none animate-fade-in"
            style={{ transformOrigin: 'center', animation: `spin ${spinDuration} linear infinite ${reverse ? 'reverse' : ''}`, animationPlayState: animationStyle }}
          >
            {ring.map((entity, i) => {
              const angle = (i * 360 / ring.length - 90) * (Math.PI / 180);
              const r = baseRadius / 400 * 100;
              const x = 50 + r * Math.cos(angle);
              const y = 50 + r * Math.sin(angle);
              const isActive = hoveredIndex === i && hoveredOrbit === `product-${ringIndex}`;
              
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
                  containerRef={containerRef}
                  onHover={(pos) => handleEntityHover(entity, i, `product-${ringIndex}`, pos)}
                  onLeave={handleEntityLeave}
                  onClick={(e) => handleEntityClick(entity, e)}
                  onFilterClick={() => handleEntityFilterClick(entity)}
                  spinDuration={spinDuration}
                  spinReverse={!reverse}
                  size={ringIndex === 0 ? 'md' : 'sm'}
                />
              );
            })}
          </div>
        );
      })}
      
      {/* Event icons - single ring in 'all' mode, multi-ring when filtered */}
      {activeFilter === 'all' && orbitData.outer.length > 0 && (
        <div 
          className="absolute z-10 inset-0 pointer-events-none animate-fade-in"
          style={{ transformOrigin: 'center', animation: `spin 85s linear infinite reverse`, animationPlayState: animationStyle }}
        >
          {orbitData.outer.map((entity, i) => {
            const angle = (i * 360 / orbitData.outer.length - 90) * (Math.PI / 180);
            const r = 175 / 400 * 100; // Events at 175px radius - outermost
            const x = 50 + r * Math.cos(angle);
            const y = 50 + r * Math.sin(angle);
            const isActive = hoveredIndex === i && hoveredOrbit === 'outer-0';
            
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
                containerRef={containerRef}
                onHover={(pos) => handleEntityHover(entity, i, 'outer-0', pos)}
                onLeave={handleEntityLeave}
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
      
      {/* Multi-ring events when filtered */}
      {activeFilter === 'events' && orbitData.eventRings.map((ring, ringIndex) => {
        const baseRadius = 55 + ringIndex * 55; // Start closer, expand with more spacing
        const spinDuration = `${60 + ringIndex * 15}s`;
        const reverse = ringIndex % 2 === 0;
        
        return (
          <div 
            key={`event-ring-${ringIndex}`}
            className="absolute z-10 inset-0 pointer-events-none animate-fade-in"
            style={{ transformOrigin: 'center', animation: `spin ${spinDuration} linear infinite ${reverse ? 'reverse' : ''}`, animationPlayState: animationStyle }}
          >
            {ring.map((entity, i) => {
              const angle = (i * 360 / ring.length - 90) * (Math.PI / 180);
              const r = baseRadius / 400 * 100;
              const x = 50 + r * Math.cos(angle);
              const y = 50 + r * Math.sin(angle);
              const isActive = hoveredIndex === i && hoveredOrbit === `event-${ringIndex}`;
              
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
                  containerRef={containerRef}
                  onHover={(pos) => handleEntityHover(entity, i, `event-${ringIndex}`, pos)}
                  onLeave={handleEntityLeave}
                  onClick={(e) => handleEntityClick(entity, e)}
                  onFilterClick={() => handleEntityFilterClick(entity)}
                  spinDuration={spinDuration}
                  spinReverse={!reverse}
                  size={ringIndex === 0 ? 'md' : 'sm'}
                />
              );
            })}
          </div>
        );
      })}
      
      {/* Tooltip appears above hovered icon with delay */}
      {showTooltip && (
        <TooltipOverlay 
          entity={activeEntity} 
          containerRef={containerRef}
          iconPos={iconPos}
          onFilterClick={() => {
            if (activeEntity) {
              handleEntityFilterClick(activeEntity);
            }
          }}
          relatedCount={relatedEntityIds.size}
        />
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
  isRelated: boolean;
  isPaused: boolean;
  animationStyle: string;
  onHover: (iconPos: { x: number; y: number }) => void;
  onLeave: () => void;
  onClick: (e: React.MouseEvent) => void;
  onFilterClick: () => void;
  spinDuration: string;
  spinReverse?: boolean;
  size?: 'sm' | 'md';
  containerRef: React.RefObject<HTMLDivElement>;
}

const EntityIcon = React.forwardRef<HTMLDivElement, EntityIconProps>(({
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
  containerRef,
}, ref) => {
  const iconRef = useRef<HTMLDivElement>(null);
  const config = TYPE_CONFIG[entity.type];
  const Icon = config.Icon;
  const typeColor = config.color;
  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  const circleSize = size === 'sm' ? 32 : 40;
  const boxSize = size === 'sm' ? 40 : 48;
  
  // Determine visual state: active > related > default
  const isHighlighted = isActive || isRelated;

  const handleMouseEnter = useCallback(() => {
    if (iconRef.current && containerRef.current) {
      const iconRect = iconRef.current.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      onHover({
        x: iconRect.left - containerRect.left + iconRect.width / 2,
        y: iconRect.top - containerRect.top + iconRect.height / 2, // Center of icon
      });
    }
  }, [onHover, containerRef]);
  
  return (
    <div
      ref={iconRef}
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
      onMouseEnter={handleMouseEnter}
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
});
EntityIcon.displayName = 'EntityIcon';

// Tooltip component rendered at container level (not inside rotating orbit)
interface TooltipOverlayProps {
  entity: LinkedEntity | null;
  containerRef: React.RefObject<HTMLDivElement>;
  iconPos: { x: number; y: number } | null;
  onFilterClick: () => void;
  relatedCount: number;
};

const TooltipOverlay = React.forwardRef<HTMLDivElement, TooltipOverlayProps>(
  ({ entity, iconPos, relatedCount }, ref) => {
  if (!entity || !iconPos) return null;
  
  const config = TYPE_CONFIG[entity.type];
  const Icon = config.Icon;
  const typeColor = config.color;
  
  return (
    <div 
      className="absolute z-[100] pointer-events-none animate-scale-in"
      style={{ 
        left: `${iconPos.x}px`,
        top: `${iconPos.y}px`,
        transform: 'translate(-50%, -50%)', // Center over the icon
      }}
    >
      <div 
        className="px-3 py-2 rounded-lg shadow-2xl backdrop-blur-md"
        style={{ 
          background: `linear-gradient(145deg, ${typeColor}f5, ${typeColor}e8)`,
          boxShadow: `0 8px 32px ${typeColor}80, 0 0 60px ${typeColor}40`,
          border: '1px solid rgba(255,255,255,0.3)',
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
    </div>
  );
});
TooltipOverlay.displayName = 'TooltipOverlay';
