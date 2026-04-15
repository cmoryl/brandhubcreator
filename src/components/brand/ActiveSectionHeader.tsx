import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { CARD_TINTS, SECTION_DESCRIPTIONS } from './SectionCardGrid';
import { sectionMeta } from './sectionMeta';

interface ActiveSectionHeaderProps {
  activeSection: string;
  sectionOrder: string[];
  hiddenSections?: string[];
  customSectionMeta?: Record<string, { label: string; icon: React.ElementType; category: string }>;
  /** The exact ordered sections array rendered in the card grid, used to match tint colors */
  gridSections?: string[];
}

export function ActiveSectionHeader({
  activeSection,
  sectionOrder,
  hiddenSections = [],
  customSectionMeta,
  gridSections,
}: ActiveSectionHeaderProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const meta = customSectionMeta || sectionMeta;

  // Use the exact grid sections array if provided, otherwise fall back to sectionOrder
  const visibleSections = useMemo(() => {
    if (gridSections) return gridSections;
    return sectionOrder.filter(
      (id) => meta[id] && !['socialmetrics', 'hero'].includes(id)
    );
  }, [gridSections, sectionOrder, meta]);

  const sectionIndex = visibleSections.indexOf(activeSection);
  const tint = sectionIndex >= 0 ? CARD_TINTS[sectionIndex % CARD_TINTS.length] : null;
  const sectionInfo = meta[activeSection];
  const description = SECTION_DESCRIPTIONS[activeSection] || (sectionInfo ? `Manage ${sectionInfo.label.toLowerCase()} settings and guidelines.` : '');

  if (!sectionInfo || !tint || activeSection === 'hero') return null;

  const Icon = sectionInfo.icon;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeSection}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="w-full relative rounded-xl overflow-hidden my-4"
        style={{
          background: `linear-gradient(135deg, ${tint.bg}, ${tint.bg.replace(')', ' / 0.75)')})`,
          boxShadow: `0 4px 20px ${tint.bg.replace(')', ' / 0.25)')}, 0 0 40px ${tint.bg.replace(')', ' / 0.08)')}`,
        }}
      >
        <div className="flex items-center justify-between px-5 py-3.5">
          {/* Left: Title & description */}
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-white tracking-wide">
              {sectionInfo.label}
            </h3>
            <p className="text-[11px] text-white/70 mt-0.5 line-clamp-1">
              {description}
            </p>
          </div>

          {/* Right: Icon */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.3, ease: 'easeOut' }}
            className="shrink-0 ml-4"
          >
            <div
              className="h-10 w-10 rounded-lg flex items-center justify-center"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <Icon className="h-5 w-5 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.4)]" />
            </div>
          </motion.div>
        </div>

        {/* Subtle liquid sheen overlay */}
        <motion.div
          className="absolute inset-0 pointer-events-none rounded-xl"
          style={{
            background: `
              radial-gradient(ellipse at 20% 30%, rgba(255,255,255,0.15) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 70%, rgba(255,255,255,0.08) 0%, transparent 40%)
            `,
          }}
          animate={{ backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>
    </AnimatePresence>
  );
}
