/**
 * CrowdSimulationPanel - Results UI panel showing crowd simulation insights
 */
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Eye, MapPin, Clock, Users, AlertTriangle, Lightbulb,
  Target, ArrowRight, Loader2, BarChart3, Zap, Route
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CrowdSimulationData, Optimization } from './crowdSimulationTypes';

interface CrowdSimulationPanelProps {
  data: CrowdSimulationData | null;
  isLoading: boolean;
  onRunSimulation: () => void;
  onClose: () => void;
}

function ScoreGauge({ score, label, size = 'md' }: { score: number; label: string; size?: 'sm' | 'md' }) {
  const color = score >= 80 ? 'text-green-500' : score >= 60 ? 'text-yellow-500' : score >= 40 ? 'text-orange-500' : 'text-red-500';
  const bgColor = score >= 80 ? 'bg-green-500/10' : score >= 60 ? 'bg-yellow-500/10' : score >= 40 ? 'bg-orange-500/10' : 'bg-red-500/10';
  
  return (
    <div className={cn("flex flex-col items-center gap-1 rounded-lg p-2", bgColor)}>
      <span className={cn("font-bold tabular-nums", color, size === 'md' ? 'text-2xl' : 'text-lg')}>
        {score}
      </span>
      <span className="text-[10px] text-muted-foreground font-medium">{label}</span>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    high: 'bg-red-500/15 text-red-400 border-red-500/30',
    medium: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    low: 'bg-green-500/15 text-green-400 border-green-500/30',
  };
  return (
    <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-semibold border", colors[priority] || colors.medium)}>
      {priority.toUpperCase()}
    </span>
  );
}

function CategoryIcon({ category }: { category: Optimization['category'] }) {
  const icons: Record<string, string> = {
    'tv-placement': '📺',
    'demo-station': '🖥️',
    'product-shelf': '📦',
    'reception': '🏪',
    'seating': '🪑',
    'signage': '🪧',
    'traffic-flow': '🚶',
  };
  return <span className="text-sm">{icons[category] || '💡'}</span>;
}

