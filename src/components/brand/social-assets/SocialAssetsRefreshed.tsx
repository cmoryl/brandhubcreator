/**
 * SocialAssetsRefreshed — clean-slate rebuild
 * ---------------------------------------------------------
 * A minimal Social section that shows only the Canva templates
 * this event actually has (LinkedIn / Instagram / Facebook posts
 * out of the box, extendable to any platform).
 *
 * Everything is driven by `canvaTemplateKit` on the entity's
 * guide_data. Admins add / edit / remove links via the Kit editor.
 * No playbook, no specs table, no asset library — just the
 * templates and where to open them.
 */

import { useState, useMemo } from 'react';
import { Linkedin, Instagram, Facebook, Twitter, Youtube, Monitor, ExternalLink, Settings2, Sparkles, LayoutGrid, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { BrandLogo, BrandSocialAssetSpec, CanvaTemplateKit, CanvaTemplateKitItem } from '@/types/brand';
import { CanvaTemplateKitEditor } from './CanvaTemplateKitEditor';

interface Props {
  socialAssets?: BrandSocialAssetSpec[]; // accepted for API compat; not rendered
  customSubtitle?: string;
  onSubtitleChange?: (s: string) => void;
  brandLogos?: BrandLogo[];
  brandSlug?: string;
  entityName?: string;
  canvaTemplateKit?: CanvaTemplateKit;
  onCanvaTemplateKitChange?: (next: CanvaTemplateKit) => void;
  isAdmin?: boolean;
}

const PLATFORM_ORDER = ['LinkedIn', 'Instagram', 'Facebook', 'X', 'YouTube', 'TikTok'] as const;
type Platform = typeof PLATFORM_ORDER[number];

const PLATFORM_ICONS: Record<Platform, React.ElementType> = {
  LinkedIn: Linkedin,
  Instagram: Instagram,
  Facebook: Facebook,
  X: Twitter,
  YouTube: Youtube,
  TikTok: Monitor,
};

const PLATFORM_ACCENT: Record<Platform, string> = {
  LinkedIn: 'text-[#0A66C2]',
  Instagram: 'text-[#E4405F]',
  Facebook: 'text-[#1877F2]',
  X: 'text-foreground',
  YouTube: 'text-[#FF0000]',
  TikTok: 'text-foreground',
};

// ------------------------------------------------------------------

const TemplateCard = ({
  item,
  platform,
  brandLogo,
  isAdmin,
  onEdit,
}: {
  item: CanvaTemplateKitItem;
  platform: Platform;
  brandLogo?: BrandLogo;
  isAdmin?: boolean;
  onEdit?: () => void;
}) => {
  const Icon = PLATFORM_ICONS[platform];

  return (
    <div className="group rounded-xl border border-border bg-card overflow-hidden hover:border-primary/50 hover:shadow-lg transition-all">
      <div className="aspect-[4/3] relative bg-gradient-to-br from-muted/60 to-muted overflow-hidden">
        {item.thumbnailUrl ? (
          <img
            src={item.thumbnailUrl}
            alt={item.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <Icon className={`h-10 w-10 ${PLATFORM_ACCENT[platform]} opacity-70`} />
            <span className="text-xs text-muted-foreground">{item.format || `${platform} template`}</span>
          </div>
        )}

        {brandLogo?.url && (
          <div className="absolute top-2 left-2 h-7 w-7 rounded-md bg-background/85 backdrop-blur-sm p-1 border border-border/70 shadow-sm">
            <img src={brandLogo.url} alt="" className="w-full h-full object-contain" />
          </div>
        )}

        <div className="absolute top-2 right-2 flex items-center gap-1">
          {isAdmin && onEdit && (
            <button
              onClick={onEdit}
              title="Edit template details"
              className="h-6 w-6 rounded-md bg-background/85 backdrop-blur-sm border border-border/70 shadow-sm flex items-center justify-center text-foreground/80 hover:text-primary hover:border-primary opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Pencil className="h-3 w-3" />
            </button>
          )}
          <Badge className="text-[9px] bg-primary text-primary-foreground px-1.5 py-0 h-5 gap-1">
            <Sparkles className="h-2.5 w-2.5" /> Canva
          </Badge>
        </div>
      </div>

      <div className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2 min-w-0">
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold text-foreground truncate">{item.name || 'Untitled template'}</h4>
            {item.format && (
              <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{item.format}</p>
            )}
          </div>
          <Icon className={`h-4 w-4 shrink-0 ${PLATFORM_ACCENT[platform]}`} />
        </div>

        <div className="flex gap-1.5">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 h-8 text-xs gap-1.5"
            onClick={() => window.open(item.url, '_blank', 'noopener,noreferrer')}
          >
            Open in Canva
            <ExternalLink className="h-3 w-3" />
          </Button>
          {isAdmin && onEdit && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-2 text-xs"
              onClick={onEdit}
              title="Edit"
            >
              <Pencil className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

// ------------------------------------------------------------------

export const SocialAssetsRefreshed = ({
  customSubtitle,
  brandLogos,
  entityName,
  canvaTemplateKit,
  onCanvaTemplateKitChange,
  isAdmin = false,
}: Props) => {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorFocus, setEditorFocus] = useState<{ platform: Platform; itemId: string } | null>(null);
  const brandLogo = brandLogos?.[0];

  const openEditorFor = (platform: Platform, itemId: string) => {
    setEditorFocus({ platform, itemId });
    setEditorOpen(true);
  };
  const openEditor = () => {
    setEditorFocus(null);
    setEditorOpen(true);
  };

  // Only show platforms that actually have templates (or all if admin editing)
  const populatedPlatforms = useMemo(
    () => PLATFORM_ORDER.filter((p) => (canvaTemplateKit?.[p]?.length || 0) > 0),
    [canvaTemplateKit],
  );

  const totalTemplates = useMemo(
    () => PLATFORM_ORDER.reduce((sum, p) => sum + (canvaTemplateKit?.[p]?.length || 0), 0),
    [canvaTemplateKit],
  );

  const hasAny = totalTemplates > 0;

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Social Templates</h2>
          <p className="text-sm text-muted-foreground max-w-2xl">
            {customSubtitle ||
              `Every Canva template linked to ${entityName || 'this event'} — open one, duplicate in Canva, export.`}
          </p>
        </div>
        {isAdmin && onCanvaTemplateKitChange && (
          <Button
            variant="outline"
            size="sm"
            className="h-9 text-xs shrink-0"
            onClick={openEditor}
          >
            <Settings2 className="h-3.5 w-3.5 mr-1.5" />
            {hasAny ? 'Manage templates' : 'Add Canva templates'}
          </Button>
        )}
      </div>

      {/* Empty state */}
      {!hasAny && (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center">
          <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
            <LayoutGrid className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-base font-semibold text-foreground">No templates linked yet</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            {isAdmin
              ? 'Click "Add Canva templates" and paste your Canva links per platform. LinkedIn, Instagram, Facebook — whatever you have.'
              : 'Canva templates for this event will appear here once an admin links them.'}
          </p>
          {isAdmin && onCanvaTemplateKitChange && (
            <Button
              size="sm"
              className="mt-4 h-9"
              onClick={() => setEditorOpen(true)}
            >
              <Settings2 className="h-3.5 w-3.5 mr-1.5" />
              Add Canva templates
            </Button>
          )}
        </div>
      )}

      {/* Platform groups */}
      {populatedPlatforms.map((platform) => {
        const items = canvaTemplateKit?.[platform] || [];
        const Icon = PLATFORM_ICONS[platform];

        return (
          <div key={platform} className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                <Icon className={`h-4 w-4 ${PLATFORM_ACCENT[platform]}`} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">{platform}</h3>
                <p className="text-[11px] text-muted-foreground">
                  {items.length} template{items.length === 1 ? '' : 's'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {items.map((item) => (
                <TemplateCard
                  key={item.id}
                  item={item}
                  platform={platform}
                  brandLogo={brandLogo}
                />
              ))}
            </div>
          </div>
        );
      })}

      {editorOpen && onCanvaTemplateKitChange && (
        <CanvaTemplateKitEditor
          value={canvaTemplateKit}
          onChange={onCanvaTemplateKitChange}
          onClose={() => setEditorOpen(false)}
        />
      )}
    </section>
  );
};
