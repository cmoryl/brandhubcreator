/**
 * Helpers for the AI Auto-Fix flow:
 *  - request a patch set from skill-autofix
 *  - re-export the guide and apply the patches over the SKILL.md /
 *    reference files inside the zip, then download the patched skill.
 */
import { supabase } from '@/integrations/supabase/client';
import type { BrandGuide, ProductGuide } from '@/types/brand';
import type { EventGuide } from '@/types/event';
import type { SkillQAReport } from '@/lib/skillQAClient';

type AnyGuide = BrandGuide | ProductGuide | EventGuide;

export interface AutofixResult {
  patches: Record<string, string>;
  rationale: string;
  changedSections: string[];
}

export async function requestSkillAutofix(
  skill: { skillMd: string; sections: Record<string, string> },
  report: SkillQAReport,
): Promise<AutofixResult> {
  const { data, error } = await supabase.functions.invoke('skill-autofix', {
    body: {
      skill,
      misuses: report.summary.recurringMisuses,
      consistentlyMissing: report.summary.consistentlyMissing,
    },
  });
  if (error) throw new Error(error.message || 'autofix failed');
  if ((data as any)?.error) throw new Error((data as any).error);
  return {
    patches: (data as any).patches || {},
    rationale: (data as any).rationale || '',
    changedSections: (data as any).changedSections || [],
  };
}

/** Re-exports the guide and overwrites files inside the zip with the patches, then triggers download. */
export async function downloadPatchedSkill(guide: AnyGuide, patches: Record<string, string>): Promise<void> {
  const mod = await import('@/lib/exportClaudeSkill');
  const { blob, filename } = await mod.exportGuideAsClaudeSkill(guide, {
    embedAssets: false,
    includeIntelligence: false,
    skipValidation: true,
  });
  const JSZip = (await import('jszip')).default;
  const zip = await JSZip.loadAsync(blob);
  const folder = Object.keys(zip.files).find((p) => p.endsWith('/SKILL.md'))?.split('/')[0] || '';

  for (const [relPath, content] of Object.entries(patches)) {
    const fullPath = folder ? `${folder}/${relPath}` : relPath;
    if (!zip.file(fullPath)) {
      // create new file if path is new
      zip.file(fullPath, content);
    } else {
      zip.file(fullPath, content);
    }
  }

  // Write a patch-notes file so users can audit what changed
  const notes = [
    '# Auto-Fix Patch Notes',
    '',
    `Generated ${new Date().toISOString()}`,
    '',
    '## Files updated',
    ...Object.keys(patches).map((p) => `- \`${p}\``),
  ].join('\n');
  zip.file(folder ? `${folder}/PATCH_NOTES.md` : 'PATCH_NOTES.md', notes);

  const newBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
  const url = URL.createObjectURL(newBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.replace(/\.zip$/, '-patched.zip');
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Streaming chat over the exported skill. Yields content chunks. */
export async function* streamSkillChat(
  skill: { skillMd: string; sections: Record<string, string> },
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  opts: { model?: string; signal?: AbortSignal } = {},
): AsyncGenerator<string> {
  const { data: sess } = await supabase.auth.getSession();
  const token = sess.session?.access_token;
  const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL as string;
  const res = await fetch(`${SUPABASE_URL}/functions/v1/skill-chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : 'Bearer anon',
      apikey: (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY as string,
    },
    body: JSON.stringify({ skill, messages, model: opts.model }),
    signal: opts.signal,
  });
  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => '');
    throw new Error(`skill-chat failed: ${res.status} ${text.slice(0, 200)}`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    // OpenAI-style SSE: lines starting with "data: "
    const lines = buf.split('\n');
    buf = lines.pop() || '';
    for (const raw of lines) {
      const line = raw.trim();
      if (!line.startsWith('data:')) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === '[DONE]') continue;
      try {
        const j = JSON.parse(payload);
        const delta = j?.choices?.[0]?.delta?.content;
        if (typeof delta === 'string' && delta) yield delta;
      } catch {
        /* skip malformed frame */
      }
    }
  }
}

export async function buildSkillContextFromGuide(guide: AnyGuide): Promise<{ skillMd: string; sections: Record<string, string> }> {
  const mod = await import('@/lib/exportClaudeSkill');
  const { blob } = await mod.exportGuideAsClaudeSkill(guide, {
    embedAssets: false, includeIntelligence: false, skipValidation: true,
  });
  const JSZip = (await import('jszip')).default;
  const zip = await JSZip.loadAsync(blob);
  const folder = Object.keys(zip.files).find((p) => p.endsWith('/SKILL.md'))?.split('/')[0];
  const root = folder ? zip.folder(folder)! : zip;
  const read = async (path: string) => (await root.file(path)?.async('string')) || '';
  return {
    skillMd: await read('SKILL.md'),
    sections: {
      colors: await read('references/colors.md'),
      typography: await read('references/typography.md'),
      logos: await read('references/logos.md'),
      voice: await read('references/voice-and-messaging.md'),
      imagery: await read('references/imagery.md'),
      antiPatterns: await read('references/anti-patterns.md'),
    },
  };
}
