// Public read of synced Canva templates for the audit page.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data, error } = await supabase
      .from('canva_templates')
      .select('canva_id,title,design_type,thumbnail_url,view_url,edit_url,width,height,tags,canva_updated_at,synced_at')
      .order('title', { ascending: true });
    if (error) throw error;

    const { data: status } = await supabase.rpc('canva_connection_status');
    const lastSync = (data ?? []).reduce((max: string | null, t: any) => {
      return !max || (t.synced_at && t.synced_at > max) ? t.synced_at : max;
    }, null as string | null);

    return new Response(JSON.stringify({
      ok: true,
      connected: Array.isArray(status) ? status.length > 0 : !!status,
      last_sync: lastSync,
      count: data?.length ?? 0,
      templates: data ?? [],
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
