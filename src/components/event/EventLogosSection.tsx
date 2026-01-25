import { EventLogo } from '@/types/event';
import { UnifiedLogoSection, EVENT_LOGO_VARIANTS, UnifiedLogo } from '@/components/brand/UnifiedLogoSection';

interface EventLogosSectionProps {
  logos: EventLogo[];
  onUpdate: (logos: EventLogo[]) => void;
  isEditable?: boolean;
  subtitle?: string;
}

export const EventLogosSection = ({
  logos,
  onUpdate,
  isEditable = true,
  subtitle,
}: EventLogosSectionProps) => {
  // Convert EventLogo[] to UnifiedLogo[] for the unified component
  const unifiedLogos: UnifiedLogo[] = logos.map(logo => ({
    id: logo.id,
    name: logo.name,
    url: logo.url,
    variant: logo.variant,
    description: logo.description,
  }));

  // Convert back when updating
  const handleLogosChange = (newLogos: UnifiedLogo[]) => {
    const eventLogos: EventLogo[] = newLogos.map(logo => ({
      id: logo.id,
      name: logo.name,
      url: logo.url,
      variant: logo.variant as EventLogo['variant'],
      description: logo.description,
    }));
    onUpdate(eventLogos);
  };

  return (
    <div id="eventlogos" className="scroll-mt-24">
      <UnifiedLogoSection
        logos={unifiedLogos}
        onLogosChange={isEditable ? handleLogosChange : undefined}
        variants={EVENT_LOGO_VARIANTS}
        title="Event Logos"
        defaultSubtitle="Event-specific logos, lockups, and co-branded marks"
        customSubtitle={subtitle}
        isEditable={isEditable}
        showGroupedByVariant={true}
        gridLayout="grouped"
      />
    </div>
  );
};
