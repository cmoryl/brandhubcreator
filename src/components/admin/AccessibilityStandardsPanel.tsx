/**
 * Accessibility Standards & Statistics Panel
 * Comprehensive WCAG, ADA, EAA compliance tracking across all entities
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Accessibility,
  Shield,
  Eye,
  Ear,
  Hand,
  Brain,
  Monitor,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Loader2,
  BarChart3,
  TrendingUp,
  FileText,
  Globe2,
  ChevronDown,
  ChevronRight,
  Info,
  Target,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { format } from 'date-fns';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// ---- Types ----
interface EntityAccessibility {
  id: string;
  entity_id: string;
  entity_type: string;
  entity_name: string;
  accessibility_score: number | null;
  language_score: number | null;
  visual_score: number | null;
  inclusion_score: number | null;
  wcag_compliance: any;
  color_accessibility_module: any;
  persona_coverage: any;
  status: string;
  completed_at: string | null;
  created_at: string;
}

interface WCAGStandard {
  id: string;
  name: string;
  level: 'A' | 'AA' | 'AAA';
  category: 'perceivable' | 'operable' | 'understandable' | 'robust';
  description: string;
}

const WCAG_STANDARDS: WCAGStandard[] = [
  { id: '1.1.1', name: 'Non-text Content', level: 'A', category: 'perceivable', description: 'All non-text content has a text alternative' },
  { id: '1.3.1', name: 'Info and Relationships', level: 'A', category: 'perceivable', description: 'Information and relationships conveyed through presentation can be programmatically determined' },
  { id: '1.4.1', name: 'Use of Color', level: 'A', category: 'perceivable', description: 'Color is not used as the only visual means of conveying information' },
  { id: '1.4.3', name: 'Contrast (Minimum)', level: 'AA', category: 'perceivable', description: 'Text has a contrast ratio of at least 4.5:1' },
  { id: '1.4.6', name: 'Contrast (Enhanced)', level: 'AAA', category: 'perceivable', description: 'Text has a contrast ratio of at least 7:1' },
  { id: '1.4.11', name: 'Non-text Contrast', level: 'AA', category: 'perceivable', description: 'UI components and graphics have at least 3:1 contrast ratio' },
  { id: '2.1.1', name: 'Keyboard', level: 'A', category: 'operable', description: 'All functionality is operable through a keyboard interface' },
  { id: '2.4.1', name: 'Bypass Blocks', level: 'A', category: 'operable', description: 'A mechanism is available to bypass blocks of content' },
  { id: '2.4.4', name: 'Link Purpose', level: 'A', category: 'operable', description: 'The purpose of each link can be determined from the link text' },
  { id: '2.4.7', name: 'Focus Visible', level: 'AA', category: 'operable', description: 'Keyboard focus indicator is visible' },
  { id: '3.1.1', name: 'Language of Page', level: 'A', category: 'understandable', description: 'The default language of each page can be programmatically determined' },
  { id: '3.2.1', name: 'On Focus', level: 'A', category: 'understandable', description: 'When a UI component receives focus, it does not initiate a change of context' },
  { id: '3.3.1', name: 'Error Identification', level: 'A', category: 'understandable', description: 'Input errors are automatically detected and described to the user' },
  { id: '4.1.1', name: 'Parsing', level: 'A', category: 'robust', description: 'Content is parseable and well-formed' },
  { id: '4.1.2', name: 'Name, Role, Value', level: 'A', category: 'robust', description: 'All UI components have accessible name and role' },
];

const EAA_REQUIREMENTS = [
  { id: 'eaa-1', name: 'Digital Products & Services', status: 'mandatory', deadline: '2025-06-28', description: 'All digital products must meet EN 301 549 accessibility standards' },
  { id: 'eaa-2', name: 'E-Commerce Platforms', status: 'mandatory', deadline: '2025-06-28', description: 'Online stores must be accessible including checkout flows' },
  { id: 'eaa-3', name: 'Mobile Applications', status: 'mandatory', deadline: '2025-06-28', description: 'Native and hybrid mobile apps must meet WCAG 2.1 AA' },
  { id: 'eaa-4', name: 'Banking & Financial Services', status: 'mandatory', deadline: '2025-06-28', description: 'ATMs, banking apps, and financial platforms' },
  { id: 'eaa-5', name: 'Audiovisual Media', status: 'mandatory', deadline: '2025-06-28', description: 'Streaming and media services with captions and audio description' },
  { id: 'eaa-6', name: 'Transport Services', status: 'mandatory', deadline: '2025-06-28', description: 'Ticketing, real-time info, and booking systems' },
];

const ADA_SECTIONS = [
  { id: 'ada-web', name: 'Web Content (Title III)', description: 'Websites of public accommodations must be accessible', standard: 'WCAG 2.1 AA' },
  { id: 'ada-mobile', name: 'Mobile Apps (Title III)', description: 'Mobile applications must provide equivalent access', standard: 'WCAG 2.1 AA' },
  { id: 'ada-docs', name: 'Digital Documents', description: 'PDFs and documents must be tagged and screen-reader compatible', standard: 'PDF/UA' },
  { id: 'ada-video', name: 'Video & Multimedia', description: 'Captions, audio descriptions, and accessible players', standard: 'WCAG 2.1 AA' },
  { id: 'ada-forms', name: 'Forms & Interactive', description: 'Forms with labels, error handling, and keyboard access', standard: 'WCAG 2.1 AA' },
];

// ---- Helper Components ----

function ScoreGauge({ score, label, size = 'md' }: { score: number | null; label: string; size?: 'sm' | 'md' | 'lg' }) {
  const s = score ?? 0;
  const color = s >= 80 ? 'text-emerald-500' : s >= 60 ? 'text-amber-500' : 'text-destructive';
  const bgColor = s >= 80 ? 'bg-emerald-500/10' : s >= 60 ? 'bg-amber-500/10' : 'bg-destructive/10';
  const sizeClasses = size === 'lg' ? 'h-28 w-28' : size === 'md' ? 'h-20 w-20' : 'h-14 w-14';
  const textSize = size === 'lg' ? 'text-2xl' : size === 'md' ? 'text-lg' : 'text-sm';

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className={`${sizeClasses} rounded-full ${bgColor} flex items-center justify-center border-2 ${s >= 80 ? 'border-emerald-500/30' : s >= 60 ? 'border-amber-500/30' : 'border-destructive/30'}`}>
        <span className={`${textSize} font-bold ${color}`}>
          {score !== null ? s : 'N/A'}
        </span>
      </div>
      <span className="text-xs text-muted-foreground text-center leading-tight">{label}</span>
    </div>
  );
}

function ComplianceBadge({ level }: { level: 'A' | 'AA' | 'AAA' }) {
  const colors = {
    A: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    AA: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    AAA: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  };
  return <Badge variant="outline" className={`${colors[level]} text-[10px] px-1.5 py-0`}>{level}</Badge>;
}

function StatusIcon({ status }: { status: 'pass' | 'partial' | 'fail' | 'unknown' }) {
  switch (status) {
    case 'pass': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    case 'partial': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    case 'fail': return <XCircle className="h-4 w-4 text-destructive" />;
    default: return <Info className="h-4 w-4 text-muted-foreground" />;
  }
}

// ---- Main Component ----

export function AccessibilityStandardsPanel() {
  const { organization } = useOrganization();
  const organizationId = organization?.id;
  const [entities, setEntities] = useState<EntityAccessibility[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const fetchData = useCallback(async () => {
    if (!organizationId) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('bias_awareness_scans')
        .select('id, entity_id, entity_type, entity_name, accessibility_score, language_score, visual_score, inclusion_score, wcag_compliance, color_accessibility_module, persona_coverage, status, completed_at, created_at')
        .eq('organization_id', organizationId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false });

      if (error) throw error;

      // Deduplicate — keep latest per entity
      const seen = new Map<string, EntityAccessibility>();
      (data || []).forEach((row: any) => {
        const key = `${row.entity_type}-${row.entity_id}`;
        if (!seen.has(key)) seen.set(key, row as EntityAccessibility);
      });
      setEntities(Array.from(seen.values()));
    } catch (err) {
      console.error('[Accessibility] Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ---- Computed Statistics ----
  const stats = useMemo(() => {
    if (entities.length === 0) return null;

    const scores = entities.map(e => e.accessibility_score).filter((s): s is number => s !== null);
    const avgAccessibility = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

    const langScores = entities.map(e => e.language_score).filter((s): s is number => s !== null);
    const avgLanguage = langScores.length > 0 ? Math.round(langScores.reduce((a, b) => a + b, 0) / langScores.length) : 0;

    const visScores = entities.map(e => e.visual_score).filter((s): s is number => s !== null);
    const avgVisual = visScores.length > 0 ? Math.round(visScores.reduce((a, b) => a + b, 0) / visScores.length) : 0;

    const inclScores = entities.map(e => e.inclusion_score).filter((s): s is number => s !== null);
    const avgInclusion = inclScores.length > 0 ? Math.round(inclScores.reduce((a, b) => a + b, 0) / inclScores.length) : 0;

    const passing = scores.filter(s => s >= 80).length;
    const warning = scores.filter(s => s >= 60 && s < 80).length;
    const failing = scores.filter(s => s < 60).length;

    // Persona spectrum from persona_coverage data
    const personaDimensions = { mobility: 0, vision: 0, hearing: 0, speech: 0, cognitive: 0, count: 0 };
    entities.forEach(e => {
      const pc = e.persona_coverage as any;
      if (pc?.dimensions) {
        personaDimensions.mobility += pc.dimensions.mobility?.score || 0;
        personaDimensions.vision += pc.dimensions.vision?.score || 0;
        personaDimensions.hearing += pc.dimensions.hearing?.score || 0;
        personaDimensions.speech += pc.dimensions.speech?.score || 0;
        personaDimensions.cognitive += pc.dimensions.cognitive?.score || 0;
        personaDimensions.count++;
      }
    });
    const cnt = personaDimensions.count || 1;

    // Color accessibility from color_accessibility_module
    let contrastPasses = 0;
    let contrastTotal = 0;
    entities.forEach(e => {
      const cam = e.color_accessibility_module as any;
      if (cam?.contrast_results) {
        const results = Array.isArray(cam.contrast_results) ? cam.contrast_results : [];
        results.forEach((r: any) => {
          contrastTotal++;
          if (r.passes || r.ratio >= 4.5) contrastPasses++;
        });
      }
    });

    return {
      total: entities.length,
      avgAccessibility,
      avgLanguage,
      avgVisual,
      avgInclusion,
      passing,
      warning,
      failing,
      persona: {
        mobility: Math.round(personaDimensions.mobility / cnt),
        vision: Math.round(personaDimensions.vision / cnt),
        hearing: Math.round(personaDimensions.hearing / cnt),
        speech: Math.round(personaDimensions.speech / cnt),
        cognitive: Math.round(personaDimensions.cognitive / cnt),
      },
      contrast: {
        passes: contrastPasses,
        total: contrastTotal,
        rate: contrastTotal > 0 ? Math.round((contrastPasses / contrastTotal) * 100) : 0,
      },
    };
  }, [entities]);

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Accessibility className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Accessibility Standards & Statistics</h2>
            <p className="text-sm text-muted-foreground">WCAG 2.1 · ADA Title III · EAA 2025 compliance tracking</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* KPI Strip */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          <Card className="p-3 text-center">
            <p className="text-2xl font-bold text-primary">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Entities Scanned</p>
          </Card>
          <Card className="p-3 text-center">
            <p className={`text-2xl font-bold ${stats.avgAccessibility >= 80 ? 'text-emerald-500' : stats.avgAccessibility >= 60 ? 'text-amber-500' : 'text-destructive'}`}>
              {stats.avgAccessibility}%
            </p>
            <p className="text-xs text-muted-foreground">Avg Accessibility</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-2xl font-bold text-emerald-500">{stats.passing}</p>
            <p className="text-xs text-muted-foreground">Passing (≥80)</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-2xl font-bold text-amber-500">{stats.warning}</p>
            <p className="text-xs text-muted-foreground">Warning (60-79)</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-2xl font-bold text-destructive">{stats.failing}</p>
            <p className="text-xs text-muted-foreground">Failing (&lt;60)</p>
          </Card>
          <Card className="p-3 text-center">
            <p className={`text-2xl font-bold ${stats.contrast.rate >= 80 ? 'text-emerald-500' : stats.contrast.rate >= 60 ? 'text-amber-500' : 'text-destructive'}`}>
              {stats.contrast.rate}%
            </p>
            <p className="text-xs text-muted-foreground">Contrast Pass Rate</p>
          </Card>
        </div>
      )}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-4 flex-wrap">
          <TabsTrigger value="overview" className="gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="wcag" className="gap-1.5">
            <Shield className="h-3.5 w-3.5" />
            WCAG 2.1
          </TabsTrigger>
          <TabsTrigger value="ada" className="gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            ADA
          </TabsTrigger>
          <TabsTrigger value="eaa" className="gap-1.5">
            <Globe2 className="h-3.5 w-3.5" />
            EAA 2025
          </TabsTrigger>
          <TabsTrigger value="persona" className="gap-1.5">
            <Accessibility className="h-3.5 w-3.5" />
            Persona Spectrum
          </TabsTrigger>
        </TabsList>

        {/* ---- Overview Tab ---- */}
        <TabsContent value="overview" className="space-y-4">
          {/* Score Gauges */}
          {stats && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Organization Accessibility Profile</CardTitle>
                <CardDescription>Aggregate scores across all scanned entities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
                  <ScoreGauge score={stats.avgAccessibility} label="Accessibility" size="lg" />
                  <ScoreGauge score={stats.avgVisual} label="Visual" size="md" />
                  <ScoreGauge score={stats.avgLanguage} label="Language" size="md" />
                  <ScoreGauge score={stats.avgInclusion} label="Inclusion" size="md" />
                  <ScoreGauge score={stats.contrast.rate} label="Contrast" size="md" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Entity Table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Entity Compliance Scores</CardTitle>
              <CardDescription>{entities.length} entities with accessibility data</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8"></TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-center">Accessibility</TableHead>
                      <TableHead className="text-center">Visual</TableHead>
                      <TableHead className="text-center">Language</TableHead>
                      <TableHead className="text-center">Inclusion</TableHead>
                      <TableHead>Last Scan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entities.map((entity) => {
                      const isExpanded = expandedRows.has(entity.id);
                      const wcag = entity.wcag_compliance as any;

                      return (
                        <>
                          <TableRow key={entity.id} className="cursor-pointer hover:bg-muted/50" onClick={() => toggleRow(entity.id)}>
                            <TableCell className="w-8 pr-0">
                              {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                            </TableCell>
                            <TableCell className="font-medium">{entity.entity_name}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[10px] capitalize">{entity.entity_type}</Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <ScoreBadge score={entity.accessibility_score} />
                            </TableCell>
                            <TableCell className="text-center">
                              <ScoreBadge score={entity.visual_score} />
                            </TableCell>
                            <TableCell className="text-center">
                              <ScoreBadge score={entity.language_score} />
                            </TableCell>
                            <TableCell className="text-center">
                              <ScoreBadge score={entity.inclusion_score} />
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {entity.completed_at ? format(new Date(entity.completed_at), 'MMM d, yyyy') : '—'}
                            </TableCell>
                          </TableRow>
                          {isExpanded && (
                            <TableRow key={`${entity.id}-details`}>
                              <TableCell colSpan={8} className="bg-muted/30 p-4">
                                <ExpandedAccessibilityDetails entity={entity} />
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      );
                    })}
                    {entities.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                          <Accessibility className="h-10 w-10 mx-auto mb-3 opacity-30" />
                          <p className="font-medium">No accessibility data yet</p>
                          <p className="text-sm mt-1">Run bias awareness scans on your entities to generate accessibility statistics</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---- WCAG 2.1 Tab ---- */}
        <TabsContent value="wcag" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                WCAG 2.1 Success Criteria Reference
              </CardTitle>
              <CardDescription>Web Content Accessibility Guidelines — Level A, AA, AAA criteria tracked across your portfolio</CardDescription>
            </CardHeader>
            <CardContent>
              {(['perceivable', 'operable', 'understandable', 'robust'] as const).map(category => {
                const items = WCAG_STANDARDS.filter(s => s.category === category);
                return (
                  <div key={category} className="mb-6 last:mb-0">
                    <h4 className="text-sm font-semibold capitalize mb-2 flex items-center gap-2">
                      {category === 'perceivable' && <Eye className="h-4 w-4 text-blue-500" />}
                      {category === 'operable' && <Hand className="h-4 w-4 text-emerald-500" />}
                      {category === 'understandable' && <Brain className="h-4 w-4 text-amber-500" />}
                      {category === 'robust' && <Monitor className="h-4 w-4 text-purple-500" />}
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </h4>
                    <div className="space-y-1">
                      {items.map(standard => (
                        <div key={standard.id} className="flex items-center gap-3 px-3 py-2 rounded-md border bg-card hover:bg-muted/50 transition-colors">
                          <code className="text-xs font-mono text-muted-foreground w-10 shrink-0">{standard.id}</code>
                          <ComplianceBadge level={standard.level} />
                          <span className="text-sm font-medium flex-1">{standard.name}</span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="h-3.5 w-3.5 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent side="left" className="max-w-xs">
                                <p className="text-xs">{standard.description}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---- ADA Tab ---- */}
        <TabsContent value="ada" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                ADA Digital Compliance (Title III)
              </CardTitle>
              <CardDescription>Americans with Disabilities Act — digital accessibility requirements for public accommodations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {ADA_SECTIONS.map(section => (
                <div key={section.id} className="flex items-start gap-4 p-4 border rounded-lg bg-card">
                  <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-semibold">{section.name}</h4>
                      <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-600 border-blue-500/20">{section.standard}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{section.description}</p>
                  </div>
                </div>
              ))}

              <div className="mt-4 p-4 border rounded-lg bg-amber-500/5 border-amber-500/20">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-amber-600">DOJ Enforcement Update</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      As of April 2024, the DOJ finalized a rule under Title II of the ADA requiring WCAG 2.1 Level AA compliance for state and local government web content. 
                      While Title III does not yet have a specific web accessibility rule, courts increasingly reference WCAG 2.1 AA as the de facto standard for private entities.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---- EAA 2025 Tab ---- */}
        <TabsContent value="eaa" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Globe2 className="h-5 w-5 text-primary" />
                European Accessibility Act (EAA) 2025
              </CardTitle>
              <CardDescription>EU Directive 2019/882 — mandatory accessibility for products and services in the EU market</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {EAA_REQUIREMENTS.map(req => {
                const isPast = new Date(req.deadline) <= new Date();
                return (
                  <div key={req.id} className="flex items-start gap-4 p-4 border rounded-lg bg-card">
                    <div className={`p-2 rounded-lg shrink-0 ${isPast ? 'bg-destructive/10' : 'bg-amber-500/10'}`}>
                      {isPast ? <AlertTriangle className="h-5 w-5 text-destructive" /> : <Shield className="h-5 w-5 text-amber-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="text-sm font-semibold">{req.name}</h4>
                        <Badge variant={isPast ? 'destructive' : 'outline'} className="text-[10px]">
                          {isPast ? 'ENFORCEMENT ACTIVE' : `Deadline: ${req.deadline}`}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{req.description}</p>
                    </div>
                  </div>
                );
              })}

              <div className="mt-4 p-4 border rounded-lg bg-destructive/5 border-destructive/20">
                <div className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-destructive">Penalties</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Non-compliance with the EAA can result in fines up to €100M or market withdrawal of non-compliant products and services. 
                      Each EU member state sets specific penalty amounts. Enforcement is active since June 28, 2025.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---- Persona Spectrum Tab ---- */}
        <TabsContent value="persona" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Accessibility className="h-5 w-5 text-primary" />
                Microsoft Persona Spectrum Coverage
              </CardTitle>
              <CardDescription>Aggregate coverage across permanent, temporary, and situational accessibility needs</CardDescription>
            </CardHeader>
            <CardContent>
              {stats ? (
                <div className="space-y-6">
                  {/* Dimension Scores */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {[
                      { key: 'mobility', label: 'Mobility', icon: <Hand className="h-5 w-5" />, examples: 'Wheelchair · Broken arm · Carrying child' },
                      { key: 'vision', label: 'Vision', icon: <Eye className="h-5 w-5" />, examples: 'Blind · Dilated pupils · Bright sunlight' },
                      { key: 'hearing', label: 'Hearing', icon: <Ear className="h-5 w-5" />, examples: 'Deaf · Ear infection · Noisy venue' },
                      { key: 'speech', label: 'Speech', icon: <FileText className="h-5 w-5" />, examples: 'Non-verbal · Laryngitis · Foreign language' },
                      { key: 'cognitive', label: 'Cognitive', icon: <Brain className="h-5 w-5" />, examples: 'ADHD · Concussion · Info overload' },
                    ].map(dim => {
                      const score = stats.persona[dim.key as keyof typeof stats.persona];
                      return (
                        <Card key={dim.key} className="p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <div className={`p-1.5 rounded-lg ${score >= 80 ? 'bg-emerald-500/10 text-emerald-500' : score >= 60 ? 'bg-amber-500/10 text-amber-500' : 'bg-destructive/10 text-destructive'}`}>
                              {dim.icon}
                            </div>
                            <h4 className="text-sm font-semibold">{dim.label}</h4>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className={`text-xl font-bold ${score >= 80 ? 'text-emerald-500' : score >= 60 ? 'text-amber-500' : 'text-destructive'}`}>
                                {score}%
                              </span>
                            </div>
                            <Progress value={score} className="h-2" />
                            <p className="text-[10px] text-muted-foreground leading-tight">{dim.examples}</p>
                          </div>
                        </Card>
                      );
                    })}
                  </div>

                  {/* Spectrum Matrix */}
                  <Card className="p-4">
                    <h4 className="text-sm font-semibold mb-3">Persona Spectrum Matrix</h4>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Dimension</TableHead>
                            <TableHead className="text-center">Permanent</TableHead>
                            <TableHead className="text-center">Temporary</TableHead>
                            <TableHead className="text-center">Situational</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {[
                            { dim: 'Mobility', perm: 'Wheelchair user', temp: 'Broken arm', sit: 'Carrying a child' },
                            { dim: 'Vision', perm: 'Blind / Low vision', temp: 'Dilated pupils', sit: 'Bright sunlight' },
                            { dim: 'Hearing', perm: 'Deaf / HoH', temp: 'Ear infection', sit: 'Noisy environment' },
                            { dim: 'Speech', perm: 'Non-verbal', temp: 'Laryngitis', sit: 'Foreign language setting' },
                            { dim: 'Cognitive', perm: 'ADHD / Learning disability', temp: 'Concussion', sit: 'Information overload' },
                          ].map(row => (
                            <TableRow key={row.dim}>
                              <TableCell className="font-medium text-sm">{row.dim}</TableCell>
                              <TableCell className="text-center text-xs text-muted-foreground">{row.perm}</TableCell>
                              <TableCell className="text-center text-xs text-muted-foreground">{row.temp}</TableCell>
                              <TableCell className="text-center text-xs text-muted-foreground">{row.sit}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Accessibility className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>No persona coverage data available yet</p>
                  <p className="text-sm mt-1">Run bias awareness scans to generate persona spectrum analysis</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ---- Sub-components ----

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return <span className="text-xs text-muted-foreground">—</span>;
  const color = score >= 80 ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
    : score >= 60 ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' 
    : 'bg-destructive/10 text-destructive border-destructive/20';
  return <Badge variant="outline" className={`${color} text-xs font-mono`}>{score}</Badge>;
}

function ExpandedAccessibilityDetails({ entity }: { entity: EntityAccessibility }) {
  const wcag = entity.wcag_compliance as any;
  const colorModule = entity.color_accessibility_module as any;
  const persona = entity.persona_coverage as any;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* WCAG Details */}
      <div className="space-y-2">
        <h5 className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1.5">
          <Shield className="h-3.5 w-3.5" /> WCAG Compliance
        </h5>
        {wcag ? (
          <div className="space-y-1.5 text-xs">
            {wcag.level && <p><span className="font-medium">Level:</span> {wcag.level}</p>}
            {wcag.score && <p><span className="font-medium">Score:</span> {wcag.score}/100</p>}
            {Array.isArray(wcag.issues) && wcag.issues.length > 0 && (
              <div>
                <p className="font-medium mb-1">Issues:</p>
                <ul className="list-disc pl-4 space-y-0.5 text-muted-foreground">
                  {wcag.issues.slice(0, 5).map((issue: string, i: number) => (
                    <li key={i}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}
            {Array.isArray(wcag.passes) && wcag.passes.length > 0 && (
              <p className="text-emerald-600">✓ {wcag.passes.length} criteria passing</p>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No WCAG data</p>
        )}
      </div>

      {/* Color Accessibility */}
      <div className="space-y-2">
        <h5 className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1.5">
          <Eye className="h-3.5 w-3.5" /> Color Accessibility
        </h5>
        {colorModule ? (
          <div className="space-y-1.5 text-xs">
            {colorModule.overall_score && <p><span className="font-medium">Score:</span> {colorModule.overall_score}/100</p>}
            {Array.isArray(colorModule.contrast_results) && (
              <p>
                <span className="font-medium">Contrast Checks:</span>{' '}
                {colorModule.contrast_results.filter((r: any) => r.passes || r.ratio >= 4.5).length}/{colorModule.contrast_results.length} passing
              </p>
            )}
            {Array.isArray(colorModule.colorblind_issues) && colorModule.colorblind_issues.length > 0 && (
              <div>
                <p className="font-medium mb-1">Colorblind Issues:</p>
                <ul className="list-disc pl-4 space-y-0.5 text-muted-foreground">
                  {colorModule.colorblind_issues.slice(0, 3).map((issue: string, i: number) => (
                    <li key={i}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No color data</p>
        )}
      </div>

      {/* Persona Coverage */}
      <div className="space-y-2">
        <h5 className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1.5">
          <Accessibility className="h-3.5 w-3.5" /> Persona Coverage
        </h5>
        {persona?.dimensions ? (
          <div className="space-y-1.5 text-xs">
            {Object.entries(persona.dimensions).map(([key, val]: [string, any]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="capitalize font-medium">{key}</span>
                <div className="flex items-center gap-2">
                  <Progress value={val?.score || 0} className="h-1.5 w-16" />
                  <span className="w-8 text-right">{val?.score || 0}%</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No persona data</p>
        )}
      </div>
    </div>
  );
}
