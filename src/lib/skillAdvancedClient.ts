/**
 * Clients for: Anthropic push, token optimizer, scheduled QA, history.
 */
import { supabase } from '@/integrations/supabase/client';
import type { BrandGuide, ProductGuide } from '@/types/brand';
import type { EventGuide } from '@/types/event';
import { exportGuideAsClaudeSkill } from '@/lib/exportClaudeSkill';

type AnyGuide = BrandGuide | ProductGuide | EventGuide;

// ---------- Anthropic push ----------
export interface AnthropicPushResult { ok: boolean; status?: number; anthropic?: any; error?: string; hint?: string }

async function blobToBase64(blob: Blob): Promise<string> {
  const buf = new Uint8Array(await blob.arrayBuffer());
  let s = '';
  for (let i = 0; i < buf.length; i++) s += String.fromCharCode(buf[i]);
  return btoa(s);
}

export async function pushSkillToAnthropic(guide: AnyGuide, opts: { dryRun?: boolean } = {}): Promise<AnthropicPushResult> {
  const { blob, folder } = await exportGuideAsClaudeSkill(guide, { embedAssets: false, includeIntelligence: false });
  const zipBase64 = await blobToBase64(blob);
  const { data, error } = await supabase.functions.invoke('skill-anthropic-push', {
    body: { zipBase64, skillName: folder, description: `Skill for ${guide.hero?.name || folder}`, dryRun: !!opts.dryRun },
  });
  if (error) return { ok: false, error: error.message };
  return data as AnthropicPushResult;
}

// ---------- Token optimizer ----------
export interface OptimizerResult {
  totals: { total: number; target: number; overBudget: number; projectedTotal: number };
  perFile: Array<{ path: string; tokens: number; bytes: number }>;
  suggestions: Array<{ path: string; tokens: number; action: 'condense' | 'demote' | 'split'; condensedSummary?: string; rationale: string; estSavings: number }>;
}

export async function optimizeSkillTokens(guide: AnyGuide, targetTokens = 60_000): Promise<OptimizerResult> {
  const { blob } = await exportGuideAsClaudeSkill(guide, { embedAssets: false, includeIntelligence: true, skipValidation: true });
  const JSZip = (await import('jszip')).default;
  const zip = await JSZip.loadAsync(blob);
  const files: Record<string, string> = {};
  await Promise.all(Object.keys(zip.files).map(async (k) => {
    if (zip.files[k].dir) return;
    if (!/\.(md|json|txt)$/i.test(k)) return;
    const root = k.split('/')[0];
    const rel = k.startsWith(`${root}/`) ? k.slice(root.length + 1) : k;
    files[rel] = await zip.files[k].async('string');
  }));
  const { data, error } = await supabase.functions.invoke('skill-token-optimizer', {
    body: { files, targetTokens },
  });
  if (error) throw new Error(error.message);
  return data as OptimizerResult;
}

// ---------- Schedules ----------
export interface ScheduleRow {
  id: string; entity_type: string; entity_id: string; cadence: string; enabled: boolean;
  last_run_at: string | null; next_run_at: string | null;
}

export async function getQaSchedule(entityType: string, entityId: string): Promise<ScheduleRow | null> {
  const { data } = await (supabase as any).from('skill_qa_schedules').select('*')
    .eq('entity_type', entityType).eq('entity_id', entityId).maybeSingle();
  return (data as any) || null;
}

export async function upsertQaSchedule(row: { entity_type: string; entity_id: string; organization_id?: string | null; cadence: string; enabled: boolean }): Promise<ScheduleRow> {
  const cadenceMs: Record<string, number> = { daily: 86400_000, weekly: 604800_000, biweekly: 1209600_000, monthly: 2592000_000 };
  const next_run_at = row.enabled ? new Date(Date.now() + (cadenceMs[row.cadence] || cadenceMs.weekly)).toISOString() : null;
  const { data, error } = await (supabase as any).from('skill_qa_schedules')
    .upsert({ ...row, next_run_at, updated_at: new Date().toISOString() }, { onConflict: 'entity_type,entity_id' })
    .select().single();
  if (error) throw error;
  return data as any;
}

// ---------- Export history ----------
export interface ExportHistoryRow {
  id: string; created_at: string; version: string; prev_version: string | null;
  changelog: string | null; approx_tokens: number | null; file_count: number | null;
  locales: string[] | null; exported_to: string[] | null;
}

export async function fetchExportHistory(entityType: string, entityId: string, limit = 20): Promise<ExportHistoryRow[]> {
  const { data } = await (supabase as any)
    .from('skill_export_history')
    .select('id, created_at, version, prev_version, changelog, approx_tokens, file_count, locales, exported_to')
    .eq('entity_type', entityType).eq('entity_id', entityId)
    .order('created_at', { ascending: false }).limit(limit);
  return (data as any) || [];
}
