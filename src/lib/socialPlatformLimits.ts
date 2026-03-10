/**
 * Platform-specific file size limits, format support, and dimension tolerances
 * for the Social Asset Studio analytics feature.
 */

export interface PlatformLimits {
  maxFileSize: number; // in MB
  supportedFormats: string[];
  dimensionTolerance: number; // percentage variance allowed (e.g., 10 = 10%)
  minResolution: { width: number; height: number };
  maxResolution?: { width: number; height: number };
  notes?: string;
}

export interface PlatformLimitsConfig {
  [platform: string]: {
    [format: string]: PlatformLimits;
    default: PlatformLimits;
  };
}

export const platformLimits: PlatformLimitsConfig = {
  Instagram: {
    default: {
      maxFileSize: 30,
      supportedFormats: ['image/jpeg', 'image/png', 'image/webp'],
      dimensionTolerance: 5,
      minResolution: { width: 320, height: 320 },
      maxResolution: { width: 1440, height: 1440 },
    },
    feed: {
      maxFileSize: 30,
      supportedFormats: ['image/jpeg', 'image/png', 'image/webp'],
      dimensionTolerance: 5,
      minResolution: { width: 1080, height: 566 },
      maxResolution: { width: 1440, height: 1800 },
      notes: 'Recommended 1080×1080 for square, 1080×1350 for portrait',
    },
    story: {
      maxFileSize: 30,
      supportedFormats: ['image/jpeg', 'image/png'],
      dimensionTolerance: 5,
      minResolution: { width: 1080, height: 1920 },
      notes: 'Full-screen 9:16 aspect ratio required',
    },
    reel: {
      maxFileSize: 30,
      supportedFormats: ['image/jpeg', 'image/png'],
      dimensionTolerance: 5,
      minResolution: { width: 1080, height: 1920 },
      notes: 'Cover image for Reels, 9:16 format',
    },
    profile: {
      maxFileSize: 10,
      supportedFormats: ['image/jpeg', 'image/png'],
      dimensionTolerance: 0,
      minResolution: { width: 320, height: 320 },
      maxResolution: { width: 320, height: 320 },
      notes: 'Circular crop, 320×320px',
    },
  },
  LinkedIn: {
    default: {
      maxFileSize: 10,
      supportedFormats: ['image/jpeg', 'image/png', 'image/gif'],
      dimensionTolerance: 10,
      minResolution: { width: 552, height: 276 },
    },
    feed: {
      maxFileSize: 10,
      supportedFormats: ['image/jpeg', 'image/png', 'image/gif'],
      dimensionTolerance: 10,
      minResolution: { width: 1200, height: 627 },
      maxResolution: { width: 4320, height: 4320 },
      notes: 'Recommended 1200×627 for link posts, 1080×1080 for image posts',
    },
    cover: {
      maxFileSize: 8,
      supportedFormats: ['image/jpeg', 'image/png'],
      dimensionTolerance: 5,
      minResolution: { width: 1584, height: 396 },
      notes: 'Banner: 1584×396px',
    },
    profile: {
      maxFileSize: 8,
      supportedFormats: ['image/jpeg', 'image/png'],
      dimensionTolerance: 0,
      minResolution: { width: 400, height: 400 },
      maxResolution: { width: 800, height: 800 },
    },
  },
  'X (Twitter)': {
    default: {
      maxFileSize: 5,
      supportedFormats: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      dimensionTolerance: 10,
      minResolution: { width: 600, height: 335 },
    },
    feed: {
      maxFileSize: 5,
      supportedFormats: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      dimensionTolerance: 10,
      minResolution: { width: 600, height: 335 },
      maxResolution: { width: 4096, height: 4096 },
      notes: 'Recommended 1600×900 (16:9). Max 5MB for images, 15MB for GIFs',
    },
    cover: {
      maxFileSize: 5,
      supportedFormats: ['image/jpeg', 'image/png'],
      dimensionTolerance: 5,
      minResolution: { width: 1500, height: 500 },
      notes: 'Header: 1500×500px',
    },
    profile: {
      maxFileSize: 2,
      supportedFormats: ['image/jpeg', 'image/png'],
      dimensionTolerance: 0,
      minResolution: { width: 400, height: 400 },
      maxResolution: { width: 400, height: 400 },
    },
  },
  Facebook: {
    default: {
      maxFileSize: 25,
      supportedFormats: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff'],
      dimensionTolerance: 10,
      minResolution: { width: 600, height: 315 },
    },
    feed: {
      maxFileSize: 25,
      supportedFormats: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      dimensionTolerance: 10,
      minResolution: { width: 1200, height: 630 },
      notes: 'Recommended 1200×630 for link shares, 1080×1080 for photos',
    },
    story: {
      maxFileSize: 25,
      supportedFormats: ['image/jpeg', 'image/png'],
      dimensionTolerance: 5,
      minResolution: { width: 1080, height: 1920 },
    },
    cover: {
      maxFileSize: 25,
      supportedFormats: ['image/jpeg', 'image/png'],
      dimensionTolerance: 5,
      minResolution: { width: 820, height: 312 },
      notes: 'Cover photo: 820×312px on desktop, 640×360px on mobile',
    },
    profile: {
      maxFileSize: 10,
      supportedFormats: ['image/jpeg', 'image/png'],
      dimensionTolerance: 0,
      minResolution: { width: 170, height: 170 },
      maxResolution: { width: 2048, height: 2048 },
    },
  },
  YouTube: {
    default: {
      maxFileSize: 6,
      supportedFormats: ['image/jpeg', 'image/png', 'image/gif', 'image/bmp'],
      dimensionTolerance: 5,
      minResolution: { width: 1280, height: 720 },
    },
    feed: {
      maxFileSize: 2,
      supportedFormats: ['image/jpeg', 'image/png'],
      dimensionTolerance: 5,
      minResolution: { width: 1280, height: 720 },
      notes: 'Custom thumbnail: 1280×720, must be under 2MB',
    },
    cover: {
      maxFileSize: 6,
      supportedFormats: ['image/jpeg', 'image/png'],
      dimensionTolerance: 5,
      minResolution: { width: 2560, height: 1440 },
      notes: 'Channel art: 2560×1440px. Safe area: 1546×423px center',
    },
    profile: {
      maxFileSize: 4,
      supportedFormats: ['image/jpeg', 'image/png'],
      dimensionTolerance: 0,
      minResolution: { width: 800, height: 800 },
    },
  },
  TikTok: {
    default: {
      maxFileSize: 10,
      supportedFormats: ['image/jpeg', 'image/png', 'image/webp'],
      dimensionTolerance: 5,
      minResolution: { width: 1080, height: 1920 },
    },
    feed: {
      maxFileSize: 10,
      supportedFormats: ['image/jpeg', 'image/png', 'image/webp'],
      dimensionTolerance: 5,
      minResolution: { width: 1080, height: 1920 },
      notes: '9:16 aspect ratio, carousel photo posts',
    },
    profile: {
      maxFileSize: 5,
      supportedFormats: ['image/jpeg', 'image/png'],
      dimensionTolerance: 0,
      minResolution: { width: 200, height: 200 },
    },
  },
  Pinterest: {
    default: {
      maxFileSize: 20,
      supportedFormats: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      dimensionTolerance: 10,
      minResolution: { width: 600, height: 900 },
    },
    feed: {
      maxFileSize: 20,
      supportedFormats: ['image/jpeg', 'image/png', 'image/webp'],
      dimensionTolerance: 10,
      minResolution: { width: 1000, height: 1500 },
      maxResolution: { width: 6000, height: 6000 },
      notes: 'Recommended 2:3 ratio (1000×1500). Max 20MB',
    },
    profile: {
      maxFileSize: 10,
      supportedFormats: ['image/jpeg', 'image/png'],
      dimensionTolerance: 0,
      minResolution: { width: 165, height: 165 },
    },
  },
  Threads: {
    default: {
      maxFileSize: 15,
      supportedFormats: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      dimensionTolerance: 10,
      minResolution: { width: 1080, height: 1080 },
    },
    feed: {
      maxFileSize: 15,
      supportedFormats: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      dimensionTolerance: 10,
      minResolution: { width: 1080, height: 1080 },
      notes: 'Same specs as Instagram. Square or portrait recommended',
    },
    profile: {
      maxFileSize: 10,
      supportedFormats: ['image/jpeg', 'image/png'],
      dimensionTolerance: 0,
      minResolution: { width: 320, height: 320 },
    },
  },
};

