import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  Plus, X, Pencil, Upload, Image as ImageIcon, RefreshCw, ChevronLeft, ChevronRight, Loader2, FolderOpen,
  // Core values
  Heart, Star, Shield, Zap, Target, Users, Lightbulb, Award, Compass, Leaf,
  // Business & Growth
  TrendingUp, BarChart, Rocket, Briefcase, Building, Globe, Handshake, DollarSign,
  // Innovation & Tech
  Cpu, Code, Atom, Sparkles, Puzzle, Cog, Wand2, Brain,
  // Community & People
  UserCircle, HeartHandshake, MessageCircle, Share2, Network, UsersRound, Baby, Accessibility,
  // Nature & Sustainability
  Trees, Flower2, Sun, Moon, Mountain, Waves, Recycle, Wind,
  // Security & Trust
  Lock, Key, Eye, CheckCircle, ShieldCheck, Fingerprint, BadgeCheck, Scale,
  // Creativity & Arts
  Palette, Brush, Camera, Music, Mic, Film, BookOpen, Feather,
  // Health & Wellness
  HeartPulse, Apple, Activity, Smile, Coffee, Dumbbell, Salad, Bath,
  // Communication
  Mail, Phone, Send, Radio, Megaphone, Bell, MessageSquare, Podcast,
  // Time & Planning
  Clock, Calendar, Timer, Flag, Milestone, Route, Map, Navigation,
  // Abstract & Symbolic
  Infinity, Diamond, Crown, Gem, Flame, Anchor, Siren, Glasses
} from 'lucide-react';
import { BrandValue } from '@/types/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SectionHeader } from './SectionHeader';
import { SyncValuesButton } from './SyncValuesButton';
import { useStorageUpload } from '@/hooks/useStorageUpload';
import { ImageLibraryPicker } from '@/components/ui/ImageLibraryPicker';
import { toast } from 'sonner';
import type { LucideIcon } from 'lucide-react';
import { getPillarImage, getStablePillarImage, pillarImagesList, pillarImagesWithLabels } from '@/assets/pillars';
import { useSavePillarsToLibrary } from '@/hooks/useSavePillarsToLibrary';

interface ValuesSectionProps {
  values: BrandValue[];
  onValuesChange?: (values: BrandValue[]) => void;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
  organizationId?: string;
  brandId?: string;
  brandName?: string;
  canEdit?: boolean;
  onSyncComplete?: () => void;
}

interface IconCategory {
  name: string;
  icons: { name: string; Icon: LucideIcon }[];
}

