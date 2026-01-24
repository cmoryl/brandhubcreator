import React, { useState, forwardRef } from 'react';
import { Pencil, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RichTextEditor, RichTextDisplay } from '@/components/ui/rich-text-editor';

interface SectionHeaderProps {
  title: string;
  defaultSubtitle: string;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
  isEditing: boolean;
  onEditToggle: () => void;
}

export const SectionHeader = forwardRef<HTMLDivElement, SectionHeaderProps>(
  function SectionHeader({
    title,
    defaultSubtitle,
    customSubtitle,
    onSubtitleChange,
    isEditing,
    onEditToggle,
  }, ref) {
    const [editingSubtitle, setEditingSubtitle] = useState(false);
    const displaySubtitle = customSubtitle || defaultSubtitle;

    return (
      <div ref={ref} className="flex items-start justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl sm:text-2xl font-serif font-semibold text-foreground">{title}</h2>
          {editingSubtitle && onSubtitleChange ? (
            <div className="mt-2 space-y-2">
              <RichTextEditor
                value={customSubtitle ?? ''}
                onChange={onSubtitleChange}
                placeholder={defaultSubtitle}
                minHeight="50px"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setEditingSubtitle(false)}
                className="gap-1.5"
              >
                <Check className="h-3 w-3" />
                Done Editing
              </Button>
            </div>
          ) : (
            <p 
              className="text-sm sm:text-base text-muted-foreground mt-1 cursor-pointer hover:text-foreground/80 transition-colors group"
              onClick={() => onSubtitleChange && setEditingSubtitle(true)}
              title={onSubtitleChange ? "Click to edit subtitle" : undefined}
            >
              {customSubtitle ? (
                <RichTextDisplay html={customSubtitle} />
              ) : (
                displaySubtitle
              )}
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
          className="gap-1.5 sm:gap-2 shrink-0 h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm"
        >
          {isEditing ? <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
          <span className="hidden sm:inline">{isEditing ? 'Done' : 'Edit'}</span>
        </Button>
      </div>
    );
  }
);

SectionHeader.displayName = 'SectionHeader';
