/**
 * LogoDownloadActivity - Lightweight viewer for logo link download events
 * Route: /activity/logo-downloads/:entityType/:entityId
 */

import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Monitor, Smartphone, Tablet, RefreshCw, ExternalLink, FileDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { formatDistanceToNow } from 'date-fns';

type EntityType = 'brand' | 'product' | 'event';

interface LogoDownloadLog {
  id: string;
  created_at: string;
  user_email: string | null;
  entity_name: string | null;
  browser: string | null;
  device_type: string | null;
  details: Record<string, unknown> | null;
}

const DeviceIcon = ({ device }: { device?: string | null }) => {
  if (device === 'mobile') return <Smartphone className="h-3.5 w-3.5" />;
  if (device === 'tablet') return <Tablet className="h-3.5 w-3.5" />;
  return <Monitor className="h-3.5 w-3.5" />;
};

export default function LogoDownloadActivity() {
  const { entityType, entityId } = useParams<{ entityType: EntityType; entityId: string }>();
  const navigate = useNavigate();
  const [logs, setLogs] = useState<LogoDownloadLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [entityName, setEntityName] = useState<string>('');

  const fetchLogs = async () => {
    if (!entityId) return;
    setLoading(true);

    // Resolve entity display name
    const table = entityType === 'product' ? 'products' : entityType === 'event' ? 'events' : 'brands';
    const { data: ent } = await supabase
      .from(table)
      .select('name')
      .eq('id', entityId)
      .maybeSingle();
    if (ent?.name) setEntityName(ent.name);

    // Server-side filter: scoped to entity (brand_id+entity_type) AND logo download events
    // (details->>download_type = 'logo' OR details->>source_section = 'logo_download_links')
    const { data, error } = await supabase
      .from('audit_logs')
      .select('id, created_at, user_email, entity_name, browser, device_type, details')
      .eq('brand_id', entityId)
      .eq('entity_type', entityType || 'brand')
      .eq('action_type', 'export')
      .or('details->>download_type.eq.logo,details->>source_section.eq.logo_download_links')
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) {
      console.error('Failed to load logo download activity:', error);
      setLogs([]);
    } else {
      setLogs((data || []) as LogoDownloadLog[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityId, entityType]);

  const filtered = useMemo(() => {
    if (!search.trim()) return logs;
    const q = search.toLowerCase();
    return logs.filter(l => {
      const d = (l.details as Record<string, unknown>) || {};
      return (
        l.user_email?.toLowerCase().includes(q) ||
        String(d.logo_name || '').toLowerCase().includes(q) ||
        String(d.file_name || '').toLowerCase().includes(q) ||
        String(d.format || '').toLowerCase().includes(q)
      );
    });
  }, [logs, search]);

  const stats = useMemo(() => {
    const uniqueUsers = new Set(logs.map(l => l.user_email).filter(Boolean));
    const uniqueLogos = new Set(logs.map(l => String((l.details as Record<string, unknown>)?.logo_id || '')).filter(Boolean));
    return { total: logs.length, uniqueUsers: uniqueUsers.size, uniqueLogos: uniqueLogos.size };
  }, [logs]);

  const handleExportCsv = () => {
    const rows = filtered;
    if (rows.length === 0) return;

    const headers = [
      'Timestamp (ISO)',
      'Timestamp (Local)',
      'User',
      'Entity Type',
      'Entity Name',
      'Logo Name',
      'Logo ID',
      'Link Label',
      'Format',
      'Link URL',
      'Browser',
      'Device',
    ];

    const escape = (val: unknown): string => {
      const s = val == null ? '' : String(val);
      if (s === '') return '';
      // Prefix risky chars to prevent CSV formula injection
      const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
      if (/[",\n\r]/.test(safe)) return `"${safe.replace(/"/g, '""')}"`;
      return safe;
    };

    const lines = [headers.join(',')];
    for (const log of rows) {
      const d = (log.details as Record<string, unknown>) || {};
      lines.push([
        log.created_at,
        new Date(log.created_at).toLocaleString(),
        log.user_email || 'Anonymous',
        entityType || '',
        entityName || log.entity_name || '',
        d.logo_name || '',
        d.logo_id || '',
        d.file_name || '',
        d.format || '',
        d.link_url || '',
        log.browser || '',
        log.device_type || '',
      ].map(escape).join(','));
    }

    const csv = '\uFEFF' + lines.join('\n'); // BOM for Excel UTF-8
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeName = (entityName || entityType || 'activity').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
    const stamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `logo-downloads-${safeName}-${stamp}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl py-8 space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </button>
            <h1 className="text-3xl font-bold tracking-tight">Logo Download Activity</h1>
            <p className="text-muted-foreground text-sm">
              {entityName ? <>Activity log for <span className="font-medium text-foreground">{entityName}</span></> : 'Lightweight log of logo link downloads'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button size="sm" onClick={handleExportCsv} disabled={loading || filtered.length === 0}>
              <FileDown className="h-3.5 w-3.5 mr-1.5" />
              Export CSV
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardDescription>Total downloads</CardDescription></CardHeader>
            <CardContent><p className="text-3xl font-bold">{stats.total}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardDescription>Unique users</CardDescription></CardHeader>
            <CardContent><p className="text-3xl font-bold">{stats.uniqueUsers}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardDescription>Logos downloaded</CardDescription></CardHeader>
            <CardContent><p className="text-3xl font-bold">{stats.uniqueLogos}</p></CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <CardTitle className="flex items-center gap-2"><Download className="h-4 w-4" /> Recent downloads</CardTitle>
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by user, logo, file, or format…"
                className="max-w-sm h-9"
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                {logs.length === 0 ? 'No logo downloads logged yet.' : 'No results match your search.'}
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filtered.map(log => {
                  const d = (log.details as Record<string, unknown>) || {};
                  const logoName = String(d.logo_name || 'Unknown logo');
                  const fileName = String(d.file_name || '');
                  const format = String(d.format || '');
                  const url = String(d.link_url || '');
                  return (
                    <div key={log.id} className="py-3 flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{logoName}</span>
                          {format && <Badge variant="secondary" className="text-[10px]">{format}</Badge>}
                          {fileName && <span className="text-xs text-muted-foreground truncate">— {fileName}</span>}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                          <span>{log.user_email || 'Anonymous'}</span>
                          <span className="inline-flex items-center gap-1"><DeviceIcon device={log.device_type} /> {log.browser || 'Unknown'}</span>
                          <span title={new Date(log.created_at).toLocaleString()}>
                            {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                          </span>
                          {url && (
                            <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                              <ExternalLink className="h-3 w-3" /> Source
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
