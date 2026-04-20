import { useEffect, useState } from 'react';
import { Box, Maximize2, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { buildBoothHubPresenterUrl } from '@/lib/boothHub';

interface Booth3DEmbedProps {
  divisionId: string;
  divisionName: string;
  color: string;
  /** Optional variant label to deep-link in the 3D viewer. */
  variantLabel?: string;
  /** Show as inline collapsible preview (default true). Set false for modal-only trigger. */
  inline?: boolean;
  /** Externally control the fullscreen modal (e.g. from a parent card click). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Hide internal trigger buttons when controlled externally. */
  hideTriggers?: boolean;
}

export const Booth3DEmbed = ({ divisionId, divisionName, color, variantLabel, inline = true, open, onOpenChange, hideTriggers = false }: Booth3DEmbedProps) => {
  const [expanded, setExpanded] = useState(false);
  const [internalFullscreen, setInternalFullscreen] = useState(false);
  const [inlineLoaded, setInlineLoaded] = useState(false);
  const [modalLoaded, setModalLoaded] = useState(false);

  const fullscreenOpen = open ?? internalFullscreen;
  const setFullscreenOpen = onOpenChange ?? setInternalFullscreen;

  const embedUrl = buildBoothHubPresenterUrl(divisionId, variantLabel);
  const externalUrl = buildBoothHubPresenterUrl(divisionId, variantLabel, true);

  useEffect(() => {
    setInlineLoaded(false);
    setModalLoaded(false);
  }, [embedUrl]);

  return (
    <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
      {!hideTriggers && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {inline && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1.5"
              onClick={() => setExpanded((v) => !v)}
              style={expanded ? { borderColor: color, color } : undefined}
            >
              <Box className="h-3 w-3" />
              {expanded ? 'Hide 3D Booth' : 'View 3D Booth'}
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
            onClick={() => setFullscreenOpen(true)}
            title="Open in fullscreen"
          >
            <Maximize2 className="h-3 w-3" />
            Fullscreen
          </Button>
        </div>
      )}

      {inline && expanded && (
        <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-border bg-muted/30">
          {!inlineLoaded && (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
          <iframe
            key={`inline-${embedUrl}`}
            src={embedUrl}
            title={`${divisionName} 3D Booth`}
            className="w-full h-full"
            loading="lazy"
            allow="fullscreen; xr-spatial-tracking"
            onLoad={() => setInlineLoaded(true)}
          />
          <a
            href={externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-2 right-2 inline-flex items-center gap-1 px-2 py-1 rounded-md bg-background/80 backdrop-blur-sm text-xs text-foreground hover:bg-background border border-border"
          >
            <ExternalLink className="h-3 w-3" />
            Open in BoothHub
          </a>
        </div>
      )}

      <Dialog open={fullscreenOpen} onOpenChange={setFullscreenOpen}>
        <DialogContent className="max-w-[95vw] w-[95vw] h-[92vh] p-0 gap-0 flex flex-col">
          <DialogHeader className="px-5 py-3 border-b border-border flex-shrink-0">
            <DialogTitle className="flex items-center gap-2 text-base">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-lg"
                style={{ backgroundColor: color }}
              >
                <Box className="h-3.5 w-3.5 text-white" />
              </div>
              {divisionName} — 3D Booth
              <a
                href={externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
              >
                <ExternalLink className="h-3 w-3" />
                Open in BoothHub
              </a>
            </DialogTitle>
          </DialogHeader>
          <div className="relative flex-1 bg-muted/30">
            {!modalLoaded && (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            )}
            <iframe
              key={`modal-${embedUrl}`}
              src={embedUrl}
              title={`${divisionName} 3D Booth (Fullscreen)`}
              className="w-full h-full border-0"
              allow="fullscreen; xr-spatial-tracking"
              onLoad={() => setModalLoaded(true)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
