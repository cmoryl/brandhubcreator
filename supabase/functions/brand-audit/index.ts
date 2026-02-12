import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BrandData {
  id: string;
  type: 'brand' | 'product';
  hero: {
    name: string;
    tagline: string;
  };
  identity: {
    missionStatement: string;
    archetype: string;
    toneOfVoice: string[];
  };
  values: Array<{ title: string; description: string }>;
  colors: Array<{ name: string; hex: string; usage: string }>;
  typography: Array<{ name: string; fontFamily: string; usage: string }>;
  gradients: Array<{ name: string; colors: string[] }>;
  patterns: Array<{ name: string }>;
}

interface IntelligenceData {
  brandSummary?: string;
  marketPosition?: string;
  competitiveAdvantages?: unknown[];
  growthRecommendations?: unknown[];
  competitiveLandscape?: Record<string, unknown>;
  culturalInsights?: Record<string, unknown>;
  localizationReadinessScore?: number;
}

interface WebsiteAnalysisData {
  url: string;
  overallScore: number;
  grade: string;
  summary: string;
}

interface AuditResult {
  overallScore: number;
  categories: {
    name: string;
    score: number;
    findings: string[];
    recommendations: string[];
  }[];
  summary: string;
  strengths: string[];
  weaknesses: string[];
  actionItems: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Authenticated user: ${user.id}`);

    const { brandId, entityType = 'brand' } = await req.json();
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!brandId || typeof brandId !== 'string' || !uuidRegex.test(brandId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const validEntityTypes = ['brand', 'product'];
    if (!validEntityTypes.includes(entityType)) {
      return new Response(
        JSON.stringify({ error: 'Invalid entity type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: auditCount, error: countError } = await supabaseClient
      .from('audit_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', oneHourAgo);

    if (countError) {
      console.error('Error checking rate limit:', countError.message);
    } else if (auditCount !== null && auditCount >= 10) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Maximum 10 audits per hour.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch brand data + intelligence in parallel
    const tableName = entityType === 'product' ? 'products' : 'brands';
    
    const [brandResult, intelligenceResult] = await Promise.all([
      supabaseClient
        .from(tableName)
        .select('id, name, guide_data, user_id, organization_id')
        .eq('id', brandId)
        .single(),
      supabaseClient
        .from('brand_intelligence')
        .select('brand_summary, market_position, competitive_advantages, growth_recommendations, competitive_landscape, cultural_insights, localization_readiness_score')
        .eq('entity_id', brandId)
        .eq('entity_type', entityType)
        .maybeSingle(),
    ]);

    if (brandResult.error || !brandResult.data) {
      return new Response(
        JSON.stringify({ error: 'Brand not found or access denied' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const brandData = brandResult.data;
    const guideData = brandData.guide_data as Record<string, unknown> || {};
    
    const brand: BrandData = {
      id: brandData.id,
      type: entityType as 'brand' | 'product',
      hero: {
        name: brandData.name || (guideData.hero as Record<string, unknown>)?.name as string || 'Unnamed Brand',
        tagline: (guideData.hero as Record<string, unknown>)?.tagline as string || '',
      },
      identity: {
        missionStatement: (guideData.identity as Record<string, unknown>)?.missionStatement as string || '',
        archetype: (guideData.identity as Record<string, unknown>)?.archetype as string || '',
        toneOfVoice: (guideData.identity as Record<string, unknown>)?.toneOfVoice as string[] || [],
      },
      values: (guideData.values as Array<{ title: string; description: string }>) || [],
      colors: (guideData.colors as Array<{ name: string; hex: string; usage: string }>) || [],
      typography: (guideData.typography as Array<{ name: string; fontFamily: string; usage: string }>) || [],
      gradients: (guideData.gradients as Array<{ name: string; colors: string[] }>) || [],
      patterns: (guideData.patterns as Array<{ name: string }>) || [],
    };

    // Extract intelligence data
    const intel: IntelligenceData = {};
    if (intelligenceResult.data) {
      const d = intelligenceResult.data as Record<string, unknown>;
      intel.brandSummary = d.brand_summary as string || undefined;
      intel.marketPosition = d.market_position as string || undefined;
      intel.competitiveAdvantages = Array.isArray(d.competitive_advantages) ? d.competitive_advantages : [];
      intel.growthRecommendations = Array.isArray(d.growth_recommendations) ? d.growth_recommendations : [];
      intel.competitiveLandscape = d.competitive_landscape as Record<string, unknown> || undefined;
      intel.culturalInsights = d.cultural_insights as Record<string, unknown> || undefined;
      intel.localizationReadinessScore = d.localization_readiness_score as number || undefined;
    }

    // Extract website analysis from insights array in guide_data
    const insights = Array.isArray(guideData.insights) ? guideData.insights : [];
    const websiteAnalyses: WebsiteAnalysisData[] = [];
    for (const insight of insights) {
      const ins = insight as Record<string, unknown>;
      if (typeof ins.id === 'string' && ins.id.startsWith('site-analysis-') && ins.content) {
        try {
          const report = JSON.parse(ins.content as string);
          websiteAnalyses.push({
            url: (ins.title as string || '').replace('Website Analysis: ', ''),
            overallScore: report.overallScore || 0,
            grade: report.grade || 'N/A',
            summary: report.summary || '',
          });
        } catch { /* skip unparseable */ }
      }
    }

    console.log(`Starting brand audit for: ${brand.hero.name} (intel: ${!!intelligenceResult.data}, websites: ${websiteAnalyses.length})`);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const auditPrompt = buildAuditPrompt(brand, intel, websiteAnalyses);
    
    console.log('Calling AI Gateway for brand analysis...');
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          {
            role: 'system',
            content: `You are a brand cohesion expert. Analyze brand guides holistically — including website performance, competitive intelligence, and cultural readiness alongside visual/identity elements. Return JSON only:
{"overallScore":<0-100>,"categories":[{"name":"<name>","score":<0-100>,"findings":["..."],"recommendations":["..."]}],"summary":"<2-3 sentences>","strengths":["..."],"weaknesses":["..."],"actionItems":["..."]}
Categories: Visual Consistency, Brand Identity, Digital Presence, Completeness, Competitive Position, Best Practices. Be specific and actionable.`
          },
          {
            role: 'user',
            content: auditPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1800,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from AI');
    }

    console.log('AI response received, parsing...');

    let auditResult: AuditResult;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      const jsonStr = (jsonMatch[1] || content).trim();
      // Handle potential truncation - try to fix unclosed JSON
      let fixedJson = jsonStr;
      if (!fixedJson.endsWith('}')) {
        const lastBrace = fixedJson.lastIndexOf('}');
        if (lastBrace > 0) fixedJson = fixedJson.substring(0, lastBrace + 1);
      }
      auditResult = JSON.parse(fixedJson);
    } catch {
      console.error('Failed to parse AI response:', content.substring(0, 300));
      auditResult = {
        overallScore: 70,
        categories: [{
          name: 'Analysis',
          score: 70,
          findings: ['Brand data was analyzed but structured parsing failed'],
          recommendations: ['Please try again']
        }],
        summary: content.substring(0, 200),
        strengths: ['Brand guide exists'],
        weaknesses: ['Could not perform detailed analysis'],
        actionItems: ['Review and enhance brand guide completeness']
      };
    }

    console.log(`Audit complete. Overall score: ${auditResult.overallScore}`);

    // Log audit
    await supabaseClient
      .from('audit_logs')
      .insert({
        user_id: user.id,
        brand_id: brandId,
        entity_type: entityType
      })
      .then(({ error }) => {
        if (error) console.error('Failed to log audit:', error.message);
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        audit: auditResult,
        brandName: brand.hero.name,
        auditDate: new Date().toISOString(),
        dataSources: {
          guideData: true,
          brandIntelligence: !!intelligenceResult.data,
          websiteAnalyses: websiteAnalyses.length,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to perform brand audit';
    console.error('Brand audit error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function buildAuditPrompt(brand: BrandData, intel: IntelligenceData, websiteAnalyses: WebsiteAnalysisData[]): string {
  const s: string[] = [];

  s.push(`# Brand Cohesion Audit: ${brand.hero?.name || 'Unnamed Brand'}`);
  s.push(`Type: ${brand.type || 'brand'}\n`);
  
