/**
 * LogisticsPanel — Management panel for booth operational logistics markers.
 * Allows ops teams to place, configure, and track power drops, internet,
 * rigging points, storage, lead scanners, and demo stations.
 */
import { useState, useCallback } from 'react';
import {
  Plus, Trash2, MapPin, ClipboardList, Check, AlertCircle, Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  type LogisticsMarker, type LogisticsCategory,
  LOGISTICS_CATEGORIES, getCategoryConfig, createMarker,
} from './logisticsTypes';

interface LogisticsPanelProps {
  markers: LogisticsMarker[];
  selectedMarkerId: string | null;
  onSelectMarker: (id: string | null) => void;
  onAddMarker: (marker: LogisticsMarker) => void;
  onUpdateMarker: (id: string, updates: Partial<LogisticsMarker>) => void;
  onRemoveMarker: (id: string) => void;
  isAdmin: boolean;
}

const STATUS_CONFIG = {
  planned: { label: 'Planned', icon: Clock, className: 'bg-muted text-muted-foreground' },
  confirmed: { label: 'Confirmed', icon: AlertCircle, className: 'bg-amber-500/15 text-amber-600' },
  installed: { label: 'Installed', icon: Check, className: 'bg-primary/15 text-primary' },
} as const;

export function LogisticsPanel({
  markers,
  selectedMarkerId,
  onSelectMarker,
  onAddMarker,
  onUpdateMarker,
  onRemoveMarker,
  isAdmin,
}: LogisticsPanelProps) {
  const [addCategory, setAddCategory] = useState<LogisticsCategory>('power');

  const selected = markers.find(m => m.id === selectedMarkerId) ?? null;

  const handleAdd = useCallback(() => {
    const marker = createMarker(addCategory);
    onAddMarker(marker);
    onSelectMarker(marker.id);
  }, [addCategory, onAddMarker, onSelectMarker]);

  // Group markers by category
  const grouped = LOGISTICS_CATEGORIES.map(cat => ({
    ...cat,
    items: markers.filter(m => m.category === cat.id),
  })).filter(g => g.items.length > 0);

  const totalByStatus = {
    planned: markers.filter(m => m.status === 'planned').length,
    confirmed: markers.filter(m => m.status === 'confirmed').length,
    installed: markers.filter(m => m.status === 'installed').length,
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header summary */}
      <div className="px-3 py-2 border-b shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <ClipboardList className="h-3.5 w-3.5 text-primary" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Logistics</span>
          <Badge variant="secondary" className="text-[9px] ml-auto">{markers.length}</Badge>
        </div>

        {/* Status summary chips */}
        <div className="flex gap-1">
          {Object.entries(totalByStatus).map(([status, count]) => {
            if (count === 0) return null;
            const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
            return (
              <span key={status} className={cn("inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full font-medium", cfg.className)}>
                <cfg.icon className="h-2.5 w-2.5" /> {count} {cfg.label}
              </span>
            );
          })}
        </div>
      </div>

      {/* Quick add bar */}
      {isAdmin && (
        <div className="px-3 py-2 border-b flex gap-1.5 shrink-0">
          <Select value={addCategory} onValueChange={(v) => setAddCategory(v as LogisticsCategory)}>
            <SelectTrigger className="h-7 text-[10px] flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LOGISTICS_CATEGORIES.map(cat => (
                <SelectItem key={cat.id} value={cat.id} className="text-xs">
                  {cat.emoji} {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="h-7 gap-1 text-[10px] shrink-0" onClick={handleAdd}>
            <Plus className="h-3 w-3" /> Add
          </Button>
        </div>
      )}

      {/* Markers list */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-3">
          {grouped.length === 0 && (
            <div className="text-center py-6">
              <MapPin className="h-6 w-6 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-[11px] text-muted-foreground">No logistics markers yet</p>
              {isAdmin && <p className="text-[10px] text-muted-foreground/60 mt-1">Add power, internet, rigging, and more above</p>}
            </div>
          )}

          {grouped.map(group => (
            <div key={group.id}>
              <div className="flex items-center gap-1.5 mb-1 px-1">
                <span className="text-xs">{group.emoji}</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{group.label}</span>
                <Badge variant="outline" className="text-[8px] ml-auto">{group.items.length}</Badge>
              </div>
              <div className="space-y-0.5">
                {group.items.map(marker => {
                  const sCfg = STATUS_CONFIG[marker.status];
                  return (
                    <button
                      key={marker.id}
                      onClick={() => onSelectMarker(selectedMarkerId === marker.id ? null : marker.id)}
                      className={cn(
                        "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-[11px] transition-colors",
                        selectedMarkerId === marker.id
                          ? "bg-primary/10 border border-primary/30"
                          : "hover:bg-muted/50"
                      )}
                    >
                      <span className={cn("h-2 w-2 rounded-full shrink-0")} style={{ backgroundColor: group.color }} />
                      <span className="flex-1 truncate font-medium">{marker.label}</span>
                      {marker.spec && <span className="text-[9px] text-muted-foreground truncate max-w-[60px]">{marker.spec}</span>}
                      <sCfg.icon className="h-3 w-3 shrink-0" style={{ color: group.color }} />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Selected marker inspector */}
      {selected && isAdmin && (
        <div className="border-t p-3 space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold flex items-center gap-1">
              <span>{getCategoryConfig(selected.category).emoji}</span> Edit Marker
            </p>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive" onClick={() => onRemoveMarker(selected.id)}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>

          <div>
            <Label className="text-[10px]">Label</Label>
            <Input
              value={selected.label}
              onChange={(e) => onUpdateMarker(selected.id, { label: e.target.value })}
              className="h-7 text-xs"
            />
          </div>

          <div>
            <Label className="text-[10px]">{getCategoryConfig(selected.category).specLabel}</Label>
            <Input
              value={selected.spec || ''}
              onChange={(e) => onUpdateMarker(selected.id, { spec: e.target.value })}
              className="h-7 text-xs"
              placeholder={getCategoryConfig(selected.category).defaultSpec}
            />
          </div>

          <div>
            <Label className="text-[10px]">Status</Label>
            <Select value={selected.status} onValueChange={(v) => onUpdateMarker(selected.id, { status: v as LogisticsMarker['status'] })}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="planned">🕐 Planned</SelectItem>
                <SelectItem value="confirmed">⚠ Confirmed</SelectItem>
                <SelectItem value="installed">✅ Installed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Position nudge */}
          <div className="space-y-1.5">
            <Label className="text-[10px]">Position (meters)</Label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['X', 'Y', 'Z'] as const).map((axis, i) => (
                <div key={axis}>
                  <Label className="text-[9px] text-muted-foreground">{axis}</Label>
                  <Input
                    type="number"
                    step={0.1}
                    value={selected.position[i]}
                    onChange={(e) => {
                      const pos = [...selected.position] as [number, number, number];
                      pos[i] = Number(e.target.value);
                      onUpdateMarker(selected.id, { position: pos });
                    }}
                    className="h-7 text-xs"
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-[10px]">Notes</Label>
            <Textarea
              value={selected.notes}
              onChange={(e) => onUpdateMarker(selected.id, { notes: e.target.value })}
              className="text-xs min-h-[50px] resize-none"
              placeholder="Ops notes..."
              rows={2}
            />
          </div>
        </div>
      )}
    </div>
  );
}
