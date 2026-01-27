/**
 * Schedule Export Utility
 * Exports event schedules in CSV, JSON, and ICS (iCal) formats
 */

import { EventScheduleItem, EventSpeaker } from '@/types/event';

interface ExportOptions {
  eventName: string;
  eventDates?: string;
  eventLocation?: string;
  speakers?: EventSpeaker[];
}

/**
 * Get speaker name from ID or name string
 */
const getSpeakerName = (speakerIdOrName: string | undefined, speakers?: EventSpeaker[]): string => {
  if (!speakerIdOrName) return '';
  const speaker = speakers?.find(s => s.id === speakerIdOrName || s.name === speakerIdOrName);
  return speaker?.name || speakerIdOrName;
};

/**
 * Parse time string to extract hours and minutes
 * Handles formats like "9:00 AM", "Day 1 - 9:00 AM", "14:00"
 */
const parseTimeToDate = (timeStr: string, baseDate: Date = new Date()): Date => {
  // Remove day prefix if present
  const cleanTime = timeStr.replace(/Day\s*\d+\s*-?\s*/i, '').trim();
  
  // Try to match 12-hour format (9:00 AM, 10:30 PM)
  const match12h = cleanTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (match12h) {
    let hours = parseInt(match12h[1], 10);
    const minutes = parseInt(match12h[2], 10);
    const period = match12h[3]?.toUpperCase();
    
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    
    const result = new Date(baseDate);
    result.setHours(hours, minutes, 0, 0);
    return result;
  }
  
  // Try to match 24-hour format (14:00)
  const match24h = cleanTime.match(/(\d{1,2}):(\d{2})/);
  if (match24h) {
    const hours = parseInt(match24h[1], 10);
    const minutes = parseInt(match24h[2], 10);
    
    const result = new Date(baseDate);
    result.setHours(hours, minutes, 0, 0);
    return result;
  }
  
  return baseDate;
};

/**
 * Extract day number from time string
 */
const extractDayNumber = (timeStr: string): number => {
  const match = timeStr.match(/Day\s*(\d+)/i);
  return match ? parseInt(match[1], 10) : 1;
};

/**
 * Format date to iCal format (YYYYMMDDTHHMMSS)
 */
