import { BrandSignature } from '@/types/brand';
import { SOCIAL_PLATFORMS, DEFAULT_DARK, DEFAULT_ACCENT } from './signatureConstants';
import demoBannerSrc from '@/assets/demo-email-banner.jpg';

/**
 * Programmatic HTML renderer for email signatures.
 * Generates email-client-compatible HTML (tables, inline styles).
 * Supports multiple structural layout templates.
 */
export function renderSignatureHtml(sig: BrandSignature): string {
  const s = sig.style || {};
  const layoutTemplate = s.layoutTemplate || 'classic';

  switch (layoutTemplate) {
    case 'centered': return renderCentered(sig);
    case 'side-banner': return renderSideBanner(sig);
    case 'card': return renderCard(sig);
    case 'inline': return renderInline(sig);
    case 'stacked': return renderStacked(sig);
    case 'two-column': return renderTwoColumn(sig);
    case 'banner-top': return renderBannerTop(sig);
    case 'classic':
    default: return renderClassic(sig);
  }
}

/* ─── Shared helpers ─── */

function getStyles(sig: BrandSignature) {
  const s = sig.style || {};
  return {
    font: s.fontFamily || 'Arial, sans-serif',
    nameColor: s.nameColor || sig.accentColor || DEFAULT_DARK,
    titleColor: s.titleColor || sig.accentColor || DEFAULT_ACCENT,
    textColor: s.textColor || '#666666',
    linkColor: s.linkColor || sig.accentColor || DEFAULT_ACCENT,
    divStyle: s.dividerStyle || 'solid',
    divColor: s.dividerColor || (s.linkColor || DEFAULT_ACCENT),
    divWidth: s.dividerWidth ?? 2,
    nameFontSize: s.nameFontSize || 18,
    titleFontSize: s.titleFontSize || 14,
    textFontSize: s.textFontSize || 12,
    spacing: s.spacing ?? 15,
    logoW: sig.logoWidth || 100,
    logoH: sig.logoHeight || 100,
    layout: s.layout || 'horizontal',
  };
}

function logoPlaceholderSvg(w: number, h: number): string {
  return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect fill="%23f0f0f0" width="${w}" height="${h}" rx="4"/><text x="${w / 2}" y="${h / 2 + 5}" text-anchor="middle" fill="%23999" font-family="Arial" font-size="10">Logo</text></svg>`;
}

function renderSocialIcons(sig: BrandSignature, linkColor: string, font: string, align: string = 'left'): string {
  if (!sig.socialLinks?.length) return '';
  const validLinks = sig.socialLinks.filter(l => l.url?.trim());
  if (!validLinks.length) return '';
  const icons = validLinks.map(link => {
    const platform = SOCIAL_PLATFORMS.find(p => p.id === link.platform);
    const bgColor = platform?.color || linkColor;
    const letter = platform?.letter || '•';
    const href = link.url.startsWith('http') ? esc(link.url) : `https://${esc(link.url)}`;
    return `<a href="${href}" target="_blank" rel="noopener noreferrer" style="display:inline-block;width:24px;height:24px;border-radius:50%;background:${bgColor};color:#ffffff;text-align:center;line-height:24px;font-size:11px;text-decoration:none;margin-right:6px;font-family:${font};">${letter}</a>`;
  }).join('');
  return `<tr><td style="text-align:${align};padding-top:8px;">${icons}</td></tr>`;
}

function renderConfidentiality(sig: BrandSignature): string {
  if (!sig.confidentialityNotice) return '';
  return `<tr><td style="padding-top:10px;border-top:1px solid #eee;">
    <p style="margin:0;font-size:9px;color:#999;line-height:1.4;">${esc(sig.confidentialityNotice)}</p>
  </td></tr>`;
}

function contactLine(label: string, value: string, textColor: string, linkColor: string, fontSize: number, isLink: boolean = false): string {
  if (!value) return '';
  const content = isLink
    ? `<a href="https://${esc(value)}" style="color:${linkColor};text-decoration:none;">${esc(value)}</a>`
    : esc(value);
  return `<p style="margin:2px 0;font-size:${fontSize}px;color:${textColor};"><span style="color:${linkColor};font-weight:bold;">${label}:</span> ${content}</p>`;
}

