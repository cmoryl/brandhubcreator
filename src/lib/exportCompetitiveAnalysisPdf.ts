import type { jsPDF } from 'jspdf';
import type { CompetitiveAnalysisReportData } from '@/types/competitiveAnalysis';
import {
  PDF_COLORS,
  PDF_TYPOGRAPHY,
  getScoreColor,
  formatPdfDate,
} from './pdfStyleConfig';

export interface ExportOptions {
  entityName: string;
  entityType: 'brand' | 'product' | 'event';
  theme?: 'light' | 'dark';
}

const C = PDF_COLORS;

const safe = (arr: unknown): string[] =>
  Array.isArray(arr) ? arr.filter(Boolean).map(String) : [];
const str = (v: unknown, fb = 'N/A'): string =>
  typeof v === 'string' && v ? v : fb;

// ─── Color helpers ──────────────────────────────────────
const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};

const setColor = (pdf: jsPDF, hex: string) => pdf.setTextColor(...hexToRgb(hex));
const setDraw = (pdf: jsPDF, hex: string) => pdf.setDrawColor(...hexToRgb(hex));
const setFill = (pdf: jsPDF, hex: string) => pdf.setFillColor(...hexToRgb(hex));

// ─── Layout constants ───────────────────────────────────
const A4_W = 210;
const A4_H = 297;
const M = 15; // margin
const CW = A4_W - M * 2; // content width
const COL_W = (CW - 6) / 2; // two-column width with gap

// ─── Text helpers ───────────────────────────────────────
const ensureSpace = (pdf: jsPDF, y: number, needed: number): number => {
  if (y + needed > A4_H - M) {
    pdf.addPage();
    return M;
  }
  return y;
};

const wrapText = (pdf: jsPDF, text: string, maxWidth: number): string[] => {
  return pdf.splitTextToSize(text, maxWidth) as string[];
};

const drawSectionTitle = (pdf: jsPDF, title: string, y: number): number => {
  y = ensureSpace(pdf, y, 14);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  setColor(pdf, C.text.primary);
  pdf.text(title, M, y);
  y += 2;
  setDraw(pdf, C.border.light);
  pdf.setLineWidth(0.5);
  pdf.line(M, y, A4_W - M, y);
  return y + 6;
};

const drawSubheading = (pdf: jsPDF, text: string, y: number): number => {
  y = ensureSpace(pdf, y, 10);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  setColor(pdf, C.text.secondary);
  pdf.text(text, M, y);
  return y + 6;
};

const drawParagraph = (pdf: jsPDF, text: string, y: number, x = M, width = CW, color = C.text.secondary): number => {
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  setColor(pdf, color);
  const lines = wrapText(pdf, text, width);
  for (const line of lines) {
    y = ensureSpace(pdf, y, 5);
    pdf.text(line, x, y);
    y += 4.2;
  }
  return y + 2;
};

const drawBullets = (pdf: jsPDF, items: string[], y: number, x = M, width = CW - 4, color = C.text.secondary): number => {
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9.5);
  setColor(pdf, color);
  for (const item of items) {
    const lines = wrapText(pdf, item, width);
    y = ensureSpace(pdf, y, lines.length * 4 + 2);
    pdf.text('•', x, y);
    for (let j = 0; j < lines.length; j++) {
      pdf.text(lines[j], x + 4, y);
      if (j < lines.length - 1) y += 4;
    }
    y += 5;
  }
  return y;
};

const drawCard = (pdf: jsPDF, x: number, y: number, w: number, h: number, bgHex: string, borderHex?: string) => {
  setFill(pdf, bgHex);
  pdf.roundedRect(x, y, w, h, 2, 2, 'F');
  if (borderHex) {
    setDraw(pdf, borderHex);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(x, y, w, h, 2, 2, 'S');
  }
};

const drawBadge = (pdf: jsPDF, text: string, x: number, y: number, fg: string, bg: string): number => {
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.5);
  const tw = pdf.getTextWidth(text.toUpperCase()) + 5;
  setFill(pdf, bg);
  pdf.roundedRect(x, y - 3, tw, 5, 1.5, 1.5, 'F');
  setColor(pdf, fg);
  pdf.text(text.toUpperCase(), x + 2.5, y);
  return tw + 2;
};

// ─── Section Builders ───────────────────────────────────

