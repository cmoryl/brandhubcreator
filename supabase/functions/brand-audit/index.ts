import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

async function getUser(authHeader: string) {
  const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { 'apikey': anonKey, 'Authorization': authHeader },
  });
  if (!res.ok) return null;
  return res.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const user = await getUser(authHeader);
    if (!user?.id) {
      return new Response(JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { brandId, entityType = 'brand' } = await req.json();

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!brandId || !uuidRegex.test(brandId) || !['brand', 'product'].includes(entityType)) {
      return new Response(JSON.stringify({ error: 'Invalid request' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const svcHeaders = {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    };

    // Create a job record
    const jobRes = await fetch(`${supabaseUrl}/rest/v1/brand_intelligence_jobs`, {
      method: 'POST',
      headers: svcHeaders,
      body: JSON.stringify({
        entity_id: brandId,
        entity_type: entityType,
        user_id: user.id,
        status: 'processing',
        progress: 0,
      }),
    });
    const jobRows = await jobRes.json();
    const jobId = jobRows?.[0]?.id;
    if (!jobId) throw new Error('Failed to create job');

    // Delegate to worker
    // @ts-ignore
    EdgeRuntime.waitUntil(
      fetch(`${supabaseUrl}/functions/v1/brand-audit-worker`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({ jobId, brandId, entityType, userId: user.id, userAuth: authHeader }),
      }).catch(async (error) => {
        console.error(`Worker call failed for job ${jobId}:`, error);
        await fetch(`${supabaseUrl}/rest/v1/brand_intelligence_jobs?id=eq.${jobId}`, {
          method: 'PATCH',
          headers: { ...svcHeaders, 'Prefer': 'return=minimal' },
          body: JSON.stringify({ status: 'failed', error_message: error.message, completed_at: new Date().toISOString() }),
        });
      })
    );

    return new Response(
      JSON.stringify({ jobId, status: 'processing' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in brand-audit:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
