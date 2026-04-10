import { BrandLogo, LogoDownloadLink } from '@/types/brand';
import { UnifiedLogoSection, BRAND_LOGO_VARIANTS, UnifiedLogo } from './UnifiedLogoSection';

interface LogoSectionProps {
  logos: BrandLogo[];
  onLogosChange?: (logos: BrandLogo[]) => void;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
  entityId?: string;
  entityType?: 'brand' | 'product' | 'event';
  logoDownloadLinks?: LogoDownloadLink[];
  onLogoDownloadLinksChange?: (links: LogoDownloadLink[]) => void;
}

export const LogoSection = ({ logos, onLogosChange, customSubtitle, onSubtitleChange, entityId, entityType = 'brand', logoDownloadLinks, onLogoDownloadLinksChange }: LogoSectionProps) => {
  const unifiedLogos: UnifiedLogo[] = logos.map(logo => ({
    id: logo.id,
    name: logo.name,
    url: logo.url,
    variant: logo.variant,
  }));

  const handleLogosChange = onLogosChange ? (newLogos: UnifiedLogo[]) => {
    const brandLogos: BrandLogo[] = newLogos.map(logo => ({
      id: logo.id,
      name: logo.name,
      url: logo.url,
      variant: logo.variant as BrandLogo['variant'],
    }));
    onLogosChange(brandLogos);
  } : undefined;

  return (
    <UnifiedLogoSection
      logos={unifiedLogos}
      onLogosChange={handleLogosChange}
      variants={BRAND_LOGO_VARIANTS}
      title="Logos"
      defaultSubtitle="Upload and organize your brand logos"
      customSubtitle={customSubtitle}
      onSubtitleChange={onSubtitleChange}
      isEditable={!!onLogosChange}
      showGroupedByVariant={true}
      gridLayout="grouped"
      entityId={entityId}
      entityType={entityType}
      logoDownloadLinks={logoDownloadLinks}
      onLogoDownloadLinksChange={onLogoDownloadLinksChange}
    />
  );
};
