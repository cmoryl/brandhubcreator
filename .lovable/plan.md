## Pilot: Embed Canva PNG previews in the TransPerfect division

Add rendered PNG thumbnails to each format row of the TransPerfect division as a proof-of-concept. Once you approve the look, roll out to the remaining 10 divisions in a follow-up.

### Steps

1. **Locate the TransPerfect division table** in `public/canva-master-reference/next-2026.html` and extract the Canva design URL for every row that has one. Skip:
   - Row 1 (Sponsorship packet — not a Canva design)
   - Row 2 (PowerPoint Template — Coming Soon)
   - Any row without a live Canva link
2. **Export each design as PNG** via the Canva MCP:
   - `get-export-formats` per design to confirm PNG support
   - `export-design` with `type: png`, page 1, ~1080px width, regular quality
   - Download each result to `public/canva-master-reference/thumbs/transperfect/<row-slug>.png`
3. **Add a Preview column** to the TransPerfect table only:
   - New `<th>Preview</th>` header
   - Each qualifying row gets `<img src="/canva-master-reference/thumbs/transperfect/…" loading="lazy" class="row-thumb" alt="…">`
   - Clicking the thumb opens the existing lightbox (same pattern as the logo click-to-enlarge added earlier)
   - Skipped rows show an em-dash placeholder
4. **Style `.row-thumb`** using existing semantic tokens (small ~96px wide, `object-fit: contain`, rounded, subtle border) — no raw color classes.
5. **Verify with Playwright**: load `/canva-master-reference/next-2026`, screenshot the TransPerfect table, and confirm each thumbnail renders on the correct row and the lightbox opens on click.
6. **Report back with the screenshot** so you can approve before I bulk-run divisions 2–11.

### Notes
- PNGs are static; re-exporting is a quick per-row operation if a design changes later.
- Files live under `public/…/thumbs/transperfect/` so they ship with the site.
- Every row's export is one Canva API call — a handful of credits for the pilot, ~11× that for full rollout.
