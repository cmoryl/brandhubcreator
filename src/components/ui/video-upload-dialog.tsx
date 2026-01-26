import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Video, 
  Upload, 
  Zap, 
  CheckCircle2, 
  AlertTriangle,
  FileVideo,
  ArrowRight,
  Loader2 
} from 'lucide-react';
import { 
  compressVideo, 
  needsCompression, 
  getVideoMetadata,
  formatFileSize,
  isCompressionSupported,
  type CompressionProgress,
  type CompressionResult 
} from '@/lib/videoCompression';
import { cn } from '@/lib/utils';

interface VideoUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVideoReady: (dataUrl: string) => void;
  file: File | null;
}

type UploadStage = 'analyzing' | 'prompt' | 'compressing' | 'complete' | 'error';

export const VideoUploadDialog = ({
  open,
  onOpenChange,
  onVideoReady,
  file,
}: VideoUploadDialogProps) => {
  const [stage, setStage] = useState<UploadStage>('analyzing');
  const [compressionNeeded, setCompressionNeeded] = useState(false);
  const [compressionReason, setCompressionReason] = useState<string>('');
  const [progress, setProgress] = useState<CompressionProgress | null>(null);
  const [result, setResult] = useState<CompressionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [videoMetadata, setVideoMetadata] = useState<{
    duration: number;
    width: number;
    height: number;
  } | null>(null);

  // Analyze video when dialog opens
  const analyzeVideo = useCallback(async () => {
    if (!file) return;
    
    setStage('analyzing');
    setError(null);
    
    try {
      // Get metadata
      const metadata = await getVideoMetadata(file);
      setVideoMetadata(metadata);
      
      // Check if compression needed
      const { needsCompression: needs, reason } = await needsCompression(file, {
        maxSizeMB: 15,
        maxDurationSeconds: 120,
      });
      
      setCompressionNeeded(needs);
      setCompressionReason(reason || '');
      
      if (needs && isCompressionSupported()) {
        setStage('prompt');
      } else if (needs && !isCompressionSupported()) {
        // Browser doesn't support compression, upload anyway with warning
        setStage('prompt');
      } else {
        // No compression needed, use original
        handleUseOriginal();
      }
    } catch (err) {
      setError('Failed to analyze video. Please try a different file.');
      setStage('error');
    }
  }, [file]);

  // Start analysis when file changes
  useState(() => {
    if (file && open) {
      analyzeVideo();
    }
  });

  const handleCompress = async () => {
    if (!file) return;
    
    setStage('compressing');
    setProgress({ stage: 'loading', percent: 0, message: 'Starting...' });
    
    try {
      const compressionResult = await compressVideo(
        file,
        {
          maxSizeMB: 10,
          targetWidth: 1920,
          quality: 0.75,
          maxDurationSeconds: 60,
        },
        setProgress
      );
      
      setResult(compressionResult);
      setStage('complete');
    } catch (err) {
      setError('Compression failed. Please try a smaller video or different format.');
      setStage('error');
    }
  };

  const handleUseOriginal = useCallback(() => {
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      onVideoReady(dataUrl);
      onOpenChange(false);
    };
    reader.readAsDataURL(file);
  }, [file, onVideoReady, onOpenChange]);

  const handleUseCompressed = () => {
    if (result) {
      onVideoReady(result.dataUrl);
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    setStage('analyzing');
    setProgress(null);
    setResult(null);
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-primary" />
            Video Upload
          </DialogTitle>
          <DialogDescription>
            {stage === 'analyzing' && 'Analyzing your video...'}
            {stage === 'prompt' && 'Optimize video for web playback'}
            {stage === 'compressing' && 'Compressing video...'}
            {stage === 'complete' && 'Compression complete!'}
            {stage === 'error' && 'Something went wrong'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* File info */}
          {file && (
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <FileVideo className="h-8 w-8 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(file.size)}
                  {videoMetadata && ` • ${Math.round(videoMetadata.duration)}s • ${videoMetadata.width}×${videoMetadata.height}`}
                </p>
              </div>
            </div>
          )}

          {/* Analyzing stage */}
          {stage === 'analyzing' && (
            <div className="flex flex-col items-center gap-3 py-6">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Analyzing video file...</p>
            </div>
          )}

          {/* Prompt stage */}
          {stage === 'prompt' && (
            <>
              {compressionNeeded && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{compressionReason}</AlertDescription>
                </Alert>
              )}

              {isCompressionSupported() ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    We recommend compressing this video for faster loading and better web playback.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      onClick={handleUseOriginal}
                      className="h-auto py-3 flex-col gap-1"
                    >
                      <Upload className="h-5 w-5" />
                      <span className="text-sm">Use Original</span>
                      <span className="text-xs text-muted-foreground">
                        {formatFileSize(file?.size || 0)}
                      </span>
                    </Button>
                    
                    <Button
                      onClick={handleCompress}
                      className="h-auto py-3 flex-col gap-1"
                    >
                      <Zap className="h-5 w-5" />
                      <span className="text-sm">Compress</span>
                      <span className="text-xs opacity-80">Recommended</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <Alert>
                    <AlertDescription>
                      Browser-based compression is not supported. The video will be uploaded as-is.
                    </AlertDescription>
                  </Alert>
                  <Button onClick={handleUseOriginal} className="w-full">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Original
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Compressing stage */}
          {stage === 'compressing' && progress && (
            <div className="space-y-4 py-4">
              <Progress value={progress.percent} className="h-2" />
              <div className="text-center">
                <p className="text-sm font-medium">{progress.message}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  This may take a moment...
                </p>
              </div>
            </div>
          )}

          {/* Complete stage */}
          {stage === 'complete' && result && (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 text-green-600">
                <CheckCircle2 className="h-6 w-6" />
                <span className="font-medium">Compression Complete!</span>
              </div>
              
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <div className="p-2 bg-muted rounded-lg">
                  <p className="text-muted-foreground text-xs">Original</p>
                  <p className="font-medium">{formatFileSize(result.originalSize)}</p>
                </div>
                <div className="p-2 flex items-center justify-center">
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <p className="text-muted-foreground text-xs">Compressed</p>
                  <p className="font-medium text-green-600">{formatFileSize(result.compressedSize)}</p>
                </div>
              </div>
              
              <p className="text-xs text-center text-muted-foreground">
                Reduced by {Math.round((1 - result.compressedSize / result.originalSize) * 100)}%
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={handleUseOriginal}>
                  Use Original
                </Button>
                <Button onClick={handleUseCompressed}>
                  Use Compressed
                </Button>
              </div>
            </div>
          )}

          {/* Error stage */}
          {stage === 'error' && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button onClick={handleUseOriginal}>
                  Upload Anyway
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
