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
}

export const FullBrandPage = ({ 
  brand, 
  onBrandUpdate, 
  scrollToSection,
  onSectionVisible,
  sectionOrder = DEFAULT_SECTION_ORDER
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
      case 'colors': return <ColorPaletteSection colors={brand.colors} onColorsChange={(colors) => onBrandUpdate({ colors })} />;
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
      case 'assets': return <AssetsSection assets={brand.assets} onAssetsChange={(assets) => onBrandUpdate({ assets })} />;
      case 'misuse': return <MisuseSection misuse={brand.misuse} onMisuseChange={(misuse) => onBrandUpdate({ misuse })} />;
      case 'atmosphere': return <AtmosphereSection atmosphere={brand.atmosphere} onAtmosphereChange={(atmosphere) => onBrandUpdate({ atmosphere })} />;
      case 'casestudies': return <CaseStudiesSection caseStudies={brand.caseStudies} onCaseStudiesChange={(caseStudies) => onBrandUpdate({ caseStudies })} />;
      case 'brochures': return <BrochuresSection brochures={brand.brochures} onBrochuresChange={(brochures) => onBrandUpdate({ brochures })} />;
      case 'templates': return <TemplatesSection templates={brand.templates} onTemplatesChange={(templates) => onBrandUpdate({ templates })} />;
      default: return null;
    }
  };

  return (
    <div className="space-y-16">
      {sectionOrder.map((sectionId, index) => (
        <div key={sectionId}>
          <div ref={setRef(sectionId)} data-section={sectionId} className="scroll-mt-24">
            {renderSection(sectionId)}
          </div>
          {index < sectionOrder.length - 1 && <Separator className="my-12" />}
        </div>
      ))}
      <div className="h-32" /> {/* Bottom spacing */}
    </div>
  );
};
