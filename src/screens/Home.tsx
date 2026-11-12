import { useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import { Card, Eyebrow, Garment, type GarmentKind, Heading, Icon, Screen, Title, WeatherPill } from '../ui'
import { TOMORROW } from '../data'

function HomeHeader({ greeting, date, weather }: { greeting: string; date: string; weather: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <Eyebrow className="flex-1">{date}</Eyebrow>
        <Link to="/settings" aria-label="Settings" className="flex h-9 w-9 items-center justify-center rounded-full bg-surface">
          <Icon name="sliders" size={20} />
        </Link>
      </div>
      <div className="flex items-center justify-between gap-3">
        <Title className="whitespace-nowrap">{greeting}</Title>
        {weather}
      </div>
    </div>
  )
}

/** The main outfit card on Home: when, weather, day type, the outfit, a reason line and two actions. */
function OutfitCard({ when, weather, kinds, reason, actions }: { when: string; weather: string; kinds: GarmentKind[]; reason: string; actions: ReactNode }) {
  return (
    <Card className="flex flex-col gap-3 p-[18px]">
      <div className="flex items-center justify-between">
        <div>
          <Eyebrow className="text-[11px]">{when}</Eyebrow>
          <p className="text-[15px] font-medium">{weather}</p>
        </div>
        <Link to="/planner/off-day" className="rounded-full bg-primary px-[15px] py-[9px] text-[14px] font-medium text-cloud">Work day</Link>
      </div>
      <div className="flex justify-center gap-1.5 rounded-md bg-cloud py-3">
        {kinds.map((k) => <Garment key={k} kind={k} size={70} />)}
      </div>
      <p className="text-[13px] leading-[1.4] text-text/70">{reason}</p>
      <div className="flex gap-2.5">{actions}</div>
    </Card>
  )
}

/** Small card linking to the other half of the day (today's log at night, tomorrow's plan in the morning). */
function PeekCard({ to, kinds, title, detail }: { to: string; kinds: GarmentKind[]; title: string; detail: string }) {
  return (
    <Card to={to} className="flex items-center gap-3 px-3.5 py-3">
      <div className="flex rounded-[10px] bg-cloud p-1">{kinds.map((k) => <Garment key={k} kind={k} size={30} />)}</div>
      <div className="flex-1">
        <p className="text-[15px] font-medium">{title}</p>
        <p className="text-[13px] text-text-muted">{detail}</p>
      </div>
      <Icon name="chev" size={20} />
    </Card>
  )
}

/** Home card: icon square + title/detail + chevron, with optional extra content (chips) below. */
function ActionCard({ to, icon, title, detail, children }: { to: string; icon: string; title: string; detail: string; children?: ReactNode }) {
  return (
    <Card to={to} className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-soft"><Icon name={icon} /></span>
        <div className="min-w-0 flex-1">
          <Heading size={16}>{title}</Heading>
          <p className="text-[13px] text-text/65">{detail}</p>
        </div>
        <Icon name="chev" size={20} />
      </div>
      {children}
    </Card>
  )
}

function ForYou() {
  return (
    <>
      <Heading size={18} className="pt-1">For you</Heading>
      <ActionCard to="/planner/week" icon="calendar" title="Plan your work week" detail="Sunday reminder · 5 minutes" />
      <ActionCard to="/shop" icon="bag" title="Going shopping?" detail="What you own and what you need.">
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {['2 gaps · warm coat, white sneakers', '86 pieces'].map((s) => (
            <span key={s} className="shrink-0 whitespace-nowrap rounded-full bg-cloud px-3 py-1.5 text-[12px] font-medium">{s}</span>
          ))}
        </div>
      </ActionCard>
    </>
  )
}

function ActionButton({ children, primary = false, onClick }: { children: ReactNode; primary?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`w-full rounded-md px-5 py-[15px] text-[16px] font-semibold ${primary ? 'bg-primary text-cloud' : 'border-[1.5px] border-primary'}`}>
      {children}
    </button>
  )
}

/** Home — morning (the default Home): today's outfit with "Wore it". */
export function HomeMorning() {
  const nav = useNavigate()
  const [worn, setWorn] = useState(false)
  return (
    <Screen tabs>
      <div className="flex flex-col gap-2.5">
        <HomeHeader greeting="Good morning" date="Thu, Nov 12 · Lawrence, KS" weather={<WeatherPill icon="sun" now="40°" hl="H:44° L:35°" />} />
        <OutfitCard
          when="Today · Thursday"
          weather="40° now · rain after 3 pm"
          kinds={TOMORROW.outfit}
          reason={worn ? '✓ Logged — every piece is marked as worn today.' : 'Rain this afternoon, so wear the trench. Nothing here was worn this week.'}
          actions={
            <>
              <ActionButton onClick={() => nav('/planner/add')}>Change it</ActionButton>
              <ActionButton primary onClick={() => setWorn(!worn)}>{worn ? '✓ Wore it' : 'Wore it'}</ActionButton>
            </>
          }
        />
        <PeekCard to="/home/evening" kinds={['top', 'jeans', 'shoes']} title="Tomorrow · Friday" detail="51° · outfit ready tonight" />
        <ForYou />
      </div>
    </Screen>
  )
}

/** Home — evening: tomorrow's suggestion. */
export function Home() {
  const nav = useNavigate()
  return (
    <Screen tabs>
      <div className="flex flex-col gap-2.5">
        <HomeHeader greeting="Good evening" date="Wed, Nov 11 · Lawrence, KS" weather={<WeatherPill />} />
        <OutfitCard
          when="Tomorrow · Thursday"
          weather="42° / 35° · rain after 3 pm"
          kinds={TOMORROW.outfit}
          reason={`Suggested: ${TOMORROW.reason} Nothing here was worn this week.`}
          actions={
            <>
              <ActionButton onClick={() => nav('/planner/add')}>Change it</ActionButton>
              <ActionButton primary onClick={() => nav('/planner')}>Looks good</ActionButton>
            </>
          }
        />
        <PeekCard to="/home" kinds={['top', 'jeans', 'shoes']} title="Today’s outfit" detail="✓ Wore it this morning" />
        <ForYou />
      </div>
    </Screen>
  )
}
