/**
 * Schedule PDF Export Utility
 * Exports event schedules as professionally formatted PDF documents
 * Uses jsPDF native text API for reliable, searchable output
 */

import type jsPDF from 'jspdf';
import { EventScheduleItem, EventSpeaker } from '@/types/event';
import { PDF_COLORS } from './pdfStyleConfig';

export interface PdfTemplateImages {
  headerImageUrl?: string;
  footerImageUrl?: string;
  backgroundImageUrl?: string;
  backgroundOpacity?: number;
  useTemplate: boolean;
}

interface PdfExportOptions {
  eventName: string;
  eventDates?: string;
  eventLocation?: string;
  speakers?: EventSpeaker[];
  template?: PdfTemplateImages;
}

// Session type badge colors (RGB tuples)
const SESSION_TYPE_COLORS: Record<string, { bg: [number, number, number]; text: [number, number, number] }> = {
  keynote: { bg: [243, 232, 255], text: [124, 58, 237] },
  session: { bg: [219, 234, 254], text: [37, 99, 235] },
  workshop: { bg: [220, 252, 231], text: [22, 163, 74] },
  panel: { bg: [255, 237, 213], text: [234, 88, 12] },
  break: { bg: [243, 244, 246], text: [75, 85, 99] },
  networking: { bg: [252, 231, 243], text: [219, 39, 119] },
  lunch: { bg: [254, 249, 195], text: [202, 138, 4] },
  registration: { bg: [204, 251, 241], text: [13, 148, 136] },
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

const getSpeakerName = (speakerIdOrName: string | undefined, speakers?: EventSpeaker[]): string => {
  if (!speakerIdOrName) return '';
  const speaker = speakers?.find(s => s.id === speakerIdOrName || s.name === speakerIdOrName);
  return speaker?.name || speakerIdOrName;
};

const extractDayNumber = (timeStr: string): string => {
  const match = timeStr?.match(/Day\s*(\d+)/i);
  return match ? `Day ${match[1]}` : 'Day 1';
};

const cleanTime = (timeStr: string): string => {
  return (timeStr || '').replace(/Day\s*\d+\s*-?\s*/i, '').trim();
};

const groupByDay = (schedule: EventScheduleItem[]): Record<string, EventScheduleItem[]> => {
  const groups: Record<string, EventScheduleItem[]> = {};
  schedule.forEach(item => {
    const day = extractDayNumber(item.time);
    if (!groups[day]) groups[day] = [];
    groups[day].push(item);
  });
  Object.keys(groups).forEach(day => {
    groups[day].sort((a, b) => cleanTime(a.time).localeCompare(cleanTime(b.time)));
  });
  return groups;
};

// Parse hex color to RGB tuple
const hexToRgb = (hex: string): [number, number, number] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [0, 0, 0];
};

/**
 * Export schedule as PDF using jsPDF native text
 */
