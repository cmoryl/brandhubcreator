import { memo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { SectionId } from '@/types/brand';

/**
 * Lightweight placeholder rendered in place of a real brand section until
 * it scrolls into view. Variants roughly match the visual rhythm of the
 * real section so layout shift is minimal when the content hydrates.
 */
interface BrandSectionSkeletonProps {
  sectionId: SectionId;
}

type Variant = 'hero' | 'grid' | 'gallery' | 'list' | 'chart' | 'text';

const VARIANT_BY_SECTION: Partial<Record<SectionId, Variant>> = {
  hero: 'hero',
  tagline: 'text',
  identity: 'text',
  values: 'grid',
  bythenumbers: 'chart',
  services: 'grid',
  revenue: 'chart',
  awards: 'gallery',
  webinars: 'gallery',
  logos: 'gallery',
  brandicon: 'grid',
  colors: 'grid',
  gradients: 'gallery',
  layouttemplates: 'gallery',
  patterns: 'gallery',
  typography: 'list',
  textstyles: 'list',
  iconography: 'grid',
  socialicons: 'grid',
  imagery: 'gallery',
  approvedimagery: 'gallery',
  social: 'list',
  socialassets: 'gallery',
  website: 'list',
  signatures: 'list',
  qr: 'grid',
  videos: 'gallery',
  assets: 'list',
  imageassets: 'gallery',
  misuse: 'grid',
  digitalcollateral: 'list',
  casestudies: 'gallery',
  templates: 'gallery',
  templatespecs: 'list',
  presentations: 'gallery',
  products: 'gallery',
  events: 'gallery',
  insights: 'list',
  locations: 'chart',
  eventsignage: 'gallery',
  clientlogos: 'gallery',
  sponsorlogos: 'gallery',
  studios: 'gallery',
  globallinkuniverse: 'chart',
};

const SectionHeader = () => (
  <div className="mb-6 space-y-2">
    <Skeleton className="h-7 w-48" />
    <Skeleton className="h-4 w-72 max-w-full" />
  </div>
);

const HeroSkeleton = () => (
  <div className="w-full">
    <div className="relative w-full h-[60vh] min-h-[420px] overflow-hidden rounded-none">
      <Skeleton className="absolute inset-0 rounded-none" />
      <div className="absolute inset-0 flex items-end p-8 sm:p-12">
        <div className="space-y-4 max-w-2xl w-full">
          <Skeleton className="h-10 w-24 rounded-md" />
          <Skeleton className="h-12 w-2/3" />
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-5 w-1/3" />
        </div>
      </div>
    </div>
  </div>
);

const GridSkeleton = ({ count = 6 }: { count?: number }) => (
  <div>
    <SectionHeader />
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border p-4 space-y-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      ))}
    </div>
  </div>
);

const GallerySkeleton = ({ count = 4 }: { count?: number }) => (
  <div>
    <SectionHeader />
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="aspect-[4/3] w-full rounded-xl" />
      ))}
    </div>
  </div>
);

const ListSkeleton = ({ count = 4 }: { count?: number }) => (
  <div>
    <SectionHeader />
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-xl border border-border p-4">
          <Skeleton className="h-12 w-12 rounded-md shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

const ChartSkeleton = () => (
  <div>
    <SectionHeader />
    <Skeleton className="h-72 w-full rounded-xl" />
  </div>
);

const TextSkeleton = () => (
  <div>
    <SectionHeader />
    <div className="space-y-3 max-w-3xl">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-11/12" />
      <Skeleton className="h-4 w-10/12" />
      <Skeleton className="h-4 w-9/12" />
    </div>
  </div>
);

const RENDERERS: Record<Variant, () => JSX.Element> = {
  hero: HeroSkeleton,
  grid: GridSkeleton,
  gallery: GallerySkeleton,
  list: ListSkeleton,
  chart: ChartSkeleton,
  text: TextSkeleton,
};

export const BrandSectionSkeleton = memo(({ sectionId }: BrandSectionSkeletonProps) => {
  const variant = VARIANT_BY_SECTION[sectionId] ?? 'text';
  const Renderer = RENDERERS[variant];
  return (
    <div
      aria-busy="true"
      aria-label={`Loading ${sectionId} section`}
      className="min-h-[160px] animate-fade-in"
    >
      <Renderer />
    </div>
  );
});
BrandSectionSkeleton.displayName = 'BrandSectionSkeleton';
