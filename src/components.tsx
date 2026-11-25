import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ensureImageUrl, imageUrl, loadImage, onImageChange } from './lib/db'
import { dominantColor } from './lib/color'
import { KIND_FOR, type Item, type Placed } from './lib/types'
import { Garment, Icon } from './ui'
import { Link } from 'react-router'
import { useStore } from './lib/store'
import { toast } from './lib/toast'

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

/**
 * Auto-arranged outfits (suggestions, and outfits nobody arranged on the Canvas).
 * Clothes go in the main slots; shoes are always shown as a pair — the piece plus a flipped copy,
 * stacked under the top in the left column (the arrangement people make by hand on the Canvas).
 * Each entry is [x, y, size] in canvas units; Collage scales the whole thing to fit its box.
 */
type Slot = [number, number, number]
const CLOTHES: Record<number, Slot[]> = {
  0: [],
  1: [[20, 20, 180]],                                                   // dress
  2: [[20, 30, 150], [175, 90, 160]],                                   // top · bottom
  3: [[10, 30, 140], [155, 20, 130], [160, 140, 140]],                  // outer · top · bottom
  4: [[10, 30, 130], [150, 10, 110], [155, 115, 140], [270, 20, 60]],   // outer · sweater/top · bottom · accessory
}
/** Where the shoe pair sits for each number of clothing pieces (second shoe = flipped copy just below). */
const SHOES: Record<number, Slot> = { 0: [60, 40, 140], 1: [205, 140, 100], 2: [40, 190, 100], 3: [25, 180, 95], 4: [25, 170, 95] }
const ORDER = ['outerwear', 'sweater', 'top', 'dress', 'lounge', 'bottom', 'accessory']
export function autoLayout(items: Item[]): Placed[] {
  const shoes = items.filter((i) => i.category === 'shoes')
  const clothes = items.filter((i) => i.category !== 'shoes').sort((a, b) => ORDER.indexOf(a.category) - ORDER.indexOf(b.category)).slice(0, 5)
  const slots = CLOTHES[Math.min(clothes.length, 4)]
  const out: Placed[] = clothes.map((it, i) => {
    const [x, y, s] = slots[i] ?? [200 + (i - 4) * 30, 10, 60] // a fifth piece (second accessory) tucks in top-right
    return { itemId: it.id, key: `${it.id}-a`, x, y, s }
  })
  shoes.slice(0, 1).forEach((it) => {
    const [x, y, s] = SHOES[Math.min(clothes.length, 4)]
    const gap = Math.round(s * 0.6) // shoes are wide and short, so the pair overlaps their square boxes
    out.push({ itemId: it.id, key: `${it.id}-a`, x, y, s }, { itemId: it.id, key: `${it.id}-b`, x, y: y + gap, s, flip: true })
  })
  return out
}
/**
 * Outfit collage that fits any arrangement (auto or saved from the Canvas) into a box,
 * keeping the arrangement's proportions and centering it.
 */
export function Collage({ itemIds, layout, scale = 1, width = 300, height = 290, top = 48, padX = 12 }: { itemIds: string[]; layout?: Placed[]; scale?: number; width?: number; height?: number; top?: number; padX?: number }) {
  const { state } = useStore()
  const items = itemIds.map((id) => state.items.find((i) => i.id === id)).filter(Boolean) as Item[]
  const saved = layout?.filter((p) => items.some((i) => i.id === p.itemId)) ?? []
  const pl = [...saved, ...autoLayout(items.filter((i) => !saved.some((p) => p.itemId === i.id)))]
  if (!pl.length) return null
  const x0 = Math.min(...pl.map((p) => p.x)), y0 = Math.min(...pl.map((p) => p.y))
  const x1 = Math.max(...pl.map((p) => p.x + p.s)), y1 = Math.max(...pl.map((p) => p.y + p.s))
  const boxW = width - padX * 2, boxH = height - top
  const k = Math.min(boxW / (x1 - x0), boxH / (y1 - y0), 1.4) * scale
  const offX = (width - (x1 - x0) * k) / 2, offY = top + (boxH - (y1 - y0) * k) / 2
  return (
    <>
      {pl.map((p, n) => {
        const it = items.find((i) => i.id === p.itemId)!
        return (
          <span key={p.key ?? `${p.itemId}-${n}`} className="absolute" style={{ left: offX + (p.x - x0) * k, top: offY + (p.y - y0) * k, transform: p.flip ? 'scaleX(-1)' : undefined }}>
            <ItemImage item={it} size={p.s * k} />
          </span>
        )
      })}
    </>
  )
}

