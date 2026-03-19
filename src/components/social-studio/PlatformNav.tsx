/**
 * Platform navigation sidebar for Social Asset Studio
 */
import { cn } from '@/lib/utils';
import { SocialPlatform } from '@/components/brand/social-mockups/types';

interface PlatformNavProps {
  selected: SocialPlatform;
  onSelect: (platform: SocialPlatform) => void;
  placementCounts: Record<string, number>;
}

const platforms: { id: SocialPlatform; label: string; color: string; icon: string }[] = [
  { id: 'Instagram', label: 'Instagram', color: '#E1306C', icon: '📸' },
  { id: 'LinkedIn', label: 'LinkedIn', color: '#0A66C2', icon: '💼' },
  { id: 'X (Twitter)', label: 'X (Twitter)', color: '#000000', icon: '𝕏' },
  { id: 'Facebook', label: 'Facebook', color: '#1877F2', icon: '📘' },
  { id: 'YouTube', label: 'YouTube', color: '#FF0000', icon: '▶️' },
  { id: 'TikTok', label: 'TikTok', color: '#000000', icon: '🎵' },
  { id: 'Pinterest', label: 'Pinterest', color: '#E60023', icon: '📌' },
  { id: 'Threads', label: 'Threads', color: '#000000', icon: '🧵' },
];

export const PlatformNav = ({ selected, onSelect, placementCounts }: PlatformNavProps) => {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-3">Platforms</p>
      {platforms.map((p) => {
        const isActive = selected === p.id;
        const count = placementCounts[p.id] || 0;
        return (
          <button
            key={p.id}
            onClick={() => onSelect(p.id)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left',
              isActive
                ? 'bg-primary/10 text-primary shadow-sm'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <span
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm flex-shrink-0"
              style={{ backgroundColor: isActive ? p.color : `${p.color}88` }}
            >
              {p.icon}
            </span>
            <span className="flex-1">{p.label}</span>
            {count > 0 && (
              <span className={cn(
                'text-xs px-2 py-0.5 rounded-full',
                isActive ? 'bg-primary text-primary-foreground' : 'bg-muted-foreground/20 text-muted-foreground'
              )}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};