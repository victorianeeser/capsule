import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { BackBar, Button, Card, Chip, Eyebrow, Header, Heading, Icon, ListRow, Screen, Title } from '../ui'
import { useStore } from '../lib/store'
import { CATEGORIES, CATEGORY_LABEL, CATEGORY_ONE, type Category, type Gap } from '../lib/types'
import { matches } from './Closet'
import { wearStats } from '../lib/suggest'
import { fmtMonthDay } from '../lib/dates'
import { Empty, ItemImage, PhotoPicker, useImage } from '../components'

const ALL_CATS: Category[] = CATEGORIES

export function Shop() {
  const { state } = useStore()
  const nav = useNavigate()
  const active = state.items.filter((i) => i.status === 'active' && i.tagged)
  const gaps = state.gaps.filter((g) => !g.resolved)
  const [q, setQ] = useState('')
  return (
    <Screen tabs>
      <div className="flex flex-col gap-3">
        <BackBar label="Home" />
        <Header eyebrow="In the store" title="Shop smarter" />
        <form onSubmit={(e) => { e.preventDefault(); nav(`/shop/search?q=${encodeURIComponent(q)}`) }} className="flex items-center gap-2.5 rounded-md border border-border px-3.5 py-3">
          <Icon name="search" size={20} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Do I already own this?" enterKeyHint="search" className="w-full bg-transparent text-[15px] outline-none placeholder:text-text/50" />
        </form>
        <Card to="/shop/would" className="flex flex-col gap-1">
          <span className="flex items-center gap-2.5 text-[16px] font-semibold"><Icon name="camera" />Would this go with…</span>
          <p className="text-[13px] leading-[1.4] text-text/70">Snap something in the store and see it next to your closet.</p>
        </Card>
        <div className="flex items-center justify-between"><Heading size={18}>Your gaps</Heading><Link to="/shop/gaps" className="text-[13px] font-medium text-text/70">See all</Link></div>
        <div className="-mt-2">
          {gaps.length ? gaps.slice(0, 2).map((g) => <ListRow key={g.id} title={g.label} detail={gapDetail(g)} to="/shop/gaps" />) : <p className="py-3 text-[14px] text-text-muted">No gaps yet — the audit and weather nudges add them here.</p>}
        </div>
        <div className="flex items-center justify-between"><Heading size={18}>What you own</Heading><Link to="/closet" className="text-[13px] font-medium text-text/70">Closet</Link></div>
        <div className="grid grid-cols-3 gap-2">
          {ALL_CATS.map((c) => (
            <Card key={c} className="p-3"><p className="text-[20px] font-semibold">{active.filter((i) => i.category === c).length}</p><p className="text-[12px] text-text-muted">{CATEGORY_LABEL[c]}</p></Card>
          ))}
        </div>
        <ListRow title="Wishlist" detail={`${state.wishlist.length} ${state.wishlist.length === 1 ? 'thing' : 'things'} you saw but didn’t buy`} to="/shop/wishlist" />
      </div>
    </Screen>
  )
}

const gapDetail = (g: Gap) => g.detail ?? (g.source === 'audit' ? 'From your audit' : g.source === 'nudge' ? 'Nudge' : 'Added by you')

function useOnline() {
  const [on, setOn] = useState(navigator.onLine)
  useEffect(() => {
    const u = () => setOn(navigator.onLine)
    window.addEventListener('online', u); window.addEventListener('offline', u)
    return () => { window.removeEventListener('online', u); window.removeEventListener('offline', u) }
  }, [])
  return on
}

