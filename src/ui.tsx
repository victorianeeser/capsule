import { useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'

/* ---------------- Icons (thin line, matches the wireframe set) ---------------- */
const ICONS: Record<string, string> = {
  home: 'M4 10.5 L12 4 L20 10.5 V20 H14.5 V14.5 H9.5 V20 H4 Z',
  calendar: 'M4 6.5h16V20H4z M4 10.5h16 M8.5 3.5v4 M15.5 3.5v4',
  hanger: 'M10 6.5a2 2 0 1 1 2.6 1.9c-.4.1-.6.5-.6.9v1.2l8.6 5.3c.8.5.4 1.7-.5 1.7H3.9c-.9 0-1.3-1.2-.5-1.7L12 10.5',
  bag: 'M5.5 8h13l-1 12h-11l-1-12z M9 8V7a3 3 0 0 1 6 0v1',
  sliders: 'M4 7h10 M18 7h2 M4 17h4 M12 17h8 M16 5v4 M10 15v4',
  search: 'M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14z M20 20l-4-4',
  plus: 'M12 5v14 M5 12h14',
  back: 'M15 18l-6-6 6-6',
  chev: 'M9 6l6 6-6 6',
  camera: 'M4 8h3l2-2.5h6L17 8h3v11H4z M12 16.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z',
  spark: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z M19 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z',
  more: 'M6 12h.01 M12 12h.01 M18 12h.01',
  filter: 'M4 7h16 M7 12h10 M10 17h4',
  check: 'M6 12.5l4 4 8-9',
  arrow: 'M5 12h14 M13 6l6 6-6 6',
  addTop: 'M8 3L4 5 2 9l3 1.5L6.5 9v11h7 M16 3l4 2 2 4-3 1.5L17.5 9v4 M18 16v6 M15 19h6',
  brief: 'M4 8h16v11H4z M9 8V5h6v3',
  rain: 'M7 15a4 4 0 0 1 .5-8 5.5 5.5 0 0 1 10.5 1.5A3.5 3.5 0 0 1 17 15z M9 18l-1 2 M13 18l-1 2 M17 18l-1 2',
  heart: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z',
  lock: 'M6 11h12v9H6z M9 11V8a3 3 0 0 1 6 0v3',
}

export function Icon({ name, size = 22, className = '', strokeWidth = 1.6 }: { name: keyof typeof ICONS | string; size?: number; className?: string; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d={ICONS[name]} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* ---------------- Garment silhouettes (stand-ins for clothing photos) ---------------- */
export type GarmentKind = 'top' | 'knit' | 'bottom' | 'jeans' | 'shoes' | 'outerwear' | 'dress'
const GARMENTS: Record<GarmentKind, [string, string]> = {
  top: ['M8 2 L4 4 L1 9 L4 11 L6 9 L6 22 L18 22 L18 9 L20 11 L23 9 L20 4 L16 2 C15 4 13.5 5 12 5 C10.5 5 9 4 8 2Z', '#3E372E'],
  knit: ['M8 2 L3 5 L1.5 20 L4.5 20.5 L6 10 L6 22 L18 22 L18 10 L19.5 20.5 L22.5 20 L21 5 L16 2 C15 3.5 13.5 4.2 12 4.2 C10.5 4.2 9 3.5 8 2Z', '#E3D7C3'],
  bottom: ['M6 2 H18 L19.5 22 H13.6 L12 9 L10.4 22 H4.5 Z', '#A5A099'],
  jeans: ['M6 2 H18 L19.5 22 H13.6 L12 9 L10.4 22 H4.5 Z', '#7E8A96'],
  shoes: ['M1.5 14 C1.5 11.5 3.5 10.5 5.5 10.5 L8.5 9.5 L11.5 12.5 C14.5 13.5 19 13.5 21 14.5 C22.6 15.2 22.6 17.8 21 17.8 H2.8 C2 17.8 1.5 17.2 1.5 16.5Z', '#2F2A24'],
  outerwear: ['M8 2 L3 5 L1.8 21 L6 21 L6.4 12 L7 22.5 L17 22.5 L17.6 12 L18 21 L22.2 21 L21 5 L16 2 L12 9 Z', '#9A7B5F'],
  dress: ['M9 2 H15 L14.2 7 L19.5 22.5 H4.5 L9.8 7 Z', '#5B4A3C'],
}
export function Garment({ kind, size = 64, className = '', style }: { kind: GarmentKind; size?: number; className?: string; style?: React.CSSProperties }) {
  const [d, fill] = GARMENTS[kind]
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style} aria-hidden>
      <path d={d} fill={fill} stroke="#3E372E" strokeOpacity={0.18} strokeWidth={0.3} strokeLinejoin="round" />
    </svg>
  )
}

/* ---------------- Shell ---------------- */
export function StatusBar({ dark = false }: { dark?: boolean }) {
  return (
    <div className={`demo-only h-[47px] shrink-0 items-center justify-between px-7 text-[16px] font-semibold ${dark ? 'text-cloud' : 'text-text'}`}>
      <span>9:41</span>
      <span className={`inline-block h-3 w-[26px] rounded-[3px] border ${dark ? 'border-cloud' : 'border-text'}`} />
    </div>
  )
}

const TABS = [
  { key: 'home', label: 'Home', icon: 'home', to: '/home', match: ['/home', '/shop', '/settings'] },
  { key: 'planner', label: 'Planner', icon: 'calendar', to: '/planner', match: ['/planner'] },
  { key: 'closet', label: 'Closet', icon: 'hanger', to: '/closet', match: ['/closet'] },
]
export function TabBar() {
  const { pathname } = useLocation()
  return (
    <nav className="shrink-0 border-t border-border bg-bg pb-[max(env(safe-area-inset-bottom),8px)]">
      <div className="flex pt-2">
        {TABS.map((t) => {
          const on = t.match.some((m) => pathname.startsWith(m))
          return (
            <Link key={t.key} to={t.to} className={`flex flex-1 flex-col items-center gap-1 py-1 ${on ? 'text-text' : 'text-text/45'}`}>
              <Icon name={t.icon} size={24} />
              <span className={`text-[11px] ${on ? 'font-semibold' : 'font-medium'}`}>{t.label}</span>
            </Link>
          )
        })}
      </div>
      <HomeIndicator />
    </nav>
  )
}
export function HomeIndicator({ dark = false }: { dark?: boolean }) {
  return (
    <div className="demo-only justify-center pt-2 pb-1">
      <span className={`h-[5px] w-[134px] rounded-full ${dark ? 'bg-cloud' : 'bg-text'}`} />
    </div>
  )
}

/** One app screen: status bar, scrolling content, and either the tab bar or a home indicator. */
export function Screen({ children, tabs = false, pad = true, className = '', dark = false }: { children: ReactNode; tabs?: boolean; pad?: boolean; className?: string; dark?: boolean }) {
  return (
    <div className={`flex h-full flex-col ${dark ? 'bg-primary' : 'bg-bg'}`}>
      <StatusBar dark={dark} />
      <main className={`no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto ${pad ? 'px-5 pt-1 pb-5' : ''} ${className}`}>{children}</main>
      {tabs ? <TabBar /> : <HomeIndicator dark={dark} />}
    </div>
  )
}

/* ---------------- Type ---------------- */
export const Eyebrow = ({ children, className = '' }: { children: ReactNode; className?: string }) => <p className={`eyebrow ${className}`}>{children}</p>
export const Title = ({ children, className = '' }: { children: ReactNode; className?: string }) => <h1 className={`display text-[32px] ${className}`}>{children}</h1>
/** Section / card headings — Inter. The serif is reserved for page titles (<Title>). */
export const Heading = ({ children, size = 20, className = '' }: { children: ReactNode; size?: number; className?: string }) => <h2 className={`font-semibold tracking-[-0.01em] ${className}`} style={{ fontSize: size }}>{children}</h2>
export const Body = ({ children, className = '' }: { children: ReactNode; className?: string }) => <p className={`text-[15px] leading-[1.4] text-text/75 ${className}`}>{children}</p>

export function Header({ eyebrow, title, body }: { eyebrow?: string; title: string; body?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <Title>{title}</Title>
      {body && <Body>{body}</Body>}
    </div>
  )
}

/* ---------------- Controls ---------------- */
type BtnProps = { children: ReactNode; to?: string; onClick?: () => void; variant?: 'primary' | 'secondary' | 'text'; full?: boolean; className?: string }
export function Button({ children, to, onClick, variant = 'primary', full = true, className = '' }: BtnProps) {
  const nav = useNavigate()
  const styles = {
    primary: 'bg-primary text-cloud',
    secondary: 'border-[1.5px] border-primary text-text',
    text: 'text-text',
  }[variant]
  return (
    <button
      onClick={() => (onClick ? onClick() : to === 'back' ? nav(-1) : to && nav(to))}
      className={`${full ? 'w-full' : ''} rounded-md px-5 py-[15px] text-[16px] font-semibold ${styles} ${className}`}
    >
      {children}
    </button>
  )
}

export function Chip({ label, selected = false, onClick, small = false }: { label: string; selected?: boolean; onClick?: () => void; small?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full border ${small ? 'px-3 py-1.5 text-[13px]' : 'px-[15px] py-[9px] text-[14px]'} font-medium transition-colors ${
        selected ? 'border-primary bg-primary text-cloud' : 'border-border bg-bg text-text'
      }`}
    >
      {label}
    </button>
  )
}

/** A row of chips with its own selection state (single or multi). */
export function ChipGroup({ options, initial = [], multi = false, wrap = true }: { options: string[]; initial?: string[]; multi?: boolean; wrap?: boolean }) {
  const [sel, setSel] = useState<string[]>(initial)
  const toggle = (o: string) => setSel((s) => (multi ? (s.includes(o) ? s.filter((x) => x !== o) : [...s, o]) : [o]))
  return (
    <div className={`flex gap-2 ${wrap ? 'flex-wrap' : 'no-scrollbar overflow-x-auto'}`}>
      {options.map((o) => (
        <Chip key={o} label={o} selected={sel.includes(o)} onClick={() => toggle(o)} />
      ))}
    </div>
  )
}

export function Card({ children, className = '', to, onClick }: { children: ReactNode; className?: string; to?: string; onClick?: () => void }) {
  const cls = `block rounded-lg bg-surface p-4 text-left ${className}`
  if (to) return <Link to={to} className={cls}>{children}</Link>
  if (onClick) return <button onClick={onClick} className={`${cls} w-full`}>{children}</button>
  return <div className={cls}>{children}</div>
}

export function ListRow({ title, detail, to }: { title: string; detail?: string; to?: string }) {
  const inner = (
    <>
      <div className="min-w-0 flex-1">
        <p className="text-[16px] font-medium">{title}</p>
        {detail && <p className="text-[13px] text-text-muted">{detail}</p>}
      </div>
      <Icon name="chev" size={20} />
    </>
  )
  const cls = 'flex items-center gap-3 border-b border-border py-4'
  return to ? <Link to={to} className={cls}>{inner}</Link> : <div className={cls}>{inner}</div>
}

export function BackBar({ label = 'Back', right, onRight }: { label?: string; right?: string; onRight?: () => void }) {
  const nav = useNavigate()
  return (
    <div className="flex items-center justify-between py-1">
      <button onClick={() => nav(-1)} className="flex items-center gap-1 text-[15px] font-medium">
        <Icon name="back" />
        {label}
      </button>
      {right && (
        <button onClick={onRight} className="text-[15px] font-medium text-text/70">
          {right}
        </button>
      )}
    </div>
  )
}

export function SearchField({ placeholder, value, to }: { placeholder: string; value?: string; to?: string }) {
  const nav = useNavigate()
  return (
    <label className="flex items-center gap-2.5 rounded-md border border-border bg-bg px-3.5 py-3" onClick={() => to && nav(to)}>
      <Icon name="search" size={20} />
      <input
        className="w-full bg-transparent text-[15px] outline-none placeholder:text-text/50"
        placeholder={placeholder}
        defaultValue={value}
        readOnly={!!to}
      />
    </label>
  )
}

export function CircleButton({ icon = 'back', onClick, className = '' }: { icon?: string; onClick?: () => void; className?: string }) {
  const nav = useNavigate()
  return (
    <button onClick={onClick ?? (() => nav(-1))} className={`flex h-10 w-10 items-center justify-center rounded-full bg-surface ${className}`} aria-label={icon}>
      <Icon name={icon} size={20} />
    </button>
  )
}

export function Pill({ children, onClick, className = '' }: { children: ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-1.5 rounded-full bg-surface px-3.5 py-2 text-[14px] font-semibold ${className}`}>
      {children}
    </button>
  )
}

