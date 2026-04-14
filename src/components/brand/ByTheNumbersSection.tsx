import { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Edit2, Check, BarChart3, DollarSign, TrendingUp, Users, Globe, Building2, Award, Target, Zap, Clock, Calendar, CheckCircle, Star, Heart, FileText, Briefcase, ShieldCheck, Percent, Hash, Package, Truck, Phone, Mail, MapPin, Layers, Grid3X3, LayoutList, CircleDot, Columns, Sparkles, X, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { SectionHeader } from './SectionHeader';
import { StatisticItem, InfographicLayout, DEFAULT_STATISTICS, BrandColor } from '@/types/brand';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface ByTheNumbersSectionProps {
  statistics: StatisticItem[];
  onStatisticsChange?: (statistics: StatisticItem[]) => void;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
  brandName?: string;
  infographicLayout?: InfographicLayout;
  onLayoutChange?: (layout: InfographicLayout) => void;
  brandColors?: BrandColor[];
}

// Icon mapping
const iconMap: Record<string, React.ElementType> = {
  DollarSign, TrendingUp, Users, Globe, Building2, Award,
  Target, Zap, Clock, Calendar, CheckCircle, Star,
  Heart, FileText, Briefcase, ShieldCheck, Percent, Hash,
  Package, Truck, Phone, Mail, MapPin, BarChart3, Sparkles, Headphones
};

const STAT_ICONS = Object.keys(iconMap);

const getIconComponent = (iconName?: string): React.ElementType => {
  if (!iconName) return BarChart3;
  return iconMap[iconName] || BarChart3;
};

const layoutOptions: { value: InfographicLayout; label: string; icon: React.ElementType }[] = [
  { value: 'infographic', label: 'Infographic', icon: Layers },
  { value: 'cards', label: 'Card Grid', icon: Grid3X3 },
  { value: 'vertical-list', label: 'Vertical List', icon: LayoutList },
  { value: 'hero-stats', label: 'Hero Stats', icon: Sparkles },
  { value: 'split-panel', label: 'Split Panel', icon: Columns },
  { value: 'circular', label: 'Circular', icon: CircleDot },
];

// Helper to convert hex to HSL for CSS custom properties
const hexToHsl = (hex: string): { h: number; s: number; l: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { h: 210, s: 70, l: 50 };

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
};

export const ByTheNumbersSection = ({
  statistics,
  onStatisticsChange,
  customSubtitle,
  onSubtitleChange,
  brandName = 'Brand',
  infographicLayout = 'infographic',
  onLayoutChange,
  brandColors = []
}: ByTheNumbersSectionProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isHeaderEditing, setIsHeaderEditing] = useState(false);
  const [animatedStats, setAnimatedStats] = useState<Set<string>>(new Set());
  const [showEditPanel, setShowEditPanel] = useState(false);
  const [hoveredStat, setHoveredStat] = useState<string | null>(null);

  // Extract brand colors for theming
  const themeColors = useMemo(() => {
    const primary = brandColors.find(c => c.role === 'primary') || brandColors[0];
    const secondary = brandColors.find(c => c.role === 'secondary') || brandColors[1];
    const accent = brandColors.find(c => c.role === 'accent') || brandColors[2];
    
    return {
      primary: primary?.hex || '#003b71',
      secondary: secondary?.hex || '#139dd8',
      accent: accent?.hex || '#3bbfb5',
      primaryHsl: hexToHsl(primary?.hex || '#003b71'),
      secondaryHsl: hexToHsl(secondary?.hex || '#139dd8'),
      accentHsl: hexToHsl(accent?.hex || '#3bbfb5'),
    };
  }, [brandColors]);

  // Generate gradient stops from brand colors
  const gradientColors = useMemo(() => {
    const colors = brandColors.slice(0, 4).map(c => c.hex);
    if (colors.length < 2) return [themeColors.primary, themeColors.secondary];
    return colors;
  }, [brandColors, themeColors]);

  // Trigger staggered animations on mount
  useEffect(() => {
    setAnimatedStats(new Set());
    const timer = setTimeout(() => {
      statistics.forEach((stat, index) => {
        setTimeout(() => {
          setAnimatedStats(prev => new Set(prev).add(stat.id));
        }, index * 120);
      });
    }, 100);
    return () => clearTimeout(timer);
  }, [statistics]);

  // Derive canEdit from handler presence
  const canEdit = Boolean(onStatisticsChange);

  // Helper to open edit panel only when editing is allowed
  const openEditPanel = (statId: string) => {
    if (!canEdit) return;
    setEditingId(statId);
    setShowEditPanel(true);
  };

  const addStatistic = () => {
    if (!onStatisticsChange) return;
    const newStat: StatisticItem = {
      id: `stat-${Date.now()}`,
      value: '100',
      suffix: '+',
      label: 'New Metric',
      description: 'Description of this metric',
      icon: 'BarChart3',
      category: 'primary'
    };
    onStatisticsChange([...statistics, newStat]);
    setEditingId(newStat.id);
    setShowEditPanel(true);
  };

  const updateStatistic = (id: string, updates: Partial<StatisticItem>) => {
    if (!onStatisticsChange) return;
    onStatisticsChange(
      statistics.map(stat => stat.id === id ? { ...stat, ...updates } : stat)
    );
  };

  const deleteStatistic = (id: string) => {
    if (!onStatisticsChange) return;
    onStatisticsChange(statistics.filter(stat => stat.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const populateDefaults = () => {
    if (!onStatisticsChange) return;
    onStatisticsChange(DEFAULT_STATISTICS);
  };

  const primaryStats = statistics.filter(s => s.category === 'primary' || !s.category);
  const secondaryStats = statistics.filter(s => s.category === 'secondary');
  const highlightStats = statistics.filter(s => s.category === 'highlight');

  // Dynamic styles based on brand colors
  const dynamicStyles = useMemo(() => ({
    '--brand-primary': themeColors.primary,
    '--brand-secondary': themeColors.secondary,
    '--brand-accent': themeColors.accent,
    '--brand-gradient': `linear-gradient(135deg, ${gradientColors.join(', ')})`,
    '--brand-glow': `0 0 40px ${themeColors.primary}40`,
  } as React.CSSProperties), [themeColors, gradientColors]);

  // Render editing panel for a stat
  const renderEditPanel = () => {
    if (!canEdit || !editingId) return null;
    const stat = statistics.find(s => s.id === editingId);
    if (!stat) return null;

    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-2" style={{ borderColor: themeColors.primary }}>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Edit Statistic</h3>
              <Button size="icon" variant="ghost" onClick={() => { setEditingId(null); setShowEditPanel(false); }}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <Select
              value={stat.icon || 'BarChart3'}
              onValueChange={(value) => updateStatistic(stat.id, { icon: value })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select icon" />
              </SelectTrigger>
              <SelectContent>
                {STAT_ICONS.map((iconName) => {
                  const Icon = iconMap[iconName];
                  return (
                    <SelectItem key={iconName} value={iconName}>
                      <div className="flex items-center gap-2">
                        {Icon && <Icon className="h-4 w-4" />}
                        <span>{iconName}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Input
                value={stat.prefix || ''}
                onChange={(e) => updateStatistic(stat.id, { prefix: e.target.value })}
                placeholder="$"
                className="w-16"
              />
              <Input
                value={stat.value}
                onChange={(e) => updateStatistic(stat.id, { value: e.target.value })}
                placeholder="Value"
                className="flex-1"
              />
              <Input
                value={stat.suffix || ''}
                onChange={(e) => updateStatistic(stat.id, { suffix: e.target.value })}
                placeholder="+, %, B"
                className="w-16"
              />
            </div>

            <Input
              value={stat.label}
              onChange={(e) => updateStatistic(stat.id, { label: e.target.value })}
              placeholder="Label"
            />

            <Select
              value={stat.category || 'primary'}
              onValueChange={(value) => updateStatistic(stat.id, { category: value as StatisticItem['category'] })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="primary">Primary (Top Row)</SelectItem>
                <SelectItem value="secondary">Secondary (Bottom Row)</SelectItem>
                <SelectItem value="highlight">Highlight (Featured)</SelectItem>
              </SelectContent>
            </Select>

            <Textarea
              value={stat.description || ''}
              onChange={(e) => updateStatistic(stat.id, { description: e.target.value })}
              placeholder="Description (optional)"
              className="resize-none"
              rows={2}
            />

            <div className="flex gap-2 pt-2">
              <Button 
                className="flex-1" 
                onClick={() => { setEditingId(null); setShowEditPanel(false); }}
                style={{ background: themeColors.primary }}
              >
                <Check className="h-4 w-4 mr-2" /> Save
              </Button>
              <Button variant="destructive" onClick={() => { deleteStatistic(stat.id); setShowEditPanel(false); }}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // ==================== INTERACTIVE INFOGRAPHIC LAYOUT ====================
  const renderInfographicLayout = () => (
    <div className="space-y-8" style={dynamicStyles}>
      {/* Primary Stats - Animated Cards with Brand Colors */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {primaryStats.slice(0, 4).map((stat, index) => {
          const isAnimated = animatedStats.has(stat.id);
          const isHovered = hoveredStat === stat.id;
          const IconComponent = getIconComponent(stat.icon);
          const colorIndex = index % gradientColors.length;
          const cardColor = gradientColors[colorIndex] || themeColors.primary;
          const hsl = hexToHsl(cardColor);
          
          return (
            <div
              key={stat.id}
              className={cn(
                "group relative overflow-hidden rounded-2xl",
                "transition-all duration-500 ease-out transform-gpu",
                isAnimated ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-12 scale-90",
                isHovered && "scale-105 -translate-y-2",
                canEdit && "cursor-pointer"
              )}
              style={{ 
                animationDelay: `${index * 100}ms`,
                boxShadow: isHovered ? `0 20px 40px -10px ${cardColor}50` : `0 8px 24px -8px ${cardColor}30`,
              }}
              onClick={() => openEditPanel(stat.id)}
              onMouseEnter={() => setHoveredStat(stat.id)}
              onMouseLeave={() => setHoveredStat(null)}
            >
              {/* Background gradient */}
              <div 
                className="absolute inset-0 transition-opacity duration-300"
                style={{ 
                  background: `linear-gradient(135deg, ${cardColor} 0%, ${cardColor}dd 50%, ${cardColor}bb 100%)`,
                  opacity: isHovered ? 1 : 0.95,
                }}
              />
              
              {/* Animated glow effect */}
              <div 
                className={cn(
                  "absolute inset-0 opacity-0 transition-opacity duration-500",
                  isHovered && "opacity-100"
                )}
                style={{
                  background: `radial-gradient(circle at 50% 0%, ${cardColor}60 0%, transparent 70%)`,
                }}
              />
              
              {/* Floating particles effect */}
              <div className="absolute inset-0 overflow-hidden">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute rounded-full bg-white/10"
                    style={{
                      width: 8 + i * 4,
                      height: 8 + i * 4,
                      left: `${20 + i * 30}%`,
                      top: `${60 + i * 10}%`,
                      animation: `float ${3 + i}s ease-in-out infinite`,
                      animationDelay: `${i * 0.5}s`,
                    }}
                  />
                ))}
              </div>
              
              {/* Content */}
              <div className="relative p-6 md:p-8 text-white text-center z-10">
                {/* Icon */}
                <div className={cn(
                  "inline-flex items-center justify-center w-12 h-12 rounded-full mb-4",
                  "bg-white/20 backdrop-blur-sm transition-transform duration-300",
                  isHovered && "scale-110 rotate-12"
                )}>
                  <IconComponent className="h-6 w-6" />
                </div>
                
                {/* Value with counting animation effect */}
                <div className={cn(
                  "text-4xl md:text-5xl lg:text-6xl font-black mb-2 tracking-tight",
                  "transition-transform duration-300",
                  isHovered && "scale-105"
                )}>
                  <span className="tabular-nums">{stat.prefix}{stat.value}{stat.suffix}</span>
                </div>
                
                {/* Label */}
                <div className="text-sm md:text-base font-semibold uppercase tracking-widest opacity-90">
                  {stat.label}
                </div>
                
                {/* Description on hover */}
                {stat.description && (
                  <div className={cn(
                    "text-xs opacity-0 max-h-0 overflow-hidden transition-all duration-300",
                    isHovered && "opacity-70 max-h-20 mt-2"
                  )}>
                    {stat.description}
                  </div>
                )}
              </div>
              
              {/* Edit indicator */}
              {canEdit && (
              <div className={cn(
                "absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20",
                "flex items-center justify-center opacity-0 transition-opacity duration-300",
                isHovered && "opacity-100"
              )}>
                <Edit2 className="h-4 w-4 text-white" />
              </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Support Banner with animated gradient */}
      <div 
        className={cn(
          "relative overflow-hidden rounded-xl py-5 px-8",
          "transition-all duration-700",
          animatedStats.size > 0 ? "opacity-100 scale-100" : "opacity-0 scale-95"
        )}
        style={{
          background: `linear-gradient(90deg, ${themeColors.primary}, ${themeColors.secondary}, ${themeColors.accent || themeColors.primary})`,
          backgroundSize: '200% 100%',
          animation: 'shimmer 3s linear infinite',
        }}
      >
        <div className="flex items-center justify-center gap-4 text-white relative z-10">
          <Headphones className="h-6 w-6 animate-pulse" />
          <span className="text-lg md:text-xl font-bold tracking-[0.2em] uppercase">
            24/7/365 Local Support
          </span>
          <Headphones className="h-6 w-6 animate-pulse" />
        </div>
      </div>

      {/* Secondary Stats - Horizontal interactive list */}
      {secondaryStats.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {secondaryStats.map((stat, index) => {
            const isAnimated = animatedStats.has(stat.id);
            const isHovered = hoveredStat === stat.id;
            const IconComponent = getIconComponent(stat.icon);
            
            return (
              <div
                key={stat.id}
                className={cn(
                  "group flex items-center gap-4 p-5 rounded-xl",
                  "bg-card border-2 transition-all duration-500",
                  isAnimated ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8",
                  isHovered ? "shadow-xl -translate-y-1" : "shadow-md",
                  canEdit && "cursor-pointer"
                )}
                style={{ 
                  animationDelay: `${(index + 4) * 100}ms`,
                  borderColor: isHovered ? themeColors.secondary : 'transparent',
                }}
                onClick={() => openEditPanel(stat.id)}
                onMouseEnter={() => setHoveredStat(stat.id)}
                onMouseLeave={() => setHoveredStat(null)}
              >
                <div 
                  className={cn(
                    "w-14 h-14 rounded-xl flex items-center justify-center shrink-0",
                    "transition-all duration-300"
                  )}
                  style={{ 
                    background: isHovered 
                      ? `linear-gradient(135deg, ${themeColors.primary}, ${themeColors.secondary})`
                      : `${themeColors.primary}15`,
                  }}
                >
                  <IconComponent 
                    className={cn("h-7 w-7 transition-colors duration-300")}
                    style={{ color: isHovered ? 'white' : themeColors.primary }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div 
                    className={cn(
                      "text-3xl md:text-4xl font-black transition-colors duration-300"
                    )}
                    style={{ color: isHovered ? themeColors.primary : undefined }}
                  >
                    {stat.prefix}{stat.value}{stat.suffix}
                  </div>
                  <div className="text-sm text-muted-foreground font-medium uppercase tracking-wide truncate">
                    {stat.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Highlight Stats - Featured panel with brand gradient */}
      {highlightStats.length > 0 && (
        <div 
          className="relative overflow-hidden rounded-2xl p-6 md:p-8"
          style={{
            background: `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.secondary} 100%)`,
          }}
        >
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {highlightStats.map((stat, index) => {
              const isAnimated = animatedStats.has(stat.id);
              const isHovered = hoveredStat === stat.id;
              
              return (
                <div
                  key={stat.id}
                  className={cn(
                    "group text-white transition-all duration-500",
                    "hover:translate-x-1",
                    isAnimated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
                    canEdit && "cursor-pointer"
                  )}
                  style={{ animationDelay: `${(index + 7) * 100}ms` }}
                  onClick={() => openEditPanel(stat.id)}
                  onMouseEnter={() => setHoveredStat(stat.id)}
                  onMouseLeave={() => setHoveredStat(null)}
                >
                  <div className={cn(
                    "text-4xl md:text-5xl font-black transition-transform duration-300",
                    isHovered && "scale-105"
                  )}>
                    {stat.prefix}{stat.value}{stat.suffix}
                  </div>
                  <div className="text-sm font-semibold uppercase tracking-wide opacity-90 mt-1">
                    {stat.label}
                  </div>
                  {stat.description && (
                    <div className="text-xs opacity-70 mt-1">
                      {stat.description}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Global CSS for animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );

  // ==================== OTHER LAYOUTS (simplified for brevity) ====================
  const renderCardsLayout = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" style={dynamicStyles}>
      {statistics.map((stat, index) => {
        const IconComponent = getIconComponent(stat.icon);
        const isAnimated = animatedStats.has(stat.id);
        const isHovered = hoveredStat === stat.id;
        const cardColor = gradientColors[index % gradientColors.length] || themeColors.primary;

        return (
          <Card 
            key={stat.id} 
            className={cn(
              "relative group overflow-hidden transition-all duration-500",
              isAnimated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
              isHovered && "shadow-xl -translate-y-2",
              canEdit && "cursor-pointer"
            )}
            style={{ 
              animationDelay: `${index * 100}ms`,
              borderColor: isHovered ? cardColor : undefined,
              borderWidth: isHovered ? 2 : 1,
            }}
            onClick={() => openEditPanel(stat.id)}
            onMouseEnter={() => setHoveredStat(stat.id)}
            onMouseLeave={() => setHoveredStat(null)}
          >
            <CardContent className="p-6">
              <div className="text-center">
                <div 
                  className="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-4 transition-all duration-300"
                  style={{ 
                    background: isHovered 
                      ? `linear-gradient(135deg, ${cardColor}, ${themeColors.secondary})`
                      : `${cardColor}15`,
                  }}
                >
                  <IconComponent 
                    className="h-7 w-7 transition-colors duration-300"
                    style={{ color: isHovered ? 'white' : cardColor }}
                  />
                </div>
                <div 
                  className="text-4xl font-black mb-2 transition-colors duration-300"
                  style={{ color: isHovered ? cardColor : undefined }}
                >
                  {stat.prefix}{stat.value}{stat.suffix}
                </div>
                <div className="text-sm font-semibold text-foreground uppercase tracking-wide">
                  {stat.label}
                </div>
                {stat.description && (
                  <p className="text-xs text-muted-foreground mt-2">{stat.description}</p>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  const renderVerticalListLayout = () => (
    <div 
      className="rounded-2xl p-6 sm:p-8 text-white"
      style={{ background: `linear-gradient(135deg, ${themeColors.primary}, ${themeColors.secondary})` }}
    >
      <div className="space-y-6">
        {statistics.map((stat, index) => {
          const isAnimated = animatedStats.has(stat.id);
          const isHovered = hoveredStat === stat.id;
          
          return (
            <div
              key={stat.id}
              className={cn(
                "flex items-center gap-4 sm:gap-6 group transition-all duration-500",
                isAnimated ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8",
                isHovered && "translate-x-4",
                canEdit && "cursor-pointer"
              )}
              style={{ animationDelay: `${index * 150}ms` }}
              onClick={() => openEditPanel(stat.id)}
              onMouseEnter={() => setHoveredStat(stat.id)}
              onMouseLeave={() => setHoveredStat(null)}
            >
              <span className={cn(
                "text-4xl sm:text-6xl font-black min-w-[140px] sm:min-w-[200px] text-right transition-transform duration-300",
                isHovered && "scale-105"
              )}>
                {stat.prefix}{stat.value}{stat.suffix}
              </span>
              <div className="flex flex-col">
                <span className="text-sm sm:text-base font-semibold uppercase tracking-wide">
                  {stat.label}
                </span>
                {stat.description && (
                  <span className="text-xs opacity-70">{stat.description}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderHeroStatsLayout = () => (
    <div className="space-y-8" style={dynamicStyles}>
      {primaryStats.length > 0 && (
        <div 
          className={cn(
            "text-center py-12 transition-all duration-700",
            animatedStats.has(primaryStats[0]?.id) ? "opacity-100 scale-100" : "opacity-0 scale-90"
          )}
        >
          <div 
            className={cn("group", canEdit && "cursor-pointer")} 
            onClick={() => openEditPanel(primaryStats[0].id)}
            onMouseEnter={() => setHoveredStat(primaryStats[0].id)}
            onMouseLeave={() => setHoveredStat(null)}
          >
            <div className="relative inline-block">
              <span 
                className="text-8xl sm:text-[10rem] font-black bg-clip-text text-transparent transition-transform duration-300 group-hover:scale-105"
                style={{ backgroundImage: `linear-gradient(135deg, ${themeColors.primary}, ${themeColors.secondary})` }}
              >
                {primaryStats[0].prefix}{primaryStats[0].value}{primaryStats[0].suffix}
              </span>
              <div 
                className="absolute -inset-8 rounded-full blur-3xl -z-10 opacity-20 group-hover:opacity-40 transition-opacity"
                style={{ background: themeColors.primary }}
              />
            </div>
            <p className="text-2xl sm:text-3xl font-semibold text-foreground mt-4">
              {primaryStats[0].label}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...primaryStats.slice(1), ...secondaryStats].map((stat, index) => {
          const isAnimated = animatedStats.has(stat.id);
          const isHovered = hoveredStat === stat.id;
          const cardColor = gradientColors[(index + 1) % gradientColors.length] || themeColors.secondary;

          return (
            <div 
              key={stat.id}
                className={cn(
                  "p-4 rounded-xl border-2 transition-all duration-500 bg-card",
                  isAnimated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
                  isHovered && "shadow-lg -translate-y-1",
                  canEdit && "cursor-pointer"
                )}
                style={{ 
                  animationDelay: `${(index + 1) * 100}ms`,
                  borderColor: isHovered ? cardColor : 'transparent',
                }}
                onClick={() => openEditPanel(stat.id)}
                onMouseEnter={() => setHoveredStat(stat.id)}
                onMouseLeave={() => setHoveredStat(null)}
              >
              <div className="text-center">
                <span 
                  className="text-3xl sm:text-4xl font-black transition-colors duration-300"
                  style={{ color: isHovered ? cardColor : undefined }}
                >
                  {stat.prefix}{stat.value}{stat.suffix}
                </span>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderSplitPanelLayout = () => (
    <div className="grid md:grid-cols-2 gap-6" style={dynamicStyles}>
      <div className="bg-muted/30 rounded-2xl p-6 space-y-6">
        {primaryStats.map((stat, index) => {
          const isAnimated = animatedStats.has(stat.id);
          const isHovered = hoveredStat === stat.id;
          const IconComponent = getIconComponent(stat.icon);

          return (
            <div
              key={stat.id}
              className={cn(
                "flex items-center gap-4 group transition-all duration-500",
                isAnimated ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8",
                isHovered && "translate-x-2",
                canEdit && "cursor-pointer"
              )}
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => openEditPanel(stat.id)}
              onMouseEnter={() => setHoveredStat(stat.id)}
              onMouseLeave={() => setHoveredStat(null)}
            >
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300"
                style={{ 
                  background: isHovered 
                    ? `linear-gradient(135deg, ${themeColors.primary}, ${themeColors.secondary})`
                    : `${themeColors.primary}15`,
                }}
              >
                <IconComponent 
                  className="h-6 w-6 transition-colors duration-300"
                  style={{ color: isHovered ? 'white' : themeColors.primary }}
                />
              </div>
              <div className="flex-1">
                <span 
                  className="text-3xl font-black transition-colors duration-300"
                  style={{ color: isHovered ? themeColors.primary : undefined }}
                >
                  {stat.prefix}{stat.value}{stat.suffix}
                </span>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div 
        className="rounded-2xl p-6 space-y-6 text-white"
        style={{ background: `linear-gradient(135deg, ${themeColors.primary}, ${themeColors.secondary})` }}
      >
        {secondaryStats.length > 0 ? secondaryStats.map((stat, index) => {
          const isAnimated = animatedStats.has(stat.id);
          const isHovered = hoveredStat === stat.id;

          return (
            <div
              key={stat.id}
              className={cn(
                "text-right group transition-all duration-500",
                isAnimated ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8",
                isHovered && "-translate-x-2",
                canEdit && "cursor-pointer"
              )}
              style={{ animationDelay: `${(index + primaryStats.length) * 100}ms` }}
              onClick={() => openEditPanel(stat.id)}
              onMouseEnter={() => setHoveredStat(stat.id)}
              onMouseLeave={() => setHoveredStat(null)}
            >
              <span className={cn(
                "text-4xl font-black transition-transform duration-300 inline-block",
                isHovered && "scale-105"
              )}>
                {stat.prefix}{stat.value}{stat.suffix}
              </span>
              <p className="text-sm opacity-80">{stat.label}</p>
            </div>
          );
        }) : (
          <div className="text-center opacity-60 py-8">
            <p>Add secondary statistics</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderCircularLayout = () => (
    <div className="relative py-12" style={dynamicStyles}>
      <div className="flex flex-wrap justify-center gap-6 md:gap-8">
        {statistics.slice(0, 6).map((stat, index) => {
          const isAnimated = animatedStats.has(stat.id);
          const isHovered = hoveredStat === stat.id;
          const IconComponent = getIconComponent(stat.icon);
          const size = index === 0 ? 'w-44 h-44 sm:w-52 sm:h-52' : 'w-32 h-32 sm:w-40 sm:h-40';
          const cardColor = gradientColors[index % gradientColors.length] || themeColors.primary;

          return (
            <div
              key={stat.id}
              className={cn(
                "relative group transition-all duration-700",
                isAnimated ? "opacity-100 scale-100" : "opacity-0 scale-50",
                isHovered && "scale-110 -translate-y-2",
                canEdit && "cursor-pointer"
              )}
              style={{ animationDelay: `${index * 150}ms` }}
              onClick={() => openEditPanel(stat.id)}
              onMouseEnter={() => setHoveredStat(stat.id)}
              onMouseLeave={() => setHoveredStat(null)}
            >
              <div 
                className={cn(
                  "rounded-full flex flex-col items-center justify-center ring-4 ring-background text-white",
                  "transition-shadow duration-300",
                  size
                )}
                style={{ 
                  background: `linear-gradient(135deg, ${cardColor}, ${themeColors.secondary})`,
                  boxShadow: isHovered ? `0 20px 40px -10px ${cardColor}60` : `0 8px 24px -8px ${cardColor}40`,
                }}
              >
                <span className={cn(
                  "font-black",
                  index === 0 ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl"
                )}>
                  {stat.prefix}{stat.value}{stat.suffix}
                </span>
                <span className="text-xs text-white/80 text-center px-3 mt-1">
                  {stat.label}
                </span>
              </div>
              
              <div 
                className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-background shadow-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
              >
                <IconComponent className="h-5 w-5" style={{ color: cardColor }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // Choose layout renderer
  const renderLayout = () => {
    switch (infographicLayout) {
      case 'infographic': return renderInfographicLayout();
      case 'vertical-list': return renderVerticalListLayout();
      case 'hero-stats': return renderHeroStatsLayout();
      case 'split-panel': return renderSplitPanelLayout();
      case 'circular': return renderCircularLayout();
      case 'cards':
      default: return renderCardsLayout();
    }
  };

  return (
    <section id="bythenumbers" className="space-y-6">
      <SectionHeader
        title="By the Numbers"
        defaultSubtitle={`Key metrics and achievements for ${brandName}`}
        customSubtitle={customSubtitle}
        isEditing={isHeaderEditing}
        onEditToggle={() => setIsHeaderEditing(!isHeaderEditing)}
        onSubtitleChange={onSubtitleChange}
      />

      {/* Layout selector */}
      {onLayoutChange && (
        <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-border/50">
          <span className="text-sm text-muted-foreground mr-2">Layout:</span>
          {layoutOptions.map((option) => {
            const Icon = option.icon;
            const isActive = infographicLayout === option.value;
            return (
              <Button
                key={option.value}
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                className="gap-2 transition-all duration-300"
                style={isActive ? { background: themeColors.primary } : {}}
                onClick={() => onLayoutChange(option.value)}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{option.label}</span>
              </Button>
            );
          })}
        </div>
      )}

      {statistics.length === 0 ? (
        <Card className="border-dashed border-2" style={{ borderColor: `${themeColors.primary}40` }}>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="h-12 w-12 mb-4" style={{ color: `${themeColors.primary}50` }} />
            <p className="text-muted-foreground mb-4">No statistics added yet</p>
            <div className="flex gap-3">
              <Button 
                onClick={populateDefaults} 
                className="gap-2"
                style={{ background: themeColors.primary }}
              >
                <Sparkles className="h-4 w-4" />
                Use Default Stats
              </Button>
              <Button onClick={addStatistic} variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Custom
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {renderLayout()}

          {canEdit && (
            <div className="flex justify-center gap-3 pt-4">
              <Button 
                onClick={addStatistic} 
                variant="outline" 
                className="gap-2 transition-all duration-300 hover:border-2"
                style={{ '--hover-color': themeColors.primary } as React.CSSProperties}
              >
                <Plus className="h-4 w-4" />
                Add Statistic
              </Button>
              {statistics.length > 0 && (
                <Button onClick={populateDefaults} variant="ghost" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Reset to Defaults
                </Button>
              )}
            </div>
          )}
        </>
      )}

      {/* Edit Panel Modal */}
      {showEditPanel && renderEditPanel()}
    </section>
  );
};