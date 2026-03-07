/**
 * ContentPerformanceTab - Content performance analytics with section-level insights
 */

import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Eye, Clock, FileText, AlertTriangle, CheckCircle,
  Palette, Type, Image, Layers, Globe
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';

interface EntityData {
  id: string;
  name: string;
  entityType: 'brand' | 'product' | 'event';
  overallScore: number;
  isPublic: boolean;
  updatedAt: string;
  scores: {
    identity: number;
    visual: number;
    content: number;
    assets: number;
    consistency: number;
  };
  gaps: Array<{ section: string; severity: string; description: string }>;
}

interface ContentPerformanceTabProps {
  data: EntityData[];
}

const SECTION_ICONS: Record<string, React.ElementType> = {
  'Brand Name': FileText,
  'Color Palette': Palette,
  'Typography': Type,
  'Logo': Image,
  'Brand Identity': Layers,
  'Social Profiles': Globe,
};

export function ContentPerformanceTab({ data }: ContentPerformanceTabProps) {
  // Section completion rates
  const sectionCompletion = useMemo(() => {
    const sections = ['identity', 'visual', 'content', 'assets', 'consistency'] as const;
    return sections.map(s => {
      const scores = data.map(d => d.scores[s]);
      const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      const full = scores.filter(s => s >= 80).length;
      return {
        section: s.charAt(0).toUpperCase() + s.slice(1),
        avgScore: avg,
        complete: full,
        total: data.length,
        rate: data.length ? Math.round((full / data.length) * 100) : 0,
      };
    }).sort((a, b) => a.avgScore - b.avgScore);
  }, [data]);

  // Gap frequency analysis
  const gapFrequency = useMemo(() => {
    const counts = new Map<string, { count: number; critical: number }>();
    data.forEach(d => {
      d.gaps.forEach(g => {
        const existing = counts.get(g.section) || { count: 0, critical: 0 };
        existing.count++;
        if (g.severity === 'critical') existing.critical++;
        counts.set(g.section, existing);
      });
    });
    return [...counts.entries()]
      .map(([section, { count, critical }]) => ({ section, count, critical, percentage: Math.round((count / data.length) * 100) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [data]);

  // Freshness analysis
  const freshnessGroups = useMemo(() => {
    const now = new Date();
    const groups = { fresh: 0, recent: 0, aging: 0, stale: 0 };
    data.forEach(d => {
      const days = differenceInDays(now, new Date(d.updatedAt));
      if (days <= 7) groups.fresh++;
      else if (days <= 30) groups.recent++;
      else if (days <= 90) groups.aging++;
      else groups.stale++;
    });
    return [
      { label: 'Fresh (≤7d)', value: groups.fresh, color: 'hsl(142, 76%, 36%)' },
      { label: 'Recent (8-30d)', value: groups.recent, color: 'hsl(84, 81%, 44%)' },
      { label: 'Aging (31-90d)', value: groups.aging, color: 'hsl(48, 96%, 53%)' },
      { label: 'Stale (90d+)', value: groups.stale, color: 'hsl(0, 84%, 60%)' },
    ];
  }, [data]);

  // Top performers and bottom performers
  const ranked = useMemo(() => {
    const sorted = [...data].sort((a, b) => b.overallScore - a.overallScore);
    return { top: sorted.slice(0, 5), bottom: sorted.slice(-5).reverse() };
  }, [data]);

  if (!data.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>No data available. Run "Analyze All" first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Section Completion Rates */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Section Completion Rates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sectionCompletion.map(s => (
              <div key={s.section} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">{s.section}</span>
                  <span className="text-muted-foreground">
                    {s.complete}/{s.total} complete · Avg {s.avgScore}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={s.avgScore} className="h-2 flex-1" />
                  <span className={cn(
                    'text-xs font-bold w-10 text-right',
                    s.avgScore >= 80 ? 'text-green-600' : s.avgScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                  )}>
                    {s.avgScore}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Gap Frequency Chart */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Most Common Gaps
            </CardTitle>
          </CardHeader>
          <CardContent>
            {gapFrequency.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={gapFrequency} layout="vertical" margin={{ top: 0, right: 10, bottom: 0, left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis dataKey="section" type="category" tick={{ fontSize: 10 }} width={75} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} name="Entities Missing">
                    {gapFrequency.map((entry, i) => (
                      <Cell key={i} fill={entry.critical > 0 ? 'hsl(0, 84%, 60%)' : 'hsl(48, 96%, 53%)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">
                <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                No gaps detected
              </div>
            )}
          </CardContent>
        </Card>

        {/* Content Freshness */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              Content Freshness
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={freshnessGroups} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="label" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} name="Entities">
                  {freshnessGroups.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {ranked.top.map((e, i) => (
                <div key={e.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground w-4">#{i + 1}</span>
                    <div>
                      <p className="text-sm font-medium">{e.name}</p>
                      <Badge variant="outline" className="text-[9px] capitalize">{e.entityType}</Badge>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-green-600">{e.overallScore}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Needs Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {ranked.bottom.map((e, i) => (
                <div key={e.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground w-4">#{data.length - i}</span>
                    <div>
                      <p className="text-sm font-medium">{e.name}</p>
                      <Badge variant="outline" className="text-[9px] capitalize">{e.entityType}</Badge>
                    </div>
                  </div>
                  <span className={cn(
                    'text-sm font-bold',
                    e.overallScore < 40 ? 'text-red-600' : 'text-yellow-600'
                  )}>
                    {e.overallScore}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
