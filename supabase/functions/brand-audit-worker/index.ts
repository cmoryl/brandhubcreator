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

// ── Lightweight section analysis (mirrors brandHealthCalculator.ts logic) ──

const SECTION_DEFS: Record<string, { weight: number; label: string; category: string }> = {
  hero:       { weight: 10, label: 'Brand Name & Hero', category: 'Core Identity' },
  tagline:    { weight: 6, label: 'Tagline', category: 'Core Identity' },
  identity:   { weight: 8, label: 'Mission & Vision', category: 'Core Identity' },
  values:     { weight: 8, label: 'Core Values', category: 'Core Identity' },
  services:   { weight: 8, label: 'Services', category: 'Core Identity' },
  colors:     { weight: 10, label: 'Color Palette', category: 'Visual Identity' },
  colorCombinations: { weight: 2, label: 'Color Combinations', category: 'Visual Identity' },
  typography: { weight: 8, label: 'Typography', category: 'Visual Identity' },
  logos:      { weight: 10, label: 'Logo Assets', category: 'Visual Identity' },
  brandIcons: { weight: 3, label: 'Brand Icons', category: 'Visual Identity' },
  gradients:  { weight: 2, label: 'Gradients', category: 'Visual Identity' },
  patterns:   { weight: 2, label: 'Patterns', category: 'Visual Identity' },
  iconography:{ weight: 3, label: 'Iconography', category: 'Visual Identity' },
  social:     { weight: 5, label: 'Social Profiles', category: 'Digital Presence' },
  socialAssets:{ weight: 2, label: 'Social Assets', category: 'Digital Presence' },
  websites:   { weight: 3, label: 'Website', category: 'Digital Presence' },
  qr:         { weight: 2, label: 'QR Codes', category: 'Digital Presence' },
  signatures: { weight: 2, label: 'Email Signatures', category: 'Digital Presence' },
  imagery:    { weight: 3, label: 'Imagery Guidelines', category: 'Content & Assets' },
  imageAssets:{ weight: 2, label: 'Image Assets', category: 'Content & Assets' },
  misuse:     { weight: 2, label: 'Misuse Guidelines', category: 'Content & Assets' },
  templates:  { weight: 3, label: 'Templates', category: 'Marketing Materials' },
  brochures:  { weight: 3, label: 'Brochures', category: 'Marketing Materials' },
  presentationTemplates: { weight: 2, label: 'Presentations', category: 'Marketing Materials' },
  awards:     { weight: 2, label: 'Awards', category: 'Business & Events' },
  statistics: { weight: 2, label: 'Statistics', category: 'Business & Events' },
  clientLogos:{ weight: 2, label: 'Client Logos', category: 'Partnerships' },
  sponsorLogos:{ weight: 2, label: 'Sponsor Logos', category: 'Partnerships' },
};

// Map hidden section IDs to guide_data keys
const HIDDEN_ID_MAP: Record<string, string> = {
  brandicon: 'brandIcons', socialicons: 'socialIcons', socialassets: 'socialAssets',
  website: 'websites', imageassets: 'imageAssets', bythenumbers: 'statistics',
  templatespecs: 'templateSpecs', presentations: 'presentationTemplates',
  casestudies: 'caseStudies', sponsorlogos: 'sponsorLogos', clientlogos: 'clientLogos',
  eventsignage: 'eventSignage', universe: 'linkedGuides',
};

function safeArr(v: unknown): unknown[] { return Array.isArray(v) ? v : []; }

function sectionCompleteness(gd: Record<string, unknown>, key: string): number {
  switch (key) {
    case 'hero': {
      const h = gd.hero as Record<string, unknown> | undefined;
      if (!h?.name) return 0;
      const filled = ['name','description','tagline','imageUrl','coverImage','cardImage'].filter(f => h[f]).length;
      return filled >= 4 ? 1 : filled >= 2 ? 0.6 : 0.3;
    }
    case 'tagline': return (gd.hero as any)?.tagline ? 1 : 0;
    case 'identity': {
      const id = gd.identity as Record<string, unknown> | undefined;
      if (!id) return 0;
      const filled = ['missionStatement','visionStatement','brandPromise','personality','voiceTone','archetype','brandStory'].filter(f => id[f]).length;
      return filled >= 4 ? 1 : filled >= 2 ? 0.6 : filled >= 1 ? 0.3 : 0;
    }
    case 'values': case 'services': {
      const arr = safeArr(gd[key]);
      return arr.length >= 4 ? 1 : arr.length >= 2 ? 0.6 : arr.length > 0 ? 0.3 : 0;
    }
    case 'colors': {
      const c = safeArr(gd.colors);
      return c.length >= 6 ? 1 : c.length >= 4 ? 0.8 : c.length >= 2 ? 0.6 : c.length > 0 ? 0.3 : 0;
    }
    case 'typography': {
      const t = safeArr(gd.typography);
      return t.length >= 3 ? 1 : t.length >= 2 ? 0.7 : t.length > 0 ? 0.5 : 0;
    }
    case 'logos': {
      const l = safeArr(gd.logos);
      return l.length >= 4 ? 1 : l.length >= 2 ? 0.7 : l.length > 0 ? 0.4 : 0;
    }
    case 'qr': {
      const q = gd.qr as Record<string, unknown> | undefined;
      return q?.defaultUrl ? 1 : 0;
    }
    default: {
      const arr = safeArr(gd[key]);
      return arr.length >= 3 ? 1 : arr.length >= 2 ? 0.7 : arr.length > 0 ? 0.4 : 0;
    }
  }
}