const formatToICalDate = (date: Date): string => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}00`;
};

/**
 * Escape special characters for iCal format
 */
const escapeICalText = (text: string): string => {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
};

/**
 * Export schedule as CSV
 */
export const exportScheduleAsCSV = (
  schedule: EventScheduleItem[],
  options: ExportOptions
): string => {
  const { speakers } = options;
  
  // CSV headers
  const headers = ['Time', 'Title', 'Description', 'Speaker', 'Location', 'Session Type'];
  
  // Build rows
  const rows = schedule.map(item => [
    item.time || '',
    item.title || '',
    (item.description || '').replace(/"/g, '""'), // Escape quotes
    getSpeakerName(item.speaker, speakers),
    item.location || '',
    item.track || 'session',
  ]);
  
  // Convert to CSV string
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
  
  return csvContent;
};

/**
 * Export schedule as JSON
 */
export const exportScheduleAsJSON = (
  schedule: EventScheduleItem[],
  options: ExportOptions
): string => {
  const { eventName, eventDates, eventLocation, speakers } = options;
  
  const exportData = {
    event: {
      name: eventName,
      dates: eventDates,
      location: eventLocation,
    },
    exportedAt: new Date().toISOString(),
    totalSessions: schedule.length,
    schedule: schedule.map(item => ({
      id: item.id,
      time: item.time,
      title: item.title,
      description: item.description || null,
      speaker: getSpeakerName(item.speaker, speakers) || null,
      location: item.location || null,
      sessionType: item.track || 'session',
    })),
  };
  
  return JSON.stringify(exportData, null, 2);
};

/**
 * Export schedule as ICS (iCal) format
 */
export const exportScheduleAsICS = (
  schedule: EventScheduleItem[],
  options: ExportOptions
): string => {
  const { eventName, eventDates, eventLocation, speakers } = options;
  
  // Try to parse the event date for the base date
  let baseDate = new Date();
  if (eventDates) {
    // Try to extract a date from the event dates string
    const dateMatch = eventDates.match(/(\w+)\s+(\d{1,2}),?\s*(\d{4})?/);
    if (dateMatch) {
      const monthStr = dateMatch[1];
      const day = parseInt(dateMatch[2], 10);
      const year = dateMatch[3] ? parseInt(dateMatch[3], 10) : new Date().getFullYear();
      
      const months: Record<string, number> = {
        january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
        july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
        jan: 0, feb: 1, mar: 2, apr: 3, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
      };
      
      const month = months[monthStr.toLowerCase()];
      if (month !== undefined) {
        baseDate = new Date(year, month, day);
      }
    }
  }
  
  // Generate unique calendar ID
  const calendarId = `schedule-${Date.now()}@brandhub`;
  
  // Build ICS events
  const events = schedule.map(item => {
    // Adjust base date for multi-day events
    const dayNumber = extractDayNumber(item.time);
    const itemDate = new Date(baseDate);
    itemDate.setDate(itemDate.getDate() + dayNumber - 1);
    
    const startTime = parseTimeToDate(item.time, itemDate);
    // Default session duration: 1 hour
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
    
    const speakerName = getSpeakerName(item.speaker, speakers);
    const description = [
      item.description,
      speakerName ? `Speaker: ${speakerName}` : null,
      item.track ? `Type: ${item.track}` : null,
    ].filter(Boolean).join('\\n');
    
    return [
      'BEGIN:VEVENT',
      `UID:${item.id}@${calendarId}`,
      `DTSTAMP:${formatToICalDate(new Date())}`,
      `DTSTART:${formatToICalDate(startTime)}`,
      `DTEND:${formatToICalDate(endTime)}`,
      `SUMMARY:${escapeICalText(item.title)}`,
      description ? `DESCRIPTION:${escapeICalText(description)}` : null,
      item.location ? `LOCATION:${escapeICalText(item.location)}` : null,
      eventLocation ? `GEO:${escapeICalText(eventLocation)}` : null,
      'END:VEVENT',
    ].filter(Boolean).join('\r\n');
  });
  
  // Build full ICS file
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:-//BrandHub//Event Schedule Export//EN`,
    `X-WR-CALNAME:${escapeICalText(eventName)} Schedule`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');
  
  return icsContent;
};

/**
 * Download content as a file
 */
export const downloadFile = (content: string, filename: string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up
  URL.revokeObjectURL(url);
};

/**
 * Export schedule in specified format and trigger download
 */
export const exportSchedule = (
  schedule: EventScheduleItem[],
  format: 'csv' | 'json' | 'ics',
  options: ExportOptions
): void => {
  const { eventName } = options;
  const safeEventName = eventName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  const timestamp = new Date().toISOString().split('T')[0];
  
  let content: string;
  let filename: string;
  let mimeType: string;
  
  switch (format) {
    case 'csv':
      content = exportScheduleAsCSV(schedule, options);
      filename = `${safeEventName}-schedule-${timestamp}.csv`;
      mimeType = 'text/csv;charset=utf-8';
      break;
    case 'json':
      content = exportScheduleAsJSON(schedule, options);
      filename = `${safeEventName}-schedule-${timestamp}.json`;
      mimeType = 'application/json;charset=utf-8';
      break;
    case 'ics':
      content = exportScheduleAsICS(schedule, options);
      filename = `${safeEventName}-schedule-${timestamp}.ics`;
      mimeType = 'text/calendar;charset=utf-8';
      break;
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
  
  downloadFile(content, filename, mimeType);
};

export type ExportFormat = 'csv' | 'json' | 'ics';
