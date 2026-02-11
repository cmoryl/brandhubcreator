import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import type { CompetitiveAnalysisReportData } from '@/types/competitiveAnalysis';
import {
  PDF_COLORS,
  applyPdfContainerStyles,
  getScoreColor,
  formatPdfDate,
} from './pdfStyleConfig';

export interface ExportOptions {
  entityName: string;
  entityType: 'brand' | 'product' | 'event';
  theme?: 'light' | 'dark';
}

// ─── Helpers ────────────────────────────────────────────
const safe = (arr: unknown): string[] => Array.isArray(arr) ? arr.filter(Boolean).map(String) : [];
const str = (v: unknown, fb = 'N/A'): string => (typeof v === 'string' && v) ? v : fb;

const li = (items: string[], color = '#4b5563') =>
  items.map(i => `<li style="font-size:13px;color:${color};margin-bottom:6px;line-height:1.5;">${i}</li>`).join('');

const sectionTitle = (text: string) => `
  <h2 style="font-size:22px;font-weight:700;color:#111827;margin:0 0 18px;padding-bottom:10px;border-bottom:2px solid #e5e7eb;">${text}</h2>`;

const htmlBar = (label: string, value: number, max = 10) => {
  const pct = Math.round((value / max) * 100);
  const color = value >= 8 ? '#22c55e' : value >= 6 ? '#eab308' : value >= 4 ? '#f97316' : '#ef4444';
  return `
    <tr>
      <td style="padding:8px 12px;width:170px;font-size:13px;font-weight:500;color:#374151;">${label}</td>
      <td style="padding:8px 12px;">
        <div style="background:#e5e7eb;border-radius:999px;height:14px;overflow:hidden;position:relative;">
          <div style="background:${color};width:${pct}%;height:100%;border-radius:999px;"></div>
        </div>
      </td>
      <td style="padding:8px 12px;width:55px;text-align:right;font-size:13px;font-weight:700;color:${color};">${value}/${max}</td>
    </tr>`;
};

const badge = (text: string, fg: string, bg: string) =>
  `<span style="display:inline-block;padding:3px 12px;font-size:11px;font-weight:600;border-radius:999px;background:${bg};color:${fg};text-transform:uppercase;letter-spacing:.5px;">${text}</span>`;

// ─── PDF Section Builders (each returns HTML for one page/section) ───
const buildCover = (report: CompetitiveAnalysisReportData, entityName: string, entityType: string, accentColor: string, scoreColor: string, date: string) => `
  <div data-pdf-section style="text-align:center;padding:60px 40px;">
    <div style="display:inline-block;width:60px;height:4px;background:${accentColor};border-radius:2px;margin-bottom:32px;"></div>
    <h1 style="font-size:36px;font-weight:800;color:#111827;margin:0 0 8px;letter-spacing:-.5px;">Competitive Analysis</h1>
    <p style="font-size:22px;color:#6b7280;margin:0 0 4px;">${entityName}</p>
    <p style="font-size:13px;color:#9ca3af;margin:0;text-transform:uppercase;letter-spacing:1px;">${entityType} Report</p>
    <div style="margin:48px auto;width:140px;height:140px;border-radius:50%;background:linear-gradient(135deg,${accentColor}22,${accentColor}08);border:3px solid ${scoreColor};text-align:center;padding-top:35px;box-sizing:border-box;">
      <div style="font-size:52px;font-weight:800;color:${scoreColor};line-height:1;">${report.score}</div>
      <div style="font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:1.5px;margin-top:4px;">Score</div>
    </div>
    <p style="font-size:12px;color:#9ca3af;">Generated ${date}</p>
  </div>`;

