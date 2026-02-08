import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CategoryInfo {
  label: string;
  description: string;
  count: number;
}

interface CategoryNavProps {
  categories: Record<string, CategoryInfo>;
  activeCategory: string | null;
  onCategoryClick: (category: string) => void;
}

const categoryIcons: Record<string, string> = {
  core: '🎯',
  visual: '🎨',
  content: '📄',
  advanced: '⚡',
  admin: '🛡️',
};

const categoryColors: Record<string, string> = {
  core: 'from-rose-500 to-orange-500',
  visual: 'from-violet-500 to-purple-500',
  content: 'from-blue-500 to-cyan-500',
  advanced: 'from-emerald-500 to-teal-500',
  admin: 'from-amber-500 to-yellow-500',
};

export function CategoryNav({ categories, activeCategory, onCategoryClick }: CategoryNavProps) {
  return (
    <div className="sticky top-16 z-40 py-4 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {Object.entries(categories).map(([key, { label, count }]) => (
            <motion.button
              key={key}
              onClick={() => onCategoryClick(key)}
              className={cn(
                "relative flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300",
                activeCategory === key
                  ? "text-white shadow-lg"
                  : "text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted"
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {activeCategory === key && (
                <motion.div
                  layoutId="activeCategory"
                  className={cn("absolute inset-0 rounded-full bg-gradient-to-r", categoryColors[key])}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10">{categoryIcons[key]}</span>
              <span className="relative z-10">{label}</span>
              <span className={cn(
                "relative z-10 px-1.5 py-0.5 rounded-full text-xs",
                activeCategory === key ? "bg-white/20" : "bg-accent/10 text-accent"
              )}>
                {count}
              </span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
