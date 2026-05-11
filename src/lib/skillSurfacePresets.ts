/**
 * Per-surface skill variants.
 *
 * One brand → multiple compiled skills, each tuned for a delivery surface
 * (social posts, sales deck, RFP/proposal, ad campaign, email).
 *
 * Each preset injects:
 *   - a name suffix (so Claude can pick the right skill in Skill picker)
 *   - extra discovery triggers
 *   - a "Surface focus" preamble that biases length, tone, format
 */
export type SkillSurface = 'general' | 'social' | 'deck' | 'rfp' | 'ads' | 'email';

export interface SurfacePreset {
  id: SkillSurface;
  label: string;
  nameSuffix: string;          // appended to skill name slug
  triggers: string[];          // appended to base discovery triggers
  preamble: string;            // injected into SKILL.md after the "When to use" block
}

export const SURFACE_PRESETS: Record<SkillSurface, SurfacePreset> = {
  general: {
    id: 'general',
    label: 'General (default)',
    nameSuffix: '',
    triggers: [],
    preamble: '',
  },
  social: {
    id: 'social',
    label: 'Social posts',
    nameSuffix: '-social',
    triggers: ['social post', 'tweet', 'instagram caption', 'linkedin post', 'thread'],
    preamble: [
      '## Surface focus: Social posts',
      '- Optimize every output for **scroll-stopping clarity**: hook in the first 7 words.',
      '- Default length: ≤ 280 chars (Twitter/X), ≤ 220 chars (LinkedIn opener), ≤ 125 chars (Instagram first line).',
      '- One idea per post. No multi-section answers unless the user asks for a thread.',
      '- Hashtags only when explicitly requested. Never invent campaign hashtags.',
      '- Imagery prompts must match `references/imagery.md` AND be square (1:1) or vertical (4:5) by default.',
    ].join('\n'),
  },
  deck: {
    id: 'deck',
    label: 'Sales deck',
    nameSuffix: '-deck',
    triggers: ['sales deck', 'pitch deck', 'slide', 'keynote', 'presentation'],
    preamble: [
      '## Surface focus: Sales deck',
      '- Output structure: **slide title** + **3–5 bullets** + speaker notes (≤ 60 words).',
      '- Lead every section with a **proof point or differentiator** from `intelligence/brand-brain.md`.',
      '- Use **headline-case titles**, never sentence-case for slide headers.',
      '- Color usage: primary brand color for title bars, accent only for emphasis (≤ 1 per slide).',
      '- No marketing fluff: every claim must be backed by a number, customer name, or guideline reference.',
    ].join('\n'),
  },
  rfp: {
    id: 'rfp',
    label: 'RFP / proposal',
    nameSuffix: '-rfp',
    triggers: ['rfp', 'rfi', 'proposal', 'tender', 'sow', 'statement of work'],
    preamble: [
      '## Surface focus: RFP / proposal',
      '- Tone: **formal, precise, evidence-based**. No exclamation marks, no superlatives.',
      '- Always cite the specific reference file when stating a brand fact (e.g. "per `references/voice-and-messaging.md`").',
      '- Default to **third person** ("the company"), not first person ("we").',
      '- Comply with `references/anti-patterns.md` AND `references/compliance-guardrails.md` before answering.',
      '- If a question requires a number you do not have, say "to be confirmed" — never estimate.',
    ].join('\n'),
  },
  ads: {
    id: 'ads',
    label: 'Ads / campaign',
    nameSuffix: '-ads',
    triggers: ['ad copy', 'campaign', 'headline', 'paid social', 'google ads', 'meta ads'],
    preamble: [
      '## Surface focus: Ads / campaign',
      '- Always produce **3 variants** per request (control + 2 alternates) unless told otherwise.',
      '- Headline ≤ 40 chars. Description ≤ 90 chars. CTA ≤ 15 chars.',
      '- Lead with **benefit, not feature**. Pair every headline with one approved imagery direction.',
      '- Run every variant through the Don\'t list in `references/voice-and-messaging.md` before returning.',
    ].join('\n'),
  },
  email: {
    id: 'email',
    label: 'Email',
    nameSuffix: '-email',
    triggers: ['email', 'newsletter', 'drip', 'cold email', 'subject line'],
    preamble: [
      '## Surface focus: Email',
      '- Subject line ≤ 50 chars. Preheader ≤ 90 chars. Both must pair, not duplicate.',
      '- Body: **one CTA**, scannable, ≤ 150 words by default.',
      '- Open with a **specific** line (not "Hope you\'re well"). Close with a clear next step.',
      '- Match the brand voice profile exactly — no casual emoji unless the brand voice allows it.',
    ].join('\n'),
  },
};

export const ALL_SURFACES: SkillSurface[] = ['general', 'social', 'deck', 'rfp', 'ads', 'email'];