const buildExecSummary = (report: CompetitiveAnalysisReportData) => `
  <div data-pdf-section style="padding:20px 0;">
    ${sectionTitle('Executive Summary')}
    <p style="font-size:14px;color:#374151;line-height:1.7;margin:0 0 24px;">${str(report.executiveSummary?.overview)}</p>
    <div style="background:linear-gradient(135deg,#f0fdf4,#ecfdf5);border-left:4px solid #22c55e;padding:16px 20px;border-radius:0 10px 10px 0;margin-bottom:24px;">
      <p style="font-size:11px;font-weight:700;color:#166534;text-transform:uppercase;letter-spacing:.8px;margin:0 0 6px;">Current Position</p>
      <p style="font-size:13px;color:#15803d;margin:0;line-height:1.6;">${str(report.executiveSummary?.currentPosition)}</p>
    </div>
    <p style="font-size:14px;font-weight:700;color:#111827;margin:0 0 10px;">Top Priorities</p>
    <ul style="margin:0;padding-left:18px;">${li(safe(report.executiveSummary?.topPriorities))}</ul>
  </div>`;

const buildMarketPerception = (report: CompetitiveAnalysisReportData) => `
  <div data-pdf-section style="padding:20px 0;">
    ${sectionTitle('Market Perception')}
    <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
      <tr>
        <td style="width:50%;vertical-align:top;padding-right:10px;">
          <div style="background:#f0fdf4;padding:18px;border-radius:10px;min-height:120px;">
            <p style="font-size:13px;font-weight:700;color:#166534;margin:0 0 10px;">✓ Key Strengths</p>
            <ul style="margin:0;padding-left:14px;">${li(safe(report.marketPerception?.keyStrengths), '#15803d')}</ul>
          </div>
        </td>
        <td style="width:50%;vertical-align:top;padding-left:10px;">
          <div style="background:#fef3c7;padding:18px;border-radius:10px;min-height:120px;">
            <p style="font-size:13px;font-weight:700;color:#92400e;margin:0 0 10px;">⚠ Critical Gaps</p>
            <ul style="margin:0;padding-left:14px;">${li(safe(report.marketPerception?.criticalGaps), '#a16207')}</ul>
          </div>
        </td>
      </tr>
    </table>
    <div style="background:#fef2f2;padding:18px;border-radius:10px;">
      <p style="font-size:13px;font-weight:700;color:#991b1b;margin:0 0 10px;">⚡ Risks</p>
      <ul style="margin:0;padding-left:14px;">${li(safe(report.marketPerception?.risks), '#b91c1c')}</ul>
    </div>
  </div>`;

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
    <div data-pdf-section style="padding:20px 0;">
      ${sectionTitle('Strengths & Weaknesses Matrix')}
      <table style="width:100%;border-collapse:collapse;">
        <tbody>
          ${matrixEntries.map(([label, val]) => htmlBar(String(label), Number(val) || 0)).join('')}
        </tbody>
      </table>
    </div>`;
};

const buildPositioning = (report: CompetitiveAnalysisReportData) => {
  const pm = report.brandPositioning?.personalityMatrix || {} as any;
  const personalityItems = [
    ['Innovation', pm.innovationScore],
    ['Approachability', pm.approachabilityScore],
    ['Technical', pm.technicalScore],
    ['Boldness', pm.boldnessScore],
    ['Enterprise', pm.enterpriseScore],
    ['Global', pm.globalScore],
  ];

  return `
    <div data-pdf-section style="padding:20px 0;">
      ${sectionTitle('Brand Positioning')}
      <p style="font-size:14px;font-weight:700;color:#374151;margin:0 0 12px;">Personality Matrix</p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tbody>
          ${personalityItems.map(([l, v]) => htmlBar(String(l), Number(v) || 0)).join('')}
        </tbody>
      </table>
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="width:50%;vertical-align:top;padding-right:10px;">
            <p style="font-size:13px;font-weight:700;color:#1d4ed8;margin:0 0 8px;">Target Audience Signals</p>
            <ul style="margin:0;padding-left:14px;">${li(safe(report.brandPositioning?.targetAudienceSignals), '#2563eb')}</ul>
          </td>
          <td style="width:50%;vertical-align:top;padding-left:10px;">
            <p style="font-size:13px;font-weight:700;color:#7c3aed;margin:0 0 8px;">Differentiation Factors</p>
            <ul style="margin:0;padding-left:14px;">${li(safe(report.brandPositioning?.differentiation), '#7c3aed')}</ul>
          </td>
        </tr>
      </table>
      ${safe(report.brandPositioning?.trustIndicators).length > 0 ? `
        <div style="margin-top:20px;">
          <p style="font-size:13px;font-weight:700;color:#374151;margin:0 0 8px;">Trust Indicators</p>
          <div>${safe(report.brandPositioning?.trustIndicators).map(t => badge(t, '#065f46', '#d1fae5')).join(' ')}</div>
        </div>
      ` : ''}
    </div>`;
};

const buildRecommendations = (report: CompetitiveAnalysisReportData) => {
  const designPriorities = safe(report.recommendations?.designPriorities).map((p: any, i: number) => {
    const impactColor = p?.impact === 'high' ? '#22c55e' : p?.impact === 'medium' ? '#eab308' : '#9ca3af';
    const effortColor = p?.effort === 'low' ? '#22c55e' : p?.effort === 'medium' ? '#eab308' : '#ef4444';
    return `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#374151;">
          <strong style="color:#111827;">${i + 1}.</strong> ${str(p?.title, 'Untitled')}
        </td>
        <td style="text-align:center;padding:10px 12px;border-bottom:1px solid #f3f4f6;">
          ${badge(str(p?.impact, '-'), impactColor, impactColor + '18')}
        </td>
        <td style="text-align:center;padding:10px 12px;border-bottom:1px solid #f3f4f6;">
          ${badge(str(p?.effort, '-'), effortColor, effortColor + '18')}
        </td>
      </tr>`;
  }).join('');

  const br = report.recommendations?.brandRefinements;
  const refinementCard = (title: string, text: string, icon: string) => `
    <td style="width:50%;vertical-align:top;padding:6px;">
      <div style="background:#f9fafb;padding:14px 16px;border-radius:8px;border:1px solid #f3f4f6;">
        <p style="font-size:12px;font-weight:700;color:#374151;margin:0 0 4px;">${icon} ${title}</p>
        <p style="font-size:12px;color:#6b7280;margin:0;line-height:1.5;">${str(text)}</p>
      </div>
    </td>`;

  return `
    <div data-pdf-section style="padding:20px 0;">
      ${sectionTitle('Strategic Recommendations')}
      <p style="font-size:14px;font-weight:700;color:#374151;margin:0 0 12px;">Design Priorities</p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:28px;">
        <thead>
          <tr style="background:#f9fafb;">
            <th style="text-align:left;padding:10px 12px;border-bottom:2px solid #e5e7eb;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;">Priority</th>
            <th style="text-align:center;padding:10px 12px;border-bottom:2px solid #e5e7eb;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;">Impact</th>
            <th style="text-align:center;padding:10px 12px;border-bottom:2px solid #e5e7eb;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;">Effort</th>
          </tr>
        </thead>
        <tbody>${designPriorities}</tbody>
      </table>
      <p style="font-size:14px;font-weight:700;color:#374151;margin:0 0 12px;">Brand Refinements</p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:28px;">
        <tr>${refinementCard('Logo', str(br?.logo), '◆')}${refinementCard('Colors', str(br?.colors), '◉')}</tr>
        <tr>${refinementCard('Typography', str(br?.typography), '𝐓')}${refinementCard('Imagery', str(br?.imagery), '▣')}</tr>
      </table>
      <p style="font-size:14px;font-weight:700;color:#374151;margin:0 0 10px;">Positioning Opportunities</p>
      <ul style="margin:0 0 20px;padding-left:18px;">${li(safe(report.recommendations?.positioningOpportunities))}</ul>
      ${safe(report.recommendations?.digitalImprovements).length > 0 ? `
        <p style="font-size:14px;font-weight:700;color:#374151;margin:0 0 10px;">Digital Improvements</p>
        <ul style="margin:0 0 20px;padding-left:18px;">${li(safe(report.recommendations?.digitalImprovements))}</ul>
      ` : ''}
    </div>`;
};

const buildActionPlan = (report: CompetitiveAnalysisReportData, date: string) => {
  const phase = (title: string, items: string[], bg: string, headColor: string, textColor: string) => `
    <td style="width:33.33%;vertical-align:top;padding:6px;">
      <div style="background:${bg};padding:18px;border-radius:10px;min-height:140px;">
        <p style="font-size:14px;font-weight:700;color:${headColor};margin:0 0 12px;">${title}</p>
        <ul style="margin:0;padding-left:14px;">${li(items, textColor)}</ul>
      </div>
    </td>`;

  return `
    <div data-pdf-section style="padding:20px 0;">
      ${sectionTitle('30 / 60 / 90 Day Action Plan')}
      <table style="width:100%;border-collapse:collapse;margin-bottom:28px;">
        <tr>
          ${phase('30 Days', safe(report.executiveSummary?.actionPlan?.thirtyDay), '#dbeafe', '#1e40af', '#1e3a8a')}
          ${phase('60 Days', safe(report.executiveSummary?.actionPlan?.sixtyDay), '#fef3c7', '#92400e', '#78350f')}
          ${phase('90 Days', safe(report.executiveSummary?.actionPlan?.ninetyDay), '#d1fae5', '#065f46', '#064e3b')}
        </tr>
      </table>
      <div style="background:#f0f9ff;border:1px solid #bae6fd;padding:18px;border-radius:10px;">
        <p style="font-size:13px;font-weight:700;color:#0369a1;margin:0 0 10px;">📊 Success Metrics</p>
        <ul style="margin:0;padding-left:14px;">${li(safe(report.executiveSummary?.successMetrics), '#0284c7')}</ul>
      </div>
    </div>
    <div data-pdf-section style="text-align:center;padding-top:32px;border-top:1px solid #e5e7eb;">
      <p style="font-size:11px;color:#9ca3af;margin:0;">Generated by Brand Intelligence System · ${date}</p>
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
  const entityColors: Record<string, string> = { brand: '#14b8a6', product: '#139cd8', event: '#a855f7' };
  const accentColor = entityColors[entityType] || '#3b82f6';

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

  // Create container
  const container = document.createElement('div');
  container.innerHTML = `<div style="font-family:'Helvetica Neue',Arial,sans-serif;color:#111827;line-height:1.6;padding:36px 40px;background:#ffffff;">${allHtml}</div>`;
  applyPdfContainerStyles(container, 'a4');
  document.body.appendChild(container);

  // Force layout
  void container.offsetHeight;
  await new Promise(resolve => setTimeout(resolve, 800));

  // A4 dimensions in mm
  const A4_W = 210;
  const A4_H = 297;
  const MARGIN = 10;
  const CONTENT_W = A4_W - MARGIN * 2;
  const GAP = 4;

  const sections = Array.from(container.querySelectorAll('[data-pdf-section]')) as HTMLElement[];
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let currentY = MARGIN;

  onProgress?.('Generating PDF...');

  try {
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const canvas = await html2canvas(section, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: section.scrollWidth,
        height: section.scrollHeight,
      });

      const scaleFactor = CONTENT_W / (canvas.width / 2);
      const heightMM = (canvas.height / 2) * scaleFactor;
      const remaining = A4_H - MARGIN - currentY;

      if (heightMM > remaining && currentY > MARGIN) {
        pdf.addPage();
        currentY = MARGIN;
      }

      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', MARGIN, currentY, CONTENT_W, heightMM);
      currentY += heightMM + GAP;
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
