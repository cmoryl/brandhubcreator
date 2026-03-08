/**
 * Pre-configured furniture layouts for booth design presets.
 * Each layout includes positioned PlacedAssets and FlooringConfig.
 * 
 * Coordinate system:
 *   x = left–right (0 = center of back wall)
 *   y = height (0 = floor)
 *   z = front–back (0 = back wall, positive = toward aisle)
 * 
 * Conversion: 1 foot = 0.3048m, 1 inch = 0.0254m
 */

import type { PlacedAsset } from './boothFurnitureConfigs';
import type { FlooringConfig } from './BoothFloorpad';

const FT = 0.3048;

let _uid = 0;
function uid() { return `preset-${Date.now()}-${++_uid}`; }

// ═══════════════════════════════════════
// TECHNOLOGY
// ═══════════════════════════════════════

/** SaaS Product Launch — U-Shape 10×10 */
export const TECH_SAAS_ASSETS: PlacedAsset[] = [
  { instanceId: uid(), assetId: 'table-6ft-covered', position: [0, 0, 2.2 * FT], rotation: [0, 0, 0], tableCoverColor: '#1e40af' },
  { instanceId: uid(), assetId: 'kiosk-ipad', position: [-1.0, 0, 5 * FT], rotation: [0, 0.3, 0], label: 'Demo 1' },
  { instanceId: uid(), assetId: 'kiosk-ipad', position: [1.0, 0, 5 * FT], rotation: [0, -0.3, 0], label: 'Demo 2' },
  { instanceId: uid(), assetId: 'tv-55', position: [0, 0, 1 * FT], rotation: [0, 0, 0], label: 'Product Video' },
  { instanceId: uid(), assetId: 'bar-stool', position: [-0.7, 0, 7 * FT], rotation: [0, 0, 0] },
  { instanceId: uid(), assetId: 'bar-stool', position: [0.7, 0, 7 * FT], rotation: [0, 0, 0] },
  { instanceId: uid(), assetId: 'literature-rack', position: [1.3, 0, 1 * FT], rotation: [0, 0, 0] },
];
export const TECH_SAAS_FLOOR: FlooringConfig = { type: 'carpet-plush', color: '#1a1a2e', showBorder: true, showDimensions: true };

/** Enterprise Solutions — Island 20×20 */
export const TECH_ENTERPRISE_ASSETS: PlacedAsset[] = [
  { instanceId: uid(), assetId: 'counter-reception', position: [0, 0, 16 * FT], rotation: [0, 0, 0], tableCoverColor: '#1e3a5f', label: 'Reception' },
  { instanceId: uid(), assetId: 'tv-65', position: [-3 * FT, 0, 2 * FT], rotation: [0, 0, 0], label: 'Platform Demo' },
  { instanceId: uid(), assetId: 'tv-65', position: [3 * FT, 0, 2 * FT], rotation: [0, 0, 0], label: 'Case Studies' },
  { instanceId: uid(), assetId: 'tv-55', position: [-7 * FT, 0, 10 * FT], rotation: [0, Math.PI / 2, 0], label: 'Demo Pod 1' },
  { instanceId: uid(), assetId: 'tv-55', position: [7 * FT, 0, 10 * FT], rotation: [0, -Math.PI / 2, 0], label: 'Demo Pod 2' },
  { instanceId: uid(), assetId: 'table-8ft-covered', position: [0, 0, 10 * FT], rotation: [0, 0, 0], tableCoverColor: '#1e40af', label: 'Meeting Table' },
  { instanceId: uid(), assetId: 'lounge-chair', position: [-1.2, 0, 10 * FT], rotation: [0, Math.PI / 4, 0] },
  { instanceId: uid(), assetId: 'lounge-chair', position: [1.2, 0, 10 * FT], rotation: [0, -Math.PI / 4, 0] },
  { instanceId: uid(), assetId: 'cocktail-table', position: [-5 * FT, 0, 16 * FT], rotation: [0, 0, 0] },
  { instanceId: uid(), assetId: 'cocktail-table', position: [5 * FT, 0, 16 * FT], rotation: [0, 0, 0] },
  { instanceId: uid(), assetId: 'literature-rack', position: [8 * FT, 0, 2 * FT], rotation: [0, 0, 0] },
  { instanceId: uid(), assetId: 'literature-rack', position: [-8 * FT, 0, 2 * FT], rotation: [0, 0, 0] },
];
export const TECH_ENTERPRISE_FLOOR: FlooringConfig = { type: 'carpet-ribbed', color: '#1e293b', showBorder: true, showDimensions: true };

