import { useRef, useEffect, memo, useMemo, useCallback, lazy, Suspense } from 'react';
import { motion, useInView } from 'framer-motion';
import { cn } from '@/lib/utils';
import { BaseGuide, SectionId, DEFAULT_SECTION_ORDER, LayoutPreset, InfographicLayout, BrandLocation, LocationStat } from '@/types/brand';
import { useUserPreferences } from '@/hooks/useUserPreferences';
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
import { LayoutTemplatesSection } from './LayoutTemplatesSection';
import { resolveBrandVisuals } from '@/lib/deriveBrandVisuals';
import { PatternsSection } from './PatternsSection';
import { TypographySection } from './TypographySection';
import { TextStylesSection } from './TextStylesSection';
const IconographySection = lazy(() => import('./IconographySection').then(m => ({ default: m.IconographySection })));
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
import { CaseStudiesSection } from './CaseStudiesSection';
import { TemplatesSection } from './TemplatesSection';
import { TemplateSpecsSection } from './TemplateSpecsSection';
import { ProductsSection } from './ProductsSection';
import { EventsSection } from './EventsSection';
import { WebinarSeriesSection } from './WebinarSeriesSection';
import AwardsSection from './AwardsSection';
import { GlobalLinkUniverseSection } from './GlobalLinkUniverseSection';
import { BrandUniverseOrbit } from './BrandUniverseOrbit';
import { InsightsSection } from './InsightsSection';
const LeafletLocationsSection = lazy(() => import('./LeafletLocationsSection').then(m => ({ default: m.LeafletLocationsSection })));
import { BrandEventSignageSection } from './BrandEventSignageSection';
import { ClientLogosSection } from './ClientLogosSection';
import { SponsorLogosSection } from './SponsorLogosSection';
import { PresentationTemplatesSection } from './PresentationTemplatesSection';
const ApprovedImagerySection = lazy(() => import('./approved-imagery/ApprovedImagerySection').then(m => ({ default: m.ApprovedImagerySection })));
const StudiosSection = lazy(() => import('./StudiosSection').then(m => ({ default: m.StudiosSection })));
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
        id={sectionId}
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
  const adminLayouts = brand.sectionLayouts || {};

  // User preferences for layout overrides (viewer-level personalization)
  const { getPreference, setPreference } = useUserPreferences();
  const brandPrefKey = (sectionId: SectionId) => `layout.${brandId}.${sectionId}`;

  // Merge: user preference > admin default > fallback
  const sectionLayouts = useMemo(() => {
    const merged: Record<string, LayoutPreset> = { ...adminLayouts };
    // Override with user preferences if present
    Object.keys(adminLayouts).forEach(key => {
      const userPref = getPreference<LayoutPreset | undefined>(brandPrefKey(key as SectionId));
      if (userPref) merged[key] = userPref;
    });
    return merged;
  }, [adminLayouts, getPreference, brandId]);

  const handleSubtitleChange = useCallback((sectionId: SectionId) => (subtitle: string) => {
    onBrandUpdate?.({
      sectionSubtitles: {
        ...sectionSubtitles,
        [sectionId]: subtitle,
      },
    });
  }, [onBrandUpdate, sectionSubtitles]);

  const handleLayoutChange = useCallback((sectionId: SectionId) => (layout: LayoutPreset) => {
    if (canEdit) {
      // Admin: save to guide data (affects all viewers)
      onBrandUpdate?.({
        sectionLayouts: {
          ...adminLayouts,
          [sectionId]: layout,
        },
      });
    }
    // Always save as user preference (personal override)
    setPreference(brandPrefKey(sectionId), layout);
  }, [onBrandUpdate, adminLayouts, canEdit, setPreference, brandId]);

  // Memoize section content to prevent unnecessary re-renders
  // When canEdit is false, pass undefined for all change handlers to disable editing
  const renderSection = useCallback((sectionId: SectionId) => {
    const customSubtitle = sectionSubtitles[sectionId];
    const onSubtitleChange = canEdit ? handleSubtitleChange(sectionId) : undefined;
    const layout = getPreference<LayoutPreset | undefined>(brandPrefKey(sectionId)) || sectionLayouts[sectionId];
    // Allow ALL authenticated users to change layout (personal pref), not just admins
    const onLayoutChange = handleLayoutChange(sectionId);

    // Helper to conditionally create change handler
    const editHandler = <T,>(handler: (value: T) => void) => canEdit ? handler : undefined;

    switch (sectionId) {
      case 'hero': return <HeroSection hero={brand.hero} onHeroChange={editHandler((hero) => onBrandUpdate({ hero }))} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} fullWidth={heroFullWidth} onOpenIntelligence={onOpenIntelligence} guideData={brand as unknown as Record<string, unknown>} entityType={entityType} entityId={brandId} hiddenSections={hiddenSections} />;
      case 'tagline': return <TaglineSection tagline={brand.tagline} onTaglineChange={editHandler((tagline) => onBrandUpdate({ tagline }))} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} />;
      case 'identity': return <IdentitySection identity={brand.identity} onIdentityChange={editHandler((identity) => onBrandUpdate({ identity }))} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} />;
      case 'values': return <ValuesSection values={brand.values} onValuesChange={editHandler((values) => onBrandUpdate({ values }))} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} organizationId={organizationId} brandId={brandId} brandName={brand.hero.name} canEdit={canEdit} />;
      case 'bythenumbers': return <ByTheNumbersSection statistics={brand.statistics || []} onStatisticsChange={editHandler((statistics) => onBrandUpdate({ statistics }))} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} brandName={brand.hero.name} infographicLayout={brand.infographicLayout || 'infographic'} onLayoutChange={canEdit ? (infographicLayout: InfographicLayout) => onBrandUpdate({ infographicLayout }) : undefined} brandColors={brand.colors || []} />;
      case 'services': return <ServicesSection services={brand.services || []} onServicesChange={editHandler((services) => onBrandUpdate({ services }))} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} entityId={brandId} entityType={entityType as 'brand' | 'product' | 'event' || 'brand'} brandWebsites={brand.websites || []} brandName={brand.hero?.name} />;
      case 'revenue': return <RevenueChartSection revenueData={brand.revenueData} onRevenueDataChange={editHandler((revenueData) => onBrandUpdate({ revenueData }))} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} brandName={brand.hero.name} chartTheme={brand.chartTheme} onChartThemeChange={editHandler((chartTheme) => onBrandUpdate({ chartTheme }))} brandColors={brand.colors || []} />;
      case 'awards': return <AwardsSection awards={brand.awards || []} onUpdate={editHandler((awards) => onBrandUpdate({ awards }))} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} entityType={entityType} entityId={brandId} />;
      case 'webinars': return <WebinarSeriesSection webinars={brand.webinars || []} onWebinarsChange={editHandler((webinars) => onBrandUpdate({ webinars }))} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} entityName={brand.hero?.name} entityType="brand" industry={(brand as any).industry} websiteUrl={brand.websites?.[0]?.url} />;
      case 'logos': return <LogoSection logos={brand.logos} onLogosChange={editHandler((logos) => onBrandUpdate({ logos }))} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} logoDownloadLinks={brand.logoDownloadLinks} onLogoDownloadLinksChange={editHandler((logoDownloadLinks) => onBrandUpdate({ logoDownloadLinks }))} />;
      case 'brandicon': return <BrandIconsSection brandIcons={brand.brandIcons} onBrandIconsChange={editHandler((brandIcons) => onBrandUpdate({ brandIcons }))} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} />;
      case 'colors': return <ColorPaletteSection colors={brand.colors} onColorsChange={editHandler((colors) => onBrandUpdate({ colors }))} colorCombinations={brand.colorCombinations} onColorCombinationsChange={editHandler((colorCombinations) => onBrandUpdate({ colorCombinations }))} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} brandName={brand.hero.name} />;
      case 'gradients': return <GradientsSection gradients={brand.gradients} onGradientsChange={editHandler((gradients) => onBrandUpdate({ gradients }))} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} layout={layout} onLayoutChange={onLayoutChange} brandName={brand.hero.name} brandColors={brand.colors} />;
      case 'layouttemplates': {
        const explicitVisuals = (brand as any).brandVisuals;
        const derivedVisuals = resolveBrandVisuals(explicitVisuals, {
          brandSlug: brand.slug,
          hero: brand.hero,
          logos: brand.logos,
          imagery: brand.imagery,
          patterns: brand.patterns,
          gradients: brand.gradients,
          approvedImagery: (brand as any).approvedImagery,
        });
        const isDerived = !((explicitVisuals?.staticAssets?.length ?? 0) + (explicitVisuals?.motionAssets?.length ?? 0));
        return <LayoutTemplatesSection brandVisuals={derivedVisuals} brandLogos={brand.logos} isDerived={isDerived} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} />;
      }
      case 'patterns': return <PatternsSection patterns={brand.patterns} onPatternsChange={editHandler((patterns) => onBrandUpdate({ patterns }))} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} layout={layout} onLayoutChange={onLayoutChange} brandName={brand.hero.name} brandColors={brand.colors} brandTagline={brand.tagline?.primary} brandArchetype={brand.identity?.archetype} brandSlug={brand.slug} customShapes={brand.customShapes} onCustomShapesChange={canEdit ? (customShapes) => onBrandUpdate({ customShapes }) : undefined} />;
      case 'typography': return <TypographySection typography={brand.typography} onTypographyChange={editHandler((typography) => onBrandUpdate({ typography }))} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} />;
      case 'textstyles': return <TextStylesSection textStyles={brand.textStyles} onTextStylesChange={editHandler((textStyles) => onBrandUpdate({ textStyles }))} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} adminCustomStyle={brand.adminCustomStyle} onAdminCustomStyleChange={canEdit ? (adminCustomStyle) => onBrandUpdate({ adminCustomStyle }) : undefined} canEdit={canEdit} />;
      case 'iconography': return <IconographySection iconography={brand.iconography} onIconographyChange={editHandler((iconography) => onBrandUpdate({ iconography }))} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} defaultIconColor={brand.defaultIconColor} onDefaultIconColorChange={editHandler((defaultIconColor) => onBrandUpdate({ defaultIconColor }))} brandColors={brand.colors?.map(c => ({ hex: c.hex, name: c.name })) || []} organizationId={organizationId} brandId={brandId} entityType={entityType || 'brand'} entityName={brand.hero?.name} entitySlug={brand.slug} industry={brand.identity?.archetype} />;
      case 'socialicons': return <SocialIconsSection socialIcons={brand.socialIcons} onSocialIconsChange={editHandler((socialIcons) => onBrandUpdate({ socialIcons }))} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} />;
      case 'imagery': return <ImagerySection imagery={brand.imagery} onImageryChange={editHandler((imagery) => onBrandUpdate({ imagery }))} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} entityId={brandId} entityType={entityType as 'brand' | 'product' | 'event' || 'brand'} isAdmin={canEdit} brandSlug={brand.slug} brandVisuals={(brand as any).brandVisuals} />;
      case 'social': return <SocialSection social={brand.social} onSocialChange={editHandler((social) => onBrandUpdate({ social }))} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} entityId={brandId} entityType={entityType || 'brand'} organizationId={organizationId} entityName={brand.hero?.name} />;
      case 'socialassets': return <SocialAssetsSection socialAssets={brand.socialAssets || []} onSocialAssetsChange={editHandler((socialAssets) => onBrandUpdate({ socialAssets }))} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} layout={layout} onLayoutChange={onLayoutChange} entityId={brandId} entityType={entityType as 'brand' | 'product' | 'event' || 'brand'} brandLogos={brand.logos} />;
      case 'website': return <WebsiteSection websites={brand.websites} onWebsitesChange={editHandler((websites) => onBrandUpdate({ websites }))} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} entityType={entityType || 'brand'} entityId={brandId} />;
      case 'signatures': return <SignaturesSection signatures={brand.signatures} onSignaturesChange={editHandler((signatures) => onBrandUpdate({ signatures }))} emailBanners={brand.emailBanners || []} onEmailBannersChange={editHandler((emailBanners) => onBrandUpdate({ emailBanners }))} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} />;
      case 'qr': return <QRSection qr={brand.qr} onQRChange={editHandler((qr) => onBrandUpdate({ qr }))} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} entityType={entityType || 'brand'} entityId={brandId} logos={brand.logos} />;
      case 'videos': return <VideosSection videos={brand.videos} onVideosChange={editHandler((videos) => onBrandUpdate({ videos }))} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} entityName={brand.hero?.name} entityType={(entityType as 'brand' | 'product' | 'event') || 'brand'} industry={(brand as any).industry} websiteUrl={brand.websites?.[0]?.url} />;
      case 'assets': return <AssetsSection assets={brand.assets} onAssetsChange={editHandler((assets) => onBrandUpdate({ assets }))} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} entityId={brandId} entityType={entityType as 'brand' | 'product' | 'event' || 'brand'} studios={brand.studios || []} />;
      case 'imageassets': return <ImageAssetsSection imageAssets={brand.imageAssets || []} onImageAssetsChange={editHandler((imageAssets) => onBrandUpdate({ imageAssets }))} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} canEdit={canEdit} entityId={brandId} entityType="brand" />;
      case 'misuse': return <MisuseSection misuse={brand.misuse} onMisuseChange={editHandler((misuse) => onBrandUpdate({ misuse }))} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} />;
      case 'casestudies': return <CaseStudiesSection caseStudies={brand.caseStudies || []} onCaseStudiesChange={editHandler((caseStudies) => onBrandUpdate({ caseStudies }))} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} layout={layout} onLayoutChange={onLayoutChange} entityId={brandId} entityType={(entityType as 'brand' | 'product' | 'event') || 'brand'} brandLogos={brand.logos} />;
      case 'brochures': return <DigitalCollateralSection collateral={brand.brochures || []} onCollateralChange={editHandler((brochures) => onBrandUpdate({ brochures }))} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} layout={layout} onLayoutChange={onLayoutChange} entityId={brandId} entityType={entityType as 'brand' | 'product' | 'event' || 'brand'} brandVisuals={(brand as any).brandVisuals} layoutTemplateCustomizations={(brand as any).layoutTemplateCustomizations || []} brandLogos={brand.logos} />;
      case 'templates': 
        // Legacy templates section now uses PresentationTemplatesSection
        return <PresentationTemplatesSection 
          presentations={brand.presentationTemplates || []} 
          onUpdate={editHandler((presentationTemplates) => onBrandUpdate({ presentationTemplates }))} 
          isEditable={canEdit}
          entityId={brandId}
          entityType={entityType}
        />;
      case 'templatespecs': return <TemplateSpecsSection templateSpecs={brand.templateSpecs || []} onTemplateSpecsChange={editHandler((templateSpecs) => onBrandUpdate({ templateSpecs }))} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} brandColors={brand.colors || []} />;
      case 'products': 
        // Support products section for both brands and products
        return brand.type === 'brand' 
          ? <ProductsSection brandId={brandId} linkedGuides={brand.linkedGuides || []} onLinkedGuidesChange={editHandler((linkedGuides) => onBrandUpdate({ linkedGuides }))} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} layout={layout} onLayoutChange={onLayoutChange} />
          : <ProductsSection productId={brandId} linkedGuides={brand.linkedGuides || []} onLinkedGuidesChange={editHandler((linkedGuides) => onBrandUpdate({ linkedGuides }))} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} layout={layout} onLayoutChange={onLayoutChange} />;
      case 'events':
        // Events section only for brands
        return brand.type === 'brand' 
          ? <EventsSection brandId={brandId} customSubtitle={customSubtitle} onSubtitleChange={onSubtitleChange} layout={layout} onLayoutChange={onLayoutChange} canEdit={canEdit} />
          : null;
      case 'universe':
        if (brand.linkedGuides && brand.linkedGuides.length > 0) {
          return <GlobalLinkUniverseSection linkedGuides={brand.linkedGuides} primaryColor={brand.colors?.[0]?.hex} />;
        }
        return <BrandUniverseOrbit organizationId={organizationId} brandColors={brand.colors} organizationName={brand.hero?.name} />;
      case 'insights':
        return <InsightsSection 
          insights={brand.insights || []} 
          layout={brand.insightsLayout}
          onInsightsChange={editHandler((insights) => onBrandUpdate({ insights }))} 
          onLayoutChange={canEdit ? (insightsLayout) => onBrandUpdate({ insightsLayout }) : undefined}
          customSubtitle={customSubtitle} 
          onSubtitleChange={onSubtitleChange}
          entityType={entityType}
          entityId={brandId}
          websites={brand.websites}
          entityName={brand.hero?.name}
          industry={brand.identity?.archetype}
          organizationId={organizationId}
          brandContext={{ colors: brand.colors?.map?.((c: any) => c.hex) || [], archetype: brand.identity?.archetype, mission: brand.identity?.missionStatement, tagline: brand.hero?.tagline }}
          insightsAccessCode={brand.insightsAccessCode}
          onAccessCodeChange={canEdit ? (insightsAccessCode) => onBrandUpdate({ insightsAccessCode }) : undefined}
        />;
      case 'locations':
        return <Suspense fallback={<div className="h-64 flex items-center justify-center text-muted-foreground">Loading map...</div>}>
          <LeafletLocationsSection 
            locations={brand.locations || []} 
            locationStats={brand.locationStats || []}
            onLocationsChange={editHandler((locations: BrandLocation[]) => onBrandUpdate({ locations }))}
            onLocationStatsChange={editHandler((locationStats: LocationStat[]) => onBrandUpdate({ locationStats }))}
            customSubtitle={customSubtitle} 
            onSubtitleChange={onSubtitleChange}
            accentColor={brand.colors?.[0]?.hex}
            sectionTitle={brand.locationsSectionTitle}
            sectionDescription={brand.locationsSectionDescription}
            onSectionTitleChange={canEdit ? (locationsSectionTitle: string) => onBrandUpdate({ locationsSectionTitle }) : undefined}
            onSectionDescriptionChange={canEdit ? (locationsSectionDescription: string) => onBrandUpdate({ locationsSectionDescription }) : undefined}
            useSharedLocations={brand.useSharedLocations ?? false}
            onUseSharedLocationsChange={canEdit ? (useSharedLocations: boolean) => onBrandUpdate({ useSharedLocations }) : undefined}
            mapTheme={brand.mapTheme}
            onMapThemeChange={canEdit ? (mapTheme) => onBrandUpdate({ mapTheme }) : undefined}
          />
        </Suspense>;
      case 'eventsignage':
        return <BrandEventSignageSection 
          eventSignage={brand.eventSignage || []} 
          onEventSignageChange={editHandler((eventSignage) => onBrandUpdate({ eventSignage }))} 
          linkedBooths={brand.linkedBooths || []}
          onLinkedBoothsChange={editHandler((linkedBooths) => onBrandUpdate({ linkedBooths }))}
          customSubtitle={customSubtitle} 
          onSubtitleChange={onSubtitleChange}
          layout={layout}
          onLayoutChange={onLayoutChange}
          brandName={brand.hero.name}
          brandColors={brand.colors}
        />;
      case 'clientlogos':
        return <ClientLogosSection 
          clientLogos={brand.clientLogos || []} 
          onClientLogosChange={editHandler((clientLogos) => onBrandUpdate({ clientLogos }))} 
          customSubtitle={customSubtitle} 
          onSubtitleChange={onSubtitleChange}
        />;
      case 'presentations':
        return <PresentationTemplatesSection 
          presentations={brand.presentationTemplates || []} 
          onUpdate={editHandler((presentationTemplates) => onBrandUpdate({ presentationTemplates }))} 
          isEditable={canEdit}
          entityId={brandId}
          entityType={entityType}
        />;
      case 'sponsorlogos':
        return <SponsorLogosSection 
          sponsors={brand.sponsorLogos || []} 
          onSponsorsChange={editHandler((sponsorLogos) => onBrandUpdate({ sponsorLogos }))} 
          customSubtitle={customSubtitle} 
          onSubtitleChange={onSubtitleChange}
          isEditable={canEdit}
        />;
      case 'approvedimagery':
        return <ApprovedImagerySection
          approvedImagery={brand.approvedImagery}
          onApprovedImageryChange={editHandler((approvedImagery) => onBrandUpdate({ approvedImagery }))}
          customSubtitle={customSubtitle}
          onSubtitleChange={onSubtitleChange}
          canEdit={canEdit}
          entityId={brandId}
          entityType={entityType}
          organizationId={organizationId}
        />;
      case 'studios':
        return <StudiosSection
          studios={brand.studios || []}
          onStudiosChange={editHandler((studios) => onBrandUpdate({ studios }))}
          customSubtitle={customSubtitle}
          onSubtitleChange={onSubtitleChange}
          entityId={brandId}
        />;
      case 'brief':
      case 'socialmetrics':
        // These sections are either not yet implemented or excluded from rendering
        return null;
      default: return null;
    }
  }, [brand, brandId, onBrandUpdate, sectionSubtitles, sectionLayouts, handleSubtitleChange, handleLayoutChange, heroFullWidth, onOpenIntelligence, getPreference, setPreference]);

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
