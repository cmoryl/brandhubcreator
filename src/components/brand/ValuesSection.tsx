import { useState } from 'react';
import { Plus, X, Pencil, Heart, Star, Shield, Zap, Target, Users, Lightbulb, Award, Compass, Leaf } from 'lucide-react';
import { BrandValue } from '@/types/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ValuesSectionProps {
  values: BrandValue[];
  onValuesChange: (values: BrandValue[]) => void;
}

const iconOptions = [
  { name: 'heart', Icon: Heart },
  { name: 'star', Icon: Star },
  { name: 'shield', Icon: Shield },
  { name: 'zap', Icon: Zap },
  { name: 'target', Icon: Target },
  { name: 'users', Icon: Users },
  { name: 'lightbulb', Icon: Lightbulb },
  { name: 'award', Icon: Award },
  { name: 'compass', Icon: Compass },
  { name: 'leaf', Icon: Leaf },
];

const getIconComponent = (iconName: string) => {
  const option = iconOptions.find(o => o.name === iconName);
  return option?.Icon || Heart;
};

export const ValuesSection = ({ values, onValuesChange }: ValuesSectionProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);

  const addValue = () => {
    const newValue: BrandValue = {
      id: crypto.randomUUID(),
      text: 'New Value',
      description: 'Describe what this value means to your organization',
      icon: 'heart',
    };
    onValuesChange([...values, newValue]);
    setEditingId(newValue.id);
  };

  const updateValue = (id: string, updates: Partial<BrandValue>) => {
    onValuesChange(values.map(v => v.id === id ? { ...v, ...updates } : v));
  };

  const deleteValue = (id: string) => {
    onValuesChange(values.filter(v => v.id !== id));
    if (editingId === id) setEditingId(null);
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-semibold text-foreground">Philosophical Pillars</h2>
          <p className="text-muted-foreground mt-1">Define your organization's core values and ethical framework</p>
        </div>
        <Button onClick={addValue} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Value
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {values.map((value, index) => {
          const IconComponent = getIconComponent(value.icon);
          return (
            <div
              key={value.id}
              className="group relative bg-card rounded-xl p-6 shadow-sm border border-border animate-scale-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {editingId === value.id ? (
                <div className="space-y-4">
                  <Select
                    value={value.icon}
                    onValueChange={(icon) => updateValue(value.id, { icon })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select icon" />
                    </SelectTrigger>
                    <SelectContent>
                      {iconOptions.map(({ name, Icon }) => (
                        <SelectItem key={name} value={name}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            <span className="capitalize">{name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={value.text}
                    onChange={(e) => updateValue(value.id, { text: e.target.value })}
                    placeholder="Value name"
                  />
                  <Textarea
                    value={value.description}
                    onChange={(e) => updateValue(value.id, { description: e.target.value })}
                    placeholder="Description"
                    className="min-h-[80px] resize-none"
                  />
                  <Button size="sm" variant="secondary" onClick={() => setEditingId(null)} className="w-full">
                    Done
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-accent/10 rounded-xl">
                      <IconComponent className="h-6 w-6 text-accent" />
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setEditingId(value.id)}
                        className="p-1.5 rounded-md hover:bg-secondary transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => deleteValue(value.id)}
                        className="p-1.5 rounded-md hover:bg-destructive hover:text-destructive-foreground transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{value.text}</h3>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </>
              )}
            </div>
          );
        })}

        {values.length === 0 && (
          <button
            onClick={addValue}
            className="h-48 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-accent hover:text-accent transition-colors"
          >
            <Plus className="h-8 w-8" />
            <span className="text-sm font-medium">Add your first value</span>
          </button>
        )}
      </div>
    </section>
  );
};
