import { useRef, useState } from "react";
import { HexColorPicker } from "react-colorful";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Props {
  value: string;
  onChange: (hex: string) => void;
  /** Optional brand palette suggestions (hex). */
  palette?: string[];
}

export const ColorChip = ({ value, onChange, palette }: Props) => {
  const [open, setOpen] = useState(false);
  const draft = useRef(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Pick color"
          className="h-7 w-7 rounded-md border border-border shadow-sm shrink-0"
          style={{ background: value }}
        />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3 space-y-3" align="start">
        <HexColorPicker
          color={value}
          onChange={(c) => { draft.current = c; onChange(c); }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-2 py-1 text-xs font-mono rounded border border-input bg-background"
        />
        {palette && palette.length > 0 && (
          <div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5">
              Brand palette
            </div>
            <div className="grid grid-cols-8 gap-1">
              {palette.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => onChange(hex)}
                  title={hex}
                  className="h-5 w-5 rounded border border-border hover:scale-110 transition-transform"
                  style={{ background: hex }}
                />
              ))}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
