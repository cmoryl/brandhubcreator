import { useState } from 'react';
import { Plus, X, Pencil, ExternalLink, BarChart3, TrendingUp, GitCompare, Settings } from 'lucide-react';
import { BrandSocialProfile } from '@/types/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SectionHeader } from './SectionHeader';
import { safeUUID } from '@/lib/safeUUID';
import { useSocialMetrics } from '@/hooks/useSocialMetrics';
import { SocialMetricsEditor } from './SocialMetricsEditor';
import { SocialMetricsSummary } from './SocialMetricsSummary';
import { SocialMetricsComparison } from './SocialMetricsComparison';
import { SocialMetricsOnboarding } from './SocialMetricsOnboarding';
import { SocialMetricsDetail } from './SocialMetricsDetail';
import { SocialCredentialsManager } from './SocialCredentialsManager';
import { cn } from '@/lib/utils';

interface SocialSectionProps {
  social: BrandSocialProfile[];
  onSocialChange?: (social: BrandSocialProfile[]) => void;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
  entityId?: string;
  entityType?: 'brand' | 'product' | 'event';
  organizationId?: string | null;
  entityName?: string;
}

const platformOptions = [
  { name: 'LinkedIn', color: '#0A66C2' },
  { name: 'X (Twitter)', color: '#000000' },
  { name: 'Instagram', color: '#E4405F' },
  { name: 'Facebook', color: '#1877F2' },
  { name: 'YouTube', color: '#FF0000' },
  { name: 'TikTok', color: '#000000' },
  { name: 'Pinterest', color: '#BD081C' },
  { name: 'GitHub', color: '#181717' },
  { name: 'Dribbble', color: '#EA4C89' },
  { name: 'Behance', color: '#1769FF' },
  { name: 'Threads', color: '#000000' },
];