const iconCategories: IconCategory[] = [
  {
    name: 'Core Values',
    icons: [
      { name: 'heart', Icon: Heart },
      { name: 'star', Icon: Star },
      { name: 'shield', Icon: Shield },
      { name: 'zap', Icon: Zap },
      { name: 'target', Icon: Target },
      { name: 'users', Icon: Users },
      { name: 'lightbulb', Icon: Lightbulb },
      { name: 'award', Icon: Award },
      { name: 'compass', Icon: Compass },
      { name: 'leaf', Icon: Leaf },
    ]
  },
  {
    name: 'Business',
    icons: [
      { name: 'trending-up', Icon: TrendingUp },
      { name: 'bar-chart', Icon: BarChart },
      { name: 'rocket', Icon: Rocket },
      { name: 'briefcase', Icon: Briefcase },
      { name: 'building', Icon: Building },
      { name: 'globe', Icon: Globe },
      { name: 'handshake', Icon: Handshake },
      { name: 'dollar-sign', Icon: DollarSign },
    ]
  },
  {
    name: 'Innovation',
    icons: [
      { name: 'cpu', Icon: Cpu },
      { name: 'code', Icon: Code },
      { name: 'atom', Icon: Atom },
      { name: 'sparkles', Icon: Sparkles },
      { name: 'puzzle', Icon: Puzzle },
      { name: 'cog', Icon: Cog },
      { name: 'wand', Icon: Wand2 },
      { name: 'brain', Icon: Brain },
    ]
  },
  {
    name: 'Community',
    icons: [
      { name: 'user-circle', Icon: UserCircle },
      { name: 'heart-handshake', Icon: HeartHandshake },
      { name: 'message-circle', Icon: MessageCircle },
      { name: 'share', Icon: Share2 },
      { name: 'network', Icon: Network },
      { name: 'users-round', Icon: UsersRound },
      { name: 'baby', Icon: Baby },
      { name: 'accessibility', Icon: Accessibility },
    ]
  },
  {
    name: 'Nature',
    icons: [
      { name: 'trees', Icon: Trees },
      { name: 'flower', Icon: Flower2 },
      { name: 'sun', Icon: Sun },
      { name: 'moon', Icon: Moon },
      { name: 'mountain', Icon: Mountain },
      { name: 'waves', Icon: Waves },
      { name: 'recycle', Icon: Recycle },
      { name: 'wind', Icon: Wind },
    ]
  },
  {
    name: 'Trust',
    icons: [
      { name: 'lock', Icon: Lock },
      { name: 'key', Icon: Key },
      { name: 'eye', Icon: Eye },
      { name: 'check-circle', Icon: CheckCircle },
      { name: 'shield-check', Icon: ShieldCheck },
      { name: 'fingerprint', Icon: Fingerprint },
      { name: 'badge-check', Icon: BadgeCheck },
      { name: 'scale', Icon: Scale },
    ]
  },
  {
    name: 'Creative',
    icons: [
      { name: 'palette', Icon: Palette },
      { name: 'brush', Icon: Brush },
      { name: 'camera', Icon: Camera },
      { name: 'music', Icon: Music },
      { name: 'mic', Icon: Mic },
      { name: 'film', Icon: Film },
      { name: 'book-open', Icon: BookOpen },
      { name: 'feather', Icon: Feather },
    ]
  },
  {
    name: 'Wellness',
    icons: [
      { name: 'heart-pulse', Icon: HeartPulse },
      { name: 'apple', Icon: Apple },
      { name: 'activity', Icon: Activity },
      { name: 'smile', Icon: Smile },
      { name: 'coffee', Icon: Coffee },
      { name: 'dumbbell', Icon: Dumbbell },
      { name: 'salad', Icon: Salad },
      { name: 'bath', Icon: Bath },
    ]
  },
  {
    name: 'Communication',
    icons: [
      { name: 'mail', Icon: Mail },
      { name: 'phone', Icon: Phone },
      { name: 'send', Icon: Send },
      { name: 'radio', Icon: Radio },
      { name: 'megaphone', Icon: Megaphone },
      { name: 'bell', Icon: Bell },
      { name: 'message-square', Icon: MessageSquare },
      { name: 'podcast', Icon: Podcast },
    ]
  },
  {
    name: 'Planning',
    icons: [
      { name: 'clock', Icon: Clock },
      { name: 'calendar', Icon: Calendar },
      { name: 'timer', Icon: Timer },
      { name: 'flag', Icon: Flag },
      { name: 'milestone', Icon: Milestone },
      { name: 'route', Icon: Route },
      { name: 'map', Icon: Map },
      { name: 'navigation', Icon: Navigation },
    ]
  },
  {
    name: 'Symbolic',
    icons: [
      { name: 'infinity', Icon: Infinity },
      { name: 'diamond', Icon: Diamond },
      { name: 'crown', Icon: Crown },
      { name: 'gem', Icon: Gem },
      { name: 'flame', Icon: Flame },
      { name: 'anchor', Icon: Anchor },
      { name: 'siren', Icon: Siren },
      { name: 'glasses', Icon: Glasses },
    ]
  },
];

// Flatten for lookup
const allIcons = iconCategories.flatMap(cat => cat.icons);

const getIconComponent = (iconName: string): LucideIcon | null => {
  const option = allIcons.find(o => o.name === iconName);
  return option?.Icon || null;
};

