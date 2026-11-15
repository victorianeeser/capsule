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

/** Trim transparent edges so the garment fills its tile. */
async function trim(blob: Blob): Promise<Blob> {
  const bmp = await createImageBitmap(blob)
  const c = new OffscreenCanvas(bmp.width, bmp.height)
  const ctx = c.getContext('2d')!
  ctx.drawImage(bmp, 0, 0)
  const img = ctx.getImageData(0, 0, c.width, c.height)
  const { data, width, height } = img
  // Clear faint leftovers (specks of floor or wall the model wasn't sure about).
  for (let i = 3; i < data.length; i += 4) if (data[i] < 150) data[i] = 0
  ctx.putImageData(img, 0, 0)
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
/** First call downloads the cut-out model (~40 MB, cached by the browser afterwards). */
export async function cutOut(blob: Blob, onProgress?: (pct: number) => void): Promise<Blob> {
  lib ??= import('@imgly/background-removal')
  const { removeBackground } = await lib
  const out = await removeBackground(blob, {
    model: 'isnet_quint8',
    output: { format: 'image/webp', quality: 0.9 },
    progress: (_key, cur, total) => onProgress?.(total ? cur / total : 0),
  })
  return trim(await shrink(out))
}
