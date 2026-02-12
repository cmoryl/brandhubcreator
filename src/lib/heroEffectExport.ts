/**
 * heroEffectExport - Utilities to export hero background effects as PNG images
 * and WebM videos for PowerPoint integration.
 *
 * PNG: Uses html2canvas to rasterise a DOM container at 1920×1080.
 * Video: Uses MediaRecorder on a canvas fed by html2canvas frame captures.
 */

import html2canvas from 'html2canvas';
import { toast } from 'sonner';

// ─── PNG Export ──────────────────────────────────────────────────────────────

export async function captureEffectAsPng(
  container: HTMLElement,
  fileName: string
): Promise<void> {
  const toastId = toast.loading('Capturing effect as PNG…');
  try {
    const canvas = await html2canvas(container, {
      backgroundColor: null,
      scale: 2, // high-res
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

export interface VideoRecordingState {
  isRecording: boolean;
  progress: number; // 0–100
}

/**
 * Records the given DOM element as a WebM video (5 seconds, ~15 fps).
 * Uses html2canvas per-frame → draws to an offscreen canvas → MediaRecorder.
 *
 * Modern PowerPoint (2016+) supports WebM. For older versions users can convert
 * to MP4 with any free tool.
 */
export async function recordEffectAsVideo(
  container: HTMLElement,
  fileName: string,
  durationMs = 5000,
  onProgress?: (state: VideoRecordingState) => void
): Promise<void> {
  const toastId = toast.loading('Recording effect video (5s)…');

  try {
    const fps = 15;
    const totalFrames = Math.ceil((durationMs / 1000) * fps);
    const frameInterval = durationMs / totalFrames;

    // Create offscreen canvas at capture size
    const w = container.offsetWidth;
    const h = container.offsetHeight;
    const offscreen = document.createElement('canvas');
    offscreen.width = w * 2; // 2x for quality
    offscreen.height = h * 2;
    const ctx = offscreen.getContext('2d')!;

    // Use canvas stream for MediaRecorder
    const stream = offscreen.captureStream(0); // manual frame push
    const recorder = new MediaRecorder(stream, {
      mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm',
      videoBitsPerSecond: 5_000_000,
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

      // Capture current frame
      const frameCanvas = await html2canvas(container, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        logging: false,
        width: w,
        height: h,
      });

      ctx.clearRect(0, 0, offscreen.width, offscreen.height);
      ctx.drawImage(frameCanvas, 0, 0, offscreen.width, offscreen.height);

      // Push frame to stream
      const track = stream.getVideoTracks()[0] as any;
      if (track?.requestFrame) {
        track.requestFrame();
      }

      // Wait for next frame timing
      await new Promise((r) => setTimeout(r, frameInterval));
    }

    // Stop and download
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
