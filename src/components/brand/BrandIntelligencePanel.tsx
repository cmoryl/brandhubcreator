import { useState, useEffect } from 'react';
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
  Zap
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

interface KnowledgeEntry {
  id: string;
  type: 'insight' | 'note' | 'learning' | 'milestone' | 'feedback' | 'metric';
  content: string;
  source: 'manual' | 'ai';
  category?: string;
  created_at: string;
}

interface BrandIntelligence {
  id: string;
  entity_type: string;
  entity_id: string;
  knowledge_entries: KnowledgeEntry[];
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
  }[];
  analysis_count: number;
  last_analyzed_at: string | null;
}

interface BrandIntelligencePanelProps {
  entityType: 'brand' | 'product';
  entityId: string;
  entityName: string;
  organizationId?: string;
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
  organizationId 
}: BrandIntelligencePanelProps) => {
  const [intelligence, setIntelligence] = useState<BrandIntelligence | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const [newEntry, setNewEntry] = useState({ type: 'note', content: '', category: '' });
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    knowledge: true,
    analysis: true,
    recommendations: false,
  });

  useEffect(() => {
    fetchIntelligence();
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

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('brand-intelligence', {
        body: { action: 'analyze', entityType, entityId, organizationId }
      });

      if (error) throw error;

      toast.success(`Analysis complete! ${data.insights_added} new insights added.`);
      fetchIntelligence();
    } catch (err: any) {
      console.error('Analysis failed:', err);
      if (err.message?.includes('Rate limit')) {
        toast.error('Rate limit exceeded. Please try again later.');
      } else if (err.message?.includes('credits')) {
        toast.error('AI credits exhausted. Please add funds.');
      } else {
        toast.error('Analysis failed. Please try again.');
      }
    } finally {
      setIsAnalyzing(false);
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
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Brand Intelligence</CardTitle>
              <CardDescription>{entityName}</CardDescription>
            </div>
          </div>
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
            {isAnalyzing ? 'Analyzing...' : 'Run AI Analysis'}
          </Button>
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
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
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
                    {intelligence.target_audience.demographics?.length > 0 && (
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
              {intelligence.competitive_advantages?.length > 0 && (
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
                    {intelligence.brand_voice_profile.tone?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        <span className="text-xs text-muted-foreground mr-2">Tone:</span>
                        {intelligence.brand_voice_profile.tone.map((t, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{t}</Badge>
                        ))}
                      </div>
                    )}
                    {intelligence.brand_voice_profile.personality?.length > 0 && (
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
        {intelligence?.growth_recommendations?.length > 0 && (
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
                      <p className="text-sm font-medium">{rec.recommendation}</p>
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
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-2">
                {intelligence?.knowledge_entries?.slice().reverse().map((entry) => (
                  <div 
                    key={entry.id} 
                    className="group p-3 rounded-lg bg-background/50 border border-border hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 flex-1">
                        {entryTypeIcons[entry.type]}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">{entry.content}</p>
                          <div className="flex items-center gap-2 mt-1.5">
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
                            <span className="text-xs text-muted-foreground">
                              {new Date(entry.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => deleteEntry(entry.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {(!intelligence?.knowledge_entries || intelligence.knowledge_entries.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Brain className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No knowledge entries yet</p>
                    <p className="text-xs mt-1">Add notes, insights, and learnings to build your brand's intelligence</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};