/* ─── CLASSIC: Traditional logo-left, contact-right ─── */
function renderClassic(sig: BrandSignature): string {
  const st = getStyles(sig);
  const logoSrc = sig.logoUrl || logoPlaceholderSvg(st.logoW, st.logoH);
  const isMinimal = sig.variant === 'minimal';
  const isReply = sig.variant === 'reply';
  let rows: string[] = [];

  if (isReply) {
    rows.push(`<tr><td style="padding-bottom:${st.spacing}px;">
      <p style="margin:0;font-size:${st.nameFontSize}px;color:${st.nameColor};"><strong>${esc(sig.name)}</strong> <span style="color:#999;">|</span> <span style="color:${st.titleColor};">${esc(sig.role)}</span></p>
      <p style="margin:4px 0 0 0;font-size:${st.textFontSize}px;color:${st.textColor};">${esc(sig.company || '')} ${sig.website ? `<span style="color:#999;">|</span> <a href="https://${esc(sig.website)}" style="color:${st.linkColor};text-decoration:none;">${esc(sig.website)}</a>` : ''}</p>
    </td></tr>`);
  } else if (isMinimal) {
    rows.push(`<tr><td>
      <p style="margin:0;font-weight:bold;font-size:${st.nameFontSize - 4}px;color:${st.nameColor};">${esc(sig.name)}</p>
      <p style="margin:2px 0;font-size:${st.textFontSize}px;color:${st.textColor};">${esc(sig.role)}${sig.company ? ` | ${esc(sig.company)}` : ''}</p>
      <p style="margin:8px 0 0 0;font-size:${st.textFontSize}px;color:#999;">${sig.email ? esc(sig.email) : ''}${sig.phone ? ` | ${esc(sig.phone)}` : ''}</p>
    </td></tr>`);
  } else {
    const dividerHtml = st.divStyle !== 'none' ? `border-bottom:${st.divWidth}px ${st.divStyle} ${st.divColor};` : '';
    rows.push(`<tr><td style="padding-bottom:${st.spacing}px;${dividerHtml}">
      <p style="margin:0;font-size:${st.nameFontSize}px;font-weight:bold;color:${st.nameColor};">${esc(sig.name)}</p>
      <p style="margin:4px 0 0 0;font-size:${st.titleFontSize}px;color:${st.titleColor};font-weight:500;">${esc(sig.role)}</p>
    </td></tr>`);

    const contactLines: string[] = [];
    if (sig.company) contactLines.push(`<p style="margin:0 0 8px 0;font-size:${st.titleFontSize}px;font-weight:600;color:${st.nameColor};">${esc(sig.company)}</p>`);
    if (sig.address) contactLines.push(`<p style="margin:0 0 4px 0;font-size:${st.textFontSize}px;color:${st.textColor};">${esc(sig.address)}</p>`);
    contactLines.push(contactLine('P', sig.phone || '', st.textColor, st.linkColor, st.textFontSize));
    contactLines.push(contactLine('E', sig.email || '', st.textColor, st.linkColor, st.textFontSize));
    if (sig.website) contactLines.push(contactLine('W', sig.website, st.textColor, st.linkColor, st.textFontSize, true));

    if (st.layout === 'vertical') {
      rows.push(`<tr><td style="padding:${st.spacing}px 0;">
        <img src="${logoSrc}" alt="${esc(sig.company || '')}" width="${st.logoW}" height="${st.logoH}" style="display:block;margin-bottom:${st.spacing}px;">
        ${contactLines.join('\n')}
      </td></tr>`);
    } else {
      rows.push(`<tr><td style="padding:${st.spacing}px 0;">
        <table cellpadding="0" cellspacing="0"><tr>
          <td style="padding-right:20px;vertical-align:top;">
            <img src="${logoSrc}" alt="${esc(sig.company || '')}" width="${st.logoW}" height="${st.logoH}" style="display:block;">
          </td>
          <td style="vertical-align:top;">${contactLines.join('\n')}</td>
        </tr></table>
      </td></tr>`);
    }
  }

  if (isReply && sig.logoUrl) {
    const rW = Math.round(st.logoW * 0.8);
    const rH = Math.round(st.logoH * 0.8);
    rows.unshift(`<tr><td style="padding-bottom:10px;">
      <img src="${sig.logoUrl}" alt="${esc(sig.company || '')}" width="${rW}" height="${rH}" style="display:block;">
    </td></tr>`);
  }

  rows.push(renderSocialIcons(sig, st.linkColor, st.font));
  rows.push(renderBannerRow(sig, st));
  rows.push(renderConfidentiality(sig));

  return wrap(rows, st.font);
}

