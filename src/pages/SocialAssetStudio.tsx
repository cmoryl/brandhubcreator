/**
 * Social Asset Studio - Dedicated page for managing social platform asset placements
 * Shows realistic platform mockups with asset upload/approval workflow
 */
import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, LayoutGrid, CheckCircle2, Clock, Image as ImageIcon, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useSocialAssetPlacements } from '@/hooks/useSocialAssetPlacements';
import { PlatformNav } from '@/components/social-studio/PlatformNav';
import { PlatformStudioView } from '@/components/social-studio/PlatformStudioView';
import { SocialPlatform, PlatformSizeSpec } from '@/components/brand/social-mockups/types';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';

interface EntityOption {
  id: string;
  name: string;
  type: 'brand' | 'product' | 'event';
}

const SocialAssetStudio = () => {
  const navigate = useNavigate();
  const { organization } = useOrganization();
  const { user } = useAuth();
  const [selectedPlatform, setSelectedPlatform] = useState<SocialPlatform>('Instagram');
  const [entities, setEntities] = useState<EntityOption[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<EntityOption | null>(null);
  const [loadingEntities, setLoadingEntities] = useState(true);

  const orgId = organization?.id;

  // Fetch brands, products, events for entity selector
  useEffect(() => {
    if (!orgId) return;
    const fetchEntities = async () => {
      setLoadingEntities(true);
      try {
        const [brandsRes, productsRes, eventsRes] = await Promise.all([
          supabase.from('brands').select('id, name').eq('organization_id', orgId).order('name'),
          supabase.from('products').select('id, name').eq('organization_id', orgId).order('name'),
          supabase.from('events').select('id, name').eq('organization_id', orgId).order('name'),
        ]);

        const all: EntityOption[] = [
          ...(brandsRes.data || []).map(b => ({ id: b.id, name: b.name, type: 'brand' as const })),
          ...(productsRes.data || []).map(p => ({ id: p.id, name: p.name, type: 'product' as const })),
          ...(eventsRes.data || []).map(e => ({ id: e.id, name: e.name, type: 'event' as const })),
        ];
        setEntities(all);
        if (all.length > 0 && !selectedEntity) {
          setSelectedEntity(all[0]);
        }
      } catch (err) {
        logger.error('Failed to fetch entities', err);
      } finally {
        setLoadingEntities(false);
      }
    };
    fetchEntities();
  }, [orgId]);

  const {
    placements,
    loading: loadingPlacements,
    upsertPlacement,
    approvePlacement,
    deletePlacement,
  } = useSocialAssetPlacements(selectedEntity?.id, selectedEntity?.type);

  // Compute placement counts per platform
  const placementCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    placements.forEach(p => {
      if (p.image_url) {
        counts[p.platform] = (counts[p.platform] || 0) + 1;
      }
    });
    return counts;
  }, [placements]);

  // Stats
  const totalApproved = placements.filter(p => p.status === 'approved').length;
  const totalDraft = placements.filter(p => p.status === 'draft').length;
  const totalWithAssets = placements.filter(p => p.image_url).length;

  const isAdmin = true; // TODO: wire to useGuideAdmin

  const handleUpload = async (platform: string, format: string, sizeSpec: PlatformSizeSpec, imageUrl: string) => {
    await upsertPlacement({
      platform,
      format,
      size_name: sizeSpec.name,
      size_width: sizeSpec.width,
      size_height: sizeSpec.height,
      aspect_ratio: sizeSpec.aspectRatio,
      image_url: imageUrl,
      status: 'draft',
    });
  };

  const handleApprove = async (id: string) => {
    const userEmail = user?.email || 'Unknown';
    await approvePlacement(id, userEmail);
  };

  if (!orgId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Please select an organization first.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                Social Asset Studio
              </h1>
              <p className="text-xs text-muted-foreground">Manage approved assets across all platforms</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Entity selector */}
            <Select
              value={selectedEntity?.id || 'none'}
              onValueChange={(val) => {
                const entity = entities.find(e => e.id === val);
                if (entity) setSelectedEntity(entity);
              }}
            >
              <SelectTrigger className="w-[240px]">
                <SelectValue placeholder="Select brand/product/event" />
              </SelectTrigger>
              <SelectContent>
                {entities.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    <span className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {e.type}
                      </Badge>
                      {e.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Stats */}
            <div className="hidden md:flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1.5 text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
                <span className="font-medium">{totalApproved}</span>
                <span className="text-muted-foreground">approved</span>
              </div>
              <div className="flex items-center gap-1.5 text-amber-600">
                <Clock className="h-4 w-4" />
                <span className="font-medium">{totalDraft}</span>
                <span className="text-muted-foreground">drafts</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <ImageIcon className="h-4 w-4" />
                <span className="font-medium">{totalWithAssets}</span>
                <span>assets</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div className="max-w-[1600px] mx-auto flex">
        {/* Sidebar */}
        <aside className="w-64 flex-shrink-0 border-r border-border p-4 sticky top-[57px] h-[calc(100vh-57px)] overflow-y-auto hidden lg:block">
          <PlatformNav
            selected={selectedPlatform}
            onSelect={setSelectedPlatform}
            placementCounts={placementCounts}
          />
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6 lg:p-8 min-w-0">
          {/* Mobile platform selector */}
          <div className="lg:hidden mb-6">
            <Select
              value={selectedPlatform}
              onValueChange={(v) => setSelectedPlatform(v as SocialPlatform)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['Instagram', 'LinkedIn', 'X (Twitter)', 'Facebook', 'YouTube', 'TikTok', 'Pinterest', 'Threads'].map(p => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loadingEntities ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : !selectedEntity ? (
            <div className="text-center py-20 text-muted-foreground">
              <p className="text-lg font-medium mb-1">No entities found</p>
              <p className="text-sm">Create a brand, product, or event first to manage social assets.</p>
            </div>
          ) : (
            <PlatformStudioView
              platform={selectedPlatform}
              placements={placements}
              entityId={selectedEntity.id}
              organizationId={orgId}
              brandName={selectedEntity.name}
              isAdmin={isAdmin}
              onUpload={handleUpload}
              onApprove={handleApprove}
              onDelete={deletePlacement}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default SocialAssetStudio;
