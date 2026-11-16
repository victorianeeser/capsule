import type { Activity, Category, DayType, DressLevel, Item, State } from './types'
import type { DayWeather } from './weather'
import { isRainy, isSnowy } from './weather'
import { addDays, dow, monday } from './dates'

/** The rule-based outfit engine from CLAUDE.md ("Suggestion rules"). No AI. */

export function dayInfo(s: State, date: string): { dayType: DayType; activities: Activity[] } {
  const d = s.days.find((x) => x.date === date)
  return { dayType: d?.dayType ?? s.profile.routine[dow(date)], activities: d?.activities ?? [] }
}

export function occasionLabel(s: State, date: string) {
  const { dayType, activities } = dayInfo(s, date)
  if (dayType === 'work') return `Work day · ${s.profile.workHours}`
  return activities.length ? activities.join(' · ') : 'Off day'
}

/** Wear stats from the log (times worn, last worn date). */
export function wearStats(s: State) {
  const m = new Map<string, { times: number; last?: string }>()
  for (const w of s.wear) {
    const e = m.get(w.itemId) ?? { times: 0 }
    e.times++
    if (!e.last || w.wornOn > e.last) e.last = w.wornOn
    m.set(w.itemId, e)
  }
  return m
}

const RANK: Activity[] = ['Going out', 'Brunch', 'Game day', 'Errands', 'Lounging', 'Gym']
function dressLevels(dayType: DayType, activities: Activity[]): DressLevel[] {
  if (dayType === 'work') return ['work', 'casual']
  const top = RANK.find((a) => activities.includes(a))
  if (top === 'Going out') return ['going-out', 'casual']
  if (top === 'Brunch') return ['casual', 'going-out']
  if (top === 'Gym') return ['athletic', 'casual']
  return ['casual']
}

/**
 * Should Capsule suggest an outfit on its own? Only on work days, or off days where you picked activities —
 * never on a day marked "No outfit needed". You can still ask for one from the Planner.
 */
export function autoSuggests(s: State, date: string) {
  if (s.skipped.includes(date)) return false
  const { dayType, activities } = dayInfo(s, date)
  return dayType === 'work' || activities.length > 0
}

export interface Suggestion { itemIds: string[]; reason: string; missing: string[]; occasion: string }

