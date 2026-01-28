/**
 * PageTracker Component
 * Silently tracks page views for authenticated users
 */

import { usePageTracking } from '@/hooks/usePageTracking';

export function PageTracker() {
  usePageTracking();
  return null;
}
