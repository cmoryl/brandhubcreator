/**
 * Generate a thumbnail image from a PDF file or URL using pdf.js
 */

export async function generatePdfThumbnail(
  source: File | string,
  maxWidth = 600
): Promise<Blob | null> {
  try {
    const pdfjsLib = await import('pdfjs-dist');
    
    // Set worker source
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

    let loadingTask;
    if (source instanceof File) {
      const arrayBuffer = await source.arrayBuffer();
      loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    } else {
      loadingTask = pdfjsLib.getDocument(source);
    }

    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);

    const viewport = page.getViewport({ scale: 1 });
    const scale = maxWidth / viewport.width;
    const scaledViewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = scaledViewport.width;
    canvas.height = scaledViewport.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise;

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => resolve(blob),
        'image/jpeg',
        0.85
      );
    });
  } catch (err) {
    console.error('Failed to generate PDF thumbnail:', err);
    return null;
  }
}
