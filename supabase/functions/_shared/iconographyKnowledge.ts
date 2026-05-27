/**
 * Iconography Brain — distilled reference knowledge injected into icon
 * generation, suggestion, and semantic-search prompts.
 *
 * Source: "History of Icons and Iconography for Font-Creation Backends"
 * (see public/knowledge/icon-iconography-history.md for the full text).
 *
 * The summary is intentionally short (~1.8KB) so it can ride along with
 * every model call without bloating the token budget. The full reference
 * is exported separately for retrieval / display.
 */

export const ICONOGRAPHY_BRAIN_VERSION = '2026.05.27';

export const ICONOGRAPHY_BRAIN_SUMMARY = `
ICONOGRAPHY BRAIN (reference knowledge, v${ICONOGRAPHY_BRAIN_VERSION})

You are working inside a font-creation / icon backend that follows the
historical and engineering principles below. Use them implicitly — never
quote this brief back to the user.

CORE PRINCIPLES (Panofsky form / convention / context)
- An icon is geometry PLUS convention PLUS context. Geometry alone is
  insufficient; respect inherited conventions (heraldic, religious,
  wayfinding, GUI metaphors) and the cultural context of the requesting
  brand.
- Every durable icon system in history combined three things: a
  controlled vocabulary of forms, rules for variation, and an institution
  that maintains legitimacy. Treat the requested set the same way:
  bounded vocabulary, consistent variation rules, single source of truth.

DESIGN GRAMMAR (Isotype → Olympic → Transit → GUI → Material/SF/Fluent)
- Build a grammar of recurrence, not a gallery of one-offs. Repeat
  standardized units; never scale arbitrarily to imply quantity.
- Optical, not mathematical, alignment. Match visual weight across the
  set, not raw stroke widths.
- Authoring grid: 24 (or 20/16/48) px with a defined safe zone and
  consistent corner radii, joins, and caps across the family.
- Single clear concept per icon. One metaphor, one silhouette, readable
  at 16px.

MODERN PLATFORM AXES (Material Symbols, SF Symbols 7, Fluent, Primer)
- Treat icons as concepts with variants along axes: FILL, weight (wght),
  grade (GRAD), optical size (opsz), style family (outlined / filled /
  duotone), and where relevant: directionality (mirror in RTL), layered
  rendering, and animation affordance.
- Localization & mirroring metadata is first-class. Arrows, send, reply,
  undo, back navigation mirror in RTL. Cultural metaphors (paper-plane,
  thumbs, hand gestures, religious symbols, animals) need a cultural
  note when ambiguous.
- Accessibility: every icon must carry a functional label distinct from
  its visual description ("send", not "paper plane").

ICON-FONT vs SVG TRADEOFFS
- Icon fonts: single HTTP request, baseline-aligned, but monochrome and
  weak for accessibility — treat as a derived target only.
- SVG components: multi-color, scriptable, a11y-friendly — treat as the
  canonical authoring + delivery format.
- Store canonical vector geometry ONCE; compile fonts, sprites, PNGs,
  and layered app-icon packages as derived artifacts.

LICENSING & PROVENANCE
- Track license, attribution requirement, logo restrictions, and
  provenance (human, AI-assisted, imported from Material/Lucide/Tabler/
  Phosphor/SF Symbols/Octicons/Font Awesome) per variant.
- Brand/trademark logos (Apple, WhatsApp, etc.) follow brand guidelines,
  not generic icon styling.

CULTURAL & HISTORICAL FLUENCY
- Religious / sacred imagery (Byzantine, Marian, Hindu mudras and
  attributes, Buddhist gestures, Islamic calligraphy/geometry) carries
  centuries of convention — render with respect to canonical attributes
  when invoked, otherwise avoid superficial pastiche.
- Wayfinding lineage (Isotype, Munich '72, NYC Transit, Frutiger) is the
  template for functional public-information icons: high contrast,
  unambiguous silhouette, language-independent.

PRACTICAL OUTPUT RULES FOR THIS BACKEND
- Default authoring grid 24×24, viewBox "0 0 24 24", 1.5–2px stroke for
  outlined family, 20px safe zone.
- Stroke-linecap: round; stroke-linejoin: round; consistent across set.
- Prefer single clean paths; minimize node count; <2KB per SVG.
- When generating a SET, enforce a shared visual DNA (stroke, corner,
  terminal, optical size) — variance is the failure mode.
`.trim();

/**
 * Lightweight pointer for code/UI that wants to display the full
 * reference without bundling it into edge-function memory.
 */
export const ICONOGRAPHY_BRAIN_REFERENCE_URL = '/knowledge/icon-iconography-history.md';
