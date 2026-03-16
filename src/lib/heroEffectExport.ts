/**
 * heroEffectExport - Utilities to export hero background effects as PNG, WebM video, and animated GIF.
 *
 * PNG: Uses html2canvas to rasterise a DOM container.
 * Video: Uses MediaRecorder on a canvas fed by html2canvas frame captures.
 * GIF: Uses gifenc for lightweight, high-quality animated GIF encoding.
 */

import html2canvas from 'html2canvas';
import { GIFEncoder, quantize, applyPalette } from 'gifenc';
import { toast } from 'sonner';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface VideoRecordingState {
  isRecording: boolean;
  progress: number; // 0–100
}

export type IntroAnimationType = 
  | 'fade'          // opacity 0→1
  | 'scale-up'      // elements grow from center
  | 'scale-down'    // zoom out reveal (starts zoomed in)
  | 'slide-up'      // rise from bottom
  | 'slide-down'    // drop from top
  | 'slide-left'    // sweep from right
  | 'blur-fade'     // blur dissolve with fade
  | 'spiral-in'     // rotate + scale in
  | 'wipe-right'    // progressive reveal left→right
  | 'wipe-down'     // progressive reveal top→bottom
  | 'radial-reveal' // circular reveal from center
  | 'bounce-in';    // scale with overshoot bounce

export interface ExportOptions {
  format: 'png' | 'webm' | 'gif';
  resolution: '720p' | '1080p' | '1440p' | '4k' | 'custom';
  customWidth?: number;
  customHeight?: number;
  duration: number; // seconds (for video/gif)
  fps: number; // frames per second (for video/gif)
  loop: boolean; // GIF looping
  loopCount: number; // 0 = infinite, or specific count
  quality: 'draft' | 'standard' | 'high';
  introMode: boolean; // intro animation mode
  introAnimation: IntroAnimationType;
  introDuration: number; // intro duration in seconds
}

export const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
  format: 'gif',
  resolution: '1080p',
  duration: 5,
  fps: 15,
  loop: true,
  loopCount: 0,
  quality: 'standard',
  introMode: false,
  introAnimation: 'fade',
  introDuration: 2,
};

export const INTRO_ANIMATIONS: { id: IntroAnimationType; label: string; description: string; icon: string }[] = [
  { id: 'fade', label: 'Fade In', description: 'Smooth opacity transition', icon: '🌅' },
  { id: 'scale-up', label: 'Scale Up', description: 'Elements grow from center', icon: '🔍' },
  { id: 'scale-down', label: 'Zoom Reveal', description: 'Camera zooms out to reveal', icon: '🎬' },
  { id: 'slide-up', label: 'Rise Up', description: 'Elements float up into view', icon: '⬆️' },
  { id: 'slide-down', label: 'Drop In', description: 'Elements drop down from above', icon: '⬇️' },
  { id: 'slide-left', label: 'Sweep In', description: 'Scene sweeps in from right', icon: '➡️' },
  { id: 'blur-fade', label: 'Blur Dissolve', description: 'Blurred to sharp with fade', icon: '💫' },
  { id: 'spiral-in', label: 'Spiral In', description: 'Rotate and scale into place', icon: '🌀' },
  { id: 'wipe-right', label: 'Wipe Right', description: 'Progressive reveal left to right', icon: '▶️' },
  { id: 'wipe-down', label: 'Wipe Down', description: 'Progressive reveal top to bottom', icon: '🔽' },
  { id: 'radial-reveal', label: 'Radial Reveal', description: 'Circular reveal from center', icon: '⭕' },
  { id: 'bounce-in', label: 'Bounce In', description: 'Scale with elastic overshoot', icon: '🏀' },
];

function getResolutionDimensions(resolution: ExportOptions['resolution'], customW?: number, customH?: number): { w: number; h: number } {
  switch (resolution) {
    case '720p': return { w: 1280, h: 720 };
    case '1080p': return { w: 1920, h: 1080 };
    case '1440p': return { w: 2560, h: 1440 };
    case '4k': return { w: 3840, h: 2160 };
    case 'custom': return { w: customW || 1920, h: customH || 1080 };
    default: return { w: 1920, h: 1080 };
  }
}

