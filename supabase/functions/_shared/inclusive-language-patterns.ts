/**
 * Deep Intelligence Module: Inclusive Language & Governance Constants
 * 2026 Standard - Regex patterns, prompting heuristics, design sprint activities, EAA compliance
 */

// ── Module 1: Tier-1 Inclusive Language Regex Patterns ──

export interface LanguagePattern {
  category: string;
  pattern: string; // regex source, case-insensitive
  replacements: string[];
  severity: 'critical' | 'high' | 'medium';
}

export const INCLUSIVE_LANGUAGE_PATTERNS: LanguagePattern[] = [
  {
    category: 'Permissions',
    pattern: '\\b(white|black)[-_]?list\\b',
    replacements: ['Allowlist / Blocklist', 'Permit / Deny'],
    severity: 'high',
  },
  {
    category: 'Tech Hierarchy',
    pattern: '\\bmaster[-_]?slave\\b',
    replacements: ['Primary / Secondary', 'Main / Replica'],
    severity: 'high',
  },
  {
    category: 'Status Terms',
    pattern: '\\bgrandfather(ed|ing)?\\b',
    replacements: ['Legacy', 'Exempt', 'Predating'],
    severity: 'medium',
  },
  {
    category: 'Ableist Slang',
    pattern: '\\b(crazy|insane|cripple(d)?)\\b',
    replacements: ['Overwhelming', 'Frozen', 'Blocked'],
    severity: 'high',
  },
  {
    category: 'Placeholder',
    pattern: '\\bdummy\\b',
    replacements: ['Placeholder', 'Mock', 'Stub', 'Unused'],
    severity: 'medium',
  },
];

/**
 * Run all inclusive language regex patterns against a text block.
 * Returns array of findings with match details.
 */
export function scanTextForInclusiveLanguage(text: string): Array<{
  category: string;
  matched: string;
  replacements: string[];
  severity: string;
  position: number;
}> {
  const findings: Array<{
    category: string;
    matched: string;
    replacements: string[];
    severity: string;
    position: number;
  }> = [];

  for (const pattern of INCLUSIVE_LANGUAGE_PATTERNS) {
    const regex = new RegExp(pattern.pattern, 'gi');
    let match;
    while ((match = regex.exec(text)) !== null) {
      findings.push({
        category: pattern.category,
        matched: match[0],
        replacements: pattern.replacements,
        severity: pattern.severity,
        position: match.index,
      });
    }
  }

  return findings;
}

// ── Module 2: Generative AI Inclusive Prompting Heuristics ──

export const INCLUSIVE_PROMPTING_HEURISTICS = [
  {
    id: 'specify_visible_identity',
    title: 'Specify Visible Identity',
    description: 'Explicitly describe age, race, gender, body size, and visible disabilities to interrupt "Western-looking" or "middle-aged" defaults.',
    example_bad: 'People in a meeting.',
    example_good: 'A multiracial group of professionals, including an older adult in a leadership role and a woman using a wheelchair.',
  },
  {
    id: 'describe_observable_actions',
    title: 'Describe Observable Actions',
    description: 'Focus on what is visible rather than internal identities.',
    example_bad: 'Two gay men with their child.',
    example_good: 'Two men picking up a child from daycare.',
  },
  {
    id: 'add_cultural_context',
    title: 'Add Cultural Context',
    description: 'Include real-life emotional cues to add nuance beyond mere placeholders.',
    example_bad: 'A woman presenting.',
    example_good: 'A confident Muslim woman presenting in a boardroom, colleagues engaged.',
  },
  {
    id: 'prompt_diversity_by_default',
    title: 'Prompt for Diversity by Default',
    description: 'Use diversity-centered terms for all training and conference imagery.',
    example_bad: 'Team at a conference.',
    example_good: 'Inclusive workplace scene, group representing a range of abilities and gender expressions.',
  },
];

// ── Module 3: Microsoft Inclusive Design Sprint Activities ──

