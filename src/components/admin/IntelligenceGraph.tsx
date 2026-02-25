/**
 * IntelligenceGraph — 2D force-directed graph visualization of entity relationships.
 * Uses a simple canvas-based approach for performance.
 */

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Network, Loader2, RefreshCw, Zap, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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

const EDGE_TYPE_COLORS: Record<string, string> = {
  alignment: 'hsla(260, 50%, 60%, 0.4)',
  voice_consistency: 'hsla(200, 60%, 55%, 0.4)',
  audience_overlap: 'hsla(150, 50%, 50%, 0.4)',
  parent_child: 'hsla(0, 0%, 60%, 0.5)',
};

export function IntelligenceGraph({ organizationId }: IntelligenceGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const nodesRef = useRef<GraphNode[]>([]);
  const edgesRef = useRef<GraphEdge[]>([]);
  const dragRef = useRef<{ nodeId: string | null; offsetX: number; offsetY: number }>({ nodeId: null, offsetX: 0, offsetY: 0 });
  const hoveredRef = useRef<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);

  const { relationships, graphData, isLoading, refetch } = usePortfolioRelationships(organizationId);
  const { nodes, edges } = useMemo(() => graphData(), [graphData]);

  // Initialize simulation
  useEffect(() => {
    nodesRef.current = nodes.map(n => ({ ...n }));
    edgesRef.current = edges;
  }, [nodes, edges]);

  // Simple force simulation
  const simulate = useCallback(() => {
    const ns = nodesRef.current;
    const es = edgesRef.current;
    if (ns.length === 0) return;

    const W = canvasRef.current?.width || 800;
    const H = canvasRef.current?.height || 500;
    const centerX = W / 2;
    const centerY = H / 2;

    // Repulsion between all nodes
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

    // Attraction along edges
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

    // Center gravity
    for (const n of ns) {
      n.vx += (centerX - n.x) * 0.001;
      n.vy += (centerY - n.y) * 0.001;
    }

    // Apply velocities with damping
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
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(t.x, t.y);
        ctx.strokeStyle = isHovered
          ? (EDGE_TYPE_COLORS[e.type] || EDGE_TYPE_COLORS.alignment).replace(/[\d.]+\)$/, '0.8)')
          : EDGE_TYPE_COLORS[e.type] || EDGE_TYPE_COLORS.alignment;
        ctx.lineWidth = isHovered ? 2.5 : Math.max(1, e.strength / 40);
        ctx.stroke();

        // Strength label on edge midpoint
        if (isHovered && e.strength > 0) {
          const mx = (s.x + t.x) / 2;
          const my = (s.y + t.y) / 2;
          ctx.font = '10px sans-serif';
          ctx.fillStyle = 'hsl(0, 0%, 60%)';
          ctx.textAlign = 'center';
          ctx.fillText(`${Math.round(e.strength)}%`, mx, my - 6);
        }
      }

      // Draw nodes
      for (const n of ns) {
        const r = NODE_RADIUS[n.type] || 16;
        const isHovered = hoveredRef.current === n.id;
        const color = NODE_COLORS[n.type] || NODE_COLORS.brand;

        // Glow
        if (isHovered) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, r + 6, 0, Math.PI * 2);
          ctx.fillStyle = color.replace(')', ', 0.15)').replace('hsl', 'hsla');
          ctx.fill();
        }

        // Circle
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = isHovered ? 'hsl(0, 0%, 100%)' : 'hsla(0, 0%, 100%, 0.3)';
        ctx.lineWidth = isHovered ? 2.5 : 1.5;
        ctx.stroke();

        // Type icon letter
        ctx.font = `bold ${r * 0.7}px sans-serif`;
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(n.type[0].toUpperCase(), n.x, n.y);

        // Label
        ctx.font = `${isHovered ? '12' : '10'}px sans-serif`;
        ctx.fillStyle = isHovered ? 'hsl(0, 0%, 95%)' : 'hsl(0, 0%, 70%)';
        ctx.textAlign = 'center';
        ctx.fillText(n.name.length > 18 ? n.name.slice(0, 16) + '…' : n.name, n.x, n.y + r + 14);
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [simulate, nodes]);

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

    const onDown = (e: MouseEvent) => {
      const hit = getNode(e);
      if (hit) {
        dragRef.current = { nodeId: hit.node.id, offsetX: hit.mx - hit.node.x, offsetY: hit.my - hit.node.y };
        canvas.style.cursor = 'grabbing';
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

    return () => {
      canvas.removeEventListener('mousedown', onDown);
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mouseup', onUp);
      canvas.removeEventListener('mouseleave', onUp);
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
      toast.success(`Mapped ${data?.relationships_count || 0} relationships`);
      refetch();
    } catch (err: any) {
      console.error('Relationship generation failed:', err);
      toast.error('Failed to generate relationships');
    } finally {
      setIsGenerating(false);
    }
  };

  const hasNodes = nodes.length > 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Network className="h-4 w-4 text-primary" />
            Cross-Entity Relationship Graph
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasNodes && (
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
            )}
            <Button size="sm" variant={hasNodes ? 'outline' : 'default'} onClick={generateRelationships} disabled={isGenerating}>
              {isGenerating ? (
                <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Mapping...</>
              ) : (
                <><Zap className="h-3.5 w-3.5 mr-1.5" /> {hasNodes ? 'Remap' : 'Map Relationships'}</>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!hasNodes && !isGenerating && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Network className="h-10 w-10 mb-3 opacity-40" />
            <p className="font-medium text-sm">No relationships mapped yet</p>
            <p className="text-xs mt-1">Generate AI-powered relationship mapping across all entities</p>
          </div>
        )}

        {isGenerating && !hasNodes && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-8 w-8 mb-3 animate-spin text-primary" />
            <p className="text-sm font-medium">Analyzing entity relationships...</p>
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
            {hoveredNode && (
              <div className="absolute top-3 left-3 bg-popover/95 backdrop-blur border rounded-lg p-2.5 shadow-lg">
                <p className="text-xs font-semibold text-foreground">{hoveredNode.name}</p>
                <Badge variant="secondary" className="text-[10px] mt-1">{hoveredNode.type}</Badge>
              </div>
            )}
            <div className="absolute bottom-3 right-3 text-[10px] text-muted-foreground">
              {nodes.length} entities · {edges.length} connections
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
