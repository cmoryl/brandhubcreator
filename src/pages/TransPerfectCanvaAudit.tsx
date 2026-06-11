import { useEffect } from 'react';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

const AUDIT_URL = '/transperfect/canva-audit.html';

export default function TransPerfectCanvaAudit() {
  useEffect(() => {
    document.title = 'Canva Master Registry + Audit — TransPerfect';
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <div className="flex items-center justify-between gap-3 px-4 py-2 border-b bg-card/50">
        <div>
          <h1 className="text-sm font-semibold">Canva Master Registry + Audit</h1>
          <p className="text-xs text-muted-foreground">TransPerfect — shareable team report</p>
        </div>
        <div className="flex items-center gap-2">
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
      <iframe
        src={AUDIT_URL}
        title="Canva Master Registry + Audit — TransPerfect"
        className="flex-1 w-full border-0 bg-background"
      />
    </div>
  );
}
