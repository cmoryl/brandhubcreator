/**
 * Hook for portfolio relationships and coherence data
 */
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export interface PortfolioRelationship {
  id: string;
  organization_id: string;
  source_entity_id: string;
  source_entity_type: string;
  source_entity_name: string;
  target_entity_id: string;
  target_entity_type: string;
  target_entity_name: string;
  relationship_type: string;
  strength_score: number;
  rationale: string | null;
  dimensions: Record<string, number>;
  anomaly_type: string | null;
  anomaly_score: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface PortfolioCoherence {
  id: string;
  organization_id: string;
  overall_score: number;
  voice_coherence: number;
  visual_coherence: number;
  audience_coherence: number;
  strategic_coherence: number;
  anomaly_count: number;
  anomalies: Array<{ type?: string; entity_id?: string; score?: number; [key: string]: unknown }>;
  insights: string[];
  entity_count: number;
  relationship_count: number;
  updated_at: string;
}

export interface GraphNode {
  id: string;
  name: string;
  type: 'brand' | 'product' | 'event';
  x: number;
  y: number;
  vx: number;
  vy: number;
  hasAnomaly?: boolean;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  strength: number;
  rationale?: string;
  dimensions?: Record<string, number>;
  anomalyType?: string | null;
  anomalyScore?: number | null;
}

export function usePortfolioRelationships(organizationId: string | null) {
  const queryClient = useQueryClient();

  const { data: relationships = [], isLoading } = useQuery({
    queryKey: ['portfolio-relationships', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from('portfolio_relationships')
        .select('*')
        .eq('organization_id', organizationId)
        .order('strength_score', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as PortfolioRelationship[];
    },
    enabled: !!organizationId,
  });

  const { data: coherence = null } = useQuery({
    queryKey: ['portfolio-coherence', organizationId],
    queryFn: async () => {
      if (!organizationId) return null;
      const { data, error } = await supabase
        .from('portfolio_coherence')
        .select('*')
        .eq('organization_id', organizationId)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as PortfolioCoherence | null;
    },
    enabled: !!organizationId,
  });

  // Derive graph data from relationships
  const graphData = useCallback(() => {
    const nodeMap = new Map<string, GraphNode>();
    const edges: GraphEdge[] = [];
    const anomalyEntityIds = new Set<string>();

    // First pass: collect anomaly entities
    for (const rel of relationships) {
      if (rel.anomaly_type) {
        anomalyEntityIds.add(rel.source_entity_id);
        anomalyEntityIds.add(rel.target_entity_id);
      }
    }

    for (const rel of relationships) {
      if (!nodeMap.has(rel.source_entity_id)) {
        nodeMap.set(rel.source_entity_id, {
          id: rel.source_entity_id,
          name: rel.source_entity_name,
          type: rel.source_entity_type as GraphNode['type'],
          x: Math.random() * 600 + 100,
          y: Math.random() * 400 + 50,
          vx: 0,
          vy: 0,
          hasAnomaly: anomalyEntityIds.has(rel.source_entity_id),
        });
      }
      if (!nodeMap.has(rel.target_entity_id)) {
        nodeMap.set(rel.target_entity_id, {
          id: rel.target_entity_id,
          name: rel.target_entity_name,
          type: rel.target_entity_type as GraphNode['type'],
          x: Math.random() * 600 + 100,
          y: Math.random() * 400 + 50,
          vx: 0,
          vy: 0,
          hasAnomaly: anomalyEntityIds.has(rel.target_entity_id),
        });
      }
      edges.push({
        id: rel.id,
        source: rel.source_entity_id,
        target: rel.target_entity_id,
        type: rel.relationship_type,
        strength: rel.strength_score || 50,
        rationale: rel.rationale || (rel.metadata?.rationale as string | undefined),
        dimensions: rel.dimensions,
        anomalyType: rel.anomaly_type,
        anomalyScore: rel.anomaly_score,
      });
    }

    return { nodes: Array.from(nodeMap.values()), edges };
  }, [relationships]);

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: ['portfolio-relationships', organizationId] });
    queryClient.invalidateQueries({ queryKey: ['portfolio-coherence', organizationId] });
  };

  return { relationships, coherence, graphData, isLoading, refetch };
}
