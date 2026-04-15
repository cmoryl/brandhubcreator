import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Brain, 
  Plus, 
  Trash2, 
  Sparkles, 
  Target, 
  TrendingUp, 
  Users, 
  MessageSquare,
  Lightbulb,
  BarChart3,
  Clock,
  Loader2,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Zap,
  Activity,
  Globe2,
  Palette,
  Image,
  Languages,
  MapPin,
  CheckCircle2,
  Cable,
  Download,
  Shield,
  Eye,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { InsightFeedbackControls } from './intelligence/InsightFeedbackControls';
import { LearningStatusBadge } from './intelligence/LearningStatusBadge';
import { ConfidenceIndicator } from './intelligence/ConfidenceIndicator';
import { InsightActionTracker } from './intelligence/InsightActionTracker';
import { BiasAwarenessPanel } from './BiasAwarenessPanel';
import { VisibilityGapsPanel } from './visibility/VisibilityGapsPanel';
import { CompetitiveLandscapeSection } from './intelligence/CompetitiveLandscapeSection';
import { CulturalIntelligenceSection } from './intelligence/CulturalIntelligenceSection';
import { ImportReportDialog } from './intelligence/ImportReportDialog';
import { VisualIntelligenceCard } from './approved-imagery/VisualIntelligenceCard';
import { exportBrandIntelligenceHtml, exportBrandIntelligencePdf } from '@/lib/exportHtml';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FileText, FileDown } from 'lucide-react';

interface KnowledgeEntry {
  id: string;
  type: 'insight' | 'note' | 'learning' | 'milestone' | 'feedback' | 'metric';
  content: string;
  source: 'manual' | 'ai';
  category?: string;
  created_at: string;
  confidence?: number;
}

interface InsightFeedback {
  id: string;
  insight_id: string;
  status: 'approved' | 'rejected' | 'corrected';
  correction_text?: string;
  user_id: string;
  timestamp: string;
}

interface LearningContext {
  approved_insights?: string[];
  rejected_insights?: string[];
  user_corrections?: Array<{ original: string; corrected: string }>;
  high_engagement_insights?: string[];
  confidence_calibration?: number;
}

interface CompetitiveLandscape {
  tracked_competitors: string[];
  positioning_summary: string;
  competitive_gaps: string[];
  differentiation_opportunities: string[];
  threat_assessment: {
    competitor: string;
    threat_level: 'high' | 'medium' | 'low';
    key_threat: string;
  }[];
  market_share_estimate: string;
}

interface CulturalInsights {
  global_readiness_score: number;
  primary_markets: string[];
  cultural_considerations: {
    region: string;
    considerations: string[];
    design_adaptations: string[];
    messaging_notes: string;
  }[];
  localization_priorities: string[];
  color_cultural_notes: string[];
  imagery_guidelines: string[];
}

interface GlobalLinkRecommendation {
  product: string;
  relevance: 'high' | 'medium' | 'low';
  use_case: string;
}

interface BrandIntelligence {
  id: string;
  entity_type: string;
  entity_id: string;
  knowledge_entries: KnowledgeEntry[];
  insight_feedback?: InsightFeedback[];
  learning_context?: LearningContext;
  feedback_score?: number;
  parent_entity_id?: string;
  brand_summary: string | null;
  market_position: string | null;
  target_audience: {
    primary: string;
    secondary: string[];
    demographics: string[];
  } | null;
  competitive_advantages: string[];
  brand_voice_profile: {
    tone: string[];
    personality: string[];
    communication_style: string;
  } | null;
  growth_recommendations: {
    priority: 'high' | 'medium' | 'low';
    recommendation: string;
    rationale: string;
    confidence?: number;
  }[];
  competitive_landscape?: CompetitiveLandscape | null;
  cultural_insights?: CulturalInsights | null;
  globallink_recommendations?: GlobalLinkRecommendation[];
  localization_readiness_score?: number;
  analysis_count: number;
  last_analyzed_at: string | null;
  insight_actions?: any[];
  confidence_history?: any[];
}