/* ─── CENTERED: Everything center-aligned ─── */
function renderCentered(sig: BrandSignature): string {
  const st = getStyles(sig);
  const logoSrc = sig.logoUrl || logoPlaceholderSvg(st.logoW, st.logoH);
  let rows: string[] = [];

  rows.push(`<tr><td style="text-align:center;padding-bottom:${st.spacing}px;">
    <img src="${logoSrc}" alt="${esc(sig.company || '')}" width="${st.logoW}" height="${st.logoH}" style="display:inline-block;margin-bottom:12px;">
    <p style="margin:0;font-size:${st.nameFontSize}px;font-weight:bold;color:${st.nameColor};">${esc(sig.name)}</p>
    <p style="margin:4px 0 0 0;font-size:${st.titleFontSize}px;color:${st.titleColor};text-transform:uppercase;letter-spacing:1.5px;">${esc(sig.role)}</p>
  </td></tr>`);

  if (st.divStyle !== 'none') {
    rows.push(`<tr><td style="text-align:center;padding:4px 0;">
      <div style="width:60px;height:${st.divWidth}px;background:${st.divColor};margin:0 auto;"></div>
    </td></tr>`);
  }

  rows.push(`<tr><td style="text-align:center;padding:${st.spacing}px 0;">
    ${sig.company ? `<p style="margin:0 0 4px 0;font-size:${st.titleFontSize}px;font-weight:600;color:${st.nameColor};">${esc(sig.company)}</p>` : ''}
    ${sig.address ? `<p style="margin:0 0 4px 0;font-size:${st.textFontSize}px;color:${st.textColor};">${esc(sig.address)}</p>` : ''}
    <p style="margin:8px 0 0 0;font-size:${st.textFontSize}px;color:${st.textColor};">
      ${sig.phone ? esc(sig.phone) : ''}${sig.phone && sig.email ? ' &nbsp;•&nbsp; ' : ''}${sig.email ? esc(sig.email) : ''}
    </p>
    ${sig.website ? `<p style="margin:4px 0;font-size:${st.textFontSize}px;"><a href="https://${esc(sig.website)}" style="color:${st.linkColor};text-decoration:none;">${esc(sig.website)}</a></p>` : ''}
  </td></tr>`);

  rows.push(renderSocialIcons(sig, st.linkColor, st.font, 'center'));
  rows.push(renderBannerRow(sig, st));
  rows.push(renderConfidentiality(sig));

  return wrap(rows, st.font);
}

