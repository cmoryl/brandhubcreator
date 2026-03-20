

# Per-Brand AI Agent: Config + Widget

## What We're Building

Each brand gets its own dedicated AI agent with customizable configuration (system prompt, personality, model) managed from the admin panel, plus a brand-specific chat widget embedded on each brand's page that automatically loads that brand's context.

## Architecture

```text
┌─────────────────────────┐     ┌──────────────────────┐
│  Bot Management Panel   │     │  Brand Page (e.g.    │
│  (Admin)                │     │  /brand/games)       │
│                         │     │                      │
│  ┌─ Help Agent ───────┐ │     │  ┌────────────────┐  │
│  ├─ Brand Assistant ──┤ │     │  │ BrandAgentChat │  │
│  ├─ Games Agent ──────┤ │     │  │ (widget)       │  │
│  ├─ Legal Agent ──────┤ │     │  │ Uses brand's   │  │
│  └─ Media Agent ──────┘ │     │  │ bot_config     │  │
│                         │     │  └────────────────┘  │
│  Each with own prompt,  │     │                      │
│  model, personality     │     │                      │
└─────────────────────────┘     └──────────────────────┘
```

## Plan

### 1. Extend `bot_config` table with brand linking
- Add `brand_id` UUID column (nullable, FK to brands) to `bot_config`
- Add `bot_type` value `'brand_agent'` support
- This lets each brand have its own independent agent config

### 2. Update Bot Management Panel to support per-brand agents
- Add a third bot type selector: "Brand Agents" alongside Help Agent and Brand Assistant
- When selected, show a brand picker dropdown listing all org brands
- Each brand loads/saves its own `bot_config` row with `bot_type = 'brand_agent'` and `brand_id` set
- Reuse existing Settings/Conversations/Analytics tabs per brand agent
- "Create Agent" button for brands that don't have one yet (pre-populates with brand name, colors, identity from `guide_data`)

### 3. Update `dataforce-assistant` edge function to use per-brand config
- When a request includes `entity_type = 'brand'` and `entity_id`, fetch matching `bot_config` row where `brand_id = entity_id` and `bot_type = 'brand_agent'`
- If found, use its `system_prompt`, `model`, `temperature`, `max_tokens`, and `response_style` instead of defaults
- Fall back to the generic `brand_assistant` config or hardcoded defaults if no brand-specific config exists

### 4. Create `BrandAgentWidget` component for brand pages
- Floating chat widget (similar to `HelpAgentChat` but brand-aware)
- Auto-loads the brand's agent config (welcome message, suggested questions, display name)
- Passes `entity_type: 'brand'` and `entity_id` to `dataforce-assistant`
- Styled with the brand's primary color from `guide_data`
- Shows the brand-specific agent name (e.g., "Games Assistant")
- Placed on brand detail pages alongside existing content

### 5. Wire widget into brand page layout
- Import and render `BrandAgentWidget` on the brand detail view, passing brand ID and slug
- Widget only appears if a brand agent config exists and `is_active = true`

## Technical Details

**Database migration:**
```sql
ALTER TABLE bot_config ADD COLUMN brand_id UUID REFERENCES brands(id) ON DELETE CASCADE;
CREATE UNIQUE INDEX idx_bot_config_brand ON bot_config(brand_id) WHERE brand_id IS NOT NULL;
```

**Edge function config lookup** (added to `dataforce-assistant`):
- Query `bot_config` with `brand_id` match before building system prompt
- Merge custom prompt as prefix to the existing context-enrichment pipeline

**Widget auto-theming**: Reads brand's primary color from `guide_data.colors[0].hex` and applies it to the chat header and send button.

