/**
 * Schedule Import Utility
 * Parses CSV files to create schedule items
 */

import { EventScheduleItem } from '@/types/event';

export interface ImportResult {
  success: boolean;
  items: EventScheduleItem[];
  errors: string[];
  warnings: string[];
}

// Valid session types for validation
const VALID_SESSION_TYPES = [
  'keynote', 'session', 'workshop', 'panel', 
  'break', 'networking', 'lunch', 'registration'
];

/**
 * Parse a CSV string into rows and columns
 */
const parseCSV = (content: string): string[][] => {
  const lines = content.split(/\r?\n/).filter(line => line.trim());
  const rows: string[][] = [];
  
  for (const line of lines) {
    const row: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i++;
        } else {
          // Toggle quote mode
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    // Push the last field
    row.push(current.trim());
    rows.push(row);
  }
  
  return rows;
};

/**
 * Normalize header names to standard format
 */
const normalizeHeader = (header: string): string => {
  const normalized = header.toLowerCase().trim();
  
  // Map common variations to standard names
  const headerMap: Record<string, string> = {
    'time': 'time',
    'start time': 'time',
    'start': 'time',
    'schedule time': 'time',
    'title': 'title',
    'session title': 'title',
    'name': 'title',
    'session name': 'title',
    'event': 'title',
    'description': 'description',
    'details': 'description',
    'summary': 'description',
    'speaker': 'speaker',
    'speakers': 'speaker',
    'presenter': 'speaker',
    'presenters': 'speaker',
    'host': 'speaker',
    'location': 'location',
    'room': 'location',
    'venue': 'location',
    'track': 'track',
    'type': 'track',
    'session type': 'track',
    'category': 'track',
  };
  
  return headerMap[normalized] || normalized;
};

/**
 * Normalize session type to valid value
 */
const normalizeSessionType = (type: string): string => {
  const normalized = type.toLowerCase().trim();
  
  // Map common variations
  const typeMap: Record<string, string> = {
    'keynote': 'keynote',
    'opening': 'keynote',
    'closing': 'keynote',
    'main': 'keynote',
    'session': 'session',
    'talk': 'session',
    'presentation': 'session',
    'workshop': 'workshop',
    'hands-on': 'workshop',
    'tutorial': 'workshop',
    'lab': 'workshop',
    'panel': 'panel',
    'discussion': 'panel',
    'roundtable': 'panel',
    'break': 'break',
    'coffee': 'break',
    'tea': 'break',
    'networking': 'networking',
    'social': 'networking',
    'reception': 'networking',
    'happy hour': 'networking',
    'lunch': 'lunch',
    'breakfast': 'lunch',
    'dinner': 'lunch',
    'meal': 'lunch',
    'food': 'lunch',
    'registration': 'registration',
    'check-in': 'registration',
    'checkin': 'registration',
    'welcome': 'registration',
  };
  
  return typeMap[normalized] || (VALID_SESSION_TYPES.includes(normalized) ? normalized : 'session');
};

/**
 * Import schedule items from CSV content
 */
export const importScheduleFromCSV = (csvContent: string): ImportResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const items: EventScheduleItem[] = [];
  
  try {
    const rows = parseCSV(csvContent);
    
    if (rows.length < 2) {
      return {
        success: false,
        items: [],
        errors: ['CSV must have at least a header row and one data row'],
        warnings: [],
      };
    }
    
    // Parse headers
    const headers = rows[0].map(normalizeHeader);
    
    // Validate required columns
    const timeIndex = headers.indexOf('time');
    const titleIndex = headers.indexOf('title');
    
    if (timeIndex === -1) {
      errors.push('Missing required column: Time (or Start Time, Start)');
    }
    if (titleIndex === -1) {
      errors.push('Missing required column: Title (or Session Title, Name)');
    }
    
    if (errors.length > 0) {
      return { success: false, items: [], errors, warnings };
    }
    
    // Get optional column indices
    const descIndex = headers.indexOf('description');
    const speakerIndex = headers.indexOf('speaker');
    const locationIndex = headers.indexOf('location');
    const trackIndex = headers.indexOf('track');
    
    // Parse data rows
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 1;
      
      // Skip empty rows
      if (row.every(cell => !cell.trim())) {
        continue;
      }
      
      const time = row[timeIndex]?.trim() || '';
      const title = row[titleIndex]?.trim() || '';
      
      // Validate required fields
      if (!time) {
        warnings.push(`Row ${rowNum}: Missing time, skipping`);
        continue;
      }
      if (!title) {
        warnings.push(`Row ${rowNum}: Missing title, skipping`);
        continue;
      }
      
      // Create schedule item
      const item: EventScheduleItem = {
        id: crypto.randomUUID(),
        time,
        title,
        description: descIndex >= 0 ? row[descIndex]?.trim() : undefined,
        speaker: speakerIndex >= 0 ? row[speakerIndex]?.trim() : undefined,
        location: locationIndex >= 0 ? row[locationIndex]?.trim() : undefined,
        track: trackIndex >= 0 ? normalizeSessionType(row[trackIndex] || 'session') : 'session',
      };
      
      items.push(item);
    }
    
    if (items.length === 0) {
      return {
        success: false,
        items: [],
        errors: ['No valid schedule items found in CSV'],
        warnings,
      };
    }
    
    return {
      success: true,
      items,
      errors: [],
      warnings,
    };
  } catch (error) {
    return {
      success: false,
      items: [],
      errors: [`Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`],
      warnings: [],
    };
  }
};

/**
 * Read a File and parse as CSV
 */
export const importScheduleFromFile = async (file: File): Promise<ImportResult> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content) {
        resolve({
          success: false,
          items: [],
          errors: ['Failed to read file content'],
          warnings: [],
        });
        return;
      }
      
      resolve(importScheduleFromCSV(content));
    };
    
    reader.onerror = () => {
      resolve({
        success: false,
        items: [],
        errors: ['Failed to read file'],
        warnings: [],
      });
    };
    
    reader.readAsText(file);
  });
};

/**
 * Generate a sample CSV template for users
 */
export const generateSampleCSV = (): string => {
  const headers = ['Time', 'Title', 'Description', 'Speaker', 'Location', 'Session Type'];
  const sampleRows = [
    ['Day 1 - 9:00 AM', 'Opening Keynote', 'Welcome and opening remarks', 'John Smith', 'Main Stage', 'keynote'],
    ['Day 1 - 10:30 AM', 'Coffee Break', 'Networking and refreshments', '', 'Lobby', 'break'],
    ['Day 1 - 11:00 AM', 'Workshop: Getting Started', 'Hands-on introduction session', 'Jane Doe', 'Room 101', 'workshop'],
    ['Day 1 - 12:30 PM', 'Lunch', 'Catered lunch for all attendees', '', 'Grand Ballroom', 'lunch'],
    ['Day 1 - 2:00 PM', 'Panel Discussion', 'Industry trends and insights', 'Panel', 'Main Stage', 'panel'],
  ];
  
  const rows = [headers, ...sampleRows];
  return rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
};
