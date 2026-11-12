import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { BackBar, Button, Card, ChipGroup, CircleButton, Garment, type GarmentKind, Header, Icon, Pill, Screen, SelectTile, Toggle } from '../ui'

/* ---------------- shared planner chrome ---------------- */
function PlannerNav() {
  const nav = useNavigate()
  return (
    <div className="flex items-center px-5 pt-1 pb-2">
      <div className="w-[100px]" />
      <h1 className="display flex-1 text-center text-[24px]">Planner</h1>
      <div className="flex w-[100px] justify-end"><Pill onClick={() => nav('/planner')}>Today</Pill></div>
    </div>
  )
}
function DayMonth({ active }: { active: 'Day' | 'Month' }) {
  return (
    <div className="flex border-b border-border">
      {(['Day', 'Month'] as const).map((t) => (
        <Link key={t} to={t === 'Day' ? '/planner' : '/planner/month'} className={`flex flex-1 flex-col items-center gap-2.5 pt-2 text-[16px] ${t === active ? 'font-semibold' : 'font-medium text-text/50'}`}>
          {t}
          <span className={`h-0.5 w-full ${t === active ? 'bg-primary' : ''}`} />
        </Link>
      ))}
    </div>
  )
}

type Outfit = { tag: string; kinds: GarmentKind[]; reason?: string; suggested?: boolean }
const WEEK: { d: string; n: number; outfits: Outfit[] }[] = [
  { d: 'Sun', n: 8, outfits: [{ tag: 'Weekend', kinds: ['top', 'jeans', 'shoes'] }] },
  { d: 'Mon', n: 9, outfits: [{ tag: 'Work day · 9–5', kinds: ['knit', 'bottom', 'shoes'] }] },
  { d: 'Tue', n: 10, outfits: [{ tag: 'Work day · 9–5', kinds: ['dress', 'shoes'] }] },
  { d: 'Wed', n: 11, outfits: [{ tag: 'Work day · 9–5', kinds: ['top', 'jeans', 'shoes'], reason: '✓ Worn today' }] },
  {
    d: 'Thu', n: 12, outfits: [
      { tag: 'Work day · 9–5', kinds: ['outerwear', 'knit', 'bottom', 'shoes'], reason: '42° and rain, so we added your trench.', suggested: true },
      { tag: 'Gym · 6 pm', kinds: ['top', 'jeans', 'shoes'], reason: 'Second outfit today · evening gym' },
    ],
  },
  { d: 'Fri', n: 13, outfits: [] },
  { d: 'Sat', n: 14, outfits: [] },
]
const WEATHER: Record<number, string> = { 8: '55° / 40° · sunny', 9: '50° / 38°', 10: '47° / 36°', 11: '46° / 35°', 12: '42° / 35° · rain', 13: '51° / 39°', 14: '58° / 44° · sunny' }
const FULL: Record<string, string> = { Sun: 'Sunday', Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday' }

const LAYOUT: Record<number, [number, number, number][]> = {
  4: [[14, 52, 140], [150, 54, 124], [140, 150, 140], [40, 196, 92]],
  3: [[30, 50, 130], [150, 110, 150], [40, 200, 100]],
  2: [[50, 46, 190], [190, 200, 90]],
}
function Collage({ kinds, scale = 1 }: { kinds: GarmentKind[]; scale?: number }) {
  const pos = LAYOUT[kinds.length] ?? LAYOUT[3]
  return (
    <>
      {kinds.map((k, i) => (
        <Garment key={i} kind={k} size={pos[i][2] * scale} className="absolute" style={{ left: pos[i][0] * scale, top: pos[i][1] * scale }} />
      ))}
    </>
  )
}

function OutfitCard({ o }: { o: Outfit }) {
  const nav = useNavigate()
  return (
    <div onClick={() => nav('/planner/canvas')} className="relative h-[360px] w-[300px] shrink-0 cursor-pointer overflow-hidden rounded-[22px] bg-surface">
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <Link to="/planner/off-day" onClick={(e) => e.stopPropagation()} className="rounded-full bg-primary px-3 py-[7px] text-[13px] font-medium text-cloud">{o.tag}</Link>
        {o.suggested && <span className="flex items-center gap-1.5 rounded-full bg-soft px-2.5 py-[6px] text-[12px] font-medium"><Icon name="spark" size={14} />Suggested</span>}
      </div>
      <span className="absolute top-3.5 right-3.5 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-cloud"><Icon name="more" size={20} /></span>
      <Collage kinds={o.kinds} />
      <div className="absolute inset-x-[18px] bottom-4 flex flex-col gap-1.5">
        {o.reason && <p className="text-[12px] text-text/70">{o.reason}</p>}
        <input onClick={(e) => e.stopPropagation()} placeholder="Add a note…" className="bg-transparent text-[15px] outline-none placeholder:text-text/55" />
      </div>
    </div>
  )
}

/* ---------------- Day ---------------- */
export function PlannerDay() {
  const [sel, setSel] = useState(12)
  const day = WEEK.find((w) => w.n === sel)!
  const idx = WEEK.indexOf(day)
  const prev = WEEK[idx - 1], next = WEEK[idx + 1]
  return (
    <Screen tabs pad={false}>
      <PlannerNav />
      <DayMonth active="Day" />
      <div className="flex bg-surface/50 px-2.5 py-3">
        {WEEK.map((w) => {
          const on = w.n === sel, today = w.n === 11
          return (
            <button key={w.n} onClick={() => setSel(w.n)} className="flex flex-1 flex-col items-center gap-1.5">
              <span className="text-[12px] text-text/50">{w.d}</span>
              <span className={`flex h-9 w-9 items-center justify-center rounded-full text-[17px] ${on ? 'bg-primary font-semibold text-cloud' : today ? 'font-medium text-text-muted' : 'font-medium'}`}>{w.n}</span>
              <span className={`h-[5px] w-[5px] rounded-full ${w.outfits.length ? 'bg-text/60' : ''}`} />
            </button>
          )
        })}
      </div>
      <div className="flex flex-col items-center gap-2 pt-3.5 pb-3">
        <p className="text-[16px] font-semibold">{FULL[day.d]}, Nov {day.n}</p>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-border px-[15px] py-[9px] text-[14px] font-medium">{WEATHER[day.n]}</span>
          {day.outfits.length > 1 && <span className="text-[13px] font-medium text-text/55">{day.outfits.length} outfits ↓</span>}
        </div>
      </div>
      <div className="relative flex flex-col items-center gap-3.5 pb-6">
        {/* neighbors peek in from the sides; tap to switch days */}
        {prev && <button onClick={() => setSel(prev.n)} className="absolute top-0 -left-[266px] h-[360px] w-[300px] rounded-[22px] bg-surface" aria-label="Previous day" />}
        {next && <button onClick={() => setSel(next.n)} className="absolute top-0 -right-[266px] flex h-[360px] w-[300px] items-center rounded-[22px] bg-surface pl-3 text-[28px] text-text/40" aria-label="Next day">+</button>}
        {day.outfits.map((o, i) => <OutfitCard key={i} o={o} />)}
        <Link to="/planner/add" className={`flex w-[300px] items-center justify-center rounded-lg border-[1.2px] border-dashed border-accent text-[15px] font-medium text-text/70 ${day.outfits.length ? 'h-14' : 'h-[360px]'}`}>
          + {day.outfits.length ? 'Add another outfit' : 'Plan this day'}
        </Link>
      </div>
    </Screen>
  )
}

/* ---------------- Month ---------------- */
const MONTH_PLANNED: Record<number, GarmentKind[]> = { 8: ['top', 'jeans'], 9: ['knit', 'bottom'], 10: ['dress'], 11: ['top', 'jeans'], 12: ['outerwear', 'bottom'] }
export function PlannerMonth() {
  const nav = useNavigate()
  const cells = Array.from({ length: 35 }, (_, i) => i + 1)
  return (
    <Screen tabs pad={false}>
      <PlannerNav />
      <DayMonth active="Month" />
      <div className="flex flex-col gap-1.5 px-4 pt-3.5">
        <p className="text-center text-[17px] font-semibold">November 2026</p>
        <div className="grid grid-cols-7 gap-1.5 pt-1.5 text-center text-[12px] text-text/50">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => <span key={d}>{d}</span>)}
        </div>
        <div className="grid grid-cols-7 gap-x-1.5 gap-y-1">
          {cells.map((c) => {
            const inMonth = c <= 30, n = inMonth ? c : c - 30
            const p = inMonth ? MONTH_PLANNED[n] : undefined
            return (
              <div key={c} className="flex flex-col items-center gap-1 border-t border-border pt-1">
                <span className={`flex h-[22px] w-[22px] items-center justify-center rounded-full text-[13px] font-medium ${inMonth && n === 12 ? 'bg-primary text-cloud' : !inMonth ? 'text-text/30' : n === 11 ? 'text-text-muted' : ''}`}>{n}</span>
                {inMonth ? (
                  <button onClick={() => nav(p ? '/planner' : '/planner/add')} className={`flex h-[62px] w-full flex-col items-center justify-center rounded-sm ${p ? 'bg-surface' : 'bg-soft text-[22px] text-text/45'} ${n === 12 ? 'border-[1.5px] border-primary' : ''}`}>
                    {p ? p.map((k, i) => <Garment key={i} kind={k} size={p.length > 1 ? 26 : 40} />) : '+'}
                  </button>
                ) : <span className="h-[62px]" />}
              </div>
            )
          })}
        </div>
      </div>
    </Screen>
  )
}

