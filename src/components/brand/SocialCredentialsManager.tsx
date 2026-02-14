/**
 * SocialCredentialsManager - Admin UI for managing social platform API credentials
 */
import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Key, Plus, Trash2, RefreshCw, CheckCircle2, AlertCircle, Clock, Settings } from 'lucide-react';

interface SocialCredentialsManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
}

interface PlatformCredential {
  id: string;
  platform: string;
  credential_type: string;
  is_active: boolean;
  last_sync_at: string | null;
  sync_status: string | null;
  sync_error: string | null;
  sync_frequency: string;
  account_id: string | null;
  account_name: string | null;
  created_at: string;
}

const PLATFORM_CREDENTIAL_FIELDS: Record<string, { label: string; fields: { key: string; label: string; type: string; placeholder: string }[] }> = {
  'Instagram': {
    label: 'Instagram (Meta Graph API)',
    fields: [
      { key: 'access_token', label: 'Access Token', type: 'password', placeholder: 'Long-lived access token from Meta Developer Portal' },
    ],
  },
  'Facebook': {
    label: 'Facebook (Meta Graph API)',
    fields: [
      { key: 'access_token', label: 'Page Access Token', type: 'password', placeholder: 'Page access token from Meta Developer Portal' },
    ],
  },
  'X (Twitter)': {
    label: 'X / Twitter (API v2)',
    fields: [
      { key: 'bearer_token', label: 'Bearer Token', type: 'password', placeholder: 'Bearer token from X Developer Portal' },
    ],
  },
  'LinkedIn': {
    label: 'LinkedIn (Marketing API)',
    fields: [
      { key: 'access_token', label: 'Access Token', type: 'password', placeholder: 'OAuth access token from LinkedIn Developer Portal' },
    ],
  },
  'YouTube': {
    label: 'YouTube (Data API v3)',
    fields: [
      { key: 'api_key', label: 'API Key', type: 'password', placeholder: 'API key from Google Cloud Console' },
    ],
  },
  'TikTok': {
    label: 'TikTok (Business API)',
    fields: [
      { key: 'access_token', label: 'Access Token', type: 'password', placeholder: 'Access token from TikTok Developer Portal' },
    ],
  },
};