export function getPlatformLimits(platform: string, format: string): PlatformLimits {
  const platformConfig = platformLimits[platform];
  if (!platformConfig) {
    return {
      maxFileSize: 10,
      supportedFormats: ['image/jpeg', 'image/png'],
      dimensionTolerance: 10,
      minResolution: { width: 600, height: 600 },
    };
  }
  return platformConfig[format] || platformConfig.default;
}

export type AnalyticsStatus = 'pass' | 'warning' | 'fail';

export interface AnalyticsCheck {
  label: string;
  status: AnalyticsStatus;
  value: string;
  detail?: string;
}

export function analyzeAsset(
  imageUrl: string,
  platform: string,
  format: string,
  sizeSpec: { width: number; height: number; aspectRatio: string },
): Promise<AnalyticsCheck[]> {
  const limits = getPlatformLimits(platform, format);

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const checks: AnalyticsCheck[] = [];
      const w = img.naturalWidth;
      const h = img.naturalHeight;

      // Dimension check
      const widthOk = w >= sizeSpec.width * (1 - limits.dimensionTolerance / 100);
      const heightOk = h >= sizeSpec.height * (1 - limits.dimensionTolerance / 100);
      const exactMatch = w === sizeSpec.width && h === sizeSpec.height;
      const tooLarge = w > sizeSpec.width * 2 || h > sizeSpec.height * 2;

      checks.push({
        label: 'Dimensions',
        status: exactMatch ? 'pass' : widthOk && heightOk ? (tooLarge ? 'warning' : 'pass') : 'fail',
        value: `${w} × ${h}`,
        detail: exactMatch
          ? `Perfect match (${sizeSpec.width}×${sizeSpec.height})`
          : widthOk && heightOk
            ? tooLarge
              ? `Larger than needed (${sizeSpec.width}×${sizeSpec.height}), will be downscaled`
              : `Acceptable (target: ${sizeSpec.width}×${sizeSpec.height})`
            : `Below minimum (${sizeSpec.width}×${sizeSpec.height})`,
      });

      // Aspect ratio check
      const actualAr = w / h;
      const arParts = sizeSpec.aspectRatio.split(':').map(Number);
      const targetAr = arParts.length === 2 && arParts[1] ? arParts[0] / arParts[1] : 1;
      const arDiff = Math.abs(actualAr - targetAr) / targetAr;

      checks.push({
        label: 'Aspect Ratio',
        status: arDiff < 0.02 ? 'pass' : arDiff < 0.1 ? 'warning' : 'fail',
        value: `${(actualAr).toFixed(2)}:1`,
        detail: arDiff < 0.02
          ? `Matches ${sizeSpec.aspectRatio}`
          : arDiff < 0.1
            ? `Close to ${sizeSpec.aspectRatio}, may be cropped slightly`
            : `Doesn't match ${sizeSpec.aspectRatio}, significant cropping needed`,
      });

      // Resolution quality
      const megapixels = (w * h) / 1_000_000;
      const isLowRes = w < limits.minResolution.width || h < limits.minResolution.height;
      const isHighRes = limits.maxResolution && (w > limits.maxResolution.width || h > limits.maxResolution.height);

      checks.push({
        label: 'Resolution',
        status: isLowRes ? 'fail' : isHighRes ? 'warning' : 'pass',
        value: `${megapixels.toFixed(1)} MP`,
        detail: isLowRes
          ? `Below platform minimum (${limits.minResolution.width}×${limits.minResolution.height}). May appear blurry`
          : isHighRes
            ? `Exceeds recommended max. Will be compressed by platform`
            : 'Good quality for this platform',
      });

      resolve(checks);
    };

    img.onerror = () => {
      resolve([{
        label: 'Analysis',
        status: 'warning',
        value: 'Unable to load',
        detail: 'Could not analyze image dimensions',
      }]);
    };

    img.src = imageUrl;
  });
}

export function getFormatLabel(mimeType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'JPEG',
    'image/png': 'PNG',
    'image/webp': 'WebP',
    'image/gif': 'GIF',
    'image/bmp': 'BMP',
    'image/tiff': 'TIFF',
  };
  return map[mimeType] || mimeType;
}
