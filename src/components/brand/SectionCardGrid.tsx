import { useMemo, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SectionId, BrandBackgroundType } from '@/types/brand';
import { sectionMeta as defaultSectionMeta } from './ReorderableBrandSidebar';
import { HeroBackground } from '@/components/HeroBackground';
import { HeroBackgroundType } from '@/contexts/AppSettingsContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Paintbrush, Sparkles, Waves, LayoutGrid, X, ArrowUpDown, Upload, Sun, Moon, BarChart3, Brain, Shield, ChevronRight } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useStorageUpload } from '@/hooks/useStorageUpload';

// Section descriptions for hover detail
const SECTION_DESCRIPTIONS: Record<string, string> = {
  colors: 'Define primary, secondary, and accent color palettes with accessibility contrast ratios.',
  typography: 'Set font families, weights, and hierarchy rules for consistent text styling.',
  logos: 'Upload and manage logo variants, clear space rules, and usage guidelines.',
  gradients: 'Create and manage gradient combinations derived from your brand palette.',
  patterns: 'Design repeatable visual patterns for backgrounds and textures.',
  identity: 'Core brand identity including mission, vision, values, and personality.',
  voice: 'Brand voice and tone guidelines for consistent communication.',
  imagery: 'Photography style, illustration guidelines, and image treatment rules.',
  iconography: 'Icon style, grid system, and usage standards.',
  website: 'Web presence guidelines, UI component standards, and digital patterns.',
  products: 'Product-specific brand applications and sub-brand management.',
  templates: 'Downloadable templates for presentations, documents, and assets.',
  collateral: 'Print and digital collateral specifications and examples.',
  brochures: 'Brochure designs, layouts, and brand-compliant templates.',
  casestudies: 'Case study formats and success story presentation guidelines.',
  socialassets: 'Social media templates, sizing guides, and platform-specific rules.',
  signatures: 'Email signature templates and business card standards.',
  qrcodes: 'Branded QR code styles and placement guidelines.',
  antipatterns: 'Common brand misuse examples and what to avoid.',
  symbolstandards: 'Symbol usage rules, minimum sizes, and placement standards.',
  geometricprimitives: 'Core geometric shapes and construction principles.',
  events: 'Event branding standards and experiential guidelines.',
  statistics: 'Key brand metrics, research data, and performance benchmarks.',
  platformmarketer: 'Platform-specific marketing guidelines and ad templates.',
  digitalcollateral: 'Digital asset library for online brand materials.',
};

// Capabilities per section for expanded view
const SECTION_CAPABILITIES: Record<string, string[]> = {
  colors: ['Palette management', 'Contrast checker', 'Tint generator'],
  typography: ['Font pairing', 'Scale system', 'Web fonts'],
  logos: ['Multi-format export', 'Clear space', 'Usage rules'],
  gradients: ['Gradient builder', 'CSS export', 'Palette-derived'],
  patterns: ['Tile patterns', 'Textures', 'Scalable SVGs'],
  identity: ['Mission & vision', 'Values', 'Personality'],
  voice: ['Tone spectrum', 'Writing guides', 'Examples'],
  imagery: ['Photo direction', 'Illustration', 'Treatments'],
  iconography: ['Icon grid', 'Style presets', 'Generator'],
  website: ['Components', 'SEO audit', 'Performance'],
  products: ['Sub-brands', 'Product lines', 'Packaging'],
  templates: ['Presentations', 'Documents', 'Social'],
  collateral: ['Print specs', 'Digital assets', 'Mockups'],
  brochures: ['Layouts', 'Content blocks', 'Print-ready'],
  casestudies: ['Story format', 'Metrics', 'Templates'],
  socialassets: ['Platform sizing', 'Calendar', 'Templates'],
  signatures: ['Email templates', 'Cards', 'HTML export'],
  qrcodes: ['Branded codes', 'Dynamic links', 'Analytics'],
  antipatterns: ['Misuse gallery', 'Corrections', 'Approvals'],
  symbolstandards: ['Min sizes', 'Placement', 'Color rules'],
  geometricprimitives: ['Shape library', 'Construction', 'Proportions'],
  events: ['Event branding', 'Signage', 'Swag guidelines'],
  statistics: ['Brand metrics', 'Research', 'Benchmarks'],
  platformmarketer: ['Ad templates', 'Platform rules', 'Targeting'],
  digitalcollateral: ['Asset library', 'Files', 'Sharing'],
};

