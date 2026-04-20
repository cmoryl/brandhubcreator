import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, Trash2 } from 'lucide-react';
import { LinkedBoothCard, BoothLink } from '@/types/brand';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { LinkedBoothPreviewCard, resolveBoothDivision, LinkBoothDialog } from '@/components/brand/LinkedBoothCards';
import { useCustomDivisions } from '@/hooks/useCustomDivisions';
import { DivisionDetail, type BoothDivision } from '@/pages/BoothsCatalog';

interface PartnerBoothsSectionProps {
  partnerBooths: LinkedBoothCard[];
  onUpdate?: (booths: LinkedBoothCard[]) => void;
  isEditable: boolean;
}

export const PartnerBoothsSection = ({
  partnerBooths,
  onUpdate,
  isEditable,
}: PartnerBoothsSectionProps) => {
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [detailDivision, setDetailDivision] = useState<BoothDivision | null>(null);
  const navigate = useNavigate();
  const { divisions: customDivisions } = useCustomDivisions();

  const handleLink = (booth: LinkedBoothCard) => {
    if (!onUpdate) return;
    // Prevent duplicates
    if (partnerBooths.some(b => b.divisionId === booth.divisionId)) return;
    onUpdate([...partnerBooths, booth]);
  };

  const handleRemove = (divisionId: string) => {
    if (!onUpdate) return;
    onUpdate(partnerBooths.filter(b => b.divisionId !== divisionId));
  };

  const handleUpdateLinks = (boothId: string, links: BoothLink[]) => {
    if (!onUpdate) return;
    onUpdate(partnerBooths.map(b => b.id === boothId ? { ...b, links } : b));
  };

  const handleUpdateImage = (boothId: string, customImage: string | undefined) => {
    if (!onUpdate) return;
    onUpdate(partnerBooths.map(b => b.id === boothId ? { ...b, customImage } : b));
  };

  const handleUpdateFileUrls = (boothId: string, liveFileUrl?: string, pdfFileUrl?: string) => {
    if (!onUpdate) return;
    onUpdate(partnerBooths.map(b => b.id === boothId ? { ...b, liveFileUrl, pdfFileUrl } : b));
  };

  const handleOpenDetail = (booth: LinkedBoothCard) => {
    // Open the in-app booth catalog detail (variants page) as a modal
    const division = resolveBoothDivision(booth, customDivisions);
    if (division) {
      setDetailDivision(division);
    } else {
      const url = `https://boothhub.lovable.app/?booth=${encodeURIComponent(booth.divisionId)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Partner Booths</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Booth designs, imagery, and production specs for event partner divisions
          </p>
        </div>
        {isEditable && (
          <Button onClick={() => setLinkDialogOpen(true)} size="sm" variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            Link Booth
          </Button>
        )}
      </div>

      {partnerBooths.length === 0 ? (
        <div className="border-2 border-dashed border-border rounded-xl p-12 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No Partner Booths Linked</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
            Link booths from the catalog to showcase partner booth designs, live files, imagery, and production specifications.
          </p>
          {isEditable && (
            <Button onClick={() => setLinkDialogOpen(true)} variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Link First Booth
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {partnerBooths.map((booth) => (
            <LinkedBoothPreviewCard
              key={booth.id}
              booth={booth}
              isEditable={isEditable}
              onRemove={() => handleRemove(booth.divisionId)}
              onOpenDetail={() => handleOpenDetail(booth)}
              onUpdateLinks={(links) => handleUpdateLinks(booth.id, links)}
              onUpdateImage={(img) => handleUpdateImage(booth.id, img)}
              onUpdateFileUrls={(liveFileUrl, pdfFileUrl) => handleUpdateFileUrls(booth.id, liveFileUrl, pdfFileUrl)}
            />
          ))}
        </div>
      )}

      {/* Link Booth Dialog */}
      <LinkBoothDialog
        open={linkDialogOpen}
        onOpenChange={setLinkDialogOpen}
        onLink={handleLink}
        linkedBooths={partnerBooths}
      />

      {/* In-app booth catalog detail modal — shows variants */}
      <Dialog open={!!detailDivision} onOpenChange={(open) => !open && setDetailDivision(null)}>
        <DialogContent className="max-w-7xl w-[95vw] h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>{detailDivision?.name} Booth Catalog</DialogTitle>
            <DialogDescription>Browse booth variants and details for {detailDivision?.name}</DialogDescription>
          </DialogHeader>
          {detailDivision && (
            <div className="h-full overflow-y-auto">
              <DivisionDetail
                division={detailDivision}
                onClose={() => setDetailDivision(null)}
                isAdmin={isEditable}
                mode="modal"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

    </section>
  );
};
