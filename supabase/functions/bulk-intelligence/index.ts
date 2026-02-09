import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalysisResult {
  brand_summary: string;
  market_position: string;
  target_audience: {
    primary: string;
    secondary: string[];
    demographics: string[];
  };
  competitive_advantages: string[];
  brand_voice_profile: {
    tone: string[];
    personality: string[];
    communication_style: string;
  };
  growth_recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    recommendation: string;
    rationale: string;
  }>;
  key_insights: string[];
  competitive_landscape?: {
    tracked_competitors: string[];
    positioning_summary: string;
    competitive_gaps: string[];
    differentiation_opportunities: string[];
    threat_assessment: Array<{
      competitor: string;
      threat_level: 'high' | 'medium' | 'low';
      key_threat: string;
    }>;
    market_share_estimate: string;
  };
}

interface FavoriteCompetitor {
  name: string;
  competitor_type: string;
  reason: string | null;
  industry: string | null;
}

interface CompetitiveReport {
  competitors: string[];
  report_data: {
    marketPerception?: {
      keyStrengths?: string[];
      criticalGaps?: string[];
      risks?: string[];
    };
    brandPositioning?: {
      differentiation?: string[];
    };
  };
}

interface ExistingIntelligence {
  id: string;
  analysis_count: number;
  last_analyzed_at: string | null;
  knowledge_entries: Array<Record<string, unknown>>;
}

