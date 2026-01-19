import { useState, useRef, useCallback, useEffect } from 'react';
import { Bold, Italic, Underline, Strikethrough, Link, Link2Off, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import DOMPurify from 'dompurify';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

// Sanitize HTML to allow only safe tags
const sanitizeHtml = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'u', 's', 'strong', 'em', 'a', 'br', 'span'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'style'],
    ALLOW_DATA_ATTR: false,
  });
};

export const RichTextEditor = ({
  value,
  onChange,
  placeholder = 'Enter text...',
  className,
  minHeight = '60px',
}: RichTextEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkPopover, setShowLinkPopover] = useState(false);
  const [savedSelection, setSavedSelection] = useState<Range | null>(null);

  // Initialize content when value changes externally
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = sanitizeHtml(value);
    }
  }, [value]);

  const saveSelection = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      setSavedSelection(selection.getRangeAt(0).cloneRange());
    }
  }, []);

  const restoreSelection = useCallback(() => {
    if (savedSelection) {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(savedSelection);
      }
    }
  }, [savedSelection]);

  const execCommand = useCallback((command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    handleInput();
  }, []);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      const sanitized = sanitizeHtml(html);
      onChange(sanitized);
    }
  }, [onChange]);

  const handleBold = () => execCommand('bold');
  const handleItalic = () => execCommand('italic');
  const handleUnderline = () => execCommand('underline');
  const handleStrikethrough = () => execCommand('strikeThrough');

  const handleAddLink = () => {
    saveSelection();
    setShowLinkPopover(true);
  };

  const confirmLink = () => {
    if (linkUrl) {
      restoreSelection();
      editorRef.current?.focus();
      
      // Ensure URL has protocol
      const url = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`;
      document.execCommand('createLink', false, url);
      
      // Add target="_blank" to the newly created link
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const anchor = selection.anchorNode?.parentElement;
        if (anchor?.tagName === 'A') {
          anchor.setAttribute('target', '_blank');
          anchor.setAttribute('rel', 'noopener noreferrer');
        }
      }
      
      handleInput();
    }
    setLinkUrl('');
    setShowLinkPopover(false);
  };

  const handleRemoveLink = () => {
    execCommand('unlink');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle keyboard shortcuts
    if (e.metaKey || e.ctrlKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          handleBold();
          break;
        case 'i':
          e.preventDefault();
          handleItalic();
          break;
        case 'u':
          e.preventDefault();
          handleUnderline();
          break;
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  return (
    <div className={cn('border rounded-lg overflow-hidden bg-background', className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-1.5 border-b bg-muted/30">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleBold}
          className="h-7 w-7 p-0"
          title="Bold (Ctrl+B)"
        >
          <Bold className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleItalic}
          className="h-7 w-7 p-0"
          title="Italic (Ctrl+I)"
        >
          <Italic className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleUnderline}
          className="h-7 w-7 p-0"
          title="Underline (Ctrl+U)"
        >
          <Underline className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleStrikethrough}
          className="h-7 w-7 p-0"
          title="Strikethrough"
        >
          <Strikethrough className="h-3.5 w-3.5" />
        </Button>
        
        <div className="w-px h-4 bg-border mx-1" />
        
        <Popover open={showLinkPopover} onOpenChange={setShowLinkPopover}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleAddLink}
              className="h-7 w-7 p-0"
              title="Add Link"
            >
              <Link className="h-3.5 w-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-3" align="start">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Link URL</label>
              <div className="flex gap-2">
                <Input
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="h-8 text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && confirmLink()}
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={confirmLink}
                  className="h-8 px-2"
                >
                  <Check className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setLinkUrl('');
                    setShowLinkPopover(false);
                  }}
                  className="h-8 px-2"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleRemoveLink}
          className="h-7 w-7 p-0"
          title="Remove Link"
        >
          <Link2Off className="h-3.5 w-3.5" />
        </Button>
      </div>
      
      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        className={cn(
          'px-3 py-2 text-sm focus:outline-none',
          'prose prose-sm max-w-none dark:prose-invert',
          '[&_a]:text-primary [&_a]:underline [&_a]:cursor-pointer',
          'empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground empty:before:pointer-events-none'
        )}
        style={{ minHeight }}
        data-placeholder={placeholder}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onBlur={saveSelection}
        suppressContentEditableWarning
      />
    </div>
  );
};

// Display component for rendering sanitized HTML
interface RichTextDisplayProps {
  html: string;
  className?: string;
}

export const RichTextDisplay = ({ html, className }: RichTextDisplayProps) => {
  const sanitized = sanitizeHtml(html);
  
  return (
    <span
      className={cn('[&_a]:text-primary [&_a]:underline [&_a]:cursor-pointer', className)}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
};
