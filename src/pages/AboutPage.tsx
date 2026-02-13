import { useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { ArrowLeft, Heart, Palette, Lightbulb, Users, Sparkles, PenTool, Target, Rocket, Zap, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import tpLogoWhite from '@/assets/tp-logo-white.svg';
import tpLogoColor from '@/assets/tp-logo-color.svg';

export default function AboutPage() {
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();
  const { settings } = useAppSettings();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2">
              <img 
                src={resolvedTheme === 'dark' ? tpLogoWhite : tpLogoColor} 
                alt="BrandHUB" 
                className="h-8 w-8 object-contain" 
              />
              <span className="font-semibold text-lg">
                Brand<span className="text-accent">HUB</span>
              </span>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Hero Section - Our Story */}
      <section className="relative py-16 sm:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/10 to-primary/5" />
        <div className="absolute inset-0 hidden sm:block">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        
        <div className="relative max-w-4xl mx-auto text-center">
          <Badge variant="secondary" className="mb-4 gap-1.5">
            <Heart className="h-3 w-3 fill-current" />
            Our Story
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-bold text-foreground mb-6">
            Built by Designers.
            <span className="block text-accent">Powered by Creativity.</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            We're not just developers building another tool. We're designers, marketers, and brand enthusiasts 
            who understand the daily struggle of maintaining brand consistency across growing organizations.
          </p>
        </div>
      </section>

      {/* The Origin Story */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div>
              <Badge variant="outline" className="mb-4 gap-1">
                <Lightbulb className="h-3 w-3" />
                The Spark
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                Born from Real Frustration
              </h2>
              <p className="text-muted-foreground mb-4">
                We've spent years in the trenches—creating brand guidelines in static PDFs that become 
                outdated the moment they're published. Chasing down the "latest version" across shared drives. 
                Watching beautiful brand systems fall apart as teams scale.
              </p>
              <p className="text-muted-foreground">
                BrandHub was born from a simple question: <em className="text-foreground font-medium">What if brand 
                guidelines could be as dynamic and alive as the brands they represent?</em>
              </p>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl blur-2xl" />
              <Card className="relative p-6 sm:p-8 border-border/50 bg-card/80 backdrop-blur-sm">
                <Quote className="h-8 w-8 text-accent/50 mb-4" />
                <p className="text-lg italic text-foreground mb-4">
                  "We built the tool we wished existed—one that grows with your brand, 
                  learns your voice, and never lets your guidelines gather dust."
                </p>
                <p className="text-sm text-muted-foreground">— The BrandHub Team</p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-muted/20 border-y border-border/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 sm:mb-14">
            <Badge variant="outline" className="mb-4 gap-1">
              <Heart className="h-3 w-3" />
              What Drives Us
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
              Our Love of Design & Creativity
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Every feature we build comes from a deep appreciation for the craft of branding 
              and the creative minds who bring brands to life.
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="p-6 border-border/50 hover:border-primary/30 transition-all hover:shadow-lg group">
              <div className="p-3 bg-primary/10 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform">
                <PenTool className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg text-foreground mb-2">Design-First Thinking</h3>
              <p className="text-sm text-muted-foreground">
                We obsess over every pixel, every interaction. Because brand guidelines deserve 
                to be as beautiful as the brands they define.
              </p>
            </Card>
            
            <Card className="p-6 border-border/50 hover:border-accent/30 transition-all hover:shadow-lg group">
              <div className="p-3 bg-accent/10 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform">
                <Users className="h-6 w-6 text-accent" />
              </div>
              <h3 className="font-semibold text-lg text-foreground mb-2">Built for Creatives</h3>
              <p className="text-sm text-muted-foreground">
                We speak designer. We understand the workflow. Every feature is designed to 
                enhance creativity, not constrain it.
              </p>
            </Card>
            
            <Card className="p-6 border-border/50 hover:border-green-500/30 transition-all hover:shadow-lg group">
              <div className="p-3 bg-green-500/10 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform">
                <Target className="h-6 w-6 text-green-500" />
              </div>
              <h3 className="font-semibold text-lg text-foreground mb-2">Consistency Matters</h3>
              <p className="text-sm text-muted-foreground">
                Brand consistency shouldn't be a daily battle. We automate the tedious so you 
                can focus on what matters—creative work.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* AI as Assistant */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div className="order-2 md:order-1">
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-5 border-border/50 bg-gradient-to-br from-accent/5 to-transparent">
                  <Sparkles className="h-6 w-6 text-accent mb-3" />
                  <p className="text-sm font-medium text-foreground">Oracle Brain</p>
                  <p className="text-xs text-muted-foreground mt-1">Strategic intelligence backbone</p>
                </Card>
                <Card className="p-5 border-border/50 bg-gradient-to-br from-primary/5 to-transparent">
                  <Lightbulb className="h-6 w-6 text-primary mb-3" />
                  <p className="text-sm font-medium text-foreground">Brand Intelligence</p>
                  <p className="text-xs text-muted-foreground mt-1">Cumulative AI learning</p>
                </Card>
                <Card className="p-5 border-border/50 bg-gradient-to-br from-green-500/5 to-transparent">
                  <Target className="h-6 w-6 text-green-500 mb-3" />
                  <p className="text-sm font-medium text-foreground">DataForce AI</p>
                  <p className="text-xs text-muted-foreground mt-1">Compliance & validation</p>
                </Card>
                <Card className="p-5 border-border/50 bg-gradient-to-br from-sky-500/5 to-transparent">
                  <Rocket className="h-6 w-6 text-sky-500 mb-3" />
                  <p className="text-sm font-medium text-foreground">Competitor Intel</p>
                  <p className="text-xs text-muted-foreground mt-1">10-section AI reports</p>
                </Card>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <Badge variant="outline" className="mb-4 gap-1">
                <Sparkles className="h-3 w-3" />
                AI as Your Assistant
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                Intelligence That Serves You
              </h2>
              <p className="text-muted-foreground mb-4">
                We believe AI should enhance human creativity, not replace it. Our Oracle Brain is 
                your organization's strategic backbone—aggregating institutional knowledge and aligning 
                every AI function from compliance to competitive analysis.
              </p>
              <p className="text-muted-foreground mb-4">
                Entity-level Brand Brains learn and evolve with feedback, while insights automatically 
                bubble up to the Oracle. DataForce AI enforces compliance, and Research Briefings 
                deliver deep-dive cultural analysis—all strategically aligned.
              </p>
              <p className="text-sm text-accent font-medium">
                You create. AI supports. Together, brands thrive.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-10 sm:py-16 px-4 sm:px-6 lg:px-8 bg-muted/20 border-y border-border/30">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-center">
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-primary mb-1">500+</div>
              <p className="text-sm text-muted-foreground">Brand Guides Created</p>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-primary mb-1">50+</div>
              <p className="text-sm text-muted-foreground">Organizations</p>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-primary mb-1">35+</div>
              <p className="text-sm text-muted-foreground">Sections Available</p>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-primary mb-1">∞</div>
              <p className="text-sm text-muted-foreground">Creative Possibilities</p>
            </div>
          </div>
        </div>
      </section>

      {/* Single CTA */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
            Ready to bring your brand to life?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join the designers, marketers, and brand teams who've made the switch to living brand guidelines.
          </p>
          <Button 
            size="lg" 
            onClick={() => window.location.href = 'mailto:support@brandhub.com?subject=BrandHub Demo Request'}
            className="gap-2 px-8"
          >
            <Zap className="h-5 w-5" />
            Get in Touch
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t border-border/30">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {settings.appName}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