function getScaleForQuality(quality: ExportOptions['quality']): number {
  switch (quality) {
    case 'draft': return 1;
    case 'standard': return 1.5;
    case 'high': return 2;
    default: return 1.5;
  }
}

// ─── PNG Export ──────────────────────────────────────────────────────────────

export async function captureEffectAsPng(
  container: HTMLElement,
  fileName: string,
  options?: Partial<ExportOptions>
): Promise<void> {
  const toastId = toast.loading('Capturing effect as PNG…');
  try {
    const scale = options?.quality ? getScaleForQuality(options.quality) : 2;
    const canvas = await html2canvas(container, {
      backgroundColor: null,
      scale,
      useCORS: true,
      logging: false,
      width: container.offsetWidth,
      height: container.offsetHeight,
    });

    canvas.toBlob((blob) => {
      if (!blob) {
        toast.error('Failed to generate image', { id: toastId });
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('PNG downloaded — use as a PowerPoint slide background', { id: toastId });
    }, 'image/png');
  } catch (err) {
    console.error('[heroEffectExport] PNG capture failed:', err);
    toast.error('PNG capture failed', { id: toastId });
  }
}

// ─── Video (WebM) Export ─────────────────────────────────────────────────────

export async function recordEffectAsVideo(
  container: HTMLElement,
  fileName: string,
  durationMs = 5000,
  onProgress?: (state: VideoRecordingState) => void,
  options?: Partial<ExportOptions>
): Promise<void> {
  const toastId = toast.loading('Recording effect video…');

  try {
    const fps = options?.fps || 15;
    const duration = options?.duration ? options.duration * 1000 : durationMs;
    const totalFrames = Math.ceil((duration / 1000) * fps);
    const frameInterval = duration / totalFrames;
    const scale = options?.quality ? getScaleForQuality(options.quality) : 2;

    const w = container.offsetWidth;
    const h = container.offsetHeight;
    const offscreen = document.createElement('canvas');
    offscreen.width = w * scale;
    offscreen.height = h * scale;
    const ctx = offscreen.getContext('2d')!;

    const stream = offscreen.captureStream(0);
    const recorder = new MediaRecorder(stream, {
      mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm',
      videoBitsPerSecond: options?.quality === 'high' ? 8_000_000 : 5_000_000,
    });

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.start();

    for (let i = 0; i < totalFrames; i++) {
      const progress = Math.round(((i + 1) / totalFrames) * 100);
      onProgress?.({ isRecording: true, progress });
      toast.loading(`Recording… ${progress}%`, { id: toastId });

      const frameCanvas = await html2canvas(container, {
        backgroundColor: null,
        scale,
        useCORS: true,
        logging: false,
        width: w,
        height: h,
      });

      // Apply intro fade if enabled
      ctx.clearRect(0, 0, offscreen.width, offscreen.height);
      if (options?.introMode) {
        const introFrames = Math.ceil(((options.introDuration || 2) / (duration / 1000)) * totalFrames);
        const opacity = i < introFrames ? Math.min(1, i / introFrames) : 1;
        ctx.globalAlpha = opacity;
      } else {
        ctx.globalAlpha = 1;
      }
      ctx.drawImage(frameCanvas, 0, 0, offscreen.width, offscreen.height);
      ctx.globalAlpha = 1;

      const track = stream.getVideoTracks()[0] as any;
      if (track?.requestFrame) track.requestFrame();

      await new Promise((r) => setTimeout(r, frameInterval));
    }

    await new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
      recorder.stop();
    });

    onProgress?.({ isRecording: false, progress: 100 });

    const blob = new Blob(chunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Video downloaded — insert as PowerPoint video background', { id: toastId });
  } catch (err) {
    console.error('[heroEffectExport] Video recording failed:', err);
    onProgress?.({ isRecording: false, progress: 0 });
    toast.error('Video recording failed. Try the PNG option instead.', { id: toastId });
  }
}

