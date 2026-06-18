// Deterministic server-side SVG rendering using resvg-wasm.
// Renders an SVG URL at fixed dimensions over three background variants
// (transparent / white / black) and returns base64 PNGs, SHA-256 hashes,
// and a downsampled pixel "signature" used for client-side pixel diffs.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { Resvg, initWasm } from 'npm:@resvg/resvg-wasm@2.6.2';

const WASM_URL = 'https://esm.sh/@resvg/resvg-wasm@2.6.2/index_bg.wasm';
const RENDER_SIZE = 256; // square render box — fits most logos & keeps payload small
const SIG_SIZE = 16; // 16x16 grayscale signature for fuzzy diffing

let wasmReady: Promise<void> | null = null;
async function ensureWasm() {
  if (!wasmReady) {
    wasmReady = (async () => {
      const res = await fetch(WASM_URL);
      const buf = await res.arrayBuffer();
      await initWasm(buf);
    })();
  }
  return wasmReady;
}

function toBase64(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

interface Variant {
  pngBase64: string;
  sha256: string;
  signature: string; // base64 of 256-byte grayscale signature
  width: number;
  height: number;
}

function renderVariant(
  svgString: string,
  bg: 'transparent' | 'white' | 'black',
): { png: Uint8Array; pixels: Uint8Array; width: number; height: number } {
  const background =
    bg === 'transparent' ? 'rgba(0,0,0,0)' : bg === 'white' ? 'white' : 'black';
  const resvg = new Resvg(svgString, {
    background,
    fitTo: { mode: 'width', value: RENDER_SIZE },
    font: { loadSystemFonts: false },
  });
  const rendered = resvg.render();
  const png = rendered.asPng();
  const pixels = rendered.pixels; // RGBA
  const width = rendered.width;
  const height = rendered.height;
  rendered.free();
  resvg.free();
  return { png, pixels, width, height };
}

function buildSignature(
  pixels: Uint8Array,
  width: number,
  height: number,
): Uint8Array {
  // Downsample to SIG_SIZE x SIG_SIZE grayscale using box sampling.
  const sig = new Uint8Array(SIG_SIZE * SIG_SIZE);
  const cellW = width / SIG_SIZE;
  const cellH = height / SIG_SIZE;
  for (let sy = 0; sy < SIG_SIZE; sy++) {
    for (let sx = 0; sx < SIG_SIZE; sx++) {
      const x0 = Math.floor(sx * cellW);
      const y0 = Math.floor(sy * cellH);
      const x1 = Math.min(width, Math.floor((sx + 1) * cellW));
      const y1 = Math.min(height, Math.floor((sy + 1) * cellH));
      let sum = 0;
      let n = 0;
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const i = (y * width + x) * 4;
          const a = pixels[i + 3] / 255;
          // luminance, alpha-composited over mid-gray so transparency contributes
          const lum =
            0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
          sum += a * lum + (1 - a) * 128;
          n++;
        }
      }
      sig[sy * SIG_SIZE + sx] = n ? Math.round(sum / n) : 128;
    }
  }
  return sig;
}

async function buildVariant(
  svgString: string,
  bg: 'transparent' | 'white' | 'black',
): Promise<Variant> {
  const { png, pixels, width, height } = renderVariant(svgString, bg);
  const signature = buildSignature(pixels, width, height);
  return {
    pngBase64: toBase64(png),
    sha256: await sha256Hex(pixels),
    signature: toBase64(signature),
    width,
    height,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { url } = await req.json();
    if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) {
      return new Response(JSON.stringify({ error: 'Invalid url' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const fetchRes = await fetch(url, { redirect: 'follow' });
    if (!fetchRes.ok) {
      return new Response(
        JSON.stringify({ error: `Fetch failed: ${fetchRes.status}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    const svgString = await fetchRes.text();
    if (!/<svg[\s>]/i.test(svgString)) {
      return new Response(JSON.stringify({ error: 'Not an SVG document' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (svgString.length > 2_000_000) {
      return new Response(JSON.stringify({ error: 'SVG too large (>2MB)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    await ensureWasm();

    const [transparent, white, black] = await Promise.all([
      buildVariant(svgString, 'transparent'),
      buildVariant(svgString, 'white'),
      buildVariant(svgString, 'black'),
    ]);

    const fileUrlHash = await sha256Hex(new TextEncoder().encode(url));

    return new Response(
      JSON.stringify({
        url,
        fileUrlHash,
        renderSize: RENDER_SIZE,
        signatureSize: SIG_SIZE,
        variants: { transparent, white, black },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
