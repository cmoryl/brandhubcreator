/**
 * ReportEntitySelector
 * Multi-select popover for picking specific brands, products, or events in report generators.
 */

import { useState, useEffect, useMemo } from 'react';
import { Check, ChevronsUpDown, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

export interface EntityOption {
  id: string;
  name: string;
}

interface ReportEntitySelectorProps {
  entityType: 'brands' | 'products' | 'events';
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

export function ReportEntitySelector({ entityType, selectedIds, onSelectionChange }: ReportEntitySelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [entities, setEntities] = useState<EntityOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchEntities = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from(entityType)
          .select('id, name')
          .order('name', { ascending: true })
          .limit(500);
        if (!error && data) {
          setEntities(data as EntityOption[]);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetchEntities();
  }, [entityType]);

  const filtered = useMemo(() => {
    if (!search) return entities;
    const q = search.toLowerCase();
    return entities.filter(e => e.name.toLowerCase().includes(q));
  }, [entities, search]);

  const toggleEntity = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(s => s !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const clearAll = () => onSelectionChange([]);
  const selectAll = () => onSelectionChange(filtered.map(e => e.id));

  const label = entityType === 'brands' ? 'Brands' : entityType === 'products' ? 'Products' : 'Events';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-auto min-w-[180px] justify-between gap-2">
          <div className="flex items-center gap-2 truncate">
            <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            {selectedIds.length === 0 ? (
              <span className="text-muted-foreground text-sm">All {label}</span>
            ) : (
              <span className="text-sm truncate">
                {selectedIds.length} {label.toLowerCase()} selected
              </span>
            )}
          </div>
          <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <div className="p-2 border-b">
          <Input
            placeholder={`Search ${label.toLowerCase()}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div className="flex items-center justify-between px-2 py-1.5 border-b">
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={selectAll}>
            Select All ({filtered.length})
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={clearAll} disabled={selectedIds.length === 0}>
            Clear
          </Button>
        </div>
        <ScrollArea className="max-h-[240px]">
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">No {label.toLowerCase()} found</div>
          ) : (
            <div className="p-1">
              {filtered.map((entity) => {
                const isSelected = selectedIds.includes(entity.id);
                return (
                  <button
                    key={entity.id}
                    onClick={() => toggleEntity(entity.id)}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-left hover:bg-muted/60 transition-colors",
                      isSelected && "bg-primary/10"
                    )}
                  >
                    <div className={cn(
                      "h-4 w-4 rounded border flex items-center justify-center shrink-0",
                      isSelected ? "bg-primary border-primary" : "border-muted-foreground/30"
                    )}>
                      {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                    </div>
                    <span className="truncate">{entity.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
        {selectedIds.length > 0 && (
          <div className="p-2 border-t">
            <div className="flex flex-wrap gap-1">
              {selectedIds.slice(0, 3).map((id) => {
                const entity = entities.find(e => e.id === id);
                return entity ? (
                  <Badge key={id} variant="secondary" className="text-[10px] gap-1">
                    {entity.name.length > 15 ? entity.name.slice(0, 15) + '…' : entity.name}
                    <X className="h-2.5 w-2.5 cursor-pointer" onClick={(e) => { e.stopPropagation(); toggleEntity(id); }} />
                  </Badge>
                ) : null;
              })}
              {selectedIds.length > 3 && (
                <Badge variant="outline" className="text-[10px]">+{selectedIds.length - 3} more</Badge>
              )}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
