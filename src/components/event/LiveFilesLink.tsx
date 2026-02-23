import { useState } from 'react';
import { ExternalLink, Link, Pencil, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface LiveFilesLinkProps {
  url?: string;
  onUrlChange?: (url: string | undefined) => void;
  isEditable?: boolean;
  className?: string;
  compact?: boolean;
}

export const LiveFilesLink = ({ url, onUrlChange, isEditable = false, className, compact = false }: LiveFilesLinkProps) => {
  const [editUrl, setEditUrl] = useState(url || '');
  const [isOpen, setIsOpen] = useState(false);

  const handleSave = () => {
    const trimmed = editUrl.trim();
    onUrlChange?.(trimmed || undefined);
    setIsOpen(false);
  };

  if (!url && !isEditable) return null;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {url ? (
        <Button variant="outline" size="sm" className={cn("gap-1.5", compact ? "h-6 text-[10px] px-2" : "h-7 text-xs")} asChild>
          <a href={url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className={cn(compact ? "h-2.5 w-2.5" : "h-3 w-3")} />
            Live Files
          </a>
        </Button>
      ) : null}
      {isEditable && (
        <Popover open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (open) setEditUrl(url || ''); }}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className={cn(compact ? "h-5 w-5" : "h-6 w-6")} title={url ? "Edit live files link" : "Add live files link"}>
              {url ? <Pencil className="h-3 w-3 text-muted-foreground" /> : <Link className="h-3 w-3 text-muted-foreground" />}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-3" align="end" onClick={(e) => e.stopPropagation()}>
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Live Files URL</p>
              <p className="text-[10px] text-muted-foreground">Link to Figma, Dropbox, Google Drive, etc.</p>
              <Input
                value={editUrl}
                onChange={(e) => setEditUrl(e.target.value)}
                placeholder="https://www.dropbox.com/..."
                className="h-8 text-xs"
                onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
              />
              <div className="flex justify-end gap-1.5">
                {url && (
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive" onClick={() => { onUrlChange?.(undefined); setIsOpen(false); }}>
                    Remove
                  </Button>
                )}
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setIsOpen(false)}>
                  <X className="h-3 w-3 mr-1" />Cancel
                </Button>
                <Button size="sm" className="h-7 text-xs" onClick={handleSave}>
                  <Check className="h-3 w-3 mr-1" />Save
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};
