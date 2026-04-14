import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Pencil, Check, TrendingUp, BarChart3, Sparkles, Brain, Loader2, Upload, Image as ImageIcon, Shield } from 'lucide-react';
import { BrandHero } from '@/types/brand';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BackgroundImage } from '@/components/ui/optimized-image';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VideoUploadDialog } from '@/components/ui/video-upload-dialog';
import { HeroEditToolbar } from '@/components/brand/HeroEditToolbar';
import { GradientBarsHero } from '@/components/backgrounds/GradientBarsHero';
import { HorizonGlowHero } from '@/components/backgrounds/HorizonGlowHero';
import { FloatingOrbsHero } from '@/components/backgrounds/FloatingOrbsHero';
import { GradientSpheresHero } from '@/components/backgrounds/GradientSpheresHero';
import { ImageOrbsHero } from '@/components/backgrounds/ImageOrbsHero';
import { ImagePanelsHero } from '@/components/backgrounds/ImagePanelsHero';
import { calculateBrandHealth } from '@/lib/brandHealthCalculator';
import { useExternalSectionCounts } from '@/hooks/useExternalSectionCounts';
import { useStorageUpload } from '@/hooks/useStorageUpload';
import { cn } from '@/lib/utils';
import { ComplianceScoreBadge } from '@/components/dataforce/ComplianceScoreBadge';

interface HeroStats {
  healthScore?: number;
  trend?: 'up' | 'down' | 'stable';
}

interface HeroSectionProps {
  hero: BrandHero;
  onHeroChange?: (hero: BrandHero) => void;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
  fullWidth?: boolean;
  stats?: HeroStats;
  showStats?: boolean;
  enhancedMode?: boolean;
  /** Callback when user clicks the Brain icon in the hero (opens intelligence panel) */
  onOpenIntelligence?: () => void;
  /** Full guide_data for calculating real health score */
  guideData?: Record<string, unknown>;
  /** Entity type for storage upload (brand, event, product) */
  entityType?: 'brand' | 'event' | 'product';
  /** Entity ID for storage upload */
  entityId?: string;
  /** Compliance score to display alongside health */
  complianceScore?: number | null;
  /** Hidden sections excluded from health score */
  hiddenSections?: string[] | null;
  /** Section order from sidebar — used to scope health scoring to visible sections */
  sectionOrder?: string[] | null;
  /** Compact mode — reduces height 50% for card grid view */
  compact?: boolean;
}

