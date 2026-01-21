import { useState, useRef } from 'react';
import { 
  Plus, X, Pencil, Upload, Image as ImageIcon,
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
import { SectionHeader } from './SectionHeader';
import type { LucideIcon } from 'lucide-react';

interface ValuesSectionProps {
  values: BrandValue[];
  onValuesChange: (values: BrandValue[]) => void;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
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

// Extended BrandValue to support image mode
interface ExtendedBrandValue extends BrandValue {
  imageUrl?: string;
  useImage?: boolean;
}

export const ValuesSection = ({ values, onValuesChange, customSubtitle, onSubtitleChange }: ValuesSectionProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isHeaderEditing, setIsHeaderEditing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Core Values');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);

  const addValue = () => {
    const newValue: ExtendedBrandValue = {
      id: crypto.randomUUID(),
      text: 'New Value',
      description: 'Describe what this value means to your organization',
      icon: 'heart',
      useImage: false,
    };
    onValuesChange([...values, newValue]);
    setEditingId(newValue.id);
  };

  const updateValue = (id: string, updates: Partial<ExtendedBrandValue>) => {
    onValuesChange(values.map(v => v.id === id ? { ...v, ...updates } : v));
  };

  const deleteValue = (id: string) => {
    onValuesChange(values.filter(v => v.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingFor) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      updateValue(uploadingFor, { imageUrl: url, useImage: true });
      setUploadingFor(null);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const triggerImageUpload = (valueId: string) => {
    setUploadingFor(valueId);
    fileInputRef.current?.click();
  };

  return (
    <section className="space-y-6">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <SectionHeader
            title="Philosophical Pillars"
            defaultSubtitle="Define your organization's core values and ethical framework"
            customSubtitle={customSubtitle}
            onSubtitleChange={onSubtitleChange}
            isEditing={isHeaderEditing}
            onEditToggle={() => setIsHeaderEditing(!isHeaderEditing)}
          />
        </div>
        <Button onClick={addValue} size="sm" className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          Add Value
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {values.map((value, index) => {
          const extValue = value as ExtendedBrandValue;
          const IconComponent = getIconComponent(value.icon);
          const isEditing = editingId === value.id;

          return (
            <div
              key={value.id}
              className={`group relative bg-card rounded-xl p-6 shadow-sm border border-border 
                transition-all duration-500 ease-out
                hover:shadow-xl hover:-translate-y-2 hover:border-accent/30
                hover:bg-gradient-to-br hover:from-card hover:to-accent/5
                ${!isEditing ? 'cursor-pointer' : ''}
              `}
              style={{ 
                animationDelay: `${index * 50}ms`,
                transformStyle: 'preserve-3d',
              }}
            >
              {isEditing ? (
                <div className="space-y-4">
                  {/* Mode Toggle */}
                  <Tabs 
                    value={extValue.useImage ? 'image' : 'icon'} 
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
                        {extValue.imageUrl ? (
                          <div className="relative group/img">
                            <img 
                              src={extValue.imageUrl} 
                              alt="Value" 
                              className="w-full h-24 object-cover rounded-lg"
                              loading="lazy"
                              decoding="async"
                            />
                            <button
                              onClick={() => triggerImageUpload(value.id)}
                              className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity rounded-lg"
                            >
                              <Upload className="h-6 w-6 text-white" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => triggerImageUpload(value.id)}
                            className="w-full h-24 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                          >
                            <Upload className="h-6 w-6" />
                            <span className="text-xs">Upload Image</span>
                          </button>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>

                  <Input
                    value={value.text}
                    onChange={(e) => updateValue(value.id, { text: e.target.value })}
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
                  <div className="flex items-start justify-between mb-4">
                    {extValue.useImage && extValue.imageUrl ? (
                      <div className="w-14 h-14 rounded-xl overflow-hidden shadow-md transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-xl">
                        <img 
                          src={extValue.imageUrl} 
                          alt={value.text} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          loading="lazy"
                          decoding="async"
                        />
                      </div>
                    ) : (
                      <div className="p-3 bg-accent/10 rounded-xl transition-all duration-300 group-hover:bg-accent/20 group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-lg group-hover:shadow-accent/20">
                        {IconComponent ? (
                          <IconComponent className="h-6 w-6 text-accent transition-transform duration-300 group-hover:scale-110" />
                        ) : (
                          <Heart className="h-6 w-6 text-accent transition-transform duration-300 group-hover:scale-110" />
                        )}
                      </div>
                    )}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setEditingId(value.id)}
                        className="p-1.5 rounded-md hover:bg-secondary transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => deleteValue(value.id)}
                        className="p-1.5 rounded-md hover:bg-destructive hover:text-destructive-foreground transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2 transition-colors duration-300 group-hover:text-accent">{value.text}</h3>
                  <p className="text-sm text-muted-foreground transition-all duration-300 group-hover:text-foreground/80">{value.description}</p>
                  
                  {/* Hover glow effect */}
                  <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-br from-accent/5 via-transparent to-accent/10" />
                  <div className="absolute -inset-0.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-r from-accent/20 via-transparent to-accent/20 blur-sm -z-10" />
                </>
              )}
            </div>
          );
        })}

        {values.length === 0 && (
          <button
            onClick={addValue}
            className="h-48 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-accent hover:text-accent transition-colors"
          >
            <Plus className="h-8 w-8" />
            <span className="text-sm font-medium">Add your first value</span>
          </button>
        )}
      </div>
    </section>
  );
};
