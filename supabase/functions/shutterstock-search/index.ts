import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const userId = claimsData.claims.sub;

    // Check admin access
    const { data: canUse } = await supabase.rpc('can_use_ai_features', { _user_id: userId });
    if (!canUse) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const SHUTTERSTOCK_API_TOKEN = Deno.env.get('SHUTTERSTOCK_API_TOKEN');
    if (!SHUTTERSTOCK_API_TOKEN) {
      return new Response(JSON.stringify({ error: 'Shutterstock API token not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { query, orientation, category, color, page = 1, per_page = 20 } = await req.json();

    if (!query || typeof query !== 'string') {
      return new Response(JSON.stringify({ error: 'Search query is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Build Shutterstock API URL
    const params = new URLSearchParams({
      query,
      page: String(page),
      per_page: String(Math.min(per_page, 50)),
      sort: 'popular',
      image_type: 'photo',
    });

    if (orientation && ['horizontal', 'vertical', 'square'].includes(orientation)) {
      params.set('orientation', orientation);
    }
    if (category) {
      params.set('category', category);
    }

    const ssResponse = await fetch(`https://api.shutterstock.com/v2/images/search?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${SHUTTERSTOCK_API_TOKEN}`,
        'Accept': 'application/json',
      },
    });

    if (!ssResponse.ok) {
      const errorText = await ssResponse.text();
      console.error('Shutterstock API error:', ssResponse.status, errorText);
      return new Response(JSON.stringify({ error: `Shutterstock API error: ${ssResponse.status}` }), { status: ssResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const ssData = await ssResponse.json();

    // Map to simplified response
    const results = (ssData.data || []).map((img: any) => ({
      id: img.id,
      description: img.description,
      url: img.assets?.preview?.url || img.assets?.large_thumb?.url || '',
      thumbnailUrl: img.assets?.large_thumb?.url || img.assets?.small_thumb?.url || '',
      previewUrl: img.assets?.preview?.url || '',
      width: img.assets?.preview?.width || 0,
      height: img.assets?.preview?.height || 0,
      contributor: img.contributor?.id,
      categories: (img.categories || []).map((c: any) => c.name),
    }));

    return new Response(JSON.stringify({
      results,
      totalCount: ssData.total_count || 0,
      page: ssData.page || page,
      perPage: ssData.per_page || per_page,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('shutterstock-search error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
