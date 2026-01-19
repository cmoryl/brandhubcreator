import { useState, useRef, useCallback, useEffect } from 'react';
import { 
  Bold, Italic, Underline, Strikethrough, Link, Link2Off, Check, X,
  List, ListOrdered, AlignLeft, AlignCenter, AlignRight, Highlighter,
  Heading1, Heading2, Heading3, CornerDownLeft, Minus
} from 'lucide-react';
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
  showAdvanced?: boolean;
}

// Sanitize HTML to allow only safe tags
const sanitizeHtml = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'u', 's', 'strong', 'em', 'a', 'br', 'span', 'p', 'div', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'mark', 'hr'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'style', 'class'],
    ALLOW_DATA_ATTR: false,
  });
};

const HIGHLIGHT_COLORS = [
  { name: 'Yellow', value: '#fef08a' },
  { name: 'Green', value: '#bbf7d0' },
  { name: 'Blue', value: '#bfdbfe' },
  { name: 'Pink', value: '#fbcfe8' },
  { name: 'Orange', value: '#fed7aa' },
  { name: 'Purple', value: '#ddd6fe' },
];

export const RichTextEditor = ({
  value,
  onChange,
  placeholder = 'Enter text...',
  className,
  minHeight = '60px',
  showAdvanced = true,
}: RichTextEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkPopover, setShowLinkPopover] = useState(false);
  const [showHighlightPopover, setShowHighlightPopover] = useState(false);
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

  // List commands
  const handleBulletList = () => execCommand('insertUnorderedList');
  const handleNumberedList = () => execCommand('insertOrderedList');

  // Alignment commands
  const handleAlignLeft = () => execCommand('justifyLeft');
  const handleAlignCenter = () => execCommand('justifyCenter');
  const handleAlignRight = () => execCommand('justifyRight');

  // Heading commands
  const handleHeading = (level: 'h1' | 'h2' | 'h3') => {
    execCommand('formatBlock', level);
  };

  // Line break - insert <br> tag
  const handleLineBreak = () => {
    editorRef.current?.focus();
    document.execCommand('insertHTML', false, '<br><br>');
    handleInput();
  };

  // Horizontal rule
  const handleHorizontalRule = () => {
    execCommand('insertHorizontalRule');
  };

  // Highlight
  const handleHighlight = (color: string) => {
    restoreSelection();
    editorRef.current?.focus();
    document.execCommand('hiliteColor', false, color);
    handleInput();
    setShowHighlightPopover(false);
  };

  const handleRemoveHighlight = () => {
    restoreSelection();
    editorRef.current?.focus();
    document.execCommand('removeFormat');
    handleInput();
    setShowHighlightPopover(false);
  };

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
    // Handle Shift+Enter for line break
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      document.execCommand('insertHTML', false, '<br>');
      handleInput();
      return;
    }

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
    // Get HTML if available, otherwise plain text
    const html = e.clipboardData.getData('text/html');
    const text = e.clipboardData.getData('text/plain');
    
    if (html) {
      // Sanitize and insert HTML
      const sanitized = sanitizeHtml(html);
      document.execCommand('insertHTML', false, sanitized);
    } else {
      // Convert line breaks to <br> for plain text
      const htmlText = text.replace(/\n/g, '<br>');
      document.execCommand('insertHTML', false, htmlText);
    }
    handleInput();
  };

  return (
    <div className={cn('border rounded-lg overflow-hidden bg-background', className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-1.5 border-b bg-muted/30">
        {/* Text formatting */}
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
        
        {/* Links */}
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

        {showAdvanced && (
          <>
            <div className="w-px h-4 bg-border mx-1" />
            
            {/* Line break and horizontal rule */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleLineBreak}
              className="h-7 w-7 p-0"
              title="Line Break (Shift+Enter)"
            >
              <CornerDownLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleHorizontalRule}
              className="h-7 w-7 p-0"
              title="Horizontal Line"
            >
              <Minus className="h-3.5 w-3.5" />
            </Button>

            <div className="w-px h-4 bg-border mx-1" />
            
            {/* Headings */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleHeading('h1')}
              className="h-7 w-7 p-0"
              title="Heading 1"
            >
              <Heading1 className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleHeading('h2')}
              className="h-7 w-7 p-0"
              title="Heading 2"
            >
              <Heading2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleHeading('h3')}
              className="h-7 w-7 p-0"
              title="Heading 3"
            >
              <Heading3 className="h-3.5 w-3.5" />
            </Button>

            <div className="w-px h-4 bg-border mx-1" />
            
            {/* Lists */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleBulletList}
              className="h-7 w-7 p-0"
              title="Bullet List"
            >
              <List className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleNumberedList}
              className="h-7 w-7 p-0"
              title="Numbered List"
            >
              <ListOrdered className="h-3.5 w-3.5" />
            </Button>

            <div className="w-px h-4 bg-border mx-1" />
            
            {/* Alignment */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleAlignLeft}
              className="h-7 w-7 p-0"
              title="Align Left"
            >
              <AlignLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleAlignCenter}
              className="h-7 w-7 p-0"
              title="Align Center"
            >
              <AlignCenter className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleAlignRight}
              className="h-7 w-7 p-0"
              title="Align Right"
            >
              <AlignRight className="h-3.5 w-3.5" />
            </Button>

            <div className="w-px h-4 bg-border mx-1" />
            
            {/* Highlight */}
            <Popover open={showHighlightPopover} onOpenChange={setShowHighlightPopover}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    saveSelection();
                    setShowHighlightPopover(true);
                  }}
                  className="h-7 w-7 p-0"
                  title="Highlight"
                >
                  <Highlighter className="h-3.5 w-3.5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2" align="start">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Highlight Color</p>
                  <div className="flex flex-wrap gap-1">
                    {HIGHLIGHT_COLORS.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => handleHighlight(color.value)}
                        className="w-6 h-6 rounded border transition-transform hover:scale-110"
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveHighlight}
                    className="w-full text-xs"
                  >
                    Remove Highlight
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </>
        )}
      </div>
      
      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        className={cn(
          'px-3 py-2 text-sm focus:outline-none',
          'prose prose-sm max-w-none dark:prose-invert',
          '[&_a]:text-primary [&_a]:underline [&_a]:cursor-pointer',
          '[&_h1]:text-xl [&_h1]:font-bold [&_h1]:mt-2 [&_h1]:mb-1',
          '[&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-2 [&_h2]:mb-1',
          '[&_h3]:text-base [&_h3]:font-medium [&_h3]:mt-2 [&_h3]:mb-1',
          '[&_ul]:list-disc [&_ul]:pl-4 [&_ul]:my-1',
          '[&_ol]:list-decimal [&_ol]:pl-4 [&_ol]:my-1',
          '[&_li]:my-0.5',
          '[&_hr]:my-2 [&_hr]:border-border',
          '[&_mark]:px-0.5 [&_mark]:rounded',
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
      className={cn(
        '[&_a]:text-primary [&_a]:underline [&_a]:cursor-pointer',
        '[&_h1]:text-xl [&_h1]:font-bold [&_h1]:mt-2 [&_h1]:mb-1',
        '[&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-2 [&_h2]:mb-1',
        '[&_h3]:text-base [&_h3]:font-medium [&_h3]:mt-2 [&_h3]:mb-1',
        '[&_ul]:list-disc [&_ul]:pl-4 [&_ul]:my-1',
        '[&_ol]:list-decimal [&_ol]:pl-4 [&_ol]:my-1',
        '[&_li]:my-0.5',
        '[&_hr]:my-2 [&_hr]:border-border',
        '[&_mark]:px-0.5 [&_mark]:rounded',
        className
      )}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
};
