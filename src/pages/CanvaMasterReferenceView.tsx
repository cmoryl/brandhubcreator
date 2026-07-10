import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';

const REFERENCES: Record<string, { title: string; sourceUrl: string }> = {
  'next-2026': {
    title: 'TransPerfect NEXT 2026 — Master Build Reference',
    sourceUrl: '/canva-master-reference/next-2026.html',
  },
};

export default function CanvaMasterReferenceView() {
  const { slug } = useParams<{ slug: string }>();
  const ref = slug ? REFERENCES[slug] : undefined;

  if (!ref) {
    return (
      <div className="min-h-screen bg-background p-10">
        <Link to="/canva-master-reference" className="text-primary hover:underline">
          ← Back to Canva Master Reference
        </Link>
        <p className="mt-4 text-muted-foreground">Reference not found.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <Link
          to="/canva-master-reference"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          All References
        </Link>
        <div className="text-sm font-medium text-foreground">{ref.title}</div>
        <a
          href={ref.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          Open in new tab
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
      <iframe
        title={ref.title}
        src={ref.sourceUrl}
        className="flex-1 w-full border-0"
        style={{ minHeight: 'calc(100vh - 49px)' }}
      />
    </div>
  );
}