export function SearchResult() {
  const { state, addGap } = useStore()
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const online = useOnline()
  const stats = useMemo(() => wearStats(state), [state])
  const found = state.items.filter((i) => i.status === 'active' && i.tagged && matches(i, q))
  const last = found.map((i) => i.createdAt).sort().pop()
  const [added, setAdded] = useState(false)
  return (
    <Screen tabs>
      <div className="flex flex-1 flex-col gap-3.5">
        <BackBar />
        {!online && <p className="rounded-[10px] bg-primary px-3.5 py-2.5 text-[13px] font-medium text-cloud">You’re offline — showing your saved closet.</p>}
        <label className="flex items-center gap-2.5 rounded-md border border-border px-3.5 py-3">
          <Icon name="search" size={20} />
          <input autoFocus value={q} onChange={(e) => setParams({ q: e.target.value }, { replace: true })} placeholder="black jeans" className="w-full bg-transparent text-[15px] outline-none" />
        </label>
        {q.trim() && (
          <>
            <div><Eyebrow>{found.length ? 'You already own' : 'You don’t own'}</Eyebrow><Title>{found.length ? `${found.length} × ${q}` : q}</Title></div>
            {found.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {found.slice(0, 9).map((it) => (
                  <Link to={`/closet/item/${it.id}`} key={it.id} className="flex flex-col gap-1.5">
                    <span className="flex aspect-square items-center justify-center rounded-md bg-surface"><ItemImage item={it} size={84} /></span>
                    <span className="text-[12px] font-medium leading-tight">{it.name}</span>
                    <span className="text-[11px] text-text-muted">worn {stats.get(it.id)?.times ?? 0}×</span>
                  </Link>
                ))}
              </div>
            )}
            {found.length > 0 && last && <Card><p className="text-[14px]">{found.length >= 3 ? 'You have plenty — probably skip it.' : 'You have some already — buy only if it’s different.'}</p><p className="text-[12px] text-text-muted">Most recent added {fmtMonthDay(last.slice(0, 10))}</p></Card>}
            <div className="flex-1" />
            <Button variant="secondary" onClick={() => { addGap({ label: q, source: 'manual' }); setAdded(true) }}>{added ? '✓ Added to Gaps' : `Add “${q}” to Gaps${found.length ? ' anyway' : ''}`}</Button>
            <Button variant="text" to={`/shop/wishlist/new?name=${encodeURIComponent(q)}`}>Save to wishlist</Button>
          </>
        )}
      </div>
    </Screen>
  )
}

const GOES_WITH: Record<Category, Category[]> = { top: ['bottom', 'shoes', 'outerwear'], sweater: ['bottom', 'shoes', 'outerwear'], bottom: ['top', 'sweater', 'shoes', 'outerwear'], dress: ['outerwear', 'shoes', 'accessory'], lounge: ['lounge', 'top', 'sweater'], outerwear: ['top', 'sweater', 'bottom', 'dress'], shoes: ['bottom', 'dress', 'top'], accessory: ['top', 'sweater', 'dress', 'outerwear'] }

