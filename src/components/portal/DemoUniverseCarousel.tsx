/**
 * DemoUniverseCarousel – Featured demo brands/products/events carousel
 * Renders a horizontally scrollable showcase fetched from the demo_brands table.
 */

import { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Eye, Sparkles, Building2, Package, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface DemoItem {
  id: string;
  name: string;
  slug: string;
  type: string;
  is_featured: boolean;
  industry_label: string | null;
  card_image_url: string | null;
  gradient_class: string | null;
  guide_data: any;
}

const TYPE_CONFIG = {
  brand: { icon: Building2, label: 'Brand', color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30', path: '/demo/brand/' },
  product: { icon: Package, label: 'Product', color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/30', path: '/demo/product/' },
  event: { icon: Calendar, label: 'Event', color: 'text-purple-400', bg: 'bg-purple-500/20', border: 'border-purple-500/30', path: '/demo/event/' },
} as const;

export function DemoUniverseCarousel() {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  const { data: demos = [], isLoading } = useQuery({
    queryKey: ['demo-universe-carousel'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('demo_brands')
        .select('id, name, slug, type, is_featured, industry_label, card_image_url, gradient_class, guide_data')
        .eq('is_active', true)
        .order('display_order');
      if (error) throw error;
      return (data || []) as DemoItem[];
    },
    staleTime: 60_000,
  });

  const featured = demos.find(d => d.is_featured);
  const others = demos.filter(d => !d.is_featured);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkScroll, { passive: true });
    checkScroll();
    return () => el.removeEventListener('scroll', checkScroll);
  }, [checkScroll, demos]);

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = 280;
    el.scrollBy({ left: dir === 'left' ? -cardWidth : cardWidth, behavior: 'smooth' });
  };

  // Auto-scroll every 5s
  useEffect(() => {
    if (others.length <= 3) return;
    const interval = setInterval(() => {
      const el = scrollRef.current;
      if (!el) return;
      if (el.scrollLeft >= el.scrollWidth - el.clientWidth - 10) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: 280, behavior: 'smooth' });
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [others.length]);

  if (isLoading || demos.length === 0) return null;

  const getPath = (item: DemoItem) => {
    const cfg = TYPE_CONFIG[item.type as keyof typeof TYPE_CONFIG];
    return cfg ? `${cfg.path}${item.slug}` : `/demo/brand/${item.slug}`;
  };

  const heroData = featured?.guide_data?.hero;
  const heroTagline = heroData?.tagline || 'Explore our fully-featured demo brand guide';

  return (
    <section className="py-10 sm:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-5 w-5 text-accent" />
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">Demo Universe</h2>
            </div>
            <p className="text-sm text-muted-foreground">Explore live demos showcasing all platform capabilities</p>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Featured Demo Card (hero) */}
        {featured && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 sm:mb-8"
          >
            <div
              className={cn(
                'relative rounded-2xl overflow-hidden cursor-pointer group',
                'bg-gradient-to-r',
                featured.gradient_class || 'from-accent via-primary to-accent'
              )}
              onClick={() => navigate(getPath(featured))}
            >
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
              <div className="relative z-10 p-6 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <div className="flex-1 min-w-0">
                  <Badge className="mb-3 bg-white/20 text-white border-0 backdrop-blur-sm">
                    ⭐ Featured Demo
                  </Badge>
                  <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                    {heroData?.name || featured.name}
                  </h3>
                  <p className="text-white/80 text-sm sm:text-base max-w-lg mb-4">
                    {heroTagline}
                  </p>
                  <Button
                    variant="secondary"
                    className="gap-2 bg-white/20 text-white border-0 hover:bg-white/30 backdrop-blur-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(getPath(featured));
                    }}
                  >
                    <Eye className="h-4 w-4" />
                    Explore Demo
                  </Button>
                </div>
                {/* Color swatches from guide data */}
                {featured.guide_data?.colors?.length > 0 && (
                  <div className="hidden sm:flex items-center gap-1.5">
                    {featured.guide_data.colors.slice(0, 5).map((c: any, i: number) => (
                      <div
                        key={i}
                        className="w-8 h-8 rounded-lg border border-white/20 shadow-lg"
                        style={{ backgroundColor: c.hex || c.value }}
                        title={c.name}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Scrollable Demo Cards */}
        {others.length > 0 && (
          <div className="relative">
            {/* Fade edges */}
            {canScrollLeft && (
              <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
            )}
            {canScrollRight && (
              <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
            )}

            <div
              ref={scrollRef}
              className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {others.map((item, idx) => {
                const cfg = TYPE_CONFIG[item.type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.brand;
                const Icon = cfg.icon;
                const itemHero = item.guide_data?.hero;

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: idx * 0.08 }}
                    className="snap-start flex-shrink-0 w-[260px] sm:w-[280px]"
                  >
                    <div
                      className="h-full rounded-xl border border-border/60 bg-card overflow-hidden cursor-pointer group hover:border-accent/50 hover:shadow-lg transition-all duration-300"
                      onClick={() => navigate(getPath(item))}
                    >
                      {/* Card Image/Gradient */}
                      <div className={cn(
                        'h-32 sm:h-36 relative overflow-hidden',
                        !item.card_image_url && 'bg-gradient-to-br',
                        !item.card_image_url && (item.gradient_class || 'from-muted to-muted-foreground/20')
                      )}>
                        {item.card_image_url && (
                          <img
                            src={item.card_image_url}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        {/* Type badge */}
                        <div className="absolute top-3 left-3">
                          <Badge className={cn('gap-1 text-xs backdrop-blur-sm border', cfg.bg, cfg.border, cfg.color)}>
                            <Icon className="h-3 w-3" />
                            {cfg.label}
                          </Badge>
                        </div>
                        {item.industry_label && (
                          <div className="absolute top-3 right-3">
                            <Badge variant="secondary" className="text-xs bg-black/40 text-white border-0 backdrop-blur-sm">
                              {item.industry_label}
                            </Badge>
                          </div>
                        )}
                      </div>

                      {/* Card Body */}
                      <div className="p-4">
                        <h4 className="font-semibold text-foreground text-sm mb-1 group-hover:text-accent transition-colors truncate">
                          {itemHero?.name || item.name}
                        </h4>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {itemHero?.tagline || `Explore this ${cfg.label.toLowerCase()} demo guide`}
                        </p>
                        <div className="mt-3 flex items-center text-xs text-accent gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Eye className="h-3 w-3" />
                          <span>View demo</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
