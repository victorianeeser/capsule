import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { migrateItem, type Activity, type Category, type DayType, type Draft, type Gap, type Item, type Outfit, type PlannedOutfit, type Profile, type State, type Wish } from './types'
import { eraseAll, invalidateImage, loadImage, loadState, saveImage, saveState, deleteImage } from './db'
import { cutOut, hasTransparency, prepareCutout, shrink } from './images'
import { getForecast, type DayWeather, type Forecast } from './weather'
import { addDays, dayName, today } from './dates'
import { suggest, type Suggestion } from './suggest'

/**
 * Turn a photo filename into a starting name/brand, e.g.
 * "Aritzia - Black wool coat.jpg" → brand "Aritzia", name "Black wool coat";
 * "black_wool_coat.jpg" → name "Black wool coat". Camera names like IMG_1234 are ignored.
 */
export function fromFilename(file?: string): Partial<Item> {
  if (!file) return {}
  const base = file.replace(/\.[a-z0-9]+$/i, '').replace(/[_]+/g, ' ').replace(/\s+/g, ' ').trim()
  if (!base || /^(img|dsc|photo|image|pxl|screenshot)[\s-]?\d/i.test(base) || /^[\d\s-]+$/.test(base)) return {}
  const cap = (x: string) => x.charAt(0).toUpperCase() + x.slice(1)
  const parts = base.split(/\s+[-–|]\s+/)
  if (parts.length >= 2) return { brand: parts[0].trim(), name: cap(parts.slice(1).join(' ').trim()) }
  return { name: cap(base.replace(/-+/g, ' ')) }
}

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)

const DEFAULT_PROFILE: Profile = {
  onboarded: false, city: 'Lawrence, KS', lat: 38.9717, lon: -95.2353, unit: 'F',
  routine: ['off', 'work', 'work', 'work', 'work', 'work', 'off'], workHours: '9–5', repeatDays: 4, firstPiecesGoal: 15,
}
const EMPTY: State = { version: 1, profile: DEFAULT_PROFILE, items: [], outfits: [], planned: [], days: [], wear: [], gaps: [], wishlist: [], auditDone: [] }

export interface PhotoQueue { total: number; done: number; modelPct: number; failed: number }

