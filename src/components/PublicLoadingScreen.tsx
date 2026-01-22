import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { 
  Palette, 
  Type, 
  Image, 
  FileImage, 
  HelpCircle,
  ArrowRight,
  Book,
  Mail,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import tpLogoWhite from '@/assets/tp-logo-white.svg';
import tpLogoColor from '@/assets/tp-logo-color.svg';

interface PublicLoadingScreenProps {
  type: 'brand' | 'product' | 'portal';
  name?: string;
  organizationName?: string;
}

const loadingTips = [
  { icon: Palette, text: "Brand guidelines ensure visual consistency across all touchpoints" },
  { icon: Type, text: "Typography choices reflect brand personality and improve readability" },
  { icon: Image, text: "Professional imagery strengthens brand recognition" },
  { icon: FileImage, text: "Logo usage guidelines prevent brand misrepresentation" },
];

const faqs = [
  {
    question: "What is a brand guide?",
    answer: "A comprehensive document that defines visual and verbal identity standards."
  },
  {
    question: "Why are brand guidelines important?",
    answer: "They ensure consistency across all marketing materials and touchpoints."
  },
  {
    question: "Can I download assets?",
    answer: "Yes! Public guides allow you to download logos, colors, and more."
  },
];

export function PublicLoadingScreen({ type, name }: PublicLoadingScreenProps) {
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();
  const [currentTip, setCurrentTip] = useState(0);
  const [dots, setDots] = useState('');
  const [showFaqs, setShowFaqs] = useState(false);
  
  const logo = resolvedTheme === 'dark' ? tpLogoWhite : tpLogoColor;
  
  // Shuffle tips on mount for variety
  const [shuffledTips] = useState(() => [...loadingTips].sort(() => Math.random() - 0.5));
  const [shuffledFaqs] = useState(() => [...faqs].sort(() => Math.random() - 0.5));

  // Rotate tips every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % shuffledTips.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [shuffledTips.length]);

  // Animate loading dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Show FAQs after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowFaqs(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const CurrentTipIcon = shuffledTips[currentTip].icon;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30 flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src={logo} 
              alt="BrandHUB" 
              className="h-8 w-8 object-contain" 
            />
            <span className="font-semibold text-foreground">
              Brand<span className="text-accent">HUB</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1.5 text-muted-foreground">
              <Book className="h-3 w-3" />
              {type === 'portal' 
                ? 'Brand Portal' 
                : `Public ${type === 'brand' ? 'Brand' : 'Product'} Guide`
              }
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="text-center max-w-2xl mx-auto">
          {/* Animated Logo */}
          <div className="relative mb-8">
            <div className="w-24 h-24 mx-auto relative">
              {/* Outer ring */}
              <div className="absolute inset-0 rounded-2xl border-2 border-accent/20 animate-[spin_8s_linear_infinite]" />
              {/* Middle ring */}
              <div className="absolute inset-2 rounded-xl border-2 border-primary/30 animate-[spin_6s_linear_infinite_reverse]" />
              {/* Inner content - TP Logo */}
              <div className="absolute inset-4 bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg flex items-center justify-center">
                <img 
                  src={logo} 
                  alt="BrandHUB" 
                  className="h-10 w-10 object-contain" 
                />
              </div>
            </div>
            {/* Floating elements */}
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-primary/20 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
            <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-accent/30 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
            <div className="absolute top-1/2 -right-4 w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }} />
          </div>

          {/* Loading Text */}
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground mb-2">
            Loading TransPerfect{' '}
            {type === 'portal' ? 'Portal' : type === 'brand' ? 'Brand Guide' : 'Product Guide'}{dots}
          </h1>
          <p className="text-muted-foreground mb-8">
            {name 
              ? `Preparing ${name}`
              : type === 'portal' 
                ? 'Preparing your brand portal experience'
                : `Preparing your ${type} guidelines experience`
            }
          </p>

          {/* Progress Indicator */}
          <div className="w-64 mx-auto mb-8">
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary via-accent to-primary animate-[shimmer_2s_ease-in-out_infinite] bg-[length:200%_100%]" />
            </div>
          </div>

          {/* Rotating Tips */}
          <div className="bg-card/50 backdrop-blur border border-border rounded-xl p-6 mb-8 transition-all duration-500">
            <div className="flex items-center justify-center gap-3 text-left">
              <div className="p-2 bg-accent/10 rounded-lg shrink-0">
                <CurrentTipIcon className="h-5 w-5 text-accent" />
              </div>
              <p className="text-sm text-muted-foreground animate-fade-in">
                {shuffledTips[currentTip].text}
              </p>
            </div>
            {/* Tip indicators */}
            <div className="flex justify-center gap-1.5 mt-4">
              {shuffledTips.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === currentTip ? 'w-6 bg-accent' : 'w-1.5 bg-muted-foreground/30'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* FAQs Section - appears after delay */}
          <div className={`transition-all duration-500 ${showFaqs ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="border-t border-border pt-8">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-4">
                <HelpCircle className="h-4 w-4" />
                <span>Quick FAQs while you wait</span>
              </div>
              <div className="grid gap-3 text-left max-w-md mx-auto">
                {shuffledFaqs.map((faq, i) => (
                  <div key={i} className="bg-muted/30 rounded-lg p-3">
                    <p className="text-sm font-medium text-foreground">{faq.question}</p>
                    <p className="text-xs text-muted-foreground mt-1">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Links */}
      <footer className="border-t border-border/50 bg-background/80 backdrop-blur-sm py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
            <Button variant="ghost" size="sm" className="gap-2" onClick={() => navigate('/')}>
              <ArrowRight className="h-3 w-3 rotate-180" />
              Browse All Guides
            </Button>
            <div className="h-4 w-px bg-border hidden sm:block" />
            <Button variant="ghost" size="sm" className="gap-2" onClick={() => navigate('/contact')}>
              <Mail className="h-3 w-3" />
              Contact Us
            </Button>
            <div className="h-4 w-px bg-border hidden sm:block" />
            <Button variant="ghost" size="sm" className="gap-2" onClick={() => navigate('/auth')}>
              <ExternalLink className="h-3 w-3" />
              Create Your Own
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Compact version for inline use
export function PublicLoadingInline({ type }: { type: 'brand' | 'product' }) {
  const { resolvedTheme } = useTheme();
  const logo = resolvedTheme === 'dark' ? tpLogoWhite : tpLogoColor;
  
  return (
    <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
      <div className="relative mb-6">
        <div className="w-16 h-16 relative">
          <div className="absolute inset-0 rounded-xl border-2 border-accent/20 animate-[spin_4s_linear_infinite]" />
          <div className="absolute inset-2 bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg flex items-center justify-center">
            <img 
              src={logo} 
              alt="BrandHUB" 
              className="h-8 w-8 object-contain animate-pulse" 
            />
          </div>
        </div>
      </div>
      <p className="text-muted-foreground text-sm">Loading TransPerfect {type === 'brand' ? 'Brand Guide' : 'Product Guide'}...</p>
    </div>
  );
}
