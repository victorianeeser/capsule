import { createContext, useContext, useRef, type ReactNode } from 'react'
import { useLocation, useNavigationType } from 'react-router'

/**
 * How the next screen should arrive — the usual phone-app pattern:
 * - push:  going deeper (Home → Shop, Closet → item) slides in from the right
 * - back:  returning slides in from the left
 * - fade:  switching tabs or views (Day ↔ Month, morning ↔ evening) cross-fades
 * - sheet: bottom sheets (Add clothes) rise from the bottom
 */
export type Enter = 'push' | 'back' | 'fade' | 'sheet' | 'none'

/** Top-level views: moving between any two of these is a tab/view switch, not a step deeper. */
const ROOTS = ['/home', '/home/evening', '/planner', '/planner/month', '/closet']
/** Screens shown as bottom sheets — leaving one just fades the screen underneath back in. */
const SHEETS = ['/planner/add-clothes']

const tabOf = (p: string) => (p.startsWith('/planner') ? 'planner' : p.startsWith('/closet') ? 'closet' : /^\/(home|shop|settings|favorites)/.test(p) ? 'home' : 'other')
const depth = (p: string) => p.split('/').filter(Boolean).length

function enterFor(from: string, to: string, type: string): Enter {
  if (SHEETS.includes(to)) return 'sheet'
  if (SHEETS.includes(from)) return 'fade'
  if (ROOTS.includes(to) && (ROOTS.includes(from) || tabOf(from) !== tabOf(to))) return 'fade'
  if (tabOf(from) !== tabOf(to) && tabOf(to) !== 'other') return 'fade'
  if (type === 'POP') return 'back'
  if (type === 'REPLACE') return 'fade'
  return depth(to) < depth(from) ? 'back' : 'push'
}

const MotionCtx = createContext<Enter>('none')

export function MotionProvider({ children }: { children: ReactNode }) {
  const loc = useLocation()
  const type = useNavigationType()
  const last = useRef<{ path: string; enter: Enter } | null>(null)
  if (!last.current) last.current = { path: loc.pathname, enter: 'fade' }
  // Only a new screen gets a new entrance (changing ?date= on the same screen doesn't).
  else if (last.current.path !== loc.pathname) last.current = { path: loc.pathname, enter: enterFor(last.current.path, loc.pathname, type) }
  return <MotionCtx.Provider value={last.current.enter}>{children}</MotionCtx.Provider>
}

/** CSS class for the current screen's entrance. */
export const useEnterClass = () => {
  const e = useContext(MotionCtx)
  return e === 'none' ? '' : `enter-${e}`
}
