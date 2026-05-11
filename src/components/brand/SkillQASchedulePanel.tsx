import { useEffect, useState } from 'react';
import { Calendar, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { getQaSchedule, upsertQaSchedule, type ScheduleRow } from '@/lib/skillAdvancedClient';
import type { BrandGuide, ProductGuide } from '@/types/brand';
import type { EventGuide } from '@/types/event';

type AnyGuide = BrandGuide | ProductGuide | EventGuide;

export const SkillQASchedulePanel = ({ guide }: { guide: AnyGuide }) => {
  const kind = ((guide as any).type || 'brand') as 'brand' | 'product' | 'event';
  const [schedule, setSchedule] = useState<ScheduleRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cadence, setCadence] = useState('weekly');
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    (async () => {
      const s = await getQaSchedule(kind, guide.id);
      setSchedule(s); setCadence(s?.cadence || 'weekly'); setEnabled(s?.enabled ?? false); setLoading(false);
    })();
  }, [guide.id]);

  const save = async () => {
    setSaving(true);
    try {
      const next = await upsertQaSchedule({
        entity_type: kind, entity_id: guide.id,
        organization_id: (guide as any).organizationId || (guide as any).organization_id || null,
        cadence, enabled,
      });
      setSchedule(next);
      toast.success(enabled ? `QA scheduled ${cadence}` : 'Schedule disabled');
    } catch (e: any) { toast.error(e?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="p-4 text-sm text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin inline" /> Loading…</div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium"><Calendar className="h-4 w-4" /> Scheduled QA</div>
      <div className="rounded-md border p-3 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm">Run skill QA automatically</div>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Cadence</span>
          <Select value={cadence} onValueChange={setCadence}>
            <SelectTrigger className="w-40 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="biweekly">Bi-weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" onClick={save} disabled={saving} className="ml-auto">{saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Save'}</Button>
        </div>
        {schedule?.last_run_at && <div className="text-xs text-muted-foreground">Last run: {new Date(schedule.last_run_at).toLocaleString()}</div>}
        {schedule?.next_run_at && enabled && <div className="text-xs text-muted-foreground">Next run: {new Date(schedule.next_run_at).toLocaleString()}</div>}
      </div>
    </div>
  );
};