interface SectionCardGridProps {
  sectionOrder: string[];
  hiddenSections?: string[];
  activeSection: string;
  onSectionSelect: (sectionId: string) => void;
  isAdmin?: boolean;
  cardViewBackground?: BrandBackgroundType;
  cardViewBackgroundTint?: string;
  onCardViewBackgroundChange?: (bg: BrandBackgroundType, tint?: string) => void;
  entityLightLogoUrl?: string;
  entityDarkLogoUrl?: string;
  onEntityLogoChange?: (variant: 'light' | 'dark', url: string) => void;
  entityName?: string;
  entityTagline?: string;
  healthScore?: number;
  complianceScore?: number;
  onOpenIntelligence?: () => void;
  entityType?: 'brand' | 'product' | 'event';
  entityId?: string;
  customSectionMeta?: Record<string, { label: string; icon: React.ElementType; category: string }>;
}

const EXCLUDED_FROM_NAV: string[] = ['socialmetrics', 'hero'];

// Each card gets a unique tint color based on index
const CARD_TINTS = [
  { bg: 'hsl(210 80% 55%)',  tint: 'hsl(210 80% 55% / 0.08)' },
  { bg: 'hsl(280 70% 55%)',  tint: 'hsl(280 70% 55% / 0.08)' },
  { bg: 'hsl(340 75% 55%)',  tint: 'hsl(340 75% 55% / 0.08)' },
  { bg: 'hsl(160 60% 45%)',  tint: 'hsl(160 60% 45% / 0.08)' },
  { bg: 'hsl(35 90% 55%)',   tint: 'hsl(35 90% 55% / 0.08)' },
  { bg: 'hsl(190 75% 50%)',  tint: 'hsl(190 75% 50% / 0.08)' },
  { bg: 'hsl(250 65% 60%)',  tint: 'hsl(250 65% 60% / 0.08)' },
  { bg: 'hsl(15 80% 55%)',   tint: 'hsl(15 80% 55% / 0.08)' },
  { bg: 'hsl(320 70% 55%)',  tint: 'hsl(320 70% 55% / 0.08)' },
  { bg: 'hsl(145 55% 48%)',  tint: 'hsl(145 55% 48% / 0.08)' },
  { bg: 'hsl(200 85% 50%)',  tint: 'hsl(200 85% 50% / 0.08)' },
  { bg: 'hsl(45 95% 55%)',   tint: 'hsl(45 95% 55% / 0.08)' },
];

const CARD_BG_OPTIONS: { type: BrandBackgroundType; label: string; icon: typeof Sparkles }[] = [
  { type: 'inherit', label: 'None', icon: X },
  { type: 'animated-gradient', label: 'Animated', icon: Sparkles },
  { type: 'animated-particles', label: 'Particles', icon: Sparkles },
  { type: 'animated-waves', label: 'Waves', icon: Waves },
  { type: 'animated-mesh', label: 'Mesh', icon: LayoutGrid },
  { type: 'animated-aurora', label: 'Aurora', icon: Waves },
  { type: 'animated-geometric', label: 'Geometric', icon: LayoutGrid },
  { type: 'animated-spotlight', label: 'Spotlight', icon: Sparkles },
  { type: 'animated-mesh-waves', label: 'Mesh Lines', icon: LayoutGrid },
  { type: 'animated-dataflow', label: 'Data Flow', icon: Waves },
  { type: 'animated-wave-lines', label: 'Wave Lines', icon: Waves },
  { type: 'animated-flow-field', label: 'Flow Field', icon: Waves },
  { type: 'animated-neon-grid', label: 'Neon Grid', icon: LayoutGrid },
  { type: 'animated-sine-lines', label: 'Sine Lines', icon: Waves },
  { type: 'animated-data-particles', label: 'Data Particles', icon: Sparkles },
];