function useStoreValue() {
  const [state, setState] = useState<State>(EMPTY)
  const [ready, setReady] = useState(false)
  const [forecast, setForecast] = useState<Forecast | null>(null)
  const [queue, setQueue] = useState<PhotoQueue>({ total: 0, done: 0, modelPct: 0, failed: 0 })
  const stateRef = useRef(state)
  stateRef.current = state

  // Load once, then save (debounced) on every change.
  useEffect(() => { loadState().then((s) => { if (s) setState({ ...EMPTY, ...s, items: (s.items ?? []).map(migrateItem), profile: { ...DEFAULT_PROFILE, ...s.profile } }); setReady(true) }) }, [])
  useEffect(() => {
    if (!ready) return
    const t = setTimeout(() => saveState(state), 250)
    return () => clearTimeout(t)
  }, [state, ready])

  // Weather for the saved city.
  useEffect(() => { if (ready) getForecast(state.profile.lat, state.profile.lon).then(setForecast) }, [ready, state.profile.lat, state.profile.lon])

  const update = useCallback((f: (s: State) => State) => setState((s) => f(s)), [])

  // Weather nudge: below 40° in the next 3 days and no warm outerwear → add a gap once.
  useEffect(() => {
    if (!forecast || !ready) return
    const cold = forecast.days.slice(0, 4).find((d) => d.high < 40)
    if (!cold) return
    const s = stateRef.current
    const hasWarm = s.items.some((i) => i.status === 'active' && i.category === 'outerwear' && i.warmth === 'warm')
    if (hasWarm || s.gaps.some((g) => g.source === 'nudge' && g.label === 'Warm winter coat' && !g.resolved)) return
    update((s) => ({ ...s, gaps: [...s.gaps, { id: uid(), label: 'Warm winter coat', category: 'outerwear', source: 'nudge', detail: `Forecast drops below 40° ${dayName(cold.date)}`, resolved: false, createdAt: today() }] }))
  }, [forecast, ready, update])

  const weatherFor = useCallback((date: string): DayWeather | undefined => forecast?.days.find((d) => d.date === date), [forecast])

  /* ---------------- items & photos ---------------- */
  const addPhotos = useCallback(async (files: File[] | Blob[], overrides: Partial<Item> = {}): Promise<string[]> => {
    const created: Item[] = []
    const toCut: Item[] = []
    for (const f of files) {
      const imageId = uid()
      // Your own cut-outs (transparent PNG/WebP/AVIF) skip background removal — just crop and save.
      const alreadyCut = await hasTransparency(f).catch(() => false)
      await saveImage(imageId, alreadyCut ? await prepareCutout(f) : await shrink(f))
      const sourceName = 'name' in f ? (f as File).name : undefined
      const item: Item = { id: uid(), name: 'New piece', category: 'top', color: '', warmth: 'mid', dressLevels: ['casual'], context: 'both', delicate: false, status: 'active', tagged: false, imageId, processing: !alreadyCut, createdAt: new Date().toISOString(), sourceName, ...fromFilename(sourceName), ...overrides }
      created.push(item)
      if (!alreadyCut) toCut.push(item)
    }
    update((s) => ({ ...s, items: [...created, ...s.items] }))
    if (toCut.length) setQueue((q) => ({ ...q, total: q.total + toCut.length }))
    // Cut backgrounds one at a time so the phone stays responsive.
    ;(async () => {
      for (const it of toCut) {
        if (!stateRef.current.items.some((i) => i.id === it.id)) { setQueue((q) => ({ ...q, done: q.done + 1 })); continue } // removed before it was processed
        try {
          const blob = await loadImage(it.imageId!)
          if (blob) {
            const cut = await cutOut(blob, (p) => setQueue((q) => ({ ...q, modelPct: p })))
            if (!stateRef.current.items.some((i) => i.id === it.id)) { setQueue((q) => ({ ...q, done: q.done + 1 })); continue }
            await saveImage(it.imageId!, cut)
            invalidateImage(it.imageId!)
          }
          setQueue((q) => ({ ...q, done: q.done + 1 }))
        } catch (e) {
          console.warn('Background removal failed; keeping the original photo.', e)
          setQueue((q) => ({ ...q, done: q.done + 1, failed: q.failed + 1 }))
        }
        update((s) => ({ ...s, items: s.items.map((i) => (i.id === it.id ? { ...i, processing: false } : i)) }))
      }
    })()
    return created.map((c) => c.id)
  }, [update])

  const saveItem = useCallback((item: Item) => update((s) => ({ ...s, items: s.items.map((i) => (i.id === item.id ? item : i)) })), [update])
  const deleteItem = useCallback((id: string) => {
    const it = stateRef.current.items.find((i) => i.id === id)
    if (it?.imageId) { deleteImage(it.imageId); invalidateImage(it.imageId) }
    update((s) => ({ ...s, items: s.items.filter((i) => i.id !== id), outfits: s.outfits.map((o) => ({ ...o, itemIds: o.itemIds.filter((x) => x !== id) })) }))
  }, [update])

  /* ---------------- planning ---------------- */
  const suggestFor = useCallback((date: string, exclude?: Set<string>): Suggestion => suggest(stateRef.current, date, weatherFor(date), exclude), [weatherFor])

  const plan = useCallback((p: { date: string; itemIds: string[]; occasion: string; note?: string; reason?: string; suggested?: boolean; layout?: Outfit['layout']; editingId?: string; favorite?: boolean }) => {
    const existingNow = p.editingId ? stateRef.current.planned.find((x) => x.id === p.editingId) : undefined
    const newOutfitId = uid(), newPlannedId = uid()
    const ids = existingNow ? { outfitId: existingNow.outfitId, plannedId: existingNow.id } : { outfitId: newOutfitId, plannedId: newPlannedId }
    update((s) => {
      const existing = p.editingId ? s.planned.find((x) => x.id === p.editingId) : undefined
      if (existing) {
        return {
          ...s,
          outfits: s.outfits.map((o) => (o.id === existing.outfitId ? { ...o, itemIds: p.itemIds, layout: p.layout, isFavorite: p.favorite ?? o.isFavorite } : o)),
          planned: s.planned.map((x) => (x.id === existing.id ? { ...x, occasion: p.occasion, note: p.note ?? x.note, reason: p.reason, suggested: p.suggested } : x)),
        }
      }
      const o: Outfit = { id: newOutfitId, itemIds: p.itemIds, layout: p.layout, isFavorite: !!p.favorite, createdAt: new Date().toISOString() }
      const pos = s.planned.filter((x) => x.date === p.date).length
      const po: PlannedOutfit = { id: newPlannedId, date: p.date, outfitId: o.id, occasion: p.occasion, position: pos, note: p.note ?? '', reason: p.reason, suggested: p.suggested }
      return { ...s, outfits: [...s.outfits, o], planned: [...s.planned, po] }
    })
    return ids
  }, [update])

  const unplan = useCallback((id: string) => update((s) => ({ ...s, planned: s.planned.filter((p) => p.id !== id) })), [update])
  const setNote = useCallback((id: string, note: string) => update((s) => ({ ...s, planned: s.planned.map((p) => (p.id === id ? { ...p, note } : p)) })), [update])
  const setDay = useCallback((date: string, dayType: DayType, activities: Activity[]) => update((s) => ({ ...s, days: [...s.days.filter((d) => d.date !== date), { date, dayType, activities }] })), [update])

  /** Log or un-log "Wore it" for an outfit on a date. */
  const toggleWore = useCallback((date: string, outfitId: string) => update((s) => {
    const o = s.outfits.find((x) => x.id === outfitId)
    if (!o) return s
    const logged = s.wear.some((w) => w.outfitId === outfitId && w.wornOn === date)
    return logged
      ? { ...s, wear: s.wear.filter((w) => !(w.outfitId === outfitId && w.wornOn === date)) }
      : { ...s, wear: [...s.wear, ...o.itemIds.map((itemId) => ({ id: uid(), itemId, outfitId, wornOn: date }))] }
  }), [update])

  const setDraft = useCallback((d?: Draft) => update((s) => ({ ...s, draft: d })), [update])

  /* ---------------- gaps & wishlist ---------------- */
  const addGap = useCallback((g: { label: string; category?: Category; source: Gap['source']; detail?: string }) => update((s) => ({ ...s, gaps: [...s.gaps, { id: uid(), resolved: false, createdAt: today(), ...g }] })), [update])
  const toggleGap = useCallback((id: string) => update((s) => ({ ...s, gaps: s.gaps.map((g) => (g.id === id ? { ...g, resolved: !g.resolved } : g)) })), [update])
  const removeGap = useCallback((id: string) => update((s) => ({ ...s, gaps: s.gaps.filter((g) => g.id !== id) })), [update])
  const addWish = useCallback(async (w: Omit<Wish, 'id' | 'createdAt' | 'imageId'>, photo?: Blob) => {
    let imageId: string | undefined
    if (photo) { imageId = uid(); await saveImage(imageId, await shrink(photo, 700)) }
    update((s) => ({ ...s, wishlist: [{ id: uid(), createdAt: today(), imageId, ...w }, ...s.wishlist] }))
  }, [update])
  const removeWish = useCallback((id: string) => update((s) => ({ ...s, wishlist: s.wishlist.filter((w) => w.id !== id) })), [update])

  /* ---------------- profile & data ---------------- */
  const setProfile = useCallback((p: Partial<Profile>) => update((s) => ({ ...s, profile: { ...s.profile, ...p } })), [update])
  const resetAll = useCallback(async () => { await eraseAll(); localStorage.removeItem('capsule:weather'); setState(EMPTY) }, [])
  const loadDemo = useCallback(() => update((s) => ({ ...s, items: [...demoItems(), ...s.items] })), [update])

  return {
    state, ready, forecast, queue, weatherFor, update,
    addPhotos, saveItem, deleteItem, suggestFor, plan, unplan, setNote, setDay, toggleWore, setDraft,
    addGap, toggleGap, removeGap, addWish, removeWish, setProfile, resetAll, loadDemo,
    today: today(), tomorrow: addDays(today(), 1),
  }
}

