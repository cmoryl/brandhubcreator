import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Palette, Type, Image, Sparkles, Grid3X3, Share2, 
  BarChart3, Shield, Brain, ChevronLeft, ChevronRight,
  Play, Pause
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';

interface Feature {
  id: string;
  icon: React.ElementType;
  title: string;
  subtitle: string;
  description: string;
  highlights: string[];
  gradient: string;
  accentColor: string;
}

const features: Feature[] = [
  {
    id: 'colors',
    icon: Palette,
    title: 'Color Palette',
    subtitle: 'Brand Colors',
    description: 'Define comprehensive color systems with multiple formats, Pantone matching, and export capabilities for design tools.',
    highlights: ['HEX, RGB, CMYK, HSV', 'Pantone Matching', 'Adobe ASE Export'],
    gradient: 'from-rose-500 to-orange-500',
    accentColor: 'rgb(244, 63, 94)',
  },
  {
    id: 'typography',
    icon: Type,
    title: 'Typography',
    subtitle: 'Font System',
    description: 'Document font families, weights, and usage guidelines with live previews and Google Fonts integration.',
    highlights: ['Google Fonts', 'Live Previews', 'Pairing Recommendations'],
    gradient: 'from-blue-500 to-cyan-500',
    accentColor: 'rgb(59, 130, 246)',
  },
  {
    id: 'logos',
    icon: Image,
    title: 'Logo Suite',
    subtitle: 'Brand Marks',
    description: 'Upload and organize multiple logo variations with clear space guidelines and usage rules.',
    highlights: ['Multiple Variations', 'Clear Space Rules', 'SVG Support'],
    gradient: 'from-purple-500 to-indigo-500',
    accentColor: 'rgb(168, 85, 247)',
  },
  {
    id: 'gradients',
    icon: Sparkles,
    title: 'Gradients',
    subtitle: 'Color Transitions',
    description: 'Create and manage branded gradient combinations with AI-generated options and CSS export.',
    highlights: ['AI Generation', 'CSS Export', 'Color Stop Control'],
    gradient: 'from-pink-500 to-rose-500',
    accentColor: 'rgb(236, 72, 153)',
  },
  {
    id: 'patterns',
    icon: Grid3X3,
    title: 'Patterns',
    subtitle: 'Visual Textures',
    description: 'Geometric and custom patterns for brand materials with 4K PNG export capabilities.',
    highlights: ['AI Patterns', '4K Export', 'Tile Adjustments'],
    gradient: 'from-emerald-500 to-teal-500',
    accentColor: 'rgb(20, 184, 166)',
  },
  {
    id: 'social',
    icon: Share2,
    title: 'Social Assets',
    subtitle: 'Platform Templates',
    description: 'Platform-specific templates and size presets for all major social media channels.',
    highlights: ['Platform Presets', 'Live Mockups', 'Banner Templates'],
    gradient: 'from-cyan-500 to-blue-500',
    accentColor: 'rgb(6, 182, 212)',
  },
  {
    id: 'analytics',
    icon: BarChart3,
    title: 'Analytics',
    subtitle: 'Performance Insights',
    description: 'Track engagement, views, and content performance with exportable reports.',
    highlights: ['View Trends', 'User Activity', 'Export Reports'],
    gradient: 'from-amber-500 to-orange-500',
    accentColor: 'rgb(245, 158, 11)',
  },
  {
    id: 'ai',
    icon: Brain,
    title: 'AI Reports',
    subtitle: 'Smart Analysis',
    description: 'Automated brand audits and competitive intelligence powered by AI.',
    highlights: ['Brand Health', 'Market Analysis', 'Recommendations'],
    gradient: 'from-violet-500 to-purple-500',
    accentColor: 'rgb(139, 92, 246)',
  },
];

