import { useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { ArrowLeft, Building2, Users, Globe, Brain, Layers, TrendingUp, Sparkles, Shield, Zap } from 'lucide-react';
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

      {/* Hero Section */}
      <section className="relative py-16 sm:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/10 to-primary/5" />
        <div className="absolute inset-0 hidden sm:block">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        
        <div className="relative max-w-4xl mx-auto text-center">
          <Badge variant="secondary" className="mb-4 gap-1">
            <Building2 className="h-3 w-3" />
            About BrandHub
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-bold text-foreground mb-6">
            The Modern Platform for
            <span className="block text-accent">Living Brand Guidelines</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            BrandHub transforms static brand guidelines into dynamic, intelligent brand ecosystems 
            that grow and evolve with your organization.
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 border-y border-border/30 bg-muted/20">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-primary mb-2">500+</div>
              <p className="text-sm sm:text-base text-muted-foreground">Brand Guides</p>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-primary mb-2">50+</div>
              <p className="text-sm sm:text-base text-muted-foreground">Organizations</p>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-primary mb-2">25+</div>
              <p className="text-sm sm:text-base text-muted-foreground">Sections</p>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-primary mb-2">∞</div>
              <p className="text-sm sm:text-base text-muted-foreground">Possibilities</p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">Our Mission</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              To empower organizations with intelligent brand management tools that ensure 
              consistency, foster collaboration, and drive brand growth.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6 border-border/50 hover:border-accent/30 transition-colors">
              <div className="p-3 bg-accent/10 rounded-xl w-fit mb-4">
                <Brain className="h-6 w-6 text-accent" />
              </div>
              <h3 className="font-semibold text-lg text-foreground mb-2">Intelligent by Design</h3>
              <p className="text-muted-foreground">
                Our AI-powered Brand Brain learns from every update, providing insights, 
                recommendations, and health scores to keep your brand thriving.
              </p>
            </Card>
            
            <Card className="p-6 border-border/50 hover:border-accent/30 transition-colors">
              <div className="p-3 bg-primary/10 rounded-xl w-fit mb-4">
                <Layers className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg text-foreground mb-2">Hierarchical Structure</h3>
              <p className="text-muted-foreground">
                Manage complex brand architectures with parent brands, sub-brands, 
                product lines, and event kits all interconnected and consistent.
              </p>
            </Card>
            
            <Card className="p-6 border-border/50 hover:border-accent/30 transition-colors">
              <div className="p-3 bg-green-500/10 rounded-xl w-fit mb-4">
                <Globe className="h-6 w-6 text-green-500" />
              </div>
              <h3 className="font-semibold text-lg text-foreground mb-2">Public Portals</h3>
              <p className="text-muted-foreground">
                Share your brand guidelines with stakeholders through beautiful, 
                customizable public portals—no login required for viewers.
              </p>
            </Card>
            
            <Card className="p-6 border-border/50 hover:border-accent/30 transition-colors">
              <div className="p-3 bg-orange-500/10 rounded-xl w-fit mb-4">
                <Users className="h-6 w-6 text-orange-500" />
              </div>
              <h3 className="font-semibold text-lg text-foreground mb-2">Team Collaboration</h3>
              <p className="text-muted-foreground">
                Real-time collaboration with role-based access, activity logging, 
                and version control to keep everyone aligned.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Why BrandHub Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-muted/20 border-y border-border/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">Why Choose BrandHub?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We're not just a brand guide creator—we're your brand's intelligent partner.
            </p>
          </div>
          
          <div className="space-y-6">
            <div className="flex gap-4 items-start">
              <div className="p-2 bg-accent/10 rounded-lg shrink-0">
                <Sparkles className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">AI-Powered Insights</h3>
                <p className="text-muted-foreground">
                  Get real-time brand health scores, market analysis, competitor insights, 
                  and growth recommendations powered by advanced AI.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4 items-start">
              <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Comprehensive Analytics</h3>
                <p className="text-muted-foreground">
                  Track brand performance, consistency scores, and team activity with 
                  detailed analytics and reporting dashboards.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4 items-start">
              <div className="p-2 bg-green-500/10 rounded-lg shrink-0">
                <Shield className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Enterprise Security</h3>
                <p className="text-muted-foreground">
                  Role-based access control, audit logging, and secure data handling 
                  to meet enterprise compliance requirements.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4 items-start">
              <div className="p-2 bg-orange-500/10 rounded-lg shrink-0">
                <Zap className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Rapid Deployment</h3>
                <p className="text-muted-foreground">
                  Get started in minutes with intuitive setup, guided onboarding, 
                  and templates to accelerate your brand documentation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
            Ready to elevate your brand?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Contact our team to learn how BrandHub can transform your brand management.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => window.location.href = 'mailto:support@brandhub.com?subject=BrandHub Inquiry'}
              className="gap-2"
            >
              Contact Us
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={() => navigate('/')}
              className="gap-2"
            >
              Explore Demo Guides
            </Button>
          </div>
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
