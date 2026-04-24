/**
 * Individual template preview card with hover overlay showing zone layout
 */
import { cn } from '@/lib/utils';
import { SocialTemplate, TemplateZoneType, getTemplatePreviewImage } from '@/lib/socialTemplates';

interface TemplatePreviewProps {
  template: SocialTemplate;
  selected?: boolean;
  onSelect: (template: SocialTemplate) => void;
  aspectRatio?: number;
}

const zoneColors: Record<TemplateZoneType, string> = {
  image: 'bg-sky-500/20 border-sky-500/50',
  text: 'bg-violet-500/20 border-violet-500/50',
  logo: 'bg-emerald-500/20 border-emerald-500/50',
  cta: 'bg-amber-500/20 border-amber-500/50',
};

const zoneLabelColors: Record<TemplateZoneType, string> = {
  image: 'text-sky-700 dark:text-sky-300',
  text: 'text-violet-700 dark:text-violet-300',
  logo: 'text-emerald-700 dark:text-emerald-300',
  cta: 'text-amber-700 dark:text-amber-300',
};

export const TemplatePreview = ({ template, selected, onSelect, aspectRatio = 1 }: TemplatePreviewProps) => {
  const previewImageUrl = getTemplatePreviewImage(template);

  return (
    <button
      onClick={() => onSelect(template)}
      className={cn(
        'group relative w-full rounded-lg border-2 transition-all overflow-hidden text-left',
        selected
          ? 'border-primary ring-2 ring-primary/20'
          : 'border-border hover:border-primary/50 hover:shadow-md',
      )}
    >
      {/* Zone preview */}
      <div className="relative bg-muted/30" style={{ aspectRatio }}>
        {previewImageUrl && (
          <img
            src={previewImageUrl}
            alt={template.name}
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
        )}
        <div className="absolute inset-0 bg-background/20 backdrop-blur-[1px]" />
        {template.zones.map((zone, i) => (
          <div
            key={i}
            className={cn(
              'absolute border border-dashed rounded-sm flex items-center justify-center transition-opacity',
              zoneColors[zone.type],
              'group-hover:opacity-100 opacity-70',
            )}
            style={{
              left: `${zone.x}%`,
              top: `${zone.y}%`,
              width: `${zone.width}%`,
              height: `${zone.height}%`,
            }}
          >
            <span className={cn(
              'text-[8px] leading-tight font-medium text-center px-0.5 truncate',
              zoneLabelColors[zone.type],
            )}>
              {zone.label}
            </span>
          </div>
        ))}
      </div>

      {/* Label */}
      <div className="px-2 py-1.5">
        <p className="text-xs font-medium truncate">{template.name}</p>
        <p className="text-[10px] text-muted-foreground truncate">{template.description}</p>
      </div>
    </button>
  );
};
