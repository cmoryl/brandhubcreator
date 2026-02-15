/**
 * FeatureHighlightsStrip – Quick-access tiles for platform tools and features
 * Shows as a responsive grid of feature cards with icons and descriptions.
 */

import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Layers,
  Palette,
  Globe2,
  Shield,
  Brain,
  BookOpen,
  Wand2,
  Scale,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeatureTile {
  icon: React.ElementType;
  title: string;
  description: string;
  path: string;
  gradient: string;
  iconColor: string;
}

const FEATURES: FeatureTile[] = [
  {
    icon: Sparkles,
    title: 'Hero Effects',
    description: 'Interactive animated backgrounds',
    path: '/hero-effects',
    gradient: 'from-cyan-500/10 to-blue-500/10',
    iconColor: 'text-cyan-500',
  },
  {
    icon: Layers,
    title: 'Sections Showcase',
    description: 'Browse all guide sections',
    path: '/sections',
    gradient: 'from-purple-500/10 to-pink-500/10',
    iconColor: 'text-purple-500',
  },
  {
    icon: Palette,
    title: 'Creative Studio',
    description: 'AI-powered brand imagery',
    path: '/demo/brand/brandhub',
    gradient: 'from-amber-500/10 to-orange-500/10',
    iconColor: 'text-amber-500',
  },
  {
    icon: Wand2,
    title: 'Icon Studio',
    description: 'Design & generate icon systems',
    path: '/demo/brand/brandhub',
    gradient: 'from-emerald-500/10 to-teal-500/10',
    iconColor: 'text-emerald-500',
  },
  {
    icon: Globe2,
    title: 'GlobalLink',
    description: 'Translation & localization hub',
    path: '/product/globallink/universe',
    gradient: 'from-blue-500/10 to-indigo-500/10',
    iconColor: 'text-blue-500',
  },
  {
    icon: Brain,
    title: 'Brand Intelligence',
    description: 'AI-driven brand insights',
    path: '/demo/brand/brandhub',
    gradient: 'from-pink-500/10 to-rose-500/10',
    iconColor: 'text-pink-500',
  },
  {
    icon: Shield,
    title: 'Competitive Intel',
    description: 'Market analysis & reports',
    path: '/demo/brand/brandhub',
    gradient: 'from-red-500/10 to-orange-500/10',
    iconColor: 'text-red-500',
  },
  {
    icon: Scale,
    title: 'Bias & Inclusion',
    description: 'Accessibility & bias reporting',
    path: '/help',
    gradient: 'from-violet-500/10 to-indigo-500/10',
    iconColor: 'text-violet-500',
  },
  {
    icon: BookOpen,
    title: 'Knowledge Base',
    description: 'Help docs & tutorials',
    path: '/help',
    gradient: 'from-violet-500/10 to-purple-500/10',
    iconColor: 'text-violet-500',
  },
];

// Import is already available from lucide-react above

export function FeatureHighlightsStrip() {
  const navigate = useNavigate();

  return (
    <section className="py-8 sm:py-10 border-t border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-5 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-foreground">Platform Features</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Quick access to tools and capabilities</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {FEATURES.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <motion.button
                key={feature.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: idx * 0.04 }}
                onClick={() => navigate(feature.path)}
                className={cn(
                  'group flex flex-col items-center text-center p-3 sm:p-4 rounded-xl',
                  'border border-border/50 bg-gradient-to-br hover:border-accent/40',
                  'hover:shadow-md transition-all duration-200',
                  feature.gradient
                )}
              >
                <div className={cn(
                  'p-2 rounded-lg bg-background/80 mb-2 group-hover:scale-110 transition-transform',
                )}>
                  <Icon className={cn('h-5 w-5', feature.iconColor)} />
                </div>
                <span className="text-xs font-semibold text-foreground leading-tight mb-0.5">
                  {feature.title}
                </span>
                <span className="text-[10px] text-muted-foreground leading-tight hidden sm:block">
                  {feature.description}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
