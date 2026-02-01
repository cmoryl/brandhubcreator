import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, Check, ExternalLink, Palette, Type, Image, Users, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface SharedBrand {
  id: string;
  name: string;
  slug: string;
  colors: unknown;
  fonts: unknown;
  logo_url: string | null;
  mood_keywords: unknown;
  imagery_style: unknown;
  industry: string | null;
  target_audience: unknown;
  tagline: string | null;
  voice: unknown;
  guide_data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export default function SharedBrandPage() {
  const { token } = useParams<{ token: string }>();
  const [brand, setBrand] = useState<SharedBrand | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchBrand = async () => {
      if (!token) {
        setError('Invalid share link');
        setLoading(false);
        return;
      }

      try {
        const { data, error: fnError } = await supabase.functions.invoke('get-shared-brand', {
          body: { shareToken: token }
        });

        if (fnError) {
          setError('Failed to load brand');
          return;
        }

        if (data?.error) {
          setError(data.error);
          return;
        }

        setBrand(data.brand);
      } catch (err) {
        console.error('Error fetching shared brand:', err);
        setError('Failed to load brand');
      } finally {
        setLoading(false);
      }
    };

    fetchBrand();
  }, [token]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success('Share link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const getColors = (): { name: string; value: string }[] => {
    if (!brand?.colors) return [];
    if (Array.isArray(brand.colors)) {
      return brand.colors.map((c: unknown, i: number) => {
        if (typeof c === 'string') return { name: `Color ${i + 1}`, value: c };
        if (typeof c === 'object' && c !== null) {
          const colorObj = c as Record<string, unknown>;
          return { 
            name: String(colorObj.name || `Color ${i + 1}`), 
            value: String(colorObj.value || colorObj.hex || colorObj.color || '#888888')
          };
        }
        return { name: `Color ${i + 1}`, value: '#888888' };
      });
    }
    if (typeof brand.colors === 'object') {
      const colorObj = brand.colors as Record<string, unknown>;
      return Object.entries(colorObj).slice(0, 6).map(([name, value]) => ({
        name,
        value: typeof value === 'string' ? value : String(value)
      }));
    }
    return [];
  };

  const getFonts = (): string[] => {
    if (!brand?.fonts) return [];
    if (Array.isArray(brand.fonts)) {
      return brand.fonts.map(f => typeof f === 'string' ? f : String((f as Record<string, unknown>).name || f));
    }
    if (typeof brand.fonts === 'object') {
      const fontObj = brand.fonts as Record<string, unknown>;
      return Object.values(fontObj).slice(0, 3).map(v => String(v));
    }
    return [];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !brand) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <ExternalLink className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Brand Not Found</h2>
            <p className="text-muted-foreground mb-4">
              {error || 'This brand link is invalid or has been removed.'}
            </p>
            <Button asChild variant="outline">
              <Link to="/">Go Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const colors = getColors();
  const fonts = getFonts();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-primary">
            BrandHub
          </Link>
          <Button onClick={handleCopyLink} variant="outline" size="sm" className="gap-2">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            Copy Link
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Brand Header */}
        <div className="text-center mb-8">
          {brand.logo_url && (
            <img 
              src={brand.logo_url} 
              alt={brand.name} 
              className="h-20 w-auto mx-auto mb-4 object-contain"
            />
          )}
          <h1 className="text-3xl font-bold mb-2">{brand.name}</h1>
          {brand.tagline && (
            <p className="text-lg text-muted-foreground">{brand.tagline}</p>
          )}
          {brand.industry && (
            <span className="inline-block mt-2 px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">
              {brand.industry}
            </span>
          )}
        </div>

        {/* Import CTA */}
        <Card className="mb-8 border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Import this brand into EventKIT or other apps</h3>
                <p className="text-sm text-muted-foreground">
                  Use this share link to import brand assets, colors, fonts, and guidelines.
                </p>
              </div>
              <Button onClick={handleCopyLink} className="gap-2">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                Copy Link
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Brand Preview Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Colors */}
          {colors.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Color Palette
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  {colors.map((color, i) => (
                    <div key={i} className="text-center">
                      <div 
                        className="h-16 rounded-lg border mb-1"
                        style={{ backgroundColor: color.value }}
                      />
                      <p className="text-xs text-muted-foreground truncate">{color.name}</p>
                      <p className="text-xs font-mono">{color.value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Fonts */}
          {fonts.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Type className="h-5 w-5" />
                  Typography
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {fonts.map((font, i) => (
                    <div key={i} className="p-3 bg-muted rounded-lg">
                      <p className="font-medium">{font}</p>
                      <p className="text-sm text-muted-foreground">
                        {i === 0 ? 'Primary' : i === 1 ? 'Secondary' : 'Accent'}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Imagery Style */}
          {brand.imagery_style && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  Visual Style
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {typeof brand.imagery_style === 'string' 
                    ? brand.imagery_style 
                    : JSON.stringify(brand.imagery_style)}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Target Audience */}
          {brand.target_audience && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Target Audience
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {typeof brand.target_audience === 'string' 
                    ? brand.target_audience 
                    : JSON.stringify(brand.target_audience)}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>Shared via BrandHub Creator</p>
        </div>
      </main>
    </div>
  );
}