function buildSectionSummary(guideData: Record<string, unknown>, hiddenSections?: string[]): string {
  const hiddenKeys = new Set((hiddenSections ?? []).map(id => HIDDEN_ID_MAP[id] ?? id));
  const lines: string[] = [];
  const catMap: Record<string, { filled: number; total: number; details: string[] }> = {};

  for (const [key, def] of Object.entries(SECTION_DEFS)) {
    if (hiddenKeys.has(key)) continue;
    const score = sectionCompleteness(guideData, key);
    const pct = Math.round(score * 100);
    if (!catMap[def.category]) catMap[def.category] = { filled: 0, total: 0, details: [] };
    catMap[def.category].total++;
    if (score > 0) catMap[def.category].filled++;

    // Add detail for notable sections
    if (pct === 0) {
      catMap[def.category].details.push(`${def.label}: EMPTY`);
    } else if (pct < 70) {
      catMap[def.category].details.push(`${def.label}: ${pct}% complete`);
    } else {
      catMap[def.category].details.push(`${def.label}: ${pct}%`);
    }
  }

  for (const [cat, info] of Object.entries(catMap)) {
    lines.push(`## ${cat} (${info.filled}/${info.total} sections filled)`);
    lines.push(info.details.join(' | '));
  }

  // Add key content details (compact)
  const identity = guideData.identity as Record<string, unknown> | undefined;
  if (identity?.missionStatement) lines.push(`Mission: ${String(identity.missionStatement).substring(0, 120)}`);
  if (identity?.archetype) lines.push(`Archetype: ${identity.archetype}`);

  const colors = safeArr(guideData.colors);
  if (colors.length > 0) {
    const colorNames = colors.slice(0, 6).map((c: any) => c?.name || c?.hex || '?').join(', ');
    lines.push(`Colors: ${colorNames}`);
  }

  const typo = safeArr(guideData.typography);
  if (typo.length > 0) {
    const fonts = typo.slice(0, 4).map((t: any) => t?.family || t?.name || '?').join(', ');
    lines.push(`Typography: ${fonts}`);
  }

  return lines.join('\n');
}

