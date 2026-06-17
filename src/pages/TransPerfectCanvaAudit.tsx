import { useEffect, useRef, useState } from 'react';
import { ExternalLink, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuditDetailLoader } from '@/components/brand/CanvaAuditSkeletons';
import { useBrandContextBySlug } from '@/hooks/useBrandContextBySlug';
import { useCanvaAuditAutoSync } from '@/hooks/useCanvaAuditAnalyses';

const AUDIT_URL = '/transperfect/canva-audit.html';

export default function TransPerfectCanvaAudit() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [loaded, setLoaded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const { brandId, organizationId } = useBrandContextBySlug('transperfect');
  useCanvaAuditAutoSync(
    organizationId
      ? { brandSlug: 'transperfect', brandId, organizationId, auditSlug: 'transperfect-canva-audit' }
      : null,
  );

  useEffect(() => {
    document.title = 'Canva Master Registry + Audit — TransPerfect';
  }, []);

  // Apply the theme class inside the iframe's <body> whenever it changes
  // or when the iframe finishes loading.
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
      {/* Header bar */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b bg-card/50 shrink-0">
        <div className="flex items-center gap-3">

          <div>
            <h1 className="text-sm font-semibold">Canva Master Registry + Audit</h1>
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
              download="Canva_Master_Registry_Audit_TransPerfect.html"
            >
              Download
            </a>
          </Button>
        </div>
      </div>

      <AuditDetailLoader loaded={loaded}>
        <iframe
          ref={iframeRef}
          src={AUDIT_URL}
          title="Canva Master Registry + Audit — TransPerfect"
          className="absolute inset-0 h-full w-full border-0 bg-background"
          onLoad={() => {
            applyTheme(theme);
            setLoaded(true);
          }}
        />
      </AuditDetailLoader>
    </div>
  );
}
