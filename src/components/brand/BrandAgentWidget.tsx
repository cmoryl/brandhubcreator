/**
 * Brand Agent Widget
 * Floating chat widget for brand pages that uses per-brand AI agent config
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Bot, X, Send, Loader2, MessageSquare } from 'lucide-react';
import ReactMarkdown, { type Components } from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';

type Message = { role: 'user' | 'assistant'; content: string };

interface BrandAgentWidgetProps {
  brandId: string;
  brandName: string;
  primaryColor?: string;
}

interface AgentConfig {
  display_name: string;
  welcome_message: string;
  suggested_questions: string[];
  is_active: boolean;
}

export function BrandAgentWidget({ brandId, brandName, primaryColor }: BrandAgentWidgetProps) {
  const { user } = useAuth();
  const { organization } = useOrganization();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [agentConfig, setAgentConfig] = useState<AgentConfig | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load brand agent config
  useEffect(() => {
    if (!brandId) return;
    supabase
      .from('bot_config')
      .select('display_name, welcome_message, suggested_questions, is_active')
      .eq('bot_type', 'brand_agent')
      .eq('brand_id', brandId)
      .maybeSingle()
      .then(({ data }) => {
        if (data && data.is_active) {
          setAgentConfig({
            display_name: data.display_name,
            welcome_message: data.welcome_message || `Hi! I'm the ${brandName} assistant.`,
            suggested_questions: Array.isArray(data.suggested_questions) ? data.suggested_questions as string[] : [],
            is_active: data.is_active ?? true,
          });
        }
      });
  }, [brandId, brandName]);

  // Don't render if no config or not active
  if (!agentConfig || !agentConfig.is_active || !user) return null;

  const markdownComponents = useMemo<Components>(() => ({
    a: ({ href, children, ...props }) => (
      <a {...props} href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline">{children}</a>
    ),
  }), []);

  const scrollToBottom = () => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  };

  useEffect(() => { scrollToBottom(); }, [messages]);
  useEffect(() => { if (isOpen && inputRef.current) inputRef.current.focus(); }, [isOpen]);

  const sendMessage = useCallback(async (content?: string) => {
    const text = (content || input).trim();
    if (!text || isLoading || !organization?.id) return;

    const userMsg: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('dataforce-assistant', {
        body: {
          organization_id: organization.id,
          entity_type: 'brand',
          entity_id: brandId,
          message: text,
          conversation_id: conversationId,
          language_code: 'en_US',
        }
      });

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || 'Failed to get response');

      if (data.conversationId) setConversationId(data.conversationId);

      setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
    } catch (err) {
      console.error('Brand agent error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to get response');
      setMessages(prev => prev.filter(m => m !== userMsg));
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, organization?.id, brandId, conversationId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const accentStyle = primaryColor ? { backgroundColor: primaryColor } : undefined;

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={() => setIsOpen(true)}
              size="lg"
              className="rounded-full h-14 w-14 shadow-lg hover:shadow-xl transition-all hover:scale-105"
              style={accentStyle}
            >
              <Bot className="h-6 w-6" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

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
              <div
                className="flex items-center justify-between px-4 py-3 border-b border-border/50 text-primary-foreground"
                style={accentStyle || { backgroundColor: 'hsl(var(--primary))' }}
              >
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4" />
                  <div>
                    <p className="text-sm font-semibold">{agentConfig.display_name}</p>
                    <p className="text-[10px] opacity-80">{brandName}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-primary-foreground hover:bg-white/20" onClick={() => setIsOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-8">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <MessageSquare className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{agentConfig.welcome_message}</p>
                    </div>
                    {agentConfig.suggested_questions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {agentConfig.suggested_questions.map(q => (
                          <button
                            key={q}
                            onClick={() => sendMessage(q)}
                            className="text-[11px] px-2.5 py-1 rounded-full border border-border hover:bg-muted transition-colors text-muted-foreground"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    )}
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
                    placeholder={`Ask about ${brandName}...`}
                    className="text-sm h-9"
                    disabled={isLoading}
                  />
                  <Button
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || isLoading}
                    style={accentStyle}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
