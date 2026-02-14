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

// ── Section completeness from lightweight summary data ──

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

const HIDDEN_ID_MAP: Record<string, string> = {
  brandicon: 'brandIcons', socialicons: 'socialIcons', socialassets: 'socialAssets',
  website: 'websites', imageassets: 'imageAssets', bythenumbers: 'statistics',
  templatespecs: 'templateSpecs', presentations: 'presentationTemplates',
  casestudies: 'caseStudies', sponsorlogos: 'sponsorLogos', clientlogos: 'clientLogos',
  eventsignage: 'eventSignage', universe: 'linkedGuides',
};

// Get count for a section from the lightweight summary
function getCount(summary: Record<string, unknown>, key: string): number {
  const countKey = `${key}Count`;
  return (summary[countKey] as number) || 0;
}

function sectionCompletenessFromSummary(summary: Record<string, unknown>, key: string): number {
  switch (key) {
    case 'hero': {
      const h = summary.hero as Record<string, unknown> | undefined;
      if (!h?.name) return 0;
      const filled = ['name', 'tagline', 'description', 'hasImage', 'hasCover', 'hasCard']
        .filter(f => h[f]).length;
      return filled >= 4 ? 1 : filled >= 2 ? 0.6 : 0.3;
    }
    case 'tagline': {
      const h = summary.hero as Record<string, unknown> | undefined;
      return h?.tagline ? 1 : 0;
    }
    case 'identity': {
      const id = summary.identity as Record<string, unknown> | undefined;
      if (!id) return 0;
      const filled = ['missionStatement', 'visionStatement', 'archetype', 'hasBrandPromise', 'hasPersonality', 'hasVoiceTone', 'hasBrandStory']
        .filter(f => id[f]).length;
      return filled >= 4 ? 1 : filled >= 2 ? 0.6 : filled >= 1 ? 0.3 : 0;
    }
    case 'qr': return summary.hasQrUrl ? 1 : 0;
    case 'colors': {
      const c = getCount(summary, key);
      return c >= 6 ? 1 : c >= 4 ? 0.8 : c >= 2 ? 0.6 : c > 0 ? 0.3 : 0;
    }
    case 'typography': {
      const c = getCount(summary, key);
      return c >= 3 ? 1 : c >= 2 ? 0.7 : c > 0 ? 0.5 : 0;
    }
    case 'logos': {
      const c = getCount(summary, key);
      return c >= 4 ? 1 : c >= 2 ? 0.7 : c > 0 ? 0.4 : 0;
    }
    case 'values': case 'services': {
      const c = getCount(summary, key);
      return c >= 4 ? 1 : c >= 2 ? 0.6 : c > 0 ? 0.3 : 0;
    }
    default: {
      const c = getCount(summary, key);
      return c >= 3 ? 1 : c >= 2 ? 0.7 : c > 0 ? 0.4 : 0;
    }
  }
}

