import { useEffect, useRef, useState } from 'react';
import { ExternalLink, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuditDetailLoader } from '@/components/brand/CanvaAuditSkeletons';

const AUDIT_URL = '/transperfect/dataforce-template-inventory.html';

export default function TransPerfectDataforceTemplateInventory() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [loaded, setLoaded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    document.title = 'Dataforce Template Inventory — TransPerfect';
  }, []);

  const applyTheme = (t: 'dark' | 'light') => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc?.body) return;
    doc.body.classList.toggle('light-mode', t === 'light');
  };

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const isLight = theme === 'light';

  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b bg-card/50 shrink-0">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-sm font-semibold">Dataforce — Canva Template Inventory</h1>
            <p className="text-xs text-muted-foreground">TransPerfect — shareable team report</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setTheme(isLight ? 'dark' : 'light')}
            title={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {isLight ? (
              <>
                <Moon className="h-3.5 w-3.5 mr-1.5" />
                Dark
              </>
            ) : (
              <>
                <Sun className="h-3.5 w-3.5 mr-1.5" />
                Light
              </>
            )}
          </Button>
          <Button asChild size="sm" variant="outline">
            <a href={AUDIT_URL} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
              Open in new tab
            </a>
          </Button>
          <Button asChild size="sm" variant="outline">
            <a
              href={AUDIT_URL}
              download="TransPerfect_Dataforce_Template_Inventory.html"
            >
              Download
            </a>
          </Button>
        </div>
      </div>

      <iframe
        ref={iframeRef}
        src={AUDIT_URL}
        title="Dataforce Template Inventory — TransPerfect"
        className="flex-1 w-full border-0 bg-background"
        onLoad={() => applyTheme(theme)}
      />
    </div>
  );
}
