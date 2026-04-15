

# AI Center of Excellence — Implementation Plan

## What We're Building

A dedicated **AI Center of Excellence** tab in the Admin Dashboard that centralizes all AI-related governance, quality standards, ethics guidelines, and performance tracking into one unified hub. Currently, AI features are scattered across Intelligence Hub, DataForce, Bias Awareness, Bot Manager, and individual entity panels. This consolidation gives admins a single place to manage AI quality, ethics, and efficiency.

## Architecture

The AI Center of Excellence will be a new admin tab with sub-tabs:

```text
AI Center of Excellence
├── Overview Dashboard        — Unified AI health metrics, usage stats, quality scores
├── Governance & Ethics       — AI ethics policies, bias thresholds, compliance rules
├── Quality Standards         — Model performance tracking, output quality scoring, calibration
├── Resource Allocation       — AI usage across entities, cost/credit monitoring, rate limit status
└── Innovation Pipeline       — Strategic AI recommendations, capability roadmap, experiment tracking
```

## Detailed Steps

### 1. Create `AICenterOfExcellence.tsx` component (~400 lines)
New component at `src/components/admin/AICenterOfExcellence.tsx` with 5 sub-tabs:

- **Overview Dashboard**: Aggregates AI metrics from existing sources — pulls from `brand_intelligence_jobs`, `dataforce_compliance_jobs`, `bias_awareness_scans`, `bot_conversations`, `brand_visibility_audits`. Shows unified scorecards (AI Quality Score, Ethics Compliance %, Resource Efficiency, Innovation Index).

- **Governance & Ethics**: Centralizes bias awareness thresholds, DataForce compliance rules, and cultural validation settings into one editable panel. Shows policy status cards and ethics compliance trends.

- **Quality Standards**: Displays AI calibration data (from existing `AICalibrationPanel`), model output confidence history, and feedback scores. Tracks quality across all AI services.

- **Resource Allocation**: Shows AI usage distribution across brands/products/events, tracks job counts, success/failure rates, and surfaces rate limit or credit warnings.

- **Innovation Pipeline**: Renders Oracle Brain strategic recommendations with actionable tracking — admins can mark recommendations as "In Progress", "Completed", or "Deferred". Persisted to a new DB column or JSONB field.

### 2. Create `useAICenterMetrics.ts` hook
New hook at `src/hooks/useAICenterMetrics.ts` that fetches and aggregates data from:
- `brand_intelligence_jobs` (job counts, success rates)
- `dataforce_compliance_jobs` (compliance scores)
- `bias_awareness_scans` (inclusion/ethics scores)
- `bot_conversations` (satisfaction ratings)
- `brand_visibility_audits` (visibility scores)
- `oracle_intelligence` (strategic recommendations)

Returns unified metrics object for the dashboard.

### 3. Database Migration — Recommendation Tracking
Add a `recommendation_actions` table to track admin responses to strategic recommendations:

```sql
CREATE TABLE public.recommendation_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  recommendation_key TEXT NOT NULL,
  recommendation_text TEXT NOT NULL,
  source TEXT DEFAULT 'oracle',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','deferred')),
  assigned_to UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.recommendation_actions ENABLE ROW LEVEL SECURITY;
-- RLS: org members can read, org admins can write
```

### 4. Wire into Admin Dashboard
- Add "AI Center" nav item to `AdminSidebar.tsx` in the 'analytics' group with a `Cpu` or `GraduationCap` icon
- Add corresponding `TabsContent` in `AdminDashboard.tsx`
- Add summary widget to `AdminOverview.tsx` linking to the new tab

### 5. Cross-link from existing panels
- Oracle Brain strategic recommendations will link to the Innovation Pipeline for action tracking
- DataForce and Bias Awareness panels get "View in AI Center" quick links

## Files Changed
| File | Action |
|------|--------|
| `src/components/admin/AICenterOfExcellence.tsx` | **Create** — Main hub component |
| `src/hooks/useAICenterMetrics.ts` | **Create** — Aggregated metrics hook |
| `src/components/admin/AdminSidebar.tsx` | **Edit** — Add nav item |
| `src/pages/AdminDashboard.tsx` | **Edit** — Add tab content |
| `src/components/admin/AdminOverview.tsx` | **Edit** — Add summary widget |
| Migration SQL | **Create** — `recommendation_actions` table |

## What This Achieves
- **Consistent quality**: Unified quality scoring across all AI services
- **Reduced redundancy**: Single governance view instead of checking 4+ separate tabs
- **Ethical AI**: Centralized ethics policies with compliance tracking
- **Accelerated innovation**: Actionable recommendation pipeline with status tracking
- **Better resource allocation**: AI usage visibility across the entire portfolio

