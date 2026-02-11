/**
 * Shared PDF Styling Configuration
 * Ensures consistent styling across all PDF exports
 */

// Typography - consistent font stack across all PDFs
export const PDF_FONTS = {
  primary: "'Segoe UI', system-ui, -apple-system, sans-serif",
  mono: "'SF Mono', 'Monaco', 'Consolas', monospace",
};

// Color palette for PDF exports - matches application design tokens
export const PDF_COLORS = {
  // Text colors
  text: {
    primary: '#111827',    // gray-900
    secondary: '#374151',  // gray-700
    muted: '#6b7280',      // gray-500
    subtle: '#9ca3af',     // gray-400
  },
  // Background colors
  background: {
    white: '#ffffff',
    light: '#f9fafb',      // gray-50
    muted: '#f3f4f6',      // gray-100
    dark: '#111827',       // gray-900
  },
  // Border colors
  border: {
    light: '#e5e7eb',      // gray-200
    lighter: '#f3f4f6',    // gray-100
  },
  // Status/accent colors
  accent: {
    primary: '#3b82f6',    // blue-500
    secondary: '#8b5cf6',  // violet-500
    success: '#22c55e',    // green-500
    warning: '#eab308',    // yellow-500
    danger: '#ef4444',     // red-500
    orange: '#f97316',     // orange-500
  },
  // Entity type colors (matching application)
  entity: {
    brand: '#14b8a6',      // teal-500
    product: '#139cd8',    // custom light blue
    event: '#a855f7',      // purple-500
  },
};

// Spacing constants (in px for inline styles)
export const PDF_SPACING = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  '2xl': '24px',
  '3xl': '32px',
  '4xl': '40px',
};

// Typography sizes
export const PDF_TYPOGRAPHY = {
  title: { size: '32px', weight: '700', lineHeight: '1.2' },
  h1: { size: '28px', weight: '700', lineHeight: '1.3' },
  h2: { size: '24px', weight: '600', lineHeight: '1.4' },
  h3: { size: '18px', weight: '600', lineHeight: '1.4' },
  h4: { size: '16px', weight: '600', lineHeight: '1.5' },
  body: { size: '14px', weight: '400', lineHeight: '1.6' },
  small: { size: '13px', weight: '400', lineHeight: '1.5' },
  caption: { size: '12px', weight: '400', lineHeight: '1.5' },
  tiny: { size: '11px', weight: '400', lineHeight: '1.4' },
};

// Common html2pdf options for consistency
export const PDF_HTML2PDF_BASE_OPTIONS = {
  image: { type: 'jpeg' as const, quality: 0.95 },
  html2canvas: {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    logging: false,
    backgroundColor: '#ffffff',
  },
  jsPDF: {
    compress: true,
  },
  pagebreak: {
    mode: ['avoid-all', 'css'],
  },
};

// Paper sizes with margins
export const PDF_PAPER_CONFIGS = {
  a4: {
    width: '210mm',
    height: '297mm',
    margins: [10, 10, 10, 10] as [number, number, number, number],
    jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
  },
  letter: {
    width: '8.5in',
    height: '11in',
    margins: [0.5, 0.5, 0.5, 0.5] as [number, number, number, number],
    jsPDF: { unit: 'in' as const, format: 'letter' as const, orientation: 'portrait' as const },
  },
};

// Helper to create consistent container styles for PDF rendering
// IMPORTANT: html2canvas requires elements to be fully visible and in the document flow.
// We use a full-screen overlay approach so the content is rendered on-screen during capture.
export const getPdfContainerStyles = (paperSize: 'a4' | 'letter' = 'a4'): Partial<CSSStyleDeclaration> => ({
  position: 'fixed',
  top: '0',
  left: '0',
  width: PDF_PAPER_CONFIGS[paperSize].width,
  zIndex: '99999',
  opacity: '0',
  pointerEvents: 'none',
  overflow: 'visible',
  background: '#ffffff',
  color: '#111827',
  colorScheme: 'light',
});

// Apply container styles to an element
export const applyPdfContainerStyles = (element: HTMLElement, paperSize: 'a4' | 'letter' = 'a4'): void => {
  const styles = getPdfContainerStyles(paperSize);
  Object.assign(element.style, styles);
  // Force light mode to prevent dark theme CSS from cascading into PDF content
  element.setAttribute('data-theme', 'light');
  element.classList.remove('dark');
  element.classList.add('light');
};

// Helper to get score color (used across reports)
export const getScoreColor = (score: number): string => {
  if (score >= 80) return PDF_COLORS.accent.success;
  if (score >= 60) return PDF_COLORS.accent.warning;
  if (score >= 40) return PDF_COLORS.accent.orange;
  return PDF_COLORS.accent.danger;
};

// Common section header styles
export const getSectionHeaderStyles = (): string => `
  font-size: ${PDF_TYPOGRAPHY.h2.size};
  font-weight: ${PDF_TYPOGRAPHY.h2.weight};
  color: ${PDF_COLORS.text.primary};
  margin-bottom: ${PDF_SPACING.xl};
  padding-bottom: ${PDF_SPACING.md};
  border-bottom: 2px solid ${PDF_COLORS.border.light};
`;

// Common card styles
export const getCardStyles = (variant: 'default' | 'success' | 'warning' | 'danger' = 'default'): string => {
  const bgColors = {
    default: PDF_COLORS.background.light,
    success: '#f0fdf4', // green-50
    warning: '#fef3c7', // amber-100
    danger: '#fef2f2', // red-50
  };
  
  return `
    background: ${bgColors[variant]};
    padding: ${PDF_SPACING.xl};
    border-radius: 12px;
  `;
};

// Common table styles
export const getTableStyles = (): { table: string; th: string; td: string } => ({
  table: `
    width: 100%;
    border-collapse: collapse;
    font-size: ${PDF_TYPOGRAPHY.small.size};
  `,
  th: `
    text-align: left;
    padding: ${PDF_SPACING.md};
    border-bottom: 2px solid ${PDF_COLORS.border.light};
    background: ${PDF_COLORS.background.light};
  `,
  td: `
    padding: ${PDF_SPACING.md};
    border-bottom: 1px solid ${PDF_COLORS.border.lighter};
  `,
});

// Badge/pill styles
export const getBadgeStyles = (color: string, bgColor: string): string => `
  display: inline-block;
  padding: 2px 10px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 9999px;
  background-color: ${bgColor};
  color: ${color};
`;

// Footer styles
export const getFooterStyles = (): string => `
  margin-top: ${PDF_SPACING['4xl']};
  padding-top: ${PDF_SPACING.lg};
  border-top: 1px solid ${PDF_COLORS.border.light};
  text-align: center;
`;

// Generate consistent footer HTML
export const generatePdfFooter = (generatedDate?: string): string => {
  const date = generatedDate || new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  return `
    <div style="${getFooterStyles()}">
      <p style="font-size: ${PDF_TYPOGRAPHY.tiny.size}; color: ${PDF_COLORS.text.subtle}; margin: 0;">
        Generated by BrandHub • ${date}
      </p>
    </div>
  `;
};

// Escape HTML for safe rendering
export const escapeHtml = (unsafe: string): string => {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

// Format date consistently
export const formatPdfDate = (date?: Date | string): string => {
  const d = date ? new Date(date) : new Date();
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};
