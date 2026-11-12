import { useState } from 'react'
import { Body, Button, Card, Chip, Eyebrow, Header, Icon, ProgressBar, Screen } from '../ui'

function Field({ label, placeholder, value }: { label: string; placeholder?: string; value?: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium text-text/70">{label}</span>
      <input className="rounded-md border border-border bg-bg px-3.5 py-3.5 text-[15px] outline-none placeholder:text-text/45" placeholder={placeholder} defaultValue={value} />
    </label>
  )
}

function Step({ n }: { n: number }) {
  return (
    <div className="flex flex-col gap-2">
      <Eyebrow className="text-[11px]">Step {n} of 3</Eyebrow>
      <ProgressBar value={n / 3} />
    </div>
  )
}

export function SignIn() {
  return (
    <Screen>
      <div className="flex flex-1 flex-col items-center justify-center gap-1">
        <span className="font-[family-name:var(--font-script)] text-[96px] leading-none">C</span>
        <span className="display text-[32px]">Capsule</span>
        <span className="text-[11px] font-medium tracking-[0.12em] text-text/60">OUTFIT PLANNER · CLOSET TRACKER</span>
      </div>
      <div className="flex flex-col gap-4">
        <Field label="Email" placeholder="you@email.com" />
        <Field label="Password" placeholder="••••••••" />
        <Button to="/onboarding/routine">Sign in</Button>
        <Button variant="text" to="/onboarding/routine">New here? Create an account</Button>
      </div>
    </Screen>
  )
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
export function Routine() {
  const [work, setWork] = useState<Record<string, boolean>>(Object.fromEntries(DAYS.map((d, i) => [d, i < 5])))
  return (
    <Screen>
      <div className="flex flex-1 flex-col gap-4">
        <Step n={1} />
        <Header eyebrow="Set up" title="What does your week look like?" body="We’ll plan work outfits on work days. You can change any single day later." />
        <div>
          {DAYS.map((d) => (
            <div key={d} className="flex items-center gap-2 border-b border-border py-2">
              <span className="flex-1 text-[15px] font-medium">{d}</span>
              <Chip label="Work" selected={work[d]} onClick={() => setWork({ ...work, [d]: true })} small />
              <Chip label="Off" selected={!work[d]} onClick={() => setWork({ ...work, [d]: false })} small />
            </div>
          ))}
        </div>
        <p className="text-[14px] text-text/60">Work hours: 9 – 5</p>
      </div>
      <Button to="/onboarding/city">Next</Button>
    </Screen>
  )
}

export function City() {
  const [unit, setUnit] = useState('°F')
  return (
    <Screen>
      <div className="flex flex-1 flex-col gap-4">
        <Step n={2} />
        <Header eyebrow="Set up" title="Where do you get dressed?" body="We use your location for tomorrow’s weather. Your home city is the backup." />
        <Button variant="secondary">Use my current location</Button>
        <Field label="Home city" value="Lawrence, KS" />
        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-medium text-text/70">Temperature</span>
          <div className="flex gap-2">
            {['°F', '°C'].map((u) => <Chip key={u} label={u} selected={unit === u} onClick={() => setUnit(u)} />)}
          </div>
        </div>
      </div>
      <Button to="/onboarding/pieces">Next</Button>
    </Screen>
  )
}

export function FirstPieces() {
  return (
    <Screen>
      <div className="flex flex-1 flex-col gap-4">
        <Step n={3} />
        <Header eyebrow="Set up" title="Start with your 15 favorite pieces" body="Not your whole closet — just what you reach for most. Add the rest anytime." />
        {[
          ['Upload photos', 'Pick many at once from your camera roll. We remove the backgrounds.'],
          ['Take a photo', 'Snap one piece at a time.'],
        ].map(([t, b]) => (
          <Card key={t} to="/closet/tag" className="flex flex-col gap-1.5">
            <span className="flex items-center gap-2.5 text-[17px] font-semibold"><Icon name="camera" />{t}</span>
            <Body>{b}</Body>
          </Card>
        ))}
        <p className="text-[13px] font-medium text-text/60">0 of 15 added</p>
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 10 }).map((_, i) => <span key={i} className="aspect-square rounded-[10px] border border-dashed border-accent" />)}
        </div>
      </div>
      <Button variant="text" to="/home">Skip for now</Button>
    </Screen>
  )
}
