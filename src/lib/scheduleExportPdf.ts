/**
 * Schedule PDF Export Utility
 * Exports event schedules as professionally formatted PDF documents
 */

import html2pdf from 'html2pdf.js';
import { EventScheduleItem, EventSpeaker } from '@/types/event';
import {
  PDF_FONTS,
  PDF_COLORS,
  PDF_TYPOGRAPHY,
  PDF_SPACING,
  PDF_PAPER_CONFIGS,
  applyPdfContainerStyles,
  generatePdfFooter,
  escapeHtml,
  formatPdfDate,
} from './pdfStyleConfig';

interface PdfExportOptions {
  eventName: string;
  eventDates?: string;
  eventLocation?: string;
  speakers?: EventSpeaker[];
}

// Session type styling for PDF
const SESSION_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  keynote: { bg: '#f3e8ff', text: '#7c3aed' },
  session: { bg: '#dbeafe', text: '#2563eb' },
  workshop: { bg: '#dcfce7', text: '#16a34a' },
  panel: { bg: '#ffedd5', text: '#ea580c' },
  break: { bg: '#f3f4f6', text: '#4b5563' },
  networking: { bg: '#fce7f3', text: '#db2777' },
  lunch: { bg: '#fef9c3', text: '#ca8a04' },
  registration: { bg: '#ccfbf1', text: '#0d9488' },
};

const SESSION_TYPE_LABELS: Record<string, string> = {
  keynote: 'Keynote',
  session: 'Session',
  workshop: 'Workshop',
  panel: 'Panel',
  break: 'Break',
  networking: 'Networking',
  lunch: 'Lunch/Meal',
  registration: 'Registration',
};

/**
 * Get speaker name from ID or name string
 */
const getSpeakerName = (speakerIdOrName: string | undefined, speakers?: EventSpeaker[]): string => {
  if (!speakerIdOrName) return '';
  const speaker = speakers?.find(s => s.id === speakerIdOrName || s.name === speakerIdOrName);
  return speaker?.name || speakerIdOrName;
};

/**
 * Extract day number from time string
 */
const extractDayNumber = (timeStr: string): string => {
  const match = timeStr?.match(/Day\s*(\d+)/i);
  return match ? `Day ${match[1]}` : 'Day 1';
};

/**
 * Clean time string (remove day prefix)
 */
const cleanTime = (timeStr: string): string => {
  return (timeStr || '').replace(/Day\s*\d+\s*-?\s*/i, '').trim();
};

/**
 * Group schedule items by day
 */
const groupByDay = (schedule: EventScheduleItem[]): Record<string, EventScheduleItem[]> => {
  const groups: Record<string, EventScheduleItem[]> = {};
  
  schedule.forEach(item => {
    const day = extractDayNumber(item.time);
    if (!groups[day]) groups[day] = [];
    groups[day].push(item);
  });

  // Sort items within each day by time
  Object.keys(groups).forEach(day => {
    groups[day].sort((a, b) => {
      const timeA = cleanTime(a.time);
      const timeB = cleanTime(b.time);
      return timeA.localeCompare(timeB);
    });
  });

  return groups;
};

/**
 * Generate HTML content for the PDF
 */
