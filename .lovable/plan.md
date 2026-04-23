

## Plan: Create TransPerfect1 as a New Organization with Cloned Brand

I'll add a one-click "Clone to new workspace" action that creates a brand-new `TransPerfect1` organization, copies the entire existing TransPerfect brand guide into it, and publishes it immediately so you can start the visual refresh on top of a working baseline.

### What gets created

1. **New Organization** — `TransPerfect1` at `/org/transperfect1`
   - You become the owner
   - Inherits no settings from the original (clean slate for org-level branding)

2. **New Brand** — full deep-clone of the current TransPerfect brand
   - All 58 guide_data sections copied (hero, colors, logos, typography, imagery, products references, awards, webinars, statistics, etc.)
   - New `id` generated, new `slug = transperfect1`, `is_public = true`
   - `organization_id` points to the new TransPerfect1 org
   - `linkedGuides` and `linkedBooths` are **stripped** (per your "don't link anything yet" choice) so the new brand stands alone

3. **No products/events copied** — the new shell is ready for you to add fresh ones (or link later) when you provide the new brand info

### How it works

A new "Clone Brand to New Workspace" action will be added to the brand editor admin toolbar (gated to admins). It opens a dialog asking for:
- New workspace name (defaults to `<BrandName>1`)
- New workspace URL slug (defaults to `<slug>1`, validated against existing slugs)
- Visibility toggle (defaults to Public)

On submit it runs three sequential operations:
1. `OrganizationService.createOrganization(name, slug, userId)` — creates the org + owner membership
2. `supabase.from('brands').insert({ ...clonedGuide, id: undefined, organization_id: newOrgId, slug: newSlug, is_public: true })` — deep clones the brand row, scrubbing `linkedGuides`/`linkedBooths`/`shareToken`
3. Audit-log the clone via `logBrandCreated`, then redirect you to `/org/transperfect1`

### Files to add / change

- **New**: `src/lib/organization/cloneBrandToNewOrg.ts` — pure function that takes `(sourceBrandId, newOrgName, newSlug, userId)`, performs the org create + brand clone, returns the new org/brand ids
- **New**: `src/components/brand/CloneBrandDialog.tsx` — the dialog UI (name input, slug input with live availability check, public toggle, confirm button)
- **Edit**: `src/components/admin/AdminToolbar.tsx` (or the brand editor toolbar where admin actions live) — add a "Clone to new workspace" menu item that opens the dialog
- **Edit**: `src/contexts/BrandContext.tsx` — expose a `cloneBrandToNewOrg` helper that the dialog can call and which refreshes the brand list afterward

### What you do next

Once TransPerfect1 exists at `/org/transperfect1`, you can:
- Drop in the new brand info (logos, colors, typography, mission, etc.) you mentioned you have ready
- I'll help apply that updated look section by section as you provide it
- Add new products/events when you're ready, or link the existing ones from TransPerfect later

### Notes

- The original TransPerfect brand and org remain completely untouched
- Image URLs in the clone still point to the original Supabase storage objects — that's fine for read access; if you want fully independent file copies later, that's a separate (heavier) operation we can do
- Slug collision is checked before any insert, so a failed clone won't leave half-created records

