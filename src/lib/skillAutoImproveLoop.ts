/**
 * Auto-Improve Loop
 *
 * Iteratively: run QA → if below target, request patches from skill-autofix →
 * apply patches in-memory to the skill payload → re-run QA. Stops when the
 * minimum tier score ≥ target or maxIterations reached.
 *
 * No file downloads — patches are applied to the in-memory skill payload that
 * is fed into the next QA run via runSkillQA({ overrideSkill }).
 */
import { runSkillQA, type SkillQAReport, type SectionId } from '@/lib/skillQAClient';
import { requestSkillAutofix, buildSkillContextFromGuide } from '@/lib/skillEnhanceClient';
import type { BrandGuide, ProductGuide } from '@/types/brand';
import type { EventGuide } from '@/types/event';

type AnyGuide = BrandGuide | ProductGuide | EventGuide;

const PATH_TO_SECTION: Record<string, SectionId> = {
  'references/colors.md': 'colors',
  'references/typography.md': 'typography',
  'references/logos.md': 'logos',
  'references/voice-and-messaging.md': 'voice',
  'references/imagery.md': 'imagery',
  'references/anti-patterns.md': 'antiPatterns',
};

export interface LoopIteration {
  iteration: number;
  report: SkillQAReport;
  minScore: number;
  patchedFiles: string[];
}

export interface LoopOptions {
  targetScore?: number;        // default 80
  maxIterations?: number;      // default 3
  onIteration?: (it: LoopIteration) => void;
  onPhase?: (phase: 'qa' | 'autofix' | 'done', iter: number) => void;
}

function minScore(r: SkillQAReport): number {
  const vals = Object.values(r.summary.avgScoreByTier || {}).map(Number).filter((n) => !Number.isNaN(n));
  return vals.length ? Math.min(...vals) : 0;
}

function applyPatches(
  skill: { skillMd: string; sections: Record<string, string> },
  patches: Record<string, string>,
): { skillMd: string; sections: Record<string, string> } {
  const next = { skillMd: skill.skillMd, sections: { ...skill.sections } };
  for (const [path, content] of Object.entries(patches)) {
    if (path === 'SKILL.md') {
      next.skillMd = content;
    } else {
      const sec = PATH_TO_SECTION[path];
      if (sec) next.sections[sec] = content;
    }
  }
  return next;
}

export async function runAutoImproveLoop(
  guide: AnyGuide,
  opts: LoopOptions = {},
): Promise<LoopIteration[]> {
  const target = opts.targetScore ?? 80;
  const maxIter = opts.maxIterations ?? 3;
  const iterations: LoopIteration[] = [];

  // Build the initial skill in-memory once; we mutate this across iterations.
  let skill = await buildSkillContextFromGuide(guide);

  for (let i = 1; i <= maxIter; i++) {
    opts.onPhase?.('qa', i);
    const report = await runSkillQA(guide, {
      overrideSkill: {
        skillMd: skill.skillMd,
        sections: skill.sections as any,
      },
    });
    const score = minScore(report);
    const it: LoopIteration = { iteration: i, report, minScore: score, patchedFiles: [] };
    iterations.push(it);
    opts.onIteration?.(it);

    if (score >= target) break;
    if (i === maxIter) break;

    opts.onPhase?.('autofix', i);
    try {
      const fix = await requestSkillAutofix(skill, report);
      const paths = Object.keys(fix.patches);
      if (paths.length === 0) break;
      it.patchedFiles = paths;
      skill = applyPatches(skill, fix.patches);
    } catch {
      break; // autofix failed — stop the loop with what we have
    }
  }

  opts.onPhase?.('done', iterations.length);
  return iterations;
}

export { minScore as loopMinScore };