/* ---------------- Add outfit ---------------- */
const PICK: [GarmentKind, boolean][] = [['top', false], ['knit', true], ['jeans', false], ['bottom', true], ['outerwear', true], ['dress', false], ['shoes', true], ['top', false], ['jeans', false], ['knit', false], ['dress', false], ['bottom', false]]
export function AddOutfit() {
  const [count, setCount] = useState(PICK.filter(([, s]) => s).length)
  return (
    <Screen pad={false}>
      <div className="flex items-center px-5 pt-1 pb-2">
        <div className="w-[100px]"><CircleButton /></div>
        <h1 className="display flex-1 text-center text-[24px]">Add outfit</h1>
        <div className="flex w-[100px] justify-end"><Pill><Icon name="calendar" size={18} />Nov 12</Pill></div>
      </div>
      <div className="grid grid-cols-3 gap-2.5 px-5 pt-2">
        {[['Suggested', 'spark', '/planner/canvas'], ['Saved outfits', 'hanger', ''], ['Outfit photo', 'camera', '']].map(([l, i, to]) => (
          <Card key={l} to={to || undefined} className="flex flex-col items-center gap-2 py-4"><Icon name={i} size={24} /><span className="text-[13px] font-medium">{l}</span></Card>
        ))}
      </div>
      <div className="flex items-center gap-2 px-5 pt-3.5 pb-2">
        <div className="min-w-0 flex-1"><ChipGroup options={['All', 'Tops', 'Bottoms', 'Shoes', 'Outerwear', 'Dresses']} initial={['All']} wrap={false} /></div>
        <CircleButton icon="filter" onClick={() => {}} />
      </div>
      <div className="grid flex-1 grid-cols-3 gap-2.5 px-4 pb-4">
        {PICK.map(([k, s], i) => <SelectTile key={i} kind={k} initial={s} onChange={(v) => setCount((c) => c + (v ? 1 : -1))} />)}
      </div>
      <div className="sticky bottom-0 flex items-center justify-between border-t border-border bg-bg px-5 py-3">
        <span className="text-[16px] font-medium">{count} selected</span>
        <Button full={false} to="/planner/canvas">Next</Button>
      </div>
    </Screen>
  )
}

