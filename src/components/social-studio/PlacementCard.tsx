/**
 * Individual placement slot card showing the mockup with upload capability
 */
import { useState, useRef, useEffect } from 'react';
import { Upload, Check, MoreHorizontal, Trash2, Eye, Download, CheckCircle2, Clock, ImageIcon, BookMarked, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { PlatformSizeSpec } from '@/components/brand/social-mockups/types';
import { SocialAssetPlacement } from '@/hooks/useSocialAssetPlacements';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AssetAnalytics } from './AssetAnalytics';
import { SocialAssetInsights } from './SocialAssetInsights';
import { SocialGlobalLinkPanel } from './SocialGlobalLinkPanel';
import { SocialDataForceActions } from './SocialDataForceActions';
import { useSocialAssetAnalysis } from '@/hooks/useSocialAssetAnalysis';

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

interface PlacementCardProps {
  platform: string;
  format: string;
  sizeSpec: PlatformSizeSpec;
  placement?: SocialAssetPlacement;
  entityId: string;
  entityType?: string;
  organizationId: string;
  onUpload: (imageUrl: string) => void;
  onApprove: () => void;
  onDelete: () => void;
  onPreview: () => void;
  onSaveToGuide?: () => void;
  isAdmin: boolean;
  brandContext?: BrandContext;
}

