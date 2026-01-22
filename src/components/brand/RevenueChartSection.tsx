import { useState, useMemo, useCallback, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { SectionHeader } from './SectionHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Download, TrendingUp, TrendingDown, DollarSign, BarChart3, Target, Pencil, Plus, Trash2, X, Check, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { RevenueDataPoint } from '@/types/brand';

interface RevenueChartSectionProps {
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
  revenueData?: RevenueDataPoint[];
  onRevenueDataChange?: (data: RevenueDataPoint[]) => void;
  brandName?: string;
}

// TransPerfect revenue data 1992-2025 (default)
const DEFAULT_REVENUE_DATA: RevenueDataPoint[] = [
  { year: 1992, revenue: 0.3, facts: ['TransPerfect founded in NYU dorm room', 'First year of operations'] },
  { year: 1993, revenue: 0.8, facts: ['Early growth phase', 'Building client base'] },
  { year: 1994, revenue: 1.5, facts: ['Expanding services', 'Growing team'] },
  { year: 1995, revenue: 2.8, facts: ['Continued expansion', 'New market entry'] },
  { year: 1996, revenue: 4.2, facts: ['Strong growth trajectory', 'Technology investments'] },
  { year: 1997, revenue: 6.5, facts: ['Scaling operations', 'International expansion begins'] },
  { year: 1998, revenue: 10, facts: ['Broke $10M milestone', 'Major client acquisitions'] },
  { year: 1999, revenue: 15, facts: ['Dot-com era growth', 'Tech industry demand'] },
  { year: 2000, revenue: 22, facts: ['Y2K projects completed', 'Continued tech sector work'] },
  { year: 2001, revenue: 28, facts: ['Post dot-com resilience', 'Diversified client base'] },
  { year: 2002, revenue: 35, facts: ['Steady growth', 'Process improvements'] },
  { year: 2003, revenue: 45, facts: ['Expanding globally', 'New office locations'] },
  { year: 2004, revenue: 58, facts: ['Technology platform growth', 'New service lines'] },
  { year: 2005, revenue: 75, facts: ['Approaching $100M', 'Industry recognition'] },
  { year: 2006, revenue: 95, facts: ['Near triple-digit revenue', 'Major contracts won'] },
  { year: 2007, revenue: 120, facts: ['Broke $100M barrier', 'Record growth year'] },
  { year: 2008, revenue: 145, facts: ['Pre-recession strength', 'Continued momentum'] },
  { year: 2009, revenue: 170, facts: ['Recession resilience', 'Counter-cyclical growth'] },
  { year: 2010, revenue: 205, facts: ['Broke $200M', 'Post-recession surge'] },
  { year: 2011, revenue: 250, facts: ['Quarter billion revenue', 'Acquisitions begin'] },
  { year: 2012, revenue: 301, facts: ['Broke $300M', 'Strategic acquisitions'] },
  { year: 2013, revenue: 365, facts: ['Rapid expansion', 'New technology investments'] },
  { year: 2014, revenue: 430, facts: ['Near half billion', 'Market leadership'] },
  { year: 2015, revenue: 505, facts: ['Broke $500M milestone', 'GlobalLink platform growth'] },
  { year: 2016, revenue: 545, facts: ['Steady growth', 'Platform consolidation'] },
  { year: 2017, revenue: 615, facts: ['Record revenue', 'AI/ML investments begin'] },
  { year: 2018, revenue: 705, facts: ['Approaching $1B', 'Major tech acquisitions'] },
  { year: 2019, revenue: 835, facts: ['Pre-pandemic peak', 'Global expansion'] },
  { year: 2020, revenue: 865, facts: ['COVID resilience', 'Remote work adaptation'] },
  { year: 2021, revenue: 1020, facts: ['Broke $1B milestone', 'Record-breaking year'] },
  { year: 2022, revenue: 1100, facts: ['Continued billion+ growth', 'AI integration'] },
  { year: 2023, revenue: 1183, facts: ['Strong performance', 'New market expansion'] },
  { year: 2024, revenue: 1250, facts: ['Projected growth', 'AI-powered solutions'] },
  { year: 2025, revenue: 1325, facts: ['Continued expansion', 'Industry leadership'] },
];

const formatRevenue = (value: number): string => {
  if (value >= 1000) return `$${(value / 1000).toFixed(2)}B`;
  if (value >= 1) return `$${value.toFixed(0)}M`;
  return `$${(value * 1000).toFixed(0)}K`;
};

const formatChange = (current: number, previous: number): { value: string; isPositive: boolean } => {
  if (!previous) return { value: 'N/A', isPositive: true };
  const change = ((current - previous) / previous) * 100;
  return {
    value: `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`,
    isPositive: change >= 0
  };
};

const calculateCAGR = (startValue: number, endValue: number, years: number): string => {
  if (!startValue || years <= 0) return 'N/A';
  const cagr = (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
  return `${cagr.toFixed(1)}%`;
};

export const RevenueChartSection = ({ 
  customSubtitle, 
  onSubtitleChange, 
  revenueData,
  onRevenueDataChange,
  brandName = 'TransPerfect'
}: RevenueChartSectionProps) => {
  // Use custom data if provided, otherwise fall back to TransPerfect defaults
  const chartData = useMemo(() => {
    const data = revenueData && revenueData.length > 0 ? revenueData : DEFAULT_REVENUE_DATA;
    return [...data].sort((a, b) => a.year - b.year);
  }, [revenueData]);

  const minYear = chartData.length > 0 ? chartData[0].year : 1992;
  const maxYear = chartData.length > 0 ? chartData[chartData.length - 1].year : 2025;

  const [isHeaderEditing, setIsHeaderEditing] = useState(false);
  const [yearRange, setYearRange] = useState<[number, number]>([minYear, maxYear]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  
  // Edit mode states
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<RevenueDataPoint | null>(null);
  const [newEntry, setNewEntry] = useState<{ year: string; revenue: string; facts: string }>({
    year: '',
    revenue: '',
    facts: ''
  });
  const [deleteConfirmYear, setDeleteConfirmYear] = useState<number | null>(null);

  // Update range when data changes
  useEffect(() => {
    setYearRange([minYear, maxYear]);
  }, [minYear, maxYear]);

  const filteredData = useMemo(() => {
    return chartData.filter(d => d.year >= yearRange[0] && d.year <= yearRange[1]);
  }, [chartData, yearRange]);

  const selectedYearData = useMemo(() => {
    if (!selectedYear) return null;
    const idx = chartData.findIndex(d => d.year === selectedYear);
    if (idx === -1) return null;
    
    const current = chartData[idx];
    const previous = idx > 0 ? chartData[idx - 1] : null;
    const yoyChange = previous ? formatChange(current.revenue, previous.revenue) : null;
    
    // Calculate 3Y, 5Y, 10Y metrics
    const idx3y = chartData.findIndex(d => d.year === selectedYear - 3);
    const idx5y = chartData.findIndex(d => d.year === selectedYear - 5);
    const idx10y = chartData.findIndex(d => d.year === selectedYear - 10);
    
    const cagr3y = idx3y >= 0 ? calculateCAGR(chartData[idx3y].revenue, current.revenue, 3) : 'N/A';
    const cagr5y = idx5y >= 0 ? calculateCAGR(chartData[idx5y].revenue, current.revenue, 5) : 'N/A';
    const cagr10y = idx10y >= 0 ? calculateCAGR(chartData[idx10y].revenue, current.revenue, 10) : 'N/A';
    
    const growth10y = idx10y >= 0 
      ? `${(((current.revenue - chartData[idx10y].revenue) / chartData[idx10y].revenue) * 100).toFixed(0)}%`
      : 'N/A';
    
    // Calculate averages
    const last3 = chartData.slice(Math.max(0, idx - 2), idx + 1);
    const last5 = chartData.slice(Math.max(0, idx - 4), idx + 1);
    const avg3y = last3.length >= 3 ? formatRevenue(last3.reduce((a, b) => a + b.revenue, 0) / last3.length) : 'N/A';
    const avg5y = last5.length >= 5 ? formatRevenue(last5.reduce((a, b) => a + b.revenue, 0) / last5.length) : 'N/A';
    
    // Rank
    const sorted = [...chartData].sort((a, b) => b.revenue - a.revenue);
    const rank = sorted.findIndex(d => d.year === selectedYear) + 1;
    
    return {
      ...current,
      yoyChange,
      cagr3y,
      cagr5y,
      cagr10y,
      growth10y,
      avg3y,
      avg5y,
      rank,
      total: chartData.length
    };
  }, [selectedYear, chartData]);

  const handleBarClick = useCallback((data: any) => {
    if (data?.activePayload?.[0]?.payload) {
      setSelectedYear(data.activePayload[0].payload.year);
      setIsDrawerOpen(true);
    }
  }, []);

  const handleQuickZoom = (years: number | 'all') => {
    if (years === 'all') {
      setYearRange([minYear, maxYear]);
    } else {
      setYearRange([maxYear - years, maxYear]);
    }
  };

  const handleExport = async () => {
    setIsExportOpen(true);
    toast.info('Chart export ready - right-click to save image');
  };

  const CustomTooltip = useCallback(({ active, payload }: any) => {
    if (!active || !payload?.[0]) return null;
    const data = payload[0].payload;
    const idx = chartData.findIndex(d => d.year === data.year);
    const prev = idx > 0 ? chartData[idx - 1] : null;
    const change = prev ? formatChange(data.revenue, prev.revenue) : null;
    
    return (
      <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg">
        <div className="font-bold text-lg">{data.year}</div>
        <div className="text-primary font-semibold">{formatRevenue(data.revenue)}</div>
        {change && (
          <div className={`text-sm ${change.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {change.value} YoY
          </div>
        )}
      </div>
    );
  }, [chartData]);

  // Edit mode handlers
  const handleAddEntry = useCallback(() => {
    const year = parseInt(newEntry.year);
    const revenue = parseFloat(newEntry.revenue);
    
    if (isNaN(year) || year < 1900 || year > 2100) {
      toast.error('Please enter a valid year (1900-2100)');
      return;
    }
    
    if (isNaN(revenue) || revenue <= 0) {
      toast.error('Please enter a valid revenue amount');
      return;
    }
    
    // Check if year already exists
    if (chartData.some(d => d.year === year)) {
      toast.error(`Year ${year} already exists. Edit the existing entry instead.`);
      return;
    }
    
    const facts = newEntry.facts.split('\n').filter(f => f.trim());
    const newDataPoint: RevenueDataPoint = { year, revenue, facts };
    
    const updatedData = [...chartData, newDataPoint].sort((a, b) => a.year - b.year);
    onRevenueDataChange?.(updatedData);
    
    setNewEntry({ year: '', revenue: '', facts: '' });
    setIsAddDialogOpen(false);
    toast.success(`Added revenue data for ${year}`);
  }, [newEntry, chartData, onRevenueDataChange]);

  const handleUpdateEntry = useCallback(() => {
    if (!editingEntry) return;
    
    const updatedData = chartData.map(d => 
      d.year === editingEntry.year ? editingEntry : d
    );
    onRevenueDataChange?.(updatedData);
    setEditingEntry(null);
    toast.success(`Updated ${editingEntry.year} data`);
  }, [editingEntry, chartData, onRevenueDataChange]);

  const handleDeleteEntry = useCallback((year: number) => {
    const updatedData = chartData.filter(d => d.year !== year);
    if (updatedData.length === 0) {
      toast.error('Cannot delete the last entry. At least one year is required.');
      return;
    }
    onRevenueDataChange?.(updatedData);
    setDeleteConfirmYear(null);
    toast.success(`Deleted ${year} data`);
  }, [chartData, onRevenueDataChange]);

  const handleResetToDefaults = useCallback(() => {
    onRevenueDataChange?.(DEFAULT_REVENUE_DATA);
    toast.success('Reset to TransPerfect default data');
  }, [onRevenueDataChange]);

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <SectionHeader
            title="Revenue Growth"
            defaultSubtitle="TransPerfect's journey from startup to industry leader"
            customSubtitle={customSubtitle}
            onSubtitleChange={onSubtitleChange}
            isEditing={isHeaderEditing}
            onEditToggle={() => setIsHeaderEditing(!isHeaderEditing)}
          />
        </div>
        <div className="flex items-center gap-2">
          {onRevenueDataChange && (
            <Button 
              onClick={() => setIsEditMode(!isEditMode)} 
              variant={isEditMode ? "default" : "outline"} 
              size="sm" 
              className="gap-2"
            >
              {isEditMode ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
              {isEditMode ? 'Exit Edit' : 'Edit Data'}
            </Button>
          )}
          <Button onClick={handleExport} variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>
      
      {/* Edit Mode Controls */}
      {isEditMode && onRevenueDataChange && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Pencil className="h-4 w-4 text-primary" />
              <span className="font-semibold text-sm">Edit Mode</span>
              <span className="text-xs text-muted-foreground">• Click on year rows below to edit</span>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => setIsAddDialogOpen(true)} size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Year
              </Button>
              <Button onClick={handleResetToDefaults} variant="outline" size="sm" className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Reset to Default
              </Button>
            </div>
          </div>
          
          {/* Editable Data Table */}
          <div className="bg-card border border-border rounded-xl overflow-hidden max-h-[300px] overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-muted/90 backdrop-blur-sm z-10">
                <tr className="border-b border-border">
                  <th className="px-4 py-2 text-left text-xs font-bold text-muted-foreground uppercase tracking-wide w-20">Year</th>
                  <th className="px-4 py-2 text-left text-xs font-bold text-muted-foreground uppercase tracking-wide w-32">Revenue</th>
                  <th className="px-4 py-2 text-left text-xs font-bold text-muted-foreground uppercase tracking-wide">Facts</th>
                  <th className="px-4 py-2 text-right text-xs font-bold text-muted-foreground uppercase tracking-wide w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {chartData.map((entry) => (
                  <tr key={entry.year} className="hover:bg-muted/30 transition-colors">
                    {editingEntry?.year === entry.year ? (
                      <>
                        <td className="px-4 py-2">
                          <span className="text-sm font-bold">{entry.year}</span>
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            type="number"
                            step="0.1"
                            value={editingEntry.revenue}
                            onChange={(e) => setEditingEntry({ ...editingEntry, revenue: parseFloat(e.target.value) || 0 })}
                            className="h-8 w-28"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Textarea
                            value={editingEntry.facts?.join('\n') || ''}
                            onChange={(e) => setEditingEntry({ 
                              ...editingEntry, 
                              facts: e.target.value.split('\n').filter(f => f.trim()) 
                            })}
                            placeholder="One fact per line..."
                            className="min-h-[60px] text-sm"
                          />
                        </td>
                        <td className="px-4 py-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={handleUpdateEntry}>
                              <Check className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditingEntry(null)}>
                              <X className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-2">
                          <span className="text-sm font-bold">{entry.year}</span>
                        </td>
                        <td className="px-4 py-2">
                          <span className="text-sm font-medium tabular-nums">{formatRevenue(entry.revenue)}</span>
                        </td>
                        <td className="px-4 py-2">
                          <span className="text-sm text-muted-foreground line-clamp-1">
                            {entry.facts?.join(' • ') || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-7 w-7 p-0" 
                              onClick={() => setEditingEntry({ ...entry })}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            {deleteConfirmYear === entry.year ? (
                              <>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-7 w-7 p-0" 
                                  onClick={() => handleDeleteEntry(entry.year)}
                                >
                                  <Check className="h-4 w-4 text-red-600" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-7 w-7 p-0" 
                                  onClick={() => setDeleteConfirmYear(null)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-7 w-7 p-0 text-destructive hover:text-destructive" 
                                onClick={() => setDeleteConfirmYear(entry.year)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap gap-3">
        {/* Quick zoom buttons */}
        <div className="flex items-center gap-2 bg-card/70 backdrop-blur-sm border border-border rounded-lg px-3 py-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Zoom</span>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs font-bold" onClick={() => handleQuickZoom('all')}>All</Button>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs font-bold" onClick={() => handleQuickZoom(5)}>5Y</Button>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs font-bold" onClick={() => handleQuickZoom(10)}>10Y</Button>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs font-bold" onClick={() => handleQuickZoom(15)}>15Y</Button>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs font-bold" onClick={() => handleQuickZoom(20)}>20Y</Button>
        </div>

        {/* Year range inputs */}
        <div className="flex items-center gap-2 bg-card/70 backdrop-blur-sm border border-border rounded-lg px-3 py-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">View</span>
          <Input
            type="number"
            min={minYear}
            max={yearRange[1]}
            value={yearRange[0]}
            onChange={(e) => setYearRange([Math.min(Number(e.target.value), yearRange[1]), yearRange[1]])}
            className="w-20 h-7 text-center font-bold"
          />
          <span className="text-muted-foreground font-bold">–</span>
          <Input
            type="number"
            min={yearRange[0]}
            max={maxYear}
            value={yearRange[1]}
            onChange={(e) => setYearRange([yearRange[0], Math.max(Number(e.target.value), yearRange[0])])}
            className="w-20 h-7 text-center font-bold"
          />
        </div>

        {/* Scrubber */}
        <div className="flex-1 min-w-[280px] bg-card/70 backdrop-blur-sm border border-border rounded-lg px-3 py-2">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Scrub</span>
            <span className="text-sm font-bold text-foreground">{yearRange[0]}–{yearRange[1]}</span>
          </div>
          <Slider
            value={yearRange}
            min={minYear}
            max={maxYear}
            step={1}
            onValueChange={(value) => setYearRange(value as [number, number])}
            className="w-full"
          />
        </div>
      </div>

      {/* Chart */}
      <div className="bg-card/70 backdrop-blur-sm border border-border rounded-xl p-4 shadow-lg">
        <p className="text-xs text-muted-foreground mb-3 font-medium">Click any bar to view year details</p>
        <div className="h-[400px] md:h-[500px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={filteredData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              onClick={handleBarClick}
            >
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                </linearGradient>
                <linearGradient id="barGradientHover" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                  <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0.8} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis 
                dataKey="year" 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11, fontWeight: 600 }}
                tickLine={{ stroke: 'hsl(var(--border))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                tickFormatter={(v) => v >= 1000 ? `$${v/1000}B` : `$${v}M`}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11, fontWeight: 600 }}
                tickLine={{ stroke: 'hsl(var(--border))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.1 }} />
              <ReferenceLine y={1000} stroke="hsl(var(--primary))" strokeDasharray="5 5" opacity={0.5} />
              <Bar 
                dataKey="revenue" 
                fill="url(#barGradient)" 
                radius={[4, 4, 0, 0]}
                cursor="pointer"
              >
                {filteredData.map((entry) => (
                  <Cell 
                    key={entry.year}
                    fill={selectedYear === entry.year ? 'url(#barGradientHover)' : 'url(#barGradient)'}
                    stroke={selectedYear === entry.year ? 'hsl(var(--primary))' : 'transparent'}
                    strokeWidth={2}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Year Detail Drawer */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-2xl font-black">{selectedYear}</SheetTitle>
            <p className="text-sm text-muted-foreground font-medium">Year Details & Metrics</p>
          </SheetHeader>
          
          {selectedYearData && (
            <div className="mt-6 space-y-4">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
                    <DollarSign className="h-3.5 w-3.5" />
                    Revenue
                  </div>
                  <div className="text-xl font-black text-foreground">{formatRevenue(selectedYearData.revenue)}</div>
                </div>
                
                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
                    {selectedYearData.yoyChange?.isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                    YoY Change
                  </div>
                  <div className={`text-xl font-black ${selectedYearData.yoyChange?.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedYearData.yoyChange?.value || 'N/A'}
                  </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
                    <BarChart3 className="h-3.5 w-3.5" />
                    10Y CAGR
                  </div>
                  <div className="text-lg font-bold text-foreground">{selectedYearData.cagr10y}</div>
                </div>

                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
                    <Target className="h-3.5 w-3.5" />
                    10Y Growth
                  </div>
                  <div className="text-lg font-bold text-foreground">{selectedYearData.growth10y}</div>
                </div>

                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">3Y CAGR</div>
                  <div className="text-lg font-bold text-foreground">{selectedYearData.cagr3y}</div>
                </div>

                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">5Y CAGR</div>
                  <div className="text-lg font-bold text-foreground">{selectedYearData.cagr5y}</div>
                </div>

                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">3Y Avg</div>
                  <div className="text-lg font-bold text-foreground">{selectedYearData.avg3y}</div>
                </div>

                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">5Y Avg</div>
                  <div className="text-lg font-bold text-foreground">{selectedYearData.avg5y}</div>
                </div>

                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
                    <Target className="h-3.5 w-3.5" />
                    Rank
                  </div>
                  <div className="text-lg font-bold text-foreground">#{selectedYearData.rank} of {selectedYearData.total}</div>
                </div>

                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Window</div>
                  <div className="text-lg font-bold text-foreground">{yearRange[0]}–{yearRange[1]}</div>
                </div>
              </div>

              {/* Year Facts */}
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="bg-muted/50 px-4 py-3 border-b border-border">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Year Highlights</h3>
                </div>
                <ul className="divide-y divide-border">
                  {selectedYearData.facts.map((fact, i) => (
                    <li key={i} className="px-4 py-3 text-sm font-medium text-foreground">{fact}</li>
                  ))}
                </ul>
              </div>

              {/* Nearby Years Table */}
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border">
                      <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wide">Year</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wide">Revenue</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wide">YoY</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {chartData
                      .filter(d => Math.abs(d.year - selectedYear!) <= 2)
                      .map((d, i, arr) => {
                        const prev = i > 0 ? arr[i - 1] : chartData[chartData.findIndex(x => x.year === d.year) - 1];
                        const change = prev ? formatChange(d.revenue, prev.revenue) : null;
                        return (
                          <tr key={d.year} className={d.year === selectedYear ? 'bg-primary/5' : ''}>
                            <td className="px-4 py-3 text-sm font-bold">{d.year}</td>
                            <td className="px-4 py-3 text-sm font-medium tabular-nums">{formatRevenue(d.revenue)}</td>
                            <td className={`px-4 py-3 text-sm font-medium tabular-nums ${change?.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                              {change?.value || '—'}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Export Dialog */}
      <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Export Revenue Chart</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold">{brandName} Revenue Growth</h3>
                <p className="text-sm text-muted-foreground">{yearRange[0]} – {yearRange[1]}</p>
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={filteredData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                    <XAxis 
                      dataKey="year" 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                      angle={-45}
                      textAnchor="end"
                    />
                    <YAxis tickFormatter={(v) => v >= 1000 ? `$${v/1000}B` : `$${v}M`} />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Right-click (desktop) or long-press (mobile) the chart area to save as image.
            </p>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Add Year Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Revenue Year</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Year</label>
              <Input
                type="number"
                placeholder="e.g., 2026"
                value={newEntry.year}
                onChange={(e) => setNewEntry({ ...newEntry, year: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Revenue (in millions USD)</label>
              <Input
                type="number"
                step="0.1"
                placeholder="e.g., 1500 for $1.5B"
                value={newEntry.revenue}
                onChange={(e) => setNewEntry({ ...newEntry, revenue: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">Enter value in millions. E.g., 1500 = $1.5B, 250 = $250M</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Year Highlights (one per line)</label>
              <Textarea
                placeholder="Major acquisition completed&#10;New market expansion&#10;Record revenue year"
                value={newEntry.facts}
                onChange={(e) => setNewEntry({ ...newEntry, facts: e.target.value })}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddEntry}>Add Year</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
};
