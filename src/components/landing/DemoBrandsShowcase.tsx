import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Palette, Star, ExternalLink, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface DemoGuideData {
  id: string;
  brand_id: string;
  display_order: number;
  is_featured: boolean;
  industry_label: string | null;
  gradient_class: string | null;
  brand: {
    id: string;
    name: string;
    guide_data: {
      hero?: { tagline?: string; logoUrl?: string };
      colors?: Array<{ hex: string }>;
    };
  } | null;
}

export function DemoBrandsShowcase({ onLoginClick }: { onLoginClick: () => void }) {
  const navigate = useNavigate();
  const [demoGuides, setDemoGuides] = useState<DemoGuideData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDemoGuides = async () => {
      try {
        // Fetch demo guides with their associated public brands
        const { data: guides, error: guidesError } = await supabase
          .from('demo_guides')
          .select('*')
          .order('display_order')
          .limit(3);

        if (guidesError) throw guidesError;

        if (!guides || guides.length === 0) {
          setDemoGuides([]);
          setIsLoading(false);
          return;
        }

        // Fetch the associated brands
        const brandIds = guides.map(g => g.brand_id);
        const { data: brands, error: brandsError } = await supabase
          .from('brands')
          .select('id, name, guide_data')
          .in('id', brandIds)
          .eq('is_public', true);

        if (brandsError) throw brandsError;

        // Map brands to guides
        const enrichedGuides: DemoGuideData[] = guides.map(guide => ({
          ...guide,
          brand: brands?.find(b => b.id === guide.brand_id) as DemoGuideData['brand'] || null,
        }));

        setDemoGuides(enrichedGuides.filter(g => g.brand !== null));
      } catch (error) {
        console.error('Error fetching demo guides:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDemoGuides();
  }, []);

  // Don't render section if no demo guides and not loading
  if (!isLoading && demoGuides.length === 0) {
    return null;
  }

  return (
    <section className="py-20 bg-gradient-to-b from-background to-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4 text-accent border-accent/30">
            <Star className="h-3 w-3 mr-1 fill-current" />
            Featured Examples
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-semibold text-foreground mb-4">
            Brand Guidelines in Action
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            See how leading companies use BrandHub to create stunning, consistent brand identities
          </p>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Demo Brands Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {demoGuides.map((guide, index) => {
                const brand = guide.brand;
                if (!brand) return null;

                const guideData = brand.guide_data as DemoGuideData['brand']['guide_data'];
                const tagline = guideData?.hero?.tagline || 'Professional brand guidelines';
                const colors = guideData?.colors || [];
                const displayColors = colors.slice(0, 3).map(c => c.hex);
                
                return (
                  <Card 
                    key={guide.id}
                    className="group overflow-hidden border-0 bg-card shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <CardContent className="p-0">
                      {/* Gradient Header */}
                      <div className={`relative h-36 bg-gradient-to-br ${guide.gradient_class || 'from-primary to-accent'} overflow-hidden`}>
                        {/* Pattern Overlay */}
                        <div className="absolute inset-0 opacity-20">
                          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                              <pattern id={`pattern-${guide.id}`} width="40" height="40" patternUnits="userSpaceOnUse">
                                <circle cx="20" cy="20" r="2" fill="white" />
                              </pattern>
                            </defs>
                            <rect width="100%" height="100%" fill={`url(#pattern-${guide.id})`} />
                          </svg>
                        </div>
                        
                        {/* Logo Initial */}
                        <div className="absolute bottom-4 left-4 w-14 h-14 bg-white/95 backdrop-blur rounded-xl shadow-lg flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                          <span 
                            className="text-2xl font-bold"
                            style={{ color: displayColors[0] || 'hsl(var(--primary))' }}
                          >
                            {brand.name.charAt(0)}
                          </span>
                        </div>

                        {/* Featured Badge */}
                        {guide.is_featured && (
                          <Badge className="absolute top-3 right-3 bg-white/90 text-foreground shadow-lg">
                            <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                            Featured
                          </Badge>
                        )}
                      </div>

                      {/* Card Content */}
                      <div className="p-5">
                        <div className="mb-3">
                          {guide.industry_label && (
                            <Badge variant="secondary" className="text-xs mb-2">
                              {guide.industry_label}
                            </Badge>
                          )}
                          <h3 className="font-semibold text-xl text-foreground">
                            {brand.name}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {tagline}
                          </p>
                        </div>

                        {/* Color Swatches */}
                        {displayColors.length > 0 && (
                          <div className="flex gap-2 mb-4">
                            {displayColors.map((color, i) => (
                              <div 
                                key={i}
                                className="w-8 h-8 rounded-lg shadow-sm transition-transform hover:scale-110"
                                style={{ backgroundColor: color }}
                                title={color}
                              />
                            ))}
                            <div className="flex-1 flex items-center justify-end">
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Palette className="h-3 w-3" />
                                Brand Palette
                              </span>
                            </div>
                          </div>
                        )}

                        {/* View Button */}
                        <Button 
                          variant="outline" 
                          className="w-full gap-2 group/btn" 
                          onClick={() => navigate(`/brand/${brand.id}`)}
                        >
                          View Full Guide
                          <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-2xl p-8 border border-border">
          <h3 className="text-2xl font-semibold text-foreground mb-3">
            Ready to build your brand?
          </h3>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Create professional brand guidelines in minutes. Free to start, powerful features for teams.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button size="lg" className="gap-2" onClick={onLoginClick}>
              Get Started Free
              <ArrowRight className="h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="gap-2" onClick={onLoginClick}>
              <ExternalLink className="h-5 w-5" />
              See Live Examples
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
