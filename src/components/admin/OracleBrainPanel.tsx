/**
 * Oracle Brain Admin Panel
 * Master org-level intelligence dashboard
 */

import { useState } from 'react';
import { 
  Brain, Sparkles, Target, Users, TrendingUp, Globe2, 
  MessageSquare, Plus, Trash2, Loader2, RefreshCw,
  Lightbulb, BarChart3, BookOpen, Zap, Pencil, Eye,
  Save, X, Bell, Network
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useOracleBrain, type OracleIntelligence } from '@/hooks/useOracleBrain';
import { IntelligenceAlertsWidget } from './IntelligenceAlertsWidget';
import { IntelligenceDigestPanel } from './IntelligenceDigestPanel';
import { IntelligenceGraph } from './IntelligenceGraph';

interface OracleBrainPanelProps {
  organizationId?: string;
}

export function OracleBrainPanel({ organizationId }: OracleBrainPanelProps) {
  const orgId = organizationId || null;
  const {
    intelligence,
    knowledge,
    isLoading,
    isSynthesizing,
    synthesisProgress,
    startSynthesis,
    addKnowledge,
    deleteKnowledge,
    updateKnowledge,
    refetch,
  } = useOracleBrain(orgId);

  if (!orgId) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Brain className="h-12 w-12 mb-4 opacity-50" />
          <p className="text-lg font-medium">No Organization Selected</p>
          <p className="text-sm">Select an organization to access the Oracle Brain</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-primary/5 via-background to-accent/5 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <Brain className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Oracle Brain</h2>
              <p className="text-sm text-muted-foreground">
                Master intelligence synthesizing all entity brains into unified strategic insights
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={refetch} disabled={isLoading}>
              <RefreshCw className={cn("h-4 w-4 mr-1.5", isLoading && "animate-spin")} />
              Refresh
            </Button>
            <Button onClick={startSynthesis} disabled={isSynthesizing} size="sm">
              {isSynthesizing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  Synthesizing...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-1.5" />
                  Run Synthesis
                </>
              )}
            </Button>
          </div>
        </div>

        {isSynthesizing && (
          <div className="mt-4">
            <Progress value={synthesisProgress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">{synthesisProgress}% complete</p>
          </div>
        )}

        {/* Stats */}
        {intelligence && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            <StatCard icon={<Brain className="h-4 w-4" />} label="Entity Brains" value={intelligence.entity_brain_count} />
            <StatCard icon={<BookOpen className="h-4 w-4" />} label="Knowledge Entries" value={intelligence.knowledge_entry_count} />
            <StatCard icon={<BarChart3 className="h-4 w-4" />} label="Syntheses Run" value={intelligence.synthesis_count} />
            <StatCard 
              icon={<Globe2 className="h-4 w-4" />} 
              label="Cultural Score" 
              value={`${intelligence.cultural_readiness?.overall_score || 0}%`} 
            />
          </div>
        )}
      </div>

      {/* Intelligence Alerts */}
      <IntelligenceAlertsWidget organizationId={orgId} />

      {/* Executive Digest */}
      <IntelligenceDigestPanel organizationId={orgId} />

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview" className="gap-1.5">
            <Sparkles className="h-3.5 w-3.5" /> Overview
          </TabsTrigger>
          <TabsTrigger value="strategy" className="gap-1.5">
            <Target className="h-3.5 w-3.5" /> Strategy
          </TabsTrigger>
          <TabsTrigger value="knowledge" className="gap-1.5">
            <BookOpen className="h-3.5 w-3.5" /> Knowledge Base
          </TabsTrigger>
          <TabsTrigger value="graph" className="gap-1.5">
            <Network className="h-3.5 w-3.5" /> Relationships
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <OracleOverview intelligence={intelligence} />
        </TabsContent>

        <TabsContent value="strategy" className="space-y-4 mt-4">
          <OracleStrategy intelligence={intelligence} />
        </TabsContent>

        <TabsContent value="knowledge" className="space-y-4 mt-4">
          <OracleKnowledgeBase 
            knowledge={knowledge} 
            onAdd={addKnowledge} 
            onDelete={deleteKnowledge}
            onUpdate={updateKnowledge}
          />
        </TabsContent>

        <TabsContent value="graph" className="space-y-4 mt-4">
          <IntelligenceGraph organizationId={orgId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ---- Sub-components ----

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-background/60 border">
      <div className="text-primary">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
}