export const ValuesSection = ({ 
  values, 
  onValuesChange, 
  customSubtitle, 
  onSubtitleChange,
  organizationId,
  brandId,
  brandName,
  canEdit: canEditProp,
  onSyncComplete,
}: ValuesSectionProps) => {
  // Derive canEdit from prop or whether change handler is provided
  const canEdit = canEditProp ?? Boolean(onValuesChange);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [isHeaderEditing, setIsHeaderEditing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Core Values');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiProgress, setAiProgress] = useState<{ current: number; total: number } | null>(null);
  const [presetImageIndex, setPresetImageIndex] = useState<Record<string, number>>({});

  // Auto-save pillar images to org library on first render
  const { savePillarsToLibrary } = useSavePillarsToLibrary();
  useEffect(() => {
    if (organizationId) {
      savePillarsToLibrary(organizationId);
    }
  }, [organizationId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Storage upload hook for persistent pillar images
  const { uploadFile, isUploading, uploadProgress } = useStorageUpload({
    entityType: 'brand',
    entityId: brandId,
  });

  // Get current preset index for a value
  const getPresetIndex = (valueId: string) => {
    if (presetImageIndex[valueId] !== undefined) {
      return presetImageIndex[valueId];
    }
    // Try to find the current image in the preset list
    const value = values.find(v => v.id === valueId);
    if (value?.imageUrl) {
      const idx = pillarImagesList.findIndex(img => img === value.imageUrl);
      return idx >= 0 ? idx : 0;
    }
    return 0;
  };

  // Navigate through preset images
  const selectPresetImage = (valueId: string, direction: 'prev' | 'next') => {
    const currentIdx = getPresetIndex(valueId);
    let newIdx: number;
    if (direction === 'next') {
      newIdx = (currentIdx + 1) % pillarImagesList.length;
    } else {
      newIdx = (currentIdx - 1 + pillarImagesList.length) % pillarImagesList.length;
    }
    setPresetImageIndex(prev => ({ ...prev, [valueId]: newIdx }));
    updateValue(valueId, { imageUrl: pillarImagesList[newIdx], useImage: true });
  };


  const addValue = () => {
    if (!onValuesChange) return;
    const newValue: BrandValue = {
      id: crypto.randomUUID(),
      text: 'New Value',
      description: 'Describe what this value means to your organization',
      icon: 'heart',
      useImage: true,
    };
    onValuesChange([...values, newValue]);
    setEditingId(newValue.id);
  };

  // Auto-assign AI pillar image when text changes
  const handleTextChange = (id: string, newText: string) => {
    const matchingImage = getPillarImage(newText);
    const updates: Partial<BrandValue> = { text: newText };
    if (matchingImage) {
      updates.imageUrl = matchingImage;
      updates.useImage = true;
    }
    updateValue(id, updates);
  };

  const updateValue = (id: string, updates: Partial<BrandValue>) => {
    if (!onValuesChange) return;
    onValuesChange(values.map(v => v.id === id ? { ...v, ...updates } : v));
  };

  const deleteValue = (id: string) => {
    if (!onValuesChange) return;
    onValuesChange(values.filter(v => v.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingFor) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    try {
      // Upload to persistent storage
      const result = await uploadFile(file, 'asset', `pillar-${uploadingFor}`);
      
      if (result?.url) {
        updateValue(uploadingFor, { imageUrl: result.url, useImage: true });
        toast.success('Pillar image uploaded and saved');
      }
    } catch (err) {
      console.error('Upload failed:', err);
      toast.error('Failed to upload image');
    } finally {
      setUploadingFor(null);
      e.target.value = '';
    }
  }, [uploadingFor, uploadFile, updateValue]);

  const triggerImageUpload = (valueId: string) => {
    if (!brandId) {
      toast.error('Please save the brand first before uploading images');
      return;
    }
    setUploadingFor(valueId);
    fileInputRef.current?.click();
  };

  // AI-generate industry-relevant pillar images for all values
  const generateAiPillarImages = useCallback(async () => {
    if (!brandId || aiGenerating || values.length === 0) return;
    setAiGenerating(true);
    setAiProgress({ current: 0, total: values.length });
    
    let successCount = 0;
    for (let i = 0; i < values.length; i++) {
      const value = values[i];
      setAiProgress({ current: i + 1, total: values.length });
      
      try {
        const { data, error } = await supabase.functions.invoke('generate-pillar-image', {
          body: {
            pillarName: value.text,
            pillarDescription: value.description,
            brandName: brandName || '',
            industry: '', // will be inferred from brand name
            brandId,
          },
        });
        
        if (error) {
          console.error(`Failed to generate image for ${value.text}:`, error);
          continue;
        }
        
        if (data?.url) {
          updateValue(value.id, { imageUrl: data.url, useImage: true });
          successCount++;
        }
      } catch (err) {
        console.error(`Error generating pillar image for ${value.text}:`, err);
      }
    }
    
    if (successCount > 0) {
      toast.success(`Generated ${successCount} AI pillar images`);
    } else {
      toast.error('Failed to generate pillar images. Please try again.');
    }
    
    setAiGenerating(false);
    setAiProgress(null);
  }, [brandId, aiGenerating, values, brandName, updateValue]);

  return (
    <section className="space-y-4 sm:space-y-6">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <SectionHeader
            title="Philosophical Pillars"
            defaultSubtitle="Define your organization's core values and ethical framework"
            customSubtitle={customSubtitle}
            onSubtitleChange={onSubtitleChange}
            isEditing={isHeaderEditing}
            onEditToggle={() => setIsHeaderEditing(!isHeaderEditing)}
          />
        </div>
        {canEdit && onValuesChange && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0 w-full sm:w-auto">
            {organizationId && brandId && brandName && (
              <SyncValuesButton
                values={values}
                organizationId={organizationId}
                brandId={brandId}
                brandName={brandName}
                onSyncComplete={onSyncComplete}
              />
            )}
            <Button onClick={addValue} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Value
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {(() => {
          // Track used images to ensure uniqueness across all pillar cards
          const usedImages = new Set<string>();
          
          const resolveUniqueImage = (value: BrandValue): string | null => {
            if (!value.useImage) return null;

            // Helper: check if a URL is a valid external/storage URL (not a broken local path)
            const isValidExternalUrl = (url: string) =>
              url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:'));
            
            // 1. Try keyword match from bundled pillar assets first (always fresh)
            const keywordMatch = getPillarImage(value.text);
            if (keywordMatch && !usedImages.has(keywordMatch)) {
              usedImages.add(keywordMatch);
              return keywordMatch;
            }
            
            // 2. Try custom uploaded image (only valid external URLs, skip broken local paths)
            if (value.imageUrl && isValidExternalUrl(value.imageUrl) && !pillarImagesList.includes(value.imageUrl) && !usedImages.has(value.imageUrl)) {
              usedImages.add(value.imageUrl);
              return value.imageUrl;
            }
            
            // 3. Try stable hash image from bundled assets
            const stableImg = getStablePillarImage(value.text);
            if (!usedImages.has(stableImg)) {
              usedImages.add(stableImg);
              return stableImg;
            }
            
            // 4. Fallback: pick first unused pillar image
            for (const img of pillarImagesList) {
              if (!usedImages.has(img)) {
                usedImages.add(img);
                return img;
              }
            }
            
            // 5. All exhausted, allow reuse
            return keywordMatch || stableImg;
          };
          
          return values.map((value, index) => {
          const IconComponent = getIconComponent(value.icon);
          const isEditing = editingId === value.id;
          const resolvedImage = resolveUniqueImage(value);

          return (
            <div
              key={value.id}
              className={`group relative bg-card rounded-lg p-3 sm:p-4 shadow-sm border border-border 
                transition-all duration-500 ease-out
                hover:shadow-lg hover:-translate-y-1 hover:border-accent/30
                hover:bg-gradient-to-br hover:from-card hover:to-accent/5
                cursor-pointer
              `}
              style={{ 
                animationDelay: `${index * 50}ms`,
                transformStyle: 'preserve-3d',
              }}
              onClick={() => {
                if (!isEditing) setViewingId(value.id);
              }}
            >
              {isEditing ? (
                <div className="space-y-4">
                  {/* Mode Toggle */}
                  <Tabs 
                    value={value.useImage ? 'image' : 'icon'} 
                    onValueChange={(v) => updateValue(value.id, { useImage: v === 'image' })}
                    className="w-full"
                  >
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="icon" className="gap-2">
                        <Sparkles className="h-4 w-4" />
                        Icon
                      </TabsTrigger>
                      <TabsTrigger value="image" className="gap-2">
                        <ImageIcon className="h-4 w-4" />
                        Image
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="icon" className="mt-4">
                      {/* Category tabs */}
                      <div className="space-y-3">
                        <ScrollArea className="w-full whitespace-nowrap">
                          <div className="flex gap-1 pb-2">
                            {iconCategories.map((cat) => (
                              <Button
                                key={cat.name}
                                variant={selectedCategory === cat.name ? 'secondary' : 'ghost'}
                                size="sm"
                                className="text-xs shrink-0"
                                onClick={() => setSelectedCategory(cat.name)}
                              >
                                {cat.name}
                              </Button>
                            ))}
                          </div>
                        </ScrollArea>
                        
                        {/* Icon grid */}
                        <div className="grid grid-cols-4 gap-2 p-2 bg-muted/50 rounded-lg max-h-32 overflow-y-auto">
                          {iconCategories
                            .find(c => c.name === selectedCategory)
                            ?.icons.map(({ name, Icon }) => (
                              <button
                                key={name}
                                onClick={() => updateValue(value.id, { icon: name })}
                                className={`p-2 rounded-lg transition-all ${
                                  value.icon === name 
                                    ? 'bg-primary text-primary-foreground shadow-md scale-110' 
                                    : 'hover:bg-secondary'
                                }`}
                              >
                                <Icon className="h-5 w-5 mx-auto" />
                              </button>
                            ))}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="image" className="mt-4">
                      <div className="space-y-3">
                        {/* Preset Image Selector */}
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-muted-foreground">Select from presets</label>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 shrink-0"
                              onClick={() => selectPresetImage(value.id, 'prev')}
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="flex-1 h-20 rounded-lg overflow-hidden relative group/preset">
                              <img 
                                src={pillarImagesList[getPresetIndex(value.id)]} 
                                alt="Preset" 
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover/preset:opacity-100 transition-opacity">
                                <span className="text-white text-xs font-medium px-2 text-center">
                                  {pillarImagesWithLabels[getPresetIndex(value.id)]?.label || 'Preset'}
                                </span>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 shrink-0"
                              onClick={() => selectPresetImage(value.id, 'next')}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-[10px] text-muted-foreground text-center">
                            {pillarImagesWithLabels[getPresetIndex(value.id)]?.label} ({getPresetIndex(value.id) + 1} of {pillarImagesList.length})
                          </p>
                        </div>
                        
                        {/* Image Library Option */}
                        <div className="pt-2 border-t border-border">
                          <label className="text-xs font-medium text-muted-foreground mb-2 block">Choose from library</label>
                          <ImageLibraryPicker
                            onSelect={(url) => {
                              updateValue(value.id, { imageUrl: url, useImage: true });
                              toast.success('Image selected from library');
                            }}
                            defaultCategory="General"
                            trigger={
                              <button
                                className="w-full h-12 border-2 border-dashed border-border rounded-lg flex items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                              >
                                <FolderOpen className="h-4 w-4" />
                                <span className="text-xs">Select from Image Library</span>
                              </button>
                            }
                          />
                        </div>

                        {/* Custom Upload Option */}
                        <div className="pt-2 border-t border-border">
                          <label className="text-xs font-medium text-muted-foreground mb-2 block">Or upload new image</label>
                          {isUploading && uploadingFor === value.id ? (
                            <div className="w-full h-12 border-2 border-primary/50 rounded-lg flex flex-col items-center justify-center gap-2 bg-primary/5">
                              <Loader2 className="h-4 w-4 animate-spin text-primary" />
                              <Progress value={uploadProgress} className="w-3/4 h-1" />
                              <span className="text-xs text-muted-foreground">Uploading... {uploadProgress}%</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => triggerImageUpload(value.id)}
                              disabled={!brandId}
                              className="w-full h-12 border-2 border-dashed border-border rounded-lg flex items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Upload className="h-4 w-4" />
                              <span className="text-xs">
                                {brandId ? 'Upload to Storage' : 'Save brand first'}
                              </span>
                            </button>
                          )}
                          {value.imageUrl && !value.imageUrl.includes('supabase.co') && (
                            <p className="text-[10px] text-warning mt-1 text-center">
                              ⚠️ Current image is not in persistent storage
                            </p>
                          )}
                          {value.imageUrl?.includes('supabase.co') && (
                            <p className="text-[10px] text-emerald-600 mt-1 text-center">
                              ✓ Saved to persistent storage
                            </p>
                          )}
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>

                  <Input
                    value={value.text}
                    onChange={(e) => handleTextChange(value.id, e.target.value)}
                    placeholder="Value name"
                  />
                  <Textarea
                    value={value.description}
                    onChange={(e) => updateValue(value.id, { description: e.target.value })}
                    placeholder="Description"
                    className="min-h-[80px] resize-none"
                  />
                  <Button size="sm" variant="secondary" onClick={() => setEditingId(null)} className="w-full">
                    Done
                  </Button>
                </div>
              ) : (
              <>
                   {/* Full-width image at top for image mode */}
                   {resolvedImage && (
                       <div className="-mx-3 sm:-mx-4 -mt-3 sm:-mt-4 mb-3 h-28 sm:h-36 rounded-t-lg overflow-hidden relative">
                         <img 
                           src={resolvedImage} 
                           alt={value.text} 
                           className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                           loading="lazy"
                           decoding="async"
                         />
                       </div>
                   )}
                   
                   {/* Show icon only if not in image mode */}
                   <div className="flex items-start justify-between mb-2">
                     {!value.useImage ? (
                       <div className="p-2 bg-accent/10 rounded-lg transition-all duration-300 group-hover:bg-accent/20 group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-lg group-hover:shadow-accent/20">
                         {IconComponent ? (
                           <IconComponent className="h-5 w-5 text-accent transition-transform duration-300 group-hover:scale-110" />
                         ) : (
                           <Heart className="h-5 w-5 text-accent transition-transform duration-300 group-hover:scale-110" />
                         )}
                       </div>
                     ) : <div />}
                     {canEdit && (
                       <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditingId(value.id); }}
                            className="p-1.5 rounded-md hover:bg-secondary transition-colors"
                          >
                            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteValue(value.id); }}
                            className="p-1.5 rounded-md hover:bg-destructive hover:text-destructive-foreground transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                     )}
                   </div>
                   <h3 className="text-sm sm:text-base font-semibold text-foreground mb-1 transition-colors duration-300 group-hover:text-accent leading-tight">{value.text}</h3>
                   <p className="text-xs text-muted-foreground transition-all duration-300 group-hover:text-foreground/80 line-clamp-2">{value.description}</p>
                   
                   {/* Hover glow effect */}
                   <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-br from-accent/5 via-transparent to-accent/10" />
                   <div className="absolute -inset-0.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-r from-accent/20 via-transparent to-accent/20 blur-sm -z-10" />
                 </>
               )}
             </div>
           );
         });
         })()}

        {values.length === 0 && canEdit && (
          <button
            onClick={addValue}
            className="h-32 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-accent hover:text-accent transition-colors"
          >
            <Plus className="h-8 w-8" />
            <span className="text-sm font-medium">Add your first value</span>
          </button>
        )}
      </div>

      {/* Pillar Detail Dialog */}
      <Dialog open={!!viewingId} onOpenChange={(open) => { if (!open) setViewingId(null); }}>
        <DialogContent className="max-w-lg sm:max-w-xl">
          {(() => {
            const viewingValue = values.find(v => v.id === viewingId);
            if (!viewingValue) return null;
            const ViewIcon = getIconComponent(viewingValue.icon);
            const viewImage = viewingValue.useImage 
              ? (viewingValue.imageUrl || getStablePillarImage(viewingValue.text))
              : null;
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3 text-lg">
                    {!viewingValue.useImage && ViewIcon && (
                      <div className="p-2.5 bg-accent/10 rounded-lg">
                        <ViewIcon className="h-6 w-6 text-accent" />
                      </div>
                    )}
                    {viewingValue.text}
                  </DialogTitle>
                </DialogHeader>
                {viewImage && (
                  <div className="w-full h-48 sm:h-56 rounded-lg overflow-hidden">
                    <img 
                      src={viewImage} 
                      alt={viewingValue.text} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {viewingValue.description || 'No description provided.'}
                  </p>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </section>
  );
};
