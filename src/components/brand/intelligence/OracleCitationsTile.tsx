/**
 * Surfaces top oracle_knowledge_base entries into the Brand Intelligence panel.
 * Makes KB visible outside the Oracle chat and gives a click-through to deep-dive.
 */
import { useEffect, useState } from 'react';
import { BookOpen, ExternalLink, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface KbEntry {
  id: string;
  title: string;
  content: string;
  content_type: string | null;
  source_type: string | null;
  tags: string[] | null;
  created_at: string;
}

interface Props {
  entityId?: string | null;
  entityType?: string | null;
  organizationId?: string | null;
}

export function OracleCitationsTile({ entityId, entityType, organizationId }: Props) {
  const [entries, setEntries] = useState<KbEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!organizationId) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        let q = supabase
          .from('oracle_knowledge_base')
          .select('id, title, content, content_type, source_type, tags, created_at')
          .eq('organization_id', organizationId)
          .order('created_at', { ascending: false })
          .limit(20);

        const { data } = await q;
        let rows = (data || []) as KbEntry[];

        if (entityId) {
          // Prefer entries tagged with this entity, but always fall back to org-level.
          const tagged = rows.filter(r => (r as any).source_entity_id === entityId);
          rows = tagged.length ? [...tagged, ...rows.filter(r => !tagged.includes(r))] : rows;
        }

        if (!cancelled) setEntries(rows.slice(0, 5));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [organizationId, entityId]);

  if (!organizationId) return null;
  if (!loading && entries.length === 0) return null;

  return (
    <Card className="border-violet-500/20 bg-violet-500/[0.02]">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-violet-500" />
          Oracle Knowledge Base
          <Badge variant="outline" className="ml-auto text-[10px]">{entries.length} cited</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-4 text-muted-foreground text-xs">
            <Loader2 className="h-3 w-3 animate-spin mr-2" /> Loading…
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map(e => (
              <div key={e.id} className="p-2 rounded-md border bg-card text-xs">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium truncate flex-1">{e.title}</span>
                  {e.source_type && (
                    <Badge variant="outline" className="text-[10px] py-0">{e.source_type}</Badge>
                  )}
                </div>
                <p className="text-muted-foreground line-clamp-2">{e.content?.slice(0, 200)}</p>
                {e.tags && e.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {e.tags.slice(0, 4).map((t, i) => (
                      <Badge key={i} variant="secondary" className="text-[9px] py-0">{t}</Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs h-7 mt-1"
              onClick={() => navigate('/oracle')}
            >
              Open Oracle <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
