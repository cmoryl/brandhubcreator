import { useState, useRef } from 'react';
import { Plus, X, Pencil, Upload, ExternalLink } from 'lucide-react';
import { BrandCaseStudy } from '@/types/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SectionHeader } from './SectionHeader';

interface CaseStudiesSectionProps {
  caseStudies: BrandCaseStudy[];
  onCaseStudiesChange: (caseStudies: BrandCaseStudy[]) => void;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
}

export const CaseStudiesSection = ({ caseStudies, onCaseStudiesChange, customSubtitle, onSubtitleChange }: CaseStudiesSectionProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isHeaderEditing, setIsHeaderEditing] = useState(false);

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
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <SectionHeader
            title="Proof Shards"
            defaultSubtitle="Repository of historical success models"
            customSubtitle={customSubtitle}
            onSubtitleChange={onSubtitleChange}
            isEditing={isHeaderEditing}
            onEditToggle={() => setIsHeaderEditing(!isHeaderEditing)}
          />
        </div>
        <Button onClick={addCaseStudy} size="sm" className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          Add Case Study
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {caseStudies.map((study, index) => (
          <div
            key={study.id}
            className="group relative bg-card rounded-xl overflow-hidden shadow-sm border border-border animate-scale-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Preview Image */}
            <div
              className="aspect-video bg-muted relative cursor-pointer"
              onClick={() => triggerUpload(study.id)}
              style={study.previewUrl ? { backgroundImage: `url(${study.previewUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
            >
              {!study.previewUrl && (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground hover:text-accent transition-colors">
                  <Upload className="h-8 w-8" />
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
