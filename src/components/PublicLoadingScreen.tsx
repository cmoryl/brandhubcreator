import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
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

interface PublicLoadingScreenProps {
  type: 'brand' | 'product';
  name?: string;
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
  const [currentTip, setCurrentTip] = useState(0);
  const [dots, setDots] = useState('');
  const [showFaqs, setShowFaqs] = useState(false);

  // Rotate tips every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % loadingTips.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

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

  const CurrentTipIcon = loadingTips[currentTip].icon;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30 flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent/10 rounded-xl animate-pulse">
              <Sparkles className="h-5 w-5 text-accent" />
            </div>
            <span className="font-serif font-semibold text-foreground">BrandHub</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1.5 text-muted-foreground">
              <Book className="h-3 w-3" />
              Public {type === 'brand' ? 'Brand' : 'Product'} Guide
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
              {/* Inner content */}
              <div className="absolute inset-4 bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-accent animate-pulse" />
              </div>
            </div>
            {/* Floating elements */}
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-primary/20 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
            <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-accent/30 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
            <div className="absolute top-1/2 -right-4 w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }} />
          </div>

          {/* Loading Text */}
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground mb-2">
            {name ? `Loading ${name}` : `Loading ${type} guide`}{dots}
          </h1>
          <p className="text-muted-foreground mb-8">
            Preparing your {type} guidelines experience
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
                {loadingTips[currentTip].text}
              </p>
            </div>
            {/* Tip indicators */}
            <div className="flex justify-center gap-1.5 mt-4">
              {loadingTips.map((_, i) => (
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
                {faqs.map((faq, i) => (
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
  return (
    <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
      <div className="relative mb-6">
        <div className="w-16 h-16 relative">
          <div className="absolute inset-0 rounded-xl border-2 border-accent/20 animate-[spin_4s_linear_infinite]" />
          <div className="absolute inset-2 bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-accent animate-pulse" />
          </div>
        </div>
      </div>
      <p className="text-muted-foreground text-sm">Loading {type} guide...</p>
    </div>
  );
}