const generatePdfHtml = (schedule: EventScheduleItem[], options: PdfExportOptions): string => {
  const { eventName, eventDates, eventLocation, speakers } = options;
  const groupedSchedule = groupByDay(schedule);
  const days = Object.keys(groupedSchedule).sort();

  const scheduleHtml = days.map(day => {
    const items = groupedSchedule[day];
    
    const itemsHtml = items.map(item => {
      const typeColors = SESSION_TYPE_COLORS[item.track || 'session'] || SESSION_TYPE_COLORS.session;
      const typeLabel = SESSION_TYPE_LABELS[item.track || 'session'] || 'Session';
      const speakerName = getSpeakerName(item.speaker, speakers);
      
      // Escape all user-controlled fields to prevent XSS
      const safeTitle = escapeHtml(item.title);
      const safeDescription = escapeHtml(item.description || '');
      const safeSpeakerName = escapeHtml(speakerName);
      const safeLocation = escapeHtml(item.location || '');
      const safeTime = escapeHtml(cleanTime(item.time));
      
      return `
        <div style="display: flex; gap: ${PDF_SPACING.lg}; padding: ${PDF_SPACING.md} 0; border-bottom: 1px solid ${PDF_COLORS.border.light};">
          <div style="min-width: 80px; font-size: ${PDF_TYPOGRAPHY.small.size}; font-weight: 500; color: ${PDF_COLORS.text.secondary};">
            ${safeTime}
          </div>
          <div style="flex: 1;">
            <div style="display: flex; align-items: center; gap: ${PDF_SPACING.sm}; margin-bottom: ${PDF_SPACING.xs};">
              <span style="font-weight: 600; color: ${PDF_COLORS.text.primary};">${safeTitle}</span>
              <span style="
                display: inline-block;
                padding: 2px 8px;
                font-size: ${PDF_TYPOGRAPHY.tiny.size};
                font-weight: 500;
                border-radius: 9999px;
                background-color: ${typeColors.bg};
                color: ${typeColors.text};
              ">${typeLabel}</span>
            </div>
            ${item.description ? `<p style="font-size: ${PDF_TYPOGRAPHY.caption.size}; color: ${PDF_COLORS.text.muted}; margin: ${PDF_SPACING.xs} 0;">${safeDescription}</p>` : ''}
            <div style="display: flex; gap: ${PDF_SPACING.lg}; margin-top: 6px;">
              ${speakerName ? `
                <span style="font-size: ${PDF_TYPOGRAPHY.caption.size}; color: ${PDF_COLORS.text.secondary};">
                  <strong>Speaker:</strong> ${safeSpeakerName}
                </span>
              ` : ''}
              ${item.location ? `
                <span style="font-size: ${PDF_TYPOGRAPHY.caption.size}; color: ${PDF_COLORS.text.secondary};">
                  <strong>Location:</strong> ${safeLocation}
                </span>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div style="margin-bottom: ${PDF_SPACING['2xl']};" class="pdf-avoid-break">
        <h3 style="
          font-size: ${PDF_TYPOGRAPHY.h4.size};
          font-weight: ${PDF_TYPOGRAPHY.h4.weight};
          color: ${PDF_COLORS.text.primary};
          padding: ${PDF_SPACING.sm} ${PDF_SPACING.md};
          background-color: ${PDF_COLORS.background.muted};
          border-radius: 6px;
          margin-bottom: ${PDF_SPACING.sm};
        ">${day}</h3>
        ${itemsHtml}
      </div>
    `;
  }).join('');

  return `
    <div style="font-family: ${PDF_FONTS.primary}; padding: 20px; max-width: 800px;">
      <!-- Header -->
      <div style="text-align: center; margin-bottom: ${PDF_SPACING['3xl']}; padding-bottom: ${PDF_SPACING['2xl']}; border-bottom: 2px solid ${PDF_COLORS.border.light};">
        <h1 style="font-size: ${PDF_TYPOGRAPHY.h1.size}; font-weight: ${PDF_TYPOGRAPHY.h1.weight}; color: ${PDF_COLORS.text.primary}; margin: 0 0 8px 0;">
          ${escapeHtml(eventName)}
        </h1>
        <p style="font-size: ${PDF_TYPOGRAPHY.body.size}; color: ${PDF_COLORS.text.muted}; margin: 0;">
          Event Schedule
        </p>
        ${eventDates || eventLocation ? `
          <div style="margin-top: ${PDF_SPACING.md}; font-size: ${PDF_TYPOGRAPHY.small.size}; color: ${PDF_COLORS.text.secondary};">
            ${eventDates ? `<span>${escapeHtml(eventDates)}</span>` : ''}
            ${eventDates && eventLocation ? ' • ' : ''}
            ${eventLocation ? `<span>${escapeHtml(eventLocation)}</span>` : ''}
          </div>
        ` : ''}
      </div>

      <!-- Schedule -->
      ${scheduleHtml}

      <!-- Footer -->
      <div style="margin-top: ${PDF_SPACING['3xl']}; padding-top: ${PDF_SPACING.lg}; border-top: 1px solid ${PDF_COLORS.border.light}; text-align: center;">
        <p style="font-size: ${PDF_TYPOGRAPHY.tiny.size}; color: ${PDF_COLORS.text.subtle}; margin: 0;">
          Generated by BrandHub • ${formatPdfDate()} • ${schedule.length} sessions
        </p>
      </div>
    </div>
  `;
};

/**
 * Export schedule as PDF
 */
export const exportScheduleToPdf = async (
  schedule: EventScheduleItem[],
  options: PdfExportOptions
): Promise<void> => {
  const { eventName } = options;
  const safeEventName = eventName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `${safeEventName}-schedule-${timestamp}.pdf`;

  // Create container with consistent PDF styling
  const container = document.createElement('div');
  container.innerHTML = generatePdfHtml(schedule, options);
  applyPdfContainerStyles(container, 'a4');
  document.body.appendChild(container);
  
  // Force layout calculation
  container.offsetHeight;

  const pdfOptions = {
    margin: PDF_PAPER_CONFIGS.a4.margins,
    filename,
    image: { type: 'jpeg' as const, quality: 0.95 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: PDF_COLORS.background.white,
    },
    jsPDF: {
      ...PDF_PAPER_CONFIGS.a4.jsPDF,
      compress: true,
    },
    pagebreak: {
      mode: ['avoid-all', 'css'],
      avoid: '.pdf-avoid-break',
    },
  };

  try {
    await html2pdf().set(pdfOptions).from(container).save();
  } finally {
    // Clean up
    document.body.removeChild(container);
  }
};