/** AI & Machine Learning — L-Shape 10×10 */
export const TECH_AI_ASSETS: PlacedAsset[] = [
  { instanceId: uid(), assetId: 'tv-65', position: [0, 0, 1 * FT], rotation: [0, 0, 0], label: 'AI Visualization' },
  { instanceId: uid(), assetId: 'kiosk-ipad', position: [0, 0, 6 * FT], rotation: [0, 0, 0], label: 'Interactive Demo' },
  { instanceId: uid(), assetId: 'table-6ft-covered', position: [-1.0, 0, 3.5 * FT], rotation: [0, 0, 0], tableCoverColor: '#4c1d95' },
  { instanceId: uid(), assetId: 'bar-stool', position: [-0.5, 0, 5 * FT], rotation: [0, 0, 0] },
  { instanceId: uid(), assetId: 'bar-stool', position: [0.5, 0, 5 * FT], rotation: [0, 0, 0] },
];
export const TECH_AI_FLOOR: FlooringConfig = { type: 'vinyl-tile', color: '#1a1a2e', showBorder: true, showDimensions: true };

/** Cybersecurity — U-Shape 10×10 */
export const TECH_CYBER_ASSETS: PlacedAsset[] = [
  { instanceId: uid(), assetId: 'tv-55', position: [0, 0, 1 * FT], rotation: [0, 0, 0], label: 'Threat Dashboard' },
  { instanceId: uid(), assetId: 'kiosk-ipad', position: [0.8, 0, 5 * FT], rotation: [0, -0.2, 0], label: 'Threat Sim' },
  { instanceId: uid(), assetId: 'table-6ft-covered', position: [0, 0, 3 * FT], rotation: [0, 0, 0], tableCoverColor: '#064e3b' },
  { instanceId: uid(), assetId: 'bar-stool', position: [-0.6, 0, 5 * FT], rotation: [0, 0, 0] },
  { instanceId: uid(), assetId: 'bar-stool', position: [0.6, 0, 7 * FT], rotation: [0, 0, 0] },
  { instanceId: uid(), assetId: 'literature-rack', position: [-1.2, 0, 1 * FT], rotation: [0, 0, 0] },
];
export const TECH_CYBER_FLOOR: FlooringConfig = { type: 'rubber-coin', color: '#0a0a0a', showBorder: true, showDimensions: true };

// ═══════════════════════════════════════
// HEALTHCARE & PHARMA
// ═══════════════════════════════════════

/** Pharmaceutical — Island 20×20 */
export const HEALTH_PHARMA_ASSETS: PlacedAsset[] = [
  { instanceId: uid(), assetId: 'counter-reception', position: [0, 0, 16 * FT], rotation: [0, 0, 0], tableCoverColor: '#0369a1', label: 'Medical Info' },
  { instanceId: uid(), assetId: 'tv-55', position: [-4 * FT, 0, 2 * FT], rotation: [0, 0, 0], label: 'Clinical Data' },
  { instanceId: uid(), assetId: 'tv-55', position: [4 * FT, 0, 2 * FT], rotation: [0, 0, 0], label: 'MOA Video' },
  { instanceId: uid(), assetId: 'table-8ft-covered', position: [0, 0, 8 * FT], rotation: [0, 0, 0], tableCoverColor: '#0c4a6e', label: 'HCP Meeting' },
  { instanceId: uid(), assetId: 'lounge-chair', position: [-1.5, 0, 8 * FT], rotation: [0, 0.4, 0] },
  { instanceId: uid(), assetId: 'lounge-chair', position: [1.5, 0, 8 * FT], rotation: [0, -0.4, 0] },
  { instanceId: uid(), assetId: 'literature-rack', position: [-7 * FT, 0, 10 * FT], rotation: [0, Math.PI / 2, 0] },
  { instanceId: uid(), assetId: 'kiosk-ipad', position: [6 * FT, 0, 14 * FT], rotation: [0, -0.3, 0], label: 'Sample Request' },
  { instanceId: uid(), assetId: 'banner-stand', position: [8 * FT, 0, 16 * FT], rotation: [0, -Math.PI / 6, 0] },
];
export const HEALTH_PHARMA_FLOOR: FlooringConfig = { type: 'vinyl-tile', color: '#e5e5e5', showBorder: true, showDimensions: true };

