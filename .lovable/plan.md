
# Research Briefings — Continuous Knowledge Intake Expansion

## 1. Briefing-to-Knowledge Pipeline
**Goal**: Every completed research briefing automatically extracts key facts and persists them into the Oracle Knowledge Base.

**Changes**:
- **Modify** `brand-research-worker` edge function to add a post-completion step that extracts key findings, market insights, and strategic recommendations from the briefing result
- Insert extracted knowledge entries into `oracle_knowledge_base` with `source_type = 'research_briefing'` and a reference to the briefing job ID
- Deduplicates against existing entries using semantic hashing (same pattern as brand intelligence)
- UI: Show a "Knowledge captured" badge on completed briefings in the Research Briefings panel

## 2. External Source Ingestion
**Goal**: Pull in industry news, competitor updates, or user-provided URLs as research inputs.

**Changes**:
- **Add** an "External Sources" input area to the Research Briefings panel — users can paste URLs or RSS feed links
- **Create** `research_external_sources` table to persist saved sources per entity (url, title, source_type: 'url'|'rss', last_fetched_at)
- **Modify** `brand-research` edge function to fetch and include content from saved external sources when generating briefings (uses existing download-proxy pattern for URL content extraction)
- Fetched content is summarized and injected into the research prompt context (capped at 10KB per source, max 5 sources)

## 3. Cross-Entity Research Synthesis
**Goal**: When a briefing runs for one brand, automatically surface relevant findings for sibling products/events.

**Changes**:
- **Modify** `brand-research-worker` to query sibling entity briefings (same org) and include a "Cross-Portfolio Relevance" section in the output
- Worker fetches the 3 most recent briefings from sibling entities and injects summaries into the prompt
- Output includes a `cross_entity_insights` JSON field identifying which findings apply to other entities
- UI: Add a "Cross-Portfolio Insights" expandable section to the briefing result card

## 4. Auto-Schedule Recurring Briefings
**Goal**: Briefings can run on a cadence without manual triggers.

**Changes**:
- **Add** `research_schedules` table: entity_id, entity_type, organization_id, cadence ('weekly'|'biweekly'|'monthly'), next_run_at, is_active, created_by
- **Create** `scheduled-research-trigger` edge function — lightweight cron handler that queries due schedules and fires `brand-research` for each
- **Add** cron job via pg_cron to invoke the trigger function daily at 9 AM UTC
- UI: Add a "Schedule" toggle/dropdown in the Research Briefings panel header allowing admins to set cadence per entity

## Implementation Order
1. Briefing-to-Knowledge Pipeline (foundation — makes all future briefings accumulate)
2. External Source Ingestion (enriches input quality)
3. Cross-Entity Synthesis (leverages accumulated knowledge)
4. Auto-Schedule (automates everything)

## Files to modify/create
- `supabase/functions/brand-research-worker/index.ts` — add knowledge extraction + cross-entity context
- `supabase/functions/scheduled-research-trigger/index.ts` — new cron handler
- Migration: `research_external_sources` + `research_schedules` tables with RLS
- `src/components/admin/research/ResearchBriefingsPanel.tsx` — schedule UI + external sources + cross-entity display
- `src/hooks/useResearchBriefings.ts` — add schedule management + external sources CRUD
