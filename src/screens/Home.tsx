import { useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import { BackBar, Button, Card, Eyebrow, Header, Heading, Icon, Screen, Title } from '../ui'
import { useStore } from '../lib/store'
import { dayName, fmtShort, greeting, monday, addDays } from '../lib/dates'
import { condition, deg, isRainy } from '../lib/weather'
import { Collage, ItemImage, Empty } from '../components'
import { autoSuggests, occasionLabel } from '../lib/suggest'
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
        <Title className="min-w-0 truncate !text-[clamp(25px,7.6vw,32px)]">{title}</Title>
        {forecast && t && (
          <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-surface py-[7px] pr-3 pl-2.5" aria-label={`${deg(forecast.current, unit)}, high ${deg(t.high, unit)}, low ${deg(t.low, unit)}`}>
            <WeatherIcon kind={h >= 18 || h < 6 ? 'moon' : 'sun'} />
            <div className="flex flex-col items-start leading-none">
              <span className="text-[17px] font-semibold">{deg(forecast.current, unit)}</span>
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

/**
 * Today's / tomorrow's outfit: planned if there is one, otherwise a live suggestion from the rules —
 * but only on work days or off days with activities (or when you ask), and never on a "No outfit needed" day.
 */
function useDayOutfit(date: string, ask = false) {
  const { state, suggestFor } = useStore()
  const planned = state.planned.filter((p) => p.date === date).sort((a, b) => a.position - b.position)
  const first = planned[0]
  const outfit = first ? state.outfits.find((o) => o.id === first.outfitId) : undefined
  const skipped = state.skipped.includes(date)
  const auto = autoSuggests(state, date)
  const sug = first || skipped || !(auto || ask) ? undefined : suggestFor(date)
  return {
    planned, first, outfit, skipped, rest: !first && !skipped && !sug,
    itemIds: outfit?.itemIds ?? sug?.itemIds ?? [], reason: first?.reason ?? sug?.reason ?? '', missing: sug?.missing ?? [],
    occasion: first?.occasion ?? sug?.occasion ?? occasionLabel(state, date),
  }
}

/** Shown instead of a suggestion on off days and "No outfit needed" days. */
function QuietDay({ skipped, onSuggest, onBuild, onUndo, when }: { skipped: boolean; onSuggest: () => void; onBuild: () => void; onUndo: () => void; when: string }) {
  return (
    <div className="pop-in flex flex-col items-center gap-1 rounded-md bg-cloud px-4 py-6 text-center">
      <p className="text-[16px] font-semibold">{skipped ? 'No outfit needed' : 'Nothing planned'}</p>
      <p className="text-[13px] leading-[1.4] text-text/65">{skipped ? `Enjoy ${when}. Nothing will be suggested.` : 'Off day — no outfit suggested. Want one anyway?'}</p>
      <div className="mt-2 flex gap-4 text-[14px] font-semibold">
        {skipped ? <button className="underline" onClick={onUndo}>Undo</button> : <><button className="underline" onClick={onSuggest}>Suggest one</button><button className="underline" onClick={onBuild}>Build my own</button></>}
      </div>
    </div>
  )
}

function OutfitCard({ when, weather, occasion, date, itemIds, reason, missing, actions, quiet, skip }: { when: string; weather: string; occasion: string; date: string; itemIds: string[]; reason: string; missing: string[]; actions: ReactNode; quiet?: ReactNode; skip?: ReactNode }) {
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
      {quiet}
      {!quiet && items.length > 0 && (
        <div className="no-scrollbar flex justify-center gap-1.5 overflow-x-auto rounded-md bg-tile py-3">
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
      {!quiet && <div className="flex gap-2.5">{actions}</div>}
      {!quiet && skip}
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
  const favs = state.outfits.filter((o) => o.isFavorite && o.itemIds.length).length
  return (
    <>
      <div className="flex items-center justify-between pt-1">
        <Heading size={18}>For you</Heading>
        <Link to="/settings" aria-label="Settings" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface"><Icon name="sliders" size={20} /></Link>
      </div>
      <ActionCard to="/planner/week" icon="calendar" title="Plan your work week" detail={planned ? `${planned} of 5 workdays planned` : 'Sunday reminder · 5 minutes'} />
      <ActionCard to="/favorites" icon="heart" title="Favorites" detail={favs ? `${favs} saved ${favs === 1 ? 'outfit' : 'outfits'} to wear again` : 'Heart an outfit while you build it'} />
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
  return <button onClick={onClick} className={`press w-full rounded-md px-5 py-[15px] text-[16px] font-semibold ${primary ? 'bg-primary text-cloud' : 'border-[1.5px] border-primary'}`}>{children}</button>
}

function SkipLink({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return <button onClick={onClick} className="-mt-0.5 self-center text-[13px] font-medium text-text/65 underline underline-offset-2">{children}</button>
}

function NoCloset() {
  return <Empty title="Add your first pieces" body="Once a few pieces are in your closet, Capsule suggests an outfit for every day." action={<Button to="/closet/add">Add pieces</Button>} />
}

/** Home — today (the default Home). */
export function Home() {
  const { state, today, weatherFor, forecast, setDraft, plan, toggleWore, toggleSkip } = useStore()
  const nav = useNavigate()
  const [ask, setAsk] = useState(false)
  const d = useDayOutfit(today, ask)
  const w = weatherFor(today)
  const unit = state.profile.unit
  const worn = !!d.outfit && state.wear.some((x) => x.outfitId === d.outfit!.id && x.wornOn === today)
  const wore = () => {
    if (!d.itemIds.length) return
    const outfitId = d.outfit?.id ?? plan({ date: today, itemIds: d.itemIds, occasion: d.occasion, reason: d.reason, suggested: true }).outfitId
    setTimeout(() => toggleWore(today, outfitId), 0)
  }
  const change = () => { setDraft({ date: today, itemIds: d.itemIds, editingId: d.first?.id, occasion: d.occasion }); nav(`/planner/add?date=${today}`) }
  const build = () => { setDraft({ date: today, itemIds: [], occasion: d.occasion }); nav(`/planner/add?date=${today}`) }
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
            quiet={d.skipped || d.rest ? <QuietDay when="today" skipped={d.skipped} onSuggest={() => setAsk(true)} onBuild={build} onUndo={() => toggleSkip(today)} /> : undefined}
            skip={!worn && !d.first && <SkipLink onClick={() => { setAsk(false); toggleSkip(today) }}>No outfit needed today</SkipLink>}
          />
        )}
        {d.planned.length > 1 && <Link to={`/planner?date=${today}`} className="-mt-1 text-center text-[13px] font-medium text-text/65">+ {d.planned.length - 1} more outfit today →</Link>}
        <ForYou />
      </div>
    </Screen>
  )
}

/** Home — evening: plan tomorrow. */
export function HomeEvening() {
  const { state, today, tomorrow, weatherFor, setDraft, plan, toggleSkip } = useStore()
  const nav = useNavigate()
  const [ask, setAsk] = useState(false)
  const t = useDayOutfit(tomorrow, ask)
  const wt = weatherFor(tomorrow)
  const unit = state.profile.unit
  const build = () => { setDraft({ date: tomorrow, itemIds: [], occasion: t.occasion }); nav(`/planner/add?date=${tomorrow}`) }
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
            quiet={t.skipped || t.rest ? <QuietDay when="tomorrow" skipped={t.skipped} onSuggest={() => setAsk(true)} onBuild={build} onUndo={() => toggleSkip(tomorrow)} /> : undefined}
            skip={!t.first && <SkipLink onClick={() => { setAsk(false); toggleSkip(tomorrow) }}>No outfit needed tomorrow</SkipLink>}
          />
        )}
        <ForYou />
      </div>
    </Screen>
  )
}

/** Favorites — outfits you hearted on the Canvas (or saved with "Save to favorites"). */
export function Favorites() {
  const { state, tomorrow, setDraft, removeFavorite } = useStore()
  const nav = useNavigate()
  const favs = state.outfits.filter((o) => o.isFavorite && o.itemIds.length).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const wear = (o: (typeof favs)[number]) => { setDraft({ date: tomorrow, itemIds: o.itemIds, layout: o.layout, occasion: occasionLabel(state, tomorrow) }); nav(`/planner/details?date=${tomorrow}`) }
  const build = () => { setDraft({ date: tomorrow, itemIds: [], occasion: occasionLabel(state, tomorrow) }); nav(`/planner/add?date=${tomorrow}`) }
  return (
    <Screen tabs>
      <div className="flex flex-col gap-4">
        <BackBar />
        <Header title="Favorites" body="Outfits you love, ready to wear again. Tap the heart while building an outfit to save it here." />
        {favs.length === 0 ? (
          <Empty icon="heart" title="No favorites yet" body="Build an outfit and tap the heart on the canvas — it lands here." action={<Button onClick={build}>Build an outfit</Button>} />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              {favs.map((o) => (
                <div key={o.id} className="flex flex-col overflow-hidden rounded-[18px] bg-surface">
                  <div className="relative h-[190px] bg-tile">
                    <Collage itemIds={o.itemIds} layout={o.layout} width={171} height={186} top={10} padX={8} />
                    <button onClick={() => removeFavorite(o.id)} aria-label="Remove from favorites" className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-bg">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /></svg>
                    </button>
                  </div>
                  <button onClick={() => wear(o)} className="border-t border-border py-2.5 text-[14px] font-semibold">Plan it</button>
                </div>
              ))}
            </div>
            <button onClick={build} className="flex h-14 items-center justify-center rounded-lg border-[1.2px] border-dashed border-accent text-[15px] font-medium text-text/70">+ Build a new outfit</button>
          </>
        )}
      </div>
    </Screen>
  )
}
