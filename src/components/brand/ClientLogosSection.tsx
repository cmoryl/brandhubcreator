import { useState, useMemo, useCallback } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import {
  Trash2,
  Pencil,
  FolderArchive,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Loader2,
  ImageIcon,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

import { ClientLogo } from '@/types/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { GuideEmptyState } from './GuideEmptyState';
import { SectionHeader } from './SectionHeader';
import { GlobalLogoPickerDialog } from './GlobalLogoPickerDialog';
import { LogoCardShared } from '@/components/logohub/shared/LogoCardShared';
import { LogoValidationBadge } from '@/components/logohub/shared/LogoValidationBadges';
import { UploadLogoVersion } from '@/components/logohub/UploadLogoVersion';
import { useHydratedClientLogos, type HydratedClientLogo } from '@/hooks/useHydratedClientLogos';
import { downloadManyLogosZip } from '@/lib/downloadLogoZip';
import { getExemptions, setExempt } from '@/lib/logoValidationExemptions';

interface ClientLogosSectionProps {
  clientLogos: ClientLogo[];
  onClientLogosChange?: (clientLogos: ClientLogo[]) => void;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
  entityId?: string;
  entityType?: 'brand' | 'product' | 'event';
}

type SortOption = 'default' | 'name-asc' | 'name-desc' | 'files-desc';

export const ClientLogosSection = ({
  clientLogos,
  onClientLogosChange,
  customSubtitle,
  onSubtitleChange,
  entityId: _entityId,
  entityType: _entityType = 'brand',
}: ClientLogosSectionProps) => {
  const { organization } = useOrganization();
  const canEdit = Boolean(onClientLogosChange);

  const { hydrated, isLoading, refresh } = useHydratedClientLogos(
    organization?.id,
    clientLogos,
  );

  const [isHeaderEditing, setIsHeaderEditing] = useState(false);
  const [editingLogo, setEditingLogo] = useState<HydratedClientLogo | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>('default');
  const [isExpanded, setIsExpanded] = useState(false);
  const [resyncingId, setResyncingId] = useState<string | null>(null);
  const [exemptIds, setExemptIds] = useState<Set<string>>(
    organization?.id ? getExemptions(organization.id) : new Set(),
  );

  const VISIBLE_COUNT = 6;

  const sortedLogos = useMemo(() => {
    const logos = [...hydrated];
    switch (sortOption) {
      case 'name-asc':
        return logos.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':
        return logos.sort((a, b) => b.name.localeCompare(a.name));
      case 'files-desc':
        return logos.sort((a, b) => (b.files?.length || 0) - (a.files?.length || 0));
      default:
        return logos;
    }
  }, [hydrated, sortOption]);

  const hasMoreLogos = sortedLogos.length > VISIBLE_COUNT;
  const visibleLogos =
    isExpanded || !hasMoreLogos ? sortedLogos : sortedLogos.slice(0, VISIBLE_COUNT);
  const hiddenCount = sortedLogos.length - VISIBLE_COUNT;

  const handleRemove = (id: string) => {
    if (!onClientLogosChange) return;
    onClientLogosChange(clientLogos.filter((l) => l.id !== id));
    toast.success('Removed from brand');
  };

  const handleRename = (id: string, updates: Partial<ClientLogo>) => {
    if (!onClientLogosChange) return;
    onClientLogosChange(
      clientLogos.map((l) => (l.id === id ? { ...l, ...updates } : l)),
    );
  };

  const handleToggleExempt = useCallback(
    (logoId: string) => {
      if (!organization?.id) return;
      const wasExempt = exemptIds.has(logoId);
      const next = setExempt(organization.id, logoId, !wasExempt);
      setExemptIds(new Set(next));
      toast.success(wasExempt ? 'Alerts re-enabled' : 'Marked as exempt');
    },
    [organization?.id, exemptIds],
  );

  const handleResync = useCallback(
    async (logo: HydratedClientLogo) => {
      if (!organization?.id) return;
      setResyncingId(logo.id);
      try {
        const { data, error } = await supabase.functions.invoke('seed-partnerlink-logos', {
          body: { organizationId: organization.id, names: [logo.name], force: true },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        toast.success(`Re-synced ${logo.name}`);
        await refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Re-sync failed');
      } finally {
        setResyncingId(null);
      }
    },
    [organization?.id, refresh],
  );

  const handleDownloadAll = () => {
    downloadManyLogosZip(
      sortedLogos.map((l) => ({ name: l.name, files: l.files || [] })),
    );
  };

  return (
    <section id="clientlogos" className="scroll-mt-24 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <SectionHeader
            title="Client Logos"
            defaultSubtitle="Sourced from the Global Logo Hub — same files, validation, and downloads as the master library"
            customSubtitle={customSubtitle}
            onSubtitleChange={canEdit ? onSubtitleChange : undefined}
            isEditing={isHeaderEditing}
            onEditToggle={() => setIsHeaderEditing(!isHeaderEditing)}
          />
        </div>
        <div className="flex items-center gap-2">
          {sortedLogos.some((l) => (l.files || []).length > 0) && (
            <Button size="sm" variant="outline" className="gap-2" onClick={handleDownloadAll}>
              <FolderArchive className="h-4 w-4" />
              Download All (ZIP)
            </Button>
          )}
          {canEdit && (
            <GlobalLogoPickerDialog
              existingLogoNames={clientLogos.map((l) => l.name)}
              onImport={(imported) => {
                onClientLogosChange?.([...clientLogos, ...imported]);
              }}
            />
          )}
        </div>
      </div>

      {/* Loading */}
      {isLoading && clientLogos.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Syncing with Logo Hub…
        </div>
      )}

      {sortedLogos.length > 0 ? (
        <div className="space-y-4">
          {/* Sort & Count Bar */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{sortedLogos.length}</span>
              <span>client{sortedLogos.length !== 1 ? 's' : ''}</span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 h-8 text-muted-foreground hover:text-foreground"
                >
                  <ArrowUpDown className="h-3.5 w-3.5" />
                  <span className="text-xs">
                    {sortOption === 'default'
                      ? 'Default'
                      : sortOption === 'name-asc'
                      ? 'A → Z'
                      : sortOption === 'name-desc'
                      ? 'Z → A'
                      : 'Most Files'}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => setSortOption('default')}>Default</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOption('name-asc')}>A → Z</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOption('name-desc')}>Z → A</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOption('files-desc')}>Most Files</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Logo Grid — Hub-style cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {visibleLogos.map((logo) => (
              <LogoCardShared
                key={logo.id}
                name={logo.name}
                description={logo.description}
                category={logo.category}
                websiteUrl={logo.websiteUrl}
                files={logo.files || []}
                actions={
                  canEdit && (
                    <>
                      {logo.globalLogoId && (
                        <UploadLogoVersion
                          logoId={logo.globalLogoId}
                          logoName={logo.name}
                          existingFiles={logo.files || []}
                          onUploaded={() => refresh()}
                          trigger={
                            <button
                              type="button"
                              className="p-1.5 rounded-md hover:bg-secondary"
                              title="Upload version"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          }
                        />
                      )}
                      {logo.globalLogoId && (
                        <button
                          type="button"
                          onClick={() => handleResync(logo)}
                          disabled={resyncingId === logo.id}
                          className="p-1.5 rounded-md hover:bg-secondary disabled:opacity-50"
                          title="Re-sync from source"
                        >
                          {resyncingId === logo.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3.5 w-3.5" />
                          )}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setEditingLogo(logo)}
                        className="p-1.5 rounded-md hover:bg-secondary"
                        title="Rename / edit metadata on this brand"
                      >
                        <Pencil className="h-3.5 w-3.5 opacity-60" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemove(logo.id)}
                        className="p-1.5 rounded-md hover:bg-destructive hover:text-destructive-foreground"
                        title="Remove from this brand"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )
                }
                validation={
                  <LogoValidationBadge
                    files={logo.files || []}
                    isExempt={exemptIds.has(logo.id)}
                    isResyncing={resyncingId === logo.id}
                    onResync={logo.globalLogoId ? () => handleResync(logo) : undefined}
                    onToggleExempt={() => handleToggleExempt(logo.id)}
                  />
                }
              />
            ))}
          </div>

          {hasMoreLogos && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-border/50 bg-muted/30 hover:bg-muted/60 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Show {hiddenCount} More Client{hiddenCount !== 1 ? 's' : ''}
                </>
              )}
            </button>
          )}
        </div>
      ) : (
        <GuideEmptyState
          icon={ImageIcon}
          title="Build Social Proof"
          description="Pick from the Global Logo Hub to showcase the companies you've worked with. All files, validation, and downloads stay in sync with the master library."
          actionLabel="Import from Logo Hub"
          onAction={() => {
            // The GlobalLogoPickerDialog is rendered in the header — surface a hint instead.
            toast.message('Use "Import from Global Library" in the section header');
          }}
          canEdit={canEdit}
          readOnlyHint="Client logos will appear here"
        />
      )}

      {/* Rename / metadata-on-brand dialog */}
      <Dialog
        open={!!editingLogo}
        onOpenChange={(open) => !open && setEditingLogo(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit logo on this brand</DialogTitle>
          </DialogHeader>
          {editingLogo && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Files are managed in the Global Logo Hub. Use "Upload version" on the card to add
                files for everyone, or update the display name/description here for this brand
                only.
              </p>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Display name</label>
                <Input
                  defaultValue={editingLogo.name}
                  onBlur={(e) => handleRename(editingLogo.id, { name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Description</label>
                <Input
                  defaultValue={editingLogo.description || ''}
                  placeholder="Optional context for this brand"
                  onBlur={(e) =>
                    handleRename(editingLogo.id, { description: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Website URL</label>
                <Input
                  defaultValue={editingLogo.websiteUrl || ''}
                  placeholder="https://..."
                  onBlur={(e) =>
                    handleRename(editingLogo.id, { websiteUrl: e.target.value })
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingLogo(null)}
              className={cn('w-full')}
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
};
