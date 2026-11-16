/** Photo processing: shrink, then cut the clothing out of its background (in the browser). */

const MAX = 900

/** Downscale a photo so stored images stay small. Returns WebP (keeps transparency). */
export async function shrink(file: Blob, max = MAX): Promise<Blob> {
  const bmp = await createImageBitmap(file)
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height))
  const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale)
  const canvas = new OffscreenCanvas(w, h)
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, w, h)
  bmp.close()
  return canvas.convertToBlob({ type: 'image/webp', quality: 0.86 })
}

/**
 * Already cut out? True when a meaningful share of the picture is transparent
 * (your own transparent PNGs, or WebP/AVIF with an alpha channel). JPEGs never are.
 */
export async function hasTransparency(blob: Blob): Promise<boolean> {
  if (/jpe?g/i.test(blob.type)) return false
  const N = 64
  const bmp = await createImageBitmap(blob, { resizeWidth: N, resizeHeight: N, resizeQuality: 'low' })
  const c = new OffscreenCanvas(N, N)
  const ctx = c.getContext('2d')!
  ctx.drawImage(bmp, 0, 0)
  bmp.close()
  const { data } = ctx.getImageData(0, 0, N, N)
  let clear = 0
  for (let i = 3; i < data.length; i += 4) if (data[i] < 240) clear++
  return clear / (N * N) > 0.03
}

/** For photos you cut out yourself: just shrink and crop to the piece — edges are left untouched. */
export async function prepareCutout(blob: Blob): Promise<Blob> {
  return trim(await shrink(blob), false)
}

/** Trim transparent edges so the garment fills its tile. `clean` also removes faint specks (for auto cut-outs). */
async function trim(blob: Blob, clean = true): Promise<Blob> {
  const bmp = await createImageBitmap(blob)
  const c = new OffscreenCanvas(bmp.width, bmp.height)
  const ctx = c.getContext('2d')!
  ctx.drawImage(bmp, 0, 0)
  const img = ctx.getImageData(0, 0, c.width, c.height)
  const { data, width, height } = img
  if (clean) {
    // Clear faint leftovers (specks of floor or wall the model wasn't sure about).
    for (let i = 3; i < data.length; i += 4) if (data[i] < 150) data[i] = 0
    ctx.putImageData(img, 0, 0)
  }
  // Crop to the garment: rows/columns with a meaningful number of solid pixels.
  const rows = new Array(height).fill(0), cols = new Array(width).fill(0)
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) if (data[(y * width + x) * 4 + 3] > 160) { rows[y]++; cols[x]++ }
  const minRun = 3
  let y0 = rows.findIndex((n) => n >= minRun), y1 = height - 1 - [...rows].reverse().findIndex((n) => n >= minRun)
  let x0 = cols.findIndex((n) => n >= minRun), x1 = width - 1 - [...cols].reverse().findIndex((n) => n >= minRun)
  if (y0 < 0 || x0 < 0 || x1 <= x0 || y1 <= y0) return c.convertToBlob({ type: 'image/webp', quality: 0.9 })
  const pad = 10
  x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(width, x1 + pad); y1 = Math.min(height, y1 + pad)
  const out = new OffscreenCanvas(x1 - x0, y1 - y0)
  out.getContext('2d')!.drawImage(c, x0, y0, x1 - x0, y1 - y0, 0, 0, x1 - x0, y1 - y0)
  bmp.close()
  return out.convertToBlob({ type: 'image/webp', quality: 0.9 })
}

let lib: Promise<typeof import('@imgly/background-removal')> | null = null
/** Use the graphics chip (WebGPU) when the browser offers one; fall back to the CPU if it fails. */
let useGpu: boolean | null = null
async function gpuAvailable() {
  if (useGpu !== null) return useGpu
  try { if (localStorage.getItem('capsule:gpu') === 'off') return (useGpu = false) } catch { /* private mode */ }
  const gpu = (navigator as Navigator & { gpu?: { requestAdapter(): Promise<unknown> } }).gpu
  try { useGpu = !!gpu && !!(await gpu.requestAdapter()) } catch { useGpu = false }
  return useGpu
}

/** First call downloads the cut-out model (~40 MB, cached by the browser afterwards). */
export async function cutOut(blob: Blob, onProgress?: (pct: number) => void): Promise<Blob> {
  lib ??= import('@imgly/background-removal')
  const { removeBackground } = await lib
  const run = (device: 'gpu' | 'cpu') => removeBackground(blob, {
    // The GPU path needs the full-precision model; the CPU path uses the smaller quantized one.
    model: device === 'gpu' ? 'isnet_fp16' : 'isnet_quint8',
    device,
    output: { format: 'image/webp', quality: 0.9 },
    progress: (_key, cur, total) => { activity?.(); onProgress?.(total ? cur / total : 0) },
  })
  let out: Blob
  if (await gpuAvailable()) {
    try { out = await withWatchdog(run, 'gpu') } catch (e) { console.warn('GPU cut-out failed, using CPU', e); useGpu = false; try { localStorage.setItem('capsule:gpu', 'off') } catch { /* ignore */ } out = await run('cpu') }
  } else out = await run('cpu')
  return trim(await shrink(out))
}

/**
 * Some browsers expose a graphics chip but never finish the job on it. Give up if nothing
 * happens for 25 s (model download progress counts as activity), and use the CPU from then on.
 */
function withWatchdog(run: (d: 'gpu') => Promise<Blob>, d: 'gpu'): Promise<Blob> {
  return new Promise((resolve, reject) => {
    let timer = setTimeout(() => reject(new Error('GPU stalled')), 25000)
    const poke = () => { clearTimeout(timer); timer = setTimeout(() => reject(new Error('GPU stalled')), 25000) }
    activity = poke
    run(d).then(resolve, reject).finally(() => { clearTimeout(timer); activity = undefined })
  })
}
let activity: (() => void) | undefined
