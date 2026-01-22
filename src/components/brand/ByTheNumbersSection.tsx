import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Check, BarChart3, DollarSign, TrendingUp, Users, Globe, Building2, Award, Target, Zap, Clock, Calendar, CheckCircle, Star, Heart, FileText, Briefcase, ShieldCheck, Percent, Hash, Package, Truck, Phone, Mail, MapPin, Layers, Grid3X3, LayoutList, CircleDot, Columns, Sparkles, X, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { SectionHeader } from './SectionHeader';
import { StatisticItem, InfographicLayout, DEFAULT_STATISTICS } from '@/types/brand';
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
  onStatisticsChange: (statistics: StatisticItem[]) => void;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
  brandName?: string;
  infographicLayout?: InfographicLayout;
  onLayoutChange?: (layout: InfographicLayout) => void;
  primaryColor?: string;
  secondaryColor?: string;
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

// Default service capabilities
const DEFAULT_SERVICES = [
  'Technology Solutions',
  'Artificial Intelligence',
  'Software & App Localization',
  'Website Localization',
  'International Performance Marketing',
  'Interpretation',
  'Translation & Localization',
  'Accessibility Solutions',
  'Dubbing & Subtitling',
  'Content & Creative Services',
  'Contact Center Solutions',
  'QA & Testing'
];