export function suggest(s: State, date: string, w: DayWeather | undefined, exclude = new Set<string>()): Suggestion {
  const { dayType, activities } = dayInfo(s, date)
  const levels = dressLevels(dayType, activities)
  const stats = wearStats(s)
  const rain = isRainy(w) || isSnowy(w)
  const high = w?.high
  const cold = high !== undefined && high < 50
  const veryCold = high !== undefined && high < 40
  const hot = high !== undefined && high >= 75

  // Pieces worn (or planned) recently can't repeat; on workdays, nothing repeats within the Mon–Fri week.
  // A piece you own several of (quantity) can be used that many times before it counts as a repeat.
  const uses = new Map<string, Set<string>>() // itemId → dates used
  const use = (id: string, d: string) => { const u = uses.get(id) ?? new Set<string>(); u.add(d); uses.set(id, u) }
  const windowStart = addDays(date, -s.profile.repeatDays)
  for (const e of s.wear) if (e.wornOn >= windowStart && e.wornOn < date) use(e.itemId, e.wornOn)
  if (dayType === 'work') {
    const mon = monday(date)
    for (const p of s.planned) if (p.date >= mon && p.date < date) s.outfits.find((o) => o.id === p.outfitId)?.itemIds.forEach((i) => use(i, p.date))
    for (const e of s.wear) if (e.wornOn >= mon && e.wornOn < date) use(e.itemId, e.wornOn)
  }
  const qty = new Map(s.items.map((i) => [i.id, Math.max(1, i.quantity ?? 1)]))
  const recent = new Set([...uses].filter(([id, d]) => d.size >= (qty.get(id) ?? 1)).map(([id]) => id))

  const pool = s.items.filter((i) =>
    i.status === 'active' && i.tagged &&
    (dayType === 'work' ? i.context !== 'weekend' : i.context !== 'work') &&
    !(rain && i.delicate) && !exclude.has(i.id) &&
    (i.category !== 'lounge' || (dayType === 'off' && activities.includes('Lounging'))),
  )
  const fresh = pool.filter((i) => !recent.has(i.id))

  const score = (i: Item) => {
    const st = stats.get(i.id)
    const best = Math.min(...i.dressLevels.map((l) => (levels.includes(l) ? levels.indexOf(l) : 9)))
    let sc = (st?.times ?? 0) * 10 + best * 5 // least-worn first, best dress level first
    if (i.category === 'sweater') sc += cold ? -6 : hot ? 12 : 0 // sweaters on cold days, not hot ones
    if (cold && i.warmth === 'light' && i.category !== 'shoes') sc += 6
    if (hot && i.warmth === 'warm') sc += 6
    if (st?.last) sc -= Math.min(30, (Date.parse(date) - Date.parse(st.last)) / 86400000) / 3
    return sc
  }
  const fits = (i: Item) => i.dressLevels.some((l) => levels.includes(l))
  const pick = (cat: Category | Category[], extra?: (i: Item) => boolean): Item | undefined => {
    const cats = Array.isArray(cat) ? cat : [cat]
    const ok = (i: Item) => cats.includes(i.category) && fits(i) && (!extra || extra(i))
    return [...fresh.filter(ok)].sort((a, b) => score(a) - score(b))[0] ?? [...pool.filter(ok)].sort((a, b) => score(a) - score(b))[0]
  }

  const missing: string[] = []
  const chosen: Item[] = []
  const levelWord = dayType === 'work' ? 'work' : levels[0] === 'going-out' ? 'going-out' : levels[0] === 'athletic' ? 'gym' : 'casual'

  const preferDress = levels[0] === 'going-out'
  const lounging = dayType === 'off' && activities.length > 0 && activities.every((a) => a === 'Lounging')
  const lounge = lounging ? pick('lounge', () => true) : undefined
  const dress = pick('dress')
  const top = pick(['top', 'sweater']), bottom = pick('bottom')
  if (lounge) {
    // Lounging: lounge pieces first (a set, or a lounge piece plus a top/bottom).
    chosen.push(lounge)
    const second = [...fresh, ...pool].find((i) => i.id !== lounge.id && i.category === 'lounge')
    if (second) chosen.push(second)
    else if (top) chosen.push(top) // one lounge piece (e.g. joggers) + a top
  } else if (preferDress && dress) chosen.push(dress)
  else if (top && bottom) chosen.push(top, bottom)
  else if (dress) chosen.push(dress)
  else { if (!top) missing.push(`${levelWord} tops`); if (!bottom) missing.push(`${levelWord} bottoms`); if (top) chosen.push(top); if (bottom) chosen.push(bottom) }

  const shoes = pick('shoes')
  if (shoes) chosen.push(shoes); else missing.push(`${levelWord} shoes`)

  let outer: Item | undefined
  if (veryCold) { outer = pick('outerwear', (i) => i.warmth === 'warm'); if (!outer) missing.push('warm outerwear') }
  else if (cold || rain) { outer = pick('outerwear'); if (!outer) missing.push(rain ? 'a rain-ready layer' : 'a warm layer') }
  if (outer) chosen.push(outer)

  const acc = pick('accessory')
  if (acc) chosen.push(acc)

  // Reason line
  const bits: string[] = []
  if (high !== undefined) bits.push(`${high}°${rain ? ' and rain' : ''}`)
  let reason = ''
  if (outer && (cold || rain)) reason = `${bits.join('')}, so we added your ${outer.name.toLowerCase()}.`
  else if (high !== undefined) reason = `${bits.join('')} — ${hot ? 'keeping it light' : 'no extra layer needed'}.`
  const repeats = chosen.filter((i) => recent.has(i.id))
  reason += repeats.length ? ` Repeats ${repeats.map((r) => r.name.toLowerCase()).join(', ')} — add more pieces for more variety.` : chosen.length ? ` Nothing here was worn in the last ${s.profile.repeatDays} days.` : ''

  return { itemIds: chosen.map((i) => i.id), reason: reason.trim(), missing, occasion: occasionLabel(s, date) }
}