export const INCLUSIVE_DESIGN_SPRINT_ACTIVITIES = [
  {
    id: 'computer_trust_exercise',
    title: 'The Computer Trust Exercise',
    duration: '5 minutes',
    description: 'Participants write "I\'d trust a computer to [blank], but I\'d only trust a human to [blank]..." This unearths fundamental user mistrust and highlights where technology must "behave better".',
    phase: 'ideation',
    source: 'Microsoft Inclusive Design',
  },
  {
    id: 'human_to_computer_roleplay',
    title: 'Human-to-Computer Role-Play',
    duration: '10-15 minutes',
    description: 'One team member role-plays a human interaction (like ordering coffee or requesting help), while a partner acts as a computer. This reveals where communication breaks down and helps identify "unnatural" interaction patterns.',
    phase: 'ideation',
    source: 'Microsoft Inclusive Design',
  },
  {
    id: 'interaction_diary',
    title: 'Interaction Diary',
    duration: '30+ minutes (field observation)',
    description: 'Observe people in a real-world location (e.g., a transit hub) and map the verbal/nonverbal "mismatches" between humans and objects. Use these insights to refine digital affordances.',
    phase: 'research',
    source: 'Microsoft Inclusive Design',
  },
];

// ── Module 4: EAA 2025/2026 Regulatory Intelligence ──

export const EAA_COMPLIANCE_BASELINE = {
  id: 'eaa_2025_2026',
  title: 'European Accessibility Act (EAA) 2025/2026',
  enforcement_start: '2025-06-28',
  enforcement_ramp: '2026-12-31',
  penalties: {
    max_fine_euros: 3_000_000,
    product_removal: true,
    description: 'Non-compliance can result in fines up to €3M and forced removal of products/services from the EU market.',
  },
  mandatory_scope: [
    'E-commerce sites',
    'Mobile applications',
    'Streaming services',
    'E-readers',
    'All hardware/software with user interfaces',
  ],
  key_requirements: [
    'All consumer-facing sites must publish a public Accessibility Statement.',
    'Statement must indicate how the product meets the Act\'s requirements.',
    'Timelines for improvement must be listed.',
    'WCAG 2.2 AA compliance is the technical baseline.',
  ],
  action_items: [
    'Publish an Accessibility Statement on all consumer-facing sites.',
    'Conduct WCAG 2.2 AA audit of all digital touchpoints.',
    'Establish remediation timeline for any gaps.',
    'Document EU market-facing products/services in scope.',
  ],
};

/**
 * Build a compact prompt context string from all deep intelligence modules.
 * Suitable for injection into AI system prompts.
 */
export function buildDeepIntelligencePromptContext(): string {
  const lines: string[] = [];

  lines.push('## Deep Intelligence: Inclusive Language Automation (Tier 1)');
  lines.push('Automatically flag these problematic terms:');
  for (const p of INCLUSIVE_LANGUAGE_PATTERNS) {
    lines.push(`- ${p.category}: /${p.pattern}/i → ${p.replacements.join(' / ')}`);
  }

  lines.push('\n## Deep Intelligence: Inclusive Prompting Heuristics');
  for (const h of INCLUSIVE_PROMPTING_HEURISTICS) {
    lines.push(`- ${h.title}: ${h.description} BAD: "${h.example_bad}" → GOOD: "${h.example_good}"`);
  }

  lines.push('\n## Deep Intelligence: EAA Regulatory Baseline');
  lines.push(`Enforcement: ${EAA_COMPLIANCE_BASELINE.enforcement_start}. Penalties: up to €${(EAA_COMPLIANCE_BASELINE.penalties.max_fine_euros / 1_000_000).toFixed(0)}M + product removal.`);
  lines.push(`Scope: ${EAA_COMPLIANCE_BASELINE.mandatory_scope.join(', ')}.`);
  lines.push(`Key: ${EAA_COMPLIANCE_BASELINE.key_requirements.slice(0, 2).join(' ')}`);

  return lines.join('\n');
}