/* ─── SIDE-BANNER: Color accent bar on left ─── */
function renderSideBanner(sig: BrandSignature): string {
  const st = getStyles(sig);
  const logoSrc = sig.logoUrl || logoPlaceholderSvg(st.logoW, st.logoH);
  let innerRows: string[] = [];

  innerRows.push(`<p style="margin:0;font-size:${st.nameFontSize}px;font-weight:bold;color:${st.nameColor};">${esc(sig.name)}</p>`);
  innerRows.push(`<p style="margin:2px 0 ${st.spacing}px 0;font-size:${st.titleFontSize}px;color:${st.titleColor};">${esc(sig.role)}</p>`);
  
  if (sig.company) innerRows.push(`<p style="margin:0 0 4px 0;font-size:${st.textFontSize}px;font-weight:600;color:${st.nameColor};">${esc(sig.company)}</p>`);
  if (sig.email) innerRows.push(`<p style="margin:2px 0;font-size:${st.textFontSize}px;color:${st.textColor};">${esc(sig.email)}</p>`);
  if (sig.phone) innerRows.push(`<p style="margin:2px 0;font-size:${st.textFontSize}px;color:${st.textColor};">${esc(sig.phone)}</p>`);
  if (sig.website) innerRows.push(`<p style="margin:2px 0;font-size:${st.textFontSize}px;"><a href="https://${esc(sig.website)}" style="color:${st.linkColor};text-decoration:none;">${esc(sig.website)}</a></p>`);

  const socialHtml = sig.socialLinks?.filter(l => l.url?.trim()).map(link => {
    const platform = SOCIAL_PLATFORMS.find(p => p.id === link.platform);
    const bgColor = platform?.color || st.linkColor;
    const letter = platform?.letter || '•';
    const href = link.url.startsWith('http') ? esc(link.url) : `https://${esc(link.url)}`;
    return `<a href="${href}" target="_blank" rel="noopener noreferrer" style="display:inline-block;width:22px;height:22px;border-radius:50%;background:${bgColor};color:#fff;text-align:center;line-height:22px;font-size:10px;text-decoration:none;margin-right:5px;">${letter}</a>`;
  }).join('') || '';

  return `<table cellpadding="0" cellspacing="0" style="font-family:${st.font};max-width:600px;"><tr>
    <td style="width:4px;background:${st.divColor};"></td>
    <td style="padding:0 16px;">
      <table cellpadding="0" cellspacing="0"><tr>
        <td style="vertical-align:top;padding-right:16px;">
          <img src="${logoSrc}" alt="" width="${st.logoW}" height="${st.logoH}" style="display:block;">
        </td>
        <td style="vertical-align:top;">
          ${innerRows.join('\n')}
          ${socialHtml ? `<div style="padding-top:8px;">${socialHtml}</div>` : ''}
        </td>
      </tr></table>
    </td>
  </tr></table>${sig.confidentialityNotice ? `<table cellpadding="0" cellspacing="0" style="font-family:${st.font};max-width:600px;"><tr><td style="padding-top:10px;border-top:1px solid #eee;"><p style="margin:0;font-size:9px;color:#999;line-height:1.4;">${esc(sig.confidentialityNotice)}</p></td></tr></table>` : ''}`;
}

/* ─── CARD: Bordered card-style with background ─── */
function renderCard(sig: BrandSignature): string {
  const st = getStyles(sig);
  const logoSrc = sig.logoUrl || logoPlaceholderSvg(st.logoW, st.logoH);
  let rows: string[] = [];

  // Header with accent background
  rows.push(`<tr><td style="background:${st.divColor};padding:16px 20px;border-radius:6px 6px 0 0;">
    <p style="margin:0;font-size:${st.nameFontSize}px;font-weight:bold;color:#ffffff;">${esc(sig.name)}</p>
    <p style="margin:4px 0 0 0;font-size:${st.titleFontSize}px;color:rgba(255,255,255,0.85);">${esc(sig.role)}</p>
  </td></tr>`);

  // Body with contact info
  rows.push(`<tr><td style="padding:16px 20px;background:#f9fafb;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 6px 6px;">
    <table cellpadding="0" cellspacing="0" width="100%"><tr>
      <td style="vertical-align:top;padding-right:16px;width:${st.logoW}px;">
        <img src="${logoSrc}" alt="" width="${st.logoW}" height="${st.logoH}" style="display:block;border-radius:4px;">
      </td>
      <td style="vertical-align:top;">
        ${sig.company ? `<p style="margin:0 0 6px 0;font-size:${st.titleFontSize}px;font-weight:600;color:${st.nameColor};">${esc(sig.company)}</p>` : ''}
        ${sig.address ? `<p style="margin:0 0 4px 0;font-size:${st.textFontSize}px;color:${st.textColor};">${esc(sig.address)}</p>` : ''}
        ${sig.phone ? `<p style="margin:2px 0;font-size:${st.textFontSize}px;color:${st.textColor};">📞 ${esc(sig.phone)}</p>` : ''}
        ${sig.email ? `<p style="margin:2px 0;font-size:${st.textFontSize}px;color:${st.textColor};">✉️ ${esc(sig.email)}</p>` : ''}
        ${sig.website ? `<p style="margin:2px 0;font-size:${st.textFontSize}px;">🌐 <a href="https://${esc(sig.website)}" style="color:${st.linkColor};text-decoration:none;">${esc(sig.website)}</a></p>` : ''}
      </td>
    </tr></table>
  </td></tr>`);

  return `<table cellpadding="0" cellspacing="0" style="font-family:${st.font};max-width:600px;border-radius:6px;overflow:hidden;">${rows.join('')}</table>`;
}