/** MedTech — U-Shape 10×10 */
export const HEALTH_MEDTECH_ASSETS: PlacedAsset[] = [
  { instanceId: uid(), assetId: 'tv-55', position: [0, 0, 1 * FT], rotation: [0, 0, 0], label: 'Device Hero' },
  { instanceId: uid(), assetId: 'table-6ft', position: [0, 0, 4 * FT], rotation: [0, 0, 0], label: 'Product Display' },
  { instanceId: uid(), assetId: 'kiosk-ipad', position: [-1.0, 0, 6 * FT], rotation: [0, 0.3, 0], label: 'Hands-on Demo' },
  { instanceId: uid(), assetId: 'tv-42', position: [1.2, 0, 3 * FT], rotation: [0, -0.2, 0], label: 'Procedure Video' },
  { instanceId: uid(), assetId: 'bar-stool', position: [-0.5, 0, 7.5 * FT], rotation: [0, 0, 0] },
  { instanceId: uid(), assetId: 'bar-stool', position: [0.5, 0, 7.5 * FT], rotation: [0, 0, 0] },
];
export const HEALTH_MEDTECH_FLOOR: FlooringConfig = { type: 'carpet-plush', color: '#e5e5e5', showBorder: true, showDimensions: true };

// ═══════════════════════════════════════
// FINANCE
// ═══════════════════════════════════════

/** Banking — Island 20×20 */
export const FINANCE_BANKING_ASSETS: PlacedAsset[] = [
  { instanceId: uid(), assetId: 'counter-reception', position: [0, 0, 17 * FT], rotation: [0, 0, 0], tableCoverColor: '#1e3a5f', label: 'Advisor Desk' },
  { instanceId: uid(), assetId: 'tv-65', position: [0, 0, 2 * FT], rotation: [0, 0, 0], label: 'Market Insights' },
  { instanceId: uid(), assetId: 'table-8ft-covered', position: [0, 0, 9 * FT], rotation: [0, 0, 0], tableCoverColor: '#1e293b', label: 'VIP Lounge' },
  { instanceId: uid(), assetId: 'lounge-chair', position: [-1.8, 0, 9 * FT], rotation: [0, 0.5, 0] },
  { instanceId: uid(), assetId: 'lounge-chair', position: [1.8, 0, 9 * FT], rotation: [0, -0.5, 0] },
  { instanceId: uid(), assetId: 'lounge-chair', position: [0, 0, 12 * FT], rotation: [0, Math.PI, 0] },
  { instanceId: uid(), assetId: 'cocktail-table', position: [-6 * FT, 0, 17 * FT], rotation: [0, 0, 0], label: 'Refreshment' },
  { instanceId: uid(), assetId: 'cocktail-table', position: [6 * FT, 0, 17 * FT], rotation: [0, 0, 0] },
  { instanceId: uid(), assetId: 'tv-55', position: [-7 * FT, 0, 10 * FT], rotation: [0, Math.PI / 2, 0], label: 'Solutions' },
  { instanceId: uid(), assetId: 'tv-55', position: [7 * FT, 0, 10 * FT], rotation: [0, -Math.PI / 2, 0], label: 'Heritage' },
  { instanceId: uid(), assetId: 'literature-rack', position: [8 * FT, 0, 3 * FT], rotation: [0, 0, 0] },
];
export const FINANCE_BANKING_FLOOR: FlooringConfig = { type: 'vinyl-wood', color: '#292524', showBorder: true, showDimensions: true };

