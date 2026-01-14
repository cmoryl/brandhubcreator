import { createClient } from 'npm:@supabase/supabase-js@2';

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

    const isAdmin = roleData?.role === 'admin';
    
    const { type, entityId, analysisType } = await req.json() as MarketAnalysisRequest;

    let contextData = '';
    let entityName = '';

    if (type === 'platform' && isAdmin) {
      // Fetch platform-wide stats for admin
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
        supabaseClient.from('brands').select('name, guide_data, is_public, created_at').order('created_at', { ascending: false }).limit(20)
      ]);

      entityName = 'Platform Overview';
      contextData = `
Platform Statistics:
- Total Users: ${usersCount || 0}
- Total Brands: ${brandsCount || 0}
- Total Products: ${productsCount || 0}
- Total Organizations: ${orgsCount || 0}

Recent Brand Activity (last 20):
${recentBrands?.map(b => {
  const guideData = b.guide_data as Record<string, unknown>;
  const hero = guideData?.hero as Record<string, string>;
  return `- ${b.name}: ${hero?.tagline || 'No tagline'} (${b.is_public ? 'Public' : 'Private'})`;
}).join('\n') || 'No recent brands'}
      `;
    } else if (type === 'brand' && entityId) {
      const { data: brand } = await supabaseClient
        .from('brands')
        .select('*')
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
      contextData = `
Brand: ${brand.name}
Status: ${brand.is_public ? 'Public' : 'Private'}
Created: ${brand.created_at}

Brand Details:
${JSON.stringify(guideData, null, 2)}
      `;
    } else if (type === 'product' && entityId) {
      const { data: product } = await supabaseClient
        .from('products')
        .select('*')
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
      contextData = `
Product: ${product.name}
Status: ${product.is_public ? 'Public' : 'Private'}
Created: ${product.created_at}

Product Details:
${JSON.stringify(guideData, null, 2)}
      `;
    } else if (type === 'organization' && entityId) {
      const { data: org } = await supabaseClient
        .from('organizations')
        .select('*')
        .eq('id', entityId)
        .single();

      if (!org) {
        return new Response(
          JSON.stringify({ error: 'Organization not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get org's brands and products
      const [{ data: brands }, { data: products }] = await Promise.all([
        supabaseClient.from('brands').select('name, guide_data, is_public').eq('organization_id', entityId),
        supabaseClient.from('products').select('name, guide_data, is_public').eq('organization_id', entityId)
      ]);

      entityName = org.name;
      contextData = `
Organization: ${org.name}
Slug: ${org.slug}
Created: ${org.created_at}

Brands (${brands?.length || 0}):
${brands?.map(b => `- ${b.name} (${b.is_public ? 'Public' : 'Private'})`).join('\n') || 'None'}

Products (${products?.length || 0}):
${products?.map(p => `- ${p.name} (${p.is_public ? 'Public' : 'Private'})`).join('\n') || 'None'}
      `;
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are a strategic business analyst and market research expert. Analyze the provided data and generate comprehensive market insights and strategic recommendations.

Your analysis should be actionable, specific, and based on the data provided. Consider:
- Current market trends in branding and digital presence
- Competitive positioning strategies
- Growth opportunities and potential risks
- Industry best practices

Respond with a JSON object matching this exact structure:
{
  "title": "<Analysis title>",
  "summary": "<Executive summary in 2-3 sentences>",
  "marketPosition": {
    "currentState": "<Current market position description>",
    "opportunities": ["<opportunity 1>", "<opportunity 2>", "<opportunity 3>"],
    "threats": ["<threat 1>", "<threat 2>"]
  },
  "competitiveAnalysis": {
    "strengths": ["<strength 1>", "<strength 2>"],
    "differentiators": ["<differentiator 1>", "<differentiator 2>"],
    "competitorInsights": ["<insight 1>", "<insight 2>"]
  },
  "growthRecommendations": {
    "shortTerm": ["<action 1>", "<action 2>"],
    "longTerm": ["<action 1>", "<action 2>"],
    "metrics": ["<KPI 1>", "<KPI 2>"]
  },
  "trendAnalysis": {
    "industryTrends": ["<trend 1>", "<trend 2>"],
    "emergingOpportunities": ["<opportunity 1>", "<opportunity 2>"],
    "risksToWatch": ["<risk 1>", "<risk 2>"]
  },
  "actionPlan": {
    "immediate": ["<action within 1 week>", "<action within 1 week>"],
    "quarterly": ["<action for next quarter>", "<action for next quarter>"],
    "annual": ["<strategic goal 1>", "<strategic goal 2>"]
  },
  "score": <overall health score 0-100>
}`;

    const userPrompt = `Perform a ${analysisType} analysis for: ${entityName}

Analysis Type: ${analysisType}
Entity Type: ${type}

Data:
${contextData}

Provide specific, actionable insights based on this data. Be concrete in your recommendations.`;

    console.log(`Running ${analysisType} analysis for ${entityName}`);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
        max_tokens: 3000,
      }),
    });

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
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      const jsonStr = jsonMatch[1] || content;
      analysisResult = JSON.parse(jsonStr.trim());
      analysisResult.generatedAt = new Date().toISOString();
    } catch {
      console.error('Failed to parse AI response:', content);
      return new Response(
        JSON.stringify({ error: 'Failed to parse analysis results' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
