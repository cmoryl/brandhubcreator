/**
 * CollectionList - Left panel showing all icon collections with search/filter
 */

import { useMemo, useState } from 'react';
import {
  Plus,
  Search,
  Building2,
  Package,
  Layers,
  Link2,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { IconLibrary } from '@/hooks/useIconLibraries';
import { BrandIconography } from '@/types/brand';
import { cn } from '@/lib/utils';
import DOMPurify from 'dompurify';
import { IconPreviewGrid } from './IconPreviewGrid';
import { LEVEL_BADGES } from './constants';

interface CollectionListProps {
  libraries: IconLibrary[];
  allLinkedNamesMap: Map<string, string[]>;
  onCreateClick: () => void;
  onEditClick: (library: IconLibrary) => void;
  onDeleteClick: (libraryId: string) => void;
  onAddIcons: (library: IconLibrary) => void;
  onToggleActive: (library: IconLibrary) => void;
  onPreviewIcon: (icon: BrandIconography) => void;
}

export const CollectionList = ({
  libraries,
  allLinkedNamesMap,
  onCreateClick,
  onEditClick,
  onDeleteClick,
  onAddIcons,
  onToggleActive,
  onPreviewIcon,
}: CollectionListProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('all');

  const filteredLibraries = useMemo(() => {
    let result = libraries;
    if (filterLevel !== 'all') {
      result = result.filter(lib => lib.level === filterLevel);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(lib =>
        lib.name.toLowerCase().includes(q) ||
        lib.description?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [libraries, filterLevel, searchQuery]);

  const renderIconPreview = (icon: BrandIconography) => {
    const viewBox = icon.viewBox || '0 0 24 24';
    const isFullSvg = icon.svgPath.includes('<');

    if (isFullSvg) {
      const sanitized = DOMPurify.sanitize(icon.svgPath, {
        USE_PROFILES: { svg: true, svgFilters: true },
      });
      return (
        <svg viewBox={viewBox} className="w-full h-full" fill="currentColor">
          <g dangerouslySetInnerHTML={{ __html: sanitized }} />
        </svg>
      );
    }

    return (
      <svg
        viewBox={viewBox}
        className="w-full h-full"
        fill={icon.fillMode === 'fill' ? 'currentColor' : 'none'}
        stroke={icon.fillMode === 'stroke' ? 'currentColor' : 'none'}
        strokeWidth={icon.fillMode === 'stroke' ? 2 : undefined}
      >
        <path d={icon.svgPath} />
      </svg>
    );
  };

  return (
    <div className="lg:col-span-3 space-y-4">
      {/* Search & Filter */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search collections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center border rounded-md">
          {['all', 'core', 'product_line', 'brand'].map(level => (
            <button
              key={level}
              onClick={() => setFilterLevel(level)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium transition-colors',
                filterLevel === level
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {level === 'all' ? 'All' : level === 'product_line' ? 'Product' : level.charAt(0).toUpperCase() + level.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Collection List */}
      <div className="space-y-2">
        {filteredLibraries.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg">
            <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{searchQuery ? 'No collections match your search' : 'No collections yet'}</p>
            <Button variant="outline" size="sm" className="mt-3 gap-2" onClick={onCreateClick}>
              <Plus className="h-3.5 w-3.5" />
              Create First Collection
            </Button>
          </div>
        ) : (
          filteredLibraries.map(library => {
            const levelBadge = LEVEL_BADGES[library.level];
            const LevelIcon = levelBadge.icon;
            const allLinkedNames = allLinkedNamesMap.get(library.id) || [];

            return (
              <div
                key={library.id}
                className={cn(
                  'rounded-lg border bg-card p-4 transition-all hover:shadow-sm',
                  !library.is_active && 'opacity-50'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="shrink-0 mt-0.5">
                      <Badge variant="outline" className={cn('text-[10px] gap-1', levelBadge.className)}>
                        <LevelIcon className="h-3 w-3" />
                        {levelBadge.label}
                      </Badge>
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-medium text-sm truncate">{library.name}</h4>
                      {library.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{library.description}</p>
                      )}
                      {allLinkedNames.length > 0 && (
                        <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                          <Link2 className="h-3 w-3 text-muted-foreground shrink-0" />
                          {allLinkedNames.slice(0, 3).map((name, i) => (
                            <Badge key={`${name}-${i}`} variant="secondary" className="text-[10px]">{name}</Badge>
                          ))}
                          {allLinkedNames.length > 3 && (
                            <span className="text-[10px] text-muted-foreground">+{allLinkedNames.length - 3}</span>
                          )}
                        </div>
                      )}
                      {library.level === 'core' && allLinkedNames.length === 0 && (
                        <p className="text-[10px] text-blue-500/70 mt-1">Auto-inherited by all entities</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Badge variant="outline" className="text-xs">{library.icons.length}</Badge>
                    <Switch
                      checked={library.is_active}
                      onCheckedChange={() => onToggleActive(library)}
                      className="scale-75"
                    />
                  </div>
                </div>

                {/* Icon previews */}
                {library.icons.length > 0 && (
                  <IconPreviewGrid
                    icons={library.icons}
                    onPreviewIcon={onPreviewIcon}
                    renderIconPreview={renderIconPreview}
                  />
                )}

                {/* Actions row */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => onAddIcons(library)}>
                    <Plus className="h-3 w-3" />
                    Add Icons
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onEditClick(library)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Collection</AlertDialogTitle>
                        <AlertDialogDescription>
                          Delete "{library.name}" and its {library.icons.length} icons? This cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDeleteClick(library.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
