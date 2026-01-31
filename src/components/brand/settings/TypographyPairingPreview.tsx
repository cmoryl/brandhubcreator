/**
 * TypographyPairingPreview - Visual preview of font combinations
 * Shows how heading and body fonts look together with sample text
 */

import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface FontPairing {
  id: string;
  name: string;
  heading: string;
  body: string;
  description: string;
}

export const POPULAR_FONT_PAIRINGS: FontPairing[] = [
  {
    id: 'classic',
    name: 'Classic Editorial',
    heading: 'Playfair Display',
    body: 'Source Sans Pro',
    description: 'Elegant serif headlines with clean sans body',
  },
  {
    id: 'modern',
    name: 'Modern Tech',
    heading: 'Inter',
    body: 'Inter',
    description: 'Clean, versatile sans-serif for both',
  },
  {
    id: 'bold',
    name: 'Bold Statement',
    heading: 'Montserrat',
    body: 'Open Sans',
    description: 'Strong geometric headlines, friendly body',
  },
  {
    id: 'elegant',
    name: 'Elegant Luxury',
    heading: 'Cormorant Garamond',
    body: 'Lato',
    description: 'Refined serif with smooth sans body',
  },
  {
    id: 'minimal',
    name: 'Minimal Clean',
    heading: 'Poppins',
    body: 'Roboto',
    description: 'Geometric modern with neutral body',
  },
  {
    id: 'creative',
    name: 'Creative Studio',
    heading: 'DM Serif Display',
    body: 'DM Sans',
    description: 'Distinctive headlines with matching body',
  },
];

interface TypographyPairingPreviewProps {
  selectedPairing?: string;
  onSelect?: (pairing: FontPairing) => void;
  showFullPreview?: boolean;
}

// Dynamically load Google Font
const loadFont = (fontFamily: string) => {
  const fontId = `google-font-${fontFamily.replace(/\s+/g, '-').toLowerCase()}`;
  if (document.getElementById(fontId)) return;
  
  const link = document.createElement('link');
  link.id = fontId;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@400;500;600;700&display=swap`;
  document.head.appendChild(link);
};

export const TypographyPairingPreview = ({
  selectedPairing,
  onSelect,
  showFullPreview = false,
}: TypographyPairingPreviewProps) => {
  // Preload all fonts
  useEffect(() => {
    POPULAR_FONT_PAIRINGS.forEach((pairing) => {
      loadFont(pairing.heading);
      loadFont(pairing.body);
    });
  }, []);

  return (
    <div className={cn(
      'grid gap-2',
      showFullPreview ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'
    )}>
      {POPULAR_FONT_PAIRINGS.map((pairing) => {
        const isSelected = selectedPairing === pairing.id;
        
        return (
          <button
            key={pairing.id}
            onClick={() => onSelect?.(pairing)}
            className={cn(
              'p-3 rounded-lg border-2 transition-all text-left relative group',
              isSelected
                ? 'border-accent bg-accent/10'
                : 'border-border hover:border-accent/50 bg-card'
            )}
          >
            {/* Selection indicator */}
            {isSelected && (
              <div className="absolute top-2 right-2 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                <Check className="h-3 w-3 text-accent-foreground" />
              </div>
            )}
            
            {/* Font preview */}
            <div className="space-y-2">
              <div 
                className="text-lg font-semibold text-foreground leading-tight"
                style={{ fontFamily: `"${pairing.heading}", serif` }}
              >
                Aa Bb Cc
              </div>
              <div 
                className="text-sm text-muted-foreground leading-snug"
                style={{ fontFamily: `"${pairing.body}", sans-serif` }}
              >
                The quick brown fox jumps over the lazy dog.
              </div>
            </div>
            
            {/* Pairing info */}
            <div className="mt-3 pt-2 border-t border-border/50">
              <div className="text-xs font-medium text-foreground">{pairing.name}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                {pairing.heading} + {pairing.body}
              </div>
            </div>
            
            {showFullPreview && (
              <div className="mt-2 text-xs text-muted-foreground">
                {pairing.description}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default TypographyPairingPreview;
