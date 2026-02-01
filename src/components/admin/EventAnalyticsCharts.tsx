import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  RadialBarChart,
  RadialBar,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { CalendarDays, Users, Mic2, TrendingUp, PieChart as PieChartIcon, BarChart3 } from 'lucide-react';

interface EventData {
  id: string;
  name: string;
  created_at: string;
  event_name: string;
  event_type: string;
  speakers_count: number;
  sponsors_count: number;
  expected_attendees: number;
  event_status: 'upcoming' | 'past' | 'unknown';
  completeness_score: number;
  has_schedule: boolean;
  videos_count: number;
  signage_count: number;
  banners_count: number;
}

interface SponsorTierData {
  tier: string;
  count: number;
}

interface EventAnalyticsChartsProps {
  events: EventData[];
  sponsorTiers?: SponsorTierData[];
}

// Color palette for charts
const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2, 173 58% 39%))',
  'hsl(var(--chart-3, 197 37% 24%))',
  'hsl(var(--chart-4, 43 74% 66%))',
  'hsl(var(--chart-5, 27 87% 67%))',
  'hsl(var(--accent))',
];

const PIE_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export function EventAnalyticsCharts({ events, sponsorTiers }: EventAnalyticsChartsProps) {
  // Calculate events by month
  const eventsByMonth = useMemo(() => {
    const monthCounts = new Map<string, number>();
    
    events.forEach(event => {
      const date = parseISO(event.created_at);
      const monthKey = format(date, 'MMM yyyy');
      monthCounts.set(monthKey, (monthCounts.get(monthKey) || 0) + 1);
    });

    // Sort by date and take last 12 months
    return Array.from(monthCounts.entries())
      .map(([month, count]) => ({ month, count }))
      .slice(-12);
  }, [events]);

  // Calculate events by type
  const eventsByType = useMemo(() => {
    const typeCounts = new Map<string, number>();
    
    events.forEach(event => {
      const type = event.event_type || 'other';
      typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
    });

    const typeLabels: Record<string, string> = {
      conference: 'Conference',
      'trade-show': 'Trade Show',
      summit: 'Summit',
      webinar: 'Webinar',
      workshop: 'Workshop',
      launch: 'Launch',
      other: 'Other',
    };

    return Array.from(typeCounts.entries())
      .map(([type, count]) => ({ 
        name: typeLabels[type] || type, 
        value: count,
        type 
      }))
      .sort((a, b) => b.value - a.value);
  }, [events]);

  // Calculate speaker distribution
  const speakerDistribution = useMemo(() => {
    const ranges = [
      { label: '0', min: 0, max: 0 },
      { label: '1-5', min: 1, max: 5 },
      { label: '6-10', min: 6, max: 10 },
      { label: '11-20', min: 11, max: 20 },
      { label: '21-50', min: 21, max: 50 },
      { label: '50+', min: 51, max: Infinity },
    ];

    return ranges.map(range => ({
      range: range.label,
      count: events.filter(e => e.speakers_count >= range.min && e.speakers_count <= range.max).length,
    })).filter(r => r.count > 0);
  }, [events]);

  // Calculate sponsor tier distribution from the raw event data
  const sponsorTierDistribution = useMemo(() => {
    if (sponsorTiers && sponsorTiers.length > 0) {
      return sponsorTiers;
    }
    
    // If no sponsor tier data passed, calculate from events
    const tierCounts = new Map<string, number>();
    const tierLabels: Record<string, string> = {
      platinum: 'Platinum',
      gold: 'Gold',
      silver: 'Silver',
      bronze: 'Bronze',
      partner: 'Partner',
      media: 'Media',
      other: 'Other',
    };
    
    // Default tiers with 0 counts
    ['platinum', 'gold', 'silver', 'bronze', 'partner'].forEach(tier => {
      tierCounts.set(tier, 0);
    });

    return Array.from(tierCounts.entries())
      .map(([tier, count]) => ({ 
        tier: tierLabels[tier] || tier, 
        count 
      }));
  }, [sponsorTiers]);

  // Calculate event status breakdown
  const eventStatusData = useMemo(() => {
    const statusCounts = {
      upcoming: events.filter(e => e.event_status === 'upcoming').length,
      past: events.filter(e => e.event_status === 'past').length,
      unknown: events.filter(e => e.event_status === 'unknown').length,
    };

    return [
      { name: 'Upcoming', value: statusCounts.upcoming, fill: '#22c55e' },
      { name: 'Past', value: statusCounts.past, fill: '#6366f1' },
      { name: 'Unknown', value: statusCounts.unknown, fill: '#94a3b8' },
    ].filter(s => s.value > 0);
  }, [events]);

  // Calculate completeness distribution
  const completenessDistribution = useMemo(() => {
    const ranges = [
      { label: '0-25%', min: 0, max: 25, fill: '#ef4444' },
      { label: '26-50%', min: 26, max: 50, fill: '#f59e0b' },
      { label: '51-75%', min: 51, max: 75, fill: '#22c55e' },
      { label: '76-100%', min: 76, max: 100, fill: '#6366f1' },
    ];

    return ranges.map(range => ({
      range: range.label,
      count: events.filter(e => e.completeness_score >= range.min && e.completeness_score <= range.max).length,
      fill: range.fill,
    }));
  }, [events]);

  // Calculate materials distribution
  const materialsData = useMemo(() => {
    const totalSignage = events.reduce((sum, e) => sum + (e.signage_count || 0), 0);
    const totalBanners = events.reduce((sum, e) => sum + (e.banners_count || 0), 0);
    const totalVideos = events.reduce((sum, e) => sum + (e.videos_count || 0), 0);
    const eventsWithSchedule = events.filter(e => e.has_schedule).length;

    return [
      { name: 'Signage', value: totalSignage },
      { name: 'Banners', value: totalBanners },
      { name: 'Videos', value: totalVideos },
      { name: 'Schedules', value: eventsWithSchedule },
    ];
  }, [events]);

  // Calculate expected attendees trend
  const attendeesTrend = useMemo(() => {
    return events
      .filter(e => e.expected_attendees > 0)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .slice(-10)
      .map(e => ({
        name: e.event_name?.substring(0, 15) || 'Event',
        attendees: e.expected_attendees,
      }));
  }, [events]);

  if (events.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Summary Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <CalendarDays className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{events.length}</p>
              <p className="text-xs text-muted-foreground">Total Events</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{events.filter(e => e.event_status === 'upcoming').length}</p>
              <p className="text-xs text-muted-foreground">Upcoming</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Mic2 className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{events.reduce((sum, e) => sum + e.speakers_count, 0)}</p>
              <p className="text-xs text-muted-foreground">Total Speakers</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <Users className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{events.reduce((sum, e) => sum + e.sponsors_count, 0)}</p>
              <p className="text-xs text-muted-foreground">Total Sponsors</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1: Events by Month + Events by Type */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Events by Month */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Events by Month
            </CardTitle>
            <CardDescription>Event creation trend over time</CardDescription>
          </CardHeader>
          <CardContent>
            {eventsByMonth.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={eventsByMonth}>
                  <defs>
                    <linearGradient id="eventGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 11 }} 
                    className="text-muted-foreground"
                  />
                  <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="hsl(var(--primary))" 
                    fill="url(#eventGradient)"
                    strokeWidth={2}
                    name="Events"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Events by Type */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <PieChartIcon className="h-4 w-4" />
              Events by Type
            </CardTitle>
            <CardDescription>Distribution of event categories</CardDescription>
          </CardHeader>
          <CardContent>
            {eventsByType.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={eventsByType}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                  >
                    {eventsByType.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2: Speaker Distribution + Event Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Speaker Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Mic2 className="h-4 w-4" />
              Speaker Distribution
            </CardTitle>
            <CardDescription>Number of speakers per event</CardDescription>
          </CardHeader>
          <CardContent>
            {speakerDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={speakerDistribution}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="range" 
                    tick={{ fontSize: 11 }} 
                    className="text-muted-foreground"
                  />
                  <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                    name="Events"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Event Status Breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Event Status
            </CardTitle>
            <CardDescription>Upcoming vs. past events</CardDescription>
          </CardHeader>
          <CardContent>
            {eventStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={eventStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {eventStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 3: Completeness Distribution + Materials */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Completeness Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Completeness Distribution
            </CardTitle>
            <CardDescription>Event guide completeness levels</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={completenessDistribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <YAxis 
                  dataKey="range" 
                  type="category" 
                  tick={{ fontSize: 11 }} 
                  className="text-muted-foreground"
                  width={60}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
                <Bar 
                  dataKey="count" 
                  radius={[0, 4, 4, 0]}
                  name="Events"
                >
                  {completenessDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Materials Overview */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Event Materials
            </CardTitle>
            <CardDescription>Total materials across all events</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={materialsData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 11 }} 
                  className="text-muted-foreground"
                />
                <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
                <Bar 
                  dataKey="value" 
                  radius={[4, 4, 0, 0]}
                  name="Count"
                >
                  {materialsData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Expected Attendees Trend */}
      {attendeesTrend.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Expected Attendees by Event
            </CardTitle>
            <CardDescription>Comparison of expected attendance across recent events</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={attendeesTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 10 }} 
                  className="text-muted-foreground"
                  angle={-20}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
                <Bar 
                  dataKey="attendees" 
                  fill="#22c55e"
                  radius={[4, 4, 0, 0]}
                  name="Expected Attendees"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
