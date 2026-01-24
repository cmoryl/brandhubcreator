import { useState } from 'react';
import { Plus, X, Pencil, Copy, Check, Wand2 } from 'lucide-react';
import { BrandTextStyle } from '@/types/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SectionHeader } from './SectionHeader';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TextStylesSectionProps {
  textStyles: BrandTextStyle[];
  onTextStylesChange: (textStyles: BrandTextStyle[]) => void;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
}

const tagOptions = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'p.lead', 'p.small', 'p.caption', 'blockquote', 'span', 'small'];
const weightOptions = ['100', '200', '300', '400', '500', '600', '700', '800', '900'];

// Approved text style presets
const stylePresets = {
  heading: [
    { tag: 'h1', size: '48px', weight: '700', lineHeight: '1.1', name: 'Display Heading' },
    { tag: 'h2', size: '36px', weight: '600', lineHeight: '1.2', name: 'Section Heading' },
    { tag: 'h3', size: '28px', weight: '600', lineHeight: '1.25', name: 'Sub Heading' },
    { tag: 'h4', size: '24px', weight: '500', lineHeight: '1.3', name: 'Card Heading' },
    { tag: 'h5', size: '20px', weight: '500', lineHeight: '1.35', name: 'Small Heading' },
    { tag: 'h6', size: '16px', weight: '600', lineHeight: '1.4', name: 'Micro Heading' },
  ],
  paragraph: [
    { tag: 'p.lead', size: '20px', weight: '400', lineHeight: '1.6', name: 'Lead Paragraph' },
    { tag: 'p', size: '16px', weight: '400', lineHeight: '1.65', name: 'Body Text (Default)' },
    { tag: 'p.small', size: '14px', weight: '400', lineHeight: '1.6', name: 'Small Body' },
    { tag: 'p.caption', size: '12px', weight: '400', lineHeight: '1.5', name: 'Caption Text' },
  ],
  special: [
    { tag: 'blockquote', size: '24px', weight: '300', lineHeight: '1.5', name: 'Blockquote' },
    { tag: 'small', size: '12px', weight: '400', lineHeight: '1.4', name: 'Fine Print' },
    { tag: 'span', size: '14px', weight: '500', lineHeight: '1.4', name: 'Label Text' },
  ],
};

// Full preset collections
const presetCollections = [
  {
    name: 'Corporate Standard',
    description: 'Professional typography for business documents',
    styles: [
      { tag: 'h1', size: '42px', weight: '700', lineHeight: '1.15' },
      { tag: 'h2', size: '32px', weight: '600', lineHeight: '1.2' },
      { tag: 'h3', size: '24px', weight: '600', lineHeight: '1.25' },
      { tag: 'h4', size: '20px', weight: '500', lineHeight: '1.3' },
      { tag: 'p.lead', size: '18px', weight: '400', lineHeight: '1.6' },
      { tag: 'p', size: '16px', weight: '400', lineHeight: '1.65' },
      { tag: 'p.small', size: '14px', weight: '400', lineHeight: '1.55' },
      { tag: 'p.caption', size: '12px', weight: '400', lineHeight: '1.5' },
    ],
  },
  {
    name: 'Modern Editorial',
    description: 'Clean typography for digital content',
    styles: [
      { tag: 'h1', size: '56px', weight: '800', lineHeight: '1.05' },
      { tag: 'h2', size: '40px', weight: '700', lineHeight: '1.15' },
      { tag: 'h3', size: '28px', weight: '600', lineHeight: '1.2' },
      { tag: 'h4', size: '22px', weight: '600', lineHeight: '1.25' },
      { tag: 'p.lead', size: '22px', weight: '300', lineHeight: '1.7' },
      { tag: 'p', size: '18px', weight: '400', lineHeight: '1.75' },
      { tag: 'p.small', size: '15px', weight: '400', lineHeight: '1.65' },
      { tag: 'blockquote', size: '28px', weight: '300', lineHeight: '1.5' },
    ],
  },
  {
    name: 'Compact Technical',
    description: 'Dense typography for technical documentation',
    styles: [
      { tag: 'h1', size: '36px', weight: '700', lineHeight: '1.2' },
      { tag: 'h2', size: '28px', weight: '600', lineHeight: '1.25' },
      { tag: 'h3', size: '22px', weight: '600', lineHeight: '1.3' },
      { tag: 'h4', size: '18px', weight: '500', lineHeight: '1.35' },
      { tag: 'p.lead', size: '16px', weight: '500', lineHeight: '1.55' },
      { tag: 'p', size: '14px', weight: '400', lineHeight: '1.6' },
      { tag: 'p.small', size: '13px', weight: '400', lineHeight: '1.5' },
      { tag: 'p.caption', size: '11px', weight: '400', lineHeight: '1.45' },
    ],
  },
];

