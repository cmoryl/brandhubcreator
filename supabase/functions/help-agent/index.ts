import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function restHeaders(token?: string) {
  return {
    apikey: SUPABASE_SERVICE_KEY,
    Authorization: `Bearer ${token || SUPABASE_SERVICE_KEY}`,
    "Content-Type": "application/json",
  };
}

async function verifyUser(authHeader: string) {
  const token = authHeader.replace("Bearer ", "");
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_SERVICE_KEY },
  });
  if (!res.ok) return null;
  return res.json();
}

async function getUserOrgId(userId: string): Promise<string | null> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/organization_members?user_id=eq.${userId}&select=organization_id&limit=1`,
    { headers: restHeaders() }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data?.[0]?.organization_id || null;
}

async function getOrgSlug(orgId: string): Promise<string | null> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/organizations?id=eq.${orgId}&select=slug&limit=1`,
    { headers: restHeaders() }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data?.[0]?.slug || null;
}

async function fetchOracleContext(orgId: string): Promise<string> {
  const parts: string[] = [];

  try {
    // Fetch Oracle intelligence summary
    const [oracleRes, knowledgeRes] = await Promise.all([
      fetch(
        `${SUPABASE_URL}/rest/v1/oracle_intelligence?organization_id=eq.${orgId}&select=org_summary,strategic_recommendations,unified_voice_profile,competitive_overview,market_landscape&limit=1`,
        { headers: restHeaders() }
      ),
      fetch(
        `${SUPABASE_URL}/rest/v1/oracle_knowledge_base?organization_id=eq.${orgId}&is_active=eq.true&order=updated_at.desc&limit=10&select=title,content,category`,
        { headers: restHeaders() }
      ),
    ]);

    if (oracleRes.ok) {
      const oracle = await oracleRes.json();
      if (oracle?.[0]) {
        const o = oracle[0];
        if (o.org_summary) parts.push(`## Organization Intelligence\n${o.org_summary}`);
        if (o.strategic_recommendations) {
          const recs = Array.isArray(o.strategic_recommendations) ? o.strategic_recommendations : [];
          if (recs.length) parts.push(`## Strategic Recommendations\n${recs.map((r: any) => `- ${typeof r === 'string' ? r : r.recommendation || r.title || JSON.stringify(r)}`).join('\n')}`);
        }
        if (o.unified_voice_profile) {
          const voice = o.unified_voice_profile;
          parts.push(`## Unified Voice Profile\nTone: ${voice.tone || 'N/A'}, Style: ${voice.style || 'N/A'}`);
        }
      }
    }

    if (knowledgeRes.ok) {
      const entries = await knowledgeRes.json();
      if (entries?.length) {
        const kb = entries.map((e: any) => `### ${e.title} (${e.category || 'General'})\n${(e.content || '').slice(0, 300)}`).join('\n\n');
        parts.push(`## Organization Knowledge Base\n${kb}`);
      }
    }
  } catch (e) {
    console.error("Error fetching oracle context:", e);
  }

  return parts.join('\n\n');
}

