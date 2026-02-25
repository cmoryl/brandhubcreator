/**
 * IntelligenceGraph — 2D force-directed graph with anomaly detection,
 * edge filtering, coherence scoring, and relationship detail panel.
 */

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Network, Loader2, Zap, AlertTriangle, TrendingUp, 
  MessageSquare, Users, Eye, Palette, Target, Filter, X
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { usePortfolioRelationships, type GraphNode, type GraphEdge } from '@/hooks/usePortfolioRelationships';
import { cn } from '@/lib/utils';

interface IntelligenceGraphProps {
  organizationId: string;
}

const NODE_COLORS: Record<string, string> = {
  brand: 'hsl(260, 70%, 60%)',
  product: 'hsl(200, 70%, 55%)',
  event: 'hsl(30, 80%, 55%)',
};

const NODE_RADIUS: Record<string, number> = {
  brand: 24,
  product: 18,
  event: 16,
};

const EDGE_TYPE_CONFIG: Record<string, { color: string; label: string; icon: string }> = {
  alignment: { color: 'hsla(260, 50%, 60%, 0.4)', label: 'Alignment', icon: '⚡' },
  voice_consistency: { color: 'hsla(200, 60%, 55%, 0.4)', label: 'Voice', icon: '🗣' },
  audience_overlap: { color: 'hsla(150, 50%, 50%, 0.4)', label: 'Audience', icon: '👥' },
  parent_child: { color: 'hsla(0, 0%, 60%, 0.5)', label: 'Parent-Child', icon: '🔗' },
  visual_coherence: { color: 'hsla(320, 50%, 55%, 0.4)', label: 'Visual', icon: '🎨' },
  strategic_complement: { color: 'hsla(45, 70%, 55%, 0.4)', label: 'Strategic', icon: '🎯' },
  competitive_tension: { color: 'hsla(0, 60%, 55%, 0.4)', label: 'Tension', icon: '⚔️' },
};

const ANOMALY_COLOR = 'hsl(0, 70%, 55%)';

