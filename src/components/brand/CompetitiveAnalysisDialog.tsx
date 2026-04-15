import { useState, useMemo, useEffect, useRef } from 'react';
import { TrendingUp, Plus, X, Loader2, Sparkles, BarChart3, Target, Lightbulb, FileText, Users, AlertTriangle, CheckCircle, Download, Wand2, Search, Star, Heart, Globe2, MapPin, Shield, Swords, Eye, MessageSquare, Zap } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCompetitiveAnalysis } from '@/hooks/useCompetitiveAnalysis';
import { useRecommendationActions } from '@/hooks/useRecommendationActions';
import { useFavoriteCompetitors } from '@/hooks/useFavoriteCompetitors';
import { useRegionalBranding } from '@/hooks/useRegionalBranding';
import { ScoreGauge } from '@/components/admin/competitive-analysis/ScoreGauge';
import { PersonalityMatrixChart } from '@/components/admin/competitive-analysis/PersonalityMatrixChart';
import { StrengthsWeaknessesMatrix } from '@/components/admin/competitive-analysis/StrengthsWeaknessesMatrix';
import { ActionPlanTimeline } from '@/components/admin/competitive-analysis/ActionPlanTimeline';
import { DesignPriorityTable } from '@/components/admin/competitive-analysis/DesignPriorityTable';
import { exportCompetitiveAnalysisPdf } from '@/lib/exportCompetitiveAnalysisPdf';
import { exportCompetitiveAnalysisHtml } from '@/lib/exportHtml';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { EntityType, CompetitiveAnalysisReportData } from '@/types/competitiveAnalysis';
import { STANDARD_REGIONS, COMMON_COUNTRIES } from '@/types/regionalBranding';

// Defensive helper: ensures AI response fields are always arrays before .map()
// AI sometimes returns strings instead of arrays — coerce gracefully
const safeArr = (v: unknown): string[] => Array.isArray(v) ? v : typeof v === 'string' && v ? [v] : [];
const safeObjArr = <T,>(v: unknown): T[] => Array.isArray(v) ? v : [];

interface DiscoveredCompetitor {
  name: string;
  reason: string;
  type: 'direct' | 'indirect' | 'emerging';
  selected: boolean;
}

interface CompetitiveAnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: EntityType;
  entityId: string;
  entityName: string;
  organizationId?: string | null;
  /** Which tab to show when the dialog opens */
  defaultTab?: 'generate' | 'results';
  /** Callback when a new report is generated (for parent state sync) */
  onReportGenerated?: () => void;
}

