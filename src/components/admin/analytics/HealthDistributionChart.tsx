/**
 * HealthDistributionChart - Visualizes score distribution and category breakdowns
 */

import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar, Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface BrandHealthData {
  id: string;
  name: string;
  entityType: 'brand' | 'product' | 'event';
  overallScore: number;
  scores: {
    identity: number;
    visual: number;
    content: number;
    assets: number;
    consistency: number;
  };
}

interface HealthDistributionChartProps {
  data: BrandHealthData[];
}

const BUCKET_LABELS = ['0-19', '20-39', '40-59', '60-79', '80-100'];
const BUCKET_COLORS = ['hsl(0, 84%, 60%)', 'hsl(25, 95%, 53%)', 'hsl(48, 96%, 53%)', 'hsl(84, 81%, 44%)', 'hsl(142, 76%, 36%)'];

const PIE_COLORS = ['hsl(217, 91%, 60%)', 'hsl(263, 70%, 50%)', 'hsl(173, 80%, 40%)'];

export function HealthDistributionChart({ data }: HealthDistributionChartProps) {
  // Score distribution histogram
  const distribution = useMemo(() => {
    const buckets = [0, 0, 0, 0, 0];
    data.forEach(d => {
      const idx = Math.min(Math.floor(d.overallScore / 20), 4);
      buckets[idx]++;
    });
    return BUCKET_LABELS.map((label, i) => ({
      range: label,
      count: buckets[i],
      fill: BUCKET_COLORS[i],
    }));
  }, [data]);

  // Category averages for radar
  const categoryAvg = useMemo(() => {
    if (!data.length) return [];
    const cats = ['identity', 'visual', 'content', 'assets', 'consistency'] as const;
    return cats.map(cat => ({
      category: cat.charAt(0).toUpperCase() + cat.slice(1),
      brands: Math.round(
        data.filter(d => d.entityType === 'brand').reduce((s, d) => s + d.scores[cat], 0) /
        Math.max(data.filter(d => d.entityType === 'brand').length, 1)
      ),
      products: Math.round(
        data.filter(d => d.entityType === 'product').reduce((s, d) => s + d.scores[cat], 0) /
        Math.max(data.filter(d => d.entityType === 'product').length, 1)
      ),
      events: Math.round(
        data.filter(d => d.entityType === 'event').reduce((s, d) => s + d.scores[cat], 0) /
        Math.max(data.filter(d => d.entityType === 'event').length, 1)
      ),
    }));
  }, [data]);

  // Entity type breakdown
  const typeBreakdown = useMemo(() => {
    const types = ['brand', 'product', 'event'] as const;
    return types.map((t, i) => ({
      name: t.charAt(0).toUpperCase() + t.slice(1) + 's',
      value: data.filter(d => d.entityType === t).length,
      fill: PIE_COLORS[i],
    })).filter(d => d.value > 0);
  }, [data]);

  if (!data.length) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Score Distribution */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            Score Distribution
            <Badge variant="secondary" className="text-[10px]">{data.length} entities</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={distribution} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="range" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))' }}
                labelFormatter={(v) => `Score: ${v}%`}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {distribution.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Category Radar */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Category Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={180}>
            <RadarChart data={categoryAvg} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
              <PolarGrid strokeOpacity={0.15} />
              <PolarAngleAxis dataKey="category" tick={{ fontSize: 9 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              <Radar name="Brands" dataKey="brands" stroke={PIE_COLORS[0]} fill={PIE_COLORS[0]} fillOpacity={0.15} strokeWidth={1.5} />
              <Radar name="Products" dataKey="products" stroke={PIE_COLORS[1]} fill={PIE_COLORS[1]} fillOpacity={0.1} strokeWidth={1.5} />
              <Radar name="Events" dataKey="events" stroke={PIE_COLORS[2]} fill={PIE_COLORS[2]} fillOpacity={0.1} strokeWidth={1.5} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Entity Type Breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Entity Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={typeBreakdown}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={65}
                dataKey="value"
                paddingAngle={3}
                label={({ name, value }) => `${name}: ${value}`}
                labelLine={false}
              >
                {typeBreakdown.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
