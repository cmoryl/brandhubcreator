import { useState, useCallback, useRef } from 'react';
import { Upload, Image as ImageIcon, Loader2, Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { extractColorsFromImage, getImageInfo } from '@/lib/imageColorExtraction';

interface ExtractedColor {
  hex: string;
  rgb: { r: number; g: number; b: number };
  percentage: number;
  name: string;
}

interface ImageColorExtractorProps {
  onAddColors: (colors: Array<{ hex: string; name: string }>) => void;
}

export function ImageColorExtractor({ onAddColors }: ImageColorExtractorProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageInfo, setImageInfo] = useState<{ width: number; height: number; aspectRatio: string; fileSize: string } | null>(null);
  const [extractedColors, setExtractedColors] = useState<ExtractedColor[]>([]);
  const [loading, setLoading] = useState(false);
  const [numColors, setNumColors] = useState(6);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error('File too large (max 20MB)');
      return;
    }

    setLoading(true);
    setImageUrl(URL.createObjectURL(file));

    try {
      const [colors, info] = await Promise.all([
        extractColorsFromImage(file, numColors),
        getImageInfo(file),
      ]);
      setExtractedColors(colors);
      setImageInfo(info);
      toast.success(`Extracted ${colors.length} dominant colors`);
    } catch (err) {
      toast.error('Failed to extract colors');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [numColors]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const addAllToPalette = () => {
    onAddColors(extractedColors.map(c => ({ hex: c.hex, name: c.name })));
    toast.success(`Added ${extractedColors.length} colors to palette`);
  };

  const addOneToPalette = (color: ExtractedColor) => {
    onAddColors([{ hex: color.hex, name: color.name }]);
    toast.success(`Added ${color.name}`);
  };

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <div
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
        className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors bg-muted/20"
        onClick={() => fileRef.current?.click()}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
        {loading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Extracting colors...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">Drop an image or click to upload</p>
            <p className="text-xs text-muted-foreground">PNG, JPG, WEBP up to 20MB</p>
          </div>
        )}
      </div>

      {/* Color count slider */}
      <div className="flex items-center gap-4">
        <Label className="text-xs whitespace-nowrap">Colors to extract:</Label>
        <Slider
          min={3}
          max={12}
          step={1}
          value={[numColors]}
          onValueChange={([v]) => setNumColors(v)}
          className="flex-1"
        />
        <span className="text-xs font-mono w-4 text-center">{numColors}</span>
      </div>

      {/* Results */}
      {imageUrl && extractedColors.length > 0 && (
        <div className="space-y-4">
          {/* Image preview + info */}
          <div className="flex gap-4 items-start">
            <img
              src={imageUrl}
              alt="Uploaded"
              className="w-32 h-32 object-cover rounded-lg border"
            />
            <div className="space-y-1">
              {imageInfo && (
                <>
                  <p className="text-xs text-muted-foreground">{imageInfo.width} × {imageInfo.height}px</p>
                  <p className="text-xs text-muted-foreground">{imageInfo.aspectRatio} · {imageInfo.fileSize}</p>
                </>
              )}
              <Button size="sm" variant="outline" className="mt-2 gap-1" onClick={addAllToPalette}>
                <Plus className="h-3 w-3" />
                Add All to Palette
              </Button>
            </div>
          </div>

          {/* Palette strip */}
          <div className="flex rounded-lg overflow-hidden h-12 border">
            {extractedColors.map((c, i) => (
              <div
                key={i}
                className="relative group cursor-pointer transition-all hover:flex-[2]"
                style={{ backgroundColor: c.hex, flex: c.percentage / 100 }}
                onClick={() => addOneToPalette(c)}
                title={`${c.name} — ${c.percentage}%`}
              >
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                  <Plus className="h-4 w-4 text-white drop-shadow" />
                </div>
              </div>
            ))}
          </div>

          {/* Color cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            <AnimatePresence>
              {extractedColors.map((color, i) => (
                <motion.div
                  key={color.hex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card
                    className="cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all"
                    onClick={() => addOneToPalette(color)}
                  >
                    <div className="h-16 rounded-t-lg" style={{ backgroundColor: color.hex }} />
                    <CardContent className="p-2">
                      <p className="text-xs font-medium truncate">{color.name}</p>
                      <div className="flex items-center justify-between">
                        <code className="text-[10px] font-mono text-muted-foreground">{color.hex}</code>
                        <Badge variant="secondary" className="text-[9px] h-4 px-1">
                          {color.percentage}%
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