function buildSectionSummaryFromRPC(summary: Record<string, unknown>): string {
  const hiddenSections = Array.isArray(summary.hiddenSections) ? summary.hiddenSections as string[] : [];
  const hiddenKeys = new Set(hiddenSections.map(id => HIDDEN_ID_MAP[id] ?? id));
  const lines: string[] = [];
  const catMap: Record<string, { filled: number; total: number; details: string[] }> = {};

  for (const [key, def] of Object.entries(SECTION_DEFS)) {
    if (hiddenKeys.has(key)) continue;
    const score = sectionCompletenessFromSummary(summary, key);
    const pct = Math.round(score * 100);
    if (!catMap[def.category]) catMap[def.category] = { filled: 0, total: 0, details: [] };
    catMap[def.category].total++;
    if (score > 0) catMap[def.category].filled++;

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

  // Add key content details from summary
  const identity = summary.identity as Record<string, unknown> | undefined;
  if (identity?.missionStatement) lines.push(`Mission: ${String(identity.missionStatement).substring(0, 120)}`);
  if (identity?.archetype) lines.push(`Archetype: ${identity.archetype}`);

  const colorNames = summary.colorNames;
  if (Array.isArray(colorNames) && colorNames.length > 0) {
    lines.push(`Colors: ${colorNames.filter(Boolean).slice(0, 6).join(', ')}`);
  }

  const fontNames = summary.fontNames;
  if (Array.isArray(fontNames) && fontNames.length > 0) {
    lines.push(`Typography: ${fontNames.filter(Boolean).slice(0, 4).join(', ')}`);
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

    // Use lightweight RPC to get only section metadata (~1KB instead of 77MB)
    const [summaryRes, intelRes] = await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/rpc/get_brand_audit_summary`, {
        method: 'POST',
        headers: svcHeaders,
        body: JSON.stringify({ p_brand_id: brandId, p_entity_type: entityType || 'brand' }),
      }),
      fetch(`${supabaseUrl}/rest/v1/brand_intelligence?entity_id=eq.${brandId}&entity_type=eq.${entityType}&select=brand_summary,market_position,competitive_advantages&limit=1`, {
        headers: { 'apikey': anonKey, 'Authorization': userAuth, 'Content-Type': 'application/json' },
      }),
    ]);

    const summary = await summaryRes.json();
    const intelRows = await intelRes.json();

    if (summary?.error === 'not_found') {
      throw new Error('Brand not found');
    }

    const brandName = summary.name || 'Unnamed';

    await updateJob(jobId!, { progress: 30 });

    // Build section-aware summary from lightweight data
    const sectionSummary = buildSectionSummaryFromRPC(summary);

    await updateJob(jobId!, { progress: 50 });

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

    // Add Oracle context (lightweight — only text fields)
    const orgId = body.organizationId;
    if (orgId) {
      try {
        const oracleRes = await fetch(`${supabaseUrl}/rest/v1/oracle_intelligence?organization_id=eq.${orgId}&select=org_summary,unified_voice_profile,strategic_recommendations&limit=1`, { headers: svcHeaders });
        const oracleRows = await oracleRes.json();
        const oracle = Array.isArray(oracleRows) && oracleRows.length > 0 ? oracleRows[0] : null;
        if (oracle?.org_summary) {
          promptLines.push(`\n## Oracle Brain (Org-Level Strategic Context)`);
          promptLines.push(`Org Strategy: ${String(oracle.org_summary).substring(0, 300)}`);
          if (oracle.unified_voice_profile?.primary_tone) promptLines.push(`Org Voice: ${oracle.unified_voice_profile.primary_tone}`);
          const recs = Array.isArray(oracle.strategic_recommendations) ? oracle.strategic_recommendations : [];
          if (recs.length > 0) promptLines.push(`Strategic Priorities: ${recs.slice(0, 3).map((r: any) => r.recommendation || r).join('; ')}`);
        }
      } catch (e) {
        console.warn('[audit-worker] Oracle context parse failed (non-critical):', e);
      }
    }

    promptLines.push(`\nAudit this brand for cohesion and completeness across ALL visible sections. Consider Oracle org-level context for strategic alignment. Return JSON.`);

    await updateJob(jobId!, { progress: 60 });

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
            content: `You are a brand cohesion expert auditing a brand guide. You have been given a detailed section-by-section completeness breakdown. Evaluate visual consistency, identity coherence, digital presence maturity, overall completeness, AND bias & inclusivity.

Return JSON only:
{"overallScore":<0-100>,"categories":[{"name":"<category name>","score":<0-100>,"findings":["specific finding..."],"recommendations":["actionable rec..."]}],"biasReview":{"score":<0-100>,"languageInclusivity":{"score":<0-100>,"findings":["..."],"recommendations":["..."]},"visualRepresentation":{"score":<0-100>,"findings":["..."],"recommendations":["..."]},"culturalSensitivity":{"score":<0-100>,"findings":["..."],"recommendations":["..."]},"accessibilityConsiderations":{"score":<0-100>,"findings":["..."],"recommendations":["..."]},"overallFindings":["..."],"overallRecommendations":["..."]},"summary":"<2-3 sentences on overall cohesion>","strengths":["..."],"weaknesses":["..."],"actionItems":["prioritized action..."]}

Categories MUST include: Visual Consistency, Brand Identity, Digital Presence, Content Completeness, Marketing Materials, Best Practices.

For the biasReview section, analyze the brand guide content for:
- Language Inclusivity: gendered language, ableist terms, cultural assumptions in taglines/mission/values/messaging
- Visual Representation: diversity signals in imagery guidelines, logo accessibility, color contrast considerations
- Cultural Sensitivity: region-specific messaging concerns, universal vs localized tone, potential cultural blind spots
- Accessibility Considerations: alt text practices, color-only information, typography readability, screen reader friendliness

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
          hiddenSectionsExcluded: (Array.isArray(summary.hiddenSections) ? summary.hiddenSections.length : 0),
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
