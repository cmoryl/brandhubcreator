/**
 * SocialMetricsComparison - Compare social metrics across platforms
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SocialMetricsSnapshot } from '@/types/socialMetrics';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  Cell
} from 'recharts';
import { ChartContainer, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Users, TrendingUp, Heart, MessageCircle, Eye, Share2, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SocialMetricsComparisonProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  snapshots: SocialMetricsSnapshot[];
}

const platformColors: Record<string, string> = {
  'LinkedIn': '#0A66C2',
  'X (Twitter)': '#000000',
  'Instagram': '#E4405F',
  'Facebook': '#1877F2',
  'YouTube': '#FF0000',
  'TikTok': '#000000',
  'Pinterest': '#BD081C',
  'GitHub': '#181717',
  'Dribbble': '#EA4C89',
  'Behance': '#1769FF',
  'Threads': '#000000'
};

const chartConfig: ChartConfig = {
  followers: { label: 'Followers', color: 'hsl(var(--primary))' },
  engagement: { label: 'Engagement Rate', color: 'hsl(var(--accent))' },
  growth: { label: 'Growth %', color: 'hsl(142 76% 36%)' },
  sentiment: { label: 'Sentiment', color: 'hsl(262 83% 58%)' },
};

export const SocialMetricsComparison = ({
  open,
  onOpenChange,
  snapshots
}: SocialMetricsComparisonProps) => {
  const [activeTab, setActiveTab] = useState('overview');

  // Prepare data for bar chart
  const barChartData = snapshots.map(s => ({
    platform: s.platform.replace(' (Twitter)', ''),
    followers: s.followers_count,
    engagement: s.engagement_rate,
    growth: s.follower_growth_percent,
    color: platformColors[s.platform] || '#6366f1'
  }));

  // Prepare data for radar chart (normalized 0-100)
  const maxFollowers = Math.max(...snapshots.map(s => s.followers_count), 1);
  const maxReach = Math.max(...snapshots.map(s => s.reach_count), 1);
  const maxMentions = Math.max(...snapshots.map(s => s.brand_mentions_count), 1);

  const radarData = [
    { metric: 'Followers', ...Object.fromEntries(snapshots.map(s => [s.platform, (s.followers_count / maxFollowers) * 100])) },
    { metric: 'Engagement', ...Object.fromEntries(snapshots.map(s => [s.platform, Math.min(s.engagement_rate * 10, 100)])) },
    { metric: 'Growth', ...Object.fromEntries(snapshots.map(s => [s.platform, Math.min(Math.max(s.follower_growth_percent + 50, 0), 100)])) },
    { metric: 'Reach', ...Object.fromEntries(snapshots.map(s => [s.platform, (s.reach_count / maxReach) * 100])) },
    { metric: 'Sentiment', ...Object.fromEntries(snapshots.map(s => [s.platform, (s.sentiment_score + 100) / 2])) },
    { metric: 'Mentions', ...Object.fromEntries(snapshots.map(s => [s.platform, (s.brand_mentions_count / maxMentions) * 100])) },
  ];

  // Calculate totals and rankings
  const rankings = {
    followers: [...snapshots].sort((a, b) => b.followers_count - a.followers_count),
    engagement: [...snapshots].sort((a, b) => b.engagement_rate - a.engagement_rate),
    growth: [...snapshots].sort((a, b) => b.follower_growth_percent - a.follower_growth_percent),
    sentiment: [...snapshots].sort((a, b) => b.sentiment_score - a.sentiment_score),
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getGrowthIndicator = (growth: number) => {
    if (growth > 0) return <ArrowUpRight className="h-3.5 w-3.5 text-green-500" />;
    if (growth < 0) return <ArrowDownRight className="h-3.5 w-3.5 text-red-500" />;
    return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
  };

  if (snapshots.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Platform Comparison</DialogTitle>
          </DialogHeader>
          <div className="py-12 text-center text-muted-foreground">
            <p>No metrics data available for comparison.</p>
            <p className="text-sm mt-2">Add metrics to your social profiles to see comparisons.</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Platform Performance Comparison
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
            <TabsTrigger value="growth">Growth</TabsTrigger>
            <TabsTrigger value="radar">Radar View</TabsTrigger>
          </TabsList>

          {/* Overview Tab - Side by side comparison table */}
          <TabsContent value="overview" className="mt-4 space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Platform</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">
                      <div className="flex items-center justify-end gap-1">
                        <Users className="h-3.5 w-3.5" /> Followers
                      </div>
                    </th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">
                      <div className="flex items-center justify-end gap-1">
                        <Heart className="h-3.5 w-3.5" /> Engagement
                      </div>
                    </th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">
                      <div className="flex items-center justify-end gap-1">
                        <TrendingUp className="h-3.5 w-3.5" /> Growth
                      </div>
                    </th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">
                      <div className="flex items-center justify-end gap-1">
                        <Eye className="h-3.5 w-3.5" /> Reach
                      </div>
                    </th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">
                      <div className="flex items-center justify-end gap-1">
                        <MessageCircle className="h-3.5 w-3.5" /> Sentiment
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {snapshots.map((s, idx) => (
                    <tr 
                      key={s.id} 
                      className={cn(
                        "border-b border-border/50 hover:bg-muted/50 transition-colors",
                        idx === 0 && "bg-primary/5"
                      )}
                    >
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold"
                            style={{ backgroundColor: platformColors[s.platform] || '#6366f1' }}
                          >
                            {s.platform.charAt(0)}
                          </div>
                          <span className="font-medium text-sm">{s.platform}</span>
                        </div>
                      </td>
                      <td className="text-right py-3 px-2 font-mono text-sm">
                        {formatNumber(s.followers_count)}
                      </td>
                      <td className="text-right py-3 px-2 font-mono text-sm">
                        {s.engagement_rate.toFixed(2)}%
                      </td>
                      <td className="text-right py-3 px-2">
                        <div className="flex items-center justify-end gap-1 font-mono text-sm">
                          {getGrowthIndicator(s.follower_growth_percent)}
                          <span className={cn(
                            s.follower_growth_percent > 0 && "text-green-600",
                            s.follower_growth_percent < 0 && "text-red-600"
                          )}>
                            {s.follower_growth_percent > 0 ? '+' : ''}{s.follower_growth_percent.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="text-right py-3 px-2 font-mono text-sm">
                        {formatNumber(s.reach_count)}
                      </td>
                      <td className="text-right py-3 px-2">
                        <div className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                          s.sentiment_score > 20 && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                          s.sentiment_score < -20 && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                          s.sentiment_score >= -20 && s.sentiment_score <= 20 && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                        )}>
                          {s.sentiment_score > 20 ? 'Positive' : s.sentiment_score < -20 ? 'Negative' : 'Neutral'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Quick Rankings */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
              <div className="bg-card rounded-lg border p-3">
                <p className="text-xs text-muted-foreground mb-1">Top by Followers</p>
                <p className="font-semibold text-sm flex items-center gap-1.5">
                  <span 
                    className="w-4 h-4 rounded text-white text-[10px] font-bold flex items-center justify-center"
                    style={{ backgroundColor: platformColors[rankings.followers[0]?.platform] }}
                  >
                    {rankings.followers[0]?.platform.charAt(0)}
                  </span>
                  {rankings.followers[0]?.platform}
                </p>
              </div>
              <div className="bg-card rounded-lg border p-3">
                <p className="text-xs text-muted-foreground mb-1">Top by Engagement</p>
                <p className="font-semibold text-sm flex items-center gap-1.5">
                  <span 
                    className="w-4 h-4 rounded text-white text-[10px] font-bold flex items-center justify-center"
                    style={{ backgroundColor: platformColors[rankings.engagement[0]?.platform] }}
                  >
                    {rankings.engagement[0]?.platform.charAt(0)}
                  </span>
                  {rankings.engagement[0]?.platform}
                </p>
              </div>
              <div className="bg-card rounded-lg border p-3">
                <p className="text-xs text-muted-foreground mb-1">Fastest Growing</p>
                <p className="font-semibold text-sm flex items-center gap-1.5">
                  <span 
                    className="w-4 h-4 rounded text-white text-[10px] font-bold flex items-center justify-center"
                    style={{ backgroundColor: platformColors[rankings.growth[0]?.platform] }}
                  >
                    {rankings.growth[0]?.platform.charAt(0)}
                  </span>
                  {rankings.growth[0]?.platform}
                </p>
              </div>
              <div className="bg-card rounded-lg border p-3">
                <p className="text-xs text-muted-foreground mb-1">Best Sentiment</p>
                <p className="font-semibold text-sm flex items-center gap-1.5">
                  <span 
                    className="w-4 h-4 rounded text-white text-[10px] font-bold flex items-center justify-center"
                    style={{ backgroundColor: platformColors[rankings.sentiment[0]?.platform] }}
                  >
                    {rankings.sentiment[0]?.platform.charAt(0)}
                  </span>
                  {rankings.sentiment[0]?.platform}
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Engagement Tab - Bar Chart */}
          <TabsContent value="engagement" className="mt-4">
            <ChartContainer config={chartConfig} className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="platform" 
                    angle={-45} 
                    textAnchor="end" 
                    height={60}
                    tick={{ fontSize: 12 }}
                    className="fill-muted-foreground"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    className="fill-muted-foreground"
                    label={{ value: 'Engagement Rate (%)', angle: -90, position: 'insideLeft', fontSize: 12 }}
                  />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="engagement" name="Engagement Rate %" radius={[4, 4, 0, 0]}>
                    {barChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </TabsContent>

          {/* Growth Tab - Bar Chart */}
          <TabsContent value="growth" className="mt-4">
            <ChartContainer config={chartConfig} className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="platform" 
                    angle={-45} 
                    textAnchor="end" 
                    height={60}
                    tick={{ fontSize: 12 }}
                    className="fill-muted-foreground"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    className="fill-muted-foreground"
                    label={{ value: 'Growth Rate (%)', angle: -90, position: 'insideLeft', fontSize: 12 }}
                  />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="growth" name="Growth %" radius={[4, 4, 0, 0]}>
                    {barChartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.growth >= 0 ? 'hsl(142 76% 36%)' : 'hsl(0 84% 60%)'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </TabsContent>

          {/* Radar Tab - Multi-dimensional comparison */}
          <TabsContent value="radar" className="mt-4">
            <ChartContainer config={chartConfig} className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                  <PolarGrid className="stroke-muted" />
                  <PolarAngleAxis 
                    dataKey="metric" 
                    tick={{ fontSize: 11 }}
                    className="fill-muted-foreground"
                  />
                  <PolarRadiusAxis 
                    angle={30} 
                    domain={[0, 100]} 
                    tick={{ fontSize: 10 }}
                    className="fill-muted-foreground"
                  />
                  {snapshots.map((s) => (
                    <Radar
                      key={s.platform}
                      name={s.platform}
                      dataKey={s.platform}
                      stroke={platformColors[s.platform] || '#6366f1'}
                      fill={platformColors[s.platform] || '#6366f1'}
                      fillOpacity={0.15}
                      strokeWidth={2}
                    />
                  ))}
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </ChartContainer>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Values normalized to 0-100 scale for comparison
            </p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
