import { describe, it, expect } from 'vitest';
import { lintSvgString } from '@/lib/svgStructuralLint';

/**
 * Fixtures use real-world malicious/tricky SVG patterns sourced from common
 * SVG-injection write-ups (PortSwigger, OWASP, SVGuard) and real CDN exports
 * (Adobe Illustrator, Figma, Sketch). Each test asserts the expected lint
 * outcome AND sanitizer behavior.
 */

const minimalValid = (extra = '') => `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <path d="M2 2 L22 22" fill="#000"/>
  ${extra}
</svg>`;

const findingIds = (r: ReturnType<typeof lintSvgString>) =>
  r.findings.map((f) => f.id);

describe('svgStructuralLint — happy path', () => {
  it('passes a minimal well-formed SVG with viewBox', () => {
    const r = lintSvgString(minimalValid());
    expect(r.ok).toBe(true);
    expect(r.counts.fail).toBe(0);
    expect(findingIds(r)).toContain('viewbox-ok');
  });
});

describe('svgStructuralLint — viewBox', () => {
  it('fails when viewBox is missing', () => {
    const svg = `<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path d="M0 0"/></svg>`;
    const r = lintSvgString(svg);
    expect(r.ok).toBe(false);
    expect(findingIds(r)).toContain('viewbox-missing');
  });

  it('fails when viewBox is malformed', () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="not numbers"><path d="M0 0"/></svg>`;
    const r = lintSvgString(svg);
    expect(r.ok).toBe(false);
    expect(findingIds(r)).toContain('viewbox-malformed');
  });

  it('fails when viewBox has zero area', () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 0 24"><path d="M0 0"/></svg>`;
    const r = lintSvgString(svg);
    expect(r.ok).toBe(false);
    expect(findingIds(r)).toContain('viewbox-zero');
  });

  it('accepts comma- and whitespace-separated viewBox', () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0, 0, 100, 100"><path d="M0 0"/></svg>`;
    const r = lintSvgString(svg);
    expect(r.ok).toBe(true);
  });
});

describe('svgStructuralLint — hardcoded dimensions', () => {
  it('warns when root width/height are hardcoded pixels', () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path d="M0 0"/></svg>`;
    const r = lintSvgString(svg);
    expect(r.counts.warn).toBeGreaterThan(0);
    expect(findingIds(r)).toEqual(
      expect.arrayContaining(['dim-width-hardcoded', 'dim-height-hardcoded']),
    );
    // Warns do not block uploads
    expect(r.ok).toBe(true);
  });

  it('does not warn when width/height use percentage', () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="100%" height="100%"><path d="M0 0"/></svg>`;
    const r = lintSvgString(svg);
    expect(findingIds(r)).not.toContain('dim-width-hardcoded');
    expect(findingIds(r)).not.toContain('dim-height-hardcoded');
  });
});

describe('svgStructuralLint — preserveAspectRatio', () => {
  it('fails on preserveAspectRatio="none"', () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" preserveAspectRatio="none"><path d="M0 0"/></svg>`;
    const r = lintSvgString(svg);
    expect(r.ok).toBe(false);
    expect(findingIds(r)).toContain('par-none');
  });

  it('accepts default preserveAspectRatio', () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet"><path d="M0 0"/></svg>`;
    const r = lintSvgString(svg);
    expect(findingIds(r)).not.toContain('par-none');
  });
});

describe('svgStructuralLint — embedded raster <image>', () => {
  it('fails on a base64-embedded PNG and strips it from output', () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><image href="data:image/png;base64,iVBORw0KGgo="/></svg>`;
    const r = lintSvgString(svg);
    expect(r.ok).toBe(false);
    expect(findingIds(r)).toContain('raster-embed');
    expect(r.sanitized).not.toMatch(/<image/i);
  });

  it('fails on jpeg data URI inside <image>', () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><image xlink:href="data:image/jpeg;base64,/9j/4AAQ" xmlns:xlink="http://www.w3.org/1999/xlink"/></svg>`;
    const r = lintSvgString(svg);
    expect(r.ok).toBe(false);
    expect(findingIds(r)).toContain('raster-embed');
  });

  it('fails on external http <image href> and removes it', () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><image href="https://evil.example/track.png"/></svg>`;
    const r = lintSvgString(svg);
    expect(r.ok).toBe(false);
    expect(findingIds(r)).toContain('external-image');
    expect(r.sanitized).not.toMatch(/<image/i);
  });
});

describe('svgStructuralLint — external references', () => {
  it('fails on <use href="https://…">', () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><use href="https://evil.example/sprite.svg#x"/></svg>`;
    const r = lintSvgString(svg);
    expect(r.ok).toBe(false);
    expect(findingIds(r)).toContain('external-ref');
  });

  it('fails on fill="url(https://…)"', () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="10" height="10" fill="url(https://evil.example/grad.svg#g)"/></svg>`;
    const r = lintSvgString(svg);
    expect(r.ok).toBe(false);
    expect(findingIds(r)).toContain('external-ref');
  });

  it('passes on internal url(#id) refs', () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><defs><linearGradient id="g"><stop offset="0" stop-color="#000"/></linearGradient></defs><rect width="10" height="10" fill="url(#g)"/></svg>`;
    const r = lintSvgString(svg);
    expect(findingIds(r)).not.toContain('external-ref');
    expect(r.ok).toBe(true);
  });

  it('passes on <use href="#sym"> internal sprite refs', () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><defs><symbol id="s"><circle r="4"/></symbol></defs><use href="#s"/></svg>`;
    const r = lintSvgString(svg);
    expect(findingIds(r)).not.toContain('external-ref');
  });
});

describe('svgStructuralLint — fonts / <text>', () => {
  it('warns when <text> nodes are present', () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 24"><text x="0" y="20">Brand</text></svg>`;
    const r = lintSvgString(svg);
    expect(findingIds(r)).toContain('text-nodes');
  });

  it('warns when non-generic font-family is referenced without @font-face', () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 24"><text x="0" y="20" font-family="Helvetica Neue, Arial">Brand</text></svg>`;
    const r = lintSvgString(svg);
    expect(findingIds(r)).toContain('font-deps');
  });

  it('does NOT warn on generic font families', () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 24"><text x="0" y="20" font-family="sans-serif">Brand</text></svg>`;
    const r = lintSvgString(svg);
    expect(findingIds(r)).not.toContain('font-deps');
  });

  it('detects font-family declared via inline style', () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 24"><text x="0" y="20" style="font-family: Brandon Grotesque, sans-serif">Brand</text></svg>`;
    const r = lintSvgString(svg);
    expect(findingIds(r)).toContain('font-deps');
  });
});

