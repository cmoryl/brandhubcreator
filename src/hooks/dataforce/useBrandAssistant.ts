/**
 * DataForce Brand Assistant Hook
 * Manages AI chatbot conversations with persistence
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: {
    sources?: string[];
    confidence?: number;
  };
}

interface UseBrandAssistantOptions {
  organizationId: string;
  entityType?: 'brand' | 'product' | 'event';
  entityId?: string;
  entityName?: string;
  language?: string;
}

interface UseBrandAssistantReturn {
  messages: Message[];
  isLoading: boolean;
  conversationId: string | null;
  language: string;
  setLanguage: (lang: string) => void;
  sendMessage: (content: string) => Promise<void>;
  clearConversation: () => void;
  loadConversation: (conversationId: string) => Promise<void>;
}

export function useBrandAssistant({
  organizationId,
  entityType,
  entityId,
  entityName,
  language: initialLanguage = 'en_US'
}: UseBrandAssistantOptions): UseBrandAssistantReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [language, setLanguage] = useState(initialLanguage);

  // Reset conversation when entity changes
  useEffect(() => {
    setMessages([]);
    setConversationId(null);
  }, [entityId, entityType]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || !organizationId) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await supabase.functions.invoke('dataforce-assistant', {
        body: {
          organization_id: organizationId,
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
      
      // Remove user message on error
      setMessages(prev => prev.filter(m => m.id !== userMessage.id));
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, entityType, entityId, conversationId, language]);

  const clearConversation = useCallback(() => {
    setMessages([]);
    setConversationId(null);
  }, []);

  const loadConversation = useCallback(async (convId: string) => {
    try {
      const { data, error } = await supabase
        .from('dataforce_assistant_conversations')
        .select('messages')
        .eq('id', convId)
        .single();

      if (error) throw error;
      
      setConversationId(convId);
      setMessages((data.messages as unknown as Message[]) || []);
    } catch (error) {
      console.error('Failed to load conversation:', error);
      toast.error('Failed to load conversation');
    }
  }, []);

  return {
    messages,
    isLoading,
    conversationId,
    language,
    setLanguage,
    sendMessage,
    clearConversation,
    loadConversation,
  };
}