/** An outfit on the light tile — the same size everywhere it appears (Home, Planner): 318 × 270. */
export const OUTFIT_TILE = { w: 318, h: 270 }
export function OutfitTile({ itemIds, layout }: { itemIds: string[]; layout?: Placed[] }) {
  return (
    <div className="relative mx-auto shrink-0 rounded-[16px] bg-tile" style={{ width: OUTFIT_TILE.w, height: OUTFIT_TILE.h }}>
      <Collage itemIds={itemIds} layout={layout} width={OUTFIT_TILE.w} height={OUTFIT_TILE.h - 12} top={12} padX={16} />
    </div>
  )
}

/**
 * A suggestion that couldn't be completed: says what's missing, with two ways forward —
 * add the piece to the closet now, or put it on the Gaps list for the next shop.
 */
export function MissingPieces({ missing }: { missing: string[] }) {
  const { state, addGap } = useStore()
  const label = (m: string) => m.replace(/^a /, '').replace(/^./, (c) => c.toUpperCase())
  const onList = missing.every((m) => state.gaps.some((g) => !g.resolved && g.label.toLowerCase() === label(m).toLowerCase()))
  const noun = missing.length === 1 ? missing[0].replace(/^a /, '') : 'pieces'
  const addGaps = () => {
    missing.forEach((m) => { if (!state.gaps.some((g) => !g.resolved && g.label.toLowerCase() === label(m).toLowerCase())) addGap({ label: label(m), source: 'nudge', detail: 'Couldn’t build an outfit without it' }) })
    toast('Added to Gaps')
  }
  return (
    <div className="flex flex-col gap-2 rounded-md bg-soft p-3.5" onClick={(e) => e.stopPropagation()}>
      <p className="text-[14px] font-semibold">Missing {missing.join(' and ')}</p>
      <p className="text-[12px] leading-[1.4] text-text/70">This outfit isn’t complete yet. Add {missing.length === 1 ? 'one' : 'them'} to your closet, or save {missing.length === 1 ? 'it' : 'them'} for your next shop.</p>
      <div className="flex gap-2">
        <Link to="/closet/add" className="press flex-1 truncate rounded-full bg-primary px-3 py-2 text-center text-[13px] font-medium text-cloud">Add {noun}</Link>
        <button onClick={addGaps} disabled={onList} className="press flex-1 rounded-full border border-border px-3 py-2 text-[13px] font-medium disabled:opacity-60">{onList ? '✓ In your Gaps' : 'Add to Gaps'}</button>
      </div>
    </div>
  )
}

/** Row of small thumbnails (Home peek cards, Plan the week, Month). */
export function Thumbs({ itemIds, size = 30, max = 4, bg = true }: { itemIds: string[]; size?: number; max?: number; bg?: boolean }) {
  const { state } = useStore()
  const items = itemIds.map((id) => state.items.find((i) => i.id === id)).filter(Boolean).slice(0, max) as Item[]
  return (
    <div className={`flex items-center ${bg ? 'rounded-[10px] bg-tile p-1' : ''}`}>
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

/** Pull each piece's main color from its photo once, and remember it. */
export function usePhotoSwatches(items: Item[]) {
  const { setItemSwatch } = useStore()
  const todo = items.filter((i) => !i.swatch && i.imageId && !i.processing)
  const key = todo.map((i) => i.id).join()
  useEffect(() => {
    let live = true
    ;(async () => {
      for (const it of todo) {
        const blob = await loadImage(it.imageId!)
        const c = blob && (await dominantColor(blob).catch(() => undefined))
        if (live && c) setItemSwatch(it.id, c)
      }
    })()
    return () => { live = false }
  }, [key]) // eslint-disable-line react-hooks/exhaustive-deps
}
