import type { LintFinding } from './svgStructuralLint';

export interface SvgRemediation {
  /** Short, plain-English description of the fix. */
  summary: string;
  /** Concrete, step-by-step actions an editor can take. */
  steps: string[];
  /** Optional code snippet illustrating the corrected attribute / element. */
  snippet?: string;
  /** Optional tool recommendation (SVGO plugin, Illustrator export setting, etc.). */
  tool?: string;
}

/**
 * Targeted, finding-specific remediation guidance keyed by `LintFinding.id`
 * (see svgStructuralLint.ts). Anything not in this map falls back to a
 * generic suggestion so every fail / warn always renders a fix hint.
 */
const REMEDIATIONS: Record<string, SvgRemediation> = {
  root: {
    summary: 'File root is not an <svg> element — the asset is likely HTML or a corrupted upload.',
    steps: [
      'Re-export the logo as SVG from the source design tool.',
      'Open the file in a text editor and confirm the first tag is <svg …>.',
      'Re-upload the corrected file to replace this asset.',
    ],
    snippet: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">…</svg>',
  },
  parse: {
    summary: 'SVG is not well-formed XML — a parser failed to read it.',
    steps: [
      'Run the file through an XML validator (e.g. xmllint --noout file.svg).',
      'Look for unclosed tags, stray ampersands, or missing quotes around attribute values.',
      'Re-export from the source tool if hand-editing is risky.',
    ],
    tool: 'SVGO with --pretty for easier inspection',
  },
  'viewbox-missing': {
    summary: 'Add a viewBox so the logo scales responsively at any size.',
    steps: [
      'Open the SVG and locate the <svg> root tag.',
      'Add viewBox="0 0 W H" where W and H match the artboard size.',
      'If the file has width/height attributes you can copy those values directly.',
    ],
    snippet: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 64">',
    tool: 'SVGO addAttributesToSVGElement plugin',
  },
  'viewbox-malformed': {
    summary: 'viewBox value is not four valid numbers.',
    steps: [
      'Replace the value with four numbers separated by spaces: min-x min-y width height.',
      'Strip units (px, %) — viewBox is unitless.',
    ],
    snippet: 'viewBox="0 0 240 64"',
  },
  'viewbox-zero': {
    summary: 'viewBox has zero width or height — the logo will render as nothing.',
    steps: [
      'Measure the actual artboard bounds in the source file.',
      'Update viewBox to "min-x min-y width height" using real positive values.',
    ],
    snippet: 'viewBox="0 0 240 64"',
  },
  'dim-width-hardcoded': {
    summary: 'Remove the fixed width="…" so CSS can size the logo responsively.',
    steps: [
      'Delete width="…" from the <svg> root element.',
      'Keep viewBox so aspect ratio is preserved.',
      'Style the consuming <img> / <svg> wrapper with CSS width or class instead.',
    ],
    tool: 'SVGO removeDimensions plugin',
  },
  'dim-height-hardcoded': {
    summary: 'Remove the fixed height="…" so CSS can size the logo responsively.',
    steps: [
      'Delete height="…" from the <svg> root element.',
      'Keep viewBox so aspect ratio is preserved.',
      'Style the consuming <img> / <svg> wrapper with CSS height or class instead.',
    ],
    tool: 'SVGO removeDimensions plugin',
  },
  'par-none': {
    summary: 'preserveAspectRatio="none" stretches the logo — distortion risk.',
    steps: [
      'Remove the preserveAspectRatio="none" attribute (the default "xMidYMid meet" is almost always correct).',
      'If the logo really must stretch, confirm with brand owner first.',
    ],
    snippet: '<!-- omit preserveAspectRatio entirely to use the safe default -->',
  },
  'raster-embed': {
    summary: 'SVG embeds a base64 raster image — defeats the purpose of vector.',
    steps: [
      'Rebuild the artwork from the original vector source.',
      'If only a raster master exists, vectorize it (Illustrator Image Trace, Inkscape Trace Bitmap).',
      'Re-export as pure SVG with no <image> tags.',
    ],
    tool: 'Illustrator: Object > Image Trace > Expand',
  },
  'external-image': {
    summary: 'SVG references an external image URL — fragile and slow.',
    steps: [
      'Replace any <image href="https://…"> with inline vector geometry.',
      'If the asset is required, inline it as base64 only as a last resort.',
    ],
  },
  'external-ref': {
    summary: 'SVG pulls assets (fonts, filters, gradients) from an external URL.',
    steps: [
      'Inline every <defs> dependency the file references.',
      'Convert text using web fonts to outlined paths.',
      'Remove xlink:href / href attributes that point off-document.',
    ],
  },
  'text-nodes': {
    summary: 'Live <text> nodes depend on the viewer having the right fonts installed.',
    steps: [
      'Convert all text to outlines / paths in the source tool.',
      'Illustrator: Type > Create Outlines. Figma: Outline Stroke + Flatten.',
      'Re-export and re-upload.',
    ],
    tool: 'Illustrator: Type > Create Outlines (Cmd/Ctrl+Shift+O)',
  },
  'font-deps': {
    summary: 'SVG declares font-family — will fall back if the font is missing.',
    steps: [
      'Outline the text in the source file (see "text-nodes" remediation).',
      'Or remove font-family attributes if the text has already been outlined.',
    ],
  },
  'heavy-filters': {
    summary: 'Complex <filter> chains render slowly and inconsistently across browsers.',
    steps: [
      'Rasterize the filtered region in the source tool and embed once as a flat path.',
      'Or replace the effect (drop-shadow, blur) with a simpler equivalent.',
    ],
  },
  'style-block': {
    summary: 'In-document <style> blocks can collide with host page CSS.',
    steps: [
      'Convert <style> rules into per-element attributes (fill, stroke, opacity).',
      'Remove the <style> block.',
    ],
    tool: 'SVGO inlineStyles plugin',
  },
  'dup-ids': {
    summary: 'Duplicate id values break gradient / filter references when multiple logos are embedded on one page.',
    steps: [
      'Make every id unique within the file — prefix with the brand slug.',
      'Update all url(#id) references to match the new ids.',
    ],
    tool: 'SVGO prefixIds plugin',
  },
  xmlns: {
    summary: 'Missing xmlns="http://www.w3.org/2000/svg" — file may not render in standalone contexts.',
    steps: [
      'Add the SVG namespace to the root element.',
    ],
    snippet: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 W H">',
  },
  'not-svg': {
    summary: 'Server returned a non-SVG payload (likely HTML error page or wrong content-type).',
    steps: [
      'Open the asset URL directly in a browser to confirm what is served.',
      'Re-upload the original SVG and verify it stores under the correct path.',
      'Confirm the storage bucket exposes image/svg+xml content-type.',
    ],
  },
};

