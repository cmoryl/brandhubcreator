/**
 * Deep Intelligence Module: Inclusive Language & Governance Constants
 * 2026 Standard - Foundations of Inclusive Architecture
 * Regex patterns, prompting heuristics, design sprint activities, EAA/Section 508,
 * WCAG 2.2 criteria, WFA 12 areas, PI&E framework, imagery Stop/Go, multi-sensory UX, event checklist
 */

// ── Module 1: Tier-1 Inclusive Language Regex Patterns ──

export interface LanguagePattern {
  category: string;
  pattern: string; // regex source, case-insensitive
  replacements: string[];
  severity: 'critical' | 'high' | 'medium';
  reasoning?: string;
}

export const INCLUSIVE_LANGUAGE_PATTERNS: LanguagePattern[] = [
  {
    category: 'Permissions',
    pattern: '\\b(white|black)[-_]?list\\b',
    replacements: ['Allowlist / Blocklist', 'Permit / Deny'],
    severity: 'high',
    reasoning: 'Avoids racial connotations of "white = safe, black = dangerous".',
  },
  {
    category: 'Tech Hierarchy',
    pattern: '\\bmaster[-_]?slave\\b',
    replacements: ['Primary / Secondary', 'Main / Replica', 'Controller / Main'],
    severity: 'high',
    reasoning: 'Avoids metaphors of subjugation.',
  },
  {
    category: 'Status Terms',
    pattern: '\\bgrandfather(ed|ing)?\\b',
    replacements: ['Legacy', 'Exempt', 'Predating'],
    severity: 'medium',
    reasoning: 'Avoids terms with racist historical origins.',
  },
  {
    category: 'Ableist Slang',
    pattern: '\\b(crazy|insane|cripple(d)?)\\b',
    replacements: ['Overwhelming', 'Frozen', 'Blocked', 'Unpredictable'],
    severity: 'high',
    reasoning: 'Avoids references to mental or physical conditions.',
  },
  {
    category: 'Placeholder',
    pattern: '\\bdummy\\b',
    replacements: ['Placeholder', 'Mock', 'Stub', 'Unused'],
    severity: 'medium',
  },
  {
    category: 'Gender',
    pattern: '\\b(fireman|chairman|manpower|mankind)\\b',
    replacements: ['Firefighter', 'Chairperson', 'Workforce', 'Humankind'],
    severity: 'medium',
    reasoning: 'Avoids reinforcing male-dominated assumptions.',
  },
  {
    category: 'Gender',
    pattern: '\\bguys\\b',
    replacements: ['Folks', 'Everyone', 'Team', 'People'],
    severity: 'medium',
    reasoning: 'Defaults to gender-neutral group address.',
  },
];

/**
 * Run all inclusive language regex patterns against a text block.
 */