export function CrowdSimulationPanel({ data, isLoading, onRunSimulation, onClose }: CrowdSimulationPanelProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'zones' | 'queues' | 'optimize'>('overview');

  if (!data && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
          <BarChart3 className="h-7 w-7 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-sm">AI Crowd Simulation</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">
            Simulate attendee behavior, traffic patterns, and optimize booth layout with AI-powered analysis.
          </p>
        </div>
        <Button onClick={onRunSimulation} size="sm" className="gap-1.5 mt-1">
          <Zap className="h-3.5 w-3.5" />
          Run Simulation
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <div>
          <h3 className="font-semibold text-sm">Simulating Crowd Behavior</h3>
          <p className="text-xs text-muted-foreground mt-1">Analyzing traffic patterns, sightlines, and engagement zones...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const avgSightlineScore = data.sightlines?.length
    ? Math.round(data.sightlines.reduce((s, sl) => s + sl.score, 0) / data.sightlines.length)
    : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          <span className="font-semibold text-xs">Crowd Simulation</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={onRunSimulation} disabled={isLoading}>
            Rerun
          </Button>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onClose}>×</Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {(['overview', 'zones', 'queues', 'optimize'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 px-2 py-1.5 text-[10px] font-medium transition-colors",
              activeTab === tab
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab === 'overview' ? 'Overview' : tab === 'zones' ? 'Zones' : tab === 'queues' ? 'Queues' : 'Optimize'}
          </button>
        ))}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {activeTab === 'overview' && (
            <>
              {/* Top scores */}
              <div className="grid grid-cols-3 gap-2">
                <ScoreGauge score={data.visibilityScore} label="Visibility" />
                <ScoreGauge score={avgSightlineScore} label="Sightlines" />
                <ScoreGauge score={Math.min(100, data.peakCapacity * 8)} label="Capacity" />
              </div>

              {/* Summary */}
              <p className="text-xs text-muted-foreground leading-relaxed">{data.summary}</p>

              <Separator />

              {/* Quick stats */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 rounded-md bg-muted/50 px-2 py-1.5">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <div>
                    <div className="text-xs font-medium">{data.overallDwellTime}</div>
                    <div className="text-[9px] text-muted-foreground">Avg Dwell</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-md bg-muted/50 px-2 py-1.5">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  <div>
                    <div className="text-xs font-medium">{data.peakCapacity} people</div>
                    <div className="text-[9px] text-muted-foreground">Peak Cap.</div>
                  </div>
                </div>
              </div>

              {/* Sightlines */}
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Eye className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Sightlines</span>
                </div>
                <div className="space-y-1">
                  {data.sightlines?.map((sl, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground w-16 truncate">{sl.from}</span>
                      <Progress value={sl.score} className="flex-1 h-1.5" />
                      <span className={cn(
                        "text-[10px] font-mono w-7 text-right",
                        sl.score >= 70 ? 'text-green-500' : sl.score >= 40 ? 'text-yellow-500' : 'text-red-500'
                      )}>{sl.score}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'zones' && (
            <>
              {/* High visibility */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Target className="h-3 w-3 text-green-500" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-green-500">High Visibility</span>
                </div>
                <div className="space-y-1.5">
                  {data.highVisibilityZones?.map((zone, i) => (
                    <div key={i} className="rounded-md bg-green-500/5 border border-green-500/20 px-2 py-1.5">
                      <div className="text-xs font-medium text-foreground">{zone.name}</div>
                      <div className="text-[10px] text-muted-foreground">{zone.description}</div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Dead zones */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <AlertTriangle className="h-3 w-3 text-red-500" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-red-500">Dead Zones</span>
                </div>
                <div className="space-y-1.5">
                  {data.deadZones?.map((zone, i) => (
                    <div key={i} className="rounded-md bg-red-500/5 border border-red-500/20 px-2 py-1.5">
                      <div className="text-xs font-medium text-foreground">{zone.name}</div>
                      <div className="text-[10px] text-muted-foreground">{zone.description}</div>
                      <div className="flex items-center gap-1 mt-1">
                        <Lightbulb className="h-2.5 w-2.5 text-yellow-500" />
                        <span className="text-[9px] text-yellow-500">{zone.suggestion}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Engagement zones */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <MapPin className="h-3 w-3 text-purple-500" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-500">Engagement Zones</span>
                </div>
                <div className="space-y-1.5">
                  {data.engagementZones?.map((zone, i) => (
                    <div key={i} className="flex items-center justify-between rounded-md bg-purple-500/5 border border-purple-500/20 px-2 py-1.5">
                      <div>
                        <div className="text-xs font-medium text-foreground">{zone.name}</div>
                        <Badge variant="outline" className="text-[8px] px-1 py-0 h-4 mt-0.5">{zone.type}</Badge>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-medium">{zone.estimatedDwellTime}</div>
                        <div className="text-[9px] text-muted-foreground">~{zone.avgCrowdSize} people</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'queues' && (
            <>
              <div className="flex items-center gap-1.5 mb-2">
                <Route className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Queue Predictions</span>
              </div>
              <div className="space-y-2">
                {data.queuePredictions?.map((q, i) => (
                  <div key={i} className="rounded-md border border-border bg-muted/30 px-2.5 py-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium">{q.location}</span>
                      <span className={cn(
                        "px-1.5 py-0.5 rounded text-[9px] font-semibold",
                        q.bottleneckRisk === 'high' ? 'bg-red-500/15 text-red-400' :
                        q.bottleneckRisk === 'medium' ? 'bg-yellow-500/15 text-yellow-400' :
                        'bg-green-500/15 text-green-400'
                      )}>
                        {q.bottleneckRisk} risk
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                      <span>⏱ Peak wait: {q.peakWaitTime}</span>
                      <span>👥 Avg queue: {q.avgQueueLength}</span>
                    </div>
                  </div>
                ))}
                {(!data.queuePredictions || data.queuePredictions.length === 0) && (
                  <p className="text-xs text-muted-foreground text-center py-4">No queue bottlenecks predicted</p>
                )}
              </div>
            </>
          )}

          {activeTab === 'optimize' && (
            <>
              <div className="flex items-center gap-1.5 mb-2">
                <Lightbulb className="h-3 w-3 text-amber-500" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-500">Optimizations</span>
              </div>
              <div className="space-y-2">
                {data.optimizations?.sort((a, b) => {
                  const order = { high: 0, medium: 1, low: 2 };
                  return (order[a.priority] ?? 1) - (order[b.priority] ?? 1);
                }).map((opt, i) => (
                  <div key={i} className="rounded-md border border-border bg-muted/30 px-2.5 py-2">
                    <div className="flex items-center gap-2 mb-1">
                      <CategoryIcon category={opt.category} />
                      <PriorityBadge priority={opt.priority} />
                    </div>
                    <p className="text-xs text-foreground leading-relaxed">{opt.recommendation}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <ArrowRight className="h-2.5 w-2.5 text-primary" />
                      <span className="text-[10px] text-primary">{opt.impact}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
