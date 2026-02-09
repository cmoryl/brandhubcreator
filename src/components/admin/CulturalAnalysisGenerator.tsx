/**
 * Cultural Analysis Generator
 * Allows admins to generate cultural analysis reports for brands, products, and events
 * Scoped to current organization for data isolation
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Globe2, Play, Loader2, CheckCircle2, AlertCircle, 
  Brain, Sparkles, FileText, AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

interface EntityOption {
  id: string;
  name: string;
  type: 'brand' | 'product' | 'event';
  hasAnalysis: boolean;
  lastAnalyzed?: string;
}

export const CulturalAnalysisGenerator: React.FC = () => {
  const queryClient = useQueryClient();
  const { organization } = useOrganization();
  const [selectedEntity, setSelectedEntity] = useState<string>('');
  const [analysisType, setAnalysisType] = useState<'cultural' | 'full'>('cultural');

  // Fetch entities scoped to current organization with their analysis status
  const { data: entities, isLoading: entitiesLoading, error: entitiesError } = useQuery({
    queryKey: ['cultural-analysis-entities', organization?.id],
    queryFn: async () => {
      if (!organization?.id) {
        return [];
      }

      const [brands, products, events, intelligence] = await Promise.all([
        supabase.from('brands').select('id, name').eq('organization_id', organization.id),
        supabase.from('products').select('id, name').eq('organization_id', organization.id),
        supabase.from('events').select('id, name').eq('organization_id', organization.id),
        supabase.from('brand_intelligence')
          .select('entity_id, entity_type, last_analyzed_at, cultural_insights')
          .eq('organization_id', organization.id),
      ]);

      // Check for errors in any query
      if (brands.error) throw new Error(`Failed to fetch brands: ${brands.error.message}`);
      if (products.error) throw new Error(`Failed to fetch products: ${products.error.message}`);
      if (events.error) throw new Error(`Failed to fetch events: ${events.error.message}`);

      const intelligenceMap = new Map<string, { lastAnalyzed?: string; hasCultural: boolean }>();
      intelligence.data?.forEach(i => {
        intelligenceMap.set(i.entity_id, {
          lastAnalyzed: i.last_analyzed_at || undefined,
          hasCultural: !!i.cultural_insights,
        });
      });

      const allEntities: EntityOption[] = [];

      brands.data?.forEach(b => {
        const intel = intelligenceMap.get(b.id);
        allEntities.push({
          id: b.id,
          name: b.name,
          type: 'brand',
          hasAnalysis: intel?.hasCultural || false,
          lastAnalyzed: intel?.lastAnalyzed,
        });
      });

      products.data?.forEach(p => {
        const intel = intelligenceMap.get(p.id);
        allEntities.push({
          id: p.id,
          name: p.name,
          type: 'product',
          hasAnalysis: intel?.hasCultural || false,
          lastAnalyzed: intel?.lastAnalyzed,
        });
      });

      events.data?.forEach(e => {
        const intel = intelligenceMap.get(e.id);
        allEntities.push({
          id: e.id,
          name: e.name,
          type: 'event',
          hasAnalysis: intel?.hasCultural || false,
          lastAnalyzed: intel?.lastAnalyzed,
        });
      });

      return allEntities;
    },
    enabled: !!organization?.id,
  });

  // Generate cultural analysis mutation with async job handling
  const generateAnalysis = useMutation({
    mutationFn: async ({ entityId, entityType }: { entityId: string; entityType: string }) => {
      // Start brand intelligence analysis (returns job_id now)
      const { data: jobResult, error: intelligenceError } = await supabase.functions.invoke('brand-intelligence', {
        body: {
          action: 'analyze',
          entityType,
          entityId,
          organizationId: organization?.id,
        },
      });

      if (intelligenceError) {
        if (intelligenceError.message?.includes('429') || intelligenceError.message?.includes('rate limit')) {
          throw new Error('Rate limit exceeded. Please wait a moment before trying again.');
        }
        if (intelligenceError.message?.includes('402')) {
          throw new Error('AI credits exhausted. Please add credits to continue.');
        }
        throw intelligenceError;
      }

      if (!jobResult?.job_id) {
        throw new Error('Failed to start analysis job');
      }

      // Poll for job completion
      let attempts = 0;
      const maxAttempts = 60; // 2 minutes max
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const { data: job } = await supabase
          .from('brand_intelligence_jobs')
          .select('*')
          .eq('id', jobResult.job_id)
          .maybeSingle();

        if (job?.status === 'completed') {
          // Then generate research briefing
          const { data: researchResult, error: researchError } = await supabase.functions.invoke('brand-research', {
            body: {
              entityId,
              entityType,
              briefingType: 'deep-dive',
              focusAreas: ['multicultural marketing', 'localization', 'cultural adaptation', 'GlobalLink opportunities'],
            },
          });

          if (researchError) {
            if (researchError.message?.includes('429') || researchError.message?.includes('rate limit')) {
              throw new Error('Rate limit exceeded. Please wait a moment before trying again.');
            }
            if (researchError.message?.includes('402')) {
              throw new Error('AI credits exhausted. Please add credits to continue.');
            }
            throw researchError;
          }

          return { intelligence: job.result, research: researchResult };
        }

        if (job?.status === 'failed') {
          throw new Error(job.error_message || 'Analysis failed');
        }

        attempts++;
      }

      throw new Error('Analysis timed out');
    },
    onSuccess: (data, variables) => {
      const entity = entities?.find(e => e.id === variables.entityId);
      toast.success('Cultural analysis generated', {
        description: `Analysis complete for ${entity?.name || 'entity'}`,
      });
      queryClient.invalidateQueries({ queryKey: ['cultural-analysis-entities', organization?.id] });
      queryClient.invalidateQueries({ queryKey: ['admin-multicultural-intelligence', organization?.id] });
      queryClient.invalidateQueries({ queryKey: ['admin-multicultural-briefings', organization?.id] });
    },
    onError: (error) => {
      console.error('Cultural analysis error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      
      if (message.includes('Rate limit') || message.includes('timed out')) {
        toast.error('Rate Limited', {
          description: message,
          duration: 6000,
        });
      } else if (message.includes('credits')) {
        toast.error('Credits Exhausted', {
          description: message,
          action: { label: 'Add Credits', onClick: () => window.open('/settings', '_blank') },
        });
      } else {
        toast.error('Analysis failed', { description: message });
      }
    },
  });

  // Batch generate for all entities without analysis with async job handling
  const generateBatch = useMutation({
    mutationFn: async () => {
      const entitiesWithoutAnalysis = entities?.filter(e => !e.hasAnalysis) || [];
      const results: Array<{ entity: EntityOption; success: boolean; error?: unknown }> = [];

      for (const entity of entitiesWithoutAnalysis.slice(0, 5)) { // Limit to 5 at a time
        try {
          const { data, error } = await supabase.functions.invoke('brand-intelligence', {
            body: {
              action: 'analyze',
              entityType: entity.type,
              entityId: entity.id,
              organizationId: organization?.id,
            },
          });
          
          if (error) {
            if (error.message?.includes('429') || error.message?.includes('rate limit')) {
              toast.warning(`Rate limited - waiting before continuing...`);
              await new Promise(resolve => setTimeout(resolve, 5000));
              results.push({ entity, success: false, error: 'Rate limited' });
              continue;
            }
            throw error;
          }

          if (!data?.job_id) {
            results.push({ entity, success: false, error: 'No job ID returned' });
            continue;
          }

          // Wait for job to complete (with timeout)
          let attempts = 0;
          const maxAttempts = 30;
          while (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const { data: job } = await supabase
              .from('brand_intelligence_jobs')
              .select('status, error_message')
              .eq('id', data.job_id)
              .maybeSingle();

            if (job?.status === 'completed') {
              results.push({ entity, success: true });
              break;
            }
            if (job?.status === 'failed') {
              results.push({ entity, success: false, error: job.error_message });
              break;
            }
            attempts++;
          }

          if (attempts >= maxAttempts) {
            results.push({ entity, success: false, error: 'Timeout' });
          }
          
          // Add delay between requests
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (err) {
          results.push({ entity, success: false, error: err });
        }
      }

      return results;
    },
    onSuccess: (results) => {
      const successCount = results.filter(r => r.success).length;
      toast.success(`Batch analysis complete`, {
        description: `${successCount}/${results.length} analyses generated successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ['cultural-analysis-entities', organization?.id] });
      queryClient.invalidateQueries({ queryKey: ['admin-multicultural-intelligence', organization?.id] });
    },
    onError: (error) => {
      console.error('Batch analysis error:', error);
      toast.error('Batch analysis failed', {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    },
  });

  const handleGenerate = () => {
    if (!selectedEntity) {
      toast.error('Please select an entity');
      return;
    }

    const entity = entities?.find(e => e.id === selectedEntity);
    if (!entity) return;

    generateAnalysis.mutate({ entityId: entity.id, entityType: entity.type });
  };

  const selectedEntityData = entities?.find(e => e.id === selectedEntity);
  const entitiesWithoutAnalysis = entities?.filter(e => !e.hasAnalysis) || [];
  const entitiesWithAnalysis = entities?.filter(e => e.hasAnalysis) || [];

  // Handle no organization selected
  if (!organization?.id) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-warning" />
            <p>Please select an organization to generate cultural analysis.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Handle loading state
  if (entitiesLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <Loader2 className="h-8 w-8 mx-auto mb-3 animate-spin" />
            <p>Loading entities...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Handle error state
  if (entitiesError) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-destructive">
            <AlertCircle className="h-12 w-12 mx-auto mb-3" />
            <p>Failed to load entities</p>
            <p className="text-sm text-muted-foreground mt-1">
              {entitiesError instanceof Error ? entitiesError.message : 'Unknown error'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Generate New Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Generate Cultural Analysis
          </CardTitle>
          <CardDescription>
            Run AI-powered cultural analysis to identify localization opportunities and GlobalLink recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Entity</label>
              <Select value={selectedEntity} onValueChange={setSelectedEntity}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a brand, product, or event" />
                </SelectTrigger>
                <SelectContent>
                  {entities?.map(entity => (
                    <SelectItem key={entity.id} value={entity.id}>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {entity.type}
                        </Badge>
                        <span>{entity.name}</span>
                        {entity.hasAnalysis && (
                          <CheckCircle2 className="h-3 w-3 text-primary ml-1" />
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Analysis Type</label>
              <Select value={analysisType} onValueChange={(v) => setAnalysisType(v as 'cultural' | 'full')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cultural">
                    <div className="flex items-center gap-2">
                      <Globe2 className="h-4 w-4" />
                      Cultural Focus
                    </div>
                  </SelectItem>
                  <SelectItem value="full">
                    <div className="flex items-center gap-2">
                      <Brain className="h-4 w-4" />
                      Full Analysis + Research
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                onClick={handleGenerate}
                disabled={!selectedEntity || generateAnalysis.isPending}
                className="w-full"
              >
                {generateAnalysis.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Generate Analysis
                  </>
                )}
              </Button>
            </div>
          </div>

          {selectedEntityData && (
            <div className="p-3 rounded-lg bg-muted/50 border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{selectedEntityData.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedEntityData.type.charAt(0).toUpperCase() + selectedEntityData.type.slice(1)}
                  </p>
                </div>
                {selectedEntityData.hasAnalysis ? (
                  <div className="text-right">
                    <Badge variant="secondary" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Has Analysis
                    </Badge>
                    {selectedEntityData.lastAnalyzed && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Last: {new Date(selectedEntityData.lastAnalyzed).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ) : (
                  <Badge variant="outline" className="gap-1">
                    <AlertCircle className="h-3 w-3" />
                    No Analysis Yet
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Batch Generation */}
      {entitiesWithoutAnalysis.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Batch Analysis
            </CardTitle>
            <CardDescription>
              {entitiesWithoutAnalysis.length} entities without cultural analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Generate cultural analysis for up to 5 entities at once
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => generateBatch.mutate()}
                disabled={generateBatch.isPending}
              >
                {generateBatch.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Analyze Next 5
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Status */}
      <Card>
        <CardHeader>
          <CardTitle>Analysis Coverage</CardTitle>
          <CardDescription>
            {entitiesWithAnalysis.length} of {entities?.length || 0} entities have cultural analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[200px]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {entities?.map(entity => (
                <div 
                  key={entity.id}
                  className={`p-2 rounded-lg border text-sm flex items-center justify-between ${
                    entity.hasAnalysis ? 'bg-primary/5 border-primary/20' : 'bg-muted/30'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Badge variant="outline" className="text-xs shrink-0">
                      {entity.type.charAt(0).toUpperCase()}
                    </Badge>
                    <span className="truncate">{entity.name}</span>
                  </div>
                  {entity.hasAnalysis ? (
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default CulturalAnalysisGenerator;