export function CompetitiveAnalysisDialog({
  open,
  onOpenChange,
  entityType,
  entityId,
  entityName,
  organizationId,
  defaultTab = 'generate',
  onReportGenerated,
}: CompetitiveAnalysisDialogProps) {
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [newCompetitor, setNewCompetitor] = useState('');
  const [activeTab, setActiveTab] = useState<string>(defaultTab);

  // Sync activeTab when dialog opens with a specific defaultTab
  useEffect(() => {
    if (open) {
      setActiveTab(defaultTab);
    }
  }, [open, defaultTab]);
  const [isExporting, setIsExporting] = useState(false);
  
  // AI Discovery state
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveredCompetitors, setDiscoveredCompetitors] = useState<DiscoveredCompetitor[]>([]);
  const [industryHint, setIndustryHint] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [showDiscoveryPanel, setShowDiscoveryPanel] = useState(false);

  // Regional analysis state
  const [targetRegion, setTargetRegion] = useState<string>('');
  const [targetCountry, setTargetCountry] = useState<string>('');
  const [isRegionalAnalysis, setIsRegionalAnalysis] = useState(false);

  // Favorites state
  const [showFavoritesPanel, setShowFavoritesPanel] = useState(false);

  const {
    latestReport,
    isGenerating,
    generateReport,
  } = useCompetitiveAnalysis({ entityType, entityId, organizationId });

  // Notify parent when a new report arrives (from polling or direct)
  const prevReportIdRef = useRef(latestReport?.id);
  useEffect(() => {
    if (latestReport?.id && latestReport.id !== prevReportIdRef.current) {
      prevReportIdRef.current = latestReport.id;
      onReportGenerated?.();
    }
  }, [latestReport?.id, onReportGenerated]);

  const {
    favorites,
    isLoading: isLoadingFavorites,
    addMultipleFavorites,
    removeFavorite,
    isFavorite,
  } = useFavoriteCompetitors({ organizationId });

  // Regional branding data
  const { regions, countries } = useRegionalBranding(organizationId);

  // Recommendation actions for approve/utilize workflow
  const {
    approveRecommendation,
    isUtilized,
  } = useRecommendationActions({
    reportId: latestReport?.id,
    entityId,
    entityType,
    organizationId,
  });

  // Get available regions and countries
  const availableRegions = useMemo(() => {
    if (regions.length > 0) {
      return regions.map(r => ({ code: r.code, name: r.name }));
    }
    return STANDARD_REGIONS;
  }, [regions]);

  const availableCountries = useMemo(() => {
    if (countries.length > 0) {
      if (targetRegion) {
        return countries
          .filter(c => c.region_code === targetRegion)
          .map(c => ({ code: c.country_code, name: c.country_name }));
      }
      return countries.map(c => ({ code: c.country_code, name: c.country_name }));
    }
    if (targetRegion) {
      return COMMON_COUNTRIES.filter(c => c.region === targetRegion);
    }
    return COMMON_COUNTRIES;
  }, [countries, targetRegion]);

  const handleAddCompetitor = () => {
    if (newCompetitor.trim() && competitors.length < 10) {
      setCompetitors([...competitors, newCompetitor.trim()]);
      setNewCompetitor('');
    }
  };

  const handleRemoveCompetitor = (index: number) => {
    setCompetitors(competitors.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    const regionalContext = isRegionalAnalysis && (targetRegion || targetCountry) 
      ? { region: targetRegion || undefined, country: targetCountry || undefined }
      : undefined;
    const result = await generateReport(competitors, regionalContext);
    if (result) {
      setActiveTab('results');
    }
  };

  const handleDiscoverCompetitors = async () => {
    setIsDiscovering(true);
    setDiscoveredCompetitors([]);

    try {
      // Start the async job
      const { data, error } = await supabase.functions.invoke('discover-competitors', {
        body: {
          entityType,
          entityId,
          entityName,
          industry: industryHint || undefined,
          additionalContext: additionalContext || undefined,
        },
      });

      if (error) throw error;
      if (data?.error) { toast.error(data.error); setIsDiscovering(false); return; }

      const jobId = data?.jobId;
      if (!jobId) { toast.error('Failed to start discovery'); setIsDiscovering(false); return; }

      // Poll the database directly for results
      const pollInterval = setInterval(async () => {
        try {
          const { data: job, error: pollError } = await supabase
            .from('brand_intelligence_jobs')
            .select('status, result, error_message')
            .eq('id', jobId)
            .single();

          if (pollError) throw pollError;

          if (job?.status === 'completed' && job?.result) {
            clearInterval(pollInterval);
            const result = job.result as Record<string, any>;
            const competitors = result.competitors || [];
            setDiscoveredCompetitors(
              competitors.map((c: any) => ({ ...c, selected: true }))
            );
            toast.success(`Found ${competitors.length} potential competitors`);
            setIsDiscovering(false);
          } else if (job?.status === 'failed') {
            clearInterval(pollInterval);
            toast.error(job.error_message || 'Discovery failed');
            setIsDiscovering(false);
          }
        } catch (pollErr) {
          console.error('Poll error:', pollErr);
          clearInterval(pollInterval);
          toast.error('Failed to check discovery status');
          setIsDiscovering(false);
        }
      }, 2500);

      // Safety timeout after 60s
      setTimeout(() => {
        clearInterval(pollInterval);
        setIsDiscovering(false);
      }, 60000);

    } catch (error) {
      console.error('Error discovering competitors:', error);
      toast.error('Failed to discover competitors. Please try again.');
      setIsDiscovering(false);
    }
  };

  const handleToggleDiscoveredCompetitor = (index: number) => {
    setDiscoveredCompetitors((prev) =>
      prev.map((c, i) => (i === index ? { ...c, selected: !c.selected } : c))
    );
  };

  const handleAddSelectedCompetitors = () => {
    const selected = discoveredCompetitors
      .filter((c) => c.selected)
      .map((c) => c.name)
      .filter((name) => !competitors.includes(name));

    const newList = [...competitors, ...selected].slice(0, 10);
    setCompetitors(newList);
    setShowDiscoveryPanel(false);
    setDiscoveredCompetitors([]);
    toast.success(`Added ${selected.length} competitors`);
  };

  const handleSaveDiscoveredToFavorites = async () => {
    const selected = discoveredCompetitors.filter((c) => c.selected);
    if (selected.length === 0) return;

    await addMultipleFavorites(
      selected.map((c) => ({
        name: c.name,
        competitor_type: c.type,
        reason: c.reason,
        industry: industryHint || undefined,
      }))
    );
  };

  const handleAddFromFavorites = (names: string[]) => {
    const toAdd = names.filter((name) => !competitors.includes(name));
    const newList = [...competitors, ...toAdd].slice(0, 10);
    setCompetitors(newList);
    setShowFavoritesPanel(false);
    if (toAdd.length > 0) {
      toast.success(`Added ${toAdd.length} competitor(s) from favorites`);
    }
  };

  const handleToggleFavoriteSelection = (name: string) => {
    setSelectedFavorites((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const [selectedFavorites, setSelectedFavorites] = useState<string[]>([]);

  const handleExportPdf = async () => {
    if (!reportData) return;
    
    setIsExporting(true);
    try {
      await exportCompetitiveAnalysisPdf(reportData, {
        entityName,
        entityType,
      }, (status) => {
        if (status.includes('successfully')) {
          toast.success(status);
        }
      });
    } catch (error) {
      toast.error('Failed to export PDF');
      console.error('PDF export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const reportData = latestReport?.report_data as CompetitiveAnalysisReportData | undefined;

  const getCompetitorTypeBadge = (type: string) => {
    switch (type) {
      case 'direct':
        return <Badge variant="destructive" className="text-xs">Direct</Badge>;
      case 'indirect':
        return <Badge variant="secondary" className="text-xs">Indirect</Badge>;
      case 'emerging':
        return <Badge className="text-xs bg-sky-500 hover:bg-sky-600">Emerging</Badge>;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Competitive Analysis: {entityName}
          </DialogTitle>
          <DialogDescription>
            Generate comprehensive competitive intelligence reports powered by AI
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="generate" className="gap-2">
              <Sparkles className="w-4 h-4" />
              Generate Report
            </TabsTrigger>
            <TabsTrigger value="results" disabled={!latestReport} className="gap-2">
              <FileText className="w-4 h-4" />
              View Results
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="flex-1 overflow-auto mt-4">
            <div className="space-y-6">
              {/* AI Competitor Discovery Section */}
              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Wand2 className="w-5 h-5 text-primary" />
                    AI Competitor Discovery
                  </CardTitle>
                  <CardDescription>
                    Let AI analyze your brand and suggest relevant competitors
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!showDiscoveryPanel ? (
                    <Button
                      onClick={() => setShowDiscoveryPanel(true)}
                      variant="outline"
                      className="w-full gap-2 border-primary/30 hover:bg-primary/10"
                    >
                      <Search className="w-4 h-4" />
                      Discover Competitors with AI
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <Label htmlFor="industry" className="text-sm">
                            Industry (optional)
                          </Label>
                          <Input
                            id="industry"
                            value={industryHint}
                            onChange={(e) => setIndustryHint(e.target.value)}
                            placeholder="e.g., Translation Services, SaaS"
                            className="mt-1.5"
                          />
                        </div>
                        <div>
                          <Label htmlFor="context" className="text-sm">
                            Additional Context (optional)
                          </Label>
                          <Textarea
                            id="context"
                            value={additionalContext}
                            onChange={(e) => setAdditionalContext(e.target.value)}
                            placeholder="e.g., Focus on enterprise market, B2B only..."
                            className="mt-1.5 min-h-[38px] resize-none"
                            rows={1}
                          />
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={handleDiscoverCompetitors}
                          disabled={isDiscovering}
                          className="flex-1 gap-2"
                        >
                          {isDiscovering ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Analyzing...
                            </>
                          ) : (
                            <>
                              <Wand2 className="w-4 h-4" />
                              Find Competitors
                            </>
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setShowDiscoveryPanel(false);
                            setDiscoveredCompetitors([]);
                          }}
                        >
                          Cancel
                        </Button>
                      </div>

                      {/* Discovered Competitors Results */}
                      {discoveredCompetitors.length > 0 && (
                        <div className="space-y-3 pt-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">
                              Select competitors to add ({discoveredCompetitors.filter(c => c.selected).length} selected)
                            </Label>
                            <Button
                              variant="link"
                              size="sm"
                              className="h-auto p-0 text-xs"
                              onClick={() => {
                                const allSelected = discoveredCompetitors.every(c => c.selected);
                                setDiscoveredCompetitors(prev => 
                                  prev.map(c => ({ ...c, selected: !allSelected }))
                                );
                              }}
                            >
                              {discoveredCompetitors.every(c => c.selected) ? 'Deselect All' : 'Select All'}
                            </Button>
                          </div>
                          
                          <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                            {discoveredCompetitors.map((competitor, index) => (
                              <div
                                key={index}
                                className={`flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                                  competitor.selected
                                    ? 'bg-primary/5 border-primary/30'
                                    : 'bg-muted/30 border-transparent hover:border-muted'
                                }`}
                                onClick={() => handleToggleDiscoveredCompetitor(index)}
                              >
                                <Checkbox
                                  checked={competitor.selected}
                                  onCheckedChange={() => handleToggleDiscoveredCompetitor(index)}
                                  className="mt-0.5"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-medium text-sm">{competitor.name}</span>
                                    {getCompetitorTypeBadge(competitor.type)}
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                    {competitor.reason}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="flex gap-2">
                            <Button
                              onClick={handleAddSelectedCompetitors}
                              disabled={!discoveredCompetitors.some(c => c.selected)}
                              className="flex-1 gap-2"
                            >
                              <Plus className="w-4 h-4" />
                              Add {discoveredCompetitors.filter(c => c.selected).length} to Report
                            </Button>
                            <Button
                              onClick={handleSaveDiscoveredToFavorites}
                              disabled={!discoveredCompetitors.some(c => c.selected)}
                              variant="outline"
                              className="gap-2"
                            >
                              <Heart className="w-4 h-4" />
                              Save to Favorites
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Saved Favorites Section */}
              {favorites.length > 0 && (
                <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent">
                  <Collapsible open={showFavoritesPanel} onOpenChange={setShowFavoritesPanel}>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="pb-3 cursor-pointer hover:bg-muted/20 transition-colors rounded-t-lg">
                        <CardTitle className="flex items-center justify-between text-base">
                          <div className="flex items-center gap-2">
                            <Star className="w-5 h-5 text-amber-500" />
                            Saved Favorites ({favorites.length})
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {showFavoritesPanel ? 'Click to collapse' : 'Click to expand'}
                          </Badge>
                        </CardTitle>
                        <CardDescription>
                          Quickly add previously saved competitors
                        </CardDescription>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="space-y-4 pt-0">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">
                            Select favorites to add ({selectedFavorites.length} selected)
                          </Label>
                          <Button
                            variant="link"
                            size="sm"
                            className="h-auto p-0 text-xs"
                            onClick={() => {
                              const availableFavorites = favorites
                                .filter(f => !competitors.includes(f.name))
                                .map(f => f.name);
                              const allSelected = availableFavorites.every(n => selectedFavorites.includes(n));
                              setSelectedFavorites(allSelected ? [] : availableFavorites);
                            }}
                          >
                            {favorites
                              .filter(f => !competitors.includes(f.name))
                              .every(f => selectedFavorites.includes(f.name))
                              ? 'Deselect All'
                              : 'Select All'}
                          </Button>
                        </div>

                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                          {favorites.map((fav) => {
                            const alreadyAdded = competitors.includes(fav.name);
                            return (
                              <div
                                key={fav.id}
                                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                                  alreadyAdded
                                    ? 'bg-muted/20 border-transparent opacity-50'
                                    : selectedFavorites.includes(fav.name)
                                    ? 'bg-amber-500/10 border-amber-500/30 cursor-pointer'
                                    : 'bg-muted/30 border-transparent hover:border-muted cursor-pointer'
                                }`}
                                onClick={() => !alreadyAdded && handleToggleFavoriteSelection(fav.name)}
                              >
                                <Checkbox
                                  checked={alreadyAdded || selectedFavorites.includes(fav.name)}
                                  disabled={alreadyAdded}
                                  onCheckedChange={() => !alreadyAdded && handleToggleFavoriteSelection(fav.name)}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-medium text-sm">{fav.name}</span>
                                    {getCompetitorTypeBadge(fav.competitor_type)}
                                    {alreadyAdded && (
                                      <Badge variant="outline" className="text-xs">Already added</Badge>
                                    )}
                                  </div>
                                  {fav.reason && (
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                      {fav.reason}
                                    </p>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeFavorite(fav.id);
                                  }}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            );
                          })}
                        </div>

                        <Button
                          onClick={() => handleAddFromFavorites(selectedFavorites)}
                          disabled={selectedFavorites.length === 0}
                          className="w-full gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Add {selectedFavorites.length} from Favorites
                        </Button>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              )}

              {/* Manual Competitor Entry */}
              <div>
                <Label htmlFor="competitors" className="text-base font-medium">
                  Competitors ({competitors.length}/10)
                </Label>
                <p className="text-sm text-muted-foreground mt-1 mb-3">
                  Add competitors manually or use AI discovery above
                </p>
                
                <div className="flex gap-2">
                  <Input
                    id="competitors"
                    value={newCompetitor}
                    onChange={(e) => setNewCompetitor(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCompetitor()}
                    placeholder="e.g., Competitor Inc."
                    disabled={competitors.length >= 10}
                  />
                  <Button 
                    onClick={handleAddCompetitor}
                    disabled={!newCompetitor.trim() || competitors.length >= 10}
                    size="icon"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {competitors.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {competitors.map((comp, index) => (
                      <Badge key={index} variant="secondary" className="gap-1 pr-1">
                        {comp}
                        <button
                          onClick={() => handleRemoveCompetitor(index)}
                          className="ml-1 hover:bg-muted rounded p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Regional Analysis Section */}
              <Card className="border-sky-500/20 bg-gradient-to-br from-sky-500/5 to-transparent">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-base">
                    <div className="flex items-center gap-2">
                      <Globe2 className="w-5 h-5 text-sky-500" />
                      Regional Market Analysis
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="regional-analysis"
                        checked={isRegionalAnalysis}
                        onCheckedChange={(checked) => setIsRegionalAnalysis(!!checked)}
                      />
                      <Label htmlFor="regional-analysis" className="text-sm font-normal cursor-pointer">
                        Enable
                      </Label>
                    </div>
                  </CardTitle>
                  <CardDescription>
                    Analyze competitors within a specific region for localized brand integration
                  </CardDescription>
                </CardHeader>
                {isRegionalAnalysis && (
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="target-region" className="text-sm">
                          Target Region
                        </Label>
                        <Select value={targetRegion} onValueChange={(v) => {
                          setTargetRegion(v);
                          setTargetCountry('');
                        }}>
                          <SelectTrigger className="mt-1.5">
                            <SelectValue placeholder="Select region" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableRegions.map(r => (
                              <SelectItem key={r.code} value={r.code}>{r.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="target-country" className="text-sm">
                          Target Country (optional)
                        </Label>
                        <Select value={targetCountry} onValueChange={setTargetCountry}>
                          <SelectTrigger className="mt-1.5">
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableCountries.map(c => (
                              <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {(targetRegion || targetCountry) && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-md p-2">
                        <MapPin className="w-4 h-4 text-sky-500" />
                        Analysis will include regional competitors, cultural considerations, and localization priorities for {targetCountry || targetRegion}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium mb-2">Analysis includes:</h4>
                <ul className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    Visual Identity Audit
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    Digital Presence Analysis
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    Brand Positioning Matrix
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    SWOT Analysis
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    Per-Competitor Profiles
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    Content & Messaging Audit
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    Market Trends & Innovation
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    Strengths & Weaknesses
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    Strategic Recommendations
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    30/60/90 Day Action Plan
                  </li>
                  {isRegionalAnalysis && (targetRegion || targetCountry) && (
                    <>
                      <li className="flex items-center gap-2">
                        <Globe2 className="w-4 h-4 text-sky-500" />
                        Regional Market Context
                      </li>
                      <li className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-sky-500" />
                        Localization Priorities
                      </li>
                    </>
                  )}
                </ul>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={competitors.length === 0 || isGenerating}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Analysis... (this may take a minute)
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Competitive Analysis
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="results" className="flex-1 overflow-hidden mt-4">
            {reportData && (
              <ScrollArea className="h-[calc(90vh-200px)]">
                <Tabs defaultValue="summary" className="w-full">
                  <div className="flex items-center justify-between mb-4 gap-4">
                    <TabsList className="grid flex-1" style={{ gridTemplateColumns: `repeat(${4 + (reportData.swotAnalysis ? 1 : 0) + (reportData.competitorProfiles?.length ? 1 : 0) + (reportData.contentMessaging ? 1 : 0) + (reportData.marketTrends ? 1 : 0) + (reportData.regionalInsights ? 1 : 0)}, 1fr)` }}>
                      <TabsTrigger value="summary" className="text-xs">Summary</TabsTrigger>
                      <TabsTrigger value="positioning" className="text-xs">Positioning</TabsTrigger>
                      {reportData.swotAnalysis && (
                        <TabsTrigger value="swot" className="text-xs gap-1">
                          <Shield className="w-3 h-3" />
                          SWOT
                        </TabsTrigger>
                      )}
                      {reportData.competitorProfiles && reportData.competitorProfiles.length > 0 && (
                        <TabsTrigger value="profiles" className="text-xs gap-1">
                          <Eye className="w-3 h-3" />
                          Competitors
                        </TabsTrigger>
                      )}
                      {reportData.contentMessaging && (
                        <TabsTrigger value="content" className="text-xs gap-1">
                          <MessageSquare className="w-3 h-3" />
                          Content
                        </TabsTrigger>
                      )}
                      <TabsTrigger value="recommendations" className="text-xs">Recommendations</TabsTrigger>
                      <TabsTrigger value="action-plan" className="text-xs">Action Plan</TabsTrigger>
                      {reportData.marketTrends && (
                        <TabsTrigger value="trends" className="text-xs gap-1">
                          <Zap className="w-3 h-3" />
                          Trends
                        </TabsTrigger>
                      )}
                      {reportData.regionalInsights && (
                        <TabsTrigger value="regional" className="text-xs gap-1">
                          <Globe2 className="w-3 h-3" />
                          Regional
                        </TabsTrigger>
                      )}
                    </TabsList>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportPdf}
                        disabled={isExporting}
                        className="gap-2"
                      >
                        {isExporting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                        PDF
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          exportCompetitiveAnalysisHtml(reportData, { entityName, entityType });
                          toast.success('HTML report downloaded');
                        }}
                        className="gap-2"
                      >
                        <Download className="w-4 h-4" />
                        HTML
                      </Button>
                    </div>
                  </div>

                  <TabsContent value="summary" className="space-y-6">
                    <div className="flex items-start gap-6">
                      <ScoreGauge score={reportData.score} size="lg" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2">Executive Summary</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          {reportData.executiveSummary.overview}
                        </p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            Key Strengths
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-1 text-sm">
                            {safeArr(reportData.marketPerception?.keyStrengths).map((s, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2" />
                                {s}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-yellow-500" />
                            Critical Gaps
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-1 text-sm">
                            {safeArr(reportData.marketPerception?.criticalGaps).map((g, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-2" />
                                {g}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BarChart3 className="w-5 h-5" />
                          Strengths & Weaknesses Matrix
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <StrengthsWeaknessesMatrix matrix={reportData.strengthsWeaknesses} />
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="positioning" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="w-5 h-5" />
                          Brand Personality Matrix
                        </CardTitle>
                        <CardDescription>
                          How {entityName} is positioned across key brand dimensions
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <PersonalityMatrixChart matrix={reportData.brandPositioning.personalityMatrix} />
                      </CardContent>
                    </Card>

                    <div className="grid md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Target Audience Signals</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            {safeArr(reportData.brandPositioning?.targetAudienceSignals).map((s, i) => (
                              <Badge key={i} variant="outline">{s}</Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Differentiation Factors</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            {safeArr(reportData.brandPositioning?.differentiation).map((d, i) => (
                              <Badge key={i} variant="secondary">{d}</Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Trust Indicators</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="grid md:grid-cols-2 gap-2 text-sm">
                          {safeArr(reportData.brandPositioning?.trustIndicators).map((t, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              {t}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* SWOT Analysis Tab */}
                  {reportData.swotAnalysis && (
                    <TabsContent value="swot" className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-4">
                        <Card className="border-green-500/20">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              Strengths
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-1.5 text-sm">
                              {safeArr(reportData.swotAnalysis?.strengths).map((s, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                                  {s}
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>

                        <Card className="border-destructive/20">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-destructive" />
                              Weaknesses
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-1.5 text-sm">
                              {safeArr(reportData.swotAnalysis?.weaknesses).map((w, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-2 shrink-0" />
                                  {w}
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>

                        <Card className="border-primary/20">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <Lightbulb className="w-4 h-4 text-primary" />
                              Opportunities
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-1.5 text-sm">
                              {safeArr(reportData.swotAnalysis?.opportunities).map((o, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                                  {o}
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>

                        <Card className="border-amber-500/20">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <Swords className="w-4 h-4 text-amber-500" />
                              Threats
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-1.5 text-sm">
                              {safeArr(reportData.swotAnalysis?.threats).map((t, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                                  {t}
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>
                  )}

                  {/* Competitor Profiles Tab */}
                  {Array.isArray(reportData.competitorProfiles) && reportData.competitorProfiles.length > 0 && (
                    <TabsContent value="profiles" className="space-y-4">
                      {reportData.competitorProfiles.map((profile, i) => (
                        <Card key={i}>
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base flex items-center gap-2">
                                {profile.name}
                                <Badge variant={profile.type === 'direct' ? 'destructive' : profile.type === 'emerging' ? 'default' : 'secondary'} className="text-xs">
                                  {profile.type}
                                </Badge>
                              </CardTitle>
                              <div className="flex items-center gap-2">
                                <Badge variant={profile.threatLevel === 'high' ? 'destructive' : profile.threatLevel === 'medium' ? 'default' : 'secondary'} className="text-xs">
                                  {profile.threatLevel} threat
                                </Badge>
                                <span className="text-sm font-semibold">{profile.overallScore}/10</span>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="grid md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="font-medium mb-1">Brand Strength</p>
                                <p className="text-muted-foreground">{profile.brandStrength}</p>
                              </div>
                              <div>
                                <p className="font-medium mb-1">Visual Identity</p>
                                <p className="text-muted-foreground">{profile.visualIdentitySummary}</p>
                              </div>
                              <div>
                                <p className="font-medium mb-1">Key Differentiator</p>
                                <p className="text-muted-foreground">{profile.keyDifferentiator}</p>
                              </div>
                              <div>
                                <p className="font-medium mb-1">Biggest Weakness</p>
                                <p className="text-muted-foreground">{profile.biggestWeakness}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </TabsContent>
                  )}

                  {/* Content & Messaging Tab */}
                  {reportData.contentMessaging && (
                    <TabsContent value="content" className="space-y-6">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" />
                            Brand Tone & Voice
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">{reportData.contentMessaging.toneSummary}</p>
                        </CardContent>
                      </Card>

                      <div className="grid md:grid-cols-2 gap-4">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Messaging Pillars</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex flex-wrap gap-2">
                              {safeArr(reportData.contentMessaging?.messagingPillars).map((p, i) => (
                                <Badge key={i} variant="outline">{p}</Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Content Gaps</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-1 text-sm">
                              {safeArr(reportData.contentMessaging?.contentGaps).map((g, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                                  {g}
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      </div>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Content Strategy</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                          <div>
                            <span className="font-medium">Strategy Assessment:</span>
                            <p className="text-muted-foreground">{reportData.contentMessaging.contentStrategy}</p>
                          </div>
                          <div>
                            <span className="font-medium">Social Media:</span>
                            <p className="text-muted-foreground">{reportData.contentMessaging.socialMediaApproach}</p>
                          </div>
                          <div>
                            <span className="font-medium">Thought Leadership:</span>
                            <p className="text-muted-foreground">{reportData.contentMessaging.thoughtLeadership}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  )}

                  <TabsContent value="recommendations" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Target className="w-5 h-5" />
                          Design Priorities
                        </CardTitle>
                        <CardDescription>
                          Ranked by impact and effort required
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <DesignPriorityTable
                          priorities={safeObjArr(reportData.recommendations?.designPriorities)}
                          reportId={latestReport?.id}
                          onApprove={async (index, title) => {
                            if (latestReport?.id) {
                              await approveRecommendation(latestReport.id, index, title, 'design_priority');
                            }
                          }}
                          isUtilized={(index) => latestReport?.id ? isUtilized(latestReport.id, index, 'design_priority') : false}
                        />
                      </CardContent>
                    </Card>

                    <div className="grid md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Brand Refinements</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                          <div>
                            <span className="font-medium">Logo:</span>
                            <p className="text-muted-foreground">{reportData.recommendations.brandRefinements.logo}</p>
                          </div>
                          <div>
                            <span className="font-medium">Colors:</span>
                            <p className="text-muted-foreground">{reportData.recommendations.brandRefinements.colors}</p>
                          </div>
                          <div>
                            <span className="font-medium">Typography:</span>
                            <p className="text-muted-foreground">{reportData.recommendations.brandRefinements.typography}</p>
                          </div>
                          <div>
                            <span className="font-medium">Imagery:</span>
                            <p className="text-muted-foreground">{reportData.recommendations.brandRefinements.imagery}</p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Lightbulb className="w-4 h-4" />
                            Positioning Opportunities
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2 text-sm">
                            {safeArr(reportData.recommendations?.positioningOpportunities).map((o, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                                {o}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="action-plan" className="space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                      <h3 className="font-semibold text-lg">Top Priorities</h3>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-6">
                      {safeArr(reportData.executiveSummary?.topPriorities).map((p, i) => (
                        <Badge key={i} variant="default" className="text-sm py-1 px-3">
                          {i + 1}. {p}
                        </Badge>
                      ))}
                    </div>

                    {reportData.executiveSummary?.actionPlan && (
                      <ActionPlanTimeline actionPlan={reportData.executiveSummary.actionPlan} />
                    )}

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Success Metrics</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="grid md:grid-cols-2 gap-2 text-sm">
                          {safeArr(reportData.executiveSummary?.successMetrics).map((m, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <Target className="w-4 h-4 text-primary" />
                              {m}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Market Trends & Innovation Tab */}
                  {reportData.marketTrends && (
                    <TabsContent value="trends" className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-4">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <Zap className="w-4 h-4 text-primary" />
                              Industry Trends
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-1.5 text-sm">
                              {safeArr(reportData.marketTrends?.industryTrends).map((t, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                                  {t}
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <Lightbulb className="w-4 h-4 text-amber-500" />
                              Emerging Opportunities
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-1.5 text-sm">
                              {safeArr(reportData.marketTrends?.emergingOpportunities).map((o, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                                  {o}
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-destructive" />
                              Innovation Gaps
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-1.5 text-sm">
                              {safeArr(reportData.marketTrends?.innovationGaps).map((g, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-2 shrink-0" />
                                  {g}
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <Swords className="w-4 h-4 text-destructive" />
                              Disruption Risks
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-1.5 text-sm">
                              {safeArr(reportData.marketTrends?.disruptionRisks).map((r, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-2 shrink-0" />
                                  {r}
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      </div>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Technology Adoption</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">{reportData.marketTrends.technologyAdoption}</p>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  )}

                  {/* Regional Insights Tab */}
                  {reportData.regionalInsights && (
                    <TabsContent value="regional" className="space-y-6">
                      <div className="flex items-center gap-2 mb-2">
                        <Globe2 className="w-5 h-5 text-sky-500" />
                        <h3 className="font-semibold text-lg">Regional Market Insights</h3>
                        {(reportData.country || reportData.region) && (
                          <Badge variant="outline" className="gap-1">
                            <MapPin className="w-3 h-3" />
                            {reportData.country || reportData.region}
                          </Badge>
                        )}
                      </div>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Market Context</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            {reportData.regionalInsights.marketContext}
                          </p>
                        </CardContent>
                      </Card>

                      <div className="grid md:grid-cols-2 gap-4">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <Users className="w-4 h-4 text-sky-500" />
                              Local Competitors
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex flex-wrap gap-2">
                              {safeArr(reportData.regionalInsights?.localCompetitors).map((c, i) => (
                                <Badge key={i} variant="secondary">{c}</Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <Lightbulb className="w-4 h-4 text-amber-500" />
                              Market Opportunities
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-1 text-sm">
                              {safeArr(reportData.regionalInsights?.marketOpportunities).map((o, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2" />
                                  {o}
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      </div>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Cultural Considerations</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            {safeArr(reportData.regionalInsights?.culturalConsiderations).map((c, i) => (
                              <Badge key={i} variant="outline">{c}</Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      <div className="grid md:grid-cols-2 gap-4">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <Target className="w-4 h-4 text-primary" />
                              Localization Priorities
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-1 text-sm">
                              {safeArr(reportData.regionalInsights?.localizationPriorities).map((p, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                                  {p}
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-destructive" />
                              Entry Barriers
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-1 text-sm">
                              {safeArr(reportData.regionalInsights?.entryBarriers).map((b, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-2" />
                                  {b}
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      </div>

                      {reportData.regionalInsights.regulatoryConsiderations && (
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Regulatory Considerations</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground">
                              {reportData.regionalInsights.regulatoryConsiderations}
                            </p>
                          </CardContent>
                        </Card>
                      )}
                    </TabsContent>
                  )}
                </Tabs>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
