/**
 * ResearchBriefingsPanel - Admin dashboard panel for viewing research briefings across all entities
 * Now with: auto-scheduling, external sources, cross-entity synthesis, and knowledge pipeline badges
 */

import React, { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Microscope, Brain, RefreshCw, Search, Filter, Clock, 
  TrendingUp, AlertTriangle, Sparkles, ChevronRight, Building2,
  Loader2, Zap, Calendar, Link2, BookOpen, Globe, Plus, Trash2, X
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { BrandResearchBriefing } from './BrandResearchBriefing';
import { ReportEntitySelector } from './ReportEntitySelector';
import { useResearchSchedules, useExternalSources } from '@/hooks/useResearchBriefings';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface BriefingSummary {
  id: string;
  entity_id: string;
  entity_type: string;
  title: string;
  summary: string | null;
  confidence_score: number;
  urgency_level: string;
  status: string;
  created_at: string;
  entity_name?: string;
  knowledge_extracted?: boolean;
  cross_entity_insights?: Record<string, unknown> | null;
}

export function ResearchBriefingsPanel() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedBriefing, setSelectedBriefing] = useState<BriefingSummary | null>(null);
  const [showSchedules, setShowSchedules] = useState(false);

  // Fetch org id from membership
  const { data: orgData } = useQuery({
    queryKey: ['user-org-id', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user!.id)
        .limit(1)
        .single();
      return data?.organization_id || null;
    },
    enabled: !!user?.id,
  });
  const orgId = orgData || null;

  // Generate briefing state
  const [generateEntityType, setGenerateEntityType] = useState<'brands' | 'products' | 'events'>('brands');
  const [selectedEntityIds, setSelectedEntityIds] = useState<string[]>([]);
  const [briefingType, setBriefingType] = useState<'daily' | 'weekly' | 'deep-dive'>('daily');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingEntityId, setGeneratingEntityId] = useState<string | null>(null);

  // Schedule management
  const { schedules, upsertSchedule } = useResearchSchedules(orgId);
  const activeSchedules = schedules?.filter(s => s.is_active) || [];

  const entityTypeMap: Record<string, 'brand' | 'product' | 'event'> = {
    brands: 'brand',
    products: 'product',
    events: 'event',
  };

  const generateBriefingsForSelected = useCallback(async () => {
    if (selectedEntityIds.length === 0) {
      toast.error('Select at least one entity');
      return;
    }
    setIsGenerating(true);
    let successCount = 0;
    let failCount = 0;

    for (const entityId of selectedEntityIds) {
      setGeneratingEntityId(entityId);
      try {
        const { error } = await supabase.functions.invoke('brand-research', {
          body: {
            entityId,
            entityType: entityTypeMap[generateEntityType],
            briefingType,
            focusAreas: [],
          },
        });
        if (error) throw error;
        successCount++;
      } catch (err) {
        console.error(`Failed to generate briefing for ${entityId}:`, err);
        failCount++;
      }
    }

    setIsGenerating(false);
    setGeneratingEntityId(null);

    if (successCount > 0) {
      toast.success(`Generated ${successCount} briefing${successCount > 1 ? 's' : ''}`);
      refetch();
    }
    if (failCount > 0) {
      toast.error(`${failCount} briefing${failCount > 1 ? 's' : ''} failed`);
    }
  }, [selectedEntityIds, generateEntityType, briefingType]);

  // Fetch all briefings across entities
  const { data: briefings, isLoading, refetch } = useQuery({
    queryKey: ['admin-research-briefings', filterType, filterStatus],
    queryFn: async () => {
      let query = supabase
        .from('research_briefings')
        .select('id, entity_id, entity_type, title, summary, confidence_score, urgency_level, status, created_at, knowledge_extracted, cross_entity_insights')
        .order('created_at', { ascending: false })
        .limit(50);

      if (filterType !== 'all') {
        query = query.eq('entity_type', filterType);
      }

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Enrich with entity names
      const enrichedData = await Promise.all(
        (data || []).map(async (briefing) => {
          let entityName = 'Unknown';
          
          if (briefing.entity_type === 'brand') {
            const { data: brand } = await supabase
              .from('brands')
              .select('name')
              .eq('id', briefing.entity_id)
              .single();
            entityName = brand?.name || 'Unknown Brand';
          } else if (briefing.entity_type === 'product') {
            const { data: product } = await supabase
              .from('products')
              .select('name')
              .eq('id', briefing.entity_id)
              .single();
            entityName = product?.name || 'Unknown Product';
          } else if (briefing.entity_type === 'event') {
            const { data: event } = await supabase
              .from('events')
              .select('name')
              .eq('id', briefing.entity_id)
              .single();
            entityName = event?.name || 'Unknown Event';
          }

          return { ...briefing, entity_name: entityName };
        })
      );

      return enrichedData as BriefingSummary[];
    },
  });

  const filteredBriefings = briefings?.filter(b => 
    b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.entity_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'normal': return 'bg-blue-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-muted';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'default';
      case 'read': return 'secondary';
      case 'actioned': return 'outline';
      case 'archived': return 'secondary';
      default: return 'outline';
    }
  };

  // Stats
  const totalBriefings = briefings?.length || 0;
  const newBriefings = briefings?.filter(b => b.status === 'new').length || 0;
  const criticalBriefings = briefings?.filter(b => b.urgency_level === 'critical' || b.urgency_level === 'high').length || 0;
  const avgConfidence = briefings?.length 
    ? Math.round(briefings.reduce((sum, b) => sum + b.confidence_score, 0) / briefings.length) 
    : 0;

  if (selectedBriefing) {
    return (
      <div className="space-y-4">
        <Button 
          variant="ghost" 
          onClick={() => setSelectedBriefing(null)}
          className="gap-2"
        >
          ← Back to All Briefings
        </Button>
        
        <div className="flex items-center gap-2 mb-4">
          <Badge variant="outline">{selectedBriefing.entity_type}</Badge>
          <span className="text-lg font-semibold">{selectedBriefing.entity_name}</span>
        </div>

        <BrandResearchBriefing 
          entityId={selectedBriefing.entity_id}
          entityType={selectedBriefing.entity_type as 'brand' | 'product' | 'event'}
          entityName={selectedBriefing.entity_name || 'Entity'}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Microscope className="h-6 w-6 text-primary" />
            Research Briefings
          </h2>
          <p className="text-muted-foreground">
            AI-powered research intelligence across all brands, products, and events
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeSchedules.length > 0 && (
            <Badge variant="outline" className="gap-1">
              <Calendar className="h-3 w-3" />
              {activeSchedules.length} scheduled
            </Badge>
          )}
          <Button onClick={() => refetch()} disabled={isLoading} variant="outline" size="sm">
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Brain className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalBriefings}</p>
                <p className="text-xs text-muted-foreground">Total Briefings</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Sparkles className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{newBriefings}</p>
                <p className="text-xs text-muted-foreground">New / Unread</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{criticalBriefings}</p>
                <p className="text-xs text-muted-foreground">High Priority</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{avgConfidence}%</p>
                <p className="text-xs text-muted-foreground">Avg Confidence</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Generate Briefing */}
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            Generate Research Briefing
          </CardTitle>
          <CardDescription className="text-xs">Select specific entities to generate AI-powered research briefings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Entity Type</label>
              <Select value={generateEntityType} onValueChange={(v) => { setGenerateEntityType(v as any); setSelectedEntityIds([]); }}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="brands">Brands</SelectItem>
                  <SelectItem value="products">Products</SelectItem>
                  <SelectItem value="events">Events</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Select Entities</label>
              <ReportEntitySelector
                entityType={generateEntityType}
                selectedIds={selectedEntityIds}
                onSelectionChange={setSelectedEntityIds}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Briefing Depth</label>
              <Select value={briefingType} onValueChange={(v) => setBriefingType(v as any)}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Quick Scan</SelectItem>
                  <SelectItem value="weekly">Weekly Review</SelectItem>
                  <SelectItem value="deep-dive">Deep Dive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={generateBriefingsForSelected}
              disabled={isGenerating || selectedEntityIds.length === 0}
              className="gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating ({selectedEntityIds.indexOf(generatingEntityId!) + 1}/{selectedEntityIds.length})...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  Generate {selectedEntityIds.length > 0 ? `(${selectedEntityIds.length})` : ''}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search briefings..." 
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="brand">Brands</SelectItem>
                  <SelectItem value="product">Products</SelectItem>
                  <SelectItem value="event">Events</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                  <SelectItem value="actioned">Actioned</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredBriefings?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Microscope className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">No research briefings yet</p>
                <p className="text-sm">Use the generator above to create briefings for specific entities</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredBriefings?.map((briefing) => (
                  <button
                    key={briefing.id}
                    onClick={() => setSelectedBriefing(briefing)}
                    className="w-full p-4 text-left hover:bg-muted/50 transition-colors flex items-center gap-4"
                  >
                    <div className="flex-shrink-0">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        briefing.status === 'new' ? "bg-primary/10" : "bg-muted"
                      )}>
                        <Brain className={cn(
                          "h-5 w-5",
                          briefing.status === 'new' ? "text-primary" : "text-muted-foreground"
                        )} />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium truncate">{briefing.title}</span>
                        {briefing.status === 'new' && (
                          <Badge variant="default" className="text-xs">New</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline" className="text-xs">
                          {briefing.entity_type}
                        </Badge>
                        <span className="truncate">{briefing.entity_name}</span>
                        <span className="text-muted-foreground/50">•</span>
                        <Clock className="h-3 w-3" />
                        <span>{formatDistanceToNow(new Date(briefing.created_at), { addSuffix: true })}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <Badge className={cn("text-xs", getUrgencyColor(briefing.urgency_level))}>
                        {briefing.urgency_level}
                      </Badge>
                      <span className="text-sm font-medium">{briefing.confidence_score}%</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