export function IntelligenceGraph({ organizationId }: IntelligenceGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const nodesRef = useRef<GraphNode[]>([]);
  const edgesRef = useRef<GraphEdge[]>([]);
  const dragRef = useRef<{ nodeId: string | null; offsetX: number; offsetY: number }>({ nodeId: null, offsetX: 0, offsetY: 0 });
  const hoveredRef = useRef<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<GraphEdge | null>(null);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  const { relationships, coherence, graphData, isLoading, refetch } = usePortfolioRelationships(organizationId);
  const { nodes, edges } = useMemo(() => graphData(), [graphData]);

  // Filter edges based on active type filters
  const filteredEdges = useMemo(() => {
    if (activeFilters.size === 0) return edges;
    return edges.filter(e => activeFilters.has(e.type));
  }, [edges, activeFilters]);

  // Get unique edge types present in the data
  const edgeTypes = useMemo(() => {
    const types = new Set(edges.map(e => e.type));
    return Array.from(types);
  }, [edges]);

  // Count anomalies
  const anomalyCount = useMemo(() => edges.filter(e => e.anomalyType).length, [edges]);

  // Initialize simulation
  useEffect(() => {
    nodesRef.current = nodes.map(n => ({ ...n }));
    edgesRef.current = filteredEdges;
  }, [nodes, filteredEdges]);

  // Simple force simulation
  const simulate = useCallback(() => {
    const ns = nodesRef.current;
    const es = edgesRef.current;
    if (ns.length === 0) return;

    const W = canvasRef.current?.width || 800;
    const H = canvasRef.current?.height || 500;
    const centerX = W / 2;
    const centerY = H / 2;

    for (let i = 0; i < ns.length; i++) {
      for (let j = i + 1; j < ns.length; j++) {
        const dx = ns[j].x - ns[i].x;
        const dy = ns[j].y - ns[i].y;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        const force = 2000 / (dist * dist);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        ns[i].vx -= fx;
        ns[i].vy -= fy;
        ns[j].vx += fx;
        ns[j].vy += fy;
      }
    }

    for (const e of es) {
      const s = ns.find(n => n.id === e.source);
      const t = ns.find(n => n.id === e.target);
      if (!s || !t) continue;
      const dx = t.x - s.x;
      const dy = t.y - s.y;
      const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
      const idealDist = 150 - (e.strength / 100) * 50;
      const force = (dist - idealDist) * 0.005;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      s.vx += fx;
      s.vy += fy;
      t.vx -= fx;
      t.vy -= fy;
    }

    for (const n of ns) {
      n.vx += (centerX - n.x) * 0.001;
      n.vy += (centerY - n.y) * 0.001;
    }

    for (const n of ns) {
      if (dragRef.current.nodeId === n.id) continue;
      n.vx *= 0.85;
      n.vy *= 0.85;
      n.x += n.vx;
      n.y += n.vy;
      n.x = Math.max(30, Math.min(W - 30, n.x));
      n.y = Math.max(30, Math.min(H - 30, n.y));
    }
  }, []);

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      simulate();
      const ns = nodesRef.current;
      const es = edgesRef.current;
      const W = canvas.width;
      const H = canvas.height;

      ctx.clearRect(0, 0, W, H);

      // Draw edges
      for (const e of es) {
        const s = ns.find(n => n.id === e.source);
        const t = ns.find(n => n.id === e.target);
        if (!s || !t) continue;

        const isHovered = hoveredRef.current === s.id || hoveredRef.current === t.id;
        const isAnomaly = !!e.anomalyType;
        const config = EDGE_TYPE_CONFIG[e.type] || EDGE_TYPE_CONFIG.alignment;

        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(t.x, t.y);

        if (isAnomaly) {
          ctx.strokeStyle = isHovered ? 'hsla(0, 70%, 55%, 0.9)' : 'hsla(0, 60%, 55%, 0.5)';
          ctx.setLineDash([6, 4]);
        } else {
          ctx.strokeStyle = isHovered
            ? config.color.replace(/[\d.]+\)$/, '0.8)')
            : config.color;
          ctx.setLineDash([]);
        }
        ctx.lineWidth = isHovered ? 2.5 : Math.max(1, e.strength / 40);
        ctx.stroke();
        ctx.setLineDash([]);

        // Edge label on hover
        if (isHovered && e.strength > 0) {
          const mx = (s.x + t.x) / 2;
          const my = (s.y + t.y) / 2;
          ctx.font = '10px sans-serif';
          ctx.fillStyle = isAnomaly ? 'hsl(0, 70%, 60%)' : 'hsl(0, 0%, 60%)';
          ctx.textAlign = 'center';
          const label = isAnomaly
            ? `⚠ ${Math.round(e.strength)}%`
            : `${Math.round(e.strength)}%`;
          ctx.fillText(label, mx, my - 6);
        }
      }

      // Draw nodes
      for (const n of ns) {
        const r = NODE_RADIUS[n.type] || 16;
        const isHovered = hoveredRef.current === n.id;
        const color = NODE_COLORS[n.type] || NODE_COLORS.brand;

        // Anomaly ring
        if (n.hasAnomaly) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, r + 5, 0, Math.PI * 2);
          ctx.strokeStyle = ANOMALY_COLOR;
          ctx.lineWidth = 2;
          ctx.setLineDash([3, 3]);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Glow
        if (isHovered) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, r + 6, 0, Math.PI * 2);
          ctx.fillStyle = color.replace(')', ', 0.15)').replace('hsl', 'hsla');
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = isHovered ? 'hsl(0, 0%, 100%)' : 'hsla(0, 0%, 100%, 0.3)';
        ctx.lineWidth = isHovered ? 2.5 : 1.5;
        ctx.stroke();

        ctx.font = `bold ${r * 0.7}px sans-serif`;
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(n.type[0].toUpperCase(), n.x, n.y);

        ctx.font = `${isHovered ? '12' : '10'}px sans-serif`;
        ctx.fillStyle = isHovered ? 'hsl(0, 0%, 95%)' : 'hsl(0, 0%, 70%)';
        ctx.textAlign = 'center';
        ctx.fillText(n.name.length > 18 ? n.name.slice(0, 16) + '…' : n.name, n.x, n.y + r + 14);
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [simulate, nodes, filteredEdges]);

  // Mouse interactions
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const getNode = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
      const my = (e.clientY - rect.top) * (canvas.height / rect.height);
      for (const n of nodesRef.current) {
        const r = NODE_RADIUS[n.type] || 16;
        if (Math.hypot(mx - n.x, my - n.y) < r + 4) return { node: n, mx, my };
      }
      return null;
    };

    const getEdge = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
      const my = (e.clientY - rect.top) * (canvas.height / rect.height);
      for (const edge of edgesRef.current) {
        const s = nodesRef.current.find(n => n.id === edge.source);
        const t = nodesRef.current.find(n => n.id === edge.target);
        if (!s || !t) continue;
        // Point-to-line distance
        const A = my - s.y;
        const B = s.x - mx;
        const C = t.x * s.y - s.x * t.y;
        const dist = Math.abs(A * (t.x - s.x) + (t.y - s.y) * (mx - s.x)) / Math.max(Math.hypot(t.x - s.x, t.y - s.y), 1);
        const withinBounds = mx >= Math.min(s.x, t.x) - 10 && mx <= Math.max(s.x, t.x) + 10
          && my >= Math.min(s.y, t.y) - 10 && my <= Math.max(s.y, t.y) + 10;
        if (dist < 8 && withinBounds) return edge;
      }
      return null;
    };

    const onDown = (e: MouseEvent) => {
      const hit = getNode(e);
      if (hit) {
        dragRef.current = { nodeId: hit.node.id, offsetX: hit.mx - hit.node.x, offsetY: hit.my - hit.node.y };
        canvas.style.cursor = 'grabbing';
      }
    };

    const onClick = (e: MouseEvent) => {
      if (dragRef.current.nodeId) return; // Was dragging
      const edge = getEdge(e);
      if (edge) {
        setSelectedEdge(edge);
      } else {
        setSelectedEdge(null);
      }
    };

    const onMove = (e: MouseEvent) => {
      const hit = getNode(e);
      hoveredRef.current = hit?.node?.id || null;
      setHoveredNode(hit?.node || null);
      canvas.style.cursor = hit ? 'grab' : 'default';

      if (dragRef.current.nodeId) {
        const rect = canvas.getBoundingClientRect();
        const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
        const my = (e.clientY - rect.top) * (canvas.height / rect.height);
        const n = nodesRef.current.find(n => n.id === dragRef.current.nodeId);
        if (n) {
          n.x = mx - dragRef.current.offsetX;
          n.y = my - dragRef.current.offsetY;
          n.vx = 0;
          n.vy = 0;
        }
        canvas.style.cursor = 'grabbing';
      }
    };

    const onUp = () => {
      dragRef.current = { nodeId: null, offsetX: 0, offsetY: 0 };
      canvas.style.cursor = 'default';
    };

    canvas.addEventListener('mousedown', onDown);
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseup', onUp);
    canvas.addEventListener('mouseleave', onUp);
    canvas.addEventListener('click', onClick);

    return () => {
      canvas.removeEventListener('mousedown', onDown);
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mouseup', onUp);
      canvas.removeEventListener('mouseleave', onUp);
      canvas.removeEventListener('click', onClick);
    };
  }, []);

  const generateRelationships = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-portfolio-relationships', {
        body: { organization_id: organizationId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`Mapped ${data?.relationships_count || 0} relationships, detected ${data?.anomalies_count || 0} anomalies`);
      refetch();
    } catch (err: any) {
      console.error('Relationship generation failed:', err);
      toast.error('Failed to generate relationships');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleFilter = (type: string) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const hasNodes = nodes.length > 0;

  return (
    <div className="space-y-4">
      {/* Coherence Score Card */}
      {coherence && (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold">Portfolio Coherence</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-lg font-bold",
                  coherence.overall_score >= 70 ? "text-emerald-500" :
                  coherence.overall_score >= 40 ? "text-amber-500" : "text-destructive"
                )}>
                  {Math.round(coherence.overall_score)}%
                </span>
                {anomalyCount > 0 && (
                  <Badge variant="destructive" className="text-[10px] gap-1">
                    <AlertTriangle className="h-2.5 w-2.5" />
                    {anomalyCount} anomal{anomalyCount === 1 ? 'y' : 'ies'}
                  </Badge>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <CoherenceDimension icon={<MessageSquare className="h-3 w-3" />} label="Voice" score={coherence.voice_coherence} />
              <CoherenceDimension icon={<Palette className="h-3 w-3" />} label="Visual" score={coherence.visual_coherence} />
              <CoherenceDimension icon={<Users className="h-3 w-3" />} label="Audience" score={coherence.audience_coherence} />
              <CoherenceDimension icon={<Target className="h-3 w-3" />} label="Strategic" score={coherence.strategic_coherence} />
            </div>
            {Array.isArray(coherence.insights) && coherence.insights.length > 0 && (
              <div className="mt-3 pt-2 border-t border-border/50">
                <p className="text-[10px] text-muted-foreground font-medium mb-1">Key Insights</p>
                <div className="space-y-0.5">
                  {coherence.insights.slice(0, 3).map((insight, i) => (
                    <p key={i} className="text-xs text-foreground/80">• {insight}</p>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Graph Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Network className="h-4 w-4 text-primary" />
              Cross-Entity Relationship Graph
            </CardTitle>
            <div className="flex items-center gap-2">
              {hasNodes && (
                <>
                  <Button
                    variant={showFilters ? 'secondary' : 'ghost'}
                    size="sm"
                    className="text-xs h-7 gap-1"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className="h-3 w-3" />
                    Filter
                    {activeFilters.size > 0 && (
                      <Badge variant="default" className="text-[9px] h-4 px-1 ml-0.5">
                        {activeFilters.size}
                      </Badge>
                    )}
                  </Button>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="text-[10px] gap-1">
                      <span className="w-2 h-2 rounded-full" style={{ background: NODE_COLORS.brand }} />
                      Brand
                    </Badge>
                    <Badge variant="outline" className="text-[10px] gap-1">
                      <span className="w-2 h-2 rounded-full" style={{ background: NODE_COLORS.product }} />
                      Product
                    </Badge>
                    <Badge variant="outline" className="text-[10px] gap-1">
                      <span className="w-2 h-2 rounded-full" style={{ background: NODE_COLORS.event }} />
                      Event
                    </Badge>
                  </div>
                </>
              )}
              <Button size="sm" variant={hasNodes ? 'outline' : 'default'} onClick={generateRelationships} disabled={isGenerating}>
                {isGenerating ? (
                  <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Analyzing...</>
                ) : (
                  <><Zap className="h-3.5 w-3.5 mr-1.5" /> {hasNodes ? 'Re-analyze' : 'Map Relationships'}</>
                )}
              </Button>
            </div>
          </div>

          {/* Edge type filters */}
          {showFilters && hasNodes && (
            <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-border/50">
              {edgeTypes.map(type => {
                const config = EDGE_TYPE_CONFIG[type] || { label: type, color: 'hsla(0,0%,50%,0.4)', icon: '•' };
                const isActive = activeFilters.size === 0 || activeFilters.has(type);
                return (
                  <Button
                    key={type}
                    variant={activeFilters.has(type) ? 'secondary' : 'ghost'}
                    size="sm"
                    className={cn("text-[10px] h-6 px-2 gap-1", !isActive && "opacity-40")}
                    onClick={() => toggleFilter(type)}
                  >
                    <span>{config.icon}</span>
                    {config.label}
                  </Button>
                );
              })}
              {activeFilters.size > 0 && (
                <Button variant="ghost" size="sm" className="text-[10px] h-6 px-2" onClick={() => setActiveFilters(new Set())}>
                  <X className="h-2.5 w-2.5 mr-0.5" /> Clear
                </Button>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent>
          {!hasNodes && !isGenerating && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Network className="h-10 w-10 mb-3 opacity-40" />
              <p className="font-medium text-sm">No relationships mapped yet</p>
              <p className="text-xs mt-1">Generate AI-powered relationship analysis with anomaly detection</p>
            </div>
          )}

          {isGenerating && !hasNodes && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-8 w-8 mb-3 animate-spin text-primary" />
              <p className="text-sm font-medium">Analyzing entity relationships...</p>
              <p className="text-xs mt-1">Detecting patterns, anomalies, and coherence scores</p>
            </div>
          )}

          {hasNodes && (
            <div className="relative rounded-lg border bg-card/50 overflow-hidden">
              <canvas
                ref={canvasRef}
                width={800}
                height={500}
                className="w-full h-auto"
                style={{ maxHeight: '500px' }}
              />

              {/* Hovered node info */}
              {hoveredNode && (
                <div className="absolute top-3 left-3 bg-popover/95 backdrop-blur border rounded-lg p-2.5 shadow-lg">
                  <p className="text-xs font-semibold text-foreground">{hoveredNode.name}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Badge variant="secondary" className="text-[10px]">{hoveredNode.type}</Badge>
                    {hoveredNode.hasAnomaly && (
                      <Badge variant="destructive" className="text-[10px] gap-0.5">
                        <AlertTriangle className="h-2.5 w-2.5" /> Anomaly
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Selected edge detail panel */}
              {selectedEdge && (
                <div className="absolute top-3 right-3 bg-popover/95 backdrop-blur border rounded-lg p-3 shadow-lg w-56">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-foreground">Relationship Detail</p>
                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setSelectedEdge(null)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="space-y-1.5">
                    <Badge variant="outline" className="text-[10px]">
                      {EDGE_TYPE_CONFIG[selectedEdge.type]?.label || selectedEdge.type}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-muted-foreground">Strength:</span>
                      <Progress value={selectedEdge.strength} className="flex-1 h-1.5" />
                      <span className="text-[10px] font-medium">{Math.round(selectedEdge.strength)}%</span>
                    </div>
                    {selectedEdge.dimensions && Object.keys(selectedEdge.dimensions).length > 0 && (
                      <div className="space-y-1 pt-1">
                        {Object.entries(selectedEdge.dimensions).map(([key, val]) => (
                          <div key={key} className="flex items-center gap-1">
                            <span className="text-[10px] text-muted-foreground capitalize w-14">{key}:</span>
                            <Progress value={val as number} className="flex-1 h-1" />
                            <span className="text-[10px]">{Math.round(val as number)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {selectedEdge.anomalyType && (
                      <div className="pt-1 border-t border-border/50">
                        <Badge variant="destructive" className="text-[10px] gap-0.5">
                          <AlertTriangle className="h-2.5 w-2.5" />
                          {selectedEdge.anomalyType.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                    )}
                    {selectedEdge.rationale && (
                      <p className="text-[10px] text-muted-foreground pt-1 border-t border-border/50">
                        {selectedEdge.rationale}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="absolute bottom-3 right-3 text-[10px] text-muted-foreground">
                {nodes.length} entities · {filteredEdges.length} connections
                {activeFilters.size > 0 && ` (filtered from ${edges.length})`}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Anomalies Panel */}
      {coherence && Array.isArray(coherence.anomalies) && coherence.anomalies.length > 0 && (
        <Card className="border-destructive/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Detected Anomalies
              <Badge variant="destructive" className="text-[10px]">{coherence.anomalies.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[200px]">
              <div className="space-y-2">
                {coherence.anomalies.map((anomaly: any, i: number) => (
                  <div key={i} className="flex items-start gap-2 p-2 rounded-lg border border-destructive/20 bg-destructive/5">
                    <AlertTriangle className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Badge variant="outline" className="text-[9px] h-4 px-1">
                          {(anomaly.anomaly_type || 'unknown').replace(/_/g, ' ')}
                        </Badge>
                        {anomaly.anomaly_score != null && (
                          <span className="text-[10px] text-destructive font-medium">
                            Severity: {Math.round(anomaly.anomaly_score)}%
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-foreground/80">{anomaly.description || 'No description available'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function CoherenceDimension({ icon, label, score }: { icon: React.ReactNode; label: string; score: number }) {
  const roundedScore = Math.round(score || 0);
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-background/60 border">
      <div className="text-primary shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-muted-foreground">{label}</p>
        <div className="flex items-center gap-1.5">
          <Progress value={roundedScore} className="flex-1 h-1.5" />
          <span className={cn(
            "text-xs font-semibold",
            roundedScore >= 70 ? "text-emerald-500" :
            roundedScore >= 40 ? "text-amber-500" : "text-destructive"
          )}>{roundedScore}%</span>
        </div>
      </div>
    </div>
  );
}
