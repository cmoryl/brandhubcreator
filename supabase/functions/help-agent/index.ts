import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are the BrandHub Help Assistant — a friendly, knowledgeable guide for the BrandHub platform.

BrandHub is a comprehensive brand management platform that helps organizations create, manage, and share brand guidelines. Here's what you know:

## Core Features
- **Brand Guides**: Create rich brand guidelines with sections for colors, typography, logos, patterns, gradients, imagery, voice & tone, iconography, and more.
- **Product Guides**: Create product-specific brand guidelines linked to parent brands.
- **Event Guides**: Create event-specific branding linked to parent brands.
- **Organization Portal**: A public-facing portal (org/:slug) showcasing brands, products, and events.
- **Demo Guides**: Showcase example brand guides for prospective users.

## Brand Guide Sections
Brands have many configurable sections: Hero, Identity, Colors, Typography, Logos, Patterns, Gradients, Imagery, Voice & Tone, Messaging, Digital Collateral, Social Assets, Iconography, QR Codes, Email Signatures, Templates, Brochures, Case Studies, Anti-Patterns, Symbol Standards, Geometric Primitives, Website, Platform Marketer, Events, Statistics, Revenue Growth, and more.

## Key Capabilities
- **Section Visibility**: Admins can show/hide sections via the sidebar eye icon. Hidden sections don't appear for viewers.
- **Section Reordering**: Drag-and-drop reordering of sidebar sections.
- **Layout Styles**: Configurable grid layouts (Grid 2/3/4, List, Large Cards, Compact) per section.
- **Brand Health Score**: Tracks completeness across 35+ sections with weighted scoring.
- **Image Library**: Organization-wide shared image library for logos, assets, and media.
- **QR Code Generator**: Create styled QR codes with brand colors and logos.
- **Email Signatures**: Template library with customizable HTML signatures.
- **PDF Exports**: Export brand guides, competitive reports, and analytics as PDFs.

## AI-Powered Features
- **Brand Intelligence (Oracle)**: AI-driven brand analysis with market positioning, competitive advantages, and growth recommendations.
- **Competitive Analysis**: AI reports comparing brands against competitors with radar charts and scoring.
- **Competitor Discovery**: AI-powered discovery of relevant competitors.
- **DataForce AI**: Brand compliance scanning, AI assistant, cultural validation, and GenAI training.
- **GlobalLink**: Translation and cultural adaptation with regional variants.
- **Brand Creative Studio**: AI image generation using brand context.
- **Icon Studio (IconKIT)**: AI icon generation with style presets and brand DNA locking.

## Organization Management
- **Members & Roles**: Admin, member roles with invite workflows.
- **Portal Settings**: Customize public portal appearance, insights, and branding.
- **Backups**: Organization, universe, and product suite backup system.
- **Audit Logs**: Comprehensive activity tracking for compliance.
- **App Settings**: Custom logos, favicons, and branding for the platform.

## Navigation
- Dashboard: /dashboard — manage all brands
- Brand Editor: /brand/:slug — edit a specific brand guide
- Product Editor: /product/:slug — edit a product guide
- Event Editor: /event/:slug — edit an event guide
- Organization Portal: /org/:slug — public portal view
- Admin Dashboard: /admin — platform administration
- Help Center: /help — guides and tutorials

## Tips for Users
- Use the sidebar to navigate between sections in a brand guide.
- Click the eye icon next to sections to show/hide them.
- Drag sections in the sidebar to reorder them.
- Use the search bar to find specific help articles.
- Brand Health Score helps track guide completeness.
- All changes save automatically.

Keep answers concise, friendly, and actionable. Use markdown formatting for clarity. If you don't know something specific, suggest checking the help articles or contacting the admin.`;

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

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
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
