import { useRef, useEffect, memo, useMemo, useCallback } from 'react';
import { BaseGuide, SectionId, DEFAULT_SECTION_ORDER } from '@/types/brand';
import { HeroSection } from './HeroSection';
import { TaglineSection } from './TaglineSection';
import { IdentitySection } from './IdentitySection';
import { ValuesSection } from './ValuesSection';
import { ServicesSection } from './ServicesSection';
import { LogoSection } from './LogoSection';
import { BrandIconsSection } from './BrandIconsSection';
import { ColorPaletteSection } from './ColorPaletteSection';
import { GradientsSection } from './GradientsSection';
import { PatternsSection } from './PatternsSection';
import { TypographySection } from './TypographySection';
import { TextStylesSection } from './TextStylesSection';
import { IconographySection } from './IconographySection';
import { SocialIconsSection } from './SocialIconsSection';
import { ImagerySection } from './ImagerySection';
import { SocialSection } from './SocialSection';
import { WebsiteSection } from './WebsiteSection';
import { SignaturesSection } from './SignaturesSection';
import { QRSection } from './QRSection';
import { VideosSection } from './VideosSection';
import { AssetsSection } from './AssetsSection';
import { MisuseSection } from './MisuseSection';
import { CaseStudiesSection } from './CaseStudiesSection';
import { BrochuresSection } from './BrochuresSection';
import { TemplatesSection } from './TemplatesSection';
import { ProductsSection } from './ProductsSection';
import { Separator } from '@/components/ui/separator';

// Memoized section wrapper to prevent unnecessary re-renders
interface SectionWrapperProps {
  sectionId: SectionId;
  children: React.ReactNode;
  isHidden: boolean;
  isAdmin: boolean;
  index: number;
  isLast: boolean;
  setRef: (el: HTMLDivElement | null) => void;
}

const SectionWrapper = memo(({ 
  sectionId, 
  children, 
  isHidden, 
  isAdmin, 
  index, 
  isLast,
  setRef 
}: SectionWrapperProps) => (
  <div 
    key={sectionId} 
    className={`section-reveal ${isHidden && isAdmin ? 'opacity-50 relative' : ''}`}
    style={{ animationDelay: `${index * 0.1}s` }}
  >
    {isHidden && isAdmin && (
      <div className="absolute -top-2 right-0 text-xs bg-muted px-2 py-1 rounded text-muted-foreground animate-fade-in">
        Hidden from viewers
      </div>
    )}
    <div 
      ref={setRef} 
      data-section={sectionId} 
      className="scroll-mt-24 hover-lift rounded-xl transition-all duration-300"
    >
      {children}
    </div>
    {!isLast && (
      <Separator className="my-12 animate-fade-in" style={{ animationDelay: `${index * 0.1 + 0.3}s` }} />
    )}
  </div>
));

interface FullBrandPageProps {
  brand: BaseGuide;
  brandId: string;
  onBrandUpdate: (updates: Partial<BaseGuide>) => void;
  scrollToSection?: SectionId | null;
  onSectionVisible?: (sectionId: SectionId) => void;
  sectionOrder?: SectionId[];
  hiddenSections?: SectionId[];
  isAdmin?: boolean;
  heroFullWidth?: boolean;
}