// ─── GIF Export ──────────────────────────────────────────────────────────────

export async function recordEffectAsGif(
  container: HTMLElement,
  fileName: string,
  onProgress?: (state: VideoRecordingState) => void,
  options?: Partial<ExportOptions>
): Promise<void> {
  const toastId = toast.loading('Encoding animated GIF…');

  try {
    const fps = options?.fps || 12;
    const duration = (options?.duration || 3) * 1000;
    const totalFrames = Math.ceil((duration / 1000) * fps);
    const frameDelay = Math.round(1000 / fps); // ms per frame
    const loop = options?.loop !== false;
    const loopCount = options?.loopCount ?? 0; // 0 = infinite

    // GIF resolution — scale down for file size
    const qualityScale = options?.quality === 'high' ? 1 : options?.quality === 'draft' ? 0.5 : 0.75;
    const captureW = container.offsetWidth;
    const captureH = container.offsetHeight;
    const gifW = Math.round(captureW * qualityScale);
    const gifH = Math.round(captureH * qualityScale);

    const gif = GIFEncoder();

    // Temp canvas for scaling frames
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = gifW;
    tempCanvas.height = gifH;
    const tempCtx = tempCanvas.getContext('2d')!;

    for (let i = 0; i < totalFrames; i++) {
      const progress = Math.round(((i + 1) / totalFrames) * 100);
      onProgress?.({ isRecording: true, progress });
      toast.loading(`Encoding GIF… ${progress}%`, { id: toastId });

      // Capture frame from DOM
      const frameCanvas = await html2canvas(container, {
        backgroundColor: '#000000',
        scale: 1,
        useCORS: true,
        logging: false,
        width: captureW,
        height: captureH,
      });

      // Scale to GIF dimensions
      tempCtx.clearRect(0, 0, gifW, gifH);

      // Apply intro fade if enabled
      if (options?.introMode) {
        const introFrames = Math.ceil(((options.introDuration || 2) / (duration / 1000)) * totalFrames);
        const opacity = i < introFrames ? Math.min(1, i / introFrames) : 1;
        // Draw black background first
        tempCtx.fillStyle = '#000000';
        tempCtx.fillRect(0, 0, gifW, gifH);
        tempCtx.globalAlpha = opacity;
      }

      tempCtx.drawImage(frameCanvas, 0, 0, gifW, gifH);
      tempCtx.globalAlpha = 1;

      // Get pixel data and quantize
      const imageData = tempCtx.getImageData(0, 0, gifW, gifH);
      const { data } = imageData;

      // Convert to RGBA Uint8Array
      const rgba = new Uint8Array(data.buffer);

      // Quantize to 256 colors
      const palette = quantize(rgba, 256, { format: 'rgba4444' });
      const indexed = applyPalette(rgba, palette, 'rgba4444');

      gif.writeFrame(indexed, gifW, gifH, {
        palette,
        delay: frameDelay,
        repeat: loop ? loopCount : -1, // -1 = no repeat
      });

      // Let the animation advance
      await new Promise((r) => setTimeout(r, frameDelay));
    }

    gif.finish();

    onProgress?.({ isRecording: false, progress: 100 });

    const blob = new Blob([gif.bytes()], { type: 'image/gif' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.gif`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    const sizeMB = (blob.size / (1024 * 1024)).toFixed(1);
    toast.success(`Animated GIF downloaded (${sizeMB} MB) — ${loop ? 'loops' : 'plays once'}`, { id: toastId });
  } catch (err) {
    console.error('[heroEffectExport] GIF encoding failed:', err);
    onProgress?.({ isRecording: false, progress: 0 });
    toast.error('GIF encoding failed. Try the video option instead.', { id: toastId });
  }
}
