/**
 * DataForce AI Brand Assistant Component
 * Multilingual chatbot for brand questions with entity navigation
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Bot, 
  Send,
  Loader2,
  User,
  Sparkles,
  Globe,
  ExternalLink
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useOrganization } from '@/contexts/OrganizationContext';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface NavLink {
  type: 'brand' | 'product' | 'event';
  slug: string;
  section?: string;
  label: string;
}

interface BrandAssistantProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType?: 'brand' | 'product' | 'event';
  entityId?: string;
  entityName?: string;
}

const LANGUAGES = [
  { code: 'en_US', label: 'English', flag: '🇺🇸' },
  { code: 'es_ES', label: 'Spanish', flag: '🇪🇸' },
  { code: 'fr_FR', label: 'French', flag: '🇫🇷' },
  { code: 'de_DE', label: 'German', flag: '🇩🇪' },
  { code: 'ja_JP', label: 'Japanese', flag: '🇯🇵' },
  { code: 'zh_CN', label: 'Chinese', flag: '🇨🇳' },
  { code: 'pt_BR', label: 'Portuguese', flag: '🇧🇷' },
];

/** Parse [[nav:type:slug:section|label]] patterns from text */
function parseNavLinks(text: string): { cleanText: string; links: NavLink[] } {
  const navRegex = /\[\[nav:(brand|product|event):([a-z0-9-]+)(?::([a-z0-9-]+))?\|([^\]]+)\]\]/g;
  const links: NavLink[] = [];
  let match: RegExpExecArray | null;
  
  while ((match = navRegex.exec(text)) !== null) {
    links.push({
      type: match[1] as NavLink['type'],
      slug: match[2],
      section: match[3] || undefined,
      label: match[4],
    });
  }

  // Replace nav tokens with just the label text for markdown rendering
  const cleanText = text.replace(navRegex, '**$4**');
  return { cleanText, links };
}

export const BrandAssistant = ({
  open,
  onOpenChange,
  entityType,
  entityId,
  entityName
}: BrandAssistantProps) => {
  const { organization } = useOrganization();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [language, setLanguage] = useState('en_US');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    setMessages([]);
    setConversationId(null);
  }, [entityId, entityType]);

  const handleNavClick = useCallback((link: NavLink) => {
    const path = `/${link.type}/${link.slug}`;
    const hash = link.section ? `#${link.section}` : '';
    onOpenChange(false);
    setTimeout(() => navigate(`${path}${hash}`), 150);
  }, [navigate, onOpenChange]);

  const sendMessage = async () => {
    if (!input.trim() || !organization?.id) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await supabase.functions.invoke('dataforce-assistant', {
        body: {
          organization_id: organization.id,
          entity_type: entityType,
          entity_id: entityId,
          message: userMessage.content,
          conversation_id: conversationId,
          language_code: language,
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const data = response.data;
      if (!data.success) {
        throw new Error(data.error || 'Failed to get response');
      }

      if (data.conversationId) {
        setConversationId(data.conversationId);
      }

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Assistant error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to get response');
      
      setMessages(prev => prev.filter(m => m.id !== userMessage.id));
      setInput(userMessage.content);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const suggestedQuestions = entityName ? [
    `What are the core values of ${entityName}?`,
    `What colors should I use for ${entityName}?`,
    `How should I describe ${entityName} in marketing?`,
    `What is the brand voice for ${entityName}?`,
  ] : [
    'Show me our brands and their guidelines',
    'How do I maintain brand consistency?',
    'What are best practices for logo usage?',
    'How should I approach color accessibility?',
  ];

  const renderMessageContent = (message: Message) => {
    if (message.role === 'user') {
      return <p className="text-sm">{message.content}</p>;
    }

    const { cleanText, links } = parseNavLinks(message.content);

    return (
      <div className="space-y-2">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown>{cleanText}</ReactMarkdown>
        </div>
        {links.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {links.map((link, i) => (
              <Button
                key={i}
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1.5 bg-primary/5 border-primary/20 hover:bg-primary/10"
                onClick={() => handleNavClick(link)}
              >
                <ExternalLink className="h-3 w-3" />
                {link.label}
                {link.section && (
                  <Badge variant="secondary" className="text-[10px] h-4 px-1 ml-0.5">
                    #{link.section}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg flex flex-col h-full p-0">
        <SheetHeader className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-green-500" />
              Brand Assistant
            </SheetTitle>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-32">
                <Globe className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map(lang => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.flag} {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <SheetDescription>
            {entityName 
              ? `Ask questions about ${entityName}'s brand guidelines`
              : 'Your AI-powered brand knowledge assistant'}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="space-y-4">
              <div className="text-center py-8">
                <Sparkles className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Ask me anything about your brand guidelines
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  I can navigate you to any brand, product, or event page
                </p>
              </div>
              
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">Suggested questions:</p>
                {suggestedQuestions.map((question, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-left h-auto py-2 px-3"
                    onClick={() => setInput(question)}
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-green-500" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {renderMessageContent(message)}
                  </div>
                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="bg-muted rounded-lg px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about brand guidelines..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button 
              onClick={sendMessage} 
              disabled={!input.trim() || isLoading}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          {entityName && (
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Powered by DataForce AI • Context: {entityName}
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
