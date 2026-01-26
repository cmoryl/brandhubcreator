/**
 * IconUsageGuidelines - Visual guidelines for icon usage in brand systems
 * Shows spacing rules, sizing standards, and color application examples
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Check, 
  X, 
  Maximize2, 
  Move, 
  Palette, 
  Grid,
  AlertCircle,
  Star,
  Heart,
  Settings,
  Home,
  Mail,
  Bell,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface IconUsageGuidelinesProps {
  brandColors?: Array<{ hex: string; name: string }>;
  primaryColor?: string;
}

export const IconUsageGuidelines = ({ 
  brandColors = [], 
  primaryColor = '#000000' 
}: IconUsageGuidelinesProps) => {
  const [activeTab, setActiveTab] = useState('sizing');

  // Standard icon sizes
  const iconSizes = [
    { size: 16, label: 'XS', use: 'Inline text, compact UI' },
    { size: 20, label: 'SM', use: 'Buttons, form inputs' },
    { size: 24, label: 'MD', use: 'Navigation, standard UI' },
    { size: 32, label: 'LG', use: 'Feature highlights' },
    { size: 48, label: 'XL', use: 'Hero sections, cards' },
    { size: 64, label: '2XL', use: 'Marketing, splash screens' },
  ];

  // Spacing multipliers
  const spacingRules = [
    { multiplier: 0.25, label: '¼×', description: 'Minimum clear space' },
    { multiplier: 0.5, label: '½×', description: 'Compact layouts' },
    { multiplier: 1, label: '1×', description: 'Standard spacing' },
    { multiplier: 1.5, label: '1.5×', description: 'Comfortable spacing' },
    { multiplier: 2, label: '2×', description: 'Generous spacing' },
  ];

  const DemoIcon = Star;
  const baseSize = 32;

  return (
    <Card className="border-border">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Grid className="h-5 w-5 text-primary" />
          Icon Usage Guidelines
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="sizing" className="gap-1.5 text-xs">
              <Maximize2 className="h-3.5 w-3.5" />
              Sizing
            </TabsTrigger>
            <TabsTrigger value="spacing" className="gap-1.5 text-xs">
              <Move className="h-3.5 w-3.5" />
              Spacing
            </TabsTrigger>
            <TabsTrigger value="color" className="gap-1.5 text-xs">
              <Palette className="h-3.5 w-3.5" />
              Color
            </TabsTrigger>
            <TabsTrigger value="dos-donts" className="gap-1.5 text-xs">
              <AlertCircle className="h-3.5 w-3.5" />
              Do's & Don'ts
            </TabsTrigger>
          </TabsList>

          {/* Sizing Tab */}
          <TabsContent value="sizing" className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {iconSizes.map(({ size, label, use }) => (
                <div 
                  key={size}
                  className="flex flex-col items-center gap-3 p-4 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div 
                    className="flex items-center justify-center bg-muted rounded-lg"
                    style={{ width: size + 24, height: size + 24 }}
                  >
                    <DemoIcon size={size} className="text-foreground" />
                  </div>
                  <div className="text-center">
                    <Badge variant="secondary" className="mb-1">{label}</Badge>
                    <p className="text-sm font-medium">{size}px</p>
                    <p className="text-xs text-muted-foreground mt-1">{use}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Size Comparison */}
            <div className="p-6 rounded-xl border border-border bg-muted/30">
              <h4 className="text-sm font-semibold mb-4">Size Comparison</h4>
              <div className="flex items-end gap-4 justify-center">
                {iconSizes.map(({ size, label }) => (
                  <div key={size} className="flex flex-col items-center gap-2">
                    <DemoIcon size={size} className="text-foreground" />
                    <span className="text-xs text-muted-foreground">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Optical Alignment */}
            <div className="p-6 rounded-xl border border-border">
              <h4 className="text-sm font-semibold mb-4">Optical Alignment with Text</h4>
              <div className="space-y-4">
                {[16, 20, 24].map((size) => (
                  <div 
                    key={size} 
                    className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                  >
                    <DemoIcon size={size} className="text-foreground shrink-0" />
                    <span style={{ fontSize: size * 0.75 }} className="font-medium">
                      Icon aligned with {size}px × 0.75 = {size * 0.75}px text
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Spacing Tab */}
          <TabsContent value="spacing" className="space-y-6">
            {/* Clear Space Rules */}
            <div className="p-6 rounded-xl border border-border">
              <h4 className="text-sm font-semibold mb-4">Minimum Clear Space</h4>
              <p className="text-sm text-muted-foreground mb-6">
                Maintain clear space around icons equal to at least ¼ of the icon's height.
              </p>
              <div className="flex justify-center">
                <div className="relative inline-flex items-center justify-center">
                  {/* Clear space indicator */}
                  <div 
                    className="absolute border-2 border-dashed border-primary/50 rounded"
                    style={{ 
                      width: baseSize * 1.5, 
                      height: baseSize * 1.5,
                    }}
                  />
                  {/* Icon */}
                  <div className="bg-muted rounded-lg p-2">
                    <DemoIcon size={baseSize} className="text-foreground" />
                  </div>
                  {/* Spacing labels */}
                  <div className="absolute -top-6 text-xs text-primary font-medium">¼×</div>
                  <div className="absolute -bottom-6 text-xs text-primary font-medium">¼×</div>
                  <div className="absolute -left-8 text-xs text-primary font-medium">¼×</div>
                  <div className="absolute -right-8 text-xs text-primary font-medium">¼×</div>
                </div>
              </div>
            </div>

            {/* Spacing Examples */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {spacingRules.map(({ multiplier, label, description }) => (
                <div 
                  key={multiplier}
                  className="p-4 rounded-xl border border-border"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline">{label}</Badge>
                    <span className="text-sm text-muted-foreground">{description}</span>
                  </div>
                  <div className="flex items-center justify-center bg-muted/50 rounded-lg p-4">
                    <div className="flex items-center" style={{ gap: baseSize * multiplier * 0.25 }}>
                      <Home size={24} className="text-foreground" />
                      <Settings size={24} className="text-foreground" />
                      <Bell size={24} className="text-foreground" />
                      <User size={24} className="text-foreground" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Button Padding */}
            <div className="p-6 rounded-xl border border-border">
              <h4 className="text-sm font-semibold mb-4">Icon Button Padding</h4>
              <div className="flex flex-wrap gap-6 justify-center">
                {[
                  { padding: 'p-1', label: '4px' },
                  { padding: 'p-2', label: '8px' },
                  { padding: 'p-3', label: '12px' },
                  { padding: 'p-4', label: '16px' },
                ].map(({ padding, label }) => (
                  <div key={padding} className="flex flex-col items-center gap-2">
                    <button className={cn(
                      'rounded-lg bg-primary text-primary-foreground',
                      padding
                    )}>
                      <Mail size={20} />
                    </button>
                    <span className="text-xs text-muted-foreground">{label} padding</span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Color Tab */}
          <TabsContent value="color" className="space-y-6">
            {/* Color Application */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* On Light Background */}
              <div className="p-6 rounded-xl border border-border bg-white">
                <h4 className="text-sm font-semibold mb-4 text-gray-900">On Light Backgrounds</h4>
                <div className="flex flex-wrap gap-4">
                  <div className="flex flex-col items-center gap-2">
                    <DemoIcon size={32} className="text-gray-900" />
                    <span className="text-xs text-gray-600">Default</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <DemoIcon size={32} className="text-gray-500" />
                    <span className="text-xs text-gray-600">Muted</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <DemoIcon size={32} style={{ color: primaryColor }} />
                    <span className="text-xs text-gray-600">Primary</span>
                  </div>
                  {brandColors.slice(0, 2).map((c) => (
                    <div key={c.hex} className="flex flex-col items-center gap-2">
                      <DemoIcon size={32} style={{ color: c.hex }} />
                      <span className="text-xs text-gray-600">{c.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* On Dark Background */}
              <div className="p-6 rounded-xl border border-border bg-gray-900">
                <h4 className="text-sm font-semibold mb-4 text-white">On Dark Backgrounds</h4>
                <div className="flex flex-wrap gap-4">
                  <div className="flex flex-col items-center gap-2">
                    <DemoIcon size={32} className="text-white" />
                    <span className="text-xs text-gray-400">Default</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <DemoIcon size={32} className="text-gray-400" />
                    <span className="text-xs text-gray-400">Muted</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <DemoIcon size={32} style={{ color: primaryColor }} />
                    <span className="text-xs text-gray-400">Primary</span>
                  </div>
                  {brandColors.slice(0, 2).map((c) => (
                    <div key={c.hex} className="flex flex-col items-center gap-2">
                      <DemoIcon size={32} style={{ color: c.hex }} />
                      <span className="text-xs text-gray-400">{c.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Stroke vs Fill */}
            <div className="p-6 rounded-xl border border-border">
              <h4 className="text-sm font-semibold mb-4">Stroke vs. Fill Styles</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex flex-col items-center gap-2 p-4 bg-muted/50 rounded-lg">
                  <Heart size={32} strokeWidth={1.5} className="text-foreground" />
                  <span className="text-xs text-muted-foreground">Thin Stroke</span>
                </div>
                <div className="flex flex-col items-center gap-2 p-4 bg-muted/50 rounded-lg">
                  <Heart size={32} strokeWidth={2} className="text-foreground" />
                  <span className="text-xs text-muted-foreground">Regular Stroke</span>
                </div>
                <div className="flex flex-col items-center gap-2 p-4 bg-muted/50 rounded-lg">
                  <Heart size={32} strokeWidth={2.5} className="text-foreground" />
                  <span className="text-xs text-muted-foreground">Bold Stroke</span>
                </div>
                <div className="flex flex-col items-center gap-2 p-4 bg-muted/50 rounded-lg">
                  <Heart size={32} fill="currentColor" className="text-foreground" />
                  <span className="text-xs text-muted-foreground">Filled</span>
                </div>
              </div>
            </div>

            {/* Color Contrast */}
            <div className="p-6 rounded-xl border border-border">
              <h4 className="text-sm font-semibold mb-4">Ensure Adequate Contrast</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-green-600">
                    <Check className="h-4 w-4" />
                    Good Contrast
                  </div>
                  <div className="flex gap-2">
                    <div className="p-3 bg-white border rounded-lg">
                      <Settings size={24} className="text-gray-900" />
                    </div>
                    <div className="p-3 bg-gray-900 rounded-lg">
                      <Settings size={24} className="text-white" />
                    </div>
                    <div className="p-3 rounded-lg" style={{ backgroundColor: primaryColor }}>
                      <Settings size={24} className="text-white" />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-red-600">
                    <X className="h-4 w-4" />
                    Poor Contrast
                  </div>
                  <div className="flex gap-2">
                    <div className="p-3 bg-gray-200 border rounded-lg">
                      <Settings size={24} className="text-gray-300" />
                    </div>
                    <div className="p-3 bg-gray-700 rounded-lg">
                      <Settings size={24} className="text-gray-600" />
                    </div>
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Settings size={24} className="text-blue-200" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Do's and Don'ts Tab */}
          <TabsContent value="dos-donts" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Do's */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600">
                  <Check className="h-5 w-5" />
                  <h4 className="font-semibold">Do</h4>
                </div>
                
                {[
                  { 
                    title: 'Use consistent sizing',
                    example: (
                      <div className="flex items-center gap-3">
                        <Home size={24} />
                        <Settings size={24} />
                        <Bell size={24} />
                        <User size={24} />
                      </div>
                    )
                  },
                  { 
                    title: 'Maintain visual weight',
                    example: (
                      <div className="flex items-center gap-3">
                        <Home size={24} strokeWidth={2} />
                        <Heart size={24} strokeWidth={2} />
                        <Star size={24} strokeWidth={2} />
                      </div>
                    )
                  },
                  { 
                    title: 'Use proper spacing',
                    example: (
                      <div className="flex items-center gap-4 px-3 py-2 bg-muted rounded-lg">
                        <Mail size={20} />
                        <span className="text-sm">Send Message</span>
                      </div>
                    )
                  },
                  { 
                    title: 'Align to pixel grid',
                    example: (
                      <div className="flex items-center gap-2">
                        <div className="grid grid-cols-4 gap-px bg-border p-1 rounded">
                          {[...Array(16)].map((_, i) => (
                            <div key={i} className="w-2 h-2 bg-muted" />
                          ))}
                        </div>
                        <Star size={24} />
                      </div>
                    )
                  },
                ].map(({ title, example }) => (
                  <div 
                    key={title}
                    className="p-4 rounded-xl border-2 border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30"
                  >
                    <p className="text-sm font-medium mb-3 text-green-800 dark:text-green-200">{title}</p>
                    <div className="flex items-center justify-center p-3 bg-white dark:bg-gray-900 rounded-lg text-foreground">
                      {example}
                    </div>
                  </div>
                ))}
              </div>

              {/* Don'ts */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-red-600">
                  <X className="h-5 w-5" />
                  <h4 className="font-semibold">Don't</h4>
                </div>
                
                {[
                  { 
                    title: 'Mix different sizes',
                    example: (
                      <div className="flex items-center gap-3">
                        <Home size={16} />
                        <Settings size={28} />
                        <Bell size={20} />
                        <User size={32} />
                      </div>
                    )
                  },
                  { 
                    title: 'Mix stroke weights',
                    example: (
                      <div className="flex items-center gap-3">
                        <Home size={24} strokeWidth={1} />
                        <Heart size={24} strokeWidth={3} />
                        <Star size={24} strokeWidth={1.5} />
                      </div>
                    )
                  },
                  { 
                    title: 'Crowd icons together',
                    example: (
                      <div className="flex items-center gap-0.5 px-1 py-2 bg-muted rounded-lg">
                        <Mail size={20} />
                        <span className="text-sm">Send</span>
                      </div>
                    )
                  },
                  { 
                    title: 'Stretch or distort',
                    example: (
                      <div className="flex items-center gap-4">
                        <Star size={24} className="scale-x-150" />
                        <Star size={24} className="scale-y-75" />
                        <Star size={24} className="skew-x-12" />
                      </div>
                    )
                  },
                ].map(({ title, example }) => (
                  <div 
                    key={title}
                    className="p-4 rounded-xl border-2 border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30"
                  >
                    <p className="text-sm font-medium mb-3 text-red-800 dark:text-red-200">{title}</p>
                    <div className="flex items-center justify-center p-3 bg-white dark:bg-gray-900 rounded-lg text-foreground">
                      {example}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Accessibility Note */}
            <div className="p-4 rounded-xl border border-border bg-muted/30">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold mb-1">Accessibility Reminder</h4>
                  <p className="text-sm text-muted-foreground">
                    Always provide accessible labels for icon-only buttons using <code className="px-1 py-0.5 bg-muted rounded text-xs">aria-label</code> attributes. 
                    Decorative icons should use <code className="px-1 py-0.5 bg-muted rounded text-xs">aria-hidden="true"</code>.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