/* ─── INLINE: Single-line compact format ─── */
function renderInline(sig: BrandSignature): string {
  const st = getStyles(sig);
  const parts: string[] = [];
  parts.push(`<strong style="color:${st.nameColor};font-size:${st.nameFontSize}px;">${esc(sig.name)}</strong>`);
  parts.push(`<span style="color:${st.titleColor};font-size:${st.titleFontSize}px;">${esc(sig.role)}</span>`);
  if (sig.company) parts.push(`<span style="color:${st.textColor};font-size:${st.textFontSize}px;">${esc(sig.company)}</span>`);
  if (sig.phone) parts.push(`<span style="color:${st.textColor};font-size:${st.textFontSize}px;">${esc(sig.phone)}</span>`);
  if (sig.email) parts.push(`<span style="color:${st.textColor};font-size:${st.textFontSize}px;">${esc(sig.email)}</span>`);
  if (sig.website) parts.push(`<a href="https://${esc(sig.website)}" style="color:${st.linkColor};font-size:${st.textFontSize}px;text-decoration:none;">${esc(sig.website)}</a>`);

  const sep = ` <span style="color:#ccc;margin:0 6px;">|</span> `;

  return `<table cellpadding="0" cellspacing="0" style="font-family:${st.font};max-width:600px;">
    <tr><td style="padding:${st.spacing}px 0;${st.divStyle !== 'none' ? `border-top:${st.divWidth}px ${st.divStyle} ${st.divColor};` : ''}">${parts.join(sep)}</td></tr>
    ${renderConfidentiality(sig)}
  </table>`;
}

/* ─── STACKED: Vertical stacked, no table nesting ─── */
function renderStacked(sig: BrandSignature): string {
  const st = getStyles(sig);
  const logoSrc = sig.logoUrl || logoPlaceholderSvg(st.logoW, st.logoH);
  let rows: string[] = [];

  rows.push(`<tr><td style="padding-bottom:12px;">
    <img src="${logoSrc}" alt="" width="${st.logoW}" height="${st.logoH}" style="display:block;">
  </td></tr>`);

  rows.push(`<tr><td style="padding-bottom:8px;">
    <p style="margin:0;font-size:${st.nameFontSize + 2}px;font-weight:bold;color:${st.nameColor};letter-spacing:-0.5px;">${esc(sig.name)}</p>
    <p style="margin:4px 0 0 0;font-size:${st.titleFontSize}px;color:${st.titleColor};text-transform:uppercase;letter-spacing:2px;font-weight:500;">${esc(sig.role)}</p>
  </td></tr>`);

  if (st.divStyle !== 'none') {
    rows.push(`<tr><td style="padding:4px 0 12px 0;">
      <div style="width:40px;height:${st.divWidth}px;background:${st.divColor};"></div>
    </td></tr>`);
  }

  if (sig.company) rows.push(`<tr><td><p style="margin:0 0 4px 0;font-size:${st.titleFontSize}px;font-weight:600;color:${st.nameColor};">${esc(sig.company)}</p></td></tr>`);
  if (sig.address) rows.push(`<tr><td><p style="margin:0 0 8px 0;font-size:${st.textFontSize}px;color:${st.textColor};">${esc(sig.address)}</p></td></tr>`);
  if (sig.phone) rows.push(`<tr><td><p style="margin:2px 0;font-size:${st.textFontSize}px;color:${st.textColor};">${esc(sig.phone)}</p></td></tr>`);
  if (sig.email) rows.push(`<tr><td><p style="margin:2px 0;font-size:${st.textFontSize}px;color:${st.textColor};">${esc(sig.email)}</p></td></tr>`);
  if (sig.website) rows.push(`<tr><td><p style="margin:2px 0;font-size:${st.textFontSize}px;"><a href="https://${esc(sig.website)}" style="color:${st.linkColor};text-decoration:none;">${esc(sig.website)}</a></p></td></tr>`);

  rows.push(renderSocialIcons(sig, st.linkColor, st.font));
  rows.push(renderBannerRow(sig, st));
  rows.push(renderConfidentiality(sig));

  return wrap(rows, st.font);
}

