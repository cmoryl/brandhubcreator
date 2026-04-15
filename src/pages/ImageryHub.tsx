/**
 * ImageryHub - Centralized imagery management page (Admin only)
 */
import { useState, useCallback, useEffect } from 'react';
import { useStableLoading } from '@/hooks/useStableLoading';
import { useNavigate } from 'react-router-dom';
import { ImageIcon, ArrowLeft, Shield, Sparkles, Loader2, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useImageryHubEntities, ImageryEntity } from '@/hooks/useImageryHubEntities';
import { useEntityImagery } from '@/hooks/useEntityImagery';
import { useImageryStrategyAudit } from '@/hooks/useImageryStrategyAudit';
import { EntityPicker } from '@/components/imagery-hub/EntityPicker';
import { ImageryWorkspace } from '@/components/imagery-hub/ImageryWorkspace';
import { ComparisonPanel } from '@/components/imagery-hub/ComparisonPanel';
import { BulkCopyDialog } from '@/components/imagery-hub/BulkCopyDialog';
import { ApprovedImage } from '@/types/brand';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const ImageryHub = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const { entities, tree, isLoading: entitiesLoading } = useImageryHubEntities();

  const [selectedEntity, setSelectedEntity] = useState<ImageryEntity | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedImages, setSelectedImages] = useState<Map<string, ApprovedImage>>(new Map());
  const [bulkCopyOpen, setBulkCopyOpen] = useState(false);
  const [bulkCopyImages, setBulkCopyImages] = useState<ApprovedImage[]>([]);
  const [bulkCopySectionName, setBulkCopySectionName] = useState('');
  const [aiSuggestionsLoading, setAiSuggestionsLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [auditScore, setAuditScore] = useState<number | null>(null);

  const {
    latestAudit, isRunning: auditRunning, runAudit,
  } = useImageryStrategyAudit(selectedEntity?.id, selectedEntity?.type);

  const {
    sections, isLoading: imageryLoading, organizationId,
    addImages, removeImage, addSection, removeSection,
    reorderImages, updateImageTags,
    copyImagesToEntity, refetch,
  } = useEntityImagery({
    entityId: selectedEntity?.id,
    entityType: selectedEntity?.type || 'brand',
  });

  // Auth guard
  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate('/auth');
    }
  }, [user, isAdmin, authLoading, navigate]);

  const handleSelectEntity = useCallback((entity: ImageryEntity) => {
    setSelectedEntity(entity);
    setSelectionMode(false);
    setSelectedImages(new Map());
    setAiSuggestions([]);
  }, []);

  const handleToggleImageSelection = useCallback((sectionId: string, image: ApprovedImage) => {
    setSelectedImages(prev => {
      const key = `${sectionId}::${image.id}`;
      const next = new Map(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.set(key, image);
      }
      return next;
    });
  }, []);

  const handleStartBulkCopy = useCallback((images: ApprovedImage[], sectionName: string) => {
    setBulkCopyImages(images);
    setBulkCopySectionName(sectionName);
    setBulkCopyOpen(true);
  }, []);

  const handleBulkCopy = useCallback(async (
    targetEntityId: string,
    targetEntityType: 'brand' | 'product' | 'event',
    sectionName: string,
  ) => {
    await copyImagesToEntity(bulkCopyImages, targetEntityId, targetEntityType, sectionName);
    setSelectionMode(false);
    setSelectedImages(new Map());
  }, [bulkCopyImages, copyImagesToEntity]);

  const handleGetAiSuggestions = useCallback(async () => {
    if (!selectedEntity) return;
    setAiSuggestionsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('imagery-ai-suggestions', {
        body: {
          entityId: selectedEntity.id,
          entityType: selectedEntity.type,
          existingSections: sections.map(s => s.name),
        },
      });
      if (error) throw error;
      setAiSuggestions(data?.suggestions || []);
      if (data?.auditScore != null) setAuditScore(data.auditScore);
      toast.success(data?.hasAudit ? 'AI suggestions generated (audit-informed)' : 'AI suggestions generated');
    } catch (err) {
      console.error('AI suggestion error:', err);
      toast.error('Failed to generate suggestions');
    } finally {
      setAiSuggestionsLoading(false);
    }
  }, [selectedEntity, sections]);

  const stableAuthLoading = useStableLoading(authLoading, {
    showDelay: 100,
    minDisplayTime: 300,
    maxLoadingTime: 10000,
  });

  if (stableAuthLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Bar */}
      <header className="border-b border-border px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')} className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold">Imagery Hub</h1>
          </div>
          <Badge variant="secondary" className="gap-1">
            <Shield className="h-3 w-3" /> Admin
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {selectedEntity && latestAudit && (
            <Badge
              variant={latestAudit.overall_score >= 70 ? 'default' : latestAudit.overall_score >= 40 ? 'secondary' : 'destructive'}
              className="gap-1"
            >
              <Activity className="h-3 w-3" />
              Imagery Health: {Math.round(latestAudit.overall_score)}%
            </Badge>
          )}
          {selectedEntity && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={async () => {
                  if (organizationId) await runAudit(organizationId);
                }}
                disabled={auditRunning || !organizationId}
              >
                {auditRunning ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Activity className="h-3.5 w-3.5" />
                )}
                Run Audit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={handleGetAiSuggestions}
                disabled={aiSuggestionsLoading}
              >
                {aiSuggestionsLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                AI Suggestions
              </Button>
            </>
          )}
        </div>
      </header>

      {/* AI Suggestions Bar */}
      {aiSuggestions.length > 0 && (
        <div className="border-b border-border px-4 py-2 bg-primary/5 flex items-center gap-2 overflow-x-auto shrink-0">
          <Sparkles className="h-4 w-4 text-primary shrink-0" />
          <span className="text-sm font-medium shrink-0">Suggested searches:</span>
          {aiSuggestions.map((suggestion, i) => (
            <Badge key={i} variant="outline" className="cursor-pointer hover:bg-primary/10 shrink-0">
              {suggestion}
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-6 shrink-0"
            onClick={() => setAiSuggestions([])}
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Entity Picker */}
        <div className="w-72 shrink-0">
          <EntityPicker
            entities={entities}
            tree={tree}
            selectedId={selectedEntity?.id}
            onSelect={handleSelectEntity}
            isLoading={entitiesLoading}
          />
        </div>

        {/* Right: Workspace */}
        {selectedEntity ? (
          <ImageryWorkspace
            entity={selectedEntity}
            sections={sections}
            isLoading={imageryLoading}
            organizationId={organizationId}
            onAddSection={addSection}
            onRemoveSection={removeSection}
            onAddImages={addImages}
            onRemoveImage={removeImage}
            onReorderImages={reorderImages}
            onUpdateImageTags={updateImageTags}
            onStartComparison={() => setShowComparison(true)}
            onStartBulkCopy={handleStartBulkCopy}
            selectedImages={selectedImages}
            onToggleImageSelection={handleToggleImageSelection}
            selectionMode={selectionMode}
            onToggleSelectionMode={() => {
              setSelectionMode(!selectionMode);
              if (selectionMode) setSelectedImages(new Map());
            }}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center space-y-3">
              <ImageIcon className="h-16 w-16 mx-auto opacity-20" />
              <p className="text-lg font-medium">Select an entity to manage imagery</p>
              <p className="text-sm">Choose a brand, product, or event from the sidebar</p>
            </div>
          </div>
        )}
      </div>

      {/* Comparison Panel */}
      {showComparison && selectedEntity && (
        <ComparisonPanel
          entities={entities}
          primaryEntity={selectedEntity}
          onClose={() => setShowComparison(false)}
        />
      )}

      {/* Bulk Copy Dialog */}
      <BulkCopyDialog
        open={bulkCopyOpen}
        onOpenChange={setBulkCopyOpen}
        images={bulkCopyImages}
        sourceSectionName={bulkCopySectionName}
        entities={entities}
        currentEntityId={selectedEntity?.id || ''}
        onCopy={handleBulkCopy}
      />
    </div>
  );
};

export default ImageryHub;
