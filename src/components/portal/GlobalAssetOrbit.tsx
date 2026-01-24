/**
 * GlobalAssetOrbit Component
 * Interactive globe with hierarchical entity relationships
 * - Brands orbit closest to center (direct connection to org)
 * - Products orbit in middle (connect through their parent brand)
 * - Events orbit on outer ring
 * Features randomized dot patterns and relationship visualization
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
    {/* Abstract crown/diamond shape for brands */}
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
    {/* Abstract hexagonal/cube shape for products */}
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
    {/* Abstract starburst/spark shape for events */}
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
  brand: { Icon: BrandIcon, label: 'Brand Guide', path: '/brand', orbit: 'inner', color: TYPE_COLORS.brand },
  product: { Icon: ProductIcon, label: 'Product Guide', path: '/product', orbit: 'middle', color: TYPE_COLORS.product },
  event: { Icon: EventIcon, label: 'Event Kit', path: '/event', orbit: 'outer', color: TYPE_COLORS.event },
};

// Seeded random for consistent but varied patterns
const seededRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
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
  const [hoveredOrbit, setHoveredOrbit] = useState<string | null>(null);
  // Removed orbitPaused - rotation continues always
  const animationFrameRef = useRef<number>();

  // Get first letter for center
  const centerLetter = organizationName.charAt(0).toUpperCase();

  // Organize entities by orbit level
  const orbitData = useMemo(() => {
    const sortedBrands = [...brands]
      .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())
      .slice(0, 6);
    
    const sortedProducts = [...products]
      .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())
      .slice(0, 8);
    
    const sortedEvents = [...events]
      .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())
      .slice(0, 6);
    
    return {
      inner: sortedBrands.map(b => ({ ...b, type: 'brand' as const })),
      middle: sortedProducts.map(p => ({ ...p, type: 'product' as const })),
      outer: sortedEvents.map(e => ({ ...e, type: 'event' as const })),
    };
  }, [brands, products, events]);

  // Entity counts
  const entityCounts = useMemo(() => ({
    brands: brands.length,
    products: products.length,
    events: events.length,
    total: brands.length + products.length + events.length,
  }), [brands, products, events]);

  // Generate randomized dots for orbit rings
  const generateRandomDots = useMemo(() => {
    const generateRing = (cx: number, cy: number, r: number, baseCount: number, seed: number) => {
      const count = baseCount + Math.floor(seededRandom(seed) * 15);
      const dots = [];
      for (let i = 0; i < count; i++) {
        const angleVariation = seededRandom(seed + i * 7) * 0.3 - 0.15;
        const angle = ((i * 360 / count) + angleVariation * 30) * (Math.PI / 180);
        const radiusVariation = seededRandom(seed + i * 13) * 6 - 3;
        const x = cx + (r + radiusVariation) * Math.cos(angle);
        const y = cy + (r + radiusVariation) * Math.sin(angle);
        const size = 1 + seededRandom(seed + i * 17) * 2.5;
        const opacity = 0.2 + seededRandom(seed + i * 23) * 0.4;
        dots.push({ x, y, size, opacity });
      }
      return dots;
    };

    return {
      outermost: generateRing(200, 200, 180, 40, 1),
      outer: generateRing(200, 200, 155, 32, 2),
      middle: generateRing(200, 200, 115, 28, 3),
      inner: generateRing(200, 200, 75, 20, 4),
      core: generateRing(200, 200, 50, 14, 5),
    };
  }, []);

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

  // 3D perspective
  const getTransform3D = () => {
    if (!isHovering) return 'perspective(1200px) rotateX(0deg) rotateY(0deg)';
    
    const rotateX = (mousePosition.y - 0.5) * -10;
    const rotateY = (mousePosition.x - 0.5) * 10;
    
    return `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  };

  // Navigate to entity
  const handleEntityClick = (entity: LinkedEntity) => {
    const config = TYPE_CONFIG[entity.type];
    navigate(`${config.path}/${entity.slug || entity.id}`);
  };

  // Get hierarchy connection lines - shows full chain on hover
  const getHierarchyLines = useMemo(() => {
    if (!activeEntity || hoveredIndex === null || hoveredOrbit === null) return [];
    
    const lines: { 
      fromOrbit: string; 
      fromIndex: number; 
      toOrbit: string; 
      toIndex: number; 
      type: 'parent' | 'child' | 'sibling' | 'org';
      priority: number;
    }[] = [];
    
    if (activeEntity.type === 'product') {
      // Product → Parent Brand connection
      const parentBrand = orbitData.inner.find(b => b.id === activeEntity.parentBrandId);
      if (parentBrand) {
        const parentIndex = orbitData.inner.indexOf(parentBrand);
        if (parentIndex >= 0) {
          // Product to Brand
          lines.push({ 
            fromOrbit: 'middle', 
            fromIndex: hoveredIndex, 
            toOrbit: 'inner', 
            toIndex: parentIndex,
            type: 'parent',
            priority: 1
          });
          // Brand to Center (org) - show full chain
          lines.push({
            fromOrbit: 'inner',
            fromIndex: parentIndex,
            toOrbit: 'center',
            toIndex: 0,
            type: 'org',
            priority: 2
          });
        }
      } else {
        // No parent brand - connect directly to org
        lines.push({
          fromOrbit: 'middle',
          fromIndex: hoveredIndex,
          toOrbit: 'center',
          toIndex: 0,
          type: 'org',
          priority: 1
        });
      }
      
      // Sibling products (same parent)
      if (activeEntity.parentBrandId) {
        orbitData.middle.forEach((p, i) => {
          if (i !== hoveredIndex && p.parentBrandId === activeEntity.parentBrandId) {
            lines.push({
              fromOrbit: 'middle',
              fromIndex: hoveredIndex,
              toOrbit: 'middle',
              toIndex: i,
              type: 'sibling',
              priority: 3
            });
          }
        });
      }
    } else if (activeEntity.type === 'brand') {
      // Brand → Center (org) connection
      lines.push({
        fromOrbit: 'inner',
        fromIndex: hoveredIndex,
        toOrbit: 'center',
        toIndex: 0,
        type: 'org',
        priority: 1
      });
      
      // Brand → Child Products connections
      orbitData.middle.forEach((p, i) => {
        if (p.parentBrandId === activeEntity.id) {
          lines.push({
            fromOrbit: 'inner',
            fromIndex: hoveredIndex,
            toOrbit: 'middle',
            toIndex: i,
            type: 'child',
            priority: 2
          });
        }
      });
    } else if (activeEntity.type === 'event') {
      // Event → Parent Brand connection (if has parent)
      const parentBrand = orbitData.inner.find(b => b.id === activeEntity.parentBrandId);
      if (parentBrand) {
        const parentIndex = orbitData.inner.indexOf(parentBrand);
        if (parentIndex >= 0) {
          // Event to Brand
          lines.push({ 
            fromOrbit: 'outer', 
            fromIndex: hoveredIndex, 
            toOrbit: 'inner', 
            toIndex: parentIndex,
            type: 'parent',
            priority: 1
          });
          // Brand to Center (org) - show full chain
          lines.push({
            fromOrbit: 'inner',
            fromIndex: parentIndex,
            toOrbit: 'center',
            toIndex: 0,
            type: 'org',
            priority: 2
          });
        }
      } else {
        // Check if event links to a product
        const parentProduct = orbitData.middle.find(p => p.id === activeEntity.parentBrandId);
        if (parentProduct) {
          const productIndex = orbitData.middle.indexOf(parentProduct);
          if (productIndex >= 0) {
            // Event to Product
            lines.push({
              fromOrbit: 'outer',
              fromIndex: hoveredIndex,
              toOrbit: 'middle',
              toIndex: productIndex,
              type: 'parent',
              priority: 1
            });
            // Product to its parent brand (if exists)
            const productParentBrand = orbitData.inner.find(b => b.id === parentProduct.parentBrandId);
            if (productParentBrand) {
              const brandIndex = orbitData.inner.indexOf(productParentBrand);
              if (brandIndex >= 0) {
                lines.push({
                  fromOrbit: 'middle',
                  fromIndex: productIndex,
                  toOrbit: 'inner',
                  toIndex: brandIndex,
                  type: 'parent',
                  priority: 2
                });
                lines.push({
                  fromOrbit: 'inner',
                  fromIndex: brandIndex,
                  toOrbit: 'center',
                  toIndex: 0,
                  type: 'org',
                  priority: 3
                });
              }
            } else {
              // Product connects directly to org
              lines.push({
                fromOrbit: 'middle',
                fromIndex: productIndex,
                toOrbit: 'center',
                toIndex: 0,
                type: 'org',
                priority: 2
              });
            }
          }
        } else {
          // No parent - connect directly to org
          lines.push({
            fromOrbit: 'outer',
            fromIndex: hoveredIndex,
            toOrbit: 'center',
            toIndex: 0,
            type: 'org',
            priority: 1
          });
        }
      }
    }
    
    // Sort by priority so main connections render on top
    return lines.sort((a, b) => a.priority - b.priority);
  }, [activeEntity, hoveredIndex, hoveredOrbit, orbitData]);

  const hierarchyLines = getHierarchyLines;

  // Get position for orbit
  const getOrbitPosition = (orbit: string, index: number, total: number) => {
    const radii = { inner: 75, middle: 115, outer: 155, center: 0 };
    const r = radii[orbit as keyof typeof radii] || 100;
    const angle = (index * 360 / total - 90) * (Math.PI / 180);
    return {
      x: 200 + r * Math.cos(angle),
      y: 200 + r * Math.sin(angle),
    };
  };

  return (
    <div 
      ref={containerRef}
      className={cn('relative', className)}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => {
        setIsHovering(false);
        // Don't reset orbit paused state - keep it paused after interaction
        setActiveEntity(null);
        setHoveredIndex(null);
        setHoveredOrbit(null);
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
          <radialGradient id="center-grad-v2" cx="30%" cy="30%">
            <stop offset="0%" stopColor={primaryColor} stopOpacity={isHovering ? "0.7" : "0.5"} />
            <stop offset="70%" stopColor={primaryColor} stopOpacity={isHovering ? "0.4" : "0.25"} />
            <stop offset="100%" stopColor={primaryColor} stopOpacity="0.1" />
          </radialGradient>
          
          <filter id="glow-main-v2" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="10" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
          <filter id="glow-soft-v2" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        {/* Outermost orbit - Events ring */}
        <g 
          className="animate-[spin_100s_linear_infinite]"
          style={{ transformOrigin: '200px 200px' }}
        >
          {generateRandomDots.outermost.map((dot, i) => (
            <circle
              key={`outermost-${i}`}
              cx={dot.x}
              cy={dot.y}
              r={dot.size}
              fill={primaryColor}
              fillOpacity={hoveredOrbit === 'outer' ? dot.opacity + 0.3 : dot.opacity * (isHovering ? 1.2 : 0.8)}
              style={{ transition: 'fill-opacity 0.3s' }}
            />
          ))}
        </g>
        
        {/* Outer orbit dots */}
        <g 
          className="animate-[spin_80s_linear_infinite_reverse]"
          style={{ transformOrigin: '200px 200px' }}
        >
          {generateRandomDots.outer.map((dot, i) => (
            <circle
              key={`outer-${i}`}
              cx={dot.x}
              cy={dot.y}
              r={dot.size}
              fill={primaryColor}
              fillOpacity={hoveredOrbit === 'outer' ? dot.opacity + 0.3 : dot.opacity * (isHovering ? 1.3 : 0.9)}
              style={{ transition: 'fill-opacity 0.3s' }}
            />
          ))}
        </g>
        
        {/* Middle orbit - Products ring */}
        <g 
          className="animate-[spin_65s_linear_infinite]"
          style={{ transformOrigin: '200px 200px' }}
        >
          {generateRandomDots.middle.map((dot, i) => (
            <circle
              key={`middle-${i}`}
              cx={dot.x}
              cy={dot.y}
              r={dot.size}
              fill={primaryColor}
              fillOpacity={hoveredOrbit === 'middle' ? dot.opacity + 0.35 : dot.opacity * (isHovering ? 1.4 : 1)}
              style={{ transition: 'fill-opacity 0.3s' }}
            />
          ))}
        </g>
        
        {/* Inner orbit - Brands ring */}
        <g 
          className="animate-[spin_50s_linear_infinite_reverse]"
          style={{ transformOrigin: '200px 200px' }}
        >
          {generateRandomDots.inner.map((dot, i) => (
            <circle
              key={`inner-${i}`}
              cx={dot.x}
              cy={dot.y}
              r={dot.size}
              fill={primaryColor}
              fillOpacity={hoveredOrbit === 'inner' ? dot.opacity + 0.4 : dot.opacity * (isHovering ? 1.5 : 1.1)}
              style={{ transition: 'fill-opacity 0.3s' }}
            />
          ))}
        </g>
        
        {/* Core orbit */}
        <g 
          className="animate-[spin_35s_linear_infinite]"
          style={{ transformOrigin: '200px 200px' }}
        >
          {generateRandomDots.core.map((dot, i) => (
            <circle
              key={`core-${i}`}
              cx={dot.x}
              cy={dot.y}
              r={dot.size * 0.8}
              fill={primaryColor}
              fillOpacity={dot.opacity * (isHovering ? 1.6 : 1.2)}
              style={{ transition: 'fill-opacity 0.3s' }}
            />
          ))}
        </g>
        
        {/* Hierarchy connection lines - render on hover (pulsing dots only) */}
        {hierarchyLines.map((line, i) => {
          const fromPos = line.fromOrbit === 'center' 
            ? { x: 200, y: 200 }
            : getOrbitPosition(
                line.fromOrbit, 
                line.fromIndex, 
                orbitData[line.fromOrbit as keyof typeof orbitData]?.length || 1
              );
          const toPos = line.toOrbit === 'center'
            ? { x: 200, y: 200 }
            : getOrbitPosition(
                line.toOrbit, 
                line.toIndex, 
                orbitData[line.toOrbit as keyof typeof orbitData]?.length || 1
              );
          
          // Curve control point - pull toward center for hierarchy, straight for siblings
          const isSibling = line.type === 'sibling';
          const centerPull = isSibling ? 0 : 0.35;
          const midX = (fromPos.x + toPos.x) / 2 + (200 - (fromPos.x + toPos.x) / 2) * centerPull;
          const midY = (fromPos.y + toPos.y) / 2 + (200 - (fromPos.y + toPos.y) / 2) * centerPull;
          
          // Style based on connection type - much smaller dots
          const isOrgConnection = line.type === 'org';
          const isParentChild = line.type === 'parent' || line.type === 'child';
          const dotSize = isOrgConnection ? 3 : isParentChild ? 2.5 : 2;
          const animDuration = isOrgConnection ? '1.5s' : isParentChild ? '1.8s' : '2.2s';
          
          // Get color based on the hovered entity type
          const lineColor = activeEntity ? TYPE_COLORS[activeEntity.type] : primaryColor;
          const pathD = `M ${fromPos.x} ${fromPos.y} Q ${midX} ${midY} ${toPos.x} ${toPos.y}`;
          
          return (
            <g key={`hier-${i}`}>
              {/* Multiple small dots traveling along path */}
              {[0, 0.25, 0.5, 0.75].map((offset, dotIdx) => (
                <circle 
                  key={`dot-${dotIdx}`}
                  r={dotSize - dotIdx * 0.3} 
                  fill={lineColor} 
                  fillOpacity={0.9 - dotIdx * 0.15}
                >
                  <animateMotion
                    dur={animDuration}
                    repeatCount="indefinite"
                    begin={`${parseFloat(animDuration) * offset}s`}
                    path={pathD}
                  />
                </circle>
              ))}
              
              {/* Small connection point indicator at destination */}
              {line.toOrbit !== 'center' && (
                <circle
                  cx={toPos.x}
                  cy={toPos.y}
                  r={dotSize + 2}
                  fill="none"
                  stroke={lineColor}
                  strokeWidth="1"
                  strokeOpacity="0.4"
                  className="animate-scale-in"
                />
              )}
            </g>
          );
        })}
        
        {/* Central circle */}
        <circle 
          cx="200" 
          cy="200" 
          r={isHovering ? "42" : "38"} 
          fill="url(#center-grad-v2)"
          stroke={primaryColor}
          strokeWidth={isHovering ? "3" : "2"}
          strokeOpacity={isHovering ? "0.9" : "0.7"}
          filter="url(#glow-main-v2)"
          style={{ transition: 'all 0.3s ease-out' }}
        />
        
        {/* Center glow */}
        <circle 
          cx="200" 
          cy="200" 
          r="60" 
          fill={primaryColor}
          fillOpacity={isHovering ? "0.15" : "0.08"}
          style={{ transition: 'fill-opacity 0.3s' }}
        />
      </svg>
      
      {/* Center Icon */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center transition-all duration-300"
        style={{ 
          width: isHovering ? '84px' : '76px',
          height: isHovering ? '84px' : '76px',
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
              className="w-10 h-10 object-contain"
              style={{ filter: 'brightness(0) invert(1)', opacity: 0.9 }}
            />
          ) : (
            <span 
              className="text-3xl font-bold"
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
            className="text-[9px] font-medium opacity-70"
            style={{ color: primaryColor }}
          >
            {entityCounts.total} Assets
          </span>
        </div>
      </div>
      
      {/* Inner orbit - Brands (closest to center = direct org connection) */}
      {orbitData.inner.length > 0 && (
        <div 
          className="absolute inset-0 animate-[spin_55s_linear_infinite_reverse]"
          style={{ transformOrigin: 'center' }}
        >
          {orbitData.inner.map((entity, i) => {
            const angle = (i * 360 / orbitData.inner.length - 90) * (Math.PI / 180);
            const r = 75 / 400 * 100;
            const x = 50 + r * Math.cos(angle);
            const y = 50 + r * Math.sin(angle);
            
            const config = TYPE_CONFIG[entity.type];
            const Icon = config.Icon;
            const isActive = hoveredIndex === i && hoveredOrbit === 'inner';
            
            return (
              <EntityIcon
                key={entity.id}
                entity={entity}
                Icon={Icon}
                config={config}
                x={x}
                y={y}
                isActive={isActive}
                onHover={() => {
                  setHoveredIndex(i);
                  setHoveredOrbit('inner');
                  setActiveEntity(entity);
                }}
                onLeave={() => {
                  setHoveredIndex(null);
                  setHoveredOrbit(null);
                  setActiveEntity(null);
                }}
                onClick={() => handleEntityClick(entity)}
                spinDuration="55s"
                spinReverse
                size="md"
              />
            );
          })}
        </div>
      )}
      
      {/* Middle orbit - Products */}
      {orbitData.middle.length > 0 && (
        <div 
          className="absolute inset-0 animate-[spin_70s_linear_infinite]"
          style={{ transformOrigin: 'center' }}
        >
          {orbitData.middle.map((entity, i) => {
            const angle = (i * 360 / orbitData.middle.length - 90) * (Math.PI / 180);
            const r = 115 / 400 * 100;
            const x = 50 + r * Math.cos(angle);
            const y = 50 + r * Math.sin(angle);
            
            const config = TYPE_CONFIG[entity.type];
            const Icon = config.Icon;
            const isActive = hoveredIndex === i && hoveredOrbit === 'middle';
            
            return (
              <EntityIcon
                key={entity.id}
                entity={entity}
                Icon={Icon}
                config={config}
                x={x}
                y={y}
                isActive={isActive}
                onHover={() => {
                  setHoveredIndex(i);
                  setHoveredOrbit('middle');
                  setActiveEntity(entity);
                }}
                onLeave={() => {
                  setHoveredIndex(null);
                  setHoveredOrbit(null);
                  setActiveEntity(null);
                }}
                onClick={() => handleEntityClick(entity)}
                spinDuration="70s"
                size="sm"
              />
            );
          })}
        </div>
      )}
      
      {/* Outer orbit - Events */}
      {orbitData.outer.length > 0 && (
        <div 
          className="absolute inset-0 animate-[spin_85s_linear_infinite_reverse]"
          style={{ transformOrigin: 'center' }}
        >
          {orbitData.outer.map((entity, i) => {
            const angle = (i * 360 / orbitData.outer.length - 90) * (Math.PI / 180);
            const r = 155 / 400 * 100;
            const x = 50 + r * Math.cos(angle);
            const y = 50 + r * Math.sin(angle);
            
            const config = TYPE_CONFIG[entity.type];
            const Icon = config.Icon;
            const isActive = hoveredIndex === i && hoveredOrbit === 'outer';
            
            return (
              <EntityIcon
                key={entity.id}
                entity={entity}
                Icon={Icon}
                config={config}
                x={x}
                y={y}
                isActive={isActive}
                onHover={() => {
                  setHoveredIndex(i);
                  setHoveredOrbit('outer');
                  setActiveEntity(entity);
                }}
                onLeave={() => {
                  setHoveredIndex(null);
                  setHoveredOrbit(null);
                  setActiveEntity(null);
                }}
                onClick={() => handleEntityClick(entity)}
                spinDuration="85s"
                spinReverse
                size="sm"
              />
            );
          })}
        </div>
      )}
      
      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => {
          const baseX = 8 + (i % 5) * 18;
          const baseY = 8 + Math.floor(i / 5) * 22;
          const offsetX = isHovering ? (mousePosition.x - 0.5) * 25 : 0;
          const offsetY = isHovering ? (mousePosition.y - 0.5) * 25 : 0;
          const size = 1 + seededRandom(i * 7) * 2;
          
          return (
            <div
              key={i}
              className="absolute rounded-full transition-all duration-700"
              style={{
                left: `${baseX + offsetX * (i % 3 === 0 ? 1.2 : -0.6)}%`,
                top: `${baseY + offsetY * (i % 2 === 0 ? 1.2 : -0.6)}%`,
                width: `${size}px`,
                height: `${size}px`,
                background: primaryColor,
                opacity: isHovering ? 0.5 : 0.25,
                animation: `float ${3 + seededRandom(i * 11) * 3}s ease-in-out ${seededRandom(i * 13) * 2}s infinite alternate`,
              }}
            />
          );
        })}
      </div>
      
      {/* Mouse glow */}
      {isHovering && (
        <div 
          className="absolute w-44 h-44 rounded-full pointer-events-none"
          style={{
            left: `${mousePosition.x * 100}%`,
            top: `${mousePosition.y * 100}%`,
            transform: 'translate(-50%, -50%)',
            background: `radial-gradient(circle, ${primaryColor}25 0%, transparent 70%)`,
            filter: 'blur(25px)',
          }}
        />
      )}
      
      
      {/* Hierarchy Legend */}
      <div 
        className="absolute bottom-2 left-2 flex flex-col gap-1.5 p-2.5 rounded-lg backdrop-blur-sm transition-opacity duration-300"
        style={{ 
          background: 'rgba(0,0,0,0.3)',
          border: '1px solid rgba(255,255,255,0.1)',
          opacity: isHovering ? 1 : 0.7,
        }}
      >
        <div className="flex items-center gap-2">
          <div 
            className="w-5 h-5 rounded-md flex items-center justify-center"
            style={{ background: `${TYPE_COLORS.brand}30`, border: `1px solid ${TYPE_COLORS.brand}60` }}
          >
            <BrandIcon className="w-3.5 h-3.5" style={{ color: TYPE_COLORS.brand }} />
          </div>
          <span className="text-[10px] font-medium" style={{ color: TYPE_COLORS.brand }}>Brands</span>
          <div className="flex items-center gap-1 ml-auto">
            <div className="w-5 h-0.5 rounded-full" style={{ background: TYPE_COLORS.brand }} />
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: TYPE_COLORS.brand }} />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div 
            className="w-5 h-5 rounded-md flex items-center justify-center"
            style={{ background: `${TYPE_COLORS.product}30`, border: `1px solid ${TYPE_COLORS.product}60` }}
          >
            <ProductIcon className="w-3.5 h-3.5" style={{ color: TYPE_COLORS.product }} />
          </div>
          <span className="text-[10px] font-medium" style={{ color: TYPE_COLORS.product }}>Products</span>
          <div className="flex items-center gap-1 ml-auto">
            <div className="w-5 h-0.5 rounded-full" style={{ background: TYPE_COLORS.product }} />
            <div className="w-1 h-1 rounded-full" style={{ background: TYPE_COLORS.product }} />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div 
            className="w-5 h-5 rounded-md flex items-center justify-center"
            style={{ background: `${TYPE_COLORS.event}30`, border: `1px solid ${TYPE_COLORS.event}60` }}
          >
            <EventIcon className="w-3.5 h-3.5" style={{ color: TYPE_COLORS.event }} />
          </div>
          <span className="text-[10px] font-medium" style={{ color: TYPE_COLORS.event }}>Events</span>
          <div className="flex items-center gap-1 ml-auto">
            <div className="w-5 h-0.5 rounded-full" style={{ background: TYPE_COLORS.event }} />
            <div className="w-1 h-1 rounded-full" style={{ background: TYPE_COLORS.event, opacity: 0.8 }} />
          </div>
        </div>
        
        <div className="mt-1 pt-1 border-t border-white/10">
          <p className="text-[8px] text-white/50">Hover to see connections</p>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0% { transform: translateY(0px) translateX(0px); opacity: 0.25; }
          100% { transform: translateY(-18px) translateX(12px); opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

// Entity Icon sub-component
interface EntityIconProps {
  entity: LinkedEntity;
  Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties; isActive?: boolean }>;
  config: { label: string; path: string; color: string };
  x: number;
  y: number;
  isActive: boolean;
  onHover: () => void;
  onLeave: () => void;
  onClick: () => void;
  spinDuration: string;
  spinReverse?: boolean;
  size?: 'sm' | 'md';
}

const EntityIcon = ({
  entity,
  Icon,
  config,
  x,
  y,
  isActive,
  onHover,
  onLeave,
  onClick,
  spinDuration,
  spinReverse,
  size = 'md',
}: EntityIconProps) => {
  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  const padding = size === 'sm' ? 'p-2' : 'p-2.5';
  const typeColor = config.color;
  
  return (
    <div
      className="absolute group"
      style={{ 
        left: `${x}%`, 
        top: `${y}%`,
        width: size === 'sm' ? '40px' : '48px',
        height: size === 'sm' ? '40px' : '48px',
        marginLeft: size === 'sm' ? '-20px' : '-24px',
        marginTop: size === 'sm' ? '-20px' : '-24px',
      }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={onClick}
    >
      <div 
        className="w-full h-full flex items-center justify-center"
        style={{ 
          transformOrigin: 'center',
          animation: `spin ${spinDuration} linear infinite ${spinReverse ? 'reverse' : ''}`,
        }}
      >
        <div 
          className={cn(
            "relative rounded-xl cursor-pointer transition-all duration-300 ease-out",
            padding,
            isActive && "z-20"
          )}
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
            <div 
              className="absolute -top-1 -right-1 p-0.5 rounded-full animate-scale-in"
              style={{ background: typeColor }}
            >
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
          <div 
            className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45"
            style={{ background: typeColor }}
          />
        </div>
      </div>
    </div>
  );
};