/**
 * BrandAgent — Dedicated AI agent page for BrandHUB
 *
 * Routes all AI calls through the existing `dataforce-assistant` Supabase edge
 * function (same as BrandAgentWidget), which proxies to the Lovable AI gateway.
 * Navigation is handled client-side by parsing the [[nav:...]] link format the
 * edge function already emits.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useBrands } from '@/contexts/BrandContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import ReactMarkdown, { type Components } from 'react-markdown';
import {
  Bot,
  Send,
  Loader2,
  Sparkles,
  Zap,
  BarChart3,
  Palette,
  FileDown,
  RefreshCw,
  ChevronRight,
  ArrowLeft,
  User,
  Lightbulb,
  Shield,
  Globe,
  ExternalLink,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = 'user' | 'assistant';

interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: Date;
}

interface NavLink {
  label: string;
  path: string;
}

interface BrandSummary {
  id: string;
  name: string;
  slug: string;
}

// ─── Suggested prompts ───────────────────────────────────────────────────────

const PROMPT_GROUPS = [
  {
    icon: Palette,
    label: 'Brand knowledge',
    color: 'text-violet-500',
    prompts: [
      'Summarize my brand portfolio',
      'What are my primary brand colors?',
      'Which brands are missing a tagline?',
    ],
  },
  {
    icon: Lightbulb,
    label: 'Generate content',
    color: 'text-amber-500',
    prompts: [
      'Suggest a tagline for my top brand',
      'Write a brand voice description',
      'Draft social bio copy for each brand',
    ],
  },
  {
    icon: Zap,
    label: 'Navigate app',
    color: 'text-emerald-500',
    prompts: [
      'Take me to the Color Lab',
      'Open Social Asset Studio',
      'Show me the Expo Floor Planner',
    ],
  },
  {
    icon: BarChart3,
    label: 'Intelligence',
    color: 'text-sky-500',
    prompts: [
      'Identify gaps in my brand system',
      'Which brand needs the most attention?',
      'Rate my portfolio consistency',
    ],
  },
];

// ─── Nav link parser ──────────────────────────────────────────────────────────
// Handles [[nav:TYPE:SLUG:SECTION|LABEL]] markers emitted by dataforce-assistant

function parseNavLinks(text: string): NavLink[] {
  const regex = /\[\[nav:([^:\]]+):([^:\]|]+)(?::([^|\]]+))?\|([^\]]+)\]\]/g;
  const links: NavLink[] = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    const [, type, slug, section = '', label] = match;
    let path = '';
    if (type === 'brand') path = `/brand/${slug}${section ? `#${section}` : ''}`;
    else if (type === 'product') path = `/product/${slug}${section ? `#${section}` : ''}`;
    else if (type === 'event') path = `/event/${slug}${section ? `#${section}` : ''}`;
    if (path) links.push({ label, path });
  }
  return links;
}

function stripNavMarkers(text: string): string {
  return text.replace(/\[\[nav:[^\]]+\]\]/g, '').replace(/ {2,}/g, ' ').trim();
}

// ─── Page shortcut navigation ─────────────────────────────────────────────────

const PAGE_SHORTCUTS: Array<{ keywords: string[]; path: string }> = [
  { keywords: ['color lab', 'colour lab'], path: '/color-lab' },
  { keywords: ['social studio', 'social asset studio'], path: '/social-studio' },
  { keywords: ['ad localizer'], path: '/ad-localizer' },
  { keywords: ['expo floor', 'floor planner', 'floor plan'], path: '/expo-floor' },
  { keywords: ['booth catalog', 'booths catalog'], path: '/booths' },
  { keywords: ['imagery hub'], path: '/imagery-hub' },
  { keywords: ['admin dashboard', 'admin panel'], path: '/admin' },
  { keywords: ['knowledge base', 'help center'], path: '/knowledge' },
];

function detectPageNav(text: string): string | null {
  const lower = text.toLowerCase();
  for (const s of PAGE_SHORTCUTS) {
    if (s.keywords.some((kw) => lower.includes(kw))) return s.path;
  }
  return null;
}

// ─── Component ────────────────────────────────────────────────────────────────

const BrandAgentPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { organization } = useOrganization();
  const { brands, products } = useBrands();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isContextReady, setIsContextReady] = useState(false);
  const [brandSummaries, setBrandSummaries] = useState<BrandSummary[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [primaryBrandId, setPrimaryBrandId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!organization) return;
    const summaries = brands.map((b) => ({ id: b.id, name: b.name, slug: b.slug }));
    setBrandSummaries(summaries);
    if (summaries.length > 0) setPrimaryBrandId(summaries[0].id);
    setIsContextReady(true);
  }, [brands, products, organization]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const sendMessage = useCallback(
    async (overrideText?: string) => {
      const text = (overrideText ?? input).trim();
      if (!text || isLoading || !organization?.id) return;

      const pageNav = detectPageNav(text);
      setInput('');
      setIsLoading(true);

      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: text,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);

      try {
        const { data, error } = await supabase.functions.invoke('dataforce-assistant', {
          body: {
            organization_id: organization.id,
            entity_type: primaryBrandId ? 'brand' : undefined,
            entity_id: primaryBrandId ?? undefined,
            message: text,
            conversation_id: conversationId,
            language_code: 'en_US',
            conversation_style: 'direct',
          },
        });

        if (error) throw new Error(error.message);
        if (!data?.success) throw new Error(data?.error || 'Failed to get response');

        if (data.conversationId) setConversationId(data.conversationId);

        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: data.message,
            timestamp: new Date(),
          },
        ]);

        if (pageNav) setTimeout(() => navigate(pageNav), 800);
      } catch (err) {
        console.error('[BrandAgent]', err);
        toast.error(err instanceof Error ? err.message : 'Agent error — please try again');
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: 'Sorry, I encountered an error. Please try again.',
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [input, isLoading, organization?.id, primaryBrandId, conversationId, navigate]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const mdComponents: Components = useMemo(
    () => ({
      a: ({ href, children, ...props }) => (
        <a {...props} href={href} target="_blank" rel="noopener noreferrer"
          className="text-primary underline underline-offset-2">
          {children}
        </a>
      ),
      code: ({ children, ...props }) => (
        <code {...props} className="bg-background px-1.5 py-0.5 rounded text-sm font-mono">
          {children}
        </code>
      ),
    }),
    []
  );

  const renderAssistantMessage = (msg: Message) => {
    const navLinks = parseNavLinks(msg.content);
    const displayText = stripNavMarkers(msg.content);
    return (
      <>
        <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:my-1 [&>ul]:my-1 [&>ol]:my-1 [&>h2]:text-sm [&>h3]:text-sm">
          <ReactMarkdown components={mdComponents}>{displayText}</ReactMarkdown>
        </div>
        {navLinks.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {navLinks.map((link, i) => (
              <button key={i} onClick={() => navigate(link.path)}
                className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-colors">
                <ExternalLink className="h-3 w-3" />
                {link.label}
              </button>
            ))}
          </div>
        )}
      </>
    );
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/60 bg-background/95 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}
              className="gap-1.5 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <span className="font-semibold text-sm">BrandAgent</span>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">Beta</Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {organization && (
              <span className="text-xs text-muted-foreground hidden sm:inline">{organization.name}</span>
            )}
            {messages.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => { setMessages([]); setConversationId(null); }}
                className="gap-1.5 text-muted-foreground hover:text-foreground text-xs">
                <RefreshCw className="h-3.5 w-3.5" />
                New chat
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main */}
      <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4 pb-4">
        {isEmpty ? (
          <div className="flex-1 flex flex-col items-center justify-center py-16 gap-10">
            <div className="text-center space-y-3">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Sparkles className="h-7 w-7 text-primary" />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight">BrandAgent</h1>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto leading-relaxed">
                {isContextReady && brandSummaries.length > 0 ? (
                  <>I have context on <span className="text-foreground font-medium">
                    {brandSummaries.length} brand{brandSummaries.length !== 1 ? 's' : ''}
                  </span> in your portfolio. Ask me anything.</>
                ) : (
                  'Your AI assistant for brand management. Ask anything about your brands.'
                )}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 w-full max-w-xl">
              {PROMPT_GROUPS.map((group) => {
                const Icon = group.icon;
                return (
                  <div key={group.label} className="rounded-xl border border-border/60 bg-card p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${group.color}`} />
                      <span className="text-xs font-medium text-muted-foreground">{group.label}</span>
                    </div>
                    <div className="space-y-1.5">
                      {group.prompts.map((p) => (
                        <button key={p} onClick={() => sendMessage(p)}
                          disabled={!isContextReady || isLoading}
                          className="w-full text-left text-xs px-2.5 py-1.5 rounded-lg hover:bg-muted transition-colors text-foreground/80 hover:text-foreground flex items-center justify-between group disabled:opacity-40 disabled:cursor-not-allowed">
                          <span>{p}</span>
                          <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {!isContextReady && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Loading brand context…
              </div>
            )}
          </div>
        ) : (
          <ScrollArea className="flex-1 py-6">
            <div className="space-y-6">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-tr-sm'
                      : 'bg-muted rounded-tl-sm'
                  }`}>
                    {msg.role === 'assistant' ? renderAssistantMessage(msg) : <p>{msg.content}</p>}
                  </div>
                  {msg.role === 'user' && (
                    <div className="h-7 w-7 rounded-lg bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0ms]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        )}

        {/* Input */}
        <div className={`${isEmpty ? 'max-w-xl mx-auto w-full' : ''} mt-4`}>
          <div className="relative flex items-end gap-2 rounded-2xl border border-border/80 bg-card shadow-sm focus-within:border-border focus-within:ring-1 focus-within:ring-ring/20 transition-all px-4 py-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
              }}
              onKeyDown={handleKeyDown}
              placeholder="Ask BrandAgent anything…"
              rows={1}
              disabled={isLoading || !isContextReady}
              className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none min-h-[24px] max-h-[160px] leading-relaxed disabled:opacity-50"
              style={{ height: '24px' }}
            />
            <Button size="sm" onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading || !isContextReady}
              className="h-8 w-8 p-0 rounded-lg shrink-0">
              {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            </Button>
          </div>
          <div className="flex items-center justify-center gap-4 mt-2.5 flex-wrap">
            {[
              { icon: Palette, label: 'Brand data' },
              { icon: FileDown, label: 'Export' },
              { icon: Globe, label: 'Navigation' },
              { icon: Shield, label: 'Intelligence' },
            ].map(({ icon: Icon, label }) => (
              <span key={label} className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
                <Icon className="h-3 w-3" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandAgentPage;
