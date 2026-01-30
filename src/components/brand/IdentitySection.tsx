import { useState } from 'react';
import { BrandIdentity } from '@/types/brand';
import { Textarea } from '@/components/ui/textarea';
import { SectionHeader } from './SectionHeader';

interface IdentitySectionProps {
  identity: BrandIdentity;
  onIdentityChange?: (identity: BrandIdentity) => void;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
}

export const IdentitySection = ({ identity, onIdentityChange, customSubtitle, onSubtitleChange }: IdentitySectionProps) => {
  const canEdit = Boolean(onIdentityChange);
  const [isEditing, setIsEditing] = useState(false);

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
          <h3 className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2 sm:mb-3">Mission Statement</h3>
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
        </div>
      </div>
    </section>
  );
};
