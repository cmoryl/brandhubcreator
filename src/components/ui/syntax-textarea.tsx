import * as React from "react";
import { cn } from "@/lib/utils";

interface SyntaxTextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  language?: 'svg' | 'xml' | 'html';
}

// Simple SVG/XML syntax highlighting
const highlightSvg = (code: string): string => {
  if (!code) return '';
  
  // Escape HTML entities first
  let highlighted = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  
  // Highlight comments <!-- -->
  highlighted = highlighted.replace(
    /(&lt;!--[\s\S]*?--&gt;)/g,
    '<span class="text-muted-foreground/60 italic">$1</span>'
  );
  
  // Highlight tags <tagname and </tagname
  highlighted = highlighted.replace(
    /(&lt;\/?)([\w-]+)/g,
    '<span class="text-rose-400">$1</span><span class="text-sky-400">$2</span>'
  );
  
  // Highlight closing bracket and self-closing
  highlighted = highlighted.replace(
    /(\/?&gt;)/g,
    '<span class="text-rose-400">$1</span>'
  );
  
  // Highlight attributes name="value"
  highlighted = highlighted.replace(
    /\s([\w-]+)(=)("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g,
    ' <span class="text-amber-400">$1</span><span class="text-muted-foreground">$2</span><span class="text-emerald-400">$3</span>'
  );
  
  // Highlight standalone attributes (like disabled, checked)
  highlighted = highlighted.replace(
    /\s([\w-]+)(?=\s|\/&gt;|&gt;)/g,
    ' <span class="text-amber-400">$1</span>'
  );
  
  return highlighted;
};

const SyntaxTextarea = React.forwardRef<HTMLTextAreaElement, SyntaxTextareaProps>(
  ({ className, value, onChange, language = 'svg', ...props }, ref) => {
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);
    const highlightRef = React.useRef<HTMLDivElement>(null);

    // Sync scroll between textarea and highlight layer
    const handleScroll = () => {
      if (textareaRef.current && highlightRef.current) {
        highlightRef.current.scrollTop = textareaRef.current.scrollTop;
        highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
      }
    };

    // Handle ref forwarding
    React.useImperativeHandle(ref, () => textareaRef.current as HTMLTextAreaElement);

    const highlightedCode = React.useMemo(() => highlightSvg(value), [value]);

    return (
      <div className={cn("relative font-mono text-xs", className)}>
        {/* Highlighted code layer (behind) */}
        <div
          ref={highlightRef}
          className="absolute inset-0 overflow-hidden pointer-events-none rounded-md border border-transparent bg-background px-3 py-2 whitespace-pre-wrap break-all"
          style={{ 
            lineHeight: '1.5',
            wordBreak: 'break-all',
          }}
          aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: highlightedCode + '\n' }}
        />
        
        {/* Actual textarea (on top, transparent text) */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          className={cn(
            "relative w-full min-h-[120px] rounded-md border border-input bg-transparent px-3 py-2 ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            "text-transparent caret-foreground selection:bg-primary/30 selection:text-transparent",
            "resize-y overflow-auto"
          )}
          style={{ 
            lineHeight: '1.5',
            wordBreak: 'break-all',
          }}
          spellCheck={false}
          {...props}
        />
      </div>
    );
  }
);

SyntaxTextarea.displayName = "SyntaxTextarea";

export { SyntaxTextarea };
