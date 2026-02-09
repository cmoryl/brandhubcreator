/**
 * SocialMetricsTrendChart - Visualizes social metrics trends over time
 */

import { useMemo, useState } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { SocialMetricsTrend } from '@/types/socialMetrics';
import { ChartContainer, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, TrendingUp, Heart, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SocialMetricsTrendChartProps {
  trends: SocialMetricsTrend[];
  isLoading?: boolean;
  onPlatformChange?: (platform: string | undefined) => void;
  onMonthsChange?: (months: number) => void;
}

type MetricType = 'followers' | 'engagement' | 'growth' | 'sentiment';

const PLATFORM_COLORS: Record<string, string> = {
  instagram: 'hsl(330, 70%, 50%)',
  facebook: 'hsl(220, 70%, 50%)',
  twitter: 'hsl(200, 80%, 50%)',
  linkedin: 'hsl(210, 80%, 40%)',
  tiktok: 'hsl(0, 0%, 20%)',
  youtube: 'hsl(0, 70%, 50%)',
  pinterest: 'hsl(0, 70%, 45%)',
  default: 'hsl(var(--primary))'
};

const getPlatformColor = (platform: string): string => {
  return PLATFORM_COLORS[platform.toLowerCase()] || PLATFORM_COLORS.default;
};

export const SocialMetricsTrendChart = ({ 
  trends, 
  isLoading,
  onPlatformChange,
  onMonthsChange 
}: SocialMetricsTrendChartProps) => {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('followers');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('6');

  // Get unique platforms from trends
  const platforms = useMemo(() => {
    const uniquePlatforms = [...new Set(trends.map(t => t.platform))];
    return uniquePlatforms.sort();
  }, [trends]);

  // Process data for charts
  const chartData = useMemo(() => {
    const filteredTrends = selectedPlatform === 'all' 
      ? trends 
      : trends.filter(t => t.platform === selectedPlatform);

    // Group by date and aggregate or keep platform-specific
    const dateMap = new Map<string, Record<string, number>>();
    
    filteredTrends.forEach(trend => {
      const dateKey = trend.snapshot_date;
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, {});
      }
      const entry = dateMap.get(dateKey)!;
      
      // Store by platform for multi-line charts
      entry[`followers_${trend.platform}`] = trend.followers_count;
      entry[`engagement_${trend.platform}`] = trend.engagement_rate;
      entry[`growth_${trend.platform}`] = trend.follower_growth_percent;
      entry[`sentiment_${trend.platform}`] = trend.sentiment_score;
      entry[`mentions_${trend.platform}`] = trend.brand_mentions_count;
      
      // Aggregate totals
      entry.followers_total = (entry.followers_total || 0) + trend.followers_count;
      entry.engagement_avg = trend.engagement_rate; // Will be overwritten, but for single platform
      entry.growth_avg = trend.follower_growth_percent;
      entry.sentiment_avg = trend.sentiment_score;
      entry.mentions_total = (entry.mentions_total || 0) + trend.brand_mentions_count;
    });

    return Array.from(dateMap.entries())
      .map(([date, data]) => ({
        date,
        formattedDate: format(parseISO(date), 'MMM d'),
        ...data
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [trends, selectedPlatform]);

  // Chart configuration
  const chartConfig: ChartConfig = useMemo(() => {
    const config: ChartConfig = {};
    platforms.forEach(platform => {
      config[platform] = {
        label: platform.charAt(0).toUpperCase() + platform.slice(1),
        color: getPlatformColor(platform)
      };
    });
    return config;
  }, [platforms]);

  // Handle platform change
  const handlePlatformChange = (value: string) => {
    setSelectedPlatform(value);
    onPlatformChange?.(value === 'all' ? undefined : value);
  };

  // Handle time range change
  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value);
    onMonthsChange?.(parseInt(value));
  };

  const metricTabs = [
    { id: 'followers', label: 'Followers', icon: Users },
    { id: 'engagement', label: 'Engagement', icon: Heart },
    { id: 'growth', label: 'Growth', icon: TrendingUp },
    { id: 'sentiment', label: 'Sentiment', icon: MessageCircle }
  ];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted/50 rounded w-48 animate-pulse" />
        <div className="h-[300px] bg-muted/50 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (trends.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] bg-muted/30 rounded-lg border border-dashed border-border">
        <TrendingUp className="h-10 w-10 text-muted-foreground mb-3" />
        <p className="text-muted-foreground text-sm">No trend data available yet</p>
        <p className="text-muted-foreground text-xs mt-1">Add metrics over time to see trends</p>
      </div>
    );
  }

  const renderChart = () => {
    const getDataKey = (platform: string) => {
      switch (selectedMetric) {
        case 'followers': return `followers_${platform}`;
        case 'engagement': return `engagement_${platform}`;
        case 'growth': return `growth_${platform}`;
        case 'sentiment': return `sentiment_${platform}`;
        default: return `followers_${platform}`;
      }
    };

    const getAggregateKey = () => {
      switch (selectedMetric) {
        case 'followers': return 'followers_total';
        case 'engagement': return 'engagement_avg';
        case 'growth': return 'growth_avg';
        case 'sentiment': return 'sentiment_avg';
        default: return 'followers_total';
      }
    };

    const formatYAxis = (value: number) => {
      if (selectedMetric === 'followers') {
        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
        return value.toString();
      }
      if (selectedMetric === 'engagement' || selectedMetric === 'growth') {
        return `${value.toFixed(1)}%`;
      }
      return value.toString();
    };

    const formatTooltipValue = (value: number) => {
      if (selectedMetric === 'followers') {
        return value.toLocaleString();
      }
      if (selectedMetric === 'engagement' || selectedMetric === 'growth') {
        return `${value.toFixed(2)}%`;
      }
      if (selectedMetric === 'sentiment') {
        return value > 0 ? `+${value}` : value.toString();
      }
      return value.toString();
    };

    if (selectedPlatform === 'all' && platforms.length > 1) {
      // Multi-line chart for all platforms
      return (
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
            <XAxis 
              dataKey="formattedDate" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              tickFormatter={formatYAxis}
            />
            <Tooltip 
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                    <p className="font-medium text-foreground mb-2">{label}</p>
                    {payload.map((entry, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-muted-foreground capitalize">
                          {entry.dataKey?.toString().split('_')[1]}:
                        </span>
                        <span className="font-medium">
                          {formatTooltipValue(entry.value as number)}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              }}
            />
            <Legend 
              formatter={(value) => {
                const platform = value.split('_')[1];
                return platform.charAt(0).toUpperCase() + platform.slice(1);
              }}
            />
            {platforms.map(platform => (
              <Line
                key={platform}
                type="monotone"
                dataKey={getDataKey(platform)}
                stroke={getPlatformColor(platform)}
                strokeWidth={2}
                dot={{ fill: getPlatformColor(platform), strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            ))}
          </LineChart>
        </ChartContainer>
      );
    }

    // Single platform or aggregated area chart
    return (
      <ChartContainer config={chartConfig} className="h-[300px] w-full">
        <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <defs>
            <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
          <XAxis 
            dataKey="formattedDate" 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            tickFormatter={formatYAxis}
          />
          <Tooltip 
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const value = payload[0].value as number;
              return (
                <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                  <p className="font-medium text-foreground">{label}</p>
                  <p className="text-primary font-semibold mt-1">
                    {formatTooltipValue(value)}
                  </p>
                </div>
              );
            }}
          />
          <Area
            type="monotone"
            dataKey={selectedPlatform === 'all' ? getAggregateKey() : getDataKey(selectedPlatform)}
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fill="url(#colorMetric)"
          />
        </AreaChart>
      </ChartContainer>
    );
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <Tabs 
          value={selectedMetric} 
          onValueChange={(v) => setSelectedMetric(v as MetricType)}
          className="w-full sm:w-auto"
        >
          <TabsList className="grid grid-cols-4 w-full sm:w-auto">
            {metricTabs.map(tab => (
              <TabsTrigger 
                key={tab.id} 
                value={tab.id}
                className="gap-1.5 text-xs sm:text-sm"
              >
                <tab.icon className="h-3.5 w-3.5 hidden sm:block" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex gap-2">
          <Select value={selectedPlatform} onValueChange={handlePlatformChange}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              {platforms.map(platform => (
                <SelectItem key={platform} value={platform}>
                  {platform.charAt(0).toUpperCase() + platform.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={timeRange} onValueChange={handleTimeRangeChange}>
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3 months</SelectItem>
              <SelectItem value="6">6 months</SelectItem>
              <SelectItem value="12">12 months</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-card border border-border rounded-lg p-4">
        {renderChart()}
      </div>

      {/* Platform Legend (for single metric view) */}
      {selectedPlatform === 'all' && platforms.length > 1 && (
        <div className="flex flex-wrap gap-3 justify-center">
          {platforms.map(platform => (
            <div key={platform} className="flex items-center gap-1.5">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: getPlatformColor(platform) }}
              />
              <span className="text-xs text-muted-foreground capitalize">{platform}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
