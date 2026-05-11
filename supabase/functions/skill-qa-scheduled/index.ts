/**
 * Cron-invoked. Picks due `skill_qa_schedules` rows, kicks off skill-qa for each.
 * The orchestrator builds a minimal skill payload from each entity's guide_data
 * (skipping heavy intelligence) and POSTs to skill-qa. Updates last/next_run_at.
 */
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' };

const cadenceMs: Record<string, number> = {
  daily: 86400_000, weekly: 604800_000, biweekly: 1209600_000, monthly: 2592000_000,
};

async function pgGet(path: string) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SERVICE_ROLE, Authorization: `Bearer ${SERVICE_ROLE}` },
  });
  return r.json();
}
async function pgPatch(path: string, body: any) {
  await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: 'PATCH',
    headers: { apikey: SERVICE_ROLE, Authorization: `Bearer ${SERVICE_ROLE}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify(body),
  });
}

function buildMiniSkill(name: string, guide: any) {
  const colors = (guide?.colors || []).slice(0, 8).map((c: any) => `- ${c.name || ''}: \`${c.hex}\` ${c.role || ''}`).join('\n');
  const fonts = (guide?.typography || []).slice(0, 4).map((f: any) => `- ${f.role || ''}: ${f.fontFamily}`).join('\n');
  const skillMd = `---\nname: ${name}-skill\ndescription: "Scheduled QA snapshot for ${name}."\n---\n\n# ${name} skill\n\n## Colors\n${colors}\n\n## Typography\n${fonts}\n`;
  return {
    brandName: name,
    skillMd,
    sections: {
      colors: `# Colors\n${colors}`,
      typography: `# Typography\n${fonts}`,
      logos: `# Logos\n${(guide?.logos || []).map((l: any) => `- ${l.name} (${l.variant})`).join('\n')}`,
      voice: `# Voice\nTone: ${(guide?.voice?.tone || []).join(', ')}`,
      imagery: `# Imagery\n${(guide?.imagery || []).slice(0, 4).map((i: any) => `- ${i.description || ''}`).join('\n')}`,
      antiPatterns: `# Anti-patterns\n${(guide?.antiPatterns || []).map((a: any) => `- ${a.name || a.title}`).join('\n')}`,
    },
    referenceImageUrl: guide?.hero?.coverImage || null,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  const nowIso = new Date().toISOString();
  const due: any[] = await pgGet(`skill_qa_schedules?enabled=eq.true&or=(next_run_at.is.null,next_run_at.lte.${nowIso})&select=*&limit=20`);
  if (!Array.isArray(due) || !due.length) {
    return new Response(JSON.stringify({ ok: true, dispatched: 0 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  let dispatched = 0;
  for (const sch of due) {
    try {
      const table = sch.entity_type === 'product' ? 'products' : sch.entity_type === 'event' ? 'events' : 'brands';
      const rows: any[] = await pgGet(`${table}?id=eq.${sch.entity_id}&select=name,guide_data,organization_id`);
      const row = rows?.[0]; if (!row) continue;
      const skill = buildMiniSkill(row.name || 'Brand', row.guide_data || {});

      // POST to skill-qa (no JWT needed, verify_jwt=false; service role cannot pass user-context but skill-qa accepts Bearer)
      await fetch(`${SUPABASE_URL}/functions/v1/skill-qa`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${SERVICE_ROLE}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skill,
          tiers: ['haiku', 'sonnet'],
          includeVisualRegression: false,
          context: {
            entity_type: sch.entity_type, entity_id: sch.entity_id,
            organization_id: row.organization_id || sch.organization_id || null,
          },
        }),
      });
      const next = new Date(Date.now() + (cadenceMs[sch.cadence] || cadenceMs.weekly)).toISOString();
      await pgPatch(`skill_qa_schedules?id=eq.${sch.id}`, { last_run_at: nowIso, next_run_at: next, updated_at: nowIso });
      dispatched++;
    } catch (e) {
      console.error('schedule failed', sch.id, e);
    }
  }
  return new Response(JSON.stringify({ ok: true, dispatched }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
});
