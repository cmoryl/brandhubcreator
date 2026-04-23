/**
 * IndustrySelector
 *
 * Compact input for choosing an industry vertical. Drives smart layout
 * recommendations and prefilled copy blocks for ebrochures, case studies
 * and other marketing collateral.
 */
import { Briefcase, Sparkles, X } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { industries, type IndustryId } from '@/lib/industrySuggestions';

interface IndustrySelectorProps {
  value: IndustryId | null;
  onChange: (id: IndustryId | null) => void;
  className?: string;
}

export const IndustrySelector = ({ value, onChange, className }: IndustrySelectorProps) => {
  const selected = industries.find((i) => i.id === value);

  return (
    <div className={className}>
      <div className="flex items-end gap-2">
        <div className="flex-1 min-w-0 space-y-1.5">
          <Label
            htmlFor="industry-selector"
            className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
          >
            <Briefcase className="h-3 w-3" />
            Industry
          </Label>
          <Select
            value={value ?? ''}
            onValueChange={(v) => onChange((v as IndustryId) || null)}
          >
            <SelectTrigger id="industry-selector" className="h-9 text-sm">
              <SelectValue placeholder="Select your industry for smart suggestions" />
            </SelectTrigger>
            <SelectContent className="max-h-80">
              {industries.map((i) => (
                <SelectItem key={i.id} value={i.id}>
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium">{i.label}</span>
                    <span className="text-[11px] text-muted-foreground">{i.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {value && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-9 shrink-0 px-2 text-muted-foreground"
            onClick={() => onChange(null)}
            aria-label="Clear industry"
            title="Clear industry"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
      {selected && (
        <p className="mt-1.5 flex items-center gap-1 text-[11px] text-primary">
          <Sparkles className="h-3 w-3" />
          Suggesting layouts and copy tailored for {selected.label}
        </p>
      )}
    </div>
  );
};

export default IndustrySelector;