function OracleOverview({ intelligence }: { intelligence: OracleIntelligence | null }) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (!intelligence?.org_summary) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Sparkles className="h-10 w-10 mb-3 opacity-40" />
          <p className="font-medium">No synthesis data yet</p>
          <p className="text-sm">Run a synthesis to generate org-wide intelligence</p>
        </CardContent>
      </Card>
    );
  }

  const patterns = intelligence.cross_entity_patterns || {};
  const voice = intelligence.unified_voice_profile || {};
  const audience = intelligence.unified_audience_map || {};
  const competitive = intelligence.competitive_overview || {};
  const cultural = intelligence.cultural_readiness || {};
  const portfolio = intelligence.portfolio_analysis || {};
  const market = intelligence.market_landscape || {};
  const recs = Array.isArray(intelligence.strategic_recommendations) ? intelligence.strategic_recommendations : [];

  const hasPatterns = Object.keys(patterns).length > 0;
  const hasVoice = voice.primary_tone || voice.communication_style;
  const hasAudience = audience.primary_segment;
  const hasCompetitive = competitive.market_position;
  const hasCultural = cultural.overall_score != null;
  const hasPortfolio = portfolio.synergies || portfolio.gaps || portfolio.conflicts || portfolio.recommendations;
  const hasMarket = market.overall_position;

  return (
    <div className="space-y-4">
      {/* Org Summary — Full Width Hero */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Organization Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{intelligence.org_summary}</p>
          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <p className="text-xs text-muted-foreground">
              {intelligence.last_synthesis_at &&
                `Last synthesized: ${new Date(intelligence.last_synthesis_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`
              }
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary" className="text-[10px]">{intelligence.synthesis_count} syntheses</Badge>
              <Badge variant="secondary" className="text-[10px]">{intelligence.entity_brain_count} entity brains</Badge>
              <Badge variant="secondary" className="text-[10px]">{intelligence.knowledge_entry_count} knowledge entries</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Strategic Recommendations — Inline if available */}
      {recs.length > 0 && (
        <ExpandableSection
          title="Strategic Recommendations"
          icon={<Lightbulb className="h-4 w-4 text-primary" />}
          badge={`${recs.length}`}
          expanded={expandedSections['recs']}
          onToggle={() => toggleSection('recs')}
        >
          <div className="space-y-2">
            {recs.map((rec: any, i: number) => (
              <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg border bg-card/60">
                <Badge className={cn(
                  "text-[10px] shrink-0 mt-0.5",
                  rec.priority === 'high' ? 'bg-red-500/10 text-red-500' :
                  rec.priority === 'medium' ? 'bg-amber-500/10 text-amber-500' :
                  'bg-emerald-500/10 text-emerald-500'
                )}>
                  {rec.priority}
                </Badge>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{rec.recommendation}</p>
                  {rec.rationale && <p className="text-xs text-muted-foreground mt-0.5">{rec.rationale}</p>}
                  {rec.impact && <p className="text-xs text-primary mt-0.5">Impact: {rec.impact}</p>}
                </div>
              </div>
            ))}
          </div>
        </ExpandableSection>
      )}

      {/* Detail Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Cultural Readiness — always show if score exists */}
        <ExpandableSection
          title="Cultural Readiness"
          icon={<Globe2 className="h-4 w-4 text-primary" />}
          badge={hasCultural ? `${cultural.overall_score}%` : undefined}
          badgeColor={hasCultural ? (cultural.overall_score >= 70 ? 'text-emerald-500' : cultural.overall_score >= 40 ? 'text-amber-500' : 'text-red-500') : undefined}
          expanded={expandedSections['cultural']}
          onToggle={() => toggleSection('cultural')}
          empty={!hasCultural}
        >
          {hasCultural && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Progress value={cultural.overall_score} className="flex-1" />
                <span className={cn(
                  "text-sm font-bold",
                  cultural.overall_score >= 70 ? "text-emerald-500" :
                  cultural.overall_score >= 40 ? "text-amber-500" : "text-red-500"
                )}>
                  {cultural.overall_score}%
                </span>
              </div>
              {/* Sub-dimensions */}
              {cultural.photography_strategy && Object.keys(cultural.photography_strategy).length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Photography Strategy</p>
                  {Object.entries(cultural.photography_strategy).map(([key, val]: [string, any]) => (
                    val && <p key={key} className="text-xs text-foreground ml-2">• {key.replace(/_/g, ' ')}: {typeof val === 'string' ? val : JSON.stringify(val)}</p>
                  ))}
                </div>
              )}
              {cultural.persona_design_maturity && Object.keys(cultural.persona_design_maturity).length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Persona Design Maturity</p>
                  {Object.entries(cultural.persona_design_maturity).map(([key, val]: [string, any]) => (
                    val && <p key={key} className="text-xs text-foreground ml-2">• {key.replace(/_/g, ' ')}: {typeof val === 'string' ? val : JSON.stringify(val)}</p>
                  ))}
                </div>
              )}
              <PortfolioList title="Strongest Markets" items={cultural.strongest_markets} color="text-emerald-500" />
              <PortfolioList title="Expansion Opportunities" items={cultural.expansion_opportunities} color="text-primary" />
              <PortfolioList title="Localization Gaps" items={cultural.localization_gaps} color="text-amber-500" />
            </div>
          )}
        </ExpandableSection>

        {/* Cross-Entity Patterns */}
        <ExpandableSection
          title="Cross-Entity Patterns"
          icon={<TrendingUp className="h-4 w-4 text-primary" />}
          expanded={expandedSections['patterns']}
          onToggle={() => toggleSection('patterns')}
          empty={!hasPatterns}
        >
          {hasPatterns && (
            <div className="space-y-2">
              {patterns.voice_consistency && <PatternRow label="Voice Consistency" value={patterns.voice_consistency} />}
              {patterns.audience_overlap && <PatternRow label="Audience Overlap" value={patterns.audience_overlap} />}
              {patterns.visual_coherence && <PatternRow label="Visual Coherence" value={patterns.visual_coherence} />}
              {patterns.messaging_alignment && <PatternRow label="Messaging Alignment" value={patterns.messaging_alignment} />}
              {/* Render any additional keys */}
              {Object.entries(patterns)
                .filter(([k]) => !['voice_consistency', 'audience_overlap', 'visual_coherence', 'messaging_alignment'].includes(k))
                .map(([k, v]) => (
                  <PatternRow key={k} label={k.replace(/_/g, ' ')} value={String(v)} />
                ))}
            </div>
          )}
        </ExpandableSection>

        {/* Unified Voice */}
        <ExpandableSection
          title="Unified Voice Profile"
          icon={<MessageSquare className="h-4 w-4 text-primary" />}
          expanded={expandedSections['voice']}
          onToggle={() => toggleSection('voice')}
          empty={!hasVoice}
        >
          {hasVoice && (
            <div className="space-y-2">
              {voice.communication_style && <p className="text-sm text-foreground">{voice.communication_style}</p>}
              <div className="flex flex-wrap gap-1.5">
                {voice.primary_tone && <Badge variant="default" className="text-xs">{voice.primary_tone}</Badge>}
                {Array.isArray(voice.secondary_tones) && voice.secondary_tones.map((t: string, i: number) => (
                  <Badge key={i} variant="secondary" className="text-xs">{t}</Badge>
                ))}
                {Array.isArray(voice.personality_traits) && voice.personality_traits.map((t: string, i: number) => (
                  <Badge key={`p-${i}`} variant="outline" className="text-xs">{t}</Badge>
                ))}
              </div>
            </div>
          )}
        </ExpandableSection>

        {/* Audience Map */}
        <ExpandableSection
          title="Unified Audience Map"
          icon={<Users className="h-4 w-4 text-primary" />}
          expanded={expandedSections['audience']}
          onToggle={() => toggleSection('audience')}
          empty={!hasAudience}
        >
          {hasAudience && (
            <div className="space-y-2">
              <p className="text-sm"><span className="font-medium">Primary:</span> {audience.primary_segment}</p>
              {Array.isArray(audience.secondary_segments) && audience.secondary_segments.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Secondary Segments</p>
                  <div className="flex flex-wrap gap-1">{audience.secondary_segments.map((s: string, i: number) => (
                    <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
                  ))}</div>
                </div>
              )}
              {Array.isArray(audience.underserved_segments) && audience.underserved_segments.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Underserved</p>
                  <div className="flex flex-wrap gap-1">{audience.underserved_segments.map((s: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-xs text-amber-500">{s}</Badge>
                  ))}</div>
                </div>
              )}
            </div>
          )}
        </ExpandableSection>

        {/* Competitive Overview */}
        <ExpandableSection
          title="Competitive Overview"
          icon={<Target className="h-4 w-4 text-primary" />}
          expanded={expandedSections['competitive']}
          onToggle={() => toggleSection('competitive')}
          empty={!hasCompetitive}
        >
          {hasCompetitive && (
            <div className="space-y-2">
              <p className="text-sm">{competitive.market_position}</p>
              {competitive.competitive_moat && (
                <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">Moat:</span> {competitive.competitive_moat}</p>
              )}
              {Array.isArray(competitive.key_competitors) && competitive.key_competitors.length > 0 && (
                <div className="flex flex-wrap gap-1">{competitive.key_competitors.map((c: string, i: number) => (
                  <Badge key={i} variant="outline" className="text-xs">{c}</Badge>
                ))}</div>
              )}
            </div>
          )}
        </ExpandableSection>

        {/* Portfolio Analysis */}
        <ExpandableSection
          title="Portfolio Analysis"
          icon={<BarChart3 className="h-4 w-4 text-primary" />}
          expanded={expandedSections['portfolio']}
          onToggle={() => toggleSection('portfolio')}
          empty={!hasPortfolio}
        >
          {hasPortfolio && (
            <div className="grid gap-3 sm:grid-cols-2">
              <PortfolioList title="Synergies" items={portfolio.synergies} color="text-emerald-500" />
              <PortfolioList title="Gaps" items={portfolio.gaps} color="text-amber-500" />
              <PortfolioList title="Conflicts" items={portfolio.conflicts} color="text-red-500" />
              <PortfolioList title="Recommendations" items={portfolio.recommendations} color="text-primary" />
            </div>
          )}
        </ExpandableSection>

        {/* Market Landscape */}
        <ExpandableSection
          title="Market Landscape"
          icon={<TrendingUp className="h-4 w-4 text-primary" />}
          expanded={expandedSections['market']}
          onToggle={() => toggleSection('market')}
          empty={!hasMarket}
        >
          {hasMarket && (
            <div className="space-y-2">
              <p className="text-sm">{market.overall_position}</p>
              {market.differentiation && (
                <p className="text-xs text-muted-foreground">{market.differentiation}</p>
              )}
              <PortfolioList title="Opportunities" items={market.market_opportunities} color="text-emerald-500" />
              <PortfolioList title="Threats" items={market.threats} color="text-red-500" />
            </div>
          )}
        </ExpandableSection>
      </div>
    </div>
  );
}

