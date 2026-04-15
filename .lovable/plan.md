

# Authentic Photography & Imagery Strategy — Implementation Plan

## What We're Building

A comprehensive **Photography & Imagery Strategy** system that operationalizes the research recommendation into three concrete platform capabilities:

1. **Imagery Strategy Dashboard** — A new tab in the AI Center of Excellence that surfaces imagery health scores, inclusive prompting compliance, and Visual DNA insights across the portfolio
2. **Automated Imagery Audit** — An edge function that scores entities' approved imagery and visual direction sections against the inclusive prompting heuristics and Stop/Go framework already in `_shared/inclusive-language-patterns.ts`
3. **Brand-Level Strategy Enforcement** — Enriching the existing `ImageryGuidelinesPanel` with entity-specific scoring, actionable recommendations, and a compliance badge visible from the admin dashboard

## Architecture

```text
Imagery Strategy System
├── AI Center → Imagery tab           — Portfolio-wide imagery health dashboard
├── imagery-strategy-audit (edge fn)  — Scores imagery across entities using inclusive heuristics
├── ImageryGuidelinesPanel (enhanced) — Per-entity scoring + recommendations
└── Brand Intelligence (enriched)     — Imagery strategy scores feed into intelligence reports
```

## Detailed Steps

### 1. Create `imagery-strategy-audit` Edge Function
New edge function at `supabase/functions/imagery-strategy-audit/index.ts`:
- Accepts an entity ID + type, fetches approved imagery sections, Visual DNA, and guide_data imagery settings
- Uses the existing `INCLUSIVE_PROMPTING_HEURISTICS`, `IMAGERY_STOP_GO`, `IDENTITY_DIVERSITY_GUIDELINES` data from `_shared/inclusive-language-patterns.ts`
- Calls Lovable AI Gateway (gemini-2.5-flash) to score imagery across 6 dimensions: Diversity Representation, Authenticity, Cultural Context, Action Orientation, Inclusive Prompting Compliance, Stock Photo Dependency
- Returns structured scores + recommendations
- Persists results to a new `imagery_strategy_audits` table

### 2. Database Migration — `imagery_strategy_audits` Table
```sql
CREATE TABLE public.imagery_strategy_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL,
  entity_type TEXT NOT NULL DEFAULT 'brand',
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  overall_score NUMERIC DEFAULT 0,
  diversity_score NUMERIC DEFAULT 0,
  authenticity_score NUMERIC DEFAULT 0,
  cultural_context_score NUMERIC DEFAULT 0,
  action_orientation_score NUMERIC DEFAULT 0,
  inclusive_prompting_score NUMERIC DEFAULT 0,
  stock_dependency TEXT DEFAULT 'medium',
  stop_signals_detected JSONB DEFAULT '[]',
  go_signals_present JSONB DEFAULT '[]',
  recommendations JSONB DEFAULT '[]',
  images_analyzed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
-- RLS: org admins can read/write
```

### 3. Add "Imagery" Tab to AI Center of Excellence
Extend `AICenterOfExcellence.tsx` with a 6th tab — **Imagery Strategy**:
- Portfolio-wide imagery health scorecards (aggregated from `imagery_strategy_audits`)
- Per-entity imagery scores table with color-coded compliance badges
- Stop/Go signal frequency analysis across the portfolio
- "Run Audit" button to trigger the edge function for selected entities
- Visual DNA summary cards showing learned preferences vs. inclusive guidelines alignment

### 4. Enhance `ImageryGuidelinesPanel`
Upgrade the existing panel in `src/components/brand/imagery/ImageryGuidelinesPanel.tsx`:
- Accept entity-specific audit scores as props
- Show a compliance badge (score ring) at the top
- Display entity-specific stop signals detected and go signals present
- Add "Run Imagery Audit" button for admins
- Show AI-generated recommendations tailored to the entity's actual imagery

### 5. Create `useImageryStrategyAudit` Hook
New hook at `src/hooks/useImageryStrategyAudit.ts`:
- Fetches latest audit from `imagery_strategy_audits` for an entity
- Provides `runAudit()` function that invokes the edge function
- Returns scores, recommendations, and loading state
- Used by both the enhanced `ImageryGuidelinesPanel` and the AI Center Imagery tab

### 6. Wire Imagery Scores into Existing Systems
- **Brand Intelligence Worker**: Already has `inclusive_imagery` in its prompt — add imagery audit scores as additional context
- **Brand Health Score** (`BrandAnalyticsHub.tsx`): Currently gives imagery only 5/100 weight — increase to reflect strategy importance and pull actual audit scores
- **Insights Section**: Add imagery audit findings as insight items via the existing pattern
- **PDF Export**: Include imagery strategy scores in the AI Center PDF export

## Files Changed
| File | Action |
|------|--------|
| `supabase/functions/imagery-strategy-audit/index.ts` | **Create** — Audit edge function |
| `src/hooks/useImageryStrategyAudit.ts` | **Create** — Audit data hook |
| `src/components/admin/AICenterOfExcellence.tsx` | **Edit** — Add Imagery tab |
| `src/components/brand/imagery/ImageryGuidelinesPanel.tsx` | **Edit** — Add scoring + audit trigger |
| `src/hooks/useAICenterMetrics.ts` | **Edit** — Aggregate imagery audit data |
| `supabase/functions/brand-intelligence-worker/index.ts` | **Edit** — Feed imagery audit scores |
| Migration SQL | **Create** — `imagery_strategy_audits` table |

## Impact
- **Credibility**: Every entity gets a measurable imagery authenticity score
- **Enforcement**: Stop/Go signals are automatically detected, not just guidelines
- **Emotional connection**: Visual DNA preferences are aligned with inclusive heuristics
- **Actionable**: Specific recommendations per entity, tracked in the Innovation Pipeline

