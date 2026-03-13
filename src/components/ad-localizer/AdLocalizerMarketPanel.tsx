import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Globe, Loader2, MessageSquare, ShieldCheck, Save, Check, AlertTriangle, 
  Hash, Sparkles, ChevronDown, ChevronUp, BookOpen
} from 'lucide-react';
import type { MarketResult, BrandContext } from '@/hooks/useAdLocalizer';

interface AdLocalizerMarketPanelProps {
  result: MarketResult;
  brandContext: BrandContext | null;
  onGenerateCaption: (market: string) => void;
  onRunCompliance: (market: string) => void;
  onSaveAsset: (market: string) => void;
  onExportToGuide: (market: string) => void;
}

export default function AdLocalizerMarketPanel({
  result,
  brandContext,
  onGenerateCaption,
  onRunCompliance,
  onSaveAsset,
  onExportToGuide,
}: AdLocalizerMarketPanelProps) {
  const [expanded, setExpanded] = useState(false);

  if (!result.image && !result.culturalInsights) return null;

  const hasActions = !!brandContext;
  const hasAnyData = result.culturalInsights || result.caption || result.compliance;

  return (
    <div className="border-t border-border bg-muted/20">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-2.5 hover:bg-muted/40 transition-colors"
      >
        <div className="flex items-center gap-2">
          {result.culturalInsights && <Globe className="w-3 h-3 text-primary" />}
          {result.compliance && (
            <ShieldCheck className={`w-3 h-3 ${result.compliance.score >= 80 ? 'text-green-500' : result.compliance.score >= 60 ? 'text-yellow-500' : 'text-destructive'}`} />
          )}
          {result.caption && <MessageSquare className="w-3 h-3 text-blue-500" />}
          {result.saved && <Check className="w-3 h-3 text-green-500" />}
          <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
            {hasAnyData ? 'Intelligence' : 'Actions'}
          </span>
        </div>
        {expanded ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
      </button>

      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="px-3 pb-3 space-y-3"
        >
          {/* GlobalLink Cultural Insights */}
          {result.culturalInsights && (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <Globe className="w-3 h-3 text-primary" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-primary">GlobalLink</span>
              </div>
              {result.culturalInsights.color_notes && (
                <p className="text-[9px] text-muted-foreground line-clamp-2">
                  <span className="font-semibold text-foreground">Colors:</span> {result.culturalInsights.color_notes}
                </p>
              )}
              {result.culturalInsights.imagery_notes && (
                <p className="text-[9px] text-muted-foreground line-clamp-2">
                  <span className="font-semibold text-foreground">Imagery:</span> {result.culturalInsights.imagery_notes}
                </p>
              )}
              {result.culturalInsights.taboos && (
                <p className="text-[9px] text-muted-foreground line-clamp-2">
                  <span className="font-semibold text-foreground">Avoid:</span> {result.culturalInsights.taboos}
                </p>
              )}
            </div>
          )}
          {result.insightsLoading && (
            <div className="flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin text-primary" />
              <span className="text-[9px] text-muted-foreground">Loading GlobalLink insights...</span>
            </div>
          )}

          {/* Compliance Score */}
          {result.compliance && (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className={`w-3 h-3 ${result.compliance.score >= 80 ? 'text-green-500' : result.compliance.score >= 60 ? 'text-yellow-500' : 'text-destructive'}`} />
                <span className="text-[9px] font-bold uppercase tracking-widest text-foreground">
                  Compliance: {result.compliance.score}%
                </span>
              </div>
              {result.compliance.issues.length > 0 && (
                <div className="space-y-0.5">
                  {result.compliance.issues.slice(0, 3).map((issue, i) => (
                    <p key={i} className="text-[9px] text-muted-foreground flex items-start gap-1">
                      <AlertTriangle className="w-2.5 h-2.5 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-1">{issue}</span>
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Generated Caption */}
          {result.caption && (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <MessageSquare className="w-3 h-3 text-blue-500" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-blue-500">Caption</span>
              </div>
              <p className="text-[9px] text-foreground line-clamp-3">{result.caption.caption}</p>
              {result.caption.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {result.caption.hashtags.slice(0, 5).map((tag, i) => (
                    <span key={i} className="text-[8px] text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                      {tag.startsWith('#') ? tag : `#${tag}`}
                    </span>
                  ))}
                </div>
              )}
              <p className="text-[8px] text-muted-foreground">CTA: {result.caption.cta}</p>
            </div>
          )}

          {/* Action Buttons */}
          {hasActions && result.image && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {!result.compliance && (
                <button
                  onClick={() => onRunCompliance(result.market)}
                  disabled={result.complianceLoading}
                  className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted hover:bg-muted/80 text-[8px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                >
                  {result.complianceLoading ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <ShieldCheck className="w-2.5 h-2.5" />}
                  Compliance
                </button>
              )}
              {!result.caption && (
                <button
                  onClick={() => onGenerateCaption(result.market)}
                  disabled={result.captionLoading}
                  className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted hover:bg-muted/80 text-[8px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                >
                  {result.captionLoading ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Sparkles className="w-2.5 h-2.5" />}
                  Caption
                </button>
              )}
              {!result.saved && (
                <button
                  onClick={() => onSaveAsset(result.market)}
                  className="flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 hover:bg-primary/20 text-[8px] font-bold uppercase tracking-wider text-primary transition-colors"
                >
                  <Save className="w-2.5 h-2.5" />
                  Save
                </button>
              )}
              {result.saved && (
                <span className="flex items-center gap-1 px-2 py-1 text-[8px] font-bold uppercase tracking-wider text-green-600">
                  <Check className="w-2.5 h-2.5" />
                  Saved
                </span>
              )}
            </div>
          )}

          {!hasActions && result.image && (
            <p className="text-[8px] text-muted-foreground/60 italic">Select a brand for compliance, captions & saving</p>
          )}
        </motion.div>
      )}
    </div>
  );
}
