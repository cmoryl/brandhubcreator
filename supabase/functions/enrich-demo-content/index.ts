/**
 * enrich-demo-content
 * Worker: regenerates one demo's guide_data with rich AI text + Nano Banana imagery.
 * Idempotent. Backs up original to backup_history before mutating.
 *
 * Body: { demoId: string, jobId?: string }
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const restHeaders = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

async function patchJob(jobId: string | undefined, updates: Record<string, unknown>) {
  if (!jobId) return;
  await fetch(`${SUPABASE_URL}/rest/v1/brand_intelligence_jobs?id=eq.${jobId}`, {
    method: "PATCH",
    headers: { ...restHeaders, Prefer: "return=minimal" },
    body: JSON.stringify(updates),
  });
}

async function callAIText(prompt: string, system: string, model = "google/gemini-3-flash-preview"): Promise<string> {
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
      temperature: 0.8,
      max_tokens: 3000,
    }),
  });
  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`AI text ${resp.status}: ${t.slice(0, 200)}`);
  }
  const j = await resp.json();
  return j.choices?.[0]?.message?.content ?? "";
}

async function callAIJson<T>(prompt: string, system: string): Promise<T> {
  const raw = await callAIText(prompt, system + "\n\nReturn ONLY valid JSON, no prose, no markdown fences.");
  const match = raw.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (!match) throw new Error(`No JSON in AI response: ${raw.slice(0, 200)}`);
  return JSON.parse(match[0]) as T;
}

async function generateImage(prompt: string): Promise<string | null> {
  try {
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });
    if (!resp.ok) {
      console.error(`Image gen failed: ${resp.status}`);
      return null;
    }
    const j = await resp.json();
    const dataUrl = j.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    return dataUrl ?? null;
  } catch (e) {
    console.error("Image gen error:", e);
    return null;
  }
}

async function uploadDataUrl(dataUrl: string, demoSlug: string, label: string): Promise<string | null> {
  try {
    const m = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!m) return null;
    const [, mime, b64] = m;
    const ext = mime.split("/")[1] || "png";
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const path = `demos/${demoSlug}/${label}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
    const upRes = await fetch(`${SUPABASE_URL}/storage/v1/object/organization-assets/${path}`, {
      method: "POST",
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        "Content-Type": mime,
        "x-upsert": "true",
      },
      body: bytes,
    });
    if (!upRes.ok) {
      console.error("Upload failed:", await upRes.text());
      return null;
    }
    return `${SUPABASE_URL}/storage/v1/object/public/organization-assets/${path}`;
  } catch (e) {
    console.error("Upload error:", e);
    return null;
  }
}

async function genAndUpload(prompt: string, demoSlug: string, label: string): Promise<string | null> {
  const dataUrl = await generateImage(prompt);
  if (!dataUrl) return null;
  return uploadDataUrl(dataUrl, demoSlug, label);
}

// ─────────────────────────────────────────────────────────────────────────────
// Main worker
// ─────────────────────────────────────────────────────────────────────────────

interface DemoRow {
  id: string;
  name: string;
  slug: string;
  type: string;
  industry_label: string | null;
  guide_data: Record<string, any>;
}

async function enrichDemo(demoId: string, jobId?: string): Promise<{ demo: string; sections: number }> {
  // Load demo
  const dRes = await fetch(`${SUPABASE_URL}/rest/v1/demo_brands?id=eq.${demoId}&select=id,name,slug,type,industry_label,guide_data`, { headers: restHeaders });
  const rows = (await dRes.json()) as DemoRow[];
  const demo = rows[0];
  if (!demo) throw new Error("Demo not found");

  const guide = demo.guide_data || {};
  const hero = guide.hero || {};
  const identity = guide.identity || {};
  const colors = (guide.colors as any[]) || [];
  const primary = colors[0]?.hex || "#0066FF";
  const secondary = colors[1]?.hex || "#00A3FF";
  const accent = colors[2]?.hex || "#FFB400";
  const archetype = identity.archetype || "The Sage";
  const tagline = hero.tagline || demo.name;
  const industry = demo.industry_label || guide.industry || "Technology";

  const baseContext = `Brand: ${demo.name}\nType: ${demo.type}\nIndustry: ${industry}\nArchetype: ${archetype}\nTagline: ${tagline}\nPrimary color: ${primary}\nSecondary: ${secondary}`;

  // Backup
  await fetch(`${SUPABASE_URL}/rest/v1/backup_history`, {
    method: "POST",
    headers: { ...restHeaders, Prefer: "return=minimal" },
    body: JSON.stringify({
      organization_id: "ec180296-dfe8-4345-869e-66b524e0a12c",
      backup_type: "demo_enrichment",
      backup_path: `demo-snapshot/${demo.slug}-${Date.now()}.json`,
      brands_count: 1,
      products_count: 0,
      status: "completed",
    }),
  });

  await patchJob(jobId, { progress: 10 });

  // ─── 1. CORE IDENTITY (text) ────────────────────────────────────────────
  const identityData = await callAIJson<any>(
    `${baseContext}\n\nGenerate rich brand identity content for this demo. Return JSON with these exact keys:
{
  "missionStatement": "1 powerful sentence (~25 words)",
  "visionStatement": "1 aspirational sentence (~25 words)",
  "brandPromise": "1 customer-facing promise (~20 words)",
  "brandStory": "3-paragraph origin story (~250 words total)",
  "toneOfVoice": ["6 single-word adjectives"],
  "personality": ["5 personality traits"],
  "values": [{"text": "value name", "description": "1-sentence explanation"}, ... 6 values],
  "differentiators": ["4 short differentiator statements"]
}`,
    `You are a brand strategist crafting demo content for a ${industry} ${demo.type} with archetype "${archetype}".`
  );

  guide.identity = {
    ...identity,
    missionStatement: identityData.missionStatement,
    visionStatement: identityData.visionStatement,
    brandPromise: identityData.brandPromise,
    brandStory: identityData.brandStory,
    toneOfVoice: identityData.toneOfVoice,
    personality: identityData.personality,
    archetype,
  };
  guide.values = (identityData.values || []).map((v: any, i: number) => ({
    id: `v-${i}`,
    text: v.text,
    description: v.description,
  }));
  guide.differentiators = identityData.differentiators;

  await patchJob(jobId, { progress: 20 });

  // ─── 2. CONTENT & COLLATERAL (text-heavy) ───────────────────────────────
  const collateral = await callAIJson<any>(
    `${baseContext}\n\nGenerate a rich content package for this demo. Return JSON:
{
  "caseStudies": [
    {"title": "...", "client": "fictional company name", "industry": "...", "challenge": "1-2 sentences", "solution": "1-2 sentences", "results": ["3 quantified outcomes"], "year": 2024 or 2025}
    ... 5 case studies
  ],
  "awards": [
    {"title": "award name", "organization": "awarding body", "year": 2023-2025, "category": "category", "description": "1 sentence"}
    ... 6 awards
  ],
  "statistics": [
    {"label": "...", "value": "with units like 98% or 2.4M+", "description": "context"}
    ... 8 stats
  ],
  "webinars": [
    {"title": "...", "topic": "...", "speakers": "Name, Title", "date": "2024-2025", "description": "2 sentences", "duration": "45 min"}
    ... 4 webinars
  ],
  "brochures": [
    {"title": "...", "category": "Product Sheet|Whitepaper|Case Study", "description": "1 sentence", "pages": 8-24}
    ... 4 brochures
  ],
  "services": [
    {"name": "...", "description": "1 sentence"}
    ... 5 services
  ],
  "tagline": {"primary": "${tagline}", "alternates": ["3 alternate taglines"]},
  "messaging": {
    "elevatorPitch": "30-second spoken pitch (~60 words)",
    "valueProps": ["4 value propositions, 1 sentence each"]
  }
}`,
    `You are a senior copywriter producing demo content for ${demo.name}. Make every item feel real, specific, and on-brand.`
  );

  guide.caseStudies = (collateral.caseStudies || []).map((c: any, i: number) => ({
    id: `cs-${i}`,
    title: c.title,
    client: c.client,
    industry: c.industry,
    challenge: c.challenge,
    solution: c.solution,
    results: c.results,
    year: c.year,
    description: c.challenge,
  }));
  guide.awards = (collateral.awards || []).map((a: any, i: number) => ({
    id: `aw-${i}`,
    title: a.title,
    organization: a.organization,
    year: a.year,
    category: a.category,
    description: a.description,
  }));
  guide.statistics = (collateral.statistics || []).map((s: any, i: number) => ({
    id: `st-${i}`,
    label: s.label,
    value: s.value,
    description: s.description,
  }));
  guide.webinars = (collateral.webinars || []).map((w: any, i: number) => ({
    id: `w-${i}`,
    ...w,
  }));
  guide.brochures = (collateral.brochures || []).map((b: any, i: number) => ({
    id: `br-${i}`,
    title: b.title,
    category: b.category,
    description: b.description,
    pages: b.pages,
  }));
  guide.services = (collateral.services || []).map((s: any, i: number) => ({
    id: `sv-${i}`,
    name: s.name,
    description: s.description,
  }));
  guide.tagline = collateral.tagline;
  guide.messaging = collateral.messaging;

  await patchJob(jobId, { progress: 40 });

  // ─── 3. VISUAL ASSETS (Nano Banana imagery) ─────────────────────────────
  const visualStyle = `Style: documentary realism, professional photography, clean composition, brand colors ${primary} and ${secondary}, modern, premium, no text, no logos, no watermarks.`;

  // 3a. Hero / cover imagery (1)
  const coverPromptBase = demo.type === "event"
    ? `Wide cinematic photo of a modern conference stage with dynamic lighting in ${primary} and ${secondary}. ${visualStyle}`
    : demo.type === "product"
    ? `Hero product photography for ${demo.name} (${industry}) on a clean studio background with subtle ${primary} accent lighting. ${visualStyle}`
    : `Hero brand photography representing ${demo.name} — a ${industry} ${archetype} brand. Abstract modern environment with ${primary} accent. ${visualStyle}`;
  const coverUrl = await genAndUpload(coverPromptBase, demo.slug, "cover");
  if (coverUrl) {
    guide.hero = { ...hero, coverImage: coverUrl, cardImage: coverUrl };
  }

  await patchJob(jobId, { progress: 50 });

  // 3b. Imagery library (4 lifestyle shots)
  const imageryPrompts = [
    `Lifestyle shot of people interacting with ${industry} solutions, candid documentary feel. ${visualStyle}`,
    `Detail close-up shot relevant to ${demo.name}, shallow depth of field. ${visualStyle}`,
    `Environmental wide shot — workspace or context where ${demo.name} is used. ${visualStyle}`,
    `Symbolic conceptual photo representing "${tagline}". ${visualStyle}`,
  ];
  const imageryResults: any[] = [];
  for (let i = 0; i < imageryPrompts.length; i++) {
    const url = await genAndUpload(imageryPrompts[i], demo.slug, `imagery-${i}`);
    if (url) {
      imageryResults.push({
        id: `img-${i}`,
        url,
        type: "do",
        description: `Approved brand imagery example ${i + 1}`,
        caption: ["Lifestyle", "Detail", "Environmental", "Conceptual"][i],
      });
    }
    await patchJob(jobId, { progress: 50 + (i + 1) * 4 });
  }
  guide.imagery = imageryResults;

  // 3c. Patterns (2 abstract patterns as images)
  const patternResults: any[] = [];
  for (let i = 0; i < 2; i++) {
    const url = await genAndUpload(
      `Seamless abstract brand pattern, ${i === 0 ? "geometric grid" : "organic flowing curves"}, colors ${primary} and ${secondary} on white background, minimal, modern, vector-style flat design, no text.`,
      demo.slug,
      `pattern-${i}`
    );
    if (url) patternResults.push({ id: `pt-${i}`, url, name: i === 0 ? "Geometric Grid" : "Organic Flow", description: "Brand pattern for backgrounds and accents" });
  }
  guide.patterns = patternResults;

  await patchJob(jobId, { progress: 75 });

  // 3d. Brand icons (3 simple line icons)
  const iconResults: any[] = [];
  const iconConcepts = demo.type === "event"
    ? ["calendar/agenda", "microphone/speaker", "network/connections"]
    : demo.type === "product"
    ? ["core feature", "integration", "performance"]
    : ["innovation", "growth", "trust"];
  for (let i = 0; i < iconConcepts.length; i++) {
    const url = await genAndUpload(
      `Single minimalist line icon representing "${iconConcepts[i]}", thin strokes, ${primary} color on solid white background, centered, simple, geometric, 24x24 grid style, no text.`,
      demo.slug,
      `icon-${i}`
    );
    if (url) iconResults.push({ id: `ic-${i}`, url, name: iconConcepts[i], category: "brand" });
  }
  guide.brandIcons = iconResults;

  // 3e. Approved imagery sections
  guide.approvedImagery = {
    sections: [
      {
        id: "ai-1",
        name: "Brand Lifestyle",
        description: "Approved lifestyle photography for marketing use",
        images: imageryResults.slice(0, 2).map((i) => ({ ...i, tags: ["lifestyle", "approved"] })),
      },
      {
        id: "ai-2",
        name: "Product/Detail Shots",
        description: "Detail and environmental imagery",
        images: imageryResults.slice(2).map((i) => ({ ...i, tags: ["detail", "approved"] })),
      },
    ],
  };

  // ─── 4. SECTION CARD IMAGERY (websites, QR, videos, brochures, templates, social, presentations) ─
  const cardStyle = `Style: clean modern flat design, brand colors ${primary} and ${secondary}, no text, no logos, no watermarks, professional, high contrast, 16:9 composition.`;

  // 4a. WEBSITES — generate website screenshot mockups for each existing website
  const existingWebsites = (guide.websites as any[]) || [];
  const websitesEnriched: any[] = [];
  for (let i = 0; i < Math.max(existingWebsites.length, 2); i++) {
    const w = existingWebsites[i] || { id: `w-${i}`, label: i === 0 ? "Main Website" : "Documentation", url: `https://${demo.slug}.example.com` };
    const screenshotPrompt = `Modern website homepage screenshot mockup for "${demo.name}" (${industry}), shown on a desktop browser frame. Clean hero section with abstract ${primary} accents, navigation bar at top, content blocks below. ${cardStyle}`;
    const screenshotUrl = await genAndUpload(screenshotPrompt, demo.slug, `website-${i}`);
    websitesEnriched.push({
      id: w.id || `w-${i}`,
      label: w.label || `Website ${i + 1}`,
      url: w.url || `https://${demo.slug}.example.com`,
      screenshotUrl: screenshotUrl || w.screenshotUrl,
    });
  }
  guide.websites = websitesEnriched;

  // 4b. QR CODES — 3 QR codes with generated visual placeholders
  const qrConcepts = demo.type === "event"
    ? [{ label: "Event Registration", purpose: "register" }, { label: "Schedule & Agenda", purpose: "agenda" }, { label: "Speaker Directory", purpose: "speakers" }]
    : [{ label: "Main Website", purpose: "website" }, { label: "Product Demo", purpose: "demo" }, { label: "Contact Sales", purpose: "sales" }];
  const qrResults: any[] = [];
  for (let i = 0; i < qrConcepts.length; i++) {
    const qrPrompt = `Square QR code style graphic on solid white background — geometric black and ${primary} square pixel pattern arranged in a stylized QR code grid layout, with rounded corner squares in three corners. Clean, scannable look, centered, high contrast. No text.`;
    const url = await genAndUpload(qrPrompt, demo.slug, `qr-${i}`);
    qrResults.push({
      id: `qr-${i}`,
      label: qrConcepts[i].label,
      url: `https://${demo.slug}.example.com/${qrConcepts[i].purpose}`,
      imageUrl: url,
      description: `QR code for ${qrConcepts[i].label.toLowerCase()} — use on print, signage, and digital materials.`,
    });
  }
  guide.qrCodes = qrResults;

  // 4c. VIDEOS — 3 video preview cards with thumbnails
  const videoConcepts = [
    { title: `${demo.name} Brand Story`, description: "Our journey, mission, and what drives us forward.", duration: "2:30" },
    { title: demo.type === "event" ? "Event Highlights Reel" : "Product Walkthrough", description: demo.type === "event" ? "Best moments from past editions and what to expect this year." : `See ${demo.name} in action — key features and real workflows.`, duration: "3:45" },
    { title: "Customer Stories", description: "How real customers use and benefit from our solutions.", duration: "4:12" },
  ];
  const videoResults: any[] = [];
  for (let i = 0; i < videoConcepts.length; i++) {
    const thumbPrompt = `Cinematic video thumbnail for "${videoConcepts[i].title}" related to ${demo.name} (${industry}). Atmospheric scene with ${primary} accent lighting, depth of field, professional storytelling feel. ${cardStyle}`;
    const thumbnail = await genAndUpload(thumbPrompt, demo.slug, `video-${i}`);
    videoResults.push({
      id: `vid-${i}`,
      type: "youtube",
      title: videoConcepts[i].title,
      description: videoConcepts[i].description,
      duration: videoConcepts[i].duration,
      url: `https://www.youtube.com/watch?v=demo${i}`,
      thumbnail,
    });
  }
  guide.videos = videoResults;

  await patchJob(jobId, { progress: 82 });

  // 4d. BROCHURES — add thumbnailUrl to each brochure (use guide.brochures already populated)
  const brochuresWithThumbs: any[] = [];
  for (let i = 0; i < (guide.brochures || []).length; i++) {
    const b = guide.brochures[i];
    const brochurePrompt = `Front cover of a corporate ${b.category || "brochure"} titled "${b.title}" for ${demo.name}. Modern minimalist layout with ${primary} accent stripe, abstract geometric shapes, premium print design feel. ${cardStyle}`;
    const thumbnailUrl = await genAndUpload(brochurePrompt, demo.slug, `brochure-${i}`);
    brochuresWithThumbs.push({
      ...b,
      thumbnailUrl,
      previewUrl: thumbnailUrl,
      fileType: "pdf",
      fileSize: `${(b.pages || 12) * 0.4}MB`,
    });
  }
  guide.brochures = brochuresWithThumbs;

  // 4e. TEMPLATES — 4 templates with thumbnails + specifications
  const templateConcepts = [
    { name: "Presentation Template", fileType: "pptx", category: "Presentation", description: "Master slide deck with cover, content, and closing slide layouts following brand guidelines.", specs: { dimensions: "16:9 widescreen", slides: "20+ master layouts", fonts: "Embedded brand fonts", colorMode: "RGB" } },
    { name: "Email Signature", fileType: "html", category: "Email", description: "HTML email signature with logo, contact details, and social links — Outlook + Gmail compatible.", specs: { dimensions: "600x150px", format: "HTML + inline CSS", logo: "Embedded SVG", compatibility: "Outlook, Gmail, Apple Mail" } },
    { name: "Letterhead", fileType: "docx", category: "Document", description: "Branded letterhead document with header, footer, and pre-styled paragraph styles.", specs: { dimensions: "US Letter / A4", margins: "1\" all sides", header: "Logo + tagline", footer: "Address + contact" } },
    { name: "Social Post Template", fileType: "psd", category: "Social", description: "Layered social media post template optimized for LinkedIn, Instagram, and Twitter.", specs: { dimensions: "1080x1080px", layers: "Editable text + image masks", fonts: "Brand fonts included", export: "PNG, JPG, MP4" } },
  ];
  const templateResults: any[] = [];
  for (let i = 0; i < templateConcepts.length; i++) {
    const tc = templateConcepts[i];
    const tplPrompt = `Preview thumbnail of a ${tc.name} for ${demo.name} — clean modern layout sample, ${primary} accents, professional design system aesthetic. ${cardStyle}`;
    const thumbnailUrl = await genAndUpload(tplPrompt, demo.slug, `template-${i}`);
    templateResults.push({
      id: `tmpl-${i}`,
      name: tc.name,
      category: tc.category,
      description: tc.description,
      fileType: tc.fileType,
      fileSize: ["5.2 MB", "12 KB", "84 KB", "28 MB"][i],
      thumbnailUrl,
      previewUrl: thumbnailUrl,
      specifications: tc.specs,
    });
  }
  guide.templates = templateResults;

  await patchJob(jobId, { progress: 88 });

  // 4f. SOCIAL ASSETS — 4 platforms with preview imagery
  const socialPlatforms = [
    { platform: "LinkedIn", postSize: "1200x1200", coverSize: "1584x396", storySize: "1080x1920" },
    { platform: "Instagram", postSize: "1080x1080", coverSize: "1080x566", storySize: "1080x1920" },
    { platform: "Twitter/X", postSize: "1600x900", coverSize: "1500x500", storySize: "1080x1920" },
    { platform: "Facebook", postSize: "1200x630", coverSize: "1640x856", storySize: "1080x1920" },
  ];
  const socialResults: any[] = [];
  for (let i = 0; i < socialPlatforms.length; i++) {
    const sp = socialPlatforms[i];
    const socialPrompt = `Branded ${sp.platform} social media post mockup for ${demo.name}. Clean composition with ${primary} brand color, abstract imagery, room for headline overlay. ${cardStyle}`;
    const previewImageUrl = await genAndUpload(socialPrompt, demo.slug, `social-${i}`);
    socialResults.push({
      id: `sa-${i}`,
      platform: sp.platform,
      postSize: sp.postSize,
      coverSize: sp.coverSize,
      storySize: sp.storySize,
      directive: `Use brand colors (${primary}, ${secondary}) and approved imagery. Logo bottom-right with 16px clear space.`,
      textLegibility: "High contrast required. Minimum 24pt headline, 16pt body. Test against busy backgrounds.",
      previewImageUrl,
    });
  }
  guide.socialAssets = socialResults;

  // 4g. PRESENTATION TEMPLATES — 3 decks with cover thumbnails
  const presentationConcepts = [
    { name: "Brand Overview Deck", description: "Master corporate deck for sales, partnerships, and onboarding presentations.", slides: 24 },
    { name: demo.type === "event" ? "Event Sponsor Deck" : "Product Pitch Deck", description: demo.type === "event" ? "Sponsorship tiers, audience demographics, activation opportunities." : "Product positioning, key features, ROI for prospect meetings.", slides: 18 },
    { name: "Quarterly Business Review", description: "Internal QBR template with KPI dashboards, milestone tracking, and roadmap layouts.", slides: 32 },
  ];
  const presentationResults: any[] = [];
  for (let i = 0; i < presentationConcepts.length; i++) {
    const pc = presentationConcepts[i];
    const presPrompt = `Cover slide of a "${pc.name}" presentation for ${demo.name}. Bold modern title slide with ${primary} accent, geometric layout, premium corporate design. ${cardStyle}`;
    const cardImageUrl = await genAndUpload(presPrompt, demo.slug, `presentation-${i}`);
    presentationResults.push({
      id: `pt-${i}`,
      name: pc.name,
      description: pc.description,
      category: "Presentation",
      fileType: "pptx",
      fileSize: `${pc.slides * 0.6}MB`,
      slideCount: pc.slides,
      cardImageUrl,
      thumbnailUrl: cardImageUrl,
    });
  }
  guide.presentationTemplates = presentationResults;

  await patchJob(jobId, { progress: 95 });

  // ─── 4. SAVE ────────────────────────────────────────────────────────────
  const upd = await fetch(`${SUPABASE_URL}/rest/v1/demo_brands?id=eq.${demoId}`, {
    method: "PATCH",
    headers: { ...restHeaders, Prefer: "return=minimal" },
    body: JSON.stringify({ guide_data: guide, card_image_url: coverUrl || undefined, updated_at: new Date().toISOString() }),
  });
  if (!upd.ok) throw new Error(`Update failed: ${await upd.text()}`);

  await patchJob(jobId, { progress: 100 });

  return { demo: demo.name, sections: Object.keys(guide).length };
}

// ─────────────────────────────────────────────────────────────────────────────
// Entry
// ─────────────────────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  let jobId: string | undefined;
  try {
    const body = await req.json();
    jobId = body.jobId;
    const demoId = body.demoId;
    if (!demoId) throw new Error("demoId required");

    const result = await enrichDemo(demoId, jobId);

    if (jobId) {
      await patchJob(jobId, {
        status: "completed",
        progress: 100,
        result,
        completed_at: new Date().toISOString(),
      });
    }

    return new Response(JSON.stringify({ success: true, ...result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("enrich-demo-content error:", e);
    const msg = e instanceof Error ? e.message : "Unknown";
    if (jobId) {
      await patchJob(jobId, {
        status: "failed",
        error_message: msg,
        completed_at: new Date().toISOString(),
      });
    }
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
