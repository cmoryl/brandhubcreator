## BrandHub — AI Capabilities & Logic Audit

Scope: 107 edge functions, ~16 AI-related libs in `src/lib`, 7 hooks, ~17 brand AI components, plus DataForce + intelligence subsystems.

---

### 1. AI surface inventory (what we have)

**Skill (Claude) pipeline — most mature, recent build**
- `skill-qa` (3-tier judges + meta-judge), `skill-qa-scheduled`, `skill-autofix`, `skill-chat`, `skill-pdf-vision`, `skill-token-optimizer`, `skill-anthropic-push`
- Client: `skillQAClient`, `skillEnhanceClient`, `skillAutoImproveLoop`, `skillRegressionDetector`, `skillCoverageMap`, `skillSurfacePresets`, `exportClaudeSkill`, `ClaudeSkillExportButton`, `SkillReadinessBadge`, `SkillScoreHistoryChart`, `AutoImproveLoopPanel`

**Brand intelligence / research**
- `brand-intelligence` + `-worker`, `brand-research`, `brand-audit` + `-worker`, `bulk-intelligence`, `generate-intelligence-digest`, `scheduled-intelligence`, `scheduled-research-trigger`, `import-brand-report`, `market-analysis`, `oracle-brain`

**Competitive intel**
- `competitive-analysis` + `-worker`, `discover-competitors` + `-worker`, `discover-videos`, `discover-webinars`

**DataForce**
- `dataforce-compliance`, `dataforce-assistant`, `dataforce-validation`, `dataforce-training`

**Creative / generation**
- Booth: `booth-ai-generator`, `booth-3d-ai-mapper`, `booth-analysis`, `booth-color-analysis`, `booth-palette-analyzer`, `booth-sales-deck`, `booth-score`, `booth-crowd-simulation`, `generate-booth-template`, `generate-signage-preview`
- Imagery: `generate-creative-asset`, `generate-pillar-image`, `generate-shape`, `generate-character-sprite`, `generate-client-logo`, `imagery-ai-suggestions`, `imagery-auto-categorize`, `imagery-quality-score`, `imagery-strategy-audit`, `imagery-style-analyzer`, `imagery-visual-search`, `shutterstock-*`, `dropbox-imagery`
- Icons: `generate-icon`, `-set`, `-colors`, `-visual`, `stylize-icon`, `suggest-icons`
- Color/gradient: `generate-color-combinations`, `generate-gradients`, `color-lab-analysis`
- Misc: `ad-localizer`, `generate-sub-services`, `seed-zone-copy`, `enrich-demo-content`, `enrich-demos-orchestrator`, `analyze-social-asset`, `social-metrics-fetch/-scan`, `bias-awareness-scan`, `brand-visibility-audit`, `extract-brand-materials`, `extract-asset-content/images`, `parse-pdf`, `parse-presentation`, `scan-website-images`, `website-analysis`, `help-agent`, `portfolio-insights-extractor`, `generate-portfolio-relationships`

**GlobalLink / localization**
- `globallink-translate`, `-cultural-adapt`, `-connect-workflow`

---

### 2. Findings — by severity

#### HIGH — Auth gaps on AI endpoints
- **36 of ~73 AI-using edge functions do NOT call `auth.getUser()`** despite the project rule "AI-driven edge functions require manual JWT verification + `can_use_ai_features` RPC".
- Only 19 functions call `can_use_ai_features` — meaning ~50+ AI endpoints have no role/credit gating.
- High-risk unauthenticated AI endpoints (anyone with the anon key can burn credits):
  `skill-qa`, `skill-chat`, `skill-autofix`, `skill-token-optimizer`, `skill-pdf-vision`, `brand-intelligence-worker`, `brand-audit-worker`, `competitive-analysis-worker`, `discover-competitors-worker`, `booth-ai-generator`, `booth-3d-ai-mapper`, `booth-analysis`, `generate-icon-set`, `generate-intelligence-digest`, `enrich-demo-content`, `portfolio-insights-extractor`, `imagery-quality-score`, `seed-zone-copy`, `shutterstock-ai-suggest`, plus 17 more.
- All have `verify_jwt = false` in `config.toml` (per house style) but lack the in-code replacement.

#### HIGH — Inconsistent model selection
Distribution across functions:
- `google/gemini-3-flash-preview` — 38 calls (default, good)
- `google/gemini-3.1-flash-lite-preview` — 34 (good for cheap workloads)
- `gemini-2.5-flash-image` — 7, `gemini-3-pro-image-preview` — 4, `gemini-3.1-flash-image-preview` — 3 (image gen split 3 ways with no policy)
- `gemini-3.1-pro-preview` — 5 (heavy reasoning — fine)
- `openai/gpt-5` — 2, `openai/gpt-5.2` — 1, plus a typo `openai/gpt-5.2.` (period — likely a bug producing 4xx)

