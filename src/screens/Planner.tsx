import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { BackBar, Button, Card, Chip, CircleButton, Eyebrow, FabButton, Header, Icon, Pill, Screen, Title, Toggle } from '../ui'
import { useStore } from '../lib/store'
import { ACTIVITIES, CATEGORIES, CATEGORY_LABEL, SWATCH, type Activity, type Category, type Item, type Placed, type PlannedOutfit } from '../lib/types'
import { addDays, dayShort, fmtLong, fmtShort, iso, monday, monthTitle, parse, weekStart } from '../lib/dates'
import { autoSuggests, dayInfo, occasionLabel } from '../lib/suggest'
import { deg, isRainy, condition } from '../lib/weather'
import { autoLayout, Collage, Empty, ItemImage, MissingPieces, OutfitTile, Thumbs, usePhotoSwatches } from '../components'
import { colorAt } from '../lib/color'
import { toast } from '../lib/toast'

/* ---------------- shared planner chrome ---------------- */
function PlannerNav() {
  const nav = useNavigate()
  return (
    <div className="flex items-center justify-between px-5 pt-1 pb-2">
      <Title>Planner</Title>
      <Pill onClick={() => nav('/planner')}>Today</Pill>
    </div>
  )
}
function DayMonth({ active, date }: { active: 'Day' | 'Month'; date: string }) {
  return (
    <div className="flex border-b border-border">
      {(['Day', 'Month'] as const).map((t) => (
        <Link key={t} to={t === 'Day' ? `/planner?date=${date}` : `/planner/month?m=${date.slice(0, 7)}`} className={`flex flex-1 flex-col items-center gap-2.5 pt-2 text-[16px] ${t === active ? 'font-semibold' : 'font-medium text-text/50'}`}>
          {t}<span className={`h-0.5 w-full ${t === active ? 'bg-primary' : ''}`} />
        </Link>
      ))}
    </div>
  )
}
const useDateParam = () => { const { today } = useStore(); return useSearchParams()[0].get('date') ?? today }

function useWeatherText(date: string) {
  const { weatherFor, state } = useStore()
  const w = weatherFor(date)
  if (!w) return 'No forecast yet'
  return `${deg(w.high, state.profile.unit)} / ${deg(w.low, state.profile.unit)}${isRainy(w) ? ' · rain' : ` · ${condition(w.code)}`}`
}

/* ---------------- Swipe (touch + mouse) ---------------- */
/**
 * Horizontal swipe that follows the finger, then slides to the next/previous page.
 * `dir` is +1 for a swipe to the left (next) and -1 for a swipe to the right (previous).
 * Vertical movement is left to the browser so the page still scrolls.
 */
function useSwipe(onSwipe: (dir: 1 | -1) => void, threshold = 60) {
  const [dx, setDx] = useState(0)
  const [animate, setAnimate] = useState(false)
  const start = useRef<{ x: number; y: number; axis?: 'h' | 'v' } | null>(null)
  const swiped = useRef(false)
  const zoom = () => Number(getComputedStyle(document.documentElement).getPropertyValue('--phone-zoom')) || 1
  const handlers = {
    onPointerDown: (e: React.PointerEvent) => { start.current = { x: e.clientX, y: e.clientY }; swiped.current = false; setAnimate(false) },
    onPointerMove: (e: React.PointerEvent) => {
      const s = start.current
      if (!s) return
      const mx = (e.clientX - s.x) / zoom(), my = (e.clientY - s.y) / zoom()
      if (!s.axis && Math.hypot(mx, my) > 8) s.axis = Math.abs(mx) > Math.abs(my) ? 'h' : 'v'
      if (s.axis === 'h') { swiped.current = true; setDx(mx) }
    },
    onPointerUp: () => {
      const s = start.current
      start.current = null
      if (s?.axis !== 'h') { setDx(0); return }
      setAnimate(true)
      if (Math.abs(dx) < threshold) { setDx(0); return }
      const dir = dx < 0 ? 1 : -1
      setDx(-dir * 400) // slide out
      setTimeout(() => {
        onSwipe(dir)
        setAnimate(false); setDx(dir * 400) // jump to the other side…
        requestAnimationFrame(() => requestAnimationFrame(() => { setAnimate(true); setDx(0) })) // …and slide in
      }, 160)
    },
    onPointerCancel: () => { start.current = null; setAnimate(true); setDx(0) },
    onPointerLeave: (e: React.PointerEvent) => { if (start.current?.axis === 'h') handlers.onPointerUp(); else if (e.pointerType === 'mouse') start.current = null },
    // A swipe shouldn't also count as a tap on a card or button.
    onClickCapture: (e: React.MouseEvent) => { if (swiped.current) { e.stopPropagation(); e.preventDefault(); swiped.current = false } },
  }
  const style: React.CSSProperties = { transform: `translateX(${dx}px)`, transition: animate ? 'transform 160ms ease-out' : 'none' }
  return { handlers, style }
}

