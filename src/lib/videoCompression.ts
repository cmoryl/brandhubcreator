/**
 * Video Compression Utility
 * Handles compression and conversion of video files including .mov
 */

export interface CompressionOptions {
  maxSizeMB?: number;
  maxDurationSeconds?: number;
  targetWidth?: number;
  quality?: number; // 0-1
}

export interface CompressionResult {
  blob: Blob;
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  duration: number;
  width: number;
  height: number;
}

export interface CompressionProgress {
  stage: 'loading' | 'analyzing' | 'compressing' | 'encoding' | 'complete';
  percent: number;
  message: string;
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxSizeMB: 10,
  maxDurationSeconds: 60,
  targetWidth: 1920,
  quality: 0.8,
};

/**
 * Check if the browser supports MediaRecorder with video encoding
 */
export const isCompressionSupported = (): boolean => {
  return typeof MediaRecorder !== 'undefined' && 
         typeof HTMLCanvasElement !== 'undefined' &&
         typeof HTMLVideoElement !== 'undefined';
};

/**
 * Get video metadata (duration, dimensions)
 */
export const getVideoMetadata = (file: File): Promise<{
  duration: number;
  width: number;
  height: number;
}> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve({
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
      });
    };
    
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Failed to load video metadata'));
    };
    
    video.src = URL.createObjectURL(file);
  });
};

/**
 * Check if a video file needs compression based on size and format
 */
export const needsCompression = async (
  file: File, 
  options: CompressionOptions = DEFAULT_OPTIONS
): Promise<{
  needsCompression: boolean;
  reason?: string;
}> => {
  const maxSize = (options.maxSizeMB || 10) * 1024 * 1024;
  const fileSizeMB = file.size / (1024 * 1024);
  
  // Check file size
  if (file.size > maxSize) {
    return {
      needsCompression: true,
      reason: `File size (${fileSizeMB.toFixed(1)}MB) exceeds ${options.maxSizeMB}MB limit`,
    };
  }
  
  // Check if format needs conversion (e.g., .mov to webm/mp4)
  const isMov = file.type === 'video/quicktime' || file.name.toLowerCase().endsWith('.mov');
  if (isMov) {
    return {
      needsCompression: true,
      reason: 'MOV files should be converted to web-friendly format',
    };
  }
  
  // Check duration if possible
  try {
    const metadata = await getVideoMetadata(file);
    if (options.maxDurationSeconds && metadata.duration > options.maxDurationSeconds) {
      return {
        needsCompression: true,
        reason: `Video duration (${Math.round(metadata.duration)}s) exceeds ${options.maxDurationSeconds}s limit`,
      };
    }
  } catch {
    // Couldn't get metadata, assume OK
  }
  
  return { needsCompression: false };
};

/**
 * Compress and convert video using Canvas + MediaRecorder
 * This is a browser-based approach that works without external libraries
 */
export const compressVideo = async (
  file: File,
  options: CompressionOptions = DEFAULT_OPTIONS,
  onProgress?: (progress: CompressionProgress) => void
): Promise<CompressionResult> => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  onProgress?.({ stage: 'loading', percent: 0, message: 'Loading video...' });
  
  // Create video element
  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  
  // Load video
  await new Promise<void>((resolve, reject) => {
    video.onloadeddata = () => resolve();
    video.onerror = () => reject(new Error('Failed to load video'));
    video.src = URL.createObjectURL(file);
  });
  
  onProgress?.({ stage: 'analyzing', percent: 10, message: 'Analyzing video...' });
  
  // Calculate target dimensions
  const originalWidth = video.videoWidth;
  const originalHeight = video.videoHeight;
  const targetWidth = Math.min(originalWidth, opts.targetWidth || 1920);
  const scale = targetWidth / originalWidth;
  const targetHeight = Math.round(originalHeight * scale);
  
  // Create canvas for re-encoding
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d')!;
  
  // Determine output format - prefer webm for better compression
  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : MediaRecorder.isTypeSupported('video/webm')
    ? 'video/webm'
    : 'video/mp4';
  
  onProgress?.({ stage: 'compressing', percent: 20, message: 'Compressing video...' });
  
  // Calculate bitrate based on quality setting
  const baseBitrate = 2500000; // 2.5 Mbps base
  const videoBitsPerSecond = Math.round(baseBitrate * (opts.quality || 0.8));
  
  // Create MediaRecorder
  const stream = canvas.captureStream(30); // 30 fps
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond,
  });
  
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) {
      chunks.push(e.data);
    }
  };
  
  // Start recording
  recorder.start(100); // Collect data every 100ms
  
  // Calculate max duration
  const maxDuration = Math.min(
    video.duration,
    opts.maxDurationSeconds || video.duration
  );
  
  // Play and record
  video.currentTime = 0;
  await video.play();
  
  // Draw frames
  const startTime = Date.now();
  const drawFrame = () => {
    if (video.currentTime < maxDuration && !video.ended) {
      ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
      
      // Update progress
      const progress = Math.min(90, 20 + (video.currentTime / maxDuration) * 70);
      onProgress?.({
        stage: 'encoding',
        percent: progress,
        message: `Encoding: ${Math.round(video.currentTime)}s / ${Math.round(maxDuration)}s`,
      });
      
      requestAnimationFrame(drawFrame);
    } else {
      video.pause();
      recorder.stop();
    }
  };
  
  drawFrame();
  
  // Wait for recording to finish
  const blob = await new Promise<Blob>((resolve) => {
    recorder.onstop = () => {
      resolve(new Blob(chunks, { type: mimeType.split(';')[0] }));
    };
  });
  
  onProgress?.({ stage: 'complete', percent: 100, message: 'Compression complete!' });
  
  // Cleanup
  URL.revokeObjectURL(video.src);
  
  // Convert to data URL for storage
  const dataUrl = await blobToDataUrl(blob);
  
  return {
    blob,
    dataUrl,
    originalSize: file.size,
    compressedSize: blob.size,
    compressionRatio: file.size / blob.size,
    duration: maxDuration,
    width: targetWidth,
    height: targetHeight,
  };
};

/**
 * Convert Blob to data URL
 */
const blobToDataUrl = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

/**
 * Get accepted video formats string for file input
 */
export const getAcceptedVideoFormats = (): string => {
  return 'video/mp4,video/webm,video/quicktime,.mov,.mp4,.webm';
};
