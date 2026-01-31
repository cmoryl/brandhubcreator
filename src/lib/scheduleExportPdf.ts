/**
 * Schedule PDF Export Utility
 * Exports event schedules as professionally formatted PDF documents
 */

import html2pdf from 'html2pdf.js';
import { EventScheduleItem, EventSpeaker } from '@/types/event';

/**
 * Escape HTML special characters to prevent XSS attacks
 */
const escapeHtml = (unsafe: string): string => {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

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
        <div style="display: flex; gap: 16px; padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
          <div style="min-width: 80px; font-size: 13px; font-weight: 500; color: #374151;">
            ${safeTime}
          </div>
          <div style="flex: 1;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
              <span style="font-weight: 600; color: #111827;">${safeTitle}</span>
              <span style="
                display: inline-block;
                padding: 2px 8px;
                font-size: 11px;
                font-weight: 500;
                border-radius: 9999px;
                background-color: ${typeColors.bg};
                color: ${typeColors.text};
              ">${typeLabel}</span>
            </div>
            ${item.description ? `<p style="font-size: 12px; color: #6b7280; margin: 4px 0;">${safeDescription}</p>` : ''}
            <div style="display: flex; gap: 16px; margin-top: 6px;">
              ${speakerName ? `
                <span style="font-size: 12px; color: #4b5563;">
                  <strong>Speaker:</strong> ${safeSpeakerName}
                </span>
              ` : ''}
              ${item.location ? `
                <span style="font-size: 12px; color: #4b5563;">
                  <strong>Location:</strong> ${safeLocation}
                </span>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div style="margin-bottom: 24px;" class="pdf-avoid-break">
        <h3 style="
          font-size: 16px;
          font-weight: 600;
          color: #111827;
          padding: 8px 12px;
          background-color: #f3f4f6;
          border-radius: 6px;
          margin-bottom: 8px;
        ">${day}</h3>
        ${itemsHtml}
      </div>
    `;
  }).join('');

  return `
    <div style="font-family: system-ui, -apple-system, sans-serif; padding: 20px; max-width: 800px;">
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #e5e7eb;">
      <h1 style="font-size: 28px; font-weight: 700; color: #111827; margin: 0 0 8px 0;">
          ${escapeHtml(eventName)}
        </h1>
        <p style="font-size: 14px; color: #6b7280; margin: 0;">
          Event Schedule
        </p>
        ${eventDates || eventLocation ? `
          <div style="margin-top: 12px; font-size: 13px; color: #4b5563;">
            ${eventDates ? `<span>${escapeHtml(eventDates)}</span>` : ''}
            ${eventDates && eventLocation ? ' • ' : ''}
            ${eventLocation ? `<span>${escapeHtml(eventLocation)}</span>` : ''}
          </div>
        ` : ''}
      </div>

      <!-- Schedule -->
      ${scheduleHtml}

      <!-- Footer -->
      <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center;">
        <p style="font-size: 11px; color: #9ca3af; margin: 0;">
          Generated on ${new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })} • ${schedule.length} sessions
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

  // Create a temporary container for the HTML
  const container = document.createElement('div');
  container.innerHTML = generatePdfHtml(schedule, options);
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  document.body.appendChild(container);

  const pdfOptions = {
    margin: [15, 15, 15, 15] as [number, number, number, number],
    filename,
    image: { type: 'jpeg' as const, quality: 0.95 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    },
    jsPDF: {
      unit: 'mm' as const,
      format: 'a4',
      orientation: 'portrait' as const,
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
