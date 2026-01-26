import { useState, useRef } from 'react';
import { Plus, X, Pencil, Upload, ExternalLink } from 'lucide-react';
import { BrandCaseStudy } from '@/types/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SectionHeader } from './SectionHeader';

import { LayoutSelector, useLayoutClasses, LayoutPreset } from './LayoutSelector';

interface CaseStudiesSectionProps {
  caseStudies: BrandCaseStudy[];
  onCaseStudiesChange: (caseStudies: BrandCaseStudy[]) => void;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
  layout?: LayoutPreset;
  onLayoutChange?: (layout: LayoutPreset) => void;
}

export const CaseStudiesSection = ({ caseStudies: caseStudiesProp, onCaseStudiesChange, customSubtitle, onSubtitleChange, layout = 'grid-3', onLayoutChange }: CaseStudiesSectionProps) => {
  // Defensive: ensure caseStudies is always an array
  const caseStudies = Array.isArray(caseStudiesProp) ? caseStudiesProp : [];
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isHeaderEditing, setIsHeaderEditing] = useState(false);
  
  const { gridClass } = useLayoutClasses(layout);

  const addCaseStudy = () => {
    const newCase: BrandCaseStudy = {
      id: crypto.randomUUID(),
      title: 'New Case Study',
      description: 'Describe the project, goals, and outcomes',
      previewUrl: '',
    };
    onCaseStudiesChange([...caseStudies, newCase]);
    setEditingId(newCase.id);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !pendingId) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      updateCaseStudy(pendingId, { previewUrl: url });
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setPendingId(null);
  };

  const triggerUpload = (id: string) => {
    setPendingId(id);
    fileInputRef.current?.click();
  };

  const updateCaseStudy = (id: string, updates: Partial<BrandCaseStudy>) => {
    onCaseStudiesChange(caseStudies.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const deleteCaseStudy = (id: string) => {
    onCaseStudiesChange(caseStudies.filter(c => c.id !== id));
    if (editingId === id) setEditingId(null);
  };

  return (
    <section className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <SectionHeader
            title="Proof Shards"
            defaultSubtitle="Repository of historical success models"
            customSubtitle={customSubtitle}
            onSubtitleChange={onSubtitleChange}
            isEditing={isHeaderEditing}
            onEditToggle={() => setIsHeaderEditing(!isHeaderEditing)}
          />
        </div>
        <div className="flex items-center gap-2">
          {onLayoutChange && (
            <LayoutSelector
              value={layout}
              onChange={onLayoutChange}
              availableLayouts={['grid-2', 'grid-3', 'grid-4', 'list']}
              size="sm"
            />
          )}
          {onCaseStudiesChange && (
            <Button onClick={addCaseStudy} size="sm" className="gap-2 shrink-0">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Case Study</span>
              <span className="sm:hidden">Add</span>
            </Button>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      <div className={gridClass}>
        {caseStudies.map((study, index) => (
          <div
            key={study.id}
            className="group relative bg-card rounded-xl overflow-hidden shadow-sm border border-border animate-scale-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Preview Image with Drag & Drop */}
            <div
              className="aspect-video bg-muted relative cursor-pointer transition-colors"
              onClick={() => triggerUpload(study.id)}
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.classList.add('ring-2', 'ring-primary');
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove('ring-2', 'ring-primary');
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove('ring-2', 'ring-primary');
                const file = e.dataTransfer.files?.[0];
                if (file && file.type.startsWith('image/')) {
                  setPendingId(study.id);
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    updateCaseStudy(study.id, { previewUrl: event.target?.result as string });
                  };
                  reader.readAsDataURL(file);
                }
              }}
              style={study.previewUrl ? { backgroundImage: `url(${study.previewUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
            >
              {!study.previewUrl && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground hover:text-accent transition-colors gap-1">
                  <Upload className="h-8 w-8" />
                  <span className="text-xs">Drop image or click</span>
                </div>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); deleteCaseStudy(study.id); }}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              {editingId === study.id ? (
                <div className="space-y-3">
                  <Input
                    value={study.title}
                    onChange={(e) => updateCaseStudy(study.id, { title: e.target.value })}
                    placeholder="Case study title"
                  />
                  <Textarea
                    value={study.description}
                    onChange={(e) => updateCaseStudy(study.id, { description: e.target.value })}
                    placeholder="Description"
                    className="min-h-[80px] resize-none"
                  />
                  <Button size="sm" variant="secondary" onClick={() => setEditingId(null)} className="w-full">
                    Done
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-foreground">{study.title}</h3>
                    <button
                      onClick={() => setEditingId(study.id)}
                      className="p-1.5 rounded-md hover:bg-secondary transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3">{study.description}</p>
                </div>
              )}
            </div>
          </div>
        ))}

        {caseStudies.length === 0 && (
          <button
            onClick={addCaseStudy}
            className="aspect-video border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-accent hover:text-accent transition-colors"
          >
            <Plus className="h-8 w-8" />
            <span className="text-sm font-medium">Add your first case study</span>
          </button>
        )}
      </div>
    </section>
  );
};
