import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MarketAnalysisRequest {
  type: 'brand' | 'product' | 'organization' | 'platform';
  entityId?: string;
  analysisType: 'market-position' | 'competitive' | 'growth' | 'trends' | 'comprehensive';
}

interface AnalysisResult {
  title: string;
  summary: string;
  marketPosition: {
    currentState: string;
    opportunities: string[];
    threats: string[];
  };
  competitiveAnalysis: {
    strengths: string[];
    differentiators: string[];
    competitorInsights: string[];
  };
  growthRecommendations: {
    shortTerm: string[];
    longTerm: string[];
    metrics: string[];
  };
  trendAnalysis: {
    industryTrends: string[];
    emergingOpportunities: string[];
    risksToWatch: string[];
  };
  actionPlan: {
    immediate: string[];
    quarterly: string[];
    annual: string[];
  };
  score: number;
  generatedAt: string;
}

import { extractFullBrandContext, buildMultimodalContent, fetchDocumentContext, fetchSocialMetricsContext, type ImageReference } from '../_shared/extractFullBrandContext.ts';

function extractRelevantBrandData(guideData: Record<string, unknown>, entityName: string = '', entityType: string = 'brand'): { text: string; imageUrls: ImageReference[] } {
  const { text, imageUrls } = extractFullBrandContext(guideData, entityName, entityType, 3000, true, 10);
  return { text: text || 'No detailed data available', imageUrls };
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

    // Check if user is admin
    const { data: roleData } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    const isAdmin = roleData?.role === 'admin' || roleData?.role === 'super_admin';
    
    const { type, entityId, analysisType } = await req.json() as MarketAnalysisRequest;

    let contextData = '';
    let entityName = '';
    let marketImageUrls: ImageReference[] = [];

    if (type === 'platform' && isAdmin) {
      // Fetch platform-wide stats for admin - use head: true to only get counts
      const [
        { count: usersCount },
        { count: brandsCount },
        { count: productsCount },
        { count: orgsCount },
        { data: recentBrands }
      ] = await Promise.all([
        supabaseClient.from('profiles').select('*', { count: 'exact', head: true }),
        supabaseClient.from('brands').select('*', { count: 'exact', head: true }),
        supabaseClient.from('products').select('*', { count: 'exact', head: true }),
        supabaseClient.from('organizations').select('*', { count: 'exact', head: true }),
        supabaseClient.from('brands').select('name, is_public, created_at').order('created_at', { ascending: false }).limit(10)
      ]);

      entityName = 'Platform Overview';
      contextData = `Platform Statistics:
- Total Users: ${usersCount || 0}
- Total Brands: ${brandsCount || 0}
- Total Products: ${productsCount || 0}
- Total Organizations: ${orgsCount || 0}

Recent Brands (last 10):
${recentBrands?.map(b => `- ${b.name} (${b.is_public ? 'Public' : 'Private'})`).join('\n') || 'No recent brands'}`;
    } else if (type === 'brand' && entityId) {
      const { data: brand } = await supabaseClient
        .from('brands')
        .select('name, is_public, created_at, guide_data')
        .eq('id', entityId)
        .single();

      if (!brand) {
        return new Response(
          JSON.stringify({ error: 'Brand not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      entityName = brand.name;
      const guideData = brand.guide_data as Record<string, unknown>;
      const brandData = extractRelevantBrandData(guideData, brand.name, 'brand');
      marketImageUrls = brandData.imageUrls;

      // Fetch document content and social metrics
      const [docRes, socialRes] = await Promise.all([
        fetchDocumentContext(supabaseClient, entityId!, 'brand', guideData, 1000),
        fetchSocialMetricsContext(supabaseClient, entityId!, 'brand'),
      ]);
      for (const di of docRes.imageUrls.slice(0, 4)) { if (marketImageUrls.length < 14) marketImageUrls.push(di); }

      contextData = `Brand: ${brand.name}
Status: ${brand.is_public ? 'Public' : 'Private'}
Created: ${brand.created_at}

Brand Details:
${brandData.text}${docRes.text ? `\n${docRes.text}` : ''}${socialRes.text || ''}`;
    } else if (type === 'product' && entityId) {
      const { data: product } = await supabaseClient
        .from('products')
        .select('name, is_public, created_at, guide_data')
        .eq('id', entityId)
        .single();

      if (!product) {
        return new Response(
          JSON.stringify({ error: 'Product not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      entityName = product.name;
      const guideData = product.guide_data as Record<string, unknown>;
      const productData = extractRelevantBrandData(guideData, product.name, 'product');
      marketImageUrls = productData.imageUrls;

      // Fetch document content and social metrics
      const [docRes2, socialRes2] = await Promise.all([
        fetchDocumentContext(supabaseClient, entityId!, 'product', guideData, 1000),
        fetchSocialMetricsContext(supabaseClient, entityId!, 'product'),
      ]);
      for (const di of docRes2.imageUrls.slice(0, 4)) { if (marketImageUrls.length < 14) marketImageUrls.push(di); }

      contextData = `Product: ${product.name}
Status: ${product.is_public ? 'Public' : 'Private'}
Created: ${product.created_at}

Product Details:
${productData.text}${docRes2.text ? `\n${docRes2.text}` : ''}${socialRes2.text || ''}`;
    } else if (type === 'organization' && entityId) {
      const { data: org } = await supabaseClient
        .from('organizations')
        .select('name, slug, created_at')
        .eq('id', entityId)
        .single();

      if (!org) {
        return new Response(
          JSON.stringify({ error: 'Organization not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get org's brands and products counts
      const [{ count: brandsCount }, { count: productsCount }] = await Promise.all([
        supabaseClient.from('brands').select('*', { count: 'exact', head: true }).eq('organization_id', entityId),
        supabaseClient.from('products').select('*', { count: 'exact', head: true }).eq('organization_id', entityId)
      ]);

      entityName = org.name;
      contextData = `Organization: ${org.name}
Slug: ${org.slug}
Created: ${org.created_at}
Total Brands: ${brandsCount || 0}
Total Products: ${productsCount || 0}`;
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are a strategic business and brand analyst specializing in market intelligence. Analyze the provided brand/company data and generate comprehensive market insights.

Your analysis should be based on the brand's positioning data including:
- Brand identity (mission, archetype, tone of voice)
- Value proposition and core values
- Services/products offered
- Visual identity (colors, imagery style)
- Social media presence

Focus on providing actionable insights for:
1. Market positioning relative to industry standards
2. Competitive differentiation opportunities
3. Social media and marketing sentiment indicators
4. Growth strategies aligned with brand values
5. Industry trends relevant to the brand's positioning

Respond with a JSON object (no markdown, just raw JSON):
{
  "title": "<Analysis title based on brand name and analysis type>",
  "summary": "<Executive summary in 2-3 sentences highlighting key findings>",
  "marketPosition": {
    "currentState": "<Assessment of current market position based on brand data>",
    "opportunities": ["<opportunity 1>", "<opportunity 2>", "<opportunity 3>"],
    "threats": ["<threat 1>", "<threat 2>"]
  },
  "competitiveAnalysis": {
    "strengths": ["<strength based on brand values/identity>", "<strength 2>"],
    "differentiators": ["<unique differentiator 1>", "<differentiator 2>"],
    "competitorInsights": ["<market insight 1>", "<insight about competitive landscape>"]
  },
  "growthRecommendations": {
    "shortTerm": ["<1-3 month action>", "<action 2>"],
    "longTerm": ["<6-12 month strategic goal>", "<goal 2>"],
    "metrics": ["<KPI to track>", "<KPI 2>", "<KPI 3>"]
  },
  "trendAnalysis": {
    "industryTrends": ["<relevant trend 1>", "<trend 2>"],
    "emergingOpportunities": ["<opportunity aligned with brand>"],
    "risksToWatch": ["<risk 1>", "<risk 2>"]
  },
  "actionPlan": {
    "immediate": ["<this week priority>", "<priority 2>"],
    "quarterly": ["<90-day goal>", "<goal 2>"],
    "annual": ["<yearly strategic objective>"]
  },
  "score": <0-100 based on brand completeness and market readiness>
}`;

    // Fetch Oracle context for org-level strategic grounding
    let oracleContext = '';
    if (type !== 'platform') {
      try {
        const orgId = type === 'organization' ? entityId : null;
        // For brand/product, get org_id from entity
        let resolvedOrgId = orgId;
        if (!resolvedOrgId && entityId && (type === 'brand' || type === 'product')) {
          const tbl = type === 'brand' ? 'brands' : 'products';
          const { data: ent } = await supabaseClient.from(tbl).select('organization_id').eq('id', entityId).single();
          resolvedOrgId = ent?.organization_id || null;
        }
        if (resolvedOrgId) {
          const adminSupa = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
          const [{ data: oracle }, { data: oracleKb }] = await Promise.all([
            adminSupa.from('oracle_intelligence').select('org_summary, unified_voice_profile, strategic_recommendations, market_landscape, competitive_overview').eq('organization_id', resolvedOrgId).maybeSingle(),
            adminSupa.from('oracle_knowledge_base').select('title, content').eq('organization_id', resolvedOrgId).eq('is_active', true).neq('source_type', 'entity_brain').order('updated_at', { ascending: false }).limit(5),
          ]);
          const parts: string[] = [];
          if (oracle?.org_summary) parts.push(`Org Strategy: ${oracle.org_summary}`);
          if (oracle?.market_landscape?.overall_position) parts.push(`Market Landscape: ${oracle.market_landscape.overall_position}`);
          if (oracle?.competitive_overview?.market_position) parts.push(`Competitive Position: ${oracle.competitive_overview.market_position}`);
          const recs = Array.isArray(oracle?.strategic_recommendations) ? oracle.strategic_recommendations : [];
          if (recs.length > 0) parts.push(`Strategic Priorities: ${recs.slice(0, 3).map((r: any) => r.recommendation).join('; ')}`);
          if (oracleKb?.length) parts.push(`Knowledge: ${oracleKb.map((k: any) => `${k.title}: ${(k.content || '').slice(0, 120)}`).join(' | ')}`);
          if (parts.length > 0) oracleContext = `\n\nORACLE BRAIN (Org-Level Intelligence):\n${parts.join('\n')}`;
        }
      } catch (e) {
        console.warn('[market-analysis] Oracle context failed (non-critical):', e);
      }
    }

    const userPrompt = `Perform a ${analysisType} analysis for: ${entityName}

Brand/Company Data:
${contextData}${oracleContext}

Provide insights that are specific to this brand's positioning, values, and market context.${oracleContext ? ' Incorporate organizational strategic intelligence for broader portfolio context.' : ''} Make recommendations actionable and aligned with the brand's identity.`;

    console.log(`Running ${analysisType} analysis for ${entityName}`);

    // Build multimodal content if images available
    const userMessageContent = marketImageUrls.length > 0
      ? buildMultimodalContent(userPrompt, marketImageUrls, 6)
      : userPrompt;

    let response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: marketImageUrls.length > 0 ? 'google/gemini-3-flash-preview' : 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt + (marketImageUrls.length > 0 ? '\n\nYou will also receive brand visual assets (logos, imagery, patterns). Analyze them to strengthen your market positioning assessment and visual identity evaluation.' : '') },
          { role: 'user', content: userMessageContent }
        ],
        temperature: 0.4,
        max_tokens: 2000,
      }),
    });

    // If multimodal fails (broken image URLs), retry text-only
    if (!response.ok && marketImageUrls.length > 0 && response.status !== 429 && response.status !== 402) {
      console.warn('[market-analysis] Multimodal failed, retrying text-only:', response.status);
      await response.text(); // consume body
      response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-3-flash-preview',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.4,
          max_tokens: 2000,
        }),
      });
    }

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add funds.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from AI');
    }

    let analysisResult: AnalysisResult;
    try {
      analysisResult = JSON.parse(content.trim());
    } catch {
      try {
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) ||
                          content.match(/```(?:json)?\s*([\s\S]*)/) ||
                          content.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]).trim() : content.trim();
        analysisResult = JSON.parse(jsonStr);
      } catch {
        console.error('Failed to parse AI response:', content.substring(0, 500));
        return new Response(
          JSON.stringify({ error: 'Failed to parse analysis results' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    analysisResult.generatedAt = new Date().toISOString();

    console.log(`Analysis complete for ${entityName}. Score: ${analysisResult.score}`);

    return new Response(
      JSON.stringify({
        success: true,
        analysis: analysisResult,
        entityName,
        entityType: type,
        analysisType
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Analysis failed';
    console.error('Market analysis error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
