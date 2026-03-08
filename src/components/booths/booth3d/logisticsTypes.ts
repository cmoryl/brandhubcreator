/**
 * Logistics marker types for booth operational overlay
 */

export type LogisticsCategory = 
  | 'power'
  | 'internet' 
  | 'rigging'
  | 'storage'
  | 'lead-scanner'
  | 'demo-station';

export interface LogisticsMarker {
  id: string;
  category: LogisticsCategory;
  label: string;
  /** Position as [x, y, z] in booth-local meters */
  position: [number, number, number];
  /** Optional notes for ops teams */
  notes: string;
  /** Wattage for power, bandwidth for internet, weight for rigging */
  spec?: string;
  /** Status indicator */
  status: 'planned' | 'confirmed' | 'installed';
}

export interface LogisticsCategoryConfig {
  id: LogisticsCategory;
  label: string;
  emoji: string;
  color: string; // HSL token-safe
  defaultSpec: string;
  specLabel: string;
}

export const LOGISTICS_CATEGORIES: LogisticsCategoryConfig[] = [
  { id: 'power', label: 'Power Drop', emoji: '⚡', color: 'hsl(48, 96%, 53%)', defaultSpec: '20A / 120V', specLabel: 'Amps / Voltage' },
  { id: 'internet', label: 'Internet', emoji: '🌐', color: 'hsl(200, 80%, 55%)', defaultSpec: '100 Mbps', specLabel: 'Bandwidth' },
  { id: 'rigging', label: 'Rigging Point', emoji: '🔗', color: 'hsl(280, 60%, 55%)', defaultSpec: '200 lbs', specLabel: 'Load Rating' },
  { id: 'storage', label: 'Storage', emoji: '📦', color: 'hsl(30, 70%, 50%)', defaultSpec: '4\' × 4\' × 4\'', specLabel: 'Dimensions' },
  { id: 'lead-scanner', label: 'Lead Scanner', emoji: '📱', color: 'hsl(150, 60%, 45%)', defaultSpec: 'Badge scanner', specLabel: 'Type' },
  { id: 'demo-station', label: 'Demo Station', emoji: '🖥️', color: 'hsl(340, 65%, 55%)', defaultSpec: 'Interactive display', specLabel: 'Setup' },
];

export function getCategoryConfig(cat: LogisticsCategory): LogisticsCategoryConfig {
  return LOGISTICS_CATEGORIES.find(c => c.id === cat) || LOGISTICS_CATEGORIES[0];
}

export function createMarker(category: LogisticsCategory, position?: [number, number, number]): LogisticsMarker {
  const config = getCategoryConfig(category);
  return {
    id: `${category}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    category,
    label: config.label,
    position: position || [0, 0, 0],
    notes: '',
    spec: config.defaultSpec,
    status: 'planned',
  };
}
