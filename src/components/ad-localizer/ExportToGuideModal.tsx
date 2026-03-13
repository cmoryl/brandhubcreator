import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, BookOpen, Package, Calendar, Loader2, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface EntityOption {
  id: string;
  name: string;
  type: 'brand' | 'product' | 'event';
  slug?: string;
}

interface ExportToGuideModalProps {
  open: boolean;
  onClose: () => void;
  onExport: (entity: EntityOption) => Promise<void>;
  market: string;
}

const TYPE_ICONS = {
  brand: BookOpen,
  product: Package,
  event: Calendar,
};

const TYPE_LABELS = {
  brand: 'Brand',
  product: 'Product',
  event: 'Event',
};

export default function ExportToGuideModal({ open, onClose, onExport, market }: ExportToGuideModalProps) {
  const [entities, setEntities] = useState<EntityOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'brand' | 'product' | 'event'>('all');
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setSearch('');
    setExported(null);
    setExporting(false);

    const load = async () => {
      setLoading(true);
      const [brandsRes, productsRes, eventsRes] = await Promise.all([
        supabase.from('brands').select('id, name, slug').order('name').limit(200),
        supabase.from('products').select('id, name, slug').order('name').limit(200),
        supabase.from('events').select('id, name, slug').order('name').limit(200),
      ]);

      const all: EntityOption[] = [
        ...(brandsRes.data || []).map(b => ({ ...b, type: 'brand' as const })),
        ...(productsRes.data || []).map(p => ({ ...p, type: 'product' as const })),
        ...(eventsRes.data || []).map(e => ({ ...e, type: 'event' as const })),
      ];
      setEntities(all);
      setLoading(false);
    };
    load();
  }, [open]);

  const filtered = useMemo(() => {
    return entities.filter(e => {
      if (typeFilter !== 'all' && e.type !== typeFilter) return false;
      if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [entities, search, typeFilter]);

  const handleExport = async (entity: EntityOption) => {
    setExporting(true);
    try {
      await onExport(entity);
      setExported(entity.id);
    } finally {
      setExporting(false);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[70vh] flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-5 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold">Export to Guide</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Add <span className="font-semibold text-primary">{market}</span> localized ad to Image Assets
              </p>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search + Filters */}
          <div className="p-4 border-b border-border space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search brands, products, events..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-muted/50 border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                autoFocus
              />
            </div>
            <div className="flex gap-1.5">
              {(['all', 'brand', 'product', 'event'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                    typeFilter === t
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {t === 'all' ? 'All' : TYPE_LABELS[t] + 's'}
                </button>
              ))}
            </div>
          </div>

          {/* Entity List */}
          <div className="flex-1 overflow-y-auto p-2">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-xs text-muted-foreground">No entities found</p>
              </div>
            ) : (
              <div className="space-y-0.5">
                {filtered.map(entity => {
                  const Icon = TYPE_ICONS[entity.type];
                  const isExported = exported === entity.id;
                  return (
                    <button
                      key={`${entity.type}-${entity.id}`}
                      onClick={() => !isExported && handleExport(entity)}
                      disabled={exporting || isExported}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
                        isExported
                          ? 'bg-green-500/10 border border-green-500/20'
                          : 'hover:bg-muted/60 disabled:opacity-50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        entity.type === 'brand' ? 'bg-primary/10 text-primary' :
                        entity.type === 'product' ? 'bg-blue-500/10 text-blue-500' :
                        'bg-amber-500/10 text-amber-500'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">{entity.name}</p>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{TYPE_LABELS[entity.type]}</p>
                      </div>
                      {isExported ? (
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      ) : exporting ? (
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground flex-shrink-0" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}