/* ─── TWO-COLUMN: Clean left/right split ─── */
function renderTwoColumn(sig: BrandSignature): string {
  const st = getStyles(sig);
  const logoSrc = sig.logoUrl || logoPlaceholderSvg(st.logoW, st.logoH);

  const leftCol = `
    <td style="vertical-align:top;padding-right:20px;border-right:${st.divWidth}px ${st.divStyle} ${st.divColor};">
      <img src="${logoSrc}" alt="" width="${st.logoW}" height="${st.logoH}" style="display:block;margin-bottom:10px;">
      <p style="margin:0;font-size:${st.nameFontSize}px;font-weight:bold;color:${st.nameColor};">${esc(sig.name)}</p>
      <p style="margin:4px 0 0 0;font-size:${st.titleFontSize}px;color:${st.titleColor};">${esc(sig.role)}</p>
    </td>`;

  const rightLines: string[] = [];
  if (sig.company) rightLines.push(`<p style="margin:0 0 8px 0;font-size:${st.titleFontSize}px;font-weight:600;color:${st.nameColor};">${esc(sig.company)}</p>`);
  if (sig.address) rightLines.push(`<p style="margin:0 0 6px 0;font-size:${st.textFontSize}px;color:${st.textColor};">${esc(sig.address)}</p>`);
  if (sig.phone) rightLines.push(`<p style="margin:2px 0;font-size:${st.textFontSize}px;color:${st.textColor};">T: ${esc(sig.phone)}</p>`);
  if (sig.email) rightLines.push(`<p style="margin:2px 0;font-size:${st.textFontSize}px;color:${st.textColor};">E: ${esc(sig.email)}</p>`);
  if (sig.website) rightLines.push(`<p style="margin:2px 0;font-size:${st.textFontSize}px;"><a href="https://${esc(sig.website)}" style="color:${st.linkColor};text-decoration:none;">${esc(sig.website)}</a></p>`);

  const socialHtml = sig.socialLinks?.filter(l => l.url?.trim()).map(link => {
    const platform = SOCIAL_PLATFORMS.find(p => p.id === link.platform);
    const bgColor = platform?.color || st.linkColor;
    const letter = platform?.letter || '•';
    const href = link.url.startsWith('http') ? esc(link.url) : `https://${esc(link.url)}`;
    return `<a href="${href}" target="_blank" rel="noopener noreferrer" style="display:inline-block;width:22px;height:22px;border-radius:3px;background:${bgColor};color:#fff;text-align:center;line-height:22px;font-size:10px;text-decoration:none;margin-right:4px;">${letter}</a>`;
  }).join('') || '';

  const rightCol = `
    <td style="vertical-align:top;padding-left:20px;">
      ${rightLines.join('\n')}
      ${socialHtml ? `<div style="padding-top:10px;">${socialHtml}</div>` : ''}
    </td>`;

  const bannerRow = renderBannerRow(sig, st);

  return `<table cellpadding="0" cellspacing="0" style="font-family:${st.font};max-width:600px;">
    <tr>${leftCol}${rightCol}</tr>
    ${bannerRow}
    ${renderConfidentiality(sig)}
  </table>`;
}

