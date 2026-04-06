/**
 * Extract Asset Content
 * Reads PDFs and documents from brand guide_data (brochures, templates, presentations, etc.)
 * Extracts text content and persists to oracle_knowledge_base for AI reuse.
 * Uses lightweight REST pattern (no SDK) to stay under 150MB memory.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_DOCS = 15;
const MAX_TEXT_PER_DOC = 15000; // 15KB text cap

function dbFetch(supabaseUrl: string, serviceKey: string) {
  const base = `${supabaseUrl}/rest/v1`;
  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };

  return {
    async select(table: string, query: string): Promise<any[]> {
      const res = await fetch(`${base}/${table}?${query}`, { headers });
      if (!res.ok) throw new Error(`DB select ${table} failed: ${res.status}`);
      return res.json();
    },
    async selectSingle(table: string, query: string): Promise<any | null> {
      const res = await fetch(`${base}/${table}?${query}`, {
        headers: { ...headers, Accept: "application/vnd.pgrst.object+json" },
      });
      if (res.status === 406) return null;
      if (!res.ok) throw new Error(`DB selectSingle ${table} failed: ${res.status}`);
      return res.json();
    },
    async upsert(table: string, body: Record<string, unknown>): Promise<void> {
      const res = await fetch(`${base}/${table}`, {
        method: "POST",
        headers: { ...headers, Prefer: "return=minimal,resolution=merge-duplicates" },
        body: JSON.stringify(body),
      });
      if (!res.ok && res.status !== 409) {
        console.warn(`DB upsert ${table} warning: ${res.status}`);
      }
    },
  };
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function extractTextFromPdfBytes(bytes: Uint8Array): string {
  const text: string[] = [];
  const str = new TextDecoder("latin1").decode(bytes);

  const streamRegex = /stream\r?\n([\s\S]*?)endstream/g;
  let match;
  while ((match = streamRegex.exec(str)) !== null) {
    const streamContent = match[1];
    const textRegex = /\(([^)]*)\)\s*Tj/g;
    let textMatch;
    while ((textMatch = textRegex.exec(streamContent)) !== null) {
      const extracted = textMatch[1]
        .replace(/\\n/g, "\n")
        .replace(/\\r/g, "\r")
        .replace(/\\t/g, "\t")
        .replace(/\\\(/g, "(")
        .replace(/\\\)/g, ")")
        .replace(/\\\\/g, "\\");
      if (extracted.trim()) text.push(extracted);
    }
    const tjArrayRegex = /\[(.*?)\]\s*TJ/g;
    let tjMatch;
    while ((tjMatch = tjArrayRegex.exec(streamContent)) !== null) {
      const parts = tjMatch[1].match(/\(([^)]*)\)/g);
      if (parts) {
        const combined = parts.map(p => p.slice(1, -1)).join("");
        if (combined.trim()) text.push(combined);
      }
    }
  }

  return text.join(" ").replace(/\s+/g, " ").trim();
}

interface AssetItem {
  title: string;
  url: string;
  category: string;
  source: string; // 'internal' or 'external'
}

function collectAssets(guideData: any): AssetItem[] {
  const assets: AssetItem[] = [];
  const sections = [
    { key: 'brochures', label: 'Brochure' },
    { key: 'templates', label: 'Template' },
    { key: 'presentationTemplates', label: 'Presentation' },
    { key: 'caseStudies', label: 'Case Study' },
    { key: 'presentations', label: 'Presentation' },
  ];

  for (const section of sections) {
    const items = guideData?.[section.key];
    if (!Array.isArray(items)) continue;

    for (const item of items) {
      const title = item.title || item.name || section.label;
      const category = item.category || section.label;

      // Internal storage URL
      if (item.fileUrl && typeof item.fileUrl === 'string' && item.fileUrl.length > 5) {
        assets.push({ title, url: item.fileUrl, category, source: 'internal' });
      }
      // External URL (Dropbox, etc.)
      if (item.externalUrl && typeof item.externalUrl === 'string' && item.externalUrl.length > 5) {
        assets.push({ title, url: item.externalUrl, category, source: 'external' });
      }
    }
  }

  return assets.slice(0, MAX_DOCS);
}

async function fetchDocumentContent(
  asset: AssetItem,
  supabaseUrl: string,
  serviceKey: string,
): Promise<string | null> {
  try {
    let bytes: Uint8Array;

    if (asset.source === 'internal' && asset.url.includes('storage')) {
      // Fetch from Supabase Storage directly
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);

      const res = await fetch(asset.url, {
        headers: {
          Authorization: `Bearer ${serviceKey}`,
          apikey: serviceKey,
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        console.warn(`[extract] Failed to fetch internal asset: ${res.status} - ${asset.title}`);
        return null;
      }
      bytes = new Uint8Array(await res.arrayBuffer());
    } else {
      // External URL - use proxy-download
      const proxyUrl = `${supabaseUrl}/functions/v1/proxy-download`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);

      const res = await fetch(proxyUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceKey}`,
          apikey: serviceKey,
        },
        body: JSON.stringify({ url: asset.url }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        console.warn(`[extract] Proxy download failed: ${res.status} - ${asset.title}`);
        return null;
      }
      bytes = new Uint8Array(await res.arrayBuffer());
    }

    if (bytes.length < 100) {
      console.warn(`[extract] File too small: ${bytes.length} bytes - ${asset.title}`);
      return null;
    }

    // Check if PDF
    const header = new TextDecoder("latin1").decode(bytes.slice(0, 5));
    if (header === '%PDF-') {
      const text = extractTextFromPdfBytes(bytes);
      return text.length > 20 ? text.substring(0, MAX_TEXT_PER_DOC) : null;
    }

    // Try as text
    try {
      const text = new TextDecoder("utf-8").decode(bytes);
      if (text.length > 20 && !text.includes('\0')) {
        return text.substring(0, MAX_TEXT_PER_DOC);
      }
    } catch {
      // Binary file, can't extract text
    }

    return null;
  } catch (err) {
    console.warn(`[extract] Error fetching ${asset.title}:`, err);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  try {
    let body: any = {};
    try {
      const rawText = await req.text();
      if (rawText && rawText.trim()) body = JSON.parse(rawText);
    } catch {
      // Empty body is OK
    }

    const { entityId, entityType, organizationId } = body;
    if (!entityId || !entityType || !organizationId) {
      return new Response(JSON.stringify({ error: "entityId, entityType, organizationId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const db = dbFetch(supabaseUrl, serviceKey);
    const tableName = entityType === 'brand' ? 'brands' : entityType === 'product' ? 'products' : 'events';

    // Fetch guide_data
    const entity = await db.selectSingle(tableName, `id=eq.${entityId}&select=name,guide_data`);
    if (!entity) {
      return new Response(JSON.stringify({ error: "Entity not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const entityName = entity.name || entityType;
    const guideData = entity.guide_data || {};

    // Collect all asset URLs
    const assets = collectAssets(guideData);
    console.log(`[extract] Found ${assets.length} assets for ${entityName} (${entityType})`);

    if (assets.length === 0) {
      return new Response(JSON.stringify({ success: true, processed: 0, message: "No assets found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check existing entries to skip unchanged docs
    const existingEntries = await db.select(
      'oracle_knowledge_base',
      `organization_id=eq.${organizationId}&source_type=eq.asset_extract&source_entity_id=eq.${entityId}&select=embedding_hash,title`
    );
    const existingHashes = new Set(existingEntries.map(e => e.embedding_hash).filter(Boolean));

    let processed = 0;
    let skipped = 0;

    // Process sequentially for memory safety
    for (const asset of assets) {
      const urlHash = simpleHash(asset.url);

      // Skip if already processed (same URL hash)
      if (existingHashes.has(urlHash)) {
        skipped++;
        continue;
      }

      console.log(`[extract] Processing: ${asset.title} (${asset.source})`);
      const content = await fetchDocumentContent(asset, supabaseUrl, serviceKey);

      if (!content) {
        console.log(`[extract] No extractable content: ${asset.title}`);
        continue;
      }

      // Upsert to knowledge base
      await db.upsert('oracle_knowledge_base', {
        organization_id: organizationId,
        title: `📎 ${asset.category}: ${asset.title}`,
        content: content,
        content_type: asset.url.toLowerCase().includes('.pdf') ? 'pdf' : 'text',
        source_type: 'asset_extract',
        category: 'digital_assets',
        source_entity_id: entityId,
        source_entity_type: entityType,
        tags: [entityType, entityName, asset.category, 'auto-extracted'],
        embedding_hash: urlHash,
        is_active: true,
      });

      processed++;
      console.log(`[extract] Persisted: ${asset.title} (${content.length} chars)`);
    }

    console.log(`[extract] Done: ${processed} processed, ${skipped} skipped for ${entityName}`);

    return new Response(JSON.stringify({ success: true, processed, skipped, total: assets.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[extract-asset-content] Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
