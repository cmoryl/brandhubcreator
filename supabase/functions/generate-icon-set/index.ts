import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const ICON_TAXONOMY: Record<string, { name: string; description: string; sections: { name: string; description: string; count: number }[] }> = {
  Foundation: {
    name: "Foundation",
    description: "Navigation, UI states, basic logic — the foundation must still feel authored, not stock",
    sections: [
      { name: "Navigation", description: "Wayfinding & directional intent. Go beyond plain arrows — explore compass rose fragments, asymmetric chevrons, path/route silhouettes, breadcrumb dot-trails, parallax indicators, doorway/portal cues. Each glyph implies MOTION, not just direction.", count: 30 },
      { name: "UI States", description: "Stateful affordances (toggle, checkbox, radio, expand/collapse, drag, focus, loading). Express the STATE TRANSITION itself (mid-flip toggle, half-checked, accordion mid-open) — never the static default that every UI kit ships.", count: 30 },
      { name: "Basic Logic", description: "Atomic operators (plus, minus, close, check, refresh, undo, redo, sync, divider). Treat them like a typeface — geometric harmony across the set, with at least one unexpected reinterpretation per glyph (e.g. refresh as a Möbius loop, check as a single confident stroke, close as crossed paths not an X).", count: 30 },
    ]
  },
  Communication: {
    name: "Communication",
    description: "Email, social, feedback, support — replace bubbles & bells with fresher signals of human contact",
    sections: [
      { name: "Messaging", description: "Chat, comments, conversations, threads, replies, mentions, drafts, voice notes. BAN the default round speech bubble — explore tails as arrows, overlapping shapes implying dialogue, waveforms, transcript lines, half-bubbles, paper-folded notes.", count: 30 },
      { name: "Notifications", description: "Alerts, badges, indicators, mute, snooze, do-not-disturb, priority. BAN the literal bell shape — try resonance rings, pulse waves, exclamation in negative space, flag at half-mast, sleeping crescent for mute, a finger-on-lips silhouette.", count: 30 },
      { name: "Social", description: "Share, like, follow, connect, network, mention, invite, RSVP. BAN the heart and the thumbs-up — invent: orbit/satellite for follow, bridge between two nodes for connect, ripple-outward for share, anchor for save, blooming shape for like.", count: 30 },
      { name: "Support", description: "Help, FAQ, contact, feedback, tickets, knowledge base, chat with human, escalate. Go past the question mark in a circle — life-ring, lighthouse, open palm, compass-with-question, two-figures-at-desk silhouette, ticket-stub.", count: 30 },
    ]
  },
  "SaaS/Data": {
    name: "SaaS/Data",
    description: "Analytics, security, settings, workflows — the most cliché category in the industry; we refuse the defaults",
    sections: [
      { name: "Analytics", description: "Charts, metrics, dashboards, KPIs, segments, cohorts, funnels, heatmaps, anomalies, forecasts. BAN the bar-chart-three-bars and the upward-line-with-arrow — explore: scatter constellations, sparkline fragments, candlestick rhythm, isobar maps, distribution bell-curves drawn as silhouettes.", count: 30 },
      { name: "Security", description: "Auth, access, encryption, audit, threat, MFA, key rotation, vault, biometric, zero-trust. BAN the closed padlock and the plain shield — try: vault-door cross-section, key teeth as waveform, fingerprint as topographic lines, eye-of-protection, woven knot for encryption.", count: 30 },
      { name: "Settings", description: "Config, preferences, sliders, toggles, themes, customization, API keys, environment. BAN the six-tooth gear — explore: slider stack, dial cluster, control-room knob, faceted polygon, dip-switches, equalizer columns, modular grid being rearranged.", count: 30 },
      { name: "Workflows", description: "Pipeline, automation, triggers, jobs, queues, retries, integration, webhook, cron. Show MOVEMENT and CAUSALITY: tipping dominoes, relay-baton handoff, gears-of-different-sizes meshing, branching river, conveyor segment, falling-then-rising arc.", count: 30 },
    ]
  },
  "E-Commerce": {
    name: "E-Commerce",
    description: "Payments, shipping, storefront, loyalty — must feel like a boutique brand's set, not Stripe's defaults",
    sections: [
      { name: "Shopping", description: "Cart, bag, wishlist, browse, compare, filter, recommendation. BAN the wire shopping cart — explore: market basket, paper bag with handles, tote silhouette, hanger, mannequin, browse-as-a-finger-flipping-tags, wishlist-as-bookmark-ribbon.", count: 30 },
      { name: "Payments", description: "Cards, wallet, transactions, invoices, refunds, splits, currency, escrow. BAN the credit-card-with-stripe — explore: folded bill, coin edge-on, receipt curl, two-arrows-crossing for transfer, hand-to-hand exchange, ledger column.", count: 30 },
      { name: "Shipping", description: "Delivery, tracking, packages, returns, customs, last-mile, in-transit. BAN the literal cardboard box with tape — explore: parcel-on-doormat, route-with-pin, scanner crossing a barcode, conveyor belt edge, customs-stamp, drone silhouette, mailbox flag.", count: 30 },
      { name: "Loyalty", description: "Rewards, points, membership, gifts, tiers, perks, referrals, streaks. BAN the gift-with-bow — explore: laurel fragment, stamped passport page, punch-card, climbing tier-steps, badge-pinned-to-fabric, ticket stub, key-to-the-club.", count: 30 },
    ]
  },
  "Marketing Hero": {
    name: "Marketing Hero",
    description: "Growth, trophies, trust signals, abstract concepts — the most cliché set on the internet; we make it iconic instead",
    sections: [
      { name: "Growth", description: "Expansion, scale, traction, momentum, breakthroughs. BAN the rocket-with-flames and the upward arrow — explore: sprout pushing through ground, ladder-fragment, balloon-rising, terraced steps, branching tree-fractal, sundial-growing-shadow, breaking-through-ceiling silhouette.", count: 30 },
      { name: "Achievement", description: "Wins, recognition, mastery, milestones. BAN the cup-trophy and five-point star — explore: laurel-half-wreath, ribbon-rosette, summit-flag, podium-edge, engraved-plaque, medal-on-ribbon (side profile), confetti-arc, signature-flourish.", count: 30 },
      { name: "Trust", description: "Credibility, guarantees, verified, secure, certified, transparent. BAN the handshake and the checkmark-shield — explore: notarized-seal, fingerprint-with-checkmark-in-negative-space, anchor-and-rope, two-overlapping-rings, open-vault, lighthouse, balance-scale-in-equilibrium.", count: 30 },
      { name: "Abstract", description: "Innovation, ideas, vision, possibility, breakthrough, clarity. BAN the lightbulb-with-rays and the brain-with-gear — explore: prism splitting a line, sunrise-over-horizon, blooming geometric form, lens focusing rays, key-fitting-into-keyhole-of-light, doorway-of-light, north-star fragment.", count: 30 },
    ]
  },
  "Industry Specific": {
    name: "Industry Specific",
    description: "Custom symbols based on the brand's niche — must look like a domain insider drew them, not an outsider",
    sections: [
      { name: "Professional", description: "Symbols of the actual roles, rituals, and artifacts of THIS industry's daily practice. Tools-in-use, not tools-on-a-shelf. Hands-on-instrument silhouettes welcomed. Avoid the briefcase, the chart, and the abstract human head.", count: 30 },
      { name: "Technical", description: "Specialized apparatus, schematics, materials, processes, units of measure unique to this domain. Cross-sections, exploded views, and instrument-panel fragments encouraged. Avoid generic 'tech' tropes (chip, code-brackets, terminal).", count: 30 },
      { name: "Domain", description: "Cultural shorthand of the field — the visual jargon insiders recognize at a glance: equipment quirks, signage conventions, ritual objects, taxonomies. The icons a competitor in this space would never think to commission.", count: 30 },
    ]
  },
  "Brand Signature": {
    name: "Brand Signature",
    description: "Bespoke icons derived from THIS brand's DNA — services, archetype, mission, values. These should be un-portable to any other brand.",
    sections: [
      { name: "Services & Offerings", description: "One distinct icon per service/offering the brand actually delivers. Each must depict the SERVICE-IN-MOTION (the verb), not the deliverable as a static object. Concrete metaphors drawn from how customers actually experience the service.", count: 40 },
      { name: "Archetype & Values", description: "Symbols embodying the brand's archetype and core values translated into visual metaphor. Pull from the archetype's classical iconography (Sage→lens/scroll/owl, Outlaw→bolt/skull/shattered-frame, Magician→prism/wand/spiral) then twist with a brand-specific detail.", count: 40 },
      { name: "Mission Moments", description: "Icons depicting the brand's mission in action — the verbs and outcomes from the mission statement and tagline. Each glyph should answer 'what does success look like the moment it happens?' — a result frozen mid-arrival.", count: 40 },
    ]
  }
};