/* ---------------- Canvas (drag to arrange) ---------------- */
type Placed = { kind: GarmentKind; x: number; y: number; s: number }
export function Canvas() {
  const nav = useNavigate()
  const [items, setItems] = useState<Placed[]>([
    { kind: 'outerwear', x: 18, y: 80, s: 190 }, { kind: 'knit', x: 190, y: 150, s: 160 }, { kind: 'bottom', x: 60, y: 280, s: 220 }, { kind: 'shoes', x: 220, y: 440, s: 120 },
  ])
  const drag = useRef<{ i: number; dx: number; dy: number } | null>(null)
  const area = useRef<HTMLDivElement>(null)
  const move = (e: React.PointerEvent) => {
    if (!drag.current || !area.current) return
    const r = area.current.getBoundingClientRect()
    const z = r.width / area.current.offsetWidth || 1 // phone may be zoomed to fit the window
    const { i, dx, dy } = drag.current
    setItems((its) => its.map((it, j) => (j === i ? { ...it, x: (e.clientX - r.left) / z - dx, y: (e.clientY - r.top) / z - dy } : it)))
  }
  return (
    <Screen dark pad={false}>
      <div ref={area} onPointerMove={move} onPointerUp={() => (drag.current = null)} className="relative mx-0 h-[630px] shrink-0 touch-none overflow-hidden rounded-[28px] bg-bg">
        <CircleButton className="absolute top-[18px] left-[18px] z-10 !bg-cloud" />
        <button onClick={() => nav('/planner/details')} className="absolute top-[18px] right-[18px] z-10 flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-[15px] font-semibold text-cloud">Next <Icon name="arrow" size={18} /></button>
        {items.map((it, i) => (
          <div
            key={i}
            onPointerDown={(e) => {
              const el = e.currentTarget as HTMLElement
              const r = el.getBoundingClientRect()
              const z = r.width / el.offsetWidth || 1
              drag.current = { i, dx: (e.clientX - r.left) / z, dy: (e.clientY - r.top) / z }
              setItems((its) => [...its.filter((_, j) => j !== i), its[i]])
              drag.current.i = items.length - 1
            }}
            className="absolute cursor-grab active:cursor-grabbing"
            style={{ left: it.x, top: it.y }}
          >
            <Garment kind={it.kind} size={it.s} />
          </div>
        ))}
        <p className="absolute inset-x-0 bottom-3 text-center text-[12px] text-text/45">Drag to arrange · pinch to resize</p>
      </div>
      <div className="px-4 pt-3">
        <button onClick={() => nav('/planner/add-clothes')} className="flex w-full flex-col items-center gap-1.5 rounded-md bg-primary-2 py-3 text-[12px] font-medium text-cloud"><Icon name="addTop" />Add clothes</button>
      </div>
    </Screen>
  )
}

