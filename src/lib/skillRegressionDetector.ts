/**
 * Skill QA regression detection.
 *
 * Compares two SkillQAHistoryRow records (latest vs previous) and surfaces:
 *  - tier score drops ≥ threshold
 *  - newly-missing sections (now in consistentlyMissing but weren't before)
 *  - visual regression identity drop
 */
import type { SkillQAHistoryRow } from '@/lib/skillQAClient';

export interface RegressionDelta {
  hasRegression: boolean;
  tierDrops: Array<{ tier: string; from: number; to: number; delta: number }>;
  newMissingSections: string[];
  identityDrop?: { from: number; to: number; delta: number };
  improvedTiers: Array<{ tier: string; from: number; to: number; delta: number }>;
}

const DEFAULT_DROP_THRESHOLD = 5;

export function detectRegression(
  latest: SkillQAHistoryRow | undefined,
  previous: SkillQAHistoryRow | undefined,
  threshold = DEFAULT_DROP_THRESHOLD,
): RegressionDelta {
  const empty: RegressionDelta = {
    hasRegression: false, tierDrops: [], newMissingSections: [], improvedTiers: [],
  };
  if (!latest || !previous) return empty;

  const tierDrops: RegressionDelta['tierDrops'] = [];
  const improvedTiers: RegressionDelta['improvedTiers'] = [];
  const tiers = new Set([
    ...Object.keys(latest.avg_score_by_tier || {}),
    ...Object.keys(previous.avg_score_by_tier || {}),
  ]);
  for (const tier of tiers) {
    const to = Number(latest.avg_score_by_tier?.[tier] ?? 0);
    const from = Number(previous.avg_score_by_tier?.[tier] ?? 0);
    if (!from || !to) continue;
    const delta = to - from;
    if (delta <= -threshold) tierDrops.push({ tier, from, to, delta });
    else if (delta >= threshold) improvedTiers.push({ tier, from, to, delta });
  }

  const prevMissing = new Set(previous.consistently_missing || []);
  const newMissingSections = (latest.consistently_missing || []).filter((s) => !prevMissing.has(s));

  let identityDrop: RegressionDelta['identityDrop'];
  const latestId = latest.visual_regression?.identity_match;
  const prevId = previous.visual_regression?.identity_match;
  if (typeof latestId === 'number' && typeof prevId === 'number') {
    const delta = latestId - prevId;
    if (delta <= -threshold) identityDrop = { from: prevId, to: latestId, delta };
  }

  const hasRegression = tierDrops.length > 0 || newMissingSections.length > 0 || !!identityDrop;
  return { hasRegression, tierDrops, newMissingSections, identityDrop, improvedTiers };
}

export function regressionSummary(d: RegressionDelta): string {
  const bits: string[] = [];
  d.tierDrops.forEach((t) => bits.push(`${t.tier} ${t.from}→${t.to} (${t.delta})`));
  if (d.newMissingSections.length) bits.push(`now missing: ${d.newMissingSections.join(', ')}`);
  if (d.identityDrop) bits.push(`identity ${d.identityDrop.from}→${d.identityDrop.to}`);
  return bits.join(' · ');
}
