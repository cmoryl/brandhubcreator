/**
 * CreateCollectionDialog - Dialog for creating/editing icon collections
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { IconLibrary } from '@/hooks/useIconLibraries';
import { cn } from '@/lib/utils';
import { LEVEL_BADGES } from './constants';

interface CreateCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingLibrary: IconLibrary | null;
  onSave: (data: { name: string; description: string; level: 'core' | 'product_line' | 'brand' }) => Promise<void>;
  isSaving: boolean;
}

export const CreateCollectionDialog = ({
  open,
  onOpenChange,
  editingLibrary,
  onSave,
  isSaving,
}: CreateCollectionDialogProps) => {
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formLevel, setFormLevel] = useState<'core' | 'product_line' | 'brand'>('core');

  useEffect(() => {
    if (open) {
      if (editingLibrary) {
        setFormName(editingLibrary.name);
        setFormDescription(editingLibrary.description || '');
        setFormLevel(editingLibrary.level);
      } else {
        setFormName('');
        setFormDescription('');
        setFormLevel('core');
      }
    }
  }, [open, editingLibrary]);

  const handleSave = async () => {
    if (!formName.trim()) return;
    await onSave({ name: formName, description: formDescription, level: formLevel });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingLibrary ? 'Edit Collection' : 'New Icon Collection'}</DialogTitle>
          <DialogDescription>
            {editingLibrary ? 'Update collection details' : 'Create a new icon collection for your organization'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              placeholder="e.g., Navigation Icons, Social Icons"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              placeholder="What icons are in this collection?"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              rows={2}
            />
          </div>
          {!editingLibrary && (
            <div className="space-y-2">
              <Label>Type</Label>
              <div className="grid grid-cols-3 gap-2">
                {(['core', 'product_line', 'brand'] as const).map(level => {
                  const badge = LEVEL_BADGES[level];
                  const Icon = badge.icon;
                  return (
                    <button
                      key={level}
                      onClick={() => setFormLevel(level)}
                      className={cn(
                        'p-3 rounded-lg border text-center transition-colors',
                        formLevel === level
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-muted-foreground/50'
                      )}
                    >
                      <Icon className={cn('h-5 w-5 mx-auto mb-1', formLevel === level ? 'text-primary' : 'text-muted-foreground')} />
                      <p className="text-xs font-medium">{badge.label}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {level === 'core' ? 'All entities' : level === 'product_line' ? 'By division' : 'Specific'}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={handleSave}
            disabled={!formName.trim() || isSaving}
          >
            {editingLibrary ? 'Save Changes' : 'Create Collection'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
