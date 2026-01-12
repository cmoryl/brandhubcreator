import { useState } from 'react';
import { Plus, X, Pencil, Copy, Check, Code, LayoutTemplate } from 'lucide-react';
import DOMPurify from 'dompurify';
import { BrandSignature } from '@/types/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface SignaturesSectionProps {
  signatures: BrandSignature[];
  onSignaturesChange: (signatures: BrandSignature[]) => void;
}

const signatureTemplates = {
  classic: {
    name: 'Classic Professional',
    template: `<table cellpadding="0" cellspacing="0" style="font-family: Arial, sans-serif;">
  <tr>
    <td style="padding-right: 15px; border-right: 2px solid #e94560;">
      <img src="[LOGO_URL]" alt="Logo" width="60" height="60">
    </td>
    <td style="padding-left: 15px;">
      <p style="margin: 0; font-size: 16px; font-weight: bold; color: #1a1a2e;">[NAME]</p>
      <p style="margin: 4px 0; font-size: 14px; color: #666;">[ROLE]</p>
      <p style="margin: 4px 0; font-size: 12px; color: #999;">email@company.com | +1 234 567 890</p>
    </td>
  </tr>
</table>`,
  },
  modern: {
    name: 'Modern Minimal',
    template: `<table cellpadding="0" cellspacing="0" style="font-family: 'Helvetica Neue', sans-serif;">
  <tr>
    <td style="padding-bottom: 12px;">
      <p style="margin: 0; font-size: 18px; font-weight: 600; color: #000;">[NAME]</p>
      <p style="margin: 4px 0 0 0; font-size: 13px; color: #666; text-transform: uppercase; letter-spacing: 1px;">[ROLE]</p>
    </td>
  </tr>
  <tr>
    <td style="border-top: 2px solid #000; padding-top: 12px;">
      <img src="[LOGO_URL]" alt="Logo" width="100" height="auto" style="display: block;">
      <p style="margin: 10px 0 0 0; font-size: 12px; color: #999;">email@company.com | +1 234 567 890</p>
    </td>
  </tr>
</table>`,
  },
  corporate: {
    name: 'Corporate Full',
    template: `<table cellpadding="0" cellspacing="0" style="font-family: Georgia, serif; width: 400px;">
  <tr>
    <td colspan="2" style="padding-bottom: 15px; border-bottom: 1px solid #ddd;">
      <img src="[LOGO_URL]" alt="Company Logo" width="150" height="auto">
    </td>
  </tr>
  <tr>
    <td colspan="2" style="padding: 15px 0;">
      <p style="margin: 0; font-size: 16px; font-weight: bold; color: #333;">[NAME]</p>
      <p style="margin: 5px 0; font-size: 14px; color: #666;">[ROLE]</p>
    </td>
  </tr>
  <tr>
    <td style="font-size: 12px; color: #666; padding-right: 20px;">
      <p style="margin: 2px 0;">📧 email@company.com</p>
      <p style="margin: 2px 0;">📞 +1 234 567 890</p>
    </td>
    <td style="font-size: 12px; color: #666;">
      <p style="margin: 2px 0;">🌐 www.company.com</p>
      <p style="margin: 2px 0;">📍 123 Business St, City</p>
    </td>
  </tr>
</table>`,
  },
  creative: {
    name: 'Creative Bold',
    template: `<table cellpadding="0" cellspacing="0" style="font-family: 'Segoe UI', sans-serif;">
  <tr>
    <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px;">
      <table cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding-right: 15px;">
            <img src="[LOGO_URL]" alt="Logo" width="50" height="50" style="border-radius: 50%; border: 2px solid #fff;">
          </td>
          <td>
            <p style="margin: 0; font-size: 18px; font-weight: bold; color: #fff;">[NAME]</p>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: rgba(255,255,255,0.8);">[ROLE]</p>
          </td>
        </tr>
      </table>
      <p style="margin: 15px 0 0 0; font-size: 12px; color: rgba(255,255,255,0.9);">✉️ email@company.com | 📱 +1 234 567 890</p>
    </td>
  </tr>
</table>`,
  },
  minimal: {
    name: 'Simple Text',
    template: `<div style="font-family: Arial, sans-serif; font-size: 12px; color: #333;">
  <p style="margin: 0; font-weight: bold;">[NAME]</p>
  <p style="margin: 2px 0; color: #666;">[ROLE]</p>
  <p style="margin: 8px 0 0 0; color: #999;">email@company.com | +1 234 567 890</p>
</div>`,
  },
};

const defaultSignatureTemplate = signatureTemplates.classic.template;

