import { useState, useRef, useCallback, ReactNode } from 'react';
import { Upload, Loader2, X, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Input } from './input';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

export interface DropZoneProps {
  onFileDrop: (file: File) => void | Promise<void>;
  onUrlSubmit?: (url: string) => void;
  accept?: string;
  maxSize?: number; // in bytes
  className?: string;
  disabled?: boolean;
  isLoading?: boolean;
  showUrlOption?: boolean;
  children?: ReactNode;
  // Styling variants
  variant?: 'default' | 'compact' | 'minimal';
  // Custom placeholder
  placeholder?: string;
  placeholderIcon?: ReactNode;
}

export const DropZone = ({
  onFileDrop,
  onUrlSubmit,
  accept = 'image/*',
  maxSize = 2 * 1024 * 1024, // 2MB default
  className,
  disabled = false,
  isLoading = false,
  showUrlOption = false,
  children,
  variant = 'default',
  placeholder = 'Drop image here or click to upload',
  placeholderIcon,
}: DropZoneProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [urlValue, setUrlValue] = useState('');
  const [urlPopoverOpen, setUrlPopoverOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file type
    if (accept !== '*') {
      const acceptedTypes = accept.split(',').map(t => t.trim());
      const isValid = acceptedTypes.some(type => {
        if (type.endsWith('/*')) {
          return file.type.startsWith(type.replace('/*', '/'));
        }
        return file.type === type || file.name.toLowerCase().endsWith(type.replace('.', ''));
      });
      if (!isValid) {
        return `Invalid file type. Accepted: ${accept}`;
      }
    }

    // Check file size
    if (file.size > maxSize) {
      const sizeMB = (maxSize / (1024 * 1024)).toFixed(1);
      return `File too large. Maximum size: ${sizeMB}MB`;
    }

    return null;
  };

  const handleFile = useCallback(async (file: File) => {
    const error = validateFile(file);
    if (error) {
      console.error(error);
      return;
    }
    await onFileDrop(file);
  }, [onFileDrop, accept, maxSize]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isLoading) {
      setIsDragging(true);
    }
  }, [disabled, isLoading]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled || isLoading) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await handleFile(files[0]);
    }
  }, [disabled, isLoading, handleFile]);

  const handleClick = useCallback(() => {
    if (!disabled && !isLoading) {
      fileInputRef.current?.click();
    }
  }, [disabled, isLoading]);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleFile(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFile]);

  const handleUrlSubmit = useCallback(() => {
    if (onUrlSubmit && urlValue.trim()) {
      onUrlSubmit(urlValue.trim());
      setUrlValue('');
      setUrlPopoverOpen(false);
    }
  }, [onUrlSubmit, urlValue]);

  const variantStyles = {
    default: 'h-32 border-2 border-dashed rounded-xl gap-2',
    compact: 'h-24 border-2 border-dashed rounded-lg gap-1.5',
    minimal: 'h-16 border border-dashed rounded-lg gap-1',
  };

  const iconSize = {
    default: 'h-6 w-6',
    compact: 'h-5 w-5',
    minimal: 'h-4 w-4',
  };

  const textSize = {
    default: 'text-sm',
    compact: 'text-xs',
    minimal: 'text-xs',
  };

  // If children provided, wrap them with drag-drop functionality
  if (children) {
    return (
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative transition-all',
          isDragging && 'ring-2 ring-primary ring-offset-2 rounded-xl',
          className
        )}
      >
        {children}
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled || isLoading}
        />
        {isDragging && (
          <div className="absolute inset-0 bg-primary/10 backdrop-blur-sm rounded-xl flex items-center justify-center z-10 pointer-events-none">
            <div className="bg-background/90 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Drop to upload</span>
            </div>
          </div>
        )}
        {isLoading && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm rounded-xl flex items-center justify-center z-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || isLoading}
      />
      
      <button
        type="button"
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        disabled={disabled || isLoading}
        className={cn(
          'w-full flex flex-col items-center justify-center text-muted-foreground transition-all',
          variantStyles[variant],
          isDragging 
            ? 'border-primary bg-primary/5 text-primary' 
            : 'border-border hover:border-accent hover:text-accent hover:bg-accent/5',
          (disabled || isLoading) && 'opacity-50 cursor-not-allowed',
          className
        )}
      >
        {isLoading ? (
          <Loader2 className={cn('animate-spin', iconSize[variant])} />
        ) : (
          <>
            {placeholderIcon || <Upload className={iconSize[variant]} />}
            <span className={cn('font-medium', textSize[variant])}>{placeholder}</span>
            {isDragging && (
              <span className="text-[10px] text-primary font-medium mt-1 animate-pulse">
                Release to upload
              </span>
            )}
          </>
        )}
      </button>

      {showUrlOption && onUrlSubmit && (
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 translate-y-full">
          <Popover open={urlPopoverOpen} onOpenChange={setUrlPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1.5"
                disabled={disabled || isLoading}
              >
                <Link2 className="h-3 w-3" />
                Or paste URL
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-3" align="center">
              <div className="space-y-2">
                <label className="text-sm font-medium">Image URL</label>
                <div className="flex gap-2">
                  <Input
                    value={urlValue}
                    onChange={(e) => setUrlValue(e.target.value)}
                    placeholder="https://example.com/image.png"
                    className="h-8 text-sm"
                    onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
                  />
                  <Button size="sm" onClick={handleUrlSubmit} className="h-8">
                    Add
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
};

// Hook for using drop zone logic in custom components
export const useDropZone = ({
  onFileDrop,
  accept = 'image/*',
  maxSize = 2 * 1024 * 1024,
  disabled = false,
  multiple = false,
}: Pick<DropZoneProps, 'onFileDrop' | 'accept' | 'maxSize' | 'disabled'> & { multiple?: boolean }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (accept !== '*') {
      const acceptedTypes = accept.split(',').map(t => t.trim());
      const isValid = acceptedTypes.some(type => {
        if (type.endsWith('/*')) {
          return file.type.startsWith(type.replace('/*', '/'));
        }
        return file.type === type;
      });
      if (!isValid) {
        return `Invalid file type. Accepted: ${accept}`;
      }
    }

    if (file.size > maxSize) {
      const sizeMB = (maxSize / (1024 * 1024)).toFixed(1);
      return `File too large. Maximum size: ${sizeMB}MB`;
    }

    return null;
  };

  const handleFile = useCallback(async (file: File) => {
    const error = validateFile(file);
    if (error) {
      console.error(error);
      return false;
    }
    await onFileDrop(file);
    return true;
  }, [onFileDrop, accept, maxSize]);

  const dragHandlers = {
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) setIsDragging(true);
    },
    onDragLeave: (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    },
    onDrop: async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled) return;

      const files = e.dataTransfer.files;
      if (multiple && files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          await handleFile(files[i]);
        }
      } else if (files.length > 0) {
        await handleFile(files[0]);
      }
    },
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    if (multiple && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        await handleFile(files[i]);
      }
    } else {
      const file = files[0];
      if (file) {
        await handleFile(file);
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return {
    isDragging,
    fileInputRef,
    dragHandlers,
    openFilePicker,
    handleInputChange,
    multiple,
  };
};
