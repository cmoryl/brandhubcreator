import { useState } from 'react';
import { Plus, X, Pencil, Copy, Check } from 'lucide-react';
import { BrandTextStyle } from '@/types/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TextStylesSectionProps {
  textStyles: BrandTextStyle[];
  onTextStylesChange: (textStyles: BrandTextStyle[]) => void;
}

const tagOptions = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'small'];
const weightOptions = ['100', '200', '300', '400', '500', '600', '700', '800', '900'];

export const TextStylesSection = ({ textStyles, onTextStylesChange }: TextStylesSectionProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const addTextStyle = () => {
    const newStyle: BrandTextStyle = {
      id: crypto.randomUUID(),
      tag: 'h1',
      size: '48px',
      weight: '700',
      lineHeight: '1.2',
    };
    onTextStylesChange([...textStyles, newStyle]);
    setEditingId(newStyle.id);
  };

  const updateTextStyle = (id: string, updates: Partial<BrandTextStyle>) => {
    onTextStylesChange(textStyles.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const deleteTextStyle = (id: string) => {
    onTextStylesChange(textStyles.filter(s => s.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const generateCSS = (style: BrandTextStyle) => {
    return `${style.tag} {
  font-size: ${style.size};
  font-weight: ${style.weight};
  line-height: ${style.lineHeight};
}`;
  };

  const copyCSS = async (style: BrandTextStyle) => {
    await navigator.clipboard.writeText(generateCSS(style));
    setCopiedId(style.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-semibold text-foreground">CSS Hierarchies</h2>
          <p className="text-muted-foreground mt-1">Developer handover protocol - semantic HTML tag mappings</p>
        </div>
        <Button onClick={addTextStyle} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Style
        </Button>
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
                    {tagOptions.map(tag => (
                      <SelectItem key={tag} value={tag}>{`<${tag}>`}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={style.size}
                  onChange={(e) => updateTextStyle(style.id, { size: e.target.value })}
                  placeholder="Size (e.g., 48px)"
                />
                <Select
                  value={style.weight}
                  onValueChange={(weight) => updateTextStyle(style.id, { weight })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Weight" />
                  </SelectTrigger>
                  <SelectContent>
                    {weightOptions.map(w => (
                      <SelectItem key={w} value={w}>{w}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={style.lineHeight}
                  onChange={(e) => updateTextStyle(style.id, { lineHeight: e.target.value })}
                  placeholder="Line height"
                />
                <Button size="sm" variant="secondary" onClick={() => setEditingId(null)} className="sm:col-span-4">
                  Done
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <code className="px-3 py-1.5 bg-secondary rounded-md text-sm font-mono text-foreground">
                    {`<${style.tag}>`}
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
                  >
                    <Pencil className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => deleteTextStyle(style.id)}
                    className="p-2 rounded-md hover:bg-destructive hover:text-destructive-foreground transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {textStyles.length === 0 && (
          <button
            onClick={addTextStyle}
            className="w-full h-24 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-accent hover:text-accent transition-colors"
          >
            <Plus className="h-6 w-6" />
            <span className="text-sm font-medium">Add your first text style</span>
          </button>
        )}
      </div>
    </section>
  );
};
