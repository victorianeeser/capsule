import { Link } from 'react-router'
import { BackBar, Button, Card, ChipGroup, Eyebrow, Garment, type GarmentKind, Header, Heading, Icon, ListRow, Screen, SearchField, Title } from '../ui'

export function Shop() {
  return (
    <Screen tabs>
      <div className="flex flex-col gap-3">
        <BackBar label="Home" />
        <Header eyebrow="In the store" title="Shop smarter" />
        <SearchField placeholder="Do I already own this?" to="/shop/search" />
        <Card to="/shop/would" className="flex flex-col gap-1">
          <span className="flex items-center gap-2.5 text-[16px] font-semibold"><Icon name="camera" />Would this go with…</span>
          <p className="text-[13px] leading-[1.4] text-text/70">Snap something in the store and see it next to your closet.</p>
        </Card>
        <div className="flex items-center justify-between"><Heading size={18}>Your gaps</Heading><Link to="/shop/gaps" className="text-[13px] font-medium text-text/70">See all</Link></div>
        <div className="-mt-2">
          <ListRow title="Warm winter coat" detail="Nudge · forecast drops below 40° Thu" to="/shop/gaps" />
          <ListRow title="White sneakers" detail="From your audit" to="/shop/gaps" />
        </div>
        <div className="flex items-center justify-between"><Heading size={18}>What you own</Heading><Link to="/closet" className="text-[13px] font-medium text-text/70">Closet</Link></div>
        <div className="grid grid-cols-3 gap-2">
          {[['24', 'Tops'], ['15', 'Bottoms'], ['6', 'Dresses'], ['7', 'Outerwear'], ['12', 'Shoes'], ['9', 'Accessories']].map(([n, l]) => (
            <Card key={l} className="p-3"><p className="text-[20px] font-semibold">{n}</p><p className="text-[12px] text-text-muted">{l}</p></Card>
          ))}
        </div>
        <ListRow title="Wishlist" detail="4 things you saw but didn’t buy" to="/shop/wishlist" />
      </div>
    </Screen>
  )
}

export function SearchResult() {
  return (
    <Screen tabs>
      <div className="flex flex-1 flex-col gap-3.5">
        <BackBar />
        <p className="rounded-[10px] bg-primary px-3.5 py-2.5 text-[13px] font-medium text-cloud">You’re offline — showing your saved closet.</p>
        <SearchField placeholder="Search" value="black jeans" />
        <div><Eyebrow>You already own</Eyebrow><Title>3 pairs of black jeans</Title></div>
        <div className="grid grid-cols-3 gap-3">
          {['Black skinny jeans', 'Black straight jeans', 'Black wide-leg jeans'].map((n) => (
            <div key={n} className="flex flex-col gap-1.5"><span className="flex aspect-square items-center justify-center rounded-md bg-surface"><Garment kind="jeans" size={78} /></span><span className="text-[12px] font-medium leading-tight">{n}</span></div>
          ))}
        </div>
        <Card><p className="text-[14px]">Also close: 2 dark-wash jeans, 1 black trousers</p><p className="text-[12px] text-text-muted">Last bought: Sept 2025</p></Card>
        <div className="flex-1" />
        <Button variant="secondary" to="/shop/gaps">Add “black jeans” to Gaps anyway</Button>
        <Button variant="text" to="/shop/wishlist">Save to wishlist</Button>
      </div>
    </Screen>
  )
}

export function WouldThisGo() {
  const mine: [GarmentKind, string][] = [['knit', 'Cream knit sweater'], ['bottom', 'Black wide-leg trousers'], ['shoes', 'Black loafers']]
  return (
    <Screen tabs>
      <div className="flex flex-1 flex-col gap-3.5">
        <BackBar />
        <Header title="Would this go with…" body="Your photo next to pieces you own." />
        <div className="flex gap-2.5">
          <Card className="flex flex-1 flex-col gap-1.5 p-2.5">
            <span className="flex h-[200px] flex-col items-center justify-center gap-1 rounded-md bg-bg"><Garment kind="outerwear" size={140} /><span className="text-[11px] text-text/60">Your photo: camel coat</span></span>
            <Eyebrow className="text-[10px]">In store</Eyebrow>
          </Card>
          <div className="flex flex-1 flex-col gap-2">
            {mine.map(([k, n]) => <span key={n} className="flex h-[72px] flex-col items-center justify-center rounded-md bg-surface"><Garment kind={k} size={44} /><span className="text-[10px] text-text/60">{n}</span></span>)}
          </div>
        </div>
        <p className="rounded-[10px] bg-soft px-3.5 py-2.5 text-[13px] font-medium leading-[1.4]">Goes with 11 of your pieces · fills your “warm winter coat” gap</p>
        <div className="flex-1" />
        <Button to="/closet/tag">I bought it</Button>
        <Button variant="secondary" to="/shop/wishlist">Save to wishlist</Button>
        <p className="text-center text-[12px] text-text/60">Not added to your closet unless you tap “I bought it.”</p>
      </div>
    </Screen>
  )
}

export function Gaps() {
  const gaps: [string, string][] = [['Warm winter coat', 'Nudge · forecast drops below 40° Thursday'], ['White sneakers', 'From audit · replacing a worn-out pair'], ['Neutral cardigan', 'From audit'], ['Black belt', 'Added by you']]
  return (
    <Screen tabs>
      <div className="flex flex-col gap-3.5">
        <BackBar right="+ Add" />
        <Header title="Your gaps" body="Things you actually need. Check them off when you buy them." />
        <ChipGroup options={['All', 'From audit', 'Nudges', 'Added by me']} initial={['All']} />
        <div>
          {gaps.map(([t, d]) => (
            <label key={t} className="flex items-center gap-3 border-b border-border py-3.5">
              <input type="checkbox" className="h-[22px] w-[22px] shrink-0 appearance-none rounded-full border-[1.5px] border-primary checked:bg-primary" />
              <span className="flex-1"><span className="block text-[16px] font-medium">{t}</span><span className="block text-[13px] text-text-muted">{d}</span></span>
            </label>
          ))}
        </div>
      </div>
    </Screen>
  )
}

export function Wishlist() {
  const items: [GarmentKind, string, string][] = [['outerwear', 'Camel coat', '$189 · Madewell'], ['shoes', 'Leather loafers', '$120 · Everlane'], ['knit', 'Silk scarf', '$45 · saw at Zara'], ['top', 'Knit vest', '$68 · & Other Stories']]
  return (
    <Screen tabs>
      <div className="flex flex-col gap-3.5">
        <BackBar />
        <Header title="Wishlist" body="Things you saw but didn’t buy." />
        <div className="grid grid-cols-2 gap-3">
          {items.map(([k, n, d]) => (
            <Card key={n} className="flex flex-col gap-1.5 p-2.5">
              <span className="flex h-[130px] items-center justify-center rounded-md bg-bg"><Garment kind={k} size={100} /></span>
              <span className="text-[14px] font-medium">{n}</span><span className="text-[12px] text-text-muted">{d}</span>
            </Card>
          ))}
        </div>
      </div>
    </Screen>
  )
}
