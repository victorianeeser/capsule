import { useState } from 'react'
import { Link } from 'react-router'
import { BackBar, Body, Button, Card, Chip, ChipGroup, Eyebrow, Garment, Header, Heading, Icon, ListRow, ProgressBar, Screen, SearchField, Title } from '../ui'
import { CATEGORIES, CLOSET } from '../data'

export function Closet() {
  const [cat, setCat] = useState('All')
  const items = CLOSET.filter((i) => cat === 'All' || i.category === cat)
  return (
    <Screen tabs>
      <div className="flex flex-col gap-3.5">
        <div className="flex items-center justify-between">
          <div><Title>Closet</Title><p className="text-[13px] text-text-muted">86 pieces</p></div>
          <Link to="/closet/add" aria-label="Add items" className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-cloud"><Icon name="plus" /></Link>
        </div>
        <SearchField placeholder="Search — “black jeans”" />
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {CATEGORIES.map((c) => <Chip key={c} label={c} selected={cat === c} onClick={() => setCat(c)} />)}
        </div>
        <Link to="/closet/audit" className="flex items-center gap-2 rounded-md bg-soft px-3.5 py-3 text-[14px] font-medium">
          <span className="flex-1">Closet audit · 18 tops to review</span><Icon name="chev" size={20} />
        </Link>
        <div className="grid grid-cols-3 gap-x-3 gap-y-3.5">
          {items.map((it) => (
            <Link key={it.id} to="/closet/item" className="flex flex-col gap-1.5">
              <span className="flex aspect-square items-center justify-center rounded-md bg-surface"><Garment kind={it.kind} size={78} /></span>
              <span className="text-[12px] font-medium leading-tight">{it.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </Screen>
  )
}

export function AddItems() {
  return (
    <Screen tabs>
      <div className="flex flex-col gap-4">
        <BackBar />
        <Header title="Add to your closet" body="Add a lot at once — you can tag them later." />
        {[
          ['Upload photos', 'Pick as many as you like from your camera roll. We remove the backgrounds.'],
          ['Take a photo', 'Use your camera for one piece at a time.'],
        ].map(([t, b]) => (
          <Card key={t} to="/closet/tag" className="flex flex-col gap-1.5">
            <span className="flex items-center gap-2.5 text-[17px] font-semibold"><Icon name="camera" />{t}</span>
            <Body>{b}</Body>
          </Card>
        ))}
        <ListRow title="Needs tags (12)" detail="Photos added but not tagged yet" to="/closet/tag" />
        <p className="rounded-md bg-soft p-3.5 text-[13px] leading-[1.4]">Tip: lay pieces flat on a plain surface for the cleanest cut-out.</p>
      </div>
    </Screen>
  )
}

export function TagItem() {
  const groups: [string, string[], string][] = [
    ['Category', ['Top', 'Bottom', 'Dress', 'Outerwear', 'Shoes', 'Accessory'], 'Top'],
    ['Color', ['Cream', 'Black', 'White', 'Brown', 'Gray', '+ Add'], 'Cream'],
    ['Warmth', ['Light', 'Mid', 'Warm'], 'Mid'],
    ['Dress level', ['Casual', 'Work', 'Going out'], 'Work'],
    ['Worn for', ['Work', 'Weekend', 'Both'], 'Both'],
  ]
  return (
    <Screen>
      <div className="flex flex-1 flex-col gap-3">
        <BackBar right="3 of 12" />
        <Card className="flex flex-col items-center gap-1 p-3">
          <span className="flex h-[150px] w-full items-center justify-center rounded-md bg-bg"><Garment kind="knit" size={130} /></span>
          <span className="text-[11px] font-medium text-text/60">Background removed ✓</span>
        </Card>
        {groups.map(([label, opts, sel]) => (
          <div key={label} className="flex flex-col gap-1.5">
            <Eyebrow className="text-[11px]">{label}</Eyebrow>
            <ChipGroup options={opts} initial={[sel]} />
          </div>
        ))}
        <div className="flex-1" />
        <Button to="/closet">Save & next</Button>
      </div>
    </Screen>
  )
}

export function ItemDetail() {
  return (
    <Screen tabs>
      <div className="flex flex-col gap-3.5">
        <BackBar right="Edit" />
        <span className="flex h-[250px] items-center justify-center rounded-lg bg-surface"><Garment kind="knit" size={200} /></span>
        <Heading>Cream knit sweater</Heading>
        <div className="flex flex-wrap gap-2">{['Top', 'Cream', 'Mid warmth', 'Work', 'Both'].map((t) => <Chip key={t} label={t} />)}</div>
        <div className="grid grid-cols-3 gap-2.5">
          {[['6×', 'worn'], ['Nov 4', 'last worn'], ['Keep', 'status']].map(([n, l]) => (
            <Card key={l} className="p-3.5"><p className="display text-[20px]">{n}</p><p className="text-[12px] text-text-muted">{l}</p></Card>
          ))}
        </div>
        <Eyebrow className="text-[11px]">In 3 saved outfits</Eyebrow>
        <div className="flex gap-2">
          {[['knit', 'bottom'], ['knit', 'jeans'], ['knit', 'dress']].map((p, i) => (
            <span key={i} className="flex h-[72px] w-24 items-center justify-center rounded-md bg-surface">{p.map((k) => <Garment key={k} kind={k as 'knit'} size={36} />)}</span>
          ))}
        </div>
        <Button variant="text">Delete piece</Button>
      </div>
    </Screen>
  )
}

export function Audit() {
  return (
    <Screen tabs>
      <div className="flex flex-1 flex-col gap-3.5">
        <BackBar right="Skip" />
        <div className="flex flex-col gap-2"><Eyebrow className="text-[11px]">Closet audit · Tops · 4 of 18</Eyebrow><ProgressBar value={4 / 18} /></div>
        <Card className="flex flex-col items-center gap-2">
          <span className="flex h-[240px] w-full items-center justify-center rounded-md bg-bg"><Garment kind="top" size={190} /></span>
          <Heading>Striped long-sleeve tee</Heading>
          <p className="text-center text-[13px] text-text-muted">Last worn 5 months ago · worn 2× this year</p>
        </Card>
        <div className="flex-1" />
        <Button>Keep</Button>
        <div className="flex gap-2.5"><Button variant="secondary">Donate</Button><Button variant="secondary" to="/shop/gaps">Need to replace</Button></div>
        <p className="text-center text-[12px] text-text/60">“Need to replace” adds it to your Gaps list.</p>
      </div>
    </Screen>
  )
}
