import { useState } from 'react';
import { Plus, Trash2, Edit2, Check, BarChart3, DollarSign, TrendingUp, Users, Globe, Building2, Award, Target, Zap, Clock, Calendar, CheckCircle, Star, Heart, FileText, Briefcase, ShieldCheck, Percent, Hash, Package, Truck, Phone, Mail, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { SectionHeader } from './SectionHeader';
import { StatisticItem } from '@/types/brand';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ByTheNumbersSectionProps {
  statistics: StatisticItem[];
  onStatisticsChange: (statistics: StatisticItem[]) => void;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
  brandName?: string;
}

// Icon mapping
const iconMap: Record<string, React.ElementType> = {
  DollarSign, TrendingUp, Users, Globe, Building2, Award,
  Target, Zap, Clock, Calendar, CheckCircle, Star,
  Heart, FileText, Briefcase, ShieldCheck, Percent, Hash,
  Package, Truck, Phone, Mail, MapPin, BarChart3
};

const STAT_ICONS = Object.keys(iconMap);

const getIconComponent = (iconName?: string): React.ElementType => {
  if (!iconName) return BarChart3;
  return iconMap[iconName] || BarChart3;
};

export const ByTheNumbersSection = ({
  statistics,
  onStatisticsChange,
  customSubtitle,
  onSubtitleChange,
  brandName = 'Brand'
}: ByTheNumbersSectionProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isHeaderEditing, setIsHeaderEditing] = useState(false);

  const addStatistic = () => {
    const newStat: StatisticItem = {
      id: `stat-${Date.now()}`,
      value: '100',
      suffix: '+',
      label: 'New Metric',
      description: 'Description of this metric',
      icon: 'BarChart3'
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

      {statistics.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground mb-4">No statistics added yet</p>
            <Button onClick={addStatistic} variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Add First Statistic
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {statistics.map((stat) => {
              const IconComponent = getIconComponent(stat.icon);
              const isEditing = editingId === stat.id;

              return (
                <Card key={stat.id} className="relative group overflow-hidden">
                  {/* Edit/Delete buttons */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10">
                    {isEditing ? (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => setEditingId(null)}
                      >
                        <Check className="h-4 w-4 text-green-500" />
                      </Button>
                    ) : (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => setEditingId(stat.id)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => deleteStatistic(stat.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <CardContent className="p-6">
                    {isEditing ? (
                      <div className="space-y-3">
                        {/* Icon selector */}
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

                        {/* Value with prefix/suffix */}
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

                        <Textarea
                          value={stat.description || ''}
                          onChange={(e) => updateStatistic(stat.id, { description: e.target.value })}
                          placeholder="Description"
                          className="resize-none"
                          rows={2}
                        />
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
                          <IconComponent className="h-6 w-6" />
                        </div>
                        <div className="text-3xl font-bold text-foreground mb-1">
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
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="flex justify-center">
            <Button onClick={addStatistic} variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Statistic
            </Button>
          </div>
        </>
      )}
    </section>
  );
};