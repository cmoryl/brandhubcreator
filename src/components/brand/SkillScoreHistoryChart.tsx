import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';
import type { SkillQAHistoryRow } from '@/lib/skillQAClient';

const TIER_COLOR: Record<string, string> = {
  haiku: 'hsl(var(--chart-1, 142 71% 45%))',
  sonnet: 'hsl(var(--chart-2, 38 92% 50%))',
  opus: 'hsl(var(--chart-3, 217 91% 60%))',
};
const TIER_LABEL: Record<string, string> = {
  haiku: 'Haiku',
  sonnet: 'Sonnet',
  opus: 'Opus',
};

export const SkillScoreHistoryChart = ({ history }: { history: SkillQAHistoryRow[] }) => {
  const data = useMemo(() => {
    // Oldest → newest so the line reads left to right.
    return [...history].reverse().map((h, i) => {
      const t = new Date(h.created_at);
      return {
        idx: i + 1,
        label: `${t.getMonth() + 1}/${t.getDate()} ${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`,
        haiku: Number(h.avg_score_by_tier?.haiku ?? 0) || null,
        sonnet: Number(h.avg_score_by_tier?.sonnet ?? 0) || null,
        opus: Number(h.avg_score_by_tier?.opus ?? 0) || null,
      };
    });
  }, [history]);

  if (data.length < 2) {
    return (
      <p className="text-xs text-muted-foreground p-3 border rounded-md">
        Score history will chart here after at least two QA runs.
      </p>
    );
  }

  return (
    <div className="rounded-md border p-3">
      <div className="text-xs font-medium mb-2">Score over time (per tier)</div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
            <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={{ fontSize: 11 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <ReferenceLine y={80} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
            {(['haiku', 'sonnet', 'opus'] as const).map((tier) => (
              <Line
                key={tier}
                type="monotone"
                dataKey={tier}
                name={TIER_LABEL[tier]}
                stroke={TIER_COLOR[tier]}
                strokeWidth={2}
                dot={{ r: 2 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
