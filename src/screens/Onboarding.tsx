import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { BackBar, Body, Button, Card, Chip, Eyebrow, Header, Icon, ProgressBar, Screen } from '../ui'
import { useStore } from '../lib/store'
import { toast } from '../lib/toast'
import { searchCity, type Place } from '../lib/weather'
import { PhotoPicker, QueueBanner, ItemImage } from '../components'
import type { DayType } from '../lib/types'

function Step({ n }: { n: number }) {
  return (
    <div className="flex flex-col gap-2">
      <Eyebrow className="text-[11px]">Step {n} of 3</Eyebrow>
      <ProgressBar value={n / 3} />
    </div>
  )
}
/** Onboarding screens double as Settings editors (?from=settings → shows Back and saves). */
const useFromSettings = () => useSearchParams()[0].get('from') === 'settings'

export function Welcome() {
  return (
    <Screen>
      <div className="flex flex-1 flex-col items-center justify-center gap-1">
        <span className="font-[family-name:var(--font-script)] text-[96px] leading-none">C</span>
        <span className="display text-[32px]">Capsule</span>
        <span className="text-[11px] font-medium tracking-[0.12em] text-text/60">OUTFIT PLANNER · CLOSET TRACKER</span>
      </div>
      <div className="flex flex-col gap-3">
        <Body className="text-center">Your closet stays on this phone for now — no account needed.</Body>
        <Button to="/onboarding/routine">Get started</Button>
      </div>
    </Screen>
  )
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const IDX = [1, 2, 3, 4, 5, 6, 0]
export function Routine() {
  const { state, setProfile } = useStore()
  const nav = useNavigate()
  const fromSettings = useFromSettings()
  const [routine, setRoutine] = useState<DayType[]>(state.profile.routine)
  const [hours, setHours] = useState(state.profile.workHours)
  const save = () => { setProfile({ routine, workHours: hours }); if (fromSettings) { toast('Routine saved'); nav(-1) } else nav('/onboarding/city') }
  return (
    <Screen>
      <div className="flex flex-1 flex-col gap-4">
        {fromSettings ? <BackBar /> : <Step n={1} />}
        <Header eyebrow={fromSettings ? 'Settings' : 'Set up'} title="What does your week look like?" body="We’ll plan work outfits on work days. You can change any single day later." />
        <div>
          {DAYS.map((d, i) => {
            const k = IDX[i]
            const set = (t: DayType) => setRoutine(routine.map((x, j) => (j === k ? t : x)))
            return (
              <div key={d} className="flex items-center gap-2 border-b border-border py-2">
                <span className="flex-1 text-[15px] font-medium">{d}</span>
                <Chip label="Work" selected={routine[k] === 'work'} onClick={() => set('work')} small />
                <Chip label="Off" selected={routine[k] === 'off'} onClick={() => set('off')} small />
              </div>
            )
          })}
        </div>
        <label className="flex items-center gap-3 text-[14px] text-text/70">Work hours
          <input value={hours} onChange={(e) => setHours(e.target.value)} className="w-24 rounded-md border border-border px-3 py-2 text-[14px] text-text outline-none" />
        </label>
      </div>
      <Button onClick={save}>{fromSettings ? 'Save' : 'Next'}</Button>
    </Screen>
  )
}

export function City() {
  const { state, setProfile } = useStore()
  const nav = useNavigate()
  const fromSettings = useFromSettings()
  const [q, setQ] = useState(state.profile.city)
  const [results, setResults] = useState<Place[]>([])
  const [picked, setPicked] = useState<{ city: string; lat: number; lon: number } | null>(null)
  const [unit, setUnit] = useState(state.profile.unit)
  const [msg, setMsg] = useState('')
  const find = async () => { setMsg('Searching…'); const r = await searchCity(q.split(',')[0]).catch(() => []); setResults(r); setMsg(r.length ? '' : 'No matches — check the spelling.') }
  const locate = () => {
    if (!navigator.geolocation) return setMsg('Location isn’t available in this browser.')
    setMsg('Finding you…')
    navigator.geolocation.getCurrentPosition(
      (p) => { setPicked({ city: 'Current location', lat: +p.coords.latitude.toFixed(3), lon: +p.coords.longitude.toFixed(3) }); setQ('Current location'); setMsg('Using your current location.') },
      () => setMsg('Location permission was denied — type your city instead.'),
    )
  }
  const save = () => { setProfile({ unit, ...(picked ?? {}) }); if (fromSettings) { toast('Home city saved'); nav(-1) } else nav('/onboarding/pieces') }
  return (
    <Screen>
      <div className="flex flex-1 flex-col gap-4">
        {fromSettings ? <BackBar /> : <Step n={2} />}
        <Header eyebrow={fromSettings ? 'Settings' : 'Set up'} title="Where do you get dressed?" body="We use this for tomorrow’s weather." />
        <Button variant="secondary" onClick={locate}>Use my current location</Button>
        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-text/70">Home city</span>
          <div className="flex gap-2">
            <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && find()} className="min-w-0 flex-1 rounded-md border border-border px-3.5 py-3.5 text-[15px] outline-none" />
            <Button full={false} variant="secondary" onClick={find}>Find</Button>
          </div>
          {msg && <p className="text-[13px] text-text-muted">{msg}</p>}
          {results.map((r) => (
            <button key={`${r.lat},${r.lon}`} onClick={() => { setPicked({ city: `${r.name}, ${r.region.split(',')[0]}`, lat: r.lat, lon: r.lon }); setQ(`${r.name}, ${r.region}`); setResults([]) }}
              className="border-b border-border py-2.5 text-left text-[15px]">{r.name}<span className="text-text-muted"> · {r.region}</span></button>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-medium text-text/70">Temperature</span>
          <div className="flex gap-2">{(['F', 'C'] as const).map((u) => <Chip key={u} label={`°${u}`} selected={unit === u} onClick={() => setUnit(u)} />)}</div>
        </div>
      </div>
      <Button onClick={save}>{fromSettings ? 'Save' : 'Next'}</Button>
    </Screen>
  )
}

export function FirstPieces() {
  const { state, addPhotos, setProfile } = useStore()
  const nav = useNavigate()
  const added = state.items.filter((i) => i.imageId || i.demoKind)
  const done = () => { setProfile({ onboarded: true }); nav(state.items.some((i) => !i.tagged) ? '/closet/tag' : '/home') }
  const onFiles = async (f: File[]) => { await addPhotos(f); toast(`${f.length} ${f.length === 1 ? 'photo' : 'photos'} added`) }
  return (
    <Screen>
      <div className="flex flex-1 flex-col gap-4">
        <Step n={3} />
        <Header eyebrow="Set up" title="Start with your 15 favorite pieces" body="Not your whole closet — just what you reach for most. Add the rest anytime." />
        <QueueBanner />
        <PhotoPicker onFiles={onFiles} className="w-full">
          <Card className="flex flex-col gap-1.5"><span className="flex items-center gap-2.5 text-[17px] font-semibold"><Icon name="camera" />Upload photos</span><Body>Pick many at once from your camera roll. We remove the backgrounds.</Body></Card>
        </PhotoPicker>
        <PhotoPicker onFiles={onFiles} camera multiple={false} className="w-full">
          <Card className="flex flex-col gap-1.5"><span className="flex items-center gap-2.5 text-[17px] font-semibold"><Icon name="camera" />Take a photo</span><Body>Snap one piece at a time.</Body></Card>
        </PhotoPicker>
        <p className="text-[13px] font-medium text-text/60">{Math.min(added.length, 15)} of 15 added</p>
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <span key={i} className={`flex aspect-square items-center justify-center rounded-[10px] ${added[i] ? 'bg-tile' : 'border border-dashed border-accent'}`}>
              {added[i] && <ItemImage item={added[i]} size={52} />}
            </span>
          ))}
        </div>
      </div>
      <Button variant={added.length ? 'primary' : 'text'} onClick={done}>{added.length ? 'Tag my pieces' : 'Skip for now'}</Button>
    </Screen>
  )
}
