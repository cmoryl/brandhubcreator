/**
 * Hook for portfolio relationships data
 */
import { useState, useCallback } from 'react';
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
  metadata: Record<string, any>;
  created_at: string;
}

export interface GraphNode {
  id: string;
  name: string;
  type: 'brand' | 'product' | 'event';
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  strength: number;
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
      return (data || []) as PortfolioRelationship[];
    },
    enabled: !!organizationId,
  });

  // Derive graph data from relationships
  const graphData = useCallback(() => {
    const nodeMap = new Map<string, GraphNode>();
    const edges: GraphEdge[] = [];

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
        });
      }
      edges.push({
        id: rel.id,
        source: rel.source_entity_id,
        target: rel.target_entity_id,
        type: rel.relationship_type,
        strength: rel.strength_score || 50,
      });
    }

    return { nodes: Array.from(nodeMap.values()), edges };
  }, [relationships]);

  const refetch = () => queryClient.invalidateQueries({ queryKey: ['portfolio-relationships', organizationId] });

  return { relationships, graphData, isLoading, refetch };
}