export function FeatureExplorer() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [direction, setDirection] = useState(1);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const activeFeature = features[activeIndex];
  const Icon = activeFeature.icon;

  const goToNext = useCallback(() => {
    setDirection(1);
    setActiveIndex((prev) => (prev + 1) % features.length);
  }, []);

  const goToPrev = useCallback(() => {
    setDirection(-1);
    setActiveIndex((prev) => (prev - 1 + features.length) % features.length);
  }, []);

  const goToIndex = useCallback((index: number) => {
    setDirection(index > activeIndex ? 1 : -1);
    setActiveIndex(index);
  }, [activeIndex]);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(goToNext, 4000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, goToNext]);

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
      scale: 0.95,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -100 : 100,
      opacity: 0,
      scale: 0.95,
    }),
  };

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-muted/30 via-background to-background" />
      
      <div className="max-w-7xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Explore Features
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Interactive showcase of our most powerful brand management capabilities
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Feature Display */}
          <div className="relative h-[400px] lg:h-[500px]">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={activeFeature.id}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="absolute inset-0 flex flex-col items-center justify-center text-center p-8"
              >
                {/* Animated background */}
                <div 
                  className={cn(
                    "absolute inset-0 rounded-3xl opacity-10",
                    `bg-gradient-to-br ${activeFeature.gradient}`
                  )}
                />
                
                {/* Animated ring */}
                <motion.div
                  className="absolute inset-8 rounded-3xl border-2"
                  style={{ borderColor: activeFeature.accentColor }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 0.3, scale: 1 }}
                  transition={{ duration: 0.5 }}
                />

                {/* Icon */}
                <motion.div
                  className={cn(
                    "w-24 h-24 rounded-2xl flex items-center justify-center mb-6",
                    `bg-gradient-to-br ${activeFeature.gradient}`
                  )}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", delay: 0.1 }}
                >
                  <Icon className="w-12 h-12 text-white" />
                </motion.div>

                {/* Content */}
                <motion.span
                  className="text-sm font-medium text-muted-foreground mb-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  {activeFeature.subtitle}
                </motion.span>
                
                <motion.h3
                  className="text-3xl font-bold text-foreground mb-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {activeFeature.title}
                </motion.h3>
                
                <motion.p
                  className="text-muted-foreground max-w-md mb-6"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  {activeFeature.description}
                </motion.p>

                {/* Highlights */}
                <motion.div
                  className="flex flex-wrap justify-center gap-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {activeFeature.highlights.map((highlight, i) => (
                    <motion.span
                      key={highlight}
                      className="px-3 py-1 rounded-full text-sm font-medium"
                      style={{ 
                        backgroundColor: `${activeFeature.accentColor}20`,
                        color: activeFeature.accentColor,
                      }}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.35 + i * 0.05 }}
                    >
                      {highlight}
                    </motion.span>
                  ))}
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right: Navigation Grid */}
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
              {features.map((feature, index) => {
                const FeatureIcon = feature.icon;
                const isActive = index === activeIndex;
                
                return (
                  <motion.button
                    key={feature.id}
                    onClick={() => goToIndex(index)}
                    className={cn(
                      "relative p-4 rounded-xl text-left transition-all duration-300",
                      "border hover:border-border",
                      isActive 
                        ? "bg-card border-accent/50 shadow-lg" 
                        : "bg-card/50 border-border/50"
                    )}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className={cn(
                          "absolute inset-0 rounded-xl opacity-10",
                          `bg-gradient-to-br ${feature.gradient}`
                        )}
                        transition={{ type: "spring", bounce: 0.2 }}
                      />
                    )}
                    
                    <div className="relative flex items-center gap-3">
                      <div 
                        className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center transition-all",
                          isActive ? `bg-gradient-to-br ${feature.gradient}` : "bg-muted"
                        )}
                      >
                        <FeatureIcon 
                          className={cn(
                            "w-5 h-5 transition-colors",
                            isActive ? "text-white" : "text-muted-foreground"
                          )} 
                        />
                      </div>
                      <div>
                        <div className={cn(
                          "font-medium text-sm transition-colors",
                          isActive ? "text-foreground" : "text-muted-foreground"
                        )}>
                          {feature.title}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {feature.subtitle}
                        </div>
                      </div>
                    </div>

                    {/* Progress bar for active item */}
                    {isActive && isPlaying && (
                      <motion.div
                        className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r"
                        style={{ 
                          backgroundImage: `linear-gradient(to right, ${feature.accentColor}, transparent)` 
                        }}
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 4, ease: "linear" }}
                        key={`progress-${activeIndex}`}
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={goToPrev}
                className="rounded-full"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsPlaying(!isPlaying)}
                className="rounded-full"
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              
              <Button
                variant="outline"
                size="icon"
                onClick={goToNext}
                className="rounded-full"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Dots indicator */}
            <div className="flex justify-center gap-2">
              {features.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToIndex(index)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-300",
                    index === activeIndex 
                      ? "w-6 bg-accent" 
                      : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
