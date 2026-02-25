

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

## 5. ✅ Intelligence Confidence Calibration Dashboard — COMPLETED

**Implemented:**
- `AICalibrationPanel.tsx` component integrated as "AI Calibration" tab in Oracle Brain panel
- Aggregates `confidence_history`, `insight_actions`, and `decay_config` from all `brand_intelligence` rows in the org
- **Metrics**: AI Accuracy rate, approved/rejected insight counts, average feedback score
- **Confidence Trends**: Recharts LineChart showing average confidence scores over time
- **Decay Configuration**: Interactive sliders for half-life (7-90 days) and confidence threshold (20-95%), with live AreaChart preview of the decay curve
- **Entity Breakdown**: Scrollable list showing per-entity analysis counts, feedback scores, and approval rates
- Save button persists decay_config to all brand_intelligence rows in the organization

---

## Priority Recommendation

| Step | Impact | Effort | Recommendation |
|------|--------|--------|---------------|
| 1. Scheduled Automation | High | Medium | ✅ DONE |
| 2. Digest Panel | High | Medium | ✅ DONE |
| 3. Relationship Graph | Medium | High | ✅ DONE |
| 4. Assistant Memory | Medium | Medium | ✅ DONE |
| 5. Calibration Dashboard | Low | Low | ✅ DONE |

All 5 steps are now complete. The intelligence pipeline is fully operational with automated scheduling, executive digests, relationship mapping, conversational memory, and calibration controls.

Steps 1 and 2 together create a "set it and forget it" intelligence pipeline that keeps the brain active without manual intervention. Step 4 makes the assistant smarter over time. Steps 3 and 5 add visibility and differentiation.
