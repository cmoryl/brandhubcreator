
# 11 Division PPTX Variants from `GamesNEXT_Master_PPT_Template.pptx`

## Inputs (verified)
- **Master deck**: `GamesNEXT_Master_PPT_Template.pptx` — 10 slides, 23 media items (4 SVGs + PNG/JPEG). Master accent hex `#A6FA87` (Games).
- **Logos**: Dropbox folder unzipped — every division has `Stacked/`, `Side by Side/` SVG variants in **color / white / white-color** trims. All 11 divisions present:
  TransPerfect, GlobalLink, Games, Finance, Legal, Life Sci, Experience, Learn, Media, Digital, Dataforce.
- **Palette**: already in-repo at `public/canva-master-reference/next-2026-color-palette.json` (per-division hex, RGB, HSV, Pantone).

## Deliverables
- 11 output files: `NEXT2026_<Division>_PPT.pptx` (Games included = a re-emitted master).
- Bundled `NEXT2026_Division_Decks.zip` for one-click download.
- Written to `/mnt/documents/next2026-decks/`.

## Approach — a Python script that manipulates the PPTX zip directly
No LibreOffice round-trip (preserves master slide layouts, fonts, animations, notes).

For each of the 11 divisions:
1. Copy `master.pptx` → `<Division>.pptx` staging dir.
2. **Swap logo media**: Overwrite the 3 large SVG media entries in `ppt/media/` that correspond to the embedded Games logo (identified by size fingerprint — `image2.svg` / `image14.svg` / `image20.svg`, all 62938 bytes) with the division's equivalent SVG. Mapping:
   - `Stacked/<Division> NEXT stacked color logo.svg` (color-on-light usage)
   - `Stacked/<Division> NEXT stacked white color logo.svg` (color-on-dark usage)
   - The small 5.5KB `image11.svg` looks like a shared mark (kept unless it also matches Games — will verify and swap if so).
   - Each replacement SVG is inlined; the paired PNG raster (`image1.png`, `image13.png`) is also regenerated from the SVG at 4× using `cairosvg` so PowerPoint's fallback raster matches.
3. **Recolor accent**:
   - Rewrite the theme accent1 (`4F81BD`) mapping is unused; the real Games green appears as literal `A6FA87` in `slide1.xml` — swap that literal hex to the division hex across all slide/layout/master XML (case-insensitive).
   - Also replace it inside SVGs where the Games green is stroked/filled.
4. **Rename**: Update `docProps/core.xml` title + `app.xml` company to `<Division> NEXT 2026`.
5. Repack as a valid `.pptx` (store `[Content_Types].xml` first, DEFLATE the rest).

## QA loop (mandatory per PPTX skill)
- `python -m markitdown <div>.pptx` — confirms text integrity.
- Render slides 1–3 of one sample deck (Finance) to JPG via LibreOffice → `pdftoppm` → visually inspect that:
  - Logo is the correct division mark.
  - Accent green squares/arrows now show the division color.
- Iterate fixes; re-render only if issues found.

## Technical Details
- Script location: `/tmp/build_division_decks.py` (workspace scratch, not committed to project).
- Deps: `python-pptx` not needed — pure zip/XML string ops keep the master fully intact. `cairosvg` for SVG→PNG raster fallback.
- Hex swap is scoped: only replaces `A6FA87` / `a6fa87` (unique to Games in the deck), so it will not clobber unrelated colors.
- Division→SVG resolution uses folder-name matching (`Life Sci` folder handled explicitly).
- Output ZIP built with `zip -r` for user download.

## Out of scope
- Editing text content per division (I keep Games' copy verbatim; user can rename headings later).
- Regenerating raster PNGs at custom sizes beyond 4× SVG rasterization.
- Uploading anything back to Dropbox.

Reply "go" and I'll switch to build mode and produce all 11 decks + the zip.
