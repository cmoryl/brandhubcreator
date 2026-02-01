import { useState } from 'react';
import { CalendarDays, Download, Loader2, Calendar, Filter, BarChart3, AlertTriangle, Clock, MapPin, Users, Video, Mic2, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, subDays, subMonths, isPast, isFuture, parseISO } from 'date-fns';
import { EventCustomPromptRunner } from './EventCustomPromptRunner';
import { EventAnalyticsCharts } from './EventAnalyticsCharts';

interface EventReportData {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  is_public: boolean;
  organization_id: string | null;
  parent_brand_id: string | null;
  parent_brand_name: string | null;
  // Event-specific fields
  event_name: string;
  event_dates: string;
  event_type: string;
  location: string;
  venue: string;
  expected_attendees: number;
  has_schedule: boolean;
  speakers_count: number;
  sponsors_count: number;
  signage_count: number;
  banners_count: number;
  digital_materials_count: number;
  videos_count: number;
  has_location_info: boolean;
  history_entries_count: number;
  // Calculated
  completeness_score: number;
  days_since_update: number;
  is_stale: boolean;
  missing_critical: string[];
  event_status: 'upcoming' | 'past' | 'unknown';
  is_orphan: boolean;
}

interface ReportSummary {
  totalEvents: number;
  publicEvents: number;
  avgCompleteness: number;
  upcomingEvents: number;
  pastEvents: number;
  eventsWithSchedules: number;
  totalSpeakers: number;
  totalSponsors: number;
  topBrands: { name: string; eventCount: number }[];
  eventsByType: { type: string; count: number }[];
  recentlyCreated: number;
  recentlyUpdated: number;
  staleEvents: number;
  needsAttention: number;
  orphanedEvents: number;
  missingLocations: number;
  missingSchedules: number;
  eventsWithVideos: number;
}