const drawCover = (pdf: jsPDF, report: CompetitiveAnalysisReportData, entityName: string, entityType: string, accentColor: string, scoreColor: string, date: string): number => {
  let y = 80;

  // Accent line
  setFill(pdf, accentColor);
  pdf.rect(A4_W / 2 - 15, y, 30, 1.5, 'F');
  y += 12;

  // Title
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(28);
  setColor(pdf, C.text.primary);
  pdf.text('Competitive Analysis', A4_W / 2, y, { align: 'center' });
  y += 10;

  // Entity name
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(18);
  setColor(pdf, C.text.muted);
  pdf.text(entityName, A4_W / 2, y, { align: 'center' });
  y += 7;

  // Entity type
  pdf.setFontSize(10);
  setColor(pdf, C.text.subtle);
  pdf.text(`${entityType.toUpperCase()} REPORT`, A4_W / 2, y, { align: 'center' });
  y += 20;

  // Score circle
  const cx = A4_W / 2, cy = y + 25, radius = 22;
  setDraw(pdf, scoreColor);
  pdf.setLineWidth(1);
  pdf.circle(cx, cy, radius, 'S');

  // Score number
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(36);
  setColor(pdf, scoreColor);
  pdf.text(String(report.score), cx, cy + 2, { align: 'center' });

  // Score label
  pdf.setFontSize(8);
  setColor(pdf, C.text.subtle);
  pdf.text('SCORE', cx, cy + 10, { align: 'center' });

  y = cy + radius + 15;

  // Date
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  setColor(pdf, C.text.subtle);
  pdf.text(`Generated ${date}`, A4_W / 2, y, { align: 'center' });

  return y + 10;
};

const drawExecSummary = (pdf: jsPDF, report: CompetitiveAnalysisReportData, y: number): number => {
  y = drawSectionTitle(pdf, 'Executive Summary', y);
  y = drawParagraph(pdf, str(report.executiveSummary?.overview), y);
  y += 2;

  // Position card
  const cardH = 18;
  y = ensureSpace(pdf, y, cardH + 4);
  drawCard(pdf, M, y, CW, cardH, '#f0fdf4');
  setFill(pdf, '#22c55e');
  pdf.rect(M, y, 1.2, cardH, 'F');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  setColor(pdf, '#166534');
  pdf.text('CURRENT POSITION', M + 5, y + 5);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  setColor(pdf, '#15803d');
  const posLines = wrapText(pdf, str(report.executiveSummary?.currentPosition), CW - 10);
  for (let i = 0; i < Math.min(posLines.length, 2); i++) {
    pdf.text(posLines[i], M + 5, y + 10 + i * 4);
  }
  y += cardH + 6;

  y = drawSubheading(pdf, 'Top Priorities', y);
  y = drawBullets(pdf, safe(report.executiveSummary?.topPriorities), y);
  return y;
};

const drawMarketPerception = (pdf: jsPDF, report: CompetitiveAnalysisReportData, y: number): number => {
  y = drawSectionTitle(pdf, 'Market Perception', y);

  const strengths = safe(report.marketPerception?.keyStrengths);
  const gaps = safe(report.marketPerception?.criticalGaps);
  const risks = safe(report.marketPerception?.risks);

  // Strengths & Gaps as full bullet lists
  if (strengths.length > 0) {
    y = drawSubheading(pdf, '✓ Key Strengths', y);
    y = drawBullets(pdf, strengths, y, M, CW - 4, '#15803d');
  }

  if (gaps.length > 0) {
    y = drawSubheading(pdf, '⚠ Critical Gaps', y);
    y = drawBullets(pdf, gaps, y, M, CW - 4, '#a16207');
  }

  // Risks
  if (risks.length > 0) {
    y = drawSubheading(pdf, '⚡ Risks', y);
    y = drawBullets(pdf, risks, y, M, CW - 4, '#b91c1c');
  }

  return y;
};

const drawSwMatrix = (pdf: jsPDF, report: CompetitiveAnalysisReportData, y: number): number => {
  y = drawSectionTitle(pdf, 'Strengths & Weaknesses Matrix', y);

  const entries = [
    ['Design Sophistication', report.strengthsWeaknesses?.designSophistication],
    ['Visual Consistency', report.strengthsWeaknesses?.visualConsistency],
    ['User Centricity', report.strengthsWeaknesses?.userCentricity],
    ['Innovation', report.strengthsWeaknesses?.innovation],
    ['Clarity', report.strengthsWeaknesses?.clarity],
    ['Emotional Connection', report.strengthsWeaknesses?.emotionalConnection],
    ['Professional Polish', report.strengthsWeaknesses?.professionalPolish],
  ].sort((a, b) => (Number(b[1]) || 0) - (Number(a[1]) || 0));

  const barH = 4;
  const barW = 90;
  const labelW = 50;

  for (const [label, val] of entries) {
    const v = Number(val) || 0;
    y = ensureSpace(pdf, y, 8);

    // Label
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    setColor(pdf, C.text.secondary);
    pdf.text(String(label), M, y + 3);

    // Bar background
    const barX = M + labelW;
    setFill(pdf, C.border.light);
    pdf.roundedRect(barX, y, barW, barH, 2, 2, 'F');

    // Bar fill
    const pct = (v / 10) * barW;
    const barColor = v >= 8 ? C.accent.success : v >= 6 ? C.accent.warning : v >= 4 ? C.accent.orange : C.accent.danger;
    setFill(pdf, barColor);
    if (pct > 0) pdf.roundedRect(barX, y, pct, barH, 2, 2, 'F');

    // Value
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    setColor(pdf, barColor);
    pdf.text(`${v}/10`, barX + barW + 4, y + 3);

    y += 8;
  }

  return y + 4;
};