/* ---------------- Day ---------------- */
function PlannedCard({ p }: { p: PlannedOutfit }) {
  const { state, setDraft, unplan, setNote } = useStore()
  const nav = useNavigate()
  const o = state.outfits.find((x) => x.id === p.outfitId)
  const [menu, setMenu] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [note, setNoteText] = useState(p.note)
  if (!o) return null
  const edit = () => { setDraft({ date: p.date, itemIds: o.itemIds, layout: o.layout, editingId: p.id, occasion: p.occasion, note: p.note }); nav('/planner/canvas') }
  return (
    <div onClick={edit} className="relative flex w-[350px] shrink-0 cursor-pointer flex-col gap-3 overflow-hidden rounded-[22px] bg-surface p-4">
      <div className="flex h-9 items-center gap-2 pr-11">
        <Link to={`/planner/off-day?date=${p.date}`} onClick={(e) => e.stopPropagation()} className="rounded-full bg-primary px-3 py-[7px] text-[13px] font-medium text-cloud">{p.occasion}</Link>
        {p.suggested && <span className="flex items-center gap-1.5 rounded-full bg-soft px-2.5 py-[6px] text-[12px] font-medium"><Icon name="spark" size={14} />Suggested</span>}
      </div>
      <button onClick={(e) => { e.stopPropagation(); setMenu(!menu) }} className="absolute top-4 right-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-cloud" aria-label="More"><Icon name="more" size={20} /></button>
      {menu && (
        <div onClick={(e) => e.stopPropagation()} className="unfold absolute top-14 right-3.5 z-30 flex w-40 flex-col rounded-md border border-border bg-bg py-1 text-[14px]">
          <button onClick={edit} className="px-4 py-2.5 text-left">Edit outfit</button>
          <button onClick={() => { setMenu(false); setConfirm(true) }} className="px-4 py-2.5 text-left">Remove from day</button>
        </div>
      )}
      {confirm && (
        <div onClick={(e) => { e.stopPropagation(); setConfirm(false) }} className="enter-fade absolute inset-0 z-40 flex items-center justify-center bg-text/35 p-5">
          <div onClick={(e) => e.stopPropagation()} role="alertdialog" aria-label="Remove outfit from day" className="pop-in flex w-full flex-col gap-3 rounded-lg bg-bg p-5 text-center">
            <p className="text-[16px] font-semibold">Remove this outfit?</p>
            <p className="text-[13px] leading-[1.4] text-text/65">It comes off {new Date(p.date + 'T12:00').toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}. Your pieces and favorites stay as they are.</p>
            <div className="mt-1 flex gap-2.5">
              <Button variant="secondary" onClick={() => setConfirm(false)}>Cancel</Button>
              <Button onClick={() => { setConfirm(false); unplan(p.id); toast('Outfit removed') }}>Remove</Button>
            </div>
          </div>
        </div>
      )}
      <OutfitTile itemIds={o.itemIds} layout={o.layout} />
      <div className="flex flex-col gap-1 px-1" onClick={(e) => e.stopPropagation()}>
        {p.reason && <p className="text-[12px] text-text/70">{p.reason}</p>}
        <input value={note} onChange={(e) => setNoteText(e.target.value)} onBlur={() => setNote(p.id, note)} placeholder="Add a note…" className="bg-transparent text-[15px] outline-none placeholder:text-text/55" />
      </div>
    </div>
  )
}


function SuggestionCard({ date }: { date: string }) {
  const { state, suggestFor, plan, addGap, toggleSkip } = useStore()
  const [ask, setAsk] = useState(false)
  useEffect(() => setAsk(false), [date])
  const s = suggestFor(date)
  const hasCloset = state.items.some((i) => i.tagged && i.status === 'active')
  if (hasCloset && !ask && !autoSuggests(state, date)) {
    const skipped = state.skipped.includes(date)
    return (
      <div className="pop-in flex h-[220px] w-[350px] shrink-0 flex-col items-center justify-center gap-1.5 rounded-[22px] bg-surface px-6 text-center">
        <p className="text-[16px] font-semibold">{skipped ? 'No outfit needed' : 'Nothing planned'}</p>
        <p className="text-[13px] leading-[1.4] text-text/65">{skipped ? 'You marked this day as no outfit needed.' : `${occasionLabel(state, date)} — no outfit suggested.`}</p>
        <div className="mt-2 flex gap-4 text-[14px] font-semibold">
          {skipped && <button className="underline" onClick={() => toggleSkip(date)}>Undo</button>}
          <button className="underline" onClick={() => setAsk(true)}>Suggest an outfit</button>
        </div>
      </div>
    )
  }
  if (!hasCloset) return <div className="w-[350px]"><Empty title="Nothing to plan with yet" body="Add a few pieces to your closet and Capsule will suggest outfits." action={<Button to="/closet/add">Add pieces</Button>} /></div>
  return (
    <div className="flex w-[350px] shrink-0 flex-col gap-3 overflow-hidden rounded-[22px] border-[1.5px] border-dashed border-accent p-4">
      <div className="flex h-9 items-center gap-2">
        <span className="rounded-full bg-primary px-3 py-[7px] text-[13px] font-medium text-cloud">{s.occasion}</span>
        <span className="flex items-center gap-1.5 rounded-full bg-soft px-2.5 py-[6px] text-[12px] font-medium"><Icon name="spark" size={14} />Suggestion</span>
      </div>
      <OutfitTile itemIds={s.itemIds} />
      <div className="flex flex-col gap-2">
        {s.reason && <p className="text-[12px] text-text/70">{s.reason}</p>}
        {s.missing.length > 0 && <MissingPieces missing={s.missing} />}
        {s.itemIds.length > 0 && <Button onClick={() => { plan({ date, itemIds: s.itemIds, occasion: s.occasion, reason: s.reason, suggested: true }); toast('Added to your plan') }}>Use this outfit</Button>}
      </div>
    </div>
  )
}

export function PlannerDay() {
  const { state, setDraft, today } = useStore()
  const nav = useNavigate()
  const [, setParams] = useSearchParams()
  const date = useDateParam()
  const setDate = (d: string) => setParams({ date: d }, { replace: true })
  const ws = weekStart(date)
  const week = Array.from({ length: 7 }, (_, i) => addDays(ws, i))
  const planned = state.planned.filter((p) => p.date === date).sort((a, b) => a.position - b.position)
  const add = () => { setDraft({ date, itemIds: [], occasion: occasionLabel(state, date) }); nav(`/planner/add?date=${date}`) }
  const wText = useWeatherText(date)
  const daySwipe = useSwipe((dir) => setDate(addDays(date, dir)))
  const weekSwipe = useSwipe((dir) => setDate(addDays(date, dir * 7)), 40)
  return (
    <Screen tabs pad={false}>
      <PlannerNav />
      <DayMonth active="Day" date={date} />
      <div {...weekSwipe.handlers} style={weekSwipe.style} className="flex touch-pan-y items-center bg-surface/50 px-2.5 py-3 select-none">
        {week.map((d) => {
          const on = d === date, isToday = d === today
          return (
            <button key={d} onClick={() => setDate(d)} className="flex flex-1 flex-col items-center gap-1.5">
              <span className="text-[12px] text-text/50">{dayShort(d)}</span>
              <span className={`flex h-9 w-9 items-center justify-center rounded-full text-[17px] ${on ? 'bg-primary font-semibold text-cloud' : isToday ? 'font-semibold text-text-muted underline underline-offset-4' : 'font-medium'}`}>{parse(d).getDate()}</span>
              <span className={`h-[5px] w-[5px] rounded-full ${state.planned.some((p) => p.date === d) ? 'bg-text/60' : ''}`} />
            </button>
          )
        })}
      </div>
      <div className="flex flex-col items-center gap-2 pt-3.5 pb-3">
        <p className="text-[16px] font-semibold">{fmtLong(date)}</p>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-border px-[15px] py-[9px] text-[14px] font-medium">{wText}</span>
          {planned.length > 1 && <span className="text-[13px] font-medium text-text/55">{planned.length} outfits ↓</span>}
        </div>
      </div>
      {/* Swipe left/right anywhere here to change day; scroll up/down for more outfits that day. */}
      <div {...daySwipe.handlers} className="relative flex flex-1 touch-pan-y flex-col items-center pb-6 select-none">
        <div style={daySwipe.style} className="flex flex-col items-center gap-3.5">
          {planned.length ? planned.map((p) => <PlannedCard key={p.id} p={p} />) : <SuggestionCard date={date} />}
          <button onClick={add} className="flex h-14 w-[350px] items-center justify-center rounded-lg border-[1.2px] border-dashed border-accent text-[15px] font-medium text-text/70">
            + {planned.length ? 'Add another outfit' : 'Build my own'}
          </button>
        </div>
      </div>
    </Screen>
  )
}