const TINT_PRESETS = [
  { label: 'Default', value: '' },
  { label: 'Blue', value: '#3b82f6' },
  { label: 'Purple', value: '#8b5cf6' },
  { label: 'Rose', value: '#f43f5e' },
  { label: 'Emerald', value: '#10b981' },
  { label: 'Amber', value: '#f59e0b' },
  { label: 'Cyan', value: '#06b6d4' },
];

type SortMode = 'default' | 'category' | 'alphabetical' | 'identity-first' | 'visual-first' | 'assets-first';

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: 'default', label: 'Custom Order' },
  { value: 'category', label: 'By Category' },
  { value: 'alphabetical', label: 'A–Z' },
  { value: 'identity-first', label: 'Identity First' },
  { value: 'visual-first', label: 'Visual First' },
  { value: 'assets-first', label: 'Assets First' },
];

const CATEGORY_ORDER = ['Identity', 'Visual', 'Typography', 'Assets', 'Communication', 'Resources', 'Collateral'];

const sortSections = (sections: string[], mode: SortMode, meta: Record<string, { label: string; icon: React.ElementType; category: string }>): string[] => {
  if (mode === 'default') return sections;
  
  const sorted = [...sections];
  
  switch (mode) {
    case 'alphabetical':
      return sorted.sort((a, b) => {
        const labelA = meta[a]?.label || '';
        const labelB = meta[b]?.label || '';
        return labelA.localeCompare(labelB);
      });
    case 'category':
      return sorted.sort((a, b) => {
        const catA = CATEGORY_ORDER.indexOf(meta[a]?.category || '');
        const catB = CATEGORY_ORDER.indexOf(meta[b]?.category || '');
        if (catA !== catB) return catA - catB;
        return (meta[a]?.label || '').localeCompare(meta[b]?.label || '');
      });
    case 'identity-first':
    case 'visual-first':
    case 'assets-first': {
      const priorityCat = mode === 'identity-first' ? 'Identity' : mode === 'visual-first' ? 'Visual' : 'Assets';
      return sorted.sort((a, b) => {
        const aIsPriority = meta[a]?.category === priorityCat;
        const bIsPriority = meta[b]?.category === priorityCat;
        if (aIsPriority && !bIsPriority) return -1;
        if (!aIsPriority && bIsPriority) return 1;
        return 0;
      });
    }
    default:
      return sorted;
  }
};

