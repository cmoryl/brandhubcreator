import { useState, useRef, useCallback } from 'react';
import { 
  Download, 
  Upload, 
  FileJson, 
  Check, 
  X, 
  Loader2, 
  FolderDown,
  Palette,
  Type,
  Image,
  Package,
  AlertCircle,
  ArrowRight,
  Sparkles
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
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useBrandBackup, BrandBackupData, FullBackupData } from '@/hooks/useBrandBackup';
import { BrandGuide, ProductGuide } from '@/types/brand';
import { useBrands } from '@/contexts/BrandContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

interface BrandBackupDialogProps {
  guide?: BrandGuide | ProductGuide;
  showFullBackup?: boolean;
  trigger?: React.ReactNode;
}

export const BrandBackupDialog = ({
  guide,
  showFullBackup = false,
  trigger,
}: BrandBackupDialogProps) => {
  const { brands, products, refetch } = useBrands();
  const { organization } = useOrganization();
  const {
    downloadGuide,
    downloadFullBackup,
    parseBackupFile,
    importGuide,
    importFullBackup,
  } = useBrandBackup();

  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importPreview, setImportPreview] = useState<BrandBackupData | FullBackupData | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = useCallback(() => {
    if (guide) {
      downloadGuide(guide);
    } else if (showFullBackup) {
      downloadFullBackup(brands, products, organization?.name);
    }
    setOpen(false);
  }, [guide, showFullBackup, brands, products, organization?.name, downloadGuide, downloadFullBackup]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setImportError(null);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await processFile(files[0]);
    }
  }, []);

  const processFile = async (file: File) => {
    if (!file.name.endsWith('.json')) {
      setImportError('Please upload a valid .json backup file');
      return;
    }

    setIsProcessing(true);
    setImportError(null);

    try {
      const backup = await parseBackupFile(file);
      if (backup) {
        setImportPreview(backup);
      } else {
        setImportError('Invalid backup file format');
      }
    } catch (err) {
      setImportError('Failed to read backup file');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFile(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleImport = async () => {
    if (!importPreview) return;

    setIsProcessing(true);
    setImportProgress(0);

    try {
      if ('brands' in importPreview) {
        // Full backup - simulate progress
        const total = importPreview.brands.length + importPreview.products.length;
        let completed = 0;

        for (const brandBackup of importPreview.brands) {
          await importGuide(brandBackup, organization?.id);
          completed++;
          setImportProgress(Math.round((completed / total) * 100));
        }

        for (const productBackup of importPreview.products) {
          await importGuide(productBackup, organization?.id);
          completed++;
          setImportProgress(Math.round((completed / total) * 100));
        }

        await refetch();
        toast.success(`Successfully imported ${importPreview.brands.length} brands and ${importPreview.products.length} products`);
      } else {
        // Single guide
        setImportProgress(50);
        const result = await importGuide(importPreview, organization?.id);
        setImportProgress(100);
        
        if (result.success) {
          await refetch();
          toast.success(`Successfully imported "${importPreview.guide.hero.name}"`);
        }
      }

      setImportPreview(null);
      setOpen(false);
    } catch (err) {
      toast.error('Import failed. Please try again.');
    } finally {
      setIsProcessing(false);
      setImportProgress(0);
    }
  };

  const resetImport = () => {
    setImportPreview(null);
    setImportError(null);
    setImportProgress(0);
  };

  const renderGuideStats = (guideData: BrandGuide | ProductGuide) => {
    const stats = [
      { icon: Palette, label: 'Colors', value: guideData.colors?.length || 0 },
      { icon: Type, label: 'Fonts', value: guideData.typography?.length || 0 },
      { icon: Image, label: 'Logos', value: guideData.logos?.length || 0 },
      { icon: Package, label: 'Assets', value: guideData.assets?.length || 0 },
    ];

    return (
      <div className="grid grid-cols-4 gap-2">
        {stats.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex flex-col items-center p-2 rounded-lg bg-muted/50">
            <Icon className="h-4 w-4 text-muted-foreground mb-1" />
            <span className="text-lg font-semibold">{value}</span>
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderImportPreview = () => {
    if (!importPreview) return null;

    if ('brands' in importPreview) {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <FolderDown className="h-3 w-3" />
              Full Backup
            </Badge>
            <span className="text-sm text-muted-foreground">
              Exported {new Date(importPreview.exportedAt).toLocaleDateString()}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border">
              <div className="text-3xl font-bold text-primary">{importPreview.metadata.totalBrands}</div>
              <div className="text-sm text-muted-foreground">Brand Guides</div>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-secondary/10 to-secondary/5 border">
              <div className="text-3xl font-bold text-secondary-foreground">{importPreview.metadata.totalProducts}</div>
              <div className="text-sm text-muted-foreground">Product Guides</div>
            </div>
          </div>

          {importPreview.metadata.organizationName && (
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <span className="font-medium">Source:</span> {importPreview.metadata.organizationName}
            </p>
          )}

          {importPreview.exportedBy && (
            <p className="text-sm text-muted-foreground">
              Exported by: {importPreview.exportedBy}
            </p>
          )}
        </div>
      );
    }

    const guideData = importPreview.guide;
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant={importPreview.type === 'brand' ? 'default' : 'secondary'}>
            {importPreview.type === 'brand' ? 'Brand Guide' : 'Product Guide'}
          </Badge>
          <span className="text-sm text-muted-foreground">
            Exported {new Date(importPreview.exportedAt).toLocaleDateString()}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 border">
          {guideData.hero.coverImage && (
            <div 
              className="w-full h-24 rounded-lg bg-cover bg-center mb-3"
              style={{ backgroundImage: `url(${guideData.hero.coverImage})` }}
            />
          )}
          <h3 className="text-lg font-semibold">{guideData.hero.name}</h3>
          {guideData.hero.tagline && (
            <p className="text-sm text-muted-foreground mt-1">{guideData.hero.tagline}</p>
          )}
        </div>

        {renderGuideStats(guideData)}

        {importPreview.exportedBy && (
          <p className="text-sm text-muted-foreground">
            Exported by: {importPreview.exportedBy}
          </p>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <FileJson className="h-4 w-4" />
            Backup
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileJson className="h-5 w-5 text-primary" />
            {guide ? `Backup: ${guide.hero.name}` : 'Brand Project Backup'}
          </DialogTitle>
          <DialogDescription>
            Save your brand guide to your computer or import an existing backup file.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'export' | 'import')}>
          <TabsList className="grid w-full grid-cols-2" aria-label="Backup actions">
            <TabsTrigger value="export" className="gap-2" aria-label="Export backup">
              <Download className="h-4 w-4" />
              Save Project
            </TabsTrigger>
            <TabsTrigger value="import" className="gap-2" aria-label="Import backup">
              <Upload className="h-4 w-4" />
              Import Project
            </TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-4 mt-4">
            <div className="p-6 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 border-2 border-dashed border-primary/20">
              <div className="text-center space-y-3">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Download className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold">
                    {guide ? `Export "${guide.hero.name}"` : 'Export All Guides'}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {guide 
                      ? 'Download this guide as a JSON file to your computer'
                      : `Download ${brands.length} brands and ${products.length} products`
                    }
                  </p>
                </div>
                <Button onClick={handleExport} className="gap-2">
                  <Download className="h-4 w-4" />
                  Download Backup File
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-sm">
              <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">Tip:</span> Keep regular backups of your brand guides. 
                You can import them anytime to restore or share with team members.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="import" className="space-y-4 mt-4">
            {importPreview ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Ready to Import</h4>
                  <Button variant="ghost" size="sm" onClick={resetImport}>
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                </div>

                <ScrollArea className="h-[280px] pr-2">
                  {renderImportPreview()}
                </ScrollArea>

                {isProcessing && importProgress > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Importing...</span>
                      <span className="font-medium">{importProgress}%</span>
                    </div>
                    <Progress value={importProgress} className="h-2" />
                  </div>
                )}

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={resetImport} 
                    className="flex-1"
                    disabled={isProcessing}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleImport} 
                    className="flex-1 gap-2"
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        Import Now
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleFileSelect}
                  aria-label="Select backup file"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  disabled={isProcessing}
                  className={cn(
                    'w-full p-8 rounded-xl border-2 border-dashed transition-all',
                    'flex flex-col items-center justify-center gap-3',
                    'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                    isDragging
                      ? 'border-primary bg-primary/5 scale-[1.02]'
                      : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50',
                    isProcessing && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {isProcessing ? (
                    <Loader2 className="h-10 w-10 text-primary animate-spin" />
                  ) : (
                    <>
                      <div className={cn(
                        'w-14 h-14 rounded-full flex items-center justify-center transition-colors',
                        isDragging ? 'bg-primary/20' : 'bg-muted'
                      )}>
                        <Upload className={cn(
                          'h-7 w-7 transition-colors',
                          isDragging ? 'text-primary' : 'text-muted-foreground'
                        )} />
                      </div>
                      <div className="text-center">
                        <p className="font-medium">
                          {isDragging ? 'Drop your file here' : 'Drag & drop your backup file'}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          or click to browse • .json files only
                        </p>
                      </div>
                    </>
                  )}
                </button>

                {importError && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {importError}
                  </div>
                )}

                <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-sm">
                  <ArrowRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-muted-foreground">
                    Import creates <span className="font-medium text-foreground">new copies</span> of your guides. 
                    Your existing data will not be affected.
                  </p>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
