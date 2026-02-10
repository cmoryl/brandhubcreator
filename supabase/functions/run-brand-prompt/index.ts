import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const { prompt, brandIds, includeProducts = false } = await req.json();

    if (!prompt || typeof prompt !== 'string' || prompt.length < 10 || prompt.length > 2000) {
      return new Response(
        JSON.stringify({ error: 'Prompt must be between 10 and 2000 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has permission to use AI features (org admin or higher)
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: canUseAI } = await serviceClient.rpc('can_use_ai_features', {
      _user_id: user.id
    });

    if (!canUseAI) {
      console.log("[run-brand-prompt] User lacks AI permissions:", user.id);
      return new Response(
        JSON.stringify({ error: 'Organization admin role required for custom AI prompts' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting: Check recent prompt runs
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: promptCount } = await supabaseClient
      .from('audit_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('action_type', 'custom_prompt')
      .gte('created_at', oneHourAgo);

    if (promptCount !== null && promptCount >= 20) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Maximum 20 custom prompts per hour.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch brands - RLS handles access control
    let brandsQuery = supabaseClient
      .from('brands')
      .select('id, name, guide_data, is_public, organization_id, created_at, updated_at');

    if (brandIds && Array.isArray(brandIds) && brandIds.length > 0) {
      // Validate UUIDs
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const validIds = brandIds.filter((id: string) => uuidRegex.test(id));
      if (validIds.length > 0) {
        brandsQuery = brandsQuery.in('id', validIds.slice(0, 20)); // Limit to 20 brands
      }
    }

    // Select only essential fields to reduce memory
    const { data: brands, error: brandsError } = await brandsQuery
      .select('id, name, guide_data, is_public')
      .limit(20);

    if (brandsError) {
      console.error('Error fetching brands:', brandsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch brand data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let products: unknown[] = [];
    if (includeProducts) {
      const { data: productsData } = await supabaseClient
        .from('products')
        .select('id, name, guide_data, is_public, parent_brand_id')
        .limit(100);
      products = productsData || [];
    }

    // Build context from brand data
    const brandContext = await buildBrandContext(brands || [], products);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log(`Running custom prompt for user ${user.id} on ${brands?.length || 0} brands`);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          {
            role: 'system',
            content: `You are an expert brand strategist and analyst. You have access to a portfolio of brand data and will answer questions or perform analysis based on the user's prompt.

Be concise, specific, and actionable in your responses. Use data from the provided brands to support your analysis. Format your response in clear sections with headers when appropriate.

If asked to compare brands, provide specific examples and metrics where available.
If asked for recommendations, prioritize by impact and feasibility.
If data is missing or incomplete, note this and provide guidance on what information would help.`
          },
          {
            role: 'user',
            content: `## Brand Portfolio Data\n\n${brandContext}\n\n---\n\n## User Request\n\n${prompt}`
          }
        ],
        temperature: 0.4,
        max_tokens: 3000,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'AI rate limits exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI usage limit reached. Please contact support.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'AI gateway error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log this prompt for rate limiting
    await supabaseClient
      .from('audit_logs')
      .insert({
        user_id: user.id,
        brand_id: brands?.[0]?.id || '00000000-0000-0000-0000-000000000000',
        action_type: 'custom_prompt',
        entity_type: 'report',
        entity_name: prompt.substring(0, 100),
        details: { brandCount: brands?.length || 0, includeProducts }
      });

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to run prompt';
    console.error('Run prompt error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function buildBrandContext(brands: unknown[], products: unknown[]): Promise<string> {
  const { extractFullBrandContext } = await import('../_shared/extractFullBrandContext.ts');
  const sections: string[] = [];
  
  sections.push(`### Portfolio Overview`);
  sections.push(`- Total Brands: ${brands.length}`);
  sections.push(`- Total Products: ${products.length}`);
  sections.push(`- Public Brands: ${brands.filter((b: any) => b.is_public).length}`);
  sections.push('');

  for (const brand of brands as any[]) {
    const guideData = brand.guide_data || {};
    sections.push(`### ${brand.name}`);
    sections.push(`- Status: ${brand.is_public ? 'Public' : 'Private'}`);
    
    const { text, sectionsWithData } = extractFullBrandContext(guideData, brand.name, 'brand', 1500);
    sections.push(text);
    sections.push(`- Data Coverage: ${sectionsWithData.length} sections populated`);
    sections.push('');
  }

  if (products.length > 0) {
    sections.push(`### Products`);
    for (const product of products as any[]) {
      const guideData = product.guide_data || {};
      const hero = guideData.hero || {};
      sections.push(`- ${product.name}${hero.tagline ? `: ${hero.tagline}` : ''} (${product.is_public ? 'Public' : 'Private'})`);
    }
  }

  return sections.join('\n');
}