export const SignaturesSection = ({ signatures, onSignaturesChange }: SignaturesSectionProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);

  const addSignature = (templateKey: keyof typeof signatureTemplates = 'classic') => {
    const newSignature: BrandSignature = {
      id: crypto.randomUUID(),
      name: 'John Doe',
      role: 'Marketing Director',
      html: signatureTemplates[templateKey].template,
    };
    onSignaturesChange([...signatures, newSignature]);
    setEditingId(newSignature.id);
    setTemplateDialogOpen(false);
  };

  const updateSignature = (id: string, updates: Partial<BrandSignature>) => {
    onSignaturesChange(signatures.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const deleteSignature = (id: string) => {
    onSignaturesChange(signatures.filter(s => s.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const copyHTML = async (html: string, id: string) => {
    await navigator.clipboard.writeText(html);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const renderPreview = (signature: BrandSignature) => {
    const html = signature.html
      .replace('[NAME]', signature.name)
      .replace('[ROLE]', signature.role)
      .replace('[LOGO_URL]', 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60"><rect fill="%23e94560" width="60" height="60" rx="8"/></svg>');
    
    // Sanitize HTML to prevent XSS attacks
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['table', 'tr', 'td', 'th', 'tbody', 'thead', 'p', 'img', 'a', 'strong', 'em', 'b', 'i', 'span', 'div', 'br', 'hr'],
      ALLOWED_ATTR: ['style', 'src', 'alt', 'width', 'height', 'href', 'cellpadding', 'cellspacing', 'border', 'align', 'valign', 'class', 'target', 'rel']
    });
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-semibold text-foreground">Signature Protocol</h2>
          <p className="text-muted-foreground mt-1">Dynamic HTML templates for email signatures</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <LayoutTemplate className="h-4 w-4" />
                Templates
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Choose a Signature Template</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                {Object.entries(signatureTemplates).map(([key, { name, template }]) => (
                  <button
                    key={key}
                    onClick={() => addSignature(key as keyof typeof signatureTemplates)}
                    className="text-left p-4 border border-border rounded-lg hover:border-primary hover:bg-accent/50 transition-colors"
                  >
                    <h4 className="font-medium mb-2">{name}</h4>
                    <div 
                      className="bg-white p-3 rounded text-xs overflow-hidden max-h-24"
                      dangerouslySetInnerHTML={{ 
                        __html: DOMPurify.sanitize(
                          template.replace('[NAME]', 'John Doe').replace('[ROLE]', 'Director').replace('[LOGO_URL]', 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60"><rect fill="%23e94560" width="60" height="60" rx="8"/></svg>'),
                          { ALLOWED_TAGS: ['table', 'tr', 'td', 'th', 'tbody', 'thead', 'p', 'img', 'a', 'strong', 'em', 'b', 'i', 'span', 'div', 'br', 'hr'],
                            ALLOWED_ATTR: ['style', 'src', 'alt', 'width', 'height', 'href', 'cellpadding', 'cellspacing', 'border', 'align', 'valign', 'class', 'target', 'rel', 'colspan'] }
                        ) 
                      }}
                    />
                  </button>
                ))}
              </div>
            </DialogContent>
          </Dialog>
          <Button onClick={() => addSignature('classic')} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Signature
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {signatures.map((signature, index) => (
          <div
            key={signature.id}
            className="group relative bg-card rounded-xl shadow-sm border border-border animate-slide-up overflow-hidden"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {editingId === signature.id ? (
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    value={signature.name}
                    onChange={(e) => updateSignature(signature.id, { name: e.target.value })}
                    placeholder="Full Name"
                  />
                  <Input
                    value={signature.role}
                    onChange={(e) => updateSignature(signature.id, { role: e.target.value })}
                    placeholder="Job Title"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    HTML Template
                  </label>
                  <Textarea
                    value={signature.html}
                    onChange={(e) => updateSignature(signature.id, { html: e.target.value })}
                    placeholder="HTML signature template"
                    className="font-mono text-xs min-h-[200px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    Use [NAME], [ROLE], and [LOGO_URL] as placeholders
                  </p>
                </div>
                <Button size="sm" variant="secondary" onClick={() => setEditingId(null)}>
                  Done
                </Button>
              </div>
            ) : (
              <>
                <div className="p-6 flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1">{signature.name}</h3>
                    <p className="text-sm text-muted-foreground">{signature.role}</p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyHTML(renderPreview(signature), signature.id)}
                      className="gap-2"
                    >
                      {copiedId === signature.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {copiedId === signature.id ? 'Copied!' : 'Copy HTML'}
                    </Button>
                    <button
                      onClick={() => setEditingId(signature.id)}
                      className="p-2 rounded-md hover:bg-secondary transition-colors"
                    >
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => deleteSignature(signature.id)}
                      className="p-2 rounded-md hover:bg-destructive hover:text-destructive-foreground transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="border-t border-border bg-muted/30 p-6">
                  <p className="text-xs text-muted-foreground mb-3">Preview:</p>
                  <div
                    className="bg-white p-4 rounded-lg inline-block"
                    dangerouslySetInnerHTML={{ __html: renderPreview(signature) }}
                  />
                </div>
              </>
            )}
          </div>
        ))}

        {signatures.length === 0 && (
          <button
            onClick={() => addSignature('classic')}
            className="w-full h-32 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-accent hover:text-accent transition-colors"
          >
            <Plus className="h-6 w-6" />
            <span className="text-sm font-medium">Create email signature template</span>
          </button>
        )}
      </div>
    </section>
  );
};