const statusConfig = {
  empty: { label: 'Empty', icon: ImageIcon, className: 'bg-muted text-muted-foreground' },
  draft: { label: 'Draft', icon: Clock, className: 'bg-amber-500/15 text-amber-700 dark:text-amber-400' },
  approved: { label: 'Approved', icon: CheckCircle2, className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' },
  archived: { label: 'Archived', icon: Clock, className: 'bg-muted text-muted-foreground' },
};

export const PlacementCard = ({
  platform,
  format,
  sizeSpec,
  placement,
  entityId,
  entityType = 'brand',
  organizationId,
  onUpload,
  onApprove,
  onDelete,
  onPreview,
  onSaveToGuide,
  isAdmin,
  brandContext,
}: PlacementCardProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const prevImageRef = useRef<string | null>(null);

  const { analysis, loading: analysisLoading, triggerAnalysis, refetch: refetchAnalysis } = useSocialAssetAnalysis(placement?.id);

  const status = placement?.status || 'empty';
  const statusInfo = statusConfig[status];
  const StatusIcon = statusInfo.icon;
  const hasImage = !!placement?.image_url;

  // Auto-trigger analysis when image changes
  useEffect(() => {
    if (placement?.id && placement?.image_url && placement.image_url !== prevImageRef.current) {
      prevImageRef.current = placement.image_url;
      // Only auto-trigger if no existing completed analysis for this image
      if (!analysis || analysis.image_url !== placement.image_url) {
        triggerAnalysis({
          placement_id: placement.id,
          organization_id: organizationId,
          entity_id: entityId,
          entity_type: entityType,
          platform,
          format,
          image_url: placement.image_url,
          brand_context: brandContext,
        });
      }
    }
  }, [placement?.id, placement?.image_url]);

  const handleReanalyze = () => {
    if (!placement?.id || !placement?.image_url) return;
    triggerAnalysis({
      placement_id: placement.id,
      organization_id: organizationId,
      entity_id: entityId,
      entity_type: entityType,
      platform,
      format,
      image_url: placement.image_url,
      brand_context: brandContext,
    });
  };

  // Compute aspect ratio for the preview container
  const arParts = sizeSpec.aspectRatio.split(':').map(Number);
  const arValue = arParts.length === 2 && arParts[1] ? arParts[0] / arParts[1] : 1;
  const clampedAr = Math.max(0.4, Math.min(2.5, arValue));

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    setUploading(true);
    try {
      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const sizeName = sizeSpec.name.replace(/\s+/g, '-').toLowerCase();
      const filePath = `${organizationId}/social-assets/${entityId}/${platform}/${format}/${sizeName}-${timestamp}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('organization-assets')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('organization-assets')
        .getPublicUrl(filePath);

      if (urlData?.publicUrl) {
        onUpload(urlData.publicUrl);
        toast.success(`Asset uploaded for ${sizeSpec.name}`);
      }
    } catch (err) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className={cn(
      'group relative rounded-xl border overflow-hidden transition-all hover:shadow-lg',
      status === 'approved' ? 'border-emerald-500/40 ring-1 ring-emerald-500/20' : 'border-border',
    )}>
      {/* Image area */}
      <div
        className="relative bg-muted/50 overflow-hidden cursor-pointer"
        style={{ aspectRatio: clampedAr }}
        onClick={() => hasImage ? onPreview() : fileInputRef.current?.click()}
      >
        {hasImage ? (
          <img
            src={placement!.image_url!}
            alt={`${platform} ${sizeSpec.name}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <Upload className="h-8 w-8 opacity-40" />
            <span className="text-xs opacity-60">{sizeSpec.width} × {sizeSpec.height}</span>
            {isAdmin && (
              <span className="text-xs opacity-40">Click to upload</span>
            )}
          </div>
        )}

        {/* Hover overlay */}
        {hasImage && isAdmin && (
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); onPreview(); }}>
              <Eye className="h-4 w-4 mr-1" /> Preview
            </Button>
            <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
              <Upload className="h-4 w-4 mr-1" /> Replace
            </Button>
          </div>
        )}

        {/* Analysis score overlay badge */}
        {analysis?.status === 'completed' && analysis.overall_score !== null && (
          <div className="absolute top-2 right-2 z-10">
            <Badge
              variant="secondary"
              className={cn(
                'text-[10px] gap-1 shadow-sm backdrop-blur-sm',
                analysis.overall_score >= 80 ? 'bg-emerald-500/90 text-emerald-foreground' 
                  : analysis.overall_score >= 60 ? 'bg-amber-500/90 text-amber-foreground'
                  : 'bg-destructive/90 text-destructive-foreground',
              )}
            >
              <Sparkles className="h-3 w-3" />
              {analysis.overall_score}
            </Badge>
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        )}
      </div>

      {/* Info bar */}
      <div className="px-3 py-2.5 flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{sizeSpec.name}</p>
          <p className="text-xs text-muted-foreground">{sizeSpec.width} × {sizeSpec.height} · {sizeSpec.aspectRatio}</p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Badge variant="secondary" className={cn('text-xs gap-1', statusInfo.className)}>
            <StatusIcon className="h-3 w-3" />
            {statusInfo.label}
          </Badge>
          {isAdmin && hasImage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {status !== 'approved' && (
                  <DropdownMenuItem onClick={onApprove}>
                    <Check className="h-4 w-4 mr-2" /> Approve
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleReanalyze}>
                  <Sparkles className="h-4 w-4 mr-2" /> Analyze Asset
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  if (placement?.image_url) {
                    window.open(placement.image_url, '_blank');
                  }
                }}>
                  <Download className="h-4 w-4 mr-2" /> Download
                </DropdownMenuItem>
                {onSaveToGuide && (
                  <DropdownMenuItem onClick={onSaveToGuide}>
                    <BookMarked className="h-4 w-4 mr-2" /> Save to Brand Guide
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" /> Remove
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {sizeSpec.description && (
        <p className="px-3 pb-2 text-xs text-muted-foreground">{sizeSpec.description}</p>
      )}

      {/* Asset analytics panel (dimensions/format checks) */}
      {hasImage && placement?.image_url && (
        <AssetAnalytics
          imageUrl={placement.image_url}
          platform={platform}
          format={format}
          sizeSpec={sizeSpec}
        />
      )}

      {/* AI Insights panel (bias, compliance, engagement) */}
      {hasImage && (
        <SocialAssetInsights
          analysis={analysis}
          loading={analysisLoading}
          onReanalyze={handleReanalyze}
        />
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={!isAdmin}
      />
    </div>
  );
};
