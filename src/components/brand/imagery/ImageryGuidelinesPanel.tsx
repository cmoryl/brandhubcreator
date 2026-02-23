/**
 * ImageryGuidelinesPanel - Diversity & representation guidelines with Stop/Go framework
 */

import { useState } from 'react';
import { CheckCircle2, XCircle, ChevronDown, ChevronUp, Users, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

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

interface ImageryGuidelinesPanelProps {
  canEdit: boolean;
}

export const ImageryGuidelinesPanel = ({ canEdit }: ImageryGuidelinesPanelProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Diversity & Representation Guidelines</span>
          <span className="text-xs text-muted-foreground ml-1">Stop/Go Framework</span>
        </div>
        {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-border pt-3">
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
