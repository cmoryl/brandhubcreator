/**
 * Bot Management Admin Panel
 * Centralized management for Help Agent and Brand Assistant bots
 * Features: System prompt editor, conversation history, model settings, analytics
 */

import { useState, useEffect, useMemo } from 'react';
import { 
  Bot, Settings, MessageSquare, BarChart3, Save, RefreshCw, 
  Trash2, Search, ChevronDown, Sparkles, Zap, Eye, Clock,
  Users, TrendingUp, MessageCircle, Globe, Thermometer
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays } from 'date-fns';
import { useOrganization } from '@/contexts/OrganizationContext';

type BotType = 'help_agent' | 'brand_assistant' | 'brand_agent';

interface BotConfig {
  id?: string;
  bot_type: BotType;
  organization_id?: string;
  brand_id?: string;
  display_name: string;
  system_prompt: string;
  model: string;
  temperature: number;
  max_tokens: number;
  welcome_message: string;
  suggested_questions: string[];
  is_active: boolean;
  personality_traits: string[];
  response_style: string;
}

interface ConversationRecord {
  id: string;
  bot_type: BotType;
  user_email: string | null;
  entity_type: string | null;
  entity_name: string | null;
  message_count: number;
  language_code: string;
  satisfaction_rating: number | null;
  created_at: string;
  messages: any[];
}

const DEFAULT_HELP_PROMPT = `You are the BrandHub Help Assistant — a friendly, knowledgeable guide for the BrandHub platform. You help users navigate features, create brand guidelines, and troubleshoot issues. Keep answers concise, friendly, and actionable.`;

const DEFAULT_ASSISTANT_PROMPT = `You are a professional Brand Assistant. Help users understand their brand guidelines, answer questions about brand identity, colors, typography, and voice. Provide actionable, brand-aware recommendations.`;

const AVAILABLE_MODELS = [
  { value: 'google/gemini-2.5-flash-lite', label: 'Gemini Flash Lite (fastest)', tier: 'economy' },
  { value: 'google/gemini-2.5-flash', label: 'Gemini Flash (balanced)', tier: 'standard' },
  { value: 'google/gemini-3-flash-preview', label: 'Gemini 3 Flash (recommended)', tier: 'standard' },
  { value: 'google/gemini-2.5-pro', label: 'Gemini Pro (highest quality)', tier: 'premium' },
  { value: 'google/gemini-3-pro-preview', label: 'Gemini 3 Pro (next-gen)', tier: 'premium' },
  { value: 'openai/gpt-5-nano', label: 'GPT-5 Nano (fast)', tier: 'economy' },
  { value: 'openai/gpt-5-mini', label: 'GPT-5 Mini (balanced)', tier: 'standard' },
  { value: 'openai/gpt-5', label: 'GPT-5 (premium)', tier: 'premium' },
];

const RESPONSE_STYLES = [
  { value: 'concise', label: 'Concise', description: 'Short, direct answers' },
  { value: 'detailed', label: 'Detailed', description: 'Thorough explanations' },
  { value: 'conversational', label: 'Conversational', description: 'Friendly, casual tone' },
  { value: 'professional', label: 'Professional', description: 'Formal, business tone' },
];

function getDefaultConfig(botType: BotType): BotConfig {
  return {
    bot_type: botType,
    display_name: botType === 'help_agent' ? 'Help Assistant' : 'Brand Assistant',
    system_prompt: botType === 'help_agent' ? DEFAULT_HELP_PROMPT : DEFAULT_ASSISTANT_PROMPT,
    model: 'google/gemini-2.5-flash-lite',
    temperature: 0.7,
    max_tokens: 2048,
    welcome_message: botType === 'help_agent' 
      ? "Hi! I'm your BrandHub assistant. Ask me anything about the platform."
      : "Hello! I'm your Brand Assistant. Ask me about your brand guidelines.",
    suggested_questions: botType === 'help_agent'
      ? ['How do I create a brand?', 'What is Brand Health?', 'How do sections work?']
      : ['What are our brand colors?', 'Describe our brand voice', 'Show typography guidelines'],
    is_active: true,
    personality_traits: ['helpful', 'knowledgeable', 'friendly'],
    response_style: 'concise',
  };
}

