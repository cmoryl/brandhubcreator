/**
 * Cultural Analysis Generator
 * Allows admins to generate cultural analysis reports for brands, products, and events
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Globe2, Play, Loader2, CheckCircle2, AlertCircle, 
  Brain, Sparkles, FileText
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
  const [selectedEntity, setSelectedEntity] = useState<string>('');
  const [analysisType, setAnalysisType] = useState<'cultural' | 'full'>('cultural');

  // Fetch all entities with their analysis status
  const { data: entities, isLoading: entitiesLoading } = useQuery({
    queryKey: ['cultural-analysis-entities'],
    queryFn: async () => {
      const [brands, products, events, intelligence] = await Promise.all([
        supabase.from('brands').select('id, name'),
        supabase.from('products').select('id, name'),
        supabase.from('events').select('id, name'),
        supabase.from('brand_intelligence').select('entity_id, entity_type, last_analyzed_at, cultural_insights'),
      ]);

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
  });

  // Generate cultural analysis mutation
  const generateAnalysis = useMutation({
    mutationFn: async ({ entityId, entityType }: { entityId: string; entityType: string }) => {
      // First, run brand intelligence analysis
      const { data: intelligenceResult, error: intelligenceError } = await supabase.functions.invoke('brand-intelligence', {
        body: {
          action: 'analyze',
          entityType,
          entityId,
        },
      });

      if (intelligenceError) throw intelligenceError;

      // Then generate a research briefing with multicultural focus
      const { data: researchResult, error: researchError } = await supabase.functions.invoke('brand-research', {
        body: {
          entityId,
          entityType,
          briefingType: 'deep-dive',
          focusAreas: ['multicultural marketing', 'localization', 'cultural adaptation', 'GlobalLink opportunities'],
        },
      });

      if (researchError) throw researchError;

      return { intelligence: intelligenceResult, research: researchResult };
    },
    onSuccess: (data, variables) => {
      const entity = entities?.find(e => e.id === variables.entityId);
      toast.success('Cultural analysis generated', {
        description: `Analysis complete for ${entity?.name || 'entity'}`,
      });
      queryClient.invalidateQueries({ queryKey: ['cultural-analysis-entities'] });
      queryClient.invalidateQueries({ queryKey: ['admin-multicultural-intelligence'] });
      queryClient.invalidateQueries({ queryKey: ['admin-multicultural-briefings'] });
    },
    onError: (error) => {
      console.error('Cultural analysis error:', error);
      toast.error('Analysis failed', {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    },
  });

  // Batch generate for all entities without analysis
  const generateBatch = useMutation({
    mutationFn: async () => {
      const entitiesWithoutAnalysis = entities?.filter(e => !e.hasAnalysis) || [];
      const results = [];

      for (const entity of entitiesWithoutAnalysis.slice(0, 5)) { // Limit to 5 at a time
        try {
          await supabase.functions.invoke('brand-intelligence', {
            body: {
              action: 'analyze',
              entityType: entity.type,
              entityId: entity.id,
            },
          });
          results.push({ entity, success: true });
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
      queryClient.invalidateQueries({ queryKey: ['cultural-analysis-entities'] });
      queryClient.invalidateQueries({ queryKey: ['admin-multicultural-intelligence'] });
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