/** Silhouette closet for demos (Settings → Load demo closet). */
function demoItems(): Item[] {
  const mk = (name: string, category: Category, color: string, warmth: Item['warmth'], dressLevel: Item['dressLevels'][number], context: Item['context'], demoKind: NonNullable<Item['demoKind']>): Item =>
    ({ id: uid(), name, category, color, warmth, dressLevels: [dressLevel], context, delicate: false, status: 'active', tagged: true, demoKind, createdAt: new Date().toISOString() })
  return [
    mk('Cream knit sweater', 'sweater', 'Cream', 'warm', 'work', 'both', 'knit'),
    mk('Black tee', 'top', 'Black', 'light', 'casual', 'both', 'top'),
    mk('Oat cardigan', 'sweater', 'Cream', 'mid', 'work', 'work', 'knit'),
    mk('Gray lounge set', 'lounge', 'Gray', 'mid', 'casual', 'weekend', 'jeans'),
    mk('Striped tee', 'top', 'Pattern', 'light', 'casual', 'weekend', 'top'),
    mk('Wide-leg trousers', 'bottom', 'Gray', 'mid', 'work', 'work', 'bottom'),
    mk('Dark jeans', 'bottom', 'Denim', 'mid', 'casual', 'both', 'jeans'),
    mk('Black jeans', 'bottom', 'Black', 'mid', 'casual', 'weekend', 'jeans'),
    mk('Slip dress', 'dress', 'Brown', 'light', 'going-out', 'weekend', 'dress'),
    mk('Tan trench coat', 'outerwear', 'Tan', 'mid', 'work', 'both', 'outerwear'),
    mk('Wool coat', 'outerwear', 'Brown', 'warm', 'work', 'both', 'outerwear'),
    mk('Black loafers', 'shoes', 'Black', 'mid', 'work', 'both', 'shoes'),
    mk('White sneakers', 'shoes', 'White', 'light', 'casual', 'weekend', 'shoes'),
    mk('Running shoes', 'shoes', 'Gray', 'light', 'athletic', 'weekend', 'shoes'),
  ]
}

type Store = ReturnType<typeof useStoreValue>
const Ctx = createContext<Store | null>(null)
export function StoreProvider({ children }: { children: ReactNode }) {
  const v = useStoreValue()
  const memo = useMemo(() => v, [v])
  if (!v.ready) return null
  return <Ctx.Provider value={memo}>{children}</Ctx.Provider>
}
export function useStore() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useStore outside StoreProvider')
  return v
}