interface EngagementMetrics {
  pageViews: {
    total: number;
    uniqueViewers: number;
    avgDurationSeconds: number;
    topSections: string[];
  };
  qrCodes: {
    totalScans: number;
    activeQrCodes: number;
    topUseCases: string[];
  };
  auditActivity: {
    totalEdits: number;
    totalExports: number;
    lastEditedAt: string | null;
    mostActiveActions: string[];
  };
  marketAnalysis: {
    hasRecentAnalysis: boolean;
    lastAnalysisDate: string | null;
    keyFindings: string[];
  };
  socialMetrics: {
    hasData: boolean;
    totalFollowers: number;
    avgEngagementRate: number;
    avgGrowthRate: number;
    avgSentiment: number;
    totalMentions: number;
    platformsTracked: number;
    topPlatform: string;
    latestSnapshotDate: string | null;
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the caller
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create user client to verify the caller
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role for admin operations
    const supabaseAdmin = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify admin role
    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!roleData || roleData.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { entityId, entityType, skipRecent = true } = await req.json().catch(() => ({}));

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // If specific entity provided, process only that one
    if (entityId && entityType) {
      const tableName = entityType === 'brand' ? 'brands' : 'products';
      const { data: entity, error } = await supabaseAdmin
        .from(tableName)
        .select('id, name, guide_data, organization_id')
        .eq('id', entityId)
        .single();

      if (error || !entity) {
        return new Response(
          JSON.stringify({ error: 'Entity not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const result = await processEntity(
        supabaseAdmin,
        LOVABLE_API_KEY,
        entity.id,
        entity.name,
        entityType,
        entity.guide_data as Record<string, unknown>,
        skipRecent,
        entity.organization_id
      );

      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Otherwise, return list of entities that need processing
    const { data: products } = await supabaseAdmin
      .from('products')
      .select('id, name');

    const { data: brands } = await supabaseAdmin
      .from('brands')
      .select('id, name');

    return new Response(
      JSON.stringify({
        message: 'Provide entityId and entityType to process a specific entity',
        products: products?.map(p => ({ id: p.id, name: p.name })) || [],
        brands: brands?.map(b => ({ id: b.id, name: b.name })) || []
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[bulk-intelligence] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Operation failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function processEntity(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseAdmin: any,
  apiKey: string,
  entityId: string,
  entityName: string,
  entityType: 'brand' | 'product',
  guideData: Record<string, unknown>,
  skipRecent: boolean,
  organizationId?: string | null
): Promise<{ entity: string; status: string; error?: string }> {
  try {
    console.log(`Processing ${entityType}: ${entityName}`);

    // Check if intelligence already exists
    const { data: existingIntelRaw } = await supabaseAdmin
      .from('brand_intelligence')
      .select('id, analysis_count, last_analyzed_at, knowledge_entries')
      .eq('entity_id', entityId)
      .eq('entity_type', entityType)
      .single();

    const existingIntel = existingIntelRaw as ExistingIntelligence | null;

    // Skip if recently analyzed
    if (skipRecent && existingIntel?.last_analyzed_at) {
      const lastAnalyzed = new Date(existingIntel.last_analyzed_at);
      const hoursSinceAnalysis = (Date.now() - lastAnalyzed.getTime()) / (1000 * 60 * 60);
      if (hoursSinceAnalysis < 24) {
        console.log(`Skipping ${entityName} - analyzed ${hoursSinceAnalysis.toFixed(1)} hours ago`);
        return { entity: entityName, status: 'skipped', error: 'Recently analyzed' };
      }
    }

    // Fetch favorite competitors for this organization
    let favoriteCompetitors: FavoriteCompetitor[] = [];
    if (organizationId) {
      const { data: favoritesRaw } = await supabaseAdmin
        .from('favorite_competitors')
        .select('name, competitor_type, reason, industry')
        .eq('organization_id', organizationId);
      favoriteCompetitors = (favoritesRaw || []) as FavoriteCompetitor[];
    }

    // Fetch recent competitive analysis reports for this entity
    let competitiveReports: CompetitiveReport[] = [];
    const { data: reportsRaw } = await supabaseAdmin
      .from('competitive_analysis_reports')
      .select('competitors, report_data')
      .eq('entity_id', entityId)
      .eq('entity_type', entityType)
      .order('created_at', { ascending: false })
      .limit(3);
    competitiveReports = (reportsRaw || []) as CompetitiveReport[];

    // Fetch engagement metrics
    const engagementMetrics = await fetchEngagementMetrics(supabaseAdmin, entityId, entityType);

    // Build analysis prompt with competitive context and engagement metrics
    const analysisPrompt = buildAnalysisPrompt(entityName, entityType, guideData, favoriteCompetitors, competitiveReports, engagementMetrics);

    // Call AI Gateway
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          {
            role: 'system',
            content: `You are a brand strategist and market analyst. Analyze the provided brand/product information and return a comprehensive brand intelligence report.

Return your analysis as a JSON object with this exact structure:
{
  "brand_summary": "2-3 sentence executive summary of the brand/product",
  "market_position": "Description of market positioning and competitive landscape",
  "target_audience": {
    "primary": "Primary target audience description",
    "secondary": ["Secondary audience 1", "Secondary audience 2"],
    "demographics": ["Age range", "Industry", "Role/Title"]
  },
  "competitive_advantages": ["Advantage 1", "Advantage 2", "Advantage 3"],
  "brand_voice_profile": {
    "tone": ["Tone descriptor 1", "Tone descriptor 2"],
    "personality": ["Personality trait 1", "Personality trait 2"],
    "communication_style": "Description of communication approach"
  },
  "growth_recommendations": [
    {"priority": "high", "recommendation": "Recommendation text", "rationale": "Why this matters"},
    {"priority": "medium", "recommendation": "Recommendation text", "rationale": "Why this matters"}
  ],
  "key_insights": ["Insight 1", "Insight 2", "Insight 3"],
  "competitive_landscape": {
    "tracked_competitors": ["Competitor 1", "Competitor 2"],
    "positioning_summary": "How this brand is positioned relative to competitors",
    "competitive_gaps": ["Gap 1", "Gap 2"],
    "differentiation_opportunities": ["Opportunity 1", "Opportunity 2"],
    "threat_assessment": [
      {"competitor": "Competitor name", "threat_level": "high|medium|low", "key_threat": "Description of threat"}
    ],
    "market_share_estimate": "Estimated market position (e.g., 'Top 5 in enterprise segment')"
  }
}

IMPORTANT: If competitor information is provided in the prompt, use it to inform your competitive_landscape analysis. Be specific about how this brand compares to named competitors. If no competitor data is provided, make reasonable inferences based on the brand's market and positioning.

Be specific, actionable, and insightful. Base analysis on the actual brand data provided.`
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`AI error for ${entityName}:`, errorText);
      return { entity: entityName, status: 'failed', error: 'AI gateway error' };
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      return { entity: entityName, status: 'failed', error: 'No AI response' };
    }

    // Parse JSON from response
    let analysisResult: AnalysisResult;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      const jsonStr = jsonMatch[1] || content;
      analysisResult = JSON.parse(jsonStr.trim());
    } catch {
      console.error(`Parse error for ${entityName}:`, content);
      return { entity: entityName, status: 'failed', error: 'JSON parse failed' };
    }

    // Merge with existing knowledge entries
    const existingEntries = existingIntel?.knowledge_entries || [];
    const now = new Date().toISOString();
    
    const newInsights = analysisResult.key_insights.map((insight, i) => ({
      id: `ai-insight-${Date.now()}-${i}`,
      type: 'insight',
      content: insight,
      source: 'ai',
      category: 'analysis',
      created_at: now
    }));

    // Upsert intelligence record
    const intelligenceData = {
      entity_id: entityId,
      entity_type: entityType,
      organization_id: organizationId || null,
      brand_summary: analysisResult.brand_summary,
      market_position: analysisResult.market_position,
      target_audience: analysisResult.target_audience,
      competitive_advantages: analysisResult.competitive_advantages,
      brand_voice_profile: analysisResult.brand_voice_profile,
      growth_recommendations: analysisResult.growth_recommendations,
      competitive_landscape: analysisResult.competitive_landscape || null,
      knowledge_entries: [...existingEntries.filter((e: Record<string, unknown>) => e.source !== 'ai'), ...newInsights],
      analysis_count: (existingIntel?.analysis_count || 0) + 1,
      last_analyzed_at: now,
      updated_at: now
    };

    if (existingIntel?.id) {
      const { error: updateError } = await supabaseAdmin
        .from('brand_intelligence')
        .update(intelligenceData)
        .eq('id', existingIntel.id);

      if (updateError) {
        console.error(`[bulk-intelligence] Update error for ${entityName}:`, updateError);
        return { entity: entityName, status: 'failed', error: 'Update failed' };
      }
    } else {
      const { error: insertError } = await supabaseAdmin
        .from('brand_intelligence')
        .insert({
          ...intelligenceData,
          created_at: now
        });

      if (insertError) {
        console.error(`[bulk-intelligence] Insert error for ${entityName}:`, insertError);
        return { entity: entityName, status: 'failed', error: 'Insert failed' };
      }
    }

    console.log(`✓ Completed analysis for ${entityName}`);
    return { entity: entityName, status: 'success' };

  } catch (entityError) {
    console.error(`[bulk-intelligence] Error processing ${entityName}:`, entityError);
    return { entity: entityName, status: 'failed', error: 'Processing failed' };
  }
}

function buildAnalysisPrompt(
  name: string,
  entityType: string,
  guideData: Record<string, unknown>,
  favoriteCompetitors: FavoriteCompetitor[],
  competitiveReports: CompetitiveReport[],
  engagementMetrics?: EngagementMetrics
): string {
  const sections: string[] = [];

  sections.push(`# ${entityType === 'brand' ? 'Brand' : 'Product'} Analysis Request: ${name}`);

  const hero = guideData.hero as Record<string, unknown> | undefined;
  if (hero) {
    sections.push(`\n## Identity`);
    sections.push(`- Name: ${hero.name || name}`);
    sections.push(`- Tagline: ${hero.tagline || 'Not defined'}`);
  }

  const identity = guideData.identity as Record<string, unknown> | undefined;
  if (identity) {
    sections.push(`\n## Brand Narrative`);
    sections.push(`- Mission: ${identity.missionStatement || 'Not defined'}`);
    sections.push(`- Archetype: ${identity.archetype || 'Not defined'}`);
    const toneOfVoice = identity.toneOfVoice as string[] | undefined;
    sections.push(`- Tone of Voice: ${toneOfVoice?.join(', ') || 'Not defined'}`);
  }

  const values = guideData.values as Array<{ title: string; description: string }> | undefined;
  if (values && values.length > 0) {
    sections.push(`\n## Brand Values`);
    values.forEach((v, i) => {
      sections.push(`${i + 1}. ${v.title}: ${v.description || 'No description'}`);
    });
  }

  const services = guideData.services as Array<{ name: string; description: string }> | undefined;
  if (services && services.length > 0) {
    sections.push(`\n## Services/Features (${services.length})`);
    services.slice(0, 10).forEach((s, i) => {
      sections.push(`${i + 1}. ${s.name}: ${s.description || 'No description'}`);
    });
  }

  const colors = guideData.colors as Array<{ name: string; hex: string }> | undefined;
  if (colors && colors.length > 0) {
    sections.push(`\n## Brand Colors: ${colors.length} defined`);
  }

  const typography = guideData.typography as Array<{ name: string; fontFamily: string }> | undefined;
  if (typography && typography.length > 0) {
    sections.push(`\n## Typography: ${typography.length} styles defined`);
  }

  // Add competitive context if available
  if (favoriteCompetitors.length > 0 || competitiveReports.length > 0) {
    sections.push(`\n## Competitive Context`);
    
    if (favoriteCompetitors.length > 0) {
      sections.push(`\n### Tracked Competitors (${favoriteCompetitors.length})`);
      favoriteCompetitors.forEach((c, i) => {
        const details = [c.competitor_type];
        if (c.industry) details.push(`industry: ${c.industry}`);
        if (c.reason) details.push(`reason: ${c.reason}`);
        sections.push(`${i + 1}. ${c.name} (${details.join(', ')})`);
      });
    }

    if (competitiveReports.length > 0) {
      sections.push(`\n### Previous Competitive Analysis Insights`);
      competitiveReports.forEach((report, i) => {
        const reportData = report.report_data || {};
        sections.push(`\nReport ${i + 1} (vs ${report.competitors?.join(', ') || 'unknown'}):`);
        
        if (reportData.marketPerception?.keyStrengths?.length) {
          sections.push(`- Key Strengths: ${reportData.marketPerception.keyStrengths.slice(0, 3).join('; ')}`);
        }
        if (reportData.marketPerception?.criticalGaps?.length) {
          sections.push(`- Critical Gaps: ${reportData.marketPerception.criticalGaps.slice(0, 3).join('; ')}`);
        }
        if (reportData.brandPositioning?.differentiation?.length) {
          sections.push(`- Differentiation: ${reportData.brandPositioning.differentiation.slice(0, 3).join('; ')}`);
        }
        if (reportData.marketPerception?.risks?.length) {
          sections.push(`- Risks: ${reportData.marketPerception.risks.slice(0, 2).join('; ')}`);
        }
      });
    }
  }

  // Add engagement metrics context
  if (engagementMetrics) {
    sections.push(`\n## Engagement & Activity Metrics`);
    
    if (engagementMetrics.pageViews.total > 0) {
      sections.push(`\n### User Engagement`);
      sections.push(`- Total Page Views: ${engagementMetrics.pageViews.total}`);
      sections.push(`- Unique Viewers: ${engagementMetrics.pageViews.uniqueViewers}`);
      sections.push(`- Avg. Session Duration: ${Math.round(engagementMetrics.pageViews.avgDurationSeconds / 60)} minutes`);
      if (engagementMetrics.pageViews.topSections.length > 0) {
        sections.push(`- Most Viewed Sections: ${engagementMetrics.pageViews.topSections.join(', ')}`);
      }
    }

    if (engagementMetrics.qrCodes.totalScans > 0 || engagementMetrics.qrCodes.activeQrCodes > 0) {
      sections.push(`\n### QR Code Performance`);
      sections.push(`- Active QR Codes: ${engagementMetrics.qrCodes.activeQrCodes}`);
      sections.push(`- Total Scans: ${engagementMetrics.qrCodes.totalScans}`);
      if (engagementMetrics.qrCodes.topUseCases.length > 0) {
        sections.push(`- Top Use Cases: ${engagementMetrics.qrCodes.topUseCases.join(', ')}`);
      }
    }

    if (engagementMetrics.auditActivity.totalEdits > 0 || engagementMetrics.auditActivity.totalExports > 0) {
      sections.push(`\n### Content Activity`);
      sections.push(`- Total Edits: ${engagementMetrics.auditActivity.totalEdits}`);
      sections.push(`- Total Exports: ${engagementMetrics.auditActivity.totalExports}`);
      if (engagementMetrics.auditActivity.lastEditedAt) {
        sections.push(`- Last Updated: ${engagementMetrics.auditActivity.lastEditedAt}`);
      }
      if (engagementMetrics.auditActivity.mostActiveActions.length > 0) {
        sections.push(`- Most Common Actions: ${engagementMetrics.auditActivity.mostActiveActions.join(', ')}`);
      }
    }

    if (engagementMetrics.marketAnalysis.hasRecentAnalysis) {
      sections.push(`\n### Market Intelligence`);
      sections.push(`- Recent Analysis Available: Yes`);
      if (engagementMetrics.marketAnalysis.keyFindings.length > 0) {
        sections.push(`- Key Findings: ${engagementMetrics.marketAnalysis.keyFindings.slice(0, 3).join('; ')}`);
      }
    }

    // Add social metrics
    if (engagementMetrics.socialMetrics.hasData) {
      sections.push(`\n### Social Media Performance`);
      sections.push(`- Total Followers: ${engagementMetrics.socialMetrics.totalFollowers.toLocaleString()}`);
      sections.push(`- Avg Engagement Rate: ${engagementMetrics.socialMetrics.avgEngagementRate.toFixed(2)}%`);
      sections.push(`- Avg Follower Growth: ${engagementMetrics.socialMetrics.avgGrowthRate >= 0 ? '+' : ''}${engagementMetrics.socialMetrics.avgGrowthRate.toFixed(2)}%`);
      sections.push(`- Sentiment Score: ${engagementMetrics.socialMetrics.avgSentiment.toFixed(1)} (${engagementMetrics.socialMetrics.avgSentiment > 20 ? 'Positive' : engagementMetrics.socialMetrics.avgSentiment < -20 ? 'Negative' : 'Neutral'})`);
      sections.push(`- Total Brand Mentions: ${engagementMetrics.socialMetrics.totalMentions.toLocaleString()}`);
      sections.push(`- Platforms Tracked: ${engagementMetrics.socialMetrics.platformsTracked}`);
      sections.push(`- Top Platform: ${engagementMetrics.socialMetrics.topPlatform}`);
      if (engagementMetrics.socialMetrics.latestSnapshotDate) {
        sections.push(`- Data As Of: ${engagementMetrics.socialMetrics.latestSnapshotDate}`);
      }
    }
  }

  const hasCompetitiveContext = favoriteCompetitors.length > 0 || competitiveReports.length > 0;
  const hasEngagementData = engagementMetrics && (
    engagementMetrics.pageViews.total > 0 ||
    engagementMetrics.qrCodes.totalScans > 0 ||
    engagementMetrics.auditActivity.totalEdits > 0 ||
    engagementMetrics.socialMetrics.hasData
  );

  let contextInstructions = '';
  if (hasCompetitiveContext) {
    contextInstructions += 'Use the competitive context provided to inform your competitive_landscape analysis with specific insights about how this brand compares to its tracked competitors. ';
  }
  if (hasEngagementData) {
    contextInstructions += 'Consider the engagement metrics to understand user interest patterns and inform growth recommendations - high engagement sections indicate strong content, low engagement may indicate opportunities for improvement.';
  }

  sections.push(`\n\nPlease analyze this ${entityType} and provide comprehensive brand intelligence insights. ${contextInstructions}`);

  return sections.join('\n');
}

// Fetch engagement metrics from various data sources
async function fetchEngagementMetrics(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseAdmin: any,
  entityId: string,
  entityType: string
): Promise<EngagementMetrics> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // Fetch page views
  const { data: pageViewsRaw } = await supabaseAdmin
    .from('page_views')
    .select('id, user_id, duration_seconds, page_path')
    .eq('entity_id', entityId)
    .eq('entity_type', entityType)
    .gte('created_at', thirtyDaysAgo);

  const pageViews = pageViewsRaw || [];
  const uniqueViewers = new Set(pageViews.filter((pv: { user_id: string }) => pv.user_id).map((pv: { user_id: string }) => pv.user_id)).size;
  const avgDuration = pageViews.length > 0 
    ? pageViews.reduce((sum: number, pv: { duration_seconds: number }) => sum + (pv.duration_seconds || 0), 0) / pageViews.length 
    : 0;

  // Extract section from page path (e.g., /brand/slug#section)
  const sectionCounts: Record<string, number> = {};
  pageViews.forEach((pv: { page_path: string }) => {
    const section = pv.page_path?.split('#')[1] || 'hero';
    sectionCounts[section] = (sectionCounts[section] || 0) + 1;
  });
  const topSections = Object.entries(sectionCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([section]) => section);

  // Fetch QR codes
  const { data: qrCodesRaw } = await supabaseAdmin
    .from('qr_codes')
    .select('id, scan_count, use_case, is_active')
    .eq('entity_id', entityId)
    .eq('entity_type', entityType);

  const qrCodes = qrCodesRaw || [];
  const totalScans = qrCodes.reduce((sum: number, qr: { scan_count: number }) => sum + (qr.scan_count || 0), 0);
  const activeQrCodes = qrCodes.filter((qr: { is_active: boolean }) => qr.is_active).length;
  const useCaseCounts: Record<string, number> = {};
  qrCodes.forEach((qr: { use_case: string; scan_count: number }) => {
    if (qr.use_case) {
      useCaseCounts[qr.use_case] = (useCaseCounts[qr.use_case] || 0) + (qr.scan_count || 1);
    }
  });
  const topUseCases = Object.entries(useCaseCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([useCase]) => useCase);

  // Fetch audit activity
  const { data: auditLogsRaw } = await supabaseAdmin
    .from('audit_logs')
    .select('id, action_type, created_at')
    .eq('brand_id', entityId)
    .gte('created_at', thirtyDaysAgo);

  const auditLogs = auditLogsRaw || [];
  const totalEdits = auditLogs.filter((log: { action_type: string }) => 
    ['update', 'edit', 'create', 'modify'].some(action => log.action_type?.toLowerCase().includes(action))
  ).length;
  const totalExports = auditLogs.filter((log: { action_type: string }) => 
    log.action_type?.toLowerCase().includes('export')
  ).length;
  
  const lastEdit = auditLogs
    .filter((log: { action_type: string }) => log.action_type?.toLowerCase().includes('update') || log.action_type?.toLowerCase().includes('edit'))
    .sort((a: { created_at: string }, b: { created_at: string }) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

  const actionCounts: Record<string, number> = {};
  auditLogs.forEach((log: { action_type: string }) => {
    if (log.action_type) {
      actionCounts[log.action_type] = (actionCounts[log.action_type] || 0) + 1;
    }
  });
  const mostActiveActions = Object.entries(actionCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([action]) => action);

  // Check for market analysis reports (stored in brand_intelligence analysis_history)
  const { data: marketAnalysisRaw } = await supabaseAdmin
    .from('brand_intelligence')
    .select('analysis_history, last_analyzed_at')
    .eq('entity_id', entityId)
    .eq('entity_type', entityType)
    .single();

  const analysisHistory = (marketAnalysisRaw?.analysis_history as Array<{ type?: string; findings?: string[] }>) || [];
  const marketReports = analysisHistory.filter(h => h?.type === 'market_analysis');
  const keyFindings = marketReports.length > 0 && marketReports[0].findings 
    ? marketReports[0].findings.slice(0, 3)
    : [];

  // Fetch social metrics using the RPC function
  let socialMetricsData = {
    hasData: false,
    totalFollowers: 0,
    avgEngagementRate: 0,
    avgGrowthRate: 0,
    avgSentiment: 0,
    totalMentions: 0,
    platformsTracked: 0,
    topPlatform: 'None',
    latestSnapshotDate: null as string | null,
  };

  try {
    const { data: socialAggRaw } = await supabaseAdmin
      .rpc('get_aggregated_social_metrics', {
        p_entity_id: entityId,
        p_entity_type: entityType
      });
    
    if (socialAggRaw && socialAggRaw.length > 0) {
      const agg = socialAggRaw[0];
      socialMetricsData = {
        hasData: agg.platforms_count > 0,
        totalFollowers: Number(agg.total_followers) || 0,
        avgEngagementRate: Number(agg.avg_engagement_rate) || 0,
        avgGrowthRate: Number(agg.avg_growth_rate) || 0,
        avgSentiment: Number(agg.avg_sentiment) || 0,
        totalMentions: Number(agg.total_mentions) || 0,
        platformsTracked: Number(agg.platforms_count) || 0,
        topPlatform: agg.top_platform || 'None',
        latestSnapshotDate: agg.latest_snapshot_date || null,
      };
    }
  } catch (socialError) {
    console.error('[bulk-intelligence] Error fetching social metrics:', socialError);
  }

  return {
    pageViews: {
      total: pageViews.length,
      uniqueViewers,
      avgDurationSeconds: avgDuration,
      topSections,
    },
    qrCodes: {
      totalScans,
      activeQrCodes,
      topUseCases,
    },
    auditActivity: {
      totalEdits,
      totalExports,
      lastEditedAt: lastEdit?.created_at || null,
      mostActiveActions,
    },
    marketAnalysis: {
      hasRecentAnalysis: marketReports.length > 0,
      lastAnalysisDate: marketAnalysisRaw?.last_analyzed_at || null,
      keyFindings,
    },
    socialMetrics: socialMetricsData,
  };
}
