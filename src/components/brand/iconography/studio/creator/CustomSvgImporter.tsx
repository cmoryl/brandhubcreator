/**
 * CustomSvgImporter - Single & batch SVG import with drag-and-drop
 */

import { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Code, Plus, Upload, FileUp, X } from 'lucide-react';
import { toast } from 'sonner';
import { BrandIconography } from '@/types/brand';
import { cn } from '@/lib/utils';
import { sanitizeSvg, cleanSvg, extractViewBox, detectFillMode } from '@/lib/svgUtils';

interface CustomSvgImporterProps {
  selectedLibraryId: string;
  onSaveIcons: (icons: BrandIconography[], libraryId?: string) => void;
}

export const CustomSvgImporter = ({
  selectedLibraryId,
  onSaveIcons,
}: CustomSvgImporterProps) => {
  // Single icon state
  const [customName, setCustomName] = useState('');
  const [customSvg, setCustomSvg] = useState('');
  const [customCategory, setCustomCategory] = useState('custom');

  // Batch state
  const [batchMode, setBatchMode] = useState(false);
  const [batchSvgs, setBatchSvgs] = useState<Array<{ name: string; svg: string }>>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveCustomIcon = () => {
    if (!customName.trim()) { toast.error('Please enter an icon name'); return; }
    if (!customSvg.trim()) { toast.error('Please enter SVG code'); return; }
    const sanitized = sanitizeSvg(customSvg);
    if (!sanitized.includes('<svg') && !sanitized.includes('<path')) {
      toast.error('Invalid SVG code'); return;
    }
    const icon: BrandIconography = {
      id: `custom-${Date.now()}`,
      name: customName.trim(),
      svgPath: sanitized,
      category: customCategory,
      viewBox: '0 0 24 24',
      fillMode: 'fill' as const,
    };
    onSaveIcons([icon], selectedLibraryId || undefined);
    setCustomName('');
    setCustomSvg('');
    toast.success('Custom icon added!');
  };

  // Parse SVG files from file input or drag-and-drop
  const processSvgFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter(
      f => f.type === 'image/svg+xml' || f.name.endsWith('.svg')
    );
    if (fileArray.length === 0) {
      toast.error('No SVG files found. Only .svg files are supported.');
      return;
    }
    const results: Array<{ name: string; svg: string }> = [];
    for (const file of fileArray) {
      try {
        const text = await file.text();
        const sanitized = sanitizeSvg(text);
        if (sanitized.includes('<svg') || sanitized.includes('<path')) {
          results.push({
            name: file.name.replace(/\.svg$/i, '').replace(/[-_]/g, ' '),
            svg: sanitized,
          });
        }
      } catch {
        console.warn('Failed to read SVG file:', file.name);
      }
    }
    if (results.length === 0) {
      toast.error('No valid SVG files could be parsed');
      return;
    }
    setBatchSvgs(prev => [...prev, ...results]);
    setBatchMode(true);
    toast.success(`Loaded ${results.length} SVG file${results.length > 1 ? 's' : ''}`);
  }, []);

  // Parse batch SVG text (multiple <svg> in one paste)
  const parseBatchText = useCallback((text: string) => {
    const svgRegex = /<svg[\s\S]*?<\/svg>/gi;
    const matches = text.match(svgRegex);
    if (!matches || matches.length === 0) {
      toast.error('No valid <svg> elements found in pasted text');
      return;
    }
    const results = matches.map((svg, idx) => {
      const sanitized = sanitizeSvg(svg);
      // Try to extract a name from id or title
      const idMatch = sanitized.match(/id="([^"]+)"/);
      const titleMatch = sanitized.match(/<title>([^<]+)<\/title>/);
      return {
        name: titleMatch?.[1] || idMatch?.[1] || `Icon ${idx + 1}`,
        svg: sanitized,
      };
    }).filter(r => r.svg.includes('<svg'));
    setBatchSvgs(prev => [...prev, ...results]);
    setBatchMode(true);
    toast.success(`Parsed ${results.length} SVG${results.length > 1 ? 's' : ''}`);
  }, []);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = () => setIsDragOver(false);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files?.length) {
      processSvgFiles(e.dataTransfer.files);
    } else {
      const text = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('text/html');
      if (text) parseBatchText(text);
    }
  }, [processSvgFiles, parseBatchText]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) processSvgFiles(e.target.files);
    e.target.value = '';
  }, [processSvgFiles]);

  const removeBatchItem = (idx: number) => {
    setBatchSvgs(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSaveBatch = () => {
    if (batchSvgs.length === 0) { toast.error('No SVGs to import'); return; }
    const baseTs = Date.now();
    const icons: BrandIconography[] = batchSvgs.map((item, idx) => ({
      id: `batch-${baseTs}-${idx}`,
      name: item.name,
      svgPath: item.svg,
      category: customCategory,
      viewBox: '0 0 24 24',
      fillMode: 'fill' as const,
    }));
    onSaveIcons(icons, selectedLibraryId || undefined);
    setBatchSvgs([]);
    setBatchMode(false);
    toast.success(`Added ${icons.length} icons`);
  };

  return (
    <div className="space-y-4">
      {/* Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all',
          isDragOver
            ? 'border-primary bg-primary/5 scale-[1.01]'
            : 'border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/30'
        )}
      >
        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm font-medium">Drop SVG files here or click to browse</p>
        <p className="text-xs text-muted-foreground mt-1">
          Supports multiple .svg files for batch import
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".svg,image/svg+xml"
          multiple
          className="hidden"
          onChange={handleFileInput}
        />
      </div>

      {/* Mode Toggle */}
      <div className="flex items-center gap-2">
        <Button
          variant={!batchMode ? 'default' : 'outline'}
          size="sm"
          onClick={() => setBatchMode(false)}
        >
          Single Icon
        </Button>
        <Button
          variant={batchMode ? 'default' : 'outline'}
          size="sm"
          onClick={() => setBatchMode(true)}
          className="gap-1.5"
        >
          <FileUp className="h-3.5 w-3.5" />
          Batch Import
          {batchSvgs.length > 0 && (
            <Badge variant="secondary" className="ml-1 text-[10px]">
              {batchSvgs.length}
            </Badge>
          )}
        </Button>
      </div>

      {!batchMode ? (
        /* Single Icon Mode */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Icon Name *</Label>
              <Input
                placeholder="e.g., Custom Arrow, Brand Logo"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={customCategory} onValueChange={setCustomCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Custom</SelectItem>
                  <SelectItem value="logo">Logo</SelectItem>
                  <SelectItem value="navigation">Navigation</SelectItem>
                  <SelectItem value="action">Action</SelectItem>
                  <SelectItem value="social">Social</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>SVG Code *</Label>
              <Textarea
                placeholder='<svg viewBox="0 0 24 24">...</svg>'
                value={customSvg}
                onChange={(e) => setCustomSvg(e.target.value)}
                onPaste={(e) => {
                  const text = e.clipboardData.getData('text/plain');
                  const svgCount = (text.match(/<svg/gi) || []).length;
                  if (svgCount > 1) {
                    e.preventDefault();
                    parseBatchText(text);
                  }
                }}
                rows={8}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Paste a complete SVG element. Pasting multiple SVGs auto-switches to batch mode.
              </p>
            </div>
            <Button onClick={handleSaveCustomIcon} className="w-full gap-2">
              <Plus className="h-4 w-4" />
              Add Custom Icon
            </Button>
          </div>

          {/* Preview */}
          <div className="space-y-4">
            <Label>Preview</Label>
            <div className="border rounded-lg p-8 flex items-center justify-center bg-muted/30 min-h-[200px]">
              {customSvg ? (
                <div
                  className="w-24 h-24 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                  dangerouslySetInnerHTML={{ __html: sanitizeSvg(customSvg) }}
                />
              ) : (
                <div className="text-center text-muted-foreground">
                  <Code className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Paste SVG code to preview</p>
                </div>
              )}
            </div>
            {customSvg && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Size Previews</Label>
                <div className="flex items-end gap-4 p-4 border rounded-lg bg-background">
                  {[16, 24, 32, 48].map((size) => (
                    <div key={size} className="flex flex-col items-center gap-1">
                      <div
                        style={{ width: size, height: size }}
                        className="flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                        dangerouslySetInnerHTML={{ __html: sanitizeSvg(customSvg) }}
                      />
                      <span className="text-[10px] text-muted-foreground">{size}px</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Batch Mode */
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Batch Paste</Label>
            <Textarea
              placeholder="Paste multiple <svg>...</svg> elements here..."
              rows={4}
              className="font-mono text-sm"
              onPaste={(e) => {
                e.preventDefault();
                parseBatchText(e.clipboardData.getData('text/plain'));
              }}
            />
          </div>

          {batchSvgs.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>{batchSvgs.length} icons ready to import</Label>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setBatchSvgs([])}>
                    Clear All
                  </Button>
                  <Button size="sm" onClick={handleSaveBatch} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Import All
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-[300px] overflow-y-auto border rounded-lg p-3">
                {batchSvgs.map((item, idx) => (
                  <div key={idx} className="relative group">
                    <div className="p-2 border rounded-lg bg-background flex items-center justify-center aspect-square">
                      <div
                        className="w-8 h-8 [&>svg]:w-full [&>svg]:h-full"
                        dangerouslySetInnerHTML={{ __html: item.svg }}
                      />
                    </div>
                    <button
                      onClick={() => removeBatchItem(idx)}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                    <p className="text-[9px] text-muted-foreground text-center mt-0.5 truncate">
                      {item.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
