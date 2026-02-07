/**
 * QRSection - Advanced QR code management section
 * Supports multiple QR codes, logo overlays, and PNG/SVG exports
 */

import { useState } from 'react';
import { Plus, QrCode as QrCodeIcon, Loader2 } from 'lucide-react';
import { BrandQR, BrandLogo } from '@/types/brand';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SectionHeader } from './SectionHeader';
import { QRCodeCard } from './qr/QRCodeCard';
import { QRCodeEditorDialog } from './qr/QRCodeEditorDialog';
import { useQRCodes, QRCode } from '@/hooks/useQRCodes';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useGuideAdmin } from '@/hooks/useGuideAdmin';

interface QRSectionProps {
  qr?: BrandQR; // Legacy single QR (for backward compatibility)
  onQRChange?: (qr: BrandQR) => void;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
  entityType?: 'brand' | 'product' | 'event';
  entityId?: string;
  logos?: BrandLogo[]; // Brand logos for overlay options
}

export const QRSection = ({ 
  qr, 
  onQRChange, 
  customSubtitle, 
  onSubtitleChange,
  entityType = 'brand',
  entityId,
  logos = [],
}: QRSectionProps) => {
  const [isHeaderEditing, setIsHeaderEditing] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingQR, setEditingQR] = useState<QRCode | undefined>();
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
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

  const hasQRCodes = qrCodes.length > 0;

  return (
    <section id="qr" className="scroll-mt-24 space-y-6">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {qrCodes.map((qrCode) => (
            <QRCodeCard
              key={qrCode.id}
              qrCode={qrCode}
              canEdit={canEdit}
              onEdit={() => handleEdit(qrCode)}
              onDelete={() => setDeleteConfirmId(qrCode.id)}
            />
          ))}
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
