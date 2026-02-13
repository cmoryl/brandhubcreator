/**
 * SocialMetricsEditor - Modal for entering social metrics per platform
 */

import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SocialMetricsInput, METRIC_CATEGORIES, METRIC_LABELS } from '@/types/socialMetrics';
import { Loader2, TrendingUp, Users, MessageCircle, Share2, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SocialMetricsEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  platform: string;
  existingData?: Partial<SocialMetricsInput>;
  onSave: (data: SocialMetricsInput) => Promise<boolean>;
  isSaving: boolean;
  entityName?: string;
  entityType?: 'brand' | 'product' | 'event';
  industry?: string;
}

const categoryIcons = {
  core: Users,
  growth: TrendingUp,
  sentiment: MessageCircle,
  wordOfMouth: Share2
};

export const SocialMetricsEditor = ({
  open,
  onOpenChange,
  platform,
  existingData,
  onSave,
  isSaving,
  entityName,
  entityType,
  industry
}: SocialMetricsEditorProps) => {
  const [formData, setFormData] = useState<Partial<SocialMetricsInput>>({
    platform,
    period_type: 'monthly',
    ...existingData
  });
  const [isScanning, setIsScanning] = useState(false);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: typeof value === 'string' && field !== 'notes' && field !== 'period_type' 
        ? parseFloat(value) || 0 
        : value
    }));
  };

  const handleSubmit = async () => {
    const success = await onSave({ ...formData, platform } as SocialMetricsInput);
    if (success) {
      onOpenChange(false);
    }
  };

  const handleAiScan = useCallback(async () => {
    if (!entityName) {
      toast.error('Entity name is required for AI scanning');
      return;
    }

    setIsScanning(true);
    try {
      const { data, error } = await supabase.functions.invoke('social-metrics-scan', {
        body: {
          entityName,
          platform,
          entityType: entityType || 'brand',
          industry: industry || undefined,
        }
      });

      if (error) throw error;

      if (!data?.success || !data?.metrics) {
        throw new Error(data?.error || 'Failed to get AI metrics');
      }

      const metrics = data.metrics;
      const confidenceNote = metrics.confidence_note;
      delete metrics.confidence_note;

      // Merge AI metrics into form (only non-zero values)
      setFormData(prev => {
        const updated = { ...prev };
        for (const [key, value] of Object.entries(metrics)) {
          if (typeof value === 'number' && value > 0) {
            (updated as Record<string, unknown>)[key] = Math.round(value * 100) / 100;
          }
        }
        if (confidenceNote) {
          updated.notes = confidenceNote;
        }
        return updated;
      });

      toast.success(`AI populated ${platform} metrics`, {
        description: 'Review and adjust the values before saving.',
      });
    } catch (error) {
      console.error('[SocialMetrics] AI scan failed:', error);
      const message = error instanceof Error ? error.message : 'AI scan failed';
      toast.error(message);
    } finally {
      setIsScanning(false);
    }
  }, [entityName, platform, entityType, industry]);

  const renderMetricInput = (metricKey: string) => {
    const label = METRIC_LABELS[metricKey] || metricKey;
    const value = formData[metricKey as keyof SocialMetricsInput] || '';
    
    return (
      <div key={metricKey} className="space-y-1.5">
        <Label htmlFor={metricKey} className="text-sm font-medium text-foreground">
          {label}
        </Label>
        <Input
          id={metricKey}
          type="number"
          step={metricKey.includes('rate') || metricKey.includes('percent') || metricKey.includes('coefficient') ? '0.01' : '1'}
          value={value}
          onChange={(e) => handleInputChange(metricKey, e.target.value)}
          placeholder="0"
          className="h-9"
        />
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                style={{ backgroundColor: getPlatformColor(platform) }}
              >
                {platform.charAt(0)}
              </div>
              {platform} Metrics
            </DialogTitle>
            {entityName && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleAiScan}
                disabled={isScanning || isSaving}
                className="gap-1.5"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    AI Scan
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogHeader>

        <Tabs defaultValue="core" className="w-full">
          <TabsList className="grid grid-cols-4 w-full">
            {Object.entries(METRIC_CATEGORIES).map(([key, { label }]) => {
              const Icon = categoryIcons[key as keyof typeof categoryIcons];
              return (
                <TabsTrigger key={key} value={key} className="flex items-center gap-1.5 text-xs">
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {Object.entries(METRIC_CATEGORIES).map(([key, { metrics }]) => (
            <TabsContent key={key} value={key} className="mt-4">
              <div className="grid grid-cols-2 gap-4">
                {metrics.map(renderMetricInput)}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <div className="space-y-4 pt-4 border-t">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="period_type">Reporting Period</Label>
              <Select 
                value={formData.period_type || 'monthly'} 
                onValueChange={(v) => handleInputChange('period_type', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Add any context about these metrics..."
              rows={2}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Metrics'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

function getPlatformColor(platform: string): string {
  const colors: Record<string, string> = {
    'LinkedIn': '#0A66C2',
    'X (Twitter)': '#000000',
    'Instagram': '#E4405F',
    'Facebook': '#1877F2',
    'YouTube': '#FF0000',
    'TikTok': '#000000',
    'Pinterest': '#BD081C',
    'GitHub': '#181717',
    'Dribbble': '#EA4C89',
    'Behance': '#1769FF',
    'Threads': '#000000'
  };
  return colors[platform] || '#6366f1';
}
