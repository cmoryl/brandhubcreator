import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { ArrowLeft, Lock, Building2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ThemeToggle';
import { AppBreadcrumbs } from '@/components/AppBreadcrumbs';
import tpLogoWhite from '@/assets/tp-logo-white.svg';
import tpLogoColor from '@/assets/tp-logo-color.svg';

// Demo brand data with simple structure
interface DemoBrandData {
  id: string;
  name: string;
  tagline: string;
  mission: string;
  archetype: string;
  toneOfVoice: string[];
  values: { id: string; text: string; description: string }[];
  colors: { id: string; name: string; hex: string; usage: string }[];
  gradients: { id: string; name: string; css: string }[];
  typography: { id: string; name: string; fontFamily: string; weight: string; usage: string }[];
}

const demoBrands: Record<string, DemoBrandData> = {
  'lumina-studios': {
    id: 'lumina-studios',
    name: 'Lumina Studios',
    tagline: 'Crafting light through design',
    mission: 'To illuminate brands through thoughtful design, creating visual experiences that inspire and engage audiences worldwide.',
    archetype: 'The Creator',
    toneOfVoice: ['Innovative', 'Inspiring', 'Sophisticated', 'Approachable'],
    values: [
      { id: '1', text: 'Innovation', description: 'Pushing boundaries in every project we undertake' },
      { id: '2', text: 'Excellence', description: 'Delivering exceptional quality in every detail' },
      { id: '3', text: 'Collaboration', description: 'Building lasting partnerships with our clients' },
      { id: '4', text: 'Integrity', description: 'Honest, transparent communication always' },
    ],
    colors: [
      { id: '1', name: 'Indigo', hex: '#6366f1', usage: 'Primary brand color, headers, CTAs' },
      { id: '2', name: 'Violet', hex: '#8b5cf6', usage: 'Secondary accents, gradients' },
      { id: '3', name: 'Fuchsia', hex: '#a855f7', usage: 'Highlights, hover states' },
      { id: '4', name: 'Slate', hex: '#1e293b', usage: 'Text, dark backgrounds' },
      { id: '5', name: 'White', hex: '#ffffff', usage: 'Backgrounds, contrast' },
    ],
    gradients: [
      { id: '1', name: 'Primary Gradient', css: 'linear-gradient(135deg, #6366f1, #a855f7)' },
      { id: '2', name: 'Subtle Gradient', css: 'linear-gradient(90deg, #6366f1, #8b5cf6)' },
    ],
    typography: [
      { id: '1', name: 'Display', fontFamily: 'Fraunces', weight: '700', usage: 'Headlines, hero text' },
      { id: '2', name: 'Heading', fontFamily: 'Inter', weight: '600', usage: 'Section headings' },
      { id: '3', name: 'Body', fontFamily: 'Inter', weight: '400', usage: 'Paragraphs, general text' },
    ],
  },
  'greenleaf-organics': {
    id: 'greenleaf-organics',
    name: 'GreenLeaf Organics',
    tagline: 'Nature in every bite',
    mission: 'To provide wholesome, organic food products that nourish families while protecting our planet for future generations.',
    archetype: 'The Caregiver',
    toneOfVoice: ['Warm', 'Trustworthy', 'Natural', 'Caring'],
    values: [
      { id: '1', text: 'Sustainability', description: 'Every decision considers environmental impact' },
      { id: '2', text: 'Transparency', description: 'Full visibility into our sourcing and processes' },
      { id: '3', text: 'Quality', description: 'Only the finest organic ingredients' },
      { id: '4', text: 'Community', description: 'Supporting local farmers and communities' },
    ],
    colors: [
      { id: '1', name: 'Forest', hex: '#22c55e', usage: 'Primary brand color' },
      { id: '2', name: 'Emerald', hex: '#16a34a', usage: 'Secondary, buttons' },
      { id: '3', name: 'Lime', hex: '#84cc16', usage: 'Accents, highlights' },
      { id: '4', name: 'Earth', hex: '#78350f', usage: 'Text, grounding elements' },
      { id: '5', name: 'Cream', hex: '#fefce8', usage: 'Backgrounds' },
    ],
    gradients: [
      { id: '1', name: 'Nature Gradient', css: 'linear-gradient(135deg, #22c55e, #84cc16)' },
    ],
    typography: [
      { id: '1', name: 'Display', fontFamily: 'Playfair Display', weight: '700', usage: 'Headlines' },
      { id: '2', name: 'Body', fontFamily: 'Lato', weight: '400', usage: 'Body text' },
    ],
  },
  'techflow': {
    id: 'techflow',
    name: 'TechFlow',
    tagline: 'Seamless digital solutions',
    mission: 'To empower businesses with cutting-edge technology solutions that streamline operations and drive growth.',
    archetype: 'The Sage',
    toneOfVoice: ['Professional', 'Innovative', 'Clear', 'Confident'],
    values: [
      { id: '1', text: 'Innovation', description: 'Pioneering new solutions for modern challenges' },
      { id: '2', text: 'Reliability', description: 'Dependable technology you can count on' },
      { id: '3', text: 'Simplicity', description: 'Complex problems, elegant solutions' },
      { id: '4', text: 'Partnership', description: 'Growing alongside our clients' },
    ],
    colors: [
      { id: '1', name: 'Cyan', hex: '#0ea5e9', usage: 'Primary brand color' },
      { id: '2', name: 'Blue', hex: '#3b82f6', usage: 'Secondary elements' },
      { id: '3', name: 'Indigo', hex: '#6366f1', usage: 'Accents, CTAs' },
      { id: '4', name: 'Slate', hex: '#0f172a', usage: 'Dark backgrounds, text' },
      { id: '5', name: 'White', hex: '#f8fafc', usage: 'Light backgrounds' },
    ],
    gradients: [
      { id: '1', name: 'Tech Gradient', css: 'linear-gradient(135deg, #0ea5e9, #6366f1)' },
    ],
    typography: [
      { id: '1', name: 'Display', fontFamily: 'Space Grotesk', weight: '700', usage: 'Headlines' },
      { id: '2', name: 'Body', fontFamily: 'Inter', weight: '400', usage: 'Body text' },
      { id: '3', name: 'Code', fontFamily: 'JetBrains Mono', weight: '400', usage: 'Technical content' },
    ],
  },
  'artisan-coffee': {
    id: 'artisan-coffee',
    name: 'Artisan Coffee Co.',
    tagline: 'Roasted to perfection',
    mission: 'To bring the world\'s finest coffee experiences to discerning coffee lovers, one perfectly roasted batch at a time.',
    archetype: 'The Artisan',
    toneOfVoice: ['Warm', 'Crafted', 'Authentic', 'Inviting'],
    values: [
      { id: '1', text: 'Craft', description: 'Mastery in every roast' },
      { id: '2', text: 'Origin', description: 'Ethically sourced from the best farms' },
      { id: '3', text: 'Experience', description: 'Creating memorable moments' },
      { id: '4', text: 'Community', description: 'Bringing people together' },
    ],
    colors: [
      { id: '1', name: 'Espresso', hex: '#78350f', usage: 'Primary brand color' },
      { id: '2', name: 'Roast', hex: '#92400e', usage: 'Secondary elements' },
      { id: '3', name: 'Caramel', hex: '#b45309', usage: 'Accents, highlights' },
      { id: '4', name: 'Cream', hex: '#fef3c7', usage: 'Backgrounds' },
      { id: '5', name: 'Dark', hex: '#1c1917', usage: 'Text' },
    ],
    gradients: [
      { id: '1', name: 'Coffee Gradient', css: 'linear-gradient(135deg, #78350f, #b45309)' },
    ],
    typography: [
      { id: '1', name: 'Display', fontFamily: 'Playfair Display', weight: '700', usage: 'Headlines' },
      { id: '2', name: 'Body', fontFamily: 'Source Sans Pro', weight: '400', usage: 'Body text' },
    ],
  },
  'velocity-sports': {
    id: 'velocity-sports',
    name: 'Velocity Sports',
    tagline: 'Push your limits',
    mission: 'To inspire athletes of all levels to push beyond their limits and achieve greatness through premium sports gear and training.',
    archetype: 'The Hero',
    toneOfVoice: ['Energetic', 'Bold', 'Motivating', 'Dynamic'],
    values: [
      { id: '1', text: 'Performance', description: 'Excellence in every product' },
      { id: '2', text: 'Determination', description: 'Never give up mentality' },
      { id: '3', text: 'Innovation', description: 'Cutting-edge sports technology' },
      { id: '4', text: 'Inclusion', description: 'Sports for everyone' },
    ],
    colors: [
      { id: '1', name: 'Fire', hex: '#dc2626', usage: 'Primary brand color' },
      { id: '2', name: 'Energy', hex: '#f97316', usage: 'Secondary elements' },
      { id: '3', name: 'Gold', hex: '#eab308', usage: 'Accents, achievements' },
      { id: '4', name: 'Charcoal', hex: '#171717', usage: 'Dark backgrounds' },
      { id: '5', name: 'White', hex: '#ffffff', usage: 'Text on dark' },
    ],
    gradients: [
      { id: '1', name: 'Energy Gradient', css: 'linear-gradient(135deg, #dc2626, #eab308)' },
    ],
    typography: [
      { id: '1', name: 'Display', fontFamily: 'Oswald', weight: '700', usage: 'Headlines' },
      { id: '2', name: 'Body', fontFamily: 'Roboto', weight: '400', usage: 'Body text' },
    ],
  },
  'serenity-spa': {
    id: 'serenity-spa',
    name: 'Serenity Spa',
    tagline: 'Your wellness journey',
    mission: 'To provide a sanctuary of peace and rejuvenation where guests can escape the stresses of daily life and find true wellness.',
    archetype: 'The Innocent',
    toneOfVoice: ['Calming', 'Gentle', 'Luxurious', 'Nurturing'],
    values: [
      { id: '1', text: 'Wellness', description: 'Holistic approach to health' },
      { id: '2', text: 'Tranquility', description: 'Creating peaceful experiences' },
      { id: '3', text: 'Quality', description: 'Premium treatments and products' },
      { id: '4', text: 'Care', description: 'Personalized attention for every guest' },
    ],
    colors: [
      { id: '1', name: 'Teal', hex: '#14b8a6', usage: 'Primary brand color' },
      { id: '2', name: 'Cyan', hex: '#06b6d4', usage: 'Secondary elements' },
      { id: '3', name: 'Sky', hex: '#0ea5e9', usage: 'Accents' },
      { id: '4', name: 'Pearl', hex: '#f0fdfa', usage: 'Backgrounds' },
      { id: '5', name: 'Slate', hex: '#334155', usage: 'Text' },
    ],
    gradients: [
      { id: '1', name: 'Calm Gradient', css: 'linear-gradient(135deg, #14b8a6, #0ea5e9)' },
    ],
    typography: [
      { id: '1', name: 'Display', fontFamily: 'Cormorant Garamond', weight: '600', usage: 'Headlines' },
      { id: '2', name: 'Body', fontFamily: 'Raleway', weight: '400', usage: 'Body text' },
    ],
  },
};

export default function DemoBrandPreview() {
  const { brandSlug } = useParams();
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();
  
  const brand = brandSlug ? demoBrands[brandSlug] : null;

  if (!brand) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Demo brand not found</h1>
          <Button onClick={() => navigate('/')}>Back to Home</Button>
        </div>
      </div>
    );
  }

  const primaryColor = brand.colors[0]?.hex || '#6366f1';
  const secondaryColor = brand.colors[1]?.hex || '#8b5cf6';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2">
              <img 
                src={resolvedTheme === 'light' ? tpLogoColor : tpLogoWhite} 
                alt="TransPerfect" 
                className="h-6 w-auto"
              />
              <span className="font-semibold">Demo Preview</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="gap-1">
              <Lock className="h-3 w-3" />
              View Only
            </Badge>
            <ThemeToggle />
            <Button onClick={() => navigate('/auth')} className="gap-2">
              Create Your Own
            </Button>
          </div>
        </div>
      </header>

      {/* Breadcrumbs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <AppBreadcrumbs
          items={[
            { label: 'Demo Guides', icon: Star, href: '/' },
          ]}
          currentPage={brand.name}
          currentIcon={Building2}
        />
      </div>

      {/* Hero Section */}
      <section 
        className="relative py-12 sm:py-20 overflow-hidden"
        style={{ 
          background: `linear-gradient(135deg, ${primaryColor}15, ${secondaryColor}15)` 
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div 
              className="w-24 h-24 mx-auto mb-6 rounded-2xl flex items-center justify-center text-white text-4xl font-bold shadow-xl"
              style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
            >
              {brand.name.charAt(0)}
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
              {brand.name}
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {brand.tagline}
            </p>
          </div>
        </div>
      </section>

      {/* Brand Identity */}
      <section className="py-16 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold mb-8">Brand Identity</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 bg-muted/30 rounded-xl">
              <h3 className="font-medium mb-3 text-muted-foreground text-sm uppercase tracking-wide">Mission</h3>
              <p className="text-foreground">{brand.mission}</p>
            </div>
            <div className="p-6 bg-muted/30 rounded-xl">
              <h3 className="font-medium mb-3 text-muted-foreground text-sm uppercase tracking-wide">Archetype</h3>
              <p className="text-foreground text-xl font-semibold">{brand.archetype}</p>
            </div>
            <div className="p-6 bg-muted/30 rounded-xl">
              <h3 className="font-medium mb-3 text-muted-foreground text-sm uppercase tracking-wide">Tone of Voice</h3>
              <div className="flex flex-wrap gap-2">
                {brand.toneOfVoice.map((tone, i) => (
                  <Badge key={i} variant="secondary">{tone}</Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold mb-8">Brand Values</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {brand.values.map((value) => (
              <div key={value.id} className="p-6 bg-card rounded-xl border hover:shadow-lg transition-shadow">
                <h3 className="font-semibold text-lg mb-2" style={{ color: primaryColor }}>
                  {value.text}
                </h3>
                <p className="text-sm text-muted-foreground">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Color Palette */}
      <section className="py-16 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold mb-8">Color Palette</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {brand.colors.map((color) => (
              <div key={color.id} className="group">
                <div 
                  className="h-32 rounded-xl shadow-lg mb-3 transition-transform group-hover:scale-105"
                  style={{ backgroundColor: color.hex }}
                />
                <h4 className="font-medium">{color.name}</h4>
                <p className="text-sm text-muted-foreground">{color.hex}</p>
                <p className="text-xs text-muted-foreground mt-1">{color.usage}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Typography */}
      <section className="py-16 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold mb-8">Typography</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {brand.typography.map((type) => (
              <div key={type.id} className="p-6 bg-muted/30 rounded-xl">
                <p 
                  className="text-3xl mb-4"
                  style={{ fontFamily: type.fontFamily, fontWeight: type.weight }}
                >
                  Aa Bb Cc
                </p>
                <h4 className="font-medium">{type.name}</h4>
                <p className="text-sm text-muted-foreground">{type.fontFamily}</p>
                <p className="text-xs text-muted-foreground mt-1">{type.usage}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gradients */}
      {brand.gradients.length > 0 && (
        <section className="py-16 border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-semibold mb-8">Gradients</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {brand.gradients.map((gradient) => (
                <div key={gradient.id}>
                  <div 
                    className="h-40 rounded-xl shadow-lg mb-3"
                    style={{ background: gradient.css }}
                  />
                  <h4 className="font-medium">{gradient.name}</h4>
                  <p className="text-sm text-muted-foreground font-mono">{gradient.css}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-semibold mb-4">Create Your Own Brand Guide</h2>
          <p className="text-muted-foreground mb-8">
            Build professional brand guidelines like this one in minutes. Free to start.
          </p>
          <Button size="lg" onClick={() => navigate('/auth')} className="gap-2">
            Get Started Free
            <ArrowLeft className="h-5 w-5 rotate-180" />
          </Button>
        </div>
      </section>
    </div>
  );
}
