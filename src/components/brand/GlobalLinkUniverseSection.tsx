/**
 * GlobalLinkUniverseSection Component
 * World-class interactive orbit visualization for GlobalLink products
 * Features: smooth animations, keyboard nav, touch-friendly, clear visual hierarchy
 */

import React, { useState, useRef, useCallback, useMemo, useEffect, MouseEvent as ReactMouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ArrowRight, Layers, Globe, Mic, Video, FileText, MessageSquare, Tv, Share2, Database, PenTool, Zap, ChevronRight, ExternalLink, Link2 } from 'lucide-react';
import globalLinkIcon from '@/assets/globallink-g-icon.png';

interface LinkedGuide {
  id: string;
  name?: string;
  slug?: string;
  type?: string;
}

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
  showShareButton?: boolean;
}

// Product metadata
const PRODUCT_INFO: Record<string, { 
  icon: React.ElementType;
  description: string;
  category: string;
  connections: string[];
  tagline: string;
}> = {
  'globallink-tms': {
    icon: Database,
    description: 'Enterprise translation management system for global content workflows.',
    category: 'Core Platform',
    connections: ['GlobalLink Web', 'GlobalLink CCMS', 'GlobalLink NOW'],
    tagline: 'Central Hub',
  },
  'globallink-web': {
    icon: Globe,
    description: 'Automated website localization with seamless CMS integration.',
    category: 'Web',
    connections: ['GlobalLink TMS', 'GlobalLink Strings'],
    tagline: 'Web Localization',
  },
  'globallink-now': {
    icon: Zap,
    description: 'AI-powered instant translation for rapid content delivery.',
    category: 'AI-Powered',
    connections: ['GlobalLink TMS', 'GlobalLink Write'],
    tagline: 'Instant AI',
  },
  'globallink-write': {
    icon: PenTool,
    description: 'AI writing assistant optimized for multilingual content creation.',
    category: 'AI-Powered',
    connections: ['GlobalLink NOW', 'GlobalLink TMS'],
    tagline: 'AI Writing',
  },
  'globallink-voice': {
    icon: Mic,
    description: 'Voice-over and audio localization services for multimedia.',
    category: 'Media',
    connections: ['GlobalLink TV', 'GlobalLink Media'],
    tagline: 'Audio & Voice',
  },
  'globallink-scribe': {
    icon: FileText,
    description: 'Subtitle and caption localization for video content.',
    category: 'Media',
    connections: ['GlobalLink TV', 'GlobalLink Voice'],
    tagline: 'Subtitles',
  },
  'globallink-live': {
    icon: MessageSquare,
    description: 'Real-time interpretation and live event localization.',
    category: 'Live',
    connections: ['GlobalLink Voice', 'GlobalLink TV'],
    tagline: 'Live Events',
  },
  'globallink-tv': {
    icon: Tv,
    description: 'End-to-end broadcast and streaming content localization.',
    category: 'Media',
    connections: ['GlobalLink Voice', 'GlobalLink Scribe', 'GlobalLink Media'],
    tagline: 'Broadcast',
  },
  'globallink-media': {
    icon: Video,
    description: 'Rich media adaptation for global markets.',
    category: 'Media',
    connections: ['GlobalLink TV', 'GlobalLink Voice'],
    tagline: 'Rich Media',
  },
  'globallink-strings': {
    icon: Layers,
    description: 'Software and app string localization management.',
    category: 'Development',
    connections: ['GlobalLink TMS', 'GlobalLink Web'],
    tagline: 'App Strings',
  },
  'globallink-share': {
    icon: Share2,
    description: 'Collaborative translation portal for distributed teams.',
    category: 'Collaboration',
    connections: ['GlobalLink TMS', 'GlobalLink CCMS'],
    tagline: 'Team Portal',
  },
  'globallink-ccms': {
    icon: Database,
    description: 'Component content management for structured authoring.',
    category: 'Core Platform',
    connections: ['GlobalLink TMS', 'GlobalLink Share'],
    tagline: 'Content System',
  },
};

