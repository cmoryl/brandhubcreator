import { memo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/**
 * Skeleton placeholder for a single Canva audit card. Matches the real
 * AuditCard layout (icon block, status pill, title, description, 3-stat
 * footer) so the swap-in is visually stable.
 */
export const AuditCardSkeleton = memo(({ delayMs = 0 }: { delayMs?: number }) => {
  return (
    <div
      aria-busy="true"
      aria-label="Loading audit card"
      className="relative flex flex-col overflow-hidden rounded-2xl border bg-card p-6 animate-fade-in"
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <Skeleton className="h-11 w-11 rounded-xl" />
        <div className="flex flex-col items-end gap-2">
          <Skeleton className="h-4 w-16 rounded-full" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>

      <Skeleton className="mb-2 h-3 w-24" />
      <Skeleton className="mb-3 h-5 w-3/4" />
      <Skeleton className="mb-1.5 h-3 w-full" />
      <Skeleton className="mb-1.5 h-3 w-11/12" />
      <Skeleton className="mb-5 h-3 w-4/5" />

      <div className="grid grid-cols-3 gap-2 border-t border-border/60 pt-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i}>
            <Skeleton className="mb-1.5 h-5 w-10" />
            <Skeleton className="h-2.5 w-16" />
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
});
AuditCardSkeleton.displayName = 'AuditCardSkeleton';

/**
 * Skeleton for the standalone audit detail page (iframe-wrapped reports).
 * Mimics a report toolbar + table + sidebar so the transition feels seamless.
 */
export const AuditDetailSkeleton = memo(({ className }: { className?: string }) => {
  return (
    <div
      aria-busy="true"
      aria-label="Loading audit report"
      className={cn(
        'flex h-full w-full flex-col gap-4 bg-background p-6 animate-fade-in',
        className,
      )}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-20 rounded-full" />
        ))}
      </div>

      {/* Body: stat cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-card p-4"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <Skeleton className="mb-2 h-3 w-20" />
            <Skeleton className="mb-1 h-7 w-16" />
            <Skeleton className="h-2.5 w-24" />
          </div>
        ))}
      </div>

      {/* Body: table */}
      <div className="flex-1 overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex items-center gap-3 border-b border-border bg-muted/30 px-4 py-3">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="ml-auto h-3 w-24" />
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 px-4 py-3 animate-fade-in"
              style={{ animationDelay: `${i * 35}ms` }}
            >
              <Skeleton className="h-10 w-14 rounded-md" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-2/3" />
                <Skeleton className="h-2.5 w-1/3" />
              </div>
              <Skeleton className="hidden h-3 w-20 md:block" />
              <Skeleton className="hidden h-3 w-16 md:block" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
AuditDetailSkeleton.displayName = 'AuditDetailSkeleton';

/**
 * Wrapper that overlays an AuditDetailSkeleton on top of children
 * (typically an <iframe>) until `loaded` becomes true. Fades out smoothly
 * so the underlying content is visible the instant it's ready.
 */
export const AuditDetailLoader = ({
  loaded,
  children,
}: {
  loaded: boolean;
  children: React.ReactNode;
}) => {
  return (
    <div className="relative flex-1 w-full">
      {children}
      <div
        aria-hidden={loaded}
        className={cn(
          'pointer-events-none absolute inset-0 transition-opacity duration-500',
          loaded ? 'opacity-0' : 'opacity-100',
        )}
      >
        <AuditDetailSkeleton />
      </div>
    </div>
  );
};
