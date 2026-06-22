import JSZip from 'jszip';
import { toast } from 'sonner';
import type { ClientLogoFile } from '@/types/brand';

export const slugifyLogoName = (s: string): string =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'logo';

const extFromUrl = (url: string, fallback?: string): string => {
  try {
    const p = new URL(url, window.location.origin).pathname;
    const m = p.match(/\.([a-z0-9]+)$/i);
    if (m) return m[1].toLowerCase();
  } catch {
    /* noop */
  }
  return (fallback || 'png').toLowerCase();
};

export const buildLogoFileName = (
  logoName: string,
  file: ClientLogoFile,
  used?: Set<string>,
): string => {
  const slug = slugifyLogoName(logoName);
  const lockup = file.lockup || 'icon';
  const variant = file.variant;
  const ext = extFromUrl(file.url, file.format);
  let base = `${slug}-${lockup}-${variant}.${ext}`;
  if (!used) return base;
  let i = 2;
  while (used.has(base)) {
    base = `${slug}-${lockup}-${variant}-${i}.${ext}`;
    i += 1;
  }
  used.add(base);
  return base;
};

const fetchAsBlob = async (
  url: string,
): Promise<{ blob: Blob | null; base64?: string }> => {
  if (url.startsWith('data:')) {
    const b64 = url.split(',')[1];
    return { blob: null, base64: b64 };
  }
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) throw new Error(String(res.status));
    return { blob: await res.blob() };
  } catch {
    return { blob: null };
  }
};

/**
 * Download a single logo's files as a ZIP. Visual + naming parity with Logo Hub.
 */
export async function downloadLogoZip(
  logoName: string,
  files: ClientLogoFile[],
): Promise<void> {
  if (!files.length) {
    toast.error('No files to download');
    return;
  }
  const zip = new JSZip();
  const folder = zip.folder(slugifyLogoName(logoName))!;
  const used = new Set<string>();
  const toastId = `zip-${logoName}`;
  toast.loading(`Packaging ${files.length} files…`, { id: toastId });

  let ok = 0;
  for (const f of files) {
    const name = buildLogoFileName(logoName, f, used);
    const { blob, base64 } = await fetchAsBlob(f.url);
    if (blob) {
      folder.file(name, blob);
      ok += 1;
    } else if (base64) {
      folder.file(name, base64, { base64: true });
      ok += 1;
    }
  }
  if (!ok) {
    toast.error('Could not fetch any files', { id: toastId });
    return;
  }
  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${slugifyLogoName(logoName)}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast.success(`Downloaded ${ok} file${ok !== 1 ? 's' : ''}`, { id: toastId });
}

/**
 * Download many logos as a single multi-folder ZIP. One folder per logo.
 */
export async function downloadManyLogosZip(
  logos: Array<{ name: string; files: ClientLogoFile[] }>,
  zipName = 'client-logos.zip',
): Promise<void> {
  const all = logos.filter((l) => (l.files || []).length > 0);
  if (!all.length) {
    toast.error('No files to download');
    return;
  }
  const zip = new JSZip();
  const toastId = 'zip-many';
  toast.loading('Creating ZIP file…', { id: toastId });

  let ok = 0;
  for (const logo of all) {
    const folder = zip.folder(slugifyLogoName(logo.name))!;
    const used = new Set<string>();
    for (const f of logo.files) {
      const name = buildLogoFileName(logo.name, f, used);
      const { blob, base64 } = await fetchAsBlob(f.url);
      if (blob) {
        folder.file(name, blob);
        ok += 1;
      } else if (base64) {
        folder.file(name, base64, { base64: true });
        ok += 1;
      }
    }
  }
  if (!ok) {
    toast.error('Could not fetch any files', { id: toastId });
    return;
  }
  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = zipName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast.success(`Downloaded ${ok} file${ok !== 1 ? 's' : ''}`, { id: toastId });
}

/**
 * Download a single file with Hub-style naming.
 */
export function downloadLogoFile(logoName: string, file: ClientLogoFile): void {
  const name = buildLogoFileName(logoName, file);
  const a = document.createElement('a');
  a.href = file.url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