export const SocialSection = ({ 
  social, 
  onSocialChange, 
  customSubtitle, 
  onSubtitleChange,
  entityId,
  entityType = 'brand',
  organizationId,
  entityName
}: SocialSectionProps) => {
  const canEdit = Boolean(onSocialChange);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isHeaderEditing, setIsHeaderEditing] = useState(false);
  const [metricsEditorOpen, setMetricsEditorOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [showMetrics, setShowMetrics] = useState(false);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [expandedPlatform, setExpandedPlatform] = useState<string | null>(null);
  const [credentialsOpen, setCredentialsOpen] = useState(false);

  // Social metrics hook - only active if entityId is provided
  const {
    snapshots,
    aggregated,
    isLoading: metricsLoading,
    isSaving,
    saveSnapshot
  } = useSocialMetrics({
    entityId: entityId || '',
    entityType,
    organizationId
  });

  // Find existing metrics for a platform
  const getMetricsForPlatform = (platform: string) => {
    return snapshots.find(s => s.platform === platform);
  };

  const addProfile = () => {
    if (!onSocialChange) return;
    const newProfile: BrandSocialProfile = {
      id: safeUUID(),
      platform: 'LinkedIn',
      handle: '@yourbrand',
      url: 'https://linkedin.com/company/yourbrand',
      color: '#0A66C2',
    };
    onSocialChange([...social, newProfile]);
    setEditingId(newProfile.id);
  };

  const updateProfile = (id: string, updates: Partial<BrandSocialProfile>) => {
    if (!onSocialChange) return;
    onSocialChange(social.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const deleteProfile = (id: string) => {
    if (!onSocialChange) return;
    onSocialChange(social.filter(s => s.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const handlePlatformChange = (id: string, platform: string) => {
    const platformData = platformOptions.find(p => p.name === platform);
    updateProfile(id, { platform, color: platformData?.color || '#000000' });
  };

  const openMetricsEditor = (platform: string) => {
    setSelectedPlatform(platform);
    setMetricsEditorOpen(true);
  };

  return (
    <section className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <SectionHeader
            title="Social Registry"
            defaultSubtitle="Official social handles and URLs"
            customSubtitle={customSubtitle}
            onSubtitleChange={canEdit ? onSubtitleChange : undefined}
            isEditing={isHeaderEditing}
            onEditToggle={() => setIsHeaderEditing(!isHeaderEditing)}
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {canEdit && organizationId && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setCredentialsOpen(true)}
              title="Configure API credentials for automated tracking"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">API Keys</span>
            </Button>
          )}
          {entityId && snapshots.length > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={() => setComparisonOpen(true)}
            >
              <GitCompare className="h-4 w-4" />
              <span className="hidden sm:inline">Compare</span>
            </Button>
          )}
          {canEdit && entityId && social.length > 0 && (
            <Button 
              variant={showMetrics ? "secondary" : "outline"} 
              size="sm" 
              className="gap-2"
              onClick={() => setShowMetrics(!showMetrics)}
            >
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Metrics</span>
            </Button>
          )}
          {canEdit && (
            <Button onClick={addProfile} size="sm" className="gap-2 w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              Add Profile
            </Button>
          )}
        </div>
      </div>

      {/* Metrics Summary or Onboarding */}
      {showMetrics && entityId && (
        snapshots.length > 0 ? (
          <SocialMetricsSummary 
            aggregated={aggregated} 
            snapshots={snapshots}
            isLoading={metricsLoading}
          />
        ) : (
          <SocialMetricsOnboarding 
            onAddMetrics={() => {
              if (social.length > 0) {
                setSelectedPlatform(social[0].platform);
                setMetricsEditorOpen(true);
              }
            }}
            platformCount={social.length}
          />
        )
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {social.map((profile, index) => {
          const hasMetrics = getMetricsForPlatform(profile.platform);
          
          return (
            <div
              key={profile.id}
              className="group relative bg-card rounded-xl p-4 shadow-sm border border-border animate-scale-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {canEdit && editingId === profile.id ? (
                <div className="space-y-3">
                  <Select
                    value={profile.platform}
                    onValueChange={(platform) => handlePlatformChange(profile.id, platform)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Platform" />
                    </SelectTrigger>
                    <SelectContent>
                      {platformOptions.map(p => (
                        <SelectItem key={p.name} value={p.name}>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                            {p.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={profile.handle}
                    onChange={(e) => updateProfile(profile.id, { handle: e.target.value })}
                    placeholder="@handle"
                  />
                  <Input
                    value={profile.url}
                    onChange={(e) => updateProfile(profile.id, { url: e.target.value })}
                    placeholder="Profile URL"
                  />
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={profile.color}
                      onChange={(e) => updateProfile(profile.id, { color: e.target.value })}
                      className="w-12 h-8 p-1"
                    />
                    <Button size="sm" variant="secondary" onClick={() => setEditingId(null)} className="flex-1">
                      Done
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: profile.color }}
                  >
                    {profile.platform.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-foreground">{profile.platform}</h3>
                      {hasMetrics && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-600 text-[10px] font-medium">
                          <TrendingUp className="h-2.5 w-2.5" />
                          Tracked
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{profile.handle}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <a
                        href={profile.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-accent hover:underline inline-flex items-center gap-1"
                      >
                        Visit <ExternalLink className="h-3 w-3" />
                      </a>
                      {canEdit && entityId && (
                        <button
                          onClick={() => openMetricsEditor(profile.platform)}
                          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
                        >
                          <BarChart3 className="h-3 w-3" />
                       {hasMetrics ? 'Update' : 'Add'} metrics
                        </button>
                      )}
                    </div>
                    {/* Expandable metrics detail */}
                    {hasMetrics && (
                      <SocialMetricsDetail
                        snapshot={hasMetrics}
                        expanded={expandedPlatform === profile.platform}
                        onToggle={() => setExpandedPlatform(
                          expandedPlatform === profile.platform ? null : profile.platform
                        )}
                      />
                    )}
                  </div>
                  {canEdit && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setEditingId(profile.id)}
                        className="p-1.5 rounded-md hover:bg-secondary transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => deleteProfile(profile.id)}
                        className="p-1.5 rounded-md hover:bg-destructive hover:text-destructive-foreground transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {social.length === 0 && canEdit && (
          <button
            onClick={addProfile}
            className="h-32 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-accent hover:text-accent transition-colors"
          >
            <Plus className="h-6 w-6" />
            <span className="text-sm font-medium">Add social profile</span>
          </button>
        )}
      </div>

      {/* Metrics Editor Modal */}
      {selectedPlatform && (
        <SocialMetricsEditor
          open={metricsEditorOpen}
          onOpenChange={setMetricsEditorOpen}
          platform={selectedPlatform}
          existingData={getMetricsForPlatform(selectedPlatform) || undefined}
          onSave={saveSnapshot}
          isSaving={isSaving}
          entityName={entityName}
          entityType={entityType}
        />
      )}

      {/* Comparison Modal */}
      <SocialMetricsComparison
        open={comparisonOpen}
        onOpenChange={setComparisonOpen}
        snapshots={snapshots}
      />

      {/* Credentials Manager */}
      {organizationId && (
        <SocialCredentialsManager
          open={credentialsOpen}
          onOpenChange={setCredentialsOpen}
          organizationId={organizationId}
        />
      )}
    </section>
  );
};