export const exportScheduleToPdf = async (
  schedule: EventScheduleItem[],
  options: PdfExportOptions
): Promise<void> => {
  const { eventName, eventDates, eventLocation, speakers, template } = options;
  const { default: JsPDF } = await import('jspdf');
  const doc = new JsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  // Preload template images
  const loadedImages: { header?: HTMLImageElement; footer?: HTMLImageElement; background?: HTMLImageElement } = {};
  
  const loadImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  };

  if (template?.useTemplate) {
    try {
      if (template.headerImageUrl) loadedImages.header = await loadImage(template.headerImageUrl);
      if (template.footerImageUrl) loadedImages.footer = await loadImage(template.footerImageUrl);
      if (template.backgroundImageUrl) loadedImages.background = await loadImage(template.backgroundImageUrl);
    } catch (e) {
      console.warn('[PDF Template] Failed to load template image:', e);
    }
  }

  // Calculate content area based on template images
  const headerHeight = loadedImages.header ? 25 : 0;
  const footerHeight = loadedImages.footer ? 18 : 0;
  const contentTopStart = headerHeight > 0 ? headerHeight + 5 : 0;

  const applyTemplateToPage = () => {
    // Background image (watermark)
    if (loadedImages.background) {
      const opacity = template?.backgroundOpacity ?? 0.1;
      doc.saveGraphicsState();
      (doc as any).setGState(new (doc as any).GState({ opacity }));
      doc.addImage(loadedImages.background, 'PNG', 0, 0, pageWidth, pageHeight);
      doc.restoreGraphicsState();
    }
    // Header image
    if (loadedImages.header) {
      const imgRatio = loadedImages.header.naturalWidth / loadedImages.header.naturalHeight;
      const hHeight = headerHeight;
      const hWidth = Math.min(pageWidth, hHeight * imgRatio);
      doc.addImage(loadedImages.header, 'PNG', (pageWidth - hWidth) / 2, 0, hWidth, hHeight);
    }
    // Footer image
    if (loadedImages.footer) {
      const imgRatio = loadedImages.footer.naturalWidth / loadedImages.footer.naturalHeight;
      const fHeight = footerHeight;
      const fWidth = Math.min(pageWidth, fHeight * imgRatio);
      doc.addImage(loadedImages.footer, 'PNG', (pageWidth - fWidth) / 2, pageHeight - fHeight, fWidth, fHeight);
    }
  };

  // Apply template to first page
  applyTemplateToPage();

  let y = margin + contentTopStart;

  const checkPageBreak = (neededHeight: number) => {
    const maxY = pageHeight - 20 - footerHeight;
    if (y + neededHeight > maxY) {
      doc.addPage();
      applyTemplateToPage();
      y = margin + contentTopStart;
      return true;
    }
    return false;
  };

  // ── HEADER ──
  const headerBarY = y;
  doc.setFillColor(17, 24, 39); // gray-900
  doc.rect(0, headerBarY, pageWidth, 42, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(eventName, margin, headerBarY + 18);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Event Schedule', margin, headerBarY + 26);

  if (eventDates || eventLocation) {
    doc.setFontSize(9);
    const meta = [eventDates, eventLocation].filter(Boolean).join(' • ');
    doc.text(meta, margin, headerBarY + 34);
  }

  y = headerBarY + 50;

  // ── SCHEDULE BODY ──
  const groupedSchedule = groupByDay(schedule);
  const days = Object.keys(groupedSchedule).sort();

  const textColor = hexToRgb(PDF_COLORS.text.primary);
  const mutedColor = hexToRgb(PDF_COLORS.text.muted);
  const secondaryColor = hexToRgb(PDF_COLORS.text.secondary);

  days.forEach((day, dayIndex) => {
    const items = groupedSchedule[day];

    if (dayIndex > 0) {
      checkPageBreak(20);
      y += 6;
    }

    // Day header bar
    checkPageBreak(14);
    doc.setFillColor(243, 244, 246); // gray-100
    doc.roundedRect(margin, y, contentWidth, 10, 2, 2, 'F');
    doc.setTextColor(...textColor);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(day, margin + 4, y + 7);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...mutedColor);
    const countText = `${items.length} session${items.length !== 1 ? 's' : ''}`;
    doc.text(countText, margin + contentWidth - 4, y + 7, { align: 'right' });
    y += 14;

    // Items
    items.forEach((item, i) => {
      const time = cleanTime(item.time);
      const typeKey = item.track || 'session';
      const typeColors = SESSION_TYPE_COLORS[typeKey] || SESSION_TYPE_COLORS.session;
      const typeLabel = SESSION_TYPE_LABELS[typeKey] || 'Session';
      const speakerName = getSpeakerName(item.speaker, speakers);
      const hasDescription = !!item.description;
      const hasDetails = !!speakerName || !!item.location;

      // Estimate height needed
      const descLines = hasDescription ? doc.splitTextToSize(item.description!, contentWidth - 30) : [];
      const itemHeight = 8 + (hasDescription ? descLines.length * 4 + 2 : 0) + (hasDetails ? 6 : 0) + 4;
      checkPageBreak(itemHeight);

      // Separator line (except first)
      if (i > 0) {
        doc.setDrawColor(229, 231, 235); // gray-200
        doc.setLineWidth(0.3);
        doc.line(margin + 25, y, margin + contentWidth, y);
        y += 2;
      }

      // Time column
      doc.setTextColor(...secondaryColor);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text(time, margin + 2, y + 5);

      // Title
      doc.setTextColor(...textColor);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      const titleX = margin + 28;
      doc.text(item.title, titleX, y + 5);

      // Type badge
      const titleWidth = doc.getTextWidth(item.title);
      const badgeX = titleX + titleWidth + 3;
      const badgeLabelWidth = doc.getTextWidth(typeLabel);
      doc.setFillColor(...typeColors.bg);
      doc.roundedRect(badgeX, y + 1, badgeLabelWidth + 4, 5.5, 1.5, 1.5, 'F');
      doc.setTextColor(...typeColors.text);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text(typeLabel, badgeX + 2, y + 5);

      y += 8;

      // Description
      if (hasDescription) {
        doc.setTextColor(...mutedColor);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        const wrappedDesc = doc.splitTextToSize(item.description!, contentWidth - 30);
        doc.text(wrappedDesc, titleX, y + 1);
        y += wrappedDesc.length * 3.5 + 2;
      }

      // Speaker & Location
      if (hasDetails) {
        doc.setFontSize(7.5);
        doc.setTextColor(...secondaryColor);
        let detailX = titleX;
        if (speakerName) {
          doc.setFont('helvetica', 'bold');
          doc.text('Speaker: ', detailX, y + 1);
          detailX += doc.getTextWidth('Speaker: ');
          doc.setFont('helvetica', 'normal');
          doc.text(speakerName, detailX, y + 1);
          detailX += doc.getTextWidth(speakerName) + 6;
        }
        if (item.location) {
          doc.setFont('helvetica', 'bold');
          doc.text('Location: ', detailX, y + 1);
          detailX += doc.getTextWidth('Location: ');
          doc.setFont('helvetica', 'normal');
          doc.text(item.location, detailX, y + 1);
        }
        y += 5;
      }

      y += 2;
    });
  });

  // ── FOOTER ──
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(7);
    doc.setTextColor(156, 163, 175); // gray-400
    doc.setFont('helvetica', 'normal');
    const footerText = new Date().toLocaleDateString();
    doc.text(footerText, pageWidth / 2, pageHeight - 8, { align: 'center' });
  }

  // Save
  const safeEventName = eventName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  const timestamp = new Date().toISOString().split('T')[0];
  doc.save(`${safeEventName}-schedule-${timestamp}.pdf`);
};