const drawRadarChart = (pdf: jsPDF, items: [string, number][], y: number): number => {
  const cx = A4_W / 2;
  const r = 30;
  const chartH = r * 2 + 25;
  y = ensureSpace(pdf, y, chartH);
  const cy = y + r + 8;
  const n = items.length;
  const step = (2 * Math.PI) / n;
  const start = -Math.PI / 2;

  const pt = (i: number, val: number): [number, number] => {
    const a = start + i * step;
    const d = (val / 10) * r;
    return [cx + d * Math.cos(a), cy + d * Math.sin(a)];
  };

  // Grid rings
  setDraw(pdf, '#d1d5db');
  pdf.setLineWidth(0.15);
  for (const ring of [2, 4, 6, 8, 10]) {
    const pts = items.map((_, i) => pt(i, ring));
    for (let i = 0; i < pts.length; i++) {
      const next = pts[(i + 1) % pts.length];
      pdf.line(pts[i][0], pts[i][1], next[0], next[1]);
    }
  }

  // Axis lines
  for (let i = 0; i < n; i++) {
    const [ex, ey] = pt(i, 10);
    pdf.line(cx, cy, ex, ey);
  }

  // Data polygon fill
  const dataPts = items.map(([, v], i) => pt(i, v));
  setFill(pdf, C.accent.primary);
  // jsPDF doesn't have fillPolygon with opacity, so draw filled triangles from center
  pdf.setGState(new (pdf as any).GState({ opacity: 0.2 }));
  for (let i = 0; i < dataPts.length; i++) {
    const next = dataPts[(i + 1) % dataPts.length];
    pdf.triangle(cx, cy, dataPts[i][0], dataPts[i][1], next[0], next[1], 'F');
  }
  pdf.setGState(new (pdf as any).GState({ opacity: 1 }));

  // Data polygon stroke
  setDraw(pdf, C.accent.primary);
  pdf.setLineWidth(0.6);
  for (let i = 0; i < dataPts.length; i++) {
    const next = dataPts[(i + 1) % dataPts.length];
    pdf.line(dataPts[i][0], dataPts[i][1], next[0], next[1]);
  }

  // Dots and labels
  for (let i = 0; i < items.length; i++) {
    const [px, py] = dataPts[i];
    // Dot
    setFill(pdf, C.background.white);
    setDraw(pdf, C.accent.primary);
    pdf.setLineWidth(0.5);
    pdf.circle(px, py, 1.2, 'FD');

    // Value near dot
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7);
    setColor(pdf, C.accent.primary);
    const a = start + i * step;
    const vx = px + 4 * Math.cos(a);
    const vy = py + 4 * Math.sin(a);
    pdf.text(String(items[i][1]), vx, vy, { align: 'center' });

    // Axis label
    const lx = cx + (r + 12) * Math.cos(a);
    const ly = cy + (r + 12) * Math.sin(a);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    setColor(pdf, C.text.secondary);
    const align = Math.abs(Math.cos(a)) < 0.1 ? 'center' : Math.cos(a) > 0 ? 'left' : 'right';
    pdf.text(items[i][0], lx, ly, { align: align as any });
  }

  return y + chartH;
};