/* ─── BANNER-TOP: Accent color banner at top with centered name ─── */
function renderBannerTop(sig: BrandSignature): string {
  const st = getStyles(sig);
  const logoSrc = sig.logoUrl || logoPlaceholderSvg(st.logoW, st.logoH);
  let rows: string[] = [];

  // Top accent bar
  rows.push(`<tr><td style="background:${st.divColor};height:6px;font-size:0;line-height:0;">&nbsp;</td></tr>`);

  // Logo + name row
  rows.push(`<tr><td style="padding:16px 0 8px 0;">
    <table cellpadding="0" cellspacing="0"><tr>
      <td style="vertical-align:middle;padding-right:14px;">
        <img src="${logoSrc}" alt="" width="${Math.round(st.logoW * 0.7)}" height="${Math.round(st.logoH * 0.7)}" style="display:block;">
      </td>
      <td style="vertical-align:middle;">
        <p style="margin:0;font-size:${st.nameFontSize}px;font-weight:bold;color:${st.nameColor};">${esc(sig.name)}</p>
        <p style="margin:2px 0 0 0;font-size:${st.titleFontSize}px;color:${st.titleColor};">${esc(sig.role)}${sig.company ? ` · ${esc(sig.company)}` : ''}</p>
      </td>
    </tr></table>
  </td></tr>`);

  // Contact row
  const contactParts: string[] = [];
  if (sig.phone) contactParts.push(esc(sig.phone));
  if (sig.email) contactParts.push(esc(sig.email));
  if (sig.website) contactParts.push(`<a href="https://${esc(sig.website)}" style="color:${st.linkColor};text-decoration:none;">${esc(sig.website)}</a>`);

  if (contactParts.length) {
    rows.push(`<tr><td style="padding:4px 0;font-size:${st.textFontSize}px;color:${st.textColor};">
      ${contactParts.join(' &nbsp;·&nbsp; ')}
    </td></tr>`);
  }

  if (sig.address) {
    rows.push(`<tr><td style="padding:2px 0;font-size:${st.textFontSize}px;color:${st.textColor};">${esc(sig.address)}</td></tr>`);
  }

  rows.push(renderSocialIcons(sig, st.linkColor, st.font));
  rows.push(renderBannerRow(sig, st));
  rows.push(renderConfidentiality(sig));

  return wrap(rows, st.font);
}

/* ─── Helpers ─── */

function renderBannerRow(sig: BrandSignature, st: ReturnType<typeof getStyles>): string {
  const bannerSrc = sig.bannerUrl || (sig.variant === 'full' ? demoBannerSrc : '');
  if (!bannerSrc) return '';
  const bW = sig.bannerWidth || 600;
  const bH = sig.bannerHeight || 150;
  const bannerImg = `<img src="${bannerSrc}" alt="Banner" width="${bW}" height="${bH}" style="display:block;max-width:100%;">`;
  const bannerHtml = sig.bannerLinkUrl
    ? `<a href="${esc(sig.bannerLinkUrl)}" target="_blank" rel="noopener noreferrer">${bannerImg}</a>`
    : bannerImg;
  return `<tr><td style="padding:${st.spacing}px 0;">${bannerHtml}</td></tr>`;
}

function wrap(rows: string[], font: string): string {
  return `<table cellpadding="0" cellspacing="0" style="font-family:${font};max-width:600px;">${rows.join('')}</table>`;
}

/**
 * Legacy renderer: uses placeholder replacement on raw HTML template.
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
  if (sig.style) return renderSignatureHtml(sig);
  if (sig.html && sig.html.trim().length > 0) return renderLegacyHtml(sig);
  return renderSignatureHtml(sig);
}

function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
