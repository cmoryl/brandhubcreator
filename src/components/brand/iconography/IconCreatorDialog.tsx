/**
 * IconCreatorDialog - Comprehensive icon creation and editing tool
 * Features: AI generation, Lucide library, SVG upload, style controls, multi-format export
 */

import { useState, useCallback, useRef, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Wand2,
  Upload,
  Library,
  Palette,
  Download,
  Loader2,
  Check,
  Search,
  Square,
  Circle,
  Minus,
  Plus,
  X,
  RotateCcw,
  Copy,
  Sparkles,
  Grid,
  ChevronRight,
  ChevronLeft,
  type LucideIcon,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { toast } from 'sonner';
import DOMPurify from 'dompurify';
import JSZip from 'jszip';
import { BrandIconography } from '@/types/brand';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

// Get all Lucide icon names (filter out non-icon exports)
const LUCIDE_ICON_NAMES = Object.keys(LucideIcons).filter(
  (key) => 
    key !== 'createLucideIcon' && 
    key !== 'default' && 
    key !== 'icons' &&
    key !== 'Icon' &&
    typeof (LucideIcons as any)[key] === 'function' &&
    key.charAt(0) === key.charAt(0).toUpperCase()
);

// Icon categories for filtering - expanded with more icons per category
const LUCIDE_CATEGORIES: Record<string, { icons: string[]; description: string }> = {
  'Navigation': {
    icons: ['Home', 'Menu', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'ChevronLeft', 'ChevronRight', 'ChevronUp', 'ChevronDown', 'CornerUpLeft', 'CornerUpRight', 'Navigation', 'Compass', 'Map', 'MapPin', 'Move', 'MoveHorizontal', 'MoveVertical', 'Locate', 'LocateFixed', 'Navigation2', 'Route', 'Signpost'],
    description: 'Arrows, menus & wayfinding'
  },
  'Actions': {
    icons: ['Plus', 'Minus', 'X', 'Check', 'Edit', 'Edit2', 'Edit3', 'Trash', 'Trash2', 'Copy', 'Clipboard', 'ClipboardCheck', 'ClipboardCopy', 'Download', 'Upload', 'Share', 'Share2', 'Send', 'Save', 'Refresh', 'RotateCcw', 'RotateCw', 'Undo', 'Undo2', 'Redo', 'Redo2', 'ExternalLink', 'Link', 'Link2', 'Unlink', 'Maximize', 'Minimize', 'Maximize2', 'Minimize2'],
    description: 'Common action buttons'
  },
  'Social': {
    icons: ['Facebook', 'Twitter', 'Instagram', 'Linkedin', 'Youtube', 'Github', 'Gitlab', 'Slack', 'Discord', 'Twitch', 'Dribbble', 'Figma', 'Chrome', 'Codepen'],
    description: 'Social media & platforms'
  },
  'Status': {
    icons: ['AlertCircle', 'AlertTriangle', 'AlertOctagon', 'Info', 'HelpCircle', 'CheckCircle', 'CheckCircle2', 'XCircle', 'XOctagon', 'Clock', 'Clock1', 'Clock2', 'Clock3', 'Clock4', 'Loader', 'Loader2', 'Hourglass', 'Timer', 'TimerOff', 'Ban', 'CircleDot', 'CircleSlash'],
    description: 'Alerts, loading & status'
  },
  'Commerce': {
    icons: ['ShoppingCart', 'ShoppingBag', 'CreditCard', 'DollarSign', 'Euro', 'PoundSterling', 'Wallet', 'Wallet2', 'Receipt', 'Gift', 'Package', 'Package2', 'Truck', 'Store', 'Banknote', 'Coins', 'PiggyBank', 'BadgeDollarSign', 'BadgePercent', 'Percent', 'Tag', 'Tags', 'Barcode', 'QrCode'],
    description: 'Shopping & payments'
  },
  'Media': {
    icons: ['Play', 'Pause', 'PlayCircle', 'PauseCircle', 'SkipBack', 'SkipForward', 'Rewind', 'FastForward', 'Volume', 'Volume1', 'Volume2', 'VolumeX', 'Music', 'Music2', 'Music3', 'Music4', 'Video', 'VideoOff', 'Camera', 'CameraOff', 'Image', 'Images', 'Film', 'Clapperboard', 'Mic', 'MicOff', 'Headphones', 'Radio', 'Podcast', 'MonitorPlay'],
    description: 'Audio, video & media'
  },
  'Communication': {
    icons: ['Mail', 'MailOpen', 'MailPlus', 'MailMinus', 'MailCheck', 'MailX', 'MessageCircle', 'MessageSquare', 'MessagesSquare', 'Phone', 'PhoneCall', 'PhoneIncoming', 'PhoneOutgoing', 'PhoneMissed', 'PhoneOff', 'Bell', 'BellRing', 'BellOff', 'BellPlus', 'AtSign', 'Hash', 'Send', 'SendHorizontal', 'Reply', 'ReplyAll', 'Forward'],
    description: 'Messages & notifications'
  },
  'Files': {
    icons: ['File', 'FileText', 'FileCode', 'FileCode2', 'FileJson', 'FileImage', 'FileVideo', 'FileAudio', 'FileArchive', 'FilePlus', 'FilePlus2', 'FileMinus', 'FileCheck', 'FileX', 'FileSearch', 'FileEdit', 'Folder', 'FolderOpen', 'FolderPlus', 'FolderMinus', 'FolderCheck', 'FolderX', 'FolderSearch', 'Archive', 'Paperclip', 'FileBadge', 'FileSpreadsheet'],
    description: 'Documents & folders'
  },
  'Users': {
    icons: ['User', 'UserCircle', 'UserCircle2', 'Users', 'Users2', 'UserPlus', 'UserPlus2', 'UserMinus', 'UserMinus2', 'UserCheck', 'UserCheck2', 'UserX', 'UserX2', 'UserCog', 'Contact', 'Contact2', 'Smile', 'Frown', 'Meh', 'Angry', 'Laugh', 'PersonStanding', 'Accessibility', 'Baby', 'HeartHandshake'],
    description: 'People & profiles'
  },
  'Settings': {
    icons: ['Settings', 'Settings2', 'Sliders', 'SlidersHorizontal', 'Cog', 'Wrench', 'Tool', 'Hammer', 'Lock', 'LockOpen', 'Unlock', 'Key', 'KeyRound', 'Shield', 'ShieldCheck', 'ShieldAlert', 'ShieldOff', 'Eye', 'EyeOff', 'Filter', 'SortAsc', 'SortDesc', 'Gauge', 'ToggleLeft', 'ToggleRight'],
    description: 'Configuration & security'
  },
  'Development': {
    icons: ['Code', 'Code2', 'Terminal', 'TerminalSquare', 'Braces', 'Brackets', 'Bug', 'Database', 'Server', 'HardDrive', 'Cpu', 'Binary', 'GitBranch', 'GitCommit', 'GitMerge', 'GitPullRequest', 'GitFork', 'Webhook', 'Api', 'Blocks', 'Component', 'Puzzle', 'Variable'],
    description: 'Code & technical'
  },
  'Layout': {
    icons: ['Layout', 'LayoutDashboard', 'LayoutGrid', 'LayoutList', 'LayoutTemplate', 'PanelLeft', 'PanelRight', 'PanelTop', 'PanelBottom', 'Columns', 'Rows', 'Grid', 'Grid2x2', 'Grid3x3', 'Table', 'Table2', 'Kanban', 'GalleryHorizontal', 'GalleryVertical', 'Sidebar', 'SidebarOpen', 'SidebarClose', 'Layers', 'Layers2', 'Layers3'],
    description: 'UI structure & grids'
  },
  'Charts': {
    icons: ['BarChart', 'BarChart2', 'BarChart3', 'BarChart4', 'BarChartHorizontal', 'LineChart', 'PieChart', 'Activity', 'TrendingUp', 'TrendingDown', 'ArrowUpRight', 'ArrowDownRight', 'Target', 'Goal', 'Gauge', 'Percent', 'Calculator'],
    description: 'Data visualization'
  },
  'Weather': {
    icons: ['Sun', 'Moon', 'Cloud', 'CloudRain', 'CloudSnow', 'CloudLightning', 'CloudSun', 'CloudMoon', 'CloudFog', 'Cloudy', 'Wind', 'Snowflake', 'Thermometer', 'ThermometerSun', 'ThermometerSnowflake', 'Umbrella', 'Rainbow', 'Sunrise', 'Sunset', 'Eclipse'],
    description: 'Climate & conditions'
  },
  'Nature': {
    icons: ['Leaf', 'TreeDeciduous', 'TreePine', 'Trees', 'Flower', 'Flower2', 'Sprout', 'Mountain', 'MountainSnow', 'Waves', 'Droplet', 'Droplets', 'Flame', 'Zap', 'ZapOff', 'Star', 'Sparkle', 'Sparkles', 'Globe', 'Globe2', 'Earth'],
    description: 'Environment & elements'
  },
};

// Style presets - comprehensive collection for professional icon design
const STYLE_PRESETS = [
  // Core styles
  { id: 'outlined', name: 'Outlined', strokeWidth: 2, fill: false, cornerRadius: 'rounded', description: 'Classic outline style' },
  { id: 'filled', name: 'Filled', strokeWidth: 0, fill: true, cornerRadius: 'rounded', description: 'Solid filled icons' },
  
  // Minimalist styles
  { id: 'minimalist', name: 'Minimalist', strokeWidth: 1, fill: false, cornerRadius: 'rounded', description: 'Ultra-clean thin lines' },
  { id: 'hairline', name: 'Hairline', strokeWidth: 0.75, fill: false, cornerRadius: 'rounded', description: 'Delicate fine lines' },
  
  // Bold styles
  { id: 'bold-outline', name: 'Bold Outline', strokeWidth: 2.5, fill: false, cornerRadius: 'rounded', description: 'Strong visible strokes' },
  { id: 'extra-bold', name: 'Extra Bold', strokeWidth: 3.5, fill: false, cornerRadius: 'rounded', description: 'Maximum impact' },
  
  // Duo-tone & gradient styles
  { id: 'duotone', name: 'Duo-tone', strokeWidth: 1.5, fill: true, cornerRadius: 'rounded', opacity: 0.2, description: 'Stroke with soft fill' },
  { id: 'duotone-bold', name: 'Duo-tone Bold', strokeWidth: 2.5, fill: true, cornerRadius: 'rounded', opacity: 0.15, description: 'Bold stroke with fill' },
  { id: 'glass', name: 'Glass', strokeWidth: 1.5, fill: true, cornerRadius: 'soft', opacity: 0.1, description: 'Subtle glassmorphic effect' },
  
  // Sharp & geometric styles
  { id: 'sharp', name: 'Sharp', strokeWidth: 2, fill: false, cornerRadius: 'sharp', description: 'Angular geometric corners' },
  { id: 'sharp-bold', name: 'Sharp Bold', strokeWidth: 2.5, fill: false, cornerRadius: 'sharp', description: 'Bold geometric style' },
  { id: 'sharp-filled', name: 'Sharp Filled', strokeWidth: 0, fill: true, cornerRadius: 'sharp', description: 'Solid geometric icons' },
  
  // Soft styles
  { id: 'soft-rounded', name: 'Soft Rounded', strokeWidth: 2, fill: false, cornerRadius: 'soft', description: 'Extra-rounded friendly look' },
  { id: 'soft-filled', name: 'Soft Filled', strokeWidth: 0, fill: true, cornerRadius: 'soft', description: 'Rounded filled icons' },
  
  // Special effect styles
  { id: 'thick-stroke', name: 'Thick Stroke', strokeWidth: 4, fill: false, cornerRadius: 'rounded', description: 'Very heavy strokes' },
  { id: 'subtle', name: 'Subtle', strokeWidth: 1.25, fill: false, cornerRadius: 'rounded', opacity: 0.7, description: 'Muted appearance' },
];

// Export sizes
const EXPORT_SIZES = [16, 24, 32, 48, 64, 128, 256, 512];

interface IconCreatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (icons: BrandIconography[]) => void;
  brandColors?: Array<{ hex: string; name: string }>;
  existingIcon?: BrandIconography;
}

