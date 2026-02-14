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

// ── Safe DOM helpers (no execCommand) ──────────────────────────

/** Get the current selection range, scoped to an editor element */
const getEditorRange = (editor: HTMLElement): Range | null => {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const range = sel.getRangeAt(0);
  if (!editor.contains(range.commonAncestorContainer)) return null;
  return range;
};

/** Wrap the current selection in a given tag (toggle: unwrap if already wrapped) */
const toggleInlineTag = (editor: HTMLElement, tagName: string): void => {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;
  const range = sel.getRangeAt(0);
  if (!editor.contains(range.commonAncestorContainer)) return;

  // Check if already wrapped in this tag
  let node: Node | null = range.commonAncestorContainer;
  while (node && node !== editor) {
    if (node.nodeType === Node.ELEMENT_NODE && (node as Element).tagName === tagName.toUpperCase()) {
      // Unwrap: replace the element with its children
      const parent = node.parentNode;
      if (parent) {
        while (node.firstChild) {
          parent.insertBefore(node.firstChild, node);
        }
        parent.removeChild(node);
      }
      return;
    }
    node = node.parentNode;
  }

  // Wrap selection in new element
  if (range.collapsed) return;
  const wrapper = document.createElement(tagName);
  try {
    range.surroundContents(wrapper);
  } catch {
    // surroundContents fails if range crosses element boundaries
    // Fall back to extracting and re-inserting
    const fragment = range.extractContents();
    wrapper.appendChild(fragment);
    range.insertNode(wrapper);
  }
  // Re-select the wrapped content
  sel.removeAllRanges();
  const newRange = document.createRange();
  newRange.selectNodeContents(wrapper);
  sel.addRange(newRange);
};

/** Insert sanitized HTML at the current cursor position */
const insertSafeHtml = (editor: HTMLElement, html: string): void => {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;
  const range = sel.getRangeAt(0);
  if (!editor.contains(range.commonAncestorContainer)) return;

  range.deleteContents();

  const sanitized = sanitizeHtml(html);
  const temp = document.createElement('div');
  temp.innerHTML = sanitized;
  const frag = document.createDocumentFragment();
  let lastNode: Node | null = null;
  while (temp.firstChild) {
    lastNode = temp.firstChild;
    frag.appendChild(lastNode);
  }
  range.insertNode(frag);

  // Move cursor after inserted content
  if (lastNode) {
    const newRange = document.createRange();
    newRange.setStartAfter(lastNode);
    newRange.collapse(true);
    sel.removeAllRanges();
    sel.addRange(newRange);
  }
};

/** Get the closest block-level ancestor of the selection */
const getSelectionBlock = (editor: HTMLElement): HTMLElement | null => {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  let node: Node | null = sel.anchorNode;
  const blockTags = ['P', 'DIV', 'H1', 'H2', 'H3', 'LI', 'UL', 'OL'];
  while (node && node !== editor) {
    if (node.nodeType === Node.ELEMENT_NODE && blockTags.includes((node as Element).tagName)) {
      return node as HTMLElement;
    }
    node = node.parentNode;
  }
  return null;
};

/** Wrap current block in a heading or toggle back to paragraph */
const formatBlock = (editor: HTMLElement, tagName: string): void => {
  const block = getSelectionBlock(editor);
  if (!block) return;
  const parent = block.parentNode;
  if (!parent) return;

  if (block.tagName === tagName.toUpperCase()) {
    // Toggle off: convert back to div
    const div = document.createElement('div');
    div.innerHTML = block.innerHTML;
    parent.replaceChild(div, block);
  } else {
    const heading = document.createElement(tagName);
    heading.innerHTML = block.innerHTML;
    parent.replaceChild(heading, block);
  }
};

/** Toggle a list (ul or ol) for the current selection */
const toggleList = (editor: HTMLElement, listTag: 'ul' | 'ol'): void => {
  const block = getSelectionBlock(editor);
  if (!block) return;
  const parent = block.parentNode;
  if (!parent) return;

  // If already inside this list type, unwrap
  if (block.tagName === 'LI' && parent.nodeName === listTag.toUpperCase()) {
    const grandparent = parent.parentNode;
    if (grandparent) {
      const div = document.createElement('div');
      div.innerHTML = block.innerHTML;
      grandparent.insertBefore(div, parent);
      parent.removeChild(block);
      if (!parent.hasChildNodes()) {
        grandparent.removeChild(parent);
      }
    }
    return;
  }

  // Wrap current block in a list
  const list = document.createElement(listTag);
  const li = document.createElement('li');
  li.innerHTML = block.innerHTML;
  list.appendChild(li);
  parent.replaceChild(list, block);
};