/* ---------------- Month ---------------- */
/** The day page's outfit arrangement, shrunk to fit a calendar cell. */
function MiniCollage({ itemIds, layout }: { itemIds: string[]; layout?: Placed[] }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [w, setW] = useState(46)
  useEffect(() => { if (ref.current) setW(ref.current.offsetWidth) }, [])
  return <span ref={ref} className="absolute inset-0"><Collage itemIds={itemIds} layout={layout} width={w} height={66} top={3} padX={2} /></span>
}
/* ---------------- Outfit colors (Month → Colors) ---------------- */
const SWATCH_ORDER = ['outerwear', 'sweater', 'top', 'dress', 'lounge', 'bottom', 'shoes', 'accessory']
/** A color as a block: a hex from a photo or the editor, a tag name (Blue, Denim…), or "Pattern" (striped). */
const swatchStyle = (c: string): React.CSSProperties =>
  c.startsWith('#') ? { background: c }
    : c === 'Pattern' ? { backgroundImage: 'repeating-linear-gradient(45deg, var(--color-text) 0 2px, var(--color-tile) 2px 5px)' }
      : SWATCH[c] ? { background: SWATCH[c] } : {}

/** The pieces of an outfit, outer layer first and shoes last. */
const ordered = (items: Item[], ids: string[]) => ids.map((id) => items.find((i) => i.id === id)).filter(Boolean).sort((a, b) => SWATCH_ORDER.indexOf(a!.category) - SWATCH_ORDER.indexOf(b!.category)) as Item[]
/** A day's strip, row by row: the hand-edited palette if there is one, otherwise each piece's photo color (or its tag colors). */
function stripRows(items: Item[], p: PlannedOutfit, ids: string[]): string[][] {
  if (p.palette?.length) return p.palette.map((c) => [c])
  return ordered(items, ids).map((it) => (it.swatch ? [it.swatch] : it.colors.length ? it.colors : ['']))
}


function Swatches({ rows, label }: { rows: string[][]; label: string }) {
  return (
    <span className="absolute inset-1 flex flex-col gap-[2px] overflow-hidden rounded-[6px]" aria-label={label}>
      {rows.map((r, i) => (
        <span key={i} className="flex min-h-0 flex-1">
          {r.map((c, j) => <span key={j} className="flex-1 bg-cloud shadow-[inset_0_0_0_1px_rgb(0_0_0/0.06)]" style={swatchStyle(c)} />)}
        </span>
      ))}
    </span>
  )
}

/** Edit a day's colors: the outfit on the left, its palette on the right. Tap the photo to pull a color from it. */
export function OutfitColors() {
  const { state, setPalette } = useStore()
  const nav = useNavigate()
  const id = useSearchParams()[0].get('id')
  const p = state.planned.find((x) => x.id === id)
  const o = p && state.outfits.find((x) => x.id === p.outfitId)
  const pieces = ordered(state.items, o?.itemIds ?? [])
  usePhotoSwatches(pieces)
  const [sel, setSel] = useState<number | null>(null)
  const [msg, setMsg] = useState('')
  const adding = useRef<number | null>(null) // index of the block the color picker is filling in
  if (!p || !o) return <Screen><BackBar /><Empty title="Not found" body="This outfit is no longer planned." /></Screen>
  const auto = pieces.map((it) => it.swatch ?? it.colors[0] ?? '')
  const colors = p.palette?.length ? p.palette : auto
  const save = (next: string[]) => setPalette(p.id, next)
  const put = (c: string) => {
    if (sel !== null) { const next = [...colors]; next[sel] = c; save(next) } else { save([...colors, c]); setSel(colors.length) }
    setMsg('')
  }
  // The color picker fires many changes while you drag: the first one adds a block, the rest update that same block.
  const add = (c: string) => {
    if (adding.current !== null && adding.current < colors.length) { const next = [...colors]; next[adding.current] = c; save(next) }
    else { adding.current = colors.length; save([...colors, c]); setSel(colors.length) }
    setMsg('')
  }
  const pick = (e: React.MouseEvent) => { const c = colorAt(e.clientX, e.clientY); if (c) put(c); else setMsg('Tap right on a piece to pull its color.') }
  const remove = () => { if (sel === null) return; const next = colors.filter((_, i) => i !== sel); setSel(null); save(next.length ? next : auto) }
  const toHex = (c: string) => (c.startsWith('#') ? c : SWATCH[c] ?? '#9C9993')
  return (
    <Screen>
      <div className="flex flex-1 flex-col gap-4">
        <BackBar label="Month" right="Open day" onRight={() => nav(`/planner?date=${p.date}`)} />
        <Header eyebrow={`${fmtShort(p.date)} · ${p.occasion}`} title="Outfit colors" />
        <div className="flex h-[340px] gap-3">
          <div onClick={pick} className="relative w-[238px] shrink-0 cursor-crosshair rounded-[16px] bg-tile" title="Tap a piece to pull its color">
            <Collage itemIds={o.itemIds} layout={o.layout} width={238} height={328} top={12} padX={12} />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-2 overflow-y-auto rounded-[16px] border border-border p-2.5" role="listbox" aria-label="Colors">
            {colors.map((c, i) => (
              <button key={i} role="option" aria-selected={sel === i} onClick={() => setSel(sel === i ? null : i)} title={c}
                className={`max-h-16 min-h-6 flex-1 rounded-[10px] bg-cloud shadow-[inset_0_0_0_1px_rgb(0_0_0/0.08)] transition-shadow ${sel === i ? 'ring-2 ring-text ring-offset-2 ring-offset-bg' : ''}`} style={swatchStyle(c)} />
            ))}
          </div>
        </div>
        <p className="text-[13px] leading-[1.4] text-text-muted">{msg || (sel === null ? 'Tap the outfit to add a color straight from the photo. Tap a color on the right to change or remove it.' : 'Tap the outfit to replace the selected color, or pick one below.')}</p>
        <div className="flex flex-wrap gap-2">
          {sel !== null && (
            <label className="press flex cursor-pointer items-center gap-1.5 rounded-full border border-border px-3.5 py-2 text-[13px] font-medium">
              <span className="h-3.5 w-3.5 rounded-full shadow-[inset_0_0_0_1px_rgb(0_0_0/0.15)]" style={swatchStyle(colors[sel])} />Edit color
              <input type="color" className="sr-only" value={toHex(colors[sel])} onChange={(e) => put(e.target.value.toUpperCase())} />
            </label>
          )}
          <label className="press flex cursor-pointer items-center gap-1.5 rounded-full border border-border px-3.5 py-2 text-[13px] font-medium">
            <Icon name="plus" size={16} />Add color
            <input type="color" className="sr-only" value={toHex(adding.current !== null ? colors[adding.current] ?? '#9C9993' : '#9C9993')} onClick={() => { adding.current = null }} onChange={(e) => add(e.target.value.toUpperCase())} />
          </label>
          {sel !== null && <button onClick={remove} className="press rounded-full border border-border px-3.5 py-2 text-[13px] font-medium">Remove</button>}
          {p.palette?.length ? <button onClick={() => { setSel(null); setPalette(p.id, undefined) }} className="press rounded-full px-3.5 py-2 text-[13px] font-medium text-text/70 underline underline-offset-2">Reset to photo colors</button> : null}
        </div>
        <div className="flex-1" />
        <Button onClick={() => { toast(p.palette?.length ? 'Colors saved' : 'Using photo colors'); nav(-1) }}>Done</Button>
      </div>
    </Screen>
  )
}