export function WeatherPill({ now = '46°', hl = 'H:48° L:35°', icon = 'moon' }: { now?: string; hl?: string; icon?: 'moon' | 'sun' }) {
  return (
    <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-surface py-[7px] pr-3.5 pl-2.5">
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
        {icon === 'moon' ? (
          <path d="M19.5 14.6A7.6 7.6 0 1 1 9.4 4.5a6.1 6.1 0 0 0 10.1 10.1z" fill="var(--color-weather)" />
        ) : (
          <g stroke="var(--color-weather)" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="4.2" fill="var(--color-weather)" stroke="none" />
            <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" />
          </g>
        )}
      </svg>
      <span className="text-[14px] font-semibold">{now}</span>
      <span className="text-[12px] text-text-muted max-[385px]:hidden">{hl}</span>
    </div>
  )
}

export function Toggle({ initial = false }: { initial?: boolean }) {
  const [on, setOn] = useState(initial)
  return (
    <button onClick={() => setOn(!on)} className={`flex h-[30px] w-[50px] items-center rounded-full px-[3px] transition-colors ${on ? 'justify-end bg-primary' : 'justify-start bg-border'}`} aria-pressed={on}>
      <span className="h-6 w-6 rounded-full bg-bg" />
    </button>
  )
}

/** Garment tile with a select circle (Add outfit / Add clothes grids). */
export function SelectTile({ kind, initial = false, onChange }: { kind: GarmentKind; initial?: boolean; onChange?: (v: boolean) => void }) {
  const [on, setOn] = useState(initial)
  return (
    <button
      onClick={() => {
        setOn(!on)
        onChange?.(!on)
      }}
      className="relative flex aspect-[1.08] items-center justify-center"
    >
      <Garment kind={kind} size={92} />
      <span className={`absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full border-[1.5px] ${on ? 'border-primary bg-primary text-cloud' : 'border-accent'}`}>
        {on && <Icon name="check" size={15} strokeWidth={2.4} />}
      </span>
    </button>
  )
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1 w-full rounded-full bg-text/12">
      <div className="h-1 rounded-full bg-primary" style={{ width: `${value * 100}%` }} />
    </div>
  )
}