export function WouldThisGo() {
  const { state, addPhotos, addWish } = useStore()
  const nav = useNavigate()
  const [photo, setPhoto] = useState<File | null>(null)
  const [url, setUrl] = useState<string>()
  const [cat, setCat] = useState<Category>('outerwear')
  useEffect(() => { if (!photo) return; const u = URL.createObjectURL(photo); setUrl(u); return () => URL.revokeObjectURL(u) }, [photo])
  const partners = state.items.filter((i) => i.status === 'active' && i.tagged && GOES_WITH[cat].includes(i.category))
  const gap = state.gaps.find((g) => !g.resolved && g.category === cat)
  const bought = async () => {
    if (!photo) return
    await addPhotos([photo], { category: cat })
    nav('/closet/tag')
  }
  return (
    <Screen tabs>
      <div className="flex flex-1 flex-col gap-3.5">
        <BackBar />
        <Header title="Would this go with…" body="Your photo next to pieces you own. Nothing is saved unless you tap “I bought it.”" />
        {!photo ? (
          <div className="flex flex-col gap-2.5">
            <PhotoPicker camera multiple={false} onFiles={(f) => setPhoto(f[0])} className="w-full"><Card className="flex items-center gap-2.5 text-[16px] font-semibold"><Icon name="camera" />Take a photo</Card></PhotoPicker>
            <PhotoPicker multiple={false} onFiles={(f) => setPhoto(f[0])} className="w-full"><Card className="flex items-center gap-2.5 text-[16px] font-semibold"><Icon name="plus" />Choose from photos</Card></PhotoPicker>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-1.5"><Eyebrow className="text-[11px]">What is it?</Eyebrow><div className="flex flex-wrap gap-2">{ALL_CATS.map((c) => <Chip key={c} small label={CATEGORY_ONE[c]} selected={cat === c} onClick={() => setCat(c)} />)}</div></div>
            <div className="flex gap-2.5">
              <Card className="flex flex-1 flex-col gap-1.5 p-2.5">
                <span className="flex h-[200px] items-center justify-center overflow-hidden rounded-md bg-bg">{url && <img src={url} alt="In store" className="max-h-full max-w-full object-contain" />}</span>
                <Eyebrow className="text-[10px]">In store</Eyebrow>
              </Card>
              <div className="no-scrollbar flex max-h-[236px] flex-1 flex-col gap-2 overflow-y-auto">
                {partners.length ? partners.slice(0, 6).map((p) => <span key={p.id} className="flex h-[72px] shrink-0 items-center justify-center gap-2 rounded-md bg-surface px-2"><ItemImage item={p} size={56} /><span className="text-[10px] text-text/60">{p.name}</span></span>)
                  : <p className="rounded-md bg-surface p-3 text-[12px] text-text/65">Nothing to pair it with yet — add more {GOES_WITH[cat].map((c) => CATEGORY_LABEL[c].toLowerCase()).join(' or ')}.</p>}
              </div>
            </div>
            <p className="rounded-[10px] bg-soft px-3.5 py-2.5 text-[13px] font-medium leading-[1.4]">Goes with {partners.length} of your pieces{gap ? ` · fills your “${gap.label}” gap` : ''}</p>
            <div className="flex-1" />
            <Button onClick={bought}>I bought it</Button>
            <Button variant="secondary" onClick={async () => { await addWish({ name: `${CATEGORY_ONE[cat]} from the store`, note: '', price: '' }, photo); nav('/shop/wishlist') }}>Save to wishlist</Button>
            <Button variant="text" onClick={() => setPhoto(null)}>Try another photo</Button>
          </>
        )}
      </div>
    </Screen>
  )
}

