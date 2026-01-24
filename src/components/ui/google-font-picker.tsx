import { useState, useEffect, useMemo } from 'react';
import { Check, ChevronsUpDown, Search, Type, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';

// Popular Google Fonts organized by category
const GOOGLE_FONTS = {
  serif: [
    'Playfair Display', 'Merriweather', 'Lora', 'Crimson Text', 'Libre Baskerville',
    'EB Garamond', 'Cormorant Garamond', 'Spectral', 'Noto Serif', 'Source Serif Pro',
    'Bitter', 'Vollkorn', 'Cardo', 'Old Standard TT', 'Zilla Slab'
  ],
  'sans-serif': [
    'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins', 'Raleway',
    'Work Sans', 'Nunito', 'Source Sans Pro', 'Oswald', 'Bebas Neue', 'Archivo',
    'DM Sans', 'Plus Jakarta Sans', 'Outfit', 'Space Grotesk', 'Urbanist'
  ],
  display: [
    'Abril Fatface', 'Righteous', 'Lobster', 'Pacifico', 'Permanent Marker',
    'Alfa Slab One', 'Titan One', 'Bangers', 'Bungee', 'Fredoka One',
    'Rubik Mono One', 'Monoton', 'Orbitron', 'Press Start 2P', 'Bowlby One SC'
  ],
  handwriting: [
    'Dancing Script', 'Great Vibes', 'Pacifico', 'Caveat', 'Sacramento',
    'Satisfy', 'Kaushan Script', 'Allura', 'Cookie', 'Alex Brush',
    'Pinyon Script', 'Tangerine', 'Rochester', 'Niconne', 'Herr Von Muellerhoff'
  ],
  monospace: [
    'Fira Code', 'JetBrains Mono', 'Source Code Pro', 'Roboto Mono', 'IBM Plex Mono',
    'Space Mono', 'Inconsolata', 'Anonymous Pro', 'Courier Prime', 'Ubuntu Mono'
  ]
};

const FONT_WEIGHTS = [
  { value: '100', label: 'Thin' },
  { value: '200', label: 'Extra Light' },
  { value: '300', label: 'Light' },
  { value: '400', label: 'Regular' },
  { value: '500', label: 'Medium' },
  { value: '600', label: 'Semi Bold' },
  { value: '700', label: 'Bold' },
  { value: '800', label: 'Extra Bold' },
  { value: '900', label: 'Black' },
];

const TEXT_TRANSFORMS = [
  { value: 'none', label: 'Aa' },
  { value: 'uppercase', label: 'AA' },
  { value: 'lowercase', label: 'aa' },
  { value: 'capitalize', label: 'Aa' },
];

const TEXT_ALIGNS = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' },
];

export interface FontSettings {
  fontFamily: string;
  fontWeight: string;
  fontSize: number;
  letterSpacing: number;
  lineHeight: number;
  textTransform: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  textAlign: 'left' | 'center' | 'right';
  fontStyle: 'normal' | 'italic';
}

export const DEFAULT_FONT_SETTINGS: FontSettings = {
  fontFamily: 'Poppins',
  fontWeight: '300',
  fontSize: 48,
  letterSpacing: 0.5,
  lineHeight: 1.3,
  textTransform: 'none',
  textAlign: 'center',
  fontStyle: 'normal',
};

// Preset for corporate taglines - Poppins Light
export const TAGLINE_FONT_PRESET: FontSettings = {
  fontFamily: 'Poppins',
  fontWeight: '300',
  fontSize: 48,
  letterSpacing: 0.5,
  lineHeight: 1.3,
  textTransform: 'none',
  textAlign: 'center',
  fontStyle: 'normal',
};

interface GoogleFontPickerProps {
  value: FontSettings;
  onChange: (settings: FontSettings) => void;
  previewText?: string;
}

