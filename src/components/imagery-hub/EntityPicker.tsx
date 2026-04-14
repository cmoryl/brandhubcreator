/**
 * EntityPicker - Tree + Flat list picker for imagery hub entities
 */
import { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, ImageIcon, Package, Calendar, Search, List, GitBranch, Crown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { EntityTreeNode, ImageryEntity } from '@/hooks/useImageryHubEntities';

interface EntityPickerProps {
  entities: ImageryEntity[];
  tree: EntityTreeNode[];
  selectedId?: string;
  onSelect: (entity: ImageryEntity) => void;
  isLoading: boolean;
}

const typeIcons = {
  brand: ImageIcon,
  product: Package,
  event: Calendar,
};

const typeColors = {
  brand: 'text-primary',
  product: 'text-blue-500',
  event: 'text-amber-500',
};

const typeBadgeVariant = {
  brand: 'default' as const,
  product: 'secondary' as const,
  event: 'outline' as const,
};

export const EntityPicker = ({ entities, tree, selectedId, onSelect, isLoading }: EntityPickerProps) => {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'tree' | 'flat'>('tree');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [typeFilter, setTypeFilter] = useState<'all' | 'brand' | 'product' | 'event'>('all');

  const filteredEntities = useMemo(() => {
    let filtered = entities;
    if (typeFilter !== 'all') filtered = filtered.filter(e => e.type === typeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(e =>
        e.name.toLowerCase().includes(q) ||
        e.parentBrandName?.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [entities, search, typeFilter]);

  const toggleExpand = (id: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const renderTreeNode = (node: EntityTreeNode, depth = 0) => {
    const Icon = typeIcons[node.type];
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = node.id === selectedId;

    // Filter in search mode
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchesSelf = node.name.toLowerCase().includes(q);
      const matchesChild = node.children.some(c => c.name.toLowerCase().includes(q));
      if (!matchesSelf && !matchesChild) return null;
    }

    return (
      <div key={node.id}>
        <button
          onClick={() => {
            onSelect(node);
            if (hasChildren) toggleExpand(node.id);
          }}
          className={cn(
            'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors hover:bg-accent/50',
            isSelected && 'bg-primary/10 text-primary font-medium',
          )}
          style={{ paddingLeft: `${12 + depth * 20}px` }}
        >
          {hasChildren ? (
            <span className="shrink-0" onClick={(e) => { e.stopPropagation(); toggleExpand(node.id); }}>
              {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </span>
          ) : (
            <span className="w-3.5" />
          )}
          <Icon className={cn('h-4 w-4 shrink-0', typeColors[node.type])} />
          <span className="truncate flex-1 text-left">{node.name}</span>
          {node.isSuiteMaster && <Crown className="h-3 w-3 text-amber-500 shrink-0" />}
          {node.imageryCount > 0 && (
            <Badge variant="secondary" className="text-[10px] h-5 px-1.5 shrink-0">
              {node.imageryCount}
            </Badge>
          )}
        </button>
        {hasChildren && isExpanded && (
          <div>
            {node.children.map(child => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full border-r border-border">
      {/* Header */}
      <div className="p-3 border-b border-border space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search entities..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={viewMode === 'tree' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => setViewMode('tree')}
              >
                <GitBranch className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Tree View</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={viewMode === 'flat' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => setViewMode('flat')}
              >
                <List className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Flat List</TooltipContent>
          </Tooltip>
        </div>
        <div className="flex gap-1.5">
          {(['all', 'brand', 'product', 'event'] as const).map(t => (
            <Button
              key={t}
              variant={typeFilter === t ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 text-xs px-2.5"
              onClick={() => setTypeFilter(t)}
            >
              {t === 'all' ? 'All' : `${t.charAt(0).toUpperCase()}${t.slice(1)}s`}
            </Button>
          ))}
        </div>
      </div>

      {/* Entity List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">Loading entities...</div>
          ) : viewMode === 'tree' ? (
            tree.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No entities found</p>
            ) : (
              tree.map(node => renderTreeNode(node))
            )
          ) : (
            filteredEntities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No entities found</p>
            ) : (
              filteredEntities.map(entity => {
                const Icon = typeIcons[entity.type];
                const isSelected = entity.id === selectedId;
                return (
                  <button
                    key={entity.id}
                    onClick={() => onSelect(entity)}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors hover:bg-accent/50',
                      isSelected && 'bg-primary/10 text-primary font-medium',
                    )}
                  >
                    <Icon className={cn('h-4 w-4 shrink-0', typeColors[entity.type])} />
                    <div className="flex-1 text-left min-w-0">
                      <p className="truncate">{entity.name}</p>
                      {entity.parentBrandName && (
                        <p className="text-[11px] text-muted-foreground truncate">{entity.parentBrandName}</p>
                      )}
                    </div>
                    <Badge variant={typeBadgeVariant[entity.type]} className="text-[10px] h-5 px-1.5 shrink-0">
                      {entity.type}
                    </Badge>
                    {entity.imageryCount > 0 && (
                      <Badge variant="secondary" className="text-[10px] h-5 px-1.5 shrink-0">
                        {entity.imageryCount}
                      </Badge>
                    )}
                  </button>
                );
              })
            )
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
