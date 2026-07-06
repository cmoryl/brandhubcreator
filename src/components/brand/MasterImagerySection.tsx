/**
 * MasterImagerySection
 * Consolidates all imagery surfaces for a brand into a single section with
 * a unified gallery + filter chips. Sources merged:
 *   - Photography Standards (Do / Don't + Visual DNA)  → existing ImagerySection
 *   - Approved Library (curated approved imagery)      → existing ApprovedImagerySection
 *   - AI Generated (Creative Studio assets)            → existing CreativeStudioSection
 *
 * The existing rich editors are preserved and composed behind filter chips
 * so all logic (uploads, tagging, generation, learning signals, etc.) keeps
 * working exactly as before.
 */

import { useMemo, useState, lazy, Suspense } from 'react';
import { Images, Wand2, Camera, LayoutGrid, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SectionHeader } from './SectionHeader';
import { ImagerySection } from './ImagerySection';
import { ApprovedImagerySection } from './approved-imagery/ApprovedImagerySection';
import type { BrandImagery, ApprovedImagerySubSection } from '@/types/brand';

const CreativeStudioSection = lazy(() =>
  import('./creative-studio/CreativeStudioSection').then((m) => ({ default: m.CreativeStudioSection }))
);

type Filter = 'all' | 'standards' | 'approved' | 'generated';

interface MasterImagerySectionProps {
  // Photography Standards
  imagery: BrandImagery[];
  onImageryChange?: (imagery: BrandImagery[]) => void;
  // Approved Library
  approvedImagery?: { sections: ApprovedImagerySubSection[] };
  onApprovedImageryChange?: (v: { sections: ApprovedImagerySubSection[] }) => void;
  // Creative Studio
  entityId: string;
  entityType: 'brand' | 'product' | 'event';
  entityName: string;
  organizationId?: string | null;
  guideData: Record<string, unknown>;
  // Shared
  isAdmin?: boolean;
  brandSlug?: string;
  brandVisuals?: any;
  customSubtitle?: string;
  onSubtitleChange?: (v: string) => void;
}

interface UnifiedItem {
  id: string;
  url: string;
  source: 'standards' | 'approved';
  label?: string;
  badge?: 'do' | 'dont';
}

