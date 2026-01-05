import { useState, useRef } from 'react';
import { Plus, X, Upload, Image } from 'lucide-react';
import { BrandLogo } from '@/types/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface LogoSectionProps {
  logos: BrandLogo[];
  onLogosChange: (logos: BrandLogo[]) => void;
}

const variantLabels: Record<BrandLogo['variant'], string> = {
  primary: 'Primary Logo',
  secondary: 'Secondary Logo',
  reversed: 'Reversed Logo',
  monochrome: 'Monochrome Logo',
  icon: 'Icon / Favicon',
  wordmark: 'Wordmark',
};

export const LogoSection = ({ logos, onLogosChange }: LogoSectionProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingVariant, setPendingVariant] = useState<BrandLogo['variant']>('primary');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      const newLogo: BrandLogo = {
        id: crypto.randomUUID(),
        name: file.name.replace(/\.[^/.]+$/, ''),
        url,
        variant: pendingVariant,
      };
      onLogosChange([...logos, newLogo]);
    };
    reader.readAsDataURL(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerUpload = (variant: BrandLogo['variant']) => {
    setPendingVariant(variant);
    fileInputRef.current?.click();
  };

  const updateLogo = (id: string, updates: Partial<BrandLogo>) => {
    onLogosChange(logos.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const deleteLogo = (id: string) => {
    onLogosChange(logos.filter(l => l.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const groupedLogos = logos.reduce((acc, logo) => {
    if (!acc[logo.variant]) acc[logo.variant] = [];
    acc[logo.variant].push(logo);
    return acc;
  }, {} as Record<BrandLogo['variant'], BrandLogo[]>);

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-semibold text-foreground">Logos</h2>
          <p className="text-muted-foreground mt-1">Upload and organize your brand logos</p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {(['primary', 'secondary', 'reversed', 'monochrome', 'icon', 'wordmark'] as const).map((variant) => (
          <div key={variant} className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              {variantLabels[variant]}
            </h3>
            
            <div className="space-y-3">
              {groupedLogos[variant]?.map((logo, index) => (
                <div
                  key={logo.id}
                  className="group relative bg-card rounded-xl overflow-hidden shadow-sm border border-border animate-scale-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="aspect-video bg-[repeating-conic-gradient(hsl(var(--muted))_0%_25%,hsl(var(--background))_0%_50%)] bg-[length:20px_20px] flex items-center justify-center p-8">
                    <img
                      src={logo.url}
                      alt={logo.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  
                  <div className="p-4">
                    {editingId === logo.id ? (
                      <div className="space-y-2">
                        <Input
                          value={logo.name}
                          onChange={(e) => updateLogo(logo.id, { name: e.target.value })}
                          placeholder="Logo name"
                          className="h-8"
                        />
                        <Select
                          value={logo.variant}
                          onValueChange={(value: BrandLogo['variant']) => updateLogo(logo.id, { variant: value })}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(variantLabels).map(([value, label]) => (
                              <SelectItem key={value} value={value}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button size="sm" variant="secondary" onClick={() => setEditingId(null)} className="w-full">
                          Done
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-foreground">{logo.name}</span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setEditingId(logo.id)}
                            className="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground"
                          >
                            <Image className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => deleteLogo(logo.id)}
                            className="p-1.5 rounded-md hover:bg-destructive hover:text-destructive-foreground transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              <button
                onClick={() => triggerUpload(variant)}
                className="w-full h-32 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-accent hover:text-accent transition-colors"
              >
                <Upload className="h-6 w-6" />
                <span className="text-sm font-medium">Upload {variantLabels[variant]}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