type MonthMode = 'outfits' | 'colors'
const MONTH_MODE_KEY = 'capsule:monthView'

export function PlannerMonth() {
  const { state, setDraft, today, tomorrow } = useStore()
  const nav = useNavigate()
  const [params, setParams] = useSearchParams()
  const m = params.get('m') ?? today.slice(0, 7)
  const [y, mo] = m.split('-').map(Number)
  const first = iso(new Date(y, mo - 1, 1))
  const start = weekStart(first)
  const daysInMonth = new Date(y, mo, 0).getDate()
  const weeks = Math.ceil((parse(first).getDay() + daysInMonth) / 7)
  const cells = Array.from({ length: weeks * 7 }, (_, i) => addDays(start, i))
  const shift = (n: number) => { const d = new Date(y, mo - 1 + n, 1); setParams({ m: iso(d).slice(0, 7) }, { replace: true }) }
  const [mode, setModeState] = useState<MonthMode>(() => { try { return localStorage.getItem(MONTH_MODE_KEY) === 'colors' ? 'colors' : 'outfits' } catch { return 'outfits' } })
  const setMode = (v: MonthMode) => { setModeState(v); try { localStorage.setItem(MONTH_MODE_KEY, v) } catch { /* private mode */ } }
  const monthIds = new Set(state.planned.filter((x) => x.date.slice(0, 7) === m).flatMap((x) => state.outfits.find((o) => o.id === x.outfitId)?.itemIds ?? []))
  usePhotoSwatches(mode === 'colors' ? state.items.filter((i) => monthIds.has(i.id)) : [])
  return (
    <Screen tabs pad={false} fab={<FabButton label="Plan an outfit for tomorrow" onClick={() => { setDraft({ date: tomorrow, itemIds: [], occasion: occasionLabel(state, tomorrow) }); nav(`/planner/add?date=${tomorrow}`) }} />}>
      <PlannerNav />
      <DayMonth active="Month" date={today.slice(0, 7) === m ? today : first} />
      <div className="flex flex-col gap-1.5 px-4 pt-3.5 pb-24">
        <div className="flex items-center justify-between">
          <button onClick={() => shift(-1)} aria-label="Previous month" className="p-1"><Icon name="back" size={20} /></button>
          <p className="text-[17px] font-semibold">{monthTitle(y, mo - 1)}</p>
          <button onClick={() => shift(1)} aria-label="Next month" className="p-1"><Icon name="chev" size={20} /></button>
        </div>
        <div className="flex justify-center pt-1" role="group" aria-label="Show planned days as">
          <div className="flex rounded-full bg-surface p-[3px] text-[13px]">
            {([['outfits', 'Outfits'], ['colors', 'Colors']] as const).map(([v, l]) => (
              <button key={v} onClick={() => setMode(v)} aria-pressed={mode === v}
                className={`rounded-full px-4 py-1.5 transition-colors ${mode === v ? 'bg-bg font-semibold shadow-overlay' : 'text-text/55'}`}>{l}</button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1.5 pt-1.5 text-center text-[12px] text-text/50">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => <span key={d}>{d}</span>)}</div>
        <div className="grid grid-cols-7 gap-x-1.5 gap-y-1">
          {cells.map((d) => {
            const inMonth = d.slice(0, 7) === m
            const p = state.planned.filter((x) => x.date === d).sort((a, b) => a.position - b.position)[0]
            const o = p ? state.outfits.find((x) => x.id === p.outfitId) : undefined
            const ids = o?.itemIds ?? []
            const isToday = d === today
            return (
              <div key={d} className="flex flex-col items-center gap-1 border-t border-border pt-1">
                <span className={`flex h-[22px] w-[22px] items-center justify-center rounded-full text-[13px] font-medium ${isToday ? 'bg-primary text-cloud' : !inMonth ? 'text-text/30' : ''}`}>{parse(d).getDate()}</span>
                {inMonth ? (
                  <button onClick={() => { if (p && mode === 'colors') nav(`/planner/colors?id=${p.id}`); else if (p) nav(`/planner?date=${d}`); else { setDraft({ date: d, itemIds: [], occasion: occasionLabel(state, d) }); nav(`/planner/add?date=${d}`) } }}
                    className={`relative flex h-[66px] w-full flex-col items-center justify-center overflow-hidden rounded-sm ${p ? 'bg-tile' : 'bg-soft text-[22px] text-text/45'}`}>
                    {p ? (mode === 'colors' ? <Swatches rows={stripRows(state.items, p, ids)} label={`Colors for ${fmtShort(d)}`} /> : <MiniCollage itemIds={ids} layout={o?.layout} />) : '+'}
                  </button>
                ) : <span className="h-[66px]" />}
              </div>
            )
          })}
        </div>
      </div>
    </Screen>
  )
}

/* ---------------- Add outfit ---------------- */
function ItemGrid({ selected, onToggle, category, leading }: { selected: string[]; onToggle: (id: string) => void; category: Category | 'all'; leading?: React.ReactNode }) {
  const { state } = useStore()
  const items = state.items.filter((i) => i.status === 'active' && i.tagged && (category === 'all' || i.category === category))
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {leading}
      {items.map((it) => {
        const on = selected.includes(it.id)
        return (
          <button key={it.id} onClick={() => onToggle(it.id)} className="relative flex aspect-[1.08] items-center justify-center rounded-md bg-tile">
            <ItemImage item={it} size={92} />
            <span className={`absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full border-[1.5px] ${on ? 'border-primary bg-primary text-cloud' : 'border-accent bg-bg/60'}`}>{on && <Icon name="check" size={15} strokeWidth={2.4} />}</span>
          </button>
        )
      })}
    </div>
  )
}
const CAT_CHIPS: (Category | 'all')[] = ['all', ...CATEGORIES]
function CatChips({ value, onChange }: { value: Category | 'all'; onChange: (c: Category | 'all') => void }) {
  return <div className="no-scrollbar flex gap-2 overflow-x-auto">{CAT_CHIPS.map((c) => <Chip key={c} label={c === 'all' ? 'All' : CATEGORY_LABEL[c]} selected={value === c} onClick={() => onChange(c)} />)}</div>
}

/** Keeps a draft in the store while moving between Add outfit, Canvas, Add clothes and Details. */
function useDraft() {
  const { state, setDraft, today } = useStore()
  const [params] = useSearchParams()
  const date = params.get('date') ?? state.draft?.date ?? today
  useEffect(() => { if (!state.draft || state.draft.date !== date) setDraft({ date, itemIds: [], occasion: occasionLabel(state, date) }) }, [date]) // eslint-disable-line react-hooks/exhaustive-deps
  const draft = state.draft && state.draft.date === date ? state.draft : { date, itemIds: [] as string[], occasion: occasionLabel(state, date) }
  const toggle = (id: string) => setDraft({ ...draft, itemIds: draft.itemIds.includes(id) ? draft.itemIds.filter((x) => x !== id) : [...draft.itemIds, id], layout: draft.layout?.filter((l) => l.itemId !== id) })
  return { draft, setDraft, toggle }
}

export function AddOutfit() {
  const { state, suggestFor } = useStore()
  const nav = useNavigate()
  const { draft, setDraft, toggle } = useDraft()
  const [cat, setCat] = useState<Category | 'all'>('all')
  const [panel, setPanel] = useState<'favorites' | 'recent' | null>(null)
  const favorites = state.outfits.filter((o) => o.isFavorite && o.itemIds.length)
  const recentIds = [...new Set(state.wear.slice().reverse().map((w) => w.outfitId).filter(Boolean))].slice(0, 9) as string[]
  const recent = recentIds.map((id) => state.outfits.find((o) => o.id === id)).filter(Boolean) as typeof favorites
  const useSuggested = () => { const s = suggestFor(draft.date); setDraft({ ...draft, itemIds: s.itemIds, layout: undefined, reason: s.reason, suggested: true, occasion: draft.occasion ?? s.occasion }); nav('/planner/canvas') }
  const list = panel === 'favorites' ? favorites : recent
  const hasCloset = state.items.some((i) => i.tagged && i.status === 'active')
  return (
    <Screen pad={false}>
      <div className="flex items-center px-5 pt-1 pb-2">
        <div className="w-[100px]"><CircleButton /></div>
        <h1 className="display flex-1 text-center text-[24px]">{draft.editingId ? 'Edit outfit' : 'Add outfit'}</h1>
        <div className="flex w-[100px] justify-end"><Pill><Icon name="calendar" size={18} />{fmtShort(draft.date).split(', ')[1]}</Pill></div>
      </div>
      <div className="grid grid-cols-3 gap-2.5 px-5 pt-2">
        {([['Suggested', 'spark', useSuggested], ['Favorites', 'heart', () => setPanel(panel === 'favorites' ? null : 'favorites')], ['Recent', 'calendar', () => setPanel(panel === 'recent' ? null : 'recent')]] as const).map(([l, i, f]) => (
          <Card key={l} onClick={f} className={`flex flex-col items-center gap-2 py-4 ${panel === l.toLowerCase() ? 'ring-[1.5px] ring-primary' : ''}`}><Icon name={i} size={24} /><span className="text-[13px] font-medium">{l}</span></Card>
        ))}
      </div>
      {panel && (
        <div key={panel} className="unfold no-scrollbar flex gap-2 overflow-x-auto px-5 pt-3">
          {list.length ? list.map((o) => (
            <button key={o.id} onClick={() => { setDraft({ ...draft, itemIds: o.itemIds, layout: o.layout }); nav('/planner/canvas') }} className="shrink-0 rounded-md bg-surface p-2"><Thumbs itemIds={o.itemIds} size={30} bg={false} /></button>
          )) : <p className="text-[13px] text-text-muted">{panel === 'favorites' ? 'No favorites yet — turn on “Save to favorites” when you save an outfit.' : 'Nothing worn yet — tap “Wore it” on Home.'}</p>}
        </div>
      )}
      <div className="px-5 pt-3.5 pb-2"><CatChips value={cat} onChange={setCat} /></div>
      <div className="flex-1 px-4 pb-4">
        {hasCloset ? <ItemGrid selected={draft.itemIds} onToggle={toggle} category={cat} /> : <Empty title="Your closet is empty" body="Add pieces first, then build outfits from them." action={<Button to="/closet/add">Add pieces</Button>} />}
      </div>
      <div className="sticky bottom-0 flex items-center justify-between border-t border-border bg-bg px-5 py-3">
        <span className="text-[16px] font-medium">{draft.itemIds.length} selected</span>
        <Button full={false} onClick={() => draft.itemIds.length && nav('/planner/canvas')}>Next</Button>
      </div>
    </Screen>
  )
}

/* ---------------- Canvas (drag to arrange; tap a piece to resize, flip, duplicate or remove) ---------------- */
const newKey = () => Math.random().toString(36).slice(2, 9)
export function Canvas() {
  const { state, saveFavorite, removeFavorite } = useStore()
  const nav = useNavigate()
  const { draft, setDraft } = useDraft()
  const items = draft.itemIds.map((id) => state.items.find((i) => i.id === id)).filter(Boolean) as Item[]
  const base = (draft.layout?.length ? draft.layout : []).filter((l) => items.some((i) => i.id === l.itemId))
  const missing = items.filter((i) => !base.some((b) => b.itemId === i.id))
  const initial: Placed[] = [...base, ...autoLayout(missing).map((p) => ({ ...p, x: p.x * 1.25, y: p.y * 1.25 + 40, s: p.s * 1.25 }))].map((p) => ({ ...p, key: p.key ?? newKey() }))
  const [placed, setPlaced] = useState<Placed[]>(initial)
  const [sel, setSel] = useState<string | null>(null)
  useEffect(() => { setPlaced(initial) }, [draft.itemIds.join()]) // eslint-disable-line react-hooks/exhaustive-deps
  const drag = useRef<{ key: string; mode: 'move' | 'size'; dx: number; dy: number; x0: number; s0: number } | null>(null)
  const area = useRef<HTMLDivElement>(null)
  const zoomOf = () => { const r = area.current!.getBoundingClientRect(); return { r, z: r.width / area.current!.offsetWidth || 1 } }
  const move = (e: React.PointerEvent) => {
    if (!drag.current || !area.current) return
    const { r, z } = zoomOf()
    const { key, mode, dx, dy, x0, s0 } = drag.current
    const px = (e.clientX - r.left) / z, py = (e.clientY - r.top) / z
    setPlaced((ps) => ps.map((p) => (p.key !== key ? p : mode === 'move' ? { ...p, x: px - dx, y: py - dy } : { ...p, s: Math.max(40, Math.min(420, s0 + (px - x0))) })))
  }
  const keep = (ps = placed) => setDraft({ ...draft, layout: ps })
  const change = (f: (ps: Placed[]) => Placed[]) => { const next = f(placed); setPlaced(next); keep(next) }
  const cur = placed.find((p) => p.key === sel)
  const resize = (k: number) => change((ps) => ps.map((p) => (p.key === sel ? { ...p, s: Math.max(40, Math.min(420, p.s * k)) } : p)))
  const flip = () => change((ps) => ps.map((p) => (p.key === sel ? { ...p, flip: !p.flip } : p)))
  const duplicate = () => { if (!cur) return; const k = newKey(); change((ps) => [...ps, { ...cur, key: k, x: cur.x + 24, y: cur.y + 24 }]); setSel(k) }
  const remove = () => {
    if (!cur) return
    const rest = placed.filter((p) => p.key !== sel)
    const stillUsed = rest.some((p) => p.itemId === cur.itemId)
    setSel(null); setPlaced(rest)
    setDraft({ ...draft, layout: rest, itemIds: stillUsed ? draft.itemIds : draft.itemIds.filter((x) => x !== cur.itemId) })
  }
  const toggleFav = () => {
    if (draft.favoriteId) { removeFavorite(draft.favoriteId); setDraft({ ...draft, layout: placed, favoriteId: undefined }); toast('Removed from favorites') }
    else if (items.length) { setDraft({ ...draft, layout: placed, favoriteId: saveFavorite(draft.itemIds, placed) }); toast('Saved to favorites') }
  }
  const tool = (label: string, icon: React.ReactNode, onClick: () => void) => (
    <button onClick={onClick} className="flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium text-on-ink">{icon}{label}</button>
  )
  return (
    <Screen dark pad={false}>
      <div ref={area} onPointerMove={move} onPointerUp={() => { if (drag.current) { drag.current = null; keep() } }}
        onPointerDown={(e) => { if (e.target === e.currentTarget) setSel(null) }}
        className="relative h-[630px] shrink-0 touch-none overflow-hidden rounded-[28px] bg-board">
        <CircleButton className="absolute top-[18px] left-[18px] z-10 !bg-cloud" onClick={() => { keep(); nav(-1) }} />
        <div className="absolute top-[18px] right-[18px] z-10 flex items-center gap-2">
          <button onClick={toggleFav} aria-label={draft.favoriteId ? 'Remove from favorites' : 'Save to favorites'} aria-pressed={!!draft.favoriteId}
            className={`flex h-10 w-10 items-center justify-center rounded-full ${draft.favoriteId ? 'bg-primary text-cloud' : 'bg-cloud'}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill={draft.favoriteId ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /></svg>
          </button>
          <button onClick={() => { keep(); nav('/planner/details') }} className="flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-[15px] font-semibold text-cloud">Next <Icon name="arrow" size={18} /></button>
        </div>
        {placed.map((p) => {
          const it = items.find((i) => i.id === p.itemId)
          if (!it) return null
          const on = p.key === sel
          return (
            <div key={p.key} className={`absolute cursor-grab active:cursor-grabbing ${on ? 'outline-[1.5px] outline-dashed outline-accent' : ''}`} style={{ left: p.x, top: p.y, width: p.s, height: p.s }}
              onPointerDown={(e) => {
                const el = e.currentTarget as HTMLElement
                const r = el.getBoundingClientRect(); const z = r.width / el.offsetWidth || 1
                drag.current = { key: p.key!, mode: 'move', dx: (e.clientX - r.left) / z, dy: (e.clientY - r.top) / z, x0: 0, s0: p.s }
                setSel(p.key!)
                setPlaced((ps) => [...ps.filter((x) => x.key !== p.key), p])
              }}>
              <span className="block" style={{ transform: p.flip ? 'scaleX(-1)' : undefined }}><ItemImage item={it} size={p.s} /></span>
              {on && (
                <span aria-label="Drag to resize" className="absolute -right-2.5 -bottom-2.5 h-6 w-6 cursor-nwse-resize rounded-full border-2 border-bg bg-primary"
                  onPointerDown={(e) => { e.stopPropagation(); const { r, z } = zoomOf(); drag.current = { key: p.key!, mode: 'size', dx: 0, dy: 0, x0: (e.clientX - r.left) / z, s0: p.s } }} />
              )}
            </div>
          )
        })}
        {!items.length && <p className="absolute inset-x-0 top-1/2 text-center text-[14px] text-ink/55">Tap “Add clothes” to start</p>}
        <p className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-[12px] text-ink/45">{sel ? 'Drag the dot to resize' : 'Drag to arrange · tap a piece to edit it'}</p>
      </div>
      <div className="px-4 pt-3">
        {cur ? (
          <div className="pop-in flex rounded-md bg-ink-2">
            {tool('Smaller', <span className="text-[20px] leading-6">−</span>, () => resize(1 / 1.15))}
            {tool('Bigger', <span className="text-[20px] leading-6">+</span>, () => resize(1.15))}
            {tool('Flip', <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><path d="M12 3v18M9 7 3 17h6zM15 7l6 10h-6z" /></svg>, flip)}
            {tool('Duplicate', <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 5H6a2 2 0 0 0-2 2v9" /></svg>, duplicate)}
            {tool('Remove', <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12" /></svg>, remove)}
            {tool('Done', <Icon name="check" size={24} />, () => setSel(null))}
          </div>
        ) : (
          <button onClick={() => { keep(); nav('/planner/add-clothes') }} className="pop-in press flex w-full flex-col items-center gap-1.5 rounded-md bg-ink-2 py-3 text-[12px] font-medium text-on-ink"><Icon name="addTop" />Add clothes</button>
        )}
      </div>
    </Screen>
  )
}

/* ---------------- Add clothes (sheet over the dimmed canvas) ---------------- */
export function AddClothes() {
  const nav = useNavigate()
  const { draft, toggle } = useDraft()
  const [cat, setCat] = useState<Category | 'all'>('all')
  return (
    <Screen dark pad={false}>
      <div className="flex h-[110px] shrink-0 items-start justify-between rounded-t-[28px] bg-[#8D857B] p-[18px] opacity-80">
        <span className="h-10 w-10 rounded-full bg-[#B0A99F]" />
        <span className="rounded-full bg-primary/70 px-4 py-2.5 text-[15px] font-semibold text-cloud/70">Next →</span>
      </div>
      <div className="-mt-3 flex min-h-0 flex-1 flex-col rounded-t-[26px] bg-bg">
        <div className="flex justify-center pt-2.5 pb-3"><span className="h-[5px] w-10 rounded-full bg-border" /></div>
        <div className="px-4 pb-3"><CatChips value={cat} onChange={setCat} /></div>
        <div className="no-scrollbar flex-1 overflow-y-auto px-4">
          <ItemGrid selected={draft.itemIds} onToggle={toggle} category={cat}
            leading={<Link to="/closet/add" className="flex aspect-[1.08] items-center justify-center rounded-lg border-[1.2px] border-dashed border-accent bg-cloud"><Icon name="plus" /></Link>} />
        </div>
        <div className="flex items-center justify-between border-t border-border px-5 py-3">
          <span className="text-[16px] font-medium">{draft.itemIds.length} selected</span>
          <Button full={false} onClick={() => nav(-1)}>Done</Button>
        </div>
      </div>
    </Screen>
  )
}

/* ---------------- Outfit details ---------------- */
const OCCASIONS = ['Work day', 'Off day', ...ACTIVITIES]
export function OutfitDetails() {
  const { state, plan, setDraft, weatherFor, removeFavorite } = useStore()
  const nav = useNavigate()
  const { draft } = useDraft()
  const [date, setDate] = useState(draft.date)
  const base = draft.occasion?.startsWith('Work day') ? 'Work day' : draft.occasion?.split(' · ')[0] ?? 'Work day'
  const [occ, setOcc] = useState(OCCASIONS.includes(base) ? base : 'Off day')
  const [note, setNote] = useState(draft.note ?? '')
  const existing = draft.editingId ? state.planned.find((p) => p.id === draft.editingId) : undefined
  const [fav, setFav] = useState(!!draft.favoriteId || (existing ? !!state.outfits.find((o) => o.id === existing.outfitId)?.isFavorite : false))
  const w = weatherFor(date)
  const save = () => {
    const occasion = occ === 'Work day' ? `Work day · ${state.profile.workHours}` : occ
    if (draft.favoriteId) removeFavorite(draft.favoriteId) // the hearted copy is replaced by this saved outfit
    plan({ date, itemIds: draft.itemIds, layout: draft.layout, occasion, note, reason: draft.reason, suggested: draft.suggested, editingId: date === draft.date ? draft.editingId : undefined, favorite: fav })
    setDraft(undefined)
    toast(draft.editingId && date === draft.date ? 'Changes saved' : 'Outfit saved')
    nav(`/planner?date=${date}`, { replace: true })
  }
  return (
    <Screen>
      <div className="flex items-center"><div className="w-20"><CircleButton /></div><h1 className="display flex-1 text-center text-[24px]">{draft.editingId ? 'Edit outfit' : 'New outfit'}</h1><div className="w-20" /></div>
      <div className="flex justify-center pt-3.5"><div className="relative h-[280px] w-[210px] overflow-hidden rounded-[18px] bg-tile"><Collage itemIds={draft.itemIds} layout={draft.layout} width={210} height={268} top={12} /></div></div>
      <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note…" className="mt-3.5 bg-transparent text-[16px] outline-none placeholder:text-text/45" />
      <div className="mt-2">
        <label className="flex items-center gap-3.5 border-b border-border py-3.5"><Icon name="calendar" size={24} /><span className="flex-1 text-[16px] font-medium">Date</span>
          <input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} className="bg-transparent text-right text-[15px] font-semibold outline-none" /></label>
        <div className="flex flex-col gap-2 border-b border-border py-3.5"><span className="flex items-center gap-3.5 text-[16px] font-medium"><Icon name="brief" size={24} />Occasion</span>
          <div className="no-scrollbar flex gap-2 overflow-x-auto">{OCCASIONS.map((o) => <Chip key={o} small label={o} selected={occ === o} onClick={() => setOcc(o)} />)}</div></div>
        <div className="flex items-center gap-3.5 border-b border-border py-3.5"><Icon name="rain" size={24} /><span className="flex-1 text-[16px] font-medium">Weather</span><span className="text-[15px] font-semibold">{w ? `${deg(w.high, state.profile.unit)} / ${deg(w.low, state.profile.unit)}${isRainy(w) ? ' · rain' : ''}` : '—'}</span></div>
        <div className="flex items-center gap-3.5 border-b border-border py-3.5"><Icon name="heart" size={24} /><span className="flex-1 text-[16px] font-medium">Save to favorites</span><Toggle initial={fav} onChange={setFav} /></div>
        <div className="flex items-center gap-3.5 py-3.5"><Icon name="lock" size={24} /><div className="flex-1"><p className="text-[16px] font-medium">Private to you</p><p className="text-[13px] text-text-muted">Saved on this device only</p></div></div>
      </div>
      <div className="flex-1" />
      <Button onClick={save}>{draft.editingId ? 'Save changes' : 'Save outfit'}</Button>
    </Screen>
  )
}

/* ---------------- Off day / day type ---------------- */
export function OffDay() {
  const { state, setDay, weatherFor } = useStore()
  const nav = useNavigate()
  const date = useDateParam()
  const info = dayInfo(state, date)
  const [type, setType] = useState(info.dayType)
  const [acts, setActs] = useState<Activity[]>(info.activities)
  const w = weatherFor(date)
  const toggle = (a: Activity) => setActs(acts.includes(a) ? acts.filter((x) => x !== a) : [...acts, a])
  return (
    <Screen tabs>
      <div className="flex flex-1 flex-col gap-4">
        <BackBar />
        <Header eyebrow={`${fmtShort(date)} · ${type === 'work' ? 'Work day' : 'Off day'}`} title={type === 'work' ? 'A work day' : 'What are you up to?'} body={type === 'work' ? `Outfits use your work pieces (${state.profile.workHours}).` : 'Pick everything you’ve got planned. We’ll dress you for the dressiest one.'} />
        <div className="flex gap-2"><Chip label="Work day" selected={type === 'work'} onClick={() => setType('work')} /><Chip label="Off day" selected={type === 'off'} onClick={() => setType('off')} /></div>
        {type === 'off' && <div className="flex flex-wrap gap-2">{ACTIVITIES.map((a) => <Chip key={a} label={a} selected={acts.includes(a)} onClick={() => toggle(a)} />)}</div>}
        {w && <Card><p className="text-[15px] font-medium">{deg(w.high, state.profile.unit)} / {deg(w.low, state.profile.unit)} · {isRainy(w) ? 'rain' : condition(w.code)}</p><p className="text-[13px] text-text-muted">{w.high < 50 ? 'Bring a layer' : w.high >= 75 ? 'Keep it light' : 'Mild day'}</p></Card>}
        <div className="flex-1" />
        <Button onClick={() => { setDay(date, type, type === 'off' ? acts : []); toast('Day updated'); nav(`/planner?date=${date}`, { replace: true }) }}>Get my outfit</Button>
      </div>
    </Screen>
  )
}

/* ---------------- Plan the week (Mon–Fri, no repeats) ---------------- */
export function PlanWeek() {
  const { state, suggestFor, plan, setDraft, today, weatherFor } = useStore()
  const nav = useNavigate()
  const d = parse(today).getDay()
  const mon = monday(d === 0 || d === 6 ? addDays(today, d === 6 ? 2 : 1) : today)
  const dates = [0, 1, 2, 3, 4].map((i) => addDays(mon, i))
  const used = new Set<string>()
  const rows = dates.map((date) => {
    const p = state.planned.filter((x) => x.date === date).sort((a, b) => a.position - b.position)[0]
    let ids = p ? state.outfits.find((o) => o.id === p.outfitId)?.itemIds ?? [] : suggestFor(date, new Set(used)).itemIds
    // Not enough pieces left for a fresh outfit → reuse the least-recently-worn ones rather than leave the day empty.
    if (!p && (ids.length < 2 || !ids.some((id) => state.items.find((i) => i.id === id)?.category === 'shoes'))) {
      const catOf = (id: string) => state.items.find((i) => i.id === id)?.category
      const have = new Set(ids.map(catOf))
      const hasBody = have.has('dress') || (have.has('top') && have.has('bottom'))
      const fallback = suggestFor(date).itemIds
      ids = hasBody ? [...ids, ...fallback.filter((id) => !have.has(catOf(id)) && !['top', 'bottom', 'dress'].includes(catOf(id) ?? ''))] : fallback
    }
    const repeat = ids.some((id) => used.has(id))
    ids.forEach((id) => used.add(id))
    return { date, p, ids, repeat }
  })
  const anyRepeat = rows.some((r) => r.repeat)
  const saveAll = () => { rows.forEach((r) => { if (!r.p && r.ids.length) plan({ date: r.date, itemIds: r.ids, occasion: occasionLabel(state, r.date), suggested: true, reason: 'Planned with the week — no repeats Mon–Fri.' }) }); toast('Work week planned'); nav(`/planner?date=${mon}`) }
  const hasCloset = state.items.some((i) => i.tagged && i.status === 'active')
  return (
    <Screen tabs>
      <div className="flex flex-1 flex-col gap-3">
        <BackBar />
        <Header eyebrow="Sunday planning" title="Plan your work week" />
        {!hasCloset ? <Empty title="Add pieces first" body="Capsule plans the week from what’s in your closet." action={<Button to="/closet/add">Add pieces</Button>} /> : (
          <>
            <p className="rounded-[10px] bg-soft px-3.5 py-2.5 text-[13px] font-medium">{anyRepeat ? 'Some pieces repeat — add more work pieces for a no-repeat week.' : rows.some((r) => !r.ids.length) ? 'Not enough work pieces yet to fill the week.' : '✓ No piece repeats Monday to Friday'}</p>
            {rows.map((r) => {
              const w = weatherFor(r.date)
              return (
                <Card key={r.date} className="flex items-center gap-3 p-3">
                  <div className="w-[70px]"><p className="text-[13px] font-semibold">{dayShort(r.date).toUpperCase()} {parse(r.date).getDate()}</p><p className="text-[12px] text-text-muted">{w ? `${deg(w.high, state.profile.unit)}${isRainy(w) ? ' · rain' : ''}` : ''}{r.p ? ' · saved' : ''}</p></div>
                  <div className="flex flex-1 gap-1.5 overflow-hidden">{r.ids.slice(0, 4).map((id) => { const it = state.items.find((i) => i.id === id); return it ? <span key={id} className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-tile"><ItemImage item={it} size={32} /></span> : null })}</div>
                  <button onClick={() => { setDraft({ date: r.date, itemIds: r.ids, editingId: r.p?.id, occasion: occasionLabel(state, r.date) }); nav(`/planner/add?date=${r.date}`) }} className="text-[13px] font-medium text-text/70">Edit</button>
                </Card>
              )
            })}
            <div className="flex-1" />
            <Button onClick={saveAll}>Save the week</Button>
          </>
        )}
      </div>
    </Screen>
  )
}

