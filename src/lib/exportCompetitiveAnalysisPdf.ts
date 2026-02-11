import html2pdf from 'html2pdf.js';
import type { CompetitiveAnalysisReportData } from '@/types/competitiveAnalysis';
import {
  PDF_COLORS,
  PDF_PAPER_CONFIGS,
  applyPdfContainerStyles,
  getScoreColor,
  formatPdfDate,
} from './pdfStyleConfig';

export interface ExportOptions {
  entityName: string;
  entityType: 'brand' | 'product' | 'event';
  theme?: 'light' | 'dark';
}

const createPdfContent = (
  report: CompetitiveAnalysisReportData,
  options: ExportOptions
): string => {
  const { entityName, entityType } = options;
  const scoreColor = getScoreColor(report.score);
  const generatedDate = formatPdfDate();

  // Helper to safely render arrays
  const safeArray = (arr: unknown): string[] => Array.isArray(arr) ? arr.filter(Boolean).map(String) : [];
  const safeString = (val: unknown, fallback = 'N/A'): string => (typeof val === 'string' && val) ? val : fallback;

  const listItems = (items: string[]) => items.map(item => `<li style="font-size: 13px; color: #4b5563; margin-bottom: 6px;">${item}</li>`).join('');

  return `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; color: #111827; line-height: 1.6; padding: 40px;">
      <!-- Cover Page -->
      <div style="text-align: center; margin-bottom: 60px; page-break-after: always;">
        <div style="margin-bottom: 40px;">
          <h1 style="font-size: 32px; font-weight: 700; margin: 0 0 8px; color: #111827;">Competitive Analysis Report</h1>
          <p style="font-size: 20px; color: #6b7280; margin: 0;">${entityName}</p>
          <p style="font-size: 14px; color: #9ca3af; margin-top: 8px; text-transform: capitalize;">${entityType} Analysis</p>
        </div>
        
        <div style="display: inline-block; padding: 24px 48px; background: #f9fafb; border-radius: 16px; margin: 40px 0;">
          <div style="font-size: 64px; font-weight: 700; color: ${scoreColor};">${report.score}</div>
          <div style="font-size: 14px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px;">Overall Score</div>
        </div>
        
        <p style="font-size: 14px; color: #9ca3af; margin-top: 40px;">Generated on ${generatedDate}</p>
      </div>

      <!-- Executive Summary -->
      <div style="margin-bottom: 40px; page-break-after: always;">
        <h2 style="font-size: 24px; font-weight: 600; color: #111827; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 2px solid #e5e7eb;">
          Executive Summary
        </h2>
        <p style="font-size: 16px; color: #4b5563; margin-bottom: 24px;">${safeString(report.executiveSummary?.overview)}</p>
        
        <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px 20px; margin-bottom: 24px; border-radius: 0 8px 8px 0;">
          <h3 style="font-size: 16px; font-weight: 600; color: #166534; margin: 0 0 12px;">Current Position</h3>
          <p style="font-size: 14px; color: #15803d; margin: 0;">${safeString(report.executiveSummary?.currentPosition)}</p>
        </div>

        <h3 style="font-size: 18px; font-weight: 600; color: #111827; margin: 24px 0 16px;">Top Priorities</h3>
        <ul style="margin: 0; padding-left: 20px;">
          ${listItems(safeArray(report.executiveSummary?.topPriorities))}
        </ul>
      </div>

      <!-- Key Strengths & Gaps -->
      <div style="margin-bottom: 40px;">
        <h2 style="font-size: 24px; font-weight: 600; color: #111827; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 2px solid #e5e7eb;">
          Market Perception
        </h2>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
          <tr>
            <td style="width: 50%; vertical-align: top; padding-right: 12px;">
              <div style="background: #f0fdf4; padding: 20px; border-radius: 12px;">
                <h3 style="font-size: 16px; font-weight: 600; color: #166534; margin: 0 0 12px;">✓ Key Strengths</h3>
                <ul style="margin: 0; padding-left: 16px;">
                  ${safeArray(report.marketPerception?.keyStrengths).map(s => `<li style="font-size: 13px; color: #15803d; margin-bottom: 6px;">${s}</li>`).join('')}
                </ul>
              </div>
            </td>
            <td style="width: 50%; vertical-align: top; padding-left: 12px;">
              <div style="background: #fef3c7; padding: 20px; border-radius: 12px;">
                <h3 style="font-size: 16px; font-weight: 600; color: #92400e; margin: 0 0 12px;">⚠ Critical Gaps</h3>
                <ul style="margin: 0; padding-left: 16px;">
                  ${safeArray(report.marketPerception?.criticalGaps).map(g => `<li style="font-size: 13px; color: #a16207; margin-bottom: 6px;">${g}</li>`).join('')}
                </ul>
              </div>
            </td>
          </tr>
        </table>

        <div style="background: #fef2f2; padding: 20px; border-radius: 12px;">
          <h3 style="font-size: 16px; font-weight: 600; color: #991b1b; margin: 0 0 12px;">⚡ Risks</h3>
          <ul style="margin: 0; padding-left: 16px;">
            ${safeArray(report.marketPerception?.risks).map(r => `<li style="font-size: 13px; color: #b91c1c; margin-bottom: 6px;">${r}</li>`).join('')}
          </ul>
        </div>
      </div>

      <!-- Strengths & Weaknesses Matrix -->
      <div style="margin-bottom: 40px; page-break-before: always;">
        <h2 style="font-size: 24px; font-weight: 600; color: #111827; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 2px solid #e5e7eb;">
          Strengths & Weaknesses Matrix
        </h2>
        
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <thead>
            <tr style="background: #f9fafb;">
              <th style="text-align: left; padding: 12px; border-bottom: 2px solid #e5e7eb;">Metric</th>
              <th style="text-align: center; padding: 12px; border-bottom: 2px solid #e5e7eb;">Score</th>
              <th style="text-align: left; padding: 12px; border-bottom: 2px solid #e5e7eb;">Rating</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(report.strengthsWeaknesses || {}).map(([key, value]) => {
              const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
              const numVal = typeof value === 'number' ? value : 0;
              const rating = numVal >= 8 ? 'Excellent' : numVal >= 6 ? 'Good' : numVal >= 4 ? 'Average' : 'Needs Work';
              const color = numVal >= 8 ? '#22c55e' : numVal >= 6 ? '#3b82f6' : numVal >= 4 ? '#eab308' : '#ef4444';
              return `
                <tr>
                  <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${label}</td>
                  <td style="text-align: center; padding: 12px; border-bottom: 1px solid #e5e7eb;">
                    <span style="color: ${color}; font-weight: 600;">${numVal}/10</span>
                  </td>
                  <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: ${color}; font-weight: 500;">${rating}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>

      <!-- Brand Positioning -->
      <div style="margin-bottom: 40px;">
        <h2 style="font-size: 24px; font-weight: 600; color: #111827; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 2px solid #e5e7eb;">
          Brand Positioning
        </h2>
        
        <h3 style="font-size: 16px; font-weight: 600; color: #374151; margin-bottom: 12px;">Personality Matrix</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 24px;">
          <tbody>
            ${Object.entries(report.brandPositioning?.personalityMatrix || {}).map(([key, value]) => {
              const label = key.replace('Score', '').replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
              const numVal = typeof value === 'number' ? value : 0;
              const width = numVal * 10;
              return `
                <tr>
                  <td style="padding: 8px 12px; width: 150px; font-weight: 500;">${label}</td>
                  <td style="padding: 8px 12px;">
                    <div style="background: #e5e7eb; border-radius: 9999px; height: 12px; overflow: hidden;">
                      <div style="background: #3b82f6; width: ${width}%; height: 100%; border-radius: 9999px;"></div>
                    </div>
                  </td>
                  <td style="padding: 8px 12px; width: 60px; text-align: right; font-weight: 600; color: #6b7280;">${numVal}/10</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="width: 50%; vertical-align: top; padding-right: 12px;">
              <h3 style="font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 8px;">Target Audience Signals</h3>
              <ul style="margin: 0; padding-left: 16px;">
                ${safeArray(report.brandPositioning?.targetAudienceSignals).map(s => `<li style="font-size: 12px; color: #1d4ed8; margin-bottom: 4px;">${s}</li>`).join('')}
              </ul>
            </td>
            <td style="width: 50%; vertical-align: top; padding-left: 12px;">
              <h3 style="font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 8px;">Differentiation Factors</h3>
              <ul style="margin: 0; padding-left: 16px;">
                ${safeArray(report.brandPositioning?.differentiation).map(d => `<li style="font-size: 12px; color: #7c3aed; margin-bottom: 4px;">${d}</li>`).join('')}
              </ul>
            </td>
          </tr>
        </table>
      </div>

      <!-- Recommendations -->
      <div style="margin-bottom: 40px; page-break-before: always;">
        <h2 style="font-size: 24px; font-weight: 600; color: #111827; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 2px solid #e5e7eb;">
          Strategic Recommendations
        </h2>

        <h3 style="font-size: 18px; font-weight: 600; color: #374151; margin-bottom: 16px;">Design Priorities</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 32px;">
          <thead>
            <tr style="background: #f9fafb;">
              <th style="text-align: left; padding: 12px; border-bottom: 2px solid #e5e7eb;">Priority</th>
              <th style="text-align: center; padding: 12px; border-bottom: 2px solid #e5e7eb;">Impact</th>
              <th style="text-align: center; padding: 12px; border-bottom: 2px solid #e5e7eb;">Effort</th>
            </tr>
          </thead>
          <tbody>
            ${safeArray(report.recommendations?.designPriorities).map((p: any, i: number) => `
              <tr>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
                  <strong>${i + 1}.</strong> ${safeString(p?.title, 'Untitled')}
                </td>
                <td style="text-align: center; padding: 12px; border-bottom: 1px solid #e5e7eb; text-transform: capitalize;">
                  ${safeString(p?.impact, '-')}
                </td>
                <td style="text-align: center; padding: 12px; border-bottom: 1px solid #e5e7eb; text-transform: capitalize;">
                  ${safeString(p?.effort, '-')}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h3 style="font-size: 18px; font-weight: 600; color: #374151; margin-bottom: 16px;">Brand Refinements</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 32px;">
          <tr>
            <td style="width: 50%; vertical-align: top; padding: 8px;">
              <div style="background: #f9fafb; padding: 16px; border-radius: 8px;">
                <strong style="color: #374151;">Logo:</strong>
                <p style="color: #6b7280; margin: 4px 0 0; font-size: 13px;">${safeString(report.recommendations?.brandRefinements?.logo)}</p>
              </div>
            </td>
            <td style="width: 50%; vertical-align: top; padding: 8px;">
              <div style="background: #f9fafb; padding: 16px; border-radius: 8px;">
                <strong style="color: #374151;">Colors:</strong>
                <p style="color: #6b7280; margin: 4px 0 0; font-size: 13px;">${safeString(report.recommendations?.brandRefinements?.colors)}</p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="width: 50%; vertical-align: top; padding: 8px;">
              <div style="background: #f9fafb; padding: 16px; border-radius: 8px;">
                <strong style="color: #374151;">Typography:</strong>
                <p style="color: #6b7280; margin: 4px 0 0; font-size: 13px;">${safeString(report.recommendations?.brandRefinements?.typography)}</p>
              </div>
            </td>
            <td style="width: 50%; vertical-align: top; padding: 8px;">
              <div style="background: #f9fafb; padding: 16px; border-radius: 8px;">
                <strong style="color: #374151;">Imagery:</strong>
                <p style="color: #6b7280; margin: 4px 0 0; font-size: 13px;">${safeString(report.recommendations?.brandRefinements?.imagery)}</p>
              </div>
            </td>
          </tr>
        </table>

        <h3 style="font-size: 18px; font-weight: 600; color: #374151; margin-bottom: 16px;">Positioning Opportunities</h3>
        <ul style="margin: 0; padding-left: 20px;">
          ${safeArray(report.recommendations?.positioningOpportunities).map(o => `<li style="font-size: 14px; color: #4b5563; margin-bottom: 8px;">${o}</li>`).join('')}
        </ul>
      </div>

      <!-- Action Plan -->
      <div style="margin-bottom: 40px; page-break-before: always;">
        <h2 style="font-size: 24px; font-weight: 600; color: #111827; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 2px solid #e5e7eb;">
          30/60/90 Day Action Plan
        </h2>

        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="width: 33.33%; vertical-align: top; padding: 8px;">
              <div style="background: #dbeafe; padding: 20px; border-radius: 12px; min-height: 150px;">
                <h3 style="font-size: 16px; font-weight: 600; color: #1e40af; margin: 0 0 16px;">30 Days</h3>
                <ul style="margin: 0; padding-left: 16px;">
                  ${safeArray(report.executiveSummary?.actionPlan?.thirtyDay).map(a => `<li style="font-size: 13px; color: #3730a3; margin-bottom: 8px;">${a}</li>`).join('')}
                </ul>
              </div>
            </td>
            <td style="width: 33.33%; vertical-align: top; padding: 8px;">
              <div style="background: #fef3c7; padding: 20px; border-radius: 12px; min-height: 150px;">
                <h3 style="font-size: 16px; font-weight: 600; color: #92400e; margin: 0 0 16px;">60 Days</h3>
                <ul style="margin: 0; padding-left: 16px;">
                  ${safeArray(report.executiveSummary?.actionPlan?.sixtyDay).map(a => `<li style="font-size: 13px; color: #9a3412; margin-bottom: 8px;">${a}</li>`).join('')}
                </ul>
              </div>
            </td>
            <td style="width: 33.33%; vertical-align: top; padding: 8px;">
              <div style="background: #d1fae5; padding: 20px; border-radius: 12px; min-height: 150px;">
                <h3 style="font-size: 16px; font-weight: 600; color: #065f46; margin: 0 0 16px;">90 Days</h3>
                <ul style="margin: 0; padding-left: 16px;">
                  ${safeArray(report.executiveSummary?.actionPlan?.ninetyDay).map(a => `<li style="font-size: 13px; color: #047857; margin-bottom: 8px;">${a}</li>`).join('')}
                </ul>
              </div>
            </td>
          </tr>
        </table>

        <div style="margin-top: 32px; background: #f0f9ff; border: 1px solid #bae6fd; padding: 20px; border-radius: 12px;">
          <h3 style="font-size: 16px; font-weight: 600; color: #0369a1; margin: 0 0 12px;">Success Metrics</h3>
          <ul style="margin: 0; padding-left: 20px;">
            ${safeArray(report.executiveSummary?.successMetrics).map(m => `<li style="font-size: 13px; color: #0284c7; margin-bottom: 8px;">${m}</li>`).join('')}
          </ul>
        </div>
      </div>

      <!-- Footer -->
      <div style="text-align: center; padding-top: 40px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px;">
        <p>Generated by Brand Intelligence System</p>
        <p>${generatedDate}</p>
      </div>
    </div>
  `;
};

export const exportCompetitiveAnalysisPdf = async (
  report: CompetitiveAnalysisReportData,
  options: ExportOptions,
  onProgress?: (status: string) => void
): Promise<void> => {
  onProgress?.('Preparing PDF...');

  const container = document.createElement('div');
  container.innerHTML = createPdfContent(report, options);
  applyPdfContainerStyles(container, 'a4');
  document.body.appendChild(container);
  
  // Force layout calculation - read multiple properties to ensure browser paints
  void container.offsetHeight;
  void container.offsetWidth;
  void container.getBoundingClientRect();
  
  // Small delay to ensure paint completes
  await new Promise(resolve => setTimeout(resolve, 500));

  const filename = `${options.entityName.replace(/\s+/g, '_')}_Competitive_Analysis.pdf`;

  const pdfOptions = {
    margin: PDF_PAPER_CONFIGS.a4.margins,
    filename,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: true,
      backgroundColor: '#ffffff',
      windowWidth: 800,
      scrollX: 0,
      scrollY: 0,
      x: 0,
      y: 0,
    },
    jsPDF: {
      ...PDF_PAPER_CONFIGS.a4.jsPDF,
      compress: true,
    },
    pagebreak: {
      mode: ['avoid-all', 'css'],
    },
  };

  onProgress?.('Generating PDF...');

  try {
    await html2pdf().set(pdfOptions).from(container).save();
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
