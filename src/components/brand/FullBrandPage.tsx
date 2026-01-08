import { useRef, useEffect } from 'react';
import { BaseGuide, SectionId, DEFAULT_SECTION_ORDER } from '@/types/brand';
import { HeroSection } from './HeroSection';
import { IdentitySection } from './IdentitySection';
import { ValuesSection } from './ValuesSection';
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
import { SignaturesSection } from './SignaturesSection';
import { QRSection } from './QRSection';
import { VideosSection } from './VideosSection';
import { AssetsSection } from './AssetsSection';
import { MisuseSection } from './MisuseSection';
import { AtmosphereSection } from './AtmosphereSection';
import { CaseStudiesSection } from './CaseStudiesSection';
import { BrochuresSection } from './BrochuresSection';
import { TemplatesSection } from './TemplatesSection';
import { Separator } from '@/components/ui/separator';

interface FullBrandPageProps {
  brand: BaseGuide;
  onBrandUpdate: (updates: Partial<BaseGuide>) => void;
  scrollToSection?: SectionId | null;
  onSectionVisible?: (sectionId: SectionId) => void;
  sectionOrder?: SectionId[];
  hiddenSections?: SectionId[];
  isAdmin?: boolean;
}

export const FullBrandPage = ({ 
  brand, 
  onBrandUpdate, 
  scrollToSection,
  onSectionVisible,
  sectionOrder = DEFAULT_SECTION_ORDER,
  hiddenSections = [],
  isAdmin = false
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

  const setRef = (id: SectionId) => (el: HTMLDivElement | null) => {
    if (el) {
      sectionRefs.current.set(id, el);
    }
  };

  const renderSection = (sectionId: SectionId) => {
    switch (sectionId) {
      case 'hero': return <HeroSection hero={brand.hero} onHeroChange={(hero) => onBrandUpdate({ hero })} />;
      case 'identity': return <IdentitySection identity={brand.identity} onIdentityChange={(identity) => onBrandUpdate({ identity })} />;
      case 'values': return <ValuesSection values={brand.values} onValuesChange={(values) => onBrandUpdate({ values })} />;
      case 'logos': return <LogoSection logos={brand.logos} onLogosChange={(logos) => onBrandUpdate({ logos })} />;
      case 'brandicon': return <BrandIconsSection brandIcons={brand.brandIcons} onBrandIconsChange={(brandIcons) => onBrandUpdate({ brandIcons })} />;
      case 'colors': return <ColorPaletteSection colors={brand.colors} onColorsChange={(colors) => onBrandUpdate({ colors })} colorCombinations={brand.colorCombinations} onColorCombinationsChange={(colorCombinations) => onBrandUpdate({ colorCombinations })} />;
      case 'gradients': return <GradientsSection gradients={brand.gradients} onGradientsChange={(gradients) => onBrandUpdate({ gradients })} />;
      case 'patterns': return <PatternsSection patterns={brand.patterns} onPatternsChange={(patterns) => onBrandUpdate({ patterns })} />;
      case 'typography': return <TypographySection typography={brand.typography} onTypographyChange={(typography) => onBrandUpdate({ typography })} />;
      case 'textstyles': return <TextStylesSection textStyles={brand.textStyles} onTextStylesChange={(textStyles) => onBrandUpdate({ textStyles })} />;
      case 'iconography': return <IconographySection iconography={brand.iconography} onIconographyChange={(iconography) => onBrandUpdate({ iconography })} />;
      case 'socialicons': return <SocialIconsSection socialIcons={brand.socialIcons} onSocialIconsChange={(socialIcons) => onBrandUpdate({ socialIcons })} />;
      case 'imagery': return <ImagerySection imagery={brand.imagery} onImageryChange={(imagery) => onBrandUpdate({ imagery })} />;
      case 'social': return <SocialSection social={brand.social} onSocialChange={(social) => onBrandUpdate({ social })} />;
      case 'signatures': return <SignaturesSection signatures={brand.signatures} onSignaturesChange={(signatures) => onBrandUpdate({ signatures })} />;
      case 'qr': return <QRSection qr={brand.qr} onQRChange={(qr) => onBrandUpdate({ qr })} />;
      case 'videos': return <VideosSection videos={brand.videos} onVideosChange={(videos) => onBrandUpdate({ videos })} />;
      case 'assets': return <AssetsSection assets={brand.assets} onAssetsChange={(assets) => onBrandUpdate({ assets })} />;
      case 'misuse': return <MisuseSection misuse={brand.misuse} onMisuseChange={(misuse) => onBrandUpdate({ misuse })} />;
      case 'atmosphere': return <AtmosphereSection atmosphere={brand.atmosphere} onAtmosphereChange={(atmosphere) => onBrandUpdate({ atmosphere })} />;
      case 'casestudies': return <CaseStudiesSection caseStudies={brand.caseStudies} onCaseStudiesChange={(caseStudies) => onBrandUpdate({ caseStudies })} />;
      case 'brochures': return <BrochuresSection brochures={brand.brochures} onBrochuresChange={(brochures) => onBrandUpdate({ brochures })} />;
      case 'templates': return <TemplatesSection templates={brand.templates} onTemplatesChange={(templates) => onBrandUpdate({ templates })} />;
      default: return null;
    }
  };

  // Filter out hidden sections for non-admin users
  const visibleSections = isAdmin 
    ? sectionOrder 
    : sectionOrder.filter(id => !hiddenSections.includes(id));

  return (
    <div className="space-y-16">
      {visibleSections.map((sectionId, index) => {
        const isHidden = hiddenSections.includes(sectionId);
        
        return (
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
              ref={setRef(sectionId)} 
              data-section={sectionId} 
              className="scroll-mt-24 hover-lift rounded-xl transition-all duration-300"
            >
              {renderSection(sectionId)}
            </div>
            {index < visibleSections.length - 1 && (
              <Separator className="my-12 animate-fade-in" style={{ animationDelay: `${index * 0.1 + 0.3}s` }} />
            )}
          </div>
        );
      })}
      <div className="h-32" /> {/* Bottom spacing */}
    </div>
  );
};
