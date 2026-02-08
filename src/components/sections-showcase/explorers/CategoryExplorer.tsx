import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Import all explorers
import { ColorExplorer, TypographyExplorer, LogoExplorer } from './CoreIdentityExplorers';
import { GradientExplorer, PatternExplorer, PhotographyExplorer } from './VisualAssetsExplorers';
import { DocumentExplorer, SocialExplorer, EmailExplorer } from './ContentExplorers';
import { DashboardExplorer, AnalyticsExplorer, AuditExplorer, UserExplorer } from './AdminExplorers';

interface CategoryExplorerProps {
  category: 'core' | 'visual' | 'content' | 'advanced' | 'admin';
}

type ExplorerConfig = {
  title: string;
  subtitle: string;
  component: React.ComponentType;
  gradient: string;
};

const explorerConfigs: Record<string, ExplorerConfig[]> = {
  core: [
    { title: 'Color Palette', subtitle: 'Live color manipulation', component: ColorExplorer, gradient: 'from-rose-500 to-orange-500' },
    { title: 'Typography', subtitle: 'Font preview system', component: TypographyExplorer, gradient: 'from-blue-500 to-cyan-500' },
    { title: 'Logo Suite', subtitle: 'Variant explorer', component: LogoExplorer, gradient: 'from-purple-500 to-indigo-500' },
  ],
  visual: [
    { title: 'Gradients', subtitle: 'Dynamic gradient builder', component: GradientExplorer, gradient: 'from-pink-500 to-rose-500' },
    { title: 'Patterns', subtitle: 'Live pattern generator', component: PatternExplorer, gradient: 'from-emerald-500 to-teal-500' },
    { title: 'Photography', subtitle: 'Style filter explorer', component: PhotographyExplorer, gradient: 'from-sky-500 to-blue-500' },
  ],
  content: [
    { title: 'Presentations', subtitle: 'Slide deck carousel', component: DocumentExplorer, gradient: 'from-orange-500 to-red-500' },
    { title: 'Social Assets', subtitle: 'Platform mockups', component: SocialExplorer, gradient: 'from-pink-500 to-purple-500' },
    { title: 'Email Templates', subtitle: 'Interactive sections', component: EmailExplorer, gradient: 'from-teal-500 to-cyan-500' },
  ],
  advanced: [
    { title: 'Gradients', subtitle: 'Advanced color transitions', component: GradientExplorer, gradient: 'from-violet-500 to-purple-500' },
    { title: 'Patterns', subtitle: 'Complex pattern systems', component: PatternExplorer, gradient: 'from-green-500 to-emerald-500' },
  ],
  admin: [
    { title: 'Dashboard', subtitle: 'Real-time metrics', component: DashboardExplorer, gradient: 'from-blue-500 to-indigo-500' },
    { title: 'Analytics', subtitle: 'Data visualization', component: AnalyticsExplorer, gradient: 'from-cyan-500 to-blue-500' },
    { title: 'Audit Logs', subtitle: 'Activity timeline', component: AuditExplorer, gradient: 'from-slate-500 to-zinc-500' },
    { title: 'User Management', subtitle: 'Team overview', component: UserExplorer, gradient: 'from-green-500 to-emerald-500' },
  ],
};

export function CategoryExplorer({ category }: CategoryExplorerProps) {
  const explorers = explorerConfigs[category] || [];
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  if (explorers.length === 0) return null;

  const activeExplorer = explorers[activeIndex];
  const ExplorerComponent = activeExplorer.component;

  const goToNext = () => setActiveIndex(i => (i + 1) % explorers.length);
  const goToPrev = () => setActiveIndex(i => (i - 1 + explorers.length) % explorers.length);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className={cn("h-1 bg-gradient-to-r", activeExplorer.gradient)} />
      
      <div className="p-6">
        {/* Title area */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <h3 className="text-lg font-semibold text-foreground">{activeExplorer.title}</h3>
                <p className="text-sm text-muted-foreground">{activeExplorer.subtitle}</p>
              </motion.div>
            </AnimatePresence>
          </div>
          
          {/* Controls */}
          {explorers.length > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={goToPrev}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground min-w-[3rem] text-center">
                {activeIndex + 1} / {explorers.length}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={goToNext}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Explorer content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <ExplorerComponent />
          </motion.div>
        </AnimatePresence>

        {/* Dots navigation */}
        {explorers.length > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {explorers.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-300",
                  i === activeIndex 
                    ? "w-6 bg-accent" 
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                )}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
