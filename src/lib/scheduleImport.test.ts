/**
 * Schedule Import Tests
 * Verifies CSV parsing and schedule import functionality
 */

import { describe, it, expect } from 'vitest';
import { importScheduleFromCSV, generateSampleCSV } from './scheduleImport';

describe('Schedule Import', () => {
  describe('generateSampleCSV', () => {
    it('should generate a valid CSV template', () => {
      const csv = generateSampleCSV();
      
      expect(csv).toBeDefined();
      expect(csv.length).toBeGreaterThan(0);
      
      // Check headers are present
      expect(csv).toContain('Time');
      expect(csv).toContain('Title');
      expect(csv).toContain('Description');
      expect(csv).toContain('Speaker');
      expect(csv).toContain('Location');
      expect(csv).toContain('Session Type');
      
      // Check sample data
      expect(csv).toContain('Opening Keynote');
      expect(csv).toContain('Coffee Break');
    });
  });

  describe('importScheduleFromCSV', () => {
    it('should parse a valid CSV with all columns', () => {
      const csv = `Time,Title,Description,Speaker,Location,Session Type
"Day 1 - 9:00 AM","Opening Keynote","Welcome remarks","John Smith","Main Stage","keynote"
"Day 1 - 10:30 AM","Coffee Break","Networking time","","Lobby","break"`;
      
      const result = importScheduleFromCSV(csv);
      
      expect(result.success).toBe(true);
      expect(result.items.length).toBe(2);
      expect(result.errors.length).toBe(0);
      
      // Check first item
      expect(result.items[0].title).toBe('Opening Keynote');
      expect(result.items[0].time).toBe('Day 1 - 9:00 AM');
      expect(result.items[0].track).toBe('keynote');
      expect(result.items[0].speaker).toBe('John Smith');
      
      // Check second item
      expect(result.items[1].title).toBe('Coffee Break');
      expect(result.items[1].track).toBe('break');
    });

    it('should handle alternative header names', () => {
      const csv = `Start Time,Session Title,Details,Presenter,Room,Category
"10:00 AM","Workshop A","Hands-on session","Jane Doe","Room 101","workshop"`;
      
      const result = importScheduleFromCSV(csv);
      
      expect(result.success).toBe(true);
      expect(result.items.length).toBe(1);
      expect(result.items[0].time).toBe('10:00 AM');
      expect(result.items[0].title).toBe('Workshop A');
      expect(result.items[0].description).toBe('Hands-on session');
      expect(result.items[0].speaker).toBe('Jane Doe');
      expect(result.items[0].location).toBe('Room 101');
    });

    it('should normalize session types', () => {
      const csv = `Time,Title,Session Type
"9:00 AM","Coffee","coffee"
"10:00 AM","Happy Hour","happy hour"
"11:00 AM","Hands-on Lab","hands-on"
"12:00 PM","Roundtable","roundtable"`;
      
      const result = importScheduleFromCSV(csv);
      
      expect(result.success).toBe(true);
      expect(result.items.length).toBe(4);
      expect(result.items[0].track).toBe('break'); // coffee -> break
      expect(result.items[1].track).toBe('networking'); // happy hour -> networking
      expect(result.items[2].track).toBe('workshop'); // hands-on -> workshop
      expect(result.items[3].track).toBe('panel'); // roundtable -> panel
    });

    it('should fail if required columns are missing', () => {
      const csv = `Description,Speaker
"Some description","John"`;
      
      const result = importScheduleFromCSV(csv);
      
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.includes('Time'))).toBe(true);
      expect(result.errors.some(e => e.includes('Title'))).toBe(true);
    });

    it('should handle empty rows gracefully', () => {
      const csv = `Time,Title
"9:00 AM","Session 1"

"10:00 AM","Session 2"
,,`;
      
      const result = importScheduleFromCSV(csv);
      
      expect(result.success).toBe(true);
      expect(result.items.length).toBe(2);
    });

    it('should warn about rows with missing required data', () => {
      const csv = `Time,Title
"9:00 AM","Valid Session"
"","Missing Time"
"10:00 AM",""`;
      
      const result = importScheduleFromCSV(csv);
      
      expect(result.success).toBe(true);
      expect(result.items.length).toBe(1);
      expect(result.warnings.length).toBe(2);
    });

    it('should handle quoted fields with commas', () => {
      const csv = `Time,Title,Description
"9:00 AM","Workshop: Intro, Part 1","First, second, and third topics"`;
      
      const result = importScheduleFromCSV(csv);
      
      expect(result.success).toBe(true);
      expect(result.items[0].title).toBe('Workshop: Intro, Part 1');
      expect(result.items[0].description).toBe('First, second, and third topics');
    });

    it('should round-trip the sample CSV template', () => {
      const template = generateSampleCSV();
      const result = importScheduleFromCSV(template);
      
      expect(result.success).toBe(true);
      expect(result.items.length).toBe(5); // Template has 5 sample rows
      expect(result.errors.length).toBe(0);
      
      // Verify specific items
      const keynote = result.items.find(i => i.title === 'Opening Keynote');
      expect(keynote).toBeDefined();
      expect(keynote?.track).toBe('keynote');
      
      const workshop = result.items.find(i => i.title.includes('Workshop'));
      expect(workshop).toBeDefined();
      expect(workshop?.track).toBe('workshop');
    });
  });
});
