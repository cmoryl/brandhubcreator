import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

const GUIDE_URL = '/knowledge/claude-for-designers.html';

export default function ClaudeForDesigners() {
  useEffect(() => {
    document.title = 'Claude for Designers — Knowledge Base';
  }, []);

  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b bg-card/50 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            to="/knowledge"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Knowledge Base
          </Link>
          <div className="hidden sm:block">
            <h1 className="text-sm font-semibold">Claude for Designers</h1>
            <p className="text-xs text-muted-foreground">A practical guide for design teams</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="outline">
            <a href={GUIDE_URL} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
              Open in new tab
            </a>
          </Button>
          <Button asChild size="sm" variant="outline">
            <a href={GUIDE_URL} download="Claude-for-Designers.html">
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Download
            </a>
          </Button>
        </div>
      </div>

      <iframe
        src={GUIDE_URL}
        title="Claude for Designers"
        className="flex-1 w-full border-0 bg-background"
      />
    </div>
  );
}
