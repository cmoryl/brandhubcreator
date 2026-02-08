import { useState } from 'react';
import { Plus, X, Pencil, Copy, Check, Wand2, GripVertical, LayoutGrid, List, Shield, Sparkles } from 'lucide-react';
import { BrandTextStyle, AdminCustomStyle } from '@/types/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SectionHeader } from './SectionHeader';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface TextStylesSectionProps {
  textStyles: BrandTextStyle[];
  onTextStylesChange?: (textStyles: BrandTextStyle[]) => void;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
  // Admin-only custom style
  adminCustomStyle?: AdminCustomStyle;
  onAdminCustomStyleChange?: (style: AdminCustomStyle | undefined) => void;
  canEdit?: boolean;
}

const tagOptions = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'p.lead', 'p.small', 'p.caption', 'blockquote', 'span', 'small'];
const weightOptions = ['100', '200', '300', '400', '500', '600', '700', '800', '900'];

// Default sample texts for each tag type
const defaultSampleTexts: Record<string, string> = {
  h1: 'Main Page Heading',
  h2: 'Section Title',
  h3: 'Subsection Heading',
  h4: 'Card or Feature Title',
  h5: 'Small Component Title',
  h6: 'Label or Category',
  'p.lead': 'This is a lead paragraph that introduces the main content. It\'s designed to capture attention and provide context.',
  p: 'This is standard body text used throughout the content. It provides detailed information and maintains readability across different screen sizes.',
  'p.small': 'Smaller text for secondary information or metadata.',
  'p.caption': 'Caption text for images, tables, or figures.',
  blockquote: '"Great design is about creating experiences that resonate with your audience."',
  small: 'Fine print and legal disclaimers.',
  span: 'Label Text',
};

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

type ViewMode = 'column' | 'list';

