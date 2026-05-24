/**
 * BrandVisualDnaPanel
 *
 * Surfaces the brand's learned visual DNA in the Imagery Hub: palette,
 * moods, photography style, prompt seed, and similarity search across
 * approved imagery. Also provides the manual "Train" trigger and the
 * auto-train preference toggle.
 */
import { useEffect, useState } from 'react';
import { Brain, Loader2, Sparkles, Wand2, Search, AlertCircle, ImageIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  useBrandVisualDna,
  type SimilarImage,
  type VisualDnaProfile,
} from '@/hooks/useBrandVisualDna';

interface Props {
  entityId: string;
  entityType: 'brand' | 'product' | 'event';
  entityName?: string;
  organizationId: string | null;
  approvedImageCount: number;
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
      {title}
    </div>
    {children}
  </div>
);

const PaletteRow = ({ dna }: { dna: VisualDnaProfile }) => {
  const palette = (dna.palette ?? []).filter((p) => !!p?.hex);
  if (!palette.length) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {palette.slice(0, 12).map((p, i) => (
        <div
          key={`${p.hex}-${i}`}
          className="flex items-center gap-1.5 rounded-full border border-border/60 bg-background px-2 py-0.5"
          title={`${p.name ?? ''} ${p.role ? `· ${p.role}` : ''}`.trim()}
        >
          <span
            className="h-3 w-3 rounded-full ring-1 ring-border/60"
            style={{ backgroundColor: p.hex }}
          />
          <span className="text-[10px] tabular-nums uppercase">{p.hex}</span>
        </div>
      ))}
    </div>
  );
};

const Chips = ({ items }: { items?: string[] }) => {
  if (!items?.length) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.slice(0, 12).map((s, i) => (
        <Badge key={`${s}-${i}`} variant="outline" className="text-[10px]">
          {s}
        </Badge>
      ))}
    </div>
  );
};

