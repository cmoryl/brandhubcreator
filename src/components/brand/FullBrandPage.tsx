import { useRef, useEffect } from 'react';
import { BrandGuide, SectionId } from '@/types/brand';
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
  brand: BrandGuide;
  onBrandUpdate: (updates: Partial<BrandGuide>) => void;
  scrollToSection?: SectionId | null;
  onSectionVisible?: (sectionId: SectionId) => void;
}

const sectionOrder: SectionId[] = [
  'hero', 'identity', 'values', 'logos', 'brandicon', 'colors', 'gradients', 
  'patterns', 'typography', 'textstyles', 'iconography', 'socialicons', 
  'imagery', 'social', 'signatures', 'qr', 'assets', 'misuse', 'atmosphere',
  'casestudies', 'brochures', 'templates'
];

export const FullBrandPage = ({ 
  brand, 
  onBrandUpdate, 
  scrollToSection,
  onSectionVisible 
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

  return (
    <div className="space-y-16">
      <div ref={setRef('hero')} data-section="hero" className="scroll-mt-24">
        <HeroSection hero={brand.hero} onHeroChange={(hero) => onBrandUpdate({ hero })} />
      </div>
      
      <Separator className="my-12" />
      
      <div ref={setRef('identity')} data-section="identity" className="scroll-mt-24">
        <IdentitySection identity={brand.identity} onIdentityChange={(identity) => onBrandUpdate({ identity })} />
      </div>
      
      <Separator className="my-12" />
      
      <div ref={setRef('values')} data-section="values" className="scroll-mt-24">
        <ValuesSection values={brand.values} onValuesChange={(values) => onBrandUpdate({ values })} />
      </div>
      
      <Separator className="my-12" />
      
      <div ref={setRef('logos')} data-section="logos" className="scroll-mt-24">
        <LogoSection logos={brand.logos} onLogosChange={(logos) => onBrandUpdate({ logos })} />
      </div>
      
      <Separator className="my-12" />
      
      <div ref={setRef('brandicon')} data-section="brandicon" className="scroll-mt-24">
        <BrandIconsSection brandIcons={brand.brandIcons} onBrandIconsChange={(brandIcons) => onBrandUpdate({ brandIcons })} />
      </div>
      
      <Separator className="my-12" />
      
      <div ref={setRef('colors')} data-section="colors" className="scroll-mt-24">
        <ColorPaletteSection colors={brand.colors} onColorsChange={(colors) => onBrandUpdate({ colors })} />
      </div>
      
      <Separator className="my-12" />
      
      <div ref={setRef('gradients')} data-section="gradients" className="scroll-mt-24">
        <GradientsSection gradients={brand.gradients} onGradientsChange={(gradients) => onBrandUpdate({ gradients })} />
      </div>
      
      <Separator className="my-12" />
      
      <div ref={setRef('patterns')} data-section="patterns" className="scroll-mt-24">
        <PatternsSection patterns={brand.patterns} onPatternsChange={(patterns) => onBrandUpdate({ patterns })} />
      </div>
      
      <Separator className="my-12" />
      
      <div ref={setRef('typography')} data-section="typography" className="scroll-mt-24">
        <TypographySection typography={brand.typography} onTypographyChange={(typography) => onBrandUpdate({ typography })} />
      </div>
      
      <Separator className="my-12" />
      
      <div ref={setRef('textstyles')} data-section="textstyles" className="scroll-mt-24">
        <TextStylesSection textStyles={brand.textStyles} onTextStylesChange={(textStyles) => onBrandUpdate({ textStyles })} />
      </div>
      
      <Separator className="my-12" />
      
      <div ref={setRef('iconography')} data-section="iconography" className="scroll-mt-24">
        <IconographySection iconography={brand.iconography} onIconographyChange={(iconography) => onBrandUpdate({ iconography })} />
      </div>
      
      <Separator className="my-12" />
      
      <div ref={setRef('socialicons')} data-section="socialicons" className="scroll-mt-24">
        <SocialIconsSection socialIcons={brand.socialIcons} onSocialIconsChange={(socialIcons) => onBrandUpdate({ socialIcons })} />
      </div>
      
      <Separator className="my-12" />
      
      <div ref={setRef('imagery')} data-section="imagery" className="scroll-mt-24">
        <ImagerySection imagery={brand.imagery} onImageryChange={(imagery) => onBrandUpdate({ imagery })} />
      </div>
      
      <Separator className="my-12" />
      
      <div ref={setRef('social')} data-section="social" className="scroll-mt-24">
        <SocialSection social={brand.social} onSocialChange={(social) => onBrandUpdate({ social })} />
      </div>
      
      <Separator className="my-12" />
      
      <div ref={setRef('signatures')} data-section="signatures" className="scroll-mt-24">
        <SignaturesSection signatures={brand.signatures} onSignaturesChange={(signatures) => onBrandUpdate({ signatures })} />
      </div>
      
      <Separator className="my-12" />
      
      <div ref={setRef('qr')} data-section="qr" className="scroll-mt-24">
        <QRSection qr={brand.qr} onQRChange={(qr) => onBrandUpdate({ qr })} />
      </div>
      
      <Separator className="my-12" />
      
      <div ref={setRef('assets')} data-section="assets" className="scroll-mt-24">
        <AssetsSection assets={brand.assets} onAssetsChange={(assets) => onBrandUpdate({ assets })} />
      </div>
      
      <Separator className="my-12" />
      
      <div ref={setRef('misuse')} data-section="misuse" className="scroll-mt-24">
        <MisuseSection misuse={brand.misuse} onMisuseChange={(misuse) => onBrandUpdate({ misuse })} />
      </div>
      
      <Separator className="my-12" />
      
      <div ref={setRef('atmosphere')} data-section="atmosphere" className="scroll-mt-24">
        <AtmosphereSection atmosphere={brand.atmosphere} onAtmosphereChange={(atmosphere) => onBrandUpdate({ atmosphere })} />
      </div>
      
      <Separator className="my-12" />
      
      <div ref={setRef('casestudies')} data-section="casestudies" className="scroll-mt-24">
        <CaseStudiesSection caseStudies={brand.caseStudies} onCaseStudiesChange={(caseStudies) => onBrandUpdate({ caseStudies })} />
      </div>
      
      <Separator className="my-12" />
      
      <div ref={setRef('brochures')} data-section="brochures" className="scroll-mt-24">
        <BrochuresSection brochures={brand.brochures} onBrochuresChange={(brochures) => onBrandUpdate({ brochures })} />
      </div>
      
      <Separator className="my-12" />
      
      <div ref={setRef('templates')} data-section="templates" className="scroll-mt-24">
        <TemplatesSection templates={brand.templates} onTemplatesChange={(templates) => onBrandUpdate({ templates })} />
      </div>
      
      <div className="h-32" /> {/* Bottom spacing */}
    </div>
  );
};
