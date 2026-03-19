/**
 * Social Asset Studio - Dedicated page for managing social platform asset placements
 * Shows realistic platform mockups with asset upload/approval workflow
 */
import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, LayoutGrid, CheckCircle2, Clock, Image as ImageIcon, Palette, BookMarked } from 'lucide-react';
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
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface EntityOption {
  id: string;
  name: string;
  type: 'brand' | 'product' | 'event';
  logoUrl?: string;
  guideData?: Record<string, any>;
}

interface BrandContext {
  name?: string;
  colors?: Array<{ name: string; hex: string; role?: string }>;
  typography?: Array<{ family: string; weight?: string; usage?: string }>;
  archetype?: string;
  industry?: string;
  mission?: string;
  values?: string[];
  logos?: Array<{ url?: string; name?: string }>;
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
          supabase.from('brands').select('id, name, guide_data').eq('organization_id', orgId).order('name'),
          supabase.from('products').select('id, name, guide_data').eq('organization_id', orgId).order('name'),
          supabase.from('events').select('id, name, guide_data').eq('organization_id', orgId).order('name'),
        ]);

        const extractLogo = (guideData: any): string | undefined => {
          if (!guideData) return undefined;
          // Try hero imageUrl first, then first logo
          const heroImg = guideData?.hero?.imageUrl;
          if (heroImg) return heroImg;
          const logos = guideData?.logos;
          if (Array.isArray(logos) && logos.length > 0) {
            return logos[0]?.url || logos[0]?.imageUrl;
          }
          return undefined;
        };

        const all: EntityOption[] = [
          ...(brandsRes.data || []).map(b => ({ id: b.id, name: b.name, type: 'brand' as const, logoUrl: extractLogo(b.guide_data), guideData: b.guide_data as Record<string, any> })),
          ...(productsRes.data || []).map(p => ({ id: p.id, name: p.name, type: 'product' as const, logoUrl: extractLogo(p.guide_data), guideData: p.guide_data as Record<string, any> })),
          ...(eventsRes.data || []).map(e => ({ id: e.id, name: e.name, type: 'event' as const, logoUrl: extractLogo(e.guide_data), guideData: e.guide_data as Record<string, any> })),
        ];
        setEntities(all);
        if (all.length > 0 && !selectedEntity) {
          setSelectedEntity(all[0]);
        }
      } catch (err) {
        logger.admin('Failed to fetch entities', err);
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

  // Extract brand context for AI analysis
  const brandContext: BrandContext | undefined = useMemo(() => {
    if (!selectedEntity?.guideData) return undefined;
    const gd = selectedEntity.guideData;
    return {
      name: selectedEntity.name,
      colors: Array.isArray(gd.colors) ? gd.colors.map((c: any) => ({ name: c.name || '', hex: c.hex || '', role: c.role })) : [],
      typography: Array.isArray(gd.typography) ? gd.typography.map((t: any) => ({ family: t.fontFamily || t.family || '', weight: t.weight, usage: t.usage })) : [],
      archetype: gd.identity?.archetype,
      industry: gd.industry,
      mission: gd.identity?.missionStatement,
      values: Array.isArray(gd.values) ? gd.values.map((v: any) => v.text || v.name || String(v)).filter(Boolean) : [],
      logos: Array.isArray(gd.logos) ? gd.logos.map((l: any) => ({ url: l.url || l.imageUrl, name: l.name })) : [],
    };
  }, [selectedEntity]);

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

  const handleSaveToGuide = async (platform: string, format: string, sizeSpec: PlatformSizeSpec, imageUrl: string) => {
    if (!selectedEntity) return;

    try {
      const table = selectedEntity.type === 'brand' ? 'brands' : selectedEntity.type === 'product' ? 'products' : 'events';
      
      // Fetch current guide_data
      const { data: entityData, error: fetchError } = await supabase
        .from(table)
        .select('guide_data')
        .eq('id', selectedEntity.id)
        .single();
      
      if (fetchError) throw fetchError;

      const guideData = (entityData?.guide_data as Record<string, any>) || {};
      const socialAssets: any[] = Array.isArray(guideData.socialAssets) ? [...guideData.socialAssets] : [];

      // Find existing entry for this platform or create new one
      const existingIdx = socialAssets.findIndex((a: any) => a.platform === platform);
      
      // Build size string from spec
      const sizeStr = `${sizeSpec.width}x${sizeSpec.height}`;
      
      if (existingIdx >= 0) {
        // Update existing platform entry with the new image
        const existing = socialAssets[existingIdx];
        if (format === 'story') {
          existing.storySize = sizeStr;
        } else if (format === 'reel') {
          existing.reelSize = sizeStr;
        } else if (format === 'cover' || format === 'profile') {
          existing.coverSize = sizeStr;
        } else {
          existing.postSize = sizeStr;
        }
        // Always update preview image to latest
        existing.previewImageUrl = imageUrl;
        socialAssets[existingIdx] = existing;
      } else {
        // Create new platform entry
        const newAsset: any = {
          id: crypto.randomUUID(),
          platform,
          postSize: format === 'feed' ? sizeStr : '',
          textLegibility: 'Standard',
          directive: `Auto-imported from Social Asset Studio`,
          previewImageUrl: imageUrl,
        };
        if (format === 'story') newAsset.storySize = sizeStr;
        if (format === 'reel') newAsset.reelSize = sizeStr;
        if (format === 'cover' || format === 'profile') newAsset.coverSize = sizeStr;
        socialAssets.push(newAsset);
      }

      // Save back
      const { error: updateError } = await supabase
        .from(table)
        .update({ guide_data: { ...guideData, socialAssets } })
        .eq('id', selectedEntity.id);

      if (updateError) throw updateError;

      toast.success(`Asset saved to ${selectedEntity.name}'s Social Assets section`);
    } catch (err) {
      logger.admin('Failed to save asset to guide', err);
      toast.error('Failed to save asset to brand guide');
    }
  };

  const handleApprove = async (id: string) => {
    const userEmail = user?.email || 'Unknown';
    await approvePlacement(id, userEmail);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground text-lg">Please sign in to access the Social Asset Studio.</p>
          <Button onClick={() => navigate('/auth')}>Sign In</Button>
        </div>
      </div>
    );
  }

  if (!orgId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground text-lg">No organization found.</p>
          <p className="text-sm text-muted-foreground">Create or join an organization to manage social assets.</p>
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Go Back
          </Button>
        </div>
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
                {['Instagram', 'LinkedIn', 'X', 'Facebook', 'YouTube', 'TikTok', 'Pinterest', 'Threads'].map(p => (
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
              entityType={selectedEntity.type}
              organizationId={orgId}
              brandName={selectedEntity.name}
              brandLogoUrl={selectedEntity.logoUrl}
              isAdmin={isAdmin}
              brandContext={brandContext}
              onUpload={handleUpload}
              onApprove={handleApprove}
              onDelete={deletePlacement}
              onSaveToGuide={handleSaveToGuide}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default SocialAssetStudio;