// Extracted card grid with expanding hover cards
function CardGrid({
  sections,
  sectionMeta,
  activeSection,
  hiddenSections,
  isAdmin,
  onSectionSelect,
}: {
  sections: string[];
  sectionMeta: Record<string, { label: string; icon: React.ElementType; category: string }>;
  activeSection: string;
  hiddenSections: string[];
  isAdmin: boolean;
  onSectionSelect: (id: string) => void;
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = useCallback((id: string) => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    hoverTimeout.current = setTimeout(() => setHoveredId(id), 150);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    setHoveredId(null);
  }, []);

  return (
    <motion.div
      className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-1.5 sm:gap-2"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.02 } },
      }}
      style={{ alignItems: 'start' }}
    >
      {sections.map((sectionId, index) => {
        const meta = sectionMeta[sectionId];
        if (!meta) return null;
        const Icon = meta.icon;
        const isActive = activeSection === sectionId;
        const isHidden = hiddenSections.includes(sectionId);
        const tint = CARD_TINTS[index % CARD_TINTS.length];
        const isHovered = hoveredId === sectionId;
        const isShrunk = hoveredId !== null && hoveredId !== sectionId;
        const description = SECTION_DESCRIPTIONS[sectionId] || `Manage ${meta.label.toLowerCase()} settings and guidelines.`;
        const capabilities = SECTION_CAPABILITIES[sectionId] || ['Configure', 'Manage', 'Export'];

        return (
          <motion.button
            key={sectionId}
            onClick={() => onSectionSelect(sectionId)}
            onMouseEnter={() => handleMouseEnter(sectionId)}
            onMouseLeave={handleMouseLeave}
            variants={{
              hidden: { opacity: 0, y: 12, scale: 0.9 },
              visible: { opacity: 1, y: 0, scale: 1 },
            }}
            animate={
              isHovered
                ? { scale: 1, y: 0 }
                : isShrunk
                  ? { scale: 0.88, y: 0, opacity: 0.6 }
                  : { scale: 1, y: 0, opacity: 1 }
            }
            whileTap={{ scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className={cn(
              'section-card-shimmer group relative flex flex-col items-center justify-center rounded-xl',
              'transition-all duration-300 origin-center overflow-hidden',
              isHovered ? 'col-span-3 row-span-2 z-30 p-3 gap-2' : 'col-span-1 p-2 gap-1 aspect-square',
              isActive
                ? 'text-white ring-1'
                : 'bg-card/80 backdrop-blur-sm text-card-foreground',
              isHidden && isAdmin && 'opacity-40 grayscale',
              isShrunk && 'filter brightness-75'
            )}
            style={{
              '--shimmer-color': tint.bg,
              backgroundColor: isActive ? undefined : tint.tint,
              ...(isActive ? {
                background: `linear-gradient(135deg, ${tint.bg}, ${tint.bg.replace(')', ' / 0.7)')})`,
                boxShadow: `0 0 20px ${tint.bg.replace(')', ' / 0.4)')}, 0 0 40px ${tint.bg.replace(')', ' / 0.15)')}`,
                ringColor: tint.bg.replace(')', ' / 0.6)'),
              } : isHovered ? {
                boxShadow: `0 4px 30px ${tint.bg.replace(')', ' / 0.25)')}, 0 0 60px ${tint.bg.replace(')', ' / 0.1)')}`,
                border: `1px solid ${tint.bg.replace(')', ' / 0.3)')}`,
              } : {}),
            } as any}
          >
            {/* Hover glow background */}
            {isHovered && (
              <motion.div
                className="absolute inset-0 rounded-xl pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  background: `radial-gradient(ellipse at center, ${tint.bg.replace(')', ' / 0.12)')}, transparent 70%)`,
                }}
              />
            )}

            {/* Active prismatic overlay */}
            {isActive && (
              <>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-transparent via-white/10 to-white/20 pointer-events-none" />
                <motion.div
                  className="absolute inset-0 rounded-xl pointer-events-none"
                  style={{
                    background: 'conic-gradient(from 0deg, transparent 0%, rgba(255,255,255,0.15) 25%, transparent 50%, rgba(255,255,255,0.1) 75%, transparent 100%)',
                  }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                />
              </>
            )}

            {/* Icon — larger when expanded */}
            <motion.div
              animate={isHovered ? { scale: 1.3 } : { scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className="relative z-10"
            >
              <Icon className={cn(
                'h-5 w-5 sm:h-6 sm:w-6 transition-all duration-300',
                isHovered && 'h-7 w-7 sm:h-8 sm:w-8',
                isActive && 'drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]'
              )} />
            </motion.div>

            {/* Label */}
            <span className={cn(
              'relative z-10 leading-tight text-center font-normal tracking-wide',
              isHovered ? 'text-xs font-semibold' : 'text-[9px] sm:text-[10px] line-clamp-2',
              isActive ? 'text-white' : 'text-foreground/70 group-hover:text-foreground'
            )}>
              {meta.label}
            </span>

            {/* Expanded detail content */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  className="relative z-10 w-full space-y-1.5 overflow-hidden"
                >
                  {/* Category badge */}
                  <div className="flex justify-center">
                    <span
                      className="text-[9px] font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: tint.bg.replace(')', ' / 0.15)'),
                        color: tint.bg,
                      }}
                    >
                      {meta.category}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-[10px] leading-relaxed text-muted-foreground text-center line-clamp-2 px-1">
                    {description}
                  </p>

                  {/* Capabilities */}
                  <div className="flex flex-wrap gap-1 justify-center pt-0.5">
                    {capabilities.map((cap, i) => (
                      <motion.span
                        key={cap}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.04, type: 'spring', stiffness: 500 }}
                        className="text-[8px] px-1.5 py-0.5 rounded-md bg-muted/50 text-muted-foreground border border-border/40"
                      >
                        {cap}
                      </motion.span>
                    ))}
                  </div>

                  {/* Action hint */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.15 }}
                    className="flex items-center justify-center gap-1 text-[9px] font-medium pt-1"
                    style={{ color: tint.bg }}
                  >
                    <ChevronRight className="h-2.5 w-2.5" />
                    <span>Open section</span>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Animated bottom accent bar */}
            {isActive && (
              <motion.div
                layoutId="section-card-indicator"
                className="absolute bottom-0.5 left-2 right-2 h-[2px] rounded-full"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent)',
                }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </motion.button>
        );
      })}
    </motion.div>
  );
}

