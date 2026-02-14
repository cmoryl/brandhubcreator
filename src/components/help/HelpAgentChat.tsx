import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Bot, X, Send, Loader2, MessageSquare, Sparkles, Shield, Zap, ArrowRight } from 'lucide-react';
import ReactMarkdown, { type Components } from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

type Message = { role: 'user' | 'assistant'; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/help-agent`;

async function streamChat({
  messages,
  onDelta,
  onDone,
  onError,
}: {
  messages: Message[];
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
}) {
  try {
    // Get user session token for personalized context
    let authToken = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        authToken = session.access_token;
      }
    } catch { /* fall back to anon key */ }

    const resp = await fetch(CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ messages }),
    });

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({ error: 'Unknown error' }));
      onError(errorData.error || `Error: ${resp.status}`);
      return;
    }

    if (!resp.body) {
      onError('No response stream');
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
        let line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);
        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (line.startsWith(':') || line.trim() === '') continue;
        if (!line.startsWith('data: ')) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') {
          onDone();
          return;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) onDelta(content);
        } catch {
          buffer = line + '\n' + buffer;
          break;
        }
      }
    }

    // Final flush
    if (buffer.trim()) {
      for (let raw of buffer.split('\n')) {
        if (!raw || raw.startsWith(':') || !raw.startsWith('data: ')) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === '[DONE]') continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) onDelta(content);
        } catch { /* ignore */ }
      }
    }

    onDone();
  } catch (err) {
    onError(err instanceof Error ? err.message : 'Connection failed');
  }
}

export function HelpAgentChat() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check auth state
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session?.user);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session?.user);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Markdown components that handle internal navigation links
  const markdownComponents = useMemo<Components>(() => ({
    a: ({ href, children, ...props }) => {
      const isInternal = href && href.startsWith('/');
      if (isInternal) {
        return (
          <a
            {...props}
            href={href}
            className="text-primary underline hover:text-primary/80 cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              setIsOpen(false);
              navigate(href);
            }}
          >
            {children}
          </a>
        );
      }
      return <a {...props} href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline">{children}</a>;
    },
  }), [navigate]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMsg: Message = { role: 'user', content: trimmed };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput('');
    setIsLoading(true);

    let assistantText = '';

    const updateAssistant = (chunk: string) => {
      assistantText += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantText } : m);
        }
        return [...prev, { role: 'assistant', content: assistantText }];
      });
    };

    await streamChat({
      messages: allMessages,
      onDelta: updateAssistant,
      onDone: () => setIsLoading(false),
      onError: (error) => {
        setIsLoading(false);
        toast.error(error);
        setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
      },
    });
  }, [input, isLoading, messages]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating trigger button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            {/* Thought bubble dots */}
            <motion.div
              className="absolute -bottom-1 -left-3 h-3 w-3 rounded-full bg-primary shadow-md"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.15 }}
            />
            <motion.div
              className="absolute -bottom-3 -left-6 h-2 w-2 rounded-full bg-primary/80 shadow-sm"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.25 }}
            />
            <Button
              onClick={() => setIsOpen(true)}
              size="lg"
              className="relative rounded-[1.75rem] h-14 w-14 shadow-lg hover:shadow-xl transition-all bg-primary text-primary-foreground hover:scale-105"
            >
              <Bot className="h-6 w-6" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)]"
          >
            <Card className="flex flex-col h-[520px] shadow-2xl border-border/80 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-primary/5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-primary/10 rounded-lg">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Help Assistant</p>
                    <p className="text-[10px] text-muted-foreground">
                      {isAuthenticated ? 'Ask anything about BrandHub' : 'AI-powered brand guidance'}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {!isAuthenticated ? (
                /* Unauthenticated CTA */
                <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 text-center gap-5">
                  <div className="p-4 bg-primary/10 rounded-full">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Unlock Your AI Brand Assistant</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      Sign in to access your personalized, context-aware help agent.
                    </p>
                  </div>
                  <div className="w-full space-y-3 text-left">
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <Zap className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Instant Answers</p>
                        <p className="text-xs text-muted-foreground">Get real-time guidance tailored to your brands, products, and events.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <Bot className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Context-Aware Intelligence</p>
                        <p className="text-xs text-muted-foreground">Powered by your Oracle Brain and entity-level insights for precise answers.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <Shield className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Direct Navigation</p>
                        <p className="text-xs text-muted-foreground">Jump straight to any brand page or section with clickable links.</p>
                      </div>
                    </div>
                  </div>
                  <Button
                    className="w-full mt-2 gap-2"
                    onClick={() => {
                      setIsOpen(false);
                      navigate('/auth');
                    }}
                  >
                    Sign In to Get Started
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  {/* Messages */}
                  <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                    {messages.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-8">
                        <div className="p-3 bg-primary/10 rounded-full">
                          <MessageSquare className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Hi! I'm your BrandHub assistant.</p>
                          <p className="text-xs text-muted-foreground mt-1">Ask me how to use any feature, set up your brand guide, or troubleshoot issues.</p>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {['How do I create a brand?', 'What is Brand Health?', 'How do sections work?'].map(q => (
                            <button
                              key={q}
                              onClick={() => { setInput(q); }}
                              className="text-[11px] px-2.5 py-1 rounded-full border border-border hover:bg-muted transition-colors text-muted-foreground"
                            >
                              {q}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {messages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                            msg.role === 'user'
                              ? 'bg-primary text-primary-foreground rounded-br-sm'
                              : 'bg-muted rounded-bl-sm'
                          }`}
                        >
                          {msg.role === 'assistant' ? (
                            <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:m-0 [&>ul]:mt-1 [&>ol]:mt-1 [&>p+p]:mt-2">
                              <ReactMarkdown components={markdownComponents}>{msg.content}</ReactMarkdown>
                            </div>
                          ) : (
                            <p>{msg.content}</p>
                          )}
                        </div>
                      </div>
                    ))}

                    {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                      <div className="flex justify-start">
                        <div className="bg-muted rounded-xl px-3 py-2 rounded-bl-sm">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input */}
                  <div className="border-t border-border/50 px-3 py-2.5">
                    <div className="flex gap-2">
                      <Input
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask a question..."
                        className="text-sm h-9"
                        disabled={isLoading}
                      />
                      <Button
                        size="icon"
                        className="h-9 w-9 shrink-0"
                        onClick={sendMessage}
                        disabled={!input.trim() || isLoading}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