const drawPositioning = (pdf: jsPDF, report: CompetitiveAnalysisReportData, y: number): number => {
  y = drawSectionTitle(pdf, 'Brand Positioning', y);
  y = drawSubheading(pdf, 'Brand Personality Matrix', y);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  setColor(pdf, C.text.muted);
  pdf.text('How the brand is positioned across key dimensions', M, y);
  y += 6;

  const pm = (report.brandPositioning?.personalityMatrix || {}) as any;
  const personalityItems: [string, number][] = [
    ['Innovation', Number(pm.innovationScore) || 0],
    ['Approachability', Number(pm.approachabilityScore) || 0],
    ['Technical', Number(pm.technicalScore) || 0],
    ['Boldness', Number(pm.boldnessScore) || 0],
    ['Enterprise', Number(pm.enterpriseScore) || 0],
    ['Global', Number(pm.globalScore) || 0],
  ];

  y = drawRadarChart(pdf, personalityItems, y);
  y += 4;

  // Two-column: Audience & Differentiation
  const audiences = safe(report.brandPositioning?.targetAudienceSignals);
  const diffFactors = safe(report.brandPositioning?.differentiation);

  if (audiences.length > 0 || diffFactors.length > 0) {
    y = ensureSpace(pdf, y, 20);

    if (audiences.length > 0) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      setColor(pdf, C.accent.primary);
      pdf.text('Target Audience Signals', M, y);
      y += 5;
      y = drawBullets(pdf, audiences, y, M, COL_W - 4, C.accent.primary);
    }

    if (diffFactors.length > 0) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      setColor(pdf, C.accent.secondary);
      pdf.text('Differentiation Factors', M, y);
      y += 5;
      y = drawBullets(pdf, diffFactors, y, M, COL_W - 4, C.accent.secondary);
    }
  }

  // Trust indicators as badges
  const trust = safe(report.brandPositioning?.trustIndicators);
  if (trust.length > 0) {
    y = ensureSpace(pdf, y, 12);
    y = drawSubheading(pdf, 'Trust Indicators', y);
    let bx = M;
    for (const t of trust) {
      const bw = drawBadge(pdf, t, bx, y, '#065f46', '#d1fae5');
      bx += bw + 2;
      if (bx > A4_W - M - 20) { bx = M; y += 7; }
    }
    y += 6;
  }

  return y;
};

const drawRecommendations = (pdf: jsPDF, report: CompetitiveAnalysisReportData, y: number): number => {
  y = drawSectionTitle(pdf, 'Strategic Recommendations', y);
  y = drawSubheading(pdf, 'Design Priorities', y);

  const rawPriorities = Array.isArray(report.recommendations?.designPriorities) ? report.recommendations.designPriorities : [];

  // Table header
  y = ensureSpace(pdf, y, 10);
  drawCard(pdf, M, y - 1, CW, 7, C.background.light);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  setColor(pdf, C.text.secondary);
  pdf.text('PRIORITY', M + 3, y + 3);
  pdf.text('IMPACT', M + CW * 0.65, y + 3);
  pdf.text('EFFORT', M + CW * 0.82, y + 3);
  y += 9;

  // Table rows
  for (let i = 0; i < rawPriorities.length; i++) {
    const p = rawPriorities[i] as any;
    const titleText = str(p?.title, 'Untitled');
    const titleLines = wrapText(pdf, `${i + 1}. ${titleText}`, CW * 0.6);
    const rowH = Math.max(titleLines.length * 4 + 3, 8);
    y = ensureSpace(pdf, y, rowH);

    setDraw(pdf, C.border.light);
    pdf.setLineWidth(0.2);
    pdf.line(M, y + rowH - 1, A4_W - M, y + rowH - 1);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    setColor(pdf, C.text.secondary);
    for (let j = 0; j < titleLines.length; j++) {
      pdf.text(titleLines[j], M + 3, y + 2 + j * 4);
    }

    const impactColor = p?.impact === 'high' ? C.accent.success : p?.impact === 'medium' ? C.accent.warning : C.text.subtle;
    const effortColor = p?.effort === 'low' ? C.accent.success : p?.effort === 'medium' ? C.accent.warning : C.accent.danger;
    drawBadge(pdf, str(p?.impact, '-'), M + CW * 0.63, y + 2, impactColor, impactColor + '30');
    drawBadge(pdf, str(p?.effort, '-'), M + CW * 0.80, y + 2, effortColor, effortColor + '30');

    y += rowH + 1;
  }

  y += 6;

  // Brand refinements
  y = drawSubheading(pdf, 'Brand Refinements', y);
  const br = report.recommendations?.brandRefinements;
  const refinements = [
    ['◆ Logo', str(br?.logo)],
    ['◉ Colors', str(br?.colors)],
    ['𝐓 Typography', str(br?.typography)],
    ['▣ Imagery', str(br?.imagery)],
  ];

  for (const [label, text] of refinements) {
    const lines = wrapText(pdf, text, CW - 10);
    const cardH = Math.max(lines.length * 4 + 8, 14);
    y = ensureSpace(pdf, y, cardH + 2);
    drawCard(pdf, M, y, CW, cardH, C.background.light, C.border.light);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    setColor(pdf, C.text.secondary);
    pdf.text(label, M + 4, y + 5);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    setColor(pdf, C.text.muted);
    let ly = y + 10;
    for (const line of lines) {
      pdf.text(line, M + 4, ly);
      ly += 4;
    }
    y += cardH + 3;
  }

  // Positioning opportunities
  const posOps = safe(report.recommendations?.positioningOpportunities);
  if (posOps.length > 0) {
    y += 2;
    y = drawSubheading(pdf, 'Positioning Opportunities', y);
    y = drawBullets(pdf, posOps, y);
  }

  // Digital improvements
  const digImps = safe(report.recommendations?.digitalImprovements);
  if (digImps.length > 0) {
    y = drawSubheading(pdf, 'Digital Improvements', y);
    y = drawBullets(pdf, digImps, y);
  }

  // Asset optimization
  const assetOpts = safe(report.recommendations?.assetOptimization);
  if (assetOpts.length > 0) {
    y = drawSubheading(pdf, 'Asset Optimization', y);
    y = drawBullets(pdf, assetOpts, y);
  }

  return y;
};

