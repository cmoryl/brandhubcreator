/**
 * AssignmentPanel - Right panel for assigning icon collections to brands/products/events
 */

import { useMemo, useState } from 'react';
import {
  Building2,
  Package,
  Layers,
  Link2,
  Check,
  Calendar,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IconLibrary } from '@/hooks/useIconLibraries';
import { cn } from '@/lib/utils';
import { LEVEL_BADGES } from './constants';

interface EntityItem {
  id: string;
  name: string;
}

interface AssignmentPanelProps {
  libraries: IconLibrary[];
  brands: EntityItem[];
  products: EntityItem[];
  events: EntityItem[];
  linkedLibraryIdsForEntity: (entityId: string, entityType: 'brand' | 'product' | 'event') => string[];
  onToggleLink: (libraryId: string, entityId: string, entityType: 'brand' | 'product' | 'event', isLinked: boolean) => void;
}

export const AssignmentPanel = ({
  libraries,
  brands,
  products,
  events,
  linkedLibraryIdsForEntity,
  onToggleLink,
}: AssignmentPanelProps) => {
  const [assignTab, setAssignTab] = useState<'brand' | 'product' | 'event'>('brand');
  const [selectedEntityId, setSelectedEntityId] = useState<string>('');

  const entityList = useMemo(() => {
    if (assignTab === 'brand') return brands;
    if (assignTab === 'product') return products;
    if (assignTab === 'event') return events;
    return [];
  }, [assignTab, brands, products, events]);

  const selectedEntityLinkedLibIds = useMemo(() => {
    if (!selectedEntityId) return new Set<string>();
    return new Set(linkedLibraryIdsForEntity(selectedEntityId, assignTab));
  }, [selectedEntityId, assignTab, linkedLibraryIdsForEntity]);

  const selectedEntityName = useMemo(() => {
    return entityList.find(e => e.id === selectedEntityId)?.name || '';
  }, [entityList, selectedEntityId]);

  const handleTabChange = (tab: string) => {
    setAssignTab(tab as typeof assignTab);
    setSelectedEntityId('');
  };

  const assignableLibraries = libraries.filter(lib => lib.level !== 'core' && lib.is_active && lib.icons.length > 0);

  return (
    <div className="lg:col-span-2 space-y-4">
      <div className="sticky top-4">
        <div className="rounded-lg border bg-card">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Link2 className="h-4 w-4 text-primary" />
              Assign Collections
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Select a brand, product, or event to manage its icon assignments
            </p>
          </div>

          {/* Entity type tabs */}
          <Tabs value={assignTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="w-full rounded-none border-b bg-transparent h-auto p-0">
              <TabsTrigger value="brand" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent gap-1.5 text-xs py-2.5">
                <Layers className="h-3.5 w-3.5" />
                Brands
                <Badge variant="secondary" className="text-[10px] h-4 px-1">{brands.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="product" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent gap-1.5 text-xs py-2.5">
                <Package className="h-3.5 w-3.5" />
                Products
                <Badge variant="secondary" className="text-[10px] h-4 px-1">{products.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="event" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent gap-1.5 text-xs py-2.5">
                <Calendar className="h-3.5 w-3.5" />
                Events
                <Badge variant="secondary" className="text-[10px] h-4 px-1">{events.length}</Badge>
              </TabsTrigger>
            </TabsList>

            <div className="p-4">
              <Select value={selectedEntityId || 'none'} onValueChange={(v) => setSelectedEntityId(v === 'none' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder={`Choose a ${assignTab}...`} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Choose a {assignTab}...</SelectItem>
                  {entityList.map(entity => (
                    <SelectItem key={entity.id} value={entity.id}>
                      {entity.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Tabs>

          {selectedEntityId && (
            <div className="px-4 pb-4 space-y-2">
              <Separator />
              <div className="pt-2">
                {/* Core notice */}
                <div className="text-xs text-muted-foreground bg-blue-500/5 border border-blue-500/20 rounded-md px-3 py-2 mb-3 flex items-center gap-2">
                  <Building2 className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                  Core collections are auto-included for all {assignTab}s
                </div>

                {/* Assignable collections */}
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Toggle collections for {selectedEntityName}:
                </p>
                <div className="space-y-1">
                  {assignableLibraries.map(library => {
                    const isLinked = selectedEntityLinkedLibIds.has(library.id);
                    const levelBadge = LEVEL_BADGES[library.level];
                    const LevelIcon = levelBadge.icon;

                    return (
                      <button
                        key={library.id}
                        onClick={() => onToggleLink(library.id, selectedEntityId, assignTab, isLinked)}
                        className={cn(
                          'w-full flex items-center justify-between p-2.5 rounded-md text-left transition-colors',
                          isLinked
                            ? 'bg-primary/5 border border-primary/20'
                            : 'hover:bg-muted/50 border border-transparent'
                        )}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={cn(
                            'w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors',
                            isLinked ? 'bg-primary text-primary-foreground' : 'border border-muted-foreground/30'
                          )}>
                            {isLinked && <Check className="h-3 w-3" />}
                          </div>
                          <div className="min-w-0">
                            <span className="text-sm font-medium truncate block">{library.name}</span>
                            <span className="text-[10px] text-muted-foreground">{library.icons.length} icons</span>
                          </div>
                        </div>
                        <Badge variant="outline" className={cn('text-[10px] shrink-0', levelBadge.className)}>
                          <LevelIcon className="h-2.5 w-2.5 mr-0.5" />
                          {levelBadge.label}
                        </Badge>
                      </button>
                    );
                  })}

                  {assignableLibraries.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4 italic">
                      No collections available to assign
                    </p>
                  )}
                </div>

                {/* Summary */}
                {selectedEntityLinkedLibIds.size > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        {selectedEntityLinkedLibIds.size} collection{selectedEntityLinkedLibIds.size !== 1 ? 's' : ''} assigned
                      </span>
                      <span className="font-medium">
                        {libraries
                          .filter(lib => selectedEntityLinkedLibIds.has(lib.id))
                          .reduce((sum, lib) => sum + lib.icons.length, 0)} icons
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {!selectedEntityId && entityList.length > 0 && (
            <div className="px-4 pb-4">
              <div className="text-center py-6 text-muted-foreground">
                <Link2 className="h-6 w-6 mx-auto mb-2 opacity-30" />
                <p className="text-xs">Select a {assignTab} to manage its icon assignments</p>
              </div>
            </div>
          )}

          {entityList.length === 0 && (
            <div className="px-4 pb-4">
              <div className="text-center py-6 text-muted-foreground">
                <p className="text-xs">No {assignTab}s found. Create some first.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
