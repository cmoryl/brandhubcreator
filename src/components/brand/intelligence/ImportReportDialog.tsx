import { useState, useRef, useCallback } from 'react';
import {
  FileUp,
  FileText,
  Loader2,
  CheckCircle2,
  X,
  Sparkles,
  Upload,
  ClipboardPaste,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ExtractedInsight {
  type: 'insight' | 'note' | 'learning' | 'milestone' | 'feedback' | 'metric';
  content: string;
  category: string;
  confidence: number;
  selected: boolean;
}

interface ImportReportDialogProps {
  entityType: 'brand' | 'product' | 'event';
  entityId: string;
  organizationId?: string;
  onInsightsImported: (entries: Array<{
    type: string;
    content: string;
    category: string;
    confidence: number;
  }>) => void;
  children?: React.ReactNode;
}

const typeEmojis: Record<string, string> = {
  insight: '💡',
  note: '📝',
  learning: '🧠',
  milestone: '🎯',
  feedback: '💬',
  metric: '📊',
};

export const ImportReportDialog = ({
  entityType,
  entityId,
  organizationId,
  onInsightsImported,
  children,
}: ImportReportDialogProps) => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'upload' | 'review' | 'importing'>('upload');
  const [isExtracting, setIsExtracting] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [fileName, setFileName] = useState('');
  const [summary, setSummary] = useState('');
  const [insights, setInsights] = useState<ExtractedInsight[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setStep('upload');
    setIsExtracting(false);
    setPastedText('');
    setFileName('');
    setSummary('');
    setInsights([]);
    setImportProgress(0);
  }, []);

  const handleFileUpload = async (file: File) => {
    const validTypes = ['.pdf', '.txt', '.md', '.markdown'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!validTypes.includes(ext)) {
      toast.error('Please upload a PDF, TXT, or Markdown file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File must be under 10MB');
      return;
    }

    setIsExtracting(true);
    setFileName(file.name);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please log in to import reports');
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/import-brand-report`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to process document');
      }

      const result = await response.json();
      handleExtractionResult(result);
    } catch (err) {
      console.error('Import error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to process document');
      setIsExtracting(false);
    }
  };

  const handleTextSubmit = async () => {
    if (pastedText.trim().length < 20) {
      toast.error('Please enter at least 20 characters of content');
      return;
    }

    setIsExtracting(true);
    setFileName('Pasted Report');

    try {
      const { data, error } = await supabase.functions.invoke('import-brand-report', {
        body: { text: pastedText, fileName: 'Pasted Report' },
      });

      if (error) throw error;
      handleExtractionResult(data);
    } catch (err) {
      console.error('Import error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to process text');
      setIsExtracting(false);
    }
  };

  const handleExtractionResult = (result: { fileName: string; summary: string; insights: any[] }) => {
    setFileName(result.fileName);
    setSummary(result.summary);
    setInsights(
      (result.insights || []).map((i: any) => ({
        ...i,
        selected: true,
      }))
    );
    setStep('review');
    setIsExtracting(false);
  };

  const toggleInsight = (index: number) => {
    setInsights(prev =>
      prev.map((ins, i) => (i === index ? { ...ins, selected: !ins.selected } : ins))
    );
  };

  const toggleAll = (selected: boolean) => {
    setInsights(prev => prev.map(ins => ({ ...ins, selected })));
  };

  const handleConfirmImport = async () => {
    const selected = insights.filter(i => i.selected);
    if (selected.length === 0) {
      toast.error('Select at least one insight to import');
      return;
    }

    setStep('importing');
    setImportProgress(0);

    try {
      // Add entries one by one via brand-intelligence edge function
      for (let idx = 0; idx < selected.length; idx++) {
        const insight = selected[idx];
        await supabase.functions.invoke('brand-intelligence', {
          body: {
            action: 'add_entry',
            entityType,
            entityId,
            organizationId,
            entry: {
              type: insight.type,
              content: insight.content,
              category: insight.category || 'Imported Report',
              source: 'ai',
              confidence: insight.confidence,
            },
          },
        });
        setImportProgress(Math.round(((idx + 1) / selected.length) * 100));
      }

      onInsightsImported(
        selected.map(i => ({
          type: i.type,
          content: i.content,
          category: i.category,
          confidence: i.confidence,
        }))
      );

      toast.success(`Imported ${selected.length} insights into the brand brain`);
      setOpen(false);
      reset();
    } catch (err) {
      console.error('Import failed:', err);
      toast.error('Failed to import some insights');
      setStep('review');
    }
  };

  const selectedCount = insights.filter(i => i.selected).length;

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm" className="gap-2">
            <FileUp className="h-4 w-4" />
            Import Report
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileUp className="h-5 w-5 text-primary" />
            Import Report into Brand Brain
          </DialogTitle>
          <DialogDescription>
            Upload a PDF or paste text from a brand analysis report. AI will extract key insights for your review.
          </DialogDescription>
        </DialogHeader>

        {/* Step: Upload */}
        {step === 'upload' && !isExtracting && (
          <Tabs defaultValue="file" className="mt-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="file" className="gap-2">
                <Upload className="h-4 w-4" />
                Upload File
              </TabsTrigger>
              <TabsTrigger value="paste" className="gap-2">
                <ClipboardPaste className="h-4 w-4" />
                Paste Text
              </TabsTrigger>
            </TabsList>

            <TabsContent value="file" className="mt-4">
              <div
                className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleFileUpload(file);
                }}
              >
                <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-sm font-medium">Drop a file here or click to browse</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Supports PDF, TXT, and Markdown files (max 10MB)
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.txt,.md,.markdown"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
              />
            </TabsContent>

            <TabsContent value="paste" className="mt-4 space-y-3">
              <Textarea
                placeholder="Paste your report content, analysis findings, or brand research text here..."
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                className="min-h-[200px] text-sm"
              />
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">
                  {pastedText.length} characters
                </span>
                <Button
                  onClick={handleTextSubmit}
                  disabled={pastedText.trim().length < 20}
                  className="gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Extract Insights
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Extracting state */}
        {isExtracting && (
          <div className="py-12 text-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
            <div>
              <p className="font-medium">Analyzing "{fileName}"</p>
              <p className="text-sm text-muted-foreground mt-1">
                AI is extracting insights and key findings...
              </p>
            </div>
          </div>
        )}

        {/* Step: Review */}
        {step === 'review' && (
          <div className="flex-1 min-h-0 flex flex-col gap-3 mt-2">
            {/* Summary */}
            <div className="p-3 rounded-lg bg-muted/50 border">
              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">{fileName}</p>
                  <p className="text-xs text-muted-foreground mt-1">{summary}</p>
                </div>
              </div>
            </div>

            {/* Selection controls */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedCount} of {insights.length} insights selected
              </span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => toggleAll(true)}>
                  Select All
                </Button>
                <Button variant="ghost" size="sm" onClick={() => toggleAll(false)}>
                  Deselect All
                </Button>
              </div>
            </div>

            {/* Insights list */}
            <ScrollArea className="flex-1 max-h-[40vh]">
              <div className="space-y-2 pr-3">
                {insights.map((insight, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                      insight.selected
                        ? 'bg-primary/5 border-primary/30'
                        : 'bg-muted/20 border-border opacity-60'
                    }`}
                    onClick={() => toggleInsight(idx)}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={insight.selected}
                        onCheckedChange={() => toggleInsight(idx)}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{insight.content}</p>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            {typeEmojis[insight.type] || '📝'} {insight.type}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {insight.category}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {Math.round(insight.confidence * 100)}% confidence
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Actions */}
            <div className="flex gap-2 justify-end pt-2 border-t">
              <Button variant="outline" onClick={reset}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleConfirmImport}
                disabled={selectedCount === 0}
                className="gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                Import {selectedCount} Insights
              </Button>
            </div>
          </div>
        )}

        {/* Step: Importing */}
        {step === 'importing' && (
          <div className="py-12 text-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
            <div>
              <p className="font-medium">Importing insights...</p>
              <Progress value={importProgress} className="w-64 mx-auto mt-3" />
              <p className="text-xs text-muted-foreground mt-2">{importProgress}% complete</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
