/**
 * PostShowDataImport — CSV/Excel import for post-show booth analytics data.
 * Parses uploaded spreadsheets and maps columns to booth analytics fields.
 */
import { useState, useCallback, useRef } from 'react';
import {
  Upload, FileSpreadsheet, Check, AlertCircle, X, Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { BoothAnalyticsRecord } from '@/hooks/useBoothAnalytics';

/* ─── Column mapping targets ──────────────── */

const ANALYTICS_FIELDS: { key: string; label: string; type: 'number' | 'text' }[] = [
  { key: 'event_name', label: 'Event Name', type: 'text' },
  { key: 'event_date', label: 'Event Date', type: 'text' },
  { key: 'actual_leads_captured', label: 'Leads Captured', type: 'number' },
  { key: 'actual_demos_given', label: 'Demos Given', type: 'number' },
  { key: 'actual_traffic_estimate', label: 'Total Traffic', type: 'number' },
  { key: 'actual_peak_visitors', label: 'Peak Visitors', type: 'number' },
  { key: 'actual_dwell_time_seconds', label: 'Avg Dwell Time (sec)', type: 'number' },
  { key: 'actual_engagement_rate', label: 'Engagement Rate (%)', type: 'number' },
  { key: 'notes', label: 'Notes', type: 'text' },
];

interface PostShowDataImportProps {
  onImport: (data: Partial<BoothAnalyticsRecord>) => void;
  isAdmin: boolean;
}

/** Parse CSV text into rows of string arrays */
function parseCSV(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  return lines.map(line => {
    const cells: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        cells.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    cells.push(current.trim());
    return cells;
  });
}

/** Auto-detect column mapping from header names */
function autoMapColumns(headers: string[]): Record<number, string> {
  const mapping: Record<number, string> = {};
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

  const patterns: [string, string[]][] = [
    ['event_name', ['eventname', 'event', 'showname', 'show']],
    ['event_date', ['eventdate', 'date', 'showdate']],
    ['actual_leads_captured', ['leads', 'leadscaptured', 'totalleads', 'leadcount']],
    ['actual_demos_given', ['demos', 'demosgiven', 'democount']],
    ['actual_traffic_estimate', ['traffic', 'totaltraffic', 'foottraffic', 'visitors', 'totalvisitors']],
    ['actual_peak_visitors', ['peakvisitors', 'peak', 'maxvisitors']],
    ['actual_dwell_time_seconds', ['dwelltime', 'avgdwell', 'dwelltimeseconds', 'dwellsec']],
    ['actual_engagement_rate', ['engagementrate', 'engagement', 'engagementpct']],
    ['notes', ['notes', 'comments', 'observations', 'feedback']],
  ];

  headers.forEach((h, idx) => {
    const norm = normalize(h);
    for (const [field, aliases] of patterns) {
      if (aliases.some(a => norm.includes(a))) {
        mapping[idx] = field;
        break;
      }
    }
  });
  return mapping;
}

export function PostShowDataImport({ onImport, isAdmin }: PostShowDataImportProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [parsedRows, setParsedRows] = useState<string[][] | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<number, string>>({});
  const [importing, setImporting] = useState(false);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isCSV = file.name.endsWith('.csv') || file.type === 'text/csv';
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    if (!isCSV && !isExcel) {
      toast.error('Please upload a CSV or Excel (.xlsx) file');
      return;
    }

    try {
      if (isCSV) {
        const text = await file.text();
        const rows = parseCSV(text);
        if (rows.length < 2) {
          toast.error('File must have a header row and at least one data row');
          return;
        }
        setHeaders(rows[0]);
        setParsedRows(rows.slice(1));
        setColumnMapping(autoMapColumns(rows[0]));
      } else {
        // Excel — use xlsx library (already installed)
        const { read, utils } = await import('xlsx');
        const buffer = await file.arrayBuffer();
        const wb = read(buffer, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data: string[][] = utils.sheet_to_json(ws, { header: 1 }) as string[][];
        if (data.length < 2) {
          toast.error('Spreadsheet must have a header row and at least one data row');
          return;
        }
        setHeaders(data[0].map(String));
        setParsedRows(data.slice(1).map(r => r.map(String)));
        setColumnMapping(autoMapColumns(data[0].map(String)));
      }
      toast.success(`Parsed ${file.name}`);
    } catch (err) {
      console.error('File parse error:', err);
      toast.error('Failed to parse file');
    }

    if (fileRef.current) fileRef.current.value = '';
  }, []);

  const handleImport = useCallback(() => {
    if (!parsedRows || parsedRows.length === 0) return;
    setImporting(true);

    try {
      // Use the first data row (or aggregate if multiple rows)
      const row = parsedRows[0];
      const result: Record<string, any> = {};

      for (const [colIdx, field] of Object.entries(columnMapping)) {
        const val = row[Number(colIdx)];
        if (!val || val === '') continue;
        const fieldDef = ANALYTICS_FIELDS.find(f => f.key === field);
        if (fieldDef?.type === 'number') {
          const num = parseFloat(val.replace(/[,%$]/g, ''));
          if (!isNaN(num)) result[field] = num;
        } else {
          result[field] = val;
        }
      }

      // If multiple rows, try to build traffic-by-hour from them
      if (parsedRows.length > 1) {
        const hourCol = Object.entries(columnMapping).find(([, f]) => f === 'event_date')?.[0];
        const trafficCol = Object.entries(columnMapping).find(([, f]) => f === 'actual_traffic_estimate')?.[0];
        if (hourCol != null && trafficCol != null) {
          const hourlyData = parsedRows.slice(0, 24).map(r => ({
            hour: String(r[Number(hourCol)] || ''),
            count: parseInt(String(r[Number(trafficCol)] || '0'), 10) || 0,
          })).filter(d => d.hour);
          if (hourlyData.length > 1) {
            result.traffic_by_hour = hourlyData;
            // Sum traffic
            result.actual_traffic_estimate = hourlyData.reduce((s, d) => s + d.count, 0);
          }
        }
      }

      onImport(result);
      setParsedRows(null);
      setHeaders([]);
      setColumnMapping({});
      toast.success('Post-show data imported successfully');
    } catch (err) {
      toast.error('Import failed');
    } finally {
      setImporting(false);
    }
  }, [parsedRows, columnMapping, onImport]);

  const handleDownloadTemplate = useCallback(() => {
    const csv = [
      'Event Name,Event Date,Leads Captured,Demos Given,Total Traffic,Peak Visitors,Avg Dwell Time (sec),Engagement Rate (%),Notes',
      'EXHIBITORLIVE 2026,2026-03-15,147,42,2850,45,195,68.5,Great booth traffic this year',
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'booth-post-show-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const mappedCount = Object.keys(columnMapping).length;

  if (!isAdmin) return null;

  return (
    <div className="space-y-3">
      <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFileSelect} />

      {!parsedRows ? (
        <div className="flex items-center gap-2">
          <Button
            variant="outline" size="sm"
            className="h-7 text-[10px] gap-1.5"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="h-3 w-3" /> Import CSV / Excel
          </Button>
          <Button
            variant="ghost" size="sm"
            className="h-7 text-[10px] gap-1 text-muted-foreground"
            onClick={handleDownloadTemplate}
          >
            <Download className="h-3 w-3" /> Template
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border bg-card p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold">Map Columns</span>
              <Badge variant="secondary" className="text-[9px]">
                {parsedRows.length} row{parsedRows.length > 1 ? 's' : ''} · {headers.length} columns
              </Badge>
            </div>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => { setParsedRows(null); setHeaders([]); }}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>

          <ScrollArea className="max-h-[200px]">
            <div className="space-y-2">
              {headers.map((h, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-[10px] font-medium w-28 truncate text-muted-foreground" title={h}>
                    {h}
                  </span>
                  <span className="text-[9px] text-muted-foreground/60 w-16 truncate">
                    {parsedRows[0]?.[idx] || '—'}
                  </span>
                  <Select
                    value={columnMapping[idx] || '_skip'}
                    onValueChange={(v) => setColumnMapping(prev => {
                      const next = { ...prev };
                      if (v === '_skip') delete next[idx];
                      else next[idx] = v;
                      return next;
                    })}
                  >
                    <SelectTrigger className="h-6 text-[10px] w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_skip" className="text-[10px]">Skip</SelectItem>
                      {ANALYTICS_FIELDS.map(f => (
                        <SelectItem key={f.key} value={f.key} className="text-[10px]">{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {columnMapping[idx] && (
                    <Check className="h-3 w-3 text-primary shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="flex items-center justify-between pt-1">
            <span className={cn(
              "text-[10px]",
              mappedCount > 0 ? "text-primary" : "text-muted-foreground"
            )}>
              {mappedCount} field{mappedCount !== 1 ? 's' : ''} mapped
            </span>
            <Button
              size="sm" className="h-7 text-[10px] gap-1"
              disabled={mappedCount === 0 || importing}
              onClick={handleImport}
            >
              {importing ? <AlertCircle className="h-3 w-3 animate-pulse" /> : <Check className="h-3 w-3" />}
              Import Data
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
