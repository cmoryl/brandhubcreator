import { useState } from 'react';
import { Pencil, Check, Plus, X } from 'lucide-react';
import { BrandIdentity } from '@/types/brand';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface IdentitySectionProps {
  identity: BrandIdentity;
  onIdentityChange: (identity: BrandIdentity) => void;
}

const archetypes = [
  'The Innocent',
  'The Sage',
  'The Explorer',
  'The Outlaw',
  'The Magician',
  'The Hero',
  'The Lover',
  'The Jester',
  'The Everyman',
  'The Caregiver',
  'The Ruler',
  'The Creator',
];

export const IdentitySection = ({ identity, onIdentityChange }: IdentitySectionProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newTone, setNewTone] = useState('');

  const addTone = () => {
    if (newTone.trim() && !identity.toneOfVoice.includes(newTone.trim())) {
      onIdentityChange({ ...identity, toneOfVoice: [...identity.toneOfVoice, newTone.trim()] });
      setNewTone('');
    }
  };

  const removeTone = (tone: string) => {
    onIdentityChange({ ...identity, toneOfVoice: identity.toneOfVoice.filter(t => t !== tone) });
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-semibold text-foreground">Narrative Architecture</h2>
          <p className="text-muted-foreground mt-1">Define your brand's soul - mission, archetype, and voice</p>
        </div>
        <Button
          variant={isEditing ? "default" : "outline"}
          size="sm"
          onClick={() => setIsEditing(!isEditing)}
          className="gap-2"
        >
          {isEditing ? <Check className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
          {isEditing ? 'Done' : 'Edit'}
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Mission Statement */}
        <div className="bg-card rounded-xl p-6 border border-border">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">Mission Statement</h3>
          {isEditing ? (
            <Textarea
              value={identity.missionStatement}
              onChange={(e) => onIdentityChange({ ...identity, missionStatement: e.target.value })}
              placeholder="What is your brand's purpose? Why does it exist?"
              className="min-h-[100px] resize-none"
            />
          ) : (
            <p className="text-lg text-foreground leading-relaxed">
              {identity.missionStatement || 'Define your brand\'s purpose and reason for existence.'}
            </p>
          )}
        </div>

        {/* Archetype */}
        <div className="bg-card rounded-xl p-6 border border-border">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">Brand Archetype</h3>
          {isEditing ? (
            <Select
              value={identity.archetype}
              onValueChange={(value) => onIdentityChange({ ...identity, archetype: value })}
            >
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue placeholder="Select an archetype" />
              </SelectTrigger>
              <SelectContent>
                {archetypes.map(arch => (
                  <SelectItem key={arch} value={arch}>{arch}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-2xl font-serif font-semibold text-foreground">
                {identity.archetype || 'No archetype selected'}
              </span>
            </div>
          )}
        </div>

        {/* Tone of Voice */}
        <div className="bg-card rounded-xl p-6 border border-border">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">Tone of Voice</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {identity.toneOfVoice.map((tone) => (
              <Badge key={tone} variant="secondary" className="text-sm py-1 px-3">
                {tone}
                {isEditing && (
                  <button onClick={() => removeTone(tone)} className="ml-2 hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                )}
              </Badge>
            ))}
            {identity.toneOfVoice.length === 0 && !isEditing && (
              <span className="text-muted-foreground">No tone descriptors added yet</span>
            )}
          </div>
          {isEditing && (
            <div className="flex gap-2">
              <Input
                value={newTone}
                onChange={(e) => setNewTone(e.target.value)}
                placeholder="e.g., Professional, Friendly, Bold..."
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTone())}
                className="max-w-xs"
              />
              <Button variant="outline" size="icon" onClick={addTone}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