/** Expandable detail section card */
function ExpandableSection({
  title, icon, badge, badgeColor, expanded, onToggle, empty, children
}: {
  title: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
  expanded?: boolean;
  onToggle: () => void;
  empty?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card className={cn("transition-all", empty && "opacity-60")}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 rounded-t-lg transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium">{title}</span>
          {badge && (
            <span className={cn("text-xs font-bold ml-1", badgeColor || "text-primary")}>{badge}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {empty && <span className="text-[10px] text-muted-foreground">No data yet</span>}
          <Eye className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", expanded && "rotate-180")} />
        </div>
      </button>
      {expanded && !empty && (
        <CardContent className="pt-0 pb-4">
          {children}
        </CardContent>
      )}
    </Card>
  );
}

function PatternRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground">{value}</p>
    </div>
  );
}

function OracleStrategy({ intelligence }: { intelligence: OracleIntelligence | null }) {
  if (!intelligence) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Target className="h-10 w-10 mb-3 opacity-40" />
          <p className="font-medium">No strategic data yet</p>
          <p className="text-sm">Run a synthesis to generate strategic recommendations</p>
        </CardContent>
      </Card>
    );
  }

  const portfolio = intelligence.portfolio_analysis || {};
  const recs = Array.isArray(intelligence.strategic_recommendations) ? intelligence.strategic_recommendations : [];
  const cultural = intelligence.cultural_readiness || {};
  const market = intelligence.market_landscape || {};

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Portfolio Analysis */}
      <Card className="md:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" /> Portfolio Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <PortfolioList title="Synergies" items={portfolio.synergies} color="text-emerald-500" />
            <PortfolioList title="Gaps" items={portfolio.gaps} color="text-amber-500" />
            <PortfolioList title="Conflicts" items={portfolio.conflicts} color="text-red-500" />
            <PortfolioList title="Recommendations" items={portfolio.recommendations} color="text-primary" />
          </div>
        </CardContent>
      </Card>

      {/* Strategic Recommendations */}
      {recs.length > 0 && (
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-primary" /> Strategic Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recs.map((rec: any, i: number) => (
                <div key={i} className="flex items-start gap-2 p-3 rounded-lg border bg-card">
                  <Badge className={cn(
                    "text-[10px] shrink-0 mt-0.5",
                    rec.priority === 'high' ? 'bg-red-500/10 text-red-500' :
                    rec.priority === 'medium' ? 'bg-amber-500/10 text-amber-500' :
                    'bg-emerald-500/10 text-emerald-500'
                  )}>
                    {rec.priority}
                  </Badge>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{rec.recommendation}</p>
                    {rec.rationale && <p className="text-xs text-muted-foreground mt-0.5">{rec.rationale}</p>}
                    {rec.impact && <p className="text-xs text-primary mt-0.5">Impact: {rec.impact}</p>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Market Landscape */}
      {market.overall_position && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Market Landscape
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">{market.overall_position}</p>
            {market.differentiation && (
              <p className="text-xs text-muted-foreground">{market.differentiation}</p>
            )}
            <PortfolioList title="Opportunities" items={market.market_opportunities} color="text-emerald-500" />
            <PortfolioList title="Threats" items={market.threats} color="text-red-500" />
          </CardContent>
        </Card>
      )}

      {/* Cultural Readiness */}
      {cultural.overall_score != null && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Globe2 className="h-4 w-4 text-primary" /> Cultural Readiness
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <Progress value={cultural.overall_score} className="flex-1" />
              <span className={cn(
                "text-sm font-bold",
                cultural.overall_score >= 70 ? "text-emerald-500" :
                cultural.overall_score >= 40 ? "text-amber-500" : "text-red-500"
              )}>
                {cultural.overall_score}%
              </span>
            </div>
            <PortfolioList title="Strongest Markets" items={cultural.strongest_markets} color="text-emerald-500" />
            <PortfolioList title="Expansion Opportunities" items={cultural.expansion_opportunities} color="text-primary" />
            <PortfolioList title="Localization Gaps" items={cultural.localization_gaps} color="text-amber-500" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function PortfolioList({ title, items, color }: { title: string; items: any; color: string }) {
  const list = Array.isArray(items) ? items : [];
  if (list.length === 0) return null;

  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-1">{title}</p>
      <div className="space-y-1">
        {list.map((item: string, i: number) => (
          <div key={i} className="flex items-start gap-1.5 text-xs">
            <span className={cn("mt-0.5", color)}>•</span>
            <span className="text-foreground">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function OracleKnowledgeBase({ 
  knowledge, 
  onAdd, 
  onDelete,
  onUpdate,
}: { 
  knowledge: any[]; 
  onAdd: (title: string, content: string, contentType?: string, tags?: string[]) => Promise<any>;
  onDelete: (id: string) => Promise<void>;
  onUpdate: (id: string, updates: { title?: string; content?: string; tags?: string[]; category?: string }) => Promise<any>;
}) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newTags, setNewTags] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // View/Edit state
  const [selectedEntry, setSelectedEntry] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const openEntry = (entry: any, edit = false) => {
    setSelectedEntry(entry);
    setEditTitle(entry.title || '');
    setEditContent(entry.content || '');
    setEditTags(Array.isArray(entry.tags) ? entry.tags.join(', ') : '');
    setIsEditing(edit);
  };

  const handleSave = async () => {
    if (!selectedEntry || !editTitle.trim() || !editContent.trim()) return;
    setIsSaving(true);
    const tags = editTags.split(',').map(t => t.trim()).filter(Boolean);
    await onUpdate(selectedEntry.id, { title: editTitle.trim(), content: editContent.trim(), tags });
    setSelectedEntry(null);
    setIsEditing(false);
    setIsSaving(false);
  };

  const handleAdd = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    setIsAdding(true);
    const tags = newTags.split(',').map(t => t.trim()).filter(Boolean);
    await onAdd(newTitle.trim(), newContent.trim(), 'text', tags);
    setNewTitle('');
    setNewContent('');
    setNewTags('');
    setShowAddDialog(false);
    setIsAdding(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Knowledge Base</h3>
          <p className="text-xs text-muted-foreground">{knowledge.length} entries</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1.5" /> Add Entry
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Knowledge Entry</DialogTitle>
              <DialogDescription>
                Add org-wide knowledge that the Oracle Brain will use during synthesis
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <Input
                placeholder="Title (e.g., 'Q4 Market Strategy')"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
              <Textarea
                placeholder="Content — paste reports, market data, strategic notes..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                rows={6}
              />
              <Input
                placeholder="Tags (comma-separated, e.g., strategy, Q4, markets)"
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
              />
              <Button onClick={handleAdd} disabled={isAdding || !newTitle.trim() || !newContent.trim()} className="w-full">
                {isAdding ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Plus className="h-4 w-4 mr-1.5" />}
                Add to Knowledge Base
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {knowledge.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <BookOpen className="h-8 w-8 mb-2 opacity-40" />
            <p className="text-sm font-medium">No knowledge entries yet</p>
            <p className="text-xs">Add strategic documents, reports, or insights</p>
          </CardContent>
        </Card>
      ) : (
        <div className="max-h-[800px] overflow-y-auto">
          <div className="space-y-2">
            {knowledge.map((entry) => (
              <Card key={entry.id} className="border-border/50 cursor-pointer hover:border-primary/30 transition-colors" onClick={() => openEntry(entry)}>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium truncate">{entry.title}</p>
                        <Badge variant="outline" className="text-[10px] shrink-0">{entry.content_type}</Badge>
                        {entry.source_type === 'entity_brain' && (
                          <Badge variant="secondary" className="text-[10px] shrink-0">Auto</Badge>
                        )}
                        {entry.source_type === 'document_import' && (
                          <Badge variant="secondary" className="text-[10px] shrink-0">Import</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{entry.content}</p>
                      {entry.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {entry.tags.slice(0, 5).map((tag: string, i: number) => (
                            <Badge key={i} variant="secondary" className="text-[10px]">{tag}</Badge>
                          ))}
                          {entry.tags.length > 5 && (
                            <Badge variant="secondary" className="text-[10px]">+{entry.tags.length - 5}</Badge>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-primary"
                        onClick={(e) => { e.stopPropagation(); openEntry(entry, true); }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); onDelete(entry.id); }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* View / Edit Dialog */}
      <Dialog open={!!selectedEntry} onOpenChange={(open) => { if (!open) { setSelectedEntry(null); setIsEditing(false); } }}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between pr-6">
              <DialogTitle className="flex items-center gap-2">
                {isEditing ? <Pencil className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {isEditing ? 'Edit Knowledge Entry' : 'Knowledge Entry'}
              </DialogTitle>
              {!isEditing && (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit
                </Button>
              )}
            </div>
            <DialogDescription>
              {selectedEntry?.source_type === 'entity_brain' ? 'Auto-generated from entity intelligence' :
               selectedEntry?.source_type === 'document_import' ? 'Imported from document' :
               'Manually added knowledge entry'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 py-2">
            {isEditing ? (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Title</label>
                  <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Content</label>
                  <Textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={14} className="font-mono text-xs" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Tags (comma-separated)</label>
                  <Input value={editTags} onChange={(e) => setEditTags(e.target.value)} />
                </div>
              </>
            ) : (
              <>
                <div>
                  <h3 className="font-semibold text-lg">{selectedEntry?.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-[10px]">{selectedEntry?.content_type}</Badge>
                    {selectedEntry?.source_type && (
                      <Badge variant="secondary" className="text-[10px]">{selectedEntry.source_type}</Badge>
                    )}
                    {selectedEntry?.created_at && (
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(selectedEntry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    )}
                  </div>
                </div>
                <div className="whitespace-pre-wrap text-sm text-foreground leading-relaxed bg-muted/30 rounded-lg p-4 border">
                  {selectedEntry?.content}
                </div>
                {selectedEntry?.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedEntry.tags.map((tag: string, i: number) => (
                      <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {isEditing && (
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                <X className="h-3.5 w-3.5 mr-1.5" /> Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isSaving || !editTitle.trim() || !editContent.trim()}>
                {isSaving ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
                Save Changes
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
