import { useState, useCallback, useMemo, lazy, Suspense } from 'react';
import { Plus, ImageIcon, Check, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion } from '@/components/ui/accordion';
import { ApprovedImage, ApprovedImagerySubSection } from '@/types/brand';
const ShutterstockSearchDialog = lazy(() => import('./ShutterstockSearchDialog').then(m => ({ default: m.ShutterstockSearchDialog })));
const DropboxBrowserDialog = lazy(() => import('./DropboxBrowserDialog').then(m => ({ default: m.DropboxBrowserDialog })));
const WebsiteImageScanner = lazy(() => import('../WebsiteImageScanner').then(m => ({ default: m.WebsiteImageScanner })));
import { ImagerySubSection } from './ImagerySubSection';

interface ApprovedImagerySectionProps {
  approvedImagery?: {
    sections: ApprovedImagerySubSection[];
  };
  onApprovedImageryChange?: (approvedImagery: { sections: ApprovedImagerySubSection[] }) => void;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
  canEdit?: boolean;
  entityId?: string;
  entityType?: string;
  organizationId?: string | null;
}

const DEFAULT_SUBSECTIONS = [
  'People & Portraits',
  'Landscapes & Nature',
  'Product Shots',
  'Lifestyle',
  'Abstract & Textures',
];

