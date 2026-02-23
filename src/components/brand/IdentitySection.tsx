import { useState, useMemo } from 'react';
import { BrandIdentity } from '@/types/brand';
import { Textarea } from '@/components/ui/textarea';
import { SectionHeader } from './SectionHeader';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { BookOpen, FileText, Image, Video, Headphones } from 'lucide-react';
import { InclusiveIntelligencePanel } from './identity/InclusiveIntelligencePanel';

interface IdentitySectionProps {
  identity: BrandIdentity;
  onIdentityChange?: (identity: BrandIdentity) => void;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
}

// Reading level estimation (Flesch-Kincaid approximation)
const estimateReadingLevel = (text: string): { grade: number; label: string; color: string } => {
  if (!text || text.length < 20) return { grade: 0, label: 'N/A', color: 'text-muted-foreground' };
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const syllables = words.reduce((count, word) => {
    const w = word.toLowerCase().replace(/[^a-z]/g, '');
    if (w.length <= 3) return count + 1;
    const matches = w.match(/[aeiouy]+/g);
    return count + (matches ? matches.length : 1);
  }, 0);
  if (sentences.length === 0 || words.length === 0) return { grade: 0, label: 'N/A', color: 'text-muted-foreground' };
  const grade = Math.max(0, 0.39 * (words.length / sentences.length) + 11.8 * (syllables / words.length) - 15.59);
  const rounded = Math.round(grade * 10) / 10;
  if (rounded <= 6) return { grade: rounded, label: 'Easy', color: 'text-emerald-600' };
  if (rounded <= 8) return { grade: rounded, label: 'Plain', color: 'text-green-600' };
  if (rounded <= 12) return { grade: rounded, label: 'Moderate', color: 'text-amber-600' };
  return { grade: rounded, label: 'Complex', color: 'text-destructive' };
};

// Content format indicator
const ContentFormatBadges = ({ hasText, hasVisual, hasAudio, hasVideo }: { hasText: boolean; hasVisual: boolean; hasAudio: boolean; hasVideo: boolean }) => (
  <div className="flex items-center gap-1">
    <Tooltip>
      <TooltipTrigger>
        <Badge variant={hasText ? 'default' : 'outline'} className={`text-[8px] px-1 py-0 gap-0.5 ${!hasText ? 'opacity-40' : ''}`}>
          <FileText className="h-2.5 w-2.5" /> Text
        </Badge>
      </TooltipTrigger>
      <TooltipContent><p className="text-xs">{hasText ? 'Text content available' : 'No text content'}</p></TooltipContent>
    </Tooltip>
    <Tooltip>
      <TooltipTrigger>
        <Badge variant={hasVisual ? 'default' : 'outline'} className={`text-[8px] px-1 py-0 gap-0.5 ${!hasVisual ? 'opacity-40' : ''}`}>
          <Image className="h-2.5 w-2.5" /> Visual
        </Badge>
      </TooltipTrigger>
      <TooltipContent><p className="text-xs">{hasVisual ? 'Visual content available' : 'Add visual content for multi-modal delivery'}</p></TooltipContent>
    </Tooltip>
    <Tooltip>
      <TooltipTrigger>
        <Badge variant={hasAudio ? 'default' : 'outline'} className={`text-[8px] px-1 py-0 gap-0.5 ${!hasAudio ? 'opacity-40' : ''}`}>
          <Headphones className="h-2.5 w-2.5" /> Audio
        </Badge>
      </TooltipTrigger>
      <TooltipContent><p className="text-xs">{hasAudio ? 'Audio content available' : 'Add audio for hearing-impaired & mobile users'}</p></TooltipContent>
    </Tooltip>
    <Tooltip>
      <TooltipTrigger>
        <Badge variant={hasVideo ? 'default' : 'outline'} className={`text-[8px] px-1 py-0 gap-0.5 ${!hasVideo ? 'opacity-40' : ''}`}>
          <Video className="h-2.5 w-2.5" /> Video
        </Badge>
      </TooltipTrigger>
      <TooltipContent><p className="text-xs">{hasVideo ? 'Video content available' : 'Add video for visual learners & engagement'}</p></TooltipContent>
    </Tooltip>
  </div>
);

export const IdentitySection = ({ identity, onIdentityChange, customSubtitle, onSubtitleChange }: IdentitySectionProps) => {
  const canEdit = Boolean(onIdentityChange);
  const [isEditing, setIsEditing] = useState(false);

  const readingLevel = useMemo(() => estimateReadingLevel(identity.missionStatement || ''), [identity.missionStatement]);
  const hasTextContent = Boolean(identity.missionStatement && identity.missionStatement.length > 10);

  return (
    <section className="space-y-4 sm:space-y-6">
      <SectionHeader
        title="Narrative Architecture"
        defaultSubtitle="Define your brand's soul and mission"
        customSubtitle={customSubtitle}
        onSubtitleChange={canEdit ? onSubtitleChange : undefined}
        isEditing={isEditing}
        onEditToggle={() => setIsEditing(!isEditing)}
      />

      <div className="grid gap-4 sm:gap-6">
        {/* Mission Statement */}
        <div className="bg-card rounded-xl p-4 sm:p-6 border border-border">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <h3 className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wide">Mission Statement</h3>
            <div className="flex items-center gap-2">
              {readingLevel.grade > 0 && (
                <Tooltip>
                  <TooltipTrigger>
                    <Badge variant="outline" className={`text-[8px] px-1.5 py-0 gap-1 ${readingLevel.color}`}>
                      <BookOpen className="h-2.5 w-2.5" />
                      Grade {readingLevel.grade} · {readingLevel.label}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Flesch-Kincaid reading level. Aim for Grade 8 or below for universal accessibility (curb-cut benefit: helps non-native speakers, mobile readers, busy execs).</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
          {canEdit && isEditing ? (
            <Textarea
              value={identity.missionStatement}
              onChange={(e) => onIdentityChange?.({ ...identity, missionStatement: e.target.value })}
              placeholder="What is your brand's purpose? Why does it exist?"
              className="min-h-[100px] resize-none"
            />
          ) : (
            <p className="text-base sm:text-lg text-foreground leading-relaxed">
              {identity.missionStatement || 'Define your brand\'s purpose and reason for existence.'}
            </p>
          )}
          {/* Multi-modal content format indicators */}
          <div className="mt-3 pt-3 border-t border-border/50">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Content Formats</span>
              <ContentFormatBadges hasText={hasTextContent} hasVisual={false} hasAudio={false} hasVideo={false} />
            </div>
          </div>
        </div>
      </div>

      <InclusiveIntelligencePanel />
    </section>
  );
};
