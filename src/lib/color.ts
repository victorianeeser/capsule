/** Colors pulled from clothing photos (Month → Colors, Outfit colors). */

import { SWATCH, type Item } from './types'

/** A piece's color for matching: its photo color, else its first color tag. */
export const itemHex = (i: Item): string | undefined => i.swatch ?? SWATCH[i.colors[0] ?? '']

/** How different two colors look (0 = same). "Redmean" weighting — close to how eyes compare colors, cheap to compute. */
export function colorDistance(a: string, b: string) {
  const p = (h: string) => [1, 3, 5].map((k) => parseInt(h.slice(k, k + 2), 16))
  const [r1, g1, b1] = p(a), [r2, g2, b2] = p(b)
  const rm = (r1 + r2) / 2, dr = r1 - r2, dg = g1 - g2, db = b1 - b2
  return Math.sqrt((2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db)
}

const hex = (r: number, g: number, b: number) => '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase()

/**
 * The main color of a cut-out piece: shrink the photo, ignore transparent pixels,
 * group the rest into coarse color buckets and average the biggest bucket.
 */
export async function dominantColor(blob: Blob): Promise<string | undefined> {
  const N = 40
  const bmp = await createImageBitmap(blob, { resizeWidth: N, resizeHeight: N, resizeQuality: 'medium' })
  const c = new OffscreenCanvas(N, N)
  const ctx = c.getContext('2d')!
  ctx.drawImage(bmp, 0, 0)
  bmp.close()
  const { data } = ctx.getImageData(0, 0, N, N)
  const buckets = new Map<number, { n: number; r: number; g: number; b: number }>()
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 200) continue
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]]
    const key = ((r >> 5) << 6) | ((g >> 5) << 3) | (b >> 5)
    const e = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0 }
    e.n++; e.r += r; e.g += g; e.b += b
    buckets.set(key, e)
  }
  let best: { n: number; r: number; g: number; b: number } | undefined
  for (const e of buckets.values()) if (!best || e.n > best.n) best = e
  return best ? hex(best.r / best.n, best.g / best.n, best.b / best.n) : undefined
}

/**
 * Eyedropper: the color under a tap inside an outfit collage.
 * Works on photos (reads the pixel) and on demo silhouettes (reads the shape's fill).
 * Returns undefined when the tap lands on empty space.
 */
export function colorAt(x: number, y: number): string | undefined {
  const el = document.elementFromPoint(x, y)
  if (!el) return
  if (el instanceof HTMLImageElement && el.naturalWidth) {
    const r = el.getBoundingClientRect()
    const px = Math.floor(((x - r.left) / r.width) * el.naturalWidth)
    const py = Math.floor(((y - r.top) / r.height) * el.naturalHeight)
    const c = document.createElement('canvas')
    c.width = 1; c.height = 1
    const ctx = c.getContext('2d', { willReadFrequently: true })!
    ctx.drawImage(el, px, py, 1, 1, 0, 0, 1, 1)
    const [rr, gg, bb, a] = ctx.getImageData(0, 0, 1, 1).data
    return a < 128 ? undefined : hex(rr, gg, bb)
  }
  const fill = el.getAttribute('fill')
  if (el instanceof SVGPathElement && fill?.startsWith('#')) return fill.toUpperCase()
}
