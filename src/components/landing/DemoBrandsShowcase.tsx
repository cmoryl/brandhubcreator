import { useNavigate } from 'react-router-dom';
import { ArrowRight, Palette, Star, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface DemoBrand {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  industry: string;
  colors: string[];
  logoInitial: string;
  gradient: string;
  featured?: boolean;
}

const demoBrands: DemoBrand[] = [
  {
    id: 'demo-1',
    slug: 'lumina-studios',
    name: 'Lumina Studios',
    tagline: 'Crafting light through design',
    industry: 'Creative Agency',
    colors: ['#6366f1', '#8b5cf6', '#a855f7'],
    logoInitial: 'L',
    gradient: 'from-indigo-500 via-purple-500 to-pink-500',
    featured: true,
  },
  {
    id: 'demo-2',
    slug: 'greenleaf-organics',
    name: 'GreenLeaf Organics',
    tagline: 'Nature in every bite',
    industry: 'Food & Beverage',
    colors: ['#22c55e', '#16a34a', '#84cc16'],
    logoInitial: 'G',
    gradient: 'from-green-400 via-emerald-500 to-lime-500',
  },
  {
    id: 'demo-3',
    slug: 'techflow',
    name: 'TechFlow',
    tagline: 'Seamless digital solutions',
    industry: 'Technology',
    colors: ['#0ea5e9', '#3b82f6', '#6366f1'],
    logoInitial: 'T',
    gradient: 'from-cyan-400 via-blue-500 to-indigo-600',
    featured: true,
  },
  {
    id: 'demo-4',
    slug: 'artisan-coffee',
    name: 'Artisan Coffee Co.',
    tagline: 'Roasted to perfection',
    industry: 'Hospitality',
    colors: ['#78350f', '#92400e', '#b45309'],
    logoInitial: 'A',
    gradient: 'from-amber-600 via-orange-700 to-amber-800',
  },
  {
    id: 'demo-5',
    slug: 'velocity-sports',
    name: 'Velocity Sports',
    tagline: 'Push your limits',
    industry: 'Sports & Fitness',
    colors: ['#dc2626', '#f97316', '#eab308'],
    logoInitial: 'V',
    gradient: 'from-red-500 via-orange-500 to-yellow-500',
  },
  {
    id: 'demo-6',
    slug: 'serenity-spa',
    name: 'Serenity Spa',
    tagline: 'Your wellness journey',
    industry: 'Health & Wellness',
    colors: ['#14b8a6', '#06b6d4', '#0ea5e9'],
    logoInitial: 'S',
    gradient: 'from-teal-400 via-cyan-500 to-sky-500',
  },
];

export function DemoBrandsShowcase({ onLoginClick }: { onLoginClick: () => void }) {
  const navigate = useNavigate();
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

        {/* Demo Brands Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {demoBrands.map((brand, index) => (
            <Card 
              key={brand.id}
              className="group overflow-hidden border-0 bg-card shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-0">
                {/* Gradient Header */}
                <div className={`relative h-36 bg-gradient-to-br ${brand.gradient} overflow-hidden`}>
                  {/* Pattern Overlay */}
                  <div className="absolute inset-0 opacity-20">
                    <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <pattern id={`pattern-${brand.id}`} width="40" height="40" patternUnits="userSpaceOnUse">
                          <circle cx="20" cy="20" r="2" fill="white" />
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill={`url(#pattern-${brand.id})`} />
                    </svg>
                  </div>
                  
                  {/* Logo Initial */}
                  <div className="absolute bottom-4 left-4 w-14 h-14 bg-white/95 backdrop-blur rounded-xl shadow-lg flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl font-bold bg-gradient-to-br text-transparent bg-clip-text" 
                      style={{ backgroundImage: `linear-gradient(135deg, ${brand.colors[0]}, ${brand.colors[2]})` }}>
                      {brand.logoInitial}
                    </span>
                  </div>

                  {/* Featured Badge */}
                  {brand.featured && (
                    <Badge className="absolute top-3 right-3 bg-white/90 text-foreground shadow-lg">
                      <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                      Featured
                    </Badge>
                  )}
                </div>

                {/* Card Content */}
                <div className="p-5">
                  <div className="mb-3">
                    <Badge variant="secondary" className="text-xs mb-2">
                      {brand.industry}
                    </Badge>
                    <h3 className="font-semibold text-xl text-foreground">
                      {brand.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {brand.tagline}
                    </p>
                  </div>

                  {/* Color Swatches */}
                  <div className="flex gap-2 mb-4">
                    {brand.colors.map((color, i) => (
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

                  {/* View Button */}
                  <Button variant="outline" className="w-full gap-2 group/btn" onClick={() => navigate(`/demo/${brand.slug}`)}>
                    View Full Guide
                    <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

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
