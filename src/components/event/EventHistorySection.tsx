import { useState } from 'react';
import { Plus, Trash2, Check, X, History, Calendar, Image as ImageIcon, FileText, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { EventHistoryEntry, EventHistoryAsset } from '@/types/event';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface EventHistorySectionProps {
  history: EventHistoryEntry[];
  onUpdate: (history: EventHistoryEntry[]) => void;
  isEditable?: boolean;
  subtitle?: string;
}

export const EventHistorySection = ({
  history,
  onUpdate,
  isEditable = true,
  subtitle,
}: EventHistorySectionProps) => {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [expandedYears, setExpandedYears] = useState<string[]>([]);
  const [addingAssetTo, setAddingAssetTo] = useState<string | null>(null);
  const [newEntry, setNewEntry] = useState<Partial<EventHistoryEntry>>({
    year: new Date().getFullYear() - 1,
    eventName: '',
    location: '',
    attendees: 0,
    highlights: '',
    assets: [],
  });
  const [newAsset, setNewAsset] = useState<Partial<EventHistoryAsset>>({
    name: '',
    type: 'image',
    url: '',
  });

  const toggleYear = (id: string) => {
    setExpandedYears(prev => 
      prev.includes(id) ? prev.filter(y => y !== id) : [...prev, id]
    );
  };

  const handleAddEntry = () => {
    if (!newEntry.year || !newEntry.eventName) return;
    
    const entry: EventHistoryEntry = {
      id: crypto.randomUUID(),
      year: newEntry.year,
      eventName: newEntry.eventName || '',
      theme: newEntry.theme,
      location: newEntry.location,
      venue: newEntry.venue,
      dates: newEntry.dates,
      attendees: newEntry.attendees,
      highlights: newEntry.highlights,
      learnings: newEntry.learnings,
      assets: [],
    };
    
    onUpdate([...history, entry].sort((a, b) => b.year - a.year));
    setNewEntry({
      year: new Date().getFullYear() - 1,
      eventName: '',
      location: '',
      attendees: 0,
      highlights: '',
      assets: [],
    });
    setIsAddingNew(false);
  };

  const handleDeleteEntry = (id: string) => {
    onUpdate(history.filter(h => h.id !== id));
  };

  const handleAddAsset = (entryId: string) => {
    if (!newAsset.name || !newAsset.url) return;
    
    const asset: EventHistoryAsset = {
      id: crypto.randomUUID(),
      name: newAsset.name,
      type: newAsset.type as EventHistoryAsset['type'],
      url: newAsset.url,
      description: newAsset.description,
    };
    
    onUpdate(history.map(h => 
      h.id === entryId 
        ? { ...h, assets: [...(h.assets || []), asset] }
        : h
    ));
    setNewAsset({ name: '', type: 'image', url: '' });
    setAddingAssetTo(null);
  };

  const handleDeleteAsset = (entryId: string, assetId: string) => {
    onUpdate(history.map(h => 
      h.id === entryId 
        ? { ...h, assets: (h.assets || []).filter(a => a.id !== assetId) }
        : h
    ));
  };

  const getAssetIcon = (type: EventHistoryAsset['type']) => {
    switch (type) {
      case 'image': return <ImageIcon className="h-4 w-4" />;
      case 'video': return <FileText className="h-4 w-4" />;
      case 'document': return <FileText className="h-4 w-4" />;
      case 'logo': return <ImageIcon className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const sortedHistory = [...history].sort((a, b) => b.year - a.year);

  return (
    <section id="eventhistory" className="scroll-mt-24">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <History className="h-6 w-6 text-primary" />
            Event History
          </h2>
          {subtitle ? (
            <p className="text-muted-foreground mt-1" dangerouslySetInnerHTML={{ __html: subtitle }} />
          ) : (
            <p className="text-muted-foreground mt-1">Past events archive with imagery, files, and key information</p>
          )}
        </div>
        {isEditable && (
          <Button onClick={() => setIsAddingNew(true)} disabled={isAddingNew}>
            <Plus className="h-4 w-4 mr-2" />
            Add Past Event
          </Button>
        )}
      </div>

      {/* Add New Entry Form */}
      {isAddingNew && (
        <Card className="mb-6 border-dashed border-primary">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div className="space-y-2">
                <Label>Year *</Label>
                <Input
                  type="number"
                  value={newEntry.year || ''}
                  onChange={(e) => setNewEntry({ ...newEntry, year: parseInt(e.target.value) })}
                  placeholder="2025"
                />
              </div>
              <div className="space-y-2">
                <Label>Event Name *</Label>
                <Input
                  value={newEntry.eventName || ''}
                  onChange={(e) => setNewEntry({ ...newEntry, eventName: e.target.value })}
                  placeholder="Innovation Summit 2025"
                />
              </div>
              <div className="space-y-2">
                <Label>Theme</Label>
                <Input
                  value={newEntry.theme || ''}
                  onChange={(e) => setNewEntry({ ...newEntry, theme: e.target.value })}
                  placeholder="Building Tomorrow"
                />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  value={newEntry.location || ''}
                  onChange={(e) => setNewEntry({ ...newEntry, location: e.target.value })}
                  placeholder="San Francisco, CA"
                />
              </div>
              <div className="space-y-2">
                <Label>Venue</Label>
                <Input
                  value={newEntry.venue || ''}
                  onChange={(e) => setNewEntry({ ...newEntry, venue: e.target.value })}
                  placeholder="Moscone Center"
                />
              </div>
              <div className="space-y-2">
                <Label>Dates</Label>
                <Input
                  value={newEntry.dates || ''}
                  onChange={(e) => setNewEntry({ ...newEntry, dates: e.target.value })}
                  placeholder="March 15-17, 2025"
                />
              </div>
              <div className="space-y-2">
                <Label>Attendees</Label>
                <Input
                  type="number"
                  value={newEntry.attendees || ''}
                  onChange={(e) => setNewEntry({ ...newEntry, attendees: parseInt(e.target.value) })}
                  placeholder="5000"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label>Highlights</Label>
                <Textarea
                  value={newEntry.highlights || ''}
                  onChange={(e) => setNewEntry({ ...newEntry, highlights: e.target.value })}
                  placeholder="Key moments and achievements..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Learnings & Notes</Label>
                <Textarea
                  value={newEntry.learnings || ''}
                  onChange={(e) => setNewEntry({ ...newEntry, learnings: e.target.value })}
                  placeholder="What worked well, what to improve..."
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddingNew(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleAddEntry} disabled={!newEntry.year || !newEntry.eventName}>
                <Check className="h-4 w-4 mr-2" />
                Add Entry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {history.length === 0 && !isAddingNew ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <History className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-semibold text-lg mb-2">No event history yet</h3>
            <p className="text-muted-foreground mb-4">Add past events to reference imagery, files, and learnings</p>
            {isEditable && (
              <Button onClick={() => setIsAddingNew(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Event
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedHistory.map((entry) => (
            <Collapsible 
              key={entry.id} 
              open={expandedYears.includes(entry.id)}
              onOpenChange={() => toggleYear(entry.id)}
            >
              <Card className="overflow-hidden">
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Badge variant="outline" className="text-lg font-bold px-3 py-1">
                          {entry.year}
                        </Badge>
                        <div>
                          <CardTitle className="text-lg">{entry.eventName}</CardTitle>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                            {entry.location && <span>{entry.location}</span>}
                            {entry.dates && <span>• {entry.dates}</span>}
                            {entry.attendees && entry.attendees > 0 && (
                              <span>• {entry.attendees.toLocaleString()} attendees</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {(entry.assets?.length || 0) > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {entry.assets?.length} assets
                          </Badge>
                        )}
                        {expandedYears.includes(entry.id) ? (
                          <ChevronUp className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <CardContent className="border-t pt-4">
                    {/* Theme */}
                    {entry.theme && (
                      <div className="mb-4">
                        <span className="text-sm font-medium text-muted-foreground">Theme:</span>
                        <p className="text-lg font-medium mt-1">"{entry.theme}"</p>
                      </div>
                    )}

                    {/* Highlights & Learnings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      {entry.highlights && (
                        <div className="p-4 bg-muted/50 rounded-lg">
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-primary" />
                            Highlights
                          </h4>
                          <p className="text-sm text-muted-foreground whitespace-pre-line">{entry.highlights}</p>
                        </div>
                      )}
                      {entry.learnings && (
                        <div className="p-4 bg-muted/50 rounded-lg">
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary" />
                            Learnings & Notes
                          </h4>
                          <p className="text-sm text-muted-foreground whitespace-pre-line">{entry.learnings}</p>
                        </div>
                      )}
                    </div>

                    {/* Assets */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">Assets & Files</h4>
                        {isEditable && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setAddingAssetTo(addingAssetTo === entry.id ? null : entry.id)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Asset
                          </Button>
                        )}
                      </div>

                      {/* Add Asset Form */}
                      {addingAssetTo === entry.id && (
                        <Card className="mb-4 border-dashed">
                          <CardContent className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                              <div className="space-y-1">
                                <Label className="text-xs">Name</Label>
                                <Input
                                  value={newAsset.name || ''}
                                  onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                                  placeholder="Hero Banner"
                                  className="h-8"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Type</Label>
                                <select 
                                  className="w-full h-8 px-2 border rounded-md text-sm bg-background"
                                  value={newAsset.type}
                                  onChange={(e) => setNewAsset({ ...newAsset, type: e.target.value as EventHistoryAsset['type'] })}
                                >
                                  <option value="image">Image</option>
                                  <option value="video">Video</option>
                                  <option value="document">Document</option>
                                  <option value="logo">Logo</option>
                                  <option value="presentation">Presentation</option>
                                  <option value="other">Other</option>
                                </select>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">URL</Label>
                                <Input
                                  value={newAsset.url || ''}
                                  onChange={(e) => setNewAsset({ ...newAsset, url: e.target.value })}
                                  placeholder="https://..."
                                  className="h-8"
                                />
                              </div>
                              <div className="flex items-end gap-2">
                                <Button 
                                  size="sm" 
                                  onClick={() => handleAddAsset(entry.id)}
                                  disabled={!newAsset.name || !newAsset.url}
                                  className="h-8"
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setAddingAssetTo(null)}
                                  className="h-8"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Asset Grid */}
                      {(entry.assets?.length || 0) > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                          {entry.assets?.map((asset) => (
                            <Card key={asset.id} className="group relative overflow-hidden">
                              <div className="aspect-square bg-muted flex items-center justify-center relative">
                                {asset.type === 'image' || asset.type === 'logo' ? (
                                  <img
                                    src={asset.url}
                                    alt={asset.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                      (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                    }}
                                  />
                                ) : null}
                                <div className={cn(
                                  "flex flex-col items-center justify-center text-muted-foreground",
                                  (asset.type === 'image' || asset.type === 'logo') && "hidden"
                                )}>
                                  {getAssetIcon(asset.type)}
                                  <span className="text-[10px] mt-1 uppercase">{asset.type}</span>
                                </div>
                                
                                {/* Actions overlay */}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                  <a 
                                    href={asset.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="p-1.5 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                                  >
                                    <ExternalLink className="h-3.5 w-3.5 text-white" />
                                  </a>
                                  {isEditable && (
                                    <button
                                      onClick={() => handleDeleteAsset(entry.id, asset.id)}
                                      className="p-1.5 bg-red-500/80 rounded-full hover:bg-red-500 transition-colors"
                                    >
                                      <Trash2 className="h-3.5 w-3.5 text-white" />
                                    </button>
                                  )}
                                </div>
                              </div>
                              <div className="p-2">
                                <p className="text-xs font-medium truncate">{asset.name}</p>
                              </div>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-sm text-muted-foreground border border-dashed rounded-lg">
                          No assets yet. Add images, documents, or files from this event.
                        </div>
                      )}
                    </div>

                    {/* Delete Entry */}
                    {isEditable && (
                      <div className="mt-6 pt-4 border-t flex justify-end">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteEntry(entry.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Entry
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </div>
      )}

      {/* Quick Stats */}
      {history.length > 0 && (
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <div className="flex flex-wrap gap-6 text-sm">
            <div>
              <span className="text-muted-foreground">Years Documented:</span>
              <span className="ml-2 font-medium">{history.length}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Total Assets:</span>
              <span className="ml-2 font-medium">
                {history.reduce((sum, h) => sum + (h.assets?.length || 0), 0)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Date Range:</span>
              <span className="ml-2 font-medium">
                {Math.min(...history.map(h => h.year))} - {Math.max(...history.map(h => h.year))}
              </span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
