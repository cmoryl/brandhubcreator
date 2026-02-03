import { useState, useEffect } from 'react';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { InsightItem } from '@/types/brand';

interface InsightEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  insight?: InsightItem | null;
  onSave: (insight: InsightItem) => void;
}

const defaultInsight: Omit<InsightItem, 'id'> = {
  type: 'update',
  title: '',
  summary: '',
  date: new Date().toISOString(),
  priority: 'medium',
};

export const InsightEditorModal = ({
  open,
  onOpenChange,
  insight,
  onSave,
}: InsightEditorModalProps) => {
  const [formData, setFormData] = useState<Omit<InsightItem, 'id'>>({ ...defaultInsight });
  const [dateOpen, setDateOpen] = useState(false);

  useEffect(() => {
    if (insight) {
      setFormData({
        type: insight.type,
        title: insight.title,
        summary: insight.summary,
        value: insight.value || '',
        valueLabel: insight.valueLabel || '',
        trend: insight.trend,
        trendValue: insight.trendValue || '',
        date: insight.date,
        priority: insight.priority,
        category: insight.category || '',
        linkUrl: insight.linkUrl || '',
        linkLabel: insight.linkLabel || '',
        imageUrl: insight.imageUrl || '',
      });
    } else {
      setFormData({ ...defaultInsight });
    }
  }, [insight, open]);

  const handleSave = () => {
    const newInsight: InsightItem = {
      id: insight?.id || `insight-${Date.now()}`,
      ...formData,
    };
    onSave(newInsight);
    onOpenChange(false);
  };

  const updateField = <K extends keyof Omit<InsightItem, 'id'>>(
    key: K,
    value: Omit<InsightItem, 'id'>[K]
  ) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{insight ? 'Edit Insight' : 'Add New Insight'}</DialogTitle>
          <DialogDescription>
            Create reports, analytics updates, news, and alerts for stakeholders.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Type Selection */}
          <div className="space-y-2">
            <Label>Type</Label>
            <RadioGroup
              value={formData.type}
              onValueChange={(v) => updateField('type', v as InsightItem['type'])}
              className="flex flex-wrap gap-3"
            >
              {(['report', 'analytics', 'news', 'update', 'alert'] as const).map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <RadioGroupItem value={type} id={`type-${type}`} />
                  <Label htmlFor={`type-${type}`} className="capitalize cursor-pointer">
                    {type}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Title & Category */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="Enter insight title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category || ''}
                onChange={(e) => updateField('category', e.target.value)}
                placeholder="e.g., Marketing, Sales, Q1"
              />
            </div>
          </div>

          {/* Summary */}
          <div className="space-y-2">
            <Label htmlFor="summary">Summary *</Label>
            <Textarea
              id="summary"
              value={formData.summary}
              onChange={(e) => updateField('summary', e.target.value)}
              placeholder="Brief description of the insight..."
              rows={3}
            />
          </div>

          {/* Metric Values */}
          <div className="p-4 rounded-lg bg-muted/30 border border-border/50 space-y-4">
            <Label className="text-sm font-semibold">Metric Display (Optional)</Label>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="value" className="text-xs text-muted-foreground">Value</Label>
                <Input
                  id="value"
                  value={formData.value || ''}
                  onChange={(e) => updateField('value', e.target.value)}
                  placeholder="e.g., 42%, $1.2M, 500+"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="valueLabel" className="text-xs text-muted-foreground">Value Label</Label>
                <Input
                  id="valueLabel"
                  value={formData.valueLabel || ''}
                  onChange={(e) => updateField('valueLabel', e.target.value)}
                  placeholder="e.g., Conversion Rate"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Trend Direction</Label>
                <Select
                  value={formData.trend || 'none'}
                  onValueChange={(v) => updateField('trend', v === 'none' ? undefined : v as InsightItem['trend'])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select trend" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No trend</SelectItem>
                    <SelectItem value="up">
                      <span className="flex items-center gap-2">
                        <TrendingUp className="h-3 w-3 text-emerald-500" /> Up
                      </span>
                    </SelectItem>
                    <SelectItem value="down">
                      <span className="flex items-center gap-2">
                        <TrendingDown className="h-3 w-3 text-red-500" /> Down
                      </span>
                    </SelectItem>
                    <SelectItem value="neutral">
                      <span className="flex items-center gap-2">
                        <Minus className="h-3 w-3 text-muted-foreground" /> Neutral
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="trendValue" className="text-xs text-muted-foreground">Trend Value</Label>
                <Input
                  id="trendValue"
                  value={formData.trendValue || ''}
                  onChange={(e) => updateField('trendValue', e.target.value)}
                  placeholder="e.g., +12%, -5%"
                />
              </div>
            </div>
          </div>

          {/* Date & Priority */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover open={dateOpen} onOpenChange={setDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date ? format(new Date(formData.date), "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.date ? new Date(formData.date) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        updateField('date', date.toISOString());
                        setDateOpen(false);
                      }
                    }}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={formData.priority || 'medium'}
                onValueChange={(v) => updateField('priority', v as InsightItem['priority'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Link */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="linkUrl">Link URL</Label>
              <Input
                id="linkUrl"
                type="url"
                value={formData.linkUrl || ''}
                onChange={(e) => updateField('linkUrl', e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkLabel">Link Label</Label>
              <Input
                id="linkLabel"
                value={formData.linkLabel || ''}
                onChange={(e) => updateField('linkLabel', e.target.value)}
                placeholder="e.g., View Report"
              />
            </div>
          </div>

          {/* Image URL */}
          <div className="space-y-2">
            <Label htmlFor="imageUrl">Image URL</Label>
            <Input
              id="imageUrl"
              type="url"
              value={formData.imageUrl || ''}
              onChange={(e) => updateField('imageUrl', e.target.value)}
              placeholder="https://... (optional preview image)"
            />
            {formData.imageUrl && (
              <div className="mt-2 relative aspect-video w-48 rounded-lg overflow-hidden bg-muted border">
                <img 
                  src={formData.imageUrl} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!formData.title.trim() || !formData.summary.trim()}
          >
            {insight ? 'Save Changes' : 'Add Insight'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
