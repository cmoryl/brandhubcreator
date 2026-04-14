/**
 * ImageryAnalytics - Stats dashboard for imagery metrics
 */
import { useMemo } from 'react';
import { BarChart3, ImageIcon, Layers, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ApprovedImagerySubSection } from '@/types/brand';
import { ImageryEntity } from '@/hooks/useImageryHubEntities';

interface ImageryAnalyticsProps {
  entity: ImageryEntity;
  sections: ApprovedImagerySubSection[];
  allEntities?: ImageryEntity[];
}

export const ImageryAnalytics = ({ entity, sections, allEntities }: ImageryAnalyticsProps) => {
  const stats = useMemo(() => {
    const totalImages = sections.reduce((sum, s) => sum + s.images.length, 0);
    const emptySections = sections.filter(s => s.images.length === 0);
    const sourceBreakdown = new Map<string, number>();
    const allTags = new Map<string, number>();
    let newestDate = '';

    sections.forEach(s => {
      s.images.forEach(img => {
        sourceBreakdown.set(img.source, (sourceBreakdown.get(img.source) || 0) + 1);
        if (img.approvedAt && img.approvedAt > newestDate) newestDate = img.approvedAt;
        img.tags?.forEach(tag => {
          allTags.set(tag, (allTags.get(tag) || 0) + 1);
        });
      });
    });

    const largestSection = sections.reduce<{ name: string; count: number }>(
      (best, s) => s.images.length > best.count ? { name: s.name, count: s.images.length } : best,
      { name: '-', count: 0 }
    );

    return { totalImages, emptySections, sourceBreakdown, allTags, newestDate, largestSection };
  }, [sections]);

  const statCards = [
    {
      icon: ImageIcon,
      label: 'Total Images',
      value: stats.totalImages,
      sub: `${sections.length} categories`,
    },
    {
      icon: Layers,
      label: 'Largest Category',
      value: stats.largestSection.count,
      sub: stats.largestSection.name,
    },
    {
      icon: BarChart3,
      label: 'Sources',
      value: stats.sourceBreakdown.size,
      sub: Array.from(stats.sourceBreakdown.entries())
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ') || 'None',
    },
    {
      icon: AlertTriangle,
      label: 'Empty Categories',
      value: stats.emptySections.length,
      sub: stats.emptySections.length > 0
        ? stats.emptySections.map(s => s.name).slice(0, 3).join(', ')
        : 'All covered',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {statCards.map((card, i) => (
        <Card key={i} className="border-border/50">
          <CardContent className="p-3 flex items-start gap-3">
            <div className="p-2 rounded-md bg-primary/10 shrink-0">
              <card.icon className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{card.label}</p>
              <p className="text-lg font-bold text-foreground">{card.value}</p>
              <p className="text-xs text-muted-foreground truncate">{card.sub}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
