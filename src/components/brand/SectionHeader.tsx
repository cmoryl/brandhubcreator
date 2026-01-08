import { useState } from 'react';
import { Pencil, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SectionHeaderProps {
  title: string;
  defaultSubtitle: string;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
  isEditing: boolean;
  onEditToggle: () => void;
}

export const SectionHeader = ({
  title,
  defaultSubtitle,
  customSubtitle,
  onSubtitleChange,
  isEditing,
  onEditToggle,
}: SectionHeaderProps) => {
  const [editingSubtitle, setEditingSubtitle] = useState(false);
  const displaySubtitle = customSubtitle || defaultSubtitle;

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <h2 className="text-2xl font-serif font-semibold text-foreground">{title}</h2>
        {editingSubtitle && onSubtitleChange ? (
          <div className="flex items-center gap-2 mt-1">
            <Input
              value={customSubtitle ?? ''}
              onChange={(e) => onSubtitleChange(e.target.value)}
              placeholder={defaultSubtitle}
              className="text-sm h-8"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditingSubtitle(false)}
              className="h-8 px-2"
            >
              <Check className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <p 
            className="text-muted-foreground mt-1 cursor-pointer hover:text-foreground/80 transition-colors group"
            onClick={() => onSubtitleChange && setEditingSubtitle(true)}
            title={onSubtitleChange ? "Click to edit subtitle" : undefined}
          >
            {displaySubtitle}
            {onSubtitleChange && (
              <Pencil className="inline-block h-3 w-3 ml-2 opacity-0 group-hover:opacity-50 transition-opacity" />
            )}
          </p>
        )}
      </div>
      <Button
        variant={isEditing ? "default" : "outline"}
        size="sm"
        onClick={onEditToggle}
        className="gap-2 shrink-0"
      >
        {isEditing ? <Check className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
        {isEditing ? 'Done' : 'Edit'}
      </Button>
    </div>
  );
};