// Load a Google Font dynamically
const loadGoogleFont = (fontFamily: string, weights: string[] = ['400', '700']) => {
  const fontId = `google-font-${fontFamily.replace(/\s+/g, '-').toLowerCase()}`;
  
  if (document.getElementById(fontId)) return;
  
  const link = document.createElement('link');
  link.id = fontId;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@${weights.join(';')}&display=swap`;
  document.head.appendChild(link);
};

export const GoogleFontPicker = ({ value, onChange, previewText = 'The quick brown fox' }: GoogleFontPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loadingFont, setLoadingFont] = useState(false);

  // Load current font
  useEffect(() => {
    if (value.fontFamily) {
      loadGoogleFont(value.fontFamily, FONT_WEIGHTS.map(w => w.value));
    }
  }, [value.fontFamily]);

  // Filter fonts based on search and category
  const filteredFonts = useMemo(() => {
    const allFonts = selectedCategory === 'all'
      ? Object.values(GOOGLE_FONTS).flat()
      : GOOGLE_FONTS[selectedCategory as keyof typeof GOOGLE_FONTS] || [];

    if (!searchQuery) return allFonts;
    return allFonts.filter(font => 
      font.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, selectedCategory]);

  const handleFontSelect = async (fontFamily: string) => {
    setLoadingFont(true);
    loadGoogleFont(fontFamily, FONT_WEIGHTS.map(w => w.value));
    
    // Small delay for font to load
    await new Promise(resolve => setTimeout(resolve, 300));
    
    onChange({ ...value, fontFamily });
    setLoadingFont(false);
    setIsOpen(false);
  };

  const updateSetting = <K extends keyof FontSettings>(key: K, val: FontSettings[K]) => {
    onChange({ ...value, [key]: val });
  };

  // Build preview style
  const previewStyle: React.CSSProperties = {
    fontFamily: `"${value.fontFamily}", serif`,
    fontWeight: value.fontWeight,
    fontSize: `${value.fontSize}px`,
    letterSpacing: `${value.letterSpacing}px`,
    lineHeight: value.lineHeight,
    textTransform: value.textTransform,
    textAlign: value.textAlign,
    fontStyle: value.fontStyle,
  };

  return (
    <div className="space-y-4">
      {/* Font Family Selector */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Font Family</Label>
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={isOpen}
              className="w-full justify-between"
              style={{ fontFamily: `"${value.fontFamily}", serif` }}
            >
              <div className="flex items-center gap-2">
                <Type className="h-4 w-4 shrink-0" />
                <span className="truncate">{value.fontFamily}</span>
              </div>
              {loadingFont ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0 bg-popover z-50" align="start">
            <div className="p-3 border-b space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search fonts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="serif">Serif</SelectItem>
                  <SelectItem value="sans-serif">Sans Serif</SelectItem>
                  <SelectItem value="display">Display</SelectItem>
                  <SelectItem value="handwriting">Handwriting</SelectItem>
                  <SelectItem value="monospace">Monospace</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <ScrollArea className="h-64">
              <div className="p-2">
                {filteredFonts.map((font) => {
                  // Preload font on hover
                  const handleMouseEnter = () => loadGoogleFont(font);
                  
                  return (
                    <button
                      key={font}
                      onClick={() => handleFontSelect(font)}
                      onMouseEnter={handleMouseEnter}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-md text-left hover:bg-accent/50 transition-colors",
                        value.fontFamily === font && "bg-accent"
                      )}
                    >
                      <span 
                        className="text-base truncate"
                        style={{ fontFamily: `"${font}", serif` }}
                      >
                        {font}
                      </span>
                      {value.fontFamily === font && (
                        <Check className="h-4 w-4 text-primary shrink-0" />
                      )}
                    </button>
                  );
                })}
                {filteredFonts.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    No fonts found
                  </p>
                )}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>
      </div>

      {/* Font Weight & Style */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Weight</Label>
          <Select value={value.fontWeight} onValueChange={(v) => updateSetting('fontWeight', v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_WEIGHTS.map((weight) => (
                <SelectItem key={weight.value} value={weight.value}>
                  {weight.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Style</Label>
          <ToggleGroup 
            type="single" 
            value={value.fontStyle}
            onValueChange={(v) => v && updateSetting('fontStyle', v as 'normal' | 'italic')}
            className="w-full"
          >
            <ToggleGroupItem value="normal" className="flex-1">Normal</ToggleGroupItem>
            <ToggleGroupItem value="italic" className="flex-1 italic">Italic</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {/* Font Size */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Size</Label>
          <span className="text-xs text-muted-foreground">{value.fontSize}px</span>
        </div>
        <Slider
          value={[value.fontSize]}
          onValueChange={([v]) => updateSetting('fontSize', v)}
          min={12}
          max={120}
          step={1}
        />
      </div>

      {/* Letter Spacing */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Letter Spacing</Label>
          <span className="text-xs text-muted-foreground">{value.letterSpacing}px</span>
        </div>
        <Slider
          value={[value.letterSpacing]}
          onValueChange={([v]) => updateSetting('letterSpacing', v)}
          min={-5}
          max={20}
          step={0.5}
        />
      </div>

      {/* Line Height */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Line Height</Label>
          <span className="text-xs text-muted-foreground">{value.lineHeight}</span>
        </div>
        <Slider
          value={[value.lineHeight]}
          onValueChange={([v]) => updateSetting('lineHeight', v)}
          min={0.8}
          max={2.5}
          step={0.1}
        />
      </div>

      {/* Text Transform & Alignment */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Transform</Label>
          <Select 
            value={value.textTransform} 
            onValueChange={(v) => updateSetting('textTransform', v as FontSettings['textTransform'])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="uppercase">UPPERCASE</SelectItem>
              <SelectItem value="lowercase">lowercase</SelectItem>
              <SelectItem value="capitalize">Capitalize</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Alignment</Label>
          <ToggleGroup 
            type="single" 
            value={value.textAlign}
            onValueChange={(v) => v && updateSetting('textAlign', v as 'left' | 'center' | 'right')}
            className="w-full"
          >
            <ToggleGroupItem value="left" className="flex-1">L</ToggleGroupItem>
            <ToggleGroupItem value="center" className="flex-1">C</ToggleGroupItem>
            <ToggleGroupItem value="right" className="flex-1">R</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {/* Preview */}
      <div className="pt-4 border-t">
        <Label className="text-xs text-muted-foreground mb-2 block">Preview</Label>
        <div 
          className="bg-muted/30 rounded-lg p-4 min-h-[80px] flex items-center justify-center overflow-hidden"
        >
          <p style={previewStyle} className="text-foreground break-words max-w-full">
            {previewText}
          </p>
        </div>
      </div>
    </div>
  );
};
