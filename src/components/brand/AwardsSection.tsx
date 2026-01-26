import { useState, useMemo } from 'react';
import { Award, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { BrandAward } from '@/types/brand';
import { SectionHeader } from './SectionHeader';
import AwardCard from './awards/AwardCard';
import AwardsTimeline from './awards/AwardsTimeline';
import AwardsSortControls, { SortOption, ViewMode } from './awards/AwardsSortControls';

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
  const [sortOption, setSortOption] = useState<SortOption>('year-desc');
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
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

  // Sort awards based on selected option
  const sortedAwards = useMemo(() => {
    const sorted = [...awards];
    switch (sortOption) {
      case 'year-desc':
        return sorted.sort((a, b) => b.year - a.year);
      case 'year-asc':
        return sorted.sort((a, b) => a.year - b.year);
      case 'organization':
        return sorted.sort((a, b) => a.organization.localeCompare(b.organization));
      case 'title':
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      default:
        return sorted;
    }
  }, [awards, sortOption]);

  // Group awards by year for timeline view
  const { awardsByYear, sortedYears } = useMemo(() => {
    const grouped = sortedAwards.reduce((acc, award) => {
      const year = award.year;
      if (!acc[year]) acc[year] = [];
      acc[year].push(award);
      return acc;
    }, {} as Record<number, BrandAward[]>);

    const years = Object.keys(grouped)
      .map(Number)
      .sort((a, b) => sortOption === 'year-asc' ? a - b : b - a);

    return { awardsByYear: grouped, sortedYears: years };
  }, [sortedAwards, sortOption]);

  return (
    <section id="awards" className="space-y-4">
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
        <div className="space-y-2">
          <AwardsSortControls
            sortOption={sortOption}
            onSortChange={setSortOption}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            totalCount={awards.length}
          />

          {viewMode === 'timeline' ? (
            <AwardsTimeline
              awardsByYear={awardsByYear}
              sortedYears={sortedYears}
              canEdit={canEdit}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {sortedAwards.map((award, index) => (
                <AwardCard
                  key={award.id}
                  award={award}
                  canEdit={canEdit}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  compact
                  animationDelay={index * 30}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default AwardsSection;