interface IconStyle {
  strokeWidth: number;
  fill: boolean;
  cornerRadius: 'sharp' | 'rounded' | 'soft';
  color: string;
  fillOpacity: number;
}

export const IconCreatorDialog = ({
  open,
  onOpenChange,
  onSave,
  brandColors = [],
  existingIcon,
}: IconCreatorDialogProps) => {
  const [activeTab, setActiveTab] = useState<'library' | 'ai' | 'upload'>('library');
  
  // Library state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedIcons, setSelectedIcons] = useState<string[]>([]);
  
  // AI generation state
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSvg, setGeneratedSvg] = useState<string | null>(null);
  
  // Upload state
  const [uploadedSvg, setUploadedSvg] = useState<string | null>(null);
  const [uploadedName, setUploadedName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Style state
  const [iconStyle, setIconStyle] = useState<IconStyle>({
    strokeWidth: 2,
    fill: false,
    cornerRadius: 'rounded',
    color: '#000000',
    fillOpacity: 1,
  });
  const [activePreset, setActivePreset] = useState<string>('outlined');
  
  // Export state
  const [exportSizes, setExportSizes] = useState<number[]>([24, 48]);
  const [iconCategory, setIconCategory] = useState<string>('Other');
  const [iconName, setIconName] = useState('');

  // Filter Lucide icons - supports category grouping and search
  const filteredIcons = useMemo(() => {
    let icons = LUCIDE_ICON_NAMES;
    
    if (selectedCategory !== 'all') {
      const categoryData = LUCIDE_CATEGORIES[selectedCategory];
      const categoryIcons = categoryData?.icons || [];
      icons = icons.filter(name => categoryIcons.includes(name));
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      icons = icons.filter(name => name.toLowerCase().includes(query));
    }
    
    return icons.slice(0, 200); // Limit for performance
  }, [searchQuery, selectedCategory]);

  // Get icons grouped by category for "all" view
  const groupedIcons = useMemo(() => {
    if (selectedCategory !== 'all' || searchQuery) return null;
    
    const groups: Record<string, string[]> = {};
    Object.entries(LUCIDE_CATEGORIES).forEach(([catName, catData]) => {
      const validIcons = catData.icons.filter(name => LUCIDE_ICON_NAMES.includes(name));
      if (validIcons.length > 0) {
        groups[catName] = validIcons.slice(0, 12); // Show preview of 12 icons per category
      }
    });
    return groups;
  }, [selectedCategory, searchQuery]);

  // Toggle icon selection
  const toggleIconSelection = (iconName: string) => {
    setSelectedIcons(prev => 
      prev.includes(iconName) 
        ? prev.filter(n => n !== iconName)
        : [...prev, iconName]
    );
  };

  // Apply style preset
  const applyPreset = (presetId: string) => {
    const preset = STYLE_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setActivePreset(presetId);
      setIconStyle(prev => ({
        ...prev,
        strokeWidth: preset.strokeWidth,
        fill: preset.fill,
        cornerRadius: preset.cornerRadius as 'sharp' | 'rounded' | 'soft',
        fillOpacity: preset.opacity ?? 1,
      }));
    }
  };

  // Generate icon with AI
  const generateIconWithAI = async () => {
    if (!aiPrompt.trim()) {
      toast.error('Please describe the icon you want to create');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await supabase.functions.invoke('generate-icon', {
        body: { 
          prompt: aiPrompt,
          style: iconStyle,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to generate icon');
      }

      if (response.data?.svg) {
        setGeneratedSvg(response.data.svg);
        setIconName(aiPrompt.split(' ').slice(0, 2).join('-').toLowerCase());
        toast.success('Icon generated successfully!');
      } else {
        throw new Error('No SVG returned from generation');
      }
    } catch (err) {
      console.error('AI generation error:', err);
      toast.error('Failed to generate icon. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle SVG file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.svg')) {
      toast.error('Please upload an SVG file');
      return;
    }

    try {
      const text = await file.text();
      const sanitized = DOMPurify.sanitize(text, {
        USE_PROFILES: { svg: true, svgFilters: true },
        FORBID_TAGS: ['script', 'foreignObject'],
      });
      
      setUploadedSvg(sanitized);
      setUploadedName(file.name.replace('.svg', ''));
      setIconName(file.name.replace('.svg', ''));
      toast.success('SVG uploaded successfully');
    } catch (err) {
      toast.error('Failed to read SVG file');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Get SVG string from Lucide icon
  const getLucideSvgString = (iconName: string): string => {
    const IconComponent = (LucideIcons as any)[iconName] as LucideIcon;
    if (!IconComponent) return '';

    // Create a temporary container to render the icon
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="${iconStyle.fill ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="${iconStyle.strokeWidth}" stroke-linecap="${iconStyle.cornerRadius === 'sharp' ? 'square' : 'round'}" stroke-linejoin="${iconStyle.cornerRadius === 'sharp' ? 'miter' : 'round'}"></svg>`;
    
    return svgContent;
  };

  // Convert SVG to PNG at specified size
  const svgToPng = async (svgString: string, size: number, color?: string): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Apply color if specified
      let processedSvg = svgString;
      if (color && color !== 'currentColor') {
        processedSvg = processedSvg
          .replace(/stroke="currentColor"/gi, `stroke="${color}"`)
          .replace(/fill="currentColor"/gi, `fill="${color}"`);
      }

      const img = new Image();
      const svgBlob = new Blob([processedSvg], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        ctx.clearRect(0, 0, size, size);
        ctx.drawImage(img, 0, 0, size, size);
        URL.revokeObjectURL(url);
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Could not create PNG blob'));
        }, 'image/png');
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Could not load SVG'));
      };

      img.src = url;
    });
  };

  // Download selected icons
  const downloadSelectedIcons = async () => {
    const iconsToExport = selectedIcons;
    if (iconsToExport.length === 0) {
      toast.error('Please select at least one icon');
      return;
    }

    const loadingToast = toast.loading(`Exporting ${iconsToExport.length} icons...`);
    
    try {
      const zip = new JSZip();
      
      for (const size of exportSizes) {
        const sizeFolder = zip.folder(`${size}px`);
        const svgFolder = sizeFolder?.folder('svg');
        const pngFolder = sizeFolder?.folder('png');
        
        for (const iconName of iconsToExport) {
          const IconComponent = (LucideIcons as any)[iconName];
          if (!IconComponent) continue;

          // Create SVG string
          const svgString = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${iconStyle.fill ? iconStyle.color : 'none'}" stroke="${iconStyle.color}" stroke-width="${iconStyle.strokeWidth}" stroke-linecap="${iconStyle.cornerRadius === 'sharp' ? 'square' : 'round'}" stroke-linejoin="${iconStyle.cornerRadius === 'sharp' ? 'miter' : 'round'}">
  <!-- ${iconName} from Lucide Icons -->
</svg>`;

          const safeName = iconName.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
          svgFolder?.file(`${safeName}.svg`, svgString);

          // Create PNG
          try {
            const pngBlob = await svgToPng(svgString, size, iconStyle.color);
            pngFolder?.file(`${safeName}.png`, pngBlob);
          } catch (err) {
            console.warn(`Failed to create PNG for ${iconName}:`, err);
          }
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `icon-set-${exportSizes.join('-')}px.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.dismiss(loadingToast);
      toast.success(`Exported ${iconsToExport.length} icons in ${exportSizes.length} sizes`);
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error('Failed to export icons');
      console.error('Export error:', err);
    }
  };

  // Save icons to brand
  const handleSave = () => {
    const newIcons: BrandIconography[] = [];

    // Add selected Lucide icons
    for (const iconName of selectedIcons) {
      newIcons.push({
        id: crypto.randomUUID(),
        name: iconName.replace(/([A-Z])/g, ' $1').trim(),
        svgPath: iconName, // Store the Lucide icon name as reference
        category: iconCategory,
        viewBox: '0 0 24 24',
        fillMode: iconStyle.fill ? 'fill' : 'stroke',
      });
    }

    // Add AI generated or uploaded SVG
    if ((generatedSvg || uploadedSvg) && iconName) {
      const svgContent = generatedSvg || uploadedSvg || '';
      newIcons.push({
        id: crypto.randomUUID(),
        name: iconName,
        svgPath: svgContent,
        category: iconCategory,
        viewBox: '0 0 24 24',
        fillMode: iconStyle.fill ? 'fill' : 'stroke',
      });
    }

    if (newIcons.length === 0) {
      toast.error('Please select or create at least one icon');
      return;
    }

    onSave(newIcons);
    resetState();
    onOpenChange(false);
    toast.success(`Added ${newIcons.length} icon(s) to your brand`);
  };

  // Reset all state
  const resetState = () => {
    setSelectedIcons([]);
    setAiPrompt('');
    setGeneratedSvg(null);
    setUploadedSvg(null);
    setUploadedName('');
    setIconName('');
    setSearchQuery('');
    setSelectedCategory('all');
  };

  // Render icon preview with current styles
  const renderStyledIcon = (IconComponent: LucideIcon, size: number = 24) => {
    return (
      <IconComponent
        size={size}
        strokeWidth={iconStyle.strokeWidth}
        style={{ 
          color: iconStyle.color,
          fill: iconStyle.fill ? iconStyle.color : 'none',
          opacity: iconStyle.fillOpacity,
        }}
        strokeLinecap={iconStyle.cornerRadius === 'sharp' ? 'square' : 'round'}
        strokeLinejoin={iconStyle.cornerRadius === 'sharp' ? 'miter' : 'round'}
      />
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Icon System Creator
          </DialogTitle>
          <DialogDescription>
            Create, customize, and export professional icons for your brand
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
          {/* Left Panel - Icon Source */}
          <div className="lg:col-span-2 flex flex-col overflow-hidden">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="library" className="gap-2">
                  <Library className="h-4 w-4" />
                  Library
                </TabsTrigger>
                <TabsTrigger value="ai" className="gap-2">
                  <Wand2 className="h-4 w-4" />
                  AI Generate
                </TabsTrigger>
                <TabsTrigger value="upload" className="gap-2">
                  <Upload className="h-4 w-4" />
                  Upload
                </TabsTrigger>
              </TabsList>

              {/* Library Tab */}
              <TabsContent value="library" className="flex-1 flex flex-col space-y-4 overflow-hidden mt-4">
                {/* Search and Filter Bar */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search 1500+ icons..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                    {searchQuery && (
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        <div className="flex items-center gap-2">
                          <Grid className="h-4 w-4" />
                          <span>All Categories</span>
                        </div>
                      </SelectItem>
                      {Object.entries(LUCIDE_CATEGORIES).map(([cat, data]) => (
                        <SelectItem key={cat} value={cat}>
                          <div className="flex flex-col">
                            <span>{cat}</span>
                            <span className="text-xs text-muted-foreground">{data.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Selection Info */}
                {selectedIcons.length > 0 && (
                  <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                    <Badge variant="secondary" className="gap-1">
                      <Check className="h-3 w-3" />
                      {selectedIcons.length} selected
                    </Badge>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedIcons([])} className="h-7 text-xs">
                      Clear all
                    </Button>
                    <div className="flex-1" />
                    <div className="flex gap-1 overflow-hidden max-w-[200px]">
                      {selectedIcons.slice(0, 5).map(name => {
                        const Icon = (LucideIcons as any)[name] as LucideIcon;
                        return Icon ? <Icon key={name} className="h-4 w-4 text-muted-foreground" /> : null;
                      })}
                      {selectedIcons.length > 5 && (
                        <span className="text-xs text-muted-foreground">+{selectedIcons.length - 5}</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Icons Display */}
                <ScrollArea className="flex-1">
                  {/* Category Grouped View (when viewing all without search) */}
                  {groupedIcons && !searchQuery ? (
                    <div className="space-y-6 p-1">
                      {Object.entries(groupedIcons).map(([catName, icons]) => (
                        <div key={catName} className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-semibold text-foreground">{catName}</h4>
                              <Badge variant="outline" className="text-xs">
                                {LUCIDE_CATEGORIES[catName]?.icons.length || icons.length}
                              </Badge>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => setSelectedCategory(catName)}
                              className="text-xs h-7 gap-1"
                            >
                              View all
                              <ChevronRight className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground -mt-1">
                            {LUCIDE_CATEGORIES[catName]?.description}
                          </p>
                          <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
                            {icons.map((name) => {
                              const IconComponent = (LucideIcons as any)[name] as LucideIcon;
                              if (!IconComponent) return null;
                              const isSelected = selectedIcons.includes(name);
                              
                              return (
                                <button
                                  key={name}
                                  onClick={() => toggleIconSelection(name)}
                                  className={cn(
                                    'relative p-3 rounded-lg border flex flex-col items-center gap-1 transition-all group',
                                    isSelected 
                                      ? 'border-primary bg-primary/10 ring-2 ring-primary/20' 
                                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                                  )}
                                  title={name}
                                >
                                  {renderStyledIcon(IconComponent, 20)}
                                  {isSelected && (
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                                      <Check className="h-2.5 w-2.5 text-primary-foreground" />
                                    </div>
                                  )}
                                  <span className="sr-only">{name}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Flat Grid View (when searching or viewing a specific category) */
                    <div className="space-y-3 p-1">
                      {selectedCategory !== 'all' && (
                        <div className="flex items-center gap-2 mb-4">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setSelectedCategory('all')}
                            className="gap-1 h-7"
                          >
                            <ChevronLeft className="h-3 w-3" />
                            Back
                          </Button>
                          <h4 className="text-sm font-semibold">{selectedCategory}</h4>
                          <Badge variant="outline" className="text-xs">{filteredIcons.length} icons</Badge>
                        </div>
                      )}
                      {searchQuery && (
                        <p className="text-sm text-muted-foreground mb-2">
                          Found {filteredIcons.length} icons matching "{searchQuery}"
                        </p>
                      )}
                      <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
                        {filteredIcons.map((name) => {
                          const IconComponent = (LucideIcons as any)[name] as LucideIcon;
                          if (!IconComponent) return null;
                          const isSelected = selectedIcons.includes(name);
                          
                          return (
                            <button
                              key={name}
                              onClick={() => toggleIconSelection(name)}
                              className={cn(
                                'relative p-3 rounded-lg border flex flex-col items-center gap-1 transition-all group',
                                isSelected 
                                  ? 'border-primary bg-primary/10 ring-2 ring-primary/20' 
                                  : 'border-border hover:border-primary/50 hover:bg-muted/50'
                              )}
                              title={name}
                            >
                              {renderStyledIcon(IconComponent, 20)}
                              {isSelected && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                                  <Check className="h-2.5 w-2.5 text-primary-foreground" />
                                </div>
                              )}
                              <span className="text-[10px] text-muted-foreground truncate w-full text-center opacity-0 group-hover:opacity-100 transition-opacity">
                                {name.replace(/([A-Z])/g, ' $1').trim()}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      {filteredIcons.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No icons found</p>
                          <p className="text-xs">Try a different search term</p>
                        </div>
                      )}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              {/* AI Generation Tab */}
              <TabsContent value="ai" className="flex-1 space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Describe the icon you want to create</Label>
                  <Textarea
                    placeholder="e.g., A minimalist document icon with a folded corner and three horizontal lines representing text..."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>

                <Button 
                  onClick={generateIconWithAI} 
                  disabled={isGenerating || !aiPrompt.trim()}
                  className="gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4" />
                      Generate Icon
                    </>
                  )}
                </Button>

                {generatedSvg && (
                  <div className="space-y-3">
                    <Label>Generated Icon Preview</Label>
                    <div className="w-32 h-32 border rounded-xl flex items-center justify-center bg-muted/50">
                      <div 
                        className="w-16 h-16"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(generatedSvg) }}
                      />
                    </div>
                    <Input
                      placeholder="Icon name"
                      value={iconName}
                      onChange={(e) => setIconName(e.target.value)}
                    />
                  </div>
                )}
              </TabsContent>

              {/* Upload Tab */}
              <TabsContent value="upload" className="flex-1 space-y-4 mt-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".svg"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-40 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  <Upload className="h-8 w-8" />
                  <span>Drop SVG file here or click to browse</span>
                </button>

                {uploadedSvg && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Uploaded Icon</Label>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setUploadedSvg(null);
                          setUploadedName('');
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="w-32 h-32 border rounded-xl flex items-center justify-center bg-muted/50">
                      <div 
                        className="w-16 h-16"
                        style={{ color: iconStyle.color }}
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(uploadedSvg) }}
                      />
                    </div>
                    <Input
                      placeholder="Icon name"
                      value={iconName || uploadedName}
                      onChange={(e) => setIconName(e.target.value)}
                    />
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Panel - Style Controls */}
          <div className="space-y-6 overflow-y-auto">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Style Presets</Label>
              <ScrollArea className="h-[180px] pr-3">
                <div className="grid grid-cols-2 gap-2">
                  {STYLE_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => applyPreset(preset.id)}
                      className={cn(
                        'group relative flex flex-col items-start gap-0.5 p-2 rounded-lg border text-left transition-all',
                        activePreset === preset.id 
                          ? 'bg-primary text-primary-foreground border-primary' 
                          : 'bg-card hover:bg-accent hover:border-accent border-border'
                      )}
                    >
                      <span className="text-xs font-medium truncate w-full">{preset.name}</span>
                      <span className={cn(
                        'text-[10px] truncate w-full',
                        activePreset === preset.id ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      )}>
                        {preset.description}
                      </span>
                      {activePreset === preset.id && (
                        <Check className="absolute top-1.5 right-1.5 h-3 w-3" />
                      )}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Stroke Width</Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[iconStyle.strokeWidth]}
                  onValueChange={([v]) => setIconStyle(s => ({ ...s, strokeWidth: v }))}
                  min={0.5}
                  max={4}
                  step={0.5}
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground w-8">{iconStyle.strokeWidth}</span>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Corner Style</Label>
              <ToggleGroup
                type="single"
                value={iconStyle.cornerRadius}
                onValueChange={(v) => v && setIconStyle(s => ({ ...s, cornerRadius: v as any }))}
                className="justify-start"
              >
                <ToggleGroupItem value="sharp" aria-label="Sharp corners" className="gap-1.5">
                  <Square className="h-4 w-4" />
                  <span className="text-xs">Sharp</span>
                </ToggleGroupItem>
                <ToggleGroupItem value="rounded" aria-label="Rounded corners" className="gap-1.5">
                  <Circle className="h-4 w-4" />
                  <span className="text-xs">Rounded</span>
                </ToggleGroupItem>
                <ToggleGroupItem value="soft" aria-label="Soft corners" className="gap-1.5">
                  <div className="h-4 w-4 rounded-md border-2 border-current" />
                  <span className="text-xs">Soft</span>
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Filled</Label>
              <Switch
                checked={iconStyle.fill}
                onCheckedChange={(fill) => setIconStyle(s => ({ ...s, fill }))}
              />
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Color</Label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setIconStyle(s => ({ ...s, color: '#000000' }))}
                  className={cn(
                    'w-8 h-8 rounded-full bg-black border-2',
                    iconStyle.color === '#000000' ? 'ring-2 ring-primary ring-offset-2' : 'border-border'
                  )}
                />
                {brandColors.map((c) => (
                  <button
                    key={c.hex}
                    onClick={() => setIconStyle(s => ({ ...s, color: c.hex }))}
                    className={cn(
                      'w-8 h-8 rounded-full border-2',
                      iconStyle.color === c.hex ? 'ring-2 ring-primary ring-offset-2' : 'border-border'
                    )}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  />
                ))}
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="w-8 h-8 rounded-full border-2 border-dashed flex items-center justify-center">
                      <Plus className="h-3 w-3" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-2">
                    <input
                      type="color"
                      value={iconStyle.color}
                      onChange={(e) => setIconStyle(s => ({ ...s, color: e.target.value }))}
                      className="w-32 h-32 cursor-pointer"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Export Sizes</Label>
              <div className="flex flex-wrap gap-2">
                {EXPORT_SIZES.map((size) => (
                  <Button
                    key={size}
                    variant={exportSizes.includes(size) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setExportSizes(prev => 
                      prev.includes(size) 
                        ? prev.filter(s => s !== size)
                        : [...prev, size].sort((a, b) => a - b)
                    )}
                  >
                    {size}px
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Category</Label>
              <Select value={iconCategory} onValueChange={setIconCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(LUCIDE_CATEGORIES).map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex gap-2">
            {selectedIcons.length > 0 && (
              <Button variant="outline" onClick={downloadSelectedIcons} className="gap-2">
                <Download className="h-4 w-4" />
                Export Selected ({selectedIcons.length})
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={selectedIcons.length === 0 && !generatedSvg && !uploadedSvg}
              className="gap-2"
            >
              <Check className="h-4 w-4" />
              Add to Brand
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