/** FinTech — L-Shape 10×10 */
export const FINANCE_FINTECH_ASSETS: PlacedAsset[] = [
  { instanceId: uid(), assetId: 'tv-55', position: [0, 0, 1 * FT], rotation: [0, 0, 0], label: 'Platform Demo' },
  { instanceId: uid(), assetId: 'kiosk-ipad', position: [-0.8, 0, 5 * FT], rotation: [0, 0.3, 0], label: 'Payment Terminal' },
  { instanceId: uid(), assetId: 'kiosk-ipad', position: [0.8, 0, 5 * FT], rotation: [0, -0.3, 0], label: 'API Explorer' },
  { instanceId: uid(), assetId: 'table-6ft-covered', position: [0, 0, 3 * FT], rotation: [0, 0, 0], tableCoverColor: '#3730a3' },
  { instanceId: uid(), assetId: 'bar-stool', position: [-0.6, 0, 7 * FT], rotation: [0, 0, 0] },
  { instanceId: uid(), assetId: 'bar-stool', position: [0.6, 0, 7 * FT], rotation: [0, 0, 0] },
  { instanceId: uid(), assetId: 'banner-stand', position: [1.3, 0, 8.5 * FT], rotation: [0, -0.2, 0] },
];
export const FINANCE_FINTECH_FLOOR: FlooringConfig = { type: 'carpet-plush', color: '#1e1b4b', showBorder: true, showDimensions: true };

// ═══════════════════════════════════════
// CREATIVE
// ═══════════════════════════════════════

/** Creative Agency — L-Shape 10×10 */
export const CREATIVE_AGENCY_ASSETS: PlacedAsset[] = [
  { instanceId: uid(), assetId: 'tv-65', position: [0, 0, 1 * FT], rotation: [0, 0, 0], label: 'Portfolio Reel' },
  { instanceId: uid(), assetId: 'cocktail-table', position: [-1.0, 0, 6 * FT], rotation: [0, 0, 0] },
  { instanceId: uid(), assetId: 'cocktail-table', position: [1.0, 0, 6 * FT], rotation: [0, 0, 0] },
  { instanceId: uid(), assetId: 'lounge-chair', position: [-0.8, 0, 8 * FT], rotation: [0, 0.3, 0] },
  { instanceId: uid(), assetId: 'lounge-chair', position: [0.8, 0, 8 * FT], rotation: [0, -0.3, 0] },
  { instanceId: uid(), assetId: 'kiosk-ipad', position: [0, 0, 5 * FT], rotation: [0, 0, 0], label: 'Touchscreen Portfolio' },
];
export const CREATIVE_AGENCY_FLOOR: FlooringConfig = { type: 'concrete-polished', color: '#292524', showBorder: true, showDimensions: true };

/** Media & Entertainment — Island 20×20 */
export const CREATIVE_MEDIA_ASSETS: PlacedAsset[] = [
  { instanceId: uid(), assetId: 'tv-65', position: [-3 * FT, 0, 2 * FT], rotation: [0, 0, 0], label: 'Video Wall 1' },
  { instanceId: uid(), assetId: 'tv-65', position: [3 * FT, 0, 2 * FT], rotation: [0, 0, 0], label: 'Video Wall 2' },
  { instanceId: uid(), assetId: 'tv-55', position: [-7 * FT, 0, 10 * FT], rotation: [0, Math.PI / 2, 0], label: 'VR Zone' },
  { instanceId: uid(), assetId: 'tv-55', position: [7 * FT, 0, 10 * FT], rotation: [0, -Math.PI / 2, 0], label: 'Schedule' },
  { instanceId: uid(), assetId: 'counter-reception', position: [0, 0, 17 * FT], rotation: [0, 0, 0], tableCoverColor: '#7f1d1d', label: 'Merch Counter' },
  { instanceId: uid(), assetId: 'lounge-chair', position: [-2 * FT, 0, 10 * FT], rotation: [0, 0.4, 0] },
  { instanceId: uid(), assetId: 'lounge-chair', position: [2 * FT, 0, 10 * FT], rotation: [0, -0.4, 0] },
  { instanceId: uid(), assetId: 'banner-stand', position: [-8 * FT, 0, 17 * FT], rotation: [0, Math.PI / 6, 0] },
  { instanceId: uid(), assetId: 'banner-stand', position: [8 * FT, 0, 17 * FT], rotation: [0, -Math.PI / 6, 0] },
];
export const CREATIVE_MEDIA_FLOOR: FlooringConfig = { type: 'carpet-plush', color: '#0a0a0a', showBorder: true, showDimensions: true };