async function fetchEntityBrains(orgId: string): Promise<string> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/brand_intelligence?organization_id=eq.${orgId}&select=entity_type,entity_id,brand_summary,market_position,competitive_advantages,brand_voice_profile&order=updated_at.desc&limit=10`,
      { headers: restHeaders() }
    );
    if (!res.ok) return '';
    const brains = await res.json();
    if (!brains?.length) return '';

    // Also fetch entity names
    const brandIds = brains.filter((b: any) => b.entity_type === 'brand').map((b: any) => b.entity_id);
    const productIds = brains.filter((b: any) => b.entity_type === 'product').map((b: any) => b.entity_id);
    const eventIds = brains.filter((b: any) => b.entity_type === 'event').map((b: any) => b.entity_id);

    const nameMap: Record<string, { name: string; slug: string }> = {};

    const nameFetches = [];
    if (brandIds.length) {
      nameFetches.push(
        fetch(`${SUPABASE_URL}/rest/v1/brands?id=in.(${brandIds.join(',')})&select=id,name,slug`, { headers: restHeaders() })
          .then(r => r.json()).then((data: any[]) => data?.forEach(d => nameMap[d.id] = { name: d.name, slug: d.slug || d.name.toLowerCase().replace(/\s+/g, '-') })).catch(() => {})
      );
    }
    if (productIds.length) {
      nameFetches.push(
        fetch(`${SUPABASE_URL}/rest/v1/products?id=in.(${productIds.join(',')})&select=id,name,slug`, { headers: restHeaders() })
          .then(r => r.json()).then((data: any[]) => data?.forEach(d => nameMap[d.id] = { name: d.name, slug: d.slug || d.name.toLowerCase().replace(/\s+/g, '-') })).catch(() => {})
      );
    }
    if (eventIds.length) {
      nameFetches.push(
        fetch(`${SUPABASE_URL}/rest/v1/events?id=in.(${eventIds.join(',')})&select=id,name,slug`, { headers: restHeaders() })
          .then(r => r.json()).then((data: any[]) => data?.forEach(d => nameMap[d.id] = { name: d.name, slug: d.slug || d.name.toLowerCase().replace(/\s+/g, '-') })).catch(() => {})
      );
    }
    await Promise.all(nameFetches);

    const summaries = brains.map((b: any) => {
      const entity = nameMap[b.entity_id] || { name: b.entity_id, slug: b.entity_id };
      const lines = [`### ${entity.name} (${b.entity_type}) [slug: ${entity.slug}]`];
      if (b.brand_summary) lines.push(b.brand_summary.slice(0, 400));
      if (b.market_position) lines.push(`Market Position: ${b.market_position}`);
      if (b.competitive_advantages && Array.isArray(b.competitive_advantages)) {
        lines.push(`Key Advantages: ${b.competitive_advantages.slice(0, 5).map((a: any) => typeof a === 'string' ? a : a.advantage || a.title || '').filter(Boolean).join(', ')}`);
      }
      return lines.join('\n');
    });

    return `## Entity Intelligence (Brand Brains)\n${summaries.join('\n\n')}`;
  } catch (e) {
    console.error("Error fetching entity brains:", e);
    return '';
  }
}

async function fetchBotConfig(orgId: string | null): Promise<{ system_prompt?: string; model?: string; temperature?: number; max_tokens?: number } | null> {
  try {
    let url = `${SUPABASE_URL}/rest/v1/bot_config?bot_type=eq.help_agent&limit=1`;
    if (orgId) {
      url += `&organization_id=eq.${orgId}`;
    }
    const res = await fetch(url, { headers: restHeaders() });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.[0] || null;
  } catch {
    return null;
  }
}

