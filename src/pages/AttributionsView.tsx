/**
 * AttributionsView — lists every bundled icon pack with license, author,
 * source link, and bundled count. Surfaces CC-BY / SIL OFL / CC-BY-SA
 * attribution requirements in-app for compliance.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { loadManifest } from '@/lib/iconLibrary/loader';
import type { IconLibraryManifest } from '@/lib/iconLibrary/types';
import { useSEO } from '@/hooks/useSEO';

const AttributionsView = () => {
  const navigate = useNavigate();
  const [manifest, setManifest] = useState<IconLibraryManifest | null>(null);
  useSEO({
    title: 'Icon Library Attributions — BrandHub',
    description: 'Licenses and attributions for all bundled icon packs.',
  });

  useEffect(() => {
    loadManifest().then(setManifest).catch(() => {});
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Icon Library Attributions</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {manifest
            ? `${manifest.totalIcons.toLocaleString()} icons across ${manifest.packs.length} permissive packs.`
            : 'Loading…'}
        </p>
        <p className="text-xs text-muted-foreground mt-2 max-w-2xl">
          Every bundled pack ships under a permissive license. Attribution-required packs (CC-BY,
          CC-BY-SA, SIL OFL) are credited below per their license terms.
        </p>
      </header>

      <div className="space-y-3">
        {manifest?.packs.map((p) => (
          <div key={p.id} className="tp-card p-4 flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold">{p.name}</h2>
                <Badge variant="outline" className="text-[10px]">{p.license}</Badge>
                <Badge variant="secondary" className="text-[10px] tabular-nums">{p.count.toLocaleString()} icons</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">by {p.author}</p>
            </div>
            <a
              href={p.url}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Visit source <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AttributionsView;
