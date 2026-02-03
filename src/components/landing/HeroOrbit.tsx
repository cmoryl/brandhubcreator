/**
 * HeroOrbit Component
 * Enhanced orbit visualization for landing page hero
 * Shows hierarchical relationships between brands, products, and events
 * Inspired by GlobalLink Universe style with animated rings, glowing orb trails, and 3D effects
 */

import React, { useState, useRef, useCallback, useMemo, forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface OrbitEntity {
  id: string;
  name: string;
  slug?: string;
  type: 'brand' | 'product' | 'event';
  coverImage?: string;
  color?: string;
  parentBrandId?: string;
}

interface HeroOrbitProps {
  className?: string;
  primaryColor?: string;
  centerLogo: string;
  brands?: OrbitEntity[];
  products?: OrbitEntity[];
  events?: OrbitEntity[];
  onEntityClick?: (entity: OrbitEntity) => void;
}

// Type colors - TransPerfect light blue accent theme
const TYPE_COLORS = {
  brand: '#14b8a6',    // Teal
  product: '#139cd8',  // TransPerfect light blue
  event: '#a855f7',    // Purple (for visual distinction)
};

// Seeded random for consistent patterns
const seededRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

export const HeroOrbit = forwardRef<HTMLDivElement, HeroOrbitProps>(({
  className,
  primaryColor = '#6366f1',
  centerLogo,
  brands = [],
  products = [],
  events = [],
  onEntityClick,
}, ref) => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredEntity, setHoveredEntity] = useState<OrbitEntity | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [orbitTilt, setOrbitTilt] = useState({ x: 0, y: 0 });

  // Build entity lookup map
  const entityMap = useMemo(() => {
    const map = new Map<string, OrbitEntity>();
    [...brands, ...products, ...events].forEach(e => map.set(e.id, e));
    return map;
  }, [brands, products, events]);

  // Calculate positions for all entities
  const entityPositions = useMemo(() => {
    const positions = new Map<string, { x: number; y: number; radius: number; angle: number }>();
    
    // Brands on inner ring (show all, up to 6)
    const visibleBrands = brands.slice(0, 6);
    visibleBrands.forEach((brand, i) => {
      const total = visibleBrands.length;
      const angle = ((i * 360) / total - 90) * (Math.PI / 180);
      const radius = 20;
      positions.set(brand.id, {
        x: 50 + radius * Math.cos(angle),
        y: 50 + radius * Math.sin(angle),
        radius,
        angle,
      });
    });
    
    // Products on middle ring (show all, up to 8)
    const visibleProducts = products.slice(0, 8);
    visibleProducts.forEach((product, i) => {
      const total = visibleProducts.length;
      const angle = ((i * 360) / total - 60) * (Math.PI / 180);
      const radius = 33;
      positions.set(product.id, {
        x: 50 + radius * Math.cos(angle),
        y: 50 + radius * Math.sin(angle),
        radius,
        angle,
      });
    });
    
    // Events on outer ring (show all, up to 6)
    const visibleEvents = events.slice(0, 6);
    visibleEvents.forEach((event, i) => {
      const total = visibleEvents.length;
      const angle = ((i * 360) / total - 30) * (Math.PI / 180);
      const radius = 44;
      positions.set(event.id, {
        x: 50 + radius * Math.cos(angle),
        y: 50 + radius * Math.sin(angle),
        radius,
        angle,
      });
    });
    
    return positions;
  }, [brands, products, events]);

  // Build relationships (parent -> children)
  const relationships = useMemo(() => {
    const rels: Array<{ from: OrbitEntity; to: OrbitEntity; fromPos: { x: number; y: number }; toPos: { x: number; y: number } }> = [];
    
    // Products linked to parent brands
    products.forEach(product => {
      if (product.parentBrandId) {
        const parent = entityMap.get(product.parentBrandId);
        const fromPos = entityPositions.get(product.parentBrandId);
        const toPos = entityPositions.get(product.id);
        if (parent && fromPos && toPos) {
          rels.push({ from: parent, to: product, fromPos, toPos });
        }
      }
    });
    
    // Events linked to parent brands
    events.forEach(event => {
      if (event.parentBrandId) {
        const parent = entityMap.get(event.parentBrandId);
        const fromPos = entityPositions.get(event.parentBrandId);
        const toPos = entityPositions.get(event.id);
        if (parent && fromPos && toPos) {
          rels.push({ from: parent, to: event, fromPos, toPos });
        }
      }
    });
    
    return rels;
  }, [products, events, entityMap, entityPositions]);

  // Generate particle dust positions
  const particleDust = useMemo(() => {
    const particles = [];
    for (let i = 0; i < 25; i++) {
      const angle = seededRandom(i * 7) * Math.PI * 2;
      const radius = 12 + seededRandom(i * 13) * 18;
      particles.push({
        x: 50 + radius * Math.cos(angle),
        y: 50 + radius * Math.sin(angle),
        size: 0.25 + seededRandom(i * 17) * 0.4,
        opacity: 0.15 + seededRandom(i * 23) * 0.25,
        delay: seededRandom(i * 31) * 3,
      });
    }
    return particles;
  }, []);

  // Handle orbit hover for 3D tilt effect
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const x = (e.clientX - centerX) / (rect.width / 2);
    const y = (e.clientY - centerY) / (rect.height / 2);
    setOrbitTilt({ x: y * -10, y: x * 10 });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setOrbitTilt({ x: 0, y: 0 });
    setHoveredEntity(null);
    setIsPaused(false);
  }, []);

  const handleEntityClick = (entity: OrbitEntity) => {
    if (onEntityClick) {
      onEntityClick(entity);
    } else {
      const pathPrefix = entity.type === 'brand' ? '/demo/brand' : entity.type === 'product' ? '/demo/product' : '/demo/event';
      navigate(`${pathPrefix}/${entity.slug || entity.id}`);
    }
  };

  const activeColor = hoveredEntity ? TYPE_COLORS[hoveredEntity.type] : primaryColor;

  // Get related entities when hovering
  const relatedEntityIds = useMemo(() => {
    if (!hoveredEntity) return new Set<string>();
    const related = new Set<string>();
    
    // If hovering a brand, show its products and events
    if (hoveredEntity.type === 'brand') {
      products.forEach(p => {
        if (p.parentBrandId === hoveredEntity.id) related.add(p.id);
      });
      events.forEach(e => {
        if (e.parentBrandId === hoveredEntity.id) related.add(e.id);
      });
    }
    
    // If hovering a product/event, show its parent brand
    if (hoveredEntity.parentBrandId) {
      related.add(hoveredEntity.parentBrandId);
    }
    
    return related;
  }, [hoveredEntity, products, events]);

  // All visible entities (matching the limits used in entityPositions)
  const allEntities = useMemo(() => [
    ...brands.slice(0, 6).map(b => ({ ...b, type: 'brand' as const })),
    ...products.slice(0, 8).map(p => ({ ...p, type: 'product' as const })),
    ...events.slice(0, 6).map(e => ({ ...e, type: 'event' as const })),
  ], [brands, products, events]);

  return (
    <div 
      ref={(node) => {
        // Handle both refs
        (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      }}
      className={cn("relative", className)}
      style={{ perspective: '1200px' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* 3D Transform Container */}
      <div
        className="relative w-full h-full transition-transform duration-300 ease-out"
        style={{
          transform: `rotateX(${orbitTilt.x}deg) rotateY(${orbitTilt.y}deg)`,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Background glow layers */}
        <div 
          className="absolute inset-0 rounded-full blur-3xl transition-all duration-500"
          style={{
            background: `radial-gradient(circle, ${activeColor}25, ${activeColor}08, transparent 70%)`,
            transform: 'translateZ(-60px) scale(1.2)',
          }}
        />
        
        {/* Secondary glow pulse */}
        <div 
          className="absolute inset-[5%] rounded-full blur-2xl animate-pulse"
          style={{
            background: `radial-gradient(circle, ${activeColor}15, transparent 60%)`,
            transform: 'translateZ(-30px)',
            animationDuration: '3s',
          }}
        />

        {/* SVG Orbit Visualization */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
          <defs>
            {/* Orbit ring gradient */}
            <linearGradient id="heroOrbitGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={activeColor} stopOpacity="0.12" />
              <stop offset="50%" stopColor={activeColor} stopOpacity="0.04" />
              <stop offset="100%" stopColor={activeColor} stopOpacity="0.12" />
            </linearGradient>
            
            {/* Glowing orb filter */}
            <filter id="heroOrbGlow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="1.2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            
            {/* Connection line gradient */}
            {relationships.map((rel, i) => (
              <linearGradient key={`grad-${i}`} id={`connGrad-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={TYPE_COLORS[rel.from.type]} stopOpacity="0.5" />
                <stop offset="50%" stopColor={TYPE_COLORS[rel.to.type]} stopOpacity="0.3" />
                <stop offset="100%" stopColor={TYPE_COLORS[rel.to.type]} stopOpacity="0.5" />
              </linearGradient>
            ))}
            
            {/* Center glow */}
            <radialGradient id="centerGlow">
              <stop offset="0%" stopColor={activeColor} stopOpacity="0.35" />
              <stop offset="50%" stopColor={activeColor} stopOpacity="0.12" />
              <stop offset="100%" stopColor={activeColor} stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Outer orbit ring - Events */}
          <circle 
            cx="50" cy="50" r="44" 
            fill="none" 
            stroke={TYPE_COLORS.event}
            strokeWidth="0.4"
            strokeOpacity="0.2"
            className="transition-all duration-500"
          />
          <circle 
            cx="50" cy="50" r="44" 
            fill="none" 
            stroke={TYPE_COLORS.event}
            strokeWidth="0.3"
            strokeOpacity="0.15"
            strokeDasharray="2 4"
            className="transition-all duration-500"
            style={{ animation: isPaused ? 'none' : 'spin 50s linear infinite' }}
          />

          {/* Middle orbit ring - Products */}
          <circle 
            cx="50" cy="50" r="33" 
            fill="none" 
            stroke={TYPE_COLORS.product}
            strokeWidth="0.4"
            strokeOpacity="0.2"
            className="transition-all duration-500"
          />
          <circle 
            cx="50" cy="50" r="33" 
            fill="none" 
            stroke={TYPE_COLORS.product}
            strokeWidth="0.25"
            strokeOpacity="0.12"
            strokeDasharray="1.5 4"
            className="transition-all duration-500"
            style={{ animation: isPaused ? 'none' : 'spin 40s linear infinite reverse' }}
          />

          {/* Inner orbit ring - Brands */}
          <circle 
            cx="50" cy="50" r="20" 
            fill="none" 
            stroke={TYPE_COLORS.brand}
            strokeWidth="0.5"
            strokeOpacity="0.25"
            className="transition-all duration-500"
          />
          <circle 
            cx="50" cy="50" r="20" 
            fill="none" 
            stroke={TYPE_COLORS.brand}
            strokeWidth="0.3"
            strokeOpacity="0.15"
            strokeDasharray="1 3"
            className="transition-all duration-500"
            style={{ animation: isPaused ? 'none' : 'spin 30s linear infinite' }}
          />

          {/* Particle dust around center */}
          {particleDust.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={p.size}
              fill={activeColor}
              opacity={p.opacity}
            >
              <animate
                attributeName="opacity"
                values={`${p.opacity};${p.opacity * 1.6};${p.opacity}`}
                dur="2.5s"
                begin={`${p.delay}s`}
                repeatCount="indefinite"
              />
            </circle>
          ))}

          {/* Relationship connection lines with animated orbs */}
          {relationships.map((rel, i) => {
            const fromPos = rel.fromPos;
            const toPos = rel.toPos;
            const isHighlighted = hoveredEntity && 
              (hoveredEntity.id === rel.from.id || hoveredEntity.id === rel.to.id);
            
            // Curved path through a control point
            const midX = (fromPos.x + toPos.x) / 2;
            const midY = (fromPos.y + toPos.y) / 2;
            const ctrlX = midX + (50 - midX) * 0.3;
            const ctrlY = midY + (50 - midY) * 0.3;
            const pathD = `M ${fromPos.x} ${fromPos.y} Q ${ctrlX} ${ctrlY} ${toPos.x} ${toPos.y}`;
            
            const duration = 3 + i * 0.5;
            const toColor = TYPE_COLORS[rel.to.type];
            
            return (
              <g key={`conn-${i}`} className="transition-opacity duration-300" style={{ opacity: isHighlighted ? 1 : 0.4 }}>
                {/* Base connection line */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={`url(#connGrad-${i})`}
                  strokeWidth={isHighlighted ? 0.6 : 0.35}
                  strokeLinecap="round"
                  className="transition-all duration-300"
                />
                
                {/* Trail particles */}
                {[0, 1, 2, 3].map((t) => (
                  <circle
                    key={t}
                    r={1 - t * 0.2}
                    fill={toColor}
                    opacity={0.5 - t * 0.1}
                  >
                    <animateMotion
                      dur={`${duration}s`}
                      repeatCount="indefinite"
                      begin={`${t * 0.08}s`}
                      path={pathD}
                      calcMode="spline"
                      keySplines="0.4 0 0.2 1"
                      keyTimes="0;1"
                    />
                  </circle>
                ))}
                
                {/* Main glowing orb */}
                <circle
                  r="1.4"
                  fill={toColor}
                  filter="url(#heroOrbGlow)"
                >
                  <animateMotion
                    dur={`${duration}s`}
                    repeatCount="indefinite"
                    path={pathD}
                    calcMode="spline"
                    keySplines="0.4 0 0.2 1"
                    keyTimes="0;1"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.6;1;0.6"
                    dur="1.2s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="r"
                    values="1.2;1.6;1.2"
                    dur="1.2s"
                    repeatCount="indefinite"
                  />
                </circle>
              </g>
            );
          })}

          {/* Orbiting ambient comet trails on each ring */}
          {[
            { radius: 20, color: TYPE_COLORS.brand, duration: 12 },
            { radius: 33, color: TYPE_COLORS.product, duration: 16 },
            { radius: 44, color: TYPE_COLORS.event, duration: 20 },
          ].map((ring, i) => (
            <g key={`ambient-${i}`}>
              {/* Trail particles */}
              {[0, 1, 2].map((t) => (
                <circle
                  key={t}
                  r={0.8 - t * 0.15}
                  fill={ring.color}
                  opacity={0.4 - t * 0.1}
                >
                  <animateMotion
                    dur={`${ring.duration}s`}
                    repeatCount="indefinite"
                    begin={`${t * 0.1}s`}
                    path={`M ${50 + ring.radius} 50 A ${ring.radius} ${ring.radius} 0 1 1 ${50 + ring.radius - 0.001} 50`}
                  />
                </circle>
              ))}
              
              {/* Main orb */}
              <circle
                r="1.1"
                fill={ring.color}
                filter="url(#heroOrbGlow)"
              >
                <animateMotion
                  dur={`${ring.duration}s`}
                  repeatCount="indefinite"
                  path={`M ${50 + ring.radius} 50 A ${ring.radius} ${ring.radius} 0 1 1 ${50 + ring.radius - 0.001} 50`}
                />
                <animate
                  attributeName="opacity"
                  values="0.5;0.9;0.5"
                  dur="1.8s"
                  repeatCount="indefinite"
                />
              </circle>
            </g>
          ))}

          {/* Entity nodes */}
          {allEntities.map((entity) => {
            const pos = entityPositions.get(entity.id);
            if (!pos) return null;
            
            const color = TYPE_COLORS[entity.type];
            const isHovered = hoveredEntity?.id === entity.id;
            const isRelated = relatedEntityIds.has(entity.id);
            const dimmed = hoveredEntity && !isHovered && !isRelated;
            
            return (
              <g 
                key={entity.id}
                className="cursor-pointer transition-all duration-200"
                style={{ 
                  opacity: dimmed ? 0.35 : 1,
                }}
                onClick={() => handleEntityClick(entity)}
                onMouseEnter={() => {
                  setHoveredEntity(entity);
                  setIsPaused(true);
                }}
                onMouseLeave={() => {
                  setHoveredEntity(null);
                  setIsPaused(false);
                }}
              >
                {/* Outer glow ring */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={isHovered ? 5 : isRelated ? 4.2 : 3.5}
                  fill={`${color}15`}
                  stroke={color}
                  strokeWidth={isHovered ? 0.6 : isRelated ? 0.5 : 0.3}
                  className="transition-all duration-200"
                />
                
                {/* Inner filled dot */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={isHovered ? 2.4 : isRelated ? 2 : 1.6}
                  fill={color}
                  className="transition-all duration-200"
                >
                  {!isPaused && (
                    <animate
                      attributeName="r"
                      values="1.4;1.8;1.4"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  )}
                </circle>
                
                {/* Entity label (on hover) */}
                {isHovered && (
                  <g className="animate-fade-in">
                    <rect
                      x={pos.x - 14}
                      y={pos.y + 6}
                      width="28"
                      height="6"
                      rx="1.5"
                      fill="rgba(0,0,0,0.8)"
                    />
                    <text
                      x={pos.x}
                      y={pos.y + 10}
                      textAnchor="middle"
                      fill="white"
                      fontSize="2.8"
                      fontWeight="500"
                    >
                      {entity.name.length > 14 ? entity.name.slice(0, 14) + '...' : entity.name}
                    </text>
                    <text
                      x={pos.x}
                      y={pos.y + 13}
                      textAnchor="middle"
                      fill={color}
                      fontSize="2"
                      fontWeight="600"
                      style={{ textTransform: 'uppercase' }}
                    >
                      {entity.type}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Center hub glow */}
          <circle
            cx="50"
            cy="50"
            r="10"
            fill="url(#centerGlow)"
            className="transition-all duration-500"
          />
        </svg>

        {/* Center logo */}
        <div className="absolute inset-[38%] z-20">
          <div 
            className="w-full h-full rounded-full flex items-center justify-center transition-all duration-500 hover:scale-105"
            style={{ 
              background: `linear-gradient(145deg, ${activeColor}35, ${activeColor}12)`,
              boxShadow: `0 0 40px ${activeColor}30, inset 0 0 20px ${activeColor}15`,
              border: `2px solid ${activeColor}35`,
            }}
          >
            <img 
              src={centerLogo} 
              alt="Logo" 
              className="w-2/3 h-2/3 object-contain drop-shadow-lg"
            />
          </div>
        </div>

        {/* Legend badges */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2 rounded-full bg-background/80 backdrop-blur-md border border-border/50 z-30">
          {[
            { type: 'brand', label: 'Brands', count: brands.length },
            { type: 'product', label: 'Products', count: products.length },
            { type: 'event', label: 'Events', count: events.length },
          ].map(({ type, label, count }) => (
            <div key={type} className="flex items-center gap-1.5">
              <div 
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: TYPE_COLORS[type as keyof typeof TYPE_COLORS] }}
              />
              <span className="text-[10px] font-medium text-muted-foreground">
                {label} ({count})
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* CSS for spin animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
});

HeroOrbit.displayName = 'HeroOrbit';
