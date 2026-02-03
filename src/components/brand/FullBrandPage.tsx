import { useRef, useEffect, memo, useMemo, useCallback } from 'react';
import { motion, useInView } from 'framer-motion';
import { cn } from '@/lib/utils';
import { BaseGuide, SectionId, DEFAULT_SECTION_ORDER, LayoutPreset, InfographicLayout } from '@/types/brand';
import { HeroSection } from './HeroSection';
import { TaglineSection } from './TaglineSection';
import { IdentitySection } from './IdentitySection';
import { ValuesSection } from './ValuesSection';
import { ByTheNumbersSection } from './ByTheNumbersSection';
import { ServicesSection } from './ServicesSection';
import { RevenueChartSection } from './RevenueChartSection';
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
import { SocialAssetsSection } from './SocialAssetsSection';
import { WebsiteSection } from './WebsiteSection';
import { SignaturesSection } from './SignaturesSection';
import { QRSection } from './QRSection';
import { VideosSection } from './VideosSection';
import { AssetsSection } from './AssetsSection';
import { ImageAssetsSection } from './ImageAssetsSection';
import { MisuseSection } from './MisuseSection';
import { DigitalCollateralSection } from './DigitalCollateralSection';
import { TemplatesSection } from './TemplatesSection';
import { TemplateSpecsSection } from './TemplateSpecsSection';
import { ProductsSection } from './ProductsSection';
import { EventsSection } from './EventsSection';
import { WebinarSeriesSection } from './WebinarSeriesSection';
import AwardsSection from './AwardsSection';
import { GlobalLinkUniverseSection } from './GlobalLinkUniverseSection';
import { InsightsSection } from './InsightsSection';
import { Separator } from '@/components/ui/separator';

// Framer motion variants for smooth section animations
const sectionVariants = {
  hidden: { 
    opacity: 0, 
    y: 30,
  },
  visible: { 
    opacity: 1, 
    y: 0,
  },
};

const sectionTransition = {
  type: 'spring' as const,
  stiffness: 80,
  damping: 20,
  mass: 0.8,
};

const separatorVariants = {
  hidden: { scaleX: 0, opacity: 0 },
  visible: { 
    scaleX: 1, 
    opacity: 1,
  },
};

const separatorTransition = {
  duration: 0.6,
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
};