export const SocialCredentialsManager = ({ open, onOpenChange, organizationId }: SocialCredentialsManagerProps) => {
  const [credentials, setCredentials] = useState<PlatformCredential[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [addingPlatform, setAddingPlatform] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [accountId, setAccountId] = useState('');
  const [accountName, setAccountName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchCredentials = useCallback(async () => {
    if (!organizationId) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('social_platform_credentials')
        .select('id, platform, credential_type, is_active, last_sync_at, sync_status, sync_error, sync_frequency, account_id, account_name, created_at')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setCredentials((data as PlatformCredential[]) || []);
    } catch (error) {
      console.error('[SocialCredentials] Fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    if (open) fetchCredentials();
  }, [open, fetchCredentials]);

  const handleSave = async () => {
    if (!addingPlatform || !organizationId) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('social_platform_credentials')
        .upsert({
          organization_id: organizationId,
          platform: addingPlatform,
          credentials: formData,
          account_id: accountId || null,
          account_name: accountName || null,
          is_active: true,
          sync_status: 'pending',
        } as any, {
          onConflict: 'organization_id,platform,account_id',
        });

      if (error) throw error;
      toast.success(`${addingPlatform} credentials saved`);
      setAddingPlatform(null);
      setFormData({});
      setAccountId('');
      setAccountName('');
      fetchCredentials();
    } catch (error) {
      console.error('[SocialCredentials] Save error:', error);
      toast.error('Failed to save credentials');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, platform: string) => {
    try {
      const { error } = await supabase
        .from('social_platform_credentials')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success(`${platform} credentials removed`);
      fetchCredentials();
    } catch (error) {
      toast.error('Failed to remove credentials');
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('social_platform_credentials')
        .update({ is_active: !isActive } as any)
        .eq('id', id);

      if (error) throw error;
      fetchCredentials();
    } catch (error) {
      toast.error('Failed to update credential status');
    }
  };

  const getSyncStatusIcon = (status: string | null) => {
    switch (status) {
      case 'success': return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />;
      case 'error': return <AlertCircle className="h-3.5 w-3.5 text-destructive" />;
      case 'running': return <RefreshCw className="h-3.5 w-3.5 text-primary animate-spin" />;
      default: return <Clock className="h-3.5 w-3.5 text-muted-foreground" />;
    }
  };

  const connectedPlatforms = credentials.map(c => c.platform);
  const availablePlatforms = Object.keys(PLATFORM_CREDENTIAL_FIELDS).filter(p => !connectedPlatforms.includes(p));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Social API Credentials
          </DialogTitle>
          <DialogDescription>
            Connect your social media accounts via API for automated metrics tracking.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Connected platforms */}
          {credentials.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground">Connected Platforms</h4>
              {credentials.map((cred) => (
                <div key={cred.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      {getSyncStatusIcon(cred.sync_status)}
                      <span className="font-medium text-sm text-foreground">{cred.platform}</span>
                    </div>
                    {cred.account_name && (
                      <span className="text-xs text-muted-foreground">({cred.account_name})</span>
                    )}
                    <Badge variant={cred.is_active ? "default" : "secondary"} className="text-[10px]">
                      {cred.is_active ? 'Active' : 'Paused'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleActive(cred.id, cred.is_active)}
                      title={cred.is_active ? 'Pause' : 'Activate'}
                    >
                      {cred.is_active ? 'Pause' : 'Enable'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(cred.id, cred.platform)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
              {credentials.some(c => c.sync_error) && (
                <div className="text-xs text-destructive bg-destructive/10 rounded-md p-2">
                  {credentials.find(c => c.sync_error)?.sync_error}
                </div>
              )}
            </div>
          )}

          {/* Add new platform */}
          {addingPlatform ? (
            <div className="space-y-3 p-4 rounded-lg border border-border bg-muted/30">
              <h4 className="text-sm font-medium text-foreground">
                Configure {PLATFORM_CREDENTIAL_FIELDS[addingPlatform]?.label || addingPlatform}
              </h4>
              
              <div className="space-y-2">
                <Label className="text-xs">Account ID / Page ID</Label>
                <Input
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  placeholder="e.g. 123456789 or username"
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Account Name (optional)</Label>
                <Input
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="e.g. @yourbrand"
                  className="text-sm"
                />
              </div>

              {PLATFORM_CREDENTIAL_FIELDS[addingPlatform]?.fields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <Label className="text-xs">{field.label}</Label>
                  <Input
                    type={field.type}
                    value={formData[field.key] || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="text-sm"
                  />
                </div>
              ))}

              <div className="flex gap-2 pt-2">
                <Button size="sm" onClick={handleSave} disabled={isSaving} className="gap-2">
                  <Key className="h-3.5 w-3.5" />
                  {isSaving ? 'Saving...' : 'Save Credentials'}
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setAddingPlatform(null); setFormData({}); }}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            availablePlatforms.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Add Platform</Label>
                <Select onValueChange={(val) => setAddingPlatform(val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a platform to connect..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePlatforms.map(p => (
                      <SelectItem key={p} value={p}>
                        {PLATFORM_CREDENTIAL_FIELDS[p]?.label || p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )
          )}

          {credentials.length === 0 && !addingPlatform && (
            <div className="text-center py-6 space-y-2">
              <Key className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">No platform APIs connected yet.</p>
              <p className="text-xs text-muted-foreground">Connect your social media APIs above to enable automated metrics tracking.</p>
            </div>
          )}

          <div className="text-xs text-muted-foreground bg-muted/50 rounded-md p-3 space-y-1">
            <p className="font-medium">How it works:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Add API credentials for each platform you want to track</li>
              <li>Metrics will be fetched automatically using your API keys</li>
              <li>If no API key is configured, AI-estimated data is used as fallback</li>
              <li>Credentials are encrypted and stored securely</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