/* ---------------- Add clothes (sheet over the dimmed canvas) ---------------- */
const SHEET: GarmentKind[] = ['top', 'knit', 'jeans', 'dress', 'top', 'bottom', 'knit', 'shoes', 'outerwear', 'jeans', 'dress']
export function AddClothes() {
  const nav = useNavigate()
  const [count, setCount] = useState(1)
  return (
    <Screen dark pad={false}>
      <div className="flex h-[110px] shrink-0 items-start justify-between rounded-t-[28px] bg-[#8D857B] p-[18px] opacity-80">
        <span className="h-10 w-10 rounded-full bg-[#B0A99F]" />
        <span className="rounded-full bg-primary/70 px-4 py-2.5 text-[15px] font-semibold text-cloud/70">Next →</span>
      </div>
      <div className="-mt-3 flex min-h-0 flex-1 flex-col rounded-t-[26px] bg-bg">
        <div className="flex justify-center pt-2.5 pb-3"><span className="h-[5px] w-10 rounded-full bg-border" /></div>
        <div className="px-4 pb-3"><ChipGroup options={['All', 'Tops', 'Bottoms', 'Shoes', 'Outerwear', 'Dresses']} initial={['All']} wrap={false} /></div>
        <div className="no-scrollbar grid flex-1 grid-cols-3 gap-2.5 overflow-y-auto px-4">
          <Link to="/closet/add" className="flex aspect-[1.08] items-center justify-center rounded-lg border-[1.2px] border-dashed border-accent bg-cloud"><Icon name="plus" /></Link>
          {SHEET.map((k, i) => <SelectTile key={i} kind={k} initial={i === 2} onChange={(v) => setCount((c) => c + (v ? 1 : -1))} />)}
        </div>
        <div className="flex items-center justify-between border-t border-border px-5 py-3">
          <span className="text-[16px] font-medium">{count} selected</span>
          <Button full={false} onClick={() => nav(-1)}>Done</Button>
        </div>
      </div>
    </Screen>
  )
}

