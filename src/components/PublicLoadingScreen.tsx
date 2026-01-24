import { useState, useEffect, forwardRef } from 'react';
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
  type: 'brand' | 'product' | 'portal' | 'event';
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

// Helper to get display text for loading screen
function getLoadingText(type: 'brand' | 'product' | 'portal' | 'event', name?: string): { title: string; subtitle: string } {
  if (name) {
    return {
      title: `Loading ${name}...`,
      subtitle: type === 'portal' 
        ? 'Preparing your brand portal'
        : type === 'event'
        ? `Preparing ${name} event kit`
        : `Preparing ${name} brand guidelines`
    };
  }
  
  switch (type) {
    case 'portal':
      return { title: 'Loading Portal...', subtitle: 'Preparing your brand portal' };
    case 'product':
      return { title: 'Loading Product Guide...', subtitle: 'Preparing product guidelines' };
    case 'event':
      return { title: 'Loading Event Kit...', subtitle: 'Preparing event brand kit' };
    default:
      return { title: 'Loading Brand Guide...', subtitle: 'Preparing brand guidelines' };
  }
}

export const PublicLoadingScreen = forwardRef<HTMLDivElement, PublicLoadingScreenProps>(function PublicLoadingScreen({ type, name }, ref) {
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
    <div ref={ref} className="min-h-screen min-h-[100dvh] bg-gradient-to-b from-background via-background to-muted/30 flex flex-col">
      {/* Header - Mobile optimized */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm safe-area-inset-top">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src={logo} 
              alt="BrandHUB" 
              className="h-7 sm:h-8 w-7 sm:w-8 object-contain" 
            />
            <span className="font-semibold text-foreground">
              Brand<span className="text-accent">HUB</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1.5 text-muted-foreground text-xs sm:text-sm">
              <Book className="h-3 w-3" />
              <span className="hidden sm:inline">
                {type === 'portal' 
                  ? 'Brand Portal' 
                  : `Public ${type === 'brand' ? 'Brand' : 'Product'} Guide`
                }
              </span>
              <span className="sm:hidden">
                {type === 'portal' ? 'Portal' : type === 'brand' ? 'Brand' : 'Product'}
              </span>
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content - Mobile optimized */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 sm:py-12">
        <div className="text-center max-w-2xl mx-auto">
          {/* Animated Logo - Smaller on mobile */}
          <div className="relative mb-6 sm:mb-8">
            <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto relative">
              {/* Outer ring */}
              <div className="absolute inset-0 rounded-2xl border-2 border-accent/20 animate-[spin_8s_linear_infinite]" />
              {/* Middle ring */}
              <div className="absolute inset-2 rounded-xl border-2 border-primary/30 animate-[spin_6s_linear_infinite_reverse]" />
              {/* Inner content - TP Logo */}
              <div className="absolute inset-4 bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg flex items-center justify-center">
                <img 
                  src={logo} 
                  alt="BrandHUB" 
                  className="h-8 w-8 sm:h-10 sm:w-10 object-contain" 
                />
              </div>
            </div>
            {/* Floating elements - Hidden on small screens for performance */}
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-primary/20 rounded-full animate-bounce hidden sm:block" style={{ animationDelay: '0.1s' }} />
            <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-accent/30 rounded-full animate-bounce hidden sm:block" style={{ animationDelay: '0.3s' }} />
            <div className="absolute top-1/2 -right-4 w-2 h-2 bg-primary/40 rounded-full animate-bounce hidden sm:block" style={{ animationDelay: '0.5s' }} />
          </div>

          {/* Loading Text */}
          <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-foreground mb-2">
            {getLoadingText(type, name).title.replace('...', '')}{dots}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8">
            {getLoadingText(type, name).subtitle}
          </p>

          {/* Progress Indicator */}
          <div className="w-48 sm:w-64 mx-auto mb-6 sm:mb-8">
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary via-accent to-primary animate-[shimmer_2s_ease-in-out_infinite] bg-[length:200%_100%]" />
            </div>
          </div>

          {/* Rotating Tips - Mobile optimized */}
          <div className="bg-card/50 backdrop-blur border border-border rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 transition-all duration-500">
            <div className="flex items-center justify-center gap-2 sm:gap-3 text-left">
              <div className="p-1.5 sm:p-2 bg-accent/10 rounded-lg shrink-0">
                <CurrentTipIcon className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground animate-fade-in">
                {shuffledTips[currentTip].text}
              </p>
            </div>
            {/* Tip indicators */}
            <div className="flex justify-center gap-1.5 mt-3 sm:mt-4">
              {shuffledTips.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === currentTip ? 'w-5 sm:w-6 bg-accent' : 'w-1.5 bg-muted-foreground/30'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* FAQs Section - appears after delay, hidden on very small screens */}
          <div className={`transition-all duration-500 hidden sm:block ${showFaqs ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="border-t border-border pt-6 sm:pt-8">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-4">
                <HelpCircle className="h-4 w-4" />
                <span>Quick FAQs while you wait</span>
              </div>
              <div className="grid gap-2 sm:gap-3 text-left max-w-md mx-auto">
                {shuffledFaqs.map((faq, i) => (
                  <div key={i} className="bg-muted/30 rounded-lg p-2.5 sm:p-3">
                    <p className="text-xs sm:text-sm font-medium text-foreground">{faq.question}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 sm:mt-1">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Links - Mobile optimized */}
      <footer className="border-t border-border/50 bg-background/80 backdrop-blur-sm py-3 sm:py-4 safe-area-inset-bottom">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-sm">
            <Button variant="ghost" size="sm" className="gap-1.5 sm:gap-2 h-9 touch-manipulation" onClick={() => navigate('/')}>
              <ArrowRight className="h-3 w-3 rotate-180" />
              <span className="text-xs sm:text-sm">Browse All</span>
            </Button>
            <div className="h-4 w-px bg-border hidden sm:block" />
            <Button variant="ghost" size="sm" className="gap-1.5 sm:gap-2 h-9 touch-manipulation" onClick={() => navigate('/contact')}>
              <Mail className="h-3 w-3" />
              <span className="text-xs sm:text-sm">Contact</span>
            </Button>
            <div className="h-4 w-px bg-border hidden sm:block" />
            <Button variant="ghost" size="sm" className="gap-1.5 sm:gap-2 h-9 touch-manipulation" onClick={() => navigate('/auth')}>
              <ExternalLink className="h-3 w-3" />
              <span className="text-xs sm:text-sm">Sign In</span>
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
});

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
