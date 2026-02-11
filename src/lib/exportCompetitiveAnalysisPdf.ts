import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import type { CompetitiveAnalysisReportData } from '@/types/competitiveAnalysis';
import {
  PDF_COLORS,
  PDF_FONTS,
  PDF_TYPOGRAPHY,
  PDF_SPACING,
  applyPdfContainerStyles,
  getScoreColor,
  formatPdfDate,
  getSectionHeaderStyles,
  getCardStyles,
  getTableStyles,
  getBadgeStyles,
} from './pdfStyleConfig';

export interface ExportOptions {
  entityName: string;
  entityType: 'brand' | 'product' | 'event';
  theme?: 'light' | 'dark';
}

// ─── Shorthand references ───────────────────────────────
const C = PDF_COLORS;
const T = PDF_TYPOGRAPHY;
const S = PDF_SPACING;

// ─── Helpers ────────────────────────────────────────────
const safe = (arr: unknown): string[] =>
  Array.isArray(arr) ? arr.filter(Boolean).map(String) : [];
const str = (v: unknown, fb = 'N/A'): string =>
  typeof v === 'string' && v ? v : fb;

const li = (items: string[], color = C.text.secondary) =>
  items
    .map(
      (i) =>
        `<li style="font-size:${T.small.size};color:${color};margin-bottom:6px;line-height:${T.small.lineHeight};">${i}</li>`
    )
    .join('');

const sectionTitle = (text: string) =>
  `<h2 style="${getSectionHeaderStyles()}">${text}</h2>`;

const htmlBar = (label: string, value: number, max = 10) => {
  const pct = Math.round((value / max) * 100);
  const color =
    value >= 8
      ? C.accent.success
      : value >= 6
        ? C.accent.warning
        : value >= 4
          ? C.accent.orange
          : C.accent.danger;
  return `
    <tr>
      <td style="padding:${S.sm} ${S.md};width:170px;font-size:${T.small.size};font-weight:500;color:${C.text.secondary};">${label}</td>
      <td style="padding:${S.sm} ${S.md};">
        <div style="background:${C.border.light};border-radius:999px;height:14px;overflow:hidden;position:relative;">
          <div style="background:${color};width:${pct}%;height:100%;border-radius:999px;"></div>
        </div>
      </td>
      <td style="padding:${S.sm} ${S.md};width:55px;text-align:right;font-size:${T.small.size};font-weight:700;color:${color};">${value}/${max}</td>
    </tr>`;
};

const badge = (text: string, fg: string, bg: string) =>
  `<span style="${getBadgeStyles(fg, bg)};text-transform:uppercase;letter-spacing:.5px;font-weight:600;">${text}</span>`;

const subheading = (text: string) =>
  `<p style="font-size:${T.body.size};font-weight:700;color:${C.text.secondary};margin:0 0 ${S.md};">${text}</p>`;

// ─── PDF Section Builders ───────────────────────────────
const buildCover = (
  report: CompetitiveAnalysisReportData,
  entityName: string,
  entityType: string,
  accentColor: string,
  scoreColor: string,
  date: string
) => `
  <div data-pdf-section style="text-align:center;padding:60px ${S['4xl']};">
    <div style="display:inline-block;width:60px;height:4px;background:${accentColor};border-radius:2px;margin-bottom:${S['3xl']};"></div>
    <h1 style="font-size:${T.title.size};font-weight:800;color:${C.text.primary};margin:0 0 ${S.sm};letter-spacing:-.5px;">Competitive Analysis</h1>
    <p style="font-size:${T.h2.size};color:${C.text.muted};margin:0 0 ${S.xs};">${entityName}</p>
    <p style="font-size:${T.small.size};color:${C.text.subtle};margin:0;text-transform:uppercase;letter-spacing:1px;">${entityType} Report</p>
    <div style="margin:48px auto;width:140px;height:140px;border-radius:50%;background:linear-gradient(135deg,${accentColor}22,${accentColor}08);border:3px solid ${scoreColor};text-align:center;padding-top:35px;box-sizing:border-box;">
      <div style="font-size:52px;font-weight:800;color:${scoreColor};line-height:1;">${report.score}</div>
      <div style="font-size:${T.tiny.size};color:${C.text.subtle};text-transform:uppercase;letter-spacing:1.5px;margin-top:${S.xs};">Score</div>
    </div>
    <p style="font-size:${T.caption.size};color:${C.text.subtle};">Generated ${date}</p>
  </div>`;