const drawVisualIdentity = (pdf: jsPDF, report: CompetitiveAnalysisReportData, y: number): number => {
  const via = report.visualIdentityAudit;
  if (!via) return y;

  y = drawSectionTitle(pdf, 'Visual Identity Audit', y);

  // Logo Analysis
  if (via.logoAnalysis) {
    y = drawSubheading(pdf, 'Logo Analysis', y);
    const entries = [
      ['Style', via.logoAnalysis.style],
      ['Typography', via.logoAnalysis.typography],
      ['Symbolism', via.logoAnalysis.symbolism],
      ['Scalability', via.logoAnalysis.scalability],
      ['Memorability', via.logoAnalysis.memorability],
    ].filter(([, v]) => v);
    for (const [label, text] of entries) {
      const cardH = 14;
      y = ensureSpace(pdf, y, cardH + 2);
      drawCard(pdf, M, y, CW, cardH, C.background.light, C.border.light);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.5);
      setColor(pdf, C.text.secondary);
      pdf.text(String(label), M + 4, y + 5);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      setColor(pdf, C.text.muted);
      const lines = wrapText(pdf, str(text), CW - 10);
      pdf.text(lines[0] || '', M + 4, y + 10);
      y += cardH + 3;
    }
  }

  // Color Palette
  if (via.colorPalette) {
    y = drawSubheading(pdf, 'Color Palette', y);
    if (via.colorPalette.psychology) y = drawParagraph(pdf, `Psychology: ${via.colorPalette.psychology}`, y);
    if (via.colorPalette.accessibility) y = drawParagraph(pdf, `Accessibility: ${via.colorPalette.accessibility}`, y);
    if (via.colorPalette.consistency) y = drawParagraph(pdf, `Consistency: ${via.colorPalette.consistency}`, y);
  }

  // Typography System
  if (via.typographySystem) {
    y = drawSubheading(pdf, 'Typography System', y);
    if (via.typographySystem.fonts?.length) y = drawBullets(pdf, via.typographySystem.fonts.map(f => `Font: ${f}`), y);
    if (via.typographySystem.hierarchy) y = drawParagraph(pdf, `Hierarchy: ${via.typographySystem.hierarchy}`, y);
    if (via.typographySystem.personality) y = drawParagraph(pdf, `Personality: ${via.typographySystem.personality}`, y);
  }

  // Visual Style
  if (via.visualStyle) {
    y = drawSubheading(pdf, 'Visual Style', y);
    const items = [via.visualStyle.photographyStyle, via.visualStyle.illustrationApproach, via.visualStyle.iconography, via.visualStyle.aesthetic].filter(Boolean);
    if (items.length) y = drawBullets(pdf, items.map(String), y);
  }

  // Design Patterns
  if (via.designPatterns) {
    y = drawSubheading(pdf, 'Design Patterns', y);
    const items = [
      via.designPatterns.uiElements && `UI Elements: ${via.designPatterns.uiElements}`,
      via.designPatterns.whitespace && `Whitespace: ${via.designPatterns.whitespace}`,
      via.designPatterns.interactions && `Interactions: ${via.designPatterns.interactions}`,
    ].filter(Boolean) as string[];
    if (items.length) y = drawBullets(pdf, items, y);
  }

  return y;
};