// ═══════════════════════════════════════
// INDUSTRIAL
// ═══════════════════════════════════════

/** Industrial Manufacturing — U-Shape 10×10 */
export const INDUSTRIAL_MFG_ASSETS: PlacedAsset[] = [
  { instanceId: uid(), assetId: 'table-8ft', position: [0, 0, 3 * FT], rotation: [0, 0, 0], label: 'Product Display' },
  { instanceId: uid(), assetId: 'tv-55', position: [0, 0, 1 * FT], rotation: [0, 0, 0], label: 'Capability Video' },
  { instanceId: uid(), assetId: 'literature-rack', position: [1.2, 0, 1 * FT], rotation: [0, 0, 0], label: 'Spec Sheets' },
  { instanceId: uid(), assetId: 'table-6ft', position: [-1.0, 0, 5 * FT], rotation: [0, Math.PI / 2, 0], label: 'Sample Materials' },
  { instanceId: uid(), assetId: 'bar-stool', position: [-0.5, 0, 7 * FT], rotation: [0, 0, 0] },
  { instanceId: uid(), assetId: 'bar-stool', position: [0.5, 0, 7 * FT], rotation: [0, 0, 0] },
];
export const INDUSTRIAL_MFG_FLOOR: FlooringConfig = { type: 'rubber-coin', color: '#1e293b', showBorder: true, showDimensions: true };

/** Energy & Sustainability — Island 20×20 */
export const INDUSTRIAL_ENERGY_ASSETS: PlacedAsset[] = [
  { instanceId: uid(), assetId: 'tv-65', position: [0, 0, 2 * FT], rotation: [0, 0, 0], label: 'Impact Dashboard' },
  { instanceId: uid(), assetId: 'counter-reception', position: [0, 0, 17 * FT], rotation: [0, 0, 0], tableCoverColor: '#14532d', label: 'Info Counter' },
  { instanceId: uid(), assetId: 'table-8ft-covered', position: [0, 0, 10 * FT], rotation: [0, 0, 0], tableCoverColor: '#15803d', label: 'Sustainable Materials' },
  { instanceId: uid(), assetId: 'kiosk-ipad', position: [-5 * FT, 0, 14 * FT], rotation: [0, 0.3, 0], label: 'ROI Calculator' },
  { instanceId: uid(), assetId: 'kiosk-ipad', position: [5 * FT, 0, 14 * FT], rotation: [0, -0.3, 0], label: 'Impact Calculator' },
  { instanceId: uid(), assetId: 'lounge-chair', position: [-1.5, 0, 10 * FT], rotation: [0, 0.4, 0] },
  { instanceId: uid(), assetId: 'lounge-chair', position: [1.5, 0, 10 * FT], rotation: [0, -0.4, 0] },
  { instanceId: uid(), assetId: 'tv-55', position: [-7 * FT, 0, 10 * FT], rotation: [0, Math.PI / 2, 0], label: 'Solutions' },
  { instanceId: uid(), assetId: 'tv-55', position: [7 * FT, 0, 10 * FT], rotation: [0, -Math.PI / 2, 0], label: 'Vision Story' },
];
export const INDUSTRIAL_ENERGY_FLOOR: FlooringConfig = { type: 'carpet-plush', color: '#14532d', showBorder: true, showDimensions: true };