export function scanTextForInclusiveLanguage(text: string): Array<{
  category: string;
  matched: string;
  replacements: string[];
  severity: string;
  position: number;
  reasoning?: string;
}> {
  const findings: Array<{
    category: string;
    matched: string;
    replacements: string[];
    severity: string;
    position: number;
    reasoning?: string;
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
        reasoning: pattern.reasoning,
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

// ── Module 4: EAA 2025/2026 & Section 508 Regulatory Intelligence ──

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
    'Banking services',
    'Transport (air, bus, rail)',
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
  us_section_508: {
    deadline_large: '2026-04-24',
    deadline_small: '2027-04-24',
    standard: 'WCAG 2.1 AA',
    scope: 'Public sector websites and mobile apps (populations >50,000 by April 2026; smaller by April 2027).',
  },
};

// ── Module 5: WCAG 2.2 New Success Criteria ──

export interface WCAGCriterion {
  id: string;
  name: string;
  level: 'A' | 'AA' | 'AAA';
  objective: string;
  category: 'perceivable' | 'operable' | 'understandable' | 'robust';
}

export const WCAG_22_NEW_CRITERIA: WCAGCriterion[] = [
  { id: '2.4.11', name: 'Focus Not Obscured (Minimum)', level: 'AA', objective: 'Ensures keyboard focus indicators are not hidden by sticky footers or headers.', category: 'operable' },
  { id: '2.4.12', name: 'Focus Not Obscured (Enhanced)', level: 'AAA', objective: 'Requires the entire focused element to remain visible during interaction.', category: 'operable' },
  { id: '2.4.13', name: 'Focus Appearance', level: 'AAA', objective: 'Mandates specific contrast and size for keyboard focus indicators.', category: 'operable' },
  { id: '2.5.7', name: 'Dragging Movements', level: 'AA', objective: 'Requires a non-dragging alternative (e.g., clicking or tapping) for all drag actions.', category: 'operable' },
  { id: '2.5.8', name: 'Target Size (Minimum)', level: 'AA', objective: 'Defines a 24x24 CSS pixel minimum for all interactive touch targets.', category: 'operable' },
  { id: '3.2.6', name: 'Consistent Help', level: 'A', objective: 'Mandates that help/support features remain in a consistent relative location.', category: 'understandable' },
  { id: '3.3.7', name: 'Redundant Entry', level: 'A', objective: 'Ensures previously entered data is auto-filled to reduce cognitive load.', category: 'understandable' },
  { id: '3.3.8', name: 'Accessible Authentication', level: 'AA', objective: 'Prohibits memory-based or puzzle-based cognitive tests for login.', category: 'understandable' },
  { id: '3.3.9', name: 'Accessible Authentication (Enhanced)', level: 'AAA', objective: 'Eliminates almost all cognitive function tests from the authentication process.', category: 'understandable' },
];

// ── Module 6: WFA 12 Key Areas Bias Litmus Test ──

export interface WFAArea {
  id: string;
  stage: number;
  name: string;
  audit_question: string;
}

export const WFA_12_AREAS: WFAArea[] = [
  { id: 'business_challenge', stage: 1, name: 'Business & Brand Challenge', audit_question: 'Who is excluded? Are they a potential business opportunity?' },
  { id: 'insight_data', stage: 2, name: 'Strategic Insight & Data', audit_question: 'Is there bias in the research? Does it capture representative perspectives or broad generalizations?' },
  { id: 'creative_brief', stage: 3, name: 'Creative & Comms Brief', audit_question: 'Does the brief make it clear that representation is key?' },
  { id: 'agency_selection', stage: 4, name: 'Agency & Partner Selection', audit_question: 'What steps are you taking to bring in more diverse talent from suppliers?' },
  { id: 'creative_development', stage: 5, name: 'Creative Development', audit_question: 'Are you applying the 3Ps (Presence, Perspective, Personality)?' },
  { id: 'pretesting', stage: 6, name: 'Pre-testing', audit_question: 'Does testing include a check for bias or stereotyping amongst the affected group?' },
  { id: 'production_casting', stage: 7, name: 'Production & Casting', audit_question: 'Have you allowed enough time for inclusive casting? Are props reinforcing stereotypes?' },
  { id: 'post_production', stage: 8, name: 'Post-production & Edit', audit_question: 'Does the final edit deliver on the vision without introducing new biases?' },
  { id: 'media_placement', stage: 9, name: 'Media Placement', audit_question: 'Are brand safety settings inadvertently blocking LGBTQ+ or minority content?' },
  { id: 'localisation', stage: 10, name: 'Localisation', audit_question: 'Are there local cultural nuances that make content inappropriate?' },
  { id: 'launch_activation', stage: 11, name: 'Launch & Activation', audit_question: 'Have you prepared for the impact amongst different diverse groups?' },
  { id: 'analysis_effectiveness', stage: 12, name: 'Analysis & Effectiveness', audit_question: 'How are you building your body of knowledge and effectiveness?' },
];

export const WFA_COMMERCIAL_IMPACT = {
  short_term_sales_increase: 3.46,
  long_term_sales_increase: 16.26,
  source: 'WFA Inclusive Advertising Research',
};

// ── Module 7: PI&E "Who Else?" Framework (Annie Jean-Baptiste / Google) ──

export interface PIETouchpoint {
  id: string;
  name: string;
  audit_question: string;
  example?: string;
}

export const PIE_TOUCHPOINTS: PIETouchpoint[] = [
  { id: 'ideation', name: 'Ideation', audit_question: 'Whose voice is missing from the initial concept?', example: 'Analyze the core premise for excluded perspectives.' },
  { id: 'research', name: 'Research', audit_question: 'Do "pen portraits" or focus groups rely on generalizations or exclude underrepresented groups?', example: 'Flag homogeneous user personas.' },
  { id: 'design', name: 'Design', audit_question: 'Implement the "Curb-Cut Effect" — features solving for a specific disability but improving usability for all.', example: 'Google sensor tuning for skin tones benefits all users.' },
  { id: 'testing', name: 'Testing', audit_question: 'Automate recruitment of co-designers from diverse backgrounds to validate usability before code freeze.', example: 'Inclusive beta testing panels.' },
  { id: 'marketing', name: 'Marketing', audit_question: 'Evaluate narratives for intersectionality — are portrayals oversimplified or tokenistic?', example: 'Avoid single-dimension representation.' },
];

// ── Module 8: Inclusive Imagery Stop/Go Framework ──

export const IMAGERY_STOP_GO = {
  stop_signals: [
    '"Hospital-style" equipment prominence',
    'Pity-based hierarchies (person with disability as victim)',
    '"Heroic" tropes for everyday activities',
    'Depicting unnecessary dependency (e.g., non-disabled person helping blind person stand)',
    'Only showing visible disabilities while ignoring invisible ones',
  ],
  go_signals: [
    'Real people in realistic settings (shopping, caring for children, working)',
    'Authentic equipment aids that appear natural and integrated',
    'Equal power hierarchies (models on same physical level)',
    'Normalized invisible disabilities (chronic pain, neurodiversity, mental health)',
    'Intersectional representation (multiple identity dimensions visible)',
  ],
};

// ── Module 9: Multi-Sensory UX & Strategic Redundancy ──

export const MULTI_SENSORY_UX = {
  principles: [
    { id: 'haptic_feedback', name: 'Haptic Feedback', description: 'Mimics physical touch, providing reassurance that an action was recognized (e.g., a small vibration when a button is tapped).' },
    { id: 'synchronized_timing', name: 'Synchronized Timing', description: 'Trigger haptic feedback precisely when the corresponding visual event or sound effect occurs to avoid feeling unnatural.' },
    { id: 'tactile_hierarchy', name: 'Tactile Hierarchy', description: 'Light taps for routine notifications; strong pulses for errors or warnings; rhythmic patterns for progress tracking.' },
    { id: 'accessible_affordances', name: 'Accessible Affordances', description: 'Negative affordances (e.g., grayed-out buttons) should provide plain language explanations of why the action is restricted.' },
  ],
};

// ── Module 10: Universal Event Framework (Accessibility Checklist) ──

export interface EventAccessibilityItem {
  category: string;
  specification: string;
}

export const EVENT_ACCESSIBILITY_CHECKLIST: EventAccessibilityItem[] = [
  { category: 'Entrances', specification: 'Doors at least 32 inches wide; require < 5 pounds of force to open.' },
  { category: 'Hallways', specification: 'Pathways between exhibits at least 64 inches wide for two-way traffic.' },
  { category: 'Aisles', specification: 'Minimum 36 inches wide to accommodate wheelchairs/scooters.' },
  { category: 'Communication', specification: 'CamelCase for all hashtags (#InclusiveArchitecture); Roving microphones for Q&A.' },
  { category: 'Presentations', specification: 'Speakers describe all visuals; Sans serif fonts (min 24pt); Captions on all videos.' },
  { category: 'Seating', specification: 'Wheelchair-accessible seating integrated throughout, not isolated.' },
  { category: 'Signage', specification: 'High-contrast, large-print signage with Braille at key locations.' },
  { category: 'Digital', specification: 'Event apps/sites meet WCAG 2.2 AA; live captions for streaming.' },
];

// ── Module 11: Microsoft Persona Spectrum (2026 Extended) ──

export const PERSONA_SPECTRUM_DIMENSIONS = [
  { dimension: 'Mobility', permanent: 'Person with one arm', temporary: 'Arm injury (cast)', situational: 'New parent holding child' },
  { dimension: 'Vision', permanent: 'Blind', temporary: 'Cataract recovery', situational: 'Distracted driver' },
  { dimension: 'Hearing', permanent: 'Deaf', temporary: 'Ear infection', situational: 'Bartender in loud environment' },
  { dimension: 'Speech', permanent: 'Non-verbal', temporary: 'Laryngitis', situational: 'Heavy accent in foreign country' },
  { dimension: 'Cognitive', permanent: 'Neurodivergent', temporary: 'Concussion', situational: 'Sleep deprivation / information overload' },
];

// ── Module 12: AI Governance Policy-as-Code ──

export const AI_POLICY_AS_CODE = {
  disparate_impact_rule: {
    name: 'U.S. 80% Rule (Four-Fifths Rule)',
    threshold_high: 1.25,
    threshold_low: 0.80,
    description: 'If an AI model skews results for a protected group beyond a 1.25 ratio (or below 0.80), the system triggers an alert.',
  },
  governance_pillars: [
    { id: 'data_journeys', name: 'Data Journey Traceability', description: 'End-to-end data lineage to trace biased outcomes through every transformation, API call, or data join.' },
    { id: 'continuous_monitoring', name: 'Continuous Monitoring', description: 'Shift from one-off audits to real-time observability of bias, drift, and performance side-by-side.' },
    { id: 'human_in_loop', name: 'Human-in-the-Loop', description: 'Mandatory human review for high-stakes AI decisions affecting individuals or protected groups.' },
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
    lines.push(`- ${p.category}: /${p.pattern}/i → ${p.replacements.join(' / ')}${p.reasoning ? ` (${p.reasoning})` : ''}`);
  }

  lines.push('\n## Deep Intelligence: Inclusive Prompting Heuristics');
  for (const h of INCLUSIVE_PROMPTING_HEURISTICS) {
    lines.push(`- ${h.title}: ${h.description} BAD: "${h.example_bad}" → GOOD: "${h.example_good}"`);
  }

  lines.push('\n## Deep Intelligence: WCAG 2.2 New Success Criteria');
  for (const c of WCAG_22_NEW_CRITERIA) {
    lines.push(`- ${c.id} ${c.name} [${c.level}]: ${c.objective}`);
  }

  lines.push('\n## Deep Intelligence: WFA 12-Area Bias Litmus Test');
  for (const a of WFA_12_AREAS.slice(0, 6)) {
    lines.push(`- Stage ${a.stage} (${a.name}): ${a.audit_question}`);
  }
  lines.push(`Commercial impact: +${WFA_COMMERCIAL_IMPACT.short_term_sales_increase}% short-term, +${WFA_COMMERCIAL_IMPACT.long_term_sales_increase}% long-term sales.`);

  lines.push('\n## Deep Intelligence: PI&E "Who Else?" Framework');
  for (const t of PIE_TOUCHPOINTS) {
    lines.push(`- ${t.name}: ${t.audit_question}`);
  }

  lines.push('\n## Deep Intelligence: Imagery Stop/Go Framework');
  lines.push('STOP: ' + IMAGERY_STOP_GO.stop_signals.slice(0, 3).join('; '));
  lines.push('GO: ' + IMAGERY_STOP_GO.go_signals.slice(0, 3).join('; '));

  lines.push('\n## Deep Intelligence: AI Policy-as-Code');
  lines.push(`Disparate Impact: ${AI_POLICY_AS_CODE.disparate_impact_rule.description}`);
  for (const p of AI_POLICY_AS_CODE.governance_pillars) {
    lines.push(`- ${p.name}: ${p.description}`);
  }

  lines.push('\n## Deep Intelligence: EAA + Section 508 Regulatory Baseline');
  lines.push(`EAA Enforcement: ${EAA_COMPLIANCE_BASELINE.enforcement_start}. Penalties: up to €${(EAA_COMPLIANCE_BASELINE.penalties.max_fine_euros / 1_000_000).toFixed(0)}M + product removal.`);
  lines.push(`Scope: ${EAA_COMPLIANCE_BASELINE.mandatory_scope.slice(0, 5).join(', ')}.`);
  lines.push(`U.S. Section 508: WCAG 2.1 AA by ${EAA_COMPLIANCE_BASELINE.us_section_508.deadline_large} (large) / ${EAA_COMPLIANCE_BASELINE.us_section_508.deadline_small} (small).`);

  return lines.join('\n');
}
