import { useMemo, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SectionId, BrandBackgroundType } from '@/types/brand';
import { sectionMeta } from './ReorderableBrandSidebar';
import { HeroBackground } from '@/components/HeroBackground';
import { HeroBackgroundType } from '@/contexts/AppSettingsContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Paintbrush, Sparkles, Waves, LayoutGrid, X, ArrowUpDown, Upload } from 'lucide-react';

interface SectionCardGridProps {
  sectionOrder: SectionId[];
  hiddenSections?: SectionId[];
  activeSection: SectionId;
  onSectionSelect: (sectionId: SectionId) => void;
  isAdmin?: boolean;
  cardViewBackground?: BrandBackgroundType;
  cardViewBackgroundTint?: string;
  onCardViewBackgroundChange?: (bg: BrandBackgroundType, tint?: string) => void;
  entityLogoUrl?: string;
  onEntityLogoChange?: (url: string) => void;
}

const EXCLUDED_FROM_NAV: SectionId[] = ['socialmetrics'];

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

const sortSections = (sections: SectionId[], mode: SortMode): SectionId[] => {
  if (mode === 'default') return sections;
  
  const sorted = [...sections];
  
  switch (mode) {
    case 'alphabetical':
      return sorted.sort((a, b) => {
        const labelA = sectionMeta[a]?.label || '';
        const labelB = sectionMeta[b]?.label || '';
        return labelA.localeCompare(labelB);
      });
    case 'category':
      return sorted.sort((a, b) => {
        const catA = CATEGORY_ORDER.indexOf(sectionMeta[a]?.category || '');
        const catB = CATEGORY_ORDER.indexOf(sectionMeta[b]?.category || '');
        if (catA !== catB) return catA - catB;
        return (sectionMeta[a]?.label || '').localeCompare(sectionMeta[b]?.label || '');
      });
    case 'identity-first':
    case 'visual-first':
    case 'assets-first': {
      const priorityCat = mode === 'identity-first' ? 'Identity' : mode === 'visual-first' ? 'Visual' : 'Assets';
      return sorted.sort((a, b) => {
        const aIsPriority = sectionMeta[a]?.category === priorityCat;
        const bIsPriority = sectionMeta[b]?.category === priorityCat;
        if (aIsPriority && !bIsPriority) return -1;
        if (!aIsPriority && bIsPriority) return 1;
        return 0;
      });
    }
    default:
      return sorted;
  }
};

export const SectionCardGrid = ({
  sectionOrder,
  hiddenSections = [],
  activeSection,
  onSectionSelect,
  isAdmin = false,
  cardViewBackground = 'inherit',
  cardViewBackgroundTint,
  onCardViewBackgroundChange,
  entityLogoUrl,
  onEntityLogoChange,
}: SectionCardGridProps) => {
  const [bgPickerOpen, setBgPickerOpen] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>('default');
  const logoInputRef = useRef<HTMLInputElement>(null);

  const sections = useMemo(() => {
    const base = sectionOrder.filter(
      (id) => sectionMeta[id] && !EXCLUDED_FROM_NAV.includes(id)
    );
    const visible = isAdmin ? base : base.filter((id) => !hiddenSections.includes(id));
    return sortSections(visible, sortMode);
  }, [sectionOrder, hiddenSections, isAdmin, sortMode]);

  const hasBackground = cardViewBackground && cardViewBackground !== 'inherit';

  const getHeroBgType = (): HeroBackgroundType | undefined => {
    if (!hasBackground) return undefined;
    return cardViewBackground as HeroBackgroundType;
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onEntityLogoChange) return;
    const url = URL.createObjectURL(file);
    onEntityLogoChange(url);
  };

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
        {/* Entity Logo above toolbar */}
        <div className="flex items-center gap-3 mb-3">
          <div className="relative group">
            {entityLogoUrl ? (
              <img
                src={entityLogoUrl}
                alt="Entity logo"
                className="h-12 w-auto max-w-[160px] object-contain"
              />
            ) : (
              <div className="h-12 w-12 rounded-lg bg-muted/50 border border-border/50 flex items-center justify-center">
                <Upload className="h-5 w-5 text-muted-foreground/50" />
              </div>
            )}
            {isAdmin && onEntityLogoChange && (
              <>
                <button
                  onClick={() => logoInputRef.current?.click()}
                  className="absolute inset-0 flex items-center justify-center bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg cursor-pointer"
                  title="Update logo"
                >
                  <Upload className="h-4 w-4 text-foreground" />
                </button>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
              </>
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

        <motion.div 
          className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-1.5 sm:gap-2"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.02 } },
          }}
        >
          {sections.map((sectionId, index) => {
            const meta = sectionMeta[sectionId];
            if (!meta) return null;
            const Icon = meta.icon;
            const isActive = activeSection === sectionId;
            const isHidden = hiddenSections.includes(sectionId);
            const tint = CARD_TINTS[index % CARD_TINTS.length];

            return (
              <motion.button
                key={sectionId}
                onClick={() => onSectionSelect(sectionId)}
                title={meta.label}
                variants={{
                  hidden: { opacity: 0, y: 12, scale: 0.9 },
                  visible: { opacity: 1, y: 0, scale: 1 },
                }}
                whileHover={{ scale: 1.08, y: -2 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className={cn(
                  'section-card-shimmer group relative flex flex-col items-center justify-center gap-1 p-2 rounded-xl aspect-square',
                  'transition-all duration-300',
                  isActive
                    ? 'text-white ring-1'
                    : 'bg-card/80 backdrop-blur-sm text-card-foreground',
                  isHidden && isAdmin && 'opacity-40 grayscale'
                )}
                style={{
                  '--shimmer-color': tint.bg,
                  backgroundColor: isActive ? undefined : tint.tint,
                  ...(isActive ? {
                    background: `linear-gradient(135deg, ${tint.bg}, ${tint.bg.replace(')', ' / 0.7)')})`,
                    boxShadow: `0 0 20px ${tint.bg.replace(')', ' / 0.4)')}, 0 0 40px ${tint.bg.replace(')', ' / 0.15)')}`,
                    ringColor: tint.bg.replace(')', ' / 0.6)'),
                  } : {}),
                } as React.CSSProperties}
              >
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

                <Icon className={cn(
                  'relative z-10 h-5 w-5 sm:h-6 sm:w-6 transition-all duration-300',
                  isActive && 'drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]'
                )} />
                <span className={cn(
                  'relative z-10 text-[9px] sm:text-[10px] leading-tight text-center line-clamp-2 font-normal tracking-wide',
                  isActive ? 'text-white' : 'text-foreground/70 group-hover:text-foreground'
                )}>
                  {meta.label}
                </span>

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
      </div>
    </div>
  );
};