export const BrandVisualDnaPanel = ({
  entityId,
  entityType,
  entityName,
  organizationId,
  approvedImageCount,
}: Props) => {
  const {
    dna,
    promptSeed,
    sourceImageCount,
    autoTrain,
    lastTrainedAt,
    status,
    error,
    isRunning,
    loading,
    train,
    setAutoTrain,
    findSimilar,
  } = useBrandVisualDna({ entityId, entityType, organizationId });

  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [matches, setMatches] = useState<SimilarImage[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Reset search when entity changes.
  useEffect(() => {
    setQuery('');
    setMatches([]);
    setHasSearched(false);
  }, [entityId]);

  const runSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setHasSearched(true);
    try {
      const res = await findSimilar(query.trim(), 12);
      setMatches(res);
    } finally {
      setSearching(false);
    }
  };

  const hasDna = !!dna && Object.keys(dna ?? {}).length > 0;
  const trained = sourceImageCount > 0 && status === 'ok';

  return (
    <Card className="p-4 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            <Brain className="h-3.5 w-3.5" />
            <span>Brand Brain · Visual DNA</span>
          </div>
          <h3 className="mt-1 text-base font-semibold truncate">
            {entityName ?? 'Selected entity'}
          </h3>
          <p className="text-[11px] text-muted-foreground">
            {trained
              ? `Learned from ${sourceImageCount} approved image${sourceImageCount === 1 ? '' : 's'}${lastTrainedAt ? ` · ${new Date(lastTrainedAt).toLocaleDateString()}` : ''}`
              : 'Train the brain to extract palette, mood, and photography style from approved imagery.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch
              id="auto-train"
              checked={autoTrain}
              onCheckedChange={setAutoTrain}
              disabled={!organizationId}
            />
            <Label htmlFor="auto-train" className="text-[11px] text-muted-foreground cursor-pointer">
              Auto-train on add
            </Label>
          </div>
          <Button
            size="sm"
            onClick={() => void train()}
            disabled={isRunning || approvedImageCount === 0}
            className="gap-1.5"
          >
            {isRunning ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Wand2 className="h-3.5 w-3.5" />
            )}
            {isRunning ? 'Training…' : hasDna ? 'Re-train brain' : 'Train brain'}
          </Button>
        </div>
      </div>

      {/* Status / error banner */}
      {status === 'error' && error && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-2 text-[11px] text-destructive">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {status === 'empty' && (
        <div className="flex items-start gap-2 rounded-md border border-border/60 bg-muted/30 p-2 text-[11px] text-muted-foreground">
          <ImageIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>No approved imagery to learn from yet. Add images and re-train.</span>
        </div>
      )}

      {/* DNA summary */}
      {hasDna && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="space-y-3">
            <Section title="Palette">
              <PaletteRow dna={dna!} />
            </Section>
            <Section title="Moods">
              <Chips items={dna?.moods} />
            </Section>
            <Section title="Subject matter">
              <Chips items={dna?.subject_matter} />
            </Section>
            <Section title="Signature motifs">
              <Chips items={dna?.signature_motifs} />
            </Section>
          </div>
          <div className="space-y-3">
            <Section title="Photography style">
              <p className="text-xs text-foreground">{dna?.photography_style || '—'}</p>
            </Section>
            <Section title="Lighting">
              <p className="text-xs text-foreground">{dna?.lighting || '—'}</p>
            </Section>
            <Section title="Composition">
              <p className="text-xs text-foreground">{dna?.composition || '—'}</p>
            </Section>
            {promptSeed && (
              <Section title="Prompt seed">
                <div className="rounded-md border border-border/60 bg-muted/30 p-2 text-xs italic text-foreground">
                  <Sparkles className="mr-1 inline h-3 w-3 align-text-bottom text-primary" />
                  {promptSeed}
                </div>
              </Section>
            )}
          </div>
        </div>
      )}

      {/* Do / Don't */}
      {hasDna && (dna?.do_patterns?.length || dna?.dont_patterns?.length) ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Section title="Do">
            <ul className="space-y-1 text-[11px] text-foreground">
              {(dna?.do_patterns ?? []).slice(0, 6).map((d, i) => (
                <li key={i} className="flex gap-1.5">
                  <span className="text-primary">+</span>
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </Section>
          <Section title="Don't">
            <ul className="space-y-1 text-[11px] text-foreground">
              {(dna?.dont_patterns ?? []).slice(0, 6).map((d, i) => (
                <li key={i} className="flex gap-1.5">
                  <span className="text-destructive">−</span>
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </Section>
        </div>
      ) : null}

      {/* Similarity search */}
      {trained && (
        <div className="border-t border-border/60 pt-3 space-y-2">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Find similar approved imagery
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && runSearch()}
                placeholder="e.g. golden hour portrait, warm tones…"
                className="pl-8"
                disabled={searching}
              />
            </div>
            <Button size="sm" onClick={runSearch} disabled={searching || !query.trim()} className="gap-1.5">
              {searching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
              Search
            </Button>
          </div>
          {hasSearched && (
            matches.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">No matches.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                {matches.map((m) => (
                  <div
                    key={m.id}
                    className="group relative aspect-square overflow-hidden rounded-md border border-border/60 bg-muted/40"
                    title={m.caption ?? ''}
                  >
                    <img
                      src={m.image_url}
                      alt={m.caption ?? 'Approved image'}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                    <span className="absolute right-1 top-1 rounded bg-background/85 px-1 text-[9px] font-semibold tabular-nums shadow">
                      {Math.round(m.similarity * 100)}
                    </span>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      )}

      {loading && !row_is_visible_hint(hasDna) && (
        <p className="text-[11px] text-muted-foreground">Loading visual DNA…</p>
      )}
    </Card>
  );
};

// Tiny helper to avoid an extra useMemo just to skip a loading line.
function row_is_visible_hint(hasDna: boolean) { return hasDna; }
