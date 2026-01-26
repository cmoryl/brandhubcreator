/**
 * LocationAnalytics Component
 * Displays geographic distribution of brand views and user activity
 * Includes expandable fullscreen modal view
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { 
  MapPin, 
  Maximize2, 
  Globe, 
  TrendingUp,
  Users,
  Eye,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

interface LocationData {
  country: string;
  countryCode: string;
  views: number;
  users: number;
  sessions: number;
  avgDuration: string;
  trend: number;
}

interface CityData {
  city: string;
  country: string;
  views: number;
  percentage: number;
}

interface RegionData {
  region: string;
  views: number;
  color: string;
}

interface LocationAnalyticsProps {
  organizationId?: string;
  dateRange: string;
}

// Simulated location data based on typical global distribution
const generateLocationData = (dateRange: string): LocationData[] => {
  const baseMultiplier = dateRange === '7' ? 1 : dateRange === '30' ? 4 : 12;
  
  return [
    { country: 'United States', countryCode: 'US', views: 2450 * baseMultiplier, users: 890 * baseMultiplier, sessions: 1200 * baseMultiplier, avgDuration: '4:32', trend: 12.5 },
    { country: 'United Kingdom', countryCode: 'GB', views: 1280 * baseMultiplier, users: 420 * baseMultiplier, sessions: 580 * baseMultiplier, avgDuration: '3:45', trend: 8.2 },
    { country: 'Germany', countryCode: 'DE', views: 890 * baseMultiplier, users: 310 * baseMultiplier, sessions: 420 * baseMultiplier, avgDuration: '5:12', trend: 15.7 },
    { country: 'France', countryCode: 'FR', views: 720 * baseMultiplier, users: 280 * baseMultiplier, sessions: 350 * baseMultiplier, avgDuration: '4:08', trend: -2.3 },
    { country: 'Canada', countryCode: 'CA', views: 650 * baseMultiplier, users: 240 * baseMultiplier, sessions: 310 * baseMultiplier, avgDuration: '3:55', trend: 5.4 },
    { country: 'Australia', countryCode: 'AU', views: 580 * baseMultiplier, users: 195 * baseMultiplier, sessions: 270 * baseMultiplier, avgDuration: '4:22', trend: 18.9 },
    { country: 'Netherlands', countryCode: 'NL', views: 420 * baseMultiplier, users: 165 * baseMultiplier, sessions: 210 * baseMultiplier, avgDuration: '5:45', trend: 7.1 },
    { country: 'Japan', countryCode: 'JP', views: 380 * baseMultiplier, users: 140 * baseMultiplier, sessions: 185 * baseMultiplier, avgDuration: '6:12', trend: 22.4 },
    { country: 'Spain', countryCode: 'ES', views: 290 * baseMultiplier, users: 110 * baseMultiplier, sessions: 150 * baseMultiplier, avgDuration: '3:38', trend: 4.8 },
    { country: 'Italy', countryCode: 'IT', views: 240 * baseMultiplier, users: 95 * baseMultiplier, sessions: 125 * baseMultiplier, avgDuration: '3:22', trend: -1.2 },
    { country: 'Brazil', countryCode: 'BR', views: 210 * baseMultiplier, users: 85 * baseMultiplier, sessions: 110 * baseMultiplier, avgDuration: '2:55', trend: 31.5 },
    { country: 'India', countryCode: 'IN', views: 185 * baseMultiplier, users: 72 * baseMultiplier, sessions: 95 * baseMultiplier, avgDuration: '2:18', trend: 45.2 },
  ].sort((a, b) => b.views - a.views);
};

const generateCityData = (dateRange: string): CityData[] => {
  const baseMultiplier = dateRange === '7' ? 1 : dateRange === '30' ? 4 : 12;
  const cities = [
    { city: 'New York', country: 'US', views: 680 * baseMultiplier },
    { city: 'London', country: 'GB', views: 520 * baseMultiplier },
    { city: 'Los Angeles', country: 'US', views: 410 * baseMultiplier },
    { city: 'Berlin', country: 'DE', views: 340 * baseMultiplier },
    { city: 'Toronto', country: 'CA', views: 290 * baseMultiplier },
    { city: 'Sydney', country: 'AU', views: 270 * baseMultiplier },
    { city: 'Paris', country: 'FR', views: 250 * baseMultiplier },
    { city: 'San Francisco', country: 'US', views: 230 * baseMultiplier },
    { city: 'Amsterdam', country: 'NL', views: 210 * baseMultiplier },
    { city: 'Tokyo', country: 'JP', views: 195 * baseMultiplier },
    { city: 'Chicago', country: 'US', views: 175 * baseMultiplier },
    { city: 'Munich', country: 'DE', views: 160 * baseMultiplier },
    { city: 'Melbourne', country: 'AU', views: 145 * baseMultiplier },
    { city: 'Seattle', country: 'US', views: 130 * baseMultiplier },
    { city: 'Vancouver', country: 'CA', views: 115 * baseMultiplier },
  ];
  
  const total = cities.reduce((sum, c) => sum + c.views, 0);
  return cities.map(c => ({
    ...c,
    percentage: Math.round((c.views / total) * 1000) / 10
  }));
};

const REGION_COLORS = {
  'North America': '#6366f1',
  'Europe': '#8b5cf6',
  'Asia Pacific': '#f59e0b',
  'Latin America': '#22c55e',
  'Middle East': '#ec4899',
  'Africa': '#14b8a6',
};

const getRegionData = (locationData: LocationData[]): RegionData[] => {
  const regionMapping: Record<string, string> = {
    US: 'North America', CA: 'North America',
    GB: 'Europe', DE: 'Europe', FR: 'Europe', NL: 'Europe', ES: 'Europe', IT: 'Europe',
    AU: 'Asia Pacific', JP: 'Asia Pacific', IN: 'Asia Pacific',
    BR: 'Latin America',
  };
  
  const regions: Record<string, number> = {};
  locationData.forEach(loc => {
    const region = regionMapping[loc.countryCode] || 'Other';
    regions[region] = (regions[region] || 0) + loc.views;
  });
  
  return Object.entries(regions)
    .map(([region, views]) => ({
      region,
      views,
      color: REGION_COLORS[region as keyof typeof REGION_COLORS] || '#6b7280',
    }))
    .sort((a, b) => b.views - a.views);
};

// Country flag emoji helper
const getCountryFlag = (code: string): string => {
  const codePoints = code
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

export const LocationAnalytics = ({ dateRange }: LocationAnalyticsProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const locationData = useMemo(() => generateLocationData(dateRange), [dateRange]);
  const cityData = useMemo(() => generateCityData(dateRange), [dateRange]);
  const regionData = useMemo(() => getRegionData(locationData), [locationData]);
  
  const totalViews = locationData.reduce((sum, loc) => sum + loc.views, 0);
  const totalUsers = locationData.reduce((sum, loc) => sum + loc.users, 0);
  const topCountries = locationData.slice(0, 5);
  const topCities = cityData.slice(0, 10);

  const CompactView = () => (
    <Card className="relative group">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            Geographic Distribution
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(true)}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Maximize2 className="h-4 w-4 mr-1" />
            Expand
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Eye className="h-3 w-3" />
              Total Views
            </div>
            <p className="text-lg font-bold">{totalViews.toLocaleString()}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Users className="h-3 w-3" />
              Unique Visitors
            </div>
            <p className="text-lg font-bold">{totalUsers.toLocaleString()}</p>
          </div>
        </div>

        {/* Top Countries Mini Chart */}
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={topCountries}
              layout="vertical"
              margin={{ top: 0, right: 0, left: 40, bottom: 0 }}
            >
              <XAxis type="number" hide />
              <YAxis 
                type="category" 
                dataKey="countryCode" 
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${getCountryFlag(value)} ${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value: number) => [value.toLocaleString(), 'Views']}
                labelFormatter={(label) => locationData.find(l => l.countryCode === label)?.country || label}
              />
              <Bar dataKey="views" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Countries List */}
        <div className="space-y-2">
          {topCountries.slice(0, 3).map((loc, idx) => (
            <div key={loc.countryCode} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="text-lg">{getCountryFlag(loc.countryCode)}</span>
                <span className="font-medium">{loc.country}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{loc.views.toLocaleString()}</span>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${loc.trend >= 0 ? 'text-green-600 border-green-500/30' : 'text-red-600 border-red-500/30'}`}
                >
                  {loc.trend >= 0 ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
                  {Math.abs(loc.trend)}%
                </Badge>
              </div>
            </div>
          ))}
        </div>

        <Button 
          variant="outline" 
          size="sm" 
          className="w-full" 
          onClick={() => setIsExpanded(true)}
        >
          <Maximize2 className="h-4 w-4 mr-2" />
          View Full Report
        </Button>
      </CardContent>
    </Card>
  );

  const ExpandedView = () => (
    <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Globe className="h-5 w-5 text-primary" />
            Geographic Analytics
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 pb-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
                  <Eye className="h-4 w-4" />
                  Total Views
                </div>
                <p className="text-2xl font-bold">{totalViews.toLocaleString()}</p>
                <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3" />
                  +12.5% vs last period
                </p>
              </div>
              <div className="p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
                  <Users className="h-4 w-4" />
                  Unique Visitors
                </div>
                <p className="text-2xl font-bold">{totalUsers.toLocaleString()}</p>
                <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3" />
                  +8.3% vs last period
                </p>
              </div>
              <div className="p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
                  <MapPin className="h-4 w-4" />
                  Countries
                </div>
                <p className="text-2xl font-bold">{locationData.length}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Active regions
                </p>
              </div>
              <div className="p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
                  <Building2 className="h-4 w-4" />
                  Top City
                </div>
                <p className="text-2xl font-bold">{cityData[0]?.city}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {cityData[0]?.views.toLocaleString()} views
                </p>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Regional Distribution */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Regional Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={regionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={3}
                          dataKey="views"
                          nameKey="region"
                        >
                          {regionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--popover))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '12px',
                          }}
                          formatter={(value: number) => [value.toLocaleString(), 'Views']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap justify-center gap-4 mt-2">
                    {regionData.map(region => (
                      <div key={region.region} className="flex items-center gap-2 text-xs">
                        <span 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: region.color }}
                        />
                        <span>{region.region}</span>
                        <span className="text-muted-foreground">
                          ({Math.round((region.views / totalViews) * 100)}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Countries Chart */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Views by Country</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={locationData.slice(0, 8)}
                        layout="vertical"
                        margin={{ top: 0, right: 20, left: 80, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} />
                        <YAxis 
                          type="category" 
                          dataKey="country" 
                          tick={{ fontSize: 11 }}
                          tickLine={false}
                          axisLine={false}
                          width={75}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--popover))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '12px',
                          }}
                          formatter={(value: number) => [value.toLocaleString(), 'Views']}
                        />
                        <Bar dataKey="views" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Countries Table */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    All Countries
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Country</TableHead>
                        <TableHead className="text-right">Views</TableHead>
                        <TableHead className="text-right">Users</TableHead>
                        <TableHead className="text-right">Avg. Duration</TableHead>
                        <TableHead className="text-right">Trend</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {locationData.map((loc) => (
                        <TableRow key={loc.countryCode}>
                          <TableCell className="font-medium">
                            <span className="mr-2">{getCountryFlag(loc.countryCode)}</span>
                            {loc.country}
                          </TableCell>
                          <TableCell className="text-right">{loc.views.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{loc.users.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{loc.avgDuration}</TableCell>
                          <TableCell className="text-right">
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${loc.trend >= 0 ? 'text-green-600 border-green-500/30' : 'text-red-600 border-red-500/30'}`}
                            >
                              {loc.trend >= 0 ? '+' : ''}{loc.trend}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Cities Table */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Top Cities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>City</TableHead>
                        <TableHead>Country</TableHead>
                        <TableHead className="text-right">Views</TableHead>
                        <TableHead className="text-right">Share</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topCities.map((city, idx) => (
                        <TableRow key={`${city.city}-${city.country}`}>
                          <TableCell className="font-medium">{city.city}</TableCell>
                          <TableCell>
                            <span className="mr-1">{getCountryFlag(city.country)}</span>
                            {city.country}
                          </TableCell>
                          <TableCell className="text-right">{city.views.toLocaleString()}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-primary rounded-full"
                                  style={{ width: `${Math.min(city.percentage * 3, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground w-10 text-right">
                                {city.percentage}%
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );

  return (
    <>
      <CompactView />
      <ExpandedView />
    </>
  );
};

export default LocationAnalytics;
