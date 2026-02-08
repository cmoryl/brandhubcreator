import { useState } from 'react';
import { Pencil, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface BrandHeaderProps {
  name: string;
  description: string;
  onNameChange?: (name: string) => void;
  onDescriptionChange?: (description: string) => void;
}

export const BrandHeader = ({ name, description, onNameChange, onDescriptionChange }: BrandHeaderProps) => {
  const [isEditing, setIsEditing] = useState(false);
  
  // Derive canEdit from whether change handlers are provided
  const canEdit = Boolean(onNameChange && onDescriptionChange);

  return (
    <header className="relative">
      {/* Decorative background */}
      <div className="absolute inset-0 bg-gradient-to-br from-coral/5 via-transparent to-teal/5 rounded-3xl" />
      
      <div className="relative px-8 py-12 sm:px-12 sm:py-16">
        {isEditing && canEdit ? (
          <div className="space-y-4 max-w-2xl animate-fade-in">
            <Input
              value={name}
              onChange={(e) => onNameChange?.(e.target.value)}
              placeholder="Brand Name"
              className="text-3xl sm:text-4xl font-serif font-semibold h-auto py-2 bg-transparent border-0 border-b-2 rounded-none focus-visible:ring-0 focus-visible:border-accent"
            />
            <Textarea
              value={description}
              onChange={(e) => onDescriptionChange?.(e.target.value)}
              placeholder="Add a description for your brand guide..."
              className="text-lg resize-none bg-transparent border-0 border-b border-dashed rounded-none focus-visible:ring-0 focus-visible:border-accent min-h-[60px]"
            />
            <button
              onClick={() => setIsEditing(false)}
              className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:text-accent/80 transition-colors"
            >
              <Check className="h-4 w-4" />
              Done editing
            </button>
          </div>
        ) : (
          <div className="group animate-fade-in">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-semibold text-foreground tracking-tight">
                  {name || 'Untitled Brand'}
                </h1>
                <p className="text-lg sm:text-xl text-muted-foreground mt-3 max-w-2xl">
                  {description || (canEdit ? 'Click to add a description for your brand guide' : 'No description available')}
                </p>
              </div>
              {canEdit && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="shrink-0 p-3 rounded-xl bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground transition-all opacity-0 group-hover:opacity-100"
                >
                  <Pencil className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