// ═══════════════════════════════════════
// RETAIL
// ═══════════════════════════════════════

/** CPG — U-Shape 10×10 */
export const RETAIL_CPG_ASSETS: PlacedAsset[] = [
  { instanceId: uid(), assetId: 'table-8ft-covered', position: [0, 0, 2 * FT], rotation: [0, 0, 0], tableCoverColor: '#c2410c', label: 'Sampling Station' },
  { instanceId: uid(), assetId: 'tv-55', position: [0, 0, 1 * FT], rotation: [0, 0, 0], label: 'Brand Video' },
  { instanceId: uid(), assetId: 'literature-rack', position: [-1.3, 0, 5 * FT], rotation: [0, 0, 0], label: 'Product Display' },
  { instanceId: uid(), assetId: 'banner-stand', position: [1.3, 0, 8 * FT], rotation: [0, -0.15, 0], label: 'Photo Backdrop' },
  { instanceId: uid(), assetId: 'cocktail-table', position: [-0.8, 0, 7 * FT], rotation: [0, 0, 0] },
  { instanceId: uid(), assetId: 'cocktail-table', position: [0.8, 0, 7 * FT], rotation: [0, 0, 0] },
];
export const RETAIL_CPG_FLOOR: FlooringConfig = { type: 'carpet-plush', color: '#7c2d12', showBorder: true, showDimensions: true };

/** Fashion & Luxury — L-Shape 10×10 */
export const RETAIL_FASHION_ASSETS: PlacedAsset[] = [
  { instanceId: uid(), assetId: 'table-6ft', position: [0, 0, 4 * FT], rotation: [0, 0, 0], label: 'Product Vitrine' },
  { instanceId: uid(), assetId: 'tv-42', position: [1.0, 0, 1 * FT], rotation: [0, 0, 0], label: 'Editorial Reel' },
  { instanceId: uid(), assetId: 'lounge-chair', position: [-0.8, 0, 7 * FT], rotation: [0, 0.3, 0] },
  { instanceId: uid(), assetId: 'lounge-chair', position: [0.8, 0, 7 * FT], rotation: [0, -0.3, 0] },
  { instanceId: uid(), assetId: 'cocktail-table', position: [0, 0, 7 * FT], rotation: [0, 0, 0] },
];
export const RETAIL_FASHION_FLOOR: FlooringConfig = { type: 'vinyl-wood', color: '#1c1917', showBorder: true, showDimensions: true };

// ═══════════════════════════════════════
// EDUCATION
// ═══════════════════════════════════════

/** Higher Education — Inline 10×8 */
export const EDU_UNIVERSITY_ASSETS: PlacedAsset[] = [
  { instanceId: uid(), assetId: 'table-6ft-covered', position: [0, 0, 3 * FT], rotation: [0, 0, 0], tableCoverColor: '#5b21b6', label: 'Info Counter' },
  { instanceId: uid(), assetId: 'literature-rack', position: [-1.2, 0, 1 * FT], rotation: [0, 0, 0], label: 'Prospectus' },
  { instanceId: uid(), assetId: 'literature-rack', position: [1.2, 0, 1 * FT], rotation: [0, 0, 0], label: 'Programs' },
  { instanceId: uid(), assetId: 'bar-stool', position: [-0.6, 0, 5 * FT], rotation: [0, 0, 0] },
  { instanceId: uid(), assetId: 'bar-stool', position: [0.6, 0, 5 * FT], rotation: [0, 0, 0] },
];
export const EDU_UNIVERSITY_FLOOR: FlooringConfig = { type: 'carpet-berber', color: '#3b0764', showBorder: true, showDimensions: true };