const buildExecSummary = (report: CompetitiveAnalysisReportData) => `
  <div data-pdf-section style="padding:${S.xl} 0;">
    ${sectionTitle('Executive Summary')}
    <p style="font-size:${T.body.size};color:${C.text.secondary};line-height:1.7;margin:0 0 ${S['2xl']};">${str(report.executiveSummary?.overview)}</p>
    <div style="${getCardStyles('success')};border-left:4px solid ${C.accent.success};border-radius:0 10px 10px 0;margin-bottom:${S['2xl']};">
      <p style="font-size:${T.tiny.size};font-weight:700;color:#166534;text-transform:uppercase;letter-spacing:.8px;margin:0 0 6px;">Current Position</p>
      <p style="font-size:${T.small.size};color:#15803d;margin:0;line-height:${T.small.lineHeight};">${str(report.executiveSummary?.currentPosition)}</p>
    </div>
    ${subheading('Top Priorities')}
    <ul style="margin:0;padding-left:18px;">${li(safe(report.executiveSummary?.topPriorities))}</ul>
  </div>`;

const buildMarketPerception = (report: CompetitiveAnalysisReportData) => {
  const tableStyles = getTableStyles();
  return `
  <div data-pdf-section style="padding:${S.xl} 0;">
    ${sectionTitle('Market Perception')}
    <table style="${tableStyles.table};margin-bottom:${S.xl};">
      <tr>
        <td style="width:50%;vertical-align:top;padding-right:${S.md};">
          <div style="${getCardStyles('success')};min-height:120px;">
            <p style="font-size:${T.small.size};font-weight:700;color:#166534;margin:0 0 ${S.md};">✓ Key Strengths</p>
            <ul style="margin:0;padding-left:14px;">${li(safe(report.marketPerception?.keyStrengths), '#15803d')}</ul>
          </div>
        </td>
        <td style="width:50%;vertical-align:top;padding-left:${S.md};">
          <div style="${getCardStyles('warning')};min-height:120px;">
            <p style="font-size:${T.small.size};font-weight:700;color:#92400e;margin:0 0 ${S.md};">⚠ Critical Gaps</p>
            <ul style="margin:0;padding-left:14px;">${li(safe(report.marketPerception?.criticalGaps), '#a16207')}</ul>
          </div>
        </td>
      </tr>
    </table>
    <div style="${getCardStyles('danger')};">
      <p style="font-size:${T.small.size};font-weight:700;color:#991b1b;margin:0 0 ${S.md};">⚡ Risks</p>
      <ul style="margin:0;padding-left:14px;">${li(safe(report.marketPerception?.risks), '#b91c1c')}</ul>
    </div>
  </div>`;
};

const buildSwMatrix = (report: CompetitiveAnalysisReportData) => {
  const matrixEntries = [
    ['Design Sophistication', report.strengthsWeaknesses?.designSophistication],
    ['Visual Consistency', report.strengthsWeaknesses?.visualConsistency],
    ['User Centricity', report.strengthsWeaknesses?.userCentricity],
    ['Innovation', report.strengthsWeaknesses?.innovation],
    ['Clarity', report.strengthsWeaknesses?.clarity],
    ['Emotional Connection', report.strengthsWeaknesses?.emotionalConnection],
    ['Professional Polish', report.strengthsWeaknesses?.professionalPolish],
  ].sort((a, b) => (Number(b[1]) || 0) - (Number(a[1]) || 0));

  return `
    <div data-pdf-section style="padding:${S.xl} 0;">
      ${sectionTitle('Strengths & Weaknesses Matrix')}
      <table style="width:100%;border-collapse:collapse;">
        <tbody>
          ${matrixEntries.map(([label, val]) => htmlBar(String(label), Number(val) || 0)).join('')}
        </tbody>
      </table>
    </div>`;
};

