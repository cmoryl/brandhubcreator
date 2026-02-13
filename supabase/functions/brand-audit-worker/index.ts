import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const svcHeaders = {
  'apikey': serviceKey,
  'Authorization': `Bearer ${serviceKey}`,
  'Content-Type': 'application/json',
};

async function updateJob(jobId: string, updates: Record<string, unknown>) {
  await fetch(`${supabaseUrl}/rest/v1/brand_intelligence_jobs?id=eq.${jobId}`, {
    method: 'PATCH',
    headers: { ...svcHeaders, 'Prefer': 'return=minimal' },
    body: JSON.stringify(updates),
  });
}

serve(async (req) => {
  let jobId: string | null = null;

  try {
    const body = await req.json();
    jobId = body.jobId;
    const { brandId, entityType, userAuth } = body;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    // Fetch brand data via REST using user's auth (respects RLS)
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const tableName = entityType === 'product' ? 'products' : 'brands';

    // Fetch brand name only (no guide_data to avoid memory issues) + intelligence data
    const [brandRes, intelRes] = await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/${tableName}?id=eq.${brandId}&select=id,name&limit=1`, {
        headers: { 'apikey': anonKey, 'Authorization': userAuth, 'Content-Type': 'application/json' },
      }),
      fetch(`${supabaseUrl}/rest/v1/brand_intelligence?entity_id=eq.${brandId}&entity_type=eq.${entityType}&select=brand_summary,market_position,competitive_advantages,growth_recommendations,brand_voice_profile,target_audience,cultural_insights&limit=1`, {
        headers: { 'apikey': anonKey, 'Authorization': userAuth, 'Content-Type': 'application/json' },
      }),
    ]);

    const brandRows = await brandRes.json();
    const intelRows = await intelRes.json();

    if (!Array.isArray(brandRows) || brandRows.length === 0) {
      throw new Error('Brand not found');
    }

    await updateJob(jobId!, { progress: 30 });

    const brandName = brandRows[0].name || 'Unnamed';

    // Build compact prompt from intelligence data only
    const lines: string[] = [];
    lines.push(`# Brand Audit: ${brandName}`);
    lines.push(`Type: ${entityType}`);

    if (Array.isArray(intelRows) && intelRows.length > 0) {
      const intel = intelRows[0];
      if (intel.brand_summary) lines.push(`Summary: ${String(intel.brand_summary).substring(0, 300)}`);
      if (intel.market_position) lines.push(`Market Position: ${String(intel.market_position).substring(0, 150)}`);
      if (intel.brand_voice_profile) {
        const voice = typeof intel.brand_voice_profile === 'string' ? intel.brand_voice_profile : JSON.stringify(intel.brand_voice_profile);
        lines.push(`Voice: ${voice.substring(0, 200)}`);
      }
      if (intel.competitive_advantages) {
        const adv = Array.isArray(intel.competitive_advantages) ? intel.competitive_advantages.slice(0, 5).join(', ') : String(intel.competitive_advantages).substring(0, 200);
        lines.push(`Advantages: ${adv}`);
      }
      if (intel.target_audience) {
        const ta = typeof intel.target_audience === 'string' ? intel.target_audience : JSON.stringify(intel.target_audience);
        lines.push(`Audience: ${ta.substring(0, 200)}`);
      }
    } else {
      lines.push('No intelligence data available yet. Provide a general assessment based on the brand name.');
    }

    lines.push(`\nAnalyze for cohesion. Return JSON.`);

    await updateJob(jobId!, { progress: 50 });

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
            content: `You are a brand cohesion expert. Return JSON only:
{"overallScore":<0-100>,"categories":[{"name":"<name>","score":<0-100>,"findings":["..."],"recommendations":["..."]}],"summary":"<2-3 sentences>","strengths":["..."],"weaknesses":["..."],"actionItems":["..."]}
Categories: Visual Consistency, Brand Identity, Digital Presence, Completeness, Competitive Position, Best Practices.`
          },
          { role: 'user', content: lines.join('\n') }
        ],
        temperature: 0.3,
        max_tokens: 1800,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`AI Gateway error: ${response.status} - ${errText.slice(0, 200)}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;
    if (!content) throw new Error('No AI response');

    let auditResult;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      let fixedJson = (jsonMatch[1] || content).trim();
      if (!fixedJson.endsWith('}')) {
        const lastBrace = fixedJson.lastIndexOf('}');
        if (lastBrace > 0) fixedJson = fixedJson.substring(0, lastBrace + 1);
      }
      auditResult = JSON.parse(fixedJson);
    } catch {
      auditResult = {
        overallScore: 70,
        categories: [{ name: 'Analysis', score: 70, findings: ['Parsing failed'], recommendations: ['Try again'] }],
        summary: content.substring(0, 200),
        strengths: ['Brand guide exists'],
        weaknesses: ['Could not parse detailed analysis'],
        actionItems: ['Enhance brand guide completeness']
      };
    }

    await updateJob(jobId!, {
      status: 'completed',
      progress: 100,
      result: {
        audit: auditResult,
        brandName: brandName,
        auditDate: new Date().toISOString(),
        dataSources: { brandIntelligence: intelRows?.length > 0 },
      },
      completed_at: new Date().toISOString(),
    });

    console.log(`Audit complete for ${brandName}. Score: ${auditResult.overallScore}`);

    return new Response(JSON.stringify({ success: true }),
      { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Worker error:', error);
    if (jobId) {
      await updateJob(jobId, {
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        completed_at: new Date().toISOString(),
      });
    }
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});
