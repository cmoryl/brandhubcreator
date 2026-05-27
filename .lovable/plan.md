## Goal
Now that the Iconography Brain knowledge module is loaded into 5 edge functions, push it further so it measurably improves what the studio ships — not just what the model "knows."

## Where the brain is wired today
- `generate-icon-set`, `generate-icon`, `suggest-icons`, `icon-semantic-search`, `stylize-icon`
- Surfaced in Settings as "Iconography Brain — Active" with a reference viewer

## Proposed upgrades

### 1. Make the brain steer QA, not just generation
Today QA is a single 0–100 IQS score + a slider in Settings. Use the brain's principles to break that into the rubric every classic icon system actually uses:
- **Grid integrity** (24×24, snap to half-pixel)
- **Stroke consistency** (single weight across set, matches DNA lock)
- **Optical balance** (counter sizes, terminal alignment)
- **Squint test** (renders at 16px)
- **Metaphor clarity** (Panofsky pre-iconographic read)
- **Cultural neutrality** (flags handshake/OK/etc. for review)

Show these as 6 sub-scores on each icon in Library + QA views. Block export when any sub-score < threshold.

### 2. Brand DNA inherits the brain's axes
Extend DNA Lock fields to include the modern variable-font axes the brain documents: `FILL`, `wght`, `GRAD`, `opsz`, `style family`. Generation + stylize already receive the prompt — also write these into the request body so the model has structured constraints, not just prose.

### 3. Auto-tagging on import / generation
Run a lightweight classification pass (Lovable AI, `gemini-2.5-flash-lite`) using the brain summary to tag every icon with:
- Style family (line / filled / duotone / glyph)
- Metaphor category (object, action, status, brand)
- Cultural-sensitivity flag

Stored on the icon JSONB. Powers better search, filtering, and the "long brand-glyph mis-classified as stroke" class of bugs we just fixed.

### 4. Semantic search re-ranking
`icon-semantic-search` currently expands tokens. Add a second pass that re-ranks the client-side intersection results using the brain (concept → best-matching metaphor) so "growth" prefers `sprout`/`trend-up` over `bar-chart-3`.

### 5. Stylizer guardrails
Use the brain's "≤2KB, single path family, no pixel tracing" rules as a hard post-process: reject the model's SVG and retry once if it violates them. Today it accepts whatever comes back.

### 6. Iconography Brain panel — make it actionable
Right now Settings only views the reference. Add:
- Toggle per-area (generation / suggest / search / stylize / QA) so power users can A/B the brain on or off
- "Brain version" badge so we can iterate the summary without guessing what shipped
- Inline citations: when an icon is rejected by QA, show which brain principle triggered it

### 7. Optional: ingest more references
The current summary is one PDF. Allow uploading additional reference docs (Material guidelines, SF Symbols notes, brand-specific style guides) into a small `iconography_knowledge` table; concatenate the active ones into the prompt with a token budget guard.

## Recommended sequencing
1. **Sub-scored QA + inline citations** — highest visible quality lift
2. **Auto-tagging on import** — fixes a real bug class and improves search
3. **Stylizer guardrails** — cheap, prevents bad SVGs from entering the library
4. **DNA axes + structured constraints** — deeper, touches generation request shape
5. **Search re-rank, per-area toggles, multi-doc ingestion** — polish

## Technical notes
- All work stays inside existing edge functions + Icon Studio UI; no schema migration needed for items 1, 3, 5, 6. Items 2, 4, 7 add columns/tables.
- Keep the brain summary capped (~2KB today) — any expansion should move to a retrieval step rather than growing every prompt.
- Use `gemini-2.5-flash-lite` for tagging/QA classification to stay under the 150MB edge function limit.

## Decision needed
Want me to start with **#1 (sub-scored QA + citations)** as the first concrete build, or pick a different entry point from the list?