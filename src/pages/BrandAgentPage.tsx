/**
 * BrandAgent — Dedicated AI agent page for BrandHUB
 *
 * Capabilities:
 *  • Answer questions about the org's brands (reads live Supabase data)
 *  • Generate / suggest brand assets and content
 *  • Automate tasks (trigger exports, backups, edits)
 *  • Provide intelligence insights & recommendations
 *
 * Architecture:
 *  1. On load, fetch org brands + products from Supabase and build a rich
 *     system-prompt context string.
 *  2. Each user turn is sent to the Anthropic API (claude-sonnet-4-20250514)
 *     via the existing api.anthropic.com proxy that the app already uses.
 *  3. Tool definitions let the agent call back into the app (navigate, export,
 *     trigger backup, etc.) without leaving the page.
 *  4. Conversation history is kept in React state for multi-turn context.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
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
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = 'user' | 'assistant';

interface Message {
  id: string;
  role: Role;
  content: string;
  toolCalls?: ToolCall[];
  timestamp: Date;
}

interface ToolCall {
  name: string;
  result: string;
}

interface BrandSummary {
  id: string;
  name: string;
  slug: string;
  colors: string[];
  tagline: string;
  productCount: number;
}

// ─── Suggested prompts per capability ────────────────────────────────────────

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
    label: 'Automate tasks',
    color: 'text-emerald-500',
    prompts: [
      'Open the Brand Editor for my newest brand',
      'Take me to the Color Lab',
      'Navigate to Social Asset Studio',
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

// ─── Build system prompt from live Supabase data ──────────────────────────────

function buildSystemPrompt(
  orgName: string,
  brands: BrandSummary[],
  userEmail: string
): string {
  const brandList = brands
    .map(
      (b) =>
        `- **${b.name}** (slug: ${b.slug}): "${b.tagline || 'no tagline'}", ` +
        `${b.productCount} product(s), ` +
        `colors: ${b.colors.length > 0 ? b.colors.join(', ') : 'none set'}`
    )
    .join('\n');

  return `You are BrandAgent, an expert AI assistant embedded inside BrandHUB — a brand management platform used by ${orgName}.

You are talking to ${userEmail}.

## Your capabilities
1. **Answer questions** about the organization's brands and brand system.
2. **Generate content** — taglines, voice descriptions, social copy, naming suggestions, color recommendations.
3. **Automate tasks** — you can navigate to specific pages or trigger actions by calling the built-in tools provided.
4. **Provide intelligence** — audit brand consistency, surface gaps, score portfolio health, and give actionable recommendations.

## Organization: ${orgName}
## Current brand portfolio (${brands.length} brand${brands.length !== 1 ? 's' : ''})
${brandList || '(no brands yet)'}

## Guidelines
- Be concise and direct. Use markdown formatting (bold, lists, headers) for clarity.
- When asked to navigate or open a page, use the navigate_to tool — always confirm you did it.
- When suggesting colors, use hex codes.
- When you see a brand with missing data (no tagline, no colors), proactively flag it.
- Never fabricate brand data — only reference what's provided above.
- Today's date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.`;
}

// ─── Tool definitions (sent to Claude) ───────────────────────────────────────

const TOOLS = [
  {
    name: 'navigate_to',
    description:
      'Navigate the user to a specific page within BrandHUB. Use this when the user asks to open a page, go somewhere, or trigger a navigation action.',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description:
            'The app path to navigate to, e.g. "/color-lab", "/brand/my-brand", "/social-studio", "/dashboard"',
        },
        reason: {
          type: 'string',
          description: 'Short explanation of why navigating there',
        },
      },
      required: ['path', 'reason'],
    },
  },
  {
    name: 'get_brand_details',
    description:
      'Retrieve full details for a specific brand by its slug. Use this when the user asks detailed questions about a specific brand.',
    input_schema: {
      type: 'object',
      properties: {
        brand_slug: {
          type: 'string',
          description: 'The slug of the brand to look up',
        },
      },
      required: ['brand_slug'],
    },
  },
];

// ─── Main component ───────────────────────────────────────────────────────────

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
  const [systemPrompt, setSystemPrompt] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // ── Build brand summaries from BrandContext + Supabase product counts ──────

  useEffect(() => {
    if (!organization || brands.length === 0) {
      setIsContextReady(true);
      return;
    }

    const summaries: BrandSummary[] = brands.map((b) => {
      const heroColors: string[] = [];
      if (Array.isArray(b.colors)) {
        b.colors.slice(0, 4).forEach((c) => {
          if (c?.hex) heroColors.push(c.hex);
        });
      }
      const brandProducts = products.filter((p) => p.parentBrandId === b.id);
      return {
        id: b.id,
        name: b.hero?.name || b.slug || 'Untitled brand',
        slug: b.slug || '',
        colors: heroColors,
        tagline: b.hero?.tagline || '',
        productCount: brandProducts.length,
      };
    });

    setBrandSummaries(summaries);
    setSystemPrompt(
      buildSystemPrompt(
        organization.name,
        summaries,
        user?.email || 'the user'
      )
    );
    setIsContextReady(true);
  }, [brands, products, organization, user]);

  // ── Auto-scroll ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // ── Tool execution (client-side) ──────────────────────────────────────────

  const executeTool = useCallback(
    async (
      toolName: string,
      toolInput: Record<string, string>
    ): Promise<string> => {
      if (toolName === 'navigate_to') {
        const path = toolInput.path as string;
        navigate(path);
        return `Navigated to ${path}`;
      }

      if (toolName === 'get_brand_details') {
        const slug = toolInput.brand_slug as string;
        try {
          const { data: brandData, error } = await supabase
            .from('brands')
            .select(
              'id, name, slug, description, created_at, updated_at'
            )
            .eq('slug', slug)
            .maybeSingle();

          if (error || !brandData) {
            return `Could not find brand with slug "${slug}"`;
          }

          const brandProducts = products.filter(
            (p) => p.parentBrandId === brandData.id
          );

          return JSON.stringify({
            name: brandData.name,
            slug: brandData.slug,
            description: brandData.description,
            productCount: brandProducts.length,
            products: brandProducts.map((p) => ({
              name: p.name,
              slug: p.slug,
            })),
            createdAt: brandData.created_at,
            lastUpdated: brandData.updated_at,
          });
        } catch {
          return `Error fetching brand details for "${slug}"`;
        }
      }

      return `Unknown tool: ${toolName}`;
    },
    [navigate, products]
  );

  // ── Core send / agentic loop ──────────────────────────────────────────────

  const sendMessage = useCallback(
    async (overrideText?: string) => {
      const text = (overrideText ?? input).trim();
      if (!text || isLoading || !systemPrompt) return;

      setInput('');
      setIsLoading(true);

      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: text,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);

      // Build messages array for the API (exclude tool metadata, just role+content)
      const apiHistory = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      abortRef.current = new AbortController();

      try {
        // Agentic loop — continue until no more tool_use blocks
        let continueLoop = true;
        let loopHistory = apiHistory;
        const accumulatedToolCalls: ToolCall[] = [];

        while (continueLoop) {
          const response = await fetch(
            'https://api.anthropic.com/v1/messages',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              signal: abortRef.current.signal,
              body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 1024,
                system: systemPrompt,
                tools: TOOLS,
                messages: loopHistory,
              }),
            }
          );

          if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
          }

          const data = await response.json();

          // Collect text content
          const textBlocks: string[] = data.content
            .filter((b: { type: string }) => b.type === 'text')
            .map((b: { text: string }) => b.text);

          const toolUseBlocks = data.content.filter(
            (b: { type: string }) => b.type === 'tool_use'
          );

          if (toolUseBlocks.length > 0) {
            // Execute each tool
            const toolResults: Array<{
              type: string;
              tool_use_id: string;
              content: string;
            }> = [];

            for (const toolBlock of toolUseBlocks) {
              const result = await executeTool(
                toolBlock.name,
                toolBlock.input as Record<string, string>
              );
              accumulatedToolCalls.push({
                name: toolBlock.name,
                result,
              });
              toolResults.push({
                type: 'tool_result',
                tool_use_id: toolBlock.id,
                content: result,
              });
            }

            // Continue loop with tool results appended
            loopHistory = [
              ...loopHistory,
              { role: 'assistant', content: data.content },
              { role: 'user', content: toolResults },
            ];

            // If there's already a text block and stop_reason is end_turn, stop
            if (data.stop_reason === 'end_turn' && textBlocks.length > 0) {
              continueLoop = false;
            }
          } else {
            // No tool use — final response
            continueLoop = false;

            const assistantText =
              textBlocks.join('\n\n') ||
              "I've completed the action.";

            const assistantMsg: Message = {
              id: crypto.randomUUID(),
              role: 'assistant',
              content: assistantText,
              toolCalls:
                accumulatedToolCalls.length > 0
                  ? accumulatedToolCalls
                  : undefined,
              timestamp: new Date(),
            };

            setMessages((prev) => [...prev, assistantMsg]);
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return;
        console.error('[BrandAgent] Error:', err);
        toast.error('Agent error — please try again');
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content:
              'Sorry, I encountered an error. Please try again.',
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [input, isLoading, systemPrompt, messages, executeTool]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearConversation = () => {
    setMessages([]);
    inputRef.current?.focus();
  };

  // ── Markdown renderer ─────────────────────────────────────────────────────

  const mdComponents: Components = {
    a: ({ href, children, ...props }) => (
      <a
        {...props}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline underline-offset-2"
      >
        {children}
      </a>
    ),
    code: ({ children, ...props }) => (
      <code
        {...props}
        className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono"
      >
        {children}
      </code>
    ),
  };

  // ── Empty state ───────────────────────────────────────────────────────────

  const isEmpty = messages.length === 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="border-b border-border/60 bg-background/95 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <span className="font-semibold text-sm">BrandAgent</span>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                Beta
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {organization && (
              <span className="text-xs text-muted-foreground hidden sm:inline">
                {organization.name}
              </span>
            )}
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearConversation}
                className="gap-1.5 text-muted-foreground hover:text-foreground text-xs"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                New chat
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* ── Main area ──────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4 pb-4">
        {isEmpty ? (
          /* ── Empty / welcome state ─────────────────────────────────── */
          <div className="flex-1 flex flex-col items-center justify-center py-16 gap-10">
            {/* Hero */}
            <div className="text-center space-y-3">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Sparkles className="h-7 w-7 text-primary" />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight">
                BrandAgent
              </h1>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto leading-relaxed">
                Your AI assistant for brand management.{' '}
                {isContextReady && brandSummaries.length > 0 ? (
                  <>
                    I have context on{' '}
                    <span className="text-foreground font-medium">
                      {brandSummaries.length} brand
                      {brandSummaries.length !== 1 ? 's' : ''}
                    </span>{' '}
                    in your portfolio.
                  </>
                ) : (
                  'Ask anything about your brands, get content generated, or let me navigate for you.'
                )}
              </p>
            </div>

            {/* Capability pills */}
            <div className="grid grid-cols-2 gap-3 w-full max-w-xl">
              {PROMPT_GROUPS.map((group) => {
                const Icon = group.icon;
                return (
                  <div
                    key={group.label}
                    className="rounded-xl border border-border/60 bg-card p-4 space-y-3"
                  >
                    <div className="flex items-center gap-2">
                      <Icon
                        className={`h-4 w-4 ${group.color}`}
                      />
                      <span className="text-xs font-medium text-muted-foreground">
                        {group.label}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {group.prompts.map((p) => (
                        <button
                          key={p}
                          onClick={() => sendMessage(p)}
                          disabled={!isContextReady || isLoading}
                          className="w-full text-left text-xs px-2.5 py-1.5 rounded-lg hover:bg-muted transition-colors text-foreground/80 hover:text-foreground flex items-center justify-between group"
                        >
                          <span>{p}</span>
                          <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Context status */}
            {!isContextReady && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Loading brand context…
              </div>
            )}
          </div>
        ) : (
          <ScrollArea className="flex-1 py-6" ref={scrollRef as React.RefObject<HTMLDivElement>}>
            <div className="space-y-6">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.role === 'assistant' && (
                    <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}

                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-tr-sm'
                        : 'bg-muted rounded-tl-sm'
                    }`}
                  >
                    {msg.role === 'assistant' ? (
                      <>
                        <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:my-1 [&>ul]:my-1 [&>ol]:my-1 [&>h1]:text-base [&>h2]:text-sm [&>h3]:text-sm">
                          <ReactMarkdown components={mdComponents}>
                            {msg.content}
                          </ReactMarkdown>
                        </div>

                        {/* Tool call badges */}
                        {msg.toolCalls && msg.toolCalls.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {msg.toolCalls.map((tc, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-background/60 border border-border/50 text-muted-foreground"
                              >
                                <Zap className="h-2.5 w-2.5" />
                                {tc.name.replace(/_/g, ' ')}
                              </span>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <p>{msg.content}</p>
                    )}
                  </div>

                  {msg.role === 'user' && (
                    <div className="h-7 w-7 rounded-lg bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}

              {/* Typing indicator */}
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
            </div>
          </ScrollArea>
        )}

        {/* ── Input bar ──────────────────────────────────────────────── */}
        <div className={`${isEmpty ? 'max-w-xl mx-auto w-full' : ''} mt-4`}>
          <div className="relative flex items-end gap-2 rounded-2xl border border-border/80 bg-card shadow-sm focus-within:border-border focus-within:ring-1 focus-within:ring-ring/20 transition-all px-4 py-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height =
                  Math.min(e.target.scrollHeight, 160) + 'px';
              }}
              onKeyDown={handleKeyDown}
              placeholder="Ask BrandAgent anything…"
              rows={1}
              disabled={isLoading || !isContextReady}
              className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none min-h-[24px] max-h-[160px] leading-relaxed disabled:opacity-50"
              style={{ height: '24px' }}
            />
            <Button
              size="sm"
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading || !isContextReady}
              className="h-8 w-8 p-0 rounded-lg shrink-0"
            >
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>

          {/* Capability hint strip */}
          <div className="flex items-center justify-center gap-4 mt-2.5 flex-wrap">
            {[
              { icon: Palette, label: 'Brand data' },
              { icon: FileDown, label: 'Export' },
              { icon: Globe, label: 'Navigation' },
              { icon: Shield, label: 'Intelligence' },
            ].map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="flex items-center gap-1 text-[10px] text-muted-foreground/60"
              >
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
