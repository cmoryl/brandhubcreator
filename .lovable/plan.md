

# Next Steps for the Brain of the Application

The intelligence layer is already robust -- Oracle Brain, Brand Intelligence Workers, DataForce services, Portfolio Insights, Health Snapshots, and deep inclusive design analysis are all operational. Here are the highest-impact next steps, ordered by strategic value.

---

## 1. ✅ Scheduled Intelligence Automation (Cron Jobs) — COMPLETED

**Implemented:**
- `intelligence_alerts` table with RLS policies (org member view, org admin CRUD)
- `scheduled-intelligence` Edge Function that orchestrates Oracle synthesis, health snapshots, portfolio insights, and generates alerts for significant score drops (≥5pt)
- `IntelligenceAlertsWidget` component integrated into Oracle Brain panel with acknowledge/dismiss/run-now actions
- `useIntelligenceAlerts` hook for managing alert state
- Monthly cron job (1st of each month at 9 AM) via pg_cron + pg_net
- Score drop severity levels: ≥15pt = critical, ≥10pt = warning, ≥5pt = info
- Config entry in `supabase/config.toml`

---

## 2. Intelligence Digest / Executive Summary Email

**Problem:** Insights are buried in the admin panel. Stakeholders who don't log in regularly miss critical intelligence.

**Solution:** A `send-intelligence-digest` Edge Function that compiles the latest Oracle summary, health deltas, new portfolio insights, and compliance score changes into a formatted email digest sent to org admins.

**Technical approach:**
- New Edge Function using Lovable AI to generate a natural-language executive summary from the latest oracle_intelligence, health_snapshots, and portfolio_insights
- Leverage the existing `intelligence_alerts` from Step 1 as content source
- Configurable frequency per organization (stored in org settings)

---

## 3. Cross-Entity Intelligence Graph (Relationship Mapping)

**Problem:** Entity brains operate mostly independently. The Oracle synthesizes them into a flat summary, but there's no structured mapping of *how* brands, products, and events relate to each other strategically.

**Solution:** Add a `portfolio_relationships` table and a visual relationship graph in the Oracle Brain panel showing:
- Brand-to-product inheritance strength
- Event-to-brand alignment scores
- Cross-entity voice consistency scores
- Audience overlap percentages

**Technical approach:**
- New DB table: `portfolio_relationships` (source_entity_id, target_entity_id, relationship_type, strength_score, metadata JSONB)
- Oracle synthesis extended to populate relationship data
- New `IntelligenceGraph` component using the existing Three.js/React Three Fiber dependency for an interactive 3D network visualization (or a simpler 2D force-directed graph)

---

## 4. ✅ Conversational Intelligence Memory (Assistant Context Window) — COMPLETED

**Implemented:**
- `assistant_memory` table with RLS policies (org member view, org admin CRUD)
- Indexes on organization_id, entity_id+entity_type, and GIN on topics array
- Edge function `dataforce-assistant` updated to:
  - Fetch relevant `assistant_memory` entries (entity-specific + org-wide) in parallel with other queries
  - Inject institutional memory into system prompt as context
  - Background task summarizes conversations every 10 messages using `gemini-2.5-flash-lite`
  - Summaries include key decisions and topic keywords for future retrieval
- Cumulative learning: memory entries persist across conversations and users

---

## 5. Intelligence Confidence Calibration Dashboard

**Problem:** The learning architecture (confidence_history, semantic_hashes, decay_config) exists in the data model but has no admin-facing visibility or tuning controls.

**Solution:** Add an "AI Calibration" tab to the Oracle Brain panel showing:
- Confidence trends over time (are insights getting more accurate?)
- Feedback loop metrics (how many insights were approved vs rejected)
- Decay curve visualization (how old insights are being weighted)
- Calibration controls for decay half-life and confidence thresholds

**Technical approach:**
- New component: `AICalibrationPanel.tsx` in the Oracle Brain section
- Recharts line/area charts for confidence trends
- Admin controls to adjust `decay_config` parameters
- Read from existing `brand_intelligence` JSONB fields (confidence_history, insight_actions)

---

## Priority Recommendation

| Step | Impact | Effort | Recommendation |
|------|--------|--------|---------------|
| 1. Scheduled Automation | High | Medium | ✅ DONE |
| 2. Digest Panel | High | Medium | ✅ DONE |
| 3. Relationship Graph | Medium | High | ✅ DONE |
| 4. Assistant Memory | Medium | Medium | ✅ DONE |
| 5. Calibration Dashboard | Low | Low | Quick win for admin visibility |

Steps 1 and 2 together create a "set it and forget it" intelligence pipeline that keeps the brain active without manual intervention. Step 4 makes the assistant smarter over time. Steps 3 and 5 add visibility and differentiation.