export const FullBrandPage = ({ 
  brand,
  brandId,
  onBrandUpdate, 
  scrollToSection,
  onSectionVisible,
  sectionOrder = DEFAULT_SECTION_ORDER,
  hiddenSections = [],
  isAdmin = false,
  heroFullWidth = false
}: FullBrandPageProps) => {
  const sectionRefs = useRef<Map<SectionId, HTMLDivElement>>(new Map());

  useEffect(() => {
    if (scrollToSection) {
      const element = sectionRefs.current.get(scrollToSection);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [scrollToSection]);

  useEffect(() => {
    if (!onSectionVisible) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const sectionId = entry.target.getAttribute('data-section') as SectionId;
            if (sectionId) {
              onSectionVisible(sectionId);
            }
          }
        });
      },
      { threshold: 0.3, rootMargin: '-80px 0px -50% 0px' }
    );

    sectionRefs.current.forEach((element) => {
      observer.observe(element);
    });

    return () => observer.disconnect();
  }, [onSectionVisible]);

  const setRef = useCallback((id: SectionId) => (el: HTMLDivElement | null) => {
    if (el) {
      sectionRefs.current.set(id, el);
    }
  }, []);

  const sectionSubtitles = brand.sectionSubtitles || {};

  const handleSubtitleChange = useCallback((sectionId: SectionId) => (subtitle: string) => {
    onBrandUpdate({
      sectionSubtitles: {
        ...sectionSubtitles,
        [sectionId]: subtitle,
      },
    });
  }, [onBrandUpdate, sectionSubtitles]);

  // Memoize section content to prevent unnecessary re-renders
  const renderSection = useCallback((sectionId: SectionId) => {
    const customSubtitle = sectionSubtitles[sectionId];
    const onSubtitleChange = handleSubtitleChange(sectionId);

    switch (sectionId) {
      case 'hero': return <HeroSection hero={brand.hero} onHeroChange={(hero) => onBrandUpdate({ hero })} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} fullWidth={heroFullWidth} />;
      case 'tagline': return <TaglineSection tagline={brand.tagline} onTaglineChange={(tagline) => onBrandUpdate({ tagline })} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} />;
      case 'identity': return <IdentitySection identity={brand.identity} onIdentityChange={(identity) => onBrandUpdate({ identity })} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} />;
      case 'values': return <ValuesSection values={brand.values} onValuesChange={(values) => onBrandUpdate({ values })} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} />;
      case 'services': return <ServicesSection services={brand.services || []} onServicesChange={(services) => onBrandUpdate({ services })} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} />;
      case 'logos': return <LogoSection logos={brand.logos} onLogosChange={(logos) => onBrandUpdate({ logos })} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} />;
      case 'brandicon': return <BrandIconsSection brandIcons={brand.brandIcons} onBrandIconsChange={(brandIcons) => onBrandUpdate({ brandIcons })} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} />;
      case 'colors': return <ColorPaletteSection colors={brand.colors} onColorsChange={(colors) => onBrandUpdate({ colors })} colorCombinations={brand.colorCombinations} onColorCombinationsChange={(colorCombinations) => onBrandUpdate({ colorCombinations })} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} />;
      case 'gradients': return <GradientsSection gradients={brand.gradients} onGradientsChange={(gradients) => onBrandUpdate({ gradients })} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} />;
      case 'patterns': return <PatternsSection patterns={brand.patterns} onPatternsChange={(patterns) => onBrandUpdate({ patterns })} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} />;
      case 'typography': return <TypographySection typography={brand.typography} onTypographyChange={(typography) => onBrandUpdate({ typography })} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} />;
      case 'textstyles': return <TextStylesSection textStyles={brand.textStyles} onTextStylesChange={(textStyles) => onBrandUpdate({ textStyles })} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} />;
      case 'iconography': return <IconographySection iconography={brand.iconography} onIconographyChange={(iconography) => onBrandUpdate({ iconography })} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} defaultIconColor={brand.defaultIconColor} onDefaultIconColorChange={(defaultIconColor) => onBrandUpdate({ defaultIconColor })} />;
      case 'socialicons': return <SocialIconsSection socialIcons={brand.socialIcons} onSocialIconsChange={(socialIcons) => onBrandUpdate({ socialIcons })} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} />;
      case 'imagery': return <ImagerySection imagery={brand.imagery} onImageryChange={(imagery) => onBrandUpdate({ imagery })} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} />;
      case 'social': return <SocialSection social={brand.social} onSocialChange={(social) => onBrandUpdate({ social })} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} />;
      case 'website': return <WebsiteSection websites={brand.websites} onWebsitesChange={(websites) => onBrandUpdate({ websites })} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} />;
      case 'signatures': return <SignaturesSection signatures={brand.signatures} onSignaturesChange={(signatures) => onBrandUpdate({ signatures })} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} />;
      case 'qr': return <QRSection qr={brand.qr} onQRChange={(qr) => onBrandUpdate({ qr })} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} />;
      case 'videos': return <VideosSection videos={brand.videos} onVideosChange={(videos) => onBrandUpdate({ videos })} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} />;
      case 'assets': return <AssetsSection assets={brand.assets} onAssetsChange={(assets) => onBrandUpdate({ assets })} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} />;
      case 'misuse': return <MisuseSection misuse={brand.misuse} onMisuseChange={(misuse) => onBrandUpdate({ misuse })} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} />;
      case 'casestudies': return <CaseStudiesSection caseStudies={brand.caseStudies} onCaseStudiesChange={(caseStudies) => onBrandUpdate({ caseStudies })} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} />;
      case 'brochures': return <BrochuresSection brochures={brand.brochures} onBrochuresChange={(brochures) => onBrandUpdate({ brochures })} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} />;
      case 'templates': return <TemplatesSection templates={brand.templates} onTemplatesChange={(templates) => onBrandUpdate({ templates })} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} />;
      case 'products': return brand.type === 'brand' ? <ProductsSection brandId={brandId} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} /> : null;
      default: return null;
    }
  }, [brand, brandId, onBrandUpdate, sectionSubtitles, handleSubtitleChange]);

  // Filter out hidden sections for non-admin users - memoized
  const visibleSections = useMemo(() => 
    isAdmin 
      ? sectionOrder 
      : sectionOrder.filter(id => !hiddenSections.includes(id)),
    [isAdmin, sectionOrder, hiddenSections]
  );

  return (
    <div className="space-y-16">
      {visibleSections.map((sectionId, index) => {
        const isHidden = hiddenSections.includes(sectionId);
        
        return (
          <SectionWrapper
            key={sectionId}
            sectionId={sectionId}
            isHidden={isHidden}
            isAdmin={isAdmin}
            index={index}
            isLast={index >= visibleSections.length - 1}
            setRef={setRef(sectionId)}
          >
            {renderSection(sectionId)}
          </SectionWrapper>
        );
      })}
      <div className="h-32" /> {/* Bottom spacing */}
    </div>
  );
};