// Category colors with enhanced palette
const CATEGORY_COLORS: Record<string, { primary: string; bg: string; text: string }> = {
  'Core Platform': { primary: '#6366f1', bg: '#6366f115', text: '#6366f1' },
  'Web': { primary: '#14b8a6', bg: '#14b8a615', text: '#14b8a6' },
  'AI-Powered': { primary: '#f59e0b', bg: '#f59e0b15', text: '#f59e0b' },
  'Media': { primary: '#ec4899', bg: '#ec489915', text: '#ec4899' },
  'Live': { primary: '#ef4444', bg: '#ef444415', text: '#ef4444' },
  'Development': { primary: '#22c55e', bg: '#22c55e15', text: '#22c55e' },
  'Collaboration': { primary: '#8b5cf6', bg: '#8b5cf615', text: '#8b5cf6' },
};

// Get category color helper
const getCategoryColor = (category: string) => CATEGORY_COLORS[category] || CATEGORY_COLORS['Core Platform'];

export const GlobalLinkUniverseSection: React.FC<GlobalLinkUniverseSectionProps> = ({
  linkedGuides,
  primaryColor = '#6366f1',
  className,
  showShareButton = true,
}) => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedProduct, setSelectedProduct] = useState<ValidatedGuide | null>(null);
  const [hoveredProduct, setHoveredProduct] = useState<ValidatedGuide | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [orbitTilt, setOrbitTilt] = useState({ x: 0, y: 0 });
  const [rippleId, setRippleId] = useState<string | null>(null);
  const orbitRef = useRef<HTMLDivElement>(null);

  const getProductInfo = useCallback((slug: string) => {
    return PRODUCT_INFO[slug] || {
      icon: Layers,
      description: 'GlobalLink product for enterprise localization.',
      category: 'Core Platform',
      connections: [],
      tagline: 'Product',
    };
  }, []);

  // Filter valid guides
  const validGuides = useMemo(() => {
    return linkedGuides.filter((g): g is ValidatedGuide => Boolean(g.name && g.slug));
  }, [linkedGuides]);

  // Group products by category for better organization
  const productsByCategory = useMemo(() => {
    const groups: Record<string, ValidatedGuide[]> = {};
    validGuides.forEach(guide => {
      const info = getProductInfo(guide.slug);
      if (!groups[info.category]) groups[info.category] = [];
      groups[info.category].push(guide);
    });
    return groups;
  }, [validGuides, getProductInfo]);

  // Active product (selected or hovered)
  const activeProduct = selectedProduct || hoveredProduct;
  const activeInfo = activeProduct ? getProductInfo(activeProduct.slug) : null;
  const activeColor = activeInfo ? getCategoryColor(activeInfo.category) : null;

  // Get connected products
  const connectedProducts = useMemo(() => {
    if (!activeProduct) return [];
    const info = getProductInfo(activeProduct.slug);
    return info.connections
      .map(name => validGuides.find(g => g.name === name))
      .filter((g): g is ValidatedGuide => g !== undefined);
  }, [activeProduct, validGuides, getProductInfo]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedProduct(null);
        setFocusedIndex(-1);
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        setFocusedIndex(prev => (prev + 1) % validGuides.length);
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        setFocusedIndex(prev => (prev - 1 + validGuides.length) % validGuides.length);
      } else if (e.key === 'Enter' && focusedIndex >= 0) {
        setSelectedProduct(validGuides[focusedIndex]);
      }
    };

    if (containerRef.current?.contains(document.activeElement)) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [focusedIndex, validGuides]);

  // Update selection when focused
  useEffect(() => {
    if (focusedIndex >= 0 && validGuides[focusedIndex]) {
      setHoveredProduct(validGuides[focusedIndex]);
    }
  }, [focusedIndex, validGuides]);

  const handleProductClick = useCallback((product: ValidatedGuide) => {
    if (selectedProduct?.id === product.id) {
      // Double click - navigate
      navigate(`/product/${product.slug}`);
    } else {
      setSelectedProduct(product);
    }
  }, [selectedProduct, navigate]);

  // Handle orbit hover for 3D tilt effect
  const handleOrbitMouseMove = useCallback((e: ReactMouseEvent<HTMLDivElement>) => {
    if (!orbitRef.current) return;
    const rect = orbitRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const x = (e.clientX - centerX) / (rect.width / 2);
    const y = (e.clientY - centerY) / (rect.height / 2);
    setOrbitTilt({ x: y * -8, y: x * 8 }); // Subtle tilt max 8deg
  }, []);

  const handleOrbitMouseLeave = useCallback(() => {
    setOrbitTilt({ x: 0, y: 0 });
  }, []);

  return (
    <section className={cn("relative py-10 md:py-16 overflow-hidden", className)} ref={containerRef} tabIndex={0}>
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div 
          className="absolute inset-0 opacity-[0.02] transition-all duration-700"
          style={{
            background: activeColor 
              ? `radial-gradient(ellipse at 70% 50%, ${activeColor.primary} 0%, transparent 60%)`
              : `radial-gradient(ellipse at 70% 50%, ${primaryColor} 0%, transparent 60%)`,
          }}
        />
      </div>

      {/* Header */}
      <div className="text-center mb-8 md:mb-12 px-4">
        <div className="inline-flex items-center gap-2 mb-3">
          <img src={globalLinkIcon} alt="GlobalLink" className="w-8 h-8 md:w-10 md:h-10" />
          <h2 className="text-2xl md:text-4xl font-bold text-foreground">
            Product Universe
          </h2>
          
          {/* Share button */}
          {showShareButton && (
            <button
              onClick={() => {
                const url = `${window.location.origin}/product/globallink/universe`;
                navigator.clipboard.writeText(url);
                // Show toast or visual feedback
                const toast = document.createElement('div');
                toast.className = 'fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg animate-fade-in z-50';
                toast.textContent = 'Link copied to clipboard!';
                document.body.appendChild(toast);
                setTimeout(() => toast.remove(), 2000);
              }}
              className="ml-2 p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors group"
              title="Copy shareable link"
            >
              <Link2 className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </button>
          )}
        </div>
        <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto">
          {validGuides.length} interconnected products powering global content
        </p>
      </div>

      {/* Main content grid - 2 column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 px-4 max-w-7xl mx-auto">
        
        {/* Left: Product Categories */}
        <div className="lg:col-span-3 order-2 lg:order-1">
          <div className="sticky top-24 space-y-3">
            {Object.entries(productsByCategory).map(([category, products]) => {
              const catColor = getCategoryColor(category);
              const hasActiveProduct = products.some(p => activeProduct?.id === p.id);
              
              return (
                <div 
                  key={category}
                  className={cn(
                    "rounded-xl border transition-all duration-300",
                    hasActiveProduct 
                      ? "border-border/60 bg-card/80 shadow-lg" 
                      : "border-border/30 bg-card/40"
                  )}
                >
                  {/* Category header */}
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-border/20">
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ background: catColor.primary }}
                    />
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {category}
                    </span>
                    <span className="ml-auto text-[10px] text-muted-foreground/60">
                      {products.length}
                    </span>
                  </div>
                  
                  {/* Products in category */}
                  <div className="p-1.5">
                    {products.map((product) => {
                      const info = getProductInfo(product.slug);
                      const Icon = info.icon;
                      const isActive = activeProduct?.id === product.id;
                      const isConnected = connectedProducts.some(p => p.id === product.id);
                      const globalIndex = validGuides.indexOf(product);
                      const isFocused = focusedIndex === globalIndex;
                      
                      return (
                        <button
                          key={product.id}
                          className={cn(
                            "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all duration-200 group relative",
                            isActive && "bg-gradient-to-r shadow-sm",
                            isConnected && !isActive && "bg-muted/30",
                            isFocused && "ring-2 ring-primary/50",
                            !isActive && !isConnected && "hover:bg-muted/40"
                          )}
                          style={{
                            background: isActive ? `linear-gradient(135deg, ${catColor.bg}, transparent)` : undefined,
                          }}
                          onMouseEnter={() => setHoveredProduct(product)}
                          onMouseLeave={() => !selectedProduct && setHoveredProduct(null)}
                          onClick={() => handleProductClick(product)}
                          onFocus={() => setFocusedIndex(globalIndex)}
                        >
                          {/* Icon */}
                          <div 
                            className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200",
                              isActive && "scale-105"
                            )}
                            style={{ 
                              background: isActive ? catColor.primary : catColor.bg,
                            }}
                          >
                            <Icon 
                              className="w-4 h-4 transition-colors" 
                              style={{ color: isActive ? 'white' : catColor.text }}
                            />
                          </div>
                          
                          {/* Text */}
                          <div className="flex-1 min-w-0">
                            <div className={cn(
                              "text-sm font-medium truncate transition-colors",
                              isActive ? "text-foreground" : "text-foreground/80 group-hover:text-foreground"
                            )}>
                              {product.name.replace('GlobalLink ', '')}
                            </div>
                            <div className="text-[10px] text-muted-foreground truncate">
                              {info.tagline}
                            </div>
                          </div>
                          
                          {/* Connection indicator */}
                          {isConnected && !isActive && (
                            <div 
                              className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0"
                              style={{ background: catColor.primary }}
                            />
                          )}
                          
                          {/* Active indicator */}
                          {isActive && (
                            <ChevronRight 
                              className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5" 
                              style={{ color: catColor.primary }}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Orbit Visualization - Larger area */}
        <div className="lg:col-span-9 order-1 lg:order-2" style={{ perspective: '1000px' }}>
          <div 
            ref={orbitRef}
            className="relative aspect-square max-w-2xl mx-auto transition-transform duration-200 ease-out"
            style={{
              transform: `rotateX(${orbitTilt.x}deg) rotateY(${orbitTilt.y}deg)`,
              transformStyle: 'preserve-3d',
            }}
            onMouseMove={handleOrbitMouseMove}
            onMouseLeave={handleOrbitMouseLeave}
          >
            {/* Orbit rings */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="orbitGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={activeColor?.primary || primaryColor} stopOpacity="0.1" />
                  <stop offset="100%" stopColor={activeColor?.primary || primaryColor} stopOpacity="0.02" />
                </linearGradient>
              </defs>
              
              {/* Outer ring */}
              <circle 
                cx="50" cy="50" r="46" 
                fill="none" 
                stroke="url(#orbitGradient)" 
                strokeWidth="0.5"
                className="transition-all duration-500"
              />
              <circle 
                cx="50" cy="50" r="46" 
                fill="none" 
                stroke={activeColor?.primary || primaryColor}
                strokeWidth="0.3"
                strokeOpacity="0.15"
                strokeDasharray="2 4"
                className="transition-all duration-500"
              />
              
              {/* Inner ring */}
              <circle 
                cx="50" cy="50" r="28" 
                fill="none" 
                stroke={activeColor?.primary || primaryColor}
                strokeWidth="0.5"
                strokeOpacity="0.1"
                className="transition-all duration-500"
              />
              
              {/* Connection lines */}
              {activeProduct && connectedProducts.map((connProduct, i) => {
                const activeIdx = validGuides.indexOf(activeProduct);
                const connIdx = validGuides.indexOf(connProduct);
                
                // Calculate positions
                const getPosition = (idx: number) => {
                  const total = validGuides.length;
                  const angle = (idx * 360 / total - 90) * (Math.PI / 180);
                  const radius = idx < Math.ceil(total / 2) ? 28 : 46;
                  return {
                    x: 50 + radius * Math.cos(angle),
                    y: 50 + radius * Math.sin(angle),
                  };
                };
                
                const from = getPosition(activeIdx);
                const to = getPosition(connIdx);
                const connInfo = getProductInfo(connProduct.slug);
                const connColor = getCategoryColor(connInfo.category);
                
                // Curved path through center
                const midX = (from.x + to.x) / 2;
                const midY = (from.y + to.y) / 2;
                const ctrlX = midX + (50 - midX) * 0.4;
                const ctrlY = midY + (50 - midY) * 0.4;
                const pathD = `M ${from.x} ${from.y} Q ${ctrlX} ${ctrlY} ${to.x} ${to.y}`;
                
                const baseDur = 2.5 + i * 0.3;
                const baseDelay = i * 0.4;
                
                return (
                  <g key={connProduct.id}>
                    {/* Defs for gradients and filters */}
                    <defs>
                      <linearGradient id={`lineGrad-${connProduct.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={connColor.primary} stopOpacity="0.06" />
                        <stop offset="50%" stopColor={connColor.primary} stopOpacity="0.15" />
                        <stop offset="100%" stopColor={connColor.primary} stopOpacity="0.06" />
                      </linearGradient>
                      {/* Soft glow filter */}
                      <filter id={`orbGlow-${connProduct.id}`} x="-200%" y="-200%" width="500%" height="500%">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                    </defs>
                    
                    {/* Thin base path */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke={`url(#lineGrad-${connProduct.id})`}
                      strokeWidth="0.5"
                      strokeLinecap="round"
                    />
                    
                    {/* Trail particles - 5 fading orbs */}
                    {[0, 1, 2, 3, 4].map((trailIdx) => (
                      <circle 
                        key={trailIdx}
                        r={1.2 - trailIdx * 0.18} 
                        fill={connColor.primary}
                        opacity={0.5 - trailIdx * 0.1}
                      >
                        <animateMotion
                          dur={`${baseDur}s`}
                          repeatCount="indefinite"
                          begin={`${baseDelay + trailIdx * 0.08}s`}
                          path={pathD}
                          calcMode="spline"
                          keySplines="0.4 0 0.2 1"
                          keyTimes="0;1"
                        />
                      </circle>
                    ))}
                    
                    {/* Main glowing orb */}
                    <circle 
                      r="1.6" 
                      fill={connColor.primary}
                      filter={`url(#orbGlow-${connProduct.id})`}
                    >
                      <animateMotion
                        dur={`${baseDur}s`}
                        repeatCount="indefinite"
                        begin={`${baseDelay}s`}
                        path={pathD}
                        calcMode="spline"
                        keySplines="0.4 0 0.2 1"
                        keyTimes="0;1"
                      />
                      {/* Breathing pulse */}
                      <animate
                        attributeName="opacity"
                        values="0.6;1;0.6"
                        dur="1s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="r"
                        values="1.4;1.8;1.4"
                        dur="1s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  </g>
                );
              })}
            </svg>

            {/* Center hub */}
            <div className="absolute inset-[38%] z-20">
              <button 
                className={cn(
                  "w-full h-full rounded-full flex items-center justify-center transition-all duration-500",
                  "hover:scale-105 active:scale-95"
                )}
                style={{ 
                  background: activeColor 
                    ? `linear-gradient(145deg, ${activeColor.primary}50, ${activeColor.primary}20)`
                    : `linear-gradient(145deg, ${primaryColor}40, ${primaryColor}15)`,
                  boxShadow: activeColor 
                    ? `0 0 60px ${activeColor.primary}30, inset 0 0 30px ${activeColor.primary}15`
                    : `0 0 40px ${primaryColor}20`,
                  border: `3px solid ${activeColor?.primary || primaryColor}50`,
                }}
                onClick={() => {
                  setSelectedProduct(null);
                  setHoveredProduct(null);
                }}
                aria-label="Reset selection"
              >
                <img 
                  src={globalLinkIcon} 
                  alt="GlobalLink" 
                  className="w-3/4 h-3/4 object-contain drop-shadow-lg transition-transform duration-300 hover:scale-110"
                />
              </button>
            </div>

            {/* Product nodes */}
            {validGuides.map((product, idx) => {
              const info = getProductInfo(product.slug);
              const Icon = info.icon;
              const catColor = getCategoryColor(info.category);
              const isActive = activeProduct?.id === product.id;
              const isConnected = connectedProducts.some(p => p.id === product.id);
              
              // Position calculation
              const total = validGuides.length;
              const angle = (idx * 360 / total - 90) * (Math.PI / 180);
              const radius = idx < Math.ceil(total / 2) ? 28 : 46;
              const x = 50 + radius * Math.cos(angle);
              const y = 50 + radius * Math.sin(angle);
              
              return (
                <button
                  key={product.id}
                  className={cn(
                    "absolute transition-all duration-300 z-10 select-none",
                    "w-12 h-12 md:w-14 md:h-14",
                    "hover:z-30 focus:z-30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background rounded-full",
                    isActive && "z-30 scale-125",
                    isConnected && !isActive && "scale-110",
                    !isActive && !isConnected && "hover:scale-110"
                  )}
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    transform: `translate(-50%, -50%)`,
                    WebkitUserSelect: 'none',
                    userSelect: 'none',
                  }}
                  onMouseEnter={() => setHoveredProduct(product)}
                  onMouseLeave={() => !selectedProduct && setHoveredProduct(null)}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Trigger ripple
                    setRippleId(product.id);
                    setTimeout(() => setRippleId(null), 600);
                    handleProductClick(product);
                  }}
                  onMouseDown={(e) => e.preventDefault()}
                  draggable={false}
                  aria-label={product.name}
                >
                  {/* Ripple effect on click */}
                  {rippleId === product.id && (
                    <div 
                      className="absolute inset-0 rounded-full pointer-events-none overflow-hidden"
                    >
                      <div 
                        className="absolute inset-[-50%] rounded-full pointer-events-none"
                        style={{ 
                          background: `radial-gradient(circle, ${catColor.primary}60 0%, transparent 70%)`,
                          animation: 'ripple-expand 0.6s ease-out forwards',
                        }} 
                      />
                    </div>
                  )}
                  
                  {/* Pulse ring */}
                  {(isActive || isConnected) && (
                    <div 
                      className="absolute inset-[-6px] rounded-full animate-ping pointer-events-none"
                      style={{ 
                        background: catColor.primary,
                        opacity: 0.2,
                        animationDuration: '2s',
                      }} 
                    />
                  )}
                  
                  {/* Node container - centered absolutely, pointer-events-none */}
                  <div 
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  >
                    <div 
                      className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-300"
                      style={{
                        background: isActive 
                          ? `linear-gradient(135deg, ${catColor.primary}, ${catColor.primary}bb)`
                          : isConnected
                          ? `linear-gradient(135deg, ${catColor.primary}70, ${catColor.primary}40)`
                          : `linear-gradient(135deg, ${catColor.bg}, ${catColor.primary}15)`,
                        boxShadow: isActive 
                          ? `0 0 30px ${catColor.primary}50, 0 4px 15px ${catColor.primary}30`
                          : isConnected
                          ? `0 0 20px ${catColor.primary}30`
                          : `0 2px 10px ${catColor.primary}10`,
                        border: `2px solid ${isActive ? catColor.primary : isConnected ? catColor.primary + '80' : catColor.primary + '30'}`,
                      }}
                    >
                      <Icon 
                        className={cn(
                          "w-5 h-5 md:w-6 md:h-6 transition-all",
                          isActive ? "text-white" : "text-foreground/70"
                        )} 
                        style={{ color: isActive ? 'white' : catColor.text }}
                      />
                    </div>
                  </div>
                  
                  {/* Label */}
                  {isActive && (
                    <div 
                      className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] md:text-xs font-bold px-2.5 py-1 rounded-full animate-fade-in shadow-lg"
                      style={{ 
                        background: catColor.primary,
                        color: 'white',
                      }}
                    >
                      {product.name.replace('GlobalLink ', '')}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Detail Panel - Now below the orbit */}
          <div className="mt-8 max-w-2xl mx-auto">
            {activeProduct && activeInfo ? (
              <div 
                className="rounded-xl border bg-card overflow-hidden animate-fade-in"
                style={{
                  borderColor: activeColor?.primary + '30',
                  boxShadow: `0 10px 40px ${activeColor?.primary}10`,
                }}
              >
                <div className="flex flex-col md:flex-row">
                  {/* Left side - Header with gradient */}
                  <div 
                    className="px-5 py-4 relative overflow-hidden md:w-1/3 flex flex-col justify-center"
                    style={{ background: `linear-gradient(135deg, ${activeColor?.bg}, transparent)` }}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: activeColor?.primary }}
                      >
                        <activeInfo.icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-lg text-foreground truncate">
                          {activeProduct.name}
                        </h3>
                        <span 
                          className="text-xs font-medium"
                          style={{ color: activeColor?.text }}
                        >
                          {activeInfo.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right side - Content */}
                  <div className="px-5 py-4 flex-1 flex flex-col md:flex-row gap-4 items-start md:items-center">
                    <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                      {activeInfo.description}
                    </p>
                    
                    {/* Connections */}
                    {connectedProducts.length > 0 && (
                      <div className="shrink-0">
                        <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                          Integrations
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {connectedProducts.map(conn => {
                            const connInfo = getProductInfo(conn.slug);
                            const connColor = getCategoryColor(connInfo.category);
                            return (
                              <button
                                key={conn.id}
                                className="text-[10px] px-2 py-0.5 rounded-full font-medium transition-all hover:scale-105"
                                style={{ 
                                  background: connColor.bg,
                                  color: connColor.text,
                                }}
                                onClick={() => setSelectedProduct(conn)}
                              >
                                {conn.name.replace('GlobalLink ', '')}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {/* CTA */}
                    <button
                      onClick={() => navigate(`/product/${activeProduct.slug}`)}
                      className="shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                      style={{
                        background: `linear-gradient(135deg, ${activeColor?.primary}, ${activeColor?.primary}cc)`,
                        boxShadow: `0 4px 20px ${activeColor?.primary}40`,
                      }}
                    >
                      View Guide
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border/40 bg-muted/10 px-6 py-4 text-center flex items-center justify-center gap-4">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: `${primaryColor}10` }}
                >
                  <Globe className="w-6 h-6 text-muted-foreground/40" />
                </div>
                <div className="text-left">
                  <p className="text-sm text-muted-foreground font-medium">
                    Select a product
                  </p>
                  <p className="text-xs text-muted-foreground/60">
                    Click or hover to explore connections
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category legend */}
      <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-10 px-4">
        {Object.entries(CATEGORY_COLORS).map(([category, colors]) => (
          <div key={category} className="flex items-center gap-2 text-xs md:text-sm">
            <div 
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: colors.primary, boxShadow: `0 0 8px ${colors.primary}40` }}
            />
            <span className="text-muted-foreground">{category}</span>
          </div>
        ))}
      </div>

      {/* Keyboard hint */}
      <div className="text-center mt-6 text-[10px] md:text-xs text-muted-foreground/50">
        Use arrow keys to navigate • Enter to select • Escape to clear
      </div>
    </section>
  );
};

export default GlobalLinkUniverseSection;
