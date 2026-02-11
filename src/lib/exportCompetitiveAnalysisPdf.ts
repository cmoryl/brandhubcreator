import { jsPDF } from 'jspdf';
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

  // Two-column: Strengths & Gaps
  const col1X = M;
  const col2X = M + COL_W + 6;
  const maxItems = Math.max(strengths.length, gaps.length);
  const colH = Math.max(maxItems * 5 + 14, 30);

  y = ensureSpace(pdf, y, colH + 4);

  // Strengths card
  drawCard(pdf, col1X, y, COL_W, colH, '#f0fdf4');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  setColor(pdf, '#166534');
  pdf.text('✓ Key Strengths', col1X + 4, y + 6);
  let sy = y + 12;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  setColor(pdf, '#15803d');
  for (const s of strengths) {
    pdf.text('• ' + s.substring(0, 60), col1X + 4, sy);
    sy += 4.5;
  }

  // Gaps card
  drawCard(pdf, col2X, y, COL_W, colH, '#fef3c7');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  setColor(pdf, '#92400e');
  pdf.text('⚠ Critical Gaps', col2X + 4, y + 6);
  let gy = y + 12;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  setColor(pdf, '#a16207');
  for (const g of gaps) {
    pdf.text('• ' + g.substring(0, 60), col2X + 4, gy);
    gy += 4.5;
  }

  y += colH + 5;

  // Risks card
  if (risks.length > 0) {
    const riskH = risks.length * 5 + 12;
    y = ensureSpace(pdf, y, riskH);
    drawCard(pdf, M, y, CW, riskH, '#fef2f2');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    setColor(pdf, '#991b1b');
    pdf.text('⚡ Risks', M + 4, y + 6);
    let ry = y + 12;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    setColor(pdf, '#b91c1c');
    for (const r of risks) {
      pdf.text('• ' + r.substring(0, 80), M + 4, ry);
      ry += 4.5;
    }
    y += riskH + 4;
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

  const priorities = safe(report.recommendations?.designPriorities);

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
  for (let i = 0; i < priorities.length; i++) {
    const p = priorities[i] as any;
    y = ensureSpace(pdf, y, 8);

    setDraw(pdf, C.border.light);
    pdf.setLineWidth(0.2);
    pdf.line(M, y + 4, A4_W - M, y + 4);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    setColor(pdf, C.text.secondary);
    const title = `${i + 1}. ${str(p?.title, 'Untitled')}`;
    pdf.text(title.substring(0, 50), M + 3, y + 2);

    const impactColor = p?.impact === 'high' ? C.accent.success : p?.impact === 'medium' ? C.accent.warning : C.text.subtle;
    const effortColor = p?.effort === 'low' ? C.accent.success : p?.effort === 'medium' ? C.accent.warning : C.accent.danger;
    drawBadge(pdf, str(p?.impact, '-'), M + CW * 0.63, y + 2, impactColor, impactColor + '30');
    drawBadge(pdf, str(p?.effort, '-'), M + CW * 0.80, y + 2, effortColor, effortColor + '30');

    y += 7;
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
    const cardH = 14;
    y = ensureSpace(pdf, y, cardH + 2);
    drawCard(pdf, M, y, CW, cardH, C.background.light, C.border.light);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    setColor(pdf, C.text.secondary);
    pdf.text(label, M + 4, y + 5);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    setColor(pdf, C.text.muted);
    const lines = wrapText(pdf, text, CW - 10);
    pdf.text(lines[0] || '', M + 4, y + 10);
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

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });

  onProgress?.('Generating PDF...');

  try {
    // Cover page
    drawCover(pdf, report, entityName, entityType, accentColor, scoreColor, date);

    // Content pages
    pdf.addPage();
    let y = M;

    y = drawExecSummary(pdf, report, y);
    y = drawMarketPerception(pdf, report, y);
    y = drawSwMatrix(pdf, report, y);
    y = drawPositioning(pdf, report, y);
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
