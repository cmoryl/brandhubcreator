/**
 * QRSection - Advanced QR code management section with library view
 * Supports multiple QR codes, logo overlays, filtering, and PNG/SVG exports
 */

import { useState, useMemo } from 'react';
import { Plus, QrCode as QrCodeIcon, Loader2, Search, Grid3X3, List, Filter, X } from 'lucide-react';
import { BrandQR, BrandLogo } from '@/types/brand';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { SectionHeader } from './SectionHeader';
import { QRCodeCard } from './qr/QRCodeCard';
import { QRCodeEditorDialog } from './qr/QRCodeEditorDialog';
import { useQRCodes, QRCode } from '@/hooks/useQRCodes';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useGuideAdmin } from '@/hooks/useGuideAdmin';
import { cn } from '@/lib/utils';
import { TransPerfectQRPanel } from './identity/TransPerfectQRPanel';

interface QRSectionProps {
  qr?: BrandQR; // Legacy single QR (for backward compatibility)
  onQRChange?: (qr: BrandQR) => void;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
  entityType?: 'brand' | 'product' | 'event';
  entityId?: string;
  logos?: BrandLogo[]; // Brand logos for overlay options
  brandSlug?: string;
}

const USE_CASE_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'event', label: 'Event' },
  { value: 'product', label: 'Product' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'contact', label: 'Contact' },
  { value: 'wifi', label: 'WiFi' },
  { value: 'other', label: 'Other' },
];

export const QRSection = ({ 
  qr, 
  onQRChange, 
  customSubtitle, 
  onSubtitleChange,
  entityType = 'brand',
  entityId,
  logos = [],
  brandSlug,
}: QRSectionProps) => {
  const isTransPerfect = brandSlug?.toLowerCase() === 'transperfect';
  const [isHeaderEditing, setIsHeaderEditing] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingQR, setEditingQR] = useState<QRCode | undefined>();
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  // Library state
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [useCaseFilter, setUseCaseFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  
  const { canEdit } = useGuideAdmin();
  
  // Use database-backed QR codes
  const {
    qrCodes,
    isLoading,
    addQRCode,
    updateQRCode,
    deleteQRCode,
    isAdding,
    isUpdating,
    isDeleting,
  } = useQRCodes(entityType, entityId);

  // Filter and search QR codes
  const filteredQRCodes = useMemo(() => {
    let result = qrCodes;
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(qr => 
        qr.name.toLowerCase().includes(query) ||
        qr.url.toLowerCase().includes(query) ||
        qr.description?.toLowerCase().includes(query)
      );
    }
    
    // Apply use case filter
    if (useCaseFilter !== 'all') {
      result = result.filter(qr => qr.useCase === useCaseFilter);
    }
    
    return result;
  }, [qrCodes, searchQuery, useCaseFilter]);

  // Count by use case for filter badges
  const useCaseCounts = useMemo(() => {
    const counts: Record<string, number> = { all: qrCodes.length };
    qrCodes.forEach(qr => {
      const useCase = qr.useCase || 'other';
      counts[useCase] = (counts[useCase] || 0) + 1;
    });
    return counts;
  }, [qrCodes]);

  // Convert brand logos to format for editor
  const brandLogos = logos
    .filter(logo => logo.url)
    .map(logo => ({ url: logo.url, name: logo.name }));

  const handleCreate = () => {
    setEditingQR(undefined);
    setEditorOpen(true);
  };

  const handleEdit = (qrCode: QRCode) => {
    setEditingQR(qrCode);
    setEditorOpen(true);
  };

  const handleSave = async (data: Omit<QRCode, 'id' | 'createdAt' | 'updatedAt' | 'scanCount'>) => {
    if (editingQR) {
      await updateQRCode({ id: editingQR.id, updates: data });
    } else {
      await addQRCode(data);
    }
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirmId) {
      await deleteQRCode(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setUseCaseFilter('all');
  };

  const hasQRCodes = qrCodes.length > 0;
  const hasActiveFilters = searchQuery.trim() !== '' || useCaseFilter !== 'all';

  return (
    <section id="qr" className="scroll-mt-24 space-y-6">
      {isTransPerfect && <TransPerfectQRPanel />}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex-1">
          <SectionHeader
            title="QR Codes"
            defaultSubtitle="Physical-to-digital bridge - brand-compliant QR codes"
            customSubtitle={customSubtitle}
            onSubtitleChange={canEdit ? onSubtitleChange : undefined}
            isEditing={isHeaderEditing}
            onEditToggle={() => setIsHeaderEditing(!isHeaderEditing)}
          />
        </div>
        {canEdit && (
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Create QR Code
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !hasQRCodes ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <QrCodeIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-semibold text-lg mb-2">No QR codes yet</h3>
            <p className="text-muted-foreground mb-4 max-w-md">
              Create branded QR codes for events, marketing materials, products, and more. 
              Supports custom colors, logo overlays, and multiple export formats.
            </p>
            {canEdit && (
              <Button onClick={handleCreate} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Your First QR Code
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Library Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search QR codes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-muted rounded"
                >
                  <X className="h-3 w-3 text-muted-foreground" />
                </button>
              )}
            </div>

            {/* View Toggle & Filter Button */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowFilters(!showFilters)}
                className={cn(showFilters && "bg-muted")}
              >
                <Filter className="h-4 w-4" />
              </Button>
              <div className="flex border rounded-md">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    "p-2 transition-colors",
                    viewMode === 'grid' ? "bg-muted" : "hover:bg-muted/50"
                  )}
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "p-2 transition-colors",
                    viewMode === 'list' ? "bg-muted" : "hover:bg-muted/50"
                  )}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Filter Pills */}
          {showFilters && (
            <div className="flex flex-wrap gap-2">
              {USE_CASE_FILTERS.map((filter) => {
                const count = useCaseCounts[filter.value] || 0;
                if (filter.value !== 'all' && count === 0) return null;
                
                return (
                  <button
                    key={filter.value}
                    onClick={() => setUseCaseFilter(filter.value)}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                      useCaseFilter === filter.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80 text-muted-foreground"
                    )}
                  >
                    {filter.label}
                    <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                      {count}
                    </Badge>
                  </button>
                );
              })}
              
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-3 w-3" />
                  Clear filters
                </button>
              )}
            </div>
          )}

          {/* Results Info */}
          {hasActiveFilters && (
            <p className="text-sm text-muted-foreground">
              Showing {filteredQRCodes.length} of {qrCodes.length} QR codes
            </p>
          )}

          {/* QR Code Grid/List */}
          {filteredQRCodes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">No QR codes match your filters</p>
              <Button variant="link" onClick={clearFilters} className="mt-2">
                Clear filters
              </Button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredQRCodes.map((qrCode) => (
                <QRCodeCard
                  key={qrCode.id}
                  qrCode={qrCode}
                  canEdit={canEdit}
                  onEdit={() => handleEdit(qrCode)}
                  onDelete={() => setDeleteConfirmId(qrCode.id)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredQRCodes.map((qrCode) => (
                <QRCodeCard
                  key={qrCode.id}
                  qrCode={qrCode}
                  canEdit={canEdit}
                  onEdit={() => handleEdit(qrCode)}
                  onDelete={() => setDeleteConfirmId(qrCode.id)}
                  variant="list"
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Editor Dialog */}
      <QRCodeEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        qrCode={editingQR}
        brandLogos={brandLogos}
        onSave={handleSave}
        isSaving={isAdding || isUpdating}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete QR Code?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The QR code will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
};