/* ---------------- Outfit details ---------------- */
export function OutfitDetails() {
  const rows: [string, string, string | null][] = [['calendar', 'Date', 'Thu, Nov 12'], ['brief', 'Day', 'Work · 9–5'], ['rain', 'Weather', '42° / 35° · rain']]
  return (
    <Screen>
      <div className="flex items-center">
        <div className="w-20"><CircleButton /></div>
        <h1 className="display flex-1 text-center text-[24px]">New outfit</h1>
        <div className="w-20" />
      </div>
      <div className="flex justify-center pt-3.5">
        <div className="relative h-[280px] w-[210px] rounded-[18px] bg-surface"><Collage kinds={['outerwear', 'knit', 'bottom', 'shoes']} scale={0.72} /></div>
      </div>
      <input placeholder="Add a note…" className="mt-3.5 bg-transparent text-[16px] outline-none placeholder:text-text/45" />
      <div className="mt-2">
        {rows.map(([i, l, v]) => (
          <div key={l} className="flex items-center gap-3.5 border-b border-border py-3.5">
            <Icon name={i} size={24} /><span className="flex-1 text-[16px] font-medium">{l}</span><span className="text-[15px] font-semibold">{v}</span>
            {l !== 'Weather' && <Icon name="chev" size={20} />}
          </div>
        ))}
        <div className="flex items-center gap-3.5 border-b border-border py-3.5"><Icon name="heart" size={24} /><span className="flex-1 text-[16px] font-medium">Save to favorites</span><Toggle initial /></div>
        <div className="flex items-center gap-3.5 py-3.5"><Icon name="lock" size={24} /><div className="flex-1"><p className="text-[16px] font-medium">Private to you</p><p className="text-[13px] text-text-muted">Only you can see your outfits</p></div></div>
      </div>
      <div className="flex-1" />
      <Button to="/planner">Save outfit</Button>
    </Screen>
  )
}

/* ---------------- Off day ---------------- */
export function OffDay() {
  return (
    <Screen tabs>
      <div className="flex flex-1 flex-col gap-4">
        <BackBar />
        <Header eyebrow="Saturday, Nov 14 · Off day" title="What are you up to?" body="Pick everything you’ve got planned. We’ll dress you for the dressiest one." />
        <ChipGroup options={['Brunch', 'Errands', 'Going out', 'Gym', 'Lounging', 'Game day']} initial={['Brunch', 'Errands']} multi />
        <Card><p className="text-[15px] font-medium">58° / 44° · Sunny</p><p className="text-[13px] text-text-muted">Light layer for the evening</p></Card>
        <div className="flex-1" />
        <Button to="/planner">Get my outfit</Button>
        <Button variant="text">Make this a work day</Button>
      </div>
    </Screen>
  )
}

/* ---------------- Plan the week ---------------- */
export function PlanWeek() {
  const days: [string, string, GarmentKind[]][] = [
    ['MON 16', '45°', ['knit', 'bottom', 'shoes', 'outerwear']], ['TUE 17', '48°', ['top', 'jeans', 'shoes', 'outerwear']], ['WED 18', '39° · rain', ['dress', 'outerwear', 'shoes', 'knit']],
    ['THU 19', '44°', ['knit', 'jeans', 'shoes', 'outerwear']], ['FRI 20', '51°', ['top', 'bottom', 'shoes', 'dress']],
  ]
  return (
    <Screen tabs>
      <div className="flex flex-1 flex-col gap-3">
        <BackBar />
        <Header eyebrow="Sunday planning" title="Plan your work week" />
        <p className="rounded-[10px] bg-soft px-3.5 py-2.5 text-[13px] font-medium">✓ No piece repeats Monday to Friday</p>
        {days.map(([d, t, ks]) => (
          <Card key={d} className="flex items-center gap-3 p-3">
            <div className="w-[70px]"><p className="text-[13px] font-semibold">{d}</p><p className="text-[12px] text-text-muted">{t}</p></div>
            <div className="flex flex-1 gap-1.5">{ks.map((k, i) => <span key={i} className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-bg"><Garment kind={k} size={30} /></span>)}</div>
            <Link to="/planner/add" className="text-[13px] font-medium text-text/70">Edit</Link>
          </Card>
        ))}
        <div className="flex-1" />
        <Button to="/planner">Save the week</Button>
      </div>
    </Screen>
  )
}