const buildRadarSvg = (items: [string, number][]) => {
  const cx = 200, cy = 200, r = 150;
  const n = items.length;
  const angleStep = (2 * Math.PI) / n;
  const startAngle = -Math.PI / 2; // top

  const point = (i: number, val: number) => {
    const a = startAngle + i * angleStep;
    const d = (val / 10) * r;
    return [cx + d * Math.cos(a), cy + d * Math.sin(a)];
  };

  // Grid rings at 2, 4, 6, 8, 10
  const rings = [2, 4, 6, 8, 10].map((v) => {
    const pts = items.map((_, i) => point(i, v));
    return `<polygon points="${pts.map((p) => p.join(',')).join(' ')}" fill="none" stroke="#d1d5db" stroke-width="1"/>`;
  }).join('');

  // Axis lines
  const axes = items.map((_, i) => {
    const [x, y] = point(i, 10);
    return `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#d1d5db" stroke-width="1"/>`;
  }).join('');

  // Labels
  const labels = items.map(([label], i) => {
    const a = startAngle + i * angleStep;
    const lx = cx + (r + 30) * Math.cos(a);
    const ly = cy + (r + 30) * Math.sin(a);
    const anchor = Math.abs(Math.cos(a)) < 0.1 ? 'middle' : Math.cos(a) > 0 ? 'start' : 'end';
    return `<text x="${lx}" y="${ly}" text-anchor="${anchor}" dominant-baseline="middle" font-size="12" fill="${C.text.secondary}" font-weight="500">${label}</text>`;
  }).join('');

  // Data polygon
  const dataPts = items.map(([, v], i) => point(i, v));
  const dataPolygon = `<polygon points="${dataPts.map((p) => p.join(',')).join(' ')}" fill="${C.accent.primary}" fill-opacity="0.25" stroke="${C.accent.primary}" stroke-width="2.5"/>`;

  // Data dots
  const dots = dataPts.map(([x, y]) =>
    `<circle cx="${x}" cy="${y}" r="4" fill="${C.background.white}" stroke="${C.accent.primary}" stroke-width="2"/>`
  ).join('');

  // Value labels on dots
  const valLabels = items.map(([, v], i) => {
    const [x, y] = point(i, v);
    const a = startAngle + i * angleStep;
    const ox = 14 * Math.cos(a);
    const oy = 14 * Math.sin(a);
    return `<text x="${x + ox}" y="${y + oy}" text-anchor="middle" dominant-baseline="middle" font-size="11" fill="${C.accent.primary}" font-weight="700">${v}</text>`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400" style="display:block;margin:0 auto;">
    ${rings}${axes}${dataPolygon}${dots}${valLabels}${labels}
  </svg>`;
};

const buildPositioning = (report: CompetitiveAnalysisReportData) => {
  const pm = (report.brandPositioning?.personalityMatrix || {}) as any;
  const personalityItems: [string, number][] = [
    ['Innovation', Number(pm.innovationScore) || 0],
    ['Approachability', Number(pm.approachabilityScore) || 0],
    ['Technical', Number(pm.technicalScore) || 0],
    ['Boldness', Number(pm.boldnessScore) || 0],
    ['Enterprise', Number(pm.enterpriseScore) || 0],
    ['Global', Number(pm.globalScore) || 0],
  ];

  return `
    <div data-pdf-section style="padding:${S.xl} 0;">
      ${sectionTitle('Brand Positioning')}
      ${subheading('Brand Personality Matrix')}
      <p style="font-size:${T.small.size};color:${C.text.muted};margin:0 0 ${S.lg};">How the brand is positioned across key dimensions</p>
      ${buildRadarSvg(personalityItems)}
      <div style="margin-top:${S['2xl']};">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="width:50%;vertical-align:top;padding-right:${S.md};">
              <p style="font-size:${T.small.size};font-weight:700;color:${C.accent.primary};margin:0 0 ${S.sm};">Target Audience Signals</p>
              <ul style="margin:0;padding-left:14px;">${li(safe(report.brandPositioning?.targetAudienceSignals), C.accent.primary)}</ul>
            </td>
            <td style="width:50%;vertical-align:top;padding-left:${S.md};">
              <p style="font-size:${T.small.size};font-weight:700;color:${C.accent.secondary};margin:0 0 ${S.sm};">Differentiation Factors</p>
              <ul style="margin:0;padding-left:14px;">${li(safe(report.brandPositioning?.differentiation), C.accent.secondary)}</ul>
            </td>
          </tr>
        </table>
      </div>
      ${
        safe(report.brandPositioning?.trustIndicators).length > 0
          ? `
        <div style="margin-top:${S.xl};">
          <p style="font-size:${T.small.size};font-weight:700;color:${C.text.secondary};margin:0 0 ${S.sm};">Trust Indicators</p>
          <div>${safe(report.brandPositioning?.trustIndicators).map((t) => badge(t, '#065f46', '#d1fae5')).join(' ')}</div>
        </div>
      `
          : ''
      }
    </div>`;
};

const buildRecommendations = (report: CompetitiveAnalysisReportData) => {
  const tableStyles = getTableStyles();

  const designPriorities = safe(report.recommendations?.designPriorities)
    .map((p: any, i: number) => {
      const impactColor =
        p?.impact === 'high' ? C.accent.success : p?.impact === 'medium' ? C.accent.warning : C.text.subtle;
      const effortColor =
        p?.effort === 'low' ? C.accent.success : p?.effort === 'medium' ? C.accent.warning : C.accent.danger;
      return `
      <tr>
        <td style="${tableStyles.td};font-size:${T.small.size};color:${C.text.secondary};">
          <strong style="color:${C.text.primary};">${i + 1}.</strong> ${str(p?.title, 'Untitled')}
        </td>
        <td style="${tableStyles.td};text-align:center;">
          ${badge(str(p?.impact, '-'), impactColor, impactColor + '18')}
        </td>
        <td style="${tableStyles.td};text-align:center;">
          ${badge(str(p?.effort, '-'), effortColor, effortColor + '18')}
        </td>
      </tr>`;
    })
    .join('');

  const br = report.recommendations?.brandRefinements;
  const refinementCard = (title: string, text: string, icon: string) => `
    <td style="width:50%;vertical-align:top;padding:6px;">
      <div style="background:${C.background.light};padding:14px ${S.lg};border-radius:8px;border:1px solid ${C.border.lighter};">
        <p style="font-size:${T.caption.size};font-weight:700;color:${C.text.secondary};margin:0 0 ${S.xs};">${icon} ${title}</p>
        <p style="font-size:${T.caption.size};color:${C.text.muted};margin:0;line-height:${T.caption.lineHeight};">${str(text)}</p>
      </div>
    </td>`;

  return `
    <div data-pdf-section style="padding:${S.xl} 0;">
      ${sectionTitle('Strategic Recommendations')}
      ${subheading('Design Priorities')}
      <table style="${tableStyles.table};margin-bottom:${S['3xl']};">
        <thead>
          <tr style="background:${C.background.light};">
            <th style="${tableStyles.th};text-transform:uppercase;letter-spacing:.5px;">Priority</th>
            <th style="${tableStyles.th};text-align:center;text-transform:uppercase;letter-spacing:.5px;">Impact</th>
            <th style="${tableStyles.th};text-align:center;text-transform:uppercase;letter-spacing:.5px;">Effort</th>
          </tr>
        </thead>
        <tbody>${designPriorities}</tbody>
      </table>
      ${subheading('Brand Refinements')}
      <table style="width:100%;border-collapse:collapse;margin-bottom:${S['3xl']};">
        <tr>${refinementCard('Logo', str(br?.logo), '◆')}${refinementCard('Colors', str(br?.colors), '◉')}</tr>
        <tr>${refinementCard('Typography', str(br?.typography), '𝐓')}${refinementCard('Imagery', str(br?.imagery), '▣')}</tr>
      </table>
      ${subheading('Positioning Opportunities')}
      <ul style="margin:0 0 ${S.xl};padding-left:18px;">${li(safe(report.recommendations?.positioningOpportunities))}</ul>
      ${
        safe(report.recommendations?.digitalImprovements).length > 0
          ? `
        ${subheading('Digital Improvements')}
        <ul style="margin:0 0 ${S.xl};padding-left:18px;">${li(safe(report.recommendations?.digitalImprovements))}</ul>
      `
          : ''
      }
    </div>`;
};

const buildActionPlan = (report: CompetitiveAnalysisReportData, date: string) => {
  const phase = (title: string, items: string[], bg: string, headColor: string, textColor: string) => `
    <td style="width:33.33%;vertical-align:top;padding:6px;">
      <div style="background:${bg};padding:${S.xl};border-radius:10px;min-height:140px;">
        <p style="font-size:${T.body.size};font-weight:700;color:${headColor};margin:0 0 ${S.md};">${title}</p>
        <ul style="margin:0;padding-left:14px;">${li(items, textColor)}</ul>
      </div>
    </td>`;

  return `
    <div data-pdf-section style="padding:${S.xl} 0;">
      ${sectionTitle('30 / 60 / 90 Day Action Plan')}
      <table style="width:100%;border-collapse:collapse;margin-bottom:${S['3xl']};">
        <tr>
          ${phase('30 Days', safe(report.executiveSummary?.actionPlan?.thirtyDay), '#dbeafe', '#1e40af', '#1e3a8a')}
          ${phase('60 Days', safe(report.executiveSummary?.actionPlan?.sixtyDay), '#fef3c7', '#92400e', '#78350f')}
          ${phase('90 Days', safe(report.executiveSummary?.actionPlan?.ninetyDay), '#d1fae5', '#065f46', '#064e3b')}
        </tr>
      </table>
      <div style="background:#f0f9ff;border:1px solid #bae6fd;padding:${S.xl};border-radius:10px;">
        <p style="font-size:${T.small.size};font-weight:700;color:#0369a1;margin:0 0 ${S.md};">📊 Success Metrics</p>
        <ul style="margin:0;padding-left:14px;">${li(safe(report.executiveSummary?.successMetrics), '#0284c7')}</ul>
      </div>
    </div>
    <div data-pdf-section style="text-align:center;padding-top:${S['3xl']};border-top:1px solid ${C.border.light};">
      <p style="font-size:${T.tiny.size};color:${C.text.subtle};margin:0;">Generated by Brand Intelligence System · ${date}</p>
    </div>`;
};

// ─── Export Function (section-based jsPDF + html2canvas) ─────────
export const exportCompetitiveAnalysisPdf = async (
  report: CompetitiveAnalysisReportData,
  options: ExportOptions,
  onProgress?: (status: string) => void
): Promise<void> => {
  onProgress?.('Preparing PDF...');

  const { entityName, entityType } = options;
  const scoreColor = getScoreColor(report.score);
  const date = formatPdfDate();
  const accentColor = C.entity[entityType as keyof typeof C.entity] || C.accent.primary;

  // Build all section HTML
  const allHtml = [
    buildCover(report, entityName, entityType, accentColor, scoreColor, date),
    buildExecSummary(report),
    buildMarketPerception(report),
    buildSwMatrix(report),
    buildPositioning(report),
    buildRecommendations(report),
    buildActionPlan(report, date),
  ].join('');

  // Create container — on-screen for html2canvas, hidden via opacity
  const container = document.createElement('div');
  container.innerHTML = `<div style="font-family:${PDF_FONTS.primary};color:${C.text.primary};line-height:1.6;padding:36px 40px;background:${C.background.white};width:750px;">${allHtml}</div>`;
  applyPdfContainerStyles(container, 'a4');
  document.body.appendChild(container);

  // Force full layout computation
  void container.offsetHeight;
  void container.offsetWidth;
  container.getBoundingClientRect();
  await new Promise((resolve) => setTimeout(resolve, 1200));

  // A4 dimensions in mm
  const A4_W = 210;
  const A4_H = 297;
  const MARGIN = 10;
  const CONTENT_W = A4_W - MARGIN * 2;
  const GAP = 4;
  const PAGE_CONTENT_H = A4_H - MARGIN * 2;

  const sections = Array.from(container.querySelectorAll('[data-pdf-section]')) as HTMLElement[];
  console.log(`[PDF Export] Found ${sections.length} sections to capture`);

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let currentY = MARGIN;

  onProgress?.('Generating PDF...');

  try {
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const rect = section.getBoundingClientRect();
      console.log(`[PDF Export] Section ${i}: ${rect.width}x${rect.height}`);

      if (rect.height === 0 || rect.width === 0) {
        console.warn(`[PDF Export] Skipping empty section ${i}`);
        continue;
      }

      const RENDER_SCALE = 1.5;
      const canvas = await html2canvas(section, {
        scale: RENDER_SCALE,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: C.background.white,
      });

      console.log(`[PDF Export] Canvas ${i}: ${canvas.width}x${canvas.height}`);

      const scaleFactor = CONTENT_W / (canvas.width / RENDER_SCALE);
      const heightMM = (canvas.height / RENDER_SCALE) * scaleFactor;
      const remaining = A4_H - MARGIN - currentY;

      // Section fits on current page
      if (heightMM <= remaining) {
        const imgData = canvas.toDataURL('image/jpeg', 0.75);
        pdf.addImage(imgData, 'JPEG', MARGIN, currentY, CONTENT_W, heightMM);
        currentY += heightMM + GAP;
      }
      // Section doesn't fit but is smaller than a full page — move to next page
      else if (heightMM <= PAGE_CONTENT_H) {
        pdf.addPage();
        currentY = MARGIN;
        const imgData = canvas.toDataURL('image/jpeg', 0.75);
        pdf.addImage(imgData, 'JPEG', MARGIN, currentY, CONTENT_W, heightMM);
        currentY += heightMM + GAP;
      }
      // Section is taller than a full page — place on fresh page
      else {
        if (currentY > MARGIN) {
          pdf.addPage();
          currentY = MARGIN;
        }
        const imgData = canvas.toDataURL('image/jpeg', 0.75);
        pdf.addImage(imgData, 'JPEG', MARGIN, currentY, CONTENT_W, heightMM);
        currentY += heightMM + GAP;
        // If it overflows the page, the next section will trigger a new page
      }
    }

    const filename = `${entityName.replace(/\s+/g, '_')}_Competitive_Analysis.pdf`;
    pdf.save(filename);
    onProgress?.('PDF exported successfully!');
  } catch (error) {
    console.error('PDF export failed:', error);
    throw new Error('Failed to export PDF');
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
};
