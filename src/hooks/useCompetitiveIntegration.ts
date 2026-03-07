/**
 * Competitive Integration Hook
 * Syncs competitive analysis reports into brand_intelligence.competitive_landscape
 */

import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface CompetitiveLandscape {
  last_synced: string;
  competitors: string[];
  positioning_summary: string;
  competitive_gaps: string[];
  differentiation_opportunities: string[];
  threat_assessment: string;
  reports_count: number;
}

export function useCompetitiveIntegration(
  entityId: string | undefined,
  entityType: 'brand' | 'product' | 'event',
  organizationId: string | null | undefined
) {
  /**
   * Sync competitive analysis reports to brand intelligence
   * Call this after generating a new competitive report
   */
  const syncCompetitiveLandscape = useCallback(async () => {
    if (!entityId) return null;

    try {
      // Fetch the 3 most recent competitive reports
      const { data: reports, error: reportsError } = await supabase
        .from('competitive_analysis_reports')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false })
        .limit(3);

      if (reportsError) throw reportsError;
      if (!reports || reports.length === 0) {
        logger.sync('CompetitiveIntegration: No reports to sync');
        return null;
      }

      // Aggregate competitive landscape from reports
      const latestReport = reports[0];
      const reportData = latestReport.report_data as Record<string, any>;
      const allCompetitors = new Set<string>();
      
      reports.forEach(r => {
        const comps = (r.competitors as string[]) || [];
        comps.forEach(c => allCompetitors.add(c));
      });

      const landscape = {
        last_synced: new Date().toISOString(),
        competitors: Array.from(allCompetitors),
        positioning_summary: reportData?.executive_summary || reportData?.summary || '',
        competitive_gaps: extractGaps(reportData),
        differentiation_opportunities: extractOpportunities(reportData),
        threat_assessment: extractThreats(reportData),
        reports_count: reports.length,
      } as unknown as Record<string, unknown>;

      // Update brand_intelligence with competitive landscape
      const { data: existingIntel } = await supabase
        .from('brand_intelligence')
        .select('id')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .maybeSingle();

      if (existingIntel) {
        const { error: updateError } = await supabase
          .from('brand_intelligence')
          .update({
            competitive_landscape: landscape as any,
          })
          .eq('entity_type', entityType)
          .eq('entity_id', entityId);

        if (updateError) throw updateError;
      } else {
        // Create new record
        const { error: insertError } = await supabase
          .from('brand_intelligence')
          .insert({
            entity_type: entityType,
            entity_id: entityId,
            organization_id: organizationId,
            competitive_landscape: landscape as any,
            knowledge_entries: [],
          });
        
        if (insertError) throw insertError;
      }

      logger.sync('CompetitiveIntegration: Synced competitive landscape', landscape);
      return landscape;
    } catch (err) {
      console.error('[CompetitiveIntegration] Sync failed:', err);
      return null;
    }
  }, [entityId, entityType, organizationId]);

  /**
   * Fetch favorite competitors for this organization
   */
  const fetchFavoriteCompetitors = useCallback(async (): Promise<string[]> => {
    if (!organizationId) return [];

    try {
      const { data, error } = await supabase
        .from('favorite_competitors')
        .select('name')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return (data || []).map(c => c.name);
    } catch (err) {
      console.error('[CompetitiveIntegration] Failed to fetch favorites:', err);
      return [];
    }
  }, [organizationId]);

  return {
    syncCompetitiveLandscape,
    fetchFavoriteCompetitors,
  };
}

// Helper functions to extract structured data from report
function extractGaps(reportData: Record<string, any>): string[] {
  const gaps: string[] = [];
  
  if (reportData?.competitive_gaps) {
    if (Array.isArray(reportData.competitive_gaps)) {
      gaps.push(...reportData.competitive_gaps);
    }
  }
  
  if (reportData?.weaknesses && Array.isArray(reportData.weaknesses)) {
    gaps.push(...reportData.weaknesses.slice(0, 3));
  }
  
  if (reportData?.swot?.weaknesses && Array.isArray(reportData.swot.weaknesses)) {
    gaps.push(...reportData.swot.weaknesses.slice(0, 3));
  }
  
  return [...new Set(gaps)].slice(0, 5);
}

function extractOpportunities(reportData: Record<string, any>): string[] {
  const opps: string[] = [];
  
  if (reportData?.differentiation_opportunities) {
    if (Array.isArray(reportData.differentiation_opportunities)) {
      opps.push(...reportData.differentiation_opportunities);
    }
  }
  
  if (reportData?.opportunities && Array.isArray(reportData.opportunities)) {
    opps.push(...reportData.opportunities.slice(0, 3));
  }
  
  if (reportData?.swot?.opportunities && Array.isArray(reportData.swot.opportunities)) {
    opps.push(...reportData.swot.opportunities.slice(0, 3));
  }
  
  if (reportData?.recommendations && Array.isArray(reportData.recommendations)) {
    opps.push(...reportData.recommendations.map((r: any) => 
      typeof r === 'string' ? r : r.recommendation || r.title || ''
    ).filter(Boolean).slice(0, 3));
  }
  
  return [...new Set(opps)].slice(0, 5);
}

function extractThreats(reportData: Record<string, any>): string {
  if (reportData?.threat_assessment) {
    return typeof reportData.threat_assessment === 'string' 
      ? reportData.threat_assessment 
      : JSON.stringify(reportData.threat_assessment);
  }
  
  if (reportData?.threats && Array.isArray(reportData.threats)) {
    return reportData.threats.slice(0, 3).join('; ');
  }
  
  if (reportData?.swot?.threats && Array.isArray(reportData.swot.threats)) {
    return reportData.swot.threats.slice(0, 3).join('; ');
  }
  
  return '';
}
