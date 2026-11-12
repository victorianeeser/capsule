import { Link } from 'react-router'
import { Button, Card, Eyebrow, Garment, Heading, Icon, ListRow, Screen, Title, WeatherPill } from '../ui'
import { TOMORROW } from '../data'

function HomeHeader({ greeting, date }: { greeting: string; date: string }) {
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
        <WeatherPill />
      </div>
    </div>
  )
}

export function Home() {
  return (
    <Screen tabs>
      <div className="flex flex-col gap-3">
        <HomeHeader greeting="Good evening" date="Wed, Nov 11 · Lawrence, KS" />

        <Card className="flex flex-col gap-3 p-[18px]">
          <div className="flex items-center justify-between">
            <div>
              <Eyebrow className="text-[11px]">Tomorrow · Thursday</Eyebrow>
              <p className="text-[15px] font-medium">42° / 35° · rain after 3 pm</p>
            </div>
            <Link to="/planner/off-day" className="rounded-full bg-primary px-[15px] py-[9px] text-[14px] font-medium text-cloud">Work day</Link>
          </div>
          <div className="flex justify-center gap-1.5 rounded-md bg-cloud py-3">
            {TOMORROW.outfit.map((k) => <Garment key={k} kind={k} size={70} />)}
          </div>
          <p className="text-[13px] leading-[1.4] text-text/70">Suggested: {TOMORROW.reason} Nothing here was worn this week.</p>
          <div className="flex gap-2.5">
            <Button variant="secondary" to="/planner/add">Change it</Button>
            <Button to="/planner">Looks good</Button>
          </div>
        </Card>

        <Card to="/planner" className="flex items-center gap-3 px-3.5 py-3">
          <div className="flex rounded-[10px] bg-cloud p-1">
            {(['top', 'jeans', 'shoes'] as const).map((k) => <Garment key={k} kind={k} size={30} />)}
          </div>
          <div className="flex-1">
            <p className="text-[15px] font-medium">Today’s outfit</p>
            <p className="text-[13px] text-text-muted">✓ Wore it · logged this morning</p>
          </div>
          <Icon name="chev" size={20} />
        </Card>

        <Heading size={20}>For you</Heading>
        <div className="-mt-2">
          <ListRow title="Plan your work week" detail="Sunday reminder · takes about 5 minutes" to="/planner/week" />
        </div>

        <Card to="/shop" className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-soft"><Icon name="bag" /></span>
            <div className="flex-1">
              <Heading size={20}>Going shopping?</Heading>
              <p className="text-[13px] text-text/65">What you own and what you need.</p>
            </div>
            <Icon name="chev" size={20} />
          </div>
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            {['2 gaps · warm coat, white sneakers', '86 pieces'].map((s) => (
              <span key={s} className="shrink-0 whitespace-nowrap rounded-full bg-cloud px-3 py-1.5 text-[12px] font-medium">{s}</span>
            ))}
          </div>
        </Card>
      </div>
    </Screen>
  )
}

export function HomeMorning() {
  const pieces: [Parameters<typeof Garment>[0]['kind'], string][] = [
    ['outerwear', 'Tan trench coat'], ['knit', 'Cream knit sweater'], ['bottom', 'Black wide-leg trousers'], ['shoes', 'Black loafers'],
  ]
  return (
    <Screen tabs>
      <div className="flex flex-1 flex-col gap-3.5">
        <HomeHeader greeting="Today’s outfit" date="Good morning · Thursday" />
        <p className="rounded-[10px] bg-soft px-3.5 py-2.5 text-[13px] font-medium">40° now · rain at 3 pm · wear the trench</p>
        <Card className="grid grid-cols-2 gap-2.5">
          {pieces.map(([k, n]) => (
            <div key={n} className="flex flex-col items-center gap-1.5 rounded-md bg-bg py-3">
              <Garment kind={k} size={110} />
              <span className="text-[11px] font-medium text-text/60">{n}</span>
            </div>
          ))}
        </Card>
        <div className="flex-1" />
        <Button to="/home">Wore it</Button>
        <p className="-mt-1 text-center text-[12px] text-text/60">Logs every piece as worn today.</p>
        <Button variant="text" to="/planner/add">Change something</Button>
      </div>
    </Screen>
  )
}