const drawDigitalPresence = (pdf: jsPDF, report: CompetitiveAnalysisReportData, y: number): number => {
  const dp = report.digitalPresence;
  if (!dp) return y;

  y = drawSectionTitle(pdf, 'Digital Presence Analysis', y);

  if (dp.homepageImpression) {
    y = drawSubheading(pdf, 'Homepage Impression', y);
    const items = [
      dp.homepageImpression.heroImpact && `Hero Impact: ${dp.homepageImpression.heroImpact}`,
      dp.homepageImpression.hierarchy && `Hierarchy: ${dp.homepageImpression.hierarchy}`,
      dp.homepageImpression.ctaDesign && `CTA Design: ${dp.homepageImpression.ctaDesign}`,
      dp.homepageImpression.effectiveness && `Effectiveness: ${dp.homepageImpression.effectiveness}`,
    ].filter(Boolean) as string[];
    y = drawBullets(pdf, items, y);
  }

  if (dp.uxAnalysis) {
    y = drawSubheading(pdf, 'UX Analysis', y);
    const items = [
      dp.uxAnalysis.navigation && `Navigation: ${dp.uxAnalysis.navigation}`,
      dp.uxAnalysis.contentOrganization && `Content Organization: ${dp.uxAnalysis.contentOrganization}`,
      dp.uxAnalysis.mobileResponsive && `Mobile Responsive: ${dp.uxAnalysis.mobileResponsive}`,
      dp.uxAnalysis.overallPolish && `Overall Polish: ${dp.uxAnalysis.overallPolish}`,
    ].filter(Boolean) as string[];
    y = drawBullets(pdf, items, y);
  }

  if (dp.contentPresentation) {
    y = drawSubheading(pdf, 'Content Presentation', y);
    const items = [
      dp.contentPresentation.videoUsage && `Video Usage: ${dp.contentPresentation.videoUsage}`,
      dp.contentPresentation.dataVisualization && `Data Visualization: ${dp.contentPresentation.dataVisualization}`,
      dp.contentPresentation.caseStudyDesign && `Case Study Design: ${dp.contentPresentation.caseStudyDesign}`,
    ].filter(Boolean) as string[];
    y = drawBullets(pdf, items, y);
  }

  return y;
};

const drawMarketingCollateral = (pdf: jsPDF, report: CompetitiveAnalysisReportData, y: number): number => {
  const mc = report.marketingCollateral;
  if (!mc) return y;

  y = drawSectionTitle(pdf, 'Marketing Collateral', y);

  if (mc.materialQuality?.length) {
    y = drawSubheading(pdf, 'Material Quality', y);
    y = drawBullets(pdf, safe(mc.materialQuality), y);
  }
  if (mc.productMarketing?.length) {
    y = drawSubheading(pdf, 'Product Marketing', y);
    y = drawBullets(pdf, safe(mc.productMarketing), y);
  }
  if (mc.socialConsistency) {
    y = drawSubheading(pdf, 'Social Consistency', y);
    y = drawParagraph(pdf, mc.socialConsistency, y);
  }

  return y;
};

const drawSwotAnalysis = (pdf: jsPDF, report: CompetitiveAnalysisReportData, y: number): number => {
  const swot = report.swotAnalysis;
  if (!swot) return y;

  y = drawSectionTitle(pdf, 'SWOT Analysis', y);

  const quadrants: [string, string[], string, string][] = [
    ['Strengths', safe(swot.strengths), '#f0fdf4', '#166534'],
    ['Weaknesses', safe(swot.weaknesses), '#fef2f2', '#991b1b'],
    ['Opportunities', safe(swot.opportunities), '#eff6ff', '#1e40af'],
    ['Threats', safe(swot.threats), '#fef3c7', '#92400e'],
  ];

  for (const [title, items, , color] of quadrants) {
    if (items.length === 0) continue;
    y = drawSubheading(pdf, title, y);
    y = drawBullets(pdf, items, y, M, CW - 4, color);
  }

  return y;
};

const drawCompetitorProfiles = (pdf: jsPDF, report: CompetitiveAnalysisReportData, y: number): number => {
  const profiles = report.competitorProfiles;
  if (!profiles?.length) return y;

  y = drawSectionTitle(pdf, 'Competitor Profiles', y);

  for (const cp of profiles) {
    // Build detail lines to calculate card height dynamically
    const details: [string, string][] = [];
    if (cp.brandStrength) details.push(['Brand Strength', cp.brandStrength]);
    if (cp.keyDifferentiator) details.push(['Differentiator', cp.keyDifferentiator]);
    if (cp.biggestWeakness) details.push(['Weakness', cp.biggestWeakness]);
    if (cp.visualIdentitySummary) details.push(['Visual Identity', cp.visualIdentitySummary]);
    if (cp.digitalPresenceSummary) details.push(['Digital Presence', cp.digitalPresenceSummary]);

    // Calculate needed height
    let detailH = 0;
    const wrappedDetails: { label: string; lines: string[] }[] = [];
    for (const [label, text] of details) {
      const lines = wrapText(pdf, `${label}: ${text}`, CW - 10);
      wrappedDetails.push({ label, lines });
      detailH += lines.length * 4 + 1;
    }
    const cardH = Math.max(detailH + 16, 20);

    y = ensureSpace(pdf, y, cardH + 4);

    const borderColor = cp.threatLevel === 'high' ? '#ef4444' : cp.threatLevel === 'medium' ? '#f59e0b' : '#22c55e';
    drawCard(pdf, M, y, CW, cardH, C.background.light, borderColor);

    // Name + type badge
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    setColor(pdf, C.text.primary);
    pdf.text(cp.name, M + 4, y + 7);

    const typeColor = cp.type === 'direct' ? '#dc2626' : cp.type === 'emerging' ? '#f59e0b' : '#6b7280';
    drawBadge(pdf, cp.type, M + 4 + pdf.getTextWidth(cp.name) + 4, y + 7, typeColor, typeColor + '20');

    // Score
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    const sColor = getScoreColor(cp.overallScore);
    setColor(pdf, sColor);
    pdf.text(`${cp.overallScore}`, A4_W - M - 10, y + 8, { align: 'right' });

    // Details - full text with wrapping
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    setColor(pdf, C.text.muted);
    let dy = y + 14;
    for (const { lines } of wrappedDetails) {
      for (const line of lines) {
        pdf.text(line, M + 4, dy);
        dy += 4;
      }
      dy += 1;
    }

    y += cardH + 4;
  }

  return y;
};

