/**
 * boothExporter.ts - Export Three.js booth scene to GLB/USDZ formats
 * Uses Three.js addon exporters for standards-compliant 3D file output
 */
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { USDZExporter } from 'three/examples/jsm/exporters/USDZExporter.js';

export interface ExportOptions {
  /** Include booth panels/walls */
  includePanels: boolean;
  /** Include furniture assets */
  includeFurniture: boolean;
  /** Include people/character sprites */
  includePeople: boolean;
  /** Include floor pad */
  includeFloor: boolean;
  /** Include environment (expo hall) */
  includeEnvironment: boolean;
  /** File name prefix */
  fileName?: string;
}

const DEFAULT_OPTIONS: ExportOptions = {
  includePanels: true,
  includeFurniture: true,
  includePeople: false,
  includeFloor: true,
  includeEnvironment: false,
  fileName: 'booth-3d',
};

/**
 * Filter scene by user-selected content layers.
 * Clones the scene and removes unwanted groups by name convention.
 */
function filterScene(scene: THREE.Scene, options: ExportOptions): THREE.Scene {
  const clone = scene.clone(true);

  clone.traverse((obj) => {
    const name = (obj.name || '').toLowerCase();

    // Tag objects for removal based on options
    let shouldRemove = false;

    if (!options.includePanels && (name.includes('panel') || name.includes('booth-wall'))) {
      shouldRemove = true;
    }
    if (!options.includeFurniture && (name.includes('furniture') || name.includes('table') || name.includes('chair') || name.includes('monitor') || name.includes('asset-'))) {
      shouldRemove = true;
    }
    if (!options.includePeople && (name.includes('people') || name.includes('character') || name.includes('billboard') || name.includes('figure') || name.includes('sprite'))) {
      shouldRemove = true;
    }
    if (!options.includeFloor && (name.includes('floor') || name.includes('floorpad') || name.includes('carpet'))) {
      shouldRemove = true;
    }
    if (!options.includeEnvironment && (name.includes('environment') || name.includes('expo') || name.includes('hall') || name.includes('grid'))) {
      shouldRemove = true;
    }

    // Also remove helpers, lights for cleaner export
    if (obj instanceof THREE.GridHelper || obj instanceof THREE.AxesHelper) {
      shouldRemove = true;
    }

    if (shouldRemove) {
      obj.visible = false;
    }
  });

  return clone;
}

/**
 * Export scene to GLB (binary glTF) format
 */
export async function exportToGLB(
  scene: THREE.Scene,
  options: Partial<ExportOptions> = {}
): Promise<Blob> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const filtered = filterScene(scene, opts);

  const exporter = new GLTFExporter();

  return new Promise((resolve, reject) => {
    exporter.parse(
      filtered,
      (result) => {
        if (result instanceof ArrayBuffer) {
          resolve(new Blob([result], { type: 'model/gltf-binary' }));
        } else {
          // JSON output - convert to blob
          const jsonStr = JSON.stringify(result);
          resolve(new Blob([jsonStr], { type: 'model/gltf+json' }));
        }
      },
      (error) => reject(error),
      {
        binary: true,
        onlyVisible: true,
        maxTextureSize: 2048,
      }
    );
  });
}

/**
 * Export scene to USDZ format (Apple AR Quick Look)
 */
export async function exportToUSDZ(
  scene: THREE.Scene,
  options: Partial<ExportOptions> = {}
): Promise<Blob> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const filtered = filterScene(scene, opts);

  const exporter = new USDZExporter();
  const result = await (exporter as any).parse(filtered);
  const buffer = result instanceof ArrayBuffer ? result : new Uint8Array(0);
  return new Blob([buffer], { type: 'model/vnd.usdz+zip' });
}

/**
 * Trigger download of a blob
 */
export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate a data URL for a GLB blob to use in model-viewer
 */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