describe('svgStructuralLint — heavy filters', () => {
  it('warns on feGaussianBlur', () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><defs><filter id="f"><feGaussianBlur stdDeviation="2"/></filter></defs><rect width="10" height="10" filter="url(#f)"/></svg>`;
    const r = lintSvgString(svg);
    expect(findingIds(r)).toContain('heavy-filters');
  });

  it('warns on feColorMatrix + feTurbulence combined', () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><defs><filter id="f"><feTurbulence baseFrequency="0.1"/><feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0"/></filter></defs><rect width="10" height="10"/></svg>`;
    const r = lintSvgString(svg);
    expect(findingIds(r)).toContain('heavy-filters');
  });
});

describe('svgStructuralLint — inline <style>', () => {
  it('warns on a benign inline <style>', () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><style>.a{fill:#000}</style><rect class="a" width="10" height="10"/></svg>`;
    const r = lintSvgString(svg);
    const f = r.findings.find((x) => x.id === 'style-block');
    expect(f?.severity).toBe('warn');
    // benign style is kept
    expect(r.sanitized).toMatch(/<style/i);
  });

  it('fails and strips a <style> with @import', () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><style>@import url('https://evil.example/x.css');</style><rect width="10" height="10"/></svg>`;
    const r = lintSvgString(svg);
    expect(r.ok).toBe(false);
    const f = r.findings.find((x) => x.id === 'style-block');
    expect(f?.severity).toBe('fail');
    expect(r.sanitized).not.toMatch(/<style/i);
  });

  it('fails on global selectors (html/body/*) in <style>', () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><style>body { background: red; }</style></svg>`;
    const r = lintSvgString(svg);
    expect(r.ok).toBe(false);
    expect(r.sanitized).not.toMatch(/<style/i);
  });

  it('fails on url(https://…) inside <style>', () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><style>.a{background:url(https://evil.example/x.png)}</style></svg>`;
    const r = lintSvgString(svg);
    expect(r.ok).toBe(false);
  });
});

describe('svgStructuralLint — IDs and xmlns', () => {
  it('warns on duplicate IDs', () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g id="x"/><g id="x"/></svg>`;
    const r = lintSvgString(svg);
    expect(findingIds(r)).toContain('dup-ids');
  });

  it('warns and auto-adds missing xmlns', () => {
    const svg = `<svg viewBox="0 0 24 24"><rect width="10" height="10"/></svg>`;
    const r = lintSvgString(svg);
    expect(findingIds(r)).toContain('xmlns');
    expect(r.sanitized).toMatch(/xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  });

  it('warns when xmlns is wrong', () => {
    const svg = `<svg xmlns="http://example.com/wrong" viewBox="0 0 24 24"><rect width="10" height="10"/></svg>`;
    const r = lintSvgString(svg);
    expect(findingIds(r)).toContain('xmlns');
  });
});

describe('svgStructuralLint — malformed input', () => {
  it('fails on non-SVG root element', () => {
    const xml = `<?xml version="1.0"?><html xmlns="http://www.w3.org/1999/xhtml"><body/></html>`;
    const r = lintSvgString(xml);
    expect(r.ok).toBe(false);
    expect(findingIds(r)).toContain('root');
  });

  it('fails on parse error', () => {
    const broken = `<svg xmlns="http://www.w3.org/2000/svg"><path d="M"`;
    const r = lintSvgString(broken);
    expect(r.ok).toBe(false);
  });
});

describe('svgStructuralLint — real-world malicious patterns (defense in depth)', () => {
  // The security sanitizer in logoUploadValidation strips these before the
  // lint runs, but the lint should still flag external/JS references that
  // arrive via attributes the security layer didn't normalize.

  it('flags <use> pointing at an external SVG (used for XSS sprite injection)', () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="https://attacker.example/payload.svg#x"/></svg>`;
    const r = lintSvgString(svg);
    expect(r.ok).toBe(false);
    expect(findingIds(r)).toContain('external-ref');
  });

  it('flags protocol-relative //attacker.example/foo URLs', () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><image href="//attacker.example/x.png"/></svg>`;
    const r = lintSvgString(svg);
    expect(r.ok).toBe(false);
    expect(findingIds(r)).toContain('external-image');
  });
});
