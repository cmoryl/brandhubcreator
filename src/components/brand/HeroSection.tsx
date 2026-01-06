import { useState, useRef } from 'react';
import { Pencil, Check, Upload, Image } from 'lucide-react';
import { BrandHero } from '@/types/brand';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface HeroSectionProps {
  hero: BrandHero;
  onHeroChange: (hero: BrandHero) => void;
}

export const HeroSection = ({ hero, onHeroChange }: HeroSectionProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

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
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-semibold text-foreground">Identity Shield</h2>
          <p className="text-muted-foreground mt-1">The primary retinal handshake - your brand's first impression</p>
        </div>
        <Button
          variant={isEditing ? "default" : "outline"}
          size="sm"
          onClick={() => setIsEditing(!isEditing)}
          className="gap-2"
        >
          {isEditing ? <Check className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
          {isEditing ? 'Done' : 'Edit'}
        </Button>
      </div>

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

      <div className="relative rounded-2xl overflow-hidden border border-border bg-card">
        {/* Cover Image */}
        <div
          className="h-48 sm:h-64 bg-gradient-to-br from-primary/20 to-accent/20 relative cursor-pointer group"
          onClick={() => isEditing && coverInputRef.current?.click()}
          style={hero.coverImage ? { backgroundImage: `url(${hero.coverImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
        >
          {isEditing && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="text-white flex items-center gap-2">
                <Upload className="h-5 w-5" />
                <span>Upload Cover Image</span>
              </div>
            </div>
          )}
        </div>

        {/* Logo & Content */}
        <div className="p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-start">
          {/* Logo */}
          <div
            className={`relative z-10 shrink-0 w-24 h-24 sm:w-32 sm:h-32 -mt-16 sm:-mt-20 bg-background border-4 border-background rounded-2xl shadow-lg flex items-center justify-center overflow-hidden ${isEditing ? 'cursor-pointer group' : ''}`}
            onClick={() => isEditing && logoInputRef.current?.click()}
          >
            {hero.logoUrl ? (
              <img src={hero.logoUrl} alt="Logo" className="max-h-full max-w-full object-contain p-3" />
            ) : (
              <Image className="h-8 w-8 text-muted-foreground" />
            )}
            {isEditing && (
              <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Upload className="h-5 w-5 text-white" />
              </div>
            )}
          </div>

          {/* Name & Tagline */}
          <div className="flex-1 space-y-3">
            {isEditing ? (
              <>
                <Input
                  value={hero.name}
                  onChange={(e) => onHeroChange({ ...hero, name: e.target.value })}
                  placeholder="Brand Name"
                  className="text-2xl sm:text-3xl font-serif font-semibold h-auto py-2 bg-transparent border-0 border-b-2 rounded-none focus-visible:ring-0 focus-visible:border-accent"
                />
                <Textarea
                  value={hero.tagline}
                  onChange={(e) => onHeroChange({ ...hero, tagline: e.target.value })}
                  placeholder="Your brand tagline..."
                  className="text-lg resize-none bg-transparent border-0 border-b border-dashed rounded-none focus-visible:ring-0 focus-visible:border-accent min-h-[60px]"
                />
              </>
            ) : (
              <>
                <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-foreground">
                  {hero.name || 'Brand Name'}
                </h1>
                <p className="text-lg text-muted-foreground">
                  {hero.tagline || 'Your brand tagline goes here'}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
