import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const { bucket, files } = await req.json()
    if (!bucket || !Array.isArray(files)) {
      return new Response(JSON.stringify({ error: 'bucket and files[] required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    const results: any[] = []
    for (const f of files) {
      try {
        const bin = Uint8Array.from(atob(f.base64), c => c.charCodeAt(0))
        const { error } = await supabase.storage.from(bucket).upload(f.path, bin, {
          contentType: f.contentType || 'application/octet-stream',
          upsert: true,
        })
        if (error) results.push({ path: f.path, ok: false, error: error.message })
        else {
          const { data } = supabase.storage.from(bucket).getPublicUrl(f.path)
          results.push({ path: f.path, ok: true, url: data.publicUrl })
        }
      } catch (e: any) {
        results.push({ path: f.path, ok: false, error: e.message })
      }
    }
    return new Response(JSON.stringify({ results }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
