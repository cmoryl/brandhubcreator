

# Ingest Digital Asset & PDF Content into Brand Intelligence

## Problem

The AI reporting pipeline currently has three gaps:
1. **Internal PDFs skipped entirely** — PDFs uploaded to cloud storage (brochures, collateral, presentations) are never read. Line 184 of the worker says "Skip document context entirely — the SDK import causes memory crashes."
2. **External asset limit too low** — Only 3 external documents are fetched, capped at 10KB each.
3. **Extracted content is ephemeral** — Even the external content that IS fetched is only used in the current AI prompt. It's never persisted to the Oracle Knowledge Base, so future analyses and the Brand Assistant can't reference it.

## Solution

Create a dedicated **asset content extraction pipeline** that runs as a separate background job, extracts text from all digital assets (internal + external), and persists the extracted knowledge into the `oracle_knowledge_base` table for reuse across all AI modules.

## Architecture

```text
Brand Intelligence Worker (existing)
  └─ triggers asset extraction job after main analysis

New: extract-asset-content (Edge Function)
  ├─ Reads guide_data for brochures, templates, presentations, collateral items
  ├─ For each item with a storage URL → fetch from Supabase Storage, extract text
  ├─ For each item with an external URL → fetch via proxy-download, extract text  
  ├─ Deduplicates by source_hash to avoid re-processing unchanged docs
  └─ Upserts extracted content into oracle_knowledge_base with source_type='asset_extract'
```

## Changes

### 1. New Edge Function: `extract-asset-content`
- Accepts `entityId`, `entityType`, `organizationId`
- Queries guide_data for all asset items with `fileUrl` or `externalUrl` fields across: `brochures`, `templates`, `presentationTemplates`, `caseStudies`, and any custom digital collateral categories
- For **internal storage URLs** (containing the Supabase storage domain): fetches the file directly using the service role key, then runs the regex-based `extractTextFromPdfBytes` (same approach already proven in the worker)
- For **external URLs**: uses `proxy-download` (already exists)
- Extracts text, truncates to 15KB per document
- Generates a content hash per document to skip re-processing on subsequent runs
- Upserts each document's content into `oracle_knowledge_base` with:
  - `source_type = 'asset_extract'`
  - `content_type = 'pdf'` or `'text'`
  - `tags = [entityType, entityName, assetCategory]`
  - Title format: `📎 [Category]: [Asset Title]`
- Processes up to **15 documents per run** to stay within memory limits
- Uses the lightweight `dbFetch` REST pattern (no SDK) to avoid memory crashes

### 2. Update `brand-intelligence-worker`
- After completing the main analysis, trigger `extract-asset-content` via `EdgeRuntime.waitUntil()` (fire-and-forget) so asset extraction runs in the background without blocking the main analysis
- Remove the "skip document context entirely" comment and instead reference the knowledge base entries created by the extractor

### 3. Update `get_entity_text_context` RPC
- Add a new field `internal_asset_urls` that extracts `fileUrl` values from `brochures`, `templates`, `presentationTemplates`, and `caseStudies` arrays in guide_data (just URLs and titles, not content)
- This gives the extraction function a lightweight list of what to fetch

### 4. Wire into existing AI consumers
- No changes needed — all AI modules (Oracle Brain, DataForce Assistant, Research Briefings, Competitive Analysis) already query `oracle_knowledge_base` for context. Once asset content is persisted there, it automatically becomes available to every AI feature.

### 5. Config
- Add `extract-asset-content` entry to `supabase/config.toml`

## Files to Create/Modify
- **Create**: `supabase/functions/extract-asset-content/index.ts`
- **Modify**: `supabase/functions/brand-intelligence-worker/index.ts` — add background trigger
- **Modify**: `get_entity_text_context` RPC (migration) — add `internal_asset_urls` field
- **Modify**: `supabase/config.toml` — add function entry

## Memory Safety
- Uses the same no-SDK, REST-only pattern as the existing worker
- Processes documents sequentially (not in parallel) to control memory
- Each PDF is processed and discarded before the next one loads
- 15KB text cap per document prevents prompt overflow

