import { useState, useMemo, useRef } from 'react';
import { Award, Plus, Upload, X, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { GuideEmptyState } from './GuideEmptyState';
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
import { useStorageUpload } from '@/hooks/useStorageUpload';
import { cn } from '@/lib/utils';

interface AwardsSectionProps {
  awards: BrandAward[];
  onUpdate?: (awards: BrandAward[]) => void;
  customSubtitle?: string;
  onSubtitleChange?: (subtitle: string) => void;
  entityType?: 'brand' | 'product' | 'event';
  entityId?: string;
}

const ITEMS_PER_ROW = 6; // Based on xl:grid-cols-6
const INITIAL_ROWS = 2;
const INITIAL_VISIBLE_COUNT = ITEMS_PER_ROW * INITIAL_ROWS;

const AwardsSection = ({ awards, onUpdate, customSubtitle, onSubtitleChange, entityType = 'product', entityId }: AwardsSectionProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingAward, setEditingAward] = useState<BrandAward | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>('year-desc');
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [isExpanded, setIsExpanded] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    year: new Date().getFullYear(),
    organization: '',
    imageUrl: '',
    linkUrl: '',
    category: '',
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile, isUploading } = useStorageUpload({ entityType, entityId });

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Generate a unique name for this award image
    const awardId = editingAward?.id || crypto.randomUUID();
    const result = await uploadFile(file, 'award', `award-${awardId}`);
    
    if (result) {
      setFormData(prev => ({ ...prev, imageUrl: result.url }));
    }
    
    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClearImage = () => {
    setFormData(prev => ({ ...prev, imageUrl: '' }));
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
      case 'category':
        return sorted.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
      default:
        return sorted;
    }
  }, [awards, sortOption]);

  // Determine visible awards based on expanded state
  const visibleAwards = useMemo(() => {
    if (isExpanded || viewMode === 'timeline') {
      return sortedAwards;
    }
    return sortedAwards.slice(0, INITIAL_VISIBLE_COUNT);
  }, [sortedAwards, isExpanded, viewMode]);

  const hasMoreAwards = sortedAwards.length > INITIAL_VISIBLE_COUNT;
  const hiddenCount = sortedAwards.length - INITIAL_VISIBLE_COUNT;

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
                <label className="text-sm font-medium mb-1.5 block">Award Image</label>
                
                {/* Upload and URL input */}
                <div className="flex gap-2">
                  <Input
                    placeholder="https://... or upload an image"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="flex-1"
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="shrink-0"
                  >
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                
                {/* Image preview - shown below input when URL exists */}
                {formData.imageUrl && (
                  <div className="mt-3 p-3 bg-muted/50 rounded-lg border border-border">
                    <div className="flex items-start gap-3">
                      <div className="w-14 h-14 bg-white rounded-md flex items-center justify-center overflow-hidden shrink-0 border border-border">
                        <img
                          src={formData.imageUrl}
                          alt="Award preview"
                          className="max-w-full max-h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0 pt-1">
                        <p className="text-xs font-medium text-foreground mb-0.5">Image Preview</p>
                        <p className="text-xs text-muted-foreground truncate">{formData.imageUrl.length > 50 ? formData.imageUrl.slice(0, 50) + '...' : formData.imageUrl}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={handleClearImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
                
                {!formData.imageUrl && (
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Enter a URL or click the upload button to add an image
                  </p>
                )}
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
        <GuideEmptyState
          icon={Award}
          title="Showcase Your Achievements"
          description="Awards and recognition build credibility. Add industry honors, certifications, and accolades your brand has earned."
          actionLabel="Add First Award"
          onAction={() => canEdit && setIsDialogOpen(true)}
          canEdit={canEdit}
          readOnlyHint="Awards will appear here once added"
        />
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
              {visibleAwards.map((award, index) => (
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

          {/* Show More / Show Less Button */}
          {viewMode === 'grid' && hasMoreAwards && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="gap-2"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    View {hiddenCount} More Awards
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default AwardsSection;