// ─── Settings Tab ────────────────────────────────────────────────
function BotSettingsTab({ 
  config, 
  onChange, 
  onSave, 
  isSaving 
}: { 
  config: BotConfig; 
  onChange: (updates: Partial<BotConfig>) => void;
  onSave: () => void;
  isSaving: boolean;
}) {
  const [newQuestion, setNewQuestion] = useState('');
  const [newTrait, setNewTrait] = useState('');

  const addQuestion = () => {
    if (!newQuestion.trim()) return;
    onChange({ suggested_questions: [...config.suggested_questions, newQuestion.trim()] });
    setNewQuestion('');
  };

  const removeQuestion = (index: number) => {
    onChange({ suggested_questions: config.suggested_questions.filter((_, i) => i !== index) });
  };

  const addTrait = () => {
    if (!newTrait.trim()) return;
    onChange({ personality_traits: [...config.personality_traits, newTrait.trim()] });
    setNewTrait('');
  };

  const removeTrait = (index: number) => {
    onChange({ personality_traits: config.personality_traits.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-6">
      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="h-4 w-4 text-primary" />
            General Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Bot Active</Label>
              <p className="text-xs text-muted-foreground">Enable or disable this bot</p>
            </div>
            <Switch checked={config.is_active} onCheckedChange={(v) => onChange({ is_active: v })} />
          </div>
          <div className="space-y-2">
            <Label>Display Name</Label>
            <Input value={config.display_name} onChange={(e) => onChange({ display_name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Welcome Message</Label>
            <Textarea 
              value={config.welcome_message} 
              onChange={(e) => onChange({ welcome_message: e.target.value })}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label>Response Style</Label>
            <Select value={config.response_style} onValueChange={(v) => onChange({ response_style: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {RESPONSE_STYLES.map(s => (
                  <SelectItem key={s.value} value={s.value}>
                    <div className="flex flex-col">
                      <span>{s.label}</span>
                      <span className="text-xs text-muted-foreground">{s.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* System Prompt */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            System Prompt
          </CardTitle>
          <CardDescription>Core instructions that define the bot's behavior and knowledge</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea 
            value={config.system_prompt} 
            onChange={(e) => onChange({ system_prompt: e.target.value })}
            rows={12}
            className="font-mono text-sm"
            placeholder="Define the bot's personality, knowledge, and behavioral rules..."
          />
          <p className="text-xs text-muted-foreground mt-2">
            {config.system_prompt.length} characters · This prompt is prepended to every conversation
          </p>
        </CardContent>
      </Card>

      {/* Model Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-500" />
            Model & Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>AI Model</Label>
            <Select value={config.model} onValueChange={(v) => onChange({ model: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {AVAILABLE_MODELS.map(m => (
                  <SelectItem key={m.value} value={m.value}>
                    <div className="flex items-center gap-2">
                      <span>{m.label}</span>
                      <Badge variant="outline" className="text-[10px] px-1">
                        {m.tier}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Thermometer className="h-3.5 w-3.5" />
                Temperature: {config.temperature}
              </Label>
            </div>
            <Slider 
              value={[config.temperature]} 
              onValueChange={([v]) => onChange({ temperature: v })}
              min={0} max={2} step={0.1}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Focused (0)</span>
              <span>Balanced (0.7)</span>
              <span>Creative (2)</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Max Tokens</Label>
            <Select value={String(config.max_tokens)} onValueChange={(v) => onChange({ max_tokens: parseInt(v) })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1024">1024 (Short)</SelectItem>
                <SelectItem value="2048">2048 (Standard)</SelectItem>
                <SelectItem value="4096">4096 (Long)</SelectItem>
                <SelectItem value="8192">8192 (Extended)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Suggested Questions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-blue-500" />
            Suggested Questions
          </CardTitle>
          <CardDescription>Quick-start prompts shown to users when they open the chat</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {config.suggested_questions.map((q, i) => (
              <Badge key={i} variant="secondary" className="gap-1 pr-1 py-1">
                <span className="text-xs max-w-[200px] truncate">{q}</span>
                <button onClick={() => removeQuestion(i)} className="ml-1 hover:text-destructive">
                  <Trash2 className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input 
              value={newQuestion} 
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="Add a suggested question..."
              onKeyDown={(e) => e.key === 'Enter' && addQuestion()}
            />
            <Button variant="outline" size="sm" onClick={addQuestion}>Add</Button>
          </div>
        </CardContent>
      </Card>

      {/* Personality Traits */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bot className="h-4 w-4 text-green-500" />
            Personality Traits
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {config.personality_traits.map((t, i) => (
              <Badge key={i} variant="outline" className="gap-1 pr-1 py-1">
                <span className="text-xs">{t}</span>
                <button onClick={() => removeTrait(i)} className="ml-1 hover:text-destructive">
                  <Trash2 className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input 
              value={newTrait} 
              onChange={(e) => setNewTrait(e.target.value)}
              placeholder="Add personality trait..."
              onKeyDown={(e) => e.key === 'Enter' && addTrait()}
            />
            <Button variant="outline" size="sm" onClick={addTrait}>Add</Button>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={onSave} disabled={isSaving} className="gap-2">
          {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Configuration
        </Button>
      </div>
    </div>
  );
}

// ─── Conversations Tab ───────────────────────────────────────────
function BotConversationsTab({ botType }: { botType: BotType }) {
  const [conversations, setConversations] = useState<ConversationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState('7d');

  useEffect(() => {
    fetchConversations();
  }, [botType, dateFilter]);

  const fetchConversations = async () => {
    setIsLoading(true);
    try {
      // Calculate date cutoff
      const days = dateFilter === '24h' ? 1 : dateFilter === '7d' ? 7 : dateFilter === '30d' ? 30 : 365;
      const cutoff = subDays(new Date(), days).toISOString();

      // Fetch from bot_conversations table
      const { data: botConvos } = await supabase
        .from('bot_conversations')
        .select('*')
        .eq('bot_type', botType)
        .gte('created_at', cutoff)
        .order('created_at', { ascending: false })
        .limit(100);

      // Also fetch from legacy dataforce_assistant_conversations for brand_assistant
      let legacyConvos: any[] = [];
      if (botType === 'brand_assistant') {
        const { data } = await supabase
          .from('dataforce_assistant_conversations')
          .select('*')
          .gte('created_at', cutoff)
          .order('created_at', { ascending: false })
          .limit(50);
        legacyConvos = (data || []).map((c: any) => ({
          id: c.id,
          bot_type: 'brand_assistant' as BotType,
          user_email: null,
          entity_type: c.entity_type,
          entity_name: null,
          message_count: Array.isArray(c.messages) ? c.messages.length : 0,
          language_code: c.language_code || 'en',
          satisfaction_rating: null,
          created_at: c.created_at,
          messages: Array.isArray(c.messages) ? c.messages : [],
        }));
      }

      const merged = [
        ...(botConvos || []).map((c: any) => ({
          ...c,
          messages: Array.isArray(c.messages) ? c.messages : [],
        })),
        ...legacyConvos,
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setConversations(merged);
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredConversations = useMemo(() => {
    if (!searchTerm) return conversations;
    const lower = searchTerm.toLowerCase();
    return conversations.filter(c =>
      c.user_email?.toLowerCase().includes(lower) ||
      c.entity_name?.toLowerCase().includes(lower) ||
      c.messages.some((m: any) => m.content?.toLowerCase().includes(lower))
    );
  }, [conversations, searchTerm]);

  const deleteConversation = async (id: string) => {
    const { error } = await supabase.from('bot_conversations').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete conversation');
      return;
    }
    setConversations(prev => prev.filter(c => c.id !== id));
    toast.success('Conversation deleted');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search conversations..." 
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24h</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={fetchConversations}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            {isLoading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                Loading conversations...
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <MessageSquare className="h-10 w-10 mb-3 opacity-40" />
                <p className="font-medium">No conversations found</p>
                <p className="text-xs">Conversations will appear here as users interact with the bot</p>
              </div>
            ) : (
              <Accordion type="single" collapsible value={expandedId || ''} onValueChange={(v) => setExpandedId(v || null)}>
                {filteredConversations.map((convo) => (
                  <AccordionItem key={convo.id} value={convo.id} className="border-b">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline">
                      <div className="flex items-center gap-3 w-full mr-2">
                        <div className="p-1.5 bg-primary/10 rounded-md shrink-0">
                          <MessageSquare className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <p className="text-sm font-medium truncate">
                            {convo.user_email || 'Anonymous User'}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{format(new Date(convo.created_at), 'MMM d, h:mm a')}</span>
                            <span>·</span>
                            <span>{convo.message_count || convo.messages.length} msgs</span>
                            {convo.entity_name && (
                              <>
                                <span>·</span>
                                <span className="truncate max-w-[120px]">{convo.entity_name}</span>
                              </>
                            )}
                          </div>
                        </div>
                        {convo.language_code !== 'en' && (
                          <Badge variant="outline" className="text-[10px] shrink-0">
                            <Globe className="h-2.5 w-2.5 mr-1" />
                            {convo.language_code}
                          </Badge>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="space-y-2 max-h-[300px] overflow-y-auto bg-muted/30 rounded-lg p-3">
                        {convo.messages.map((msg: any, i: number) => (
                          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-lg px-3 py-2 text-xs ${
                              msg.role === 'user' 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-background border'
                            }`}>
                              {msg.content}
                            </div>
                          </div>
                        ))}
                        {convo.messages.length === 0 && (
                          <p className="text-xs text-muted-foreground text-center py-4">No message content available</p>
                        )}
                      </div>
                      <div className="flex justify-end mt-2">
                        <Button variant="ghost" size="sm" className="text-destructive text-xs gap-1" onClick={() => deleteConversation(convo.id)}>
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Analytics Tab ───────────────────────────────────────────────
function BotAnalyticsTab({ botType }: { botType: BotType }) {
  const [stats, setStats] = useState({
    totalConversations: 0,
    totalMessages: 0,
    avgMessagesPerConvo: 0,
    uniqueUsers: 0,
    topLanguages: [] as { code: string; count: number }[],
    dailyVolume: [] as { date: string; count: number }[],
    avgSatisfaction: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [botType]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();

      // Fetch conversations for this bot type
      const { data: convos } = await supabase
        .from('bot_conversations')
        .select('id, user_id, message_count, language_code, satisfaction_rating, created_at')
        .eq('bot_type', botType)
        .gte('created_at', thirtyDaysAgo);

      // Also check legacy dataforce conversations
      let legacyCount = 0;
      if (botType === 'brand_assistant') {
        const { count } = await supabase
          .from('dataforce_assistant_conversations')
          .select('id', { count: 'exact', head: true });
        legacyCount = count || 0;
      }

      const allConvos = convos || [];
      const totalConversations = allConvos.length + legacyCount;
      const totalMessages = allConvos.reduce((sum, c) => sum + (c.message_count || 0), 0);
      const uniqueUsers = new Set(allConvos.map(c => c.user_id)).size;
      const rated = allConvos.filter(c => c.satisfaction_rating);
      const avgSatisfaction = rated.length > 0 
        ? rated.reduce((sum, c) => sum + (c.satisfaction_rating || 0), 0) / rated.length 
        : 0;

      // Language distribution
      const langCounts: Record<string, number> = {};
      allConvos.forEach(c => {
        const lang = c.language_code || 'en';
        langCounts[lang] = (langCounts[lang] || 0) + 1;
      });
      const topLanguages = Object.entries(langCounts)
        .map(([code, count]) => ({ code, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Daily volume
      const dailyMap: Record<string, number> = {};
      for (let i = 29; i >= 0; i--) {
        const d = format(subDays(new Date(), i), 'MMM d');
        dailyMap[d] = 0;
      }
      allConvos.forEach(c => {
        const d = format(new Date(c.created_at), 'MMM d');
        if (d in dailyMap) dailyMap[d]++;
      });
      const dailyVolume = Object.entries(dailyMap).map(([date, count]) => ({ date, count }));

      setStats({
        totalConversations,
        totalMessages,
        avgMessagesPerConvo: totalConversations > 0 ? Math.round(totalMessages / totalConversations * 10) / 10 : 0,
        uniqueUsers,
        topLanguages,
        dailyVolume,
        avgSatisfaction: Math.round(avgSatisfaction * 10) / 10,
      });
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <RefreshCw className="h-5 w-5 animate-spin mr-2" />
        Loading analytics...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <MessageSquare className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Conversations</span>
            </div>
            <p className="text-2xl font-bold">{stats.totalConversations}</p>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <MessageCircle className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">Total Messages</span>
            </div>
            <p className="text-2xl font-bold">{stats.totalMessages}</p>
            <p className="text-xs text-muted-foreground">Avg {stats.avgMessagesPerConvo}/convo</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Unique Users</span>
            </div>
            <p className="text-2xl font-bold">{stats.uniqueUsers}</p>
            <p className="text-xs text-muted-foreground">Active users</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-amber-500" />
              <span className="text-xs text-muted-foreground">Satisfaction</span>
            </div>
            <p className="text-2xl font-bold">{stats.avgSatisfaction || 'N/A'}</p>
            <p className="text-xs text-muted-foreground">{stats.avgSatisfaction ? 'out of 5' : 'No ratings yet'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Volume Chart (Simple bar representation) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daily Conversation Volume</CardTitle>
          <CardDescription>Last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-[2px] h-32">
            {stats.dailyVolume.map((d, i) => {
              const maxCount = Math.max(...stats.dailyVolume.map(v => v.count), 1);
              const height = (d.count / maxCount) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center group relative">
                  <div 
                    className="w-full bg-primary/70 rounded-t-sm hover:bg-primary transition-colors min-h-[2px]"
                    style={{ height: `${Math.max(height, 2)}%` }}
                  />
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover:block bg-popover border rounded px-1.5 py-0.5 text-[10px] whitespace-nowrap z-10">
                    {d.date}: {d.count}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
            <span>{stats.dailyVolume[0]?.date}</span>
            <span>{stats.dailyVolume[stats.dailyVolume.length - 1]?.date}</span>
          </div>
        </CardContent>
      </Card>

      {/* Language Distribution */}
      {stats.topLanguages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Language Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.topLanguages.map(lang => {
                const pct = stats.totalConversations > 0 ? (lang.count / stats.totalConversations) * 100 : 0;
                return (
                  <div key={lang.code} className="flex items-center gap-3">
                    <span className="text-sm font-medium w-8 uppercase">{lang.code}</span>
                    <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                      <div className="bg-primary h-full rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground w-12 text-right">{lang.count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Main Panel ──────────────────────────────────────────────────
export function BotManagementPanel() {
  const { organization } = useOrganization();
  const [selectedBot, setSelectedBot] = useState<BotType>('help_agent');
  const [config, setConfig] = useState<BotConfig>(getDefaultConfig('help_agent'));
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadConfig(selectedBot);
  }, [selectedBot, organization?.id]);

  const loadConfig = async (botType: BotType) => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('bot_config')
        .select('*')
        .eq('bot_type', botType);

      if (organization?.id) {
        query = query.eq('organization_id', organization.id);
      }

      const { data, error } = await query.maybeSingle();

      if (data) {
        setConfig({
          id: data.id,
          bot_type: data.bot_type as BotType,
          organization_id: data.organization_id || undefined,
          display_name: data.display_name,
          system_prompt: data.system_prompt || '',
          model: data.model,
          temperature: Number(data.temperature) || 0.7,
          max_tokens: data.max_tokens || 2048,
          welcome_message: data.welcome_message || '',
          suggested_questions: Array.isArray(data.suggested_questions) ? data.suggested_questions as string[] : [],
          is_active: data.is_active ?? true,
          personality_traits: Array.isArray(data.personality_traits) ? data.personality_traits as string[] : [],
          response_style: data.response_style || 'concise',
        });
      } else {
        setConfig(getDefaultConfig(botType));
      }
    } catch (err) {
      console.error('Error loading bot config:', err);
      setConfig(getDefaultConfig(botType));
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfig = async () => {
    setIsSaving(true);
    try {
      const payload = {
        bot_type: config.bot_type,
        organization_id: organization?.id || null,
        display_name: config.display_name,
        system_prompt: config.system_prompt,
        model: config.model,
        temperature: config.temperature,
        max_tokens: config.max_tokens,
        welcome_message: config.welcome_message,
        suggested_questions: config.suggested_questions,
        is_active: config.is_active,
        personality_traits: config.personality_traits,
        response_style: config.response_style,
      };

      if (config.id) {
        const { error } = await supabase
          .from('bot_config')
          .update(payload)
          .eq('id', config.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('bot_config')
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        setConfig(prev => ({ ...prev, id: data.id }));
      }

      toast.success(`${config.display_name} configuration saved`);
    } catch (err: any) {
      console.error('Error saving bot config:', err);
      toast.error('Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Bot Selector */}
      <div className="flex items-center gap-4">
        <div className="flex gap-2">
          <Button
            variant={selectedBot === 'help_agent' ? 'default' : 'outline'}
            className="gap-2"
            onClick={() => setSelectedBot('help_agent')}
          >
            <Bot className="h-4 w-4" />
            Help Agent
          </Button>
          <Button
            variant={selectedBot === 'brand_assistant' ? 'default' : 'outline'}
            className="gap-2"
            onClick={() => setSelectedBot('brand_assistant')}
          >
            <Sparkles className="h-4 w-4" />
            Brand Assistant
          </Button>
        </div>
        <Separator orientation="vertical" className="h-8" />
        <Badge variant={config.is_active ? 'default' : 'secondary'} className="gap-1">
          <div className={`h-2 w-2 rounded-full ${config.is_active ? 'bg-green-400' : 'bg-muted-foreground'}`} />
          {config.is_active ? 'Active' : 'Inactive'}
        </Badge>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <RefreshCw className="h-5 w-5 animate-spin mr-2" />
          Loading configuration...
        </div>
      ) : (
        <Tabs defaultValue="settings" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="conversations" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Conversations
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settings">
            <BotSettingsTab 
              config={config} 
              onChange={(updates) => setConfig(prev => ({ ...prev, ...updates }))}
              onSave={saveConfig}
              isSaving={isSaving}
            />
          </TabsContent>

          <TabsContent value="conversations">
            <BotConversationsTab botType={selectedBot} />
          </TabsContent>

          <TabsContent value="analytics">
            <BotAnalyticsTab botType={selectedBot} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