export const TextStylesSection = ({ textStyles, onTextStylesChange, customSubtitle, onSubtitleChange }: TextStylesSectionProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isHeaderEditing, setIsHeaderEditing] = useState(false);

  const addTextStyle = () => {
    const newStyle: BrandTextStyle = {
      id: crypto.randomUUID(),
      tag: 'p',
      size: '16px',
      weight: '400',
      lineHeight: '1.65',
    };
    onTextStylesChange([...textStyles, newStyle]);
    setEditingId(newStyle.id);
  };

  const addPresetStyle = (preset: typeof stylePresets.heading[0]) => {
    const newStyle: BrandTextStyle = {
      id: crypto.randomUUID(),
      tag: preset.tag,
      size: preset.size,
      weight: preset.weight,
      lineHeight: preset.lineHeight,
    };
    onTextStylesChange([...textStyles, newStyle]);
  };

  const applyPresetCollection = (collection: typeof presetCollections[0]) => {
    const newStyles: BrandTextStyle[] = collection.styles.map((style) => ({
      id: crypto.randomUUID(),
      tag: style.tag,
      size: style.size,
      weight: style.weight,
      lineHeight: style.lineHeight,
    }));
    onTextStylesChange(newStyles);
  };

  const updateTextStyle = (id: string, updates: Partial<BrandTextStyle>) => {
    onTextStylesChange(textStyles.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const deleteTextStyle = (id: string) => {
    onTextStylesChange(textStyles.filter(s => s.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const generateCSS = (style: BrandTextStyle) => {
    const baseTag = style.tag.split('.')[0];
    const modifier = style.tag.includes('.') ? `.${style.tag.split('.')[1]}` : '';
    return `${baseTag}${modifier} {
  font-size: ${style.size};
  font-weight: ${style.weight};
  line-height: ${style.lineHeight};
}`;
  };

  const generateAllCSS = () => {
    return textStyles.map(generateCSS).join('\n\n');
  };

  const copyCSS = async (style: BrandTextStyle) => {
    await navigator.clipboard.writeText(generateCSS(style));
    setCopiedId(style.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyAllCSS = async () => {
    await navigator.clipboard.writeText(generateAllCSS());
    setCopiedId('all');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Get tag display name
  const getTagDisplay = (tag: string) => {
    if (tag.includes('.')) {
      const [base, modifier] = tag.split('.');
      return `<${base} class="${modifier}">`;
    }
    return `<${tag}>`;
  };

  // Get style category color
  const getTagColor = (tag: string) => {
    if (tag.startsWith('h')) return 'bg-purple-500/20 text-purple-600 dark:text-purple-400';
    if (tag.startsWith('p')) return 'bg-blue-500/20 text-blue-600 dark:text-blue-400';
    if (tag === 'blockquote') return 'bg-amber-500/20 text-amber-600 dark:text-amber-400';
    return 'bg-gray-500/20 text-gray-600 dark:text-gray-400';
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <SectionHeader
            title="CSS Hierarchies"
            defaultSubtitle="Developer handover protocol - semantic HTML tag mappings with paragraph standards"
            customSubtitle={customSubtitle}
            onSubtitleChange={onSubtitleChange}
            isEditing={isHeaderEditing}
            onEditToggle={() => setIsHeaderEditing(!isHeaderEditing)}
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Preset Collections Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Wand2 className="h-4 w-4" />
                Presets
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel>Apply Full Preset</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {presetCollections.map((collection) => (
                <DropdownMenuItem 
                  key={collection.name}
                  onClick={() => applyPresetCollection(collection)}
                  className="flex flex-col items-start py-2"
                >
                  <span className="font-medium">{collection.name}</span>
                  <span className="text-xs text-muted-foreground">{collection.description}</span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Add Individual Style</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground">Headings</DropdownMenuLabel>
              {stylePresets.heading.map((preset) => (
                <DropdownMenuItem 
                  key={preset.name}
                  onClick={() => addPresetStyle(preset)}
                >
                  <code className="mr-2 text-xs">{`<${preset.tag}>`}</code>
                  {preset.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground">Paragraphs</DropdownMenuLabel>
              {stylePresets.paragraph.map((preset) => (
                <DropdownMenuItem 
                  key={preset.name}
                  onClick={() => addPresetStyle(preset)}
                >
                  <code className="mr-2 text-xs">{`<${preset.tag}>`}</code>
                  {preset.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground">Special</DropdownMenuLabel>
              {stylePresets.special.map((preset) => (
                <DropdownMenuItem 
                  key={preset.name}
                  onClick={() => addPresetStyle(preset)}
                >
                  <code className="mr-2 text-xs">{`<${preset.tag}>`}</code>
                  {preset.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {textStyles.length > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={copyAllCSS}
              className="gap-2"
            >
              {copiedId === 'all' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copiedId === 'all' ? 'Copied!' : 'Copy All'}
            </Button>
          )}
          
          <Button onClick={addTextStyle} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Style
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {textStyles.map((style, index) => (
          <div
            key={style.id}
            className="group relative bg-card rounded-xl p-6 shadow-sm border border-border animate-slide-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {editingId === style.id ? (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <Select
                  value={style.tag}
                  onValueChange={(tag) => updateTextStyle(style.id, { tag })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tag" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="h1">{`<h1>`} - Display</SelectItem>
                    <SelectItem value="h2">{`<h2>`} - Section</SelectItem>
                    <SelectItem value="h3">{`<h3>`} - Subsection</SelectItem>
                    <SelectItem value="h4">{`<h4>`} - Card Title</SelectItem>
                    <SelectItem value="h5">{`<h5>`} - Small Title</SelectItem>
                    <SelectItem value="h6">{`<h6>`} - Micro</SelectItem>
                    <SelectItem value="p.lead">{`<p.lead>`} - Lead Paragraph</SelectItem>
                    <SelectItem value="p">{`<p>`} - Body Text</SelectItem>
                    <SelectItem value="p.small">{`<p.small>`} - Small Body</SelectItem>
                    <SelectItem value="p.caption">{`<p.caption>`} - Caption</SelectItem>
                    <SelectItem value="blockquote">{`<blockquote>`} - Quote</SelectItem>
                    <SelectItem value="small">{`<small>`} - Fine Print</SelectItem>
                    <SelectItem value="span">{`<span>`} - Label</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  value={style.size}
                  onChange={(e) => updateTextStyle(style.id, { size: e.target.value })}
                  placeholder="Size (e.g., 16px, 1rem)"
                />
                <Select
                  value={style.weight}
                  onValueChange={(weight) => updateTextStyle(style.id, { weight })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Weight" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="100">100 - Thin</SelectItem>
                    <SelectItem value="200">200 - Extra Light</SelectItem>
                    <SelectItem value="300">300 - Light</SelectItem>
                    <SelectItem value="400">400 - Regular</SelectItem>
                    <SelectItem value="500">500 - Medium</SelectItem>
                    <SelectItem value="600">600 - Semi Bold</SelectItem>
                    <SelectItem value="700">700 - Bold</SelectItem>
                    <SelectItem value="800">800 - Extra Bold</SelectItem>
                    <SelectItem value="900">900 - Black</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  value={style.lineHeight}
                  onChange={(e) => updateTextStyle(style.id, { lineHeight: e.target.value })}
                  placeholder="Line height (e.g., 1.65)"
                />
                <Button size="sm" variant="secondary" onClick={() => setEditingId(null)} className="sm:col-span-4">
                  Done
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <code className={`px-3 py-1.5 rounded-md text-sm font-mono ${getTagColor(style.tag)}`}>
                    {getTagDisplay(style.tag)}
                  </code>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Size: <strong className="text-foreground">{style.size}</strong></span>
                    <span>Weight: <strong className="text-foreground">{style.weight}</strong></span>
                    <span>Line Height: <strong className="text-foreground">{style.lineHeight}</strong></span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyCSS(style)}
                    className="gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {copiedId === style.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copiedId === style.id ? 'Copied!' : 'Copy CSS'}
                  </Button>
                  <button
                    onClick={() => setEditingId(style.id)}
                    className="p-2 rounded-md hover:bg-secondary transition-colors opacity-0 group-hover:opacity-100"
                    aria-label="Edit style"
                  >
                    <Pencil className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => deleteTextStyle(style.id)}
                    className="p-2 rounded-md hover:bg-destructive hover:text-destructive-foreground transition-colors opacity-0 group-hover:opacity-100"
                    aria-label="Delete style"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Live Preview */}
            {editingId !== style.id && (
              <div className="mt-4 pt-4 border-t border-border/50">
                <div 
                  style={{ 
                    fontSize: style.size, 
                    fontWeight: style.weight, 
                    lineHeight: style.lineHeight 
                  }}
                  className="text-foreground"
                >
                  {style.tag.startsWith('h') 
                    ? 'The quick brown fox jumps over the lazy dog'
                    : style.tag === 'blockquote'
                    ? '"Design is not just what it looks like and feels like. Design is how it works."'
                    : 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'}
                </div>
              </div>
            )}
          </div>
        ))}

        {textStyles.length === 0 && (
          <div className="space-y-4">
            <button
              onClick={addTextStyle}
              className="w-full h-24 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-accent hover:text-accent transition-colors"
            >
              <Plus className="h-6 w-6" />
              <span className="text-sm font-medium">Add your first text style</span>
            </button>
            
            {/* Quick Start Suggestions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {presetCollections.map((collection) => (
                <button
                  key={collection.name}
                  onClick={() => applyPresetCollection(collection)}
                  className="p-4 rounded-lg border border-border hover:border-accent hover:bg-accent/5 transition-colors text-left"
                >
                  <div className="font-medium text-sm">{collection.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">{collection.description}</div>
                  <div className="text-xs text-accent mt-2">{collection.styles.length} styles →</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};