import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { INCLUSIVE_LANGUAGE_PATTERNS, buildDeepIntelligencePromptContext } from "../_shared/inclusive-language-patterns.ts";

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
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }

  let jobId: string | null = null;

  try {
    const rawText = await req.text();
    if (!rawText || rawText.trim().length === 0) {
      console.error('Worker received empty body');
      return new Response(JSON.stringify({ error: 'Empty request body' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    
    let body: Record<string, unknown>;
    try {
      body = JSON.parse(rawText);
    } catch (parseErr) {
      console.error('Worker body parse failed. Raw:', rawText.substring(0, 200));
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    
    jobId = body.jobId as string;
    const brandId = body.brandId as string;
    const entityType = body.entityType as string;
    const userAuth = body.userAuth as string;

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

    // Add Deep Intelligence context for enhanced bias review
    const deepIntelCtx = buildDeepIntelligencePromptContext();
    promptLines.push(`\n${deepIntelCtx}`);

    promptLines.push(`\nAudit this brand for cohesion and completeness across ALL visible sections. Consider Oracle org-level context for strategic alignment. Apply Deep Intelligence modules for bias and inclusivity scoring. Return JSON.`);

    await updateJob(jobId!, { progress: 60 });

    const auditToolDef = {
      type: "function",
      function: {
        name: "brand_cohesion_audit",
        description: "Return the brand cohesion audit results",
        parameters: {
          type: "object",
          properties: {
            overallScore: { type: "number", description: "Overall cohesion score 0-100" },
            summary: { type: "string", description: "2-3 sentence executive summary of overall cohesion" },
            categories: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  score: { type: "number" },
                  findings: { type: "array", items: { type: "string" } },
                  recommendations: { type: "array", items: { type: "string" } }
                },
                required: ["name", "score", "findings", "recommendations"]
              }
            },
            biasReview: {
              type: "object",
              properties: {
                score: { type: "number" },
                languageInclusivity: {
                  type: "object",
                  properties: { score: { type: "number" }, findings: { type: "array", items: { type: "string" } }, recommendations: { type: "array", items: { type: "string" } } },
                  required: ["score", "findings", "recommendations"]
                },
                visualRepresentation: {
                  type: "object",
                  properties: { score: { type: "number" }, findings: { type: "array", items: { type: "string" } }, recommendations: { type: "array", items: { type: "string" } } },
                  required: ["score", "findings", "recommendations"]
                },
                culturalSensitivity: {
                  type: "object",
                  properties: { score: { type: "number" }, findings: { type: "array", items: { type: "string" } }, recommendations: { type: "array", items: { type: "string" } } },
                  required: ["score", "findings", "recommendations"]
                },
                accessibilityConsiderations: {
                  type: "object",
                  properties: { score: { type: "number" }, findings: { type: "array", items: { type: "string" } }, recommendations: { type: "array", items: { type: "string" } } },
                  required: ["score", "findings", "recommendations"]
                },
                regulatoryCompliance: {
                  type: "object",
                  properties: { score: { type: "number" }, findings: { type: "array", items: { type: "string" } }, recommendations: { type: "array", items: { type: "string" } } },
                  required: ["score", "findings", "recommendations"]
                },
                overallFindings: { type: "array", items: { type: "string" } },
                overallRecommendations: { type: "array", items: { type: "string" } }
              },
              required: ["score", "languageInclusivity", "visualRepresentation", "culturalSensitivity", "accessibilityConsiderations", "overallFindings", "overallRecommendations"]
            },
            strengths: { type: "array", items: { type: "string" } },
            weaknesses: { type: "array", items: { type: "string" } },
            actionItems: { type: "array", items: { type: "string" } }
          },
          required: ["overallScore", "summary", "categories", "strengths", "weaknesses", "actionItems"]
        }
      }
    };

    const systemPrompt = `You are a brand cohesion expert auditing a brand guide. You have been given a detailed section-by-section completeness breakdown AND Deep Intelligence modules (inclusive language regex patterns, inclusive prompting heuristics, EAA regulatory baseline). Evaluate visual consistency, identity coherence, digital presence maturity, overall completeness, AND bias & inclusivity using the Deep Intelligence framework.

Categories MUST include: Visual Consistency, Brand Identity, Digital Presence, Content Completeness, Marketing Materials, Best Practices.

For Visual Consistency, apply Optical Geometry Intelligence:
- Corner Radius System: Corners are the subconscious body language of UI. Check radius consistency across all elements.
- Mood Alignment: Technical brands (0-4px sharp), Modern brands (16-24px rounded), Organic brands (full-round). Does the radius tier match brand personality?
- Unified System: Flag mixed geometries (e.g., sharp buttons with rounded cards). All interactive elements must use the same radius family.
- Visual Tension: Flag near-identical but different radius values (e.g., 4px vs 6px). If values are close, they should be identical.
- Perfect Nesting: Nested containers should follow concentric circles — Outer Radius = Inner Radius + Padding.
- From Chaos to Order: Evaluate card grid consistency — uniform radii, aligned content blocks, matching button shapes.

For the biasReview section, apply Deep Intelligence modules:
- Language Inclusivity: Flag non-inclusive terms (whitelist/blacklist, master/slave, grandfathered, ableist slang). Check for gendered language, cultural assumptions.
- Visual Representation: Check if imagery guidelines specify visible identity diversity, observable actions, cultural context.
- Cultural Sensitivity: Evaluate region-specific messaging, universal vs localized tone, cultural blind spots.
- Accessibility Considerations: Apply EAA 2025/2026 baseline — WCAG 2.2 readiness, alt text, color-only information, typography readability.
- Regulatory Compliance: Score against EAA mandatory scope.

Score based on ACTUAL section data provided. Empty sections should significantly reduce relevant category scores. Be specific — reference actual section names and completion levels in findings.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: promptLines.join('\n') }
        ],
        tools: [auditToolDef],
        tool_choice: { type: "function", function: { name: "brand_cohesion_audit" } },
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      if (response.status === 429) {
        throw new Error("Rate limit exceeded. Please try again in a few minutes.");
      }
      if (response.status === 402) {
        throw new Error("AI credits exhausted. Please add credits to continue.");
      }
      throw new Error(`AI Gateway error: ${response.status} - ${errText.slice(0, 200)}`);
    }

    const aiResponse = await response.json();
    
    let auditResult;
    // Extract from tool call response
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      try {
        auditResult = JSON.parse(toolCall.function.arguments);
      } catch (e) {
        console.error('Tool call JSON parse failed:', e, 'Raw:', toolCall.function.arguments?.substring(0, 200));
      }
    }
    
    // Fallback: try content field
    if (!auditResult) {
      const content = aiResponse.choices?.[0]?.message?.content;
      if (content) {
        try {
          const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
          let fixedJson = (jsonMatch[1] || content).trim();
          if (!fixedJson.endsWith('}')) {
            const lastBrace = fixedJson.lastIndexOf('}');
            if (lastBrace > 0) fixedJson = fixedJson.substring(0, lastBrace + 1);
          }
          auditResult = JSON.parse(fixedJson);
        } catch {
          console.error('Content JSON parse also failed. Content preview:', content?.substring(0, 300));
        }
      }
    }

    if (!auditResult) {
      throw new Error('Failed to parse AI audit response — neither tool call nor content contained valid JSON');
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
