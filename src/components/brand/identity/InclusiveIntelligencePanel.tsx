/**
 * InclusiveIntelligencePanel - Deep intelligence guidelines for inclusive
 * language, visual representation, cultural sensitivity, and accessibility.
 * Renders as an expandable reference panel within brand guide sections.
 */

import { useState } from 'react';
import { 
  ChevronDown, ChevronUp, Brain, Languages, Eye, Globe, 
  Accessibility, AlertTriangle, CheckCircle2, Lightbulb 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Guideline {
  title: string;
  items: string[];
}

const INCLUSIVE_LANGUAGE: Guideline = {
  title: 'Inclusive Language Standards',
  items: [
    'Use person-first language ("person with a disability") unless identity-first is preferred by the community ("Deaf community", "autistic person")',
    'Avoid gendered defaults — use "they/them" for unknown individuals; replace "manpower" with "workforce", "chairman" with "chairperson"',
    'Eliminate ableist idioms — replace "blind spot" with "oversight", "tone-deaf" with "insensitive", "falling on deaf ears" with "being ignored"',
    'Use plain language (Flesch-Kincaid Grade 8 or below) — benefits non-native speakers, cognitive disabilities, and mobile readers (curb-cut effect)',
    'Avoid jargon gatekeeping — define technical terms on first use; provide glossaries for specialized content',
    'Test all copy for implicit bias using sentiment analysis (SACM) before publication',
  ],
};

const VISUAL_REPRESENTATION: Guideline = {
  title: 'Visual Representation Requirements',
  items: [
    'Ensure proportional representation across age, race, ethnicity, gender identity, body size, and visible disabilities in all visual assets',
    'Show diverse subjects in active, leadership, and decision-making roles — not as passive bystanders or stereotypical roles',
    'Avoid "diversity as decoration" — representation must be contextual and story-driven, not performative',
    'Include people with visible disabilities (wheelchairs, prosthetics, hearing aids, service animals) as natural participants in everyday scenarios',
    'Imagery briefs must specify observable actions ("engineer calibrating equipment") rather than vague descriptions ("person at desk")',
    'All hero and campaign imagery must pass the Stop/Go Framework review before publication',
  ],
};

const CULTURAL_SENSITIVITY: Guideline = {
  title: 'Cultural Sensitivity & Context',
  items: [
    'Research cultural symbolism, color associations, and gestures for every target market before asset creation',
    'Never conflate distinct cultures — e.g., avoid using generic "Asian" motifs across East Asian, South Asian, and Southeast Asian audiences',
    'Depict cultural celebrations, dress, and traditions with informed, respectful framing — consult community advisors when possible',
    'Adapt messaging tone and humor for regional norms — directness, formality, and emotional expression vary by culture',
    'Use the GlobalLink regional variant system to maintain cultural adaptations rather than one-size-fits-all localization',
    'Review all cross-cultural content against the Bias Awareness scanner\'s cultural sensitivity dimension before regional deployment',
  ],
};

const ACCESSIBILITY_INTEGRATION: Guideline = {
  title: 'Accessibility Integration Standards',
  items: [
    'All text must meet WCAG 2.2 AA contrast minimums: 4.5:1 for normal text, 3:1 for large text and UI components',
    'Provide descriptive alt-text for every image — describe content, context, and emotion, not just objects',
    'Ensure all interactive content is navigable via keyboard alone (no mouse-only interactions)',
    'Support screen readers with semantic HTML, ARIA labels, and logical heading hierarchy (single H1, sequential H2-H6)',
    'Provide captions for video content, transcripts for audio, and text alternatives for infographics',
    'Design for the Microsoft Persona Spectrum — permanent, temporary, and situational disabilities across mobility, vision, hearing, speech, and cognitive dimensions',
    'Test against WCAG 1.4.12 Text Spacing: line-height ≥ 1.5×, paragraph spacing ≥ 2×, letter-spacing ≥ 0.12em, word-spacing ≥ 0.16em',
    'Implement prefers-reduced-motion and prefers-contrast media queries for all animated and high-contrast content',
  ],
};

const DIMENSIONS = [
  { data: INCLUSIVE_LANGUAGE, icon: Languages, accent: 'text-blue-600 dark:text-blue-400' },
  { data: VISUAL_REPRESENTATION, icon: Eye, accent: 'text-violet-600 dark:text-violet-400' },
  { data: CULTURAL_SENSITIVITY, icon: Globe, accent: 'text-emerald-600 dark:text-emerald-400' },
  { data: ACCESSIBILITY_INTEGRATION, icon: Accessibility, accent: 'text-amber-600 dark:text-amber-400' },
];

export const InclusiveIntelligencePanel = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedDimensions, setExpandedDimensions] = useState<Set<number>>(new Set());

  const toggleDimension = (index: number) => {
    setExpandedDimensions(prev => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  };

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Deep Intelligence: Inclusive Brand Standards</span>
          <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">4 Dimensions</span>
        </div>
        {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            These standards integrate deep intelligence insights across four dimensions of inclusive brand governance. 
            Every piece of brand content — copy, imagery, assets, and campaigns — must adhere to these requirements 
            before publication or deployment.
          </p>

          {DIMENSIONS.map(({ data, icon: Icon, accent }, index) => (
            <div key={index} className="border border-border/60 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleDimension(index)}
                className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-muted/30 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <Icon className={cn('h-4 w-4', accent)} />
                  <h4 className="text-sm font-semibold text-foreground">{data.title}</h4>
                  <span className="text-[10px] text-muted-foreground">{data.items.length} guidelines</span>
                </div>
                {expandedDimensions.has(index) ? (
                  <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </button>
              {expandedDimensions.has(index) && (
                <div className="px-3 pb-3 pt-1">
                  <ul className="space-y-1.5">
                    {data.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-foreground/80">
                        <CheckCircle2 className={cn('h-3.5 w-3.5 mt-0.5 shrink-0', accent)} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}

          {/* Integration callout */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/60 border border-border">
            <Lightbulb className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Intelligence Integration:</strong> These standards are enforced through 
              the platform's Bias Awareness scanner, DataForce Compliance AI, and Cultural Validation panel. 
              Automated scans evaluate content against these dimensions on every save, surfacing actionable findings 
              with severity-coded recommendations. Use the Brand Intelligence Knowledge Base to add organization-specific 
              inclusive language guidelines.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};