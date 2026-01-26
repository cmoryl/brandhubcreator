import { useState } from 'react';
import { Award, Plus, Trash2, ExternalLink, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { BrandAward } from '@/types/brand';
import { SectionHeader } from './SectionHeader';

interface AwardsSectionProps {
  awards: BrandAward[];
  onUpdate?: (awards: BrandAward[]) => void;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
}

const AwardsSection = ({ awards, onUpdate, customSubtitle, onSubtitleChange }: AwardsSectionProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingAward, setEditingAward] = useState<BrandAward | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    year: new Date().getFullYear(),
    organization: '',
    imageUrl: '',
    linkUrl: '',
    category: '',
  });

  const canEdit = !!onUpdate;

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      year: new Date().getFullYear(),
      organization: '',
      imageUrl: '',
      linkUrl: '',
      category: '',
    });
    setEditingAward(null);
  };

  const handleSave = () => {
    if (!formData.title.trim() || !formData.organization.trim() || !onUpdate) return;

    if (editingAward) {
      onUpdate(
        awards.map((a) =>
          a.id === editingAward.id ? { ...editingAward, ...formData } : a
        )
      );
    } else {
      const newAward: BrandAward = {
        id: crypto.randomUUID(),
        ...formData,
      };
      onUpdate([newAward, ...awards]);
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleEdit = (award: BrandAward) => {
    setEditingAward(award);
    setFormData({
      title: award.title,
      description: award.description,
      year: award.year,
      organization: award.organization,
      imageUrl: award.imageUrl || '',
      linkUrl: award.linkUrl || '',
      category: award.category || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (onUpdate) {
      onUpdate(awards.filter((a) => a.id !== id));
    }
  };

  // Group awards by year
  const awardsByYear = awards.reduce((acc, award) => {
    const year = award.year;
    if (!acc[year]) acc[year] = [];
    acc[year].push(award);
    return acc;
  }, {} as Record<number, BrandAward[]>);

  const sortedYears = Object.keys(awardsByYear)
    .map(Number)
    .sort((a, b) => b - a);

  return (
    <section id="awards" className="space-y-6">
      <SectionHeader
        title="Awards & Recognition"
        defaultSubtitle="Industry recognition and achievements"
        customSubtitle={customSubtitle}
        onSubtitleChange={canEdit ? onSubtitleChange : undefined}
        isEditing={isEditing}
        onEditToggle={() => setIsEditing(!isEditing)}
      />

      {canEdit && (
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Award
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingAward ? 'Edit Award' : 'Add Award'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Title *</label>
                <Input
                  placeholder="Award title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Organization *</label>
                  <Input
                    placeholder="Awarding organization"
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Year</label>
                  <Input
                    type="number"
                    placeholder="2024"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || new Date().getFullYear() })}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Category</label>
                <Input
                  placeholder="e.g., eDiscovery, Legal Tech"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Description</label>
                <Textarea
                  placeholder="Brief description of the award"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Image URL</label>
                <Input
                  placeholder="https://..."
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Link URL</label>
                <Input
                  placeholder="https://..."
                  value={formData.linkUrl}
                  onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={!formData.title.trim() || !formData.organization.trim()}>
                  {editingAward ? 'Save Changes' : 'Add Award'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {awards.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Award className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No awards added yet</p>
            {canEdit && (
              <p className="text-sm text-muted-foreground mt-1">
                Click "Add Award" to showcase your achievements
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {sortedYears.map((year) => (
            <div key={year} className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="text-sm font-semibold px-3 py-1">
                  {year}
                </Badge>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {awardsByYear[year].map((award) => (
                  <Card
                    key={award.id}
                    className="group overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer"
                    onClick={() => canEdit && handleEdit(award)}
                  >
                    {award.imageUrl && (
                      <div className="aspect-[16/9] overflow-hidden bg-muted">
                        <img
                          src={award.imageUrl}
                          alt={award.title}
                          className="w-full h-full object-contain p-4"
                        />
                      </div>
                    )}
                    <CardContent className={award.imageUrl ? 'pt-4' : 'pt-6'}>
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-sm leading-tight line-clamp-2">
                            {award.title}
                          </h3>
                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(award.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Building2 className="h-3 w-3" />
                          <span>{award.organization}</span>
                        </div>

                        {award.category && (
                          <Badge variant="outline" className="text-xs">
                            {award.category}
                          </Badge>
                        )}

                        {award.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {award.description}
                          </p>
                        )}

                        {award.linkUrl && (
                          <a
                            href={award.linkUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
                          >
                            Learn more <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default AwardsSection;