/** Set text alignment on the current block */
const setAlignment = (editor: HTMLElement, align: string): void => {
  const block = getSelectionBlock(editor);
  if (block) {
    block.style.textAlign = align;
  }
};

/** Wrap selection in an anchor tag */
const wrapInLink = (editor: HTMLElement, url: string): void => {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
  const range = sel.getRangeAt(0);
  if (!editor.contains(range.commonAncestorContainer)) return;

  const anchor = document.createElement('a');
  anchor.href = url.startsWith('http') ? url : `https://${url}`;
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';

  try {
    range.surroundContents(anchor);
  } catch {
    const fragment = range.extractContents();
    anchor.appendChild(fragment);
    range.insertNode(anchor);
  }
};

/** Remove link from selection */
const unwrapLink = (editor: HTMLElement): void => {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;
  let node: Node | null = sel.anchorNode;
  while (node && node !== editor) {
    if (node.nodeType === Node.ELEMENT_NODE && (node as Element).tagName === 'A') {
      const parent = node.parentNode;
      if (parent) {
        while (node.firstChild) {
          parent.insertBefore(node.firstChild, node);
        }
        parent.removeChild(node);
      }
      return;
    }
    node = node.parentNode;
  }
};

/** Apply highlight color to selection */
const applyHighlight = (editor: HTMLElement, color: string): void => {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
  const range = sel.getRangeAt(0);
  if (!editor.contains(range.commonAncestorContainer)) return;

  const mark = document.createElement('mark');
  mark.style.backgroundColor = color;

  try {
    range.surroundContents(mark);
  } catch {
    const fragment = range.extractContents();
    mark.appendChild(fragment);
    range.insertNode(mark);
  }
};

/** Remove all formatting from selection (strip to plain text) */
const removeFormatting = (editor: HTMLElement): void => {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;
  const range = sel.getRangeAt(0);
  if (!editor.contains(range.commonAncestorContainer)) return;

  const text = range.toString();
  range.deleteContents();
  const textNode = document.createTextNode(text);
  range.insertNode(textNode);

  sel.removeAllRanges();
  const newRange = document.createRange();
  newRange.selectNodeContents(textNode);
  sel.addRange(newRange);
};

