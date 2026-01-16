import { useState, useRef, useCallback } from 'react';
import { Pencil, Check, Bold, Italic, Link, X, Undo, Type, AlignLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Toggle } from '@/components/ui/toggle';
import { cn } from '@/lib/utils';
import DOMPurify from 'dompurify';

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
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  
  const displaySubtitle = customSubtitle || defaultSubtitle;

  // Sanitize HTML for safe rendering
  const sanitizedSubtitle = DOMPurify.sanitize(displaySubtitle, {
    ALLOWED_TAGS: ['b', 'strong', 'i', 'em', 'a', 'br', 'span'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style'],
  });

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  }, []);

  const handleBold = () => execCommand('bold');
  const handleItalic = () => execCommand('italic');
  
  const handleLink = () => {
    if (linkUrl) {
      // Validate URL
      try {
        const url = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`;
        new URL(url);
        execCommand('createLink', url);
        setLinkUrl('');
        setShowLinkInput(false);
      } catch {
        // Invalid URL, don't create link
      }
    }
  };

  const handleRemoveLink = () => {
    execCommand('unlink');
  };

  const handleReset = () => {
    if (onSubtitleChange) {
      onSubtitleChange('');
    }
  };

  const handleSave = () => {
    if (editorRef.current && onSubtitleChange) {
      const html = editorRef.current.innerHTML;
      // Sanitize before saving
      const sanitized = DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ['b', 'strong', 'i', 'em', 'a', 'br', 'span'],
        ALLOWED_ATTR: ['href', 'target', 'rel'],
      });
      onSubtitleChange(sanitized);
    }
    setEditingSubtitle(false);
  };

  const handleCancel = () => {
    setEditingSubtitle(false);
    setShowLinkInput(false);
  };

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <h2 className="text-2xl font-serif font-semibold text-foreground">{title}</h2>
        {editingSubtitle && onSubtitleChange ? (
          <div className="mt-2 space-y-2">
            {/* Formatting Toolbar */}
            <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-md border border-border">
              <Toggle
                size="sm"
                onClick={handleBold}
                title="Bold (Ctrl+B)"
                className="h-7 w-7 p-0"
              >
                <Bold className="h-3.5 w-3.5" />
              </Toggle>
              <Toggle
                size="sm"
                onClick={handleItalic}
                title="Italic (Ctrl+I)"
                className="h-7 w-7 p-0"
              >
                <Italic className="h-3.5 w-3.5" />
              </Toggle>
              
              <div className="w-px h-5 bg-border mx-1" />
              
              <Popover open={showLinkInput} onOpenChange={setShowLinkInput}>
                <PopoverTrigger asChild>
                  <Toggle
                    size="sm"
                    title="Insert Link"
                    className="h-7 w-7 p-0"
                    pressed={showLinkInput}
                  >
                    <Link className="h-3.5 w-3.5" />
                  </Toggle>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-2" align="start">
                  <div className="flex items-center gap-2">
                    <Input
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="h-8 text-sm"
                      onKeyDown={(e) => e.key === 'Enter' && handleLink()}
                    />
                    <Button size="sm" className="h-8" onClick={handleLink}>
                      Add
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
              
              <Toggle
                size="sm"
                onClick={handleRemoveLink}
                title="Remove Link"
                className="h-7 w-7 p-0"
              >
                <X className="h-3.5 w-3.5" />
              </Toggle>

              <div className="w-px h-5 bg-border mx-1" />
              
              <Toggle
                size="sm"
                onClick={handleReset}
                title="Reset to Default"
                className="h-7 w-7 p-0"
              >
                <Undo className="h-3.5 w-3.5" />
              </Toggle>

              <div className="flex-1" />
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="h-7 px-2 text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                className="h-7 px-3 text-xs"
              >
                <Check className="h-3 w-3 mr-1" />
                Save
              </Button>
            </div>

            {/* Editable Content Area */}
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              className={cn(
                "min-h-[2.5rem] p-3 rounded-md border border-border bg-background",
                "text-sm text-muted-foreground",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
                "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2",
                "[&_b]:font-semibold [&_strong]:font-semibold",
                "[&_i]:italic [&_em]:italic"
              )}
              dangerouslySetInnerHTML={{ __html: sanitizedSubtitle }}
              onKeyDown={(e) => {
                // Prevent new lines with Enter, allow Shift+Enter for line break
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                }
              }}
            />
            
            <p className="text-xs text-muted-foreground/70">
              Tip: Use <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Ctrl+B</kbd> for bold, 
              <kbd className="px-1 py-0.5 bg-muted rounded text-[10px] ml-1">Ctrl+I</kbd> for italic. 
              Press <kbd className="px-1 py-0.5 bg-muted rounded text-[10px] ml-1">Shift+Enter</kbd> for line break.
            </p>
          </div>
        ) : (
          <div 
            className="text-muted-foreground mt-1 cursor-pointer hover:text-foreground/80 transition-colors group [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_b]:font-semibold [&_strong]:font-semibold [&_i]:italic [&_em]:italic"
            onClick={() => onSubtitleChange && setEditingSubtitle(true)}
            title={onSubtitleChange ? "Click to edit subtitle" : undefined}
            dangerouslySetInnerHTML={{ __html: sanitizedSubtitle }}
          />
        )}
        {!editingSubtitle && onSubtitleChange && (
          <button
            onClick={() => setEditingSubtitle(true)}
            className="inline-flex items-center gap-1 mt-1 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          >
            <Pencil className="h-3 w-3" />
            <span>Edit description</span>
          </button>
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
