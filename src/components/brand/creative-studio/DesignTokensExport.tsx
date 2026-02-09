/**
 * Design Tokens Export Component
 * Export brand design tokens in various formats
 */

import { useState, useMemo } from 'react';
import { Code, Download, Copy, Check, FileCode, FileJson } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { generateDesignTokens } from '@/hooks/useCreativeStudio';
import type { TokenFormat } from '@/types/creativeStudio';

interface DesignTokensExportProps {
  entityName: string;
  guideData: Record<string, unknown>;
}

const FORMAT_INFO: Record<TokenFormat, { label: string; icon: typeof Code; extension: string }> = {
  css: { label: 'CSS Variables', icon: FileCode, extension: '.css' },
  scss: { label: 'SCSS Variables', icon: FileCode, extension: '.scss' },
  json: { label: 'JSON Tokens', icon: FileJson, extension: '.json' },
  tailwind: { label: 'Tailwind Config', icon: FileCode, extension: '.js' },
  figma: { label: 'Figma Tokens', icon: FileJson, extension: '.json' }
};

export const DesignTokensExport = ({
  entityName,
  guideData
}: DesignTokensExportProps) => {
  const [selectedFormat, setSelectedFormat] = useState<TokenFormat>('css');
  const [includeColors, setIncludeColors] = useState(true);
  const [includeTypography, setIncludeTypography] = useState(true);
  const [prefix, setPrefix] = useState('brand');
  const [copied, setCopied] = useState(false);

  // Generate tokens based on current settings
  const generatedTokens = useMemo(() => {
    return generateDesignTokens(guideData, selectedFormat, {
      includeColors,
      includeTypography,
      prefix
    });
  }, [guideData, selectedFormat, includeColors, includeTypography, prefix]);

  // Get colors and typography for preview
  const colors = (guideData.colors as Array<{ hex: string; name: string; role?: string }>) || [];
  const typography = (guideData.typography as Array<{ fontFamily?: string; family?: string; role?: string }>) || [];

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(generatedTokens);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard');
  };

  const downloadTokens = () => {
    const { extension } = FORMAT_INFO[selectedFormat];
    const blob = new Blob([generatedTokens], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${entityName.toLowerCase().replace(/\s+/g, '-')}-tokens${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Tokens downloaded');
  };

  return (
    <div className="space-y-6">
      {/* Token Preview Cards */}
      <div className="grid grid-cols-2 gap-4">
        {/* Colors Preview */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Colors</CardTitle>
              <Switch
                checked={includeColors}
                onCheckedChange={setIncludeColors}
              />
            </div>
            <CardDescription className="text-xs">
              {colors.length} colors defined
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {colors.slice(0, 8).map((color, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-md border"
                  style={{ backgroundColor: color.hex }}
                  title={`${color.name}: ${color.hex}`}
                />
              ))}
              {colors.length > 8 && (
                <div className="w-8 h-8 rounded-md border bg-muted flex items-center justify-center text-xs text-muted-foreground">
                  +{colors.length - 8}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Typography Preview */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Typography</CardTitle>
              <Switch
                checked={includeTypography}
                onCheckedChange={setIncludeTypography}
              />
            </div>
            <CardDescription className="text-xs">
              {typography.length} fonts defined
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {typography.slice(0, 3).map((font, i) => (
                <div key={i} className="text-sm">
                  <span className="text-muted-foreground capitalize">{font.role || 'Default'}:</span>{' '}
                  <span className="font-medium">{font.fontFamily || font.family}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Format Selection */}
      <div className="space-y-3">
        <Label>Export Format</Label>
        <Tabs value={selectedFormat} onValueChange={(v) => setSelectedFormat(v as TokenFormat)}>
          <TabsList className="grid grid-cols-5 w-full">
            {(Object.entries(FORMAT_INFO) as [TokenFormat, typeof FORMAT_INFO['css']][]).map(([key, { label }]) => (
              <TabsTrigger key={key} value={key} className="text-xs">
                {label.split(' ')[0]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Prefix Setting */}
      <div className="flex items-center gap-4">
        <Label htmlFor="prefix">Variable Prefix</Label>
        <div className="flex items-center gap-2">
          <code className="bg-muted px-2 py-1 rounded text-sm">--{prefix}-</code>
          <input
            id="prefix"
            type="text"
            value={prefix}
            onChange={(e) => setPrefix(e.target.value.replace(/[^a-z0-9-]/gi, '').toLowerCase())}
            className="w-24 px-2 py-1 border rounded text-sm"
            placeholder="brand"
          />
        </div>
      </div>

      {/* Generated Output */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Code className="h-4 w-4" />
              Generated Tokens
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copyToClipboard} className="gap-1.5">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                Copy
              </Button>
              <Button variant="outline" size="sm" onClick={downloadTokens} className="gap-1.5">
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs max-h-80">
            <code>{generatedTokens}</code>
          </pre>
        </CardContent>
      </Card>

      {/* Usage Instructions */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <h4 className="font-medium mb-2 text-sm">How to use</h4>
          {selectedFormat === 'css' && (
            <p className="text-sm text-muted-foreground">
              Add to your CSS file and reference with <code className="bg-muted px-1 rounded">var(--{prefix}-primary)</code>
            </p>
          )}
          {selectedFormat === 'scss' && (
            <p className="text-sm text-muted-foreground">
              Import into your SCSS and use with <code className="bg-muted px-1 rounded">${prefix}-primary</code>
            </p>
          )}
          {selectedFormat === 'json' && (
            <p className="text-sm text-muted-foreground">
              Import as a module and access tokens via <code className="bg-muted px-1 rounded">tokens.{prefix}.colors.primary</code>
            </p>
          )}
          {selectedFormat === 'tailwind' && (
            <p className="text-sm text-muted-foreground">
              Merge with your tailwind.config.js and use classes like <code className="bg-muted px-1 rounded">text-{prefix}-primary</code>
            </p>
          )}
          {selectedFormat === 'figma' && (
            <p className="text-sm text-muted-foreground">
              Import into Figma using the Tokens Studio plugin for synced design-dev workflow
            </p>
          )}
        </CardContent>
      </Card>

      {/* Copy Guidance Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Copy Guidance for AI Tools</CardTitle>
          <CardDescription>
            Use this text when generating images with external AI tools
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="bg-muted p-3 rounded-lg text-sm">
              <p className="font-medium mb-2">Brand: {entityName}</p>
              {colors.length > 0 && (
                <p>
                  <span className="text-muted-foreground">Colors: </span>
                  {colors.slice(0, 5).map(c => `${c.name || c.role} (${c.hex})`).join(', ')}
                </p>
              )}
              {typography.length > 0 && (
                <p className="mt-1">
                  <span className="text-muted-foreground">Fonts: </span>
                  {typography.map(t => t.fontFamily || t.family).filter(Boolean).join(', ')}
                </p>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                const guidance = `Brand: ${entityName}\nColors: ${colors.slice(0, 5).map(c => `${c.name || c.role} (${c.hex})`).join(', ')}\nFonts: ${typography.map(t => t.fontFamily || t.family).filter(Boolean).join(', ')}`;
                await navigator.clipboard.writeText(guidance);
                toast.success('Guidance copied');
              }}
              className="gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy Brand Guidance
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
