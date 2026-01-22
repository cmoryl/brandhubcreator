import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Building2, Package, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ThemeToggle';
import { FullBrandPage } from '@/components/brand/FullBrandPage';
import { DEMO_BRANDS, DEMO_PRODUCTS, DEMO_INDUSTRIES } from '@/data/demoGuides';
import type { BrandGuide, ProductGuide, SectionId } from '@/types/brand';

// Demo guide viewer page - renders static demo data
export default function DemoGuideViewer() {
  const { type, slug } = useParams<{ type: 'brand' | 'product'; slug: string }>();
  const navigate = useNavigate();

  // Find the demo guide
  const demoGuide = type === 'brand' 
    ? DEMO_BRANDS.find(b => b.slug === slug)
    : DEMO_PRODUCTS.find(p => p.slug === slug);

  if (!demoGuide) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-foreground mb-4">Demo Guide Not Found</h1>
          <p className="text-muted-foreground mb-6">The demo guide you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  // Convert demo data to full guide format with dates
  const fullGuide = {
    ...demoGuide,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as BrandGuide | ProductGuide;

  const industry = DEMO_INDUSTRIES[demoGuide.id] || (type === 'brand' ? 'Brand Guide' : 'Product Guide');

  return (
    <div className="min-h-screen bg-background">
      {/* Demo Header Banner */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border-b border-border backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="h-6 w-px bg-border" />
            <Badge variant="secondary" className="gap-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              Demo Guide
            </Badge>
            <Badge variant="outline" className="gap-1">
              {type === 'brand' ? <Building2 className="h-3 w-3" /> : <Package className="h-3 w-3" />}
              {industry}
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button size="sm" onClick={() => navigate('/auth')} className="gap-2">
              Create Your Own
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Full Brand Page Content */}
      <FullBrandPage
        brand={fullGuide}
        brandId={demoGuide.id}
        onBrandUpdate={() => {}} // No-op for demo
        sectionOrder={demoGuide.sectionOrder as SectionId[]}
        hiddenSections={[]}
        isAdmin={false}
        heroFullWidth={true}
      />

      {/* Bottom CTA Banner */}
      <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h3 className="text-2xl font-semibold text-foreground mb-3">
            Like what you see?
          </h3>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Create your own professional brand guidelines with all the features you've just explored.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button size="lg" onClick={() => navigate('/auth')} className="gap-2">
              Get Started Free
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/')}>
              Explore More Demos
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
