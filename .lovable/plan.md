# Social Assets & Guidelines — Rebuild

Piloted on the TransPerfect NEXT brand + sub-event pages. Once approved, we roll the same pattern to other brands.

## The problem today

Templates, guidelines, sizing rules, and platform assets are all stacked into one long scrolling wall. It's hard to tell what platform an asset belongs to, what's a template vs. a finished creation, and where the rules live. There's no live link to where designs actually get made (Canva).

## New structure

Three clearly separated zones, in this order:

**1. Social Playbook (top)**
The always-visible brand social identity — read-only reference.
- Voice & tone (short, punchy, TP NEXT-specific)
- Hashtag system (event, sub-event, campaign)
- Imagery rules (orb aesthetic, no text on hero shots, safe zones)
- Do / Don't gallery (small paired thumbnails)
- Response & moderation guidelines
- Platform sizing table (cover, post, story, reel, square) as one compact reference

**2. Platform-first tabs (middle)**
Horizontal tabs: LinkedIn · Instagram · X · YouTube · TikTok · Facebook.
Each tab shows only that platform's content, in three rows:
- Row A — **Live Templates (Canva-connected)**: cards pulled from a linked Canva folder, auto-branded with the current event's logo + location. "Open in Canva" and "Duplicate for this event" actions.
- Row B — **Published creations**: finished, approved assets ready to download/share.
- Row C — **Specs strip**: dimensions, safe zones, file types for that platform only (so specs live where they're used, not in a separate rules dump).

**3. Asset Library (bottom, collapsed by default)**
The full raw asset dump for power users — filterable by platform, format, campaign. No cards, just a dense searchable table.

## Canva integration

- Add a `canva_folder_id` field on the event (and per sub-event) so each event points to its own Canva template folder.
- New edge function `canva-templates-sync` calls the Canva Connect API to list templates in that folder, caches to a new `canva_templates` table (thumbnail, template_id, name, updated_at, platform tag).
- On the frontend, the "Live Templates" row reads from cache and refreshes on demand via a "Sync from Canva" button (admin only).
- Each card injects the sub-event's logo + location as Canva autofill variables when the user clicks "Duplicate for this event", so the opened Canva design already has the right branding baked in.
- Canva OAuth tokens already exist in `canva_oauth_tokens` — reuse that connection.

## Component work

Refactor `SocialAssetsSection` (or equivalent) into:
- `SocialPlaybookHeader.tsx` — the playbook zone
- `SocialPlatformTabs.tsx` — the tabbed platform view
- `SocialPlatformPanel.tsx` — one platform's three rows
- `CanvaTemplateCard.tsx` — live template card with sync/duplicate actions
- `SocialAssetLibrary.tsx` — collapsed raw table

Data still comes from `guide_data.socialAssets`; we're regrouping by `platform` on the client and layering the Canva rows on top.

## Scope for this pass

- Only the TransPerfect NEXT brand page + its 10 sub-event pages.
- Other brands keep the current UI untouched until we validate the pattern.
- Canva sync starts as a stub returning the existing template list; wiring the real Canva Connect call can be a follow-up if the OAuth scope isn't already granted.

## Technical notes

- New table: `canva_templates` (id, event_id, sub_event_id nullable, platform, canva_template_id, thumbnail_url, name, updated_at). RLS + grants per project rules.
- New edge function: `canva-templates-sync` (verify_jwt=false, manual JWT check, admin-only).
- Extend `events.guide_data` with `canvaFolderId` (no schema change — it's JSONB).
- No changes to existing template preview images; those become fallbacks when Canva sync hasn't run.

## Deliverable

A single, calmer Social section on `/event/transperfect-next` (and each sub-event) with: playbook on top, platform tabs in the middle, and a live Canva-connected template row inside each platform tab that auto-brands to the current event.