export const ApprovedImagerySection = ({
  approvedImagery,
  onApprovedImageryChange,
  customSubtitle,
  onSubtitleChange,
  canEdit = false,
  entityId,
  entityType = 'brand',
  organizationId,
}: ApprovedImagerySectionProps) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [dropboxOpen, setDropboxOpen] = useState(false);
  const [websiteOpen, setWebsiteOpen] = useState(false);
  const [targetSectionId, setTargetSectionId] = useState<string | null>(null);
  const [newSectionName, setNewSectionName] = useState('');
  const [addingSectionMode, setAddingSectionMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const sections = approvedImagery?.sections || [];

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const isSearching = normalizedQuery.length > 0;

  const matchesQuery = useCallback((image: ApprovedImage) => {
    if (!isSearching) return true;
    const haystack = [
      image.title,
      image.category,
      image.source,
      ...(image.tags || []),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(normalizedQuery);
  }, [isSearching, normalizedQuery]);

  const filteredSections = useMemo(() => {
    if (!isSearching) return sections;
    return sections
      .map((s) => ({ ...s, images: s.images.filter(matchesQuery) }))
      .filter((s) => s.images.length > 0 || s.name.toLowerCase().includes(normalizedQuery));
  }, [sections, isSearching, matchesQuery, normalizedQuery]);

  const matchedImageCount = useMemo(
    () => filteredSections.reduce((sum, s) => sum + s.images.length, 0),
    [filteredSections]
  );

  const updateSections = useCallback((newSections: ApprovedImagerySubSection[]) => {
    onApprovedImageryChange?.({ sections: newSections });
  }, [onApprovedImageryChange]);

  const addSubSection = useCallback(() => {
    if (!newSectionName.trim()) return;
    const newSection: ApprovedImagerySubSection = {
      id: crypto.randomUUID(),
      name: newSectionName.trim(),
      description: '',
      images: [],
    };
    updateSections([...sections, newSection]);
    setNewSectionName('');
    setAddingSectionMode(false);
  }, [newSectionName, sections, updateSections]);

  const removeSubSection = useCallback((sectionId: string) => {
    updateSections(sections.filter(s => s.id !== sectionId));
  }, [sections, updateSections]);

  const renameSubSection = useCallback((sectionId: string, newName: string) => {
    updateSections(sections.map(s => s.id === sectionId ? { ...s, name: newName } : s));
  }, [sections, updateSections]);

  const openSearchForSection = useCallback((sectionId: string) => {
    setTargetSectionId(sectionId);
    setSearchOpen(true);
  }, []);

  const openDropboxForSection = useCallback((sectionId: string) => {
    setTargetSectionId(sectionId);
    setDropboxOpen(true);
  }, []);

  const openWebsiteForSection = useCallback((sectionId: string) => {
    setTargetSectionId(sectionId);
    setWebsiteOpen(true);
  }, []);

  const handleApproveImages = useCallback((images: ApprovedImage[]) => {
    if (!targetSectionId) return;
    updateSections(sections.map(s => {
      if (s.id !== targetSectionId) return s;
      const existingIds = new Set(s.images.map(img => img.id));
      const newImages = images.filter(img => !existingIds.has(img.id));
      return { ...s, images: [...s.images, ...newImages] };
    }));
  }, [targetSectionId, sections, updateSections]);

  const handleDropboxFolderPathChange = useCallback((path: string) => {
    if (!targetSectionId) return;
    updateSections(sections.map(s =>
      s.id === targetSectionId ? { ...s, dropboxFolderPath: path } : s
    ));
  }, [targetSectionId, sections, updateSections]);

  const handleRemoveImage = useCallback((sectionId: string, imageId: string) => {
    updateSections(sections.map(s => {
      if (s.id !== sectionId) return s;
      return { ...s, images: s.images.filter(img => img.id !== imageId) };
    }));
  }, [sections, updateSections]);

  const totalImages = sections.reduce((sum, s) => sum + s.images.length, 0);
  const targetSection = sections.find(s => s.id === targetSectionId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ImageIcon className="h-6 w-6 text-primary" />
            Approved Imagery
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {customSubtitle || `${totalImages} approved image${totalImages !== 1 ? 's' : ''} across ${sections.length} categor${sections.length !== 1 ? 'ies' : 'y'}`}
          </p>
        </div>
        {canEdit && (
          <div className="flex items-center gap-2">
            {addingSectionMode ? (
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Category name..."
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  className="w-48 h-9"
                  onKeyDown={(e) => e.key === 'Enter' && addSubSection()}
                  autoFocus
                />
                <Button size="sm" variant="ghost" onClick={addSubSection} disabled={!newSectionName.trim()}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setAddingSectionMode(false); setNewSectionName(''); }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setAddingSectionMode(true)}>
                <Plus className="h-4 w-4 mr-1" /> Add Category
              </Button>
            )}
          </div>
        )}
      </div>

      {sections.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ImageIcon className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground text-center">
              {canEdit 
                ? 'No imagery categories yet. Click "Add Category" to create your first sub-section, then search Shutterstock or import from Dropbox.'
                : 'No approved imagery available yet.'}
            </p>
            {canEdit && (
              <Button variant="outline" className="mt-4" onClick={() => setAddingSectionMode(true)}>
                <Plus className="h-4 w-4 mr-1" /> Add First Category
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" defaultValue={sections.slice(0, 2).map(s => s.id)} className="space-y-3">
          {sections.map((section) => (
            <ImagerySubSection
              key={section.id}
              section={section}
              canEdit={canEdit}
              onSearchClick={() => openSearchForSection(section.id)}
              onDropboxClick={() => openDropboxForSection(section.id)}
              onWebsiteClick={() => openWebsiteForSection(section.id)}
              onRemoveImage={(imageId) => handleRemoveImage(section.id, imageId)}
              onRemoveSection={() => removeSubSection(section.id)}
              onRename={(newName) => renameSubSection(section.id, newName)}
            />
          ))}
        </Accordion>
      )}

      {canEdit && (
        <Suspense fallback={null}>
          {searchOpen && (
            <ShutterstockSearchDialog
              open={searchOpen}
              onOpenChange={setSearchOpen}
              onApproveImages={handleApproveImages}
              targetSectionName={targetSection?.name || ''}
              entityId={entityId}
              entityType={entityType}
              organizationId={organizationId}
            />
          )}
          {dropboxOpen && (
            <DropboxBrowserDialog
              open={dropboxOpen}
              onOpenChange={setDropboxOpen}
              folderPath={targetSection?.dropboxFolderPath || ''}
              onFolderPathChange={handleDropboxFolderPathChange}
              onImportImages={handleApproveImages}
              sectionName={targetSection?.name || ''}
              entityId={entityId}
              entityType={entityType}
            />
          )}
          {websiteOpen && (
            <WebsiteImageScanner
              open={websiteOpen}
              onOpenChange={setWebsiteOpen}
              onImportImages={(images) => {
                console.log('[ApprovedImagery] Website import received:', images.length, 'images, targetSectionId:', targetSectionId);
                if (!targetSectionId) {
                  console.warn('[ApprovedImagery] No target section — aborting import');
                  return;
                }
                if (!images.length) {
                  console.warn('[ApprovedImagery] No images selected — aborting');
                  return;
                }
                const currentSection = sections.find(s => s.id === targetSectionId);
                const approved: ApprovedImage[] = images.map((img) => ({
                  id: crypto.randomUUID(),
                  url: img.url,
                  thumbnailUrl: img.url,
                  title: img.name,
                  source: 'website',
                  category: currentSection?.name || '',
                  approvedAt: new Date().toISOString(),
                }));
                console.log('[ApprovedImagery] Built approved images, calling updateSections');
                // Inline update to avoid any stale-closure issues with handleApproveImages
                const newSections = sections.map(s => {
                  if (s.id !== targetSectionId) return s;
                  const existingIds = new Set(s.images.map(img => img.id));
                  const newImages = approved.filter(img => !existingIds.has(img.id));
                  return { ...s, images: [...s.images, ...newImages] };
                });
                onApprovedImageryChange?.({ sections: newSections });
              }}
            />
          )}
        </Suspense>
      )}
    </div>
  );
};