  // Identity
  s.push(`## Identity`);
  s.push(`- Name: ${brand.hero.name}`);
  s.push(`- Tagline: ${brand.hero.tagline || 'Not defined'}`);
  s.push(`- Mission: ${brand.identity.missionStatement || 'Not defined'}`);
  s.push(`- Archetype: ${brand.identity.archetype || 'Not defined'}`);
  s.push(`- Tone: ${brand.identity.toneOfVoice?.join(', ') || 'Not defined'}`);

  // Values
  if (brand.values.length > 0) {
    s.push(`\n## Values (${brand.values.length})`);
    brand.values.slice(0, 6).forEach((v, i) => s.push(`${i + 1}. ${v.title}: ${v.description || '-'}`));
  } else {
    s.push(`\n## Values: None`);
  }

  // Visual
  if (brand.colors.length > 0) {
    s.push(`\n## Colors (${brand.colors.length})`);
    brand.colors.slice(0, 10).forEach(c => s.push(`- ${c.name}: ${c.hex} (${c.usage || '-'})`));
  } else {
    s.push(`\n## Colors: None`);
  }

  if (brand.typography.length > 0) {
    s.push(`\n## Typography (${brand.typography.length})`);
    brand.typography.slice(0, 6).forEach(t => s.push(`- ${t.name}: ${t.fontFamily} (${t.usage || '-'})`));
  } else {
    s.push(`\n## Typography: None`);
  }