/** EdTech — U-Shape 10×10 */
export const EDU_EDTECH_ASSETS: PlacedAsset[] = [
  { instanceId: uid(), assetId: 'tv-55', position: [0, 0, 1 * FT], rotation: [0, 0, 0], label: 'Platform Hero' },
  { instanceId: uid(), assetId: 'kiosk-ipad', position: [-1.0, 0, 4 * FT], rotation: [0, 0.3, 0], label: 'Student View' },
  { instanceId: uid(), assetId: 'kiosk-ipad', position: [1.0, 0, 4 * FT], rotation: [0, -0.3, 0], label: 'Teacher View' },
  { instanceId: uid(), assetId: 'kiosk-ipad', position: [-0.5, 0, 6 * FT], rotation: [0, 0.2, 0], label: 'iPad Demo 3' },
  { instanceId: uid(), assetId: 'kiosk-ipad', position: [0.5, 0, 6 * FT], rotation: [0, -0.2, 0], label: 'iPad Demo 4' },
  { instanceId: uid(), assetId: 'table-6ft-covered', position: [0, 0, 2.5 * FT], rotation: [0, 0, 0], tableCoverColor: '#1d4ed8' },
  { instanceId: uid(), assetId: 'bar-stool', position: [-0.6, 0, 7.5 * FT], rotation: [0, 0, 0] },
  { instanceId: uid(), assetId: 'bar-stool', position: [0.6, 0, 7.5 * FT], rotation: [0, 0, 0] },
];
export const EDU_EDTECH_FLOOR: FlooringConfig = { type: 'carpet-plush', color: '#1e3a5f', showBorder: true, showDimensions: true };

// ═══════════════════════════════════════
// HOSPITALITY
// ═══════════════════════════════════════

/** Hotel & Resort — L-Shape 10×10 */
export const HOSPITALITY_HOTEL_ASSETS: PlacedAsset[] = [
  { instanceId: uid(), assetId: 'tv-55', position: [0, 0, 1 * FT], rotation: [0, 0, 0], label: 'VR Property Tour' },
  { instanceId: uid(), assetId: 'counter-reception', position: [0, 0, 5 * FT], rotation: [0, 0, 0], tableCoverColor: '#78350f', label: 'Concierge Desk' },
  { instanceId: uid(), assetId: 'lounge-chair', position: [-0.8, 0, 7.5 * FT], rotation: [0, 0.3, 0] },
  { instanceId: uid(), assetId: 'lounge-chair', position: [0.8, 0, 7.5 * FT], rotation: [0, -0.3, 0] },
  { instanceId: uid(), assetId: 'cocktail-table', position: [0, 0, 7.5 * FT], rotation: [0, 0, 0] },
  { instanceId: uid(), assetId: 'literature-rack', position: [1.2, 0, 1 * FT], rotation: [0, 0, 0], label: 'Brochures' },
];
export const HOSPITALITY_HOTEL_FLOOR: FlooringConfig = { type: 'vinyl-wood', color: '#78350f', showBorder: true, showDimensions: true };

// ═══════════════════════════════════════
// GOVERNMENT
// ═══════════════════════════════════════

/** Government & Defense — U-Shape 10×10 */
export const GOV_DEFENSE_ASSETS: PlacedAsset[] = [
  { instanceId: uid(), assetId: 'tv-55', position: [0, 0, 1 * FT], rotation: [0, 0, 0], label: 'Capabilities Overview' },
  { instanceId: uid(), assetId: 'table-8ft-covered', position: [0, 0, 3 * FT], rotation: [0, 0, 0], tableCoverColor: '#1e3a5f', label: 'Meeting Table' },
  { instanceId: uid(), assetId: 'bar-stool', position: [-0.8, 0, 5 * FT], rotation: [0, 0, 0] },
  { instanceId: uid(), assetId: 'bar-stool', position: [0.8, 0, 5 * FT], rotation: [0, 0, 0] },
  { instanceId: uid(), assetId: 'literature-rack', position: [-1.3, 0, 1 * FT], rotation: [0, 0, 0], label: 'Contract Info' },
  { instanceId: uid(), assetId: 'literature-rack', position: [1.3, 0, 1 * FT], rotation: [0, 0, 0], label: 'Business Cards' },
];
export const GOV_DEFENSE_FLOOR: FlooringConfig = { type: 'carpet-ribbed', color: '#1e3a5f', showBorder: true, showDimensions: true };
