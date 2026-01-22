import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Check, BarChart3, DollarSign, TrendingUp, Users, Globe, Building2, Award, Target, Zap, Clock, Calendar, CheckCircle, Star, Heart, FileText, Briefcase, ShieldCheck, Percent, Hash, Package, Truck, Phone, Mail, MapPin, Layers, Grid3X3, LayoutList, CircleDot, Columns, Sparkles } from 'lucide-react';
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
  Package, Truck, Phone, Mail, MapPin, BarChart3, Sparkles
};

const STAT_ICONS = Object.keys(iconMap);

const getIconComponent = (iconName?: string): React.ElementType => {
  if (!iconName) return BarChart3;
  return iconMap[iconName] || BarChart3;
};

const layoutOptions: { value: InfographicLayout; label: string; icon: React.ElementType }[] = [
  { value: 'cards', label: 'Card Grid', icon: Grid3X3 },
  { value: 'pills', label: 'Overlapping Pills', icon: Layers },
  { value: 'vertical-list', label: 'Vertical List', icon: LayoutList },
  { value: 'hero-stats', label: 'Hero Stats', icon: Sparkles },
  { value: 'split-panel', label: 'Split Panel', icon: Columns },
  { value: 'circular', label: 'Circular', icon: CircleDot },
];

export const ByTheNumbersSection = ({
  statistics,
  onStatisticsChange,
  customSubtitle,
  onSubtitleChange,
  brandName = 'Brand',
  infographicLayout = 'pills',
  onLayoutChange,
  primaryColor = '#003b71',
  secondaryColor = '#139dd8'
}: ByTheNumbersSectionProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isHeaderEditing, setIsHeaderEditing] = useState(false);
  const [animatedStats, setAnimatedStats] = useState<Set<string>>(new Set());

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

  // Render editing mode for a stat
  const renderEditForm = (stat: StatisticItem) => (
    <div className="space-y-3 p-4 bg-background rounded-lg border">
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
          placeholder="Prefix"
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
          placeholder="Suffix"
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
          <SelectItem value="primary">Primary (Featured)</SelectItem>
          <SelectItem value="secondary">Secondary</SelectItem>
          <SelectItem value="highlight">Highlight</SelectItem>
        </SelectContent>
      </Select>

      <Textarea
        value={stat.description || ''}
        onChange={(e) => updateStatistic(stat.id, { description: e.target.value })}
        placeholder="Description"
        className="resize-none"
        rows={2}
      />

      <div className="flex gap-2">
        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
          <Check className="h-4 w-4 mr-1" /> Done
        </Button>
        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteStatistic(stat.id)}>
          <Trash2 className="h-4 w-4 mr-1" /> Delete
        </Button>
      </div>
    </div>
  );

  // ==================== LAYOUT: OVERLAPPING PILLS ====================
  const renderPillsLayout = () => (
    <div className="space-y-8">
      {/* Primary stats in overlapping pills */}
      <div className="relative flex justify-center items-center gap-0 py-8">
        {primaryStats.slice(0, 4).map((stat, index) => {
          const isAnimated = animatedStats.has(stat.id);
          const isEditing = editingId === stat.id;
          const colors = [
            'from-[#003b71] to-[#003b71]',
            'from-[#139dd8] to-[#1eb5f0]',
            'from-[#3bbfb5] to-[#4dd4c8]',
            'from-[#7bc3da] to-[#9dd5e8]'
          ];
          
          if (isEditing) return <div key={stat.id} className="z-50">{renderEditForm(stat)}</div>;

          return (
            <div
              key={stat.id}
              className={cn(
                "relative group cursor-pointer transition-all duration-500 ease-out",
                isAnimated ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-8 scale-95",
                index > 0 && "-ml-8"
              )}
              style={{ 
                zIndex: primaryStats.length - index,
                animationDelay: `${index * 100}ms`
              }}
              onClick={() => setEditingId(stat.id)}
            >
              <div 
                className={cn(
                  "relative w-36 h-48 sm:w-44 sm:h-56 rounded-[50%] flex flex-col items-center justify-center",
                  "bg-gradient-to-b shadow-xl hover:shadow-2xl transition-all duration-300",
                  "hover:scale-105 hover:-translate-y-2",
                  "before:absolute before:inset-0 before:rounded-[50%] before:bg-[url('/placeholder.svg')] before:opacity-10 before:bg-cover",
                  colors[index % colors.length]
                )}
              >
                {/* Globe texture overlay */}
                <div className="absolute inset-0 rounded-[50%] bg-gradient-to-b from-white/10 to-transparent" />
                
                <span className="text-white text-4xl sm:text-5xl font-bold drop-shadow-lg z-10">
                  {stat.prefix}{stat.value}{stat.suffix}
                </span>
                <span className="text-white/90 text-xs sm:text-sm font-medium text-center uppercase tracking-wider mt-2 px-4 z-10">
                  {stat.label}
                </span>

                {/* Edit indicator */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Edit2 className="h-4 w-4 text-white/70" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Secondary stats row */}
      {secondaryStats.length > 0 && (
        <div className="flex flex-wrap justify-center gap-8 pt-4 border-t border-border/50">
          {secondaryStats.map((stat, index) => {
            const isAnimated = animatedStats.has(stat.id);
            const isEditing = editingId === stat.id;
            
            if (isEditing) return <div key={stat.id}>{renderEditForm(stat)}</div>;

            return (
              <div
                key={stat.id}
                className={cn(
                  "group cursor-pointer text-center transition-all duration-500",
                  isAnimated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                )}
                style={{ animationDelay: `${(index + 4) * 100}ms` }}
                onClick={() => setEditingId(stat.id)}
              >
                <div className="flex items-baseline gap-1 justify-center">
                  <span className="text-4xl sm:text-5xl font-bold text-foreground group-hover:text-primary transition-colors">
                    {stat.prefix}{stat.value}{stat.suffix}
                  </span>
                </div>
                <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  {stat.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // ==================== LAYOUT: VERTICAL LIST (GlobalLink style) ====================
  const renderVerticalListLayout = () => (
    <div className="bg-primary text-primary-foreground rounded-xl p-6 sm:p-8">
      <div className="space-y-6">
        {statistics.map((stat, index) => {
          const isAnimated = animatedStats.has(stat.id);
          const isEditing = editingId === stat.id;
          
          if (isEditing) return <div key={stat.id} className="bg-background rounded-lg">{renderEditForm(stat)}</div>;

          return (
            <div
              key={stat.id}
              className={cn(
                "flex items-center gap-4 sm:gap-6 group cursor-pointer transition-all duration-500",
                "hover:translate-x-2",
                isAnimated ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
              )}
              style={{ animationDelay: `${index * 150}ms` }}
              onClick={() => setEditingId(stat.id)}
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
          {editingId === primaryStats[0]?.id ? (
            renderEditForm(primaryStats[0])
          ) : (
            <div 
              className="cursor-pointer group" 
              onClick={() => setEditingId(primaryStats[0].id)}
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
              {primaryStats[0].description && (
                <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                  {primaryStats[0].description}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Supporting stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...primaryStats.slice(1), ...secondaryStats].map((stat, index) => {
          const isAnimated = animatedStats.has(stat.id);
          const isEditing = editingId === stat.id;
          
          if (isEditing) return <div key={stat.id}>{renderEditForm(stat)}</div>;

          return (
            <Card 
              key={stat.id}
              className={cn(
                "cursor-pointer group overflow-hidden transition-all duration-500",
                "hover:shadow-lg hover:-translate-y-1",
                isAnimated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              )}
              style={{ animationDelay: `${(index + 1) * 100}ms` }}
              onClick={() => setEditingId(stat.id)}
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
          const isEditing = editingId === stat.id;
          const IconComponent = getIconComponent(stat.icon);
          
          if (isEditing) return <div key={stat.id}>{renderEditForm(stat)}</div>;

          return (
            <div
              key={stat.id}
              className={cn(
                "flex items-center gap-4 group cursor-pointer transition-all duration-500",
                isAnimated ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
              )}
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => setEditingId(stat.id)}
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
          const isEditing = editingId === stat.id;
          
          if (isEditing) return <div key={stat.id} className="bg-background rounded-lg">{renderEditForm(stat)}</div>;

          return (
            <div
              key={stat.id}
              className={cn(
                "text-right group cursor-pointer transition-all duration-500",
                isAnimated ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
              )}
              style={{ animationDelay: `${(index + primaryStats.length) * 100}ms` }}
              onClick={() => setEditingId(stat.id)}
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
          const isEditing = editingId === stat.id;
          const IconComponent = getIconComponent(stat.icon);
          const size = index === 0 ? 'w-40 h-40 sm:w-48 sm:h-48' : 'w-32 h-32 sm:w-36 sm:h-36';
          
          if (isEditing) return <div key={stat.id}>{renderEditForm(stat)}</div>;

          return (
            <div
              key={stat.id}
              className={cn(
                "relative group cursor-pointer transition-all duration-700",
                isAnimated ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-50 rotate-12"
              )}
              style={{ animationDelay: `${index * 150}ms` }}
              onClick={() => setEditingId(stat.id)}
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
        const isEditing = editingId === stat.id;
        const isAnimated = animatedStats.has(stat.id);

        if (isEditing) return <div key={stat.id}>{renderEditForm(stat)}</div>;

        return (
          <Card 
            key={stat.id} 
            className={cn(
              "relative group overflow-hidden cursor-pointer transition-all duration-500",
              "hover:shadow-lg hover:-translate-y-1",
              isAnimated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            )}
            style={{ animationDelay: `${index * 100}ms` }}
            onClick={() => setEditingId(stat.id)}
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
      case 'pills':
        return renderPillsLayout();
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
    </section>
  );
};