const drawContentMessaging = (pdf: jsPDF, report: CompetitiveAnalysisReportData, y: number): number => {
  const cm = report.contentMessaging;
  if (!cm) return y;

  y = drawSectionTitle(pdf, 'Content & Messaging Analysis', y);

  if (cm.toneSummary) {
    y = drawSubheading(pdf, 'Tone Summary', y);
    y = drawParagraph(pdf, cm.toneSummary, y);
  }
  if (cm.messagingPillars?.length) {
    y = drawSubheading(pdf, 'Messaging Pillars', y);
    y = drawBullets(pdf, safe(cm.messagingPillars), y);
  }
  if (cm.contentStrategy) {
    y = drawSubheading(pdf, 'Content Strategy', y);
    y = drawParagraph(pdf, cm.contentStrategy, y);
  }
  if (cm.socialMediaApproach) {
    y = drawSubheading(pdf, 'Social Media Approach', y);
    y = drawParagraph(pdf, cm.socialMediaApproach, y);
  }
  if (cm.thoughtLeadership) {
    y = drawSubheading(pdf, 'Thought Leadership', y);
    y = drawParagraph(pdf, cm.thoughtLeadership, y);
  }
  if (cm.contentGaps?.length) {
    y = drawSubheading(pdf, 'Content Gaps', y);
    y = drawBullets(pdf, safe(cm.contentGaps), y);
  }

  return y;
};

const drawMarketTrends = (pdf: jsPDF, report: CompetitiveAnalysisReportData, y: number): number => {
  const mt = report.marketTrends;
  if (!mt) return y;

  y = drawSectionTitle(pdf, 'Market Trends & Innovation', y);

  if (mt.industryTrends?.length) {
    y = drawSubheading(pdf, 'Industry Trends', y);
    y = drawBullets(pdf, safe(mt.industryTrends), y);
  }
  if (mt.innovationGaps?.length) {
    y = drawSubheading(pdf, 'Innovation Gaps', y);
    y = drawBullets(pdf, safe(mt.innovationGaps), y);
  }
  if (mt.emergingOpportunities?.length) {
    y = drawSubheading(pdf, 'Emerging Opportunities', y);
    y = drawBullets(pdf, safe(mt.emergingOpportunities), y);
  }
  if (mt.disruptionRisks?.length) {
    y = drawSubheading(pdf, 'Disruption Risks', y);
    y = drawBullets(pdf, safe(mt.disruptionRisks), y);
  }
  if (mt.technologyAdoption) {
    y = drawSubheading(pdf, 'Technology Adoption', y);
    y = drawParagraph(pdf, mt.technologyAdoption, y);
  }

  return y;
};

const drawRegionalInsights = (pdf: jsPDF, report: CompetitiveAnalysisReportData, y: number): number => {
  const ri = report.regionalInsights;
  if (!ri) return y;

  y = drawSectionTitle(pdf, 'Regional Insights', y);

  if (ri.marketContext) {
    y = drawSubheading(pdf, 'Market Context', y);
    y = drawParagraph(pdf, ri.marketContext, y);
  }
  if (ri.localCompetitors?.length) {
    y = drawSubheading(pdf, 'Local Competitors', y);
    y = drawBullets(pdf, safe(ri.localCompetitors), y);
  }
  if (ri.culturalConsiderations?.length) {
    y = drawSubheading(pdf, 'Cultural Considerations', y);
    y = drawBullets(pdf, safe(ri.culturalConsiderations), y);
  }
  if (ri.localizationPriorities?.length) {
    y = drawSubheading(pdf, 'Localization Priorities', y);
    y = drawBullets(pdf, safe(ri.localizationPriorities), y);
  }
  if (ri.regulatoryConsiderations) {
    y = drawSubheading(pdf, 'Regulatory Considerations', y);
    y = drawParagraph(pdf, ri.regulatoryConsiderations, y);
  }
  if (ri.marketOpportunities?.length) {
    y = drawSubheading(pdf, 'Market Opportunities', y);
    y = drawBullets(pdf, safe(ri.marketOpportunities), y);
  }
  if (ri.entryBarriers?.length) {
    y = drawSubheading(pdf, 'Entry Barriers', y);
    y = drawBullets(pdf, safe(ri.entryBarriers), y);
  }

  return y;
};

