import type { LintFinding } from './svgStructuralLint';

export interface SvgRemediation {
  /** Short, plain-English description of the fix. */
  summary: string;
  /** Why this issue was flagged and what can break if it is ignored. */
  rationale: string;
  /** Concrete, step-by-step actions an editor can take. */
  steps: string[];
  /** Optional code snippet illustrating the corrected attribute / element. */
  snippet?: string;
  /** Optional tool recommendation (SVGO plugin, Illustrator export setting, etc.). */
  tool?: string;
  /** Optional link to authoritative docs for deeper context. */
  href?: string;
}

/**
 * Targeted, finding-specific remediation guidance keyed by `LintFinding.id`
 * (see svgStructuralLint.ts). Anything not in this map falls back to a
 * generic suggestion so every fail / warn always renders a fix hint.
 */
const REMEDIATIONS: Record<string, SvgRemediation> = {
  root: {
    summary: 'File root is not an <svg> element — the asset is likely HTML or a corrupted upload.',
    rationale: 'Only <svg> roots render consistently as vector assets in browsers, design tools, and PDF converters. A non-SVG root is treated as foreign markup and will not display as a logo.',
    steps: [
      'Re-export the logo as SVG from the source design tool.',
      'Open the file in a text editor and confirm the first tag is <svg …>.',
      'Re-upload the corrected file to replace this asset.',
    ],
    snippet: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">…</svg>',
    href: 'https://developer.mozilla.org/en-US/docs/Web/SVG/Element/svg',
  },
  parse: {
    summary: 'SVG is not well-formed XML — a parser failed to read it.',
    rationale: 'SVG files must be valid XML. Unclosed tags, unescaped characters, or malformed attributes will cause the entire file to fail to render, leaving a broken image on the page.',
    steps: [
      'Run the file through an XML validator (e.g. xmllint --noout file.svg).',
      'Look for unclosed tags, stray ampersands, or missing quotes around attribute values.',
      'Re-export from the source tool if hand-editing is risky.',
    ],
    tool: 'SVGO with --pretty for easier inspection',
    href: 'https://www.w3.org/TR/2006/REC-xml11-20060816/',
  },
  'viewbox-missing': {
    summary: 'Add a viewBox so the logo scales responsively at any size.',
    rationale: 'Without viewBox the SVG cannot scale uniformly; it locks to its pixel dimensions and will look oversized or clipped when placed inside responsive containers, emails, or social templates.',
    steps: [
      'Open the SVG and locate the <svg> root tag.',
      'Add viewBox="0 0 W H" where W and H match the artboard size.',
      'If the file has width/height attributes you can copy those values directly.',
    ],
    snippet: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 64">',
    tool: 'SVGO addAttributesToSVGElement plugin',
    href: 'https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/viewBox',
  },
  'viewbox-malformed': {
    summary: 'viewBox value is not four valid numbers.',
    rationale: 'A malformed viewBox is ignored by browsers, which falls back to fixed dimensions or a default coordinate system and usually crops or distorts the artwork.',
    steps: [
      'Replace the value with four numbers separated by spaces: min-x min-y width height.',
      'Strip units (px, %) — viewBox is unitless.',
    ],
    snippet: 'viewBox="0 0 240 64"',
    href: 'https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/viewBox',
  },
  'viewbox-zero': {
    summary: 'viewBox has zero width or height — the logo will render as nothing.',
    rationale: 'A viewBox with zero area produces an empty coordinate system. The browser has no valid viewport to map geometry into, so the logo disappears.',
    steps: [
      'Measure the actual artboard bounds in the source file.',
      'Update viewBox to "min-x min-y width height" using real positive values.',
    ],
    snippet: 'viewBox="0 0 240 64"',
    href: 'https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/viewBox',
  },
  'dim-width-hardcoded': {
    summary: 'Remove the fixed width="…" so CSS can size the logo responsively.',
    rationale: 'Hardcoded pixel widths prevent the logo from adapting to its container. On mobile or narrow layouts the asset can overflow or render at the wrong scale.',
    steps: [
      'Delete width="…" from the <svg> root element.',
      'Keep viewBox so aspect ratio is preserved.',
      'Style the consuming <img> / <svg> wrapper with CSS width or class instead.',
    ],
    tool: 'SVGO removeDimensions plugin',
    href: 'https://svgo.dev/docs/plugins/removeDimensions/',
  },
  'dim-height-hardcoded': {
    summary: 'Remove the fixed height="…" so CSS can size the logo responsively.',
    rationale: 'Hardcoded pixel heights prevent the logo from adapting to its container. They also fight against aspect-ratio preservation when paired with a viewBox.',
    steps: [
      'Delete height="…" from the <svg> root element.',
      'Keep viewBox so aspect ratio is preserved.',
      'Style the consuming <img> / <svg> wrapper with CSS height or class instead.',
    ],
    tool: 'SVGO removeDimensions plugin',
    href: 'https://svgo.dev/docs/plugins/removeDimensions/',
  },
  'par-none': {
    summary: 'preserveAspectRatio="none" stretches the logo — distortion risk.',
    rationale: 'Logos rely on consistent aspect ratios for brand recognition. Stretching breaks letterforms and spacing, which is almost never acceptable for a brand asset.',
    steps: [
      'Remove the preserveAspectRatio="none" attribute (the default "xMidYMid meet" is almost always correct).',
      'If the logo really must stretch, confirm with brand owner first.',
    ],
    snippet: '<!-- omit preserveAspectRatio entirely to use the safe default -->',
    href: 'https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/preserveAspectRatio',
  },
  'raster-embed': {
    summary: 'SVG embeds a base64 raster image — defeats the purpose of vector.',
    rationale: 'Embedding a PNG/JPEG inside SVG removes the scalability and small file-size benefits of vector. It also complicates print and high-DPI use cases.',
    steps: [
      'Rebuild the artwork from the original vector source.',
      'If only a raster master exists, vectorize it (Illustrator Image Trace, Inkscape Trace Bitmap).',
      'Re-export as pure SVG with no <image> tags.',
    ],
    tool: 'Illustrator: Object > Image Trace > Expand',
    href: 'https://helpx.adobe.com/illustrator/using/image-trace.html',
  },
  'external-image': {
    summary: 'SVG references an external image URL — fragile and slow.',
    rationale: 'External references create a network dependency. If the URL is blocked, moved, or slow, the logo will not render correctly and may expose a security/privacy leak.',
    steps: [
      'Replace any <image href="https://…"> with inline vector geometry.',
      'If the asset is required, inline it as base64 only as a last resort.',
    ],
    href: 'https://developer.mozilla.org/en-US/docs/Web/SVG/Element/image',
  },
  'external-ref': {
    summary: 'SVG pulls assets (fonts, filters, gradients) from an external URL.',
    rationale: 'Cross-document references fail when the asset is embedded directly into HTML or when the external host is unavailable. They also increase load time and complexity.',
    steps: [
      'Inline every <defs> dependency the file references.',
      'Convert text using web fonts to outlined paths.',
      'Remove xlink:href / href attributes that point off-document.',
    ],
    href: 'https://www.w3.org/TR/SVG2/linking.html',
  },
  'text-nodes': {
    summary: 'Live <text> nodes depend on the viewer having the right fonts installed.',
    rationale: 'Text elements render with the viewer\'s installed fonts. If the font is missing, spacing and letterforms change, producing inconsistent brand lockups across devices.',
    steps: [
      'Convert all text to outlines / paths in the source tool.',
      'Illustrator: Type > Create Outlines. Figma: Outline Stroke + Flatten.',
      'Re-export and re-upload.',
    ],
    tool: 'Illustrator: Type > Create Outlines (Cmd/Ctrl+Shift+O)',
    href: 'https://helpx.adobe.com/illustrator/using/creating-text.html',
  },
  'font-deps': {
    summary: 'SVG declares font-family — will fall back if the font is missing.',
    rationale: 'Even after outlining, leftover font-family declarations can cause rendering engines to attempt a font lookup. This is unnecessary and can trigger warnings or subtle spacing shifts.',
    steps: [
      'Outline the text in the source file (see "text-nodes" remediation).',
      'Or remove font-family attributes if the text has already been outlined.',
    ],
    href: 'https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/font-family',
  },
  'heavy-filters': {
    summary: 'Complex <filter> chains render slowly and inconsistently across browsers.',
    rationale: 'Filters such as blur and color matrix are CPU/GPU intensive, produce different results across renderers, and are often stripped or rasterized by PDF and email exporters.',
    steps: [
      'Rasterize the filtered region in the source tool and embed once as a flat path.',
      'Or replace the effect (drop-shadow, blur) with a simpler equivalent.',
    ],
    href: 'https://developer.mozilla.org/en-US/docs/Web/SVG/Element/filter',
  },
  'style-block': {
    summary: 'In-document <style> blocks can collide with host page CSS.',
    rationale: 'Style blocks apply globally. Class names used inside the SVG can accidentally restyle the host page, and host CSS can accidentally restyle the logo.',
    steps: [
      'Convert <style> rules into per-element attributes (fill, stroke, opacity).',
      'Remove the <style> block.',
    ],
    tool: 'SVGO inlineStyles plugin',
    href: 'https://svgo.dev/docs/plugins/inlineStyles/',
  },
  'dup-ids': {
    summary: 'Duplicate id values break gradient / filter references when multiple logos are embedded on one page.',
    rationale: 'Element IDs must be unique within a document. When the same SVG is embedded twice, duplicate ids cause the second instance to borrow gradients or filters from the first, producing wrong colors.',
    steps: [
      'Make every id unique within the file — prefix with the brand slug.',
      'Update all url(#id) references to match the new ids.',
    ],
    tool: 'SVGO prefixIds plugin',
    href: 'https://svgo.dev/docs/plugins/prefixIds/',
  },
  xmlns: {
    summary: 'Missing xmlns="http://www.w3.org/2000/svg" — file may not render in standalone contexts.',
    rationale: 'The SVG namespace tells the parser which vocabulary the markup belongs to. Without it, standalone files and XML-based importers may fail to recognize the content.',
    steps: [
      'Add the SVG namespace to the root element.',
    ],
    snippet: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 W H">',
    href: 'https://developer.mozilla.org/en-US/docs/Web/SVG/Namespaces_Crash_Course',
  },
  'not-svg': {
    summary: 'Server returned a non-SVG payload (likely HTML error page or wrong content-type).',
    rationale: 'When a logo URL serves HTML or a redirect instead of SVG data, the file cannot be parsed. This usually indicates a broken storage path or missing asset.',
    steps: [
      'Open the asset URL directly in a browser to confirm what is served.',
      'Re-upload the original SVG and verify it stores under the correct path.',
      'Confirm the storage bucket exposes image/svg+xml content-type.',
    ],
    href: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Type',
  },
};

const GENERIC: SvgRemediation = {
  summary: 'Review the structural finding and update the source artwork.',
  rationale: 'The linter detected a structural issue that does not have a dedicated remediation guide. Fixing it will improve compatibility with browsers, exporters, and downstream design tools.',
  steps: [
    'Open the SVG in your design tool and inspect the flagged attribute / element.',
    'Re-export with a clean optimizer pass before re-uploading.',
  ],
  tool: 'SVGO (https://svgo.dev)',
  href: 'https://svgo.dev/',
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

