/**
 * LinkedIconStudioLibraries — Surfaces icon collections linked from Icon Studio
 * to a specific brand/product/event in the brand hub iconography area.
 *
 * Each library renders as its own card with a preview of icons, library metadata,
 * and a deep link into Icon Studio for management. Defaults expanded when at
 * least one library is linked so brand admins see their curated icon set
 * immediately on the iconography page.
 */

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Library, Layers, Building2, Package, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import DOMPurify from 'dompurify';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useIconLibraries, type IconLibrary } from '@/hooks/useIconLibraries';
import { useIconLibraryBrandLinks } from '@/hooks/useIconLibraryBrandLinks';
import { useBundledIconLibraries } from '@/hooks/useBundledIconLibraries';
import { buildSvgString, applyColorVariant, recolorSvg } from '@/lib/svgUtils';
import type { BrandIconography } from '@/types/brand';

interface LinkedIconStudioLibrariesProps {
  organizationId?: string;
  entityId?: string;
  entityType?: 'brand' | 'product' | 'event';
  entitySlug?: string;
  entityName?: string;
  iconColor?: string;
  defaultIconLimit?: number;
}

const LEVEL_META: Record<IconLibrary['level'], { label: string; icon: typeof Library; tone: string }> = {
  core: { label: 'Core', icon: Building2, tone: 'text-blue-500 border-blue-500/30 bg-blue-500/5' },
  product_line: { label: 'Product Line', icon: Package, tone: 'text-purple-500 border-purple-500/30 bg-purple-500/5' },
  brand: { label: 'Brand', icon: Layers, tone: 'text-emerald-500 border-emerald-500/30 bg-emerald-500/5' },
};

const renderIcon = (icon: BrandIconography, iconColor: string, size = 28) => {
  const fullSvg = buildSvgString(icon);
  let colored = fullSvg;
  if (iconColor && iconColor !== 'currentColor') {
    try {
      colored = recolorSvg(fullSvg, iconColor);
    } catch {
      colored = applyColorVariant(fullSvg, 'original');
    }
  }
  const sanitized = DOMPurify.sanitize(colored, { USE_PROFILES: { svg: true, svgFilters: true } });
  return (
    <div
      className="flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
};

export const LinkedIconStudioLibraries = ({
  organizationId,
  entityId,
  entityType = 'brand',
  entitySlug,
  entityName,
  iconColor = 'currentColor',
  defaultIconLimit = 12,
}: LinkedIconStudioLibrariesProps) => {
  const { libraries, isLoading } = useIconLibraries(organizationId);
  const { bundledLibraries, loading: bundledLoading } = useBundledIconLibraries(organizationId);
  const { getLinkedLibraryIdsForEntity, isLoading: linksLoading } = useIconLibraryBrandLinks(organizationId);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const linkedLibraries = useMemo(() => {
    if (!entityId || !organizationId) return [];
    const ids = new Set(getLinkedLibraryIdsForEntity(entityId, entityType));
    const normalizedName = (entityName || '').trim().toLowerCase();

    // Auto-attach: every brand sees all org-level (core / product_line) libraries,
    // every bundled pack (Multicultural, Twemoji, etc.), explicitly linked sets,
    // and brand-level libraries whose name matches this entity.
    const all = [...libraries, ...bundledLibraries];
    const matched = all.filter(lib => {
      if (!lib.is_active) return false;
      if (ids.has(lib.id)) return true;
      if (lib.level === 'core' || lib.level === 'product_line') return true;
      // Brand-services libraries (named "Services - <Brand>") auto-attach to
      // every entity in the org so each brand's solution-specific icons surface
      // on brand, product, and event iconography sections.
      if (lib.name?.toLowerCase().startsWith('services - ')) return true;
      if (lib.level !== 'brand' || !normalizedName) return false;
      const libName = lib.name.trim().toLowerCase();
      return libName === normalizedName
        || libName.startsWith(`${normalizedName} `)
        || libName === `${normalizedName} essentials`;
    });

    // Stable order: explicitly linked first, then by level (brand → product_line → core).
    const levelOrder: Record<string, number> = { brand: 0, product_line: 1, core: 2 };
    return matched.sort((a, b) => {
      const al = ids.has(a.id) ? -1 : levelOrder[a.level] ?? 3;
      const bl = ids.has(b.id) ? -1 : levelOrder[b.level] ?? 3;
      return al - bl;
    });
  }, [libraries, bundledLibraries, entityId, entityType, organizationId, getLinkedLibraryIdsForEntity, entityName]);

  if (!organizationId || !entityId) return null;
  if (isLoading || linksLoading) return null;

  const hubPath =
    entityType === 'brand'
      ? `/icon-studio/brand/${entitySlug || ''}`
      : entityType === 'product'
        ? `/icon-studio/product/${entitySlug || ''}`
        : `/icon-studio/event/${entitySlug || ''}`;

  if (linkedLibraries.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex items-center justify-between gap-4 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">No Icon Studio collections linked yet</p>
              <p className="text-xs text-muted-foreground">
                Link a curated collection to surface {entityName || 'this entity'}'s icons here.
              </p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link to={entitySlug ? hubPath : '/icon-studio'}>
              <ExternalLink className="h-4 w-4" />
              Open Icon Studio
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const totalIcons = linkedLibraries.reduce((sum, lib) => sum + lib.icons.length, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Library className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Linked Icon Studio Collections</h3>
          <Badge variant="secondary" className="text-xs">
            {linkedLibraries.length} {linkedLibraries.length === 1 ? 'collection' : 'collections'} · {totalIcons} icons
          </Badge>
        </div>
        <Button asChild variant="ghost" size="sm" className="gap-2 text-xs">
          <Link to={entitySlug ? hubPath : '/icon-studio'}>
            Manage in Icon Studio
            <ExternalLink className="h-3 w-3" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {linkedLibraries.map(lib => {
          const meta = LEVEL_META[lib.level];
          const LevelIcon = meta.icon;
          const isExpanded = expanded[lib.id] ?? false;
          const visible = isExpanded ? lib.icons : lib.icons.slice(0, defaultIconLimit);
          const hiddenCount = lib.icons.length - defaultIconLimit;

          return (
            <Card key={lib.id} className={cn('border', meta.tone.split(' ').find(c => c.startsWith('border-')))}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <LevelIcon className={cn('h-4 w-4', meta.tone.split(' ').find(c => c.startsWith('text-')))} />
                      <span className="truncate">{lib.name}</span>
                    </CardTitle>
                    {lib.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{lib.description}</p>
                    )}
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    {meta.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {lib.icons.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">Collection is empty</p>
                ) : (
                  <>
                    <div className="grid grid-cols-6 gap-2">
                      {visible.map((icon, idx) => (
                        <div
                          key={`${icon.id}-${idx}`}
                          title={icon.name}
                          className="aspect-square rounded-md border bg-muted/30 hover:bg-muted transition-colors flex items-center justify-center p-1.5"
                        >
                          {renderIcon(icon, iconColor)}
                        </div>
                      ))}
                    </div>
                    {hiddenCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs h-7"
                        onClick={() => setExpanded(prev => ({ ...prev, [lib.id]: !isExpanded }))}
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="h-3 w-3 mr-1" /> Show less
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-3 w-3 mr-1" /> View all {lib.icons.length} icons
                          </>
                        )}
                      </Button>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