const drawActionPlan = (pdf: jsPDF, report: CompetitiveAnalysisReportData, y: number, date: string): number => {
  y = drawSectionTitle(pdf, '30 / 60 / 90 Day Action Plan', y);

  const phases: [string, string[], string, string, string][] = [
    ['30 Days', safe(report.executiveSummary?.actionPlan?.thirtyDay), '#dbeafe', '#1e40af', '#1e3a8a'],
    ['60 Days', safe(report.executiveSummary?.actionPlan?.sixtyDay), '#fef3c7', '#92400e', '#78350f'],
    ['90 Days', safe(report.executiveSummary?.actionPlan?.ninetyDay), '#d1fae5', '#065f46', '#064e3b'],
  ];

  const colW = (CW - 8) / 3;
  const maxItems = Math.max(...phases.map(([, items]) => items.length));
  const phaseH = Math.max(maxItems * 5 + 14, 30);

  y = ensureSpace(pdf, y, phaseH + 4);

  for (let p = 0; p < 3; p++) {
    const [title, items, bg, headColor, textColor] = phases[p];
    const px = M + p * (colW + 4);

    drawCard(pdf, px, y, colW, phaseH, bg);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    setColor(pdf, headColor);
    pdf.text(title, px + 4, y + 7);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    setColor(pdf, textColor);
    let iy = y + 14;
    for (const item of items) {
      const t = '• ' + item.substring(0, 40);
      pdf.text(t, px + 4, iy);
      iy += 4.5;
    }
  }

  y += phaseH + 6;

  // Success metrics
  const metrics = safe(report.executiveSummary?.successMetrics);
  if (metrics.length > 0) {
    const mH = metrics.length * 5 + 12;
    y = ensureSpace(pdf, y, mH);
    drawCard(pdf, M, y, CW, mH, '#f0f9ff', '#bae6fd');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    setColor(pdf, '#0369a1');
    pdf.text('📊 Success Metrics', M + 4, y + 6);
    let my = y + 12;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    setColor(pdf, '#0284c7');
    for (const m of metrics) {
      pdf.text('• ' + m.substring(0, 70), M + 4, my);
      my += 4.5;
    }
    y += mH + 6;
  }

  // Footer
  y = ensureSpace(pdf, y, 10);
  setDraw(pdf, C.border.light);
  pdf.setLineWidth(0.3);
  pdf.line(M, y, A4_W - M, y);
  y += 5;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  setColor(pdf, C.text.subtle);
  pdf.text(`Generated by Brand Intelligence System · ${date}`, A4_W / 2, y, { align: 'center' });

  return y + 5;
};

// ─── Main Export Function ───────────────────────────────
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

  const { jsPDF: JsPDF } = await import('jspdf');
  const pdf = new JsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });

  onProgress?.('Generating PDF...');

  try {
    // Cover page
    drawCover(pdf, report, entityName, entityType, accentColor, scoreColor, date);

    // Content pages
    pdf.addPage();
    let y = M;

    y = drawExecSummary(pdf, report, y);
    y = drawSwotAnalysis(pdf, report, y);
    y = drawMarketPerception(pdf, report, y);
    y = drawCompetitorProfiles(pdf, report, y);
    y = drawVisualIdentity(pdf, report, y);
    y = drawDigitalPresence(pdf, report, y);
    y = drawMarketingCollateral(pdf, report, y);
    y = drawContentMessaging(pdf, report, y);
    y = drawSwMatrix(pdf, report, y);
    y = drawPositioning(pdf, report, y);
    y = drawMarketTrends(pdf, report, y);
    y = drawRegionalInsights(pdf, report, y);
    y = drawRecommendations(pdf, report, y);
    y = drawActionPlan(pdf, report, y, date);

    const filename = `${entityName.replace(/\s+/g, '_')}_Competitive_Analysis.pdf`;
    pdf.save(filename);
    onProgress?.('PDF exported successfully!');
  } catch (error) {
    console.error('PDF export failed:', error);
    throw new Error('Failed to export PDF');
  }
};