interface BrandIntelligencePanelProps {
  entityType: 'brand' | 'product' | 'event';
  entityId: string;
  entityName: string;
  organizationId?: string;
  parentBrandName?: string;
}

const entryTypeIcons: Record<string, React.ReactNode> = {
  insight: <Lightbulb className="h-4 w-4 text-amber-500" />,
  note: <BookOpen className="h-4 w-4 text-blue-500" />,
  learning: <Brain className="h-4 w-4 text-purple-500" />,
  milestone: <Target className="h-4 w-4 text-green-500" />,
  feedback: <MessageSquare className="h-4 w-4 text-cyan-500" />,
  metric: <BarChart3 className="h-4 w-4 text-rose-500" />,
};

const priorityColors: Record<string, string> = {
  high: 'bg-red-500/10 text-red-500 border-red-500/20',
  medium: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  low: 'bg-green-500/10 text-green-500 border-green-500/20',
};

export const BrandIntelligencePanel = ({ 
  entityType, 
  entityId, 
  entityName,
  organizationId,
  parentBrandName 
}: BrandIntelligencePanelProps) => {
  const [intelligence, setIntelligence] = useState<BrandIntelligence | null>(null);
  const [visibilityAuditForExport, setVisibilityAuditForExport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const [newEntry, setNewEntry] = useState({ type: 'note', content: '', category: '' });
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    knowledge: false,
    analysis: false,
    recommendations: false,
    competitive: false,
    cultural: false,
    integrations: false,
    visibility: false,
  });
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  const getFeedbackForInsight = useCallback((insightId: string): InsightFeedback | undefined => {
    return intelligence?.insight_feedback?.find(f => f.insight_id === insightId);
  }, [intelligence?.insight_feedback]);

  const handleSubmitFeedback = useCallback(async (
    insightId: string, 
    status: 'approved' | 'rejected' | 'corrected', 
    correctionText?: string
  ) => {
    try {
      const { data, error } = await supabase.functions.invoke('brand-intelligence', {
        body: { 
          action: 'submit_feedback', 
          entityType, 
          entityId, 
          organizationId,
          feedback: { insight_id: insightId, status, correction_text: correctionText }
        }
      });

      if (error) throw error;

      // Update local state
      setIntelligence(prev => {
        if (!prev) return null;
        const existingFeedback = prev.insight_feedback || [];
        const filteredFeedback = existingFeedback.filter(
          f => f.insight_id !== insightId
        );
        return {
          ...prev,
          insight_feedback: [...filteredFeedback, data.feedback],
        };
      });

      const messages = {
        approved: 'Insight approved - AI will learn from this',
        rejected: 'Insight rejected - AI will avoid similar patterns',
        corrected: 'Correction saved - AI will learn your preference',
      };
      toast.success(messages[status]);
    } catch (err) {
      console.error('Failed to submit feedback:', err);
      toast.error('Failed to save feedback');
    }
  }, [entityType, entityId, organizationId]);

  useEffect(() => {
    fetchIntelligence();
    // Fetch latest visibility audit for export
    if (entityId) {
      supabase
        .from('brand_visibility_audits')
        .select('*')
        .eq('entity_id', entityId)
        .eq('entity_type', entityType)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
        .then(({ data }) => {
          if (data) setVisibilityAuditForExport(data);
        });
    }
  }, [entityId]);

  const fetchIntelligence = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('brand-intelligence', {
        body: { action: 'get', entityType, entityId, organizationId }
      });

      if (error) throw error;
      setIntelligence(data.intelligence);
    } catch (err) {
      console.error('Failed to fetch intelligence:', err);
      toast.error('Failed to load brand intelligence');
    } finally {
      setIsLoading(false);
    }
  };

  const addEntry = async () => {
    if (!newEntry.content.trim()) {
      toast.error('Please enter some content');
      return;
    }

    setIsAddingEntry(true);
    try {
      const { data, error } = await supabase.functions.invoke('brand-intelligence', {
        body: { 
          action: 'add_entry', 
          entityType, 
          entityId, 
          organizationId,
          entry: newEntry 
        }
      });

      if (error) throw error;

      setIntelligence(prev => prev ? {
        ...prev,
        knowledge_entries: [...(prev.knowledge_entries || []), data.entry]
      } : null);
      
      setNewEntry({ type: 'note', content: '', category: '' });
      toast.success('Knowledge entry added');
    } catch (err) {
      console.error('Failed to add entry:', err);
      toast.error('Failed to add entry');
    } finally {
      setIsAddingEntry(false);
    }
  };

  const deleteEntry = async (entryId: string) => {
    try {
      const { error } = await supabase.functions.invoke('brand-intelligence', {
        body: { 
          action: 'delete_entry', 
          entityType, 
          entityId, 
          organizationId,
          entry: { id: entryId } 
        }
      });

      if (error) throw error;

      setIntelligence(prev => prev ? {
        ...prev,
        knowledge_entries: prev.knowledge_entries.filter(e => e.id !== entryId)
      } : null);
      
      toast.success('Entry deleted');
    } catch (err) {
      console.error('Failed to delete entry:', err);
      toast.error('Failed to delete entry');
    }
  };

  // Poll for job status
  const pollJobStatus = useCallback(async (jobId: string) => {
    try {
      const { data, error } = await supabase
        .from('brand_intelligence_jobs')
        .select('*')
        .eq('id', jobId)
        .maybeSingle();

      if (error || !data) {
        console.error('[BrandIntelligencePanel] Polling error:', error);
        return;
      }

      setAnalysisProgress(data.progress || 0);

      if (data.status === 'completed') {
        setIsAnalyzing(false);
        setAnalysisProgress(0);
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
        const result = data.result as any;
        toast.success(`Analysis complete! ${result?.insights_added || 0} new insights added.`);
        fetchIntelligence();
      } else if (data.status === 'failed') {
        setIsAnalyzing(false);
        setAnalysisProgress(0);
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
        toast.error(data.error_message || 'Analysis failed');
      }
    } catch (err) {
      console.error('[BrandIntelligencePanel] Poll error:', err);
    }
  }, []);

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    try {
      const { data, error } = await supabase.functions.invoke('brand-intelligence', {
        body: { action: 'analyze', entityType, entityId, organizationId }
      });

      if (error) throw error;

      if (!data?.job_id) {
        throw new Error('No job ID returned');
      }

      toast.info('Analysis started...');

      // Start polling for job status
      pollingRef.current = setInterval(() => {
        pollJobStatus(data.job_id);
      }, 2000);

      // Initial poll
      pollJobStatus(data.job_id);
    } catch (err: any) {
      console.error('Analysis failed:', err);
      setIsAnalyzing(false);
      setAnalysisProgress(0);
      if (err.message?.includes('Rate limit')) {
        toast.error('Rate limit exceeded. Please try again later.');
      } else if (err.message?.includes('credits')) {
        toast.error('AI credits exhausted. Please add funds.');
      } else {
        toast.error('Analysis failed. Please try again.');
      }
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  if (isLoading) {
    return (
      <Card className="border-primary/20">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 flex flex-col h-full overflow-hidden">
      <CardHeader className="pb-4 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">{entityType === 'event' ? 'Event' : 'Brand'} Intelligence</CardTitle>
              <CardDescription>{entityName}</CardDescription>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              {intelligence && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Download className="h-4 w-4" />
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="gap-2"
                      onClick={async () => {
                        try {
                          toast.loading('Generating PDF...', { id: 'pdf-export' });
                          await exportBrandIntelligencePdf(intelligence, { entityName, entityType });
                          toast.success('PDF report downloaded', { id: 'pdf-export' });
                        } catch {
                          toast.error('PDF export failed', { id: 'pdf-export' });
                        }
                      }}
                    >
                      <FileDown className="h-4 w-4" />
                      Export as PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="gap-2"
                      onClick={() => {
                        exportBrandIntelligenceHtml(intelligence, { entityName, entityType });
                        toast.success('HTML report downloaded');
                      }}
                    >
                      <FileText className="h-4 w-4" />
                      Export as HTML
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <Button 
                onClick={runAnalysis} 
                disabled={isAnalyzing}
                className="gap-2"
              >
                {isAnalyzing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {isAnalyzing ? `Analyzing... ${analysisProgress}%` : 'Run AI Analysis'}
              </Button>
            </div>
            {isAnalyzing && (
              <div className="space-y-1.5 w-48">
                <Progress value={analysisProgress} className="h-2" />
                <div className="flex items-center gap-1.5">
                  {analysisProgress < 30 && (
                    <span className="text-[10px] text-muted-foreground animate-pulse flex items-center gap-1">
                      <Eye className="h-3 w-3" /> Scanning visual assets…
                    </span>
                  )}
                  {analysisProgress >= 30 && analysisProgress < 60 && (
                    <span className="text-[10px] text-muted-foreground animate-pulse flex items-center gap-1">
                      <FileText className="h-3 w-3" /> Analyzing documents…
                    </span>
                  )}
                  {analysisProgress >= 60 && analysisProgress < 85 && (
                    <span className="text-[10px] text-muted-foreground animate-pulse flex items-center gap-1">
                      <Brain className="h-3 w-3" /> Generating insights…
                    </span>
                  )}
                  {analysisProgress >= 85 && (
                    <span className="text-[10px] text-muted-foreground animate-pulse flex items-center gap-1">
                      <Sparkles className="h-3 w-3" /> Finalizing…
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Stats row */}
        <div className="flex gap-4 mt-4 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <BookOpen className="h-4 w-4" />
            <span>{intelligence?.knowledge_entries?.length || 0} entries</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <BarChart3 className="h-4 w-4" />
            <span>{intelligence?.analysis_count || 0} analyses</span>
          </div>
          {intelligence?.last_analyzed_at && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Last: {new Date(intelligence.last_analyzed_at).toLocaleDateString()}</span>
            </div>
          )}
          {intelligence?.learning_context?.confidence_calibration !== undefined && 
           intelligence.learning_context.confidence_calibration > 0 && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Activity className="h-4 w-4" />
              <span>AI Accuracy: {Math.round(intelligence.learning_context.confidence_calibration * 100)}%</span>
            </div>
          )}
        </div>
        
        {/* Learning Status */}
        <div className="mt-3">
          <LearningStatusBadge 
            learningContext={intelligence?.learning_context}
            parentEntityName={parentBrandName}
            feedbackScore={intelligence?.feedback_score}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pb-6 flex-1 min-h-0 overflow-y-auto">
        {/* Visual Intelligence Card */}
        <VisualIntelligenceCard
          entityId={entityId}
          entityType={entityType}
          organizationId={organizationId}
        />

        {/* AI Analysis Summary */}
        {intelligence?.brand_summary && (
          <Collapsible 
            open={expandedSections.analysis} 
            onOpenChange={() => toggleSection('analysis')}
          >
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="font-medium">AI Analysis</span>
                </div>
                {expandedSections.analysis ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 space-y-4">
              {/* Brand Summary */}
              <div className="p-4 rounded-xl bg-background/50 border border-border">
                <h4 className="text-sm font-medium mb-2">Brand Summary</h4>
                <p className="text-sm text-muted-foreground">{intelligence.brand_summary}</p>
              </div>

              {/* Market Position */}
              {intelligence.market_position && (
                <div className="p-4 rounded-xl bg-background/50 border border-border">
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    Market Position
                  </h4>
                  <p className="text-sm text-muted-foreground">{intelligence.market_position}</p>
                </div>
              )}

              {/* Target Audience */}
              {intelligence.target_audience && (
                <div className="p-4 rounded-xl bg-background/50 border border-border">
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    Target Audience
                  </h4>
                  <div className="space-y-2">
                    <p className="text-sm"><strong>Primary:</strong> {intelligence.target_audience.primary}</p>
                    {intelligence.target_audience.secondary?.length > 0 && (
                      <p className="text-sm"><strong>Secondary:</strong> {intelligence.target_audience.secondary.join(', ')}</p>
                    )}
                    {Array.isArray(intelligence.target_audience.demographics) && intelligence.target_audience.demographics.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {intelligence.target_audience.demographics.map((demo, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{demo}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Competitive Advantages */}
              {Array.isArray(intelligence.competitive_advantages) && intelligence.competitive_advantages.length > 0 && (
                <div className="p-4 rounded-xl bg-background/50 border border-border">
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-500" />
                    Competitive Advantages
                  </h4>
                  <ul className="space-y-1">
                    {intelligence.competitive_advantages.map((adv, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        {adv}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Brand Voice */}
              {intelligence.brand_voice_profile && (
                <div className="p-4 rounded-xl bg-background/50 border border-border">
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-purple-500" />
                    Brand Voice Profile
                  </h4>
                  <div className="space-y-2">
                    {Array.isArray(intelligence.brand_voice_profile.tone) && intelligence.brand_voice_profile.tone.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        <span className="text-xs text-muted-foreground mr-2">Tone:</span>
                        {intelligence.brand_voice_profile.tone.map((t, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{t}</Badge>
                        ))}
                      </div>
                    )}
                    {Array.isArray(intelligence.brand_voice_profile.personality) && intelligence.brand_voice_profile.personality.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        <span className="text-xs text-muted-foreground mr-2">Personality:</span>
                        {intelligence.brand_voice_profile.personality.map((p, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{p}</Badge>
                        ))}
                      </div>
                    )}
                    {intelligence.brand_voice_profile.communication_style && (
                      <p className="text-sm text-muted-foreground">
                        <strong>Style:</strong> {intelligence.brand_voice_profile.communication_style}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        )}

        <Separator />

        {/* Growth Recommendations */}
        {Array.isArray(intelligence?.growth_recommendations) && intelligence.growth_recommendations.length > 0 && (
          <Collapsible 
            open={expandedSections.recommendations} 
            onOpenChange={() => toggleSection('recommendations')}
          >
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="font-medium">Growth Recommendations</span>
                  <Badge variant="secondary" className="ml-2">{intelligence.growth_recommendations.length}</Badge>
                </div>
                {expandedSections.recommendations ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 space-y-3">
              {intelligence.growth_recommendations.map((rec, i) => (
                <div key={i} className="p-4 rounded-xl bg-background/50 border border-border">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium">{rec.recommendation}</p>
                        {rec.confidence !== undefined && (
                          <ConfidenceIndicator confidence={rec.confidence} size="sm" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{rec.rationale}</p>
                    </div>
                    <Badge className={priorityColors[rec.priority]}>
                      {rec.priority}
                    </Badge>
                  </div>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Competitive Landscape Section */}
        {intelligence?.competitive_landscape && (
          <>
            <Separator />
            <CompetitiveLandscapeSection
              landscape={intelligence.competitive_landscape}
              isExpanded={expandedSections.competitive}
              onToggle={() => toggleSection('competitive')}
            />
          </>
        )}

        {/* Inclusive Imagery Summary - surfaced prominently */}
        {(intelligence?.learning_context as any)?.inclusive_imagery && (
          <>
            <Separator />
            <div className="p-3 rounded-lg border border-primary/20 bg-primary/5">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Diversity & Representation</span>
                {(() => {
                  const img = (intelligence?.learning_context as any)?.inclusive_imagery;
                  const score = img?.diversity_score ?? 0;
                  return (
                    <Badge variant="outline" className={`ml-auto text-xs ${score >= 70 ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' : score >= 40 ? 'bg-amber-500/10 text-amber-600 border-amber-500/30' : 'bg-destructive/10 text-destructive border-destructive/30'}`}>
                      {score}/100
                    </Badge>
                  );
                })()}
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-1.5 bg-background/60 rounded">
                  <p className="font-semibold">{(intelligence?.learning_context as any)?.inclusive_imagery?.diversity_score ?? '—'}</p>
                  <p className="text-muted-foreground">Diversity</p>
                </div>
                <div className="p-1.5 bg-background/60 rounded">
                  <p className="font-semibold">{(intelligence?.learning_context as any)?.inclusive_imagery?.authenticity_score ?? '—'}</p>
                  <p className="text-muted-foreground">Authenticity</p>
                </div>
                <div className="p-1.5 bg-background/60 rounded">
                  <p className="font-semibold capitalize">{(intelligence?.learning_context as any)?.inclusive_imagery?.stock_photo_dependency || '—'}</p>
                  <p className="text-muted-foreground">Stock Dep.</p>
                </div>
              </div>
              {(() => {
                const gaps = (intelligence?.learning_context as any)?.inclusive_imagery?.representation_gaps;
                if (!Array.isArray(gaps) || gaps.length === 0) return null;
                return (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {gaps.slice(0, 4).map((gap: string, i: number) => (
                      <Badge key={i} variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/30">{gap}</Badge>
                    ))}
                  </div>
                );
              })()}
            </div>
          </>
        )}

        {/* Cultural Intelligence Section */}
        {(intelligence?.cultural_insights || intelligence?.globallink_recommendations?.length) && (
          <>
            <Separator />
            <Collapsible 
              open={expandedSections.cultural} 
              onOpenChange={() => toggleSection('cultural')}
            >
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
                  <div className="flex items-center gap-2">
                    <Globe2 className="h-4 w-4 text-sky-500" />
                    <span className="font-medium">Cultural Intelligence</span>
                    {intelligence?.localization_readiness_score !== undefined && intelligence.localization_readiness_score > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {intelligence.localization_readiness_score}/100
                      </Badge>
                    )}
                  </div>
                  {expandedSections.cultural ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4">
                <CulturalIntelligenceSection
                  culturalInsights={intelligence?.cultural_insights}
                  globallinkRecommendations={intelligence?.globallink_recommendations}
                  localizationReadinessScore={intelligence?.localization_readiness_score}
                  inclusiveImagery={(intelligence?.learning_context as any)?.inclusive_imagery}
                />
              </CollapsibleContent>
            </Collapsible>
          </>
        )}

        {/* Integration Status Section */}
        <Separator />
        <Collapsible 
          open={expandedSections.integrations} 
          onOpenChange={() => toggleSection('integrations')}
        >
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
              <div className="flex items-center gap-2">
                <Cable className="h-4 w-4 text-emerald-500" />
                <span className="font-medium">Integration Compatibility</span>
                <Badge variant="secondary" className="ml-2 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                  100%
                </Badge>
              </div>
              {expandedSections.integrations ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4 space-y-3">
            {/* AI Intelligence */}
            <div className="p-3 rounded-lg bg-background/50 border border-border">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">AI Intelligence Engine</span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-violet-500/10 text-violet-500 border-violet-500/20">Vision</Badge>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-sky-500/10 text-sky-500 border-sky-500/20">Docs</Badge>
                </div>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-xs text-muted-foreground">Reads all 50+ sections, visually analyzes logos/imagery/patterns, and extracts content from uploaded PDFs, PPTXs (slide text & thumbnails), brochures, and document assets.</p>
            </div>

            {/* Brand Research */}
            <div className="p-3 rounded-lg bg-background/50 border border-border">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-medium">Research Briefings</span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-violet-500/10 text-violet-500 border-violet-500/20">Vision</Badge>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-sky-500/10 text-sky-500 border-sky-500/20">Docs</Badge>
                </div>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-xs text-muted-foreground">Full context + visual assets + document content (PPTX slide text, PDF metadata, brochure content) feeds into strategic research briefings.</p>
            </div>

            {/* Market Analysis */}
            <div className="p-3 rounded-lg bg-background/50 border border-border">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Market Analysis</span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-violet-500/10 text-violet-500 border-violet-500/20">Vision</Badge>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-sky-500/10 text-sky-500 border-sky-500/20">Docs</Badge>
                </div>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-xs text-muted-foreground">Market position analysis enriched with visual assets, presentation deck content, and document analysis for comprehensive positioning assessment.</p>
            </div>

            {/* Competitive Analysis */}
            <div className="p-3 rounded-lg bg-background/50 border border-border">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium">Competitive Analysis</span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-violet-500/10 text-violet-500 border-violet-500/20">Vision</Badge>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-sky-500/10 text-sky-500 border-sky-500/20">Docs</Badge>
                </div>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-xs text-muted-foreground">Visual identity audit + document content analysis. Reads presentation decks, case studies, and brochures to strengthen competitive positioning insights.</p>
            </div>

            {/* GlobalLink */}
            <div className="p-3 rounded-lg bg-background/50 border border-border">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Globe2 className="h-4 w-4 text-sky-500" />
                  <span className="text-sm font-medium">GlobalLink Translation</span>
                </div>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-xs text-muted-foreground">Translation and cultural adaptation engine processes all translatable content: taglines, values, services, messaging, and regional variants.</p>
            </div>

            {/* DataForce Compliance */}
            <div className="p-3 rounded-lg bg-background/50 border border-border">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium">DataForce Compliance</span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-violet-500/10 text-violet-500 border-violet-500/20">Vision</Badge>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-sky-500/10 text-sky-500 border-sky-500/20">Docs</Badge>
                </div>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-xs text-muted-foreground">Visual compliance + document scanning — verifies brand consistency across uploaded presentations, PDFs, brochures, and all visual assets.</p>
            </div>

            {/* DataForce Assistant */}
            <div className="p-3 rounded-lg bg-background/50 border border-border">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-cyan-500" />
                  <span className="text-sm font-medium">DataForce Brand Assistant</span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-sky-500/10 text-sky-500 border-sky-500/20">Docs</Badge>
                </div>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-xs text-muted-foreground">AI chatbot with full brand context, document content extraction (PPTX slide text, PDF metadata), and all 50+ guide sections for comprehensive brand Q&A.</p>
            </div>

            {/* Custom Prompts */}
            <div className="p-3 rounded-lg bg-background/50 border border-border">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-violet-500" />
                  <span className="text-sm font-medium">Custom AI Prompts</span>
                </div>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-xs text-muted-foreground">Portfolio-wide AI prompts pull full brand data with section coverage stats, enabling comprehensive cross-brand analysis.</p>
            </div>

            <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                ✓ All integrations read from every populated brand section via a shared multimodal context engine. Vision-enabled modules (marked with <span className="text-violet-500">Vision</span>) analyze actual brand images, logos, patterns, and visual assets — not just metadata.
              </p>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Knowledge Base */}
        <Collapsible 
          open={expandedSections.knowledge} 
          onOpenChange={() => toggleSection('knowledge')}
        >
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-blue-500" />
                <span className="font-medium">Knowledge Base</span>
                <Badge variant="secondary" className="ml-2">{intelligence?.knowledge_entries?.length || 0}</Badge>
              </div>
              {expandedSections.knowledge ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <div className="flex justify-end mt-2">
            <ImportReportDialog
              entityType={entityType}
              entityId={entityId}
              organizationId={organizationId}
              onInsightsImported={() => fetchIntelligence()}
            />
          </div>
          <CollapsibleContent className="mt-4 space-y-4">
            {/* Add Entry Form */}
            <div className="p-4 rounded-xl bg-background border border-dashed border-border">
              <div className="flex gap-3 mb-3">
                <Select 
                  value={newEntry.type} 
                  onValueChange={(v) => setNewEntry(prev => ({ ...prev, type: v }))}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="note">📝 Note</SelectItem>
                    <SelectItem value="insight">💡 Insight</SelectItem>
                    <SelectItem value="learning">🧠 Learning</SelectItem>
                    <SelectItem value="milestone">🎯 Milestone</SelectItem>
                    <SelectItem value="feedback">💬 Feedback</SelectItem>
                    <SelectItem value="metric">📊 Metric</SelectItem>
                  </SelectContent>
                </Select>
                <Input 
                  placeholder="Category (optional)"
                  value={newEntry.category}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, category: e.target.value }))}
                  className="w-32"
                />
              </div>
              <div className="flex gap-2">
                <Textarea 
                  placeholder="Add knowledge, insights, learnings, or notes about this brand..."
                  value={newEntry.content}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, content: e.target.value }))}
                  className="min-h-[80px] flex-1"
                />
                <Button 
                  onClick={addEntry} 
                  disabled={isAddingEntry || !newEntry.content.trim()}
                  className="self-end"
                >
                  {isAddingEntry ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Entries List */}
            <div className="space-y-2">
                {intelligence?.knowledge_entries?.slice().reverse().map((entry) => {
                  const feedback = entry.source === 'ai' ? getFeedbackForInsight(entry.id) : undefined;
                  
                  return (
                    <div 
                      key={entry.id} 
                      className="group p-3 rounded-lg bg-background/50 border border-border hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 flex-1">
                          {entryTypeIcons[entry.type]}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm">{entry.content}</p>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              <Badge variant="outline" className="text-xs">
                                {entry.type}
                              </Badge>
                              {entry.category && (
                                <Badge variant="secondary" className="text-xs">
                                  {entry.category}
                                </Badge>
                              )}
                              {entry.source === 'ai' && (
                                <Badge className="text-xs bg-primary/10 text-primary border-primary/20">
                                  <Sparkles className="h-3 w-3 mr-1" />
                                  AI
                                </Badge>
                              )}
                              {entry.confidence !== undefined && (
                                <ConfidenceIndicator confidence={entry.confidence} size="sm" showLabel />
                              )}
                              <span className="text-xs text-muted-foreground">
                                {new Date(entry.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            
                            {/* Action tracking for AI insights */}
                            {entry.source === 'ai' && (
                              <div className="mt-2">
                                <InsightActionTracker
                                  insightId={entry.id}
                                  insightContent={entry.content}
                                  entityType={entityType}
                                  entityId={entityId}
                                />
                              </div>
                            )}
                            
                            {/* Feedback controls for AI insights */}
                            {entry.source === 'ai' && (
                              <div className="mt-2 pt-2 border-t border-border/50">
                                <InsightFeedbackControls
                                  insightId={entry.id}
                                  currentFeedback={feedback ? {
                                    status: feedback.status,
                                    correction_text: feedback.correction_text,
                                  } : undefined}
                                  onSubmitFeedback={handleSubmitFeedback}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                          onClick={() => deleteEntry(entry.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
                
                {(!intelligence?.knowledge_entries || intelligence.knowledge_entries.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Brain className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No knowledge entries yet</p>
                    <p className="text-xs mt-1">Add notes, insights, and learnings to build your brand's intelligence</p>
                  </div>
                )}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Visibility Gaps */}
        <Collapsible
          open={expandedSections.visibility}
          onOpenChange={() => toggleSection('visibility')}
        >
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" />
                <span className="font-medium">Visibility Gaps</span>
              </div>
              {expandedSections.visibility ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            <VisibilityGapsPanel
              entityId={entityId}
              entityType={entityType}
              entityName={entityName}
              organizationId={organizationId}
              isAdmin={true}
            />
          </CollapsibleContent>
        </Collapsible>

        {/* Bias Awareness & Inclusion */}
        <Collapsible
          open={expandedSections.biasAwareness}
          onOpenChange={() => toggleSection('biasAwareness')}
        >
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span className="font-medium">Bias Awareness & Inclusion</span>
              </div>
              {expandedSections.biasAwareness ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            <BiasAwarenessPanel
              entityType={entityType}
              entityId={entityId}
              entityName={entityName}
              organizationId={organizationId}
            />
          </CollapsibleContent>
        </Collapsible>
        </CardContent>
    </Card>
  );
};
