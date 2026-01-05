import { useState } from 'react';
import { Plus, X, Pencil, ExternalLink } from 'lucide-react';
import { BrandSocialProfile } from '@/types/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SocialSectionProps {
  social: BrandSocialProfile[];
  onSocialChange: (social: BrandSocialProfile[]) => void;
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
];

export const SocialSection = ({ social, onSocialChange }: SocialSectionProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);

  const addProfile = () => {
    const newProfile: BrandSocialProfile = {
      id: crypto.randomUUID(),
      platform: 'LinkedIn',
      handle: '@yourbrand',
      url: 'https://linkedin.com/company/yourbrand',
      color: '#0A66C2',
    };
    onSocialChange([...social, newProfile]);
    setEditingId(newProfile.id);
  };

  const updateProfile = (id: string, updates: Partial<BrandSocialProfile>) => {
    onSocialChange(social.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const deleteProfile = (id: string) => {
    onSocialChange(social.filter(s => s.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const handlePlatformChange = (id: string, platform: string) => {
    const platformData = platformOptions.find(p => p.name === platform);
    updateProfile(id, { platform, color: platformData?.color || '#000000' });
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-semibold text-foreground">Social Registry</h2>
          <p className="text-muted-foreground mt-1">Official social handles and URLs</p>
        </div>
        <Button onClick={addProfile} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Profile
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {social.map((profile, index) => (
          <div
            key={profile.id}
            className="group relative bg-card rounded-xl p-4 shadow-sm border border-border animate-scale-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {editingId === profile.id ? (
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
                  <h3 className="font-medium text-foreground">{profile.platform}</h3>
                  <p className="text-sm text-muted-foreground truncate">{profile.handle}</p>
                  <a
                    href={profile.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-accent hover:underline inline-flex items-center gap-1 mt-1"
                  >
                    Visit <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
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
              </div>
            )}
          </div>
        ))}

        {social.length === 0 && (
          <button
            onClick={addProfile}
            className="h-32 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-accent hover:text-accent transition-colors"
          >
            <Plus className="h-6 w-6" />
            <span className="text-sm font-medium">Add social profile</span>
          </button>
        )}
      </div>
    </section>
  );
};
