import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { BackBar, Body, Button, Card, Chip, Eyebrow, Header, Heading, Icon, ListRow, ProgressBar, Screen, Title, Toggle } from '../ui'
import { useStore } from '../lib/store'
import { CATEGORY_LABEL, CATEGORY_ONE, COLORS, CONTEXT_LABEL, DRESS_LABEL, WARMTH_LABEL, type Category, type Item } from '../lib/types'
import { wearStats } from '../lib/suggest'
import { fmtMonthDay, relative } from '../lib/dates'
import { Empty, ItemImage, PhotoPicker, QueueBanner, Thumbs } from '../components'

const CATS: (Category | 'all')[] = ['all', 'top', 'bottom', 'dress', 'outerwear', 'shoes', 'accessory']
export const matches = (i: Item, q: string) => {
  const t = q.trim().toLowerCase()
  if (!t) return true
  const hay = `${i.name} ${i.color} ${CATEGORY_ONE[i.category]} ${CATEGORY_LABEL[i.category]} ${DRESS_LABEL[i.dressLevel]}`.toLowerCase()
  return t.split(/\s+/).every((w) => hay.includes(w.replace(/s$/, '')))
}

export function Closet() {
  const { state } = useStore()
  const [cat, setCat] = useState<Category | 'all'>('all')
  const [q, setQ] = useState('')
  const active = state.items.filter((i) => i.status === 'active')
  const items = active.filter((i) => (cat === 'all' || i.category === cat) && matches(i, q))
  const untagged = state.items.filter((i) => !i.tagged).length
  const toAudit = active.filter((i) => !state.auditDone.includes(i.id)).length
  return (
    <Screen tabs>
      <div className="flex flex-col gap-3.5">
        <div className="flex items-center justify-between">
          <div><Title>Closet</Title><p className="text-[13px] text-text-muted">{active.length} {active.length === 1 ? 'piece' : 'pieces'}</p></div>
          <Link to="/closet/add" aria-label="Add items" className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-cloud"><Icon name="plus" /></Link>
        </div>
        <QueueBanner />
        {untagged > 0 && (
          <Link to="/closet/tag" className="flex items-center gap-2 rounded-md bg-primary px-3.5 py-3 text-[14px] font-medium text-cloud"><span className="flex-1">{untagged} {untagged === 1 ? 'piece needs' : 'pieces need'} tags</span><Icon name="chev" size={20} /></Link>
        )}
        {active.length > 0 && (
          <>
            <label className="flex items-center gap-2.5 rounded-md border border-border px-3.5 py-3">
              <Icon name="search" size={20} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search — “black jeans”" className="w-full bg-transparent text-[15px] outline-none placeholder:text-text/50" />
            </label>
            <div className="no-scrollbar flex gap-2 overflow-x-auto">
              {CATS.map((c) => <Chip key={c} label={c === 'all' ? 'All' : CATEGORY_LABEL[c]} selected={cat === c} onClick={() => setCat(c)} />)}
            </div>
            {toAudit > 0 && (
              <Link to="/closet/audit" className="flex items-center gap-2 rounded-md bg-soft px-3.5 py-3 text-[14px] font-medium"><span className="flex-1">Closet audit · {toAudit} to review</span><Icon name="chev" size={20} /></Link>
            )}
          </>
        )}
        {active.length === 0 ? (
          <Empty title="Your closet is empty" body="Start with your 15 favorite pieces — upload a few photos at once." action={<Button to="/closet/add">Add pieces</Button>} />
        ) : items.length === 0 ? (
          <p className="py-6 text-center text-[14px] text-text-muted">Nothing matches “{q}”.</p>
        ) : (
          <div className="grid grid-cols-3 gap-x-3 gap-y-3.5">
            {items.map((it) => (
              <Link key={it.id} to={`/closet/item/${it.id}`} className="flex flex-col gap-1.5">
                <span className="flex aspect-square items-center justify-center rounded-md bg-surface"><ItemImage item={it} size={86} /></span>
                <span className="text-[12px] font-medium leading-tight">{it.tagged ? it.name : 'Needs tags'}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Screen>
  )
}

export function AddItems() {
  const { state, addPhotos } = useStore()
  const nav = useNavigate()
  const untagged = state.items.filter((i) => !i.tagged).length
  const onFiles = async (f: File[]) => { await addPhotos(f); nav('/closet/tag') }
  return (
    <Screen tabs>
      <div className="flex flex-col gap-4">
        <BackBar />
        <Header title="Add to your closet" body="Add a lot at once — you can tag them later." />
        <QueueBanner />
        <PhotoPicker onFiles={onFiles} className="w-full">
          <Card className="flex flex-col gap-1.5"><span className="flex items-center gap-2.5 text-[17px] font-semibold"><Icon name="camera" />Upload photos</span><Body>Pick as many as you like from your camera roll. We remove the backgrounds.</Body></Card>
        </PhotoPicker>
        <PhotoPicker onFiles={onFiles} camera multiple={false} className="w-full">
          <Card className="flex flex-col gap-1.5"><span className="flex items-center gap-2.5 text-[17px] font-semibold"><Icon name="camera" />Take a photo</span><Body>Use your camera for one piece at a time.</Body></Card>
        </PhotoPicker>
        {untagged > 0 && <ListRow title={`Needs tags (${untagged})`} detail="Photos added but not tagged yet" to="/closet/tag" />}
        <p className="rounded-md bg-soft p-3.5 text-[13px] leading-[1.4]">Tip: lay pieces flat on a plain surface for the cleanest cut-out. The first cut-out downloads a small model (about 40 MB) — after that it works offline.</p>
      </div>
    </Screen>
  )
}

/** Tag queue (/closet/tag) or edit one piece (/closet/tag/:id). */
export function TagItem() {
  const { state, saveItem, deleteItem } = useStore()
  const nav = useNavigate()
  const { id } = useParams()
  const queue = state.items.filter((i) => !i.tagged)
  const item = id ? state.items.find((i) => i.id === id) : queue[0]
  const [draft, setDraft] = useState<Item | null>(null)
  const it = draft && draft.id === item?.id ? draft : item ? { ...item } : null
  if (!it) return <Screen><BackBar /><div className="pt-6"><Empty title="All tagged" body="Every piece in your closet has tags." action={<Button to="/closet">Go to closet</Button>} /></div></Screen>
  const set = (p: Partial<Item>) => setDraft({ ...it, ...p })
  const pos = id ? null : `${queue.length} left to tag`
  const save = () => {
    const name = it.name === 'New piece' || !it.name.trim() ? `${it.color || ''} ${CATEGORY_ONE[it.category].toLowerCase()}`.trim().replace(/^./, (c) => c.toUpperCase()) : it.name
    saveItem({ ...it, name, tagged: true })
    setDraft(null)
    if (id) nav(-1)
    else if (queue.length <= 1) nav('/closet')
  }
  const group = <T extends string>(label: string, opts: Record<T, string> | T[], value: T, key: keyof Item) => (
    <div className="flex flex-col gap-1.5">
      <Eyebrow className="text-[11px]">{label}</Eyebrow>
      <div className="flex flex-wrap gap-2">
        {(Array.isArray(opts) ? opts.map((o) => [o, o] as [T, string]) : (Object.entries(opts) as [T, string][])).map(([v, l]) => (
          <Chip key={v} label={l} selected={value === v} onClick={() => set({ [key]: v } as Partial<Item>)} small />
        ))}
      </div>
    </div>
  )
  return (
    <Screen>
      <div className="flex flex-1 flex-col gap-3">
        <BackBar right={pos ?? undefined} />
        <Card className="flex flex-col items-center gap-1 p-3">
          <span className="flex h-[150px] w-full items-center justify-center rounded-md bg-bg"><ItemImage item={it} size={140} /></span>
          <span className="text-[11px] font-medium text-text/60">{it.processing ? 'Removing background…' : it.imageId ? 'Background removed ✓' : 'Demo piece'}</span>
        </Card>
        <input value={it.name === 'New piece' ? '' : it.name} onChange={(e) => set({ name: e.target.value })} placeholder="Name (optional) — e.g. Cream knit sweater" className="rounded-md border border-border px-3.5 py-3 text-[15px] outline-none" />
        {group('Category', CATEGORY_ONE, it.category, 'category')}
        {group('Color', COLORS, it.color as string, 'color')}
        {group('Warmth', WARMTH_LABEL, it.warmth, 'warmth')}
        {group('Dress level', DRESS_LABEL, it.dressLevel, 'dressLevel')}
        {group('Worn for', CONTEXT_LABEL, it.context, 'context')}
        <div className="flex items-center justify-between py-1"><span className="text-[14px]">Delicate (skip on rainy days)</span><Toggle key={it.id} initial={it.delicate} onChange={(v) => set({ delicate: v })} /></div>
        <div className="flex-1" />
        <Button onClick={save}>{id ? 'Save' : queue.length > 1 ? 'Save & next' : 'Save'}</Button>
        {!id && <Button variant="text" onClick={() => { deleteItem(it.id); setDraft(null) }}>Remove this photo</Button>}
      </div>
    </Screen>
  )
}

export function ItemDetail() {
  const { state, deleteItem, saveItem } = useStore()
  const { id } = useParams()
  const nav = useNavigate()
  const it = state.items.find((i) => i.id === id)
  const stats = useMemo(() => wearStats(state), [state])
  const [confirm, setConfirm] = useState(false)
  if (!it) return <Screen><BackBar /><Empty title="Not found" body="This piece was deleted." /></Screen>
  const st = stats.get(it.id)
  const outfits = state.outfits.filter((o) => o.itemIds.includes(it.id))
  return (
    <Screen tabs>
      <div className="flex flex-col gap-3.5">
        <BackBar right="Edit" onRight={() => nav(`/closet/tag/${it.id}`)} />
        <span className="flex h-[250px] items-center justify-center rounded-lg bg-surface"><ItemImage item={it} size={220} /></span>
        <Heading>{it.name}</Heading>
        <div className="flex flex-wrap gap-2">{[CATEGORY_ONE[it.category], it.color, `${WARMTH_LABEL[it.warmth]} warmth`, DRESS_LABEL[it.dressLevel], CONTEXT_LABEL[it.context], it.delicate ? 'Delicate' : ''].filter(Boolean).map((t) => <Chip key={t} label={t} />)}</div>
        <div className="grid grid-cols-3 gap-2.5">
          {[[`${st?.times ?? 0}×`, 'worn'], [st?.last ? fmtMonthDay(st.last) : '—', 'last worn'], [it.status === 'active' ? 'Keep' : it.status === 'donate' ? 'Donate' : 'Replace', 'status']].map(([n, l]) => (
            <Card key={l} className="p-3.5"><p className="text-[20px] font-semibold">{n}</p><p className="text-[12px] text-text-muted">{l}</p></Card>
          ))}
        </div>
        {st?.last && <p className="-mt-1 text-[13px] text-text-muted">Last worn {relative(st.last)}.</p>}
        {outfits.length > 0 && (
          <>
            <Eyebrow className="text-[11px]">In {outfits.length} saved {outfits.length === 1 ? 'outfit' : 'outfits'}</Eyebrow>
            <div className="no-scrollbar flex gap-2 overflow-x-auto">{outfits.slice(0, 8).map((o) => <span key={o.id} className="shrink-0 rounded-md bg-surface p-1.5"><Thumbs itemIds={o.itemIds} size={28} bg={false} /></span>)}</div>
          </>
        )}
        {it.status !== 'active' && <Button variant="secondary" onClick={() => saveItem({ ...it, status: 'active' })}>Move back to my closet</Button>}
        {confirm ? (
          <div className="flex gap-2.5"><Button variant="secondary" onClick={() => setConfirm(false)}>Cancel</Button><Button onClick={() => { deleteItem(it.id); nav('/closet') }}>Delete for good</Button></div>
        ) : <Button variant="text" onClick={() => setConfirm(true)}>Delete piece</Button>}
      </div>
    </Screen>
  )
}

export function Audit() {
  const { state, saveItem, addGap, update } = useStore()
  const nav = useNavigate()
  const stats = useMemo(() => wearStats(state), [state])
  const cats = (['top', 'bottom', 'dress', 'outerwear', 'shoes', 'accessory'] as Category[]).filter((c) => state.items.some((i) => i.category === c && i.status === 'active' && i.tagged))
  const [cat, setCat] = useState<Category | undefined>(cats.find((c) => state.items.some((i) => i.category === c && i.status === 'active' && i.tagged && !state.auditDone.includes(i.id))))
  const inCat = state.items.filter((i) => i.category === cat && i.tagged && (i.status === 'active' || state.auditDone.includes(i.id)))
  const left = inCat.filter((i) => !state.auditDone.includes(i.id) && i.status === 'active')
  const it = left[0]
  const done = (status: Item['status']) => {
    if (!it) return
    saveItem({ ...it, status })
    if (status === 'replace') addGap({ label: it.name, category: it.category, source: 'audit', detail: 'From audit · replacing' })
    update((s) => ({ ...s, auditDone: [...s.auditDone, it.id] }))
  }
  const st = it ? stats.get(it.id) : undefined
  return (
    <Screen tabs>
      <div className="flex flex-1 flex-col gap-3.5">
        <BackBar right={it ? 'Skip' : undefined} onRight={() => it && update((s) => ({ ...s, auditDone: [...s.auditDone, it.id] }))} />
        <div className="no-scrollbar flex gap-2 overflow-x-auto">{cats.map((c) => <Chip key={c} label={CATEGORY_LABEL[c]} selected={cat === c} onClick={() => setCat(c)} small />)}</div>
        {!cat ? (
          <Empty title="Nothing to audit yet" body="Add and tag a few pieces first." action={<Button to="/closet/add">Add pieces</Button>} />
        ) : !it ? (
          <Empty title={`${CATEGORY_LABEL[cat]} reviewed`} body="Pick another category, or start a fresh audit pass." action={<Button variant="secondary" onClick={() => update((s) => ({ ...s, auditDone: [] }))}>Start over</Button>} />
        ) : (
          <>
            <div className="flex flex-col gap-2"><Eyebrow className="text-[11px]">Closet audit · {CATEGORY_LABEL[cat]} · {inCat.length - left.length + 1} of {inCat.length}</Eyebrow><ProgressBar value={(inCat.length - left.length) / inCat.length} /></div>
            <Card className="flex flex-col items-center gap-2">
              <span className="flex h-[240px] w-full items-center justify-center rounded-md bg-bg"><ItemImage item={it} size={210} /></span>
              <Heading>{it.name}</Heading>
              <p className="text-center text-[13px] text-text-muted">{st?.last ? `Last worn ${relative(st.last)} · worn ${st.times}×` : 'Not worn yet in Capsule'}</p>
            </Card>
            <div className="flex-1" />
            <Button onClick={() => done('active')}>Keep</Button>
            <div className="flex gap-2.5"><Button variant="secondary" onClick={() => done('donate')}>Donate</Button><Button variant="secondary" onClick={() => done('replace')}>Need to replace</Button></div>
            <p className="text-center text-[12px] text-text/60">“Need to replace” adds it to your Gaps list.</p>
          </>
        )}
        {cat && !it && <Button variant="text" onClick={() => nav('/shop/gaps')}>See your gaps</Button>}
      </div>
    </Screen>
  )
}
