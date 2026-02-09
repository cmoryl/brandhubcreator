/**
 * Prompt Library Component
 * Manage and organize reusable AI prompts
 */

import { useState } from 'react';
import { BookOpen, Plus, Trash2, Play, Copy, Check, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import type { BrandPrompt, PromptCategory, AspectRatio, StylePreset, PROMPT_CATEGORIES } from '@/types/creativeStudio';
import { DEFAULT_PROMPTS } from '@/types/creativeStudio';

interface PromptLibraryProps {
  prompts: BrandPrompt[];
  isLoading: boolean;
  onUsePrompt: (prompt: BrandPrompt) => void;
  onDeletePrompt: (promptId: string) => Promise<boolean>;
  onSavePrompt: (prompt: Omit<BrandPrompt, 'id' | 'entity_id' | 'entity_type' | 'organization_id' | 'created_by' | 'created_at' | 'updated_at' | 'use_count' | 'last_used_at'>) => Promise<BrandPrompt | null>;
  entityName: string;
}

const CATEGORY_LABELS: Record<PromptCategory, string> = {
  general: 'General',
  social: 'Social Media',
  marketing: 'Marketing',
  product: 'Product',
  event: 'Event',
  pattern: 'Pattern',
  photography: 'Photography',
  hero: 'Hero',
  icon: 'Icon'
};

const CATEGORY_COLORS: Record<PromptCategory, string> = {
  general: 'bg-gray-500',
  social: 'bg-blue-500',
  marketing: 'bg-orange-500',
  product: 'bg-green-500',
  event: 'bg-purple-500',
  pattern: 'bg-pink-500',
  photography: 'bg-amber-500',
  hero: 'bg-indigo-500',
  icon: 'bg-teal-500'
};

export const PromptLibrary = ({
  prompts,
  isLoading,
  onUsePrompt,
  onDeletePrompt,
  onSavePrompt,
  entityName
}: PromptLibraryProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<PromptCategory | 'all'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  
  // New prompt form state
  const [newPrompt, setNewPrompt] = useState({
    name: '',
    category: 'general' as PromptCategory,
    prompt_template: '',
    description: '',
    aspect_ratio: '1:1' as AspectRatio,
    style_preset: 'photorealistic' as StylePreset
  });

  const filteredPrompts = prompts.filter(p => {
    const matchesSearch = !searchQuery || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.prompt_template.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || p.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const copyPrompt = async (prompt: BrandPrompt) => {
    await navigator.clipboard.writeText(prompt.prompt_template);
    setCopiedId(prompt.id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success('Prompt copied');
  };

  const handleAddPrompt = async () => {
    if (!newPrompt.name.trim() || !newPrompt.prompt_template.trim()) {
      toast.error('Name and prompt are required');
      return;
    }

    const result = await onSavePrompt({
      name: newPrompt.name,
      category: newPrompt.category,
      prompt_template: newPrompt.prompt_template,
      description: newPrompt.description || null,
      output_format: 'image',
      aspect_ratio: newPrompt.aspect_ratio,
      style_preset: newPrompt.style_preset,
      is_default: false,
      is_shared: false
    });

    if (result) {
      setShowAddDialog(false);
      setNewPrompt({
        name: '',
        category: 'general',
        prompt_template: '',
        description: '',
        aspect_ratio: '1:1',
        style_preset: 'photorealistic'
      });
    }
  };

  const handleAddDefaultPrompts = async () => {
    let added = 0;
    for (const defaultPrompt of DEFAULT_PROMPTS) {
      const result = await onSavePrompt({
        ...defaultPrompt,
        prompt_template: defaultPrompt.prompt_template.replace(/\{\{brand_name\}\}/g, entityName)
      });
      if (result) added++;
    }
    toast.success(`Added ${added} default prompts`);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with search and filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search prompts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v as PromptCategory | 'all')}>
          <SelectTrigger className="w-[150px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {(Object.entries(CATEGORY_LABELS) as [PromptCategory, string][]).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Prompt
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add New Prompt</DialogTitle>
              <DialogDescription>
                Create a reusable prompt for generating images
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="prompt-name">Name</Label>
                <Input
                  id="prompt-name"
                  value={newPrompt.name}
                  onChange={(e) => setNewPrompt(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Social Media Post"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select 
                    value={newPrompt.category} 
                    onValueChange={(v) => setNewPrompt(prev => ({ ...prev, category: v as PromptCategory }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.entries(CATEGORY_LABELS) as [PromptCategory, string][]).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Aspect Ratio</Label>
                  <Select 
                    value={newPrompt.aspect_ratio} 
                    onValueChange={(v) => setNewPrompt(prev => ({ ...prev, aspect_ratio: v as AspectRatio }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1:1">Square (1:1)</SelectItem>
                      <SelectItem value="16:9">Landscape (16:9)</SelectItem>
                      <SelectItem value="9:16">Portrait (9:16)</SelectItem>
                      <SelectItem value="4:3">Standard (4:3)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="prompt-template">Prompt Template</Label>
                <Textarea
                  id="prompt-template"
                  value={newPrompt.prompt_template}
                  onChange={(e) => setNewPrompt(prev => ({ ...prev, prompt_template: e.target.value }))}
                  placeholder={`Create a professional image for {{brand_name}}...`}
                  className="min-h-[100px]"
                />
                <p className="text-xs text-muted-foreground">
                  Use <code className="bg-muted px-1 rounded">{'{{brand_name}}'}</code> as a placeholder
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
              <Button onClick={handleAddPrompt}>Save Prompt</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Empty state */}
      {prompts.length === 0 && (
        <Card className="p-8 text-center">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="font-medium mb-2">No prompts yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Start building your prompt library for consistent brand imagery
          </p>
          <Button onClick={handleAddDefaultPrompts} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Default Prompts
          </Button>
        </Card>
      )}

      {/* Prompt cards */}
      <div className="grid gap-4">
        {filteredPrompts.map((prompt) => (
          <Card key={prompt.id} className="group">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{prompt.name}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <Badge 
                      variant="secondary" 
                      className={`${CATEGORY_COLORS[prompt.category]} text-white text-[10px] px-1.5`}
                    >
                      {CATEGORY_LABELS[prompt.category]}
                    </Badge>
                    <span className="text-xs">
                      {prompt.aspect_ratio} • Used {prompt.use_count} times
                    </span>
                  </CardDescription>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => copyPrompt(prompt)}
                  >
                    {copiedId === prompt.id ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete prompt?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete "{prompt.name}" from your library.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDeletePrompt(prompt.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {prompt.prompt_template}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onUsePrompt(prompt)}
                className="gap-2"
              >
                <Play className="h-3 w-3" />
                Use This Prompt
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No results */}
      {filteredPrompts.length === 0 && prompts.length > 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No prompts match your search
        </div>
      )}
    </div>
  );
};
