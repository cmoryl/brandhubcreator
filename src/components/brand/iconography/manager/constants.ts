/**
 * Shared constants for icon library manager sub-components
 */

import { Building2, Package, Layers } from 'lucide-react';

export const LEVEL_BADGES = {
  core: { label: 'Core', icon: Building2, className: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  product_line: { label: 'Product', icon: Package, className: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
  brand: { label: 'Brand', icon: Layers, className: 'bg-sky-500/10 text-sky-600 border-sky-500/20' },
};
