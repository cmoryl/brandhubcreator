import { useState, useRef, useEffect } from 'react';
import { Upload, Image, Pencil, Check, TrendingUp, Eye, Users, Share2, Heart, BarChart3, Sparkles, Brain } from 'lucide-react';
import { BrandHero } from '@/types/brand';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BackgroundImage } from '@/components/ui/optimized-image';

interface HeroStats {
  views?: number;
  shares?: number;
  followers?: number;
  engagement?: number;
  healthScore?: number;
  trend?: 'up' | 'down' | 'stable';
}

interface HeroSectionProps {
  hero: BrandHero;
  onHeroChange: (hero: BrandHero) => void;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
  fullWidth?: boolean;
  stats?: HeroStats;
  showStats?: boolean;
  enhancedMode?: boolean;
  /** Callback when user clicks the Brain icon in the hero (opens intelligence panel) */
  onOpenIntelligence?: () => void;
}

export const HeroSection = ({ 
  hero, 
  onHeroChange, 
  fullWidth = false,
  stats,
  showStats = true,
  enhancedMode = true,
  onOpenIntelligence,
}: HeroSectionProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [parallaxOffset, setParallaxOffset] = useState(0);
  const [animatedStats, setAnimatedStats] = useState<HeroStats>({});
  const [isVisible, setIsVisible] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Default stats for demo
  const displayStats: HeroStats = stats || {
    views: 12453,
    shares: 847,
    followers: 3241,
    engagement: 78,
    healthScore: 85,
    trend: 'up',
  };

  // Animate stats counting up on visibility
  useEffect(() => {
    if (!isVisible || !showStats) return;

    const duration = 1500;
    const steps = 60;
    const interval = duration / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const easeOut = 1 - Math.pow(1 - progress, 3);

      setAnimatedStats({
        views: Math.round((displayStats.views || 0) * easeOut),
        shares: Math.round((displayStats.shares || 0) * easeOut),
        followers: Math.round((displayStats.followers || 0) * easeOut),
        engagement: Math.round((displayStats.engagement || 0) * easeOut),
        healthScore: Math.round((displayStats.healthScore || 0) * easeOut),
        trend: displayStats.trend,
      });

      if (step >= steps) clearInterval(timer);
    }, interval);

    return () => clearInterval(timer);
  }, [isVisible, showStats, displayStats]);

  // Intersection observer for visibility
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (heroRef.current) {
      observer.observe(heroRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Parallax scroll effect for hero image
  useEffect(() => {
    const handleScroll = () => {
      if (!heroRef.current) return;
      
      const rect = heroRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      
      if (rect.bottom > 0 && rect.top < viewportHeight) {
        const scrollProgress = (viewportHeight - rect.top) / (viewportHeight + rect.height);
        const offset = (scrollProgress - 0.5) * 80;
        setParallaxOffset(offset);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'coverImage' | 'logoUrl') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      onHeroChange({ ...hero, [field]: url });
    };
    reader.readAsDataURL(file);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Enhanced height for wow factor
  const heroHeight = enhancedMode 
    ? 'h-[420px] sm:h-[500px] lg:h-[600px] xl:h-[700px]' 
    : 'h-64 sm:h-80 lg:h-96';

  return (
    <section>
      <input
        ref={coverInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFileUpload(e, 'coverImage')}
        className="hidden"
      />
      <input
        ref={logoInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFileUpload(e, 'logoUrl')}
        className="hidden"
      />

      {/* Full-bleed hero container */}
      <div 
        ref={heroRef}
        className={`relative overflow-hidden ${fullWidth ? '-mx-4 sm:-mx-6 lg:-mx-8 xl:-mx-12 2xl:-mx-16' : '-mx-4 sm:-mx-6 lg:-mx-8'}`}
      >
        {/* Cover Image - Enhanced Height with Parallax and optimized loading */}
        <BackgroundImage
          src={hero.coverImage || ''}
          fallbackSrc=""
          className={`relative ${heroHeight} cursor-pointer group`}
          priority={true}
          parallax={true}
          parallaxOffset={parallaxOffset}
          onClick={() => isEditing && coverInputRef.current?.click()}
        >
          {/* Fallback gradient when no image */}
          {!hero.coverImage && (
            <div 
              className="absolute inset-0 -z-10"
              style={{
                background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.8) 50%, hsl(var(--accent)) 100%)'
              }}
            />
          )}
          
          {/* Multi-layer overlays for depth - z-10 to be above background, below content */}
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/40 via-transparent to-black/40" />
          <div className="absolute inset-0 z-10 bg-gradient-to-b from-primary/10 via-transparent to-accent/10 mix-blend-overlay" />
          
          {/* Animated ambient glow */}
          {enhancedMode && (
            <>
              <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse" />
              <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
            </>
          )}
          
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          
          {/* Floating particles effect */}
          {enhancedMode && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-white/20 rounded-full animate-float"
                  style={{
                    left: `${15 + i * 15}%`,
                    top: `${20 + (i % 3) * 25}%`,
                    animationDelay: `${i * 0.5}s`,
                    animationDuration: `${3 + i * 0.5}s`,
                  }}
                />
              ))}
            </div>
          )}
          
          {/* Edit button - z-30 to be above everything */}
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(!isEditing);
            }}
            className="absolute top-4 right-4 z-30 bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 hover:text-white shadow-lg"
          >
            {isEditing ? <Check className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
          </Button>
          
          {/* Edit overlay */}
          {isEditing && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <div className="text-white flex items-center gap-2 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full border border-white/20">
                <Upload className="h-5 w-5" />
                <span className="font-medium">Upload Cover Image</span>
              </div>
            </div>
          )}

          {/* Stats Panel - Top Left - z-20 to be above overlays */}
          {showStats && enhancedMode && (
            <div className={`absolute top-4 left-4 sm:top-6 sm:left-6 z-20 flex flex-col gap-2 transition-all duration-700 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-2 border border-white/20 shadow-lg">
                <div className="flex items-center gap-1.5">
                  <BarChart3 className="h-4 w-4 text-white" />
                  <span className="text-white/80 text-sm">Health</span>
                </div>
                <span className="text-white font-bold">{animatedStats.healthScore || 0}%</span>
                {displayStats.trend === 'up' && (
                  <TrendingUp className="h-4 w-4 text-green-400" />
                )}
              </div>
              <Badge variant="secondary" className="bg-white/10 backdrop-blur-md border-white/20 text-white w-fit">
                <Sparkles className="h-3 w-3 mr-1" />
                Brand Guide Active
              </Badge>
              {/* Brain / Intelligence quick-access */}
              {onOpenIntelligence && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onOpenIntelligence(); }}
                  className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md rounded-full px-4 py-2 border border-white/20 shadow-lg hover:bg-white/20 transition-colors text-white text-sm font-medium"
                >
                  <Brain className="h-4 w-4" />
                  <span className="hidden sm:inline">Intelligence</span>
                </button>
              )}
            </div>
          )}

          {/* Main Content Area - z-20 to be above overlays */}
          <div className="absolute inset-0 flex items-end z-20">
            <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 pb-6 sm:pb-8 lg:pb-12">
              <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start lg:items-end justify-between">
                {/* Left: Logo & Brand Info */}
                <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-end flex-1">
                  {/* Logo with enhanced styling */}
                  <div
                    className={`relative shrink-0 w-28 h-28 sm:w-36 sm:h-36 lg:w-48 lg:h-48 xl:w-56 xl:h-56 bg-white border-4 border-white rounded-3xl shadow-2xl flex items-center justify-center overflow-hidden transform transition-all duration-300 hover:scale-105 ${isEditing ? 'cursor-pointer group/logo' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      isEditing && logoInputRef.current?.click();
                    }}
                  >
                    {hero.logoUrl ? (
                      <img 
                        src={hero.logoUrl} 
                        alt="Logo" 
                        className="max-h-full max-w-full object-contain p-4 lg:p-6"
                        loading="eager"
                        decoding="async"
                      />
                    ) : (
                      <Image className="h-12 w-12 lg:h-16 lg:w-16 text-muted-foreground" />
                    )}
                    {isEditing && (
                      <div className="absolute inset-0 bg-black/50 rounded-3xl flex items-center justify-center opacity-0 group-hover/logo:opacity-100 transition-opacity">
                        <Upload className="h-8 w-8 text-white" />
                      </div>
                    )}
                    
                    {/* Logo glow effect */}
                    <div className="absolute -inset-2 bg-gradient-to-br from-primary/30 to-accent/30 rounded-3xl blur-2xl -z-10 animate-pulse" />
                  </div>

                  {/* Name & Tagline */}
                  <div className="flex-1 space-y-3 pb-2">
                    {isEditing ? (
                      <>
                        <Input
                          value={hero.name}
                          onChange={(e) => onHeroChange({ ...hero, name: e.target.value })}
                          placeholder="Brand Name"
                          className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-serif font-bold h-auto py-2 bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-white/50 rounded-xl"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Textarea
                          value={hero.tagline}
                          onChange={(e) => onHeroChange({ ...hero, tagline: e.target.value })}
                          placeholder="Your brand tagline..."
                          className="text-lg sm:text-xl lg:text-2xl resize-none bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-white/50 rounded-xl min-h-[80px]"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </>
                    ) : (
                      <>
                        <h1 className={`text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-serif font-bold text-white drop-shadow-lg tracking-tight transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                          {hero.name || 'Brand Name'}
                        </h1>
                        <p className={`text-lg sm:text-xl lg:text-2xl text-white/90 drop-shadow-md max-w-3xl transition-all duration-700 delay-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                          {hero.tagline || 'Your brand tagline goes here'}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Right: Social & Engagement Stats */}
                {showStats && enhancedMode && (
                  <div className={`flex flex-wrap lg:flex-col gap-3 lg:gap-4 transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-2xl px-5 py-3 border border-white/20 shadow-lg hover:bg-white/15 transition-colors">
                      <div className="p-2 bg-white/20 rounded-xl">
                        <Eye className="h-5 w-5 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="text-white font-bold text-lg">{formatNumber(animatedStats.views || 0)}</p>
                        <p className="text-white/70 text-xs">Views</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-2xl px-5 py-3 border border-white/20 shadow-lg hover:bg-white/15 transition-colors">
                      <div className="p-2 bg-white/20 rounded-xl">
                        <Users className="h-5 w-5 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="text-white font-bold text-lg">{formatNumber(animatedStats.followers || 0)}</p>
                        <p className="text-white/70 text-xs">Followers</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-2xl px-5 py-3 border border-white/20 shadow-lg hover:bg-white/15 transition-colors">
                      <div className="p-2 bg-white/20 rounded-xl">
                        <Share2 className="h-5 w-5 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="text-white font-bold text-lg">{formatNumber(animatedStats.shares || 0)}</p>
                        <p className="text-white/70 text-xs">Shares</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 bg-gradient-to-r from-pink-500/20 to-rose-500/20 backdrop-blur-md rounded-2xl px-5 py-3 border border-pink-400/30 shadow-lg hover:from-pink-500/30 hover:to-rose-500/30 transition-colors">
                      <div className="p-2 bg-pink-500/30 rounded-xl">
                        <Heart className="h-5 w-5 text-pink-300" />
                      </div>
                      <div className="text-left">
                        <p className="text-white font-bold text-lg">{animatedStats.engagement || 0}%</p>
                        <p className="text-pink-200/80 text-xs">Engagement</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </BackgroundImage>
      </div>
      
      {/* Floating animation keyframes */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.3; }
          50% { transform: translateY(-30px) rotate(180deg); opacity: 0.7; }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
};
