import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ensureImageUrl, imageUrl, onImageChange } from './lib/db'
import { KIND_FOR, type Item, type Placed } from './lib/types'
import { Garment, Icon } from './ui'
import { useStore } from './lib/store'

/** Loads a stored photo as an object URL (re-renders when the photo is replaced, e.g. after background removal). */
export function useImage(id?: string) {
  const [url, setUrl] = useState(id ? imageUrl(id) : undefined)
  useEffect(() => {
    if (!id) return
    let live = true
    const load = () => ensureImageUrl(id).then((u) => live && setUrl(u))
    load()
    const off = onImageChange(id, load)
    return () => { live = false; off() }
  }, [id])
  return url
}

/** A clothing piece: its photo if there is one, otherwise a silhouette. */
export function ItemImage({ item, size, className = '' }: { item: Item; size: number; className?: string }) {
  const url = useImage(item.imageId)
  if (item.imageId) {
    return (
      <span className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
        {url && <img src={url} alt={item.name} draggable={false} className="max-h-full max-w-full object-contain" />}
        {item.processing && (size >= 70
          ? <span className="absolute inset-x-0 bottom-0 rounded-full bg-bg/85 px-1.5 py-0.5 text-center text-[10px] font-medium">Cutting out…</span>
          : <span className="absolute top-0 right-0 h-2 w-2 animate-pulse rounded-full bg-weather" aria-label="Cutting out" />)}
      </span>
    )
  }
  return <Garment kind={item.demoKind ?? KIND_FOR[item.category]} size={size} className={className} />
}

/** Auto-arranged outfit collage (or a saved canvas layout) inside a fixed box. */
const AUTO: Record<number, [number, number, number][]> = {
  1: [[60, 40, 180]],
  2: [[30, 40, 160], [160, 150, 120]],
  3: [[20, 40, 140], [150, 90, 150], [40, 190, 100]],
  4: [[14, 46, 140], [150, 48, 124], [140, 150, 140], [36, 196, 96]],
  5: [[14, 46, 130], [150, 40, 116], [140, 150, 130], [30, 196, 92], [200, 10, 60]],
}
const ORDER = ['outerwear', 'top', 'dress', 'bottom', 'shoes', 'accessory']
export function autoLayout(items: Item[]): Placed[] {
  const sorted = [...items].sort((a, b) => ORDER.indexOf(a.category) - ORDER.indexOf(b.category))
  const pos = AUTO[Math.min(sorted.length, 5)] ?? AUTO[5]
  return sorted.slice(0, 6).map((it, i) => ({ itemId: it.id, x: pos[i % pos.length][0] + (i >= 5 ? 20 : 0), y: pos[i % pos.length][1], s: pos[i % pos.length][2] }))
}
/**
 * Outfit collage that fits any arrangement (auto or saved from the Canvas) into a box,
 * keeping the arrangement's proportions and centering it.
 */
export function Collage({ itemIds, layout, scale = 1, width = 300, height = 290, top = 48 }: { itemIds: string[]; layout?: Placed[]; scale?: number; width?: number; height?: number; top?: number }) {
  const { state } = useStore()
  const items = itemIds.map((id) => state.items.find((i) => i.id === id)).filter(Boolean) as Item[]
  const saved = layout?.filter((p) => items.some((i) => i.id === p.itemId)) ?? []
  const pl = [...saved, ...autoLayout(items.filter((i) => !saved.some((p) => p.itemId === i.id)))]
  if (!pl.length) return null
  const x0 = Math.min(...pl.map((p) => p.x)), y0 = Math.min(...pl.map((p) => p.y))
  const x1 = Math.max(...pl.map((p) => p.x + p.s)), y1 = Math.max(...pl.map((p) => p.y + p.s))
  const boxW = width - 24, boxH = height - top
  const k = Math.min(boxW / (x1 - x0), boxH / (y1 - y0), 1.4) * scale
  const offX = (width - (x1 - x0) * k) / 2, offY = top + (boxH - (y1 - y0) * k) / 2
  return (
    <>
      {pl.map((p) => {
        const it = items.find((i) => i.id === p.itemId)!
        return (
          <span key={p.itemId} className="absolute" style={{ left: offX + (p.x - x0) * k, top: offY + (p.y - y0) * k }}>
            <ItemImage item={it} size={p.s * k} />
          </span>
        )
      })}
    </>
  )
}

/** Row of small thumbnails (Home peek cards, Plan the week, Month). */
export function Thumbs({ itemIds, size = 30, max = 4, bg = true }: { itemIds: string[]; size?: number; max?: number; bg?: boolean }) {
  const { state } = useStore()
  const items = itemIds.map((id) => state.items.find((i) => i.id === id)).filter(Boolean).slice(0, max) as Item[]
  return (
    <div className={`flex items-center ${bg ? 'rounded-[10px] bg-cloud p-1' : ''}`}>
      {items.length ? items.map((it) => <ItemImage key={it.id} item={it} size={size} />) : <span className="text-[12px] text-text/45" style={{ height: size, lineHeight: `${size}px` }}>—</span>}
    </div>
  )
}

/** Hidden file input + trigger. `camera` opens the phone camera directly. */
export function PhotoPicker({ onFiles, multiple = true, camera = false, children, className = '' }: { onFiles: (f: File[]) => void; multiple?: boolean; camera?: boolean; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <>
      <input ref={ref} type="file" accept="image/*" multiple={multiple} {...(camera ? { capture: 'environment' } : {})} className="hidden"
        onChange={(e) => { const f = Array.from(e.target.files ?? []); e.target.value = ''; if (f.length) onFiles(f) }} />
      <button type="button" onClick={() => ref.current?.click()} className={className}>{children}</button>
    </>
  )
}

export function Empty({ icon = 'hanger', title, body, action }: { icon?: string; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg bg-surface px-6 py-8 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-soft"><Icon name={icon} /></span>
      <p className="text-[16px] font-semibold">{title}</p>
      <p className="text-[13px] leading-[1.4] text-text/65">{body}</p>
      {action && <div className="mt-2 w-full">{action}</div>}
    </div>
  )
}

/** Background-removal progress, shown while photos are being cut out. */
export function QueueBanner() {
  const { queue } = useStore()
  if (queue.done >= queue.total) return null
  const firstRun = queue.done === 0 && queue.modelPct < 1
  return (
    <p className="rounded-[10px] bg-soft px-3.5 py-2.5 text-[13px] font-medium">
      Removing backgrounds · {queue.done} of {queue.total}
      {firstRun && queue.modelPct > 0 ? ` · first-time setup ${Math.round(queue.modelPct * 100)}%` : ''}
    </p>
  )
}
