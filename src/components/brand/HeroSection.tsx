import { useState, useRef, useEffect } from 'react';
import { Upload, Image, Pencil, Check } from 'lucide-react';
import { BrandHero } from '@/types/brand';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface HeroSectionProps {
  hero: BrandHero;
  onHeroChange: (hero: BrandHero) => void;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
  fullWidth?: boolean;
}

export const HeroSection = ({ hero, onHeroChange, fullWidth = false }: HeroSectionProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [parallaxOffset, setParallaxOffset] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Parallax scroll effect for hero image
  useEffect(() => {
    const handleScroll = () => {
      if (!heroRef.current) return;
      
      const rect = heroRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      
      // Only apply parallax when hero is in view
      if (rect.bottom > 0 && rect.top < viewportHeight) {
        // Calculate parallax offset based on scroll position
        const scrollProgress = (viewportHeight - rect.top) / (viewportHeight + rect.height);
        const offset = (scrollProgress - 0.5) * 80; // Max 40px movement
        setParallaxOffset(offset);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial calculation

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

      {/* Full-bleed hero container - expands based on fullWidth prop */}
      <div 
        ref={heroRef}
        className={`relative overflow-hidden ${fullWidth ? '-mx-4 sm:-mx-6 lg:-mx-8 xl:-mx-12 2xl:-mx-16' : '-mx-4 sm:-mx-6 lg:-mx-8'}`}
      >
        {/* Cover Image - Full Width with Parallax */}
        <div
          className="relative h-64 sm:h-80 lg:h-96 cursor-pointer group"
          onClick={() => isEditing && coverInputRef.current?.click()}
        >
          {/* Background with gradient fallback - Parallax layer */}
          <div 
            className="absolute inset-0 will-change-transform transition-transform duration-100 ease-out"
            style={{ 
              transform: `translateY(${parallaxOffset}px) scale(1.15)`,
              ...(hero.coverImage ? { 
                backgroundImage: `url(${hero.coverImage})`, 
                backgroundSize: 'cover', 
                backgroundPosition: 'center' 
              } : {
                background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.8) 50%, hsl(var(--accent)) 100%)'
              })
            }}
          />
          
          {/* Overlay gradient for depth */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30" />
          
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          
          {/* Edit button - floating in top right */}
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(!isEditing);
            }}
            className="absolute top-4 right-4 z-20 bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 hover:text-white"
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

          {/* Logo & Content positioned within the hero */}
          <div className="absolute inset-0 flex items-end">
            <div className="w-full px-4 sm:px-6 lg:px-8 pb-8">
              <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-end">
                {/* Logo */}
                <div
                  className={`relative shrink-0 w-28 h-28 sm:w-36 sm:h-36 lg:w-44 lg:h-44 bg-white border-4 border-white rounded-2xl shadow-2xl flex items-center justify-center overflow-hidden ${isEditing ? 'cursor-pointer group/logo' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    isEditing && logoInputRef.current?.click();
                  }}
                >
                  {hero.logoUrl ? (
                    <img src={hero.logoUrl} alt="Logo" className="max-h-full max-w-full object-contain p-4" />
                  ) : (
                    <Image className="h-10 w-10 text-muted-foreground" />
                  )}
                  {isEditing && (
                    <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center opacity-0 group-hover/logo:opacity-100 transition-opacity">
                      <Upload className="h-6 w-6 text-white" />
                    </div>
                  )}
                  
                  {/* Logo glow effect */}
                  <div className="absolute -inset-1 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl blur-xl -z-10" />
                </div>

                {/* Name & Tagline */}
                <div className="flex-1 space-y-2 pb-2">
                  {isEditing ? (
                    <>
                      <Input
                        value={hero.name}
                        onChange={(e) => onHeroChange({ ...hero, name: e.target.value })}
                        placeholder="Brand Name"
                        className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold h-auto py-2 bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-white/50 rounded-lg"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Textarea
                        value={hero.tagline}
                        onChange={(e) => onHeroChange({ ...hero, tagline: e.target.value })}
                        placeholder="Your brand tagline..."
                        className="text-lg sm:text-xl resize-none bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-white/50 rounded-lg min-h-[60px]"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </>
                  ) : (
                    <>
                      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-white drop-shadow-lg tracking-tight">
                        {hero.name || 'Brand Name'}
                      </h1>
                      <p className="text-lg sm:text-xl text-white/90 drop-shadow-md max-w-2xl">
                        {hero.tagline || 'Your brand tagline goes here'}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
