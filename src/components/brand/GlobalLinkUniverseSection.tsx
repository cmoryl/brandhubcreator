/**
 * GlobalLinkUniverseSection Component
 * Interactive orbit visualization specifically for GlobalLink products
 * Shows how all GlobalLink products interact together with hover info states
 */

import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ExternalLink, ArrowRight, Layers, Globe, Mic, Video, FileText, MessageSquare, Tv, Music, Share2, Database, PenTool, Zap } from 'lucide-react';

// Particle component for visual effects
const OrbitParticle: React.FC<{
  delay: number;
  duration: number;
  size: number;
  color: string;
  orbitRadius: number;
  startAngle: number;
}> = ({ delay, duration, size, color, orbitRadius, startAngle }) => {
  return (
    <div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        left: '50%',
        top: '50%',
        transformOrigin: 'center',
        animation: `orbitParticle ${duration}s linear infinite`,
        animationDelay: `${delay}s`,
        opacity: 0.6,
        '--orbit-radius': `${orbitRadius}%`,
        '--start-angle': `${startAngle}deg`,
      } as React.CSSProperties}
    />
  );
};

interface LinkedGuide {
  id: string;
  name?: string;
  slug?: string;
  type?: string;
}

// Internal type for validated guides with required fields
interface ValidatedGuide {
  id: string;
  name: string;
  slug: string;
  type?: string;
}

interface GlobalLinkUniverseSectionProps {
  linkedGuides: LinkedGuide[];
  primaryColor?: string;
  className?: string;
}

// Product-specific metadata for hover info
const PRODUCT_INFO: Record<string, { 
  icon: React.ElementType;
  description: string;
  category: string;
  connections: string[];
}> = {
  'globallink-tms': {
    icon: Database,
    description: 'Enterprise translation management system for global content workflows.',
    category: 'Core Platform',
    connections: ['GlobalLink Web', 'GlobalLink CCMS', 'GlobalLink NOW'],
  },
  'globallink-web': {
    icon: Globe,
    description: 'Automated website localization with seamless CMS integration.',
    category: 'Web',
    connections: ['GlobalLink TMS', 'GlobalLink Strings'],
  },
  'globallink-now': {
    icon: Zap,
    description: 'AI-powered instant translation for rapid content delivery.',
    category: 'AI-Powered',
    connections: ['GlobalLink TMS', 'GlobalLink Write'],
  },
  'globallink-write': {
    icon: PenTool,
    description: 'AI writing assistant optimized for multilingual content creation.',
    category: 'AI-Powered',
    connections: ['GlobalLink NOW', 'GlobalLink TMS'],
  },
  'globallink-voice': {
    icon: Mic,
    description: 'Voice-over and audio localization services for multimedia.',
    category: 'Media',
    connections: ['GlobalLink TV', 'GlobalLink Media'],
  },
  'globallink-scribe': {
    icon: FileText,
    description: 'Subtitle and caption localization for video content.',
    category: 'Media',
    connections: ['GlobalLink TV', 'GlobalLink Voice'],
  },
  'globallink-live': {
    icon: MessageSquare,
    description: 'Real-time interpretation and live event localization.',
    category: 'Live',
    connections: ['GlobalLink Voice', 'GlobalLink TV'],
  },
  'globallink-tv': {
    icon: Tv,
    description: 'End-to-end broadcast and streaming content localization.',
    category: 'Media',
    connections: ['GlobalLink Voice', 'GlobalLink Scribe', 'GlobalLink Media'],
  },
  'globallink-media': {
    icon: Video,
    description: 'Rich media adaptation for global markets.',
    category: 'Media',
    connections: ['GlobalLink TV', 'GlobalLink Voice'],
  },
  'globallink-strings': {
    icon: Layers,
    description: 'Software and app string localization management.',
    category: 'Development',
    connections: ['GlobalLink TMS', 'GlobalLink Web'],
  },
  'globallink-share': {
    icon: Share2,
    description: 'Collaborative translation portal for distributed teams.',
    category: 'Collaboration',
    connections: ['GlobalLink TMS', 'GlobalLink CCMS'],
  },
  'globallink-ccms': {
    icon: Database,
    description: 'Component content management for structured authoring.',
    category: 'Core Platform',
    connections: ['GlobalLink TMS', 'GlobalLink Share'],
  },
};

