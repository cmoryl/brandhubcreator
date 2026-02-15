import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, Plus, Trash2, Pencil, X, Check, Loader2, ZoomIn } from "lucide-react";
import { useBoothGalleryPhotos } from "@/hooks/useBoothGalleryPhotos";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { PreviewDialog } from "@/components/ui/preview-dialog";

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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    await uploadPhoto(file, "");
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
              {uploading ? "Uploading..." : "Add Photo"}
            </Button>
          </>
        )}
      </div>

      {photos.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {photos.map((photo) => (
            <div key={photo.id} className="group relative rounded-lg overflow-hidden border border-border/40 bg-background">
              <div className="aspect-[4/3] relative">
                <OptimizedImage
                  src={photo.image_url}
                  alt={photo.caption || "Booth photo"}
                  className="w-full h-full"
                  objectFit="cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <button
                      onClick={() => setPreviewUrl(photo.image_url)}
                      className="p-1.5 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
                    >
                      <ZoomIn className="h-3.5 w-3.5" />
                    </button>
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => startEdit(photo.id, photo.caption)}
                          className="p-1.5 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => deletePhoto(photo.id)}
                          className="p-1.5 rounded-full bg-background/80 backdrop-blur-sm hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
              {editingId === photo.id ? (
                <div className="p-2 flex gap-1">
                  <Input
                    value={editCaption}
                    onChange={(e) => setEditCaption(e.target.value)}
                    placeholder="Caption"
                    className="h-7 text-xs"
                  />
                  <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={saveCaption}>
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => setEditingId(null)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : photo.caption ? (
                <p className="text-xs text-muted-foreground p-2 line-clamp-1">{photo.caption}</p>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground italic">No booth photos yet. Add real booth shots to showcase this division.</p>
      )}

      <PreviewDialog
        open={!!previewUrl}
        onOpenChange={() => setPreviewUrl(null)}
        previewUrl={previewUrl || ""}
        title="Booth Photo"
        type="image"
      />
    </div>
  );
};
