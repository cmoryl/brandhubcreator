/**
 * ImportFromUrlDialog Component
 * Allows importing brand/event data from a website URL using AI extraction
 */

import { useState } from 'react';
import { Globe, Loader2, Palette, Type, Image, Calendar, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ExtractedColor {
  name: string;
  hex: string;
  usage: string;
}

interface ExtractedTypography {
  name: string;
  fontFamily: string;
  usage: string;
}

interface ExtractedEventDetails {
  eventName: string;
  eventDates: string;
  location: string;
  venue: string;
  description: string;
}

interface ExtractedBranding {
  name: string;
  tagline: string;
  colors: ExtractedColor[];
  typography: ExtractedTypography[];
  logoUrls: string[];
  eventDetails?: ExtractedEventDetails;
}

interface ImportFromUrlDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'brand' | 'event';
  onImport: (branding: ExtractedBranding) => void;
}

export const ImportFromUrlDialog = ({
  open,
  onOpenChange,
  type,
  onImport,
}: ImportFromUrlDialogProps) => {
  const [url, setUrl] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedBranding | null>(null);

  const handleExtract = async () => {
    if (!url.trim()) {
      toast.error('Please enter a URL');
      return;
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      toast.error('Please enter a valid URL (including https://)');
      return;
    }

    setIsExtracting(true);
    setExtractedData(null);

    try {
      const { data, error } = await supabase.functions.invoke('extract-branding', {
        body: { url, type },
      });

      if (error) throw error;

      if (data.error) {
        if (data.error.includes('Rate limit')) {
          toast.error('Rate limit exceeded. Please try again in a moment.');
        } else if (data.error.includes('credits')) {
          toast.error('AI credits exhausted. Please contact support.');
        } else {
          toast.error(data.error);
        }
        return;
      }

      if (data.branding) {
        setExtractedData(data.branding);
        toast.success('Branding extracted successfully!');
      }
    } catch (err: any) {
      console.error('Extraction error:', err);
      // Provide more specific error messages
      const message = err?.message || '';
      if (message.includes('401') || message.includes('auth') || message.includes('Authentication')) {
        toast.error('Please log in to use this feature.');
      } else if (message.includes('Memory') || message.includes('timeout')) {
        toast.error('The website is too large to process. Try a simpler page.');
      } else if (message.includes('fetch') || message.includes('network')) {
        toast.error('Could not reach the website. Check the URL and try again.');
      } else {
        toast.error('Failed to extract branding. Please try again.');
      }
    } finally {
      setIsExtracting(false);
    }
  };

  const handleImport = () => {
    if (extractedData) {
      onImport(extractedData);
      handleClose();
    }
  };

  const handleClose = () => {
    setUrl('');
    setExtractedData(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Import {type === 'event' ? 'Event' : 'Brand'} from URL
          </DialogTitle>
          <DialogDescription>
            Enter a website URL to automatically extract branding elements like colors, typography, and logos using AI.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* URL Input */}
          <div className="space-y-2">
            <Label htmlFor="import-url">Website URL</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="import-url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="pl-9"
                  onKeyDown={(e) => e.key === 'Enter' && handleExtract()}
                  disabled={isExtracting}
                />
              </div>
              <Button 
                onClick={handleExtract} 
                disabled={isExtracting || !url.trim()}
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Extracting...
                  </>
                ) : (
                  'Extract'
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Works best with event websites, landing pages, and brand homepages
            </p>
          </div>

          {/* Extracted Data Preview */}
          {extractedData && (
            <ScrollArea className="h-[400px] border rounded-lg p-4">
              <div className="space-y-6">
                {/* Name & Tagline */}
                <div>
                  <h3 className="font-semibold text-lg">{extractedData.name}</h3>
                  {extractedData.tagline && (
                    <p className="text-muted-foreground text-sm">{extractedData.tagline}</p>
                  )}
                </div>

                {/* Colors */}
                {extractedData.colors && extractedData.colors.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2 text-sm">
                      <Palette className="h-4 w-4" />
                      Colors ({extractedData.colors.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {extractedData.colors.map((color, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2"
                        >
                          <div
                            className="w-6 h-6 rounded-md border shadow-sm"
                            style={{ backgroundColor: color.hex }}
                          />
                          <div>
                            <p className="text-xs font-medium">{color.name}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">{color.hex}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Typography */}
                {extractedData.typography && extractedData.typography.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2 text-sm">
                      <Type className="h-4 w-4" />
                      Typography ({extractedData.typography.length})
                    </h4>
                    <div className="grid gap-2">
                      {extractedData.typography.map((font, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2"
                        >
                          <div>
                            <p className="text-sm font-medium">{font.name}</p>
                            <p className="text-xs text-muted-foreground">{font.usage}</p>
                          </div>
                          <Badge variant="secondary" className="font-mono text-xs">
                            {font.fontFamily.split(',')[0]}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Logos */}
                {extractedData.logoUrls && extractedData.logoUrls.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2 text-sm">
                      <Image className="h-4 w-4" />
                      Logos Found ({extractedData.logoUrls.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {extractedData.logoUrls.slice(0, 4).map((logoUrl, i) => (
                        <div
                          key={i}
                          className="w-20 h-20 border rounded-lg overflow-hidden bg-muted/50 flex items-center justify-center p-2"
                        >
                          <img
                            src={logoUrl}
                            alt={`Logo ${i + 1}`}
                            className="max-w-full max-h-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Event Details */}
                {type === 'event' && extractedData.eventDetails && (
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4" />
                      Event Details
                    </h4>
                    <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm">
                      {extractedData.eventDetails.eventName && (
                        <p><span className="text-muted-foreground">Name:</span> {extractedData.eventDetails.eventName}</p>
                      )}
                      {extractedData.eventDetails.eventDates && (
                        <p><span className="text-muted-foreground">Dates:</span> {extractedData.eventDetails.eventDates}</p>
                      )}
                      {extractedData.eventDetails.location && (
                        <p><span className="text-muted-foreground">Location:</span> {extractedData.eventDetails.location}</p>
                      )}
                      {extractedData.eventDetails.venue && (
                        <p><span className="text-muted-foreground">Venue:</span> {extractedData.eventDetails.venue}</p>
                      )}
                      {extractedData.eventDetails.description && (
                        <p className="text-muted-foreground text-xs">{extractedData.eventDetails.description}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!extractedData}>
            Import Branding
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