const GENERIC: SvgRemediation = {
  summary: 'Review the structural finding and update the source artwork.',
  steps: [
    'Open the SVG in your design tool and inspect the flagged attribute / element.',
    'Re-export with a clean optimizer pass before re-uploading.',
  ],
  tool: 'SVGO (https://svgo.dev)',
};

/**
 * Return the targeted remediation for a finding, falling back to a generic
 * suggestion so failing / warning rows always render at least one hint.
 */
export function getRemediation(finding: LintFinding): SvgRemediation {
  return REMEDIATIONS[finding.id] ?? GENERIC;
}

/**
 * Aggregate all distinct, actionable remediations for a set of findings.
 * `pass` findings are skipped. Identical remediations are de-duplicated by
 * their summary so the UI never repeats itself.
 */
export function getRemediationsFor(findings: LintFinding[]): Array<{
  finding: LintFinding;
  remediation: SvgRemediation;
}> {
  const seen = new Set<string>();
  const out: Array<{ finding: LintFinding; remediation: SvgRemediation }> = [];
  for (const f of findings) {
    if (f.severity === 'pass') continue;
    const r = getRemediation(f);
    if (seen.has(r.summary)) continue;
    seen.add(r.summary);
    out.push({ finding: f, remediation: r });
  }
  return out;
}
