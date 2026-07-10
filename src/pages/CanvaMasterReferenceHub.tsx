import { ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ReferenceEntry {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  brand: string;
  updatedAt: string;
  href: string; // internal viewer route
  sourceUrl: string; // raw html
}

const REFERENCES: ReferenceEntry[] = [
  {
    slug: 'next-2026',
    title: 'TransPerfect NEXT 2026',
    subtitle: 'Master Build Reference',
    description:
      'Live master reference for the TransPerfect NEXT 2026 event and all sub-events — canonical build spec used by internal and external Canva production teams.',
    brand: 'TransPerfect',
    updatedAt: '2026-07-10',
    href: '/canva-master-reference/next-2026',
    sourceUrl: '/canva-master-reference/next-2026.html',
  },
];

export default function CanvaMasterReferenceHub() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <header className="mb-10">
          <Badge variant="outline" className="mb-3">Canva Production</Badge>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Canva Master Reference
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Publishable, single-source-of-truth references for our live Canva
            events and campaign systems. Share these links with external
            production partners so every sub-event stays on spec.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          {REFERENCES.map((r) => (
            <Card key={r.slug} className="group p-6 transition hover:border-primary/50">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2 text-primary">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">
                      {r.brand}
                    </div>
                    <h2 className="text-lg font-semibold text-foreground">
                      {r.title}
                    </h2>
                    <div className="text-sm text-muted-foreground">{r.subtitle}</div>
                  </div>
                </div>
                <Badge variant="secondary" className="whitespace-nowrap">
                  Updated {r.updatedAt}
                </Badge>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">{r.description}</p>
              <div className="mt-5 flex gap-2">
                <Link
                  to={r.href}
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Open Reference
                </Link>
                <a
                  href={r.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Raw HTML
                </a>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
