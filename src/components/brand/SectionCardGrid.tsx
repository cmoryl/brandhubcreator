import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SectionId, BrandBackgroundType } from '@/types/brand';
import { sectionMeta } from './ReorderableBrandSidebar';
import { HeroBackground } from '@/components/HeroBackground';
import { HeroBackgroundType } from '@/contexts/AppSettingsContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Paintbrush, Sparkles, Waves, LayoutGrid, Image, Palette, X } from 'lucide-react';

interface SectionCardGridProps {
  sectionOrder: SectionId[];
  hiddenSections?: SectionId[];
  activeSection: SectionId;
  onSectionSelect: (sectionId: SectionId) => void;
  isAdmin?: boolean;
  cardViewBackground?: BrandBackgroundType;
  cardViewBackgroundTint?: string;
  onCardViewBackgroundChange?: (bg: BrandBackgroundType, tint?: string) => void;
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

export const SectionCardGrid = ({
  sectionOrder,
  hiddenSections = [],
  activeSection,
  onSectionSelect,
  isAdmin = false,
  cardViewBackground = 'inherit',
  cardViewBackgroundTint,
  onCardViewBackgroundChange,
}: SectionCardGridProps) => {
  const [bgPickerOpen, setBgPickerOpen] = useState(false);

  const sections = useMemo(() => {
    const base = sectionOrder.filter(
      (id) => sectionMeta[id] && !EXCLUDED_FROM_NAV.includes(id)
    );
    if (isAdmin) return base;
    return base.filter((id) => !hiddenSections.includes(id));
  }, [sectionOrder, hiddenSections, isAdmin]);

  const hasBackground = cardViewBackground && cardViewBackground !== 'inherit';

  const getHeroBgType = (): HeroBackgroundType | undefined => {
    if (!hasBackground) return undefined;
    return cardViewBackground as HeroBackgroundType;
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
        {/* Background picker button - admin only */}
        {isAdmin && onCardViewBackgroundChange && (
          <div className="flex justify-end mb-2">
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
          </div>
        )}

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
                    ? 'text-accent-foreground shadow-[0_0_20px_hsl(var(--accent)/0.4),0_0_40px_hsl(var(--accent)/0.15)] ring-1 ring-accent/60'
                    : 'bg-card/80 backdrop-blur-sm text-card-foreground',
                  isHidden && isAdmin && 'opacity-40 grayscale'
                )}
                style={{
                  '--shimmer-color': tint.bg,
                  backgroundColor: isActive ? undefined : tint.tint,
                  ...(isActive ? {
                    background: `linear-gradient(135deg, hsl(var(--accent) / 0.9), hsl(var(--accent) / 0.65))`,
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
                        background: 'conic-gradient(from 0deg, transparent 0%, hsl(var(--accent-foreground) / 0.15) 25%, transparent 50%, hsl(var(--accent-foreground) / 0.1) 75%, transparent 100%)',
                      }}
                      animate={{ rotate: 360 }}
                      transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                    />
                  </>
                )}

                <Icon className={cn(
                  'relative z-10 h-5 w-5 sm:h-6 sm:w-6 transition-all duration-300',
                  isActive && 'drop-shadow-[0_0_8px_hsl(var(--accent-foreground)/0.6)]'
                )} />
                <span className={cn(
                  'relative z-10 text-[9px] sm:text-[10px] leading-tight text-center line-clamp-2 font-normal tracking-wide',
                  isActive ? 'text-accent-foreground' : 'text-foreground/70 group-hover:text-foreground'
                )}>
                  {meta.label}
                </span>

                {/* Animated bottom accent bar */}
                {isActive && (
                  <motion.div
                    layoutId="section-card-indicator"
                    className="absolute bottom-0.5 left-2 right-2 h-[2px] rounded-full"
                    style={{
                      background: 'linear-gradient(90deg, transparent, hsl(var(--accent-foreground) / 0.7), transparent)',
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
