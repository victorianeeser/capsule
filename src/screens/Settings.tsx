import { useState } from 'react'
import { useNavigate } from 'react-router'
import { BackBar, Button, Chip, Eyebrow, ListRow, Screen, Title } from '../ui'
import { useStore } from '../lib/store'

const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function Settings() {
  const { state, setProfile, loadDemo, resetAll } = useStore()
  const nav = useNavigate()
  const p = state.profile
  const [confirm, setConfirm] = useState(false)
  const [demoAdded, setDemoAdded] = useState(false)
  const workDays = p.routine.map((t, i) => (t === 'work' ? DAY[i] : '')).filter(Boolean)
  return (
    <Screen tabs>
      <div className="flex flex-col gap-1">
        <BackBar label="Home" />
        <Title>Settings</Title>

        <div className="pt-3">
          <Eyebrow className="text-[11px]">Your week</Eyebrow>
          <ListRow title="Weekly routine" detail={`${workDays.length ? `${workDays[0]}–${workDays[workDays.length - 1]}` : 'No work days'} · Work ${p.workHours}`} to="/onboarding/routine?from=settings" />
        </div>

        <div className="pt-3">
          <Eyebrow className="text-[11px]">Weather</Eyebrow>
          <ListRow title="Home city" detail={p.city} to="/onboarding/city?from=settings" />
          <div className="flex items-center justify-between border-b border-border py-3.5">
            <span className="text-[16px] font-medium">Temperature</span>
            <div className="flex gap-2">{(['F', 'C'] as const).map((u) => <Chip key={u} small label={`°${u}`} selected={p.unit === u} onClick={() => setProfile({ unit: u })} />)}</div>
          </div>
        </div>

        <div className="pt-3">
          <Eyebrow className="text-[11px]">Appearance</Eyebrow>
          <div className="flex flex-col gap-2.5 border-b border-border py-3.5">
            <span className="text-[16px] font-medium">Theme</span>
            <div className="flex gap-2">{([['light', 'Light'], ['dark', 'Dark'], ['system', 'Match my phone']] as const).map(([v, l]) => <Chip key={v} small label={l} selected={(p.theme ?? 'light') === v} onClick={() => setProfile({ theme: v })} />)}</div>
          </div>
        </div>

        <div className="pt-3">
          <Eyebrow className="text-[11px]">Outfit rules</Eyebrow>
          <div className="flex items-center justify-between border-b border-border py-3.5">
            <div><p className="text-[16px] font-medium">Don’t repeat a piece within</p><p className="text-[13px] text-text-muted">Work weeks never repeat Mon–Fri</p></div>
            <div className="flex items-center gap-3">
              <button onClick={() => setProfile({ repeatDays: Math.max(1, p.repeatDays - 1) })} className="h-8 w-8 rounded-full bg-surface text-[18px]" aria-label="Fewer days">−</button>
              <span className="w-14 text-center text-[15px] font-semibold">{p.repeatDays} days</span>
              <button onClick={() => setProfile({ repeatDays: Math.min(14, p.repeatDays + 1) })} className="h-8 w-8 rounded-full bg-surface text-[18px]" aria-label="More days">+</button>
            </div>
          </div>
        </div>

        <div className="pt-3">
          <Eyebrow className="text-[11px]">Your data</Eyebrow>
          <p className="py-3 text-[13px] leading-[1.4] text-text/70">Everything is saved on this device and works offline. Accounts and syncing across devices come later.</p>
          <div className="flex flex-col gap-2.5">
            <Button variant="secondary" onClick={() => { loadDemo(); setDemoAdded(true) }}>{demoAdded ? '✓ Demo closet added' : 'Load demo closet'}</Button>
            {confirm ? (
              <div className="flex gap-2.5">
                <Button variant="secondary" onClick={() => setConfirm(false)}>Cancel</Button>
                <Button onClick={async () => { await resetAll(); nav('/', { replace: true }) }}>Erase all</Button>
              </div>
            ) : <Button variant="text" onClick={() => setConfirm(true)}>Erase everything on this device</Button>}
            {confirm && <p className="text-center text-[12px] text-text/60">Deletes your closet, photos, outfits and plans. This can’t be undone.</p>}
          </div>
        </div>
      </div>
    </Screen>
  )
}