  s.push(`\n## Other Assets: ${brand.gradients.length} gradients, ${brand.patterns.length} patterns`);

  // Brand Intelligence
  if (intel.brandSummary || intel.marketPosition) {
    s.push(`\n## Brand Intelligence`);
    if (intel.brandSummary) s.push(`Summary: ${intel.brandSummary.substring(0, 300)}`);
    if (intel.marketPosition) s.push(`Market Position: ${intel.marketPosition}`);
    if (intel.localizationReadinessScore) s.push(`Localization Readiness: ${intel.localizationReadinessScore}/100`);
  }

  // Competitive context
  if (intel.competitiveAdvantages && intel.competitiveAdvantages.length > 0) {
    s.push(`\n## Competitive Advantages (${intel.competitiveAdvantages.length})`);
    intel.competitiveAdvantages.slice(0, 5).forEach(a => {
      const adv = a as Record<string, unknown>;
      s.push(`- ${adv.title || adv.advantage || JSON.stringify(a).substring(0, 80)}`);
    });
  }

  if (intel.competitiveLandscape) {
    const cl = intel.competitiveLandscape;
    if (cl.positioning_summary) s.push(`\nCompetitive Positioning: ${String(cl.positioning_summary).substring(0, 200)}`);
    if (Array.isArray(cl.differentiation_opportunities) && cl.differentiation_opportunities.length > 0) {
      s.push(`Differentiation Opportunities: ${cl.differentiation_opportunities.slice(0, 3).join('; ')}`);
    }
  }

  // Website Analysis
  if (websiteAnalyses.length > 0) {
    s.push(`\n## Website Analysis Results`);
    websiteAnalyses.forEach(wa => {
      s.push(`- ${wa.url}: Score ${wa.overallScore}/100 (Grade ${wa.grade})`);
      if (wa.summary) s.push(`  ${wa.summary.substring(0, 150)}`);
    });
  }

  // Growth recommendations
  if (intel.growthRecommendations && intel.growthRecommendations.length > 0) {
    s.push(`\n## AI Growth Recommendations (${intel.growthRecommendations.length})`);
    intel.growthRecommendations.slice(0, 4).forEach(r => {
      const rec = r as Record<string, unknown>;
      s.push(`- ${rec.title || rec.recommendation || JSON.stringify(r).substring(0, 80)}`);
    });
  }

  s.push(`\n\nAnalyze this brand holistically for cohesion across guide content, digital presence, and competitive positioning. Return JSON.`);

  return s.join('\n');
}
