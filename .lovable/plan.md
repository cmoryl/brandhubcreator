# Connect Underutilized Brand Data Across the Product

Five gaps, executed in priority order. Each is self-contained so we can ship incrementally.

## 1. Imagery preference signals → all generation surfaces

**Problem:** `imagery_preference_signals` + `imageryAvoidList` + `brand_imagery_embeddings` are captured but only the thumbs-down deletion writes to them. No generator reads them back.

**Build:**
- New shared helper `src/lib/imagerySignals.ts` → `buildAvoidClause(brandSlug)` that pulls the avoid list + recent negative signals and returns a prompt fragment ("Avoid: [styles]. Do not reproduce: [URLs as references]").
- Inject into: Creative Studio (`generate-brand-image` edge fn), Icon Studio (`generate-icon`), Social Asset gen, PDF cover gen, Layout Template gen.
- Add a small "Learning from N rejections" badge on each generator UI surface so users see the loop is active.

## 2. Canva audit findings → Creative Studio prompts

**Problem:** Audit identifies typos, casing inconsistencies, stale assets — but Creative Studio doesn't bias against them.

**Build:**
- Extend `get_entity_text_context` (already exists) to include `canva_audit_findings` (last analysis row's `findings` JSONB, top 5 by severity).
- Update Creative Studio prompt template to add a "Recent audit flagged:" constraints block.
- On every generation, if a finding matches the prompt subject (e.g., wordmark generation + casing finding), surface a one-line warning toast: "Audit flagged Brand Mark casing — using approved form."

## 3. Brand intelligence → DataForce compliance weighting

**Problem:** Compliance scoring uses generic criteria. Archetype/voice/industry should weight what counts as a violation.

**Build:**
- Update `dataforce-compliance` edge fn to read `brand_intelligence.brand_dna` (archetype, voice, industry) before scoring.
- Add weighting matrix: e.g., Caregiver archetype = +20% weight on inclusive language checks; Regulated industry (LifeSciences) = +30% weight on disclaimer presence.
- Surface "Weighted by: Caregiver archetype, Life Sciences industry" line under each compliance score in the UI.

## 4. Oracle KB → Brain panel citations

**Problem:** `oracle_knowledge_base` rows only surface through Oracle chat.

**Build:**
- New `OracleCitationsTile` in `BrandIntelligencePanel` showing top 5 most-relevant KB entries for the brand (filtered by `brand_id` or org-level).
- Each tile entry → click opens Oracle chat pre-seeded with that KB entry as context.
- Inject top 3 KB summaries into `brand-intelligence-worker` prompt so refreshed intelligence cites them.

## 5. Unified Action Center

**Problem:** `recommendation_actions` + `competitive_recommendation_actions` + `intelligence_alerts` are scattered across 3+ panels.

**Build:**
- New `src/components/brand/ActionCenter.tsx` — single tabbed panel (All / Compliance / Competitive / Audit / Alerts) with filters by severity, status (open/in-progress/done), and source.
- New hook `useUnifiedActions(brandId)` parallel-fetches all 3 tables, normalizes to a common `BrandAction` shape, sorts by priority.
- Add as the **first tile** in `BrandIntelligencePanel` (above CanvaOperationsTile).
- Bulk-mark-done, assign-to-user, snooze actions.
- Surface count badge in main brand editor sidebar nav ("Brain (7)").

## Technical Notes

- All edge function changes stay under 150MB by using `gemini-2.5-flash-lite` and lean prompts.
- New helper `imagerySignals.ts` is shared client+edge (duplicate file in `supabase/functions/_shared/` per current pattern).
- No schema changes needed for #1, #2, #4 — all existing tables.
- #3 needs a `compliance_weighting_rules` JSONB column on `dataforce_config` (small migration).
- #5 is pure UI + read-only hooks, no schema changes.

## Execution order

1. **#5 Unified Action Center** first — pure UI, makes existing data visible immediately, highest user-visible impact.
2. **#1 Imagery signals** — closes the feedback loop users explicitly built (avoid list).
3. **#4 Oracle citations** — small, makes Brain panel feel "alive".
4. **#2 Canva → Creative Studio** — requires edge fn + context fn changes.
5. **#3 Compliance weighting** — needs migration + scoring rewrite, most risk.

Estimated: ~20 files touched, 1 small migration, 0 destructive changes.