export const HeroSection = ({ 
  hero, 
  onHeroChange, 
  fullWidth = false,
  stats,
  showStats = true,
  enhancedMode = true,
  onOpenIntelligence,
  guideData,
  entityType = 'brand',
  entityId,
  complianceScore,
  hiddenSections,
  sectionOrder,
  compact = false,
}: HeroSectionProps) => {
  // Only allow editing if onHeroChange is provided (canEdit mode)
  const canEdit = !!onHeroChange;
  const [isEditing, setIsEditing] = useState(false);
  const [parallaxOffset, setParallaxOffset] = useState(0);
  const [animatedStats, setAnimatedStats] = useState<HeroStats>({});
  const [isVisible, setIsVisible] = useState(false);
  const [videoUploadDialogOpen, setVideoUploadDialogOpen] = useState(false);
  const [pendingVideoFile, setPendingVideoFile] = useState<File | null>(null);
  const [kenBurnsPreview, setKenBurnsPreview] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Storage upload hook for persisting images
  const { uploadFile, isUploading } = useStorageUpload({ 
    entityType, 
    entityId: entityId || (guideData?.id as string) 
  });

  // Fetch external insight source counts for accurate health scoring
  // Use a counter that increments when guideData reference changes to trigger re-fetch
  const refreshCounter = useRef(0);
  const prevGuideRef = useRef(guideData);
  if (guideData !== prevGuideRef.current) {
    prevGuideRef.current = guideData;
    refreshCounter.current += 1;
  }
  const { counts: externalCounts, isLoaded: externalCountsLoaded } = useExternalSectionCounts(entityId, entityType, refreshCounter.current);

  // Calculate real health score from guide_data (excluding hidden sections)
  const calculatedHealth = useMemo(() => {
    return calculateBrandHealth(guideData, hiddenSections, entityType, sectionOrder, externalCounts);
  }, [guideData, hiddenSections, entityType, sectionOrder, externalCounts]);

  // Use calculated health score if guideData provided, otherwise fall back to stats prop
  const displayStats: HeroStats = useMemo(() => {
    if (stats) return stats;
    return {
      healthScore: calculatedHealth.overallScore,
      trend: 'stable' as const,
    };
  }, [stats, calculatedHealth.overallScore]);

  // Animate stats counting up on visibility — only after external data has loaded
  const hasAnimatedRef = useRef(false);
  useEffect(() => {
    if (!isVisible || !showStats || !externalCountsLoaded) return;
    // Don't re-animate if we've already done it — just update to final value
    if (hasAnimatedRef.current) {
      setAnimatedStats({
        healthScore: displayStats.healthScore || 0,
        trend: displayStats.trend,
      });
      return;
    }
    hasAnimatedRef.current = true;

    const duration = 1200;
    const steps = 50;
    const interval = duration / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const easeOut = 1 - Math.pow(1 - progress, 3);

      setAnimatedStats({
        healthScore: Math.round((displayStats.healthScore || 0) * easeOut),
        trend: displayStats.trend,
      });

      if (step >= steps) clearInterval(timer);
    }, interval);

    return () => clearInterval(timer);
  }, [isVisible, showStats, displayStats, externalCountsLoaded]);

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

  // Parallax scroll effect for hero image - disabled on mobile to prevent touch jank
  useEffect(() => {
    // Skip parallax on mobile/touch devices for smoother experience
    const isMobile = window.matchMedia('(max-width: 640px)').matches || 
                     'ontouchstart' in window;
    if (isMobile) {
      setParallaxOffset(0);
      return;
    }

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'coverImage' | 'logoUrl' | 'coverVideo') => {
    if (!onHeroChange) {
      return;
    }
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    // For video files, use the compression dialog
    if (field === 'coverVideo') {
      // Accept any video file regardless of extension
      const isVideo = file.type.startsWith('video/') || 
                      file.name.toLowerCase().endsWith('.mov') ||
                      file.name.toLowerCase().endsWith('.mp4') ||
                      file.name.toLowerCase().endsWith('.webm');
      
      if (!isVideo) {
        const errorMsg = `File "${file.name}" is not a video file. Please select .mov, .mp4, or .webm files.`;
        alert(errorMsg);
        if (videoInputRef.current) {
          videoInputRef.current.value = '';
        }
        return;
      }

      const MAX_VIDEO_SIZE_MB = 14;
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > MAX_VIDEO_SIZE_MB) {
        alert(`Video file is too large (${fileSizeMB.toFixed(1)}MB). Maximum allowed size is ${MAX_VIDEO_SIZE_MB}MB. Please compress or trim your video before uploading.`);
        if (videoInputRef.current) {
          videoInputRef.current.value = '';
        }
        return;
      }

      setPendingVideoFile(file);
      setVideoUploadDialogOpen(true);
      // Reset input for re-selection
      if (videoInputRef.current) {
        videoInputRef.current.value = '';
      }
      return;
    }

    // For images, try to upload to storage first (preferred)
    // Fall back to base64 if storage upload is not available (no entityId)
    const storageEntityId = entityId || (guideData?.id as string);
    
    if (storageEntityId) {
      // Map field to storage file type
      const fileTypeMap: Record<string, 'hero' | 'logo' | 'cover' | 'asset'> = {
        coverImage: 'hero',
        logoUrl: 'logo',
      };
      const fileType = fileTypeMap[field] || 'asset';
      
      const result = await uploadFile(file, fileType);
      if (result) {
        onHeroChange({ ...hero, [field]: result.url });
      }
      // Reset file input
      if (field === 'coverImage' && coverInputRef.current) {
        coverInputRef.current.value = '';
      } else if (field === 'logoUrl' && logoInputRef.current) {
        logoInputRef.current.value = '';
      }
      return;
    }

    // Fallback to base64 for entities without ID (shouldn't happen in practice)
    console.warn('[HeroSection] No entity ID available, falling back to base64 encoding');
    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      onHeroChange({ ...hero, [field]: url });
    };
    reader.onerror = (error) => {
      console.error('[HeroSection] FileReader error:', error);
    };
    reader.readAsDataURL(file);
  };

  const handleVideoReady = useCallback((dataUrl: string) => {
    if (!onHeroChange) return;
    onHeroChange({ ...hero, coverVideo: dataUrl, useVideo: true });
    setPendingVideoFile(null);
  }, [hero, onHeroChange]);

  const handleVideoUrlInput = () => {
    if (!onHeroChange) return;
    const url = prompt('Enter video URL (MP4, WebM, or MOV):');
    if (url) {
      onHeroChange({ ...hero, coverVideo: url, useVideo: true });
    }
  };


  const toggleKenBurns = () => {
    if (!onHeroChange) return;
    onHeroChange({ ...hero, kenBurnsEffect: !hero.kenBurnsEffect, heroEffect: 'none' });
  };

  // Helper to get overlay CSS based on gradient preset
  const getOverlayStyle = (gradient: string): string => {
    switch (gradient) {
      case 'radial-dark':
        return 'radial-gradient(ellipse at center, rgba(0,0,0,0.3), rgba(0,0,0,0.8))';
      case 'top-fade':
        return 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)';
      case 'vignette':
        return 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.8))';
      case 'brand-tint':
        return 'linear-gradient(135deg, hsl(var(--primary) / 0.4), hsl(var(--accent) / 0.3))';
      case 'none':
        return 'transparent';
      default:
        return 'linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0.3), transparent)';
    }
  };

  // Enhanced height for wow factor - reduced on mobile for better viewport fit
  // Compact mode halves the height for card grid view
  const heroHeight = compact
    ? 'h-[160px] sm:h-[210px] lg:h-[275px] xl:h-[325px]'
    : enhancedMode 
      ? 'h-[320px] sm:h-[420px] lg:h-[550px] xl:h-[650px]' 
      : 'h-56 sm:h-72 lg:h-96';

  return (
    <section>
      <input
        ref={coverInputRef}
        type="file"
        accept="image/*"
        data-testid="hero-cover-image-input"
        onChange={(e) => handleFileUpload(e, 'coverImage')}
        className="hidden"
      />
      <input
        ref={videoInputRef}
        type="file"
        data-testid="hero-cover-video-input"
        onChange={(e) => handleFileUpload(e, 'coverVideo')}
        className="hidden"
      />
      <input
        ref={logoInputRef}
        type="file"
        accept="image/*"
        data-testid="hero-logo-input"
        onChange={(e) => handleFileUpload(e, 'logoUrl')}
        className="hidden"
      />

      {/* Full-bleed hero container */}
      <div 
        ref={heroRef}
        className={`relative overflow-hidden ${fullWidth ? '-mx-4 sm:-mx-6 lg:-mx-8 xl:-mx-12 2xl:-mx-16' : '-mx-4 sm:-mx-6 lg:-mx-8'}`}
      >
        {/* Hero Background Effects - rendered when enabled */}
        {(hero.heroEffect === 'gradient-bars' || hero.gradientBarsEffect) && !hero.useVideo && (
          <div className={`absolute inset-0 ${heroHeight} z-0`}>
            <GradientBarsHero 
              intensity={hero.heroEffectIntensity || hero.gradientBarsIntensity || 'medium'}
              colorScheme={(hero.heroEffectColorScheme || hero.gradientBarsColorScheme || 'cyan-purple') as any}
              mode={hero.heroEffectMode || hero.gradientBarsMode || 'dark'}
              brightness={hero.heroEffectBrightness ?? hero.gradientBarsBrightness ?? 50}
              barCount={6}
            />
          </div>
        )}
        {hero.heroEffect === 'horizon-glow' && !hero.useVideo && (
          <div className={`absolute inset-0 ${heroHeight} z-0`}>
            <HorizonGlowHero 
              colorScheme={(hero.heroEffectColorScheme || 'cyan') as any}
              mode={hero.heroEffectMode || 'dark'}
              brightness={hero.heroEffectBrightness ?? 50}
            />
          </div>
        )}
        {hero.heroEffect === 'floating-orbs' && !hero.useVideo && (
          <div className={`absolute inset-0 ${heroHeight} z-0`}>
            <FloatingOrbsHero 
              colorScheme={(hero.heroEffectColorScheme || 'blue-purple') as any}
              mode={hero.heroEffectMode || 'dark'}
              brightness={hero.heroEffectBrightness ?? 50}
              density={hero.heroEffectDensity || 'normal'}
              speed={hero.heroEffectSpeed || 'normal'}
            />
          </div>
        )}
        {hero.heroEffect === 'gradient-spheres' && !hero.useVideo && (
          <div className={`absolute inset-0 ${heroHeight} z-0`}>
            <GradientSpheresHero 
              colorScheme={(hero.heroEffectColorScheme || 'purple-blue') as any}
              mode={hero.heroEffectMode || 'dark'}
              brightness={hero.heroEffectBrightness ?? 50}
              density={hero.heroEffectDensity || 'normal'}
              speed={hero.heroEffectSpeed || 'normal'}
            />
          </div>
        )}
        {hero.heroEffect === 'image-orbs' && !hero.useVideo && (
          <div className={`absolute inset-0 ${heroHeight} z-0`}>
            <ImageOrbsHero 
              colorScheme={(hero.heroEffectColorScheme || 'cyan-purple') as any}
              mode={hero.heroEffectMode || 'dark'}
              brightness={hero.heroEffectBrightness ?? 50}
              orbCount={
                hero.heroEffectDensity === 'few' ? 3 :
                hero.heroEffectDensity === 'many' ? 8 :
                hero.heroEffectDensity === 'dense' ? 12 : 5
              }
            />
          </div>
        )}
        {hero.heroEffect === 'image-panels' && !hero.useVideo && (
          <div className={`absolute inset-0 ${heroHeight} z-0`}>
            <ImagePanelsHero 
              colorScheme={(hero.heroEffectColorScheme || 'purple-cyan') as any}
              mode={hero.heroEffectMode || 'dark'}
              brightness={hero.heroEffectBrightness ?? 50}
              panelCount={5}
            />
          </div>
        )}
        {/* Cover Image/Video - Enhanced Height with Parallax/Ken Burns and optimized loading */}
        {/* Hide when hero effects are active */}
        {(!hero.heroEffect || hero.heroEffect === 'none') && hero.gradientBarsEffect !== true && (
          <BackgroundImage
            src={hero.coverImage || ''}
            videoSrc={hero.useVideo ? hero.coverVideo : undefined}
            preferVideo={hero.useVideo === true}
            kenBurnsEffect={hero.useVideo !== true && (hero.kenBurnsEffect === true || kenBurnsPreview)}
            kenBurnsSpeed={hero.kenBurnsSpeed || 'normal'}
            fallbackSrc=""
            className={`relative ${heroHeight} group`}
            priority={true}
            parallax={hero.kenBurnsEffect !== true && !kenBurnsPreview}
            parallaxOffset={parallaxOffset}
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
            
            {/* Dynamic overlay based on settings */}
            {hero.overlayGradient !== 'none' && (
              <>
                {/* Primary overlay - intensity controlled */}
                <div 
                  className="absolute inset-0 z-10 transition-opacity duration-300 pointer-events-none"
                  style={{
                    background: getOverlayStyle(hero.overlayGradient || 'default'),
                    opacity: (hero.overlayIntensity ?? 50) / 100
                  }}
                />
                {/* Side vignette */}
                <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/40 via-transparent to-black/40 pointer-events-none" style={{ opacity: (hero.overlayIntensity ?? 50) / 100 }} />
                {/* Brand tint accent */}
                <div className="absolute inset-0 z-10 bg-gradient-to-b from-primary/10 via-transparent to-accent/10 mix-blend-overlay pointer-events-none" />
              </>
            )}
            
            {/* Animated ambient glow - hidden on mobile for performance */}
            {enhancedMode && (
              <>
                <div className="hidden sm:block absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse pointer-events-none" />
                <div className="hidden sm:block absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/20 rounded-full blur-[100px] animate-pulse pointer-events-none" style={{ animationDelay: '1s' }} />
              </>
            )}
            
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
            
            {/* Floating particles effect - hidden on mobile */}
            {enhancedMode && (
              <div className="hidden sm:block absolute inset-0 overflow-hidden pointer-events-none">
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
          </BackgroundImage>
        )}

        {/* Height placeholder when hero effects are active (since they use absolute positioning) */}
        {((hero.heroEffect && hero.heroEffect !== 'none') || hero.gradientBarsEffect === true) && !hero.useVideo && (
          <div className={heroHeight} />
        )}

        {/* Edit button - OUTSIDE BackgroundImage for reliable click handling */}
        {canEdit && (
          <Button
            variant="ghost"
            size="icon"
            data-testid="hero-edit-button"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(!isEditing);
            }}
            className="absolute top-4 right-4 z-50 bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 hover:text-white shadow-lg"
          >
            {isEditing ? <Check className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
          </Button>
        )}
        
        {/* Edit overlay with consolidated toolbar - OUTSIDE BackgroundImage */}
        {canEdit && isEditing && (
          <HeroEditToolbar
            useVideo={hero.useVideo === true}
            kenBurnsEffect={hero.kenBurnsEffect === true}
            kenBurnsPreview={kenBurnsPreview}
            kenBurnsSpeed={hero.kenBurnsSpeed || 'normal'}
            heroEffect={hero.heroEffect || (hero.gradientBarsEffect ? 'gradient-bars' : 'none')}
            heroEffectIntensity={hero.heroEffectIntensity || hero.gradientBarsIntensity || 'medium'}
            heroEffectColorScheme={hero.heroEffectColorScheme || hero.gradientBarsColorScheme || 'cyan-purple'}
            heroEffectMode={hero.heroEffectMode || hero.gradientBarsMode || 'dark'}
            heroEffectBrightness={hero.heroEffectBrightness ?? hero.gradientBarsBrightness ?? 50}
            heroEffectDensity={hero.heroEffectDensity || 'normal'}
            heroEffectSpeed={hero.heroEffectSpeed || 'normal'}
            isUploading={isUploading}
            overlayIntensity={hero.overlayIntensity ?? 50}
            overlayGradient={hero.overlayGradient || 'default'}
            parallaxIntensity={hero.parallaxIntensity ?? 1}
            taglineColor={hero.taglineColor || '#ffffff'}
            titleColor={hero.titleColor || '#ffffff'}
            taglineGlow={hero.taglineGlow ?? false}
            onMediaTypeChange={(type) => {
              if (onHeroChange) {
                onHeroChange({ ...hero, useVideo: type === 'video', heroEffect: 'none' });
              }
            }}
            onKenBurnsToggle={() => {
              setKenBurnsPreview(false);
              toggleKenBurns();
            }}
            onKenBurnsPreviewStart={() => {
              if (hero.kenBurnsEffect !== true) {
                setKenBurnsPreview(true);
              }
            }}
            onKenBurnsPreviewEnd={() => setKenBurnsPreview(false)}
            onKenBurnsSpeedChange={(speed) => {
              if (onHeroChange) {
                onHeroChange({ ...hero, kenBurnsSpeed: speed });
              }
            }}
            onHeroEffectChange={(effect) => {
              if (onHeroChange) {
                onHeroChange({ ...hero, heroEffect: effect, gradientBarsEffect: effect === 'gradient-bars' });
              }
            }}
            onHeroEffectIntensityChange={(value) => {
              if (onHeroChange) {
                onHeroChange({ ...hero, heroEffectIntensity: value });
              }
            }}
            onHeroEffectColorSchemeChange={(value) => {
              if (onHeroChange) {
                onHeroChange({ ...hero, heroEffectColorScheme: value });
              }
            }}
            onHeroEffectModeChange={(value) => {
              if (onHeroChange) {
                onHeroChange({ ...hero, heroEffectMode: value });
              }
            }}
            onHeroEffectBrightnessChange={(value) => {
              if (onHeroChange) {
                onHeroChange({ ...hero, heroEffectBrightness: value });
              }
            }}
            onHeroEffectDensityChange={(value) => {
              if (onHeroChange) {
                onHeroChange({ ...hero, heroEffectDensity: value });
              }
            }}
            onHeroEffectSpeedChange={(value) => {
              if (onHeroChange) {
                onHeroChange({ ...hero, heroEffectSpeed: value });
              }
            }}
            onUploadClick={() => {
              if (hero.useVideo) {
                videoInputRef.current?.click();
              } else {
                coverInputRef.current?.click();
              }
            }}
            onVideoUrlClick={handleVideoUrlInput}
            onLibrarySelect={(url) => {
              if (onHeroChange) {
                onHeroChange({ ...hero, coverImage: url });
              }
            }}
            onOverlayIntensityChange={(value) => {
              if (onHeroChange) {
                onHeroChange({ ...hero, overlayIntensity: value });
              }
            }}
            onOverlayGradientChange={(value) => {
              if (onHeroChange) {
                onHeroChange({ ...hero, overlayGradient: value });
              }
            }}
            onParallaxIntensityChange={(value) => {
              if (onHeroChange) {
                onHeroChange({ ...hero, parallaxIntensity: value });
              }
            }}
            onTaglineColorChange={(color) => {
              if (onHeroChange) {
                onHeroChange({ ...hero, taglineColor: color });
              }
            }}
            onTitleColorChange={(color) => {
              if (onHeroChange) {
                onHeroChange({ ...hero, titleColor: color });
              }
            }}
            onTaglineGlowChange={(enabled) => {
              if (onHeroChange) {
                onHeroChange({ ...hero, taglineGlow: enabled });
              }
            }}
          />
        )}

        {/* Stats Panel - Top Left - Hidden in compact mode (moved to right side instead) */}
        {showStats && enhancedMode && !compact && canEdit && (
          <div className="absolute inset-x-0 top-0 z-30 pointer-events-none">
            <div className="w-full px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
              <div className="max-w-7xl mx-auto">
                <div className={`hidden sm:flex flex-col gap-2 w-fit transition-all duration-700 pointer-events-auto ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-2 border border-white/20 shadow-lg cursor-help">
                        <div className="flex items-center gap-1.5">
                          <BarChart3 className="h-4 w-4 text-white" />
                          <span className="text-white/80 text-sm">Health</span>
                        </div>
                        <span className="text-white font-bold">{animatedStats.healthScore || 0}%</span>
                        {displayStats.trend === 'up' && (
                          <TrendingUp className="h-4 w-4 text-green-400" />
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-md max-h-[400px] overflow-y-auto p-3 bg-popover/95 backdrop-blur-sm">
                      <div className="space-y-2">
                        <p className="font-semibold text-sm">Brand Completeness: {calculatedHealth.overallScore}%</p>
                        <p className="text-xs text-muted-foreground">{calculatedHealth.filledSections}/{calculatedHealth.totalSections} sections filled</p>
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs mt-2">
                          {calculatedHealth.breakdown.map((item) => (
                            <div key={item.section} className="flex items-center gap-1">
                              {item.filled ? (
                                <Check className="h-3 w-3 text-green-500 shrink-0" />
                              ) : (
                                <span className="h-3 w-3 rounded-full border border-muted-foreground/30 shrink-0" />
                              )}
                              <span className={item.filled ? 'text-foreground' : 'text-muted-foreground'}>{item.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                  <Badge variant="secondary" className="bg-white/10 backdrop-blur-md border-white/20 text-white w-fit">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Brand Guide Active
                  </Badge>
                  {/* Compliance score pill — always visible */}
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-2 border border-white/20 shadow-lg">
                    <ComplianceScoreBadge score={complianceScore} size="sm" />
                  </div>
                  {/* Brain / Intelligence quick-access */}
                  {onOpenIntelligence && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onOpenIntelligence(); }}
                      className="pointer-events-auto flex items-center gap-1.5 bg-white/10 backdrop-blur-md rounded-full px-4 py-2 border border-white/20 shadow-lg hover:bg-white/20 transition-colors text-white text-sm font-medium cursor-pointer"
                    >
                      <Brain className="h-4 w-4" />
                      <span className="hidden sm:inline">Intelligence</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area - z-20 to be above overlays */}
        <div className="absolute inset-0 flex items-end z-20 pointer-events-none">
          <div className={`w-full px-4 sm:px-6 lg:px-8 ${compact ? 'pb-2 sm:pb-4 lg:pb-6' : 'pb-4 sm:pb-8 lg:pb-12'} pointer-events-auto`}>
            {/* Centered content container matching page max-width */}
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8 items-start lg:items-end justify-between">
              {/* Left: Logo & Brand Info */}
              <div className={`flex ${compact ? 'gap-3 sm:gap-4' : 'gap-4 sm:gap-6'} items-end flex-1`}>
                {/* Logo with enhanced styling - smaller on mobile */}
                <div
                  className={`relative shrink-0 ${compact ? 'w-14 h-14 sm:w-20 sm:h-20 lg:w-28 lg:h-28 xl:w-32 xl:h-32 rounded-xl sm:rounded-2xl border sm:border-2' : 'w-20 h-20 sm:w-32 sm:h-32 lg:w-44 lg:h-44 xl:w-52 xl:h-52 rounded-2xl sm:rounded-3xl border-2 sm:border-4'} bg-white border-white shadow-2xl flex items-center justify-center overflow-hidden transform transition-all duration-300 hover:scale-105 ${canEdit && isEditing ? 'cursor-pointer group/logo' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    canEdit && isEditing && logoInputRef.current?.click();
                  }}
                >
                  {hero.logoUrl ? (
                    <img 
                      src={hero.logoUrl} 
                      alt="Logo" 
                      className="max-h-full max-w-full object-contain p-2 sm:p-4 lg:p-6"
                      loading="eager"
                      decoding="async"
                    />
                  ) : (
                    <div className="text-2xl sm:text-4xl lg:text-6xl font-bold text-muted-foreground/30">
                      {hero.name?.charAt(0) || 'B'}
                    </div>
                  )}
                  {canEdit && isEditing && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/logo:opacity-100 transition-opacity">
                      {isUploading ? (
                        <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 text-white animate-spin" />
                      ) : (
                        <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                      )}
                    </div>
                  )}
                </div>
                
                {/* Brand name and tagline with enhanced typography */}
                <div className="flex flex-col gap-1 sm:gap-3 min-w-0 flex-1 overflow-hidden">
                  {/* Editable title or display */}
                  {canEdit && isEditing ? (
                    <Input
                      value={hero.name || ''}
                      onChange={(e) => onHeroChange && onHeroChange({ ...hero, name: e.target.value })}
                      onClick={(e) => e.stopPropagation()}
                      className="text-xl sm:text-3xl lg:text-5xl xl:text-6xl font-bold border-none bg-transparent focus:bg-white/10 text-white placeholder:text-white/50 p-0 h-auto leading-tight shadow-none"
                      placeholder="Brand Name"
                    />
                  ) : (
                    <h1 
                      className={`${compact ? 'text-lg sm:text-xl lg:text-3xl xl:text-4xl' : 'text-xl sm:text-3xl lg:text-5xl xl:text-6xl'} font-bold drop-shadow-lg tracking-tight break-words transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                      style={{ 
                        color: hero.titleColor || '#ffffff',
                        textShadow: hero.taglineGlow ? `0 0 20px ${hero.titleColor || '#ffffff'}40, 0 0 40px ${hero.titleColor || '#ffffff'}20` : undefined,
                        overflowWrap: 'break-word',
                        wordBreak: 'break-word',
                      }}
                    >
                      {hero.name || 'Brand Name'}
                    </h1>
                  )}
                  
                  {/* Tagline */}
                  {canEdit && isEditing ? (
                    <Textarea
                      value={hero.tagline || ''}
                      onChange={(e) => onHeroChange && onHeroChange({ ...hero, tagline: e.target.value })}
                      onClick={(e) => e.stopPropagation()}
                      className="text-sm sm:text-lg lg:text-2xl border-none bg-transparent focus:bg-white/10 text-white/90 placeholder:text-white/40 p-0 h-auto resize-none shadow-none min-h-[2.5rem]"
                      placeholder="Your brand tagline..."
                      rows={2}
                    />
                  ) : (
                    <>
                      <p 
                        className={`${compact ? 'text-xs sm:text-sm lg:text-lg line-clamp-1' : 'text-sm sm:text-lg lg:text-2xl line-clamp-2 sm:line-clamp-none'} drop-shadow-md max-w-3xl break-words transition-all duration-700 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                        style={{ 
                          color: hero.taglineColor || 'rgba(255,255,255,0.9)',
                          textShadow: hero.taglineGlow ? `0 0 15px ${hero.taglineColor || '#ffffff'}50, 0 0 30px ${hero.taglineColor || '#ffffff'}30` : undefined,
                          overflowWrap: 'break-word',
                          wordBreak: 'break-word',
                        }}
                      >
                        {hero.tagline || 'Your brand tagline goes here'}
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Right: Compact stats panel in card view mode */}
              {compact && showStats && canEdit && (
                <div className={`hidden sm:flex flex-col gap-1.5 items-end shrink-0 transition-all duration-700 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/20 shadow-lg cursor-help">
                        <BarChart3 className="h-3.5 w-3.5 text-white" />
                        <span className="text-white/80 text-xs">Health</span>
                        <span className="text-white font-bold text-xs">{animatedStats.healthScore || 0}%</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="max-w-xs p-3 bg-popover/95 backdrop-blur-sm">
                      <div className="space-y-2">
                        <p className="font-semibold text-sm">Brand Completeness: {calculatedHealth.overallScore}%</p>
                        <p className="text-xs text-muted-foreground">{calculatedHealth.filledSections}/{calculatedHealth.totalSections} sections filled</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                  <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/20 shadow-lg">
                    <ComplianceScoreBadge score={complianceScore} size="sm" />
                  </div>
                  <Badge variant="secondary" className="bg-white/10 backdrop-blur-md border-white/20 text-white text-[10px] px-2 py-0.5">
                    <Sparkles className="h-2.5 w-2.5 mr-1" />
                    Active
                  </Badge>
                  {onOpenIntelligence && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onOpenIntelligence(); }}
                      className="flex items-center gap-1 bg-white/10 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/20 shadow-lg hover:bg-white/20 transition-colors text-white text-xs cursor-pointer"
                    >
                      <Brain className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              )}

              </div>
            </div>
          </div>
        </div>
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

      {/* Video upload dialog with compression */}
      <VideoUploadDialog
        open={videoUploadDialogOpen}
        onOpenChange={setVideoUploadDialogOpen}
        onVideoReady={handleVideoReady}
        file={pendingVideoFile}
      />
    </section>
  );
};
