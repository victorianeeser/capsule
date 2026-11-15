import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import { Button, Card, Eyebrow, Heading, Icon, Screen, Title } from '../ui'
import { useStore } from '../lib/store'
import { dayName, fmtShort, greeting, monday, addDays } from '../lib/dates'
import { condition, deg, isRainy } from '../lib/weather'
import { ItemImage, Thumbs, Empty } from '../components'
import type { Item } from '../lib/types'

function HomeHeader({ title, date }: { title: string; date: string }) {
  const { state, forecast, weatherFor, today } = useStore()
  const unit = state.profile.unit
  const t = weatherFor(today)
  const h = new Date().getHours()
  return (
    <div className="flex flex-col gap-1">
      <Eyebrow className="truncate">{fmtShort(date)} · {state.profile.city}</Eyebrow>
      <div className="flex items-center justify-between gap-3">
        <Title className="min-w-0 truncate !text-[clamp(26px,8.2vw,32px)]">{title}</Title>
        {forecast && t && (
          <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-surface py-[7px] pr-4 pl-3" aria-label={`${deg(forecast.current, unit)}, high ${deg(t.high, unit)}, low ${deg(t.low, unit)}`}>
            <WeatherIcon kind={h >= 18 || h < 6 ? 'moon' : 'sun'} />
            <div className="flex flex-col items-start leading-none">
              <span className="text-[17px] font-semibold tracking-[-0.02em]">{deg(forecast.current, unit)}</span>
              <span className="pt-[3px] text-[10px] text-text-muted">H:{deg(t.high, unit)} L:{deg(t.low, unit)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function WeatherIcon({ kind }: { kind: 'sun' | 'moon' }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      {kind === 'moon' ? (
        <path d="M19.5 14.6A7.6 7.6 0 1 1 9.4 4.5a6.1 6.1 0 0 0 10.1 10.1z" fill="var(--color-weather)" />
      ) : (
        <g stroke="var(--color-weather)" strokeWidth="1.8" strokeLinecap="round">
          <circle cx="12" cy="12" r="4.2" fill="var(--color-weather)" stroke="none" />
          <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" />
        </g>
      )}
    </svg>
  )
}

/** Today's / tomorrow's outfit: planned if there is one, otherwise a live suggestion from the rules. */
function useDayOutfit(date: string) {
  const { state, suggestFor } = useStore()
  const planned = state.planned.filter((p) => p.date === date).sort((a, b) => a.position - b.position)
  const first = planned[0]
  const outfit = first ? state.outfits.find((o) => o.id === first.outfitId) : undefined
  const sug = first ? undefined : suggestFor(date)
  return { planned, first, outfit, itemIds: outfit?.itemIds ?? sug?.itemIds ?? [], reason: first?.reason ?? sug?.reason ?? '', missing: sug?.missing ?? [], occasion: first?.occasion ?? sug?.occasion ?? '' }
}

function OutfitCard({ when, weather, occasion, date, itemIds, reason, missing, actions }: { when: string; weather: string; occasion: string; date: string; itemIds: string[]; reason: string; missing: string[]; actions: ReactNode }) {
  const { state, addGap } = useStore()
  const items = itemIds.map((id) => state.items.find((i) => i.id === id)).filter(Boolean) as Item[]
  return (
    <Card className="flex flex-col gap-3 p-[18px]">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <Eyebrow className="text-[11px]">{when}</Eyebrow>
          <p className="text-[15px] font-medium">{weather}</p>
        </div>
        <Link to={`/planner/off-day?date=${date}`} className="shrink-0 rounded-full bg-primary px-[15px] py-[9px] text-[14px] font-medium text-cloud">{occasion}</Link>
      </div>
      {items.length > 0 && (
        <div className="no-scrollbar flex justify-center gap-1.5 overflow-x-auto rounded-md bg-cloud py-3">
          {items.map((it) => <ItemImage key={it.id} item={it} size={items.length > 4 ? 56 : 70} />)}
        </div>
      )}
      {reason && <p className="text-[13px] leading-[1.4] text-text/70">{reason}</p>}
      {missing.length > 0 && (
        <p className="text-[13px] leading-[1.4] text-text/70">
          Missing {missing.join(', ')} for this.{' '}
          <button className="font-semibold underline" onClick={() => missing.forEach((m) => addGap({ label: m.replace(/^a /, '').replace(/^./, (c) => c.toUpperCase()), source: 'nudge', detail: 'Couldn’t build an outfit without it' }))}>Add to Gaps</button>
        </p>
      )}
      <div className="flex gap-2.5">{actions}</div>
    </Card>
  )
}

function PeekCard({ to, itemIds, title, detail }: { to: string; itemIds: string[]; title: string; detail: string }) {
  return (
    <Card to={to} className="flex items-center gap-3 px-3.5 py-3">
      <Thumbs itemIds={itemIds} />
      <div className="flex-1"><p className="text-[15px] font-medium">{title}</p><p className="text-[13px] text-text-muted">{detail}</p></div>
      <Icon name="chev" size={20} />
    </Card>
  )
}

function ActionCard({ to, icon, title, detail, children }: { to: string; icon: string; title: string; detail: string; children?: ReactNode }) {
  return (
    <Card to={to} className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-soft"><Icon name={icon} /></span>
        <div className="min-w-0 flex-1"><Heading size={16}>{title}</Heading><p className="text-[13px] text-text/65">{detail}</p></div>
        <Icon name="chev" size={20} />
      </div>
      {children}
    </Card>
  )
}

function ForYou() {
  const { state, today } = useStore()
  const mon = monday(addDays(today, [0, 6].includes(new Date().getDay()) ? 2 : 0))
  const planned = [0, 1, 2, 3, 4].filter((i) => state.planned.some((p) => p.date === addDays(mon, i))).length
  const gaps = state.gaps.filter((g) => !g.resolved)
  const pieces = state.items.filter((i) => i.status === 'active').length
  return (
    <>
      <div className="flex items-center justify-between pt-1">
        <Heading size={18}>For you</Heading>
        <Link to="/settings" aria-label="Settings" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface"><Icon name="sliders" size={20} /></Link>
      </div>
      <ActionCard to="/planner/week" icon="calendar" title="Plan your work week" detail={planned ? `${planned} of 5 workdays planned` : 'Sunday reminder · 5 minutes'} />
      <ActionCard to="/shop" icon="bag" title="Going shopping?" detail="What you own and what you need.">
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {[gaps.length ? `${gaps.length} ${gaps.length === 1 ? 'gap' : 'gaps'} · ${gaps.slice(0, 2).map((g) => g.label.toLowerCase()).join(', ')}` : 'No gaps', `${pieces} pieces`].map((s) => (
            <span key={s} className="shrink-0 whitespace-nowrap rounded-full bg-cloud px-3 py-1.5 text-[12px] font-medium">{s}</span>
          ))}
        </div>
      </ActionCard>
    </>
  )
}

function ActionButton({ children, primary = false, onClick }: { children: ReactNode; primary?: boolean; onClick: () => void }) {
  return <button onClick={onClick} className={`w-full rounded-md px-5 py-[15px] text-[16px] font-semibold ${primary ? 'bg-primary text-cloud' : 'border-[1.5px] border-primary'}`}>{children}</button>
}

function NoCloset() {
  return <Empty title="Add your first pieces" body="Once a few pieces are in your closet, Capsule suggests an outfit for every day." action={<Button to="/closet/add">Add pieces</Button>} />
}

/** Home — today (the default Home). */
export function Home() {
  const { state, today, tomorrow, weatherFor, forecast, setDraft, plan, toggleWore } = useStore()
  const nav = useNavigate()
  const d = useDayOutfit(today)
  const t = useDayOutfit(tomorrow)
  const w = weatherFor(today), wt = weatherFor(tomorrow)
  const unit = state.profile.unit
  const worn = !!d.outfit && state.wear.some((x) => x.outfitId === d.outfit!.id && x.wornOn === today)
  const wore = () => {
    if (!d.itemIds.length) return
    const outfitId = d.outfit?.id ?? plan({ date: today, itemIds: d.itemIds, occasion: d.occasion, reason: d.reason, suggested: true }).outfitId
    setTimeout(() => toggleWore(today, outfitId), 0)
  }
  const change = () => { setDraft({ date: today, itemIds: d.itemIds, editingId: d.first?.id, occasion: d.occasion }); nav(`/planner/add?date=${today}`) }
  const hasCloset = state.items.some((i) => i.tagged && i.status === 'active')
  return (
    <Screen tabs>
      <div className="flex flex-col gap-2.5">
        <HomeHeader title={greeting()} date={today} />
        {!hasCloset ? <NoCloset /> : (
          <OutfitCard
            when={`Today · ${dayName(today)}`}
            weather={forecast ? `${deg(forecast.current, unit)} now · ${w && isRainy(w) ? 'rain later' : condition(forecast.currentCode)}` : 'Weather unavailable offline'}
            occasion={d.occasion} date={today} itemIds={d.itemIds}
            reason={worn ? '✓ Logged — every piece is marked as worn today.' : d.reason} missing={worn ? [] : d.missing}
            actions={<><ActionButton onClick={change}>Change it</ActionButton><ActionButton primary onClick={wore}>{worn ? '✓ Wore it' : 'Wore it'}</ActionButton></>}
          />
        )}
        {d.planned.length > 1 && <Link to={`/planner?date=${today}`} className="-mt-1 text-center text-[13px] font-medium text-text/65">+ {d.planned.length - 1} more outfit today →</Link>}
        {hasCloset && <PeekCard to="/home/evening" itemIds={t.itemIds} title={`Tomorrow · ${dayName(tomorrow)}`} detail={t.first ? `Planned · ${t.occasion}` : wt ? `${deg(wt.high, unit)} · outfit ready tonight` : 'Outfit ready tonight'} />}
        <ForYou />
      </div>
    </Screen>
  )
}

/** Home — evening: plan tomorrow. */
export function HomeEvening() {
  const { state, today, tomorrow, weatherFor, setDraft, plan } = useStore()
  const nav = useNavigate()
  const t = useDayOutfit(tomorrow)
  const d = useDayOutfit(today)
  const wt = weatherFor(tomorrow)
  const unit = state.profile.unit
  const worn = !!d.outfit && state.wear.some((x) => x.outfitId === d.outfit!.id && x.wornOn === today)
  const change = () => { setDraft({ date: tomorrow, itemIds: t.itemIds, editingId: t.first?.id, occasion: t.occasion }); nav(`/planner/add?date=${tomorrow}`) }
  const looksGood = () => { if (!t.first && t.itemIds.length) plan({ date: tomorrow, itemIds: t.itemIds, occasion: t.occasion, reason: t.reason, suggested: true }); nav(`/planner?date=${tomorrow}`) }
  const hasCloset = state.items.some((i) => i.tagged && i.status === 'active')
  return (
    <Screen tabs>
      <div className="flex flex-col gap-2.5">
        <HomeHeader title="Good evening" date={today} />
        {!hasCloset ? <NoCloset /> : (
          <OutfitCard
            when={`Tomorrow · ${dayName(tomorrow)}`}
            weather={wt ? `${deg(wt.high, unit)} / ${deg(wt.low, unit)}${isRainy(wt) ? ' · rain' : ` · ${condition(wt.code)}`}` : 'Weather unavailable offline'}
            occasion={t.occasion} date={tomorrow} itemIds={t.itemIds}
            reason={t.first ? `✓ Planned. ${t.reason}` : t.reason ? `Suggested: ${t.reason}` : ''} missing={t.missing}
            actions={<><ActionButton onClick={change}>Change it</ActionButton><ActionButton primary onClick={looksGood}>{t.first ? 'View in Planner' : 'Looks good'}</ActionButton></>}
          />
        )}
        {hasCloset && <PeekCard to="/home" itemIds={d.itemIds} title="Today’s outfit" detail={worn ? '✓ Wore it today' : 'Not logged yet'} />}
        <ForYou />
      </div>
    </Screen>
  )
}