export function Gaps() {
  const { state, toggleGap, addGap, removeGap } = useStore()
  const [filter, setFilter] = useState<'all' | Gap['source']>('all')
  const [adding, setAdding] = useState(false)
  const [label, setLabel] = useState('')
  const list = state.gaps.filter((g) => filter === 'all' || g.source === filter)
  const open = list.filter((g) => !g.resolved), done = list.filter((g) => g.resolved)
  const row = (g: Gap) => (
    <div key={g.id} className="flex items-center gap-3 border-b border-border py-3.5">
      <button onClick={() => toggleGap(g.id)} aria-label={g.resolved ? 'Mark as needed' : 'Mark as bought'} className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-[1.5px] border-primary ${g.resolved ? 'bg-primary text-cloud' : ''}`}>{g.resolved && <Icon name="check" size={14} strokeWidth={2.4} />}</button>
      <span className={`flex-1 ${g.resolved ? 'text-text/45 line-through' : ''}`}><span className="block text-[16px] font-medium">{g.label}</span><span className="block text-[13px] text-text-muted">{gapDetail(g)}</span></span>
      <button onClick={() => removeGap(g.id)} className="text-[13px] text-text/45">Remove</button>
    </div>
  )
  return (
    <Screen tabs>
      <div className="flex flex-col gap-3.5">
        <BackBar right="+ Add" onRight={() => setAdding(true)} />
        <Header title="Your gaps" body="Things you actually need. Check them off when you buy them." />
        {adding && (
          <form onSubmit={(e) => { e.preventDefault(); if (label.trim()) addGap({ label: label.trim(), source: 'manual' }); setLabel(''); setAdding(false) }} className="flex gap-2">
            <input autoFocus value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Black belt" className="min-w-0 flex-1 rounded-md border border-border px-3.5 py-3 text-[15px] outline-none" />
            <Button full={false}>Add</Button>
          </form>
        )}
        <div className="flex flex-wrap gap-2">{([['all', 'All'], ['audit', 'From audit'], ['nudge', 'Nudges'], ['manual', 'Added by me']] as const).map(([k, l]) => <Chip key={k} label={l} selected={filter === k} onClick={() => setFilter(k)} />)}</div>
        {list.length === 0 ? <Empty icon="bag" title="No gaps" body="Add things you need, or run a closet audit — “Need to replace” lands here." /> : (
          <div>{open.map(row)}{done.length > 0 && <><Eyebrow className="pt-4 text-[11px]">Bought</Eyebrow>{done.map(row)}</>}</div>
        )}
      </div>
    </Screen>
  )
}

function WishCard({ id }: { id: string }) {
  const { state, removeWish } = useStore()
  const w = state.wishlist.find((x) => x.id === id)!
  const url = useImage(w.imageId)
  return (
    <Card className="flex flex-col gap-1.5 p-2.5">
      <span className="flex h-[130px] items-center justify-center overflow-hidden rounded-md bg-bg">{url ? <img src={url} alt={w.name} className="max-h-full max-w-full object-contain" /> : <Icon name="bag" size={32} />}</span>
      <span className="text-[14px] font-medium">{w.name}</span>
      <span className="text-[12px] text-text-muted">{[w.price, w.note].filter(Boolean).join(' · ') || ' '}</span>
      <button onClick={() => removeWish(w.id)} className="self-start text-[12px] text-text/45">Remove</button>
    </Card>
  )
}

export function Wishlist() {
  const { state } = useStore()
  const nav = useNavigate()
  return (
    <Screen tabs>
      <div className="flex flex-col gap-3.5">
        <BackBar right="+ Add" onRight={() => nav('/shop/wishlist/new')} />
        <Header title="Wishlist" body="Things you saw but didn’t buy." />
        {state.wishlist.length === 0 ? <Empty icon="heart" title="Nothing saved yet" body="Save things from a store with “Would this go with…”, or add them here." action={<Button to="/shop/wishlist/new">Add something</Button>} />
          : <div className="grid grid-cols-2 gap-3">{state.wishlist.map((w) => <WishCard key={w.id} id={w.id} />)}</div>}
      </div>
    </Screen>
  )
}

export function NewWish() {
  const { addWish } = useStore()
  const nav = useNavigate()
  const [params] = useSearchParams()
  const [name, setName] = useState(params.get('name') ?? '')
  const [price, setPrice] = useState('')
  const [note, setNote] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  return (
    <Screen>
      <div className="flex flex-1 flex-col gap-3.5">
        <BackBar />
        <Header title="Add to wishlist" />
        <PhotoPicker multiple={false} onFiles={(f) => setPhoto(f[0])} className="w-full"><Card className="flex items-center gap-2.5 text-[15px] font-medium"><Icon name="camera" />{photo ? `Photo added ✓ (${photo.name || 'camera'})` : 'Add a photo (optional)'}</Card></PhotoPicker>
        {[['Name', name, setName, 'Camel coat'], ['Price', price, setPrice, '$189'], ['Where / note', note, setNote, 'Madewell']].map(([l, v, s, p]) => (
          <label key={l as string} className="flex flex-col gap-1.5"><span className="text-[13px] font-medium text-text/70">{l as string}</span>
            <input value={v as string} onChange={(e) => (s as (x: string) => void)(e.target.value)} placeholder={p as string} className="rounded-md border border-border px-3.5 py-3 text-[15px] outline-none" /></label>
        ))}
        <div className="flex-1" />
        <Button onClick={async () => { if (!name.trim()) return; await addWish({ name: name.trim(), price, note }, photo ?? undefined); nav('/shop/wishlist', { replace: true }) }}>Save</Button>
      </div>
    </Screen>
  )
}
