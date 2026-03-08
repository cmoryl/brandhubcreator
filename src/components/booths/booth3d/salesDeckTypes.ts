/**
 * Types for booth sales deck generation
 */

export interface SalesDeckSlide {
  id: string;
  title: string;
  slideType: 'overview' | 'perspective' | 'layout' | 'journey' | 'panels' | 'hardware' | 'cost';
  content: {
    headline: string;
    bullets: string[];
    notes?: string;
  };
  /** Base64 data URL or blob URL of the screenshot for this slide */
  imageUrl?: string;
  /** Whether this slide is included in export */
  included: boolean;
}

export interface SalesDeckData {
  title: string;
  subtitle: string;
  slides: SalesDeckSlide[];
  generatedAt: string;
  boothSize: string;
  layoutName: string;
}

export interface SalesDeckGenerateRequest {
  divisionName: string;
  layoutName: string;
  boothSize: string;
  panelCount: number;
  furnitureList: string[];
  hasMonitors: boolean;
  hasPeople?: boolean;
  crowdScore?: number;
  panelLabels: string[];
  variantLabel: string;
}