// Memoized section wrapper with scroll animations
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
}: SectionWrapperProps) => {
  const localRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(localRef, { once: true, margin: '-60px' as any });
  
  // Hero section should be full-width, other sections get content container
  const isHeroSection = sectionId === 'hero';
  
  // Combine refs
  const handleRef = useCallback((el: HTMLDivElement | null) => {
    (localRef as any).current = el;
    setRef(el);
  }, [setRef]);
  
  return (
    <div 
      key={sectionId} 
      className={`${isHidden && isAdmin ? 'opacity-50 relative' : ''}`}
    >
      {isHidden && isAdmin && (
        <div className="absolute -top-2 right-0 text-xs bg-muted px-2 py-1 rounded text-muted-foreground z-10">
          Hidden from viewers
        </div>
      )}
      <motion.div
        ref={handleRef}
        data-section={sectionId}
        className={cn(
          "scroll-mt-24 rounded-xl will-change-transform",
          !isHeroSection && "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        )}
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
        variants={sectionVariants}
        transition={{ ...sectionTransition, delay: index * 0.05 }}
      >
        {children}
      </motion.div>
      {!isLast && (
        <motion.div
          className="my-8 sm:my-12 max-w-7xl mx-auto"
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={separatorVariants}
          transition={separatorTransition}
          style={{ originX: 0 }}
        >
          <Separator />
        </motion.div>
      )}
    </div>
  );
});
SectionWrapper.displayName = 'SectionWrapper';

interface FullBrandPageProps {
  brand: BaseGuide;
  brandId: string;
  organizationId?: string;
  onBrandUpdate?: (updates: Partial<BaseGuide>) => void;
  scrollToSection?: SectionId | null;
  onSectionVisible?: (sectionId: SectionId) => void;
  sectionOrder?: SectionId[];
  hiddenSections?: SectionId[];
  isAdmin?: boolean;
  /** Controls whether editing is allowed - when false, all edit controls are hidden */
  canEdit?: boolean;
  heroFullWidth?: boolean;
  /** Callback to open the Intelligence panel from the hero */
  onOpenIntelligence?: () => void;
  /** Entity type for storage uploads */
  entityType?: 'brand' | 'product' | 'event';
}

export const FullBrandPage = ({ 
  brand,
  brandId,
  organizationId,
  onBrandUpdate, 
  scrollToSection,
  onSectionVisible,
  sectionOrder = DEFAULT_SECTION_ORDER,
  hiddenSections = [],
  isAdmin = false,
  canEdit = false,
  heroFullWidth = false,
  onOpenIntelligence,
  entityType = 'brand',
}: FullBrandPageProps) => {
  const sectionRefs = useRef<Map<SectionId, HTMLDivElement>>(new Map());

  useEffect(() => {
    if (scrollToSection) {
      const element = sectionRefs.current.get(scrollToSection);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // Add highlight flash after scroll completes
        const flashTimeout = setTimeout(() => {
          element.classList.add('section-highlight-flash');
          
          // Remove the class after animation completes
          setTimeout(() => {
            element.classList.remove('section-highlight-flash');
          }, 1300);
        }, 400);
        
        return () => clearTimeout(flashTimeout);
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
  const sectionLayouts = brand.sectionLayouts || {};

  const handleSubtitleChange = useCallback((sectionId: SectionId) => (subtitle: string) => {
    onBrandUpdate?.({
      sectionSubtitles: {
        ...sectionSubtitles,
        [sectionId]: subtitle,
      },
    });
  }, [onBrandUpdate, sectionSubtitles]);

  const handleLayoutChange = useCallback((sectionId: SectionId) => (layout: LayoutPreset) => {
    onBrandUpdate?.({
      sectionLayouts: {
        ...sectionLayouts,
        [sectionId]: layout,
      },
    });
  }, [onBrandUpdate, sectionLayouts]);

  // Memoize section content to prevent unnecessary re-renders
  // When canEdit is false, pass undefined for all change handlers to disable editing
  const renderSection = useCallback((sectionId: SectionId) => {
    const customSubtitle = sectionSubtitles[sectionId];
    const onSubtitleChange = canEdit ? handleSubtitleChange(sectionId) : undefined;
    const layout = sectionLayouts[sectionId];
    const onLayoutChange = canEdit ? handleLayoutChange(sectionId) : undefined;

    // Helper to conditionally create change handler
    const editHandler = <T,>(handler: (value: T) => void) => canEdit ? handler : undefined;

    switch (sectionId) {
      case 'hero': return <HeroSection hero={brand.hero} onHeroChange={editHandler((hero) => onBrandUpdate({ hero }))} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} fullWidth={heroFullWidth} onOpenIntelligence={canEdit ? onOpenIntelligence : undefined} guideData={brand as unknown as Record<string, unknown>} entityType={entityType} entityId={brandId} />;
      case 'tagline': return <TaglineSection tagline={brand.tagline} onTaglineChange={editHandler((tagline) => onBrandUpdate({ tagline }))} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} />;
      case 'identity': return <IdentitySection identity={brand.identity} onIdentityChange={editHandler((identity) => onBrandUpdate({ identity }))} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} />;
      case 'values': return <ValuesSection values={brand.values} onValuesChange={editHandler((values) => onBrandUpdate({ values }))} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} organizationId={organizationId} brandId={brandId} brandName={brand.hero.name} canEdit={canEdit} />;
      case 'bythenumbers': return <ByTheNumbersSection statistics={brand.statistics || []} onStatisticsChange={editHandler((statistics) => onBrandUpdate({ statistics }))} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} brandName={brand.hero.name} infographicLayout={brand.infographicLayout || 'infographic'} onLayoutChange={canEdit ? (infographicLayout: InfographicLayout) => onBrandUpdate({ infographicLayout }) : undefined} brandColors={brand.colors || []} />;
      case 'services': return <ServicesSection services={brand.services || []} onServicesChange={editHandler((services) => onBrandUpdate({ services }))} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} />;
      case 'revenue': return <RevenueChartSection revenueData={brand.revenueData} onRevenueDataChange={editHandler((revenueData) => onBrandUpdate({ revenueData }))} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} brandName={brand.hero.name} chartTheme={brand.chartTheme} onChartThemeChange={editHandler((chartTheme) => onBrandUpdate({ chartTheme }))} brandColors={brand.colors || []} />;
      case 'awards': return <AwardsSection awards={brand.awards || []} onUpdate={editHandler((awards) => onBrandUpdate({ awards }))} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} entityType={entityType} entityId={brandId} />;
      case 'webinars': return <WebinarSeriesSection webinars={brand.webinars || []} onWebinarsChange={editHandler((webinars) => onBrandUpdate({ webinars }))} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} />;
      case 'logos': return <LogoSection logos={brand.logos} onLogosChange={editHandler((logos) => onBrandUpdate({ logos }))} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} />;
      case 'brandicon': return <BrandIconsSection brandIcons={brand.brandIcons} onBrandIconsChange={editHandler((brandIcons) => onBrandUpdate({ brandIcons }))} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} />;
      case 'colors': return <ColorPaletteSection colors={brand.colors} onColorsChange={editHandler((colors) => onBrandUpdate({ colors }))} colorCombinations={brand.colorCombinations} onColorCombinationsChange={editHandler((colorCombinations) => onBrandUpdate({ colorCombinations }))} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} brandName={brand.hero.name} />;
      case 'gradients': return <GradientsSection gradients={brand.gradients} onGradientsChange={editHandler((gradients) => onBrandUpdate({ gradients }))} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} layout={layout} onLayoutChange={onLayoutChange} brandName={brand.hero.name} brandColors={brand.colors} />;
      case 'patterns': return <PatternsSection patterns={brand.patterns} onPatternsChange={editHandler((patterns) => onBrandUpdate({ patterns }))} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} layout={layout} onLayoutChange={onLayoutChange} brandName={brand.hero.name} brandColors={brand.colors} brandTagline={brand.tagline?.primary} brandArchetype={brand.identity?.archetype} />;
      case 'typography': return <TypographySection typography={brand.typography} onTypographyChange={editHandler((typography) => onBrandUpdate({ typography }))} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} />;
      case 'textstyles': return <TextStylesSection textStyles={brand.textStyles} onTextStylesChange={editHandler((textStyles) => onBrandUpdate({ textStyles }))} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} />;
      case 'iconography': return <IconographySection iconography={brand.iconography} onIconographyChange={editHandler((iconography) => onBrandUpdate({ iconography }))} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} defaultIconColor={brand.defaultIconColor} onDefaultIconColorChange={editHandler((defaultIconColor) => onBrandUpdate({ defaultIconColor }))} brandColors={brand.colors?.map(c => ({ hex: c.hex, name: c.name })) || []} />;
      case 'socialicons': return <SocialIconsSection socialIcons={brand.socialIcons} onSocialIconsChange={editHandler((socialIcons) => onBrandUpdate({ socialIcons }))} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} />;
      case 'imagery': return <ImagerySection imagery={brand.imagery} onImageryChange={editHandler((imagery) => onBrandUpdate({ imagery }))} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} />;
      case 'social': return <SocialSection social={brand.social} onSocialChange={editHandler((social) => onBrandUpdate({ social }))} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} />;
      case 'socialassets': return <SocialAssetsSection socialAssets={brand.socialAssets || []} onSocialAssetsChange={editHandler((socialAssets) => onBrandUpdate({ socialAssets }))} displayBanners={brand.displayBanners || []} onDisplayBannersChange={editHandler((displayBanners) => onBrandUpdate({ displayBanners }))} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} layout={layout} onLayoutChange={onLayoutChange} />;
      case 'website': return <WebsiteSection websites={brand.websites} onWebsitesChange={editHandler((websites) => onBrandUpdate({ websites }))} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} />;
      case 'signatures': return <SignaturesSection signatures={brand.signatures} onSignaturesChange={editHandler((signatures) => onBrandUpdate({ signatures }))} emailBanners={brand.emailBanners || []} onEmailBannersChange={editHandler((emailBanners) => onBrandUpdate({ emailBanners }))} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} />;
      case 'qr': return <QRSection qr={brand.qr} onQRChange={editHandler((qr) => onBrandUpdate({ qr }))} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} />;
      case 'videos': return <VideosSection videos={brand.videos} onVideosChange={editHandler((videos) => onBrandUpdate({ videos }))} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} />;
      case 'assets': return <AssetsSection assets={brand.assets} onAssetsChange={editHandler((assets) => onBrandUpdate({ assets }))} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} />;
      case 'imageassets': return <ImageAssetsSection imageAssets={brand.imageAssets || []} onImageAssetsChange={editHandler((imageAssets) => onBrandUpdate({ imageAssets }))} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} canEdit={canEdit} />;
      case 'misuse': return <MisuseSection misuse={brand.misuse} onMisuseChange={editHandler((misuse) => onBrandUpdate({ misuse }))} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} />;
      case 'casestudies':
      case 'brochures': return <DigitalCollateralSection collateral={brand.brochures || []} onCollateralChange={editHandler((brochures) => onBrandUpdate({ brochures }))} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} layout={layout} onLayoutChange={onLayoutChange} />;
      case 'templates': return <TemplatesSection templates={brand.templates || []} onTemplatesChange={editHandler((templates) => onBrandUpdate({ templates }))} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} layout={layout} onLayoutChange={onLayoutChange} />;
      case 'templatespecs': return <TemplateSpecsSection templateSpecs={brand.templateSpecs || []} onTemplateSpecsChange={editHandler((templateSpecs) => onBrandUpdate({ templateSpecs }))} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} brandColors={brand.colors || []} />;
      case 'products': 
        // Support products section for both brands and products
        return brand.type === 'brand' 
          ? <ProductsSection brandId={brandId} linkedGuides={brand.linkedGuides || []} onLinkedGuidesChange={editHandler((linkedGuides) => onBrandUpdate({ linkedGuides }))} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} layout={layout} onLayoutChange={onLayoutChange} />
          : <ProductsSection productId={brandId} linkedGuides={brand.linkedGuides || []} onLinkedGuidesChange={editHandler((linkedGuides) => onBrandUpdate({ linkedGuides }))} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} layout={layout} onLayoutChange={onLayoutChange} />;
      case 'events':
        // Events section only for brands
        return brand.type === 'brand' 
          ? <EventsSection brandId={brandId} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} layout={layout} onLayoutChange={onLayoutChange} />
          : null;
      case 'universe':
        // Only show for product suites (products with linkedGuides)
        // Check if this is a product with linked guides (like GlobalLink)
        if (brand.type === 'product' && brand.linkedGuides && brand.linkedGuides.length > 0) {
          const primaryColor = brand.colors?.[0]?.hex || '#6366f1';
          return <GlobalLinkUniverseSection linkedGuides={brand.linkedGuides} primaryColor={primaryColor} />;
        }
        return null;
      case 'insights':
        return <InsightsSection 
          insights={brand.insights || []} 
          layout={brand.insightsLayout}
          onInsightsChange={editHandler((insights) => onBrandUpdate({ insights }))} 
          onLayoutChange={canEdit ? (insightsLayout) => onBrandUpdate({ insightsLayout }) : undefined}
          customSubtitle={customSubtitle} 
          onSubtitleChange={onSubtitleChange} 
        />;
      default: return null;
    }
  }, [brand, brandId, onBrandUpdate, sectionSubtitles, sectionLayouts, handleSubtitleChange, handleLayoutChange, heroFullWidth, onOpenIntelligence, canEdit]);

  // Filter out hidden sections for non-admin users - memoized
  const visibleSections = useMemo(() => 
    isAdmin 
      ? sectionOrder 
      : sectionOrder.filter(id => !hiddenSections.includes(id)),
    [isAdmin, sectionOrder, hiddenSections]
  );

  return (
    <div className="space-y-10 sm:space-y-16">
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