export const SectionCardGrid = ({
  sectionOrder,
  hiddenSections = [],
  activeSection,
  onSectionSelect,
  isAdmin = false,
  cardViewBackground = 'inherit',
  cardViewBackgroundTint,
  onCardViewBackgroundChange,
  entityLightLogoUrl,
  entityDarkLogoUrl,
  onEntityLogoChange,
  entityName,
  entityTagline,
  healthScore,
  complianceScore,
  onOpenIntelligence,
  entityType = 'brand',
  entityId,
  customSectionMeta,
}: SectionCardGridProps) => {
  const sectionMeta = customSectionMeta || defaultSectionMeta;
  const [bgPickerOpen, setBgPickerOpen] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>('default');
  const [logoPickerOpen, setLogoPickerOpen] = useState(false);
  const lightLogoInputRef = useRef<HTMLInputElement>(null);
  const darkLogoInputRef = useRef<HTMLInputElement>(null);
  const { resolvedTheme } = useTheme();
  const { uploadFile } = useStorageUpload({ entityType, entityId });

  const sections = useMemo(() => {
    const base = sectionOrder.filter(
      (id) => sectionMeta[id] && !EXCLUDED_FROM_NAV.includes(id)
    );
    const visible = isAdmin ? base : base.filter((id) => !hiddenSections.includes(id));
    return sortSections(visible, sortMode, sectionMeta);
  }, [sectionOrder, hiddenSections, isAdmin, sortMode, sectionMeta]);

  const hasBackground = cardViewBackground && cardViewBackground !== 'inherit';

  const getHeroBgType = (): HeroBackgroundType | undefined => {
    if (!hasBackground) return undefined;
    return cardViewBackground as HeroBackgroundType;
  };

  const handleLogoUpload = (variant: 'light' | 'dark') => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onEntityLogoChange) return;
    const result = await uploadFile(file, 'logo', `card-view-${variant}-logo`);
    if (result?.url) {
      onEntityLogoChange(variant, result.url);
    }
  };

  const activeLogoUrl = resolvedTheme === 'dark' ? (entityDarkLogoUrl || entityLightLogoUrl) : (entityLightLogoUrl || entityDarkLogoUrl);

  return (
    <div className="w-full mb-8 relative">
      {/* Card View Background */}
      {hasBackground && (
        <div className="absolute inset-0 -inset-x-4 -top-4 -bottom-2 rounded-2xl overflow-hidden pointer-events-none z-0">
          <HeroBackground
            type={getHeroBgType()}
            animationSpeed="medium"
            tintColor={cardViewBackgroundTint || undefined}
          />
          <div className="absolute inset-0 bg-background/30 backdrop-blur-[1px]" />
        </div>
      )}

      <div className="relative z-10">
        {/* Identity header: logo stacked above name, stats on right */}
        <div className="flex items-start justify-between gap-4 mb-3">
          {/* Left: logo above name+tagline */}
          <div className="flex flex-col gap-2 min-w-0">
            {/* Logo */}
            <Popover open={isAdmin && onEntityLogoChange ? logoPickerOpen : false} onOpenChange={setLogoPickerOpen}>
              <PopoverTrigger asChild>
                <button className="relative group cursor-pointer shrink-0 self-start" title={isAdmin ? 'Click to update logo' : undefined}>
                  {activeLogoUrl ? (
                    <img
                      src={activeLogoUrl}
                      alt="Entity logo"
                      className="h-[77px] w-auto max-w-[240px] object-contain"
                    />
                  ) : isAdmin ? (
                    <div className="h-12 px-4 rounded-lg bg-muted/50 border border-dashed border-border/50 flex items-center gap-2">
                      <Upload className="h-4 w-4 text-muted-foreground/50" />
                      <span className="text-xs text-muted-foreground/50">Add Logo</span>
                    </div>
                  ) : null}
                  {isAdmin && onEntityLogoChange && activeLogoUrl && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                      <Upload className="h-5 w-5 text-foreground" />
                    </div>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-64 p-3">
                <p className="text-xs font-medium text-foreground mb-3">Update Logo</p>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <Sun className="h-3.5 w-3.5" />
                      <span>Light Mode Logo</span>
                    </div>
                    <button
                      onClick={() => lightLogoInputRef.current?.click()}
                      className="w-full flex items-center gap-2 p-2 rounded-lg border border-border/50 bg-card/60 hover:bg-card/80 transition-all"
                    >
                      {entityLightLogoUrl ? (
                        <img src={entityLightLogoUrl} alt="Light logo" className="h-8 w-auto max-w-[100px] object-contain" />
                      ) : (
                        <div className="h-8 w-8 rounded bg-muted/50 flex items-center justify-center">
                          <Upload className="h-3.5 w-3.5 text-muted-foreground/50" />
                        </div>
                      )}
                      <span className="text-[10px] text-muted-foreground">{entityLightLogoUrl ? 'Replace' : 'Upload'}</span>
                    </button>
                    <input ref={lightLogoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload('light')} />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <Moon className="h-3.5 w-3.5" />
                      <span>Dark Mode Logo</span>
                    </div>
                    <button
                      onClick={() => darkLogoInputRef.current?.click()}
                      className="w-full flex items-center gap-2 p-2 rounded-lg border border-border/50 bg-card/60 hover:bg-card/80 transition-all"
                    >
                      {entityDarkLogoUrl ? (
                        <img src={entityDarkLogoUrl} alt="Dark logo" className="h-8 w-auto max-w-[100px] object-contain" />
                      ) : (
                        <div className="h-8 w-8 rounded bg-muted/50 flex items-center justify-center">
                          <Upload className="h-3.5 w-3.5 text-muted-foreground/50" />
                        </div>
                      )}
                      <span className="text-[10px] text-muted-foreground">{entityDarkLogoUrl ? 'Replace' : 'Upload'}</span>
                    </button>
                    <input ref={darkLogoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload('dark')} />
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Name + Tagline below logo */}
            {entityName && (
              <h2 className="text-lg font-semibold text-foreground tracking-tight truncate">{entityName}</h2>
            )}
            {entityTagline && (
              <p className="text-sm text-muted-foreground line-clamp-1 -mt-1">{entityTagline}</p>
            )}
          </div>

          {/* Right: Stats pills */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end pt-1">
            {healthScore !== undefined && (
              <div className={cn(
                "flex items-center gap-1.5 bg-card/60 backdrop-blur-sm rounded-full px-3 py-1.5 border border-border/50",
                healthScore >= 80 ? 'text-emerald-500' : healthScore >= 60 ? 'text-amber-500' : 'text-destructive'
              )}>
                <BarChart3 className="h-3.5 w-3.5" />
                <span className="text-xs text-muted-foreground">Health</span>
                <span className="text-xs font-bold">{healthScore}%</span>
              </div>
            )}
            {complianceScore !== undefined && (
              <div className="flex items-center gap-1.5 bg-card/60 backdrop-blur-sm rounded-full px-3 py-1.5 border border-border/50">
                <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-bold text-foreground">{complianceScore}%</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 bg-card/60 backdrop-blur-sm rounded-full px-3 py-1.5 border border-border/50">
              <Sparkles className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">Active</span>
            </div>
            {onOpenIntelligence && (
              <button
                type="button"
                onClick={onOpenIntelligence}
                className="flex items-center gap-1 bg-card/60 backdrop-blur-sm rounded-full px-3 py-1.5 border border-border/50 hover:bg-card/80 transition-colors text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <Brain className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Toolbar row: sort + background */}
        <div className="flex items-center justify-between mb-2 gap-2">
          {/* Sort */}
          <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-all',
                  'bg-card/60 backdrop-blur-sm border border-border/50 text-muted-foreground hover:text-foreground hover:bg-card/80',
                  sortMode !== 'default' && 'ring-1 ring-accent/40 text-accent'
                )}
              >
                <ArrowUpDown className="h-3.5 w-3.5" />
                <span>{SORT_OPTIONS.find(o => o.value === sortMode)?.label || 'Sort'}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-44 p-2">
              <div className="space-y-0.5">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSortMode(opt.value)}
                    className={cn(
                      'w-full text-left px-2.5 py-1.5 rounded-md text-xs transition-all',
                      sortMode === opt.value
                        ? 'bg-accent/10 text-accent font-medium'
                        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          </div>


          {isAdmin && onCardViewBackgroundChange && (
            <Popover open={bgPickerOpen} onOpenChange={setBgPickerOpen}>
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-all',
                    'bg-card/60 backdrop-blur-sm border border-border/50 text-muted-foreground hover:text-foreground hover:bg-card/80',
                    hasBackground && 'ring-1 ring-accent/40 text-accent'
                  )}
                >
                  <Paintbrush className="h-3.5 w-3.5" />
                  <span>Background</span>
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72 p-3">
                <div className="space-y-3">
                  <p className="text-xs font-medium text-foreground">Card View Background</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {CARD_BG_OPTIONS.map((opt) => {
                      const Icon = opt.icon;
                      const isSelected = cardViewBackground === opt.type;
                      return (
                        <button
                          key={opt.type}
                          onClick={() => {
                            onCardViewBackgroundChange(opt.type, cardViewBackgroundTint);
                            if (opt.type === 'inherit') setBgPickerOpen(false);
                          }}
                          className={cn(
                            'flex flex-col items-center gap-1 p-2 rounded-lg text-[10px] leading-tight transition-all border',
                            isSelected
                              ? 'border-accent bg-accent/10 text-accent'
                              : 'border-transparent hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Tint color presets */}
                  {hasBackground && (
                    <div className="space-y-1.5 pt-2 border-t border-border/50">
                      <p className="text-[10px] text-muted-foreground">Tint Color</p>
                      <div className="flex gap-1.5 flex-wrap">
                        {TINT_PRESETS.map((preset) => (
                          <button
                            key={preset.label}
                            onClick={() => onCardViewBackgroundChange(cardViewBackground, preset.value)}
                            className={cn(
                              'h-6 w-6 rounded-full border-2 transition-all',
                              cardViewBackgroundTint === preset.value
                                ? 'border-accent scale-110'
                                : 'border-border/50 hover:border-foreground/30'
                            )}
                            style={{
                              backgroundColor: preset.value || 'hsl(var(--primary))',
                            }}
                            title={preset.label}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>

        <CardGrid
          sections={sections}
          sectionMeta={sectionMeta}
          activeSection={activeSection}
          hiddenSections={hiddenSections}
          isAdmin={isAdmin}
          onSectionSelect={onSectionSelect}
        />
      </div>
    </div>
  );
};
