import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SavedPrompt {
  id: string;
  name: string;
  prompt: string;
  category: string;
  is_default: boolean;
  created_by: string | null;
  organization_id: string | null;
  created_at: string;
  updated_at: string;
}

export function useSavedPrompts() {
  const [prompts, setPrompts] = useState<SavedPrompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPrompts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('saved_report_prompts')
        .select('*')
        .order('is_default', { ascending: false })
        .order('name', { ascending: true });

      if (error) throw error;
      setPrompts(data || []);
    } catch (error) {
      console.error('Error fetching saved prompts:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  const savePrompt = async (name: string, prompt: string, category: string = 'general') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to save prompts');
        return null;
      }

      const { data, error } = await supabase
        .from('saved_report_prompts')
        .insert({
          name,
          prompt,
          category,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      setPrompts(prev => [...prev, data]);
      toast.success('Prompt saved successfully');
      return data;
    } catch (error) {
      console.error('Error saving prompt:', error);
      toast.error('Failed to save prompt');
      return null;
    }
  };

  const deletePrompt = async (id: string) => {
    try {
      const { error } = await supabase
        .from('saved_report_prompts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPrompts(prev => prev.filter(p => p.id !== id));
      toast.success('Prompt deleted');
    } catch (error) {
      console.error('Error deleting prompt:', error);
      toast.error('Failed to delete prompt');
    }
  };

  const updatePrompt = async (id: string, updates: Partial<Pick<SavedPrompt, 'name' | 'prompt' | 'category'>>) => {
    try {
      const { data, error } = await supabase
        .from('saved_report_prompts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setPrompts(prev => prev.map(p => p.id === id ? data : p));
      toast.success('Prompt updated');
      return data;
    } catch (error) {
      console.error('Error updating prompt:', error);
      toast.error('Failed to update prompt');
      return null;
    }
  };

  return {
    prompts,
    isLoading,
    savePrompt,
    deletePrompt,
    updatePrompt,
    refetch: fetchPrompts,
  };
}
