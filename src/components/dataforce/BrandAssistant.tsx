/**
 * DataForce AI Brand Assistant Component
 * Multilingual chatbot with live voice conversation mode
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
  ExternalLink,
  Mic,
  MicOff,
  AudioLines,
  Volume2,
  VolumeX,
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

const LANG_MAP: Record<string, string> = {
  en_US: 'en-US', es_ES: 'es-ES', fr_FR: 'fr-FR',
  de_DE: 'de-DE', ja_JP: 'ja-JP', zh_CN: 'zh-CN', pt_BR: 'pt-BR',
};

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

  const cleanText = text.replace(navRegex, '**$4**');
  return { cleanText, links };
}

/** Strip markdown for TTS */
function stripMarkdown(text: string): string {
  return text
    .replace(/\[\[nav:[^\]]+\|([^\]]+)\]\]/g, '$1')
    .replace(/#{1,6}\s*/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[-*+]\s/g, '')
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, ' ')
    .trim();
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
  const [hasPersona, setHasPersona] = useState(false);
  const [pastConversationCount, setPastConversationCount] = useState(0);
  
  // Voice state
  const [isListening, setIsListening] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [interimText, setInterimText] = useState('');
  
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const voiceModeRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, interimText]);

  // Load voices on mount
  useEffect(() => {
    const loadVoices = () => window.speechSynthesis.getVoices();
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
  }, []);

  // Load existing conversation for this entity + check persona
  useEffect(() => {
    if (!organization?.id || conversationId) return;

    let cancelled = false;
    const loadExisting = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || cancelled) return;

        // Load conversations and persona status in parallel
        const [convResult, personaResult] = await Promise.all([
          supabase
            .from('dataforce_assistant_conversations')
            .select('id, messages, entity_id')
            .eq('organization_id', organization.id)
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false })
            .limit(10),
          supabase
            .from('user_assistant_profiles')
            .select('id, interaction_count')
            .eq('user_id', user.id)
            .eq('organization_id', organization.id)
            .maybeSingle(),
        ]);

        if (cancelled) return;

        // Count total past conversations
        const allConvs = convResult.data || [];
        setPastConversationCount(allConvs.length);

        // Check if user has a persona profile
        if (personaResult.data) {
          setHasPersona(true);
        }

        // Prefer entity-specific conversation, fall back to most recent
        const entityConv = entityId 
          ? allConvs.find(c => c.entity_id === entityId)
          : null;
        const targetConv = entityConv || allConvs[0];

        if (targetConv?.messages && Array.isArray(targetConv.messages) && targetConv.messages.length > 0) {
          setConversationId(targetConv.id);
          setMessages(targetConv.messages as unknown as Message[]);
        }
      } catch (err) {
        if (!cancelled) console.warn('Failed to load existing conversation:', err);
      }
    };

    loadExisting();
    return () => { cancelled = true; };
  }, [organization?.id, conversationId, entityId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
      window.speechSynthesis.cancel();
    };
  }, []);

  // Stop voice mode when sheet closes
  useEffect(() => {
    if (!open) {
      stopVoiceMode();
    }
  }, [open]);

  // ───── Speech Recognition ─────

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Speech recognition is not supported in this browser');
      return;
    }

    // Stop any existing instance
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
      recognitionRef.current = null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = LANG_MAP[language] || 'en-US';

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interim += transcript;
        }
      }
      
      setInterimText(interim);
      
      if (finalTranscript) {
        setInterimText('');
        if (voiceModeRef.current) {
          // In voice mode, auto-send the message
          sendVoiceMessage(finalTranscript.trim());
        } else {
          setInput(prev => (prev + ' ' + finalTranscript).trim());
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        toast.error('Microphone permission denied. Please allow access in browser settings.');
        setIsListening(false);
        isListeningRef.current = false;
        setIsVoiceMode(false);
        voiceModeRef.current = false;
      } else if (event.error === 'no-speech') {
        // Normal timeout, will auto-restart via onend
      } else if (event.error !== 'aborted') {
        toast.error('Microphone error: ' + event.error);
      }
    };

    recognition.onend = () => {
      // Auto-restart if still in listening mode
      if (isListeningRef.current) {
        try {
          recognition.start();
        } catch {
          setIsListening(false);
          isListeningRef.current = false;
        }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;
    isListeningRef.current = true;
    setIsListening(true);
    setInterimText('');
    
    try {
      recognition.start();
    } catch (e) {
      console.error('Failed to start recognition:', e);
      setIsListening(false);
      isListeningRef.current = false;
    }
  }, [language]);

  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    setIsListening(false);
    setInterimText('');
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
      recognitionRef.current = null;
    }
  }, []);

  // ───── Text-to-Speech ─────

  const speakText = useCallback((text: string, onComplete?: () => void) => {
    window.speechSynthesis.cancel();
    
    const plainText = stripMarkdown(text);
    if (!plainText) {
      onComplete?.();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(plainText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    utterance.lang = LANG_MAP[language] || 'en-US';

    const voices = window.speechSynthesis.getVoices();
    const langPrefix = (LANG_MAP[language] || 'en-US').split('-')[0];
    const preferredVoice = voices.find(v => v.name.includes('Natural') && v.lang.startsWith(langPrefix))
      || voices.find(v => v.lang.startsWith(langPrefix))
      || voices[0];
    if (preferredVoice) utterance.voice = preferredVoice;

    setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      onComplete?.();
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      onComplete?.();
    };

    window.speechSynthesis.speak(utterance);
  }, [language]);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  // ───── Voice Mode ─────

  const startVoiceMode = useCallback(() => {
    setIsVoiceMode(true);
    voiceModeRef.current = true;
    startListening();
  }, [startListening]);

  const stopVoiceMode = useCallback(() => {
    setIsVoiceMode(false);
    voiceModeRef.current = false;
    stopListening();
    stopSpeaking();
  }, [stopListening, stopSpeaking]);

  const toggleVoiceMode = useCallback(() => {
    if (isVoiceMode) {
      stopVoiceMode();
    } else {
      startVoiceMode();
    }
  }, [isVoiceMode, startVoiceMode, stopVoiceMode]);

  // Simple mic toggle (dictation only, no TTS)
  const toggleDictation = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // ───── Message Sending ─────

  const sendVoiceMessage = useCallback(async (text: string) => {
    if (!text || !organization?.id) return;

    // Stop listening while processing
    stopListening();

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await supabase.functions.invoke('dataforce-assistant', {
        body: {
          organization_id: organization.id,
          entity_type: entityType,
          entity_id: entityId,
          message: text,
          conversation_id: conversationId,
          language_code: language,
        }
      });

      if (response.error) throw new Error(response.error.message);

      const data = response.data;
      if (!data.success) throw new Error(data.error || 'Failed to get response');

      if (data.conversationId) setConversationId(data.conversationId);
      if (data.hasPersona) setHasPersona(true);

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);

      // In voice mode, speak the response then resume listening
      if (voiceModeRef.current) {
        speakText(data.message, () => {
          if (voiceModeRef.current) {
            startListening();
          }
        });
      }
    } catch (error) {
      console.error('Assistant error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to get response');
      setMessages(prev => prev.filter(m => m.id !== userMessage.id));
      setIsLoading(false);
      
      // Resume listening in voice mode even on error
      if (voiceModeRef.current) {
        startListening();
      }
    }
  }, [organization?.id, entityType, entityId, conversationId, language, speakText, startListening, stopListening]);

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

      if (response.error) throw new Error(response.error.message);

      const data = response.data;
      if (!data.success) throw new Error(data.error || 'Failed to get response');

      if (data.conversationId) setConversationId(data.conversationId);
      if (data.hasPersona) setHasPersona(true);

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

  const handleNavClick = useCallback((link: NavLink) => {
    const path = `/${link.type}/${link.slug}`;
    const hash = link.section ? `#${link.section}` : '';
    onOpenChange(false);
    setTimeout(() => navigate(`${path}${hash}`), 150);
  }, [navigate, onOpenChange]);

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
        {/* Speak button on assistant messages */}
        <div className="flex gap-1 pt-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs gap-1 text-muted-foreground hover:text-foreground"
            onClick={() => {
              if (isSpeaking) {
                stopSpeaking();
              } else {
                speakText(message.content);
              }
            }}
          >
            {isSpeaking ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
            {isSpeaking ? 'Stop' : 'Listen'}
          </Button>
        </div>
      </div>
    );
  };

  // Voice mode visual state
  const voiceStatus = isVoiceMode
    ? isSpeaking
      ? 'Bot speaking...'
      : isLoading
        ? 'Thinking...'
        : isListening
          ? 'Listening — speak now...'
          : 'Starting...'
    : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg flex flex-col h-full p-0">
        <SheetHeader className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-green-500" />
              Brand Assistant
            </SheetTitle>
            <div className="flex items-center gap-2">
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
          </div>
          <SheetDescription className="flex items-center gap-2">
            <span>
              {entityName 
                ? `Ask questions about ${entityName}'s brand guidelines`
                : 'Your AI-powered brand knowledge assistant'}
            </span>
            {hasPersona && (
              <Badge variant="secondary" className="text-[10px] h-5 gap-1">
                <Sparkles className="h-3 w-3" />
                Personalized
              </Badge>
            )}
            {pastConversationCount > 1 && (
              <Badge variant="outline" className="text-[10px] h-5">
                {pastConversationCount} sessions
              </Badge>
            )}
          </SheetDescription>
        </SheetHeader>

        {/* Voice Mode Banner */}
        {isVoiceMode && (
          <div className="px-4 py-3 bg-primary/5 border-b flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                isSpeaking ? 'bg-amber-500 animate-pulse' 
                : isListening ? 'bg-red-500 animate-pulse' 
                : isLoading ? 'bg-blue-500 animate-pulse'
                : 'bg-muted-foreground'
              }`} />
              <span className="text-sm font-medium truncate">{voiceStatus}</span>
              {interimText && (
                <span className="text-xs text-muted-foreground italic truncate">
                  "{interimText}"
                </span>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={stopVoiceMode}
              className="flex-shrink-0 text-xs h-7"
            >
              End Voice Chat
            </Button>
          </div>
        )}

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
              
              {/* Voice Mode CTA */}
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={startVoiceMode}
                  className="gap-2"
                  disabled={isVoiceMode}
                >
                  <AudioLines className="h-4 w-4" />
                  Start Voice Conversation
                </Button>
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
              {/* Show interim speech text */}
              {interimText && !isVoiceMode && (
                <div className="flex gap-3 justify-end">
                  <div className="max-w-[80%] rounded-lg px-4 py-2 bg-primary/20 text-foreground italic text-sm">
                    {interimText}...
                  </div>
                </div>
              )}
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
              placeholder={isListening ? 'Listening...' : 'Ask about brand guidelines...'}
              disabled={isLoading || isVoiceMode}
              className={`flex-1 ${isListening && !isVoiceMode ? 'border-red-500/50 animate-pulse' : ''}`}
            />
            {/* Voice Mode Toggle */}
            <Button
              onClick={toggleVoiceMode}
              variant={isVoiceMode ? 'destructive' : 'secondary'}
              size="icon"
              title={isVoiceMode ? 'End voice chat' : 'Start voice chat'}
              disabled={isLoading && !isVoiceMode}
            >
              <AudioLines className="h-4 w-4" />
            </Button>
            {/* Dictation mic (non-voice-mode only) */}
            {!isVoiceMode && (
              <Button
                onClick={toggleDictation}
                variant={isListening ? 'destructive' : 'outline'}
                size="icon"
                title={isListening ? 'Stop dictation' : 'Dictate'}
                disabled={isLoading}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
            )}
            <Button 
              onClick={sendMessage} 
              disabled={!input.trim() || isLoading || isVoiceMode}
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
