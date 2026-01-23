import { useState, useEffect, useRef, forwardRef } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  debounceMs?: number;
}

export const SearchInput = forwardRef<HTMLDivElement, SearchInputProps>(
  function SearchInput(
    {
      value,
      onChange,
      placeholder = 'Search...',
      className,
      autoFocus = false,
      debounceMs = 300,
    },
    ref
  ) {
    const [localValue, setLocalValue] = useState(value);
    const inputRef = useRef<HTMLInputElement>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
      setLocalValue(value);
    }, [value]);

    useEffect(() => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        onChange(localValue);
      }, debounceMs);

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, [localValue, debounceMs, onChange]);

    const handleClear = () => {
      setLocalValue('');
      onChange('');
      inputRef.current?.focus();
    };

    return (
      <div ref={ref} className={cn('relative', className)}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          type="text"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          placeholder={placeholder}
          className="pl-9 pr-9"
          autoFocus={autoFocus}
        />
        {localValue && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
            onClick={handleClear}
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Clear search</span>
          </Button>
        )}
      </div>
    );
  }
);
