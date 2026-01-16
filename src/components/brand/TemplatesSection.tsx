import { useState, useRef } from 'react';
import { Plus, X, Pencil, Upload, Download, FileType } from 'lucide-react';
import { BrandTemplate } from '@/types/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface TemplatesSectionProps {
  templates: BrandTemplate[];
  onTemplatesChange: (templates: BrandTemplate[]) => void;
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const getFileTypeIcon = (type: string) => {
  if (type.includes('presentation') || type.includes('ppt')) return '📊';
  if (type.includes('document') || type.includes('doc')) return '📝';
  if (type.includes('spreadsheet') || type.includes('xls')) return '📈';
  if (type.includes('figma') || type.includes('sketch')) return '🎨';
  if (type.includes('photoshop') || type.includes('psd')) return '🖼️';
  if (type.includes('illustrator') || type.includes('ai')) return '✏️';
  return '📄';
};

export const TemplatesSection = ({ templates, onTemplatesChange }: TemplatesSectionProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileData, setFileData] = useState<Record<string, string>>({});

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      const newTemplate: BrandTemplate = {
        id: crypto.randomUUID(),
        name: file.name.replace(/\.[^/.]+$/, ''),
        fileType: file.name.split('.').pop() || 'unknown',
        fileSize: formatFileSize(file.size),
      };
      setFileData(prev => ({ ...prev, [newTemplate.id]: url }));
      onTemplatesChange([...templates, newTemplate]);
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const updateTemplate = (id: string, updates: Partial<BrandTemplate>) => {
    onTemplatesChange(templates.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteTemplate = (id: string) => {
    onTemplatesChange(templates.filter(t => t.id !== id));
    setFileData(prev => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
    if (editingId === id) setEditingId(null);
  };

  const downloadTemplate = (template: BrandTemplate) => {
    const url = fileData[template.id];
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.download = `${template.name}.${template.fileType}`;
      link.click();
    }
  };

  // Group by file type
  const groupedTemplates = templates.reduce((acc, template) => {
    const category = template.fileType.toUpperCase();
    if (!acc[category]) acc[category] = [];
    acc[category].push(template);
    return acc;
  }, {} as Record<string, BrandTemplate[]>);

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-semibold text-foreground">Master Scaffolds</h2>
          <p className="text-muted-foreground mt-1">Presentation decks, document templates, and design files</p>
        </div>
        <Button onClick={() => fileInputRef.current?.click()} size="sm" className="gap-2">
          <Upload className="h-4 w-4" />
          Upload Template
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileUpload}
        className="hidden"
      />

      {Object.keys(groupedTemplates).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedTemplates).map(([type, typeTemplates]) => (
            <div key={type} className="space-y-3">
              <div className="flex items-center gap-2">
                <FileType className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  {type} Files
                </h3>
                <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                  {typeTemplates.length}
                </span>
              </div>
              <div className="bg-card rounded-xl border border-border overflow-hidden divide-y divide-border">
                {typeTemplates.map((template, index) => (
                  <div
                    key={template.id}
                    className="group flex items-center justify-between p-4 hover:bg-muted/30 transition-colors animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="text-2xl">{getFileTypeIcon(template.fileType)}</span>
                      <div className="min-w-0 flex-1">
                        {editingId === template.id ? (
                          <Input
                            value={template.name}
                            onChange={(e) => updateTemplate(template.id, { name: e.target.value })}
                            onBlur={() => setEditingId(null)}
                            onKeyDown={(e) => e.key === 'Enter' && setEditingId(null)}
                            className="h-8"
                            autoFocus
                          />
                        ) : (
                          <p className="font-medium text-foreground truncate">{template.name}</p>
                        )}
                        <p className="text-xs text-muted-foreground">{template.fileSize} • .{template.fileType}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => downloadTemplate(template)}
                        className="gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                      <button
                        onClick={() => setEditingId(template.id)}
                        className="p-2 rounded-md hover:bg-secondary transition-colors"
                      >
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => deleteTemplate(template.id)}
                        className="p-2 rounded-md hover:bg-destructive hover:text-destructive-foreground transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-48 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-3 text-muted-foreground hover:border-accent hover:text-accent transition-colors"
        >
          <FileType className="h-10 w-10" />
          <div className="text-center">
            <p className="font-medium">Upload design templates</p>
            <p className="text-sm">PPTX, DOCX, Figma, Sketch, PSD files</p>
          </div>
        </button>
      )}
    </section>
  );
};
