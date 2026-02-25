/**
 * DocumentTypePreview — Rich file type previews for PPTX, DOCX, XLSX, and other doc formats.
 * Shows file-type-specific icons with color coding instead of generic file icons.
 */

import { FileText, FileSpreadsheet, Presentation, File } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocumentTypePreviewProps {
  fileName: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const FILE_TYPE_CONFIG: Record<string, { 
  icon: React.ComponentType<{ className?: string }>; 
  label: string; 
  bgClass: string; 
  textClass: string; 
}> = {
  pdf: { icon: FileText, label: 'PDF', bgClass: 'bg-destructive/10', textClass: 'text-destructive' },
  doc: { icon: FileText, label: 'DOC', bgClass: 'bg-sky-500/10', textClass: 'text-sky-600' },
  docx: { icon: FileText, label: 'DOCX', bgClass: 'bg-sky-500/10', textClass: 'text-sky-600' },
  ppt: { icon: Presentation, label: 'PPT', bgClass: 'bg-orange-500/10', textClass: 'text-orange-600' },
  pptx: { icon: Presentation, label: 'PPTX', bgClass: 'bg-orange-500/10', textClass: 'text-orange-600' },
  xls: { icon: FileSpreadsheet, label: 'XLS', bgClass: 'bg-emerald-500/10', textClass: 'text-emerald-600' },
  xlsx: { icon: FileSpreadsheet, label: 'XLSX', bgClass: 'bg-emerald-500/10', textClass: 'text-emerald-600' },
  csv: { icon: FileSpreadsheet, label: 'CSV', bgClass: 'bg-emerald-500/10', textClass: 'text-emerald-600' },
  txt: { icon: FileText, label: 'TXT', bgClass: 'bg-muted', textClass: 'text-muted-foreground' },
  md: { icon: FileText, label: 'MD', bgClass: 'bg-muted', textClass: 'text-muted-foreground' },
};

const ICON_SIZES = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

const LABEL_SIZES = {
  sm: 'text-[7px]',
  md: 'text-[8px]',
  lg: 'text-[10px]',
};

export function DocumentTypePreview({ fileName, className, size = 'md' }: DocumentTypePreviewProps) {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  const config = FILE_TYPE_CONFIG[ext] || { icon: File, label: ext.toUpperCase() || 'FILE', bgClass: 'bg-muted', textClass: 'text-muted-foreground' };
  const Icon = config.icon;

  return (
    <div className={cn(
      'flex flex-col items-center justify-center gap-1',
      config.bgClass,
      'rounded-lg p-2',
      className
    )}>
      <div className="relative">
        <Icon className={cn(ICON_SIZES[size], config.textClass)} />
        <span className={cn(
          'absolute -bottom-1 -right-2 font-bold px-1 rounded',
          LABEL_SIZES[size],
          'bg-background border shadow-sm',
          config.textClass
        )}>
          {config.label}
        </span>
      </div>
    </div>
  );
}

/**
 * Utility to detect if a filename is a previewable document type
 */
export function isDocumentFile(fileName: string): boolean {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  return ext in FILE_TYPE_CONFIG;
}

/**
 * Returns human-readable accepted format string for a given context
 */
export function getAcceptedFormatsLabel(context: 'image' | 'document' | 'video' | 'all' = 'all'): string {
  switch (context) {
    case 'image': return 'PNG, JPG, WEBP, SVG · Max 10MB';
    case 'document': return 'PDF, DOCX, PPTX, XLSX · Max 20MB';
    case 'video': return 'MP4, WebM, MOV · Max 15MB';
    case 'all': return 'Images, Documents, Videos';
  }
}
