/**
 * Automated consistency check for unified action badge totals.
 * Verifies that the displayed openCount matches the sum of per-source
 * "open + actionable" contributions. Flags divergence via console + optional callback.
 *
 * Rules (must mirror useUnifiedActions.openCount):
 *   - status in ('open' | 'in_progress')
 *   - severity !== 'info'
 *   - alerts with entity_id set must match the active entityId (when provided)
 */
import type { BrandAction } from '@/hooks/useUnifiedActions';
import { logger } from '@/lib/logger';

export interface ConsistencyBreakdown {
  recommendation: number;
  competitive: number;
  alert: number;
  expected: number;
  actual: number;
  ok: boolean;
  drift: number;
  details?: string[];
}

export function computeActionBreakdown(
  actions: BrandAction[],
  displayedCount: number,
  ctx: { entityId?: string | null; brandLabel?: string } = {},
): ConsistencyBreakdown {
  const isActionable = (a: BrandAction) =>
    (a.status === 'open' || a.status === 'in_progress') && a.severity !== 'info';

  const inScope = (a: BrandAction) => {
    if (a.sourceTable !== 'intelligence_alerts') return true;
    if (!ctx.entityId) return true;
    if (!a.entityId) return true; // org-wide alerts are in scope
    return a.entityId === ctx.entityId;
  };

  let recommendation = 0;
  let competitive = 0;
  let alert = 0;
  const details: string[] = [];

  for (const a of actions) {
    if (!isActionable(a) || !inScope(a)) continue;
    if (a.sourceTable === 'recommendation_actions') recommendation++;
    else if (a.sourceTable === 'competitive_recommendation_actions') competitive++;
    else if (a.sourceTable === 'intelligence_alerts') alert++;
  }

  const expected = recommendation + competitive + alert;
  const drift = displayedCount - expected;
  const ok = drift === 0;

  if (!ok) {
    details.push(
      `Badge=${displayedCount} vs expected=${expected} (rec=${recommendation}, comp=${competitive}, alert=${alert})`,
    );
    console.warn('[actionConsistency] Badge total drift detected', {
      brand: ctx.brandLabel,
      entityId: ctx.entityId,
      displayedCount,
      expected,
      breakdown: { recommendation, competitive, alert },
      drift,
    });
    logger.debug('actionConsistency drift', { displayedCount, expected, drift });
  }

  return { recommendation, competitive, alert, expected, actual: displayedCount, ok, drift, details };
}