async function dbFetch(path: string, options: RequestInit = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: options.method === "PATCH" ? "return=minimal" : "return=representation",
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`DB error ${res.status}: ${text}`);
  }
  if (options.method === "PATCH") return null;
  return res.json();
}

async function verifyAuth(authHeader: string) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: authHeader,
    },
  });
  if (!res.ok) return null;
  return res.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const user = await verifyAuth(authHeader);
    if (!user?.id) {
      return new Response(JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json();

    // Poll mode: check job status
    if (body.jobId) {
      const jobs = await dbFetch(`brand_intelligence_jobs?id=eq.${body.jobId}&select=id,status,result,error_message`);
      const job = jobs?.[0];
      if (!job) {
        return new Response(JSON.stringify({ error: "Job not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({
        status: job.status,
        icons: job.status === "completed" ? job.result?.icons : undefined,
        category: job.result?.category,
        section: job.result?.section,
        sectionDescription: job.result?.sectionDescription,
        currentIndex: job.result?.currentIndex,
        totalSections: job.result?.totalSections,
        nextIndex: job.result?.nextIndex,
        complete: job.result?.complete,
        taxonomy: job.result?.taxonomy,
        error: job.error_message,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Create mode: start generation job
    const {
      entityName,
      entityId,
      entityType,
      industry,
      category = "Foundation",
      sectionIndex = 0,
      style = { strokeWidth: 2, cornerRadius: "rounded", fill: false },
      preset = "outlined",
      detailLevel = "medium",
      gridSize: gridSizeRaw,
      customCount,
    } = body;

    if (!entityName) {
      return new Response(JSON.stringify({ error: "Entity name is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const gridSize: 24 | 48 = gridSizeRaw === 48 ? 48 : 24;

    const taxonomyCategory = ICON_TAXONOMY[category] || ICON_TAXONOMY.Foundation;
    if (sectionIndex >= taxonomyCategory.sections.length) {
      return new Response(JSON.stringify({
        complete: true, category, totalSections: taxonomyCategory.sections.length,
        message: `All ${category} sections generated`
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Create a job record
    const jobData = await dbFetch("brand_intelligence_jobs", {
      method: "POST",
      body: JSON.stringify({
        entity_id: entityId || crypto.randomUUID(),
        entity_type: "icon_generation",
        user_id: user.id,
        status: "pending",
        result: { category, sectionIndex, style, preset, detailLevel, gridSize, customCount, industry, entityName, entityId, entityType },
      }),
    });

    const jobId = jobData[0]?.id;
    if (!jobId) throw new Error("Failed to create job");

    console.log(`[generate-icon-set] Created job ${jobId} for ${category}/${taxonomyCategory.sections[sectionIndex].name}`);

    // Kick off background worker
    EdgeRuntime.waitUntil(runWorker(jobId));

    return new Response(JSON.stringify({ jobId, status: "pending" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("Generate icon set error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function runWorker(jobId: string) {
  try {
    // Mark as processing
    await dbFetch(`brand_intelligence_jobs?id=eq.${jobId}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "processing", started_at: new Date().toISOString() }),
    });

    // Load job params
    const jobs = await dbFetch(`brand_intelligence_jobs?id=eq.${jobId}&select=result`);
    const params = jobs?.[0]?.result;
    if (!params) throw new Error("No job params found");

    const { category, sectionIndex, style, preset, detailLevel = "medium", gridSize: gridSizeJob, customCount, industry, entityName, entityId, entityType } = params;
    const taxonomyCategory = ICON_TAXONOMY[category] || ICON_TAXONOMY.Foundation;
    const currentSection = taxonomyCategory.sections[sectionIndex];
    const iconCount = customCount && customCount > 0 ? customCount : currentSection.count;
    const isFilled = style?.fill || preset === "filled";
    const isDuotone = preset === "duotone";
    // Detail tier — drives prompt verbosity AND validator strictness
    const detail: "low" | "medium" | "high" =
      detailLevel === "low" || detailLevel === "high" ? detailLevel : "medium";
    const gridSize: 24 | 48 = gridSizeJob === 48 ? 48 : 24;
    const isLargeGrid = gridSize === 48;
    const safeMin = isLargeGrid ? 4 : 2;
    const safeMax = gridSize - safeMin;
    const opticalCenter = gridSize / 2;
    // Stroke tracks both detail tier AND grid size — 48px grid carries thicker lines proportionally.
    const baseStroke = detail === "low" ? 1.75 : detail === "high" ? 1.25 : 1.5;
    const defaultStroke = isLargeGrid ? +(baseStroke * 1.6).toFixed(2) : baseStroke;
    const strokeWidth = style?.strokeWidth ?? (isFilled ? 0 : defaultStroke);
    const cornerStyle = style?.cornerRadius || "rounded";
    const linecap = cornerStyle === "sharp" ? "square" : "round";
    const linejoin = cornerStyle === "sharp" ? "miter" : "round";

    // Max paths allowed per icon — 48px grid unlocks denser, illustrative compositions.
    const maxPaths = isLargeGrid
      ? (isDuotone
        ? (detail === "high" ? 8 : detail === "low" ? 3 : 5)
        : (detail === "high" ? 6 : detail === "low" ? 2 : 4))
      : (isDuotone
        ? (detail === "high" ? 4 : detail === "low" ? 2 : 3)
        : (detail === "high" ? 4 : detail === "low" ? 1 : 2));

    // ── Brand DNA: pull rich context so icons feel tailored to the brand ──
    const brandDNA = await loadBrandDNA(entityId, entityType);
    const brandContextBlock = buildBrandContextBlock({ entityName, industry, brandDNA });

    // ── Creative lens: rotate per-section so every batch arrives with a fresh
    //    visual point-of-view instead of defaulting to generic Lucide register.
    const lens = pickCreativeLens(entityName, category, sectionIndex);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are the world's foremost SVG icon architect. Your work ships in Lucide, Tabler, Feather, Phosphor, Apple SF Symbols and Google Material Symbols. Every icon is a geometric masterpiece.

## NON-NEGOTIABLE RULES — any violation rejects the whole batch

### Canvas & Grid
- viewBox: "0 0 ${gridSize} ${gridSize}". Safe zone: keep all content inside (${safeMin},${safeMin})→(${safeMax},${safeMax}).
- Optical center at ${opticalCenter},${opticalCenter}. Pick ONE keyline per icon:
  • Square ${gridSize - 6}×${gridSize - 6} at (3,3)→(${gridSize - 3},${gridSize - 3})
  • Circle Ø${gridSize - 4} centered
  • Portrait ${Math.round(gridSize * 0.58)}w×${gridSize - 4}h | Landscape ${gridSize - 4}w×${Math.round(gridSize * 0.58)}h
- Snap to a 1px grid. Allowed coordinate fractions: .0 and .5 ONLY. NEVER 7.33, 15.8, 4.27.${isLargeGrid ? `\n- This is a HIGH-DENSITY 48×48 canvas — exploit it. Add inner architecture, micro-detail, secondary forms, and storytelling layers that simply don't fit in a 24px frame. Reference: Material Symbols 48dp, Phosphor Bold, Iconoir 48.` : ""}

### SVG Purity (HARD)
- ONLY <path> elements inside <svg>. NO <circle>, <rect>, <line>, <polygon>, <polyline>, <ellipse>, <g>, <use>, <defs>, <mask>, <clipPath>, <style>, <filter>.
- Max ${maxPaths} paths${detail === "low" ? ", strongly prefer 1" : detail === "medium" ? ", strongly prefer 1–2" : " — use the budget when the metaphor benefits from layered detail, never just to decorate"}.
- Use arcs (A/a) for circular curves. Never approximate circles with cubic Bézier chains.
- NO transform=, NO id=, NO class=, NO style=, NO data-*, NO inline stroke colors (those come from the wrapper).

### Stroke Style
${isFilled
  ? `- This batch is FILLED: solid shapes, no stroke. Each path: fill="currentColor".`
  : isDuotone
  ? `- This batch is DUOTONE (Phosphor-style): TWO layered paths per icon — a SOFT BACK FILL plus a CRISP FRONT LINE.
- Back path: a closed silhouette, fill="currentColor" fill-opacity="0.25" stroke="none". Sits behind, suggesting mass.
- Front path(s): pure outline, stroke="currentColor" stroke-width="${strokeWidth}" fill="none" stroke-linecap="${linecap}" stroke-linejoin="${linejoin}". Carries the readable detail.
- The back fill MUST be subordinate to the front line — it's there to add depth, never to obscure the silhouette.
- DO NOT use gradients, patterns, or more than two distinct opacity values.`
  : `- This batch is OUTLINED: stroke-only, no fills. Lines feel like a ${strokeWidth}px pen by Lucide/Tabler/Feather.
- The host wrapper applies: fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="${linecap}" stroke-linejoin="${linejoin}".
- DO NOT bake fills, gradients, or duotone shading. Pure outlines only.
- Stroke terminals and joins are UNIFORM across the entire batch.`}

### Detail Tier — "${detail}"
${detail === "low"
  ? `- COMPACT/UI-grade: minimal linework, single dominant gesture, optimised for 16–20px display. Ban inner ornament. Think Feather.`
  : detail === "high"
  ? `- EXPRESSIVE/illustrative: allow secondary inner shapes, supporting micro-detail (texture hatching, inner glyphs, doubled outlines, cutouts) that earns the path budget. Optimised for ≥32px display. Think Phosphor Duotone or Material Symbols at weight 700. Still must read clearly at 24px.`
  : `- STANDARD: balanced detail — one primary form plus at most one supporting element. Reads clearly at 20–28px. Default Lucide/Tabler register.`}

## MASTER CRAFT

### Visual Weight
- All icons must look the SAME WEIGHT when squinted at 16px. Simpler shapes get a bit more mass, complex shapes thin out.
- Pass the 12px silhouette test: still recognizable, still distinct.

### Distinctiveness
- No two icons in a batch should be confusable in silhouette.
- Capture ESSENCE, not literal objects.
- Names: specific + evocative ("Beacon Alert" not "Bell 1").

### Geometric Perfection
- Consistent corners across the batch (ALL sharp OR ALL rounded — never mixed).
- Consistent terminals across the batch.
- Optical alignment beats mathematical alignment.

## CREATIVE LENS — "${lens.name}"
${lens.brief}
Within these rules: ${lens.tactics}

## CREATIVE AMBITION (non-negotiable)
You are NOT making a stock icon pack. You are making a curated, gallery-grade collection that an art director would screenshot.

- BAN the obvious solution. For each concept, brainstorm 4 metaphors silently, then pick the one that is LEAST predictable but still instantly readable. Reject the first idea that comes to mind — it's almost always the cliché (cloud=cloud shape, security=padlock, idea=lightbulb, analytics=bar chart, settings=gear, user=head-and-shoulders, time=clock face, message=speech bubble, search=magnifier, location=pin-drop, calendar=grid, mail=envelope, home=house-with-roof, profile=circle-with-bust). Find a fresher symbol that means the same thing.
- COMPOSE, don't label. Combine 2–3 micro-elements into one tight glyph that creates a NEW meaning (e.g. compass-needle + sound-wave = "navigate audio"; seed + circuit-node = "growth engine"; folded-page + arrow-eye = "document review"). One coherent silhouette, never two icons glued together.
- SURPRISE ANGLE. Prefer unexpected viewpoints: top-down, cross-section, exploded, isometric hint, negative-space cutouts, half-glyphs that imply the whole. A book seen from the spine. A bridge seen end-on. A wave mid-break. A camera from inside the lens. A clock as a horizon line.
- NEGATIVE SPACE AS SUBJECT. At least ~30% of the batch should use counter-form, cutouts, or implied shape as the primary storytelling device. The hole IS the icon.
- ASYMMETRY WITH PURPOSE. Avoid mirror-symmetric defaults unless the concept demands it. Tilt, offset, or weight one side to give the glyph energy and direction.
- METAPHOR LADDER. For every icon ask: literal → functional → poetic. Ship the poetic one IF it still reads in 0.3s. Otherwise ship functional. NEVER ship literal.
- ZERO RECYCLED SHAPES across the batch. If two icons share a base form (e.g. both built on a circle-with-line, or both rectangles-with-corner-fold), redesign one. Silhouette diversity is the headline metric — picture all icons greyed-out at 16px: every one must be instantly distinguishable.
- KILL DECORATION. Sparkles, stars, dots, motion-lines, and corner accents are forbidden unless they ARE the concept. Every stroke must carry meaning.
- BRAND-NATIVE METAPHORS. Mine the brand DNA (archetype, services, mission verbs) for symbols competitors would never think to use. The collection should feel un-portable to any other brand.
- GESTURE & ENERGY. Static icons are boring. Every glyph should imply a verb — flowing, pulling, opening, breaking, branching, folding, meeting, departing. Capture motion in still form.

These icons must be indistinguishable in quality from a hand-crafted Lucide release — and more interesting than one.`;


    const userPrompt = `Design exactly ${iconCount} MASTER-QUALITY icons for the "${currentSection.name}" section.

## Context
- Section: ${currentSection.name} — ${currentSection.description}
- Category: ${taxonomyCategory.name} — ${taxonomyCategory.description}

${brandContextBlock}

## Mandatory Style (identical on EVERY icon)
- Preset: "${preset}" · Detail tier: "${detail}" · Grid: ${gridSize}×${gridSize} · Max paths: ${maxPaths}
- ${isFilled ? "FILLED" : isDuotone ? `DUOTONE — back fill (fill-opacity 0.25) + front line (stroke-width ${strokeWidth})` : `OUTLINED, stroke-width ${strokeWidth}`}, ${cornerStyle} corners
- stroke-linecap "${linecap}" / stroke-linejoin "${linejoin}"
${isFilled
  ? `- Each path: fill="currentColor" stroke="none"`
  : isDuotone
  ? `- Back path: fill="currentColor" fill-opacity="0.25" stroke="none". Front path(s): fill="none" stroke="currentColor".`
  : `- Each path: fill="none" stroke="currentColor" (wrapper enforces this — do NOT add color attributes yourself)`}

## Design Direction
- Reference: Lucide "${currentSection.name.toLowerCase()}", Tabler outline, Feather, ${isDuotone ? "Phosphor Duotone" : "Phosphor regular"}. Then EXCEED them.
- Each icon must read clearly at 16px and remain a distinct silhouette at 12px.
- Translate the brand DNA above into metaphor choices — e.g. if the brand archetype is "Sage", lean on tomes/lenses/compass motifs; if "Outlaw", lean on bolts/sparks/asymmetry. NEVER generic stock.
- For Industry-Specific sections, draw 60%+ of metaphors from the brand's actual services/products listed above.
- These should feel like premium icons designed specifically for "${entityName}", not interchangeable with another brand's set.
- Filter EVERY metaphor through the "${lens.name}" lens above — that's what separates this batch from a generic icon dump.

## Pre-Submission Checklist (verify EACH icon)
✓ Only <path> elements, max ${maxPaths}${isDuotone ? " (≥2: back fill + front line)" : detail === "low" ? ", prefer 1" : ""}
✓ ALL coordinates are integers or .5 — ZERO arbitrary decimals
✓ No transforms, no inline ${isDuotone ? "stroke" : "fill/stroke"} colors, no ids/classes/styles
✓ Uniform visual weight across the batch
✓ Uniform visual weight across the batch
✓ Recognizable as a silhouette at 12×12
✓ Reflects the brand DNA, not a generic icon-set
✓ NOT the first/obvious metaphor — passed the "ban the cliché" test
✓ Distinct silhouette from every other icon in this batch (no recycled base shapes)
✓ Zero decorative sparkles/stars/dots that don't carry meaning
✓ Would make an art director screenshot it`;

    console.log(`[generate-icon-set-worker] Generating ${iconCount} icons via gemini-2.5-pro for ${category}/${currentSection.name}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-pro-preview",
        temperature: 1.05,
        top_p: 0.95,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "submit_icons",
            description: "Submit the generated SVG icons",
            parameters: {
              type: "object",
              properties: {
                icons: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string", description: "Specific, evocative icon name" },
                      svg: { type: "string", description: "Complete SVG element string" },
                    },
                    required: ["name", "svg"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["icons"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "submit_icons" } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`AI gateway ${response.status}: ${errText}`);
    }

    const data = await response.json();
    let icons: Array<{ name: string; svg: string }> = [];

    // Tool call extraction
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        icons = parsed.icons || [];
        console.log(`[generate-icon-set-worker] Extracted ${icons.length} icons via tool calling`);
      } catch (e) {
        console.error("[generate-icon-set-worker] Tool call parse error:", e);
      }
    }

    // Fallback: content parsing
    if (icons.length === 0) {
      const content = data.choices?.[0]?.message?.content || "";
      try {
        let clean = content.trim();
        if (clean.startsWith("```json")) clean = clean.slice(7);
        else if (clean.startsWith("```")) clean = clean.slice(3);
        if (clean.endsWith("```")) clean = clean.slice(0, -3);
        icons = JSON.parse(clean.trim());
      } catch {
        const svgMatches = [...content.matchAll(/<svg[\s\S]*?<\/svg>/gi)];
        const nameMatches = [...content.matchAll(/"name"\s*:\s*"([^"]+)"/gi)];
        icons = svgMatches.map((m, i) => ({
          name: nameMatches[i]?.[1] || `${currentSection.name} ${i + 1}`,
          svg: m[0],
        }));
      }
    }

    // Sanitize + validate each SVG against the rule set. Reject icons we can't fix.
    const cleaned = icons
      .map((icon, idx) => {
        const result = sanitizeAndValidate(icon.svg || "", { isFilled, isDuotone, strokeWidth, linecap, linejoin, maxPaths, gridSize });
        if (!result.ok) {
          console.warn(`[generate-icon-set-worker] Rejected icon "${icon.name}": ${result.reason}`);
          return null;
        }
        return {
          id: crypto.randomUUID(),
          name: icon.name || `${currentSection.name} Icon ${idx + 1}`,
          svgPath: result.svg,
          category: `${category} / ${currentSection.name}`,
          viewBox: `0 0 ${gridSize} ${gridSize}`,
          fillMode: isFilled ? "fill" : "stroke",
        };
      })
      .filter(Boolean) as Array<Record<string, unknown>>;

    const formattedIcons = cleaned;
    console.log(`[generate-icon-set-worker] Completed: ${formattedIcons.length}/${icons.length} icons passed validation for ${category}/${currentSection.name}`);

    // Save result
    await dbFetch(`brand_intelligence_jobs?id=eq.${jobId}`, {
      method: "PATCH",
      body: JSON.stringify({
        status: "completed",
        completed_at: new Date().toISOString(),
        result: {
          icons: formattedIcons,
          category,
          section: currentSection.name,
          sectionDescription: currentSection.description,
          currentIndex: sectionIndex,
          totalSections: taxonomyCategory.sections.length,
          nextIndex: sectionIndex + 1,
          complete: sectionIndex >= taxonomyCategory.sections.length - 1,
          taxonomy: {
            categoryName: taxonomyCategory.name,
            categoryDescription: taxonomyCategory.description,
            totalCategories: Object.keys(ICON_TAXONOMY).length,
          },
        },
      }),
    });
  } catch (error) {
    console.error("[generate-icon-set-worker] Error:", error);
    await dbFetch(`brand_intelligence_jobs?id=eq.${jobId}`, {
      method: "PATCH",
      body: JSON.stringify({
        status: "failed",
        error_message: error instanceof Error ? error.message : "Unknown error",
        completed_at: new Date().toISOString(),
      }),
    });
  }
}

/**
 * Strict sanitizer + validator for generated SVG icons.
 * - Strips forbidden elements/attributes (transform, id, class, style, inline colors, gradients, defs…).
 * - Forces the wrapper attributes to the requested stroke/fill mode (so the AI can't smuggle in baked colors).
 * - Rejects icons that use disallowed primitives, have wild decimal coords, or are missing paths.
 */
function sanitizeAndValidate(
  raw: string,
  opts: { isFilled: boolean; isDuotone?: boolean; strokeWidth: number; linecap: string; linejoin: string; maxPaths?: number; gridSize?: 24 | 48 },
): { ok: true; svg: string } | { ok: false; reason: string } {
  let svg = String(raw || "").trim();
  if (!svg.startsWith("<svg")) return { ok: false, reason: "missing <svg> root" };

  // Disallowed primitives & wrappers — if the model used them, reject (instead of silently breaking layout).
  if (/<(circle|rect|line|polygon|polyline|ellipse|g|use|defs|mask|clipPath|style|filter|linearGradient|radialGradient|image|text|foreignObject)\b/i.test(svg)) {
    return { ok: false, reason: "contains forbidden SVG primitive" };
  }

  // Must contain at least one <path d="…">
  const pathMatches = [...svg.matchAll(/<path\b[^>]*\bd\s*=\s*"([^"]+)"[^>]*\/?>/gi)];
  if (pathMatches.length === 0) return { ok: false, reason: "no <path d=…> found" };
  const maxPaths = opts.maxPaths ?? 3;
  if (pathMatches.length > maxPaths) return { ok: false, reason: `${pathMatches.length} paths (max ${maxPaths})` };
  if (opts.isDuotone && pathMatches.length < 2) return { ok: false, reason: "duotone requires ≥2 paths (back fill + front line)" };

  // Reject wild decimal coordinates (more than 2 decimal places, or non-.5 fractions are a soft warning only).
  for (const m of pathMatches) {
    const d = m[1];
    const badDecimals = d.match(/\d+\.\d{3,}/g);
    if (badDecimals && badDecimals.length > 0) {
      return { ok: false, reason: `path has ${badDecimals.length} high-precision decimals (snap to .0/.5)` };
    }
  }

  // Strip forbidden attributes from every element.
  svg = svg.replace(/\s(id|class|style|data-[\w-]+|transform)\s*=\s*"[^"]*"/gi, "");

  const vb = opts.gridSize === 48 ? "0 0 48 48" : "0 0 24 24";
  if (opts.isDuotone) {
    // Duotone: preserve fill="currentColor" + fill-opacity (back layer) and stroke (front).
    // Strip baked color hexes / named colors but keep currentColor + fill-opacity.
    svg = svg.replace(/<path\b([^>]*)\/?>(?!\s*<\/path>)/gi, (m, attrs) => {
      let a: string = attrs;
      // Replace literal color hex/keywords with currentColor on fill/stroke
      a = a.replace(/(fill|stroke)\s*=\s*"(?!currentColor|none)[^"]*"/gi, '$1="currentColor"');
      // Drop stroke-width/cap/join — wrapper enforces front-line defaults, back-fill paths set their own stroke="none"
      return `<path${a}/>`;
    });
    // Wrapper for duotone: outline defaults, individual back paths override with fill+opacity
    const wrapperAttrs = `xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="24" height="24" fill="none" stroke="currentColor" stroke-width="${opts.strokeWidth}" stroke-linecap="${opts.linecap}" stroke-linejoin="${opts.linejoin}"`;
    svg = svg.replace(/<svg\b[^>]*>/i, `<svg ${wrapperAttrs}>`);
  } else {
    // Strip baked colors from inner elements (we re-apply wrapper-level coloring).
    svg = svg.replace(/<(path|svg)\b([^>]*)>/gi, (_, tag, attrs) => {
      const cleaned = attrs
        .replace(/\s(fill|stroke|stroke-width|stroke-linecap|stroke-linejoin|stroke-miterlimit|opacity|fill-opacity|stroke-opacity)\s*=\s*"[^"]*"/gi, "");
      return `<${tag}${cleaned}>`;
    });
    const wrapperAttrs = opts.isFilled
      ? `xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="24" height="24" fill="currentColor" stroke="none"`
      : `xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="24" height="24" fill="none" stroke="currentColor" stroke-width="${opts.strokeWidth}" stroke-linecap="${opts.linecap}" stroke-linejoin="${opts.linejoin}"`;
    svg = svg.replace(/<svg\b[^>]*>/i, `<svg ${wrapperAttrs}>`);
  }

  // Final sanity: must still parse as a closed <svg>…</svg>.
  if (!/<\/svg>\s*$/i.test(svg)) return { ok: false, reason: "unterminated <svg>" };

  return { ok: true, svg };
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Brand DNA loader — pulls archetype, services, values, tone, mission, etc.  */
/* directly from the entity's guide_data so the AI can design brand-specific  */
/* icons instead of generic taxonomy fill.                                    */
/* ────────────────────────────────────────────────────────────────────────── */

interface BrandDNA {
  archetype?: string;
  mission?: string;
  tagline?: string;
  toneOfVoice?: string[];
  values?: string[];
  services?: string[];
  primaryColor?: string;
  industry?: string;
}

async function loadBrandDNA(entityId?: string, entityType?: string): Promise<BrandDNA | null> {
  if (!entityId || !entityType) return null;
  const table = entityType === "brand" ? "brands" : entityType === "product" ? "products" : entityType === "event" ? "events" : null;
  if (!table) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_entity_text_context`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ p_table: table, p_id: entityId }),
    });
    if (!res.ok) return null;
    const ctx = await res.json();
    if (!ctx) return null;
    const toArr = (v: unknown): string[] => {
      if (!v) return [];
      if (Array.isArray(v)) return v.map((x) => (typeof x === "string" ? x : String(x ?? ""))).filter(Boolean);
      return [];
    };
    const primaryColorObj = Array.isArray(ctx.colors)
      ? (ctx.colors.find((c: any) => (c?.role || "").toLowerCase() === "primary") ?? ctx.colors[0])
      : null;
    return {
      archetype: ctx.archetype || undefined,
      mission: ctx.mission || undefined,
      tagline: ctx.primary_tagline || ctx.hero_tagline || undefined,
      toneOfVoice: toArr(ctx.tone_of_voice).slice(0, 4),
      values: toArr(ctx.values).slice(0, 5),
      services: toArr(ctx.services).slice(0, 6),
      primaryColor: primaryColorObj?.hex || undefined,
      industry: ctx.industry || undefined,
    };
  } catch (err) {
    console.warn("[generate-icon-set-worker] Brand DNA fetch failed:", err);
    return null;
  }
}

function buildBrandContextBlock(args: { entityName: string; industry?: string; brandDNA: BrandDNA | null }): string {
  const { entityName, industry, brandDNA } = args;
  const lines: string[] = ["## Brand DNA (design FOR this brand, not generic)"];
  lines.push(`- Brand: "${entityName}"`);
  const effIndustry = brandDNA?.industry || industry;
  if (effIndustry) lines.push(`- Industry: ${effIndustry}`);
  if (brandDNA?.archetype) lines.push(`- Archetype: ${brandDNA.archetype} → metaphor vocabulary should reflect this archetype's symbols`);
  if (brandDNA?.mission) lines.push(`- Mission: ${truncate(brandDNA.mission, 220)}`);
  if (brandDNA?.tagline) lines.push(`- Tagline: "${truncate(brandDNA.tagline, 140)}"`);
  if (brandDNA?.toneOfVoice?.length) lines.push(`- Voice: ${brandDNA.toneOfVoice.join(", ")} — translate these adjectives into line quality, corner style, and gesture`);
  if (brandDNA?.values?.length) lines.push(`- Values: ${brandDNA.values.join(", ")}`);
  if (brandDNA?.services?.length) lines.push(`- Services / offerings: ${brandDNA.services.join("; ")}`);
  if (brandDNA?.primaryColor) lines.push(`- Primary color (for context only — DO NOT bake into SVG): ${brandDNA.primaryColor}`);
  if (lines.length === 1) {
    // No DNA loaded — fall back to minimal context
    lines.push(`- (No deep brand context available — design crisp, neutral icons that still feel premium.)`);
  }
  return lines.join("\n");
}

function truncate(s: string, n: number): string {
  if (!s) return "";
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Creative lens — rotates the visual point-of-view per section so each batch */
/* arrives with a distinct aesthetic instead of defaulting to generic Lucide. */
/* ────────────────────────────────────────────────────────────────────────── */

interface CreativeLens {
  name: string;
  brief: string;
  tactics: string;
}

const CREATIVE_LENSES: CreativeLens[] = [
  {
    name: "Bauhaus Primitives",
    brief: "Reduce every metaphor to its most essential geometric primitive — circle, triangle, square — then compose them with Klee/Albers precision. Forms feel inevitable, not decorative.",
    tactics: "lean on perfect circles and 45°/90° angles, use one bold gesture per icon, prefer composition over detail.",
  },
  {
    name: "Risograph Cut-Paper",
    brief: "Imagine each icon hand-cut from coloured paper with scissors. Slightly imperfect curves, confident silhouettes, the energy of Matisse late-period gouaches.",
    tactics: "use bold closed shapes, embrace gentle organic curves over machine arcs, let counter-form do half the work.",
  },
  {
    name: "Japanese Mon (家紋)",
    brief: "Family-crest discipline. Centred, contained, symbolic. A single emblem that distils an entire concept into one breath. Centuries of refinement compressed into 24px.",
    tactics: "tight radial composition, repeating motifs around a center, deeply symbolic over literal — ban any obvious Western referent.",
  },
  {
    name: "Brutalist Concrete",
    brief: "Heavy, blocky, architectural. Le Corbusier and Paul Rand meet Massimo Vignelli. Mass and weight tell the story; refinement comes from proportion, not decoration.",
    tactics: "thick slab-like forms, rectilinear silhouettes, harsh corners, monumental scale within the frame.",
  },
  {
    name: "Memphis Off-Kilter",
    brief: "Ettore Sottsass playfulness — slightly tilted, intentionally imperfect, joyfully geometric. Squiggles, half-arcs, and confident asymmetry that feels deliberate, not accidental.",
    tactics: "tilt the axis 5–10°, mix one curved gesture with one angular, prefer odd-numbered elements, embrace counterpoint.",
  },
  {
    name: "Constructivist Diagonal",
    brief: "Rodchenko and El Lissitzky energy. Diagonals slice the frame, forms converge to off-centre vanishing points, every glyph implies motion or force.",
    tactics: "rotate primary axis to 30°/60°, asymmetric weight distribution, arrow-like directionality even in static concepts.",
  },
  {
    name: "Art Nouveau Whiplash",
    brief: "Mucha-meets-Mackintosh sinuous line work. Curves that breathe and accelerate, organic growth patterns, the feeling of botanical engineering.",
    tactics: "vary line curvature within a single stroke, S-curves and parabolic arcs over circles, asymmetric organic balance.",
  },
  {
    name: "ISO Wayfinding",
    brief: "AIGA and Otl Aicher pictogram clarity. Universal, calm, unambiguous. The icon equivalent of an airport — strangers in any culture understand instantly.",
    tactics: "high silhouette legibility, rigid geometric reduction, NO ornament — but find an unexpected viewpoint to escape stock.",
  },
  {
    name: "Punk Photocopy",
    brief: "Jamie Reid, Barney Bubbles, early Factory Records. Slightly broken, off-register, defiantly hand-made. Energy over polish, but still controlled by an expert hand.",
    tactics: "intentional rough corner, slight rotation, contrast a sharp edge with a torn one, break ONE rule per icon (only one).",
  },
  {
    name: "Suprematist Floating",
    brief: "Malevich's white-on-white compositions. Forms floating in measured space, each shape weighted by its position as much as its mass. Silence as composition.",
    tactics: "off-centre placement within the safe zone, generous negative space, two forms in spatial dialogue rather than one centred shape.",
  },
  {
    name: "Op-Art Counter-Form",
    brief: "Bridget Riley and Victor Vasarely — the icon emerges from rhythm and counter-form rather than literal depiction. The eye assembles the meaning from pattern.",
    tactics: "build the icon from repeated parallel strokes or nested arcs, let the gestalt do the work, lean hard into counter-form.",
  },
  {
    name: "Folk Woodcut",
    brief: "Mexican lotería, Polish papercut, Scandinavian rosemaling. Symbolic, decorative-but-meaningful, the warmth of generational craft compressed into a glyph.",
    tactics: "use small symbolic flourishes that mean something culturally, prefer symmetric folk-balance, every curve hand-drawn-feeling.",
  },
];

function pickCreativeLens(entityName: string, category: string, sectionIndex: number): CreativeLens {
  // Stable hash across (brand × category × section) so the same section regenerates with the same lens,
  // but adjacent sections get different lenses — yielding visual variety across a brand's whole set.
  const seed = `${entityName || "brand"}::${category || "core"}::${sectionIndex}`;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return CREATIVE_LENSES[Math.abs(h) % CREATIVE_LENSES.length];
}
