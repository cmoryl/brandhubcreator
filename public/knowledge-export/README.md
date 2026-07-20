# BrandHub → Presentation Power System — Knowledge Bundle

Self-contained export of BrandHub's full brand universe + Oracle knowledge for
seeding an independent project. **Not connected** to the source — one-way snapshot.

## What's here

- `database-seed.json` — full DB dump (see structure below)
- Static knowledge lives at `public/knowledge/**` (markdown + VTT voiceover captions)

## database-seed.json structure

```json
{
  "exported_at": "ISO timestamp",
  "oracle_intelligence":   [ /* 1 row — org-level synthesis */ ],
  "oracle_knowledge_base": [ /* 30 rows — title, content, content_type, tags */ ],
  "brand_intelligence":    [ /* 40 rows — per-entity AI summaries + knowledge entries */ ],
  "brands":                [ /*  6 rows — full brand guides incl. guide_data JSONB */ ],
  "products":              [ /* 21 rows — full product guides incl. guide_data JSONB */ ],
  "events":                [ /* 16 rows — full event guides incl. guide_data JSONB */ ]
}
```

The `brands`, `products`, and `events` arrays contain the complete `guide_data`
JSONB for every division (Games, Legal, Life Sciences, Media, GlobalLink,
DataForce, Finance, Digital, Learn, Experience, C3 Summit, etc.) — hero copy,
tagline, identity/mission, values, colors, typography, imagery references,
case studies, brochures metadata, statistics, insights, sections, and every
other field the editor stores.

## Uploaded files (PDFs, brochures, images)

`guide_data` references uploaded assets by URL (Supabase Storage public URLs
in the source project). Two options:

1. **Reference-only** — keep the URLs as-is; the new project reads them
   directly from BrandHub's public buckets. Simplest, but couples the two
   projects at the storage layer.
2. **Rehost** — download each URL, re-upload to the new project's storage,
   and rewrite the URLs inside `guide_data`. Fully independent but requires
   a one-off migration script.

## Seeding steps (new project)

1. Create matching tables. Minimum for the KB import UI:
   `oracle_intelligence`, `oracle_knowledge_base`, `brand_intelligence`.
   For full brand context also create `brands`, `products`, `events` with
   `guide_data jsonb` and the id/name/slug/org columns you see in each row.
   Enable RLS + GRANTs per the new project's auth model.
2. Paste the seed JSON into the import UI (or bulk insert via edge function).
   Regenerate UUIDs only if collisions exist.
3. Port `useOracleBrain.ts` and `KnowledgeBase.tsx` from BrandHub; stub the
   `oracle-brain` edge function to read-only until you rebuild synthesis.
4. Copy `public/knowledge/**` verbatim.

## Independence guarantee

No Supabase URLs or keys in this bundle. The new project runs on its own
backend; this is dumb data + reference code.