export function EventReportGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState<EventReportData[] | null>(null);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [dateRange, setDateRange] = useState('all');
  const [reportType, setReportType] = useState<'all' | 'public' | 'private'>('all');
  const [eventStatusFilter, setEventStatusFilter] = useState<'all' | 'upcoming' | 'past'>('all');

  const generateReport = async () => {
    setIsGenerating(true);
    try {
      let dateFilter = new Date();
      switch (dateRange) {
        case '7d':
          dateFilter = subDays(new Date(), 7);
          break;
        case '30d':
          dateFilter = subDays(new Date(), 30);
          break;
        case '90d':
          dateFilter = subDays(new Date(), 90);
          break;
        case '1y':
          dateFilter = subMonths(new Date(), 12);
          break;
        default:
          dateFilter = new Date(0);
      }

      let query = supabase
        .from('events')
        .select('id, name, created_at, updated_at, is_public, organization_id, parent_brand_id, guide_data')
        .gte('created_at', dateFilter.toISOString())
        .order('created_at', { ascending: false });

      if (reportType === 'public') {
        query = query.eq('is_public', true);
      } else if (reportType === 'private') {
        query = query.eq('is_public', false);
      }

      const { data: events, error } = await query;

      if (error) throw error;

      // Fetch parent brand names
      const brandIds = [...new Set((events || []).filter(e => e.parent_brand_id).map(e => e.parent_brand_id))];
      const { data: brands } = await supabase
        .from('brands')
        .select('id, name')
        .in('id', brandIds as string[]);

      const brandMap = new Map(brands?.map(b => [b.id, b.name]) || []);

      // Process event data
      const now = new Date();
      const thirtyDaysAgo = subDays(now, 30);
      
      const processedEvents: EventReportData[] = (events || []).map(event => {
        const guideData = event.guide_data as Record<string, unknown> || {};
        const hero = guideData.hero as Record<string, unknown> || {};
        const eventDetails = guideData.eventDetails as Record<string, unknown> || {};
        const eventLocation = guideData.eventLocation as Record<string, unknown> || {};
        const eventSchedule = (guideData.eventSchedule as unknown[]) || [];
        const eventSpeakers = (guideData.eventSpeakers as unknown[]) || [];
        const eventSponsors = (guideData.eventSponsors as unknown[]) || [];
        const eventSignage = (guideData.eventSignage as unknown[]) || [];
        const eventBanners = (guideData.eventBanners as unknown[]) || [];
        const eventDigitalMaterials = (guideData.eventDigitalMaterials as unknown[]) || [];
        const eventVideos = (guideData.eventVideos as unknown[]) || [];
        const eventHistory = (guideData.eventHistory as unknown[]) || [];
        const colors = (guideData.colors as unknown[]) || [];
        const logos = (guideData.logos as unknown[]) || [];
        const eventLogos = (guideData.eventLogos as unknown[]) || [];

        // Calculate completeness score for events
        let score = 0;
        if (hero.name || eventDetails.eventName) score += 10;
        if (eventDetails.eventDates) score += 10;
        if (eventDetails.location || eventLocation.venueName) score += 10;
        if (logos.length > 0 || eventLogos.length > 0) score += 10;
        if (colors.length > 0) score += 5;
        if (eventSchedule.length > 0) score += 15;
        if (eventSpeakers.length > 0) score += 10;
        if (eventSponsors.length > 0) score += 10;
        if (eventSignage.length > 0 || eventBanners.length > 0) score += 10;
        if (eventDigitalMaterials.length > 0) score += 5;
        if (eventLocation.address || eventLocation.googleMapsUrl) score += 5;

        // Calculate staleness
        const updatedAt = new Date(event.updated_at);
        const daysSinceUpdate = Math.floor((now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24));
        const isStale = updatedAt < thirtyDaysAgo;

        // Track missing critical sections
        const missingCritical: string[] = [];
        if (!eventDetails.eventDates) missingCritical.push('Dates');
        if (!eventDetails.location && !eventLocation.venueName) missingCritical.push('Location');
        if (eventSchedule.length === 0) missingCritical.push('Schedule');
        if (logos.length === 0 && eventLogos.length === 0) missingCritical.push('Logo');

        // Determine event status
        let eventStatus: 'upcoming' | 'past' | 'unknown' = 'unknown';
        const startDate = eventDetails.startDate as string | undefined;
        const endDate = eventDetails.endDate as string | undefined;
        
        if (endDate) {
          try {
            eventStatus = isPast(parseISO(endDate)) ? 'past' : 'upcoming';
          } catch {
            eventStatus = 'unknown';
          }
        } else if (startDate) {
          try {
            eventStatus = isPast(parseISO(startDate)) ? 'past' : 'upcoming';
          } catch {
            eventStatus = 'unknown';
          }
        }

        // Check if orphaned (no parent brand)
        const isOrphan = !event.parent_brand_id;

        return {
          id: event.id,
          name: event.name,
          created_at: event.created_at,
          updated_at: event.updated_at,
          is_public: event.is_public || false,
          organization_id: event.organization_id,
          parent_brand_id: event.parent_brand_id,
          parent_brand_name: event.parent_brand_id ? brandMap.get(event.parent_brand_id) || null : null,
          event_name: (eventDetails.eventName as string) || event.name,
          event_dates: (eventDetails.eventDates as string) || '',
          event_type: (eventDetails.eventType as string) || 'other',
          location: (eventDetails.location as string) || '',
          venue: (eventLocation.venueName as string) || (eventDetails.venue as string) || '',
          expected_attendees: (eventDetails.expectedAttendees as number) || 0,
          has_schedule: eventSchedule.length > 0,
          speakers_count: eventSpeakers.length,
          sponsors_count: eventSponsors.length,
          signage_count: eventSignage.length,
          banners_count: eventBanners.length,
          digital_materials_count: eventDigitalMaterials.length,
          videos_count: eventVideos.length,
          has_location_info: !!(eventLocation.address || eventLocation.googleMapsUrl),
          history_entries_count: eventHistory.length,
          completeness_score: score,
          days_since_update: daysSinceUpdate,
          is_stale: isStale,
          missing_critical: missingCritical,
          event_status: eventStatus,
          is_orphan: isOrphan,
        };
      });

      // Filter by event status if needed
      let filteredEvents = processedEvents;
      if (eventStatusFilter === 'upcoming') {
        filteredEvents = processedEvents.filter(e => e.event_status === 'upcoming');
      } else if (eventStatusFilter === 'past') {
        filteredEvents = processedEvents.filter(e => e.event_status === 'past');
      }

      // Calculate summary
      const weekAgo = subDays(new Date(), 7).toISOString();
      const recentlyCreated = filteredEvents.filter(e => e.created_at >= weekAgo).length;
      const recentlyUpdated = filteredEvents.filter(e => e.updated_at >= weekAgo).length;

      // Top brands by event count
      const brandCounts = new Map<string, number>();
      filteredEvents.forEach(e => {
        if (e.parent_brand_name) {
          brandCounts.set(e.parent_brand_name, (brandCounts.get(e.parent_brand_name) || 0) + 1);
        }
      });

      const topBrands = Array.from(brandCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, eventCount: count }));

      // Events by type
      const typeCounts = new Map<string, number>();
      filteredEvents.forEach(e => {
        const type = e.event_type || 'other';
        typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
      });

      const eventsByType = Array.from(typeCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([type, count]) => ({ type, count }));

      // Calculate health metrics
      const staleEvents = filteredEvents.filter(e => e.is_stale).length;
      const needsAttention = filteredEvents.filter(e => e.completeness_score < 50 || e.missing_critical.length >= 2).length;
      const orphanedEvents = filteredEvents.filter(e => e.is_orphan).length;
      const missingLocations = filteredEvents.filter(e => !e.location && !e.venue && !e.has_location_info).length;
      const missingSchedules = filteredEvents.filter(e => !e.has_schedule).length;
      const eventsWithVideos = filteredEvents.filter(e => e.videos_count > 0).length;

      // Total speakers and sponsors
      const totalSpeakers = filteredEvents.reduce((sum, e) => sum + e.speakers_count, 0);
      const totalSponsors = filteredEvents.reduce((sum, e) => sum + e.sponsors_count, 0);

      setSummary({
        totalEvents: filteredEvents.length,
        publicEvents: filteredEvents.filter(e => e.is_public).length,
        avgCompleteness: filteredEvents.length > 0 
          ? Math.round(filteredEvents.reduce((acc, e) => acc + e.completeness_score, 0) / filteredEvents.length)
          : 0,
        upcomingEvents: filteredEvents.filter(e => e.event_status === 'upcoming').length,
        pastEvents: filteredEvents.filter(e => e.event_status === 'past').length,
        eventsWithSchedules: filteredEvents.filter(e => e.has_schedule).length,
        totalSpeakers,
        totalSponsors,
        topBrands,
        eventsByType,
        recentlyCreated,
        recentlyUpdated,
        staleEvents,
        needsAttention,
        orphanedEvents,
        missingLocations,
        missingSchedules,
        eventsWithVideos,
      });

      setReportData(filteredEvents);
      toast.success('Event report generated successfully');
    } catch (error) {
      console.error('Error generating event report:', error);
      toast.error('Failed to generate event report');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadCSV = () => {
    if (!reportData) return;

    const headers = [
      'Event Name', 'Parent Brand', 'Event Dates', 'Event Type', 'Location', 'Venue',
      'Expected Attendees', 'Speakers', 'Sponsors', 'Has Schedule', 'Status',
      'Created', 'Updated', 'Public', 'Completeness Score'
    ];
    const rows = reportData.map(e => [
      e.event_name,
      e.parent_brand_name || 'None',
      e.event_dates,
      e.event_type,
      e.location,
      e.venue,
      e.expected_attendees.toString(),
      e.speakers_count.toString(),
      e.sponsors_count.toString(),
      e.has_schedule ? 'Yes' : 'No',
      e.event_status,
      format(new Date(e.created_at), 'yyyy-MM-dd'),
      format(new Date(e.updated_at), 'yyyy-MM-dd'),
      e.is_public ? 'Yes' : 'No',
      e.completeness_score.toString() + '%',
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.map(cell => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `event-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Event report downloaded');
  };

  const eventTypeLabels: Record<string, string> = {
    conference: 'Conference',
    'trade-show': 'Trade Show',
    summit: 'Summit',
    webinar: 'Webinar',
    workshop: 'Workshop',
    launch: 'Launch',
    other: 'Other',
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="reports" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="reports" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Reports & Data
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Analytics Charts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Event Reports
              </CardTitle>
              <CardDescription>Generate and download comprehensive event analytics reports with event-specific metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
          {/* Report Controls */}
          <div className="flex flex-wrap gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[140px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>

            <Select value={reportType} onValueChange={(v) => setReportType(v as 'all' | 'public' | 'private')}>
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="public">Public Only</SelectItem>
                <SelectItem value="private">Private Only</SelectItem>
              </SelectContent>
            </Select>

            <Select value={eventStatusFilter} onValueChange={(v) => setEventStatusFilter(v as 'all' | 'upcoming' | 'past')}>
              <SelectTrigger className="w-[140px]">
                <CalendarDays className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="past">Past Events</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={generateReport} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Generate Report
                </>
              )}
            </Button>

            {reportData && (
              <Button variant="outline" onClick={downloadCSV}>
                <Download className="h-4 w-4 mr-2" />
                Download CSV
              </Button>
            )}
          </div>

          {/* Summary Stats */}
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-2xl font-bold">{summary.totalEvents}</p>
                <p className="text-sm text-muted-foreground">Total Events</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-2xl font-bold text-green-600">{summary.upcomingEvents}</p>
                <p className="text-sm text-muted-foreground">Upcoming</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-2xl font-bold text-blue-600">{summary.pastEvents}</p>
                <p className="text-sm text-muted-foreground">Past Events</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-2xl font-bold">{summary.avgCompleteness}%</p>
                <p className="text-sm text-muted-foreground">Avg Completeness</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-2xl font-bold">{summary.totalSpeakers}</p>
                <p className="text-sm text-muted-foreground">Total Speakers</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-2xl font-bold">{summary.totalSponsors}</p>
                <p className="text-sm text-muted-foreground">Total Sponsors</p>
              </div>
            </div>
          )}

          {/* Event Type Breakdown */}
          {summary && summary.eventsByType.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Events by Type</h4>
              <div className="flex flex-wrap gap-2">
                {summary.eventsByType.map((item, i) => (
                  <Badge key={i} variant="outline" className="gap-1">
                    {eventTypeLabels[item.type] || item.type}: {item.count}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Health Alerts */}
          {summary && (summary.needsAttention > 0 || summary.staleEvents > 0 || summary.orphanedEvents > 0 || summary.missingSchedules > 0) && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200">Event Health Alerts</h4>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                {summary.needsAttention > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-amber-700 dark:text-amber-300 font-medium">{summary.needsAttention}</span>
                    <span className="text-muted-foreground">need attention</span>
                  </div>
                )}
                {summary.staleEvents > 0 && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-amber-600" />
                    <span className="text-amber-700 dark:text-amber-300 font-medium">{summary.staleEvents}</span>
                    <span className="text-muted-foreground">stale (30+ days)</span>
                  </div>
                )}
                {summary.orphanedEvents > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-amber-700 dark:text-amber-300 font-medium">{summary.orphanedEvents}</span>
                    <span className="text-muted-foreground">no parent brand</span>
                  </div>
                )}
                {summary.missingLocations > 0 && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-amber-600" />
                    <span className="text-amber-700 dark:text-amber-300 font-medium">{summary.missingLocations}</span>
                    <span className="text-muted-foreground">missing location</span>
                  </div>
                )}
                {summary.missingSchedules > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-amber-700 dark:text-amber-300 font-medium">{summary.missingSchedules}</span>
                    <span className="text-muted-foreground">no schedule</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recent Activity */}
          {summary && (
            <div className="flex gap-4 flex-wrap">
              <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                +{summary.recentlyCreated} created this week
              </Badge>
              <Badge variant="secondary" className="bg-blue-500/10 text-blue-600">
                {summary.recentlyUpdated} updated this week
              </Badge>
              <Badge variant="secondary" className="bg-purple-500/10 text-purple-600">
                <Video className="h-3 w-3 mr-1" />
                {summary.eventsWithVideos} with videos
              </Badge>
              <Badge variant="secondary" className="bg-indigo-500/10 text-indigo-600">
                {summary.eventsWithSchedules} with schedules
              </Badge>
            </div>
          )}

          {/* Top Brands */}
          {summary && summary.topBrands.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Top Brands by Event Count</h4>
              <div className="flex flex-wrap gap-2">
                {summary.topBrands.map((brand, i) => (
                  <Badge key={i} variant="outline">
                    {brand.name}: {brand.eventCount} events
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Event Table */}
          {reportData && reportData.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Event Details ({reportData.length})</h4>
              <ScrollArea className="h-[400px] border rounded-lg">
                <div className="p-4 space-y-2">
                  {reportData.slice(0, 50).map((event) => (
                    <div key={event.id} className="flex items-center justify-between py-3 border-b last:border-0">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium truncate">{event.event_name || event.name}</p>
                          {event.event_status === 'upcoming' && (
                            <Badge variant="default" className="bg-green-500/90 text-xs">Upcoming</Badge>
                          )}
                          {event.event_status === 'past' && (
                            <Badge variant="secondary" className="text-xs">Past</Badge>
                          )}
                          {event.is_orphan && (
                            <Badge variant="outline" className="border-amber-500/50 text-amber-600 text-xs">
                              Orphan
                            </Badge>
                          )}
                          {event.is_stale && (
                            <Badge variant="outline" className="border-amber-500/50 text-amber-600 text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              {event.days_since_update}d
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                          {event.event_dates && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {event.event_dates}
                            </span>
                          )}
                          {(event.location || event.venue) && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {event.venue || event.location}
                            </span>
                          )}
                          {event.speakers_count > 0 && (
                            <span className="flex items-center gap-1">
                              <Mic2 className="h-3 w-3" />
                              {event.speakers_count} speakers
                            </span>
                          )}
                          {event.sponsors_count > 0 && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {event.sponsors_count} sponsors
                            </span>
                          )}
                        </div>
                        {event.missing_critical.length > 0 && (
                          <span className="text-xs text-amber-600 mt-1 block">
                            Missing: {event.missing_critical.join(', ')}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                        <Badge variant="outline" className="text-xs">
                          {eventTypeLabels[event.event_type] || event.event_type}
                        </Badge>
                        <Badge variant={event.is_public ? 'default' : 'secondary'} className="text-xs">
                          {event.is_public ? 'Public' : 'Private'}
                        </Badge>
                        <Badge variant="outline" className={
                          event.completeness_score >= 80 ? 'border-green-500 text-green-600' :
                          event.completeness_score >= 50 ? 'border-yellow-500 text-yellow-600' :
                          'border-red-500 text-red-600'
                        }>
                          {event.completeness_score}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Empty State */}
          {reportData && reportData.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No events found</p>
              <p className="text-sm">Try adjusting your filters or date range</p>
            </div>
          )}
        </CardContent>
          </Card>

          {/* Custom AI Prompt Runner for Events */}
          {reportData && reportData.length > 0 && (
            <EventCustomPromptRunner events={reportData.map(e => ({ id: e.id, name: e.event_name || e.name }))} />
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {reportData && reportData.length > 0 ? (
            <EventAnalyticsCharts 
              events={reportData.map(e => ({
                id: e.id,
                name: e.name,
                created_at: e.created_at,
                event_name: e.event_name,
                event_type: e.event_type,
                speakers_count: e.speakers_count,
                sponsors_count: e.sponsors_count,
                expected_attendees: e.expected_attendees,
                event_status: e.event_status,
                completeness_score: e.completeness_score,
                has_schedule: e.has_schedule,
                videos_count: e.videos_count,
                signage_count: e.signage_count,
                banners_count: e.banners_count,
              }))}
            />
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Generate a report first</p>
                  <p className="text-sm">Switch to "Reports & Data" tab and click "Generate Report" to view analytics charts</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