export const ByTheNumbersSection = ({
  statistics,
  onStatisticsChange,
  customSubtitle,
  onSubtitleChange,
  brandName = 'Brand',
  infographicLayout = 'infographic',
  onLayoutChange,
  primaryColor = '#003b71',
  secondaryColor = '#139dd8'
}: ByTheNumbersSectionProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isHeaderEditing, setIsHeaderEditing] = useState(false);
  const [animatedStats, setAnimatedStats] = useState<Set<string>>(new Set());
  const [showEditPanel, setShowEditPanel] = useState(false);

  // Trigger staggered animations on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      statistics.forEach((stat, index) => {
        setTimeout(() => {
          setAnimatedStats(prev => new Set(prev).add(stat.id));
        }, index * 100);
      });
    }, 200);
    return () => clearTimeout(timer);
  }, [statistics]);

  const addStatistic = () => {
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
    onStatisticsChange(
      statistics.map(stat => stat.id === id ? { ...stat, ...updates } : stat)
    );
  };

  const deleteStatistic = (id: string) => {
    onStatisticsChange(statistics.filter(stat => stat.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const populateDefaults = () => {
    onStatisticsChange(DEFAULT_STATISTICS);
  };

  const primaryStats = statistics.filter(s => s.category === 'primary' || !s.category);
  const secondaryStats = statistics.filter(s => s.category === 'secondary');
  const highlightStats = statistics.filter(s => s.category === 'highlight');

  // Render editing panel for a stat
  const renderEditPanel = () => {
    if (!editingId) return null;
    const stat = statistics.find(s => s.id === editingId);
    if (!stat) return null;

    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
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
                <SelectItem value="highlight">Highlight (Sidebar)</SelectItem>
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
              <Button className="flex-1" onClick={() => { setEditingId(null); setShowEditPanel(false); }}>
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

  // ==================== NEW LAYOUT: INFOGRAPHIC ====================
  const renderInfographicLayout = () => (
    <div className="space-y-8">
      {/* Primary Stats Row - Large featured numbers */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {primaryStats.slice(0, 4).map((stat, index) => {
          const isAnimated = animatedStats.has(stat.id);
          const IconComponent = getIconComponent(stat.icon);
          
          return (
            <div
              key={stat.id}
              className={cn(
                "group relative bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-6 cursor-pointer",
                "border border-primary/10 hover:border-primary/30 transition-all duration-500",
                "hover:shadow-lg hover:-translate-y-1",
                isAnimated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              )}
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => { setEditingId(stat.id); setShowEditPanel(true); }}
            >
              {/* Icon badge */}
              <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <IconComponent className="h-5 w-5" />
              </div>
              
              <div className="text-center pt-2">
                <div className="text-4xl md:text-5xl lg:text-6xl font-black text-primary mb-2">
                  {stat.prefix}<span className="tabular-nums">{stat.value}</span>{stat.suffix}
                </div>
                <div className="text-sm md:text-base font-medium text-foreground uppercase tracking-wider">
                  {stat.label}
                </div>
              </div>
              
              {/* Edit indicator */}
              <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Edit2 className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Support Banner */}
      <div className={cn(
        "flex items-center justify-center gap-3 py-4 px-6 rounded-xl",
        "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground",
        "transition-all duration-700",
        animatedStats.size > 0 ? "opacity-100 scale-100" : "opacity-0 scale-95"
      )}>
        <Headphones className="h-6 w-6" />
        <span className="text-lg md:text-xl font-bold tracking-[0.3em] uppercase">
          24/7/365 Local Support
        </span>
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {secondaryStats.map((stat, index) => {
          const isAnimated = animatedStats.has(stat.id);
          const IconComponent = getIconComponent(stat.icon);
          
          return (
            <div
              key={stat.id}
              className={cn(
                "group flex items-center gap-4 p-5 rounded-xl cursor-pointer",
                "bg-card border border-border hover:border-primary/30 transition-all duration-500",
                "hover:shadow-md",
                isAnimated ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
              )}
              style={{ animationDelay: `${(index + 4) * 100}ms` }}
              onClick={() => { setEditingId(stat.id); setShowEditPanel(true); }}
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                <IconComponent className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl md:text-4xl font-black text-foreground group-hover:text-primary transition-colors">
                    {stat.prefix}{stat.value}{stat.suffix}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground font-medium uppercase tracking-wide truncate">
                  {stat.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Highlight Stats (if any) - Sidebar style */}
      {highlightStats.length > 0 && (
        <div className="bg-primary text-primary-foreground rounded-2xl p-6 md:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {highlightStats.map((stat, index) => {
              const isAnimated = animatedStats.has(stat.id);
              
              return (
                <div
                  key={stat.id}
                  className={cn(
                    "group cursor-pointer transition-all duration-500",
                    "hover:translate-x-1",
                    isAnimated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                  )}
                  style={{ animationDelay: `${(index + 7) * 100}ms` }}
                  onClick={() => { setEditingId(stat.id); setShowEditPanel(true); }}
                >
                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl md:text-5xl font-black">
                      {stat.prefix}{stat.value}{stat.suffix}
                    </span>
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

      {/* Services Grid */}
      <div className={cn(
        "border-t border-border pt-6 transition-all duration-700",
        animatedStats.size > 0 ? "opacity-100" : "opacity-0"
      )}>
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-2">
          {DEFAULT_SERVICES.map((service, index) => (
            <span 
              key={service} 
              className="inline-flex items-center text-sm text-muted-foreground"
              style={{ animationDelay: `${(index + 10) * 50}ms` }}
            >
              {index > 0 && <span className="mr-3 text-primary">•</span>}
              <span className="uppercase tracking-wide font-medium hover:text-foreground transition-colors cursor-default">
                {service}
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );

  // ==================== LAYOUT: VERTICAL LIST (GlobalLink style) ====================
  const renderVerticalListLayout = () => (
    <div className="bg-primary text-primary-foreground rounded-xl p-6 sm:p-8">
      <div className="space-y-6">
        {statistics.map((stat, index) => {
          const isAnimated = animatedStats.has(stat.id);
          
          return (
            <div
              key={stat.id}
              className={cn(
                "flex items-center gap-4 sm:gap-6 group cursor-pointer transition-all duration-500",
                "hover:translate-x-2",
                isAnimated ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
              )}
              style={{ animationDelay: `${index * 150}ms` }}
              onClick={() => { setEditingId(stat.id); setShowEditPanel(true); }}
            >
              <span className="text-4xl sm:text-6xl font-bold min-w-[140px] sm:min-w-[180px] text-right">
                {stat.prefix}{stat.value}{stat.suffix}
              </span>
              <div className="flex flex-col">
                <span className="text-sm sm:text-base font-semibold uppercase tracking-wide">
                  {stat.label.split(' ').slice(0, 1).join(' ')}
                </span>
                <span className="text-xs sm:text-sm opacity-80">
                  {stat.label.split(' ').slice(1).join(' ')}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ==================== LAYOUT: HERO STATS ====================
  const renderHeroStatsLayout = () => (
    <div className="space-y-8">
      {/* Hero stat (first one) */}
      {primaryStats.length > 0 && (
        <div 
          className={cn(
            "text-center py-8 transition-all duration-700",
            animatedStats.has(primaryStats[0]?.id) ? "opacity-100 scale-100" : "opacity-0 scale-90"
          )}
        >
          <div 
            className="cursor-pointer group" 
            onClick={() => { setEditingId(primaryStats[0].id); setShowEditPanel(true); }}
          >
            <div className="relative inline-block">
              <span className="text-7xl sm:text-9xl font-black bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                {primaryStats[0].prefix}{primaryStats[0].value}{primaryStats[0].suffix}
              </span>
              <div className="absolute -inset-4 bg-primary/5 rounded-full blur-3xl -z-10 group-hover:bg-primary/10 transition-colors" />
            </div>
            <p className="text-xl sm:text-2xl font-medium text-foreground mt-4">
              {primaryStats[0].label}
            </p>
          </div>
        </div>
      )}

      {/* Supporting stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...primaryStats.slice(1), ...secondaryStats].map((stat, index) => {
          const isAnimated = animatedStats.has(stat.id);

          return (
            <Card 
              key={stat.id}
              className={cn(
                "cursor-pointer group overflow-hidden transition-all duration-500",
                "hover:shadow-lg hover:-translate-y-1",
                isAnimated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              )}
              style={{ animationDelay: `${(index + 1) * 100}ms` }}
              onClick={() => { setEditingId(stat.id); setShowEditPanel(true); }}
            >
              <CardContent className="p-4 text-center">
                <span className="text-2xl sm:text-3xl font-bold text-foreground group-hover:text-primary transition-colors">
                  {stat.prefix}{stat.value}{stat.suffix}
                </span>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  {stat.label}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  // ==================== LAYOUT: SPLIT PANEL ====================
  const renderSplitPanelLayout = () => (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Left panel - Primary stats */}
      <div className="bg-muted/30 rounded-xl p-6 space-y-6">
        {primaryStats.map((stat, index) => {
          const isAnimated = animatedStats.has(stat.id);
          const IconComponent = getIconComponent(stat.icon);

          return (
            <div
              key={stat.id}
              className={cn(
                "flex items-center gap-4 group cursor-pointer transition-all duration-500",
                isAnimated ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
              )}
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => { setEditingId(stat.id); setShowEditPanel(true); }}
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <IconComponent className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-foreground">
                    {stat.prefix}{stat.value}{stat.suffix}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Right panel - Secondary stats */}
      <div className="bg-primary text-primary-foreground rounded-xl p-6 space-y-6">
        {secondaryStats.length > 0 ? secondaryStats.map((stat, index) => {
          const isAnimated = animatedStats.has(stat.id);

          return (
            <div
              key={stat.id}
              className={cn(
                "text-right group cursor-pointer transition-all duration-500",
                isAnimated ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
              )}
              style={{ animationDelay: `${(index + primaryStats.length) * 100}ms` }}
              onClick={() => { setEditingId(stat.id); setShowEditPanel(true); }}
            >
              <span className="text-4xl font-bold">
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

  // ==================== LAYOUT: CIRCULAR ====================
  const renderCircularLayout = () => (
    <div className="relative py-12">
      <div className="flex flex-wrap justify-center gap-8">
        {statistics.slice(0, 6).map((stat, index) => {
          const isAnimated = animatedStats.has(stat.id);
          const IconComponent = getIconComponent(stat.icon);
          const size = index === 0 ? 'w-40 h-40 sm:w-48 sm:h-48' : 'w-32 h-32 sm:w-36 sm:h-36';

          return (
            <div
              key={stat.id}
              className={cn(
                "relative group cursor-pointer transition-all duration-700",
                isAnimated ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-50 rotate-12"
              )}
              style={{ animationDelay: `${index * 150}ms` }}
              onClick={() => { setEditingId(stat.id); setShowEditPanel(true); }}
            >
              <div 
                className={cn(
                  "rounded-full flex flex-col items-center justify-center",
                  "bg-gradient-to-br from-primary/90 to-primary shadow-xl",
                  "hover:shadow-2xl hover:scale-110 transition-all duration-300",
                  "ring-4 ring-background",
                  size
                )}
              >
                <span className={cn(
                  "font-bold text-primary-foreground",
                  index === 0 ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl"
                )}>
                  {stat.prefix}{stat.value}{stat.suffix}
                </span>
                <span className="text-xs text-primary-foreground/80 text-center px-2 mt-1">
                  {stat.label}
                </span>
              </div>
              
              {/* Floating icon */}
              <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-background shadow-lg flex items-center justify-center">
                <IconComponent className="h-4 w-4 text-primary" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ==================== LAYOUT: DEFAULT CARDS ====================
  const renderCardsLayout = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {statistics.map((stat, index) => {
        const IconComponent = getIconComponent(stat.icon);
        const isAnimated = animatedStats.has(stat.id);

        return (
          <Card 
            key={stat.id} 
            className={cn(
              "relative group overflow-hidden cursor-pointer transition-all duration-500",
              "hover:shadow-lg hover:-translate-y-1",
              isAnimated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            )}
            style={{ animationDelay: `${index * 100}ms` }}
            onClick={() => { setEditingId(stat.id); setShowEditPanel(true); }}
          >
            <CardContent className="p-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4 group-hover:scale-110 transition-transform">
                  <IconComponent className="h-6 w-6" />
                </div>
                <div className="text-3xl font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                  {stat.prefix}{stat.value}{stat.suffix}
                </div>
                <div className="text-sm font-medium text-foreground mb-2">
                  {stat.label}
                </div>
                {stat.description && (
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  // Choose layout renderer
  const renderLayout = () => {
    switch (infographicLayout) {
      case 'infographic':
        return renderInfographicLayout();
      case 'vertical-list':
        return renderVerticalListLayout();
      case 'hero-stats':
        return renderHeroStatsLayout();
      case 'split-panel':
        return renderSplitPanelLayout();
      case 'circular':
        return renderCircularLayout();
      case 'cards':
      default:
        return renderCardsLayout();
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
            return (
              <Button
                key={option.value}
                variant={infographicLayout === option.value ? 'default' : 'outline'}
                size="sm"
                className="gap-2"
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
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground mb-4">No statistics added yet</p>
            <div className="flex gap-3">
              <Button onClick={populateDefaults} variant="default" className="gap-2">
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

          <div className="flex justify-center gap-3 pt-4">
            <Button onClick={addStatistic} variant="outline" className="gap-2">
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
        </>
      )}

      {/* Edit Panel Modal */}
      {showEditPanel && renderEditPanel()}
    </section>
  );
};