Issues:
- Project rule says "default `gemini-2.5-flash-lite`, `gemini-2.5-pro` only for complex" — actual code uses 3.x preview models everywhere. Either rule or code is stale; pick one.
- One typo'd model id will fail at runtime; needs to be located and fixed.
- No central model registry — each function hardcodes its model. A `_shared/models.ts` map (purpose → model) would let us change tiers globally.

#### MEDIUM — No shared AI gateway helper
- 73+ functions each hand-roll the fetch to `ai.gateway.lovable.dev`. No `_shared/aiGateway.ts` with retry, 429/402 handling, timeout, and logging.
- 63 functions handle 429/402 inline → 10+ AI functions silently swallow rate-limit/credit errors.
- Recommendation: extract `callLovableAI()`, `streamLovableAI()`, and `generateImage()` helpers; migrate functions incrementally.

#### MEDIUM — Worker pattern duplicated, not abstracted
Async background-job pattern (orchestrator + worker + jobs table) is reimplemented for: brand-intelligence, brand-audit, competitive-analysis, discover-competitors, plus newer scheduled flows.
- Each pair has its own polling hook, status enum, and merge logic. A shared `aiJobs` helper + generic `useAiJob(jobType, id)` hook would remove ~1k lines.

#### MEDIUM — Skill pipeline has no usage telemetry
- We have `SkillScoreHistoryChart`, `SkillRegressionAlert`, `AutoImproveLoopPanel`, but no record of which surface variants (`-social`, `-deck`, `-rfp`) are actually being exported / pushed to Anthropic / used. `skill-anthropic-push` succeeds silently; no `skill_push_history` write is wired to the export button consistently.
- `SkillPushHistoryPanel` exists but isn't surfaced everywhere a push can happen.

#### MEDIUM — Prompts scattered
- Prompts live inline in 70+ edge functions and in `skillIndustryPrompts.ts`, `brandPhotographyStarters.ts`, `templateZoneDefaults.ts`, `layoutTemplateDemoCopy.ts`, plus the `useSavedPrompts` table.
- No single registry → impossible to A/B test, version, or audit for compliance.

#### LOW — Bot/agent fragmentation
- `BrandAgentWidget`, `dataforce-assistant`, `help-agent`, `oracle-brain`, `skill-chat`, `AssistantOrb` are five chat surfaces with overlapping config (`bot_config` table), each loaded slightly differently.
- Could be unified behind one `<AIChat agentType=… entityId=…>` component + one routing edge function.

#### LOW — `skill-qa-scheduled` shows only boot/shutdown in last 24h logs
- Confirms the scheduler is invoked but there's no visible success/error log. Add structured log lines (run_id, brandId, minScore, durationMs).

#### LOW — Type/runtime safety
- `AIBoothResult` and similar AI-shaped responses are typed by hand and trusted directly. No `zod` parse on AI outputs in most functions; one malformed JSON crashes the worker.

#### LOW — No cost / latency dashboard
- We have `useAICenterMetrics` but it tracks counts, not tokens or USD. With 73 AI endpoints this is the next obvious instrument.

---

### 3. Recommended remediation order

1. **Security pass (1–2 days)** — add `auth.getUser()` + `can_use_ai_features` to the 36 unauthenticated AI functions. Decide which (if any) must remain public (e.g. `get-shared-brand`).
2. **Fix the `openai/gpt-5.2.` typo** — grep + patch.
3. **Create `_shared/aiGateway.ts`** — wrap fetch, enforce 429/402 toasts, add timeout + structured logging. Migrate 5 highest-traffic functions first.
4. **Create `_shared/models.ts`** — purpose-keyed registry (`MODELS.fastChat`, `MODELS.deepReason`, `MODELS.imageFast`, `MODELS.imagePremium`). Replace hardcoded ids.
5. **Add `zod` validation** on AI JSON outputs in worker functions (intelligence, competitive, booth-generator).
6. **Unify async-job pattern** into `_shared/aiJob.ts` + `useAiJob` hook.
7. **Telemetry** — add `ai_call_log` table (function, model, latency_ms, prompt_tokens, completion_tokens, status). Wire from the new gateway helper. Surface in admin AI Center.
8. **Skill push history** — make `SkillPushHistoryPanel` a first-class tab and ensure every export/push writes a row.
9. **Unify chat surfaces** behind a single `<AIChat>` + routing function (long term).
10. **Prompt registry** — move static prompts to a versioned `ai_prompts` table; keep saved/user prompts where they are.

---

### 4. What I'd build next (concrete)

If you approve this audit, the highest-leverage single PR is:
- `supabase/functions/_shared/aiGateway.ts` + `_shared/models.ts` + `_shared/requireAiAccess.ts` (auth + RPC).
- Migrate the 7 `skill-*` functions to use them (already the most active pipeline).
- Add `ai_call_log` table + admin "AI Activity" panel.

That single PR closes the HIGH-severity auth gap on the skill pipeline, eliminates the model-id typo class of bugs, and gives us the telemetry needed to make further tier choices data-driven.
