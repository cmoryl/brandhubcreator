/**
 * DataForce AI Brand Assistant Component
 * Multilingual chatbot with orb-style voice UI and live dictation
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
  Volume2,
  VolumeX,
  RotateCcw,
  Settings2,
  Zap,
  Lightbulb,
  GraduationCap,
  MessageSquare,
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useOrganization } from '@/contexts/OrganizationContext';
import ReactMarkdown from 'react-markdown';
import { AssistantOrb } from './AssistantOrb';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

type ConversationStyle = 'direct' | 'suggestive' | 'educational' | 'creative';

const CONVERSATION_STYLES: { value: ConversationStyle; label: string; description: string; icon: typeof Zap }[] = [
  { value: 'direct', label: 'Direct', description: 'Concise, straight-to-the-point answers', icon: Zap },
  { value: 'suggestive', label: 'Suggestions', description: 'Offers ideas and alternatives', icon: Lightbulb },
  { value: 'educational', label: 'Educational', description: 'Detailed explanations with context', icon: GraduationCap },
  { value: 'creative', label: 'Creative', description: 'Exploratory and imaginative responses', icon: MessageSquare },
];

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
  const [conversationStyle, setConversationStyle] = useState<ConversationStyle>('direct');
  
  // Voice state
  const [isListening, setIsListening] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [dictationEnabled, setDictationEnabled] = useState(false);
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

        const allConvs = convResult.data || [];
        setPastConversationCount(allConvs.length);

        if (personaResult.data) {
          setHasPersona(true);
        }

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
      setDictationEnabled(false);
    }
  }, [open]);

  // ───── Speech Recognition ─────

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Speech recognition is not supported in this browser');
      return;
    }

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
        setDictationEnabled(false);
      } else if (event.error === 'no-speech') {
        // Normal timeout
      } else if (event.error !== 'aborted') {
        toast.error('Microphone error: ' + event.error);
      }
    };

    recognition.onend = () => {
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
    if (isMuted) {
      onComplete?.();
      return;
    }
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
  }, [language, isMuted]);

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

  // Dictation toggle
  const toggleDictation = useCallback((enabled: boolean) => {
    setDictationEnabled(enabled);
    if (enabled) {
      startListening();
    } else {
      stopListening();
    }
  }, [startListening, stopListening]);

  // ───── Message Sending ─────

  const sendVoiceMessage = useCallback(async (text: string) => {
    if (!text || !organization?.id) return;

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
          conversation_style: conversationStyle,
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
          conversation_style: conversationStyle,
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

  const handleReset = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    stopVoiceMode();
    toast.success('Conversation reset');
  }, [stopVoiceMode]);

  const handleMuteToggle = useCallback(() => {
    if (isMuted) {
      setIsMuted(false);
    } else {
      setIsMuted(true);
      stopSpeaking();
    }
  }, [isMuted, stopSpeaking]);

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

  // Orb state
  const orbState = isSpeaking ? 'speaking' : isLoading ? 'thinking' : isListening ? 'listening' : 'idle';
  const statusText = isSpeaking
    ? 'Speaking...'
    : isLoading
      ? 'Thinking...'
      : isListening
        ? 'Listening — speak now'
        : 'Ready to assist';
  const statusSubtext = isListening
    ? (interimText ? `"${interimText}"` : 'Speak to the orb for creative assistance.')
    : entityName
      ? `Ask about ${entityName}'s brand guidelines`
      : 'Speak to the orb for creative assistance.';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg flex flex-col h-full p-0">
        {/* Header */}
        <SheetHeader className="p-4 pb-3 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2 text-base">
              <Bot className="h-5 w-5 text-primary" />
              Brand Assistant
              {hasPersona && (
                <Badge variant="secondary" className="text-[10px] h-5 gap-1">
                  <Sparkles className="h-3 w-3" />
                  Personalized
                </Badge>
              )}
            </SheetTitle>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-28 h-8 text-xs">
                <Globe className="h-3.5 w-3.5 mr-1" />
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
          <SheetDescription className="sr-only">AI-powered brand knowledge assistant</SheetDescription>
        </SheetHeader>

        {/* Orb Section - always visible */}
        <div className="flex flex-col items-center py-6 px-4 border-b bg-gradient-to-b from-background to-muted/30">
          <AssistantOrb
            state={orbState}
            onClick={toggleVoiceMode}
          />
          <h3 className="mt-4 text-lg font-semibold text-foreground">{statusText}</h3>
          <p className="text-sm text-muted-foreground text-center mt-1 max-w-xs">
            {statusSubtext}
          </p>

          {/* Control buttons */}
          <div className="flex items-center gap-3 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="gap-2 rounded-full px-5 h-9 border-border/60"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleMuteToggle}
              className="gap-2 rounded-full px-5 h-9 border-border/60"
            >
              {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
              {isMuted ? 'Unmute' : 'Mute'}
            </Button>
          </div>

          {/* Dictation & Style Controls */}
          <div className="flex items-center gap-3 mt-4">
            <div className="flex items-center gap-2.5 bg-muted/50 rounded-full px-4 py-2">
              <Mic className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Live Dictation</span>
              <Switch
                checked={dictationEnabled}
                onCheckedChange={toggleDictation}
                className="scale-90"
              />
            </div>

            {/* Conversation Style Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full h-9 px-3 gap-1.5 border-border/60"
                >
                  {(() => {
                    const style = CONVERSATION_STYLES.find(s => s.value === conversationStyle);
                    const Icon = style?.icon || Zap;
                    return <Icon className="h-3.5 w-3.5" />;
                  })()}
                  <span className="text-xs">{CONVERSATION_STYLES.find(s => s.value === conversationStyle)?.label}</span>
                  <Settings2 className="h-3 w-3 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2" align="center">
                <p className="text-xs font-medium text-muted-foreground px-2 pb-2">Conversation Style</p>
                <div className="space-y-1">
                  {CONVERSATION_STYLES.map(style => {
                    const Icon = style.icon;
                    const isSelected = conversationStyle === style.value;
                    return (
                      <button
                        key={style.value}
                        onClick={() => setConversationStyle(style.value)}
                        className={`w-full flex items-start gap-3 rounded-md px-3 py-2.5 text-left transition-colors ${
                          isSelected
                            ? 'bg-primary/10 border border-primary/20'
                            : 'hover:bg-muted/80 border border-transparent'
                        }`}
                      >
                        <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                        <div>
                          <p className={`text-sm font-medium ${isSelected ? 'text-primary' : 'text-foreground'}`}>{style.label}</p>
                          <p className="text-[11px] text-muted-foreground">{style.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {pastConversationCount > 1 && (
            <Badge variant="outline" className="text-[10px] h-5 mt-3">
              {pastConversationCount} past sessions
            </Badge>
          )}
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="space-y-3 pt-2">
              <p className="text-xs text-muted-foreground font-medium">Suggested questions:</p>
              {suggestedQuestions.map((question, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-left h-auto py-2.5 px-3 text-xs"
                  onClick={() => setInput(question)}
                >
                  {question}
                </Button>
              ))}
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
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-3.5 w-3.5 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg px-3.5 py-2 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {renderMessageContent(message)}
                  </div>
                  {message.role === 'user' && (
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User className="h-3.5 w-3.5 text-primary" />
                    </div>
                  )}
                </div>
              ))}
              {/* Interim speech text */}
              {interimText && !isVoiceMode && (
                <div className="flex gap-3 justify-end">
                  <div className="max-w-[80%] rounded-lg px-3.5 py-2 bg-primary/20 text-foreground italic text-sm">
                    {interimText}...
                  </div>
                </div>
              )}
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="bg-muted rounded-lg px-3.5 py-3">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t p-3">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={dictationEnabled ? 'Listening...' : 'Ask about brand guidelines...'}
              disabled={isLoading || isVoiceMode}
              className={`flex-1 h-9 text-sm ${dictationEnabled ? 'border-primary/40' : ''}`}
            />
            {!isVoiceMode && !dictationEnabled && (
              <Button
                onClick={() => toggleDictation(true)}
                variant="outline"
                size="icon"
                className="h-9 w-9"
                title="Start dictation"
                disabled={isLoading}
              >
                <Mic className="h-4 w-4" />
              </Button>
            )}
            {dictationEnabled && !isVoiceMode && (
              <Button
                onClick={() => toggleDictation(false)}
                variant="destructive"
                size="icon"
                className="h-9 w-9"
                title="Stop dictation"
              >
                <MicOff className="h-4 w-4" />
              </Button>
            )}
            <Button 
              onClick={sendMessage} 
              disabled={!input.trim() || isLoading || isVoiceMode}
              size="icon"
              className="h-9 w-9"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
            Powered by DataForce AI {entityName ? `• ${entityName}` : ''}
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
};
