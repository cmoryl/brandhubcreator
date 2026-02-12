import { BrandSignature } from '@/types/brand';
import { SOCIAL_PLATFORMS, DEFAULT_DARK, DEFAULT_ACCENT } from './signatureConstants';

/**
 * Programmatic HTML renderer for email signatures.
 * Generates email-client-compatible HTML (tables, inline styles).
 */
export function renderSignatureHtml(sig: BrandSignature): string {
  const s = sig.style || {};
  const font = s.fontFamily || 'Arial, sans-serif';
  const nameColor = s.nameColor || sig.accentColor || DEFAULT_DARK;
  const titleColor = s.titleColor || sig.accentColor || DEFAULT_ACCENT;
  const textColor = s.textColor || '#666666';
  const linkColor = s.linkColor || sig.accentColor || DEFAULT_ACCENT;
  const divStyle = s.dividerStyle || 'solid';
  const divColor = s.dividerColor || linkColor;
  const divWidth = s.dividerWidth ?? 2;
  const nameFontSize = s.nameFontSize || 18;
  const titleFontSize = s.titleFontSize || 14;
  const textFontSize = s.textFontSize || 12;
  const spacing = s.spacing ?? 15;
  const logoW = sig.logoWidth || 100;
  const logoH = sig.logoHeight || 100;

  const isMinimal = sig.variant === 'minimal';
  const isReply = sig.variant === 'reply';

  let rows: string[] = [];

  // -- Name & Title --
  if (isReply) {
    rows.push(`<tr><td style="padding-bottom:${spacing}px;">
      <p style="margin:0;font-size:${nameFontSize}px;color:${nameColor};"><strong>${esc(sig.name)}</strong> <span style="color:#999;">|</span> <span style="color:${titleColor};">${esc(sig.role)}</span></p>
      <p style="margin:4px 0 0 0;font-size:${textFontSize}px;color:${textColor};">${esc(sig.company || '')} ${sig.website ? `<span style="color:#999;">|</span> <a href="https://${esc(sig.website)}" style="color:${linkColor};text-decoration:none;">${esc(sig.website)}</a>` : ''}</p>
    </td></tr>`);
  } else if (isMinimal) {
    rows.push(`<tr><td>
      <p style="margin:0;font-weight:bold;font-size:${nameFontSize - 4}px;color:${nameColor};">${esc(sig.name)}</p>
      <p style="margin:2px 0;font-size:${textFontSize}px;color:${textColor};">${esc(sig.role)}${sig.company ? ` | ${esc(sig.company)}` : ''}</p>
      <p style="margin:8px 0 0 0;font-size:${textFontSize}px;color:#999;">${sig.email ? esc(sig.email) : ''}${sig.phone ? ` | ${esc(sig.phone)}` : ''}</p>
    </td></tr>`);
  } else {
    // Full variant
    const dividerHtml = divStyle !== 'none'
      ? `border-bottom:${divWidth}px ${divStyle} ${divColor};`
      : '';
    rows.push(`<tr><td style="padding-bottom:${spacing}px;${dividerHtml}">
      <p style="margin:0;font-size:${nameFontSize}px;font-weight:bold;color:${nameColor};">${esc(sig.name)}</p>
      <p style="margin:4px 0 0 0;font-size:${titleFontSize}px;color:${titleColor};font-weight:500;">${esc(sig.role)}</p>
    </td></tr>`);
  }

  // -- Logo + Contact Info (full variant only) --
  if (!isMinimal && !isReply) {
    const logoPlaceholder = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="${logoW}" height="${logoH}"><rect fill="%23f0f0f0" width="${logoW}" height="${logoH}" rx="4"/><text x="${logoW / 2}" y="${logoH / 2 + 5}" text-anchor="middle" fill="%23999" font-family="Arial" font-size="10">Logo</text></svg>`;
    const logoSrc = sig.logoUrl || logoPlaceholder;

    const contactLines: string[] = [];
    if (sig.company) contactLines.push(`<p style="margin:0 0 8px 0;font-size:${titleFontSize}px;font-weight:600;color:${nameColor};">${esc(sig.company)}</p>`);
    if (sig.address) contactLines.push(`<p style="margin:0 0 4px 0;font-size:${textFontSize}px;color:${textColor};">${esc(sig.address)}</p>`);
    if (sig.phone) contactLines.push(`<p style="margin:8px 0 2px 0;font-size:${textFontSize}px;color:${textColor};"><span style="color:${linkColor};font-weight:bold;">P:</span> ${esc(sig.phone)}</p>`);
    if (sig.email) contactLines.push(`<p style="margin:2px 0;font-size:${textFontSize}px;color:${textColor};"><span style="color:${linkColor};font-weight:bold;">E:</span> ${esc(sig.email)}</p>`);
    if (sig.website) contactLines.push(`<p style="margin:2px 0;font-size:${textFontSize}px;color:${textColor};"><span style="color:${linkColor};font-weight:bold;">W:</span> <a href="https://${esc(sig.website)}" style="color:${linkColor};text-decoration:none;">${esc(sig.website)}</a></p>`);

    if (s.layout === 'vertical') {
      // Vertical layout: logo on top, contact below
      rows.push(`<tr><td style="padding:${spacing}px 0;">
        <img src="${logoSrc}" alt="${esc(sig.company || '')}" width="${logoW}" height="${logoH}" style="display:block;margin-bottom:${spacing}px;">
        ${contactLines.join('\n')}
      </td></tr>`);
    } else {
      // Horizontal layout (default): logo left, contact right
      rows.push(`<tr><td style="padding:${spacing}px 0;">
        <table cellpadding="0" cellspacing="0"><tr>
          <td style="padding-right:20px;vertical-align:top;">
            <img src="${logoSrc}" alt="${esc(sig.company || '')}" width="${logoW}" height="${logoH}" style="display:block;">
          </td>
          <td style="vertical-align:top;">${contactLines.join('\n')}</td>
        </tr></table>
      </td></tr>`);
    }
  }

  // -- Reply variant logo --
  if (isReply && sig.logoUrl) {
    const rW = Math.round(logoW * 0.8);
    const rH = Math.round(logoH * 0.8);
    rows.unshift(`<tr><td style="padding-bottom:10px;">
      <img src="${sig.logoUrl}" alt="${esc(sig.company || '')}" width="${rW}" height="${rH}" style="display:block;">
    </td></tr>`);
  }

  // -- Social Links --
  if (sig.socialLinks && sig.socialLinks.length > 0) {
    const icons = sig.socialLinks.map(link => {
      const platform = SOCIAL_PLATFORMS.find(p => p.id === link.platform);
      const bgColor = platform?.color || linkColor;
      const letter = platform?.letter || '•';
      return `<a href="${esc(link.url)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;width:24px;height:24px;border-radius:50%;background:${bgColor};color:#ffffff;text-align:center;line-height:24px;font-size:11px;text-decoration:none;margin-right:6px;font-family:${font};">${letter}</a>`;
    }).join('');

    rows.push(`<tr><td style="padding:${spacing}px 0 0 0;">${icons}</td></tr>`);
  }

  // -- Inline Banner --
  if (sig.bannerUrl) {
    const bW = sig.bannerWidth || 550;
    const bH = sig.bannerHeight || 150;
    const bannerImg = `<img src="${sig.bannerUrl}" alt="Banner" width="${bW}" height="${bH}" style="display:block;max-width:100%;">`;
    const bannerHtml = sig.bannerLinkUrl
      ? `<a href="${esc(sig.bannerLinkUrl)}" target="_blank" rel="noopener noreferrer">${bannerImg}</a>`
      : bannerImg;
    rows.push(`<tr><td style="padding:${spacing}px 0;">${bannerHtml}</td></tr>`);
  }

  // -- Confidentiality Notice --
  if (sig.confidentialityNotice) {
    rows.push(`<tr><td style="padding-top:10px;border-top:1px solid #eee;">
      <p style="margin:0;font-size:9px;color:#999;line-height:1.4;">${esc(sig.confidentialityNotice)}</p>
    </td></tr>`);
  }

  return `<table cellpadding="0" cellspacing="0" style="font-family:${font};max-width:600px;">${rows.join('')}</table>`;
}

/**
 * Legacy renderer: uses placeholder replacement on raw HTML template.
 * Used for signatures that don't have the `style` property set.
 */
export function renderLegacyHtml(sig: BrandSignature): string {
  const accentColor = sig.accentColor || DEFAULT_ACCENT;
  const darkColor = sig.accentColor || DEFAULT_DARK;
  const logoW = sig.logoWidth || 100;
  const logoH = sig.logoHeight || 100;
  const logoPlaceholder = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="${logoW}" height="${logoH}"><rect fill="%23f0f0f0" width="${logoW}" height="${logoH}" rx="4"/><text x="${logoW / 2}" y="${logoH / 2 + 5}" text-anchor="middle" fill="%23999" font-family="Arial" font-size="10">Logo</text></svg>`;

  return sig.html
    .replace(/\[NAME\]/g, sig.name)
    .replace(/\[ROLE\]/g, sig.role)
    .replace(/\[COMPANY\]/g, sig.company || 'Company')
    .replace(/\[EMAIL\]/g, sig.email || 'email@company.com')
    .replace(/\[PHONE\]/g, sig.phone || '+1 234 567 890')
    .replace(/\[WEBSITE\]/g, sig.website || 'www.company.com')
    .replace(/\[ADDRESS\]/g, sig.address || '123 Business St, City')
    .replace(/\[CONFIDENTIALITY\]/g, sig.confidentialityNotice || '')
    .replace(/\[LOGO_URL\]/g, sig.logoUrl || logoPlaceholder)
    .replace(/width="100" height="100"/g, `width="${logoW}" height="${logoH}"`)
    .replace(/width="80" height="80"/g, `width="${Math.round(logoW * 0.8)}" height="${Math.round(logoH * 0.8)}"`)
    .replace(new RegExp(DEFAULT_ACCENT, 'gi'), accentColor)
    .replace(new RegExp(DEFAULT_DARK, 'gi'), darkColor);
}

/** Render a signature, picking the right rendering path */
export function renderPreview(sig: BrandSignature): string {
  if (sig.style) {
    return renderSignatureHtml(sig);
  }
  return renderLegacyHtml(sig);
}

function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
