import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Camera, Plus, Trash2, Pencil, X, Check, Loader2, ZoomIn } from "lucide-react";
import { useBoothGalleryPhotos } from "@/hooks/useBoothGalleryPhotos";
import { OptimizedImage } from "@/components/ui/optimized-image";

interface BoothGalleryManagerProps {
  divisionId: string;
  isAdmin: boolean;
  color: string;
}

export const BoothGalleryManager = ({ divisionId, isAdmin, color }: BoothGalleryManagerProps) => {
  const { photos, loading, uploadPhoto, updateCaption, deletePhoto } = useBoothGalleryPhotos(divisionId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCaption, setEditCaption] = useState("");
  const [previewPhoto, setPreviewPhoto] = useState<{ url: string; caption: string } | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    for (const file of files) {
      await uploadPhoto(file, "");
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const startEdit = (id: string, caption: string) => {
    setEditingId(id);
    setEditCaption(caption);
  };

  const saveCaption = async () => {
    if (!editingId) return;
    await updateCaption(editingId, editCaption);
    setEditingId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading gallery...
      </div>
    );
  }

  if (photos.length === 0 && !isAdmin) return null;

  return (
    <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Camera className="h-4 w-4" /> Booth Gallery
        </h3>
        {isAdmin && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              {uploading ? "Uploading..." : "Add Photos"}
            </Button>
          </>
        )}
      </div>

      {photos.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="group relative rounded-lg overflow-hidden border border-border/40 bg-background cursor-pointer aspect-square"
              onClick={() => setPreviewPhoto({ url: photo.image_url, caption: photo.caption })}
            >
              <OptimizedImage
                src={photo.image_url}
                alt={photo.caption || "Booth photo"}
                className="w-full h-full"
                objectFit="cover"
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                <ZoomIn className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              {/* Admin delete button */}
              {isAdmin && (
                <button
                  onClick={(e) => { e.stopPropagation(); deletePhoto(photo.id); }}
                  className="absolute top-1 right-1 p-1 rounded-full bg-background/80 backdrop-blur-sm hover:bg-destructive hover:text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
              {/* Caption indicator */}
              {photo.caption && (
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-[10px] text-white line-clamp-1">{photo.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground italic">No booth photos yet. Add real booth shots to showcase this division.</p>
      )}

      {/* Full-size preview dialog */}
      <Dialog open={!!previewPhoto} onOpenChange={() => setPreviewPhoto(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/95 border-border/30">
          {previewPhoto && (
            <div className="relative">
              <img
                src={previewPhoto.url}
                alt={previewPhoto.caption || "Booth photo"}
                className="w-full h-auto max-h-[80vh] object-contain"
              />
              {previewPhoto.caption && (
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <p className="text-sm text-white">{previewPhoto.caption}</p>
                </div>
              )}
              {isAdmin && (
                <button
                  onClick={() => {
                    const photo = photos.find(p => p.image_url === previewPhoto.url);
                    if (photo) {
                      startEdit(photo.id, photo.caption);
                      setPreviewPhoto(null);
                    }
                  }}
                  className="absolute top-3 right-3 p-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white transition-colors"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Inline caption editor */}
      {editingId && (
        <div className="flex gap-2 items-center p-2 rounded-lg border border-primary/30 bg-muted/30">
          <Input
            value={editCaption}
            onChange={(e) => setEditCaption(e.target.value)}
            placeholder="Add a caption..."
            className="h-8 text-xs flex-1"
            autoFocus
          />
          <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={saveCaption}>
            <Check className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => setEditingId(null)}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
};
