# Cohesive Client Logos ↔ Logo Hub

Make the brand-page "Client Logos" section a first-class view of the Global Logo Hub: same card visuals, same lockup/variant matrix, same validation + upload-version workflow, same download/ZIP behavior, and the same underlying data (`global_client_logos`) as the single source of truth.

## What changes for the user

- Client Logos cards on a brand page look identical to Logo Hub cards (same preview tiles, variant labels, lockup grouping, badges, and density).
- "Add logo" pulls from the Global Logo Library by default. New uploads land in the shared library and are linked to the brand, so the next brand sees the same asset.
- Per-row actions match the Hub: Upload Version (lockup + variant), Re-sync, Validate, Exempt, Open Website, Download file, Download ZIP.
- Bulk "Download all as ZIP" uses the Hub's slug/lockup/variant naming convention.
- Validation findings (missing variants/lockups, mono-cutout, contrast) surface inline with the same badges.

## Implementation

### 1. Shared presentational primitives (new)
Extract from `GlobalLogoHub.tsx` into reusable, presentation-only components in `src/components/logohub/shared/`:

- `LogoCardShared.tsx` — preview-tile grid (color / white / black, grouped by lockup), variant labels, title block, website link, action slot. Visual parity with Hub.
- `LogoDownloadMatrix.tsx` — the lockup × variant × format grid, with `FileUploadCell`/download chip styling identical to Hub.
- `LogoValidationBadges.tsx` — wraps `validateLogoFiles` results into the same badge row used in `GlobalLogoHub`.
- `downloadLogoZip.ts` — shared util for slug/lockup/variant ZIP packaging (lifted from `PublicLogoHub.downloadFilesAsZip`).

Refactor `GlobalLogoHub.tsx` and `PublicLogoHub.tsx` to consume these so all three surfaces stay visually in lockstep going forward.

### 2. Shared data source
Treat `global_client_logos` as the source of truth. The brand's `clientLogos` field becomes a thin selection list:

```ts
type ClientLogoRef = { id: string; globalLogoId: string; name: string };
```

Migration path (no DB schema change required):
- On read, hydrate each `clientLogos[i]` by joining to `global_client_logos` by id/name.
- On write, only persist the ref. Files always come from the library.
- Legacy per-brand `files[]` continues to render if no library match is found (back-compat), with a one-click "Promote to Library" action.

### 3. Functional parity in `ClientLogosSection.tsx`
Rewrite the section to:
- Render `LogoCardShared` per selected logo.
- Use the existing `UploadLogoVersion` dialog (already lockup+variant aware) for adding versions — writes to `global_client_logos` then refreshes.
- Reuse `GlobalLogoPickerDialog` as the only "Add" entry point (already exists, already wired to the library). Remove the inline "new logo" dialog and per-cell base64 upload path.
- Add the Hub's per-row toolbar: Validate, Exempt, Re-sync (calls `seed-partnerlink-logos`), Open Website, Download ZIP, Remove from brand.
- Surface `LogoValidationBadges` next to each card title.

### 4. Download/export parity
- Per-file download uses Hub naming: `{slug}-{lockup}-{variant}.{format}`.
- Per-card ZIP uses `downloadLogoZip(name, files)`.
- Section ZIP iterates selected logos, one folder per logo, using the same util.

### 5. Permissions
- `canEdit` still gates editing; non-admins see read-only cards with download chips only (Hub already follows this pattern).

## Files touched

- New: `src/components/logohub/shared/LogoCardShared.tsx`, `LogoDownloadMatrix.tsx`, `LogoValidationBadges.tsx`, `src/lib/downloadLogoZip.ts`
- Rewrite: `src/components/brand/ClientLogosSection.tsx` (≈700 → ≈300 lines, delegates to shared primitives)
- Refactor (consume shared primitives, no behavior change): `src/components/admin/GlobalLogoHub.tsx`, `src/pages/PublicLogoHub.tsx`
- Touch: `src/lib/guideNormalization.ts` to hydrate `clientLogos` refs against `global_client_logos` on load

## Out of scope

- DB schema changes (everything fits in existing `clientLogos` JSONB + `global_client_logos` table).
- Sponsor/Event logos (`SponsorLogosSection`, `EventSponsorsSection`) — same primitives could be applied later, but not in this pass unless you want it included.