export const MasterImagerySection = ({
  imagery,
  onImageryChange,
  approvedImagery,
  onApprovedImageryChange,
  entityId,
  entityType,
  entityName,
  organizationId,
  guideData,
  isAdmin,
  brandSlug,
  brandVisuals,
  customSubtitle,
  onSubtitleChange,
}: MasterImagerySectionProps) => {
  const [filter, setFilter] = useState<Filter>('all');
  const [isHeaderEditing, setIsHeaderEditing] = useState(false);
  const canEdit = Boolean(onImageryChange);

  const approvedFlat = useMemo<UnifiedItem[]>(() => {
    const sections = approvedImagery?.sections || [];
    return sections.flatMap((s) =>
      (s.images || []).map((img) => ({
        id: `approved-${img.id}`,
        url: img.url,
        source: 'approved' as const,
        label: s.name,
      }))
    );
  }, [approvedImagery]);

  const standardsFlat = useMemo<UnifiedItem[]>(
    () =>
      imagery.map((i) => ({
        id: `standards-${i.id}`,
        url: i.url,
        source: 'standards',
        badge: i.type,
        label: i.type === 'do' ? 'Do' : "Don't",
      })),
    [imagery]
  );

  const counts = {
    standards: standardsFlat.length,
    approved: approvedFlat.length,
    all: standardsFlat.length + approvedFlat.length,
  };

  const chips: { id: Filter; label: string; icon: any; count?: number }[] = [
    { id: 'all', label: 'All Imagery', icon: LayoutGrid, count: counts.all },
    { id: 'approved', label: 'Approved Library', icon: Images, count: counts.approved },
    { id: 'standards', label: 'Photography Standards', icon: Camera, count: counts.standards },
    { id: 'generated', label: 'AI Generated', icon: Wand2 },
  ];

  return (
    <section className="space-y-6">
      <SectionHeader
        title="Imagery"
        defaultSubtitle="One place for approved photography, visual standards, and AI-generated imagery"
        customSubtitle={customSubtitle}
        onSubtitleChange={canEdit ? onSubtitleChange : undefined}
        isEditing={isHeaderEditing}
        onEditToggle={() => setIsHeaderEditing(!isHeaderEditing)}
      />

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {chips.map((c) => {
          const Icon = c.icon;
          const active = filter === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setFilter(c.id)}
              className={`inline-flex items-center gap-2 px-3 h-9 rounded-full border text-sm transition-colors ${
                active
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background hover:bg-muted border-border text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{c.label}</span>
              {typeof c.count === 'number' && (
                <Badge
                  variant={active ? 'secondary' : 'outline'}
                  className="h-5 px-1.5 text-xs"
                >
                  {c.count}
                </Badge>
              )}
            </button>
          );
        })}
      </div>

      {filter === 'all' && (
        <div className="space-y-8">
          <UnifiedOverview
            items={[...approvedFlat, ...standardsFlat]}
            onOpenFilter={setFilter}
          />
          <QuickJump onOpenFilter={setFilter} counts={counts} />
        </div>
      )}

      {filter === 'approved' && (
        <ApprovedImagerySection
          approvedImagery={approvedImagery}
          onApprovedImageryChange={onApprovedImageryChange}
          canEdit={canEdit}
          entityId={entityId}
          entityType={entityType}
          organizationId={organizationId}
        />
      )}

      {filter === 'standards' && (
        <ImagerySection
          imagery={imagery}
          onImageryChange={onImageryChange}
          entityId={entityId}
          entityType={entityType}
          isAdmin={isAdmin}
          brandSlug={brandSlug}
          brandVisuals={brandVisuals}
        />
      )}

      {filter === 'generated' && (
        <Suspense fallback={<div className="h-40 flex items-center justify-center text-muted-foreground">Loading Creative Studio…</div>}>
          <CreativeStudioSection
            entityId={entityId}
            entityType={entityType}
            entityName={entityName}
            organizationId={organizationId}
            guideData={guideData}
            isEditing={canEdit}
          />
        </Suspense>
      )}
    </section>
  );
};

const UnifiedOverview = ({
  items,
  onOpenFilter,
}: {
  items: UnifiedItem[];
  onOpenFilter: (f: Filter) => void;
}) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-16 border-2 border-dashed border-border rounded-xl">
        <Images className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">No imagery yet</h3>
        <p className="text-muted-foreground mb-4">
          Add approved photography, upload examples, or generate on-brand imagery.
        </p>
        <div className="flex justify-center gap-2 flex-wrap">
          <Button size="sm" onClick={() => onOpenFilter('approved')}>
            <Images className="h-4 w-4 mr-2" />
            Approved Library
          </Button>
          <Button size="sm" variant="outline" onClick={() => onOpenFilter('standards')}>
            <Camera className="h-4 w-4 mr-2" />
            Photography Standards
          </Button>
          <Button size="sm" variant="outline" onClick={() => onOpenFilter('generated')}>
            <Wand2 className="h-4 w-4 mr-2" />
            AI Generate
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {items.slice(0, 40).map((item) => (
        <button
          key={item.id}
          onClick={() =>
            onOpenFilter(item.source === 'approved' ? 'approved' : 'standards')
          }
          className="group relative aspect-square rounded-lg overflow-hidden border bg-muted"
        >
          <img
            src={item.url}
            alt={item.label || ''}
            loading="lazy"
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-[11px] font-medium text-white truncate block">
              {item.label}
            </span>
          </div>
          {item.badge && (
            <span
              className={`absolute top-1.5 left-1.5 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded ${
                item.badge === 'do'
                  ? 'bg-green-500/90 text-white'
                  : 'bg-red-500/90 text-white'
              }`}
            >
              {item.badge === 'do' ? 'Do' : "Don't"}
            </span>
          )}
          <span className="absolute top-1.5 right-1.5 text-[10px] font-medium uppercase tracking-wide px-1.5 py-0.5 rounded bg-background/90 text-foreground">
            {item.source === 'approved' ? 'Library' : 'Std'}
          </span>
        </button>
      ))}
      {items.length > 40 && (
        <div className="col-span-full text-center text-sm text-muted-foreground">
          Showing 40 of {items.length}. Use a filter above to see everything.
        </div>
      )}
    </div>
  );
};

const QuickJump = ({
  onOpenFilter,
  counts,
}: {
  onOpenFilter: (f: Filter) => void;
  counts: { standards: number; approved: number };
}) => (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
    <JumpCard
      icon={Images}
      title="Approved Library"
      desc="Curated, tagged, on-brand photography organized into sub-sections."
      count={counts.approved}
      onClick={() => onOpenFilter('approved')}
    />
    <JumpCard
      icon={Camera}
      title="Photography Standards"
      desc="Do's & Don'ts, Visual DNA, and photography starters."
      count={counts.standards}
      onClick={() => onOpenFilter('standards')}
    />
    <JumpCard
      icon={Wand2}
      title="AI Generated"
      desc="Generate new on-brand imagery with prompts and style presets."
      onClick={() => onOpenFilter('generated')}
    />
  </div>
);

const JumpCard = ({
  icon: Icon,
  title,
  desc,
  count,
  onClick,
}: {
  icon: any;
  title: string;
  desc: string;
  count?: number;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="group text-left rounded-xl border bg-card p-4 hover:border-primary/40 hover:shadow-sm transition-all"
  >
    <div className="flex items-center justify-between mb-2">
      <div className="p-2 rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      {typeof count === 'number' && (
        <Badge variant="secondary" className="h-5 px-1.5 text-xs">
          {count}
        </Badge>
      )}
    </div>
    <div className="flex items-center gap-1 font-medium text-sm mb-1">
      {title}
      <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
    </div>
    <p className="text-xs text-muted-foreground">{desc}</p>
  </button>
);