// Category colors
const CATEGORY_COLORS: Record<string, string> = {
  'Core Platform': '#6366f1', // Indigo
  'Web': '#14b8a6', // Teal
  'AI-Powered': '#f59e0b', // Amber
  'Media': '#ec4899', // Pink
  'Live': '#ef4444', // Red
  'Development': '#22c55e', // Green
  'Collaboration': '#8b5cf6', // Violet
};

export const GlobalLinkUniverseSection: React.FC<GlobalLinkUniverseSectionProps> = ({
  linkedGuides,
  primaryColor = '#6366f1',
  className,
}) => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredProduct, setHoveredProduct] = useState<ValidatedGuide | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
  const productRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Get product info with fallback
  const getProductInfo = useCallback((slug: string) => {
    return PRODUCT_INFO[slug] || {
      icon: Layers,
      description: 'GlobalLink product for enterprise localization.',
      category: 'Core Platform',
      connections: [],
    };
  }, []);

  // Filter and split products into inner and outer rings
  const { innerRing, outerRing, validGuides } = useMemo(() => {
    // Only include guides with required fields and cast to validated type
    const validated = linkedGuides.filter((g): g is ValidatedGuide => 
      Boolean(g.name && g.slug)
    );
    const mid = Math.ceil(validated.length / 2);
    return {
      innerRing: validated.slice(0, mid),
      outerRing: validated.slice(mid),
      validGuides: validated,
    };
  }, [linkedGuides]);

  // Get connected product indices for line drawing
  const connections = useMemo(() => {
    if (!hoveredProduct) return [];
    const info = getProductInfo(hoveredProduct.slug);
    return info.connections.map(name => {
      const found = validGuides.find(g => g.name === name);
      return found ? validGuides.indexOf(found) : -1;
    }).filter(i => i >= 0);
  }, [hoveredProduct, validGuides, getProductInfo]);

  const animationStyle = isPaused ? 'paused' : 'running';

  // Generate particles for visual effects
  const particles = useMemo(() => {
    const particleCount = 24;
    return Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      delay: (i * 0.5) % 8,
      duration: 15 + (i % 5) * 3,
      size: 3 + (i % 3) * 2,
      color: Object.values(CATEGORY_COLORS)[i % Object.values(CATEGORY_COLORS).length],
      orbitRadius: 20 + (i % 3) * 15,
      startAngle: (i * 360 / particleCount),
    }));
  }, []);

  return (
    <section className={cn("relative py-16 overflow-hidden", className)}>
      {/* Background gradient */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          background: `radial-gradient(circle at center, ${primaryColor} 0%, transparent 70%)`,
        }}
      />

      {/* Header */}
      <div className="text-center mb-8 px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
          GlobalLink Universe
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Explore our interconnected ecosystem of localization products. Hover over any product to see how it connects with others.
        </p>
      </div>

      {/* Two-column layout: Info Panel + Orbit */}
      <div className="flex flex-col lg:flex-row items-center lg:items-stretch justify-center gap-6 lg:gap-0 px-4 max-w-6xl mx-auto">
        
        {/* Left: Info Panel */}
        <div className="w-full lg:w-80 flex-shrink-0 lg:pr-6">
          <div className="h-full min-h-[400px] lg:min-h-[500px] flex flex-col">
            {/* Product list / navigation */}
            <div className="bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 p-4 mb-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Products
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-1.5 max-h-[200px] lg:max-h-none overflow-y-auto">
                {validGuides.map((product) => {
                  const info = getProductInfo(product.slug);
                  const Icon = info.icon;
                  const categoryColor = CATEGORY_COLORS[info.category] || primaryColor;
                  const isActive = hoveredProduct?.id === product.id;
                  const isConnected = hoveredProduct && connections.includes(validGuides.indexOf(product));
                  
                  return (
                    <button
                      key={product.id}
                      className={cn(
                        "flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-all duration-200 text-sm",
                        isActive && "ring-2 ring-offset-1 ring-offset-background",
                        isConnected && "bg-muted/50",
                        !isActive && !isConnected && "hover:bg-muted/30"
                      )}
                      style={{
                        background: isActive ? `${categoryColor}15` : undefined,
                        '--tw-ring-color': isActive ? categoryColor : undefined,
                      } as React.CSSProperties}
                      onMouseEnter={() => {
                        setHoveredProduct(product);
                        setHoveredIndex(validGuides.indexOf(product));
                        setIsPaused(true);
                      }}
                      onMouseLeave={() => {
                        setHoveredProduct(null);
                        setHoveredIndex(null);
                        setIsPaused(false);
                      }}
                      onClick={() => navigate(`/product/${product.slug}`)}
                    >
                      <div 
                        className="w-6 h-6 rounded flex items-center justify-center shrink-0"
                        style={{ background: `${categoryColor}20` }}
                      >
                        <Icon className="w-3.5 h-3.5" style={{ color: categoryColor }} />
                      </div>
                      <span className={cn(
                        "truncate",
                        isActive ? "font-medium text-foreground" : "text-muted-foreground"
                      )}>
                        {product.name.replace('GlobalLink ', '')}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Detailed info panel - shows when product is hovered */}
            <div className="flex-1 relative">
              {hoveredProduct ? (
                <div 
                  className="bg-card/95 backdrop-blur-md rounded-xl p-5 border border-border/50 h-full animate-fade-in"
                  style={{
                    boxShadow: `0 10px 40px ${CATEGORY_COLORS[getProductInfo(hoveredProduct.slug).category]}15`,
                  }}
                >
                  {(() => {
                    const info = getProductInfo(hoveredProduct.slug);
                    const Icon = info.icon;
                    const categoryColor = CATEGORY_COLORS[info.category];
                    return (
                      <div className="flex flex-col h-full">
                        <div className="flex items-start gap-4 mb-4">
                          <div 
                            className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: `linear-gradient(135deg, ${categoryColor}30, ${categoryColor}15)` }}
                          >
                            <Icon className="w-7 h-7" style={{ color: categoryColor }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-lg text-foreground mb-1">
                              {hoveredProduct.name}
                            </h4>
                            <span 
                              className="inline-block text-xs px-2 py-0.5 rounded-full font-medium"
                              style={{ 
                                background: `${categoryColor}20`,
                                color: categoryColor,
                              }}
                            >
                              {info.category}
                            </span>
                          </div>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                          {info.description}
                        </p>
                        
                        {info.connections.length > 0 && (
                          <div className="mb-4">
                            <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                              Connects With
                            </h5>
                            <div className="flex flex-wrap gap-1.5">
                              {info.connections.map((conn) => {
                                const connProduct = validGuides.find(g => g.name === conn);
                                const connInfo = connProduct ? getProductInfo(connProduct.slug) : null;
                                const connColor = connInfo ? CATEGORY_COLORS[connInfo.category] : primaryColor;
                                return (
                                  <span 
                                    key={conn}
                                    className="text-xs px-2 py-1 rounded-md font-medium"
                                    style={{ 
                                      background: `${connColor}15`,
                                      color: connColor,
                                    }}
                                  >
                                    {conn.replace('GlobalLink ', '')}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        
                        <div className="mt-auto">
                          <button
                            onClick={() => navigate(`/product/${hoveredProduct.slug}`)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 hover:scale-[1.02]"
                            style={{
                              background: `linear-gradient(135deg, ${categoryColor}, ${categoryColor}cc)`,
                              color: 'white',
                              boxShadow: `0 4px 14px ${categoryColor}40`,
                            }}
                          >
                            View Product Guide
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="bg-muted/30 rounded-xl border border-dashed border-border/50 h-full flex items-center justify-center p-6">
                  <div className="text-center text-muted-foreground">
                    <Globe className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">Hover over a product to see details</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Orbit Visualization */}
        <div 
          ref={containerRef}
          className="relative flex-1 w-full max-w-[550px] lg:max-w-none aspect-square"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => {
            setIsPaused(false);
            setHoveredProduct(null);
            setHoveredIndex(null);
          }}
        >
          {/* Outer orbit ring */}
          <div 
            className="absolute inset-[5%] rounded-full border border-border/30"
            style={{ 
              boxShadow: `0 0 40px ${primaryColor}10`,
            }}
          />
          
          {/* Inner orbit ring */}
          <div 
            className="absolute inset-[25%] rounded-full border border-border/30"
            style={{ 
              boxShadow: `0 0 30px ${primaryColor}10`,
            }}
          />

          {/* Particle effects */}
          <div className="absolute inset-0 pointer-events-none">
            {particles.map((particle) => (
              <OrbitParticle
                key={particle.id}
                delay={particle.delay}
                duration={particle.duration}
                size={particle.size}
                color={particle.color}
                orbitRadius={particle.orbitRadius}
                startAngle={particle.startAngle}
              />
            ))}
          </div>

          {/* Connection lines to hovered product */}
          {hoveredProduct && connections.length > 0 && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
              {connections.map((targetIdx) => {
                const hoveredIdx = validGuides.indexOf(hoveredProduct);
                if (hoveredIdx < 0 || targetIdx < 0) return null;
                
                // Calculate positions
                const isHoveredInner = hoveredIdx < innerRing.length;
                const isTargetInner = targetIdx < innerRing.length;
                
                const hoveredRingIdx = isHoveredInner ? hoveredIdx : hoveredIdx - innerRing.length;
                const targetRingIdx = isTargetInner ? targetIdx : targetIdx - innerRing.length;
                
                const hoveredRingSize = isHoveredInner ? innerRing.length : outerRing.length;
                const targetRingSize = isTargetInner ? innerRing.length : outerRing.length;
                
                const hoveredAngle = (hoveredRingIdx * 360 / hoveredRingSize - 90) * (Math.PI / 180);
                const targetAngle = (targetRingIdx * 360 / targetRingSize - 90) * (Math.PI / 180);
                
                const hoveredRadius = isHoveredInner ? 32.5 : 47.5;
                const targetRadius = isTargetInner ? 32.5 : 47.5;
                
                const x1 = 50 + hoveredRadius * Math.cos(hoveredAngle);
                const y1 = 50 + hoveredRadius * Math.sin(hoveredAngle);
                const x2 = 50 + targetRadius * Math.cos(targetAngle);
                const y2 = 50 + targetRadius * Math.sin(targetAngle);
                
                const categoryColor = CATEGORY_COLORS[getProductInfo(hoveredProduct.slug).category] || primaryColor;
                
                return (
                  <g key={`conn-${hoveredIdx}-${targetIdx}`}>
                    {/* Glowing background line */}
                    <line
                      x1={`${x1}%`}
                      y1={`${y1}%`}
                      x2={`${x2}%`}
                      y2={`${y2}%`}
                      stroke={categoryColor}
                      strokeWidth="6"
                      strokeOpacity="0.2"
                      strokeLinecap="round"
                    />
                    {/* Main connection line */}
                    <line
                      x1={`${x1}%`}
                      y1={`${y1}%`}
                      x2={`${x2}%`}
                      y2={`${y2}%`}
                      stroke={categoryColor}
                      strokeWidth="2"
                      strokeOpacity="0.8"
                      strokeLinecap="round"
                    />
                    {/* Animated pulse on line */}
                    <circle
                      r="4"
                      fill={categoryColor}
                      opacity="0.9"
                    >
                      <animateMotion
                        dur="1.5s"
                        repeatCount="indefinite"
                        path={`M${x1 * 5.5},${y1 * 5.5} L${x2 * 5.5},${y2 * 5.5}`}
                      />
                    </circle>
                  </g>
                );
              })}
            </svg>
          )}

          {/* Center hub - GlobalLink logo */}
          <div className="absolute inset-[40%] z-20">
            <div 
              className="w-full h-full rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer hover:scale-110"
              style={{ 
                background: `linear-gradient(145deg, ${primaryColor}60, ${primaryColor}30)`,
                boxShadow: `0 0 30px ${primaryColor}40`,
                border: `2px solid ${primaryColor}80`,
              }}
              onClick={() => {
                setHoveredProduct(null);
                setHoveredIndex(null);
              }}
            >
              <div className="text-center">
                <Globe className="w-8 h-8 mx-auto text-white/80 mb-1" />
                <span className="text-xs font-bold text-white/90 block">GlobalLink</span>
              </div>
            </div>
          </div>

          {/* Inner ring products */}
          <div 
            className="absolute inset-[15%] pointer-events-none"
            style={{ 
              transformOrigin: 'center', 
              animation: `spin 45s linear infinite`,
              animationPlayState: animationStyle,
            }}
          >
            {innerRing.map((product, i) => {
              const angle = (i * 360 / innerRing.length - 90) * (Math.PI / 180);
              const radius = 50;
              const x = 50 + radius * Math.cos(angle);
              const y = 50 + radius * Math.sin(angle);
              const info = getProductInfo(product.slug);
              const Icon = info.icon;
              const isActive = hoveredProduct?.id === product.id;
              const isConnected = hoveredProduct && connections.includes(linkedGuides.indexOf(product));
              const categoryColor = CATEGORY_COLORS[info.category] || primaryColor;
              
              return (
                <div
                  key={product.id}
                  ref={(el) => {
                    if (el) productRefs.current.set(product.id, el);
                  }}
                  className="absolute pointer-events-auto"
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    transform: 'translate(-50%, -50%)',
                    animation: `spin 45s linear infinite reverse`,
                    animationPlayState: animationStyle,
                  }}
                  onMouseEnter={(e) => {
                    setHoveredProduct(product);
                    setHoveredIndex(i);
                    const rect = e.currentTarget.getBoundingClientRect();
                    const containerRect = containerRef.current?.getBoundingClientRect();
                    if (containerRect) {
                      setTooltipPosition({
                        x: rect.left + rect.width / 2 - containerRect.left,
                        y: rect.top - containerRect.top - 8,
                      });
                    }
                  }}
                  onMouseLeave={() => {
                    setHoveredProduct(null);
                    setHoveredIndex(null);
                    setTooltipPosition(null);
                  }}
                  onClick={() => navigate(`/product/${product.slug}`)}
                >
                  <div 
                    className={cn(
                      "w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300",
                      isActive && "scale-125 z-30",
                      isConnected && "scale-110 ring-2 ring-offset-2 ring-offset-background",
                      !isActive && !isConnected && "hover:scale-110"
                    )}
                    style={{
                      background: isActive 
                        ? `linear-gradient(135deg, ${categoryColor}, ${categoryColor}80)`
                        : `linear-gradient(135deg, ${categoryColor}40, ${categoryColor}20)`,
                      boxShadow: isActive || isConnected
                        ? `0 0 20px ${categoryColor}60, 0 0 40px ${categoryColor}30`
                        : `0 0 10px ${categoryColor}20`,
                      border: `2px solid ${isActive ? categoryColor : categoryColor + '60'}`,
                      '--tw-ring-color': isConnected ? categoryColor : undefined,
                    } as React.CSSProperties}
                  >
                    <Icon 
                      className={cn(
                        "w-5 h-5 md:w-6 md:h-6 transition-all duration-300",
                        isActive ? "text-white" : "text-foreground/70"
                      )} 
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Outer ring products */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{ 
              transformOrigin: 'center', 
              animation: `spin 60s linear infinite reverse`,
              animationPlayState: animationStyle,
            }}
          >
            {outerRing.map((product, i) => {
              const angle = (i * 360 / outerRing.length - 90) * (Math.PI / 180);
              const radius = 45;
              const x = 50 + radius * Math.cos(angle);
              const y = 50 + radius * Math.sin(angle);
              const info = getProductInfo(product.slug);
              const Icon = info.icon;
              const globalIdx = innerRing.length + i;
              const isActive = hoveredProduct?.id === product.id;
              const isConnected = hoveredProduct && connections.includes(globalIdx);
              const categoryColor = CATEGORY_COLORS[info.category] || primaryColor;
              
              return (
                <div
                  key={product.id}
                  ref={(el) => {
                    if (el) productRefs.current.set(product.id, el);
                  }}
                  className="absolute pointer-events-auto"
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    transform: 'translate(-50%, -50%)',
                    animation: `spin 60s linear infinite`,
                    animationPlayState: animationStyle,
                  }}
                  onMouseEnter={(e) => {
                    setHoveredProduct(product);
                    setHoveredIndex(globalIdx);
                    const rect = e.currentTarget.getBoundingClientRect();
                    const containerRect = containerRef.current?.getBoundingClientRect();
                    if (containerRect) {
                      setTooltipPosition({
                        x: rect.left + rect.width / 2 - containerRect.left,
                        y: rect.top - containerRect.top - 8,
                      });
                    }
                  }}
                  onMouseLeave={() => {
                    setHoveredProduct(null);
                    setHoveredIndex(null);
                    setTooltipPosition(null);
                  }}
                  onClick={() => navigate(`/product/${product.slug}`)}
                >
                  <div 
                    className={cn(
                      "w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300",
                      isActive && "scale-125 z-30",
                      isConnected && "scale-110 ring-2 ring-offset-2 ring-offset-background",
                      !isActive && !isConnected && "hover:scale-110"
                    )}
                    style={{
                      background: isActive 
                        ? `linear-gradient(135deg, ${categoryColor}, ${categoryColor}80)`
                        : `linear-gradient(135deg, ${categoryColor}40, ${categoryColor}20)`,
                      boxShadow: isActive || isConnected
                        ? `0 0 20px ${categoryColor}60, 0 0 40px ${categoryColor}30`
                        : `0 0 10px ${categoryColor}20`,
                      border: `2px solid ${isActive ? categoryColor : categoryColor + '60'}`,
                      '--tw-ring-color': isConnected ? categoryColor : undefined,
                    } as React.CSSProperties}
                  >
                    <Icon 
                      className={cn(
                        "w-5 h-5 md:w-6 md:h-6 transition-all duration-300",
                        isActive ? "text-white" : "text-foreground/70"
                      )} 
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Floating product name tooltip in orbit area */}
          {hoveredProduct && tooltipPosition && (
            <div 
              className="absolute z-50 pointer-events-none animate-fade-in"
              style={{
                left: tooltipPosition.x,
                top: tooltipPosition.y,
                transform: 'translate(-50%, -100%)',
              }}
            >
              <div 
                className="whitespace-nowrap text-xs md:text-sm font-semibold px-3 py-1.5 rounded-lg bg-card/95 backdrop-blur-sm shadow-lg border border-border/50"
                style={{ 
                  color: CATEGORY_COLORS[getProductInfo(hoveredProduct.slug).category],
                  boxShadow: `0 4px 16px ${CATEGORY_COLORS[getProductInfo(hoveredProduct.slug).category]}30`
                }}
              >
                {hoveredProduct.name.replace('GlobalLink ', '')}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Category legend */}
      <div className="flex flex-wrap justify-center gap-4 mt-8 px-4">
        {Object.entries(CATEGORY_COLORS).map(([category, color]) => (
          <div key={category} className="flex items-center gap-2 text-sm">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ background: color }}
            />
            <span className="text-muted-foreground">{category}</span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default GlobalLinkUniverseSection;