// ── Editor component ───────────────────────────────────────────

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

  const emitChange = useCallback(() => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      const sanitized = sanitizeHtml(html);
      onChange(sanitized);
    }
  }, [onChange]);

  const doAction = useCallback((action: () => void) => {
    editorRef.current?.focus();
    action();
    emitChange();
  }, [emitChange]);

  const handleBold = () => doAction(() => toggleInlineTag(editorRef.current!, 'B'));
  const handleItalic = () => doAction(() => toggleInlineTag(editorRef.current!, 'I'));
  const handleUnderline = () => doAction(() => toggleInlineTag(editorRef.current!, 'U'));
  const handleStrikethrough = () => doAction(() => toggleInlineTag(editorRef.current!, 'S'));

  const handleBulletList = () => doAction(() => toggleList(editorRef.current!, 'ul'));
  const handleNumberedList = () => doAction(() => toggleList(editorRef.current!, 'ol'));

  const handleAlignLeft = () => doAction(() => setAlignment(editorRef.current!, 'left'));
  const handleAlignCenter = () => doAction(() => setAlignment(editorRef.current!, 'center'));
  const handleAlignRight = () => doAction(() => setAlignment(editorRef.current!, 'right'));

  const handleHeading = (level: 'h1' | 'h2' | 'h3') => {
    doAction(() => formatBlock(editorRef.current!, level));
  };

  const handleLineBreak = () => {
    doAction(() => insertSafeHtml(editorRef.current!, '<br><br>'));
  };

  const handleHorizontalRule = () => {
    doAction(() => insertSafeHtml(editorRef.current!, '<hr>'));
  };

  const handleHighlight = (color: string) => {
    restoreSelection();
    doAction(() => applyHighlight(editorRef.current!, color));
    setShowHighlightPopover(false);
  };

  const handleRemoveHighlight = () => {
    restoreSelection();
    doAction(() => removeFormatting(editorRef.current!));
    setShowHighlightPopover(false);
  };

  const handleAddLink = () => {
    saveSelection();
    setShowLinkPopover(true);
  };

  const confirmLink = () => {
    if (linkUrl) {
      restoreSelection();
      doAction(() => wrapInLink(editorRef.current!, linkUrl));
    }
    setLinkUrl('');
    setShowLinkPopover(false);
  };

  const handleRemoveLink = () => {
    doAction(() => unwrapLink(editorRef.current!));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      doAction(() => insertSafeHtml(editorRef.current!, '<br>'));
      return;
    }

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
    const html = e.clipboardData.getData('text/html');
    const text = e.clipboardData.getData('text/plain');
    
    if (html) {
      // Sanitize and insert HTML safely via Range API
      insertSafeHtml(editorRef.current!, html);
    } else {
      const htmlText = text.replace(/\n/g, '<br>');
      insertSafeHtml(editorRef.current!, htmlText);
    }
    emitChange();
  };

  return (
    <div className={cn('border rounded-lg overflow-hidden bg-background', className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-1.5 border-b bg-muted/30">
        {/* Text formatting */}
        <Button type="button" variant="ghost" size="sm" onClick={handleBold} className="h-7 w-7 p-0" title="Bold (Ctrl+B)">
          <Bold className="h-3.5 w-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={handleItalic} className="h-7 w-7 p-0" title="Italic (Ctrl+I)">
          <Italic className="h-3.5 w-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={handleUnderline} className="h-7 w-7 p-0" title="Underline (Ctrl+U)">
          <Underline className="h-3.5 w-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={handleStrikethrough} className="h-7 w-7 p-0" title="Strikethrough">
          <Strikethrough className="h-3.5 w-3.5" />
        </Button>
        
        <div className="w-px h-4 bg-border mx-1" />
        
        {/* Links */}
        <Popover open={showLinkPopover} onOpenChange={setShowLinkPopover}>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="sm" onClick={handleAddLink} className="h-7 w-7 p-0" title="Add Link">
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
                <Button type="button" size="sm" onClick={confirmLink} className="h-8 px-2">
                  <Check className="h-3.5 w-3.5" />
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => { setLinkUrl(''); setShowLinkPopover(false); }} className="h-8 px-2">
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        
        <Button type="button" variant="ghost" size="sm" onClick={handleRemoveLink} className="h-7 w-7 p-0" title="Remove Link">
          <Link2Off className="h-3.5 w-3.5" />
        </Button>

        {showAdvanced && (
          <>
            <div className="w-px h-4 bg-border mx-1" />
            
            <Button type="button" variant="ghost" size="sm" onClick={handleLineBreak} className="h-7 w-7 p-0" title="Line Break (Shift+Enter)">
              <CornerDownLeft className="h-3.5 w-3.5" />
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={handleHorizontalRule} className="h-7 w-7 p-0" title="Horizontal Line">
              <Minus className="h-3.5 w-3.5" />
            </Button>

            <div className="w-px h-4 bg-border mx-1" />
            
            <Button type="button" variant="ghost" size="sm" onClick={() => handleHeading('h1')} className="h-7 w-7 p-0" title="Heading 1">
              <Heading1 className="h-3.5 w-3.5" />
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => handleHeading('h2')} className="h-7 w-7 p-0" title="Heading 2">
              <Heading2 className="h-3.5 w-3.5" />
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => handleHeading('h3')} className="h-7 w-7 p-0" title="Heading 3">
              <Heading3 className="h-3.5 w-3.5" />
            </Button>

            <div className="w-px h-4 bg-border mx-1" />
            
            <Button type="button" variant="ghost" size="sm" onClick={handleBulletList} className="h-7 w-7 p-0" title="Bullet List">
              <List className="h-3.5 w-3.5" />
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={handleNumberedList} className="h-7 w-7 p-0" title="Numbered List">
              <ListOrdered className="h-3.5 w-3.5" />
            </Button>

            <div className="w-px h-4 bg-border mx-1" />
            
            <Button type="button" variant="ghost" size="sm" onClick={handleAlignLeft} className="h-7 w-7 p-0" title="Align Left">
              <AlignLeft className="h-3.5 w-3.5" />
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={handleAlignCenter} className="h-7 w-7 p-0" title="Align Center">
              <AlignCenter className="h-3.5 w-3.5" />
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={handleAlignRight} className="h-7 w-7 p-0" title="Align Right">
              <AlignRight className="h-3.5 w-3.5" />
            </Button>

            <div className="w-px h-4 bg-border mx-1" />
            
            <Popover open={showHighlightPopover} onOpenChange={setShowHighlightPopover}>
              <PopoverTrigger asChild>
                <Button type="button" variant="ghost" size="sm" onClick={() => { saveSelection(); setShowHighlightPopover(true); }} className="h-7 w-7 p-0" title="Highlight">
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
                  <Button type="button" variant="ghost" size="sm" onClick={handleRemoveHighlight} className="w-full text-xs">
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
        onInput={emitChange}
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
