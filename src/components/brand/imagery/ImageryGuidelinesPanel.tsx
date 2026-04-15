/**
 * ImageryGuidelinesPanel - Diversity & representation guidelines with Stop/Go framework
 * + Visible Identity Diversity, Observable Actions, Cultural Context guidance
 * + Entity-specific imagery audit scoring and recommendations
 */

import { useState } from 'react';
import { CheckCircle2, XCircle, ChevronDown, ChevronUp, Users, Eye, Accessibility, Activity, Globe, Camera, RefreshCw, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useImageryStrategyAudit, type ImageryAuditResult } from '@/hooks/useImageryStrategyAudit';

const GO_SIGNALS = [
  'Authentic, candid moments over posed stock imagery',
  'Diverse age, ethnicity, gender, body type, and ability representation',
  'Contextual storytelling — people in real environments',
  'Inclusive family structures and relationship dynamics',
  'Individuals with visible and invisible disabilities shown actively participating',
  'Cultural dress and traditions depicted respectfully and accurately',
];

const STOP_SIGNALS = [
  'Tokenistic representation — single "diverse" person in a group',
  'Stereotypical roles (e.g., gender-specific occupations)',
  'Exoticizing or "othering" cultural imagery',
  'Inspiration porn — disability used as motivational device',
  'Homogeneous groups presented as universal default',
  'AI-generated faces or bodies without disclosure',
];

const IDENTITY_DIVERSITY_GUIDELINES = [
  { label: 'Age', detail: 'Include children, young adults, middle-aged, and older adults — avoid defaulting to 25–35 demographic' },
  { label: 'Race & Ethnicity', detail: 'Ensure multi-ethnic representation across hero, supporting, and background imagery — not only in "diversity" sections' },
  { label: 'Gender & Expression', detail: 'Represent women, men, non-binary, and gender-nonconforming individuals in leadership and everyday roles' },
  { label: 'Body Size & Shape', detail: 'Feature a range of body types naturally — avoid only aspirational or athletic physiques' },
  { label: 'Visible Disabilities', detail: 'Show people using wheelchairs, prosthetics, hearing aids, canes, or service animals as active participants — not passive subjects' },
  { label: 'Invisible Disabilities', detail: 'Where relevant, acknowledge neurodiversity and non-visible conditions through contextual cues (e.g., sensory-friendly environments)' },
];

const OBSERVABLE_ACTIONS_GUIDELINES = [
  'Describe what people are doing — "engineer testing a prototype" rather than "person standing near equipment"',
  'Show decision-making and leadership across demographics — not only from one group',
  'Depict collaboration as multi-directional (listening, debating, presenting) — not one person leading while others watch',
  'Capture real work moments: writing, building, repairing, cooking, coding, caregiving — avoid vague "looking at laptop" imagery',
  'Include physical and intellectual labor equally — both contribute to brand stories',
];

const CULTURAL_CONTEXT_GUIDELINES = [
  'Research cultural dress, settings, and symbols before use — avoid decorative or out-of-context placement',
  'Show cultural celebrations and traditions with informed, respectful framing — not as exotic spectacle',
  'Include region-specific environments (markets, landscapes, architecture) that ground imagery in authentic place',
  'When depicting food, crafts, or rituals, credit or contextualize the cultural origin',
  'Avoid conflating distinct cultures — e.g., using East Asian motifs generically across all Asian representation',
];

const scoreColor = (v: number) => v >= 75 ? 'text-emerald-500' : v >= 50 ? 'text-amber-500' : 'text-destructive';
const scoreHsl = (v: number) => v >= 75 ? 'hsl(142, 76%, 36%)' : v >= 50 ? 'hsl(38, 92%, 50%)' : 'hsl(0, 84%, 60%)';

function MiniScoreRing({ value, label, size = 52 }: { value: number; label: string; size?: number }) {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(value, 100) / 100) * circumference;
  const color = scoreHsl(value);

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="relative">
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={strokeWidth} />
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
            strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
            className="transition-all duration-700" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold">{Math.round(value)}%</span>
        </div>
      </div>
      <span className="text-[9px] text-muted-foreground font-medium text-center leading-tight max-w-[60px]">{label}</span>
    </div>
  );
}

interface ImageryGuidelinesPanelProps {
  canEdit: boolean;
  entityId?: string;
  entityType?: string;
  organizationId?: string;
}

