/**
 * ImageTagEditor - Inline tag editor for images
 */
import { useState, useRef, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

interface ImageTagEditorProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  onClose: () => void;
}

export const ImageTagEditor = ({ tags, onTagsChange, onClose }: ImageTagEditorProps) => {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const addTag = () => {
    const tag = input.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      onTagsChange([...tags, tag]);
    }
    setInput('');
  };

  const removeTag = (tag: string) => {
    onTagsChange(tags.filter(t => t !== tag));
  };

  return (
    <Card className="shadow-lg border-border">
      <CardContent className="p-2 space-y-1.5">
        <div className="flex flex-wrap gap-1">
          {tags.map(tag => (
            <Badge key={tag} variant="secondary" className="text-xs gap-0.5 pr-0.5">
              {tag}
              <button onClick={() => removeTag(tag)} className="ml-0.5 hover:text-destructive">
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-1">
          <Input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Add tag..."
            className="h-6 text-xs"
            onKeyDown={e => {
              if (e.key === 'Enter') { e.preventDefault(); addTag(); }
              if (e.key === 'Escape') onClose();
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
};
