/**
 * LayoutPreviewCards - Visual mini-previews for layout settings
 * Shows content width, section spacing, and header style options with visual examples
 */

import { cn } from '@/lib/utils';

interface LayoutPreviewOption<T extends string> {
  value: T;
  label: string;
  description: string;
}

interface LayoutPreviewCardsProps<T extends string> {
  options: LayoutPreviewOption<T>[];
  value: T;
  onChange: (value: T) => void;
  type: 'contentWidth' | 'sectionSpacing' | 'headerStyle';
}

const ContentWidthPreview = ({ value, isSelected }: { value: string; isSelected: boolean }) => {
  const widthMap: Record<string, string> = {
    default: 'w-3/5',
    wide: 'w-4/5',
    full: 'w-full',
  };

  return (
    <div className="w-full h-12 bg-muted/50 rounded flex items-center justify-center p-1">
      <div className={cn(
        'h-full rounded transition-all',
        widthMap[value] || 'w-3/5',
        isSelected ? 'bg-primary' : 'bg-muted-foreground/30'
      )}>
        {/* Content lines */}
        <div className="h-full flex flex-col justify-center gap-0.5 px-1">
          <div className="h-0.5 bg-background/50 rounded w-4/5" />
          <div className="h-0.5 bg-background/50 rounded w-3/5" />
          <div className="h-0.5 bg-background/50 rounded w-2/3" />
        </div>
      </div>
    </div>
  );
};

const SectionSpacingPreview = ({ value, isSelected }: { value: string; isSelected: boolean }) => {
  const gapMap: Record<string, string> = {
    compact: 'gap-0.5',
    default: 'gap-1',
    spacious: 'gap-2',
  };

  return (
    <div className="w-full h-12 bg-muted/50 rounded flex flex-col items-center justify-center p-1">
      <div className={cn('flex flex-col items-center w-full', gapMap[value] || 'gap-1')}>
        <div className={cn(
          'h-2 w-4/5 rounded transition-colors',
          isSelected ? 'bg-primary' : 'bg-muted-foreground/30'
        )} />
        <div className={cn(
          'h-2 w-4/5 rounded transition-colors',
          isSelected ? 'bg-primary/70' : 'bg-muted-foreground/20'
        )} />
        <div className={cn(
          'h-2 w-4/5 rounded transition-colors',
          isSelected ? 'bg-primary/50' : 'bg-muted-foreground/15'
        )} />
      </div>
    </div>
  );
};

const HeaderStylePreview = ({ value, isSelected }: { value: string; isSelected: boolean }) => {
  return (
    <div className="w-full h-12 bg-muted/50 rounded overflow-hidden">
      {/* Header bar */}
      <div className={cn(
        'h-2.5 w-full flex items-center justify-between px-1 transition-colors',
        value === 'default' && (isSelected ? 'bg-primary' : 'bg-muted-foreground/40'),
        value === 'minimal' && (isSelected ? 'bg-primary/60' : 'bg-muted-foreground/20'),
        value === 'transparent' && 'bg-transparent border-b border-dashed',
        value === 'transparent' && (isSelected ? 'border-primary/50' : 'border-muted-foreground/20')
      )}>
        <div className="h-1 w-3 bg-background/50 rounded" />
        <div className="flex gap-0.5">
          <div className="h-1 w-2 bg-background/50 rounded" />
          <div className="h-1 w-2 bg-background/50 rounded" />
        </div>
      </div>
      {/* Content area */}
      <div className="flex flex-col items-center justify-center h-9 gap-0.5">
        <div className={cn(
          'h-1.5 w-1/2 rounded',
          isSelected ? 'bg-primary/30' : 'bg-muted-foreground/15'
        )} />
        <div className={cn(
          'h-1 w-2/3 rounded',
          isSelected ? 'bg-primary/20' : 'bg-muted-foreground/10'
        )} />
      </div>
    </div>
  );
};

export function LayoutPreviewCards<T extends string>({
  options,
  value,
  onChange,
  type,
}: LayoutPreviewCardsProps<T>) {
  const renderPreview = (optionValue: string, isSelected: boolean) => {
    switch (type) {
      case 'contentWidth':
        return <ContentWidthPreview value={optionValue} isSelected={isSelected} />;
      case 'sectionSpacing':
        return <SectionSpacingPreview value={optionValue} isSelected={isSelected} />;
      case 'headerStyle':
        return <HeaderStylePreview value={optionValue} isSelected={isSelected} />;
      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-3 gap-2">
      {options.map((option) => {
        const isSelected = value === option.value;
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              'p-2 rounded-lg border-2 transition-all text-left flex flex-col gap-2',
              isSelected
                ? 'border-accent bg-accent/10'
                : 'border-border hover:border-accent/50'
            )}
          >
            {renderPreview(option.value, isSelected)}
            <div className="space-y-0.5">
              <span className="text-sm font-medium block">{option.label}</span>
              <span className="text-xs text-muted-foreground line-clamp-1">{option.description}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default LayoutPreviewCards;