serve(async (req) => {
  let jobId: string | null = null;

  try {
    const body = await req.json();
    jobId = body.jobId;
    const { brandId, entityType, userAuth } = body;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const tableName = entityType === 'product' ? 'products' : 'brands';

    // Fetch brand data, intelligence, AND Oracle context
    const orgId = body.organizationId;
    const [brandRes, intelRes, oracleRes, oracleKbRes] = await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/${tableName}?id=eq.${brandId}&select=id,name,guide_data,hidden_sections&limit=1`, {
        headers: { 'apikey': anonKey, 'Authorization': userAuth, 'Content-Type': 'application/json' },
      }),
      fetch(`${supabaseUrl}/rest/v1/brand_intelligence?entity_id=eq.${brandId}&entity_type=eq.${entityType}&select=brand_summary,market_position,competitive_advantages,growth_recommendations,brand_voice_profile,target_audience,cultural_insights&limit=1`, {
        headers: { 'apikey': anonKey, 'Authorization': userAuth, 'Content-Type': 'application/json' },
      }),
      orgId ? fetch(`${supabaseUrl}/rest/v1/oracle_intelligence?organization_id=eq.${orgId}&select=org_summary,unified_voice_profile,strategic_recommendations,competitive_overview&limit=1`, { headers: svcHeaders }) : Promise.resolve(null),
      orgId ? fetch(`${supabaseUrl}/rest/v1/oracle_knowledge_base?organization_id=eq.${orgId}&is_active=eq.true&source_type=neq.entity_brain&order=updated_at.desc&limit=3&select=title,content`, { headers: svcHeaders }) : Promise.resolve(null),
    ]);

    const brandRows = await brandRes.json();
    const intelRows = await intelRes.json();

    if (!Array.isArray(brandRows) || brandRows.length === 0) {
      throw new Error('Brand not found');
    }

    await updateJob(jobId!, { progress: 20 });

    const brand = brandRows[0];
    const brandName = brand.name || 'Unnamed';
    const guideData = (brand.guide_data || {}) as Record<string, unknown>;
    const hiddenSections = Array.isArray(brand.hidden_sections) ? brand.hidden_sections : [];

    // Build section-aware summary
    const sectionSummary = buildSectionSummary(guideData, hiddenSections);

    await updateJob(jobId!, { progress: 40 });

    // Build prompt
    const promptLines: string[] = [];
    promptLines.push(`# Brand Cohesion Audit: ${brandName}`);
    promptLines.push(`Type: ${entityType}\n`);
    promptLines.push(`## Section Analysis`);
    promptLines.push(sectionSummary);

    // Add intelligence context if available
    if (Array.isArray(intelRows) && intelRows.length > 0) {
      const intel = intelRows[0];
      promptLines.push(`\n## Intelligence Context`);
      if (intel.brand_summary) promptLines.push(`Summary: ${String(intel.brand_summary).substring(0, 200)}`);
      if (intel.market_position) promptLines.push(`Market Position: ${String(intel.market_position).substring(0, 120)}`);
      if (intel.competitive_advantages) {
        const adv = Array.isArray(intel.competitive_advantages) ? intel.competitive_advantages.slice(0, 5).join(', ') : String(intel.competitive_advantages).substring(0, 150);
        promptLines.push(`Advantages: ${adv}`);
      }
    }

    // Add Oracle org-level context
    try {
      const oracleRows = oracleRes ? await oracleRes.json() : [];
      const oracleKbRows = oracleKbRes ? await oracleKbRes.json() : [];
      const oracle = Array.isArray(oracleRows) && oracleRows.length > 0 ? oracleRows[0] : null;
      const oracleKb = Array.isArray(oracleKbRows) ? oracleKbRows : [];
      if (oracle || oracleKb.length > 0) {
        promptLines.push(`\n## Oracle Brain (Org-Level Strategic Context)`);
        if (oracle?.org_summary) promptLines.push(`Org Strategy: ${oracle.org_summary}`);
        if (oracle?.unified_voice_profile?.primary_tone) promptLines.push(`Org Voice: ${oracle.unified_voice_profile.primary_tone}`);
        const recs = Array.isArray(oracle?.strategic_recommendations) ? oracle.strategic_recommendations : [];
        if (recs.length > 0) promptLines.push(`Strategic Priorities: ${recs.slice(0, 3).map((r: any) => r.recommendation).join('; ')}`);
        if (oracleKb.length > 0) promptLines.push(`Key Knowledge: ${oracleKb.map((k: any) => `${k.title}: ${(k.content || '').slice(0, 100)}`).join(' | ')}`);
      }
    } catch (e) {
      console.warn('[audit-worker] Oracle context parse failed (non-critical):', e);
    }

    promptLines.push(`\nAudit this brand for cohesion and completeness across ALL visible sections. Consider Oracle org-level context for strategic alignment. Return JSON.`);

    await updateJob(jobId!, { progress: 55 });

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
            content: `You are a brand cohesion expert auditing a brand guide. You have been given a detailed section-by-section completeness breakdown. Evaluate visual consistency, identity coherence, digital presence maturity, and overall completeness.

Return JSON only:
{"overallScore":<0-100>,"categories":[{"name":"<category name>","score":<0-100>,"findings":["specific finding..."],"recommendations":["actionable rec..."]}],"summary":"<2-3 sentences on overall cohesion>","strengths":["..."],"weaknesses":["..."],"actionItems":["prioritized action..."]}

Categories MUST include: Visual Consistency, Brand Identity, Digital Presence, Content Completeness, Marketing Materials, Best Practices.
Score based on ACTUAL section data provided. Empty sections should significantly reduce relevant category scores. Be specific — reference actual section names and completion levels in findings.`
          },
          { role: 'user', content: promptLines.join('\n') }
        ],
        temperature: 0.3,
        max_tokens: 2200,
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
        dataSources: {
          brandIntelligence: intelRows?.length > 0,
          guideDataSections: true,
          hiddenSectionsExcluded: hiddenSections.length,
        },
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