export const TextStylesSection = ({ 
  textStyles, 
  onTextStylesChange, 
  customSubtitle, 
  onSubtitleChange,
  adminCustomStyle,
  onAdminCustomStyleChange,
  canEdit = false,
}: TextStylesSectionProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isHeaderEditing, setIsHeaderEditing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('column');
  const [isEditingAdminStyle, setIsEditingAdminStyle] = useState(false);
  const [adminStyleDraft, setAdminStyleDraft] = useState<Partial<AdminCustomStyle>>({});

  // Check if admin features are available (has the callback)
  const isAdmin = !!onAdminCustomStyleChange;

  const addTextStyle = () => {
    if (!onTextStylesChange) return;
    const newStyle: BrandTextStyle = {
      id: crypto.randomUUID(),
      tag: 'p',
      size: '16px',
      weight: '400',
      lineHeight: '1.65',
      sampleText: defaultSampleTexts['p'],
    };
    onTextStylesChange([...textStyles, newStyle]);
    setEditingId(newStyle.id);
  };

  const addPresetStyle = (preset: typeof stylePresets.heading[0]) => {
    if (!onTextStylesChange) return;
    const newStyle: BrandTextStyle = {
      id: crypto.randomUUID(),
      tag: preset.tag,
      size: preset.size,
      weight: preset.weight,
      lineHeight: preset.lineHeight,
      sampleText: defaultSampleTexts[preset.tag],
    };
    onTextStylesChange([...textStyles, newStyle]);
  };

  const applyPresetCollection = (collection: typeof presetCollections[0]) => {
    if (!onTextStylesChange) return;
    const newStyles: BrandTextStyle[] = collection.styles.map((style) => ({
      id: crypto.randomUUID(),
      tag: style.tag,
      size: style.size,
      weight: style.weight,
      lineHeight: style.lineHeight,
      sampleText: defaultSampleTexts[style.tag],
    }));
    onTextStylesChange(newStyles);
  };

  const updateTextStyle = (id: string, updates: Partial<BrandTextStyle>) => {
    if (!onTextStylesChange) return;
    onTextStylesChange(textStyles.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const deleteTextStyle = (id: string) => {
    if (!onTextStylesChange) return;
    onTextStylesChange(textStyles.filter(s => s.id !== id));
    if (editingId === id) setEditingId(null);
  };

  // Admin Custom Style Handlers
  const handleStartEditAdminStyle = () => {
    setAdminStyleDraft(adminCustomStyle || { name: '', css: '', description: '' });
    setIsEditingAdminStyle(true);
  };

  const handleSaveAdminStyle = () => {
    if (!onAdminCustomStyleChange) return;
    if (adminStyleDraft.name && adminStyleDraft.css) {
      onAdminCustomStyleChange({
        id: adminCustomStyle?.id || crypto.randomUUID(),
        name: adminStyleDraft.name,
        css: adminStyleDraft.css,
        description: adminStyleDraft.description,
      });
      setIsEditingAdminStyle(false);
    }
  };

  const handleRemoveAdminStyle = () => {
    if (!onAdminCustomStyleChange) return;
    onAdminCustomStyleChange(undefined);
    setIsEditingAdminStyle(false);
  };

  const copyAdminCSS = async () => {
    if (!adminCustomStyle?.css) return;
    await navigator.clipboard.writeText(adminCustomStyle.css);
    setCopiedId('admin');
    setTimeout(() => setCopiedId(null), 2000);
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

  // Get friendly name for tag
  const getTagName = (tag: string) => {
    const names: Record<string, string> = {
      h1: 'Heading 1',
      h2: 'Heading 2',
      h3: 'Heading 3',
      h4: 'Heading 4',
      h5: 'Heading 5',
      h6: 'Heading 6',
      'p.lead': 'Lead Paragraph',
      p: 'Body Text',
      'p.small': 'Small Text',
      'p.caption': 'Caption',
      blockquote: 'Blockquote',
      small: 'Fine Print',
      span: 'Label',
    };
    return names[tag] || tag;
  };

  // Get style category color
  const getTagColor = (tag: string) => {
    if (tag.startsWith('h')) return 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30';
    if (tag.startsWith('p')) return 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30';
    if (tag === 'blockquote') return 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30';
    return 'bg-gray-500/20 text-gray-600 dark:text-gray-400 border-gray-500/30';
  };

  // Group styles by category
  const headingStyles = textStyles.filter(s => s.tag.startsWith('h'));
  const paragraphStyles = textStyles.filter(s => s.tag.startsWith('p'));
  const specialStyles = textStyles.filter(s => !s.tag.startsWith('h') && !s.tag.startsWith('p'));

  const getSampleText = (style: BrandTextStyle) => {
    return style.sampleText || defaultSampleTexts[style.tag] || 'Sample text';
  };

  const renderStyleCard = (style: BrandTextStyle, index: number) => {
    const isEditing = editingId === style.id;

    return (
      <div
        key={style.id}
        className={cn(
          "group relative bg-card rounded-xl border border-border transition-all",
          isEditing ? "ring-2 ring-primary" : "hover:border-primary/50"
        )}
      >
        {/* Header with tag and actions */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
          <div className="flex items-center gap-3">
            <code className={cn('px-2 py-1 rounded text-xs font-mono border', getTagColor(style.tag))}>
              {getTagDisplay(style.tag)}
            </code>
            <span className="text-sm font-medium">{getTagName(style.tag)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyCSS(style)}
              className="h-8 gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {copiedId === style.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span className="text-xs">{copiedId === style.id ? 'Copied' : 'CSS'}</span>
            </Button>
            <button
              onClick={() => setEditingId(isEditing ? null : style.id)}
              className={cn(
                "p-2 rounded-md transition-colors",
                isEditing ? "bg-primary text-primary-foreground" : "hover:bg-secondary opacity-0 group-hover:opacity-100"
              )}
              aria-label="Edit style"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => deleteTextStyle(style.id)}
              className="p-2 rounded-md hover:bg-destructive hover:text-destructive-foreground transition-colors opacity-0 group-hover:opacity-100"
              aria-label="Delete style"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Edit Form */}
        {isEditing && (
          <div className="p-4 space-y-4 bg-muted/30 border-b border-border/50">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Tag</Label>
                <Select
                  value={style.tag}
                  onValueChange={(tag) => updateTextStyle(style.id, { tag, sampleText: style.sampleText || defaultSampleTexts[tag] })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Tag" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="h1">{`<h1>`}</SelectItem>
                    <SelectItem value="h2">{`<h2>`}</SelectItem>
                    <SelectItem value="h3">{`<h3>`}</SelectItem>
                    <SelectItem value="h4">{`<h4>`}</SelectItem>
                    <SelectItem value="h5">{`<h5>`}</SelectItem>
                    <SelectItem value="h6">{`<h6>`}</SelectItem>
                    <SelectItem value="p.lead">{`<p.lead>`}</SelectItem>
                    <SelectItem value="p">{`<p>`}</SelectItem>
                    <SelectItem value="p.small">{`<p.small>`}</SelectItem>
                    <SelectItem value="p.caption">{`<p.caption>`}</SelectItem>
                    <SelectItem value="blockquote">{`<blockquote>`}</SelectItem>
                    <SelectItem value="small">{`<small>`}</SelectItem>
                    <SelectItem value="span">{`<span>`}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Size</Label>
                <Input
                  value={style.size}
                  onChange={(e) => updateTextStyle(style.id, { size: e.target.value })}
                  placeholder="16px"
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Weight</Label>
                <Select
                  value={style.weight}
                  onValueChange={(weight) => updateTextStyle(style.id, { weight })}
                >
                  <SelectTrigger className="h-9">
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
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Line Height</Label>
                <Input
                  value={style.lineHeight}
                  onChange={(e) => updateTextStyle(style.id, { lineHeight: e.target.value })}
                  placeholder="1.65"
                  className="h-9"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Sample Text</Label>
              <Textarea
                value={style.sampleText || ''}
                onChange={(e) => updateTextStyle(style.id, { sampleText: e.target.value })}
                placeholder={defaultSampleTexts[style.tag] || 'Enter sample text...'}
                rows={2}
                className="resize-none"
              />
            </div>
          </div>
        )}

        {/* Live Preview */}
        <div className="p-4">
          <div 
            style={{ 
              fontSize: style.size, 
              fontWeight: style.weight, 
              lineHeight: style.lineHeight 
            }}
            className="text-foreground break-words"
          >
            {getSampleText(style)}
          </div>
          <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
            <span>Size: <strong className="text-foreground">{style.size}</strong></span>
            <span>Weight: <strong className="text-foreground">{style.weight}</strong></span>
            <span>Line: <strong className="text-foreground">{style.lineHeight}</strong></span>
          </div>
        </div>
      </div>
    );
  };

  const renderColumnView = () => {
    if (textStyles.length === 0) return null;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Headings Column */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-purple-500/30">
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            <h3 className="font-semibold text-sm text-purple-600 dark:text-purple-400">Headings</h3>
            <span className="text-xs text-muted-foreground">({headingStyles.length})</span>
          </div>
          <div className="space-y-3">
            {headingStyles.length > 0 ? (
              headingStyles.map((style, index) => renderStyleCard(style, index))
            ) : (
              <div className="text-center py-8 text-sm text-muted-foreground border border-dashed rounded-lg">
                No heading styles defined
              </div>
            )}
          </div>
        </div>

        {/* Paragraphs Column */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-blue-500/30">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <h3 className="font-semibold text-sm text-blue-600 dark:text-blue-400">Paragraphs</h3>
            <span className="text-xs text-muted-foreground">({paragraphStyles.length})</span>
          </div>
          <div className="space-y-3">
            {paragraphStyles.length > 0 ? (
              paragraphStyles.map((style, index) => renderStyleCard(style, index))
            ) : (
              <div className="text-center py-8 text-sm text-muted-foreground border border-dashed rounded-lg">
                No paragraph styles defined
              </div>
            )}
          </div>
        </div>

        {/* Special Column */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-amber-500/30">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <h3 className="font-semibold text-sm text-amber-600 dark:text-amber-400">Special</h3>
            <span className="text-xs text-muted-foreground">({specialStyles.length})</span>
          </div>
          <div className="space-y-3">
            {specialStyles.length > 0 ? (
              specialStyles.map((style, index) => renderStyleCard(style, index))
            ) : (
              <div className="text-center py-8 text-sm text-muted-foreground border border-dashed rounded-lg">
                No special styles defined
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderListView = () => {
    return (
      <div className="space-y-4">
        {textStyles.map((style, index) => renderStyleCard(style, index))}
      </div>
    );
  };

  // Combined preview section showing all styles together
  const renderCombinedPreview = () => {
    if (textStyles.length === 0) return null;

    // Get one of each main type for the preview
    const h1 = textStyles.find(s => s.tag === 'h1');
    const h2 = textStyles.find(s => s.tag === 'h2');
    const h3 = textStyles.find(s => s.tag === 'h3');
    const lead = textStyles.find(s => s.tag === 'p.lead');
    const body = textStyles.find(s => s.tag === 'p');
    const caption = textStyles.find(s => s.tag === 'p.caption' || s.tag === 'p.small');

    const previewStyles = [h1, h2, lead, body, h3, body, caption].filter(Boolean);

    if (previewStyles.length < 3) return null;

    return (
      <div className="mt-8 p-6 rounded-xl border border-border bg-card/50">
        <h4 className="text-sm font-medium text-muted-foreground mb-4">Typography Preview</h4>
        <div className="space-y-4 max-w-2xl">
          {previewStyles.map((style, idx) => (
            <div
              key={`preview-${idx}`}
              style={{
                fontSize: style!.size,
                fontWeight: style!.weight,
                lineHeight: style!.lineHeight,
              }}
            >
              {getSampleText(style!)}
            </div>
          ))}
        </div>
      </div>
    );
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
          {/* View Toggle */}
          <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as ViewMode)} size="sm">
            <ToggleGroupItem value="column" aria-label="Column view">
              <LayoutGrid className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="List view">
              <List className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>

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
          
          {canEdit && onTextStylesChange && (
            <Button onClick={addTextStyle} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Style
            </Button>
          )}
        </div>
      </div>

      {/* Admin Custom Style Section - Shows at top, independent of presets */}
      {(adminCustomStyle || isAdmin) && (
        <div className="p-4 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm text-primary">Admin Custom Style</h3>
            <span className="text-xs text-muted-foreground">(preserved across presets)</span>
          </div>

          {isEditingAdminStyle ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Style Name</Label>
                  <Input
                    value={adminStyleDraft.name || ''}
                    onChange={(e) => setAdminStyleDraft({ ...adminStyleDraft, name: e.target.value })}
                    placeholder="e.g., Brand Accent Text"
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Description (optional)</Label>
                  <Input
                    value={adminStyleDraft.description || ''}
                    onChange={(e) => setAdminStyleDraft({ ...adminStyleDraft, description: e.target.value })}
                    placeholder="e.g., Used for special callouts"
                    className="h-9"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Custom CSS</Label>
                <Textarea
                  value={adminStyleDraft.css || ''}
                  onChange={(e) => setAdminStyleDraft({ ...adminStyleDraft, css: e.target.value })}
                  placeholder={`.brand-accent {\n  font-size: 18px;\n  font-weight: 600;\n  color: var(--primary);\n  letter-spacing: 0.02em;\n}`}
                  rows={6}
                  className="font-mono text-xs"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={handleSaveAdminStyle} disabled={!adminStyleDraft.name || !adminStyleDraft.css}>
                  <Check className="h-4 w-4 mr-1" />
                  Save Custom Style
                </Button>
                <Button size="sm" variant="outline" onClick={() => setIsEditingAdminStyle(false)}>
                  Cancel
                </Button>
                {adminCustomStyle && (
                  <Button size="sm" variant="destructive" onClick={handleRemoveAdminStyle}>
                    <X className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                )}
              </div>
            </div>
          ) : adminCustomStyle ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <span className="font-medium">{adminCustomStyle.name}</span>
                  {adminCustomStyle.description && (
                    <span className="text-xs text-muted-foreground">— {adminCustomStyle.description}</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyAdminCSS}
                    className="h-8 gap-1.5"
                  >
                    {copiedId === 'admin' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    <span className="text-xs">{copiedId === 'admin' ? 'Copied' : 'CSS'}</span>
                  </Button>
                  {isAdmin && (
                    <Button variant="ghost" size="sm" onClick={handleStartEditAdminStyle}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
              <pre className="p-3 rounded-lg bg-card border text-xs font-mono overflow-x-auto">
                <code>{adminCustomStyle.css}</code>
              </pre>
            </div>
          ) : isAdmin ? (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleStartEditAdminStyle}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Admin Custom Style
            </Button>
          ) : null}
        </div>
      )}

      {/* Main Content */}
      {textStyles.length === 0 ? (
        <div className="space-y-4">
          <button 
            onClick={addTextStyle}
            className="w-full h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
          >
            <Plus className="h-8 w-8" />
            <span className="text-sm font-medium">Add your first text style</span>
            <span className="text-xs">or use a preset collection above</span>
          </button>
        </div>
      ) : (
        <>
          {viewMode === 'column' ? renderColumnView() : renderListView()}
          {viewMode === 'column' && renderCombinedPreview()}
        </>
      )}
    </section>
  );
};