export const ImageryGuidelinesPanel = ({ canEdit, entityId, entityType, organizationId }: ImageryGuidelinesPanelProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const { latestAudit, isLoading, isRunning, runAudit } = useImageryStrategyAudit(entityId, entityType);

  const handleRunAudit = async () => {
    if (!organizationId) return;
    await runAudit(organizationId);
  };

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Diversity & Representation Guidelines</span>
          {latestAudit && (
            <Badge variant={latestAudit.overall_score >= 75 ? 'default' : latestAudit.overall_score >= 50 ? 'secondary' : 'destructive'} className="text-[10px] ml-1">
              {Math.round(latestAudit.overall_score)}% Score
            </Badge>
          )}
          <span className="text-xs text-muted-foreground ml-1">Stop/Go Framework</span>
        </div>
        {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-border pt-3">
          {/* Audit Scores Section */}
          {latestAudit && (
            <div className="space-y-3 p-3 rounded-lg bg-muted/30 border border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Camera className="h-4 w-4 text-primary" />
                  <h4 className="text-sm font-semibold text-foreground">Imagery Audit Results</h4>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(latestAudit.created_at).toLocaleDateString()}
                </span>
              </div>

              <div className="flex flex-wrap gap-3 justify-center">
                <MiniScoreRing value={latestAudit.overall_score} label="Overall" />
                <MiniScoreRing value={latestAudit.diversity_score} label="Diversity" />
                <MiniScoreRing value={latestAudit.authenticity_score} label="Authenticity" />
                <MiniScoreRing value={latestAudit.cultural_context_score} label="Cultural" />
                <MiniScoreRing value={latestAudit.action_orientation_score} label="Action" />
                <MiniScoreRing value={latestAudit.inclusive_prompting_score} label="Prompting" />
              </div>

              {/* Detected Stop Signals */}
              {Array.isArray(latestAudit.stop_signals_detected) && latestAudit.stop_signals_detected.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-destructive flex items-center gap-1">
                    <XCircle className="h-3 w-3" /> Stop Signals Detected
                  </p>
                  {latestAudit.stop_signals_detected.map((s, i) => (
                    <p key={i} className="text-[11px] text-foreground/70 pl-4">• {s}</p>
                  ))}
                </div>
              )}

              {/* Present Go Signals */}
              {Array.isArray(latestAudit.go_signals_present) && latestAudit.go_signals_present.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Go Signals Present
                  </p>
                  {latestAudit.go_signals_present.map((s, i) => (
                    <p key={i} className="text-[11px] text-foreground/70 pl-4">• {s}</p>
                  ))}
                </div>
              )}

              {/* AI Recommendations */}
              {Array.isArray(latestAudit.recommendations) && latestAudit.recommendations.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-foreground flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-primary" /> AI Recommendations
                  </p>
                  {latestAudit.recommendations.slice(0, 5).map((r, i) => (
                    <div key={i} className="text-[11px] p-2 rounded bg-muted/50 border border-border/50">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="font-medium text-foreground">{r.title}</span>
                        <Badge variant="outline" className="text-[9px]">{r.priority}</Badge>
                      </div>
                      <p className="text-foreground/70">{r.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Audit Button for Admins */}
          {canEdit && entityId && organizationId && (
            <Button variant="outline" size="sm" onClick={handleRunAudit} disabled={isRunning || isLoading} className="gap-1.5 w-full">
              {isRunning ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
              {isRunning ? 'Running Imagery Audit...' : latestAudit ? 'Re-run Imagery Audit' : 'Run Imagery Audit'}
            </Button>
          )}

          <p className="text-xs text-muted-foreground leading-relaxed">
            Apply these signals when selecting, commissioning, or reviewing brand photography to ensure inclusive, authentic visual storytelling.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Go signals */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <h4 className="text-sm font-semibold text-green-700 dark:text-green-400">Go — Use This</h4>
              </div>
              <ul className="space-y-1.5">
                {GO_SIGNALS.map((signal, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-foreground/80">
                    <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" />
                    {signal}
                  </li>
                ))}
              </ul>
            </div>

            {/* Stop signals */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <XCircle className="h-4 w-4 text-red-600" />
                <h4 className="text-sm font-semibold text-red-700 dark:text-red-400">Stop — Avoid This</h4>
              </div>
              <ul className="space-y-1.5">
                {STOP_SIGNALS.map((signal, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-foreground/80">
                    <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
                    {signal}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Visible Identity Diversity */}
          <div className="space-y-2 border-t border-border pt-3">
            <div className="flex items-center gap-1.5">
              <Accessibility className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-semibold text-foreground">Visible Identity Diversity Requirements</h4>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Every imagery brief and review must explicitly address the following identity dimensions. Default to representation — omission is a choice.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {IDENTITY_DIVERSITY_GUIDELINES.map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-xs p-2 rounded-lg bg-muted/40">
                  <span className="font-semibold text-foreground shrink-0 min-w-[90px]">{item.label}:</span>
                  <span className="text-foreground/80">{item.detail}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Observable Actions */}
          <div className="space-y-2 border-t border-border pt-3">
            <div className="flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-semibold text-foreground">Observable Actions in Imagery</h4>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Descriptions and briefs must specify what subjects are <strong className="text-foreground">doing</strong>, not just who they are. Action-oriented imagery builds credibility and avoids passive tokenism.
            </p>
            <ul className="space-y-1.5">
              {OBSERVABLE_ACTIONS_GUIDELINES.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-foreground/80">
                  <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Cultural Context */}
          <div className="space-y-2 border-t border-border pt-3">
            <div className="flex items-center gap-1.5">
              <Globe className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-semibold text-foreground">Cultural Context Requirements</h4>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Imagery that references cultural identity must be grounded in research, not assumption. Context transforms representation from decorative to meaningful.
            </p>
            <ul className="space-y-1.5">
              {CULTURAL_CONTEXT_GUIDELINES.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-foreground/80">
                  <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/60 border border-border">
            <Eye className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Curb-Cut Principle:</strong> Designing imagery for underrepresented audiences improves relatability and engagement for everyone. Captions, alt-text, and high-contrast compositions benefit all viewers — not just those with accessibility needs.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
