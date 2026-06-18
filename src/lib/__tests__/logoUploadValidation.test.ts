import { describe, it, expect } from 'vitest';
import { validateLogoUpload, LOGO_UPLOAD_LIMITS } from '@/lib/logoUploadValidation';

/**
 * End-to-end upload validation tests.
 * Covers MIME/ext mismatch, magic bytes, size caps, and lint integration.
 */

function svgFile(body: string, name = 'logo.svg', type = 'image/svg+xml') {
  return new File([body], name, { type });
}

function pngFile(bytes: Uint8Array, name = 'logo.png', type = 'image/png') {
  return new File([bytes], name, { type });
}

const PNG_MAGIC = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const validSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0L24 24" fill="#000"/></svg>`;

describe('validateLogoUpload — format detection', () => {
  it('rejects unsupported formats (GIF)', async () => {
    const f = new File([new Uint8Array([0x47, 0x49, 0x46])], 'logo.gif', { type: 'image/gif' });
    const r = await validateLogoUpload(f);
    expect(r.ok).toBe(false);
  });

  it('rejects ext/MIME mismatch (svg ext, png MIME)', async () => {
    const f = new File(['<svg/>'], 'logo.svg', { type: 'image/png' });
    const r = await validateLogoUpload(f);
    expect(r.ok).toBe(false);
  });

  it('rejects ext/MIME mismatch (png ext, svg MIME)', async () => {
    const f = new File([new Uint8Array([1])], 'logo.png', { type: 'image/svg+xml' });
    const r = await validateLogoUpload(f);
    expect(r.ok).toBe(false);
  });
});

describe('validateLogoUpload — PNG', () => {
  it('accepts a minimal valid PNG (magic bytes present)', async () => {
    const body = new Uint8Array([...PNG_MAGIC, 0, 0, 0, 0]);
    const r = await validateLogoUpload(pngFile(body));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.format).toBe('png');
  });

  it('rejects an empty PNG', async () => {
    const r = await validateLogoUpload(pngFile(new Uint8Array([])));
    expect(r.ok).toBe(false);
  });

  it('rejects a PNG with wrong magic bytes (renamed JPEG)', async () => {
    const fakeJpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]);
    const r = await validateLogoUpload(pngFile(fakeJpeg));
    expect(r.ok).toBe(false);
    if (!r.ok) expect((r as { error: string }).error).toMatch(/header signature/i);
  });

  it('rejects oversized PNG', async () => {
    const huge = new Uint8Array(LOGO_UPLOAD_LIMITS.MAX_PNG_BYTES + 100);
    huge.set(PNG_MAGIC, 0);
    const r = await validateLogoUpload(pngFile(huge));
    expect(r.ok).toBe(false);
  });
});

describe('validateLogoUpload — SVG happy path', () => {
  it('accepts a clean, well-formed SVG', async () => {
    const r = await validateLogoUpload(svgFile(validSvg));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.format).toBe('svg');
      expect(r.contentType).toBe('image/svg+xml');
    }
  });

  it('forces .svg extension on the saved filename', async () => {
    const r = await validateLogoUpload(svgFile(validSvg, 'logo'));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.filename.endsWith('.svg')).toBe(true);
  });
});

describe('validateLogoUpload — SVG security sanitization', () => {
  it('rejects <script> tag inside SVG', async () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><script>alert(1)</script></svg>`;
    const r = await validateLogoUpload(svgFile(svg));
    expect(r.ok).toBe(false);
  });

  it('rejects onload handler', async () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" onload="alert(1)"><rect width="10" height="10"/></svg>`;
    const r = await validateLogoUpload(svgFile(svg));
    expect(r.ok).toBe(false);
  });

  it('rejects javascript: in href', async () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><a href="javascript:alert(1)"><rect width="10" height="10"/></a></svg>`;
    const r = await validateLogoUpload(svgFile(svg));
    expect(r.ok).toBe(false);
  });

  it('rejects DTD entity declarations (XXE)', async () => {
    const svg = `<?xml version="1.0"?><!DOCTYPE svg [ <!ENTITY xxe SYSTEM "file:///etc/passwd"> ]><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">&xxe;</svg>`;
    const r = await validateLogoUpload(svgFile(svg));
    expect(r.ok).toBe(false);
    if (!r.ok) expect((r as { error: string }).error).toMatch(/entity/i);
  });

  it('rejects <foreignObject> embedded HTML', async () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><foreignObject><iframe src="https://evil.example"/></foreignObject></svg>`;
    const r = await validateLogoUpload(svgFile(svg));
    expect(r.ok).toBe(false);
  });
});

describe('validateLogoUpload — SVG structural lint integration', () => {
  it('rejects SVG without viewBox at upload time', async () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><rect width="10" height="10"/></svg>`;
    const r = await validateLogoUpload(svgFile(svg));
    expect(r.ok).toBe(false);
    if (!r.ok) expect((r as { error: string }).error).toMatch(/lint/i);
  });

  it('rejects preserveAspectRatio="none"', async () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" preserveAspectRatio="none"><rect width="10" height="10"/></svg>`;
    const r = await validateLogoUpload(svgFile(svg));
    expect(r.ok).toBe(false);
  });

  it('rejects embedded raster <image data:image/png;…>', async () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><image href="data:image/png;base64,iVBORw0KGgo="/></svg>`;
    const r = await validateLogoUpload(svgFile(svg));
    expect(r.ok).toBe(false);
  });

  it('accepts SVG with <text> but surfaces a warning', async () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 24"><text x="0" y="20" font-family="sans-serif">Brand</text></svg>`;
    const r = await validateLogoUpload(svgFile(svg));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.warnings.some((w) => /text/i.test(w))).toBe(true);
    }
  });

  it('accepts hardcoded pixel dims (warn only, not fail)', async () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path d="M0 0L24 24"/></svg>`;
    const r = await validateLogoUpload(svgFile(svg));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.warnings.some((w) => /width|height/i.test(w))).toBe(true);
    }
  });
});

describe('validateLogoUpload — SVG size limits', () => {
  it('rejects an SVG over MAX_SVG_BYTES', async () => {
    const padding = ' '.repeat(LOGO_UPLOAD_LIMITS.MAX_SVG_BYTES + 100);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><!-- ${padding} --><rect/></svg>`;
    const r = await validateLogoUpload(svgFile(svg));
    expect(r.ok).toBe(false);
    if (!r.ok) expect((r as { error: string }).error).toMatch(/exceeds/i);
  });

  it('rejects empty SVG file', async () => {
    const r = await validateLogoUpload(svgFile(''));
    expect(r.ok).toBe(false);
  });

  it('rejects file that does not contain an <svg> element', async () => {
    const r = await validateLogoUpload(svgFile('<html><body/></html>'));
    expect(r.ok).toBe(false);
  });
});
