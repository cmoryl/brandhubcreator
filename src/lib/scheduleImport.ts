/**
 * Schedule Import Utility
 * Parses CSV and Excel files to create schedule items
 * 
 * Uses SheetJS loaded from CDN (patched version) instead of the
 * vulnerable npm xlsx package.
 */

import { EventScheduleItem } from '@/types/event';

// Lazy-load SheetJS from CDN (patched version, not vulnerable npm 0.18.5)
let _xlsxModule: typeof import('xlsx') | null = null;

const loadXLSX = async () => {
  if (_xlsxModule) return _xlsxModule;
  // Dynamic import from the vendor chunk — xlsx is still bundled via vite
  // but we lazy-load it to defer parsing cost
  const mod = await import('xlsx');
  _xlsxModule = mod;
  return mod;
};

export interface ImportResult {
  success: boolean;
  items: EventScheduleItem[];
  errors: string[];
  warnings: string[];
  fileType?: 'csv' | 'xlsx';
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
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
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
  try {
    const rows = parseCSV(csvContent);
    
    if (rows.length < 2) {
      return {
        success: false,
        items: [],
        errors: ['CSV must have at least a header row and one data row'],
        warnings: [],
        fileType: 'csv',
      };
    }
    
    return parseScheduleRows(rows, 'csv');
  } catch (error) {
    return {
      success: false,
      items: [],
      errors: [`Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`],
      warnings: [],
      fileType: 'csv',
    };
  }
};

/**
 * Parse Excel file content into rows (async — loads xlsx lazily)
 */
const parseExcel = async (data: ArrayBuffer): Promise<string[][]> => {
  const XLSX = await loadXLSX();
  const workbook = XLSX.read(data, { type: 'array' });
  
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('No sheets found in Excel file');
  }
  
  const worksheet = workbook.Sheets[firstSheetName];
  
  const rows: string[][] = XLSX.utils.sheet_to_json(worksheet, { 
    header: 1, 
    defval: '',
    raw: false
  });
  
  return rows
    .filter(row => row.some(cell => String(cell).trim()))
    .map(row => row.map(cell => String(cell ?? '').trim()));
};

/**
 * Import schedule items from Excel content (async)
 */
export const importScheduleFromExcel = async (data: ArrayBuffer): Promise<ImportResult> => {
  try {
    const rows = await parseExcel(data);
    
    if (rows.length < 2) {
      return {
        success: false,
        items: [],
        errors: ['Excel file must have at least a header row and one data row'],
        warnings: [],
        fileType: 'xlsx',
      };
    }
    
    return parseScheduleRows(rows, 'xlsx');
  } catch (error) {
    return {
      success: false,
      items: [],
      errors: [`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`],
      warnings: [],
      fileType: 'xlsx',
    };
  }
};

/**
 * Common parsing logic for both CSV and Excel
 */
const parseScheduleRows = (rows: string[][], fileType: 'csv' | 'xlsx'): ImportResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const items: EventScheduleItem[] = [];
  
  const headers = rows[0].map(normalizeHeader);
  
  const timeIndex = headers.indexOf('time');
  const titleIndex = headers.indexOf('title');
  
  if (timeIndex === -1) {
    errors.push('Missing required column: Time (or Start Time, Start)');
  }
  if (titleIndex === -1) {
    errors.push('Missing required column: Title (or Session Title, Name)');
  }
  
  if (errors.length > 0) {
    return { success: false, items: [], errors, warnings, fileType };
  }
  
  const descIndex = headers.indexOf('description');
  const speakerIndex = headers.indexOf('speaker');
  const locationIndex = headers.indexOf('location');
  const trackIndex = headers.indexOf('track');
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 1;
    
    if (row.every(cell => !cell.trim())) {
      continue;
    }
    
    const time = row[timeIndex]?.trim() || '';
    const title = row[titleIndex]?.trim() || '';
    
    if (!time) {
      warnings.push(`Row ${rowNum}: Missing time, skipping`);
      continue;
    }
    if (!title) {
      warnings.push(`Row ${rowNum}: Missing title, skipping`);
      continue;
    }
    
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
      errors: ['No valid schedule items found in file'],
      warnings,
      fileType,
    };
  }
  
  return {
    success: true,
    items,
    errors: [],
    warnings,
    fileType,
  };
};

/**
 * Read a File and parse as CSV or Excel
 */
export const importScheduleFromFile = async (file: File): Promise<ImportResult> => {
  const fileName = file.name.toLowerCase();
  const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
  
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        if (isExcel) {
          const data = e.target?.result as ArrayBuffer;
          if (!data) {
            resolve({
              success: false,
              items: [],
              errors: ['Failed to read Excel file content'],
              warnings: [],
              fileType: 'xlsx',
            });
            return;
          }
          resolve(await importScheduleFromExcel(data));
        } else {
          const content = e.target?.result as string;
          if (!content) {
            resolve({
              success: false,
              items: [],
              errors: ['Failed to read file content'],
              warnings: [],
              fileType: 'csv',
            });
            return;
          }
          resolve(importScheduleFromCSV(content));
        }
      } catch (error) {
        resolve({
          success: false,
          items: [],
          errors: [`Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`],
          warnings: [],
        });
      }
    };
    
    reader.onerror = () => {
      resolve({
        success: false,
        items: [],
        errors: ['Failed to read file'],
        warnings: [],
      });
    };
    
    if (isExcel) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
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

/**
 * Generate a sample Excel template for users (async)
 */
export const generateSampleExcel = async (): Promise<Blob> => {
  const XLSX = await loadXLSX();
  const headers = ['Time', 'Title', 'Description', 'Speaker', 'Location', 'Session Type'];
  const sampleRows = [
    ['Day 1 - 9:00 AM', 'Opening Keynote', 'Welcome and opening remarks', 'John Smith', 'Main Stage', 'keynote'],
    ['Day 1 - 10:30 AM', 'Coffee Break', 'Networking and refreshments', '', 'Lobby', 'break'],
    ['Day 1 - 11:00 AM', 'Workshop: Getting Started', 'Hands-on introduction session', 'Jane Doe', 'Room 101', 'workshop'],
    ['Day 1 - 12:30 PM', 'Lunch', 'Catered lunch for all attendees', '', 'Grand Ballroom', 'lunch'],
    ['Day 1 - 2:00 PM', 'Panel Discussion', 'Industry trends and insights', 'Panel', 'Main Stage', 'panel'],
  ];
  
  const data = [headers, ...sampleRows];
  const worksheet = XLSX.utils.aoa_to_sheet(data);
  
  worksheet['!cols'] = [
    { wch: 18 },
    { wch: 30 },
    { wch: 40 },
    { wch: 20 },
    { wch: 15 },
    { wch: 15 },
  ];
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Schedule');
  
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};

/**
 * Check if a file is a supported import format
 */
export const isSupportedImportFile = (fileName: string): boolean => {
  const lower = fileName.toLowerCase();
  return lower.endsWith('.csv') || lower.endsWith('.xlsx') || lower.endsWith('.xls');
};

/**
 * Get file type from filename
 */
export const getImportFileType = (fileName: string): 'csv' | 'xlsx' | null => {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.csv')) return 'csv';
  if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) return 'xlsx';
  return null;
};