const BASE_SYSTEM_PROMPT = `You are the BrandHub Help Assistant — a friendly, knowledgeable guide for the BrandHub platform. You have access to the user's organization intelligence and brand data to provide context-aware, personalized help.

## Core Features
- **Brand Guides**: Create rich brand guidelines with sections for colors, typography, logos, patterns, gradients, imagery, voice & tone, iconography, and more.
- **Product Guides**: Create product-specific brand guidelines linked to parent brands.
- **Event Guides**: Create event-specific branding linked to parent brands.
- **Organization Portal**: A public-facing portal (org/:slug) showcasing brands, products, and events.

## Brand Guide Sections
Brands have many configurable sections: Hero, Identity, Colors, Typography, Logos, Patterns, Gradients, Imagery, Voice & Tone, Messaging, Digital Collateral, Social Assets, Iconography, QR Codes, Email Signatures, Templates, Brochures, Case Studies, Anti-Patterns, Symbol Standards, Geometric Primitives, Website, Platform Marketer, Events, Statistics, Revenue Growth, and more.

## Bias Awareness & Accessibility
- **Bias Awareness Scanning**: AI evaluates content across four dimensions — Language (inclusive terminology), Visual (representation & stereotypes), Accessibility (WCAG 2.2 compliance), and AI Governance (responsible AI usage). Each scan produces dimension scores, findings with severity badges, and a Persona Spectrum coverage grid.
- **Persona Spectrum**: Based on Microsoft's Inclusive Design — evaluates permanent, temporary, and situational needs across Vision, Mobility, Hearing, Speech, and Cognitive dimensions.
- **Color Accessibility**: OKLCH perceptual contrast checks (7:1 ratio), colorblind simulations (Protanopia, Deuteranopia, Tritanopia, Achromatopsia), and Helmholtz-Kohlrausch brightness correction.
- **Cultural Color Symbolism**: Global Cultural Symbolism Map flags color conflicts across 7+ markets before launch.
- **Inclusive Imagery Audit**: Deconstructs visuals using PI&E "Who Else?" and WFA litmus tests for representation, power hierarchies, and trope detection.
- **Creative Checklist**: 12-step WFA-aligned review for on-brand, inclusive creative work.
- **Admin Reporting**: Organization-wide Bias Awareness tab in Admin Dashboard with KPIs, dimension averages, and entity scores with expandable detail rows.

## Key Capabilities
- **Section Visibility**: Admins can show/hide sections via the sidebar eye icon.
- **Section Reordering**: Drag-and-drop reordering of sidebar sections.
- **Layout Styles**: Configurable grid layouts per section.
- **Brand Health Score**: Tracks completeness across 35+ sections with weighted scoring.
- **Image Library**: Organization-wide shared image library.
- **QR Code Generator**: Create styled QR codes with brand colors and logos.
- **Email Signatures**: Template library with customizable HTML signatures.
- **PDF Exports**: Export brand guides, competitive reports, and analytics.

## AI-Powered Features
- **Brand Intelligence (Oracle Brain)**: Organization-level AI that aggregates insights across all brands, products, and events. Provides strategic recommendations, unified voice profiles, and market landscape analysis.
- **Entity Brains**: Each brand, product, and event has its own AI "brain" that learns from its guide data. Stores market position, competitive advantages, voice profile, cultural insights, and growth recommendations.
- **Competitive Analysis**: AI reports comparing brands against competitors.
- **DataForce AI**: Brand compliance scanning, AI assistant, cultural validation, and GenAI training.
- **GlobalLink**: Translation and cultural adaptation with regional variants.
- **Brand Creative Studio**: AI image generation using brand context.
- **Icon Studio (IconKIT)**: A streamlined 4-tab hub for iconography: Library & Import (browse 50K+ icons, upload SVGs, manage collections), AI Generate (AI-powered icon creation with style presets), Style (colorize with brand colors, set Brand DNA rules, generate app icons), and Export (batch download and entity import). Supports brand DNA locking across sub-brands.
- **Research Briefings**: AI-generated strategic briefings covering trends, risks, and opportunities.
- **Knowledge Base**: Import PDFs, documents, and manual entries to feed the brand brains.

## Organization Management
- Members & roles, portal settings, backups, audit logs, app settings.

## Tips
- Use the sidebar to navigate sections. Click eye icon to show/hide. Drag to reorder.
- Brand Health Score helps track guide completeness.
- All changes save automatically.
- The Oracle Brain learns from all entity brains and provides portfolio-wide intelligence.

## Navigation Links
When referring to a specific brand, product, or event page, ALWAYS include a markdown link so the user can navigate directly. Use these URL patterns:
- Brand page: \`/org/{orgSlug}/brand/{brandSlug}\`
- Product page: \`/org/{orgSlug}/product/{productSlug}\`
- Event page: \`/org/{orgSlug}/event/{eventSlug}\`
- Organization portal: \`/org/{orgSlug}\`

To link to a specific SECTION of a brand/product/event page, append the section ID as a hash fragment. Available section IDs: hero, tagline, identity, colors, typography, logos, patterns, gradients, imagery, voice, messaging, digitalCollateral, socialAssets, iconography, qrCodes, emailSignatures, templates, brochures, caseStudies, antiPatterns, symbolStandards, geometricPrimitives, website, platformMarketer, events, statistics, revenueGrowth.

Example: "Check your [Colors section](/org/acme/brand/my-brand#colors)" or "View [My Brand](/org/acme/brand/my-brand)".

When you have organization context with entity names, generate slugs by lowercasing and replacing spaces with hyphens (e.g., "My Brand" → "my-brand").

INCLUSIVE LANGUAGE & BIAS GUARDRAILS (MANDATORY — always follow these):
1. Use person-first language: "person with a disability" not "disabled person", "people experiencing homelessness" not "homeless people".
2. Avoid ableist terms: Replace "blind spot" with "gap", "crippling" with "severe", "tone-deaf" with "insensitive", "crazy/insane" with "unexpected/surprising".
3. Use gender-neutral language: "they/them" for unknown gender, "workforce" not "manpower", "chairperson" not "chairman".
4. Avoid age-based stereotypes: Don't assume tech literacy by age, avoid "elderly" (use "older adults").
5. Cultural sensitivity: Avoid idioms that don't translate well. Respect naming conventions across cultures.
6. Representation awareness: When giving examples, vary names, backgrounds, and contexts.
7. Accessibility-first framing: Suggest accessible alternatives proactively.
8. If you detect potentially biased content, gently flag it with a constructive suggestion for improvement.

Keep answers concise, friendly, and actionable. Use markdown for clarity. When you have organization-specific context, reference it naturally to personalize your answers. If unsure, suggest checking the help articles or contacting an admin.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Try to get authenticated user context
    let contextBlock = '';
    const authHeader = req.headers.get("Authorization");
    if (authHeader && !authHeader.includes(Deno.env.get("SUPABASE_ANON_KEY") || '__none__')) {
      try {
        const user = await verifyUser(authHeader);
        if (user?.id) {
          const orgId = await getUserOrgId(user.id);
          if (orgId) {
            // Fetch Oracle + Entity brains + org slug in parallel
            const [oracleCtx, brainsCtx, orgSlug] = await Promise.all([
              fetchOracleContext(orgId),
              fetchEntityBrains(orgId),
              getOrgSlug(orgId),
            ]);
            const parts = [oracleCtx, brainsCtx].filter(Boolean);
            if (parts.length) {
              const slugNote = orgSlug ? `\n\nOrganization slug for navigation links: **${orgSlug}**` : '';
              contextBlock = `\n\n---\n# LIVE ORGANIZATION CONTEXT\nThe following is real-time intelligence from the user's organization. Use it to give personalized, context-aware answers.${slugNote}\n\n${parts.join('\n\n')}`;
            }
          }
        }
      } catch (e) {
        console.error("Error fetching user context:", e);
        // Continue without context — still useful as a generic helper
      }
    }

    // Try to load dynamic bot config
    let dynamicConfig: any = null;
    let orgIdForConfig: string | null = null;

    const fullSystemPrompt = BASE_SYSTEM_PROMPT + contextBlock;

    // Extract orgId from context if available
    if (contextBlock) {
      // orgId was fetched above, try to load config
      try {
        const authHeader2 = req.headers.get("Authorization");
        if (authHeader2 && !authHeader2.includes(Deno.env.get("SUPABASE_ANON_KEY") || '__none__')) {
          const user2 = await verifyUser(authHeader2);
          if (user2?.id) {
            orgIdForConfig = await getUserOrgId(user2.id);
          }
        }
      } catch { /* ignore */ }
    }
    
    dynamicConfig = await fetchBotConfig(orgIdForConfig);
    
    const systemPrompt = dynamicConfig?.system_prompt || fullSystemPrompt;
    const model = dynamicConfig?.model || "google/gemini-3.1-flash-lite-preview";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service temporarily unavailable." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Help agent is temporarily unavailable." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("help-agent error:", error);
    return new Response(
      JSON.stringify({ error: "Help agent encountered an error." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
