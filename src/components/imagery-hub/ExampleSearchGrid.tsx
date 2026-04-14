/**
 * ExampleSearchGrid - Quick-start example searches organized by industry categories
 * Helps users discover imagery faster with pre-built search terms
 */
import { Search, Building2, Stethoscope, Utensils, Laptop, Dumbbell, Plane, GraduationCap, Palette, ShoppingBag, Leaf, Music, Wrench, Heart, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExampleSearchGridProps {
  onSearch: (query: string) => void;
}

const EXAMPLE_CATEGORIES = [
  {
    label: 'Business',
    icon: Building2,
    color: 'text-blue-500',
    searches: ['corporate team meeting', 'modern office workspace', 'business handshake deal', 'startup brainstorm session'],
  },
  {
    label: 'Healthcare',
    icon: Stethoscope,
    color: 'text-emerald-500',
    searches: ['doctor patient consultation', 'medical research laboratory', 'wellness healthy lifestyle', 'pharmacy medicine'],
  },
  {
    label: 'Technology',
    icon: Laptop,
    color: 'text-violet-500',
    searches: ['software developer coding', 'artificial intelligence abstract', 'cybersecurity digital lock', 'cloud computing data center'],
  },
  {
    label: 'Food & Drink',
    icon: Utensils,
    color: 'text-orange-500',
    searches: ['gourmet food plating', 'fresh organic ingredients', 'coffee shop ambiance', 'restaurant dining experience'],
  },
  {
    label: 'Fitness',
    icon: Dumbbell,
    color: 'text-red-500',
    searches: ['gym workout training', 'yoga meditation pose', 'running outdoor fitness', 'sports team celebration'],
  },
  {
    label: 'Travel',
    icon: Plane,
    color: 'text-sky-500',
    searches: ['tropical beach sunset', 'city skyline aerial', 'mountain hiking adventure', 'luxury hotel resort'],
  },
  {
    label: 'Education',
    icon: GraduationCap,
    color: 'text-amber-500',
    searches: ['students classroom learning', 'university campus aerial', 'online education laptop', 'library books reading'],
  },
  {
    label: 'Creative',
    icon: Palette,
    color: 'text-pink-500',
    searches: ['abstract art colorful', 'minimalist design clean', 'creative studio workspace', 'typography lettering art'],
  },
  {
    label: 'Retail',
    icon: ShoppingBag,
    color: 'text-teal-500',
    searches: ['shopping mall interior', 'ecommerce product flat lay', 'luxury brand packaging', 'retail store display'],
  },
  {
    label: 'Nature',
    icon: Leaf,
    color: 'text-green-500',
    searches: ['forest trees sunlight', 'ocean waves aerial', 'wildlife safari animals', 'flower garden botanical'],
  },
  {
    label: 'Events',
    icon: Music,
    color: 'text-purple-500',
    searches: ['conference stage speaker', 'trade show booth display', 'wedding celebration elegant', 'concert live performance'],
  },
  {
    label: 'Industrial',
    icon: Wrench,
    color: 'text-slate-500',
    searches: ['manufacturing factory floor', 'construction site crane', 'engineering blueprint', 'warehouse logistics'],
  },
];

export const ExampleSearchGrid = ({ onSearch }: ExampleSearchGridProps) => {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
        <Search className="h-3 w-3" /> Quick Search Examples
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {EXAMPLE_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          return (
            <div key={cat.label} className="space-y-1">
              <div className="flex items-center gap-1.5 px-1">
                <Icon className={cn('h-3.5 w-3.5', cat.color)} />
                <span className="text-[11px] font-semibold text-foreground">{cat.label}</span>
              </div>
              <div className="space-y-0.5">
                {cat.searches.map((q) => (
                  <button
                    key={q}
                    onClick={() => onSearch(q)}
                    className="w-full text-left px-2 py-1.5 rounded-md text-[11px] text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors truncate"
                    title={q}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
