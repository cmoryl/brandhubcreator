/**
 * BrandIntelligencePdfSection - Comprehensive PDF export for Brand Intelligence data
 * Renders all intelligence fields: summary, market position, audience, advantages,
 * voice profile, recommendations, cultural insights, competitive landscape, knowledge base
 */

import { Brain, Target, Users, TrendingUp, Lightbulb, Globe, BookOpen, Shield, Sparkles, MapPin, MessageCircle, Eye, Search, Bot, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FullBrandIntelligenceData {
  brand_summary: string | null;
  market_position: string | null;
  target_audience: {
    primary: string;
    secondary: string[];
    demographics: string[];
  } | null;
  competitive_advantages: string[];
  brand_voice_profile: {
    tone: string[];
    personality: string[];
    communication_style: string;
  } | null;
  growth_recommendations: {
    priority: 'high' | 'medium' | 'low';
    recommendation: string;
    rationale: string;
  }[];
  cultural_insights: Record<string, unknown> | null;
  competitive_landscape: Record<string, unknown> | null;
  knowledge_entries: Array<{ title?: string; content?: string; category?: string; source?: string }>;
  globallink_recommendations: Record<string, unknown> | null;
  regional_adaptations: Record<string, unknown> | null;
  bias_awareness_profile: Record<string, unknown> | null;
  localization_readiness_score: number | null;
  analysis_count: number;
  last_analyzed_at: string | null;
}

interface BrandIntelligencePdfSectionProps {
  intelligence: FullBrandIntelligenceData;
  theme: 'light' | 'dark';
  visibilityAudit?: any;
}

const themeClasses = {
  light: {
    bg: 'bg-white',
    text: 'text-gray-900',
    textMuted: 'text-gray-600',
    textSubtle: 'text-gray-500',
    border: 'border-gray-200',
    card: 'bg-gray-50',
  },
  dark: {
    bg: 'bg-gray-900',
    text: 'text-white',
    textMuted: 'text-gray-300',
    textSubtle: 'text-gray-400',
    border: 'border-gray-700',
    card: 'bg-gray-800',
  },
};

// Safe array coercion helper
function safeArr<T>(val: unknown): T[] {
  if (Array.isArray(val)) return val as T[];
  return [];
}

function safeStr(val: unknown): string {
  if (typeof val === 'string') return val;
  return '';
}

export const BrandIntelligencePdfSection = ({ intelligence, theme, visibilityAudit }: BrandIntelligencePdfSectionProps) => {
  const t = themeClasses[theme];

  const hasContent = intelligence.brand_summary || intelligence.market_position ||
    (intelligence.competitive_advantages?.length ?? 0) > 0 ||
    (intelligence.growth_recommendations?.length ?? 0) > 0;

  if (!hasContent) return null;

  const culturalInsights = intelligence.cultural_insights as Record<string, unknown> | null;
  const competitiveLandscape = intelligence.competitive_landscape as Record<string, unknown> | null;
  const knowledgeEntries = safeArr<{ title?: string; content?: string; category?: string; source?: string }>(intelligence.knowledge_entries);
  const globalLinkRecs = intelligence.globallink_recommendations as Record<string, unknown> | null;
  const biasProfile = intelligence.bias_awareness_profile as Record<string, unknown> | null;

  return (
    <div id="pdf-section-brief" className={cn("py-6 border-b pdf-page-break-before", t.border)} data-pdf-section>
      {/* Section Header */}
      <div className="pdf-section-header" style={{ marginBottom: '16px' }}>
        <Brain className="h-5 w-5" />
        <h2>Brand Brief & Intelligence</h2>
      </div>

      {/* Analysis Meta */}
      {intelligence.last_analyzed_at && (
        <p className={cn("text-xs mb-4", t.textSubtle)} style={{ fontStyle: 'italic' }}>
          Intelligence based on {intelligence.analysis_count} analysis cycle{intelligence.analysis_count !== 1 ? 's' : ''} · Last analyzed: {new Date(intelligence.last_analyzed_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      )}

      {/* Executive Summary */}
      {intelligence.brand_summary && (
        <div className={cn("p-4 rounded-lg mb-4 pdf-avoid-break", t.card)} data-pdf-section>
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            <h3 className={cn("font-semibold text-sm", t.text)}>Executive Summary</h3>
          </div>
          <p className={cn("text-sm leading-relaxed", t.text)}>{intelligence.brand_summary}</p>
        </div>
      )}

      {/* Market Position & Target Audience */}
      <div className="pdf-grid-2" style={{ marginBottom: '16px' }}>
        {intelligence.market_position && (
          <div className={cn("p-4 rounded-lg pdf-avoid-break", t.card)} data-pdf-section>
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-blue-500" />
              <h3 className={cn("font-semibold text-sm", t.text)}>Market Position</h3>
            </div>
            <p className={cn("text-xs leading-relaxed", t.textMuted)}>{intelligence.market_position}</p>
          </div>
        )}

        {intelligence.target_audience && (
          <div className={cn("p-4 rounded-lg pdf-avoid-break", t.card)} data-pdf-section>
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-green-500" />
              <h3 className={cn("font-semibold text-sm", t.text)}>Target Audience</h3>
            </div>
            <p className={cn("text-xs font-medium mb-1", t.text)}>{intelligence.target_audience.primary}</p>
            {intelligence.target_audience.secondary?.length > 0 && (
              <p className={cn("text-xs mb-1", t.textMuted)}>
                Secondary: {intelligence.target_audience.secondary.join(', ')}
              </p>
            )}
            {intelligence.target_audience.demographics?.length > 0 && (
              <p className={cn("text-xs", t.textMuted)}>
                {intelligence.target_audience.demographics.join(' • ')}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Competitive Advantages */}
      {intelligence.competitive_advantages && intelligence.competitive_advantages.length > 0 && (
        <div className={cn("p-4 rounded-lg mb-4 pdf-avoid-break", t.card)} data-pdf-section>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-purple-500" />
            <h3 className={cn("font-semibold text-sm", t.text)}>Competitive Advantages</h3>
          </div>
          <div className="pdf-grid-2">
            {intelligence.competitive_advantages.map((adv, idx) => (
              <div
                key={idx}
                className={cn("px-3 py-2 rounded-md text-xs font-medium pdf-avoid-break",
                  theme === 'dark' ? 'bg-purple-500/10 text-purple-300' : 'bg-purple-50 text-purple-700'
                )}
              >
                {adv}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Growth Recommendations - show ALL, not sliced */}
      {intelligence.growth_recommendations && intelligence.growth_recommendations.length > 0 && (
        <div className={cn("p-4 rounded-lg mb-4 pdf-avoid-break", t.card)} data-pdf-section>
          <h3 className={cn("font-semibold text-sm mb-3", t.text)}>Strategic Recommendations</h3>
          <div className="space-y-3">
            {intelligence.growth_recommendations.map((rec, idx) => (
              <div
                key={idx}
                className={cn("p-3 rounded-lg pdf-avoid-break",
                  rec.priority === 'high' ? 'border-l-red-500 bg-red-500/5' :
                  rec.priority === 'medium' ? 'border-l-amber-500 bg-amber-500/5' :
                  'border-l-green-500 bg-green-500/5'
                )}
                style={{ borderLeftWidth: '3px', borderLeftStyle: 'solid', borderLeftColor: rec.priority === 'high' ? '#ef4444' : rec.priority === 'medium' ? '#f59e0b' : '#22c55e' }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn(
                    "text-xs font-bold uppercase px-2 py-0.5 rounded",
                    rec.priority === 'high' ? 'bg-red-100 text-red-700' :
                    rec.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                    'bg-green-100 text-green-700'
                  )}>
                    {rec.priority}
                  </span>
                </div>
                <p className={cn("text-sm font-medium mb-1", t.text)}>{rec.recommendation}</p>
                {rec.rationale && (
                  <p className={cn("text-xs", t.textMuted)}>{rec.rationale}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Brand Voice Profile */}
      {intelligence.brand_voice_profile && (
        <div className={cn("p-4 rounded-lg mb-4 pdf-avoid-break", t.card)} data-pdf-section>
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle className="h-4 w-4 text-indigo-500" />
            <h3 className={cn("font-semibold text-sm", t.text)}>Brand Voice Profile</h3>
          </div>
          <div className="pdf-grid-3">
            {intelligence.brand_voice_profile.tone?.length > 0 && (
              <div>
                <p className={cn("text-xs font-medium mb-1", t.textMuted)}>Tone</p>
                <p className={cn("text-sm", t.text)}>{intelligence.brand_voice_profile.tone.join(', ')}</p>
              </div>
            )}
            {intelligence.brand_voice_profile.personality?.length > 0 && (
              <div>
                <p className={cn("text-xs font-medium mb-1", t.textMuted)}>Personality</p>
                <p className={cn("text-sm", t.text)}>{intelligence.brand_voice_profile.personality.join(', ')}</p>
              </div>
            )}
            {intelligence.brand_voice_profile.communication_style && (
              <div>
                <p className={cn("text-xs font-medium mb-1", t.textMuted)}>Communication Style</p>
                <p className={cn("text-sm", t.text)}>{intelligence.brand_voice_profile.communication_style}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cultural Insights */}
      {culturalInsights && Object.keys(culturalInsights).length > 0 && (
        <div className={cn("p-4 rounded-lg mb-4 pdf-avoid-break", t.card)} data-pdf-section>
          <div className="flex items-center gap-2 mb-3">
            <Globe className="h-4 w-4 text-teal-500" />
            <h3 className={cn("font-semibold text-sm", t.text)}>Cultural Insights</h3>
          </div>
          <CulturalInsightsRenderer data={culturalInsights} theme={theme} t={t} />
        </div>
      )}

      {/* Competitive Landscape */}
      {competitiveLandscape && Object.keys(competitiveLandscape).length > 0 && (
        <div className={cn("p-4 rounded-lg mb-4 pdf-avoid-break", t.card)} data-pdf-section>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-orange-500" />
            <h3 className={cn("font-semibold text-sm", t.text)}>Competitive Landscape</h3>
          </div>
          <CompetitiveLandscapeRenderer data={competitiveLandscape} theme={theme} t={t} />
        </div>
      )}

      {/* Localization Readiness */}
      {intelligence.localization_readiness_score !== null && intelligence.localization_readiness_score > 0 && (
        <div className={cn("p-4 rounded-lg mb-4 pdf-avoid-break", t.card)} data-pdf-section>
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-4 w-4 text-cyan-500" />
            <h3 className={cn("font-semibold text-sm", t.text)}>Localization Readiness</h3>
          </div>
          <div className="flex items-center gap-3">
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                border: `3px solid ${intelligence.localization_readiness_score >= 70 ? '#22c55e' : intelligence.localization_readiness_score >= 40 ? '#f59e0b' : '#ef4444'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span className={cn("text-lg font-bold", t.text)}>
                {intelligence.localization_readiness_score}
              </span>
            </div>
            <p className={cn("text-xs", t.textMuted)}>
              {intelligence.localization_readiness_score >= 70
                ? 'Strong localization readiness. Brand is well-positioned for regional expansion.'
                : intelligence.localization_readiness_score >= 40
                ? 'Moderate readiness. Some areas need attention before regional rollout.'
                : 'Low readiness. Significant localization work needed before expansion.'}
            </p>
          </div>
        </div>
      )}

      {/* GlobalLink Recommendations */}
      {globalLinkRecs && Object.keys(globalLinkRecs).length > 0 && (
        <div className={cn("p-4 rounded-lg mb-4 pdf-avoid-break", t.card)} data-pdf-section>
          <div className="flex items-center gap-2 mb-3">
            <Globe className="h-4 w-4 text-blue-500" />
            <h3 className={cn("font-semibold text-sm", t.text)}>GlobalLink Recommendations</h3>
          </div>
          <KeyValueRenderer data={globalLinkRecs} t={t} />
        </div>
      )}

      {/* Bias & Inclusivity Profile */}
      {biasProfile && Object.keys(biasProfile).length > 0 && (
        <div className={cn("p-4 rounded-lg mb-4 pdf-avoid-break", t.card)} data-pdf-section>
          <div className="flex items-center gap-2 mb-3">
            <Shield className="h-4 w-4 text-emerald-500" />
            <h3 className={cn("font-semibold text-sm", t.text)}>Bias & Inclusivity Profile</h3>
          </div>
          <KeyValueRenderer data={biasProfile} t={t} />
        </div>
      )}

      {/* Knowledge Base Entries */}
      {knowledgeEntries.length > 0 && (
        <div className={cn("p-4 rounded-lg mb-4", t.card)} data-pdf-section>
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="h-4 w-4 text-amber-600" />
            <h3 className={cn("font-semibold text-sm", t.text)}>
              Knowledge Base ({knowledgeEntries.length} {knowledgeEntries.length === 1 ? 'entry' : 'entries'})
            </h3>
          </div>
          <div className="space-y-3">
            {knowledgeEntries.slice(0, 12).map((entry, idx) => (
              <div key={idx} className={cn("p-3 rounded-lg border pdf-avoid-break", t.border)} data-pdf-section>
                <div className="flex items-center gap-2 mb-1">
                  {entry.category && (
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded font-medium",
                      theme === 'dark' ? 'bg-amber-500/10 text-amber-300' : 'bg-amber-50 text-amber-700'
                    )}>
                      {entry.category}
                    </span>
                  )}
                  {entry.source && (
                    <span className={cn("text-xs", t.textSubtle)}>via {entry.source}</span>
                  )}
                </div>
                {entry.title && (
                  <p className={cn("text-sm font-medium mb-1", t.text)}>{entry.title}</p>
                )}
                {entry.content && (
                  <p className={cn("text-xs leading-relaxed", t.textMuted)}>
                    {entry.content.length > 300 ? `${entry.content.slice(0, 300)}…` : entry.content}
                  </p>
                )}
              </div>
            ))}
            {knowledgeEntries.length > 12 && (
              <p className={cn("text-xs", t.textSubtle)}>
                + {knowledgeEntries.length - 12} more entries in the knowledge base
              </p>
            )}
          </div>
        </div>
      )}

      {/* Visibility Gap Analysis */}
      {visibilityAudit && visibilityAudit.status === 'completed' && (
        <div className={cn("p-4 rounded-lg mb-4 pdf-page-break-before", t.card)} data-pdf-section>
          <div className="flex items-center gap-2 mb-3">
            <Eye className="h-4 w-4 text-sky-500" />
            <h3 className={cn("font-semibold text-sm", t.text)}>Visibility Gap Analysis</h3>
          </div>

          {/* Scores */}
          <div className="pdf-grid-2 mb-3">
            {[
              { label: 'Overall', score: visibilityAudit.overall_visibility_score, icon: Eye },
              { label: 'Search', score: visibilityAudit.search_visibility_score, icon: Search },
              { label: 'AI Platforms', score: visibilityAudit.ai_platform_score, icon: Bot },
              { label: 'Social/Media', score: visibilityAudit.social_media_score, icon: Share2 },
            ].map(({ label, score, icon: Icon }) => (
              <div key={label} className={cn("flex items-center gap-2 p-2 rounded border pdf-avoid-break", t.border)}>
                <Icon className="h-3.5 w-3.5 flex-shrink-0" style={{ color: score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444' }} />
                <div className="flex-1">
                  <p className={cn("text-xs font-medium", t.text)}>{label}</p>
                  <p className="text-xs" style={{ color: score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444', fontWeight: 700 }}>
                    {score ?? 'N/A'}/100
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Visibility Gaps */}
          {safeArr(visibilityAudit.visibility_gaps).length > 0 && (
            <div className="mb-3">
              <p className={cn("text-xs font-medium mb-2", t.text)}>Critical Gaps</p>
              <div className="space-y-2">
                {safeArr<any>(visibilityAudit.visibility_gaps).slice(0, 8).map((gap: any, idx: number) => (
                  <div key={idx} className={cn("p-2 rounded border pdf-avoid-break", t.border)}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn(
                        "text-xs px-1.5 py-0.5 rounded font-medium",
                        gap.severity === 'critical' ? (theme === 'dark' ? 'bg-red-500/10 text-red-300' : 'bg-red-50 text-red-700') :
                        gap.severity === 'high' ? (theme === 'dark' ? 'bg-amber-500/10 text-amber-300' : 'bg-amber-50 text-amber-700') :
                        (theme === 'dark' ? 'bg-blue-500/10 text-blue-300' : 'bg-blue-50 text-blue-700')
                      )}>
                        {gap.severity}
                      </span>
                      <span className={cn("text-xs font-medium", t.text)}>{gap.title}</span>
                    </div>
                    <p className={cn("text-xs leading-relaxed", t.textMuted)}>{gap.description}</p>
                    {safeArr(gap.action_items).length > 0 && (
                      <ul className="list-disc list-inside mt-1">
                        {safeArr<string>(gap.action_items).slice(0, 3).map((item: string, i: number) => (
                          <li key={i} className={cn("text-xs", t.textSubtle)}>{item}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Recommendations */}
          {safeArr(visibilityAudit.recommendations).length > 0 && (
            <div>
              <p className={cn("text-xs font-medium mb-2", t.text)}>Visibility Recommendations</p>
              <div className="space-y-2">
                {safeArr<any>(visibilityAudit.recommendations).slice(0, 5).map((rec: any, idx: number) => (
                  <div key={idx} className={cn("p-2 rounded border pdf-avoid-break", t.border)}>
                    <p className={cn("text-xs font-medium", t.text)}>#{rec.priority} {rec.title}</p>
                    <p className={cn("text-xs leading-relaxed", t.textMuted)}>{rec.description}</p>
                    <div className="flex gap-2 mt-1">
                      {rec.category && <span className={cn("text-xs", t.textSubtle)}>{rec.category}</span>}
                      {rec.impact && <span className={cn("text-xs", t.textSubtle)}>Impact: {rec.impact}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <p className={cn("text-xs mt-3", t.textSubtle)} style={{ fontStyle: 'italic' }}>
        Intelligence data is AI-generated and should be validated against primary sources.
      </p>
    </div>
  );
};

// Helper: Render cultural insights object
function CulturalInsightsRenderer({ data, theme, t }: { data: Record<string, unknown>; theme: string; t: typeof themeClasses.light }) {
  // Handle various JSONB structures
  const regions = safeArr<Record<string, unknown>>(data.regions || data.regional_insights || data.markets);
  const summary = safeStr(data.summary || data.overview || '');
  const recommendations = safeArr<string>(data.recommendations || data.action_items || []);

  return (
    <div className="space-y-3">
      {summary && <p className={cn("text-xs leading-relaxed", t.textMuted)}>{summary}</p>}
      {regions.length > 0 && (
        <div className="pdf-grid-2">
          {regions.slice(0, 6).map((region, idx) => (
            <div key={idx} className={cn("p-2 rounded border text-xs pdf-avoid-break", t.border)}>
              <p className={cn("font-medium mb-1", t.text)}>
                {safeStr(region.name || region.region || region.market || `Region ${idx + 1}`)}
              </p>
              <p className={cn("leading-relaxed", t.textMuted)}>
                {safeStr(region.insight || region.description || region.analysis || JSON.stringify(region).slice(0, 200))}
              </p>
            </div>
          ))}
        </div>
      )}
      {recommendations.length > 0 && (
        <div>
          <p className={cn("text-xs font-medium mb-1", t.text)}>Recommendations</p>
          <ul className="list-disc list-inside space-y-1">
            {recommendations.map((rec, idx) => (
              <li key={idx} className={cn("text-xs", t.textMuted)}>{typeof rec === 'string' ? rec : JSON.stringify(rec)}</li>
            ))}
          </ul>
        </div>
      )}
      {/* Fallback: render key-value if no structured data matched */}
      {!summary && regions.length === 0 && recommendations.length === 0 && (
        <KeyValueRenderer data={data} t={t} />
      )}
    </div>
  );
}

// Helper: Render competitive landscape
function CompetitiveLandscapeRenderer({ data, theme, t }: { data: Record<string, unknown>; theme: string; t: typeof themeClasses.light }) {
  const competitors = safeArr<Record<string, unknown>>(data.competitors || data.favorite_competitors || data.key_competitors);
  const summary = safeStr(data.summary || data.overview || data.position || '');
  const threats = safeArr<string>(data.threats || data.risks || []);
  const opportunities = safeArr<string>(data.opportunities || []);

  return (
    <div className="space-y-3">
      {summary && <p className={cn("text-xs leading-relaxed mb-2", t.textMuted)}>{summary}</p>}
      {competitors.length > 0 && (
        <div className={cn("rounded-lg overflow-hidden", t.card)}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead>
              <tr className={cn("border-b", t.border)}>
                <th style={{ textAlign: 'left', padding: '8px 10px', fontWeight: 600 }} className={t.text}>Competitor</th>
                <th style={{ textAlign: 'left', padding: '8px 10px', fontWeight: 600 }} className={t.text}>Type</th>
                <th style={{ textAlign: 'left', padding: '8px 10px', fontWeight: 600 }} className={t.text}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {competitors.slice(0, 8).map((comp, idx) => (
                <tr key={idx} className={cn(idx !== competitors.length - 1 ? `border-b ${t.border}` : '')}>
                  <td style={{ padding: '8px 10px' }} className={cn("font-medium", t.text)}>
                    {safeStr(comp.name || comp.competitor || `#${idx + 1}`)}
                  </td>
                  <td style={{ padding: '8px 10px' }} className={t.textMuted}>
                    {safeStr(comp.type || comp.category || '—')}
                  </td>
                  <td style={{ padding: '8px 10px' }} className={t.textMuted}>
                    {safeStr(comp.reason || comp.notes || comp.description || '—')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {(threats.length > 0 || opportunities.length > 0) && (
        <div className="pdf-grid-2">
          {threats.length > 0 && (
            <div>
              <p className={cn("text-xs font-medium mb-1 text-red-600")}>Threats</p>
              <ul className="list-disc list-inside space-y-1">
                {threats.map((item, idx) => (
                  <li key={idx} className={cn("text-xs", t.textMuted)}>{typeof item === 'string' ? item : JSON.stringify(item)}</li>
                ))}
              </ul>
            </div>
          )}
          {opportunities.length > 0 && (
            <div>
              <p className={cn("text-xs font-medium mb-1 text-green-600")}>Opportunities</p>
              <ul className="list-disc list-inside space-y-1">
                {opportunities.map((item, idx) => (
                  <li key={idx} className={cn("text-xs", t.textMuted)}>{typeof item === 'string' ? item : JSON.stringify(item)}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      {!summary && competitors.length === 0 && threats.length === 0 && opportunities.length === 0 && (
        <KeyValueRenderer data={data} t={t} />
      )}
    </div>
  );
}

// Generic key-value renderer for unknown JSONB structures
function KeyValueRenderer({ data, t }: { data: Record<string, unknown>; t: typeof themeClasses.light }) {
  const entries = Object.entries(data).filter(([_, v]) => v !== null && v !== undefined && v !== '');

  if (entries.length === 0) return null;

  return (
    <div className="space-y-2">
      {entries.slice(0, 10).map(([key, value]) => (
        <div key={key} className="pdf-avoid-break">
          <p className={cn("text-xs font-medium capitalize", t.text)}>
            {key.replace(/_/g, ' ')}
          </p>
          <p className={cn("text-xs leading-relaxed", t.textMuted)}>
            {typeof value === 'string'
              ? value
              : Array.isArray(value)
              ? value.map(v => typeof v === 'string' ? v : JSON.stringify(v)).join(', ')
              : JSON.stringify(value, null, 0).slice(0, 300)}
          </p>
        </div>
      ))}
    </div>
  );
}
